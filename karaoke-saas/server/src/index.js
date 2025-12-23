const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('../config/db'); // MySQL Pool
const jwt = require('jsonwebtoken');
require('dotenv').config(); 

const apiRoutes = require('../routes/api');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('🎤 Karaoke API (MySQL Version) Funcionando');
});

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});


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

            if (idCancionActual) {
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
        const { slug, usuario, cancion } = data;

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

            // B. Turno
            const [countRows] = await pool.query(
                "SELECT COUNT(*) as count FROM peticiones WHERE bar_id = ? AND estado = 'espera'",
                [barId]
            );

            const turno = countRows[0].count + 1;
            const tiempoEspera = (turno - 1) * 4;

            // C. Insertar petición
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

            // D. Emitir eventos
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
        // console.log(`❌ Socket desconectado ${socket.id}`);
    });
});



const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server MySQL corriendo en ${PORT}`);
});