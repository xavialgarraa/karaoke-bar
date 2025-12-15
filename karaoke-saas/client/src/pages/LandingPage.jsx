import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- IMPORTANTE: Para navegar
import { Mic2, Smartphone, Tv, Zap, Shield, TrendingUp, Check, Star, Play, ArrowRight } from 'lucide-react';

const KaraokeLanding = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate(); // <--- Hook de navegación

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={styles.container}>
      {/* Background blobs */}
      <div style={styles.bgFixed}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
      </div>

      {/* Navigation */}
      <nav style={{...styles.nav, ...(scrolled ? styles.navScrolled : {})}}>
        <div style={styles.navInner}>
          <div style={styles.logoContainer} onClick={() => window.scrollTo(0,0)}>
            <Mic2 style={styles.logoIcon} />
            <span style={styles.logoText}>
              Karaoke<span style={styles.logoCyan}>SaaS</span>
            </span>
          </div>
          <button style={styles.navButton} onClick={() => alert("Aquí iría al Login (ej: /admin)")}>
            Soy Dueño
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.badge}>
            🚀 El futuro del karaoke ya está aquí
          </div>
          
          <h1 style={styles.title}>
            Karaoke Sin<br />
            <span style={styles.gradientText}>Papel ni Caos</span>
          </h1>
          
          <p style={styles.subtitle}>
            Tus clientes escanean un QR y piden su canción. 
            La pantalla lo gestiona sola. 
            <span style={styles.subtitleBold}> Tú vende más copas, nosotros ponemos la música.</span>
          </p>

          <div style={styles.ctaContainer}>
            {/* BOTÓN CONECTADO A TU DEMO REAL */}
            <button style={styles.primaryBtn} onClick={() => navigate('/bar-manolo')}>
              <Play style={styles.btnIcon} fill="currentColor" />
              Ver Demo Cliente
            </button>
            
            <button style={styles.secondaryBtn} onClick={() => navigate('/bar-manolo/tv')}>
              <Tv style={styles.btnIcon} />
               Ver Pantalla TV
            </button>
          </div>

          <div style={styles.socialProof}>
            <div style={styles.proofItem}>
              <Star style={styles.starIcon} />
              <span>Sistema preferido por técnicos de sonido</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionTitle}>
            Todo lo que necesitas.<br />
            <span style={styles.gradientText}>Nada de lo que no.</span>
          </h2>

          <div style={styles.featuresGrid}>
            <FeatureCard 
              icon={<Smartphone style={styles.featureIcon} />}
              title="QR y Listo"
              desc="Sin apps. Escanear y cantar. Cero fricción para el cliente borracho."
              color="#06b6d4"
            />
            <FeatureCard 
              icon={<Tv style={styles.featureIcon} />}
              title="Pantalla Automática"
              desc="Vídeo a la izquierda, cola a la derecha. Diseño profesional tipo TV."
              color="#a855f7"
            />
            <FeatureCard 
              icon={<Shield style={styles.featureIcon} />}
              title="Filtro Anti-Trolls"
              desc="Nuestro algoritmo evita versiones instrumentales malas o bromas."
              color="#ec4899"
            />
            <FeatureCard 
              icon={<Zap style={styles.featureIcon} />}
              title="Instalación Flash"
              desc="Te lo dejamos montado y configurado. QRs impresos incluidos."
              color="#06b6d4"
            />
          </div>
        </div>
      </section>

      {/* Pricing - AJUSTADO A TU MODELO REAL */}
      <section style={styles.pricingSection}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionTitle}>
            Rentable desde la <span style={styles.gradientText}>primera noche</span>
          </h2>
          <p style={styles.pricingSubtitle}>Más barato que contratar a alguien para apuntar turnos.</p>

          <div style={styles.pricingGrid}>
            <PricingCard 
              name="Tu Propio Karaoke"
              price="45"
              features={[
                'Sistema completo QR + TV',
                'Cola de turnos ilimitada',
                'Soporte técnico incluido',
                'Instalación presencial disponible'
              ]}
              highlight={true}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerLogo}>
            <Mic2 style={styles.footerIcon} />
            <span style={styles.footerBrand}>KaraokeSaaS</span>
          </div>
          <div style={styles.footerCopy}>© 2025 - Desarrollado con React & Node</div>
        </div>
      </footer>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const FeatureCard = ({ icon, title, desc, color }) => {
  const [hover, setHover] = useState(false);
  
  return (
    <div 
      style={{...styles.featureCard, ...(hover ? styles.featureCardHover : {})}}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{...styles.featureIconBox, backgroundColor: `${color}33`, color: color}}>
        {icon}
      </div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  );
};

const PricingCard = ({ name, price, features, highlight }) => {
  return (
    <div style={{...styles.pricingCard, ...(highlight ? styles.pricingCardHighlight : {})}}>
      {highlight && <div style={styles.popularBadge}>OFERTA DE LANZAMIENTO</div>}
      <h3 style={styles.pricingName}>{name}</h3>
      <div style={styles.pricingPrice}>
        <span style={styles.pricingAmount}>{price}€</span>
        <span style={styles.pricingPeriod}>/mes</span>
      </div>
      <ul style={styles.featureList}>
        {features.map((feature, idx) => (
          <li key={idx} style={styles.featureListItem}>
            <Check style={styles.featureCheck} />
            <span style={styles.featureText}>{feature}</span>
          </li>
        ))}
      </ul>
      <button style={styles.pricingBtnHighlight}>
        Contactar para Demo
      </button>
    </div>
  );
};

// --- ESTILOS CORREGIDOS (RESPONSIVE) ---

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
    overflowX: 'hidden', // CORREGIDO: Antes era overflow: hidden (rompía el scroll)
    position: 'relative'
  },
  bgFixed: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none', // Importante para poder hacer clic en cosas encima
  },
  blob1: {
    position: 'absolute',
    top: '-10%',
    left: '20%',
    width: '40vw',
    height: '40vw',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
    filter: 'blur(80px)',
    borderRadius: '50%',
  },
  blob2: {
    position: 'absolute',
    bottom: '-10%',
    right: '20%',
    width: '40vw',
    height: '40vw',
    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
    filter: 'blur(80px)',
    borderRadius: '50%',
  },
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: '20px 0',
    transition: 'all 0.3s',
  },
  navScrolled: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(10px)',
    padding: '10px 0',
    borderBottom: '1px solid #333',
  },
  navInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  logoIcon: { color: '#06b6d4', width: 28, height: 28 },
  logoText: { fontSize: '24px', fontWeight: 'bold' },
  logoCyan: { color: '#06b6d4' },
  navButton: {
    background: 'transparent',
    border: '1px solid #444',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  hero: {
    position: 'relative',
    zIndex: 10,
    padding: '160px 20px 100px', // Espacio arriba para el navbar
    textAlign: 'center',
  },
  heroInner: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  badge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: 'rgba(168, 85, 247, 0.1)',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '20px',
    color: '#d8b4fe',
    fontSize: '14px',
    marginBottom: '24px',
  },
  title: {
    // CORREGIDO: Uso de clamp() para que no se rompa en móvil
    fontSize: 'clamp(40px, 8vw, 72px)', 
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '24px',
  },
  gradientText: {
    background: 'linear-gradient(90deg, #06b6d4 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 'clamp(16px, 4vw, 20px)',
    color: '#ccc',
    lineHeight: '1.6',
    marginBottom: '40px',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  subtitleBold: { color: 'white', fontWeight: 'bold' },
  ctaContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap', // Para que en móvil bajen los botones
    marginBottom: '60px',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 32px',
    borderRadius: '50px',
    background: 'linear-gradient(90deg, #06b6d4 0%, #a855f7 100%)',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
    transition: 'transform 0.2s',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 32px',
    borderRadius: '50px',
    background: '#111',
    border: '1px solid #444',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnIcon: { width: 20, height: 20 },
  socialProof: {
    display: 'flex',
    justifyContent: 'center',
    color: '#888',
    fontSize: '14px',
  },
  proofItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  starIcon: { color: '#fbbf24', width: 16 },
  
  featuresSection: {
    position: 'relative',
    zIndex: 10,
    padding: '80px 20px',
    background: 'rgba(255,255,255,0.02)',
  },
  sectionInner: { maxWidth: '1200px', margin: '0 auto' },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 'clamp(32px, 5vw, 48px)',
    fontWeight: 'bold',
    marginBottom: '60px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '30px',
  },
  featureCard: {
    padding: '30px',
    borderRadius: '20px',
    background: '#0a0a0a',
    border: '1px solid #222',
    transition: 'transform 0.3s',
  },
  featureCardHover: {
    transform: 'translateY(-10px)',
    borderColor: '#444',
  },
  featureIconBox: {
    display: 'inline-flex',
    padding: '12px',
    borderRadius: '12px',
    marginBottom: '20px',
  },
  featureTitle: { fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' },
  featureDesc: { color: '#888', lineHeight: '1.5' },

  pricingSection: {
    position: 'relative',
    zIndex: 10,
    padding: '100px 20px',
  },
  pricingSubtitle: { textAlign: 'center', color: '#888', marginBottom: '50px' },
  pricingGrid: {
    display: 'flex',
    justifyContent: 'center',
  },
  pricingCard: {
    background: '#0a0a0a',
    padding: '40px',
    borderRadius: '24px',
    border: '1px solid #333',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
  },
  pricingCardHighlight: {
    border: '1px solid #a855f7',
    boxShadow: '0 0 30px rgba(168, 85, 247, 0.1)',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: '-15px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#a855f7',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  pricingName: { fontSize: '24px', marginBottom: '10px' },
  pricingPrice: { marginBottom: '30px' },
  pricingAmount: { fontSize: '48px', fontWeight: '900' },
  pricingPeriod: { color: '#888' },
  featureList: { listStyle: 'none', padding: 0, textAlign: 'left', margin: '0 auto 30px', maxWidth: '300px' },
  featureListItem: { display: 'flex', gap: '10px', marginBottom: '15px', color: '#ccc' },
  featureCheck: { color: '#06b6d4', width: 20 },
  pricingBtnHighlight: {
    width: '100%',
    padding: '15px',
    borderRadius: '50px',
    border: 'none',
    background: 'white',
    color: 'black',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
  },
  footer: {
    padding: '40px 20px',
    borderTop: '1px solid #222',
    textAlign: 'center',
    color: '#666',
    zIndex: 10,
    position: 'relative',
  },
  footerInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  footerLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: 'white' },
  footerBrand: { fontWeight: 'bold' }
};

export default KaraokeLanding;