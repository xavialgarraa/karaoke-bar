const express = require('express');
const router = express.Router();

// --- IMPORTS ---
const verifyToken = require('../middlewares/authMiddleware'); // Middleware de seguridad
const authController = require('../controllers/authController');
const youtubeController = require('../controllers/youtubeController.js');
const catalogController = require('../controllers/catalogController');
const adminController = require('../controllers/adminController');
const superAdminController = require('../controllers/superAdminController');

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
// 👑 RUTAS SUPER ADMIN
// ==========================================
router.post('/superadmin/create-tenant', superAdminController.createTenant);
router.get('/superadmin/tenants', superAdminController.getAllTenants); 
router.delete('/superadmin/tenant/:id', superAdminController.deleteTenant); 

module.exports = router;
