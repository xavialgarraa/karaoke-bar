const io = require('socket.io-client');

// 1. Conectar al servidor
const socket = io('http://localhost:3001');

const MI_BAR = 'disco-paquito'; // ⚠️ Asegúrate de que este SLUG existe en tu BD

console.log('🔌 Intentando conectar...');

socket.on('connect', () => {
    console.log(`✅ Conectado con ID: ${socket.id}`);

    // 2. Unirse al Bar
    console.log(`➡️ Entrando al bar: ${MI_BAR}...`);
    socket.emit('unirse_bar', MI_BAR);
});

// Escuchar si hubo error al entrar al bar
socket.on('error_bar', (msg) => {
    console.error('❌ Error Bar:', msg);
    process.exit(1);
});

// 3. Esperar un poco y pedir canción
setTimeout(() => {
    const datosPeticion = {
        slug: MI_BAR,
        usuario: {
            nombre: "Cliente de Prueba",
            avatar: "https://robohash.org/test"
        },
        cancion: {
            videoId: "video_test_" + Math.floor(Math.random() * 1000), // ID aleatorio
            titulo: "Canción de Prueba Socket",
            artista: "Javi Node",
            cover: "https://via.placeholder.com/150"
        }
    };

    console.log('🎵 Pidiendo canción...');
    socket.emit('pedir_cancion', datosPeticion);

}, 1000); // Esperamos 1 segundo para asegurar que estamos unidos a la sala

// 4. Escuchar confirmación (Solo para mí)
socket.on('turno_confirmado', (data) => {
    console.log('------------------------------------------------');
    console.log('🎟️  ¡TICKET RECIBIDO!');
    console.log(`   Turno: ${data.turno}`);
    console.log(`   Espera: ${data.tiempoEspera} minutos`);
    console.log(`   Canción ID (DB): ${data.cancion.id}`);
    console.log('------------------------------------------------');
});

// 5. Escuchar actualización global (Lo que vería la TV del bar)
socket.on('nueva_cancion_anadida', (data) => {
    console.log('📺  [TV] Nueva canción apareció en la lista:', data.titulo);
    
    // Cerramos el test tras el éxito
    setTimeout(() => {
        console.log('👋 Test finalizado.');
        socket.disconnect();
    }, 2000);
});