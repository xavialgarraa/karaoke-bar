// Usage: node test-lrc.js "NI BORRACHO - Quevedo (Official Video)" "Quevedo" 282
// Args:  titulo  canal  duration(s)
const https = require('https');

const [,, titulo = '', canal = '', durStr = '0'] = process.argv;
const duration = parseInt(durStr) || 0;

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

function getTrackCandidates(titulo, channelArtist) {
  const full = stripNoise(titulo);
  const chNorm = normTrack(cleanArtist(channelArtist));
  if (!full.includes(' - ')) return [full];
  const parts = full.split(' - ').map(p => p.trim()).filter(Boolean);
  const candidates = [...new Set([parts.slice(1).join(' - '), parts[0], full])];
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

function lrcRequest(urlPath) {
  return new Promise((resolve) => {
    https.get(`https://lrclib.net${urlPath}`, { headers: { 'User-Agent': 'KaraokeSaas/1.0' } }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, raw }));
    }).on('error', () => resolve(null));
  });
}

async function main() {
  const channelArtist = cleanArtist(canal);
  const titleParts = titulo.includes(' - ')
    ? stripNoise(titulo).split(' - ').map(p => cleanArtist(p)).filter(Boolean)
    : [];
  const artists = [...new Set([channelArtist, ...titleParts].filter(Boolean)), ''];
  const knownArtists = artists.filter(Boolean);
  const tracks = getTrackCandidates(titulo, canal);

  console.log('\n=== INPUT ===');
  console.log('titulo:', titulo);
  console.log('canal:', canal);
  console.log('duration:', duration, 's');
  console.log('\n=== PARSED ===');
  console.log('track candidates:', tracks);
  console.log('artists:', artists);

  for (const track of tracks) {
    for (const artist of artists) {
      console.log(`\n--- SEARCH track="${track}" artist="${artist}" ---`);
      const p = new URLSearchParams({ track_name: track });
      if (artist) p.set('artist_name', artist);
      const r = await lrcRequest(`/api/search?${p}`);
      if (!r) { console.log('  ❌ request failed'); continue; }
      if (r.status !== 200) { console.log('  status:', r.status); continue; }
      try {
        const results = JSON.parse(r.raw);
        console.log(`  total results: ${results.length}`);
        results.slice(0, 5).forEach((x, i) => {
          const tm = titleMatches(x.trackName, track);
          const artistOk = knownArtists.length === 0 || knownArtists.some(ea => {
            const na = normTrack(ea); const nb = normTrack(x.artistName || '');
            return na && nb && (na.includes(nb) || nb.includes(na));
          });
          const durOk = !duration || Math.abs((x.duration || 0) - duration) <= 2;
          const match = x.syncedLyrics && tm && artistOk && durOk;
          console.log(`  [${i}] "${x.trackName}" by "${x.artistName}" dur=${x.duration}s | synced=${!!x.syncedLyrics} titleMatch=${tm} artistMatch=${artistOk} durMatch=${durOk} => ${match ? '✅ MATCH' : '❌'}`);
        });
        // Show with duration filter
        const hitDur = results.find(x => x.syncedLyrics && titleMatches(x.trackName, track) &&
          (knownArtists.length === 0 || knownArtists.some(ea => { const na = normTrack(ea); const nb = normTrack(x.artistName||''); return na && nb && (na.includes(nb)||nb.includes(na)); })) &&
          (!duration || Math.abs((x.duration||0) - duration) <= 5));
        if (hitDur) console.log(`  => ✅ BEST MATCH (+duration): "${hitDur.trackName}" by "${hitDur.artistName}" ${hitDur.duration}s`);
        // Without duration
        const hitNoDur = results.find(x => x.syncedLyrics && titleMatches(x.trackName, track) &&
          (knownArtists.length === 0 || knownArtists.some(ea => { const na = normTrack(ea); const nb = normTrack(x.artistName||''); return na && nb && (na.includes(nb)||nb.includes(na)); })));
        if (!hitDur && hitNoDur) console.log(`  => ✅ BEST MATCH (no-duration): "${hitNoDur.trackName}" by "${hitNoDur.artistName}" ${hitNoDur.duration}s`);
      } catch (e) { console.log('  parse error:', e.message); }
    }
  }
}

main().catch(console.error);
