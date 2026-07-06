const pool = require('../config/db');
const { getIo } = require('../services/socket');

const getQueue = async (req, res) => {
    const { slug } = req.params;
    try {
        const [barRows] = await pool.query("SELECT id FROM bars WHERE slug = ?", [slug]);
        
        if (barRows.length === 0) return res.status(404).json({ message: 'Bar no encontrado' });
        
        const barId = barRows[0].id;

        const [rows] = await pool.query(`
            SELECT * FROM peticiones 
            WHERE bar_id = ? AND estado = 'espera' 
            ORDER BY turno_numero ASC
        `, [barId]);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando la cola' });
    }
};

const getBarInfo = async (req, res) => {
    const { slug } = req.params;
    try {
        const [rows] = await pool.query("SELECT id, nombre, ubicacion, plan, slug FROM bars WHERE slug = ?", [slug]);

        if (rows.length === 0) return res.status(404).json({ message: 'Bar no encontrado' });

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo información del bar' });
    }
};

// 2. ELIMINAR CANCIÓN (Papelera)
const deleteFromQueue = async (req, res) => {
    const { id } = req.params;
    const barId = req.user?.barId;
    try {
        const [petRows] = await pool.query(
          "SELECT b.slug FROM peticiones p JOIN bars b ON p.bar_id = b.id WHERE p.id = ? AND b.id = ?",
          [id, barId]
        );
        if (!petRows.length) return res.status(403).json({ message: 'No autorizado' });

        await pool.query("DELETE FROM peticiones WHERE id = ? AND bar_id = ?", [id, barId]);

        const io = getIo();
        if (io) io.to(petRows[0].slug).emit('cola_actualizada');

        res.json({ message: 'Canción eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error eliminando canción' });
    }
};

// 3. REORDENAR COLA (Drag & Drop)
const reorderQueue = async (req, res) => {
    const { items } = req.body;
    const barId = req.user?.barId;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Datos inválidos' });
    }

    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            for (const item of items) {
                // Ownership check per item — only update if it belongs to this admin's bar
                await connection.query(
                    "UPDATE peticiones SET turno_numero = ? WHERE id = ? AND bar_id = ?",
                    [item.turno, item.id, barId]
                );
            }

            await connection.commit();

            const [barRows] = await pool.query("SELECT slug FROM bars WHERE id = ?", [barId]).catch(() => [[]]);
            if (barRows.length) {
                const io = getIo();
                if (io) io.to(barRows[0].slug).emit('cola_actualizada');
            }

            res.json({ message: 'Orden actualizado' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error reordenando:", error);
        res.status(500).json({ message: 'Error al reordenar la cola' });
    }
};

// 4. ACTUALIZAR CONFIGURACIÓN DEL BAR
const updateBarConfig = async (req, res) => {
    const { currentSlug } = req.params;
    const barId = req.user?.barId;
    const { nombre, ubicacion, slug, plan } = req.body;

    try {
        // Verify the admin owns the bar they're trying to update
        const [barRows] = await pool.query("SELECT id FROM bars WHERE slug = ? AND id = ?", [currentSlug, barId]);
        if (!barRows.length) return res.status(403).json({ message: 'No autorizado' });

        await pool.query(`
            UPDATE bars
            SET nombre = ?, ubicacion = ?, slug = ?, plan = ?
            WHERE slug = ? AND id = ?
        `, [nombre, ubicacion, slug, plan, currentSlug, barId]);

        res.json({ message: 'Configuración guardada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error actualizando el bar' });
    }
};

module.exports = { getQueue, deleteFromQueue, reorderQueue, updateBarConfig, getBarInfo };