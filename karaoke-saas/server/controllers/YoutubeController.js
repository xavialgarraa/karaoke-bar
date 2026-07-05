require('dotenv').config();
const https = require('https');
const pool = require('../config/db');

function youtubeSearch(query, apiKey) {
    const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: '25',
        key: apiKey,
    });
    return new Promise((resolve, reject) => {
        https.get(`https://www.googleapis.com/youtube/v3/search?${params}`, (res) => {
            let raw = '';
            res.on('data', (c) => (raw += c));
            res.on('end', () => {
                try {
                    const data = JSON.parse(raw);
                    if (data.error) return reject(Object.assign(new Error(data.error.message), { code: data.error.code }));
                    resolve(data.items || []);
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

function parseTitle(titulo) {
    let track = titulo;
    if (titulo.includes(' - ')) {
        track = titulo.split(' - ').slice(1).join(' - ');
    }
    return track
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\|.*$/g, '')
        .replace(/\b(karaoke|letra|lyrics|instrumental|version|official|ft\.|feat\.)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseArtist(canal) {
    return (canal || '')
        .replace(/\b(vevo|official|music|records|entertainment)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function lrcSearch(track, artist) {
    const p = { track_name: track };
    if (artist) p.artist_name = artist;
    const params = new URLSearchParams(p);
    return new Promise((resolve) => {
        https.get(
            `https://lrclib.net/api/search?${params}`,
            { headers: { 'User-Agent': 'KaraokeSaas/1.0' } },
            (res) => {
                let raw = '';
                res.on('data', (c) => (raw += c));
                res.on('end', () => {
                    try {
                        const results = JSON.parse(raw);
                        resolve(Array.isArray(results) && results.some(r => r.syncedLyrics));
                    } catch { resolve(false); }
                });
            }
        ).on('error', () => resolve(false));
    });
}

async function checkLrcLib(titulo, canal) {
    const track = parseTitle(titulo);
    const channelArtist = parseArtist(canal);

    // Also try artist extracted from "Artist - Title" YouTube title format
    let titleArtist = '';
    if (titulo.includes(' - ')) {
        titleArtist = parseArtist(titulo.split(' - ')[0]);
    }

    // Try 3 combos in parallel — return true if any finds synced lyrics
    const combos = [
        lrcSearch(track, channelArtist),
        titleArtist && titleArtist !== channelArtist ? lrcSearch(track, titleArtist) : Promise.resolve(false),
        lrcSearch(track, ''), // no artist — broadest net
    ];
    const results = await Promise.all(combos);
    return results.some(Boolean);
}

const searchVideos = async (req, res) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error("❌ ERROR CRÍTICO: Falta YOUTUBE_API_KEY en .env");
        return res.status(500).json({ message: 'Error de configuración (API KEY missing)' });
    }

    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: 'Falta término de búsqueda' });

        console.log(`🔎 Buscando: "${query}"`);

        // 1. Buscar en caché local
        const [rows] = await pool.query(
            `SELECT * FROM catalogo_canciones WHERE titulo LIKE ? OR artista LIKE ? ORDER BY veces_cantada_global DESC LIMIT 10`,
            [`%${query}%`, `%${query}%`]
        );

        if (rows.length > 0) {
            console.log(`✅ ${rows.length} resultados en caché local`);
            await pool.query(
                `UPDATE catalogo_canciones SET veces_cantada_global = veces_cantada_global + 1 WHERE id = ?`,
                [rows[0].id]
            );
            return res.json(rows.map(row => ({
                id: row.video_id,
                titulo: row.titulo,
                descripcion: "⭐ Disponible en el local (Carga rápida)",
                imagen: row.cover_url,
                canal: row.artista || "Karaoke Local"
            })));
        }

        // 2. Buscar en YouTube
        console.log("🌍 Llamando a YouTube API...");
        const items = await youtubeSearch(query, apiKey);
        console.log(`📦 YouTube devolvió ${items.length} resultados`);

        const videosAPI = items.map(item => ({
            id: item.id.videoId,
            titulo: item.snippet.title,
            descripcion: item.snippet.description,
            imagen: item.snippet.thumbnails.high.url,
            canal: item.snippet.channelTitle,
        }));

        // 2b. Ordenar: vídeos oficiales primero (mejor coincidencia de duración con LRCLib)
        const officialScore = (v) => {
            const ch = (v.canal || '').toLowerCase();
            const ti = (v.titulo || '').toLowerCase();
            if (ch.includes('vevo')) return 4;
            if (ch.includes('official') || ti.includes('video oficial') || ti.includes('official video')) return 3;
            if (ti.includes('audio oficial') || ti.includes('official audio') || ti.includes('official music video')) return 2;
            if (ch.includes('music') || ch.includes('records')) return 1;
            return 0;
        };
        videosAPI.sort((a, b) => officialScore(b) - officialScore(a));

        // 3. Filtrar por disponibilidad en LRCLib (en paralelo)
        console.log("🎵 Verificando letras en LRCLib...");
        const checks = await Promise.all(videosAPI.map(v => checkLrcLib(v.titulo, v.canal)));
        const resultado = videosAPI.filter((_, i) => checks[i]);

        console.log(`✅ ${resultado.length}/${videosAPI.length} tienen letras sincronizadas`);

        if (resultado.length > 0) guardarResultadosEnBD(resultado.slice(0, 3));

        res.json(resultado);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 403) return res.status(429).json({ message: 'Cuota YouTube excedida.' });
        res.status(500).json({ message: 'Error en búsqueda', error: error.message });
    }
};

async function guardarResultadosEnBD(videos) {
    try {
        const values = videos.map(v => [v.id, v.titulo, v.canal, v.imagen, 1]);
        await pool.query(`
            INSERT INTO catalogo_canciones (video_id, titulo, artista, cover_url, has_lyrics)
            VALUES ?
            ON DUPLICATE KEY UPDATE has_lyrics = 1
        `, [values]);
        console.log(`💾 ${videos.length} videos guardados en catálogo`);
    } catch (err) {
        console.error("⚠️ Error guardando caché en BD:", err.message);
    }
}

module.exports = { searchVideos };
