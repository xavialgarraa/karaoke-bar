const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// --- MIDDLEWARE MANUAL PARA ESTE CONTROLADOR ---
const checkKey = (req) => {
    return req.headers['x-master-key'] === process.env.SUPER_ADMIN_KEY;
};


const createTenant = async (req, res) => {
    // 1. SEGURIDAD: Verificar la Master Key
    const masterKey = req.headers['x-master-key'];
    
    if (masterKey !== process.env.SUPER_ADMIN_KEY) {
        return res.status(403).json({ message: '⛔ Acceso denegado. Master Key incorrecta.' });
    }

    // 2. Recibir datos del Body
    const { nombreBar, slugBar, ubicacion, plan, email, password } = req.body;

    if (!nombreBar || !slugBar || !email || !password) {
        return res.status(400).json({ message: 'Faltan datos obligatorios.' });
    }

    const connection = await pool.getConnection(); // Usamos transacción por seguridad

    try {
        await connection.beginTransaction();

        // A. Verificar si ya existe el slug o el email
        const [existing] = await connection.query(
            "SELECT id FROM bars WHERE slug = ? UNION SELECT id FROM users WHERE email = ?",
            [slugBar, email]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'El Slug del bar o el Email ya existen.' });
        }

        // B. Crear el Bar
        const [barResult] = await connection.query(
            "INSERT INTO bars (nombre, slug, ubicacion, plan) VALUES (?, ?, ?, ?)",
            [nombreBar, slugBar, ubicacion, plan || 'FREE']
        );
        const newBarId = barResult.insertId;

        // C. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // D. Crear el Usuario Admin vinculado al Bar
        await connection.query(
            "INSERT INTO users (bar_id, email, password, role) VALUES (?, ?, ?, 'admin')",
            [newBarId, email, hashedPassword]
        );

        await connection.commit(); // ✅ Confirmar todo

        console.log(`🎉 Nuevo cliente creado: ${nombreBar} (${email})`);
        
        res.status(201).json({
            message: 'Cliente creado con éxito',
            bar: { id: newBarId, nombre: nombreBar, slug: slugBar },
            admin: { email: email }
        });

    } catch (error) {
        await connection.rollback(); // ❌ Deshacer si algo falla
        console.error("Error creando tenant:", error);
        res.status(500).json({ message: 'Error interno al crear el cliente.' });
    } finally {
        connection.release();
    }
};


// 2. LISTAR TODOS LOS BARES Y DUEÑOS
const getAllTenants = async (req, res) => {
    if (!checkKey(req)) return res.status(403).json({ message: '⛔ Acceso denegado.' });

    try {
        // Sacamos datos del bar y el email del admin principal
        const [rows] = await pool.query(`
            SELECT b.id, b.nombre, b.slug, b.plan, b.ubicacion, u.email 
            FROM bars b 
            LEFT JOIN users u ON b.id = u.bar_id 
            WHERE u.role = 'admin'
            ORDER BY b.id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al listar clientes.' });
    }
};

// 3. ELIMINAR UN BAR (¡PELIGROSO!)
const deleteTenant = async (req, res) => {
    if (!checkKey(req)) return res.status(403).json({ message: '⛔ Acceso denegado.' });
    
    const { id } = req.params;

    try {
        // Al borrar el bar, el "ON DELETE CASCADE" de MySQL borrará automáticamente:
        // - Los usuarios asociados
        // - Las canciones en la cola (peticiones)
        await pool.query("DELETE FROM bars WHERE id = ?", [id]);
        
        res.json({ message: 'Cliente y todos sus datos eliminados correctamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar cliente.' });
    }
};

module.exports = { createTenant, getAllTenants, deleteTenant };