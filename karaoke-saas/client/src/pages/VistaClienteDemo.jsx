import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic2, Search, User, Music, CheckCircle, Clock, Users, Camera, Plus, X, Home, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VistaCliente = () => {
  const params = useParams();
  const slug = params.slug || "DEMO";
  const navigate = useNavigate();

  // Estados
  const [step, setStep] = useState(1);
  
  // Datos del Usuario
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(null); 
  const [numSingers, setNumSingers] = useState(1); 

  // Buscador y Resultados
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [enviado, setEnviado] = useState(false);
  const [turno, setTurno] = useState(null);
  const [cancionElegida, setCancionElegida] = useState(null);
  const [buscando, setBuscando] = useState(false); // Estado visual de carga
  
  const fileInputRef = useRef(null);

  // --- EFECTO DE BÚSQUEDA OPTIMIZADO ---
  useEffect(() => {
    // Si borran, limpiamos todo rápido
    if (busqueda.length <= 2) {
        setResultados([]);
        setBuscando(false);
        return;
    }

    setBuscando(true); // Mostramos "Buscando..." mientras escribe

    // DEBOUNCE AUMENTADO A 3000ms (3 segundos) para ahorrar peticiones
    const delayBusqueda = setTimeout(async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_CLIENT_URL}/api/youtube/search?query=${encodeURIComponent(busqueda)}`);
          const data = await response.json();

          if (response.status !== 200) {
              setResultados([]);
              return;
          }

          // 1. FILTRO ESTRICTO: Solo videos que digan "karaoke" en el título
          const soloKaraokes = data.filter(v => 
            v.titulo.toLowerCase().includes('karaoke')
          );

          // 2. SOLO UN RESULTADO: Cogemos el primero (el mejor match) o ninguno
          const mejorResultado = soloKaraokes.length > 0 ? [soloKaraokes[0]] : [];

          // 3. MAPEO DE DATOS
          const videosFormateados = mejorResultado.map(v => ({
            id: v.id,
            titulo: v.titulo,
            artista: v.canal,
            cover: v.imagen
          }));

          setResultados(videosFormateados);

        } catch (error) {
          console.error("Error:", error);
          setResultados([]);
        } finally {
            setBuscando(false); // Ocultamos carga
        }
    }, 3000); // <--- TIEMPO DE ESPERA AUMENTADO

    return () => clearTimeout(delayBusqueda);
  }, [busqueda]);

  // Manejar subida de foto
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatar(imageUrl);
    }
  };

  const pedirCancion = (cancion) => {
    setCancionElegida(cancion);
    setEnviado(true);
    setTurno(Math.floor(Math.random() * 5) + 3);
  };

  const resetear = () => {
    setEnviado(false);
    setBusqueda('');
    setCancionElegida(null);
    setResultados([]); // Limpiamos resultados anteriores
  };

  const goBack = () => {
     if(step === 2) setStep(1);
     else window.history.back();
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}></div>

      {/* Header */}
      <nav style={styles.nav}>
        <div style={styles.logo} onClick={goBack}>
            <Mic2 size={22} color="#00f2ff" style={{ filter: "drop-shadow(0 0 5px #00f2ff)" }} />
            <span>Karaoke<span style={{ color: "#00f2ff" }}>Pro</span></span>
        </div>
        <div style={styles.barBadge}>{slug.toUpperCase()}</div>
      </nav>

      <div style={styles.mainContent}>
        <AnimatePresence mode='wait'>
          
          {/* PASO 1: PERFIL */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -100 }}
              style={styles.card}
            >
              <h2 style={styles.titleGradient}>¿Quién va a cantar?</h2>
              
              <div style={styles.avatarContainer} onClick={() => fileInputRef.current.click()}>
                <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handlePhotoUpload} />
                {avatar ? (
                  <img src={avatar} alt="avatar" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarPlaceholder}>
                    <Camera size={32} color="#fff" />
                    <span style={{fontSize:'10px', marginTop:'5px', opacity:0.7}}>SUBIR FOTO</span>
                  </div>
                )}
                <div style={styles.plusBadge}><Plus size={12} color="black" /></div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>TU APODO ARTÍSTICO</label>
                <input 
                  type="text" 
                  placeholder="Ej: La Rosalía" 
                  style={styles.input}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>¿CUÁNTOS SOIS?</label>
                <div style={styles.singerSelector}>
                  {[1, 2, 3].map(num => (
                    <button 
                      key={num}
                      style={{...styles.singerBtn, ...(numSingers === num ? styles.singerBtnActive : {})}}
                      onClick={() => setNumSingers(num)}
                    >
                      {num === 1 ? <User size={18} /> : <Users size={18} />} 
                      {num === 1 ? ' Solo' : num === 2 ? ' Dúo' : ' Grupo'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                style={{...styles.mainButton, opacity: nickname ? 1 : 0.5}} 
                disabled={!nickname}
                onClick={() => setStep(2)}
              >
                BUSCAR CANCIÓN
              </button>
            </motion.div>
          )}

          {/* PASO 2: BUSCADOR CONECTADO */}
          {step === 2 && !enviado && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ width: '100%', maxWidth: '500px' }}
            >
              <div style={styles.stickyHeader}>
                <div style={styles.miniProfile} onClick={() => setStep(1)}>
                  <img src={avatar || `https://ui-avatars.com/api/?name=${nickname}`} alt="mini" style={styles.miniAvatar} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:'12px', color:'#888'}}>Cantando como:</div>
                    <div style={{fontWeight:'bold', color:'white'}}>{nickname} {numSingers > 1 ? `(+${numSingers-1})` : ''}</div>
                  </div>
                  <div style={styles.editBtn}>Editar</div>
                </div>

                <div style={styles.searchWrapper}>
                  <Search style={styles.searchIcon} size={20} />
                  <input 
                    type="text" 
                    placeholder="Canción o artista..." 
                    style={styles.searchInput}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    autoFocus
                  />
                  {busqueda && <X size={18} style={{padding:'10px'}} onClick={() => setBusqueda('')}/>}
                </div>
              </div>

              <div style={styles.resultsContainer}>
                {busqueda.length < 3 ? (
                  <div style={styles.emptyState}>
                    <Music size={60} color="#222" />
                    <p style={{marginTop:'15px', color:'#666'}}>Escribe para buscar tu Karaoke</p>
                  </div>
                ) : buscando ? (
                   <div style={styles.emptyState}>
                      <div className="animate-spin" style={{display:'inline-block', marginBottom:'10px'}}>⏳</div>
                      <p style={{color:'#666'}}>Buscando el mejor resultado...</p>
                   </div>
                ) : resultados.length === 0 ? (
                   <div style={styles.emptyState}>
                      <p style={{color:'#666'}}>No encontramos Karaokes exactos para eso 😕</p>
                      <p style={{fontSize:'12px', color:'#444'}}>Intenta poner el nombre del artista</p>
                   </div>
                ) : (
                  // AQUÍ SOLO SE MOSTRARÁ 1 RESULTADO
                  resultados.map(r => (
                    <motion.div 
                      key={r.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.98 }}
                      style={styles.songRow} 
                      onClick={() => pedirCancion(r)}
                    >
                       <img src={r.cover} alt="cover" style={styles.songRowCover} />
                       <div style={{flex:1, overflow:'hidden'}}>
                          <div style={styles.songRowTitle}>{r.titulo}</div>
                          <div style={styles.songRowArtist}>{r.artista}</div>
                       </div>
                       <button style={styles.addBtn}>CANTAR</button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* PASO 3: TICKET DE ÉXITO */}
          {enviado && (
             <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                style={styles.ticketContainer}
             >
                <div style={styles.ticketCard}>
                  <div style={styles.ticketHoleLeft}></div>
                  <div style={styles.ticketHoleRight}></div>
                  
                  <div style={styles.successHeader}>
                    <CheckCircle size={40} color="#00f2ff" />
                    <h3>¡TURNO CONFIRMADO!</h3>
                  </div>

                  <div style={styles.ticketContent}>
                    <img src={avatar || `https://ui-avatars.com/api/?name=${nickname}`} alt="user" style={styles.ticketAvatar} />
                    <div style={{fontSize:'20px', fontWeight:'bold', marginTop:'10px'}}>{nickname}</div>
                    
                    {cancionElegida && (
                        <div style={{textAlign:'center', marginTop:'10px', maxWidth:'100%'}}>
                            <div style={{fontSize:'12px', color:'#888'}}>Has pedido:</div>
                            <div style={{fontSize:'14px', fontWeight:'bold', color:'#00f2ff', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap', maxWidth:'250px'}}>
                                {cancionElegida.titulo}
                            </div>
                        </div>
                    )}

                    <div style={styles.dashedLine}></div>

                    <div style={{display:'flex', justifyContent:'space-between', width:'100%', alignItems:'center'}}>
                        <div style={{textAlign:'left'}}>
                          <div style={{fontSize:'12px', color:'#888'}}>Turno</div>
                          <div style={{fontSize:'32px', fontWeight:'900', color:'#bd00ff'}}>#{turno}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:'12px', color:'#888'}}>Espera aprox</div>
                          <div style={{display:'flex', alignItems:'center', gap:'5px', justifyContent:'flex-end'}}>
                              <Clock size={16} /> 15 min
                          </div>
                        </div>
                    </div>
                  </div>
                </div>

                <div style={styles.actionsContainer}>
                  <button onClick={resetear} style={styles.actionBtnSecondary}>
                    <RotateCcw size={16} /> Pedir Otra
                  </button>
                  <button onClick={() => navigate('/')} style={styles.actionBtnPrimary}>
                    <Home size={16} /> Salir
                  </button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- ESTILOS EN LÍNEA (CSS-IN-JS) ---
const styles = {
  container: { minHeight: '100vh', background: '#000', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', position: 'relative', overflowX: 'hidden' },
  background: { position: 'fixed', inset: 0, background: 'linear-gradient(to bottom, #1a0b2e, #000)', zIndex: 0 },
  nav: { position: 'fixed', top: 0, left: 0, right: 0, padding: '12px 20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)' },
  logo: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px', cursor: 'pointer' },
  barBadge: { fontSize: '10px', fontWeight: 'bold', background: '#222', padding: '4px 8px', borderRadius: '6px', color: '#888', border: '1px solid #333' },
  mainContent: { position: 'relative', zIndex: 10, padding: '80px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' },
  card: { width: '100%', maxWidth: '380px', background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '30px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  titleGradient: { fontSize: '22px', fontWeight: '800', marginBottom: '25px', background: 'linear-gradient(45deg, #fff, #bd00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  avatarContainer: { position: 'relative', width: '100px', height: '100px', marginBottom: '25px', cursor: 'pointer' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #333, #111)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #444' },
  avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid #bd00ff', boxShadow: '0 0 20px rgba(189,0,255,0.3)' },
  plusBadge: { position: 'absolute', bottom: '0', right: '0', background: '#00f2ff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #1a0b2e' },
  inputGroup: { width: '90%', marginBottom: '20px', textAlign: 'left' },
  label: { fontSize: '10px', color: '#666', fontWeight: '700', marginBottom: '8px', display: 'block', letterSpacing: '1px' },
  input: { width: '95%', padding: '14px', borderRadius: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', fontSize: '16px', outline: 'none', transition: 'border 0.3s' },
  singerSelector: { width: '100%', display: 'flex', background: '#0a0a0a', padding: '4px', borderRadius: '12px', border: '1px solid #333' },
  singerBtn: { flex: 1, padding: '10px', border: 'none', background: 'transparent', color: '#666', borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', cursor: 'pointer' },
  singerBtnActive: { background: '#222', color: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  mainButton: { width: '100%', padding: '16px', marginTop: '10px', background: 'linear-gradient(90deg, #bd00ff, #00f2ff)', border: 'none', borderRadius: '14px', color: '#000', fontWeight: '800', fontSize: '14px', letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 5px 20px rgba(189,0,255,0.3)' },
  stickyHeader: { position: 'sticky', top: '0', zIndex: 20, paddingBottom: '15px' },
  miniProfile: { display: 'flex', alignItems: 'center', gap: '10px', background: '#111', padding: '10px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #222' },
  miniAvatar: { width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' },
  editBtn: { fontSize: '10px', color: '#00f2ff', fontWeight: 'bold', padding: '5px 10px', background: 'rgba(0,242,255,0.1)', borderRadius: '20px' },
  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '15px', color: '#666' },
  searchInput: { width: '100%', padding: '14px 14px 14px 45px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '14px', color: 'white', fontSize: '16px', outline: 'none' },
  resultsContainer: { paddingBottom: '40px' },
  emptyState: { textAlign: 'center', padding: '60px 0', opacity: 0.5 },
  songRow: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', marginBottom: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', cursor:'pointer' },
  songRowCover: { width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' },
  songRowTitle: { fontSize: '15px', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  songRowArtist: { fontSize: '13px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  addBtn: { padding: '8px 14px', borderRadius: '20px', border: 'none', background: '#fff', color: '#000', fontSize: '10px', fontWeight: '900' },
  ticketContainer: { width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' },
  ticketCard: { background: '#fff', color: '#000', width: '100%', borderRadius: '20px', position: 'relative', padding: '0', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,242,255,0.2)' },
  ticketHoleLeft: { position: 'absolute', top: '150px', left: '-15px', width: '30px', height: '30px', background: '#0d041c', borderRadius: '50%' },
  ticketHoleRight: { position: 'absolute', top: '150px', right: '-15px', width: '30px', height: '30px', background: '#0d041c', borderRadius: '50%' },
  successHeader: { background: '#111', color: '#fff', padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', borderBottom: '2px dashed #333' },
  ticketContent: { padding: '30px 25px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  ticketAvatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f0f0f0', marginTop: '-60px' },
  ticketBadge: { background: '#000', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px', marginTop: '5px' },
  dashedLine: { width: '100%', borderBottom: '2px dashed #ddd', margin: '20px 0' },
  actionsContainer: { display: 'flex', gap: '10px' },
  actionBtnSecondary: { flex: 1, padding: '15px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  actionBtnPrimary: { flex: 1, padding: '15px', background: '#00f2ff', border: 'none', borderRadius: '12px', color: '#000', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
};

export default VistaCliente;