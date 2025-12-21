import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import VistaCliente from './pages/VistaCliente.jsx'
import SalesPage from './pages/SalesPage.jsx'
import Tv from './pages/Tv.jsx'
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
        <Route path="/bar-demo" element={<VistaCliente />} />
        <Route path="/admin/dashboard" element={<AdminPage />} />
        <Route path="/sales" element={<SalesPage />} />
      </Routes>
    </Router>
  );
}

export default App
