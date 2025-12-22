import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2, Mail, User, Building, Phone, Send, ArrowLeft, CheckCircle } from 'lucide-react';

const SalesPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}></div>

      {/* Botón volver */}
      <button onClick={() => navigate('/login')} style={styles.backButton}>
        <ArrowLeft size={20} /> Volver
      </button>

      <div
        style={{
          ...styles.contentGrid,
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '30px' : '50px'
        }}
      >
        {/* INFO */}
        <div style={{ ...styles.infoSection, textAlign: isMobile ? 'center' : 'left' }}>
          <div style={{ ...styles.logoContainer, justifyContent: isMobile ? 'center' : 'flex-start' }}>
            <Mic2 size={40} color="#00f2ff" />
            <h1 style={styles.brandName}>
              Karaoke<span style={{ color: '#00f2ff' }}>SaaS</span>
            </h1>
          </div>

          <h2 style={{
            ...styles.headline,
            fontSize: isMobile ? '36px' : '48px'
          }}>
            Digitaliza tu escenario.<br />Llena tu bar.
          </h2>

          <p style={styles.description}>
            Deja que tus clientes pidan canciones desde el móvil mientras tú sirves copas.
            Olvídate de los papeles y las quejas al DJ.
          </p>

          <ul style={styles.benefitsList}>
            <li>✅ Instalación en 5 minutos</li>
            <li>✅ Catálogo de YouTube ilimitado</li>
            <li>✅ Pantalla de TV automática</li>
            <li>✅ Panel de control anti-trolls</li>
          </ul>
        </div>

        {/* FORM */}
        <div style={styles.card}>
          {!submitted ? (
            <>
              <h3 style={styles.formTitle}>Contactar Ventas</h3>
              <p style={styles.formSubtitle}>Te llamamos y te damos una demo gratis.</p>

              <form onSubmit={handleSubmit} style={styles.form}>
                <Input icon={<User size={18} />} placeholder="Tu Nombre" />
                <Input icon={<Building size={18} />} placeholder="Nombre del Bar" />
                <Input icon={<Phone size={18} />} placeholder="Teléfono / WhatsApp" />
                <Input icon={<Mail size={18} />} placeholder="Email" />

                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {loading ? 'Enviando...' : <><Send size={18} /> Solicitar Demo</>}
                </button>
              </form>
            </>
          ) : (
            <div style={styles.successState}>
              <CheckCircle size={60} color="#00f2ff" />
              <h3>¡Recibido!</h3>
              <p>Te contactamos en menos de 24h.</p>
              <button onClick={() => navigate('/')} style={styles.homeBtn}>
                Ir al Inicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* INPUT reutilizable */
const Input = ({ icon, placeholder }) => (
  <div style={styles.inputGroup}>
    <div style={styles.icon}>{icon}</div>
    <input style={styles.input} placeholder={placeholder} required />
  </div>
);

/* ESTILOS */
const styles = {
  container: {
    minHeight: '100vh',
    background: '#000',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '20px'
  },
  background: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 80% 20%, #1a0b2e 0%, #000 100%)',
    zIndex: 0
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  contentGrid: {
    display: 'grid',
    maxWidth: 1000,
    width: '100%',
    zIndex: 5,
    alignItems: 'center'
  },
  infoSection: { padding: 20 },
  logoContainer: { display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 },
  brandName: { fontSize: 32, fontWeight: 700 },
  headline: {
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: 20,
    background: 'linear-gradient(90deg,#fff,#aaa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  description: { color: '#888', marginBottom: 30, lineHeight: 1.6 },
  benefitsList: { listStyle: 'none', padding: 0, lineHeight: 1.8 },

  card: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: 40,
    borderRadius: 24
  },
  formTitle: { fontSize: 24, fontWeight: 700 },
  formSubtitle: { color: '#666', marginBottom: 30 },
  form: { display: 'flex', flexDirection: 'column', gap: 15 },
  inputGroup: {
    position: 'relative',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid #333',
    borderRadius: 8
  },
  icon: {
    position: 'absolute',
    top: '50%',
    left: 14,
    transform: 'translateY(-50%)',
    color: '#666'
  },
  input: {
    width: '100%',
    padding: '14px 14px 14px 44px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    outline: 'none'
  },
  submitBtn: {
    marginTop: 10,
    padding: 14,
    background: '#00f2ff',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer'
  },
  successState: { textAlign: 'center' },
  homeBtn: {
    marginTop: 20,
    padding: '10px 20px',
    border: '1px solid #00f2ff',
    background: 'transparent',
    color: '#00f2ff',
    borderRadius: 20
  }
};

export default SalesPage;
