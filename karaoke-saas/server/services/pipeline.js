const ytdl = require('@distube/ytdl-core');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PROCESSED_DIR = path.join(__dirname, '../processed');
const statusMap = new Map(); // videoId -> 'processing' | 'ready' | 'error'

function getStatus(videoId) {
  const mem = statusMap.get(videoId);
  if (mem) return mem;
  if (fs.existsSync(path.join(PROCESSED_DIR, videoId, 'audio.webm'))) {
    statusMap.set(videoId, 'ready');
    return 'ready';
  }
  return 'not_found';
}

async function processSong(videoId, titulo, artista) {
  const status = getStatus(videoId);
  if (status === 'ready' || status === 'processing') return;

  const dir = path.join(PROCESSED_DIR, videoId);
  fs.mkdirSync(dir, { recursive: true });
  statusMap.set(videoId, 'processing');

  try {
    // Get video info first to get duration for precise lyrics matching
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    const duration = parseInt(info.videoDetails.lengthSeconds, 10);

    await Promise.all([
      downloadAudio(videoId, dir, info),
      fetchLyrics(titulo, artista, duration, dir),
    ]);
    statusMap.set(videoId, 'ready');
    console.log(`✅ Pipeline listo: ${titulo} (${duration}s)`);
  } catch (err) {
    statusMap.set(videoId, 'error');
    console.error(`❌ Pipeline error (${videoId}):`, err.message);
  }
}

function downloadAudio(videoId, dir, info) {
  const out = path.join(dir, 'audio.webm');
  if (fs.existsSync(out)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const stream = ytdl.downloadFromInfo(info, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });
    const file = fs.createWriteStream(out);
    stream.pipe(file);
    file.on('finish', resolve);
    stream.on('error', (err) => {
      fs.unlink(out, () => {});
      reject(err);
    });
  });
}

function fetchLyrics(titulo, artista, duration, dir) {
  const out = path.join(dir, 'lyrics.lrc');
  if (fs.existsSync(out)) return Promise.resolve();

  const cleanTitle = titulo.replace(/\b(karaoke|letra|lyrics|instrumental|version|official)\b/gi, '').trim();

  // Try /api/get first (precise match by duration ±2s), fall back to /api/search
  return getLyricsByGet(cleanTitle, artista, duration)
    .then((lrc) => {
      if (!lrc) return getLyricsBySearch(cleanTitle, artista);
      return lrc;
    })
    .then((lrc) => {
      if (lrc) fs.writeFileSync(out, lrc, 'utf8');
    })
    .catch(() => {}); // lyrics are optional
}

function lrclibRequest(path) {
  return new Promise((resolve) => {
    https.get(`https://lrclib.net${path}`, { headers: { 'User-Agent': 'KaraokeSaas/1.0' } }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => resolve({ status: res.statusCode, raw }));
    }).on('error', () => resolve(null));
  });
}

async function getLyricsByGet(titulo, artista, duration) {
  const params = new URLSearchParams({ track_name: titulo, artist_name: artista, duration });
  const result = await lrclibRequest(`/api/get?${params}`);
  if (!result || result.status !== 200) return null;
  try {
    const data = JSON.parse(result.raw);
    return data.syncedLyrics || null;
  } catch { return null; }
}

async function getLyricsBySearch(titulo, artista) {
  const params = new URLSearchParams({ track_name: titulo, artist_name: artista });
  const result = await lrclibRequest(`/api/search?${params}`);
  if (!result || result.status !== 200) return null;
  try {
    const hit = JSON.parse(result.raw).find((r) => r.syncedLyrics);
    return hit?.syncedLyrics || null;
  } catch { return null; }
}

function getAudioPath(videoId) {
  return path.join(PROCESSED_DIR, videoId, 'audio.webm');
}

function getLyricsPath(videoId) {
  return path.join(PROCESSED_DIR, videoId, 'lyrics.lrc');
}

module.exports = { processSong, getStatus, getAudioPath, getLyricsPath };
