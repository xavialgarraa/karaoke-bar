import React, { useState, useEffect, useRef } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { 
  Mic2, Trash2, GripVertical, Tv, ExternalLink, 
  Settings, MapPin, Power, LogOut, X, Edit2, Copy, Cast, Printer, QrCode, Loader2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_CLIENT_URL || "http://localhost:3001";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const socketRef = useRef(null);
  const token = localStorage.getItem('karaoke_token');
  
  // --- ESTADOS ---
  const [queue, setQueue] = useState([]);
  const [isSocketActive, setIsSocketActive] = useState(true); // Se sincronizará con BD
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [barData, setBarData] = useState({
    nombre: "Cargando...",
    ubicacion: "",
    slug: slug,
    plan: "PRO" // Podrías traerlo de la BD si lo tienes
  });

  // URL PÚBLICA
  const publicUrl = `${window.location.origin}/karaoke-bar/${barData.slug}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${publicUrl}&color=000000&bgcolor=ffffff`;

  // --- 1. INICIALIZACIÓN ---
  useEffect(() => {
    const token = localStorage.getItem('karaoke_token');
    if (!token) {
        navigate('/'); 
        return;
    }

    // A. Conexión Socket con AUTENTICACIÓN (Vital para funciones de Admin)
    socketRef.current = io(API_URL, {
        auth: { token } // Enviamos el token para que el backend sepa que somos Admin
    });

    socketRef.current.emit('unirse_bar', slug);

    // B. Cargar datos iniciales
    fetchBarInfo(token);
    fetchQueue();

    // --- LISTENERS DEL SOCKET ---

    // 1. Cola actualizada (alguien pidió o se borró)
    socketRef.current.on('nueva_cancion_anadida', () => fetchQueue());
    socketRef.current.on('cambio_de_turno', () => fetchQueue());

    // 2. Estado de la sala (Bloqueo)
    socketRef.current.on('sala_bloqueada', () => setIsSocketActive(false));
    socketRef.current.on('sala_desbloqueada', () => setIsSocketActive(true));

    return () => { if(socketRef.current) socketRef.current.disconnect(); };
  }, [slug]);

  // --- 2. LLAMADAS API ---

  const fetchBarInfo = async (token) => {
      try {
          // Asumiendo que existe esta ruta o una similar para sacar datos básicos
          // Si no tienes getBarInfo, usa lo que tengas o saca info del token
          const res = await fetch(`${API_URL}/api/bar/data/${slug}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) {
              const data = await res.json();
              setBarData(prev => ({ ...prev, ...data }));
              // Sincronizar estado del switch con la BD
              setIsSocketActive(!data.bloqueado); 
          }
      } catch (err) {
          console.error("Error cargando info bar", err);
      }
  };

  const fetchQueue = async () => {
      try {
          const res = await fetch(`${API_URL}/api/queue/${slug}`);
          const data = await res.json();
          
          const formattedQueue = data.map(item => ({
              id: item.id,
              titulo: item.titulo,
              artista: item.artista,
              usuario: item.usuario_nombre || item.usuario,
              avatar: item.usuario_avatar || item.cover_url
          }));
          
          setQueue(formattedQueue);
          setIsLoading(false);
      } catch (err) {
          console.error("Error cola:", err);
      }
  };

  const removeSong = async (id) => {
    // Optimistic UI update
    const prevQueue = [...queue];
    setQueue(queue.filter(q => q.id !== id));

    try {
        const token = localStorage.getItem('karaoke_token');
        await fetch(`${API_URL}/api/queue/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Si borramos la primera, avisamos a la TV para que pase a la siguiente o a relleno
        if (prevQueue.length > 0 && prevQueue[0].id === id) {
            socketRef.current.emit('admin_siguiente_cancion', { slug, idCancionActual: null });
        } else {
            // Si borramos una del medio, solo refrescamos la lista visual de todos
            // (Podríamos emitir un evento socket personalizado, pero cambio_de_turno sirve)
            socketRef.current.emit('admin_siguiente_cancion', { slug, idCancionActual: null });
        }

    } catch (err) {
        alert("Error al borrar");
        setQueue(prevQueue);
    }
  };

  const handleSaveData = async (newData) => {
    try {
        const token = localStorage.getItem('karaoke_token');
        const res = await fetch(`${API_URL}/api/bar/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newData)
        });

        if (res.ok) {
            setBarData({ ...barData, ...newData });
            setShowEditModal(false);
            if (newData.slug !== slug) {
                alert("Has cambiado la URL del bar. Redirigiendo...");
                navigate(`/admin/dashboard/${newData.slug}`);
            }
        } else {
            alert("Error guardando datos");
        }
    } catch (err) {
        console.error(err);
    }
  };

  // --- 3. ACCIONES DE CONTROL ---

  const toggleSystemLock = () => {
      // Enviamos la orden al socket. El estado local se actualizará 
      // cuando el socket nos responda con 'sala_bloqueada' o 'sala_desbloqueada'
      if (isSocketActive) {
          socketRef.current.emit('bloquear_sala');
      } else {
          socketRef.current.emit('desbloquear_sala');
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('karaoke_token');
    navigate('/');
  };

  const copyTvLink = () => {
    const token = localStorage.getItem('karaoke_token');
    const url = `${window.location.origin}/karaoke-bar/tv/${barData.slug}?t=${token}`;
    navigator.clipboard.writeText(url);
    alert("Copiado: " + url);
  };

  // Imprimir
  const handlePrintQR = () => {
    const printWindow = window.open('', '', 'width=800,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cartel QR - ${barData.nombre}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .container { border: 5px solid #000; padding: 50px; border-radius: 30px; }
            h1 { font-size: 50px; margin: 0; text-transform: uppercase; }
            img { width: 350px; margin: 20px 0; }
            .footer { font-weight: bold; font-size: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>¡Pide tu Canción!</h1>
            <h2>${barData.nombre}</h2>
            <img src="${qrImageUrl}" />
            <div class="footer">Escanea o entra en:<br/>${publicUrl}</div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}></div>

      {/* --- HEADER --- */}
      <nav style={styles.nav}>
        <div style={styles.logoSection}>
          <Mic2 color="#00f2ff" /> 
          <span style={{fontWeight:'bold'}}>KaraokeAdmin</span>
        </div>

        {/* SWITCH BLOQUEO */}
        <div style={styles.centerControl}>
            <span style={{fontSize:'12px', color: isSocketActive ? '#00f2ff' : '#ff4d4d', fontWeight:'bold'}}>
                {isSocketActive ? 'SISTEMA ONLINE' : 'SISTEMA BLOQUEADO'}
            </span>
            <div 
                style={{...styles.switchTrack, background: isSocketActive ? 'rgba(0,242,255,0.2)' : '#330000', borderColor: isSocketActive ? 'rgba(0,242,255,0.3)' : '#ff4d4d'}} 
                onClick={toggleSystemLock}
            >
                <motion.div 
                    layout transition={spring} 
                    style={{
                        ...styles.switchThumb, 
                        background: isSocketActive ? '#00f2ff' : '#ff4d4d',
                        x: isSocketActive ? 20 : 0
                    }} 
                />
            </div>
        </div>

        <div style={{position:'relative'}}>
            <div style={styles.userBadge} onClick={() => setShowUserMenu(!showUserMenu)}>
              <div style={{...styles.statusDot, background: isSocketActive ? '#00f2ff' : 'red'}}></div> 
              Admin
              <img src={`https://ui-avatars.com/api/?name=${barData.nombre}&background=000&color=fff`} alt="admin" style={styles.headerAvatar} />
            </div>

            <AnimatePresence>
                {showUserMenu && (
                    <motion.div 
                        initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}}
                        style={styles.dropdownMenu}
                    >
                        <div style={styles.dropdownItem} onClick={handleLogout}>
                            <LogOut size={14} /> Cerrar Sesión
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </nav>

      {/* --- GRID PRINCIPAL --- */}
      <div style={styles.mainGrid}>
        
        {/* COLUMNA IZQUIERDA: COLA */}
        <div style={{...styles.queueSection, opacity: isSocketActive ? 1 : 0.6, filter: isSocketActive ? 'none' : 'grayscale(0.8)', transition: 'all 0.3s'}}>
          <div style={styles.sectionHeader}>
            <div>
                <h2 style={styles.sectionTitle}>Cola de Reproducción ({queue.length})</h2>
                <span style={styles.hint}>* Arrastrar para reordenar (Próximamente)</span>
            </div>
            {!isSocketActive && <span style={styles.offlineBadge}>SISTEMA CERRADO</span>}
          </div>

          <div style={styles.listContainer}>
            {isLoading ? (
                <div style={styles.emptyState}><Loader2 className="animate-spin"/> Cargando...</div>
            ) : queue.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>La cola está vacía 😴</p>
                    <p style={{fontSize:'12px', color:'#666'}}>¡Sistema listo para recibir pedidos!</p>
                </div>
            ) : (
                // NOTA: Reorder solo es visual si no conectamos el endpoint 'reorderQueue'
                <Reorder.Group axis="y" values={queue} onReorder={setQueue} style={{ listStyle: 'none', padding: 0 }}>
                <AnimatePresence>
                    {queue.map((item) => (
                    <Reorder.Item key={item.id} value={item} style={styles.itemWrapper} whileDrag={{ scale: 1.02, boxShadow: "0 5px 15px rgba(0,0,0,0.5)" }}>
                        <div style={styles.songCard}>
                        <div style={styles.dragHandle}><GripVertical size={20} color="#666" /></div>
                        
                        <div style={styles.songInfo}>
                            <div style={styles.songTitle}>{item.titulo}</div>
                            <div style={styles.songArtist}>{item.artista}</div>
                        </div>

                        <div style={styles.userInfo}>
                            <img src={item.avatar} alt="u" style={styles.avatar} />
                            <span>{item.usuario}</span>
                        </div>

                        <button onClick={() => removeSong(item.id)} style={styles.deleteBtn} title="Eliminar">
                            <Trash2 size={18} />
                        </button>
                        </div>
                    </Reorder.Item>
                    ))}
                </AnimatePresence>
                </Reorder.Group>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div style={styles.rightColumn}>
            
            {/* DATOS */}
            <div style={styles.clientCard}>
                <div style={styles.cardHeaderSmall}>
                    <span style={{display:'flex', gap:'5px', alignItems:'center'}}>
                        <Settings size={16} color="#bd00ff" /> CONFIGURACIÓN
                    </span>
                    <button onClick={() => setShowEditModal(true)} style={styles.iconBtn}><Edit2 size={14} /></button>
                </div>
                
                <div style={styles.dataRow}>
                    <div style={styles.barAvatar}>{barData.nombre ? barData.nombre[0] : 'B'}</div>
                    <div style={{flex:1}}>
                        <div style={{fontWeight:'bold', fontSize:'18px'}}>{barData.nombre}</div>
                        <div style={{fontSize:'12px', color:'#888', display:'flex', alignItems:'center', gap:'4px'}}>
                            <MapPin size={10} /> {barData.ubicacion || 'Sin ubicación'}
                        </div>
                    </div>
                    <div style={styles.planBadge}>{barData.plan}</div>
                </div>
            </div>

            {/* QR */}
            <div style={styles.qrControlCard}>
                <div style={styles.cardHeaderSmall}>
                    <span style={{display:'flex', gap:'5px', alignItems:'center', color: '#00f2ff'}}>
                        <QrCode size={16} /> QR DEL LOCAL
                    </span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px'}}>
                    <div style={{background: 'white', padding: '5px', borderRadius: '5px'}}>
                        <img src={qrImageUrl} alt="QR" style={{width: '60px', height: '60px', display: 'block'}} />
                    </div>
                    <div style={{flex: 1}}>
                        <p style={{fontSize: '12px', color: '#aaa', marginBottom: '8px'}}>
                            Escanea para pedir.
                        </p>
                        <button onClick={handlePrintQR} style={styles.printBtn}>
                            <Printer size={14} /> IMPRIMIR
                        </button>
                    </div>
                </div>
            </div>

            {/* TV CONTROL */}
            <div style={styles.tvControlCard}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                    <Tv size={24} color="#fff" />
                    <h3 style={{fontSize:'16px', fontWeight:'bold', margin:0}}>Pantalla TV</h3>
                </div>
                <div style={styles.tvActionsGrid}>
                    <button onClick={() => window.open(`${window.location.origin}/karaoke-bar/tv/${barData.slug}?t=${token}`, '_blank')} style={styles.tvBtnPrimary}>
                        <ExternalLink size={16} /> ABRIR TV
                    </button>
                    <button onClick={copyTvLink} style={styles.tvBtnSecondary}>
                        <Copy size={16} /> URL
                    </button>
                    <button onClick={() => alert("Próximamente")} style={styles.tvBtnSecondary}>
                        <Cast size={16} /> CAST
                    </button>
                </div>
            </div>

        </div>
      </div>

      {/* --- MODAL --- */}
      <AnimatePresence>
        {showEditModal && (
            <EditModal 
                currentData={barData} 
                onClose={() => setShowEditModal(false)} 
                onSave={handleSaveData} 
            />
        )}
      </AnimatePresence>

    </div>
  );
};

const EditModal = ({ currentData, onClose, onSave }) => {
    const [formData, setFormData] = useState(currentData);
    return (
        <div style={styles.modalOverlay}>
            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} style={styles.modalContent}>
                <div style={styles.modalHeader}>
                    <h3>Editar Datos</h3>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20}/></button>
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre</label>
                    <input style={styles.input} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Ubicación</label>
                    <input style={styles.input} value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Slug (URL)</label>
                    <input style={styles.input} value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
                </div>
                <div style={styles.modalFooter}>
                    <button onClick={onClose} style={styles.cancelBtn}>Cancelar</button>
                    <button onClick={() => onSave(formData)} style={styles.saveBtn}>Guardar</button>
                </div>
            </motion.div>
        </div>
    );
};

const spring = { type: "spring", stiffness: 700, damping: 30 };

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' },
  background: { position: 'fixed', inset: 0, background: 'radial-gradient(circle at 10% 10%, #1a0b2e 0%, #000 100%)', zIndex: 0 },
  nav: { height: '70px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', zIndex: 50, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' },
  logoSection: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px' },
  centerControl: { display: 'flex', alignItems: 'center', gap: '15px' },
  switchTrack: { width: '50px', height: '26px', borderRadius: '50px', display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer', border: '1px solid' },
  switchThumb: { width: '22px', height: '22px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.3)' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', background: '#111', padding: '5px 5px 5px 15px', borderRadius: '30px', border: '1px solid #333', cursor: 'pointer' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  headerAvatar: { width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' },
  dropdownMenu: { position: 'absolute', top: '50px', right: 0, width: '150px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  dropdownItem: { padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: '#ff4d4d', ':hover': {background: '#222'} },
  mainGrid: { flex: 1, zIndex: 10, padding: '30px', display: 'flex', gap: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', height: 'calc(100vh - 70px)' },
  queueSection: { flex: 2, background: '#0a0a0a', borderRadius: '24px', border: '1px solid #222', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sectionHeader: { padding: '25px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'start' },
  sectionTitle: { margin: 0, fontSize: '20px', marginBottom: '5px' },
  hint: { fontSize: '12px', color: '#666' },
  offlineBadge: { background: 'red', color: 'white', padding: '5px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' },
  listContainer: { flex: 1, overflowY: 'auto', padding: '20px' },
  emptyState: { textAlign: 'center', padding: '50px', color: '#444' },
  itemWrapper: { marginBottom: '12px', cursor: 'grab' },
  songCard: { display: 'flex', alignItems: 'center', gap: '15px', background: '#141414', padding: '15px', borderRadius: '16px', border: '1px solid #2a2a2a' },
  dragHandle: { cursor: 'grab', padding: '5px', color: '#444' },
  songInfo: { flex: 1 },
  songTitle: { fontWeight: 'bold', fontSize: '16px' },
  songArtist: { color: '#888', fontSize: '13px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '10px', background: '#000', padding: '6px 15px', borderRadius: '20px', border: '1px solid #333', fontSize: '12px', color: '#ccc', marginRight: '15px' },
  avatar: { width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' },
  deleteBtn: { background: 'rgba(255, 77, 77, 0.1)', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '10px', borderRadius: '10px', transition: 'background 0.2s' },
  rightColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
  clientCard: { background: '#111', borderRadius: '24px', border: '1px solid #222', padding: '25px' },
  qrControlCard: { background: '#111', borderRadius: '24px', border: '1px solid #222', padding: '25px' },
  tvControlCard: { flex: 1, background: 'linear-gradient(160deg, #0072ff 0%, #00c6ff 100%)', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 40px rgba(0, 114, 255, 0.2)', color: 'white' },
  cardHeaderSmall: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', letterSpacing: '1px', color: '#bd00ff', fontWeight: 'bold', marginBottom: '15px' },
  iconBtn: { background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: '5px' },
  dataRow: { display: 'flex', gap: '15px', alignItems: 'center' },
  barAvatar: { width: '50px', height: '50px', background: 'linear-gradient(135deg, #222, #333)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', color: '#fff' },
  planBadge: { background: 'linear-gradient(90deg, #bd00ff, #ff0055)', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', height: 'fit-content' },
  tvActionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  tvBtnPrimary: { gridColumn: '1 / -1', background: 'white', color: '#0072ff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' },
  tvBtnSecondary: { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '12px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  printBtn: { background: '#00f2ff', color: '#000', border: 'none', width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' },
  modalContent: { background: '#1a1a1a', width: '400px', borderRadius: '24px', padding: '30px', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' },
  formGroup: { marginBottom: '15px' },
  label: { display: 'block', fontSize: '12px', color: '#888', marginBottom: '5px' },
  input: { width: '100%', padding: '12px', background: '#050505', border: '1px solid #333', borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box' },
  modalFooter: { display: 'flex', gap: '10px', marginTop: '20px' },
  saveBtn: { flex: 1, background: '#00f2ff', color: '#000', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { flex: 1, background: 'transparent', color: '#fff', border: '1px solid #333', padding: '12px', borderRadius: '10px', cursor: 'pointer' }
};

export default AdminDashboard;