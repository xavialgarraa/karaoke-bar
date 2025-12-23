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
            // Por seguridad, no decimos si el email existe o no, pero enviamos respuesta genérica
            return res.json({ message: 'Si el correo existe, recibirás instrucciones.' });
        }
        
        const user = rows[0];

        // 2. Generar Token (1 hora de validez)
        const resetToken = jwt.sign(
            { id: user.id, email }, // Guardamos el email en el token para usarlo luego
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // 3. Link al Frontend
        const link = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // 4. Configurar Transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 5. Plantilla HTML Profesional (Solicitud)
        const htmlContent = `
            <div style="background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
                    <div style="background-color: #000; padding: 20px; text-align: center; border-bottom: 2px solid #00f2ff;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">Karaoke<span style="color: #00f2ff;">Pro</span></h1>
                    </div>
                    <div style="padding: 40px 30px; color: #e0e0e0; text-align: center;">
                        <h2 style="color: #fff; margin-top: 0;">¿Olvidaste tu contraseña?</h2>
                        <p style="font-size: 16px; color: #b0b0b0; line-height: 1.5;">Hola, hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
                        
                        <div style="margin: 30px 0;">
                            <a href="${link}" style="background-color: #00f2ff; color: #000; padding: 14px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);">
                                Restablecer Contraseña
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">Este enlace expirará en 1 hora.</p>
                        <p style="font-size: 12px; color: #555; margin-top: 30px;">Si no has solicitado este cambio, puedes ignorar este correo de forma segura.</p>
                    </div>
                    <div style="background-color: #111; padding: 15px; text-align: center; font-size: 12px; color: #444;">
                        &copy; ${new Date().getFullYear()} Karaoke Pro System. Todos los derechos reservados.
                    </div>
                </div>
            </div>
        `;

        // 6. Enviar
        await transporter.sendMail({
            from: '"Karaoke Pro Security" <' + process.env.EMAIL_USER + '>',
            to: email,
            subject: '🔐 Acción requerida: Restablecer contraseña',
            html: htmlContent
        });

        console.log(`📧 Link de recuperación enviado a ${email}`);
        res.json({ message: 'Si el correo existe, recibirás instrucciones.' });

    } catch (error) {
        console.error("Error enviando email:", error);
        res.status(500).json({ message: 'Error al enviar el correo.' });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Faltan datos.' });
    }

    try {
        // A. Verificar Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const userEmail = decoded.email; // ¡Lo recuperamos del token!

        // B. Encriptar
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // C. Actualizar DB
        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE id = ?', 
            [hashedPassword, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // D. ENVIAR CORREO DE CONFIRMACIÓN DE ÉXITO 📧✅
        // Esto es vital por seguridad (avisar al usuario si no fue él)
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const successHtml = `
            <div style="background-color: #050505; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
                    <div style="background-color: #000; padding: 20px; text-align: center; border-bottom: 2px solid #00ff88;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">Karaoke<span style="color: #00f2ff;">Pro</span></h1>
                    </div>
                    <div style="padding: 40px 30px; color: #e0e0e0; text-align: center;">
                        <div style="color: #00ff88; font-size: 50px; margin-bottom: 20px;">✓</div>
                        <h2 style="color: #fff; margin-top: 0;">¡Contraseña Actualizada!</h2>
                        <p style="font-size: 16px; color: #b0b0b0; line-height: 1.5;">La contraseña de tu cuenta ha sido modificada correctamente.</p>
                        
                        <p style="font-size: 14px; color: #ff4d4d; margin-top: 30px; background: rgba(255, 77, 77, 0.1); padding: 10px; border-radius: 8px;">
                            ⚠ Si NO has realizado este cambio, por favor contacta con soporte inmediatamente.
                        </p>
                        
                        <div style="margin-top: 30px;">
                            <a href="${process.env.CLIENT_URL}/login" style="color: #00f2ff; text-decoration: none; font-weight: bold;">Ir a Iniciar Sesión →</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Enviamos el correo sin await para no hacer esperar al usuario en la respuesta HTTP
        transporter.sendMail({
            from: '"Karaoke Pro Security" <' + process.env.EMAIL_USER + '>',
            to: userEmail,
            subject: '✅ Contraseña actualizada correctamente',
            html: successHtml
        }).catch(err => console.error("Error enviando email de confirmación:", err));

        console.log(`🔐 Contraseña actualizada y notificada para ID: ${userId}`);
        res.json({ message: '¡Contraseña actualizada con éxito!' });

    } catch (error) {
        console.error("Error reset password:", error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'El enlace ha caducado. Solicita uno nuevo.' });
        }
        
        res.status(400).json({ message: 'Enlace inválido.' });
    }
};

// --- IMPORTANTE: Añade resetPassword al exports ---
module.exports = { login, forgotPassword, resetPassword };