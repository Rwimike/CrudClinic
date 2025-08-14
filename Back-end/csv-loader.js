// csvLoader.js - Utilidad para procesar archivos CSV subidos desde la web app
// Se usa desde api-server.js cuando el usuario sube un CSV

const csv = require('csv-parser');
const { createReadStream } = require('fs');
const fs = require('fs').promises;

/**
 * Procesa un archivo CSV subido y retorna datos estructurados
 * @param {string} filePath - Ruta al archivo CSV subido
 * @returns {Promise<Object>} Datos procesados listos para insertar en BD
 */
async function processUploadedCSV(filePath) {
    try {
        console.log(`📄 Procesando archivo CSV: ${filePath}`);
        
        const results = {
            pacientes: [],
            citas: [],
            errores: []
        };
        
        const pacientesMap = new Map(); // Para evitar duplicados
        let pacienteIdCounter = 1;
        let citaIdCounter = 1;
        
        // Mapeos para normalización
        const medicoMap = {
            'Dra. Martínez': 1,
            'Dra. Torres': 2,
            'Dr. Ramírez': 3,
            'Dr. López': 4
        };
        
        const ubicacionMap = {
            'Sede Norte': 1,
            'Sede Centro': 2,
            'Sede Sur': 3
        };
        
        const metodoPagoMap = {
            'Efectivo': 1,
            'Transferencia': 2,
            'transferencia': 2,
            'Tarjeta Crédito': 3,
            'tarjeta crédito': 3,
            'Tarjeta Débito': 4,
            'tarjeta débito': 4
        };
        
        const estadoMap = {
            'Pendiente': 1,
            'Confirmada': 2,
            'Cancelada': 3,
            'Reprogramada': 4
        };
        
        // Leer archivo CSV línea por línea
        const rows = await new Promise((resolve, reject) => {
            const data = [];
            
            createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    data.push(row);
                })
                .on('end', () => {
                    resolve(data);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
        
        console.log(`📊 Procesando ${rows.length} filas del CSV`);
        
        // Procesar cada fila
        rows.forEach((row, index) => {
            try {
                // Validar que tenga las columnas necesarias
                const requiredColumns = ['Nombre Paciente', 'Correo Paciente', 'Médico', 'Fecha Cita', 'Hora Cita'];
                const missingColumns = requiredColumns.filter(col => !row[col]);
                
                if (missingColumns.length > 0) {
                    results.errores.push({
                        fila: index + 2,
                        error: `Columnas faltantes: ${missingColumns.join(', ')}`
                    });
                    return;
                }
                
                // Procesar paciente (evitar duplicados por email)
                const emailLimpio = row['Correo Paciente'].toLowerCase().trim();
                let pacienteId;
                
                if (!pacientesMap.has(emailLimpio)) {
                    pacienteId = pacienteIdCounter++;
                    const paciente = {
                        id: pacienteId,
                        nombre: row['Nombre Paciente'].trim(),
                        email: emailLimpio,
                        telefono: null
                    };
                    
                    pacientesMap.set(emailLimpio, pacienteId);
                    results.pacientes.push(paciente);
                } else {
                    pacienteId = pacientesMap.get(emailLimpio);
                }
                
                // Procesar cita
                const cita = {
                    id: citaIdCounter++,
                    paciente_id: pacienteId,
                    medico_id: medicoMap[row['Médico']] || 1,
                    ubicacion_id: ubicacionMap[row['Ubicación']] || 1,
                    fecha: row['Fecha Cita'],
                    hora: row['Hora Cita'],
                    motivo: row['Motivo']?.trim() || 'Sin especificar',
                    descripcion: row['Descripción']?.trim() || 'Sin descripción',
                    metodo_pago_id: metodoPagoMap[row['Método de Pago']] || 1,
                    estado_id: estadoMap[row['Estatus Cita']] || 1
                };
                
                results.citas.push(cita);
                
            } catch (error) {
                results.errores.push({
                    fila: index + 2,
                    error: `Error procesando fila: ${error.message}`
                });
            }
        });
        
        console.log(`✅ Procesamiento completado:`);
        console.log(`   - ${results.pacientes.length} pacientes únicos`);
        console.log(`   - ${results.citas.length} citas procesadas`);
        console.log(`   - ${results.errores.length} errores encontrados`);
        
        return results;
        
    } catch (error) {
        console.error(`❌ Error procesando CSV: ${error.message}`);
        throw error;
    }
}

/**
 * Inserta los datos procesados en la base de datos
 * @param {Object} processedData - Datos procesados del CSV
 * @param {Object} pool - Pool de conexiones MySQL
 * @returns {Promise<Object>} Resultado de la inserción
 */
async function insertProcessedData(processedData, pool) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        let insertedPacientes = 0;
        let insertedCitas = 0;
        
        // Insertar pacientes (usar INSERT IGNORE para evitar duplicados de email)
        for (const paciente of processedData.pacientes) {
            const [result] = await connection.execute(
                'INSERT IGNORE INTO pacientes (nombre, email, telefono) VALUES (?, ?, ?)',
                [paciente.nombre, paciente.email, paciente.telefono]
            );
            if (result.affectedRows > 0) {
                insertedPacientes++;
            }
        }
        
        // Crear un mapa de emails a IDs de la base de datos
        const [existingPacientes] = await connection.execute(
            'SELECT id, email FROM pacientes WHERE email IN (?)',
            [processedData.pacientes.map(p => p.email)]
        );
        
        const emailToIdMap = new Map();
        existingPacientes.forEach(p => {
            emailToIdMap.set(p.email, p.id);
        });
        
        // Insertar citas con los IDs correctos de pacientes
        for (const cita of processedData.citas) {
            // Buscar el paciente por email para obtener el ID real de la BD
            const pacienteOriginal = processedData.pacientes.find(p => p.id === cita.paciente_id);
            const pacienteIdReal = emailToIdMap.get(pacienteOriginal.email);
            
            if (pacienteIdReal) {
                await connection.execute(
                    'INSERT INTO citas (paciente_id, medico_id, ubicacion_id, fecha, hora, motivo, descripcion, metodo_pago_id, estado_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [pacienteIdReal, cita.medico_id, cita.ubicacion_id, cita.fecha, cita.hora, cita.motivo, cita.descripcion, cita.metodo_pago_id, cita.estado_id]
                );
                insertedCitas++;
            }
        }
        
        await connection.commit();
        
        const result = {
            success: true,
            insertedPacientes,
            insertedCitas,
            errores: processedData.errores,
            message: `Datos cargados: ${insertedPacientes} pacientes, ${insertedCitas} citas`
        };
        
        console.log(`💾 Datos insertados en BD: ${insertedPacientes} pacientes, ${insertedCitas} citas`);
        
        return result;
        
    } catch (error) {
        await connection.rollback();
        console.error(`❌ Error insertando datos: ${error.message}`);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Valida que un archivo CSV tenga la estructura esperada
 * @param {string} filePath - Ruta al archivo CSV
 * @returns {Promise<Object>} Resultado de la validación
 */
async function validateCSVStructure(filePath) {
    try {
        // Leer solo las primeras líneas para validar estructura
        const firstRows = await new Promise((resolve, reject) => {
            const data = [];
            let count = 0;
            
            createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    data.push(row);
                    count++;
                    if (count >= 5) { // Solo validar primeras 5 filas
                        resolve(data);
                    }
                })
                .on('end', () => {
                    resolve(data);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
        
        if (firstRows.length === 0) {
            return {
                valid: false,
                error: 'El archivo CSV está vacío'
            };
        }
        
        // Verificar columnas requeridas
        const requiredColumns = [
            'Nombre Paciente',
            'Correo Paciente', 
            'Médico',
            'Fecha Cita',
            'Hora Cita'
        ];
        
        const firstRow = firstRows[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
            return {
                valid: false,
                error: `Columnas requeridas faltantes: ${missingColumns.join(', ')}`
            };
        }
        
        return {
            valid: true,
            message: 'Estructura CSV válida',
            rowsPreview: firstRows.length,
            columns: Object.keys(firstRow)
        };
        
    } catch (error) {
        return {
            valid: false,
            error: `Error validando CSV: ${error.message}`
        };
    }
}

module.exports = {
    processUploadedCSV,
    insertProcessedData,
    validateCSVStructure
};