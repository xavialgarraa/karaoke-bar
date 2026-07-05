import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Sparkles, Clock, PlayCircle, FastForward, Music } from 'lucide-react';
import vokaraLogo from '../assets/logo.png';
import { Minimize2, Maximize2 } from 'lucide-react';
import QRCode from 'react-qr-code';

const API_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:3001';

// ─── DEMO SONGS ───────────────────────────────────────────────────────────────

const COLA = [
  { id: 1, video_id: 'fJ9rUzIMcZQ', titulo: 'Bohemian Rhapsody',    artista: 'Queen',                   usuario_nombre: 'Carlos M.', cover_url: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg' },
  { id: 2, video_id: 'lDK9QqIzhwk', titulo: "Livin' on a Prayer",   artista: 'Bon Jovi',                usuario_nombre: 'Ana G.',    cover_url: 'https://img.youtube.com/vi/lDK9QqIzhwk/hqdefault.jpg' },
  { id: 3, video_id: 'bo_efYhYU2A', titulo: 'Shallow',              artista: 'Lady Gaga ft. B. Cooper',  usuario_nombre: 'Pedro R.',  cover_url: 'https://img.youtube.com/vi/bo_efYhYU2A/hqdefault.jpg' },
  { id: 4, video_id: 'hLQl3WQQoQ0', titulo: 'Someone Like You',     artista: 'Adele',                   usuario_nombre: 'María L.',  cover_url: 'https://img.youtube.com/vi/hLQl3WQQoQ0/hqdefault.jpg' },
  { id: 5, video_id: '1k8craCGpgs', titulo: "Don't Stop Believin'", artista: 'Journey',                 usuario_nombre: 'Javi K.',   cover_url: 'https://img.youtube.com/vi/1k8craCGpgs/hqdefault.jpg' },
];

const PREP_DURATION = 8;
const NOTES = ['♪', '♫', '♩', '♬', '♭'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseLRC(lrc) {
  return lrc.split('\n').map(line => {
    const m = line.match(/\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/);
    if (!m) return null;
    return { time: parseInt(m[1]) * 60 + parseFloat(m[2]), text: m[3].trim() };
  }).filter(Boolean);
}

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  return `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
}

// ─── WAITING SCREEN ───────────────────────────────────────────────────────────

const WaitingScreen = () => {
  const [hora, setHora] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  useEffect(() => {
    const t = setInterval(() => setHora(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={ws.root}>
      <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.22, 0.12] }} transition={{ duration: 9, repeat: Infinity }} style={ws.blobPurple} />
      <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 11, repeat: Infinity }} style={ws.blobCyan} />
      {NOTES.map((n, i) => (
        <motion.div key={i}
          animate={{ y: [0, -70, 0], x: [0, i % 2 === 0 ? 18 : -18, 0], opacity: [0, 0.45, 0] }}
          transition={{ duration: 3.5 + i * 0.6, repeat: Infinity, delay: i * 1.1 }}
          style={{ position: 'absolute', left: `${12 + i * 18}%`, bottom: '22%', fontSize: `${22 + i * 5}px`, color: i % 2 === 0 ? '#00f2ff' : '#bd00ff', userSelect: 'none', pointerEvents: 'none', zIndex: 1 }}>
          {n}
        </motion.div>
      ))}
      <div style={ws.content}>
        <motion.div animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 40px rgba(0,242,255,0.15)', '0 0 80px rgba(0,242,255,0.35)', '0 0 40px rgba(0,242,255,0.15)'] }}
          transition={{ duration: 4, repeat: Infinity }} style={ws.micWrap}>
          <img src={vokaraLogo} alt="Vokara" style={{ height: '52px', width: '52px', borderRadius: '50%', objectFit: 'cover' }} />
        </motion.div>
        <h1 style={ws.barName}>Bar Demo</h1>
        <motion.p animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3.5, repeat: Infinity }} style={ws.tagline}>
          Sé el primero en pedir una canción
        </motion.p>
        <div style={ws.clock}>{hora}</div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={ws.qrBlock}>
          <div style={ws.qrWrap}>
            <QRCode value={`${window.location.origin}/bar-demo`} size={90} bgColor="#ffffff" fgColor="#0a0a0a" />
          </div>
          <div>
            <p style={ws.qrHint}>Escanea con tu móvil</p>
            <p style={ws.qrAction}>y pide tu canción</p>
            <p style={ws.qrUrl}>{window.location.host}/bar-demo</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ws = {
  root: { position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 40%, #0d0025 0%, #020208 100%)', overflow: 'hidden' },
  blobPurple: { position: 'absolute', top: '-15%', left: '-10%', width: '55vw', height: '55vw', background: '#bd00ff', filter: 'blur(140px)', borderRadius: '50%', pointerEvents: 'none' },
  blobCyan: { position: 'absolute', bottom: '-15%', right: '-10%', width: '55vw', height: '55vw', background: '#00f2ff', filter: 'blur(140px)', borderRadius: '50%', pointerEvents: 'none' },
  content: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '0 40px', textAlign: 'center' },
  micWrap: { width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(0,242,255,0.08)', border: '2px solid rgba(0,242,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  barName: { fontSize: 'clamp(40px, 7vw, 110px)', fontWeight: '900', margin: 0, lineHeight: 1, fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif', color: '#fff', letterSpacing: '-2px', textShadow: '0 0 80px rgba(0,242,255,0.25)' },
  tagline: { fontSize: 'clamp(13px, 1.8vw, 22px)', color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '4px', textTransform: 'uppercase', fontWeight: '600' },
  clock: { fontSize: 'clamp(28px, 4.5vw, 68px)', fontWeight: '200', letterSpacing: '10px', color: 'rgba(255,255,255,0.12)', fontFamily: 'monospace' },
  qrBlock: { display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '18px 28px', marginTop: '4px', backdropFilter: 'blur(12px)' },
  qrWrap: { background: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 0 40px rgba(0,242,255,0.15)', flexShrink: 0 },
  qrHint: { margin: 0, fontSize: '10px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'left' },
  qrAction: { margin: '5px 0 2px', fontSize: '18px', fontWeight: '700', color: 'rgba(255,255,255,0.75)', textAlign: 'left' },
  qrUrl: { margin: 0, fontSize: '11px', color: '#444', fontFamily: 'monospace', textAlign: 'left' },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const KaraokeTVDemo = () => {
  const [isLayoutFullscreen, setIsLayoutFullscreen] = useState(false);
  const [songIdx, setSongIdx] = useState(0);
  const [isPreparing, setIsPreparing] = useState(true);
  const [countdown, setCountdown] = useState(PREP_DURATION);
  const [pipelineStatus, setPipelineStatus] = useState('not_found');
  const [lyrics, setLyrics] = useState([]);
  const [currentLyricIdx, setCurrentLyricIdx] = useState(-1);
  const [lyricFill, setLyricFill] = useState(0);
  const [audioProgress, setAudioProgress] = useState({ current: 0, duration: 0 });
  const [hora, setHora] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [glowColor, setGlowColor] = useState('#00f2ff');

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const lyricIdxRef = useRef(-1);
  const prevSongIdxRef = useRef(-1);

  const nowPlaying = COLA[songIdx];
  const queue = [...COLA.slice(songIdx + 1), ...COLA.slice(0, songIdx)];

  const advance = () => {
    setSongIdx(i => (i + 1) % COLA.length);
    setIsPreparing(true);
    setCountdown(PREP_DURATION);
  };

  // Clock + glow color cycle
  useEffect(() => {
    const t = setInterval(() => setHora(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    const colors = ['#00f2ff', '#bd00ff', '#ff0055'];
    let i = 0;
    const c = setInterval(() => { setGlowColor(colors[i]); i = (i + 1) % 3; }, 3000);
    return () => { clearInterval(t); clearInterval(c); };
  }, []);

  // F key fullscreen
  useEffect(() => {
    const h = (e) => { if (e.key.toLowerCase() === 'f') setIsLayoutFullscreen(p => !p); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Init progress bar so React never resets it
  useEffect(() => {
    if (progressBarRef.current) progressBarRef.current.style.transform = 'scaleX(0)';
  }, []);

  // When song changes → trigger pipeline + reset state
  useEffect(() => {
    if (songIdx === prevSongIdxRef.current) return;
    prevSongIdxRef.current = songIdx;

    setPipelineStatus('not_found');
    setLyrics([]);
    setCurrentLyricIdx(-1);
    lyricIdxRef.current = -1;
    if (progressBarRef.current) progressBarRef.current.style.transform = 'scaleX(0)';

    const { video_id, titulo, artista } = nowPlaying;

    // Trigger pipeline (fire & forget — server caches after first run)
    fetch(`${API_URL}/api/pipeline/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: video_id, titulo, artista }),
    }).catch(() => {});

    // Poll pipeline status
    let alive = true;
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/api/pipeline/status/${video_id}`);
        const { status } = await r.json();
        if (!alive) return;
        setPipelineStatus(status);
        if (status === 'ready') {
          const lr = await fetch(`${API_URL}/api/pipeline/lyrics/${video_id}`);
          if (lr.ok) setLyrics(parseLRC(await lr.text()));
          clearInterval(poll);
        }
      } catch {}
    };
    check();
    const poll = setInterval(check, 3000);
    return () => { alive = false; clearInterval(poll); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songIdx]);

  // Prep countdown
  useEffect(() => {
    if (!isPreparing) return;
    if (countdown <= 0) { setIsPreparing(false); return; }
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [isPreparing, countdown]);

  // Control audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (pipelineStatus === 'ready' && !isPreparing) {
      const tryPlay = () => {
        audio.play().catch(err => console.error('▶️ play() failed:', err.name, err.message));
      };
      if (audio.readyState >= 3) tryPlay();
      else {
        audio.addEventListener('canplay', tryPlay, { once: true });
        return () => audio.removeEventListener('canplay', tryPlay);
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [pipelineStatus, isPreparing]);

  // RAF loop: lyrics + progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    lyricIdxRef.current = -1;
    let rafId;
    let lastProgressUpdate = 0;
    const update = () => {
      const t = audio.currentTime;
      const dur = audio.duration || 0;

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${isFinite(dur) && dur > 0 ? t / dur : 0})`;
      }

      const now = performance.now();
      if (dur > 0 && now - lastProgressUpdate > 500) {
        setAudioProgress({ current: t, duration: dur });
        lastProgressUpdate = now;
      }

      if (lyrics.length) {
        let idx = -1;
        for (let i = 0; i < lyrics.length; i++) {
          if (lyrics[i].time <= t) idx = i; else break;
        }
        if (idx !== lyricIdxRef.current) {
          lyricIdxRef.current = idx;
          setCurrentLyricIdx(idx);
        }
        if (idx >= 0 && idx < lyrics.length - 1) {
          const s = lyrics[idx].time, e = lyrics[idx + 1].time;
          setLyricFill(Math.min(100, Math.max(0, ((t - s) / (e - s)) * 100)));
        } else {
          setLyricFill(idx >= 0 ? 100 : 0);
        }
      }

      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [lyrics]);

  const videoBorderStyle = {
    ...st.videoContainer,
    borderColor: glowColor,
    boxShadow: `0 0 0 2px ${glowColor}33, 0 0 60px ${glowColor}55, 0 0 120px ${glowColor}22`,
    transition: 'border-color 1.2s ease, box-shadow 1.2s ease',
  };

  return (
    <div style={st.container}>
      <div style={st.background}><div style={st.blob1} /><div style={st.blob2} /></div>

      {/* Audio element — src set only when pipeline ready */}
      <audio
        ref={audioRef}
        src={pipelineStatus === 'ready' ? `${API_URL}/api/pipeline/audio/${nowPlaying.video_id}` : undefined}
        onEnded={advance}
        preload="auto"
        style={{ display: 'none' }}
      />

      {/* Top bar */}
      <div style={st.topBar}>
        <div style={st.topBarLeft}>
          <img src={vokaraLogo} alt="Vokara" style={{ height: '22px', width: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>Bar Demo</span>
          <span style={{ fontSize: '9px', color: '#444', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase', marginLeft: '2px' }}>· Vokara</span>
          <span style={{ fontSize: '9px', background: '#00f2ff22', color: '#00f2ff', border: '1px solid #00f2ff44', borderRadius: '4px', padding: '1px 6px', letterSpacing: '1px', fontWeight: 700, marginLeft: '8px' }}>DEMO</span>
        </div>
        <div style={st.topBarRight}>
          <div onClick={() => setIsLayoutFullscreen(p => !p)} style={st.fullscreenBtn}>
            {isLayoutFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </div>
          <div style={st.clock}><Clock size={16} /><span>{hora}</span></div>
        </div>
      </div>

      {/* Main */}
      <div style={st.mainContent}>
        <div style={{ ...st.leftColumn, flex: isLayoutFullscreen ? 1 : 7, transition: 'flex 0.5s ease' }}>
          <motion.div layout style={videoBorderStyle}>

            {/* PREP OVERLAY */}
            <AnimatePresence>
              {isPreparing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }} style={st.prepOverlay}>
                  <div style={st.prepContent}>
                    <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }} style={st.prepAvatar}>
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nowPlaying.usuario_nombre)}&background=random&size=160`}
                        alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    </motion.div>
                    <p style={st.prepLabel}>PRÓXIMO TURNO</p>
                    <h1 style={st.prepUser}>{nowPlaying.usuario_nombre}</h1>
                    <p style={st.prepSong}>{nowPlaying.titulo}</p>
                    <p style={st.prepArtist}>{nowPlaying.artista}</p>
                    <div style={{ position: 'relative', margin: '30px 0' }}>
                      <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <circle cx="80" cy="80" r="68" fill="none" stroke={glowColor} strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 68}`}
                          strokeDashoffset={`${2 * Math.PI * 68 * (1 - countdown / PREP_DURATION)}`}
                          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 1.2s ease', filter: `drop-shadow(0 0 10px ${glowColor})` }} />
                      </svg>
                      <div style={st.countdownInner}>
                        <span style={{ ...st.countdownNumber, color: glowColor }}>{countdown}</span>
                        <span style={st.countdownSec}>seg</span>
                      </div>
                    </div>
                    <div style={st.controlsPrep}>
                      <button onClick={() => setCountdown(0)} style={{ ...st.btnPrimario, background: glowColor }}>
                        <PlayCircle size={18} /> Comenzar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* KARAOKE DISPLAY */}
            {pipelineStatus === 'ready' && !isPreparing && (
              <div style={st.karaokeScreen}>
                {nowPlaying.cover_url && (
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${nowPlaying.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(60px) brightness(0.25)', transform: 'scale(1.15)' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,2,15,0.75)' }} />

                <div style={st.karaokeCenter}>
                  {lyrics.length > 0 ? (
                    <>
                      <motion.p key={`prev-${currentLyricIdx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={st.kPrev}>
                        {currentLyricIdx > 0 ? lyrics[currentLyricIdx - 1].text : ''}
                      </motion.p>
                      <div style={st.kCurrentWrap}>
                        <p style={st.kCurrentBase}>{currentLyricIdx >= 0 ? lyrics[currentLyricIdx].text : '♪'}</p>
                        <p style={{ ...st.kCurrentFill, color: glowColor, clipPath: `inset(0 ${100 - lyricFill}% 0 0)`, textShadow: `0 0 40px ${glowColor}99` }}>
                          {currentLyricIdx >= 0 ? lyrics[currentLyricIdx].text : '♪'}
                        </p>
                      </div>
                      <motion.p key={`next-${currentLyricIdx}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={st.kNext}>
                        {currentLyricIdx >= 0 && currentLyricIdx < lyrics.length - 1 ? lyrics[currentLyricIdx + 1].text : ''}
                      </motion.p>
                    </>
                  ) : (
                    <p style={{ ...st.kCurrentBase, color: 'rgba(255,255,255,0.4)', fontSize: '3vw' }}>♪ Preparando letras… ♪</p>
                  )}
                </div>

                <div style={st.karaokeBar}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                    <div ref={progressBarRef} style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${glowColor}, ${glowColor}88)`, boxShadow: `0 0 8px ${glowColor}`, transformOrigin: 'left center' }} />
                  </div>
                  {nowPlaying.cover_url && <img src={nowPlaying.cover_url} alt="cover" style={st.karaokeCover} />}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={st.karaokeTitle}>{nowPlaying.titulo}</div>
                    <div style={st.karaokeArtist}>{nowPlaying.artista}</div>
                  </div>
                  {audioProgress.duration > 0 && (
                    <div style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace', flexShrink: 0 }}>
                      {formatTime(audioProgress.duration - audioProgress.current)}
                    </div>
                  )}
                  <div style={st.karaokeSinger}>
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nowPlaying.usuario_nombre)}&background=random`}
                      alt="singer" style={st.karaokeSingerAvatar} />
                    <div>
                      <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>CANTANDO</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#00f2ff' }}>{nowPlaying.usuario_nombre}</div>
                    </div>
                  </div>
                  <button onClick={advance} style={st.skipBtn}><FastForward size={22} /></button>
                </div>
              </div>
            )}

            {/* WAITING FOR PIPELINE */}
            {pipelineStatus !== 'ready' && !isPreparing && (
              <div style={st.waitingScreen}>
                <div style={st.waitingSpinner} />
                <p style={{ color: '#555', marginTop: '20px', fontSize: '14px', letterSpacing: '2px' }}>
                  PREPARANDO AUDIO…
                </p>
              </div>
            )}

          </motion.div>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {!isLayoutFullscreen && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4 }} style={st.rightColumn}>
              <div style={st.glassCard}>
                <div style={st.cardHeader}><Sparkles size={16} color="#ffd700" /><span>EN COLA</span></div>
                <div style={st.queueContainer}>
                  {queue.length === 0 ? (
                    <div style={st.emptyQueue}><Music size={36} opacity={0.3} /><p style={{ marginTop: '10px', fontSize: '13px', opacity: 0.5 }}>Lista vacía</p></div>
                  ) : (
                    queue.slice(0, 6).map((item, idx) => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        style={{ ...st.queueItem, ...(idx === 0 ? st.queueItemNext : {}) }}>
                        <div style={{ ...st.rank, background: idx === 0 ? '#ffd700' : 'rgba(255,255,255,0.08)', color: idx === 0 ? '#000' : '#777', border: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)', boxShadow: idx === 0 ? '0 0 16px rgba(255,215,0,0.55)' : 'none', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif', fontSize: '15px' }}>
                          {idx + 1}
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          {idx === 0 && <div style={st.nextUpLabel}>SIGUIENTE</div>}
                          <div style={st.qTitle}>{item.titulo}</div>
                          <div style={st.qArtist}>{item.artista}</div>
                          <div style={st.qUser}>
                            <Mic2 size={11} color="#00f2ff" style={{ flexShrink: 0 }} />
                            <span>{item.usuario_nombre}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
              <div style={st.qrCard}>
                <p style={st.qrLabel}>Escanea y pide tu canción</p>
                <div style={st.qrInner}>
                  <QRCode value={`${window.location.origin}/bar-demo`} size={120} bgColor="#ffffff" fgColor="#0a0a0a" />
                </div>
                <p style={st.qrSubLabel}>{window.location.host}/bar-demo</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── STYLES (identical to Tv.jsx) ────────────────────────────────────────────

const st = {
  container: { height: '100vh', width: '100vw', background: '#050505', color: 'white', fontFamily: '"Inter", sans-serif', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  background: { position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 30% 20%, #1a0b2e 0%, #000 70%)' },
  blob1: { position: 'absolute', top: '-15%', left: '-10%', width: '50vw', height: '50vw', background: '#bd00ff', filter: 'blur(180px)', opacity: 0.18, borderRadius: '50%', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-15%', right: '-10%', width: '50vw', height: '50vw', background: '#00f2ff', filter: 'blur(180px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' },
  topBar: { height: '44px', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: '7px' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  fullscreenBtn: { cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '8px' },
  clock: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '600', color: '#888', letterSpacing: '0.5px' },
  mainContent: { flex: 1, display: 'flex', padding: '16px 20px 20px', position: 'relative', zIndex: 10, minHeight: 0, gap: '20px' },
  leftColumn: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  videoContainer: { flex: 1, background: '#000', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: '2px solid #00f2ff', display: 'flex', flexDirection: 'column', cursor: 'pointer' },
  prepOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(30,0,60,0.97) 0%, rgba(0,0,0,0.98) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(24px)', zIndex: 20 },
  prepContent: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
  prepAvatar: { width: '110px', height: '110px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 0 40px rgba(0,242,255,0.3)', marginBottom: '20px', overflow: 'hidden', background: '#111' },
  prepLabel: { color: '#00f2ff', letterSpacing: '5px', fontSize: '1.2vh', fontWeight: '700', margin: '0 0 8px', textTransform: 'uppercase' },
  prepUser: { fontSize: '9vh', fontWeight: '900', margin: '0 0 8px', lineHeight: 1, color: '#fff', textShadow: '0 0 60px rgba(255,255,255,0.3)', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif' },
  prepSong: { fontSize: '3.2vh', color: '#eee', margin: '0 0 4px', fontWeight: '700', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif' },
  prepArtist: { fontSize: '1.8vh', color: '#777', margin: 0, fontWeight: '500' },
  countdownInner: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  countdownNumber: { fontSize: '13vh', fontWeight: '900', lineHeight: 1, fontFamily: '"Bigger Display", "Big Shoulders Display", monospace' },
  countdownSec: { fontSize: '1.6vh', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' },
  controlsPrep: { display: 'flex', gap: '14px', marginTop: '10px' },
  btnPrimario: { border: 'none', padding: '14px 28px', borderRadius: '50px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1vw', color: '#000' },
  karaokeScreen: { position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  karaokeCenter: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', padding: '0 2%', width: '100%', boxSizing: 'border-box' },
  kPrev: { fontSize: 'clamp(12px, 1.5vw, 22px)', color: 'rgba(255,255,255,0.16)', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif', textAlign: 'center', margin: 0, lineHeight: 1.3, maxWidth: '96%', minHeight: '1.3em', fontWeight: '700' },
  kCurrentWrap: { position: 'relative', display: 'block', textAlign: 'center', width: '100%', overflow: 'hidden' },
  kCurrentBase: { fontSize: 'clamp(18px, 3.8vw, 64px)', color: 'rgba(255,255,255,0.70)', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif', textAlign: 'center', margin: 0, lineHeight: 1.15, fontWeight: '900', letterSpacing: '-0.5px', padding: '0 1%', whiteSpace: 'nowrap', overflow: 'hidden' },
  kCurrentFill: { position: 'absolute', inset: 0, fontSize: 'clamp(18px, 3.8vw, 64px)', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif', textAlign: 'center', margin: 0, lineHeight: 1.15, fontWeight: '900', letterSpacing: '-0.5px', padding: '0 1%', whiteSpace: 'nowrap', overflow: 'hidden' },
  kNext: { fontSize: 'clamp(12px, 1.5vw, 22px)', color: 'rgba(255,255,255,0.16)', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif', textAlign: 'center', margin: 0, lineHeight: 1.3, maxWidth: '96%', minHeight: '1.3em', fontWeight: '700' },
  karaokeBar: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3, display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 28px', background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)', overflow: 'hidden' },
  karaokeCover: { width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
  karaokeTitle: { fontWeight: '800', fontSize: '15px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' },
  karaokeArtist: { fontSize: '12px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  karaokeSinger: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 14px', flexShrink: 0 },
  karaokeSingerAvatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' },
  skipBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', width: '56px', height: '56px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', flexShrink: 0, marginLeft: '20px' },
  waitingScreen: { position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020208' },
  waitingSpinner: { width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.06)', borderTop: '3px solid #00f2ff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '16px', width: '320px', minWidth: '280px', maxWidth: '360px', overflow: 'hidden', flexShrink: 0 },
  glassCard: { flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', padding: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#666', marginBottom: '14px', letterSpacing: '2px', textTransform: 'uppercase', flexShrink: 0 },
  queueContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' },
  emptyQueue: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#555' },
  queueItem: { background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.06)' },
  queueItemNext: { background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.18)', boxShadow: '0 0 20px rgba(255,215,0,0.06)' },
  nextUpLabel: { fontSize: '9px', fontWeight: '800', letterSpacing: '2.5px', color: '#ffd700', marginBottom: '3px', textTransform: 'uppercase' },
  rank: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 },
  qTitle: { fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', marginBottom: '2px' },
  qArtist: { fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' },
  qUser: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#00f2ff', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden' },
  qrCard: { background: 'rgba(0,242,255,0.04)', borderRadius: '20px', border: '1px solid rgba(0,242,255,0.12)', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 },
  qrLabel: { fontSize: '10px', fontWeight: '800', letterSpacing: '2px', color: '#00f2ff', textTransform: 'uppercase', margin: 0, opacity: 0.85 },
  qrInner: { background: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 0 40px rgba(0,242,255,0.2)' },
  qrSubLabel: { fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.5px', fontFamily: 'monospace' },
};

export default KaraokeTVDemo;
