import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic2, Lock, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_CLIENT_URL || "http://localhost:3001";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams(); // Captura el token largo de la URL
  
  // --- ESTADOS ---
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- ANIMACIONES CSS ---
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validaciones básicas
    if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }
    if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
    }

    setIsLoading(true);

    try {
        // 2. Enviar al Backend
        // Asumo que tu ruta backend espera { token, newPassword }
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token,
                newPassword: formData.password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'El enlace ha expirado o es inválido.');
        }

        // 3. Éxito
        setSuccess(true);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
            navigate('/login');
        }, 3000);

    } catch (err) {
        console.error("Reset error:", err);
        setError(err.message || "Error al conectar con el servidor.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}></div>

      {/* Botón volver solo si hay error o no ha terminado */}
      {!success && (
          <button 
            onClick={() => navigate('/login')} 
            style={styles.backButton}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00f2ff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            <ArrowLeft size={20} /> Volver al Login
          </button>
      )}

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Mic2 size={32} color="#00f2ff" />
          </div>
          <h1 style={styles.title}>Restablecer Contraseña</h1>
          <p style={styles.subtitle}>Crea una nueva clave para tu cuenta</p>
        </div>

        {success ? (
            // --- VISTA DE ÉXITO ---
            <div className="fade-in" style={{textAlign:'center', padding:'20px 0'}}>
                <div style={{display:'inline-flex', background:'rgba(0,255,136,0.1)', padding:'20px', borderRadius:'50%', marginBottom:'20px'}}>
                    <CheckCircle size={50} color="#00ff88" />
                </div>
                <h3 style={{color:'white', marginBottom:'10px'}}>¡Contraseña Actualizada!</h3>
                <p style={{color:'#888'}}>Redirigiendo al login...</p>
            </div>
        ) : (
            // --- FORMULARIO ---
            <form onSubmit={handleSubmit} style={styles.form} className="fade-in">
            
            {/* Password */}
            <div style={styles.inputGroup}>
                <label style={styles.label}>Nueva Contraseña</label>
                <div style={styles.inputWrapper}>
                    <Lock size={20} color="#666" style={styles.inputIcon} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        placeholder="••••••••"
                        value={formData.password} 
                        onChange={handleChange}
                        style={styles.input} 
                        required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                        {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
                    </button>
                </div>
            </div>

            {/* Confirm Password */}
            <div style={styles.inputGroup}>
                <label style={styles.label}>Confirmar Contraseña</label>
                <div style={styles.inputWrapper}>
                    <Lock size={20} color="#666" style={styles.inputIcon} />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        name="confirmPassword" 
                        placeholder="••••••••"
                        value={formData.confirmPassword} 
                        onChange={handleChange}
                        style={styles.input} 
                        required
                    />
                </div>
            </div>

            {/* Errores */}
            {error && <div style={styles.errorMessage}>{error}</div>}

            {/* Botón */}
            <button 
                type="submit" 
                style={{...styles.button, opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer'}}
                disabled={isLoading}
            >
                {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Loader2 className="animate-spin" size={20} /> Guardando...
                </span>
                ) : (
                "Cambiar Contraseña"
                )}
            </button>
            </form>
        )}
      </div>
    </div>
  );
};

// --- ESTILOS (Reutilizados del Login) ---
const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden', padding: '20px' },
  background: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, #1a0b2e 0%, #000 100%)', zIndex: 0 },
  backButton: { position: 'absolute', top: '30px', left: '30px', zIndex: 20, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', transition: 'color 0.3s ease' },
  card: { position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '40px', backgroundColor: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  header: { textAlign: 'center', marginBottom: '30px' },
  iconContainer: { width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(0, 242, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(0, 242, 255, 0.2)' },
  title: { color: '#fff', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' },
  subtitle: { color: '#888', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#ccc', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', border: '1px solid #333', transition: 'all 0.3s ease' },
  inputIcon: { position: 'absolute', left: '12px', zIndex: 1 },
  input: { width: '100%', padding: '12px 40px 12px 40px', backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '16px', outline: 'none' },
  eyeButton: { position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px', zIndex: 2 },
  errorMessage: { backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff4d4d', padding: '10px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', border: '1px solid rgba(255, 0, 0, 0.2)' },
  button: { marginTop: '10px', padding: '14px', backgroundColor: '#00f2ff', color: '#000', fontWeight: 'bold', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', justifyContent: 'center', alignItems: 'center' },
};

export default ResetPasswordPage;