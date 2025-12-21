const express = require('express');
const router = express.Router();
const { searchVideos } = require('../controllers/YoutubeController');
//const protect = require('../middlewares/authMiddleware'); // Opcional: si quieres que solo logueados busquen

// Ruta: GET /api/youtube/search?query=cancion
router.get('/search', searchVideos); 

module.exports = router;