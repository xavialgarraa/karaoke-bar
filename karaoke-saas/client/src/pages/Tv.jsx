import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Sparkles, Clock, PlayCircle, FastForward, Music, Power, PlusCircle } from 'lucide-react';
import { Minimize2, Maximize2 } from 'lucide-react';
import YouTube from 'react-youtube';
import QRCode from 'react-qr-code';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_CLIENT_URL || "http://localhost:3001";

// Canciones de relleno para cuando no hay nadie (Música de ambiente)
const RELLENO_PLAYLIST = [
  {
    id: 'relleno1',
    videoId: "GkTWxDB21cA",
    titulo: "La Perla",
    artista: "ROSALÍA, Yahirza Y Su Esencia",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/RCa3GGkdV4VkcWRejz5S04kgItRHEdFR-6w8v6hcKwnftst_iqMJzaMCoodpQcMoCsElGNHw=s48-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno2',
    videoId: "86I4mj_OrVE",
    titulo: "Dardos",
    artista: "Romeo Santos, Prince Royce",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/H8O0B3UTLsIgqLbVCZp0o3NkMjxY6GrURFWvOq-uC4ERZ7ZroBV0bb8NzJFGPXmDxlUXjw12=s48-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno3',
    videoId: "9Iou2gjCGnI",
    titulo: "Si Te Vas...",
    artista: "Extremoduro",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/ytc/AIdro_lphuJRXQZpN47v8z-SQPHcafJXQumGI-4VYnaJY3YG5w=s48-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno4',
    videoId: "KytEwsCgWKw",
    titulo: "¿Y si lo hacemos?",
    artista: "Dani Fernández feat. Valeria Castro",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/ytc/AIdro_kCUKHrVyYmMHCXb0sUsc9VmLaqIWlGI8bciYMBg7-3W2I=s88-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno5',
    videoId: "N79cL5n_xnc",
    titulo: "LOVE",
    artista: "Clarent",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/WqaA_2Zfq44Wmaa7lgFh2U7LkYXzeiL7nS8ieQ2AKcL0Gq9MelIYtmqNJ345UAzOA8zFZgUV=s48-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno6',
    videoId: "qNw8ejrI0nM",
    titulo: "Daddy Yankee: Bzrp Music Sessions, Vol. 066",
    artista: "Bizarrap, Daddy Yankee",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/ytc/AIdro_mNZSMdkc4CTHZ0bqb6QmQ75yTTlM1QZS006aXkyuxZvHs=s88-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno7',
    videoId: "vz_vU53JvvI",
    titulo: "SUPERSTRELLA",
    artista: "Aitana",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/UaCWYz85AUDEb7IEDwpLHSf5AFnoMO6cVzNctIwXfksiOM6nd3QEoN3Y5PSZzjI3X3cuBIZn=s48-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno8',
    videoId: "oIv_Y2RPQ_A",
    titulo: "Man I Need",
    artista: "Olivia Dean",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/-3vfeolO6awKVjD3xkHoo9ZA3lDk51NgjoLoOEaqwXcQ2aaCtYCtcTBmNHqX0bUdCKLjhgFJDA=s48-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno9',
    videoId: "8E6FxeimYso",
    titulo: "Golden",
    artista: "HUNTR/X, EJAE, AUDREY NUNA, REI AMI",
    usuario: "Tu Bar",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6MGyITRC61dnDw7muWFQPDAfRnJMHRAjn0yb0Lbn9LTP8T4OZAn2NfMP5F_fgVumwUiu6hh6pSytQH7C-neeXNIC-ddjwrhLvJVGQkm_V&s=10"
  },
  {
    id: 'relleno10',
    videoId: "JAivJHMPxYM",
    titulo: "Stay (If You Wanna Dance)",
    artista: "Myles Smith",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/vOr4O5Uj8x8WVNAOZ2x-eFNEBaTOD32oqORqq0EW1WCpeZl1zaWyMEq_TsoGi0h6EY6AfY9SZmQ=s48-c-k-c0x00ffffff-no-rj"
  },
  {
    id: 'relleno11',
    videoId: "eS4AEloW5kY",
    titulo: "CHUOS",
    artista: "Juseph, Quevedo",
    usuario: "Tu Bar",
    imagen: "https://yt3.ggpht.com/Y_f27q66GzDeVTjWZK0ZQx2_To8j3Zh2xNrIT6L_iQ201-jo45YazdBYM0R8oS3KZfoNWMVovA=s48-c-k-c0x00ffffff-no-rj"
  }
];

const KaraokeTV = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const socketRef = useRef(null);
  const playerRef = useRef(null);
  const [isLayoutFullscreen, setIsLayoutFullscreen] = useState(false);

  // --- ESTADOS ---
  const [hasStarted, setHasStarted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);

  // ESTADO DE RELLENO + REFERENCIA
  const [isFiller, setIsFiller] = useState(true);
  const isFillerRef = useRef(true);

  // ESTADO VISIBILIDAD DE INFO (TITULO)
  const [showInfo, setShowInfo] = useState(true);
  const infoTimeoutRef = useRef(null);

  const setFillerState = (estado) => {
      setIsFiller(estado);
      isFillerRef.current = estado;
  };

  const [isPreparing, setIsPreparing] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [hora, setHora] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [glowColor, setGlowColor] = useState('#00f2ff');

  // --- 1. FULLSCREEN CON TECLA 'F' ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'f') {
        setIsLayoutFullscreen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- 2. LOGICA OCULTAR INFO (10s) ---
  const resetInfoTimer = () => {
      setShowInfo(true);
      if (infoTimeoutRef.current) clearTimeout(infoTimeoutRef.current);
      infoTimeoutRef.current = setTimeout(() => {
          setShowInfo(false);
      }, 10000);
  };

  // Cada vez que cambia la canción, reiniciamos el timer
  useEffect(() => {
      resetInfoTimer();
      return () => clearTimeout(infoTimeoutRef.current);
  }, [nowPlaying]);


  // --- CARGAR DATOS ---
  const cargarCola = async () => {
    try {
        const res = await fetch(`${API_URL}/api/queue/${slug}`);
        const data = await res.json();

        if (data.length > 0) {
            const nextSong = data[0];
            const nextQueue = data.slice(1);

            setNowPlaying(prev => {
                if (prev && prev.id === nextSong.id) return prev;
                return nextSong;
            });

            setQueue(nextQueue);

            if (isFillerRef.current) {
                setFillerState(false);
                setIsPreparing(true);
                setCountdown(15);
            }
        } else {
            setQueue([]);
            if (!nowPlaying || isFillerRef.current) {
                if (!nowPlaying) pasarAModoRelleno();
            }
        }
    } catch (err) { console.error(err); }
  };

  const rellenoAleatorio = () => {
      const r = RELLENO_PLAYLIST[Math.floor(Math.random() * RELLENO_PLAYLIST.length)];
      return { ...r, id: `filler_${Date.now()}` };
  };

  const pasarAModoRelleno = () => {
      const nuevaRelleno = rellenoAleatorio();
      setNowPlaying(nuevaRelleno);
      setFillerState(true);
      setIsPreparing(false);
  };

  // --- SOCKETS ---
  useEffect(() => {
    if (!hasStarted) return;
    const tokenUrl = searchParams.get('t');
    const tokenLocal = localStorage.getItem('karaoke_token');

    socketRef.current = io(API_URL, {
        auth: { token: tokenUrl || tokenLocal }
    });

    socketRef.current.emit('unirse_bar', slug);
    cargarCola();

    socketRef.current.on('nueva_cancion_anadida', (nueva) => {
        if (isFillerRef.current) {
            setNowPlaying(nueva);
            setFillerState(false);
            setQueue([]);
            setIsPreparing(true);
            setCountdown(15);
        } else {
            setQueue(prev => {
                if (prev.find(p => p.id === nueva.id)) return prev;
                return [...prev, nueva];
            });
        }
    });

    socketRef.current.on('cambio_de_turno', () => {
        setTimeout(cargarCola, 1000);
    });

    return () => { if(socketRef.current) socketRef.current.disconnect(); };
  }, [slug, hasStarted]);

  // --- CONTROL VIDEO ---
  const handleVideoEnd = () => {
    if (!isFillerRef.current && nowPlaying) {
        socketRef.current.emit('admin_siguiente_cancion', { slug, idCancionActual: nowPlaying.id });
        if (queue.length > 0) {
            const next = queue[0];
            const remaining = queue.slice(1);
            setNowPlaying(next);
            setQueue(remaining);
            setIsPreparing(true);
            setCountdown(15);
        } else {
            pasarAModoRelleno();
        }
    } else {
        pasarAModoRelleno();
    }
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    if (isFiller) {
        event.target.unMute();
        event.target.playVideo();
    }
    if (isPreparing) {
        event.target.mute();
        event.target.pauseVideo();
        event.target.seekTo(0);
        setTimeout(() => event.target.unMute(), 500);
    } else {
        event.target.playVideo();
    }
  };

  useEffect(() => {
    let interval = null;
    if (isPreparing && countdown > 0) {
      interval = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    else if (countdown === 0 && isPreparing) {
      setIsPreparing(false);
      resetInfoTimer();
      if (playerRef.current) {
          playerRef.current.seekTo(0);
          playerRef.current.playVideo();
      }
    }
    return () => clearInterval(interval);
  }, [isPreparing, countdown]);

  useEffect(() => {
      const t = setInterval(() => setHora(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit'})), 1000);
      const colors = ['#00f2ff', '#bd00ff', '#ff0055'];
      let i = 0;
      const c = setInterval(() => { setGlowColor(colors[i]); i=(i+1)%3; }, 3000);
      return () => { clearInterval(t); clearInterval(c); };
  }, []);

  // --- RENDER ---
  if (!hasStarted) {
      return (
          <div style={styles.startScreen}>
            {/* Ambient blobs */}
            <div style={styles.blob1}></div>
            <div style={styles.blob2}></div>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={styles.startCard}
            >
              <div style={styles.startIconWrap}>
                <Mic2 size={48} color="#00f2ff" />
              </div>
              <h1 style={styles.startTitle}>Vo<span style={{ color: '#00f2ff' }}>kara</span></h1>
              <p style={styles.startSubtitle}>Sistema de karaoke en tiempo real</p>
              <p style={styles.startHint}>Presiona <kbd style={styles.kbd}>F</kbd> para pantalla completa</p>
              <button onClick={() => setHasStarted(true)} style={styles.startBtn}>
                <Power size={22} />
                <span>INICIAR SISTEMA</span>
              </button>
            </motion.div>
          </div>
      );
  }

  if (!nowPlaying) return <div style={styles.loading}>Cargando Playlist...</div>;

  // Animated glow border via inline keyframe trick: we drive it with glowColor state
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

      {/* Slim top bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '20px', letterSpacing: '0px', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif' }}>
            <Mic2 size={18} color="#00f2ff" />
            Vo<span style={{ color: '#00f2ff' }}>kara</span>
          </div>
          {isFiller && (
            <span style={styles.badgeFiller}>
              <span style={{ opacity: 0.7, fontSize: '10px' }}>●</span> AMBIENTE
            </span>
          )}
        </div>
        <div style={styles.topBarRight}>
          <div
            onClick={() => setIsLayoutFullscreen(!isLayoutFullscreen)}
            style={styles.fullscreenBtn}
            title="Pantalla completa (F)"
          >
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
          <motion.div
            layout
            style={videoBorderStyle}
            onClick={resetInfoTimer}
          >
            {/* PREP OVERLAY */}
            <AnimatePresence>
              {isPreparing && !isFiller && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.4 } }}
                  style={styles.prepOverlay}
                >
                  <div style={styles.prepContent}>
                    {/* Avatar */}
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
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

            {/* YOUTUBE PLAYER */}
            <div style={styles.youtubeWrapper}>
              <YouTube
                videoId={nowPlaying.video_id || nowPlaying.videoId}
                opts={{
                  height: '100%', width: '100%',
                  playerVars: { autoplay: isFiller ? 1 : 0, controls: 0, modestbranding: 1, rel: 0 }
                }}
                onReady={onPlayerReady}
                onEnd={handleVideoEnd}
                onError={() => setTimeout(handleVideoEnd, 3000)}
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
                {/* Colored left accent stripe */}
                <div style={{ ...styles.infoAccent, background: glowColor, boxShadow: `0 0 20px ${glowColor}` }} />
                <div style={styles.infoText}>
                  <span style={{ ...styles.nowPlayingBadge, color: glowColor }}>
                    ● REPRODUCIENDO AHORA
                  </span>
                  <h2 style={styles.songTitle}>{nowPlaying.titulo}</h2>
                  <div style={styles.artistRow}>
                    <span style={styles.artistName}>{nowPlaying.artista || ''}</span>
                  </div>
                  <div style={styles.singerRow}>
                    <Mic2 size={18} color="#00f2ff" />
                    <span style={styles.singerName}>
                      {nowPlaying.usuario_nombre || nowPlaying.usuario}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleVideoEnd(); }}
                  style={styles.skipBtn}
                >
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
              {/* QUEUE CARD */}
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
                          style={{
                            ...styles.queueItem,
                            ...(idx === 0 ? styles.queueItemNext : {}),
                          }}
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
                            {idx === 0 && (
                              <div style={styles.nextUpLabel}>SIGUIENTE</div>
                            )}
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

              {/* QR CARD */}
              <div style={styles.qrCard}>
                <p style={styles.qrLabel}>Escanea y pide tu canción</p>
                <div style={styles.qrInner}>
                  <QRCode value={`${window.location.origin}/bar/${slug}`} size={120} bgColor="#ffffff" fgColor="#0a0a0a" />
                </div>
                <p style={styles.qrSubLabel}>{window.location.host}/bar/{slug}</p>
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
    '--font-display': '"Bigger Display", "Big Shoulders Display", sans-serif',
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

  // --- START SCREEN ---
  startScreen: {
    width: '100vw', height: '100vh',
    background: 'radial-gradient(ellipse at 40% 40%, #1a0b2e 0%, #000 70%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden', zIndex: 100
  },
  startCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '32px',
    padding: '56px 64px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
    position: 'relative', zIndex: 10,
    maxWidth: '480px', width: '90%'
  },
  startIconWrap: {
    width: '90px', height: '90px', borderRadius: '50%',
    background: 'rgba(0,242,255,0.08)',
    border: '1px solid rgba(0,242,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 0 40px rgba(0,242,255,0.15)'
  },
  startTitle: {
    fontSize: '5vw', fontWeight: '900', letterSpacing: '-1px',
    margin: '0 0 12px', color: '#fff',
    fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif',
  },
  startSubtitle: {
    fontSize: '1.2vw', color: '#666', margin: '0 0 8px', textAlign: 'center'
  },
  startHint: {
    fontSize: '1vw', color: '#444', margin: '0 0 36px', textAlign: 'center'
  },
  kbd: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px', padding: '2px 8px', fontSize: '0.9em', color: '#aaa'
  },
  startBtn: {
    background: 'linear-gradient(135deg, #00f2ff, #0088ff)',
    border: 'none', padding: '16px 48px', borderRadius: '50px',
    fontSize: '1.1vw', fontWeight: '800', letterSpacing: '1px',
    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
    color: '#000', boxShadow: '0 0 40px rgba(0,242,255,0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s'
  },

  loading: {
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#000', color: '#fff', fontSize: '24px', fontFamily: '"Bigger Display", "Big Shoulders Display", "Inter", sans-serif'
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
  badgeFiller: {
    fontSize: '11px', letterSpacing: '2px', fontWeight: '700',
    background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '20px',
    color: '#888', border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', gap: '6px'
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
  singerRow: {
    display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'
  },
  singerName: {
    fontSize: '1.3vw', color: '#00f2ff', fontWeight: '700',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    letterSpacing: '0.5px',
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
    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '20px'
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
  prepSong: { fontSize: '3.2vh', color: '#eee', margin: '0 0 4px', fontWeight: '700', fontFamily: '"Bigger Display", "Big Shoulders Display", sans-serif' },
  prepArtist: { fontSize: '1.8vh', color: '#777', margin: 0, fontWeight: '500' },
  countdownInner: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  countdownNumber: { fontSize: '13vh', fontWeight: '900', lineHeight: 1, fontFamily: '"Bigger Display", "Big Shoulders Display", monospace' },
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
    fontSize: '10px', color: '#445', margin: 0, letterSpacing: '0.5px',
    fontFamily: 'monospace', color: '#555',
  },
};

export default KaraokeTV;
