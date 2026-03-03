# 🎤 Karaoke SaaS 
## Plataforma de Gestión de TurnosAplicación web **Multi-Tenant** para la gestión de colas de karaoke en bares y locales de ocio. Permite a los clientes pedir canciones desde su móvil escaneando un QR, mientras el local proyecta los vídeos y la lista de espera en una pantalla gigante.

## 🚀 Características Principales **📱 Cliente (Móvil):** Interfaz web ligera (sin login complejo) para buscar canciones y pedir turno.
* **📺 Pantalla Pública (TV):** Vista "Split Screen" (Vídeo YouTube + Lista de Espera) sincronizada en tiempo real.
* **🧠 Buscador Inteligente:** Filtra automáticamente resultados de YouTube para evitar "covers", "reacciones" o versiones sin letra.
* **⚡ Tiempo Real:** Uso de WebSockets (`Socket.io`) para actualizaciones instantáneas entre móvil, servidor y TV.
* **🏢 Multi-Tenant:** Una sola instalación sirve a múltiples bares mediante URLs personalizadas (ej: `/bar-manolo`, `/pub-la-cueva`).
* **💾 Caché Híbrida:** Base de datos PostgreSQL que "aprende" las canciones correctas para evitar búsquedas repetitivas.

---

## 🛠️ Stack TecnológicoEste proyecto utiliza una arquitectura **Monorepo**:

* **Frontend (`/client`):**
* React.js + Vite
* React Router DOM (Gestión de rutas por Bar)
* Socket.io-client
* React-Youtube


* **Backend (`/server`):**
* Node.js + Express
* Socket.io (Gestión de Salas/Rooms por Bar)
* PostgreSQL (Persistencia de datos)
* `youtube-sr` (Scraping de vídeos sin API Key)


* **Infraestructura:**
* Docker + Coolify (Despliegue)
* VPS Linux (DigitalOcean/Hetzner)



---

## 📦 Instalación y Configuración Local###1. Prerrequisitos* Node.js (v18 o superior)
* PostgreSQL (Local o Docker)
* Git

###2. Clonar el repositorio```bash
git clone https://github.com/xavialgarraa/karaoke-bar
cd karaoke-app

```

###3. Configuración del Backend```bash
cd server
npm install

```

Crea un archivo `.env` en la carpeta `server` con tus credenciales de base de datos local:

```env
PORT=3001
DB_USER=postgres
DB_HOST=localhost
DB_NAME=karaoke_db
DB_PASSWORD=tu_password
DB_PORT=5432
# CORS (URL de tu frontend local)
CLIENT_URL=http://localhost:5173

```

###4. Configuración del FrontendEn una nueva terminal:

```bash
cd client
npm install

```

Crea un archivo `.env` en la carpeta `client`:

```env
# URL de tu backend local
VITE_API_URL=http://localhost:3001

```

---

## 🗄️ Base de Datos (Schema)Ejecuta este script SQL en tu base de datos PostgreSQL para crear las tablas necesarias:

```sql
-- 1. Tabla de Clientes (Bares)
CREATE TABLE bares (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'bar-manolo'
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catálogo Inteligente (Caché de canciones)
CREATE TABLE catalogo_canciones (
    id SERIAL PRIMARY KEY,
    titulo_busqueda VARCHAR(255) UNIQUE NOT NULL, -- Ej: 'despacito luis fonsi'
    titulo_bonito VARCHAR(255),
    youtube_id VARCHAR(20) NOT NULL,
    thumbnail_url TEXT,
    veces_cantada INT DEFAULT 1
);

-- 3. Cola de Turnos (Sesión actual)
CREATE TABLE cola_turnos (
    id SERIAL PRIMARY KEY,
    bar_id INTEGER REFERENCES bares(id),
    usuario_nombre VARCHAR(50),
    youtube_id VARCHAR(20),
    titulo VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'espera', -- 'espera', 'sonando', 'finalizado'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERTAR DATOS DE PRUEBA
INSERT INTO bares (nombre, slug) VALUES ('Bar Manolo', 'bar-manolo');

```

---

## ▶️ Ejecutar el ProyectoNecesitarás **dos terminales** abiertas:

**Terminal 1 (Backend):**

```bash
cd server
npm start
# Debería decir: "Servidor corriendo en puerto 3001" y "Conectado a DB"

```

**Terminal 2 (Frontend):**

```bash
cd client
npm run dev
# Abrir en navegador: http://localhost:5173/bar-manolo

```

---

## 🚢 Despliegue (Producción)Este proyecto está optimizado para desplegarse usando **Coolify** en un VPS.

### Notas para el servidor (VPS 1GB RAM)Si usas un servidor pequeño (ej. 6$/mes), **es obligatorio activar SWAP** antes de desplegar para evitar caídas:

```bash
# Ejecutar en el VPS como root
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

```

### Pasos en Coolify1. Crear un recurso **PostgreSQL**.
2. Crear un recurso **Application** (desde GitHub).
3. Configurar las variables de entorno (`DB_HOST`, `DB_PASS`, etc.) usando los datos internos de Coolify.
4. Comando de arranque: `cd server && npm install && node index.js`. (Esto puede variar si separas front y back en dos servicios).

---

## 📄 Estructura del Proyecto
```text
/karaoke-app
├── /server           # API REST + Websockets
│   ├── /controllers  # Lógica de búsqueda y colas
│   ├── /utils        # Algoritmo de filtrado YouTube
│   └── index.js      # Entry point
├── /client           # SPA React
│   ├── /src
│   │   ├── /pages    # Vistas (Móvil, TV, Admin)
│   │   └── /hooks    # useSocket logic
└── README.md

```

---

**Desarrollado por: *Javier Algarra Pérez* 
