const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// --- IMPORTS ---
const verifyToken = require('../middlewares/authMiddleware');
const { verifyTokenQuery } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');
const youtubeController = require('../controllers/youtubeController.js');
const catalogController = require('../controllers/catalogController');
const adminController = require('../controllers/adminController');
const superAdminController = require('../controllers/superAdminController');
const pipeline = require('../services/pipeline');

// Strict rate limit for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,
    message: { message: 'Demasiados intentos, espera 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Moderate rate limit for search (YouTube quota protection)
const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { message: 'Demasiadas búsquedas, intenta más tarde.' },
});

// YouTube video IDs are exactly 11 alphanumeric/-/_ chars
const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const validateVideoId = (req, res, next) => {
    if (!VIDEO_ID_RE.test(req.params.videoId)) {
        return res.status(400).json({ error: 'videoId inválido' });
    }
    next();
};

// ==========================================
// RUTAS PÚBLICAS (Cualquiera puede entrar)
// ==========================================

// Auth
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/forgot', authLimiter, authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);

// Cliente / Karaoke
router.get('/youtube/search', searchLimiter, youtubeController.searchVideos);
router.get('/catalog/random', catalogController.getRandomSong);

// ==========================================
// RUTAS PROTEGIDAS (Solo Admin con Token)
// ==========================================

// Gestión de Cola
router.get('/queue/:slug', adminController.getQueue);          // Ver cola
router.delete('/queue/:id', verifyToken, adminController.deleteFromQueue);  // Borrar
router.post('/queue/reorder', verifyToken, adminController.reorderQueue);   // Reordenar

// Configuración
router.put('/bar/:currentSlug', verifyToken, adminController.updateBarConfig); // Editar bar
router.get('/bar/data/:slug', adminController.getBarInfo);                           // Datos del bar (público)

// ... al final del archivo

// ==========================================
// 🎵 PIPELINE (descarga + letras)
// ==========================================

router.post('/pipeline/process', verifyToken, (req, res) => {
  const { videoId, titulo, artista } = req.body;
  if (!videoId || !titulo) return res.status(400).json({ error: 'videoId and titulo required' });
  if (!VIDEO_ID_RE.test(videoId)) return res.status(400).json({ error: 'videoId inválido' });
  pipeline.processSong(videoId, titulo, artista || '').catch(console.error);
  res.json({ ok: true });
});

router.get('/pipeline/status/:videoId', verifyToken, validateVideoId, async (req, res) => {
  const status = await pipeline.getStatus(req.params.videoId);
  res.json({ status });
});

router.get('/pipeline/audio/:videoId', verifyTokenQuery, validateVideoId, (req, res) => {
  const audioPath = pipeline.getAudioPath(req.params.videoId);
  if (!fs.existsSync(audioPath)) return res.status(404).json({ error: 'Not processed yet' });

  const stat = fs.statSync(audioPath);
  if (stat.size === 0) return res.status(404).json({ error: 'Audio not ready' });

  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = Math.max(0, parseInt(startStr, 10) || 0);
    const end = Math.min(stat.size - 1, endStr ? parseInt(endStr, 10) : stat.size - 1);
    if (start > end || start >= stat.size) {
      return res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
    }
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': 'audio/mpeg',
    });
    fs.createReadStream(audioPath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'audio/mpeg' });
    fs.createReadStream(audioPath).pipe(res);
  }
});

router.get('/pipeline/lyrics/:videoId', verifyToken, validateVideoId, (req, res) => {
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
