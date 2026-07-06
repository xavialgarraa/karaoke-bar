require('dotenv').config();
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { spawn } = require('child_process');
const pool  = require('../config/db');

const PROCESSED_DIR = path.join(__dirname, '../processed');
const statusMap = new Map(); // videoId -> 'processing' | 'error'

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
function assertVideoId(videoId) {
  if (!VIDEO_ID_RE.test(videoId)) throw new Error(`Invalid videoId: ${videoId}`);
}

// ─── STATUS ────────────────────────────────────────────────────────────────

async function getStatus(videoId) {
  const mem = statusMap.get(videoId);
  if (mem === 'processing' || mem === 'error') return mem;

  try {
    const [rows] = await pool.query(
      'SELECT audio_ready FROM catalogo_canciones WHERE video_id = ?',
      [videoId]
    );
    if (rows.length && rows[0].audio_ready) {
      statusMap.set(videoId, 'ready');
      return 'ready';
    }
  } catch {}

  // Fallback filesystem (resiliencia ante reinicios sin BD actualizada)
  if (fs.existsSync(path.join(PROCESSED_DIR, videoId, 'audio.mp3'))) {
    statusMap.set(videoId, 'ready');
    return 'ready';
  }

  return 'not_found';
}

// ─── PROCESO PRINCIPAL ─────────────────────────────────────────────────────

async function processSong(videoId, titulo, artista) {
  assertVideoId(videoId);
  const status = await getStatus(videoId);
  if (status === 'ready' || status === 'processing') return;

  const dir = path.join(PROCESSED_DIR, videoId);
  fs.mkdirSync(dir, { recursive: true });
  statusMap.set(videoId, 'processing');

  try {
    const duration = await downloadAudio(videoId, dir);
    await removeVocals(dir);

    // Marcar audio listo en BD
    await pool.query(
      'UPDATE catalogo_canciones SET audio_ready = 1 WHERE video_id = ?',
      [videoId]
    ).catch(() => {});

    const foundLyrics = await fetchLyrics(titulo, artista, duration, dir);

    if (foundLyrics) {
      await pool.query(
        'UPDATE catalogo_canciones SET has_lyrics = 1 WHERE video_id = ?',
        [videoId]
      ).catch(() => {});
    }

    statusMap.set(videoId, 'ready');
    console.log(`✅ Pipeline listo: ${titulo}`);
  } catch (err) {
    statusMap.set(videoId, 'error');
    console.error(`❌ Pipeline error (${videoId}):`, err.message);
  }
}

// ─── DESCARGA AUDIO (RapidAPI youtube-mp36) ────────────────────────────────

async function getRapidApiUrl(videoId) {
  const apiKey = process.env.RAPIDAPI_KEY;
  const MAX_ATTEMPTS = 12;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'youtube-mp36.p.rapidapi.com',
        path: `/dl?id=${videoId}`,
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      };
      https.get(options, (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    console.log(`🔄 RapidAPI intento ${attempt}: status=${data.status}`);
    if (data.status === 'ok' && data.link) return { url: data.link };
    if (data.status === 'fail' || data.status === 'error') throw new Error(`RapidAPI: ${data.msg}`);
    if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`RapidAPI timeout tras ${MAX_ATTEMPTS} intentos`);
}

function downloadFromUrl(url, dest) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    const wget = spawn('wget', [
      '-U', 'Mozilla/5.0 xavieralgarraperez',
      '-O', dest,
      '--timeout=60',
      '--tries=1',
      '--max-redirect=10',
      url,
    ]);
    wget.stderr.on('data', (d) => { stderr += d; });
    wget.on('close', (code) => {
      if (code !== 0) {
        fs.unlink(dest, () => {});
        const lastLine = stderr.trim().split('\n').pop();
        return reject(new Error(`wget falló (${code}): ${lastLine}`));
      }
      const size = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      if (size < 10000) {
        fs.unlink(dest, () => {});
        return reject(new Error(`Audio demasiado pequeño (${size} bytes)`));
      }
      resolve();
    });
    wget.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(new Error(`wget no encontrado: ${err.message}`));
    });
  });
}

async function downloadAudio(videoId, dir) {
  const out = path.join(dir, 'audio.mp3');
  if (fs.existsSync(out)) {
    const dur = await getDuration(out);
    if (dur > 0) return dur;
    // Fichero corrupto — borrarlo y re-descargar
    fs.unlinkSync(out);
    console.warn(`⚠️  audio.mp3 existente inválido, re-descargando ${videoId}`);
  }

  console.log(`⬇️  Descargando: ${videoId}`);
  const { url } = await getRapidApiUrl(videoId);
  console.log(`⬇️  URL: ${url.slice(0, 70)}...`);
  await downloadFromUrl(url, out);
  const duration = await getDuration(out);
  const sizeMB = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
  console.log(`✅ Audio listo — ${duration}s, ${sizeMB} MB`);
  return duration;
}

function getDuration(filePath) {
  return new Promise((resolve) => {
    const ff = spawn('ffprobe', ['-v', 'quiet', '-print_format', 'json', '-show_format', filePath]);
    let out = '';
    ff.stdout.on('data', (d) => (out += d));
    ff.on('close', () => {
      try { resolve(Math.round(parseFloat(JSON.parse(out).format.duration))); }
      catch { resolve(0); }
    });
    ff.on('error', () => resolve(0));
  });
}

// ─── VOCAL REMOVAL ─────────────────────────────────────────────────────────

// Spleeter outputs WAV into: {spleeterOut}/{inputBasename}/accompaniment.wav
async function removeVocals(dir) {
  const input  = path.join(dir, 'audio.mp3');
  const output = path.join(dir, 'instrumental.mp3');
  if (fs.existsSync(output)) return;

  const ok = await tryVocalRemovalSpleeter(input, output, dir);
  if (!ok) await tryVocalRemovalFfmpeg(input, output);
}

function tryVocalRemovalSpleeter(input, output, dir) {
  const spleeterOut = path.join(dir, 'spleeter_out');
  // Spleeter creates: spleeterOut/audio/accompaniment.wav  (named after input file without ext)
  const accompaniment = path.join(spleeterOut, 'audio', 'accompaniment.wav');

  return new Promise((resolve) => {
    const proc = spawn('spleeter', [
      'separate',
      '-p', 'spleeter:2stems',
      '-o', spleeterOut,
      input,
    ]);

    proc.on('close', async (code) => {
      if (code !== 0 || !fs.existsSync(accompaniment)) {
        console.warn('⚠️  Spleeter falló o no está instalado, usando ffmpeg pan');
        return resolve(false);
      }

      // Convert accompaniment.wav → instrumental.mp3
      const converted = await new Promise((res) => {
        const ff = spawn('ffmpeg', ['-i', accompaniment, '-q:a', '2', '-y', output]);
        ff.on('close', c => res(c === 0));
        ff.on('error', () => res(false));
      });

      // Cleanup temporary WAV files
      try { fs.rmSync(spleeterOut, { recursive: true, force: true }); } catch {}

      if (converted) console.log('🎛️  Vocal removal OK (Spleeter)');
      else console.warn('⚠️  Conversión WAV→MP3 falló');
      resolve(converted);
    });

    proc.on('error', () => {
      console.warn('⚠️  Spleeter no encontrado, usando ffmpeg pan');
      resolve(false);
    });
  });
}

function tryVocalRemovalFfmpeg(input, output) {
  return new Promise((resolve) => {
    const ff = spawn('ffmpeg', [
      '-i', input,
      '-af', 'pan=stereo|c0=FL-FR|c1=FR-FL',
      '-y', output,
    ]);
    ff.on('close', (code) => {
      if (code === 0) console.log('🎛️  Vocal removal OK (ffmpeg pan)');
      else console.warn('⚠️  Vocal removal falló, se usará audio original');
      resolve();
    });
    ff.on('error', () => { console.warn('⚠️  ffmpeg no encontrado'); resolve(); });
  });
}

// ─── LETRAS (LRCLib) ───────────────────────────────────────────────────────

const normTrack = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

function stripNoise(s) {
  return (s || '')
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/\|.*$/g, '')
    .replace(/\b(karaoke|letra|lyrics|instrumental|version|official|video oficial|ft\.|feat\.)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
}

function cleanArtist(name) {
  return (name || '')
    .replace(/\b(vevo|official|oficial|music|records|entertainment)\b/gi, '')
    .replace(/(vevo|official|oficial|music|records)$/i, '')
    .replace(/\s+/g, ' ').trim();
}

// Returns all plausible track name candidates (both halves of "A - B"), excluding the channel artist
function getTrackCandidates(titulo, channelArtist) {
  const full = stripNoise(titulo);
  const chNorm = normTrack(cleanArtist(channelArtist));
  if (!full.includes(' - ')) return [full];
  const parts = full.split(' - ').map(p => p.trim()).filter(Boolean);
  const candidates = [...new Set([parts.slice(1).join(' - '), parts[0], full])];
  // Drop any candidate that is just the artist name
  return candidates.filter(t => !chNorm || normTrack(t) !== chNorm);
}

function titleMatches(lrcTitle, searchedTrack) {
  const na = normTrack(searchedTrack);
  const nb = normTrack(lrcTitle || '');
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  const words = s => s.split(/\s+/).filter(w => w.length > 2);
  const wa = words(na);
  const wb = new Set(words(nb));
  if (wa.length === 0) return false;
  return wa.filter(w => wb.has(w)).length >= Math.ceil(wa.length * 0.5);
}

async function fetchLyrics(titulo, artista, duration, dir) {
  const out = path.join(dir, 'lyrics.lrc');
  if (fs.existsSync(out)) return true;

  const channelArtist = cleanArtist(artista);
  // Both halves of the title can be artist or song — include all as potential artists
  const titleParts = titulo.includes(' - ')
    ? stripNoise(titulo).split(' - ').map(p => cleanArtist(p)).filter(Boolean)
    : [];
  const artists = [...new Set([channelArtist, ...titleParts].filter(Boolean)), ''];
  const knownArtists = artists.filter(Boolean);

  const tracks = getTrackCandidates(titulo, artista);

  console.log(`🎵 LRCLib → tracks: ${JSON.stringify(tracks)} | artists: ${JSON.stringify(artists)} | ${duration}s`);

  try {
    // 1. SEARCH with duration filter (±5s) — most precise
    if (duration) {
      for (const track of tracks) {
        for (const artist of artists) {
          const lrc = await getLyricsBySearch(track, artist, knownArtists, duration);
          if (lrc) {
            fs.writeFileSync(out, lrc, 'utf8');
            console.log(`✅ Letras (SEARCH+duration) track="${track}" artist="${artist}"`);
            return true;
          }
        }
      }
    }

    // 2. SEARCH without duration — title + artist match only
    for (const track of tracks) {
      for (const artist of artists) {
        const lrc = await getLyricsBySearch(track, artist, knownArtists, null);
        if (lrc) {
          fs.writeFileSync(out, lrc, 'utf8');
          console.log(`✅ Letras (SEARCH) track="${track}" artist="${artist}"`);
          return true;
        }
      }
    }

    console.warn(`⚠️  Sin letras: "${titulo}"`);
    return false;
  } catch {
    return false;
  }
}

function lrclibRequest(urlPath) {
  return new Promise((resolve) => {
    https.get(
      `https://lrclib.net${urlPath}`,
      { headers: { 'User-Agent': 'KaraokeSaas/1.0' } },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve({ status: res.statusCode, raw }));
      }
    ).on('error', () => resolve(null));
  });
}

// /api/get requires album_name (which we don't have) — use SEARCH and filter client-side
async function getLyricsBySearch(track, artist, expectedArtists, duration) {
  const p = { track_name: track };
  if (artist) p.artist_name = artist;
  const r = await lrclibRequest(`/api/search?${new URLSearchParams(p)}`);
  if (!r || r.status !== 200) return null;
  try {
    const results = JSON.parse(r.raw);
    if (!Array.isArray(results)) return null;
    const artistOk = (a) => {
      if (!expectedArtists || expectedArtists.length === 0) return true;
      const nb = normTrack(a || '');
      if (!nb) return false;
      return expectedArtists.some(ea => { const na = normTrack(ea); return na && (na.includes(nb) || nb.includes(na)); });
    };
    const hit = results.find(x =>
      x.syncedLyrics &&
      titleMatches(x.trackName, track) &&
      artistOk(x.artistName) &&
      (!duration || Math.abs((x.duration || 0) - duration) <= 2)
    );
    return hit?.syncedLyrics || null;
  } catch { return null; }
}

// ─── PATHS ─────────────────────────────────────────────────────────────────

function getAudioPath(videoId) {
  const instrumental = path.join(PROCESSED_DIR, videoId, 'instrumental.mp3');
  if (fs.existsSync(instrumental)) return instrumental;
  return path.join(PROCESSED_DIR, videoId, 'audio.mp3');
}

function getLyricsPath(videoId) {
  return path.join(PROCESSED_DIR, videoId, 'lyrics.lrc');
}

module.exports = { processSong, getStatus, getAudioPath, getLyricsPath };
