const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const csvLoader = require('./csvLoader');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Configuración de Multer para archivos CSV
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'csv-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.txt'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos CSV y TXT'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

// Crear directorio uploads si no existe
fs.mkdir('uploads', { recursive: true }).catch(console.error);

// Configuración de base de datos
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'clinicuser',
    password: 'clinicpass',
    database: 'crudclinic'
};

// Pool de conexiones
let pool;

async function initDB() {
    pool = mysql.createPool(dbConfig);
    console.log('🔌 Conectado a MySQL CrudClinic');
}

// ==================== PACIENTES ====================

// GET /pacientes - Listar todos
app.get('/pacientes', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM pacientes ORDER BY id');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pacientes' });
    }
});

// GET /pacientes/:id - Obtener uno
app.get('/pacientes/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM pacientes WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener paciente' });
    }
});

// POST /pacientes - Crear
app.post('/pacientes', async (req, res) => {
    try {
        const { nombre, email, telefono } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO pacientes (nombre, email, telefono) VALUES (?, ?, ?)',
            [nombre, email, telefono]
        );
        res.status(201).json({ id: result.insertId, message: 'Paciente creado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear paciente' });
    }
});

// PUT /pacientes/:id - Actualizar completo
app.put('/pacientes/:id', async (req, res) => {
    try {
        const { nombre, email, telefono } = req.body;
        const [result] = await pool.execute(
            'UPDATE pacientes SET nombre = ?, email = ?, telefono = ? WHERE id = ?',
            [nombre, email, telefono, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json({ message: 'Paciente actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar paciente' });
    }
});

// PATCH /pacientes/:id - Actualizar parcial
app.patch('/pacientes/:id', async (req, res) => {
    try {
        const updates = [];
        const values = [];
        
        Object.keys(req.body).forEach(key => {
            if (['nombre', 'email', 'telefono'].includes(key)) {
                updates.push(`${key} = ?`);
                values.push(req.body[key]);
            }
        });
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
        }
        
        values.push(req.params.id);
        const [result] = await pool.execute(
            `UPDATE pacientes SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json({ message: 'Paciente actualizado parcialmente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar paciente' });
    }
});

// DELETE /pacientes/:id - Eliminar
app.delete('/pacientes/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM pacientes WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json({ message: 'Paciente eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar paciente' });
    }
});

// ==================== MÉDICOS ====================

// GET /medicos - Listar todos con especialidad
app.get('/medicos', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT m.*, e.nombre as especialidad 
            FROM medicos m 
            JOIN especialidades e ON m.especialidad_id = e.id 
            ORDER BY m.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener médicos' });
    }
});

// GET /medicos/:id - Obtener uno
app.get('/medicos/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT m.*, e.nombre as especialidad 
            FROM medicos m 
            JOIN especialidades e ON m.especialidad_id = e.id 
            WHERE m.id = ?
        `, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener médico' });
    }
});

// POST /medicos - Crear
app.post('/medicos', async (req, res) => {
    try {
        const { nombre, especialidad_id, email, telefono } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO medicos (nombre, especialidad_id, email, telefono) VALUES (?, ?, ?, ?)',
            [nombre, especialidad_id, email, telefono]
        );
        res.status(201).json({ id: result.insertId, message: 'Médico creado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear médico' });
    }
});

// PUT /medicos/:id - Actualizar completo
app.put('/medicos/:id', async (req, res) => {
    try {
        const { nombre, especialidad_id, email, telefono } = req.body;
        const [result] = await pool.execute(
            'UPDATE medicos SET nombre = ?, especialidad_id = ?, email = ?, telefono = ? WHERE id = ?',
            [nombre, especialidad_id, email, telefono, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }
        res.json({ message: 'Médico actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar médico' });
    }
});

// PATCH /medicos/:id - Actualizar parcial
app.patch('/medicos/:id', async (req, res) => {
    try {
        const updates = [];
        const values = [];
        
        Object.keys(req.body).forEach(key => {
            if (['nombre', 'especialidad_id', 'email', 'telefono'].includes(key)) {
                updates.push(`${key} = ?`);
                values.push(req.body[key]);
            }
        });
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
        }
        
        values.push(req.params.id);
        const [result] = await pool.execute(
            `UPDATE medicos SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }
        res.json({ message: 'Médico actualizado parcialmente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar médico' });
    }
});

// DELETE /medicos/:id - Eliminar
app.delete('/medicos/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM medicos WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }
        res.json({ message: 'Médico eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar médico' });
    }
});

// ==================== CITAS ====================

// GET /citas - Listar todas con información completa
app.get('/citas', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT c.id, c.fecha, c.hora, c.motivo, c.descripcion,
                   p.nombre as paciente, p.email as paciente_email,
                   m.nombre as medico, e.nombre as especialidad,
                   u.nombre as ubicacion,
                   mp.nombre as metodo_pago,
                   ec.nombre as estado, ec.color as estado_color
            FROM citas c
            JOIN pacientes p ON c.paciente_id = p.id
            JOIN medicos m ON c.medico_id = m.id
            JOIN especialidades e ON m.especialidad_id = e.id
            JOIN ubicaciones u ON c.ubicacion_id = u.id
            JOIN metodos_pago mp ON c.metodo_pago_id = mp.id
            JOIN estados_cita ec ON c.estado_id = ec.id
            ORDER BY c.fecha DESC, c.hora DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener citas' });
    }
});

// GET /citas/:id - Obtener una cita
app.get('/citas/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT c.*, p.nombre as paciente, m.nombre as medico, 
                   e.nombre as especialidad, u.nombre as ubicacion,
                   mp.nombre as metodo_pago, ec.nombre as estado
            FROM citas c
            JOIN pacientes p ON c.paciente_id = p.id
            JOIN medicos m ON c.medico_id = m.id
            JOIN especialidades e ON m.especialidad_id = e.id
            JOIN ubicaciones u ON c.ubicacion_id = u.id
            JOIN metodos_pago mp ON c.metodo_pago_id = mp.id
            JOIN estados_cita ec ON c.estado_id = ec.id
            WHERE c.id = ?
        `, [req.params.id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener cita' });
    }
});

// POST /citas - Crear cita
app.post('/citas', async (req, res) => {
    try {
        const { paciente_id, medico_id, ubicacion_id, fecha, hora, motivo, descripcion, metodo_pago_id, estado_id } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO citas (paciente_id, medico_id, ubicacion_id, fecha, hora, motivo, descripcion, metodo_pago_id, estado_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [paciente_id, medico_id, ubicacion_id, fecha, hora, motivo, descripcion, metodo_pago_id, estado_id]
        );
        res.status(201).json({ id: result.insertId, message: 'Cita creada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear cita' });
    }
});

// PUT /citas/:id - Actualizar cita completa
app.put('/citas/:id', async (req, res) => {
    try {
        const { paciente_id, medico_id, ubicacion_id, fecha, hora, motivo, descripcion, metodo_pago_id, estado_id } = req.body;
        const [result] = await pool.execute(
            'UPDATE citas SET paciente_id = ?, medico_id = ?, ubicacion_id = ?, fecha = ?, hora = ?, motivo = ?, descripcion = ?, metodo_pago_id = ?, estado_id = ? WHERE id = ?',
            [paciente_id, medico_id, ubicacion_id, fecha, hora, motivo, descripcion, metodo_pago_id, estado_id, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        res.json({ message: 'Cita actualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar cita' });
    }
});

// PATCH /citas/:id - Actualizar cita parcial
app.patch('/citas/:id', async (req, res) => {
    try {
        const updates = [];
        const values = [];
        const validFields = ['paciente_id', 'medico_id', 'ubicacion_id', 'fecha', 'hora', 'motivo', 'descripcion', 'metodo_pago_id', 'estado_id'];
        
        Object.keys(req.body).forEach(key => {
            if (validFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(req.body[key]);
            }
        });
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
        }
        
        values.push(req.params.id);
        const [result] = await pool.execute(
            `UPDATE citas SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        res.json({ message: 'Cita actualizada parcialmente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar cita' });
    }
});

// DELETE /citas/:id - Eliminar cita
app.delete('/citas/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM citas WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }
        res.json({ message: 'Cita eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar cita' });
    }
});

// ==================== ESPECIALIDADES ====================

app.get('/especialidades', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM especialidades ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener especialidades' });
    }
});

app.post('/especialidades', async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO especialidades (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion]
        );
        res.status(201).json({ id: result.insertId, message: 'Especialidad creada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear especialidad' });
    }
});

// ==================== UBICACIONES ====================

app.get('/ubicaciones', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM ubicaciones ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener ubicaciones' });
    }
});

app.post('/ubicaciones', async (req, res) => {
    try {
        const { nombre, direccion } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO ubicaciones (nombre, direccion) VALUES (?, ?)',
            [nombre, direccion]
        );
        res.status(201).json({ id: result.insertId, message: 'Ubicación creada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear ubicación' });
    }
});

// ==================== MÉTODOS DE PAGO ====================

app.get('/metodos-pago', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM metodos_pago ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener métodos de pago' });
    }
});

app.post('/metodos-pago', async (req, res) => {
    try {
        const { nombre } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO metodos_pago (nombre) VALUES (?)',
            [nombre]
        );
        res.status(201).json({ id: result.insertId, message: 'Método de pago creado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear método de pago' });
    }
});

// ==================== ESTADOS CITA ====================

app.get('/estados-cita', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM estados_cita ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estados de cita' });
    }
});

app.post('/estados-cita', async (req, res) => {
    try {
        const { nombre, color } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO estados_cita (nombre, color) VALUES (?, ?)',
            [nombre, color || '#6c757d']
        );
        res.status(201).json({ id: result.insertId, message: 'Estado de cita creado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear estado de cita' });
    }
});

// ==================== CONSULTAS AVANZADAS ====================

// 1. Listar todas las citas completas (ya implementado en GET /citas)

// 2. Filtrar citas por médico y rango de fechas
app.get('/citas/medico/:medico_id', async (req, res) => {
    try {
        const { medico_id } = req.params;
        const { fecha_inicio, fecha_fin } = req.query;
        
        let query = `
            SELECT c.id, c.fecha, c.hora, c.motivo,
                   p.nombre as paciente, m.nombre as medico,
                   e.nombre as especialidad, ec.nombre as estado
            FROM citas c
            JOIN pacientes p ON c.paciente_id = p.id
            JOIN medicos m ON c.medico_id = m.id
            JOIN especialidades e ON m.especialidad_id = e.id
            JOIN estados_cita ec ON c.estado_id = ec.id
            WHERE c.medico_id = ?
        `;
        
        const params = [medico_id];
        
        if (fecha_inicio && fecha_fin) {
            query += ' AND c.fecha BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        }
        
        query += ' ORDER BY c.fecha DESC, c.hora DESC';
        
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al filtrar citas por médico' });
    }
});

// 3. Obtener pacientes con más de 3 citas registradas
app.get('/pacientes/frecuentes', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.id, p.nombre, p.email, COUNT(c.id) as total_citas
            FROM pacientes p
            JOIN citas c ON p.id = c.paciente_id
            GROUP BY p.id, p.nombre, p.email
            HAVING COUNT(c.id) > 3
            ORDER BY total_citas DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener pacientes frecuentes' });
    }
});

// 4. Listar médicos con número de citas atendidas en el último mes
app.get('/medicos/estadisticas', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT m.id, m.nombre, e.nombre as especialidad,
                   COUNT(c.id) as citas_ultimo_mes
            FROM medicos m
            JOIN especialidades e ON m.especialidad_id = e.id
            LEFT JOIN citas c ON m.id = c.medico_id 
                AND c.fecha >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                AND c.estado_id = 2 -- Estado 'Confirmada'
            GROUP BY m.id, m.nombre, e.nombre
            ORDER BY citas_ultimo_mes DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas de médicos' });
    }
});

// 5. Consultar ingresos generados por método de pago en rango de fechas
app.get('/ingresos/reporte', async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        
        let query = `
            SELECT mp.nombre as metodo_pago,
                   COUNT(c.id) as total_citas,
                   COUNT(c.id) * 50000 as ingresos_estimados
            FROM metodos_pago mp
            LEFT JOIN citas c ON mp.id = c.metodo_pago_id
                AND c.estado_id = 2 -- Estado 'Confirmada'
        `;
        
        const params = [];
        
        if (fecha_inicio && fecha_fin) {
            query += ' AND c.fecha BETWEEN ? AND ?';
            params.push(fecha_inicio, fecha_fin);
        }
        
        query += `
            GROUP BY mp.id, mp.nombre
            ORDER BY ingresos_estimados DESC
        `;
        
        const [rows] = await pool.execute(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener reporte de ingresos' });
    }
});

// ==================== CARGA MASIVA CSV ====================

// Endpoint para cargar CSV desde la web app
app.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
    let filePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se ha subido ningún archivo'
            });
        }
        
        filePath = req.file.path;
        console.log(`📁 Archivo CSV recibido: ${req.file.originalname}`);
        
        // 1. Validar estructura del CSV
        const validation = await csvLoader.validateCSVStructure(filePath);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }
        
        console.log(`✅ CSV validado: ${validation.rowsPreview} filas, columnas: ${validation.columns.join(', ')}`);
        
        // 2. Procesar datos del CSV
        const processedData = await csvLoader.processUploadedCSV(filePath);
        
        // 3. Insertar en base de datos
        const insertResult = await csvLoader.insertProcessedData(processedData, pool);
        
        // 4. Respuesta exitosa
        res.json({
            success: true,
            message: insertResult.message,
            data: {
                pacientesInsertados: insertResult.insertedPacientes,
                citasInsertadas: insertResult.insertedCitas,
                erroresEncontrados: insertResult.errores.length,
                errores: insertResult.errores.slice(0, 10) // Máximo 10 errores en respuesta
            }
        });
        
        console.log(`🎉 CSV procesado exitosamente: ${insertResult.message}`);
        
    } catch (error) {
        console.error('❌ Error procesando CSV:', error);
        
        res.status(500).json({
            success: false,
            error: 'Error interno procesando el archivo CSV',
            details: error.message
        });
        
    } finally {
        // Limpiar archivo temporal
        if (filePath) {
            try {
                await fs.unlink(filePath);
                console.log(`🗑️ Archivo temporal eliminado: ${filePath}`);
            } catch (cleanupError) {
                console.warn(`⚠️ No se pudo eliminar archivo temporal: ${cleanupError.message}`);
            }
        }
    }
});

// Endpoint para cargar datos normalizados predefinidos (opcional)
app.post('/cargar-datos', async (req, res) => {
    try {
        const { pacientes, citas } = req.body;
        
        if (!pacientes || !citas) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren datos de pacientes y citas'
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Cargar pacientes
            let insertedPacientes = 0;
            for (const paciente of pacientes) {
                const [result] = await connection.execute(
                    'INSERT IGNORE INTO pacientes (nombre, email) VALUES (?, ?)',
                    [paciente.nombre, paciente.email]
                );
                if (result.affectedRows > 0) {
                    insertedPacientes++;
                }
            }
            
            // Cargar citas
            let insertedCitas = 0;
            for (const cita of citas) {
                await connection.execute(
                    'INSERT INTO citas (paciente_id, medico_id, ubicacion_id, fecha, hora, motivo, descripcion, metodo_pago_id, estado_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [cita.paciente_id, cita.medico_id, cita.ubicacion_id, cita.fecha, cita.hora, cita.motivo, cita.descripcion, cita.metodo_pago_id, cita.estado_id]
                );
                insertedCitas++;
            }
            
            await connection.commit();
            
            res.json({
                success: true,
                message: `Datos cargados: ${insertedPacientes} pacientes, ${insertedCitas} citas`
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        res.status(500).json({
            success: false,
            error: 'Error cargando datos en la base de datos'
        });
    }
});

// ==================== MANEJO DE ERRORES ====================

// Middleware para errores de Multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        let message = 'Error al subir archivo';
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'El archivo excede el tamaño máximo permitido (10MB)';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Campo de archivo inesperado';
                break;
            default:
                message = `Error de carga: ${error.message}`;
        }
        
        return res.status(400).json({
            success: false,
            error: message
        });
    }
    
    next(error);
});

// ==================== INICIALIZACIÓN ====================

async function startServer() {
    try {
        await initDB();
        app.listen(3000, () => {
            console.log('🚀 CrudClinic API ejecutándose en http://localhost:3000');
            console.log('📚 Endpoints disponibles:');
            console.log('   📋 /pacientes - GET, POST, PUT, PATCH, DELETE');
            console.log('   👨‍⚕️ /medicos - GET, POST, PUT, PATCH, DELETE');
            console.log('   📅 /citas - GET, POST, PUT, PATCH, DELETE');
            console.log('   🏥 /especialidades - GET, POST');
            console.log('   📍 /ubicaciones - GET, POST');
            console.log('   💳 /metodos-pago - GET, POST');
            console.log('   📊 /estados-cita - GET, POST');
            console.log('   🔍 Consultas avanzadas:');
            console.log('     - /citas/medico/:id - Citas por médico');
            console.log('     - /pacientes/frecuentes - Pacientes con +3 citas');
            console.log('     - /medicos/estadisticas - Stats último mes');
            console.log('     - /ingresos/reporte - Ingresos por método pago');
        });
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

startServer();