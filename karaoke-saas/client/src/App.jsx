import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'

function App() {
  return (
    <Router>
      <Routes>
        {/* 2. Añade esta ruta como la principal "/" */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App
