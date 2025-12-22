const pool = require('../config/db');

const getRandomSong = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT *
                FROM catalogo_canciones
                ORDER BY RAND() * POW(veces_cantada_global + 1, 2) DESC
                LIMIT 1

        `);

        if (rows.length > 0) {
            const song = rows[0];
            res.json({
                id: song.video_id,
                titulo: song.titulo,
                descripcion: "🎲 Sugerencia aleatoria",
                imagen: song.cover_url,
                canal: song.artista
            });
        } else {
            res.status(404).json({ message: 'El catálogo está vacío. ¡Pide canciones para llenarlo!' });
        }
    } catch (error) {
        console.error("Error random song:", error);
        res.status(500).json({ message: 'Error obteniendo canción aleatoria' });
    }
};

module.exports = { getRandomSong };