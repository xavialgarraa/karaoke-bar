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
    try {
        // Get bar slug before deleting
        const [petRows] = await pool.query(
          "SELECT b.slug FROM peticiones p JOIN bars b ON p.bar_id = b.id WHERE p.id = ?",
          [id]
        );
        await pool.query("DELETE FROM peticiones WHERE id = ?", [id]);

        if (petRows.length) {
          const io = getIo();
          if (io) io.to(petRows[0].slug).emit('cola_actualizada');
        }

        res.json({ message: 'Canción eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error eliminando canción' });
    }
};

// 3. REORDENAR COLA (Drag & Drop)
const reorderQueue = async (req, res) => {
    const { items } = req.body; // Recibimos array: [{id: 1, turno: 1}, {id: 5, turno: 2}...]

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Datos inválidos' });
    }

    try {
        const connection = await pool.getConnection(); 
        try {
            await connection.beginTransaction(); 

            for (const item of items) {
                await connection.query(
                    "UPDATE peticiones SET turno_numero = ? WHERE id = ?", 
                    [item.turno, item.id]
                );
            }

            await connection.commit();

            // Emit after successful commit
            const [petRows] = await pool.query(
              "SELECT b.slug FROM peticiones p JOIN bars b ON p.bar_id = b.id WHERE p.id = ? LIMIT 1",
              [items[0].id]
            ).catch(() => [[]]);
            if (petRows.length) {
              const io = getIo();
              if (io) io.to(petRows[0].slug).emit('cola_actualizada');
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
    const { nombre, ubicacion, slug, plan } = req.body; // Datos que vienen del formulario

    try {
        await pool.query(`
            UPDATE bars 
            SET nombre = ?, ubicacion = ?, slug = ?, plan = ? 
            WHERE slug = ?
        `, [nombre, ubicacion, slug, plan, currentSlug]);

        res.json({ message: 'Configuración guardada exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error actualizando el bar' });
    }
};

module.exports = { getQueue, deleteFromQueue, reorderQueue, updateBarConfig, getBarInfo };