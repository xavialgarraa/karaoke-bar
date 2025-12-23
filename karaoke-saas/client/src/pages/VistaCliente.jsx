import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Search, User, Users, Camera, Plus, X, Home, RotateCcw, Music, CheckCircle, Clock, Smartphone, Shuffle, PartyPopper } from 'lucide-react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_CLIENT_URL || "http://localhost:3001";

const VistaCliente = () => {
  const params = useParams();
  const slug = params.slug || "DEMO";
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isDesktop) {
    return (
      <div style={desktopStyles.container}>
        <div style={desktopStyles.infoSide}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 style={desktopStyles.title}>Karaoke<span style={{color:'#00f2ff'}}>Pro</span></h1>
            <p style={desktopStyles.subtitle}>Escanea el QR y pide desde tu móvil.</p>
            <div style={desktopStyles.featureList}>
              <div style={desktopStyles.feature}>📱 Web App Nativa</div>
              <div style={desktopStyles.feature}>⚡ Tiempo Real</div>
              <div style={desktopStyles.feature}>⏳ Actualización de Espera</div>
            </div>
          </motion.div>
        </div>
        <div style={desktopStyles.phoneWrapper}>
            <div style={desktopStyles.phoneFrame}>
                <div style={desktopStyles.notch}></div>
                <div style={desktopStyles.screenContent}>
                    <AppContent slug={slug} isSimulator={true} />
                </div>
            </div>
        </div>
      </div>
    );
  }

  return <AppContent slug={slug} isSimulator={false} />;
};

// --- LÓGICA DE LA APP ---
const AppContent = ({ slug, isSimulator }) => {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // UI States
  const [step, setStep] = useState(1);
  const [buscando, setBuscando] = useState(false);
  
  // Data States
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [numSingers, setNumSingers] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  
  // TICKET STATE (Lo importante)
  const [enviado, setEnviado] = useState(false);
  const [miTicket, setMiTicket] = useState(null); // { turno: 55, cancion: {...} }
  const [estadoCola, setEstadoCola] = useState({ personasDelante: 0, tiempoEspera: 0, esMiTurno: false });

  const fileInputRef = useRef(null);

  // 1. CONEXIÓN SOCKET
  useEffect(() => {
    socketRef.current = io(API_URL);
    socketRef.current.emit('unirse_bar', slug);

    // A. CONFIRMACIÓN DE PEDIDO
    socketRef.current.on('turno_confirmado', (data) => {
        console.log("🎟️ Ticket recibido:", data);
        setMiTicket(data);
        setEnviado(true);
        setBuscando(false);
        actualizarEstadoCola(data.turno); // Calculamos posición inicial
    });

    // B. CAMBIO DE TURNO (Alguien cantó, la cola avanza)
    socketRef.current.on('cambio_de_turno', () => {
        console.log("🔄 La cola ha avanzado. Recalculando...");
        if (miTicket) {
            actualizarEstadoCola(miTicket.turno);
        }
    });

    socketRef.current.on('error_peticion', (msg) => { alert(msg); setBuscando(false); });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [slug, miTicket]); // Dependencia miTicket para poder usarlo dentro del evento

  // 2. FUNCIÓN INTELIGENTE: CALCULAR POSICIÓN
  const actualizarEstadoCola = async (miNumeroTurno) => {
      try {
          // Pedimos la cola actual al servidor
          const res = await fetch(`${API_URL}/api/queue/${slug}`);
          const cola = await res.json();
          
          if (cola.length > 0) {
              const turnoActual = cola[0].turno_numero; // El que está cantando ahora
              
              // Si mi turno es MENOR que el actual, es que ya pasé (me eliminaron o canté)
              if (miNumeroTurno < turnoActual) {
                  // Resetear app (o mostrar pantalla de "Gracias por cantar")
                  alert("¡Tu turno ha terminado! Esperamos que hayas brillado 🌟");
                  resetear();
                  return;
              }

              // Cálculos
              const diferencia = miNumeroTurno - turnoActual;
              
              if (diferencia === 0) {
                  // ¡ES AHORA!
                  setEstadoCola({ personasDelante: 0, tiempoEspera: 0, esMiTurno: true });
              } else {
                  // Aún falta
                  setEstadoCola({
                      personasDelante: diferencia,
                      tiempoEspera: diferencia * 4, // 4 min por canción aprox
                      esMiTurno: false
                  });
              }
          } else {
             // Si la cola está vacía pero yo tengo ticket... algo raro pasó o soy el siguiente
             if (miTicket) {
                 setEstadoCola({ personasDelante: 0, tiempoEspera: 0, esMiTurno: true });
             }
          }
      } catch (err) {
          console.error("Error actualizando estado:", err);
      }
  };

  // 3. BUSCADOR
  useEffect(() => {
    if (busqueda.length <= 2) { setResultados([]); setBuscando(false); return; }
    setBuscando(true);
    const delay = setTimeout(async () => {
        try {
          const res = await fetch(`${API_URL}/api/youtube/search?query=${encodeURIComponent(busqueda)}`);
          if (!res.ok) throw new Error("Error");
          const data = await res.json();
          setResultados(data.map(v => ({ id: v.id, titulo: v.titulo, artista: v.canal, cover: v.imagen })));
        } catch (error) { setResultados([]); } 
        finally { setBuscando(false); }
    }, 1500);
    return () => clearTimeout(delay);
  }, [busqueda]);

  // 4. ACCIONES
  const pedirAleatoria = async () => {
      setBuscando(true); setBusqueda("");
      try {
          const res = await fetch(`${API_URL}/api/catalog/random`);
          const song = await res.json();
          setResultados([{ id: song.video_id || song.id, titulo: song.titulo, artista: song.artista, cover: song.cover_url || song.imagen }]);
      } catch (err) { alert("Error buscando aleatoria"); } 
      finally { setBuscando(false); }
  };

  const pedirCancion = (cancion) => {
    if (!socketRef.current) return;
    setBuscando(true);
    const usuarioPayload = {
        nombre: nickname + (numSingers > 1 ? ` (+${numSingers-1})` : ''),
        avatar: avatar || `https://ui-avatars.com/api/?name=${nickname}&background=random`
    };
    socketRef.current.emit('pedir_cancion', {
      slug: slug, usuario: usuarioPayload,
      cancion: { videoId: cancion.id, titulo: cancion.titulo, artista: cancion.artista, cover: cancion.cover }
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const resetear = () => {
    setEnviado(false); setBusqueda(''); setMiTicket(null); setResultados([]); setEstadoCola({ personasDelante:0, tiempoEspera:0, esMiTurno:false });
  };

  const containerStyle = isSimulator ? styles.simulatorContainer : styles.container;

  return (
    <div style={containerStyle}>
      <div style={styles.background}></div>

      {/* Header */}
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={() => step === 2 && setStep(1)}>
            <Mic2 size={20} color="#00f2ff" />
            <span>Karaoke<span style={{ color: "#00f2ff" }}>Pro</span></span>
        </div>
        <div style={styles.barBadge}>{slug.toUpperCase()}</div>
      </nav>

      <div style={styles.mainContent}>
        <AnimatePresence mode='wait'>
          
          {/* PASO 1: PERFIL */}
          {step === 1 && (
            <motion.div 
              key="step1" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -50 }}
              style={styles.card}
            >
              <h2 style={styles.titleGradient}>¿Quién va a cantar?</h2>
              
              <div style={styles.avatarContainer} onClick={() => fileInputRef.current.click()}>
                <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handlePhotoUpload} />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{width:'100%', height:'100%'}}>
                    {avatar ? <img src={avatar} alt="avatar" style={styles.avatarImg} /> : (
                    <div style={styles.avatarPlaceholder}><Camera size={28} color="#fff" /><span style={{fontSize:'9px', marginTop:'4px', opacity:0.8}}>FOTO</span></div>
                    )}
                </motion.div>
                <div style={styles.plusBadge}><Plus size={10} color="#000" /></div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>TU NOMBRE ARTÍSTICO</label>
                <input type="text" placeholder="Ej: La Rosalía" style={styles.input} value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>MODO</label>
                <div style={styles.singerSelector}>
                  {[1, 2, 3].map(num => (
                    <motion.button key={num} whileTap={{ scale: 0.95 }} style={{...styles.singerBtn, ...(numSingers === num ? styles.singerBtnActive : {})}} onClick={() => setNumSingers(num)}>
                      {num === 1 ? <User size={16} /> : <Users size={16} />} {num === 1 ? 'Solo' : num === 2 ? 'Dúo' : 'Grupo'}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} style={{...styles.mainButton, opacity: nickname ? 1 : 0.5}} disabled={!nickname} onClick={() => setStep(2)}>
                ENTRAR AL CLUB
              </motion.button>
            </motion.div>
          )}

          {/* PASO 2: BUSCADOR */}
          {step === 2 && !enviado && (
            <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%' }}>
              <div style={styles.stickyHeader}>
                <div style={styles.miniProfile} onClick={() => setStep(1)}>
                  <img src={avatar || `https://ui-avatars.com/api/?name=${nickname}&background=random`} alt="mini" style={styles.miniAvatar} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:'10px', color:'#aaa', textTransform:'uppercase'}}>Cantando como</div>
                    <div style={{fontWeight:'bold', color:'white', fontSize:'14px'}}>{nickname}</div>
                  </div>
                  <div style={styles.editBtn}>Cambiar</div>
                </div>

                <div style={{display:'flex', gap:'10px'}}>
                    <div style={styles.searchWrapper}>
                        <Search style={styles.searchIcon} size={18} />
                        <input type="text" placeholder="Busca canción..." style={styles.searchInput} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} autoFocus />
                        {busqueda && <X size={18} style={{padding:'10px', cursor:'pointer'}} onClick={() => setBusqueda('')}/>}
                    </div>
                    <motion.button whileTap={{scale:0.9}} onClick={pedirAleatoria} style={styles.randomBtn} title="¡Sorpréndeme!"><Shuffle size={20} /></motion.button>
                </div>
              </div>

              <div style={styles.resultsContainer}>
                {busqueda.length < 3 && resultados.length === 0 ? (
                  <div style={styles.emptyState}>
                    <Music size={40} color="#333" />
                    <p style={{marginTop:'15px', color:'#666', fontSize:'14px'}}>Busca tu canción favorita<br/>o dale al botón aleatorio 🔀</p>
                  </div>
                ) : buscando ? (
                   <div style={styles.emptyState}><div className="spinner" style={styles.spinner}></div><p style={{color:'#666', fontSize:'12px', marginTop:'10px'}}>Conectando con el DJ...</p></div>
                ) : resultados.length === 0 ? (
                   <div style={styles.emptyState}><p style={{color:'#666'}}>No se encontró nada 😕</p></div>
                ) : (
                  resultados.map(r => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }} style={styles.songRow} onClick={() => pedirCancion(r)}>
                       <img src={r.cover} alt="cover" style={styles.songRowCover} />
                       <div style={{flex:1, overflow:'hidden'}}>
                          <div style={styles.songRowTitle}>{r.titulo}</div>
                          <div style={styles.songRowArtist}>{r.artista}</div>
                       </div>
                       <div style={styles.addBtn}><Plus size={14}/></div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* PASO 3: TICKET REAL ACTUALIZADO */}
          {enviado && miTicket && (
             <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                style={estadoCola.esMiTurno ? styles.turnCard : styles.ticketContainer}
             >
                {/* SI ES MI TURNO: PANTALLA ESPECIAL */}
                {estadoCola.esMiTurno ? (
                    <div style={{textAlign:'center', padding:'20px'}}>
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        >
                            <PartyPopper size={80} color="#00f2ff" />
                        </motion.div>
                        <h1 style={{fontSize:'40px', color:'#fff', margin:'20px 0'}}>¡ES TU TURNO!</h1>
                        <p style={{fontSize:'18px', color:'#ccc'}}>Acércate al escenario, tu canción va a sonar.</p>
                        <div style={{background:'rgba(255,255,255,0.1)', padding:'15px', borderRadius:'15px', marginTop:'20px'}}>
                            <div style={{fontWeight:'bold', color:'#00f2ff'}}>{miTicket.cancion.titulo}</div>
                        </div>
                    </div>
                ) : (
                    // SI ESTÁ ESPERANDO: TICKET NORMAL
                    <div style={styles.ticketCard}>
                        <div style={{...styles.ticketHole, top: '160px', left: '-10px'}}></div>
                        <div style={{...styles.ticketHole, top: '160px', right: '-10px'}}></div>
                        
                        <div style={styles.successHeader}>
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={styles.checkIconWrapper}>
                                <CheckCircle size={32} color="#000" />
                            </motion.div>
                            <h3>TURNO CONFIRMADO</h3>
                        </div>

                        <div style={styles.ticketContent}>
                            <img src={avatar || `https://ui-avatars.com/api/?name=${nickname}`} alt="user" style={styles.ticketAvatar} />
                            <div style={{fontSize:'18px', fontWeight:'800', marginTop:'5px'}}>{nickname}</div>
                            <div style={styles.songBadge}>{miTicket.cancion.titulo}</div>
                            <div style={styles.dashedLine}></div>

                            <div style={styles.ticketGrid}>
                                <div style={styles.ticketItem}>
                                    <span>TU NÚMERO</span>
                                    <strong style={{color:'#bd00ff', fontSize:'28px'}}>#{miTicket.turno}</strong>
                                </div>
                                <div style={{width:'1px', background:'#eee'}}></div>
                                <div style={styles.ticketItem}>
                                    <span>DELANTE DE TI</span>
                                    {/* AQUÍ ESTÁ LA MAGIA DEL CONTADOR QUE BAJA 👇 */}
                                    <strong style={{color:'#000', fontSize:'28px'}}>
                                        {estadoCola.personasDelante}
                                    </strong>
                                    <span style={{fontSize:'10px'}}>Personas</span>
                                </div>
                            </div>
                            
                            <div style={{marginTop:'15px', background:'#f5f5f5', padding:'8px 15px', borderRadius:'10px', fontSize:'12px', color:'#666', display:'flex', alignItems:'center', gap:'5px'}}>
                                <Clock size={12}/> Espera aprox: <b>{estadoCola.tiempoEspera} min</b>
                            </div>
                        </div>
                    </div>
                )}

                <div style={styles.actionsContainer}>
                  {estadoCola.esMiTurno ? (
                      <button onClick={resetear} style={styles.actionBtnPrimary}>¡Ya he cantado! (Salir)</button>
                  ) : (
                      <>
                        <motion.button whileTap={{scale:0.95}} onClick={resetear} style={styles.actionBtnSecondary}><RotateCcw size={16} /> Cancelar</motion.button>
                        <motion.button whileTap={{scale:0.95}} onClick={() => navigate('/')} style={styles.actionBtnPrimary}><Home size={16} /> Salir</motion.button>
                      </>
                  )}
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' },
  simulatorContainer: { height: '100%', background: '#000', color: '#fff', fontFamily: 'Inter, sans-serif', borderRadius: '30px', overflow: 'hidden', position: 'relative' },
  background: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at top left, #2a1045, #000 60%)', zIndex: 0 },
  nav: { position: 'absolute', top: 0, left: 0, right: 0, height: '60px', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, backdropFilter: 'blur(5px)' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '16px', letterSpacing: '-0.5px' },
  barBadge: { fontSize: '9px', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '10px', color: '#ccc', border: '1px solid rgba(255,255,255,0.1)' },
  mainContent: { position: 'relative', zIndex: 10, padding: '70px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', boxSizing: 'border-box' },
  card: { width: '100%', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  titleGradient: { fontSize: '20px', fontWeight: '800', marginBottom: '20px', background: 'linear-gradient(to right, #fff, #b0b0b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  avatarContainer: { position: 'relative', width: '90px', height: '90px', marginBottom: '20px', cursor: 'pointer' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #333' },
  avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00f2ff' },
  plusBadge: { position: 'absolute', bottom: '0', right: '0', background: '#00f2ff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #000' },
  inputGroup: { width: '100%', marginBottom: '15px' },
  label: { fontSize: '10px', color: '#666', fontWeight: '700', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '12px', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #222', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' },
  singerSelector: { width: '100%', display: 'flex', background: '#0a0a0a', padding: '3px', borderRadius: '12px', border: '1px solid #222' },
  singerBtn: { flex: 1, padding: '8px', border: 'none', background: 'transparent', color: '#555', borderRadius: '9px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.2s' },
  singerBtnActive: { background: '#222', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  mainButton: { width: '100%', padding: '14px', marginTop: '10px', background: 'linear-gradient(90deg, #00f2ff, #00a8ff)', border: 'none', borderRadius: '14px', color: '#000', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,242,255,0.2)' },
  stickyHeader: { position: 'sticky', top: '0', zIndex: 20, paddingBottom: '10px' },
  miniProfile: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '12px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' },
  miniAvatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' },
  editBtn: { fontSize: '10px', color: '#00f2ff', fontWeight: '600', cursor: 'pointer' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center', flex: 1 },
  searchIcon: { position: 'absolute', left: '12px', color: '#666' },
  searchInput: { width: '100%', padding: '12px 12px 12px 38px', background: '#111', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  randomBtn: { background: '#222', border: '1px solid #333', color: '#00f2ff', borderRadius: '12px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  resultsContainer: { paddingBottom: '40px' },
  songRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', marginBottom: '8px', background: '#111', borderRadius: '12px', border: '1px solid #1a1a1a', cursor:'pointer' },
  songRowCover: { width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' },
  songRowTitle: { fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '2px' },
  songRowArtist: { fontSize: '12px', color: '#666' },
  addBtn: { width: '28px', height: '28px', borderRadius: '50%', background: '#222', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyState: { textAlign: 'center', padding: '40px 0', opacity: 0.7 },
  spinner: { width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #00f2ff', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' },
  ticketContainer: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
  turnCard: { width: '100%', background: 'linear-gradient(135deg, #1a0b2e, #000)', border: '2px solid #00f2ff', borderRadius: '24px', padding: '20px', boxShadow: '0 0 50px rgba(0,242,255,0.3)' },
  ticketCard: { background: '#fff', color: '#000', width: '100%', borderRadius: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  ticketHole: { position: 'absolute', width: '20px', height: '20px', background: '#050505', borderRadius: '50%' },
  successHeader: { background: '#00f2ff', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
  checkIconWrapper: { background: '#fff', borderRadius: '50%', padding: '5px' },
  ticketContent: { padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  ticketAvatar: { width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', marginTop: '-50px', zIndex: 10, background: '#eee' },
  songBadge: { background: '#f5f5f5', padding: '8px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginTop: '10px', color: '#333', maxWidth: '90%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  dashedLine: { width: '100%', borderBottom: '2px dashed #ddd', margin: '15px 0' },
  ticketGrid: { display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' },
  ticketItem: { display: 'flex', flexDirection: 'column', fontSize: '12px', color: '#888', flex:1 },
  actionsContainer: { display: 'flex', gap: '10px' },
  actionBtnSecondary: { flex: 1, padding: '12px', background: '#222', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' },
  actionBtnPrimary: { flex: 1, padding: '12px', background: '#00f2ff', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' },
};

const desktopStyles = {
    container: { height: '100vh', width: '100vw', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '80px', padding: '40px', boxSizing: 'border-box' },
    infoSide: { maxWidth: '400px' },
    title: { fontSize: '48px', fontWeight: '900', color: '#fff', marginBottom: '10px', lineHeight: 1 },
    subtitle: { fontSize: '20px', color: '#888', marginBottom: '30px' },
    featureList: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' },
    feature: { fontSize: '16px', color: '#ccc', display: 'flex', alignItems: 'center', gap: '10px' },
    phoneWrapper: { position: 'relative', height: '650px', width: '340px', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))' },
    phoneFrame: { width: '100%', height: '100%', background: '#000', borderRadius: '45px', border: '8px solid #222', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 0 0 2px #444' },
    notch: { position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '25px', background: '#222', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', zIndex: 100 },
    screenContent: { width: '100%', height: '100%', overflow: 'hidden' }
};

export default VistaCliente;