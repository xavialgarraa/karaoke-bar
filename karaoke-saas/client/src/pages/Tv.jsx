import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Sparkles, Clock, PlayCircle, FastForward, Music, Power, PlusCircle } from 'lucide-react';
import { Minimize2, Maximize2, ExternalLink } from 'lucide-react';
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
      // Ocultar a los 10 segundos
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
      // Al terminar cuenta atrás, reseteamos timer de info
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
              <motion.div initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} style={{textAlign:'center'}}>
                <h1 style={{fontSize:'5vw', color:'#00f2ff', marginBottom:'20px', textShadow:'0 0 20px #00f2ff'}}>KARAOKE TV</h1>
                <p style={{color:'#aaa', marginBottom:'20px'}}>Presiona 'F' para Pantalla Completa</p>
                <button onClick={() => setHasStarted(true)} style={styles.startBtn}>
                    <Power size={30} /> INICIAR SISTEMA
                </button>
              </motion.div>
          </div>
      );
  }

  if (!nowPlaying) return <div style={styles.loading}>Cargando Playlist...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.background}>
         <div style={styles.blob1}></div>
         <div style={styles.blob2}></div>
      </div>

      <div style={styles.header}>
        <div style={styles.logo}>Karaoke<span style={{color:'#00f2ff'}}>Pro</span></div>
        <div style={styles.clock}>
            {/* Indicador visual del modo pantalla completa */}
            <div 
                onClick={() => setIsLayoutFullscreen(!isLayoutFullscreen)} 
                style={{cursor:'pointer', display:'flex', alignItems:'center', marginRight:'15px', color:'#aaa'}}
            >
                {isLayoutFullscreen ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
            </div>
            <Clock size={20} /> {hora}
            {isFiller && <span style={styles.badgeFiller}>AMBIENTE</span>}
        </div>
      </div>

      <div style={styles.mainContent}>
        
        {/* PLAYER - AÑADIDO onClick para reactivar info */}
        <div style={{ ...styles.leftColumn, flex: isLayoutFullscreen ? 1 : 3, transition: 'all 0.5s ease' }}>
          <motion.div 
            layout // Framer motion ayuda a animar el cambio de tamaño
            style={{...styles.videoContainer, boxShadow: `0 0 40px ${glowColor}40`, borderColor: glowColor}}
            animate={{boxShadow: `0 0 40px ${glowColor}60`}}
            onClick={resetInfoTimer}
          >
            <AnimatePresence>
              {isPreparing && !isFiller && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={styles.prepOverlay}
                >
                    <div style={styles.prepContent}>
                        <h2 style={styles.prepTitle}>PRÓXIMO TURNO</h2>
                        <h1 style={styles.prepUser}>{nowPlaying.usuario_nombre || nowPlaying.usuario}</h1>
                        <p style={styles.prepSong}>{nowPlaying.titulo}</p>
                        <div style={{...styles.countdownCircle, borderColor: glowColor, boxShadow:`0 0 30px ${glowColor}`}}>
                            <span style={styles.countdownNumber}>{countdown}</span>
                        </div>
                        <div style={styles.controlsPrep}>
                            <button onClick={() => setCountdown(c => c + 30)} style={styles.btnSecundario}><PlusCircle /> +30s</button>
                            <button onClick={() => setCountdown(0)} style={styles.btnPrimario}><PlayCircle /> CANTAR YA</button>
                        </div>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>

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
            
            {/* INFO BAR - MODIFICADO PARA OCULTARSE */}
            {!isPreparing && (
                <motion.div 
                    initial={{y:50, opacity:0}} 
                    // Si showInfo es false, bajamos la barra 100px y ponemos opacidad 0
                    animate={{ y: showInfo ? 0 : 100, opacity: showInfo ? 1 : 0 }} 
                    transition={{ duration: 0.5 }}
                    style={styles.infoBar}
                >
                      <div style={styles.infoText}>
                        <h2 style={styles.songTitle}>{nowPlaying.titulo}</h2>
                        <div style={styles.artistRow}>
                            <Mic2 size={24} color={isFiller ? '#aaa' : '#00f2ff'} />
                            <span style={{color: isFiller ? '#aaa' : '#fff'}}>
                                {nowPlaying.usuario_nombre || nowPlaying.usuario}
                            </span>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleVideoEnd(); }} style={styles.skipBtn}><FastForward /></button>
                </motion.div>
            )}
          </motion.div>
        </div>

        {/* COLA */}
        <AnimatePresence>
            {!isLayoutFullscreen && (
                <motion.div 
                    initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                    animate={{ width: 'auto', opacity: 1, marginLeft: '30px' }}
                    exit={{ width: 0, opacity: 0, marginLeft: 0 }}
                    transition={{ duration: 0.4 }}
                    style={styles.rightColumn}
                >
                    <div style={styles.glassCard}>
                        <div style={styles.cardHeader}><Sparkles color="#ffd700" size={18}/> EN COLA</div>
                        <div style={styles.queueContainer}>
                            {queue.length === 0 ? (
                                <div style={styles.emptyQueue}>
                                    <Music size={40} opacity={0.5} />
                                    <p style={{marginTop:'10px', fontSize:'14px'}}>Lista de espera vacía</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                {queue.slice(0, 5).map((item, idx) => (
                                    <motion.div 
                                        key={item.id || idx}
                                        initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}}
                                        style={styles.queueItem}
                                    >
                                        <div style={styles.rank}>{item.turno_numero || idx + 1}</div>
                                        <div style={{overflow:'hidden', flex:1}}>
                                            <div style={styles.qTitle}>{item.titulo}</div>
                                            <div style={styles.qUser}>{item.usuario_nombre || item.usuario}</div>
                                        </div>
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                    <div style={styles.qrCard}>
                        <div style={{background:'white', padding:'8px', borderRadius:'10px'}}>
                            <QRCode value={`${window.location.origin}/bar/${slug}`} size={100} />
                        </div>
                        <div style={{textAlign:'center', marginTop:'10px'}}>
                            <div style={{fontSize:'12px', letterSpacing:'2px', opacity:0.8, fontWeight:'bold'}}>ESCANEA PARA PEDIR</div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// --- ESTILOS RESPONSIVE (FLEXBOX) ---
const styles = {
    container: { height:'100vh', width:'100vw', background:'#050505', color:'white', fontFamily:'"Inter", sans-serif', position:'relative', display:'flex', flexDirection:'column', overflow:'hidden' },
    background: { position:'absolute', inset:0, zIndex:0, background:'radial-gradient(circle at 50% 50%, #1a0b2e 0%, #000 100%)' },
    blob1: { position:'absolute', top:'-10%', left:'-10%', width:'40vw', height:'40vw', background:'#bd00ff', filter:'blur(150px)', opacity:0.3, borderRadius:'50%' },
    blob2: { position:'absolute', bottom:'-10%', right:'-10%', width:'40vw', height:'40vw', background:'#00f2ff', filter:'blur(150px)', opacity:0.3, borderRadius:'50%' },
    startScreen: { width:'100vw', height:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:100 },
    loading: { height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000', color:'#fff' },
    header: { height:'70px', padding:'0 30px', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:50, borderBottom:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', flexShrink: 0 },
    logo: { fontSize:'24px', fontWeight:'900', letterSpacing:'-1px' },
    clock: { display:'flex', alignItems:'center', gap:'10px', fontSize:'20px', fontWeight:'600' },
    badgeFiller: { fontSize:'12px', background:'#222', padding:'4px 10px', borderRadius:'4px', color:'#aaa', border:'1px solid #444' },
    
    // MODIFICADO: Quitamos 'gap' fijo y añadimos justifyContent: center para cuando no hay barra lateral
    mainContent: { flex: 1, display:'flex', padding:'30px', position:'relative', zIndex:10, minHeight: 0, justifyContent: 'center' },
    
    leftColumn: { display:'flex', flexDirection:'column' },
    videoContainer: { flex:1, background:'#000', borderRadius:'24px', overflow:'hidden', position:'relative', border:'2px solid #333', display:'flex', flexDirection:'column', cursor: 'pointer' },
    youtubeWrapper: { width:'100%', height:'100%', pointerEvents:'none' },
    infoBar: { position:'absolute', bottom:0, left:0, right:0, padding:'30px', background:'linear-gradient(to top, rgba(0,0,0,0.95) 20%, transparent)', display:'flex', alignItems:'flex-end', justifyContent:'space-between', paddingBottom:'40px' },
    songTitle: { fontSize:'3vw', fontWeight:'800', lineHeight:1, margin:0, textShadow:'0 2px 10px rgba(0,0,0,0.5)', maxWidth:'80%' },
    artistRow: { display:'flex', alignItems:'center', gap:'10px', fontSize:'1.5vw', marginTop:'10px' },
    skipBtn: { background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', width:'60px', height:'60px', borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(5px)', transition: '0.2s' },
    prepOverlay: { position:'absolute', inset:0, background:'rgba(0,0,0,0.95)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(20px)', zIndex:20, cursor: 'default' },
    prepContent: { textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' },
    prepTitle: { color:'#00f2ff', letterSpacing:'5px', fontSize:'2vh', marginBottom:'10px' },
    prepUser: { fontSize:'8vh', fontWeight:'900', margin:0, lineHeight:1 },
    prepSong: { fontSize:'3vh', color:'#ccc', marginBottom:'30px' },
    countdownCircle: { width:'25vh', height:'25vh', borderRadius:'50%', border:'8px solid #00f2ff', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.3)', marginBottom:'30px' },
    countdownNumber: { fontSize:'10vh', fontWeight:'bold', fontFamily:'monospace' },
    controlsPrep: { display:'flex', gap:'15px' },
    
    // MODIFICADO: overflow hidden es importante para la animación de cierre
    rightColumn: { display:'flex', flexDirection:'column', gap:'20px', minWidth:'300px', maxWidth:'400px', overflow: 'hidden' },
    
    glassCard: { flex: 1, background:'rgba(255,255,255,0.05)', borderRadius:'24px', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(20px)', padding:'20px', display:'flex', flexDirection:'column', overflow: 'hidden' },
    cardHeader: { display:'flex', alignItems:'center', gap:'8px', fontSize:'14px', fontWeight:'bold', color:'#aaa', marginBottom:'15px', letterSpacing:'1px', flexShrink: 0 },
    queueContainer: { flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' },
    emptyQueue: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity:0.3 },
    queueItem: { background:'rgba(255,255,255,0.05)', padding:'12px', borderRadius:'16px', display:'flex', alignItems:'center', gap:'15px' },
    rank: { width:'30px', height:'30px', background:'#00f2ff', color:'#000', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'14px', flexShrink: 0 },
    qTitle: { fontWeight:'bold', fontSize:'16px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
    qUser: { fontSize:'12px', color:'#bd00ff' },
    qrCard: { background:'linear-gradient(135deg, #bd00ff 0%, #ff0055 100%)', borderRadius:'24px', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'0 10px 40px rgba(189,0,255,0.3)', flexShrink: 0 },
    startBtn: { background:'#00f2ff', border:'none', padding:'15px 40px', borderRadius:'50px', fontSize:'24px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', boxShadow:'0 0 30px rgba(0,242,255,0.5)' },
    btnPrimario: { background:'#00f2ff', border:'none', padding:'15px 30px', borderRadius:'30px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'18px' },
    btnSecundario: { background:'transparent', border:'1px solid rgba(255,255,255,0.3)', color:'white', padding:'15px 30px', borderRadius:'30px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', fontSize:'18px' }
};

export default KaraokeTV;