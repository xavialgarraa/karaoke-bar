const express = require('express');
const fs = require('fs');
const router = express.Router();

// --- IMPORTS ---
const verifyToken = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');
const youtubeController = require('../controllers/youtubeController.js');
const catalogController = require('../controllers/catalogController');
const adminController = require('../controllers/adminController');
const superAdminController = require('../controllers/superAdminController');
const pipeline = require('../services/pipeline');

// ==========================================
// RUTAS PÚBLICAS (Cualquiera puede entrar)
// ==========================================

// Auth
router.post('/auth/login', authController.login);
router.post('/auth/forgot', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// Cliente / Karaoke
router.get('/youtube/search', youtubeController.searchVideos); // Buscador con caché
router.get('/catalog/random', catalogController.getRandomSong); // Canción aleatoria

// ==========================================
// RUTAS PROTEGIDAS (Solo Admin con Token)
// ==========================================

// Gestión de Cola
router.get('/queue/:slug', adminController.getQueue);          // Ver cola
router.delete('/queue/:id', verifyToken, adminController.deleteFromQueue);  // Borrar
router.post('/queue/reorder', verifyToken, adminController.reorderQueue);   // Reordenar

// Configuración
router.put('/bar/:currentSlug', verifyToken, adminController.updateBarConfig); // Editar bar
router.get('/bar/data/:slug', verifyToken, adminController.getBarInfo);              // Datos del bar

// ... al final del archivo

// ==========================================
// 🎵 PIPELINE (descarga + letras)
// ==========================================

router.get('/pipeline/status/:videoId', (req, res) => {
  res.json({ status: pipeline.getStatus(req.params.videoId) });
});

router.get('/pipeline/audio/:videoId', (req, res) => {
  const audioPath = pipeline.getAudioPath(req.params.videoId);
  if (!fs.existsSync(audioPath)) return res.status(404).json({ error: 'Not processed yet' });

  const stat = fs.statSync(audioPath);
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'audio/webm',
    });
    fs.createReadStream(audioPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'audio/webm' });
    fs.createReadStream(audioPath).pipe(res);
  }
});

router.get('/pipeline/lyrics/:videoId', (req, res) => {
  const lyricsPath = pipeline.getLyricsPath(req.params.videoId);
  if (!fs.existsSync(lyricsPath)) return res.status(404).end();
  res.type('text/plain').sendFile(lyricsPath);
});

// ==========================================
// 👑 RUTAS SUPER ADMIN
// ==========================================
router.post('/superadmin/create-tenant', superAdminController.createTenant);
router.get('/superadmin/tenants', superAdminController.getAllTenants); 
router.delete('/superadmin/tenant/:id', superAdminController.deleteTenant); 

module.exports = router;
