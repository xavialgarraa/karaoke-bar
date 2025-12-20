import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Sparkles, QrCode, Clock, PlayCircle, SkipForward, Plus } from 'lucide-react';
import YouTube from 'react-youtube';

// --- DATOS REALES DE YOUTUBE (KARAOKE) ---
// Aumentamos la lista inicial para que no se quede corta visualmente
const COLA_DEMO = [
  { id: 101, videoId: "fJ9rUzIMcZQ", titulo: "Bohemian Rhapsody", artista: "Queen", usuario: "Carlos M.", imagen: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg" },
  { id: 102, videoId: "JGwWNGJdvx8", titulo: "Shape of You", artista: "Ed Sheeran", usuario: "Ana G.", imagen: "https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg" },
  { id: 103, videoId: "TdrL3QxjyVw", titulo: "Summertime Sadness", artista: "Lana Del Rey", usuario: "Pedro R.", imagen: "https://img.youtube.com/vi/TdrL3QxjyVw/hqdefault.jpg" },
  { id: 104, videoId: "YQHsXMglC9A", titulo: "Hello", artista: "Adele", usuario: "Maria L.", imagen: "https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg" },
];

const CANCION_ACTUAL = {
  id: 999,
  videoId: "G7KNmW9a75Y", 
  titulo: "Flowers",
  artista: "Miley Cyrus",
  usuario: "Laura V.",
  imagen: "https://img.youtube.com/vi/G7KNmW9a75Y/hqdefault.jpg"
};

const MENSAJES_TICKER = [
  "🍸 ¡2x1 en Mojitos hasta las 11!",
  "🎤 Pide tu turno escaneando el QR",
  "⭐ ¡Sube al escenario y brilla!",
  "📸 Etiquétanos en Instagram: @TuBarKaraoke"
];

const KaraokeTV = () => {
  // Estados Principales
  const [queue, setQueue] = useState(COLA_DEMO);
  const [nowPlaying, setNowPlaying] = useState(CANCION_ACTUAL);
  const [glowColor, setGlowColor] = useState('#ff00ff');
  
  // Estados de Control
  const [hora, setHora] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [isPreparing, setIsPreparing] = useState(true);
  const [countdown, setCountdown] = useState(60); 
  const [isFullscreen, setIsFullscreen] = useState(false); 
  
  const playerRef = useRef(null);

  // --- 1. ATAJOS DE TECLADO (DJ CONTROLS) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      // 'F': Fullscreen
      if (key === 'f') setIsFullscreen(prev => !prev);
      // '+': Añadir 30s
      if (key === '+' || key === 't') setCountdown(prev => prev + 30);
      // 'S': Skip Countdown (Saltar espera)
      if (key === 's') setCountdown(0);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- 2. RELOJ ---
  useEffect(() => {
    const timer = setInterval(() => {
      setHora(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 3. CUENTA ATRÁS ---
  useEffect(() => {
    let interval = null;
    if (isPreparing && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsPreparing(false);
      // Auto-reproducir al terminar
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
    }
    return () => clearInterval(interval);
  }, [isPreparing, countdown]);

  // --- 4. GESTIÓN DE COLA (AL TERMINAR VIDEO) ---
  const handleVideoEnd = () => {
    if (queue.length > 0) {
      const siguiente = queue[0];
      const nuevaCola = queue.slice(1);
      
      const relleno = { 
        id: Date.now(), 
        videoId: "k-q72zD78cM", 
        titulo: "Sweet Caroline", 
        artista: "Neil Diamond", 
        usuario: "Cliente Nuevo", 
        imagen: "https://img.youtube.com/vi/k-q72zD78cM/hqdefault.jpg"
      };

      setNowPlaying(siguiente);
      setQueue([...nuevaCola, relleno]);
      
      setCountdown(60);
      setIsPreparing(true);
      setIsFullscreen(false); 
    } else {
      // Reiniciar demo si se vacía
      setCountdown(60);
      setIsPreparing(true);
    }
  };

  const youtubeOpts = {
    height: '100%',
    width: '100%',
    playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0 },
  };

  const onReady = (event) => {
    playerRef.current = event.target;
  };

  // Ciclo Neon
  useEffect(() => {
    const colors = ['#ff00ff', '#00ffff', '#ff0080', '#8000ff', '#00ff80'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % colors.length;
      setGlowColor(colors[index]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      
      {/* FONDO ANIMADO */}
      <div style={styles.background}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
      </div>

      {/* RELOJ + INDICADORES */}
      <div style={styles.clockContainer}>
        <Clock size={28} color="#fff" style={{ marginRight: '10px' }} />
        <span>{hora}</span>
        {isFullscreen && <span style={{ marginLeft: '15px', color: '#00f2ff', fontSize: '14px' }}>[MODO CINE]</span>}
      </div>

      {/* CONTROLES VISUALES (HINT) */}
      {isPreparing && (
        <div style={styles.shortcutsHint}>
          <span>[S] Saltar</span>
          <span>[+] +30s</span>
          <span>[F] Pantalla Grande</span>
        </div>
      )}

      {/* GRID PRINCIPAL */}
      <div style={{
        ...styles.mainGrid,
        paddingBottom: isFullscreen ? '0px' : '80px' 
      }}>
        
        {/* === IZQUIERDA: VIDEO PLAYER === */}
        <div style={{
          ...styles.leftColumn,
          flex: isFullscreen ? 1 : 3, 
          transition: 'all 0.5s ease'
        }}>
          <motion.div
            style={{ 
              ...styles.videoContainer,
              boxShadow: `0 0 80px ${glowColor}40`,
              borderRadius: isFullscreen ? '0px' : '24px', 
              border: isFullscreen ? 'none' : '1px solid rgba(255,255,255,0.1)'
            }}
            animate={{ boxShadow: `0 0 80px ${glowColor}40` }}
            transition={{ duration: 1 }}
          >
            {/* CAPA DE PREPARACIÓN */}
            <AnimatePresence>
              {isPreparing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
                  style={styles.prepOverlay}
                >
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    style={styles.prepContent}
                  >
                    <h2 style={{ fontSize: '30px', color: '#00f2ff', textTransform: 'uppercase', letterSpacing: '4px' }}>
                      Siguiente Turno
                    </h2>
                    <h1 style={{ fontSize: '80px', margin: '10px 0', lineHeight: 1 }}>
                      {nowPlaying.usuario}
                    </h1>
                    <p style={{ fontSize: '24px', color: '#ccc', marginBottom: '30px' }}>
                      {nowPlaying.titulo} - {nowPlaying.artista}
                    </p>
                    
                    <div style={styles.countdownCircle}>
                      <span style={{ fontSize: '100px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {countdown}
                      </span>
                      <span style={{ fontSize: '20px', textTransform: 'uppercase' }}>Segundos</span>
                    </div>

                    <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                       <p style={{ fontSize: '18px', color: '#ff0080', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PlayCircle /> ¡Acércate al escenario!
                      </p>
                      
                      {/* --- NUEVO BOTÓN SALTAR --- */}
                      <button 
                        onClick={() => setCountdown(0)}
                        style={styles.skipButton}
                      >
                        <SkipForward size={20} /> SALTAR AHORA
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* YOUTUBE */}
            <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                <YouTube 
                  videoId={nowPlaying.videoId} 
                  opts={youtubeOpts} 
                  onReady={onReady}
                  onEnd={handleVideoEnd}
                  style={{ width: '100%', height: '100%' }}
                />
            </div>

            {!isPreparing && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                style={styles.videoOverlay}
              >
                <div style={styles.nowPlayingInfo}>
                  <div style={styles.coverArt}>
                      <img src={nowPlaying.imagen} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={styles.songTitleBig}>{nowPlaying.titulo}</h3>
                    <div style={styles.artistInfo}>
                      <span style={{ color: '#aaa' }}>{nowPlaying.artista}</span>
                      <span style={{ margin: '0 15px', opacity: 0.3 }}>|</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Mic2 size={24} color="#00f2ff" />
                          <span>Cantando: <b style={{ color: '#00f2ff' }}>{nowPlaying.usuario}</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* === DERECHA: SIDEBAR === */}
        <div style={{
           ...styles.rightColumnWrapper,
           width: isFullscreen ? '0px' : '25%',
           opacity: isFullscreen ? 0 : 1,
           minWidth: isFullscreen ? '0px' : '320px',
           margin: isFullscreen ? '0' : '0 0 0 25px'
        }}>
          <div style={styles.rightColumnContent}>
            
            {/* CARD 1 */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Sparkles size={14} color="#ffd700" /> 
                <span style={{ color: '#ffd700', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>
                  {isPreparing ? "Preparando..." : "En el escenario"}
                </span>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '5px' }}>
                  {nowPlaying.titulo}
              </p>
              <p style={{ color: '#00f2ff', fontWeight: '500', fontSize: '18px' }}>
                 🎤 {nowPlaying.usuario}
              </p>
            </div>

            {/* CARD 2: COLA (Corregido para ver más items) */}
            <div style={{ ...styles.card, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '6px', height: '24px', backgroundColor: '#bd00ff', borderRadius: '4px' }}></span>
                Siguientes
              </h2>
              
              <div style={styles.queueList}>
                <AnimatePresence mode="popLayout">
                  {/* Aseguramos mostrar 3 items */}
                  {queue.slice(0, 3).map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      style={styles.queueItem}
                    >
                      <div style={styles.rankNumber}>
                        {index + 1}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.titulo}
                        </p>
                        <p style={{ fontSize: '12px', color: '#bd00ff' }}>
                          👤 {item.usuario}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* CARD 3: QR (Hacemos un poco más compacto para dejar sitio a la lista) */}
            <div style={styles.qrCard}>
              <div style={{ background: 'white', padding: '8px', borderRadius: '10px', width: 'fit-content', margin: '0 auto 10px auto' }}>
                  <QrCode size={80} color="black" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '16px' }}>¡Pide tu canción!</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '2px' }}>
                  Escanea ahora
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER: MARQUESINA */}
      {!isFullscreen && (
        <div style={styles.tickerContainer}>
          <motion.div
            style={{ display: 'flex', whiteSpace: 'nowrap' }}
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...MENSAJES_TICKER, ...MENSAJES_TICKER, ...MENSAJES_TICKER].map((msg, idx) => (
              <span key={idx} style={styles.tickerItem}>
                <span style={{ color: '#00f2ff', fontSize: '24px', marginRight: '10px' }}>★</span> 
                {msg}
              </span>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- ESTILOS INLINE ---
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #1a0b2e 0%, #000000 50%, #0d2b2e 100%)',
    zIndex: 0,
  },
  blob1: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    width: '400px',
    height: '400px',
    background: 'rgba(189, 0, 255, 0.3)',
    borderRadius: '50%',
    filter: 'blur(100px)',
  },
  blob2: {
    position: 'absolute',
    bottom: '10%',
    right: '20%',
    width: '400px',
    height: '400px',
    background: 'rgba(0, 242, 255, 0.3)',
    borderRadius: '50%',
    filter: 'blur(100px)',
  },
  clockContainer: {
    position: 'absolute',
    top: '30px',
    right: '30px',
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '10px 20px',
    borderRadius: '30px',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    backdropFilter: 'blur(10px)',
  },
  shortcutsHint: {
    position: 'absolute',
    top: '30px',
    left: '30px',
    zIndex: 50,
    color: 'rgba(255,255,255,0.3)',
    fontSize: '12px',
    display: 'flex',
    gap: '15px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  mainGrid: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    height: '100%',
    padding: '25px', 
    boxSizing: 'border-box',
    transition: 'all 0.5s ease',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  rightColumnWrapper: {
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.5s ease',
    overflow: 'hidden', 
  },
  rightColumnContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
    width: '100%', 
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    transition: 'all 0.5s ease', 
  },
  prepOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  prepContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  countdownCircle: {
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    border: '10px solid #00f2ff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 50px rgba(0, 242, 255, 0.5)',
    background: 'radial-gradient(circle, rgba(0,242,255,0.1) 0%, transparent 70%)',
  },
  skipButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '10px 20px',
    borderRadius: '30px',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.3s',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '30px',
    background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.9) 60%, transparent 100%)',
  },
  nowPlayingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '25px',
  },
  coverArt: {
    width: '100px',
    height: '100px',
    borderRadius: '15px',
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  songTitleBig: {
    fontSize: '48px',
    fontWeight: '800',
    margin: 0,
    marginBottom: '10px',
    lineHeight: 1,
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  artistInfo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '24px',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '20px', // Reducido un poco para ganar espacio
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    flexShrink: 0, // Evita que se aplaste
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  queueList: {
    flex: 1,
    overflowY: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  queueItem: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '16px',
    padding: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  rankNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    boxShadow: '0 4px 10px rgba(0, 114, 255, 0.3)',
  },
  qrCard: {
    background: 'linear-gradient(135deg, #bd00ff 0%, #ff0055 100%)',
    borderRadius: '24px',
    padding: '15px',
    boxShadow: '0 10px 40px rgba(189, 0, 255, 0.3)',
    flexShrink: 0,
  },
  tickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60px',
    background: 'linear-gradient(90deg, #240b36 0%, #c31432 100%)',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 20,
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  tickerItem: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 40px',
    display: 'flex',
    alignItems: 'center',
  },
};

export default KaraokeTV;