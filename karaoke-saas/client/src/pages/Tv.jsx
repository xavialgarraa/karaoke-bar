import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Sparkles, Clock, PlayCircle, FastForward, Music, Power, PlusCircle } from 'lucide-react';
import vokaraLogo from '../assets/logo.png';
import { Minimize2, Maximize2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_CLIENT_URL || "http://localhost:3001";

function parseLRC(lrc) {
  return lrc.split('\n').map(line => {
    const m = line.match(/\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/);
    if (!m) return null;
    return { time: parseInt(m[1]) * 60 + parseFloat(m[2]), text: m[3].trim() };
  }).filter(Boolean);
}

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── WAITING SCREEN ────────────────────────────────────────────────────────────

const NOTES = ['♪', '♫', '♩', '♬', '♭'];

const WaitingScreen = ({ slug, barNombre }) => {
  const [hora, setHora] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const t = setInterval(
      () => setHora(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
      1000
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div style={ws.root}>
      {/* Animated background blobs */}
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={ws.blobPurple}
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        style={ws.blobCyan}
      />

      {/* Floating music notes */}
      {NOTES.map((note, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -70, 0], x: [0, i % 2 === 0 ? 18 : -18, 0], opacity: [0, 0.45, 0] }}
          transition={{ duration: 3.5 + i * 0.6, repeat: Infinity, delay: i * 1.1, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            left: `${12 + i * 18}%`,
            bottom: '22%',
            fontSize: `${22 + i * 5}px`,
            color: i % 2 === 0 ? '#00f2ff' : '#bd00ff',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {note}
        </motion.div>
      ))}

      {/* Main content */}
      <div style={ws.content}>
        {/* Mic icon */}
        <motion.div
          animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 40px rgba(0,242,255,0.15)', '0 0 80px rgba(0,242,255,0.35)', '0 0 40px rgba(0,242,255,0.15)'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={ws.micWrap}
        >
          <img src={vokaraLogo} alt="Vokara" style={{ height: '52px', width: '52px', borderRadius: '50%', objectFit: 'cover' }} />
        </motion.div>

        {/* Bar name */}
        {barNombre && (
          <h1 style={ws.barName}>{barNombre}</h1>
        )}

        {/* Tagline */}
        <motion.p
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          style={ws.tagline}
        >
          Sé el primero en pedir una canción
        </motion.p>

        {/* Clock */}
        <div style={ws.clock}>{hora}</div>

        {/* QR block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={ws.qrBlock}
        >
          <div style={ws.qrWrap}>
            <QRCode
              value={`${window.location.origin}/${slug}`}
              size={90}
              bgColor="#ffffff"
              fgColor="#0a0a0a"
            />
          </div>
          <div>
            <p style={ws.qrHint}>Escanea con tu móvil</p>
            <p style={ws.qrAction}>y pide tu canción</p>
            <p style={ws.qrUrl}>{window.location.host}/{slug}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const ws = {
  root: {
    position: 'absolute', inset: 0, zIndex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 40%, #0d0025 0%, #020208 100%)',
    overflow: 'hidden',
  },
  blobPurple: {
    position: 'absolute', top: '-15%', left: '-10%',
    width: '55vw', height: '55vw',
    background: '#bd00ff', filter: 'blur(140px)', borderRadius: '50%',
    pointerEvents: 'none',
  },
  blobCyan: {
    position: 'absolute', bottom: '-15%', right: '-10%',
    width: '55vw', height: '55vw',
    background: '#00f2ff', filter: 'blur(140px)', borderRadius: '50%',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '20px', padding: '0 40px', textAlign: 'center',
  },
  micWrap: {
    width: '96px', height: '96px', borderRadius: '50%',
    background: 'rgba(0,242,255,0.08)',
    border: '2px solid rgba(0,242,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  barName: {
    fontSize: 'clamp(40px, 7vw, 110px)',
    fontWeight: '900', margin: 0, lineHeight: 1,
    fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif',
    color: '#fff', letterSpacing: '-2px',
    textShadow: '0 0 80px rgba(0,242,255,0.25)',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 'clamp(13px, 1.8vw, 22px)',
    color: 'rgba(255,255,255,0.4)',
    margin: 0, letterSpacing: '4px', textTransform: 'uppercase', fontWeight: '600',
  },
  clock: {
    fontSize: 'clamp(28px, 4.5vw, 68px)',
    fontWeight: '200', letterSpacing: '10px',
    color: 'rgba(255,255,255,0.12)', fontFamily: 'monospace',
  },
  qrBlock: {
    display: 'flex', alignItems: 'center', gap: '20px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px', padding: '18px 28px',
    marginTop: '4px', backdropFilter: 'blur(12px)',
  },
  qrWrap: {
    background: '#fff', padding: '10px', borderRadius: '12px',
    boxShadow: '0 0 40px rgba(0,242,255,0.15)', flexShrink: 0,
  },
  qrHint: {
    margin: 0, fontSize: '10px', color: '#555',
    letterSpacing: '2px', textTransform: 'uppercase', textAlign: 'left',
  },
  qrAction: {
    margin: '5px 0 2px', fontSize: '18px', fontWeight: '700',
    color: 'rgba(255,255,255,0.75)', textAlign: 'left',
  },
  qrUrl: {
    margin: 0, fontSize: '11px', color: '#444',
    fontFamily: 'monospace', textAlign: 'left',
  },
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

const KaraokeTV = () => {
  const { slug: slugParam } = useParams();
  const slug = slugParam || 'bar-demo';
  const [searchParams] = useSearchParams();
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const nowPlayingRef = useRef(null);
  const [isLayoutFullscreen, setIsLayoutFullscreen] = useState(false);

  const [hasStarted, setHasStarted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [barNombre, setBarNombre] = useState('');

  const [pipelineStatus, setPipelineStatus] = useState('not_found');
  const [lyrics, setLyrics] = useState([]);
  const [currentLyricIdx, setCurrentLyricIdx] = useState(-1);
  const [lyricFill, setLyricFill] = useState(0);

  const [audioProgress, setAudioProgress] = useState({ current: 0, duration: 0 });
  const progressBarRef = useRef(null);

  // Init progress bar transform so React never resets it via JSX
  useEffect(() => {
    if (progressBarRef.current) progressBarRef.current.style.transform = 'scaleX(0)';
  }, []);
  const [isPreparing, setIsPreparing] = useState(false);
  const [countdown, setCountdown] = useState(90);
  const [hora, setHora] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [glowColor, setGlowColor] = useState('#00f2ff');

  // Fetch bar name once on mount
  useEffect(() => {
    fetch(`${API_URL}/api/bar/data/${slug}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.nombre) setBarNombre(d.nombre); })
      .catch(() => {});
  }, [slug]);

  // Keep ref in sync for socket handlers (avoid stale closure)
  useEffect(() => { nowPlayingRef.current = nowPlaying; }, [nowPlaying]);

  // --- FULLSCREEN (F key) ---
  useEffect(() => {
    const onKey = (e) => { if (e.key.toLowerCase() === 'f') setIsLayoutFullscreen(p => !p); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // --- CLOCK + ACCENT COLORS ---
  useEffect(() => {
    const t = setInterval(() => setHora(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    const colors = ['#00f2ff', '#bd00ff', '#ff0055'];
    let i = 0;
    const c = setInterval(() => { setGlowColor(colors[i]); i = (i + 1) % 3; }, 3000);
    return () => { clearInterval(t); clearInterval(c); };
  }, []);

  // --- WHEN nowPlaying CHANGES → start prep countdown ---
  const prevIdRef = useRef(null);
  useEffect(() => {
    if (nowPlaying && nowPlaying.id !== prevIdRef.current) {
      prevIdRef.current = nowPlaying.id;
      setIsPreparing(true);
      setCountdown(90);
    }
    if (!nowPlaying) {
      prevIdRef.current = null;
      setIsPreparing(false);
    }
  }, [nowPlaying?.id]);

  // --- LOAD QUEUE FROM API ---
  const cargarCola = async () => {
    try {
      const res = await fetch(`${API_URL}/api/queue/${slug}`);
      const data = await res.json();
      if (data.length > 0) {
        const nextSong = data[0];
        setNowPlaying(prev => (prev?.id === nextSong.id ? prev : nextSong));
        setQueue(data.slice(1));
      } else {
        setNowPlaying(null);
        setQueue([]);
      }
    } catch (err) { console.error(err); }
  };

  // --- SOCKETS ---
  useEffect(() => {
    if (!hasStarted) return;
    const token = searchParams.get('t') || localStorage.getItem('karaoke_token');
    socketRef.current = io(API_URL, { auth: { token } });

    const joinAndLoad = () => {
      socketRef.current.emit('unirse_bar', slug);
      cargarCola();
    };

    socketRef.current.on('connect', joinAndLoad);
    socketRef.current.on('reconnect', joinAndLoad);

    socketRef.current.on('nueva_cancion_anadida', (nueva) => {
      if (!nowPlayingRef.current) {
        setNowPlaying(nueva);
        setQueue([]);
      } else {
        setQueue(q => (q.find(p => p.id === nueva.id) ? q : [...q, nueva]));
      }
    });

    socketRef.current.on('cambio_de_turno', () => setTimeout(cargarCola, 1000));
    socketRef.current.on('cola_actualizada', () => cargarCola());

    const refreshInterval = setInterval(cargarCola, 10000);
    return () => {
      socketRef.current?.disconnect();
      clearInterval(refreshInterval);
    };
  }, [slug, hasStarted]);

  // --- SONG END ---
  const handleVideoEnd = () => {
    if (nowPlaying?.id && !String(nowPlaying.id).startsWith('filler_')) {
      socketRef.current?.emit('admin_siguiente_cancion', { slug, idCancionActual: nowPlaying.id });
    }
    if (queue.length > 0) {
      const [next, ...remaining] = queue;
      setNowPlaying(next);
      setQueue(remaining);
    } else {
      setNowPlaying(null);
    }
  };

  // --- COUNTDOWN ---
  useEffect(() => {
    if (!isPreparing) return;
    if (countdown <= 0) { setIsPreparing(false); return; }
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [isPreparing, countdown]);

  // --- PIPELINE: poll status when song changes ---
  const videoId = nowPlaying?.video_id || nowPlaying?.videoId;
  useEffect(() => {
    if (!videoId) {
      setPipelineStatus('not_found');
      setLyrics([]);
      setCurrentLyricIdx(-1);
      return;
    }
    setPipelineStatus('not_found');
    setLyrics([]);
    setCurrentLyricIdx(-1);
    let alive = true;
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/api/pipeline/status/${videoId}`);
        const { status } = await r.json();
        if (!alive) return;
        setPipelineStatus(status);
        if (status === 'ready') {
          const lr = await fetch(`${API_URL}/api/pipeline/lyrics/${videoId}`);
          if (lr.ok) setLyrics(parseLRC(await lr.text()));
          clearInterval(poll);
        }
      } catch {}
    };
    check();
    const poll = setInterval(check, 3000);
    return () => { alive = false; clearInterval(poll); };
  }, [videoId]);

  // --- PIPELINE: control audio playback ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (nowPlaying && pipelineStatus === 'ready' && !isPreparing) {
      const tryPlay = () => {
        audio.play().catch((err) => {
          console.error('▶️ audio.play() failed:', err.name, err.message);
        });
      };
      if (audio.readyState >= 3) {
        tryPlay();
      } else {
        audio.addEventListener('canplay', tryPlay, { once: true });
        return () => audio.removeEventListener('canplay', tryPlay);
      }
    } else {
      audio.pause();
      if (!nowPlaying) audio.currentTime = 0;
    }
  }, [pipelineStatus, isPreparing, nowPlaying]);

  // --- RAF LOOP: letras + barra de progreso a 60fps ---
  const lyricIdxRef = useRef(-1);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    lyricIdxRef.current = -1; // reset index on every new lyrics set
    let rafId;
    let lastProgressUpdate = 0;
    const update = () => {
      const t = audio.currentTime;
      const dur = audio.duration || 0;

      // Progress bar via scaleX — transform not in JSX so React won't reset it
      if (progressBarRef.current) {
        const scale = isFinite(dur) && dur > 0 ? t / dur : 0;
        progressBarRef.current.style.transform = `scaleX(${scale})`;
      }

      // Throttle state update for time display (~2fps)
      const now = performance.now();
      if (dur > 0 && now - lastProgressUpdate > 500) {
        setAudioProgress({ current: t, duration: dur });
        lastProgressUpdate = now;
      }

      // Lyrics
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

  // --- ACCESS GUARD ---
  const tvToken = searchParams.get('t') || localStorage.getItem('karaoke_token');
  if (!tvToken) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'system-ui, sans-serif', gap: 16 }}>
        <img src={vokaraLogo} alt="Vokara" style={{ height: 56, width: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Acceso restringido</h2>
        <p style={{ color: '#666', margin: 0 }}>Abre la TV desde el panel de administración.</p>
      </div>
    );
  }

  // --- START SCREEN ---
  if (!hasStarted) {
    return (
      <div style={styles.startScreen}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={styles.startCard}
        >
          <div style={styles.startIconWrap}><img src={vokaraLogo} alt="Vokara" style={{ height: '60px', width: '60px', borderRadius: '50%', objectFit: 'cover' }} /></div>
          <h1 style={styles.startTitle}>Vokara</h1>
          <p style={styles.startSubtitle}>Sistema de karaoke en tiempo real</p>
          <p style={styles.startHint}>Presiona <kbd style={styles.kbd}>F</kbd> para pantalla completa</p>
          <button onClick={() => setHasStarted(true)} style={styles.startBtn}>
            <Power size={22} /><span>INICIAR SISTEMA</span>
          </button>
        </motion.div>
      </div>
    );
  }

  const videoBorderStyle = {
    ...styles.videoContainer,
    borderColor: glowColor,
    boxShadow: `0 0 0 2px ${glowColor}33, 0 0 60px ${glowColor}55, 0 0 120px ${glowColor}22`,
    transition: 'border-color 1.2s ease, box-shadow 1.2s ease',
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}>
        <div style={styles.blob1} />
        <div style={styles.blob2} />
      </div>

      {/* Audio element — src set only when pipeline ready to avoid premature 404 */}
      <audio
        ref={audioRef}
        src={videoId && pipelineStatus === 'ready' ? `${API_URL}/api/pipeline/audio/${videoId}` : undefined}
        onEnded={handleVideoEnd}
        preload="auto"
        style={{ display: 'none' }}
      />

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <img src={vokaraLogo} alt="Vokara" style={{ height: '22px', width: '22px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ fontWeight: 800, fontSize: '15px', color: '#fff', letterSpacing: '0.2px' }}>
            {barNombre || slug.toUpperCase()}
          </span>
          <span style={{ fontSize: '9px', color: '#444', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase', marginLeft: '2px' }}>
            · Vokara
          </span>
        </div>
        <div style={styles.topBarRight}>
          <div onClick={() => setIsLayoutFullscreen(p => !p)} style={styles.fullscreenBtn}>
            {isLayoutFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </div>
          <div style={styles.clock}>
            <Clock size={16} /><span>{hora}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        <div style={{ ...styles.leftColumn, flex: isLayoutFullscreen ? 1 : 7, transition: 'flex 0.5s ease' }}>
          <motion.div layout style={videoBorderStyle}>

            {/* WAITING SCREEN */}
            {!nowPlaying && <WaitingScreen slug={slug} barNombre={barNombre} />}

            {/* PREP OVERLAY */}
            <AnimatePresence>
              {isPreparing && nowPlaying && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}
                  style={styles.prepOverlay}
                >
                  <div style={styles.prepContent}>
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                      style={styles.prepAvatar}
                    >
                      <img
                        src={nowPlaying.usuario_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nowPlaying.usuario_nombre || nowPlaying.usuario || 'U')}&background=random&size=160`}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </motion.div>
                    <p style={styles.prepLabel}>PRÓXIMO TURNO</p>
                    <h1 style={styles.prepUser}>{nowPlaying.usuario_nombre || nowPlaying.usuario}</h1>
                    <p style={styles.prepSong}>{nowPlaying.titulo}</p>
                    {nowPlaying.artista && <p style={styles.prepArtist}>{nowPlaying.artista}</p>}
                    <div style={{ position: 'relative', margin: '30px 0' }}>
                      <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <circle cx="80" cy="80" r="68" fill="none" stroke={glowColor} strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 68}`}
                          strokeDashoffset={`${2 * Math.PI * 68 * (1 - countdown / 90)}`}
                          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 1.2s ease', filter: `drop-shadow(0 0 10px ${glowColor})` }}
                        />
                      </svg>
                      <div style={styles.countdownInner}>
                        <span style={{ ...styles.countdownNumber, color: glowColor }}>{countdown}</span>
                        <span style={styles.countdownSec}>seg</span>
                      </div>
                    </div>
                    <div style={styles.controlsPrep}>
                      <button onClick={() => setCountdown(c => c + 30)} style={styles.btnSecundario}><PlusCircle size={18} /> +30s</button>
                      <button onClick={() => setCountdown(0)} style={{ ...styles.btnPrimario, background: glowColor }}><PlayCircle size={18} /> Comenzar</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* KARAOKE DISPLAY */}
            {pipelineStatus === 'ready' && nowPlaying && !isPreparing && (
              <div style={styles.karaokeScreen}>
                {nowPlaying.cover_url && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${nowPlaying.cover_url})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    filter: 'blur(60px) brightness(0.25)', transform: 'scale(1.15)',
                  }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,2,15,0.75)' }} />

                <div style={styles.karaokeCenter}>
                  {lyrics.length > 0 ? (
                    <>
                      <motion.p key={`prev-${currentLyricIdx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={styles.kPrev}>
                        {currentLyricIdx > 0 ? lyrics[currentLyricIdx - 1].text : ''}
                      </motion.p>
                      <div style={styles.kCurrentWrap}>
                        <p style={styles.kCurrentBase}>
                          {currentLyricIdx >= 0 ? lyrics[currentLyricIdx].text : '♪'}
                        </p>
                        <p style={{ ...styles.kCurrentFill, color: glowColor, clipPath: `inset(0 ${100 - lyricFill}% 0 0)`, textShadow: `0 0 40px ${glowColor}99` }}>
                          {currentLyricIdx >= 0 ? lyrics[currentLyricIdx].text : '♪'}
                        </p>
                      </div>
                      <motion.p key={`next-${currentLyricIdx}`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={styles.kNext}>
                        {currentLyricIdx < lyrics.length - 1 ? lyrics[currentLyricIdx + 1].text : ''}
                      </motion.p>
                    </>
                  ) : (
                    <p style={{ ...styles.kCurrentBase, color: 'rgba(255,255,255,0.4)', fontSize: '3vw' }}>♪ Preparando letras… ♪</p>
                  )}
                </div>

                <div style={styles.karaokeBar}>
                  {/* Progress bar at top of bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                    <div ref={progressBarRef} style={{
                      height: '100%',
                      width: '100%',
                      background: `linear-gradient(90deg, ${glowColor}, ${glowColor}88)`,
                      boxShadow: `0 0 8px ${glowColor}`,
                      transformOrigin: 'left center',
                    }} />
                  </div>
                  {nowPlaying.cover_url && <img src={nowPlaying.cover_url} alt="cover" style={styles.karaokeCover} />}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={styles.karaokeTitle}>{nowPlaying.titulo}</div>
                    {nowPlaying.artista && <div style={styles.karaokeArtist}>{nowPlaying.artista}</div>}
                  </div>
                  {/* Time remaining */}
                  {audioProgress.duration > 0 && (
                    <div style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace', flexShrink: 0 }}>
                      {formatTime(audioProgress.duration - audioProgress.current)}
                    </div>
                  )}
                  <div style={styles.karaokeSinger}>
                    <img
                      src={nowPlaying.usuario_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(nowPlaying.usuario_nombre || 'U')}&background=random`}
                      alt="singer"
                      style={styles.karaokeSingerAvatar}
                    />
                    <div>
                      <div style={{ fontSize: '10px', color: '#666', letterSpacing: '1px' }}>CANTANDO</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#00f2ff' }}>{nowPlaying.usuario_nombre || nowPlaying.usuario}</div>
                    </div>
                  </div>
                  <button onClick={handleVideoEnd} style={styles.skipBtn}><FastForward size={22} /></button>
                </div>
              </div>
            )}

            {/* WAITING FOR PIPELINE */}
            {pipelineStatus !== 'ready' && nowPlaying && !isPreparing && (
              <div style={styles.waitingScreen}>
                <div style={styles.waitingSpinner} />
                <p style={{ color: '#555', marginTop: '20px', fontSize: '14px', letterSpacing: '2px' }}>
                  PREPARANDO AUDIO…
                </p>
              </div>
            )}

          </motion.div>
        </div>

        {/* SIDEBAR */}
        <AnimatePresence>
          {!isLayoutFullscreen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={styles.rightColumn}
            >
              <div style={styles.glassCard}>
                <div style={styles.cardHeader}>
                  <Sparkles size={16} color="#ffd700" />
                  <span>EN COLA</span>
                </div>
                <div style={styles.queueContainer}>
                  {queue.length === 0 ? (
                    <div style={styles.emptyQueue}>
                      <Music size={36} opacity={0.3} />
                      <p style={{ marginTop: '10px', fontSize: '13px', opacity: 0.5 }}>Lista vacía</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {queue.slice(0, 6).map((item, idx) => (
                        <motion.div
                          key={item.id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: idx * 0.04 }}
                          style={{ ...styles.queueItem, ...(idx === 0 ? styles.queueItemNext : {}) }}
                        >
                          <div style={{
                            ...styles.rank,
                            background: idx === 0 ? '#ffd700' : 'rgba(255,255,255,0.08)',
                            color: idx === 0 ? '#000' : '#777',
                            border: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: idx === 0 ? '0 0 16px rgba(255,215,0,0.55)' : 'none',
                            fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif',
                            fontSize: '15px',
                          }}>
                            {idx + 1}
                          </div>
                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            {idx === 0 && <div style={styles.nextUpLabel}>SIGUIENTE</div>}
                            <div style={styles.qTitle}>{item.titulo}</div>
                            <div style={styles.qArtist}>{item.artista || ''}</div>
                            <div style={styles.qUser}>
                              <Mic2 size={11} color="#00f2ff" style={{ flexShrink: 0 }} />
                              <span>{item.usuario_nombre || item.usuario}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              <div style={styles.qrCard}>
                <p style={styles.qrLabel}>Escanea y pide tu canción</p>
                <div style={styles.qrInner}>
                  <QRCode value={`${window.location.origin}/${slug}`} size={120} bgColor="#ffffff" fgColor="#0a0a0a" />
                </div>
                <p style={styles.qrSubLabel}>{window.location.host}/{slug}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    height: '100vh', width: '100vw',
    background: '#050505', color: 'white',
    fontFamily: '"Inter", sans-serif',
    position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  background: { position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 30% 20%, #1a0b2e 0%, #000 70%)' },
  blob1: { position: 'absolute', top: '-15%', left: '-10%', width: '50vw', height: '50vw', background: '#bd00ff', filter: 'blur(180px)', opacity: 0.18, borderRadius: '50%', pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-15%', right: '-10%', width: '50vw', height: '50vw', background: '#00f2ff', filter: 'blur(180px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' },

  startScreen: { width: '100vw', height: '100vh', background: 'radial-gradient(ellipse at 40% 40%, #1a0b2e 0%, #000 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', zIndex: 100 },
  startCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', padding: '56px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center', backdropFilter: 'blur(24px)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', position: 'relative', zIndex: 10, maxWidth: '480px', width: '90%' },
  startIconWrap: { width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(0,242,255,0.08)', border: '1px solid rgba(0,242,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 40px rgba(0,242,255,0.15)' },
  startTitle: { fontSize: '5vw', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 12px', color: '#fff', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif' },
  startSubtitle: { fontSize: '1.2vw', color: '#666', margin: '0 0 8px', textAlign: 'center' },
  startHint: { fontSize: '1vw', color: '#444', margin: '0 0 36px', textAlign: 'center' },
  kbd: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.9em', color: '#aaa' },
  startBtn: { background: 'linear-gradient(135deg, #00f2ff, #0088ff)', border: 'none', padding: '16px 48px', borderRadius: '50px', fontSize: '1.1vw', fontWeight: '800', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#000', boxShadow: '0 0 40px rgba(0,242,255,0.4)' },

  topBar: { height: '44px', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: '7px' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  fullscreenBtn: { cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '8px' },
  clock: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '600', color: '#888', letterSpacing: '0.5px' },

  mainContent: { flex: 1, display: 'flex', padding: '16px 20px 20px', position: 'relative', zIndex: 10, minHeight: 0, gap: '20px' },
  leftColumn: { display: 'flex', flexDirection: 'column', minWidth: 0 },

  videoContainer: { flex: 1, background: '#000', borderRadius: '20px', overflow: 'hidden', position: 'relative', border: '2px solid #00f2ff', display: 'flex', flexDirection: 'column', cursor: 'pointer' },

  prepOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(30,0,60,0.97) 0%, rgba(0,0,0,0.98) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(24px)', zIndex: 20, cursor: 'default' },
  prepContent: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
  prepAvatar: { width: '110px', height: '110px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 0 40px rgba(0,242,255,0.3)', marginBottom: '20px', overflow: 'hidden', background: '#111' },
  prepLabel: { color: '#00f2ff', letterSpacing: '5px', fontSize: '1.2vh', fontWeight: '700', margin: '0 0 8px', textTransform: 'uppercase' },
  prepUser: { fontSize: '9vh', fontWeight: '900', margin: '0 0 8px', lineHeight: 1, color: '#fff', textShadow: '0 0 60px rgba(255,255,255,0.3)', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif', letterSpacing: '0px' },
  prepSong: { fontSize: '3.2vh', color: '#eee', margin: '0 0 4px', fontWeight: '700', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif' },
  prepArtist: { fontSize: '1.8vh', color: '#777', margin: 0, fontWeight: '500' },
  countdownInner: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  countdownNumber: { fontSize: '13vh', fontWeight: '900', lineHeight: 1, fontFamily: '"Bigger Display", "Big Shoulders Display", monospace' },
  countdownSec: { fontSize: '1.6vh', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' },
  controlsPrep: { display: 'flex', gap: '14px', marginTop: '10px' },
  btnPrimario: { border: 'none', padding: '14px 28px', borderRadius: '50px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1vw', color: '#000', letterSpacing: '0.5px' },
  btnSecundario: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', padding: '14px 28px', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1vw' },

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

  qrCard: { background: 'rgba(0,242,255,0.04)', borderRadius: '20px', border: '1px solid rgba(0,242,255,0.12)', padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0, boxShadow: '0 0 40px rgba(0,242,255,0.05)' },
  qrLabel: { fontSize: '10px', fontWeight: '800', letterSpacing: '2px', color: '#00f2ff', textTransform: 'uppercase', margin: 0, opacity: 0.85 },
  qrInner: { background: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 0 40px rgba(0,242,255,0.2)' },
  qrSubLabel: { fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.5px', fontFamily: 'monospace' },
};

export default KaraokeTV;
