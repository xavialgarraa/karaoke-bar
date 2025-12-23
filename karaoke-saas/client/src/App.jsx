import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import VistaClienteDemo from './pages/VistaClienteDemo.jsx'
import SalesPage from './pages/SalesPage.jsx'
import VistaSuperAdmin from './pages/VistaSuperAdmin.jsx'
import VistaCliente from './pages/VistaCliente.jsx'
import Tv from './pages/TvDemo.jsx'
import KaraokeTV from './pages/Tv.jsx'
import ResetPasswordPage from './pages/ResetPassword.jsx'
import { Navigate } from 'react-router-dom';
import "./index.css";


function App() {
  return (
    <Router basename="/karaoke-bar">
      <Routes>
        {/* 2. Añade esta ruta como la principal "/" */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/tv" element={<Tv />} />
        <Route path="/bar-demo/tv" element={<Tv />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bar-demo" element={<VistaClienteDemo />} />
        <Route path="/:slug" element={<VistaCliente />} />
        <Route path="/tv/:slug" element={<KaraokeTV />} />
        <Route path="/admin/dashboard/:slug" element={<AdminPage />} />
        <Route path="/sales" element={<SalesPage />} />    
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/superadmin" element={<VistaSuperAdmin />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App
