const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('../config/db'); // MySQL Pool
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

io.on("connection", (socket) => {
    console.log(`🔌 Cliente: ${socket.id}`);

    socket.on("unirse_bar", async (slug) => {
        try {
            // MySQL usa ? como placeholder
            const [rows] = await pool.query("SELECT id, nombre FROM bars WHERE slug = ?", [slug]);
            
            if (rows.length > 0) {
                socket.join(slug);
                console.log(`👤 Unido a: ${rows[0].nombre}`);
            } else {
                socket.emit("error_bar", "Bar no encontrado");
            }
        } catch (err) {
            console.error(err);
        }
    });

    socket.on("pedir_cancion", async (data) => {
        const { slug, usuario, cancion } = data;
        console.log(`🎵 Petición: ${cancion.titulo}`);

        try {
            // 1. Obtener ID del Bar
            const [barRows] = await pool.query("SELECT id FROM bars WHERE slug = ?", [slug]);
            if (barRows.length === 0) return;
            const barId = barRows[0].id;
            const videoId = cancion.videoId || cancion.id;

            // 2. Guardar en Catálogo (UPSERT en MySQL)
            await pool.query(`
                INSERT INTO catalogo_canciones (video_id, titulo, artista, cover_url)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE veces_cantada_global = veces_cantada_global + 1
            `, [videoId, cancion.titulo, cancion.artista, cancion.cover]);

            // 3. Calcular Turno
            const [countRows] = await pool.query(
                "SELECT COUNT(*) as count FROM peticiones WHERE bar_id = ? AND estado = 'espera'",
                [barId]
            );
            const turno = countRows[0].count + 1;
            const tiempoEspera = (turno - 1) * 4;

            // 4. Insertar en Cola (MySQL no tiene RETURNING, así que construimos el objeto)
            const [insertResult] = await pool.query(`
                INSERT INTO peticiones 
                (bar_id, video_id, titulo, artista, cover_url, usuario_nombre, usuario_avatar, estado, turno_numero)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'espera', ?)
            `, [barId, videoId, cancion.titulo, cancion.artista, cancion.cover, usuario.nombre, usuario.avatar, turno]);

            const nuevoId = insertResult.insertId;

            // Objeto para emitir
            const objetoSocket = {
                id: nuevoId,
                titulo: cancion.titulo,
                artista: cancion.artista,
                usuario: usuario.nombre,
                avatar: usuario.avatar,
                cover: cancion.cover,
                videoId: videoId,
                turnoAsignado: turno
            };

            // 5. Emitir Eventos
            socket.emit("turno_confirmado", {
                turno: turno,
                tiempoEspera: tiempoEspera,
                cancion: objetoSocket
            });

            io.to(slug).emit("nueva_cancion_anadida", objetoSocket);

        } catch (err) {
            console.error("❌ Error MySQL:", err);
            socket.emit("error_peticion", "Error en base de datos");
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server MySQL corriendo en ${PORT}`);
});