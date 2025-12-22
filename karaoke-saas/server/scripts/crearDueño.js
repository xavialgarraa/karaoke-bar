// server/scripts/crearDueño.js
const pool = require('../config/db'); // Tu conexión MySQL
const bcrypt = require('bcryptjs');

// ==========================================
// 📝 DATOS DEL NUEVO CLIENTE (¡EDITA ESTO!)
// ==========================================
const DATOS = {
    // 1. Datos del Bar
    nombreBar: "Disco Paquito",
    slugBar: "disco-paquito",  // La URL (ej: tudominio.com/disco-paquito)
    ubicacion: "Valencia, Playa",
    plan: "PRO", 
    
    // 2. Datos del Dueño (Admin)
    email: "paquito@disco.com",
    passwordInicial: "paquito2025" // La contraseña temporal que le darás
};

// ==========================================
// 🚀 LÓGICA DEL SCRIPT
// ==========================================
const crearTodo = async () => {
    try {
        console.log("🛠️  Iniciando creación de cliente...");

        // 1. ENCRIPTAR CONTRASEÑA
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DATOS.passwordInicial, salt);

        // 2. CREAR (O BUSCAR) EL BAR
        // Usamos INSERT IGNORE o comprobamos si existe para no duplicar slugs
        let barId;
        
        // Intentamos buscar si ya existe
        const [barExistente] = await pool.query("SELECT id FROM bars WHERE slug = ?", [DATOS.slugBar]);

        if (barExistente.length > 0) {
            console.log(`⚠️ El bar '${DATOS.slugBar}' ya existía. Usando ID existente.`);
            barId = barExistente[0].id;
        } else {
            // Si no existe, lo creamos
            const [resultBar] = await pool.query(
                "INSERT INTO bars (nombre, slug, ubicacion, plan) VALUES (?, ?, ?, ?)",
                [DATOS.nombreBar, DATOS.slugBar, DATOS.ubicacion, DATOS.plan]
            );
            barId = resultBar.insertId;
            console.log(`✅ Bar creado con ID: ${barId}`);
        }

        // 3. CREAR EL USUARIO ADMIN
        // Borramos si ya existía ese email para sobreescribirlo (opcional, útil en dev)
        await pool.query("DELETE FROM users WHERE email = ?", [DATOS.email]);

        await pool.query(
            "INSERT INTO users (bar_id, email, password, role) VALUES (?, ?, ?, 'admin')",
            [barId, DATOS.email, hashedPassword]
        );

        console.log(`✅ Usuario creado: ${DATOS.email}`);
        console.log("---------------------------------------------------");
        console.log("🎉 ¡TODO LISTO! ENVÍA ESTO AL CLIENTE:");
        console.log(`   URL Panel:  http://localhost:5173/admin`); // O tu dominio real
        console.log(`   Usuario:    ${DATOS.email}`);
        console.log(`   Contraseña: ${DATOS.passwordInicial}`);
        console.log("---------------------------------------------------");

    } catch (error) {
        console.error("❌ Error creando cliente:", error);
    } finally {
        // Cerramos la conexión para que el script termine
        pool.end(); 
    }
};

crearTodo();