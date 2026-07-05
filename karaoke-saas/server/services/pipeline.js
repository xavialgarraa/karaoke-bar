require('dotenv').config();
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { spawn } = require('child_process');
const pool  = require('../config/db');

const PROCESSED_DIR = path.join(__dirname, '../processed');
const statusMap = new Map(); // videoId -> 'processing' | 'error'

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

function removeVocals(dir) {
  const input  = path.join(dir, 'audio.mp3');
  const output = path.join(dir, 'instrumental.mp3');
  if (fs.existsSync(output)) return Promise.resolve();

  return new Promise((resolve) => {
    const ff = spawn('ffmpeg', [
      '-i', input,
      '-af', 'pan=stereo|c0=FL-FR|c1=FR-FL',
      '-y', output,
    ]);
    ff.on('close', (code) => {
      if (code === 0) console.log('🎛️  Vocal removal OK');
      else console.warn('⚠️  Vocal removal falló, usando audio original');
      resolve();
    });
    ff.on('error', () => { console.warn('⚠️  ffmpeg no encontrado'); resolve(); });
  });
}

// ─── LETRAS (LRCLib) ───────────────────────────────────────────────────────

function cleanTrack(titulo) {
  let track = titulo;
  if (titulo.includes(' - ')) track = titulo.split(' - ').slice(1).join(' - ');
  return track
    .replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/\|.*$/g, '')
    .replace(/\b(karaoke|letra|lyrics|instrumental|version|official|video oficial|ft\.|feat\.)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
}

function cleanArtist(name) {
  return (name || '')
    .replace(/\b(vevo|official|music|records|entertainment)\b/gi, '')
    .replace(/\s+/g, ' ').trim();
}

async function fetchLyrics(titulo, artista, duration, dir) {
  const out = path.join(dir, 'lyrics.lrc');
  if (fs.existsSync(out)) return true;

  const track = cleanTrack(titulo);
  const channelArtist = cleanArtist(artista);

  // Also extract artist from "Artist - Title" YouTube title format
  const titleArtist = titulo.includes(' - ') ? cleanArtist(titulo.split(' - ')[0]) : '';

  console.log(`🎵 LRCLib → track: "${track}" | channel: "${channelArtist}" | title artist: "${titleArtist}" | ${duration}s`);

  // Unique artist candidates, preserving priority order
  const artists = [...new Set([channelArtist, titleArtist, ''])];

  try {
    // 1. GET with duration (exact match) — try all artist candidates
    for (const artist of artists) {
      const lrc = await getLyricsByGet(track, artist, duration);
      if (lrc) {
        fs.writeFileSync(out, lrc, 'utf8');
        console.log(`✅ Letras (GET+duration) con artist="${artist}"`);
        return true;
      }
    }

    // 2. SEARCH fallback (no duration — picks any synced version)
    for (const artist of artists) {
      const lrc = await getLyricsBySearch(track, artist);
      if (lrc) {
        fs.writeFileSync(out, lrc, 'utf8');
        console.log(`✅ Letras (SEARCH) con artist="${artist}"`);
        return true;
      }
    }

    console.warn(`⚠️  Sin letras: "${track}"`);
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

async function getLyricsByGet(track, artist, duration) {
  const p = { track_name: track };
  if (artist) p.artist_name = artist;
  if (duration) p.duration = duration;
  const r = await lrclibRequest(`/api/get?${new URLSearchParams(p)}`);
  if (!r || r.status !== 200) return null;
  try { return JSON.parse(r.raw).syncedLyrics || null; } catch { return null; }
}

async function getLyricsBySearch(track, artist) {
  const p = { track_name: track };
  if (artist) p.artist_name = artist;
  const r = await lrclibRequest(`/api/search?${new URLSearchParams(p)}`);
  if (!r || r.status !== 200) return null;
  try {
    const hit = JSON.parse(r.raw).find((x) => x.syncedLyrics);
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
