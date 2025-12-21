require('dotenv').config(); // Aseguramos que cargue las variables
const { google } = require('googleapis');

// Inicializamos el cliente (sin auth aquí, lo pondremos en la llamada)
const youtube = google.youtube('v3');

const searchVideos = async (req, res) => {
  // 1. CHIVATO DE SEGURIDAD: Comprobamos si la clave existe antes de llamar
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error("❌ ERROR CRÍTICO: La variable YOUTUBE_API_KEY es undefined.");
    console.error("👉 Asegúrate de que el archivo .env está en la carpeta raíz 'server/' y no en 'src/'");
    return res.status(500).json({ message: 'Error de configuración del servidor (API KEY missing)' });
  }

  try {
    const { query } = req.query; 

    if (!query) {
      return res.status(400).json({ message: 'Falta el término de búsqueda' });
    }

    console.log(`🔎 Buscando en YouTube: "${query}" usando Key: ${apiKey.substring(0, 5)}...`);

    const term = `${query} karaoke letra`;

    // 2. LLAMADA ROBUSTA: Pasamos la 'key' aquí directamente
    const response = await youtube.search.list({
      key: apiKey, // <--- AQUÍ ES DONDE DEBE IR PARA EVITAR EL ERROR
      part: 'snippet',
      q: term,
      type: 'video',
      videoEmbeddable: 'true',
      maxResults: 10
    });

    const videos = response.data.items.map(item => ({
      id: item.id.videoId,
      titulo: item.snippet.title,
      descripcion: item.snippet.description,
      imagen: item.snippet.thumbnails.high.url,
      canal: item.snippet.channelTitle
    }));

    res.json(videos);

  } catch (error) {
    console.error('❌ Error en YouTube API:', error.message);
    
    if (error.code === 403) {
        return res.status(429).json({ message: 'Cuota diaria de YouTube excedida o clave inválida.' });
    }
    
    res.status(500).json({ message: 'Error buscando canciones', error: error.message });
  }
};

module.exports = { searchVideos };