import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2, Lock, Mail, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [view, setView] = useState('login'); // 'login' | 'forgot'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // Mensaje de éxito para recuperación

  // --- ANIMACIONES CSS INYECTADAS ---
  useEffect(() => {
    const styleId = 'spin-animation-style';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement("style");
      styleSheet.id = styleId;
      styleSheet.innerText = `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .fade-in { animation: fadeIn 0.5s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // --- HANDLER LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (formData.email === 'admin@bar.com' && formData.password === '1234') {
        localStorage.setItem('karaoke_token', 'token_falso_demo');
        navigate('/admin/dashboard'); 
      } else {
        if (formData.email !== '') setError('Credenciales incorrectas. (Demo: admin@bar.com / 1234)');
        else setError('Por favor, rellena todos los campos.');
        setIsLoading(false);
      }
    }, 1500); 
  };

  // --- HANDLER RECUPERAR PASS ---
  const handleForgot = async (e) => {
    e.preventDefault();
    if (!formData.email) {
        setError('Introduce tu email para recuperar la contraseña.');
        return;
    }
    setIsLoading(true);
    // Simulación de envío de email
    setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg(`Hemos enviado un enlace de recuperación a ${formData.email}`);
        setError('');
    }, 1500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}></div>

      <button 
        onClick={() => navigate('/')} 
        style={styles.backButton}
        onMouseEnter={(e) => e.currentTarget.style.color = '#00f2ff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
      >
        <ArrowLeft size={20} /> Volver al inicio
      </button>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Mic2 size={32} color="#00f2ff" />
          </div>
          <h1 style={styles.title}>
              {view === 'login' ? 'Acceso Dueños' : 'Recuperar Cuenta'}
          </h1>
          <p style={styles.subtitle}>
              {view === 'login' ? 'Gestiona tu Karaoke SaaS' : 'Te enviaremos un email de acceso'}
          </p>
        </div>

        {/* --- FORMULARIO DINÁMICO --- */}
        <form onSubmit={view === 'login' ? handleLogin : handleForgot} style={styles.form} className="fade-in">
          
          {/* Input Email (Común a ambos) */}
          {!successMsg && (
            <div style={styles.inputGroup}>
                <label style={styles.label}>Email Corporativo</label>
                <div style={{
                ...styles.inputWrapper,
                borderColor: focusedInput === 'email' ? '#00f2ff' : '#333',
                boxShadow: focusedInput === 'email' ? '0 0 10px rgba(0, 242, 255, 0.2)' : 'none'
                }}>
                <Mail size={20} color={focusedInput === 'email' ? '#00f2ff' : '#666'} style={styles.inputIcon} />
                <input 
                    type="email" name="email" placeholder="ej: contacto@barmanolo.es"
                    value={formData.email} onChange={handleChange}
                    onFocus={() => setFocusedInput('email')} onBlur={() => setFocusedInput(null)}
                    style={styles.input} required
                />
                </div>
            </div>
          )}

          {/* Input Password (Solo en Login) */}
          {view === 'login' && (
            <div style={styles.inputGroup}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                    <label style={styles.label}>Contraseña</label>
                    <span 
                        onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); }} 
                        style={styles.forgotLink}
                    >
                        ¿Olvidaste la contraseña?
                    </span>
                </div>
                <div style={{
                ...styles.inputWrapper,
                borderColor: focusedInput === 'password' ? '#00f2ff' : '#333',
                boxShadow: focusedInput === 'password' ? '0 0 10px rgba(0, 242, 255, 0.2)' : 'none'
                }}>
                <Lock size={20} color={focusedInput === 'password' ? '#00f2ff' : '#666'} style={styles.inputIcon} />
                <input 
                    type={showPassword ? "text" : "password"} name="password" placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                    onFocus={() => setFocusedInput('password')} onBlur={() => setFocusedInput(null)}
                    style={styles.input} required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                </button>
                </div>
            </div>
          )}

          {/* Mensajes de Estado */}
          {error && <div style={styles.errorMessage}>{error}</div>}
          {successMsg && <div style={styles.successMessage}><CheckCircleIcon /> {successMsg}</div>}

          {/* Botón Principal */}
          {!successMsg && (
            <button 
                type="submit" 
                style={{...styles.button, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer'}}
                disabled={isLoading}
            >
                {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Loader2 className="animate-spin" size={20} /> Procesando...
                </span>
                ) : view === 'login' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Entrar al Panel <ArrowRight size={20} />
                </span>
                ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Enviar Enlace <KeyRound size={20} />
                </span>
                )}
            </button>
          )}

          {/* Botón Volver al Login (Solo en Forgot) */}
          {view === 'forgot' && (
              <button type="button" onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }} style={styles.secondaryBtn}>
                  Cancelar y Volver
              </button>
          )}
        </form>

        <div style={styles.footer}>
          <p>¿No tienes cuenta? <span onClick={() => navigate('/sales')} style={styles.link}>Contacta con ventas</span></p>
        </div>
      </div>
    </div>
  );
};

// Icono auxiliar para éxito
const CheckCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'10px'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden', padding: '20px' },
  background: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, #1a0b2e 0%, #000 100%)', zIndex: 0 },
  backButton: { position: 'absolute', top: '30px', left: '30px', zIndex: 20, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', transition: 'color 0.3s ease' },
  card: { position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '40px', backgroundColor: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  header: { textAlign: 'center', marginBottom: '30px' },
  iconContainer: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0, 242, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(0, 242, 255, 0.2)' },
  title: { color: '#fff', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' },
  subtitle: { color: '#888', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#ccc', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  forgotLink: { fontSize: '12px', color: '#00f2ff', cursor: 'pointer', textDecoration: 'underline' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid #333', transition: 'all 0.3s ease' },
  inputIcon: { position: 'absolute', left: '12px', zIndex: 1, transition: 'color 0.3s ease' },
  input: { width: '100%', padding: '12px 40px 12px 40px', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '16px', outline: 'none' },
  eyeButton: { position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px', zIndex: 2 },
  errorMessage: { backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff4d4d', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(255, 0, 0, 0.2)' },
  successMessage: { backgroundColor: 'rgba(0, 255, 0, 0.1)', color: '#00ff88', padding: '15px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', border: '1px solid rgba(0, 255, 0, 0.2)', display:'flex', alignItems:'center', justifyContent:'center' },
  button: { marginTop: '10px', padding: '14px', backgroundColor: '#00f2ff', color: '#000', fontWeight: 'bold', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  secondaryBtn: { padding: '10px', backgroundColor: 'transparent', color: '#888', fontSize: '14px', border: 'none', cursor: 'pointer', textDecoration:'underline' },
  footer: { marginTop: '30px', textAlign: 'center', fontSize: '14px', color: '#666' },
  link: { color: '#00f2ff', textDecoration: 'none', cursor: 'pointer' }
};

export default LoginPage;