const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// 1. IMPORTAMOS RESEND (Ya no usamos nodemailer)
const { Resend } = require('resend');

// 2. INICIALIZAMOS RESEND
const resend = new Resend(process.env.RESEND_API_KEY);

// Login de Dueño (Sin cambios, solo lo dejo para completar el archivo)
const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.email, u.password, u.bar_id, b.slug 
            FROM users u
            JOIN bars b ON u.bar_id = b.id
            WHERE u.email = ?
        `, [email]);

        if (rows.length === 0) return res.status(401).json({ message: 'Usuario no encontrado' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

        const token = jwt.sign(
            { id: user.id, barId: user.bar_id, slug: user.slug }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30d' }
        );

        res.json({ token, slug: user.slug, email: user.email });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.json({ message: 'Si el correo existe, recibirás instrucciones.' });
        }
        
        const user = rows[0];

        const resetToken = jwt.sign(
            { id: user.id, email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        const link = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const htmlContent = `
            <div style="background-color: #050505; color: #fff; padding: 40px; text-align: center; font-family: sans-serif;">
                <h1>Restablecer Contraseña</h1>
                <p>Haz clic abajo para cambiar tu contraseña:</p>
                <a href="${link}" style="background-color: #00f2ff; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Cambiar Contraseña
                </a>
                <p style="font-size: 12px; margin-top: 20px;">Expira en 1 hora.</p>
            </div>
        `;

        // 3. ENVÍO CON RESEND (Aquí está el cambio clave)
        // Nota: 'from' debe ser un dominio verificado o el de pruebas de Resend
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev', 
            to: email,
            subject: '🔐 Acción requerida: Restablecer contraseña',
            html: htmlContent
        });

        console.log(`📧 Email enviado con ID: ${data.id}`);
        res.json({ message: 'Si el correo existe, recibirás instrucciones.' });

    } catch (error) {
        console.error("Error enviando email con Resend:", error);
        res.status(500).json({ message: 'Error al enviar el correo.' });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) return res.status(400).json({ message: 'Faltan datos.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userEmail = decoded.email;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE id = ?', 
            [hashedPassword, userId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });

        // 4. ENVÍO DE CONFIRMACIÓN CON RESEND
        const successHtml = `
            <div style="background-color: #050505; color: #fff; padding: 40px; text-align: center; font-family: sans-serif;">
                <h1 style="color: #00ff88;">¡Éxito!</h1>
                <p>Tu contraseña ha sido actualizada correctamente.</p>
                <a href="${process.env.CLIENT_URL}/login" style="color: #00f2ff;">Ir a Iniciar Sesión</a>
            </div>
        `;

        // Enviamos sin await para no bloquear
        resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: userEmail,
            subject: '✅ Contraseña actualizada correctamente',
            html: successHtml
        }).catch(err => console.error("Error en confirmación:", err));

        res.json({ message: '¡Contraseña actualizada con éxito!' });

    } catch (error) {
        console.error("Error reset password:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'El enlace ha caducado. Solicita uno nuevo.' });
        }
        res.status(400).json({ message: 'Enlace inválido.' });
    }
};

module.exports = { login, forgotPassword, resetPassword };
