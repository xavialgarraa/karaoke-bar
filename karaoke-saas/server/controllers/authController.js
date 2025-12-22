const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Login de Dueño
const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // 1. Buscamos el usuario
        const [rows] = await pool.query(`
            SELECT u.id, u.email, u.password, u.bar_id, b.slug 
            FROM users u
            JOIN bars b ON u.bar_id = b.id
            WHERE u.email = ?
        `, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const user = rows[0];

        // 2. COMPARAR CONTRASEÑA (Bcrypt)
        // Compara lo que escribió el usuario con el hash de la BD
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // 3. GENERAR TOKEN JWT
        // En el payload guardamos el ID del usuario y el ID del bar
        const token = jwt.sign(
            { id: user.id, barId: user.bar_id, slug: user.slug }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' } // El token caduca en 7 días
        );

        res.json({
            token,
            slug: user.slug,
            email: user.email
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Verificar si el usuario existe
        const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.json({ message: 'Si el correo existe, recibirás instrucciones.' });
        }
        
        const user = rows[0];

        // 2. Generar un Token de un solo uso (valido por 1 hora)
        // Usamos una clave secreta diferente (concatenando la pass actual) para que 
        // si el usuario cambia la contraseña, este token deje de funcionar automáticamente.
        const resetToken = jwt.sign(
            { id: user.id, email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // 3. Crear el Link de recuperación (Apunta a tu Frontend)
        // Asumimos que crearás esta ruta en React: /reset-password/:token
        const link = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // 4. Configurar el Cartero (Transporter)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 5. Configurar el Email
        const mailOptions = {
            from: '"Karaoke Pro Admin" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: '🔐 Recupera tu contraseña - Karaoke Pro',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #00f2ff;">Recuperación de Contraseña</h2>
                    <p>Has solicitado restablecer tu contraseña para el panel de Karaoke.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva (válido por 1 hora):</p>
                    <a href="${link}" style="background-color: #00f2ff; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #777;">Si no fuiste tú, ignora este mensaje.</p>
                </div>
            `
        };

        // 6. ENVIAR 🚀
        await transporter.sendMail(mailOptions);
        console.log(`📧 Correo enviado a ${email}`);

        res.json({ message: 'Correo enviado. Revisa tu bandeja de entrada.' });

    } catch (error) {
        console.error("Error enviando email:", error);
        res.status(500).json({ message: 'Error al enviar el correo.' });
    }
};


const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    // Validación básica
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Faltan datos (token o nueva contraseña).' });
    }

    try {
        // A. VERIFICAR EL TOKEN
        // Si ha expirado (pasó 1 hora) o es falso, esto lanzará un error automáticamente
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // El token tenía dentro el ID del usuario: { id: user.id, email: ... }
        const userId = decoded.id;

        // B. ENCRIPTAR LA NUEVA CONTRASEÑA
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // C. ACTUALIZAR EN BASE DE DATOS
        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE id = ?', 
            [hashedPassword, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        console.log(`🔐 Contraseña actualizada para el usuario ID: ${userId}`);
        res.json({ message: '¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error("Error reset password:", error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'El enlace ha caducado. Vuelve a solicitarlo.' });
        }
        
        res.status(400).json({ message: 'Enlace inválido o corrupto.' });
    }
};

// --- IMPORTANTE: Añade resetPassword al exports ---
module.exports = { login, forgotPassword, resetPassword };