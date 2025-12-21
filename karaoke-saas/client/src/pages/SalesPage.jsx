import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2, Mail, User, Building, Phone, Send, ArrowLeft, CheckCircle } from 'lucide-react';

const SalesPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simular envío al CRM
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}></div>

      {/* Botón Volver */}
      <button 
        onClick={() => navigate('/login')} 
        style={styles.backButton}
        onMouseEnter={(e) => e.currentTarget.style.color = '#00f2ff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
      >
        <ArrowLeft size={20} /> Volver al Login
      </button>

      <div style={styles.contentGrid}>
        
        {/* IZQUIERDA: TEXTO DE VENTA */}
        <div style={styles.infoSection}>
          <div style={styles.logoContainer}>
             <Mic2 size={40} color="#00f2ff" />
             <h1 style={styles.brandName}>Karaoke<span style={{color:'#00f2ff'}}>SaaS</span></h1>
          </div>
          <h2 style={styles.headline}>Digitaliza tu escenario.<br />Llena tu bar.</h2>
          <p style={styles.description}>
            Deja que tus clientes pidan canciones desde el móvil mientras tú sirves copas.
            Olvídate de los papeles y las quejas al DJ.
          </p>
          <ul style={styles.benefitsList}>
            <li style={styles.benefitItem}>✅ Instalación en 5 minutos</li>
            <li style={styles.benefitItem}>✅ Catálogo de YouTube ilimitado</li>
            <li style={styles.benefitItem}>✅ Pantalla de TV automática</li>
            <li style={styles.benefitItem}>✅ Panel de control anti-trolls</li>
          </ul>
        </div>

        {/* DERECHA: FORMULARIO */}
        <div style={styles.card}>
          {!submitted ? (
            <>
              <h3 style={styles.formTitle}>Contactar Ventas</h3>
              <p style={styles.formSubtitle}>Te llamamos y te damos una demo gratis.</p>
              
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.inputGroup}>
                  <User size={18} style={styles.icon} />
                  <input type="text" placeholder="Tu Nombre" style={styles.input} required />
                </div>
                <div style={styles.inputGroup}>
                  <Building size={18} style={styles.icon} />
                  <input type="text" placeholder="Nombre del Bar" style={styles.input} required />
                </div>
                <div style={styles.inputGroup}>
                  <Phone size={18} style={styles.icon} />
                  <input type="tel" placeholder="Teléfono / WhatsApp" style={styles.input} required />
                </div>
                <div style={styles.inputGroup}>
                  <Mail size={18} style={styles.icon} />
                  <input type="email" placeholder="Email" style={styles.input} required />
                </div>

                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {loading ? 'Enviando...' : <><Send size={18} /> Solicitar Demo</>}
                </button>
              </form>
            </>
          ) : (
            <div style={styles.successState}>
              <CheckCircle size={60} color="#00f2ff" />
              <h3>¡Recibido!</h3>
              <p>Nuestro equipo comercial te contactará en menos de 24h.</p>
              <button onClick={() => navigate('/')} style={styles.homeBtn}>Ir al Inicio</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', background: '#000', color: '#fff', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '20px' },
  background: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 20%, #1a0b2e 0%, #000 100%)', zIndex: 0 },
  backButton: { position: 'absolute', top: '30px', left: '30px', zIndex: 20, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', transition: 'color 0.3s ease' },
  
  contentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', maxWidth: '1000px', width: '100%', zIndex: 10, alignItems: 'center', '@media (max-width: 768px)': { gridTemplateColumns: '1fr' } }, // Nota: Media queries en inline styles no van bien sin librerías, pero para PC funciona top.
  
  infoSection: { padding: '20px' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
  brandName: { fontSize: '32px', fontWeight: 'bold' },
  headline: { fontSize: '48px', fontWeight: '800', lineHeight: 1.1, marginBottom: '20px', background: 'linear-gradient(90deg, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  description: { fontSize: '18px', color: '#888', marginBottom: '30px', lineHeight: 1.6 },
  benefitsList: { listStyle: 'none', padding: 0 },
  benefitItem: { fontSize: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' },

  card: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  formTitle: { fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' },
  formSubtitle: { fontSize: '14px', color: '#666', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  inputGroup: { position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', borderRadius: '8px' },
  icon: { position: 'absolute', left: '15px', color: '#666' },
  input: { width: '100%', padding: '14px 14px 14px 45px', background: 'transparent', border: 'none', color: '#fff', outline: 'none' },
  submitBtn: { marginTop: '10px', padding: '14px', background: '#00f2ff', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px' },
  
  successState: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '20px 0' },
  homeBtn: { padding: '10px 20px', background: 'transparent', border: '1px solid #00f2ff', color: '#00f2ff', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }
};

export default SalesPage;