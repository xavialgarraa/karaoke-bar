const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
//const pool = require('./config/db'); // Tu conexión a PostgreSQL
require('dotenv').config(); // Cargar variables de entorno

// --- IMPORTAR RUTAS ---
//const authRoutes = require('./routes/authRoutes');
const youtubeRoutes = require('../routes/YoutubeRoutes');

// --- CONFIGURACIÓN INICIAL ---
const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors()); // Permitir peticiones desde el Frontend
app.use(express.json()); // Entender JSON en el body

// --- RUTAS REST API (Backend tradicional) ---
//app.use('/api/auth', authRoutes);       // Login de dueños
app.use('/api/youtube', youtubeRoutes); // Buscador de canciones

// Ruta de prueba para ver si el server vive
app.get('/', (req, res) => {
    res.send('🎤 Karaoke API Funcionando Correctamente');
});

// --- CONFIGURACIÓN SOCKET.IO (Tiempo Real) ---
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173", // URL de tu frontend
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    // EVENTO 1: Unirse a la sala de un bar específico
    socket.on("unirse_bar", (slugBar) => {
        socket.join(slugBar);
        console.log(`👤 Socket ${socket.id} entró al bar: ${slugBar}`);
    });

    // EVENTO 2: Cliente pide canción
    socket.on("pedir_cancion", async (data) => {
        const { slugBar, usuario, cancion } = data;
        // data.cancion debería ser un objeto con { titulo, artista, videoId, cover }
        
        console.log(`🎵 Nueva petición en ${slugBar}: ${cancion.titulo} por ${usuario}`);

        try {
            // 1. Guardar en Base de Datos (Opcional, pero recomendado)
            // Asegúrate de tener esta tabla 'cola' creada o comenta estas líneas si aún no quieres DB
            /*
            const query = `
                INSERT INTO cola (bar_slug, usuario, titulo, artista, video_id, cover_url, estado) 
                VALUES ($1, $2, $3, $4, $5, $6, 'espera') 
                RETURNING *
            `;
            const values = [slugBar, usuario, cancion.titulo, cancion.artista, cancion.videoId, cancion.cover];
            const result = await pool.query(query, values);
            const cancionGuardada = result.rows[0];
            */
           
            // Si no usas DB todavía, usamos los datos que llegan directo:
            const cancionParaEmitir = {
                id: Date.now(), // ID temporal
                usuario,
                titulo: cancion.titulo,
                artista: cancion.artista,
                videoId: cancion.videoId || cancion.id, // Ajuste según venga de YouTube
                imagen: cancion.cover || cancion.imagen
            };

            // 2. Emitir A TODOS en ese bar (incluida la TV)
            // Usamos 'actualizar_cola' que es lo que espera el Frontend de la TV
            io.to(slugBar).emit("actualizar_cola", cancionParaEmitir);

        } catch (err) {
            console.error("❌ Error guardando canción:", err);
            socket.emit("error", "No se pudo pedir la canción");
        }
    });

    socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado");
    });
});

// --- ARRANCAR SERVIDOR ---
const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    
    // Test de conexión a DB al arrancar
    try {
        await pool.query('SELECT NOW()');
        console.log("✅ Conexión a Base de Datos exitosa");
    } catch (err) {
        console.error("⚠️ Error conectando a la Base de Datos:", err.message);
    }
});