import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('karaoke_token');
    navigate('/login');
  };

  return (
    <div style={{ padding: '50px', color: 'white', background: '#111', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>👋 Panel de Control (Admin)</h1>
      <p>Aquí gestionaremos las canciones, banearemos usuarios y veremos estadísticas.</p>
      <button 
        onClick={handleLogout}
        style={{ marginTop: '20px', padding: '10px 20px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Cerrar Sesión
      </button>
    </div>
  );
};

export default AdminDashboard;