import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Sparkles, Clock, PlayCircle, FastForward, Music, Power, PlusCircle } from 'lucide-react';
import { Minimize2, Maximize2 } from 'lucide-react';
import YouTube from 'react-youtube';
import QRCode from 'react-qr-code';

const COLA_DEMO = [
  { id: 101, videoId: "xyF04rAhHaQ", titulo: "Bohemian Rhapsody", artista: "Queen", usuario_nombre: "Carlos M." },
  { id: 102, videoId: "Sykj3KRNV7U", titulo: "Shape of You", artista: "Ed Sheeran", usuario_nombre: "Ana G." },
  { id: 103, videoId: "BIQrxjV7aEA", titulo: "Summertime Sadness", artista: "Lana Del Rey", usuario_nombre: "Pedro R." },
  { id: 104, videoId: "doWWkG2gPPE", titulo: "Hello", artista: "Adele", usuario_nombre: "Maria L." },
];

const CANCION_ACTUAL = {
  id: 999,
  videoId: "nwzRwv47U38",
  titulo: "Flowers",
  artista: "Miley Cyrus",
  usuario_nombre: "Laura V.",
};

const KaraokeTVDemo = () => {
  const playerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const [isLayoutFullscreen, setIsLayoutFullscreen] = useState(false);
  const [queue, setQueue] = useState(COLA_DEMO);
  const [nowPlaying, setNowPlaying] = useState(CANCION_ACTUAL);
  const [isPreparing, setIsPreparing] = useState(true);
  const [countdown, setCountdown] = useState(15);
  const [showInfo, setShowInfo] = useState(true);
  const [hora, setHora] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [glowColor, setGlowColor] = useState('#00f2ff');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'f') setIsLayoutFullscreen(prev => !prev);
      if (key === '+' || key === 't') setCountdown(prev => prev + 30);
      if (key === 's') setCountdown(0);
      if (key === 'n') handleVideoEnd();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Info bar auto-hide
  const resetInfoTimer = () => {
    setShowInfo(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowInfo(false), 10000);
  };

  useEffect(() => {
    resetInfoTimer();
    return () => clearTimeout(hideTimerRef.current);
  }, [nowPlaying]);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setHora(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000);
    const colors = ['#00f2ff', '#bd00ff', '#ff0055'];
    let i = 0;
    const c = setInterval(() => { setGlowColor(colors[i]); i = (i + 1) % 3; }, 3000);
    return () => { clearInterval(t); clearInterval(c); };
  }, []);

  // Countdown
  useEffect(() => {
    let interval = null;
    if (isPreparing && countdown > 0) {
      interval = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && isPreparing) {
      setIsPreparing(false);
      resetInfoTimer();
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      }
    }
    return () => clearInterval(interval);
  }, [isPreparing, countdown]);

  const handleVideoEnd = () => {
    if (queue.length > 0) {
      const next = queue[0];
      const remaining = queue.slice(1);
      setNowPlaying(next);
      setQueue([...remaining, { ...CANCION_ACTUAL, id: Date.now() }]);
      setIsPreparing(true);
      setCountdown(15);
      setIsLayoutFullscreen(false);
    } else {
      setCountdown(15);
      setIsPreparing(true);
    }
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    if (isPreparing) {
      event.target.mute();
      event.target.pauseVideo();
      event.target.seekTo(0);
    } else {
      event.target.playVideo();
    }
  };

  const videoBorderStyle = {
    ...styles.videoContainer,
    borderColor: glowColor,
    boxShadow: `0 0 0 2px ${glowColor}33, 0 0 60px ${glowColor}55, 0 0 120px ${glowColor}22`,
    transition: 'border-color 1.2s ease, box-shadow 1.2s ease',
  };

  return (
    <div style={styles.container}>
      {/* Background */}
      <div style={styles.background}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
      </div>

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '20px', letterSpacing: '0px', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif' }}>
            <Mic2 size={18} color="#00f2ff" />
            Vo<span style={{ color: '#00f2ff' }}>kara</span>
          </div>
          <span style={styles.badgeDemo}>DEMO</span>
        </div>
        <div style={styles.topBarRight}>
          <span style={styles.shortcutsHint}>[S] saltar · [N] siguiente · [F] fullscreen</span>
          <div onClick={() => setIsLayoutFullscreen(!isLayoutFullscreen)} style={styles.fullscreenBtn} title="Pantalla completa (F)">
            {isLayoutFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </div>
          <div style={styles.clock}>
            <Clock size={16} />
            <span>{hora}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>

        {/* VIDEO COLUMN */}
        <div style={{ ...styles.leftColumn, flex: isLayoutFullscreen ? 1 : 7, transition: 'flex 0.5s ease' }}>
          <motion.div layout style={videoBorderStyle} onClick={resetInfoTimer}>

            {/* PREP OVERLAY */}
            <AnimatePresence>
              {isPreparing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.4 } }}
                  style={styles.prepOverlay}
                >
                  <div style={styles.prepContent}>
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                      style={styles.prepAvatar}
                    >
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(nowPlaying.usuario_nombre || 'U')}&background=random&size=160`}
                        alt="avatar"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </motion.div>

                    <p style={styles.prepLabel}>PRÓXIMO TURNO</p>
                    <h1 style={styles.prepUser}>{nowPlaying.usuario_nombre}</h1>
                    <p style={styles.prepSong}>{nowPlaying.titulo}</p>
                    {nowPlaying.artista && <p style={styles.prepArtist}>{nowPlaying.artista}</p>}

                    {/* Countdown ring */}
                    <div style={{ position: 'relative', margin: '30px 0' }}>
                      <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                        <circle
                          cx="80" cy="80" r="68"
                          fill="none"
                          stroke={glowColor}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 68}`}
                          strokeDashoffset={`${2 * Math.PI * 68 * (1 - countdown / 15)}`}
                          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 1.2s ease', filter: `drop-shadow(0 0 10px ${glowColor})` }}
                        />
                      </svg>
                      <div style={styles.countdownInner}>
                        <span style={{ ...styles.countdownNumber, color: glowColor }}>{countdown}</span>
                        <span style={styles.countdownSec}>seg</span>
                      </div>
                    </div>

                    <div style={styles.controlsPrep}>
                      <button onClick={() => setCountdown(c => c + 30)} style={styles.btnSecundario}>
                        <PlusCircle size={18} /> +30s
                      </button>
                      <button onClick={() => setCountdown(0)} style={{ ...styles.btnPrimario, background: glowColor }}>
                        <PlayCircle size={18} /> Comenzar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* YOUTUBE */}
            <div style={styles.youtubeWrapper}>
              <YouTube
                videoId={nowPlaying.videoId}
                opts={{ height: '100%', width: '100%', playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0 } }}
                onReady={onPlayerReady}
                onEnd={handleVideoEnd}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* INFO BAR */}
            {!isPreparing && (
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: showInfo ? 0 : 80, opacity: showInfo ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                style={styles.infoBar}
                onClick={resetInfoTimer}
              >
                <div style={{ ...styles.infoAccent, background: glowColor, boxShadow: `0 0 20px ${glowColor}` }} />
                <div style={styles.infoText}>
                  <span style={{ ...styles.nowPlayingBadge, color: glowColor }}>● REPRODUCIENDO AHORA</span>
                  <h2 style={styles.songTitle}>{nowPlaying.titulo}</h2>
                  <div style={styles.artistRow}>
                    <span style={styles.artistName}>{nowPlaying.artista || ''}</span>
                  </div>
                  <div style={styles.singerRow}>
                    <Mic2 size={18} color="#00f2ff" />
                    <span style={styles.singerName}>{nowPlaying.usuario_nombre}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleVideoEnd(); }} style={styles.skipBtn}>
                  <FastForward size={22} />
                </button>
              </motion.div>
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
              {/* NOW PLAYING CARD */}
              <div style={styles.glassCard}>
                <div style={styles.cardHeader}>
                  <Sparkles size={16} color="#ffd700" />
                  <span>{isPreparing ? 'PREPARANDO' : 'EN ESCENA'}</span>
                </div>
                <p style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1.2, marginBottom: '6px', color: '#fff' }}>
                  {nowPlaying.titulo}
                </p>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>{nowPlaying.artista}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f2ff', fontWeight: '700', fontSize: '14px' }}>
                  <Mic2 size={14} color="#00f2ff" /> {nowPlaying.usuario_nombre}
                </div>
              </div>

              {/* QUEUE CARD */}
              <div style={{ ...styles.glassCard, flex: 1, overflow: 'hidden' }}>
                <div style={styles.cardHeader}>
                  <Music size={14} color="#bd00ff" />
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
                      {queue.slice(0, 5).map((item, idx) => (
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
                              <span>{item.usuario_nombre}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>

              {/* QR CARD */}
              <div style={styles.qrCard}>
                <p style={styles.qrLabel}>Escanea y pide tu canción</p>
                <div style={styles.qrInner}>
                  <QRCode value="https://vokara.app/bar/demo" size={120} bgColor="#ffffff" fgColor="#0a0a0a" />
                </div>
                <p style={styles.qrSubLabel}>vokara.app/bar/demo</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  container: {
    height: '100vh', width: '100vw',
    background: '#050505', color: 'white',
    fontFamily: '"Inter", sans-serif',
    position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  background: {
    position: 'absolute', inset: 0, zIndex: 0,
    background: 'radial-gradient(ellipse at 30% 20%, #1a0b2e 0%, #000 70%)'
  },
  blob1: {
    position: 'absolute', top: '-15%', left: '-10%',
    width: '50vw', height: '50vw',
    background: '#bd00ff', filter: 'blur(180px)', opacity: 0.18, borderRadius: '50%', pointerEvents: 'none'
  },
  blob2: {
    position: 'absolute', bottom: '-15%', right: '-10%',
    width: '50vw', height: '50vw',
    background: '#00f2ff', filter: 'blur(180px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none'
  },

  // --- TOP BAR ---
  topBar: {
    height: '44px', padding: '0 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 50, flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)'
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  badgeDemo: {
    fontSize: '10px', letterSpacing: '2px', fontWeight: '700',
    background: 'rgba(255,215,0,0.1)', padding: '3px 10px', borderRadius: '20px',
    color: '#ffd700', border: '1px solid rgba(255,215,0,0.2)',
  },
  shortcutsHint: {
    fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px',
  },
  fullscreenBtn: {
    cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center',
    padding: '6px', borderRadius: '8px', transition: 'color 0.2s',
  },
  clock: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '16px', fontWeight: '600', color: '#888', letterSpacing: '0.5px'
  },

  // --- LAYOUT ---
  mainContent: {
    flex: 1, display: 'flex', padding: '16px 20px 20px',
    position: 'relative', zIndex: 10, minHeight: 0, gap: '20px'
  },
  leftColumn: { display: 'flex', flexDirection: 'column', minWidth: 0 },

  // --- VIDEO ---
  videoContainer: {
    flex: 1, background: '#000', borderRadius: '20px', overflow: 'hidden',
    position: 'relative', border: '2px solid #00f2ff',
    display: 'flex', flexDirection: 'column', cursor: 'pointer'
  },
  youtubeWrapper: { width: '100%', height: '100%', pointerEvents: 'none' },

  // --- INFO BAR ---
  infoBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '80px 40px 32px 52px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.99) 0%, rgba(0,0,0,0.88) 55%, transparent 100%)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px',
  },
  infoAccent: {
    position: 'absolute', left: '32px', bottom: '32px',
    width: '4px', height: '80px', borderRadius: '4px',
    transition: 'background 1.2s ease, box-shadow 1.2s ease',
  },
  nowPlayingBadge: {
    fontSize: '10px', fontWeight: '800', letterSpacing: '3px',
    textTransform: 'uppercase', marginBottom: '2px', transition: 'color 1.2s ease',
  },
  infoText: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 },
  songTitle: {
    fontSize: '5vw', fontWeight: '900', lineHeight: 1, margin: 0,
    color: '#fff', textShadow: '0 2px 40px rgba(0,0,0,0.9)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    letterSpacing: '0px',
    fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif',
  },
  artistRow: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 },
  artistName: {
    fontSize: '1.6vw', color: '#bbb', fontWeight: '500',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  singerRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
  singerName: {
    fontSize: '1.3vw', color: '#00f2ff', fontWeight: '700',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.5px',
  },
  skipBtn: {
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', width: '56px', height: '56px', borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)', transition: '0.2s', flexShrink: 0, marginLeft: '20px'
  },

  // --- PREP OVERLAY ---
  prepOverlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 50% 40%, rgba(30,0,60,0.97) 0%, rgba(0,0,0,0.98) 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(24px)', zIndex: 20, cursor: 'default'
  },
  prepContent: {
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px'
  },
  prepAvatar: {
    width: '110px', height: '110px', borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.2)',
    boxShadow: '0 0 40px rgba(0,242,255,0.3)',
    marginBottom: '20px', overflow: 'hidden', background: '#111'
  },
  prepLabel: {
    color: '#00f2ff', letterSpacing: '5px', fontSize: '1.2vh',
    fontWeight: '700', margin: '0 0 8px', textTransform: 'uppercase'
  },
  prepUser: {
    fontSize: '9vh', fontWeight: '900', margin: '0 0 8px', lineHeight: 1,
    color: '#fff', textShadow: '0 0 60px rgba(255,255,255,0.3)',
    fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif',
    letterSpacing: '0px',
  },
  prepSong: {
    fontSize: '3.2vh', color: '#eee', margin: '0 0 4px', fontWeight: '700',
    fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif'
  },
  prepArtist: { fontSize: '1.8vh', color: '#777', margin: 0, fontWeight: '500' },
  countdownInner: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  countdownNumber: {
    fontSize: '13vh', fontWeight: '900', lineHeight: 1,
    fontFamily: '"Bigger Display", "Big Shoulders Display", monospace'
  },
  countdownSec: { fontSize: '1.6vh', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' },
  controlsPrep: { display: 'flex', gap: '14px', marginTop: '10px' },
  btnPrimario: {
    border: 'none', padding: '14px 28px', borderRadius: '50px',
    fontWeight: '800', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1vw',
    color: '#000', letterSpacing: '0.5px'
  },
  btnSecundario: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', padding: '14px 28px', borderRadius: '50px',
    fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1vw'
  },

  // --- SIDEBAR ---
  rightColumn: {
    display: 'flex', flexDirection: 'column', gap: '16px',
    width: '320px', minWidth: '280px', maxWidth: '360px', overflow: 'hidden', flexShrink: 0
  },
  glassCard: {
    flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
    padding: '18px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '11px', fontWeight: '800', color: '#666',
    marginBottom: '14px', letterSpacing: '2px', textTransform: 'uppercase', flexShrink: 0
  },
  queueContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' },
  emptyQueue: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', color: '#555'
  },
  queueItem: {
    background: 'rgba(255,255,255,0.04)', padding: '12px 14px',
    borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  queueItemNext: {
    background: 'rgba(255,215,0,0.05)',
    border: '1px solid rgba(255,215,0,0.18)',
    boxShadow: '0 0 20px rgba(255,215,0,0.06)',
  },
  nextUpLabel: {
    fontSize: '9px', fontWeight: '800', letterSpacing: '2.5px',
    color: '#ffd700', marginBottom: '3px', textTransform: 'uppercase',
  },
  rank: {
    width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '13px', flexShrink: 0
  },
  qTitle: {
    fontWeight: '700', fontSize: '14px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    color: '#fff', marginBottom: '2px'
  },
  qArtist: {
    fontSize: '11px', color: '#666',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px'
  },
  qUser: {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '12px', color: '#00f2ff', fontWeight: '600',
    whiteSpace: 'nowrap', overflow: 'hidden'
  },

  // --- QR CARD ---
  qrCard: {
    background: 'rgba(0,242,255,0.04)', borderRadius: '20px',
    border: '1px solid rgba(0,242,255,0.12)',
    padding: '18px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '10px', flexShrink: 0,
    boxShadow: '0 0 40px rgba(0,242,255,0.05)',
  },
  qrLabel: {
    fontSize: '10px', fontWeight: '800', letterSpacing: '2px',
    color: '#00f2ff', textTransform: 'uppercase', margin: 0, opacity: 0.85,
  },
  qrInner: {
    background: '#fff', padding: '10px', borderRadius: '12px',
    boxShadow: '0 0 40px rgba(0,242,255,0.2)'
  },
  qrSubLabel: {
    fontSize: '10px', color: '#555', margin: 0, letterSpacing: '0.5px', fontFamily: 'monospace',
  },
};

export default KaraokeTVDemo;
