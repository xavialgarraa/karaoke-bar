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
    await Promise.all([
      downloadAudio(videoId, dir),
      fetchLyrics(titulo, artista, dir),
    ]);
    statusMap.set(videoId, 'ready');
    console.log(`✅ Pipeline listo: ${titulo}`);
  } catch (err) {
    statusMap.set(videoId, 'error');
    console.error(`❌ Pipeline error (${videoId}):`, err.message);
  }
}

function downloadAudio(videoId, dir) {
  const out = path.join(dir, 'audio.webm');
  if (fs.existsSync(out)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const stream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
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

function fetchLyrics(titulo, artista, dir) {
  const out = path.join(dir, 'lyrics.lrc');
  if (fs.existsSync(out)) return Promise.resolve();

  // Clean title: remove " karaoke", " letra", "(karaoke)" etc.
  const cleanTitle = titulo.replace(/\b(karaoke|letra|lyrics|instrumental|version|official)\b/gi, '').trim();

  const params = new URLSearchParams({ track_name: cleanTitle, artist_name: artista });
  const url = `https://lrclib.net/api/search?${params}`;

  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'KaraokeSaas/1.0' } }, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          const hit = JSON.parse(raw).find((r) => r.syncedLyrics);
          if (hit?.syncedLyrics) fs.writeFileSync(out, hit.syncedLyrics, 'utf8');
        } catch {}
        resolve(); // lyrics are optional, never reject
      });
    }).on('error', resolve);
  });
}

function getAudioPath(videoId) {
  return path.join(PROCESSED_DIR, videoId, 'audio.webm');
}

function getLyricsPath(videoId) {
  return path.join(PROCESSED_DIR, videoId, 'lyrics.lrc');
}

module.exports = { processSong, getStatus, getAudioPath, getLyricsPath };
