const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db'); // MySQL Pool
const jwt = require('jsonwebtoken');
require('dotenv').config();

const apiRoutes = require('../routes/api');
const pipeline = require('../services/pipeline');

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
    ? [process.env.CLIENT_URL, 'http://localhost:5173']
    : ['http://localhost:5173'];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '50kb' }));

// Global rate limit: 200 req/min per IP (protects all endpoints)
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas peticiones, intenta más tarde.' },
}));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('🎤 Karaoke API (MySQL Version) Funcionando');
});

const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }
});

require('../services/socket').setIo(io);

// Rate limit: socketId -> timestamp of last pedir_cancion
const requestCooldown = new Map();

io.on("connection", async (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    /* ======================================================
       🔐 IDENTIDAD (ADMIN O CLIENTE)
    ====================================================== */
    socket.isAdmin = false;
    socket.barId = null;
    socket.barSlug = null;

    const token = socket.handshake.auth?.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            socket.isAdmin = true;
            socket.barId = decoded.barId;
            socket.barSlug = decoded.slug;

            console.log(`🛡️ Admin conectado (bar ${socket.barSlug})`);
        } catch (err) {
            console.log("❌ Token inválido");
        }
    }

    /* ======================================================
       1️⃣ UNIRSE A SALA (ADMIN Y CLIENTES)
    ====================================================== */
    socket.on("unirse_bar", async (slug) => {
        try {
            // 🔐 El admin SOLO puede usar su propio bar
            if (socket.isAdmin) {
                slug = socket.barSlug;
            }

            const [rows] = await pool.query(
                "SELECT id, nombre, bloqueado FROM bars WHERE slug = ?",
                [slug]
            );

            if (!rows.length) {
                return socket.emit("error_bar", "Bar no encontrado");
            }

            socket.join(slug);

            console.log(`👤 ${socket.id} unido a ${rows[0].nombre}`);

            if (rows[0].bloqueado) {
                socket.emit("sala_bloqueada");
            }

        } catch (err) {
            console.error("Error al unirse al bar:", err);
        }
    });

    /* ======================================================
       2️⃣ BLOQUEAR / DESBLOQUEAR SALA (SOLO ADMIN)
    ====================================================== */
    socket.on("bloquear_sala", async () => {
        if (!socket.isAdmin) return;

        try {
            await pool.query(
                "UPDATE bars SET bloqueado = 1 WHERE id = ?",
                [socket.barId]
            );

            io.to(socket.barSlug).emit("sala_bloqueada");
            console.log(`🔒 Sala ${socket.barSlug} bloqueada`);
        } catch (err) {
            console.error(err);
        }
    });

    socket.on("desbloquear_sala", async () => {
        if (!socket.isAdmin) return;

        try {
            await pool.query(
                "UPDATE bars SET bloqueado = 0 WHERE id = ?",
                [socket.barId]
            );

            io.to(socket.barSlug).emit("sala_desbloqueada");
            console.log(`🔓 Sala ${socket.barSlug} desbloqueada`);
        } catch (err) {
            console.error(err);
        }
    });

    /* ======================================================
       3️⃣ ADMIN: SIGUIENTE CANCIÓN
    ====================================================== */
    socket.on("admin_siguiente_cancion", async ({ idCancionActual }) => {
        if (!socket.isAdmin) return;

        try {
            console.log(`⏭️ Pasando canción ${idCancionActual}`);

            if (idCancionActual && !String(idCancionActual).startsWith('filler_')) {
                await pool.query(
                    "UPDATE peticiones SET estado = 'played', played_at = NOW() WHERE id = ?",
                    [idCancionActual]
                );
            }

            io.to(socket.barSlug).emit("cambio_de_turno");

        } catch (err) {
            console.error("Error pasando canción:", err);
        }
    });

    /* ======================================================
       4️⃣ PEDIR CANCIÓN (ADMIN Y CLIENTES)
    ====================================================== */
    socket.on("pedir_cancion", async (data) => {
        // Basic payload validation
        if (!data || typeof data !== 'object' || JSON.stringify(data).length > 50000) {
            return socket.emit('error_peticion', 'Petición inválida.');
        }

        const { slug, usuario, cancion } = data;

        if (!cancion || typeof cancion.titulo !== 'string' || cancion.titulo.length > 200) {
            return socket.emit('error_peticion', 'Título inválido.');
        }
        if (usuario?.nombre && (typeof usuario.nombre !== 'string' || usuario.nombre.length > 60)) {
            return socket.emit('error_peticion', 'Nombre de usuario inválido.');
        }

        // Rate limiting: 1 request per 30 seconds per socket
        if (!socket.isAdmin) {
            const lastRequest = requestCooldown.get(socket.id);
            const now = Date.now();
            if (lastRequest && now - lastRequest < 30000) {
                const remaining = Math.ceil((30000 - (now - lastRequest)) / 1000);
                return socket.emit('error_peticion', `Espera ${remaining}s antes de pedir otra canción.`);
            }
            requestCooldown.set(socket.id, now);
        }

        try {
            // 🔐 Si es admin, forzamos su bar
            const barSlug = socket.isAdmin ? socket.barSlug : slug;

            const [barRows] = await pool.query(
                "SELECT id, bloqueado FROM bars WHERE slug = ?",
                [barSlug]
            );

            if (!barRows.length) return;

            if (barRows[0].bloqueado) {
                return socket.emit("sala_bloqueada");
            }

            const barId = barRows[0].id;

            // Song limit: max 2 songs per user in queue
            if (!socket.isAdmin) {
                const [existingRows] = await pool.query(
                    "SELECT COUNT(*) as count FROM peticiones WHERE bar_id = ? AND estado = 'espera' AND usuario_nombre = ?",
                    [barId, usuario?.nombre || 'Jefe']
                );
                if (existingRows[0].count >= 2) {
                    return socket.emit('error_peticion', 'Ya tienes 2 canciones en cola. Espera a que suenen antes de pedir más.');
                }
            }

            const videoId = cancion.videoId || cancion.id;

            console.log(`🎵 "${cancion.titulo}" pedida en ${barSlug}`);

            // A. Catálogo
            await pool.query(`
                INSERT INTO catalogo_canciones (video_id, titulo, artista, cover_url)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE veces_cantada_global = veces_cantada_global + 1
            `, [
                videoId,
                cancion.titulo,
                cancion.artista,
                cancion.cover
            ]);

            // B. Avisar al cliente que empieza el pipeline
            socket.emit("pipeline_iniciado", { videoId, titulo: cancion.titulo });

            // C. Esperar a que el pipeline termine (descarga + vocal removal + letras)
            await pipeline.processSong(videoId, cancion.titulo, cancion.artista).catch(console.error);

            // D. Turno (ahora que el audio está listo)
            const [countRows] = await pool.query(
                "SELECT COUNT(*) as count FROM peticiones WHERE bar_id = ? AND estado = 'espera'",
                [barId]
            );

            const turno = countRows[0].count + 1;
            const tiempoEspera = (turno - 1) * 4;

            // E. Insertar petición
            const [insertResult] = await pool.query(`
                INSERT INTO peticiones
                (bar_id, video_id, titulo, artista, cover_url, usuario_nombre, usuario_avatar, estado, turno_numero)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'espera', ?)
            `, [
                barId,
                videoId,
                cancion.titulo,
                cancion.artista,
                cancion.cover,
                usuario?.nombre || "Jefe",
                usuario?.avatar || null,
                turno
            ]);

            const cancionSocket = {
                id: insertResult.insertId,
                titulo: cancion.titulo,
                artista: cancion.artista,
                usuario_nombre: usuario?.nombre || "Jefe",
                usuario_avatar: usuario?.avatar || null,
                cover_url: cancion.cover,
                video_id: videoId,
                turno_numero: turno
            };

            // F. Emitir eventos
            socket.emit("turno_confirmado", {
                turno,
                tiempoEspera,
                cancion: cancionSocket
            });

            io.to(barSlug).emit("nueva_cancion_anadida", cancionSocket);

        } catch (err) {
            console.error("❌ Error al pedir canción:", err);
            socket.emit("error_peticion", "Error procesando la solicitud");
        }
    });

    /* ======================================================
       5️⃣ DESCONEXIÓN
    ====================================================== */
    socket.on("disconnect", () => {
        requestCooldown.delete(socket.id);
    });
});



const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server MySQL corriendo en ${PORT}`);
});