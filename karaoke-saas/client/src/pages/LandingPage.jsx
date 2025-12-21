import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2, Smartphone, Tv, Zap, Shield, TrendingUp, Check, Star, Play, ArrowRight, ChevronDown, ChevronUp, Users, Music } from 'lucide-react';

const KaraokeLanding = () => {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null); // Estado para acordeón FAQs
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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
          <button style={styles.navButton} onClick={() => navigate('/login')}>
            Acceso Dueños
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.leftColumn}>
            <div style={styles.badge}>
              🚀 La revolución del Karaoke en España
            </div>
            
            <h1 style={styles.title}>
              Tu Bar, Más Rentable<br />
              <span style={styles.gradientText}>Sin Papel ni Líos</span>
            </h1>
            
            <p style={styles.subtitle}>
              Olvídate de las notas de papel y los borrachos gritando al DJ. 
              Tus clientes escanean un QR, piden su canción y la TV lo gestiona sola.
            </p>

            <div style={styles.ctaContainer}>
              <button style={styles.primaryBtn} onClick={() => navigate('/bar-demo/')}>
                <Smartphone style={styles.btnIcon} />
                Probar como Cliente
              </button>
              
              <button style={styles.secondaryBtn} onClick={() => navigate('/bar-demo/tv')}>
                <Tv style={styles.btnIcon} />
                 Ver Pantalla TV
              </button>
            </div>

            <div style={styles.socialProof}>
              <div style={styles.proofItem}>
                <Star style={styles.starIcon} fill="currentColor" />
                <span>Validado por técnicos de sonido</span>
              </div>
            </div>
          </div>

          {/* MOCKUP VISUAL (CSS PURO) */}
          <div style={styles.rightColumn}>
             <div style={styles.mockupContainer}>
                {/* TV Mockup */}
                <div style={styles.tvMockup}>
                   <div style={styles.tvScreen}>
                      <div style={styles.tvLeft}>
                         <Music size={40} color="rgba(255,255,255,0.2)" />
                         <div style={styles.playBtn}></div>
                      </div>
                      <div style={styles.tvRight}>
                         <div style={styles.line}></div>
                         <div style={styles.line}></div>
                         <div style={styles.line}></div>
                      </div>
                   </div>
                   <div style={styles.tvStand}></div>
                </div>
                {/* Phone Mockup */}
                <div style={styles.phoneMockup}>
                   <div style={styles.phoneNotch}></div>
                   <div style={styles.phoneScreen}>
                      <div style={styles.qrPlaceholder}>
                         <Smartphone size={24} color="#00f2ff" />
                      </div>
                      <div style={styles.btnPlaceholder}></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA (NUEVA SECCIÓN) */}
      <section style={styles.stepsSection}>
         <div style={styles.sectionInner}>
            <h2 style={styles.sectionTitle}>Tan fácil que no necesita <span style={styles.gradientText}>instrucciones</span></h2>
            <div style={styles.stepsGrid}>
               <StepCard 
                  num="1" 
                  title="El cliente escanea" 
                  desc="Sin descargar Apps. Un código QR en la mesa abre la web al instante."
               />
               <StepCard 
                  num="2" 
                  title="Pide su canción" 
                  desc="Busca en YouTube desde su móvil. Nuestro filtro evita versiones malas."
               />
               <StepCard 
                  num="3" 
                  title="La TV hace el resto" 
                  desc="El sistema organiza la cola y reproduce el video automáticamente."
               />
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <div style={styles.sectionInner}>
          <div style={styles.featuresGrid}>
            <FeatureCard 
              icon={<Smartphone style={styles.featureIcon} />}
              title="Cero Fricción"
              desc="Tus clientes no tienen que registrarse ni bajar nada. Más fácil, imposible."
              color="#06b6d4"
            />
            <FeatureCard 
              icon={<Tv style={styles.featureIcon} />}
              title="Pantalla Split"
              desc="Video a la izquierda, lista de espera a la derecha. Todo el bar sabe cuándo le toca."
              color="#a855f7"
            />
            <FeatureCard 
              icon={<Shield style={styles.featureIcon} />}
              title="Anti-Trolls"
              desc="¿Un cliente gracioso quiere poner una canción de 10 minutos? El sistema la bloquea."
              color="#ec4899"
            />
            <FeatureCard 
              icon={<Zap style={styles.featureIcon} />}
              title="Auto-Gestión"
              desc="El DJ ya no es un secretario. Se dedica a animar, no a apuntar nombres."
              color="#06b6d4"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={styles.pricingSection}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionTitle}>
            Rentable desde la <span style={styles.gradientText}>primera copa</span>
          </h2>
          <p style={styles.pricingSubtitle}>Más barato que contratar a alguien para gestionar la cola.</p>

          <div style={styles.pricingGrid}>
            <PricingCard 
              name="Licencia Profesional"
              price="45"
              features={[
                'Sistema completo QR + TV',
                'Cola de turnos ilimitada',
                'Soporte técnico prioritario',
                'Instalación y Configuración (Pago único)'
              ]}
              highlight={true}
            />
          </div>
        </div>
      </section>

      {/* FAQ SECTION (NUEVA) */}
      <section style={styles.faqSection}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionTitle}>Preguntas Frecuentes</h2>
          <div style={styles.faqContainer}>
            <FaqItem 
               question="¿Necesito un ordenador potente?" 
               answer="No. Cualquier portátil básico o mini-PC conectado a la TV funciona perfectamente."
               isOpen={openFaq === 0}
               onClick={() => toggleFaq(0)}
            />
            <FaqItem 
               question="¿Qué pasa si se va internet?" 
               answer="El sistema guarda las canciones en caché local para que la música no pare de golpe."
               isOpen={openFaq === 1}
               onClick={() => toggleFaq(1)}
            />
            <FaqItem 
               question="¿Cómo controla el dueño la cola?" 
               answer="Tienes un panel de administrador secreto para saltar turnos, borrar canciones o banear usuarios."
               isOpen={openFaq === 2}
               onClick={() => toggleFaq(2)}
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
          <div style={styles.footerCopy}>© 2025 - Hecho para técnicos de sonido</div>
        </div>
      </footer>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const StepCard = ({ num, title, desc }) => (
   <div style={styles.stepCard}>
      <div style={styles.stepNum}>{num}</div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepDesc}>{desc}</p>
   </div>
);

const FaqItem = ({ question, answer, isOpen, onClick }) => (
   <div style={styles.faqItem} onClick={onClick}>
      <div style={styles.faqQuestion}>
         <span>{question}</span>
         {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && <div style={styles.faqAnswer}>{answer}</div>}
   </div>
);

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
  const navigate = useNavigate();
  return (
    <div style={{...styles.pricingCard, ...(highlight ? styles.pricingCardHighlight : {})}}>
      {highlight && <div style={styles.popularBadge}>OFERTA DE LANZAMIENTO</div>}
      <h3 style={styles.pricingName}>{name}</h3>
      <div style={styles.pricingPrice}>
        <span style={styles.pricingAmount}>{price}€</span>
        <span style={styles.pricingPeriod}>/mes</span>
      </div>
      <p style={{color:'#666', fontSize:'12px', marginBottom:'20px'}}>+ Cuota de alta (instalación)</p>
      <ul style={styles.featureList}>
        {features.map((feature, idx) => (
          <li key={idx} style={styles.featureListItem}>
            <Check style={styles.featureCheck} />
            <span style={styles.featureText}>{feature}</span>
          </li>
        ))}
      </ul>
      <button style={styles.pricingBtnHighlight} onClick={() => navigate('/sales')}>
        Contactar para Demo
      </button>
    </div>
  );
};

// --- ESTILOS OPTIMIZADOS ---

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: "'Inter', sans-serif",
    overflowX: 'hidden',
    position: 'relative'
  },
  bgFixed: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
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
    transition: 'all 0.3s',
  },
  hero: {
    position: 'relative',
    zIndex: 10,
    padding: '140px 20px 80px',
  },
  heroInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '40px',
  },
  leftColumn: {
    flex: '1 1 500px', // Ocupa espacio pero baja en móvil
    textAlign: 'left',
  },
  rightColumn: {
    flex: '1 1 400px',
    display: 'flex',
    justifyContent: 'center',
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
    fontSize: 'clamp(40px, 6vw, 64px)', 
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
    fontSize: 'clamp(16px, 3vw, 18px)',
    color: '#ccc',
    lineHeight: '1.6',
    marginBottom: '40px',
    maxWidth: '500px',
  },
  ctaContainer: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '40px',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    borderRadius: '50px',
    background: 'linear-gradient(90deg, #06b6d4 0%, #a855f7 100%)',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    borderRadius: '50px',
    background: '#111',
    border: '1px solid #444',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  btnIcon: { width: 18, height: 18 },
  socialProof: {
    display: 'flex',
    color: '#888',
    fontSize: '14px',
  },
  proofItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  starIcon: { color: '#fbbf24', width: 16 },

  // MOCKUPS CSS
  mockupContainer: {
    position: 'relative',
    width: '300px',
    height: '250px',
  },
  tvMockup: {
    width: '280px',
    height: '180px',
    background: '#111',
    border: '4px solid #333',
    borderRadius: '10px',
    position: 'absolute',
    top: 0,
    left: 0,
    boxShadow: '0 20px 50px rgba(168, 85, 247, 0.2)',
    zIndex: 1,
  },
  tvScreen: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #1a0b2e 0%, #000 100%)',
    display: 'flex',
    overflow: 'hidden',
  },
  tvLeft: { flex: 2, borderRight: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  tvRight: { flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' },
  line: { height: '6px', background: '#333', borderRadius: '3px', width: '100%' },
  playBtn: { width: '30px', height: '30px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', marginTop: '10px' },
  tvStand: { width: '80px', height: '20px', background: '#222', margin: '0 auto', borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' },
  
  phoneMockup: {
    width: '90px',
    height: '180px',
    background: '#000',
    border: '3px solid #444',
    borderRadius: '15px',
    position: 'absolute',
    bottom: '-30px',
    right: '-20px',
    zIndex: 2,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  phoneNotch: { width: '40%', height: '10px', background: '#111', margin: '0 auto', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px' },
  phoneScreen: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  qrPlaceholder: { width: '50px', height: '50px', border: '2px solid #00f2ff', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPlaceholder: { width: '40px', height: '6px', background: '#333', borderRadius: '3px' },

  // STEPS
  stepsSection: { padding: '80px 20px', background: '#050505' },
  stepsGrid: {
     display: 'flex',
     flexWrap: 'wrap',
     gap: '20px',
     justifyContent: 'center',
  },
  stepCard: {
     flex: '1 1 250px',
     background: '#0a0a0a',
     padding: '30px',
     borderRadius: '16px',
     border: '1px solid #222',
     textAlign: 'center',
  },
  stepNum: {
     width: '40px',
     height: '40px',
     background: 'linear-gradient(135deg, #06b6d4 0%, #a855f7 100%)',
     borderRadius: '50%',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     fontSize: '20px',
     fontWeight: 'bold',
     margin: '0 auto 20px',
  },
  stepTitle: { fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' },
  stepDesc: { fontSize: '14px', color: '#888' },

  // FEATURES
  featuresSection: { padding: '80px 20px' },
  sectionInner: { maxWidth: '1200px', margin: '0 auto' },
  sectionTitle: { textAlign: 'center', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 'bold', marginBottom: '60px' },
  // FIX: Grid responsivo real
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
  },
  featureCard: { padding: '30px', borderRadius: '20px', background: '#0a0a0a', border: '1px solid #222', transition: 'transform 0.3s' },
  featureCardHover: { transform: 'translateY(-10px)', borderColor: '#444' },
  featureIconBox: { display: 'inline-flex', padding: '12px', borderRadius: '12px', marginBottom: '20px' },
  featureTitle: { fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' },
  featureDesc: { color: '#888', lineHeight: '1.5' },

  // PRICING
  pricingSection: { padding: '80px 20px' },
  pricingSubtitle: { textAlign: 'center', color: '#888', marginBottom: '50px' },
  pricingGrid: { display: 'flex', justifyContent: 'center' },
  pricingCard: { background: '#0a0a0a', padding: '40px', borderRadius: '24px', border: '1px solid #333', maxWidth: '400px', width: '100%', textAlign: 'center' },
  pricingCardHighlight: { border: '1px solid #a855f7', boxShadow: '0 0 30px rgba(168, 85, 247, 0.1)', position: 'relative' },
  popularBadge: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#a855f7', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  pricingName: { fontSize: '24px', marginBottom: '10px' },
  pricingPrice: { marginBottom: '10px' },
  pricingAmount: { fontSize: '48px', fontWeight: '900' },
  pricingPeriod: { color: '#888' },
  featureList: { listStyle: 'none', padding: 0, textAlign: 'left', margin: '0 auto 30px', maxWidth: '300px' },
  featureListItem: { display: 'flex', gap: '10px', marginBottom: '15px', color: '#ccc' },
  featureCheck: { color: '#06b6d4', width: 20 },
  pricingBtnHighlight: { width: '100%', padding: '15px', borderRadius: '50px', border: 'none', background: 'white', color: 'black', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },

  // FAQ
  faqSection: { padding: '80px 20px', background: '#050505' },
  faqContainer: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' },
  faqItem: { background: '#111', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #222' },
  faqQuestion: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '18px' },
  faqAnswer: { padding: '0 20px 20px', color: '#aaa', lineHeight: '1.6' },

  // FOOTER
  footer: { padding: '40px 20px', borderTop: '1px solid #222', textAlign: 'center', color: '#666' },
  footerInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
  footerLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: 'white' },
  footerBrand: { fontWeight: 'bold' }
};

export default KaraokeLanding;