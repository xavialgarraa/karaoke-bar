const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Nos quedamos solo con el token

    if (!token) {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere autenticación.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

module.exports = verifyToken;