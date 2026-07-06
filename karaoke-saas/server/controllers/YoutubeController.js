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

function cleanText(s) {
    return (s || '')
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\|.*$/g, '')
        .replace(/\b(karaoke|letra|lyrics|instrumental|version|official|video oficial|ft\.|feat\.)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseArtist(canal) {
    return (canal || '')
        // Word-boundary removals (spaced words)
        .replace(/\b(vevo|official|oficial|music|records|entertainment|canal|tv)\b/gi, '')
        // Suffix removals without boundary (camelCase: "QuevedoOficial", "ArtistVEVO")
        .replace(/(vevo|official|oficial|music|records)$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// Returns all plausible track name candidates from a YouTube title
// YouTube titles can be "Artist - Song" OR "Song - Artist" — we try both halves
function getTrackCandidates(titulo) {
    const full = cleanText(titulo);
    if (!full.includes(' - ')) return [full];
    const parts = full.split(' - ').map(p => p.trim()).filter(Boolean);
    // [after dash, before dash, full cleaned] — avoids losing the real track name
    return [...new Set([parts.slice(1).join(' - '), parts[0], full])];
}

const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

// Title similarity: substring OR word overlap
function titleMatches(lrcTitle, searchedTrack) {
    const na = norm(searchedTrack);
    const nb = norm(lrcTitle || '');
    if (!na || !nb) return false;
    if (na.includes(nb) || nb.includes(na)) return true;
    const words = s => s.split(/\s+/).filter(w => w.length > 2);
    const wa = words(na);
    const wb = new Set(words(nb));
    if (wa.length === 0) return false;
    return wa.filter(w => wb.has(w)).length >= Math.ceil(wa.length * 0.5);
}

// Artist similarity: at least one expected artist overlaps with the LRCLib result artist.
// If no expected artists, skip check (avoid rejecting valid matches when artist is unknown).
function artistMatches(lrcArtist, expectedArtists) {
    if (!expectedArtists || expectedArtists.length === 0) return true;
    const nb = norm(lrcArtist || '');
    if (!nb) return false;
    return expectedArtists.some(a => {
        const na = norm(a);
        return na && (na.includes(nb) || nb.includes(na));
    });
}

// Fetch durations for multiple video IDs in one call (costs 1 quota unit total)
function getVideoDurations(videoIds, apiKey) {
    const params = new URLSearchParams({ part: 'contentDetails', id: videoIds.join(','), key: apiKey });
    return new Promise((resolve) => {
        https.get(`https://www.googleapis.com/youtube/v3/videos?${params}`, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try {
                    const map = {};
                    (JSON.parse(raw).items || []).forEach(item => {
                        const m = item.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                        map[item.id] = (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
                    });
                    resolve(map);
                } catch { resolve({}); }
            });
        }).on('error', () => resolve({}));
    });
}

// /api/get requires album_name which we don't have — use SEARCH and filter by title+artist+duration
function lrcSearch(track, artist, expectedArtists, duration) {
    const p = { track_name: track };
    if (artist) p.artist_name = artist;
    return new Promise((resolve) => {
        https.get(
            `https://lrclib.net/api/search?${new URLSearchParams(p)}`,
            { headers: { 'User-Agent': 'KaraokeSaas/1.0' } },
            (res) => {
                let raw = '';
                res.on('data', c => raw += c);
                res.on('end', () => {
                    try {
                        const results = JSON.parse(raw);
                        if (!Array.isArray(results)) return resolve(false);
                        const hit = results.find(r =>
                            r.syncedLyrics &&
                            titleMatches(r.trackName, track) &&
                            artistMatches(r.artistName, expectedArtists) &&
                            (!duration || Math.abs((r.duration || 0) - duration) <= 5)
                        );
                        resolve(!!hit);
                    } catch { resolve(false); }
                });
            }
        ).on('error', () => resolve(false));
    });
}

async function checkLrcLib(titulo, canal, duration, originalQuery) {
    const tracks = getTrackCandidates(titulo);
    if (originalQuery) tracks.push(originalQuery.trim());
    const uniqueTracks = [...new Set(tracks)];

    const channelArtist = parseArtist(canal);
    // Both halves of the title can be artist or song — include all as potential artists
    const titleParts = titulo.includes(' - ')
        ? cleanText(titulo).split(' - ').map(p => parseArtist(p)).filter(Boolean)
        : [];
    const artists = [...new Set([channelArtist, ...titleParts].filter(Boolean)), ''];

    const knownArtists = artists.filter(Boolean);
    // Only drop candidates that exactly equal the channel artist (reliable artist indicator)
    const channelArtistNorm = norm(channelArtist);
    const filteredTracks = channelArtistNorm
        ? uniqueTracks.filter(t => norm(t) !== channelArtistNorm)
        : uniqueTracks;
    console.log(`  🔍 LRC: tracks=${JSON.stringify(filteredTracks)} artists=${JSON.stringify(artists)} duration=${duration}s`);

    // 1. SEARCH with duration filter (±5s) — title + artist + duration must all match
    if (duration) {
        const exactChecks = filteredTracks.flatMap(t => artists.map(a => lrcSearch(t, a, knownArtists, duration)));
        if ((await Promise.all(exactChecks)).some(Boolean)) return true;
    }

    // 2. SEARCH without duration — title + artist only
    const searchChecks = filteredTracks.flatMap(t => artists.map(a => lrcSearch(t, a, knownArtists, null)));
    return (await Promise.all(searchChecks)).some(Boolean);
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
            // Return only the best cached result
            const best = rows[0];
            return res.json([{
                id: best.video_id,
                titulo: best.titulo,
                descripcion: "⭐ Disponible en el local (Carga rápida)",
                imagen: best.cover_url,
                canal: best.artista || "Karaoke Local"
            }]);
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

        // 3. Obtener duraciones (1 unidad de cuota para todos)
        const top8 = videosAPI.slice(0, 8);
        const durations = await getVideoDurations(top8.map(v => v.id), apiKey);
        console.log(`⏱️  Duraciones: ${top8.map(v => `${v.id}=${durations[v.id]}s`).join(', ')}`);

        // 4. Buscar el primer resultado con letras confirmadas en LRCLib (GET+duration → SEARCH)
        console.log("🎵 Buscando mejor resultado con letras en LRCLib...");
        let mejor = null;
        for (const video of top8) {
            const hasLyrics = await checkLrcLib(video.titulo, video.canal, durations[video.id], query);
            if (hasLyrics) { mejor = video; break; }
        }

        // Si ninguno tiene letras confirmadas, devolver el más oficial de todas formas
        // (el pipeline intentará buscar letras con más estrategias al descargar)
        if (!mejor) {
            mejor = top8[0];
            console.log(`⚠️ Sin letras confirmadas, devolviendo mejor candidato: "${mejor.titulo}"`);
        } else {
            console.log(`✅ Mejor resultado: "${mejor.titulo}" (${mejor.canal})`);
        }

        guardarResultadosEnBD([mejor]);
        res.json([mejor]);

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
