require('dotenv').config();
const { google } = require('googleapis');
const pool = require('../config/db'); // Importamos la conexión MySQL

const youtube = google.youtube('v3');

const searchVideos = async (req, res) => {
    // 1. CHIVATO DE SEGURIDAD
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error("❌ ERROR CRÍTICO: Falta YOUTUBE_API_KEY en .env");
        return res.status(500).json({ message: 'Error de configuración (API KEY missing)' });
    }

    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: 'Falta término de búsqueda' });

        console.log(`🔎 Buscando: "${query}"`);

        // ============================================================
        // PASO 1: BUSCAR EN BASE DE DATOS LOCAL (MySQL)
        // ============================================================
        // Usamos ? como placeholder en MySQL (no uses $1 como en Postgres)
        const sqlBuscar = `
            SELECT * FROM catalogo_canciones 
            WHERE titulo LIKE ? OR artista LIKE ? 
            ORDER BY veces_cantada_global DESC 
            LIMIT 10
        `;
        const searchTerm = `%${query}%`;
        
        // pool.query devuelve un array [rows, fields], cogemos el primero
        const [rows] = await pool.query(sqlBuscar, [searchTerm, searchTerm]);

        // SI HAY RESULTADOS LOCALES, LOS DEVOLVEMOS Y PARAMOS AQUÍ
        if (rows.length > 0) {
            console.log(`✅ Encontrados ${rows.length} resultados en Caché Local.`);

            await pool.query(
                `UPDATE catalogo_canciones
                SET veces_cantada_global = veces_cantada_global + 1
                WHERE id = ?`,
                [rows[0].id]
            );

            
            const videosLocales = rows.map(row => ({
                id: row.video_id,
                titulo: row.titulo,
                descripcion: "⭐ Disponible en el local (Carga rápida)",
                imagen: row.cover_url,
                canal: row.artista || "Karaoke Local"
            }));

            return res.json(videosLocales);
        }

        // ============================================================
        // PASO 2: SI NO HAY LOCAL, BUSCAR EN YOUTUBE API
        // ============================================================
        console.log("🌍 No está en local. Llamando a YouTube API...");
        const term = `${query} karaoke letra`;

        const response = await youtube.search.list({
            key: apiKey,
            part: 'snippet',
            q: term,
            type: 'video',
            videoEmbeddable: 'true',
            maxResults: 10
        });

        const videosAPI = response.data.items.map(item => ({
            id: item.id.videoId,
            titulo: item.snippet.title,
            descripcion: item.snippet.description,
            imagen: item.snippet.thumbnails.high.url,
            canal: item.snippet.channelTitle
        }));

        // ============================================================
        // PASO 3: FILTRO DE CALIDAD ANTES DE GUARDAR
        // ============================================================
        
        // Solo guardamos en la BD si parece un Karaoke de verdad
        const videosDeCalidad = videosAPI.filter(video => {
            const titulo = video.titulo.toLowerCase();
            return titulo.includes('karaoke');
        });

        // Guardamos SOLO los buenos (pueden ser 10, pueden ser 4, o ninguno)
        if (videosDeCalidad.length > 0) {
            // Guardaremos solo los 3 primeros de calidad para no llenar la BD
            const top3Videos = videosDeCalidad.slice(0, 3);
            guardarResultadosEnBD(top3Videos);
        } else {
            console.log("🗑️ Se obtuvieron resultados, pero ninguno cumplía los requisitos de calidad para guardarse.");
        }        

        // Enviamos los resultados frescos al cliente
        res.json(videosAPI);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 403) return res.status(429).json({ message: 'Cuota YouTube excedida.' });
        res.status(500).json({ message: 'Error en búsqueda', error: error.message });
    }
};

// --- FUNCIÓN AUXILIAR PARA GUARDAR EN MYSQL ---
async function guardarResultadosEnBD(videos) {
    try {
        // Preparamos la query de inserción con "ON DUPLICATE KEY UPDATE"
        // Esto significa: Si el ID ya existe, no hagas nada (o actualiza algo si quisieras)
        const sqlInsert = `
            INSERT INTO catalogo_canciones (video_id, titulo, artista, cover_url)
            VALUES ?
            ON DUPLICATE KEY UPDATE veces_cantada_global = veces_cantada_global
        `;

        // Convertimos el array de objetos a un array de arrays para la inserción masiva de MySQL
        const values = videos.map(v => [
            v.id,
            v.titulo,
            v.canal, // Usamos el canal como artista
            v.imagen
        ]);

        await pool.query(sqlInsert, [values]);
        console.log(`💾 ${videos.length} videos nuevos guardados en el Catálogo.`);

    } catch (err) {
        console.error("⚠️ Error guardando caché en BD:", err.message);
    }
}

module.exports = { searchVideos };