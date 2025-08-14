document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 CrudClinic Frontend iniciado');
    
    // Cargar datos iniciales
    loadAllData();
    
    // Configurar event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Botones de guardar en modales
    document.getElementById('guardarCita').addEventListener('click', guardarCita);
    document.getElementById('guardarPaciente').addEventListener('click', guardarPaciente);
    document.getElementById('guardarMedico').addEventListener('click', guardarMedico);
    
    // Event listener para cambio de pestañas
    document.getElementById('reportes-tab').addEventListener('click', cargarReportes);
    
    // Event listeners para CSV Upload
    setupCSVUploadListeners();
}

// ==================== CSV UPLOAD FUNCTIONALITY ====================

function setupCSVUploadListeners() {
    const csvFileInput = document.getElementById('csvFileInput');
    const uploadCsvBtn = document.getElementById('uploadCsvBtn');
    
    // Listener para selección de archivo
    csvFileInput.addEventListener('change', handleCSVFileSelect);
    
    // Listener para botón de upload
    uploadCsvBtn.addEventListener('click', uploadCSVFile);
    
    // Reset modal cuando se cierra
    document.getElementById('csvModal').addEventListener('hidden.bs.modal', resetCSVModal);
}

function handleCSVFileSelect(event) {
    const file = event.target.files[0];
    const uploadBtn = document.getElementById('uploadCsvBtn');
    const preview = document.getElementById('csvFilePreview');
    
    if (file) {
        // Validar tipo de archivo
        const allowedTypes = ['.csv', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            showAlert('Solo se permiten archivos CSV y TXT', 'error');
            event.target.value = '';
            return;
        }
        
        // Validar tamaño (10MB máximo)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            showAlert('El archivo excede el tamaño máximo de 10MB', 'error');
            event.target.value = '';
            return;
        }
        
        // Mostrar preview del archivo
        document.getElementById('csvFileName').textContent = file.name;
        document.getElementById('csvFileSize').textContent = formatFileSize(file.size);
        preview.classList.remove('d-none');
        
        // Habilitar botón de upload
        uploadBtn.disabled = false;
        
        console.log(`📁 Archivo CSV seleccionado: ${file.name} (${formatFileSize(file.size)})`);
    } else {
        preview.classList.add('d-none');
        uploadBtn.disabled = true;
    }
}

async function uploadCSVFile() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Por favor selecciona un archivo CSV', 'warning');
        return;
    }
    
    try {
        // Mostrar progreso
        showCSVProgress(true);
        updateCSVProgress(10, 'Preparando archivo...');
        
        // Deshabilitar botón
        document.getElementById('uploadCsvBtn').disabled = true;
        
        // Crear FormData
        const formData = new FormData();
        formData.append('csvFile', file);
        
        updateCSVProgress(30, 'Subiendo archivo...');
        
        // Realizar petición
        const response = await fetch(`${API_BASE}/upload-csv`, {
            method: 'POST',
            body: formData
        });
        
        updateCSVProgress(70, 'Procesando datos...');
        
        const result = await response.json();
        
        if (result.success) {
            updateCSVProgress(100, 'Procesamiento completado');
            
            // Mostrar resultado exitoso
            showCSVResult({
                success: true,
                message: result.message,
                data: result.data
            });
            
            // Recargar datos después de un momento
            setTimeout(() => {
                loadAllData();
                showAlert(`CSV procesado exitosamente: ${result.data.pacientesInsertados} pacientes, ${result.data.citasInsertadas} citas`, 'success');
            }, 2000);
            
        } else {
            throw new Error(result.error || 'Error desconocido procesando CSV');
        }
        
    } catch (error) {
        console.error('❌ Error subiendo CSV:', error);
        
        showCSVResult({
            success: false,
            error: error.message
        });
        
        showAlert(`Error procesando CSV: ${error.message}`, 'error');
        
    } finally {
        // Rehabilitar botón después de un momento
        setTimeout(() => {
            document.getElementById('uploadCsvBtn').disabled = false;
        }, 3000);
    }
}

function showCSVProgress(show) {
    const progressDiv = document.getElementById('csvUploadProgress');
    
    if (show) {
        progressDiv.classList.remove('d-none');
    } else {
        progressDiv.classList.add('d-none');
        updateCSVProgress(0, 'Preparando archivo...');
    }
}

function updateCSVProgress(percent, message) {
    document.getElementById('csvProgressBar').style.width = `${percent}%`;
    document.getElementById('csvProgressPercent').textContent = `${percent}%`;
    document.getElementById('csvProgressMessage').textContent = message;
}

function showCSVResult(result) {
    const resultDiv = document.getElementById('csvUploadResult');
    
    if (result.success) {
        resultDiv.innerHTML = `
            <div class="alert alert-success border-0">
                <h6 class="alert-heading">
                    <i class="bi bi-check-circle me-2"></i>
                    ¡Archivo procesado exitosamente!
                </h6>
                <p class="mb-2">${result.message}</p>
                <hr>
                <div class="row text-center">
                    <div class="col-4">
                        <strong class="text-success">${result.data.pacientesInsertados}</strong>
                        <br><small>Pacientes</small>
                    </div>
                    <div class="col-4">
                        <strong class="text-primary">${result.data.citasInsertadas}</strong>
                        <br><small>Citas</small>
                    </div>
                    <div class="col-4">
                        <strong class="text-warning">${result.data.erroresEncontrados}</strong>
                        <br><small>Errores</small>
                    </div>
                </div>
                ${result.data.errores && result.data.errores.length > 0 ? `
                    <div class="mt-3">
                        <strong>Errores encontrados:</strong>
                        <ul class="mb-0 mt-2">
                            ${result.data.errores.map(err => `<li>Fila ${err.fila}: ${err.error}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="alert alert-danger border-0">
                <h6 class="alert-heading">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error procesando archivo
                </h6>
                <p class="mb-0">${result.error}</p>
            </div>
        `;
    }
    
    resultDiv.classList.remove('d-none');
}

function resetCSVModal() {
    // Limpiar input
    document.getElementById('csvFileInput').value = '';
    
    // Ocultar elementos
    document.getElementById('csvFilePreview').classList.add('d-none');
    document.getElementById('csvUploadProgress').classList.add('d-none');
    document.getElementById('csvUploadResult').classList.add('d-none');
    
    // Deshabilitar botón
    document.getElementById('uploadCsvBtn').disabled = true;
    
    console.log('🔄 Modal CSV reseteado');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}// CrudClinic - Frontend Application
// Consumo de API REST con fetch async/await

const API_BASE = 'http://localhost:3000';

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏥 CrudClinic Frontend iniciado');
    
    // Cargar datos iniciales
    loadAllData();
    
    // Configurar event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Botones de guardar en modales
    document.getElementById('guardarCita').addEventListener('click', guardarCita);
    document.getElementById('guardarPaciente').addEventListener('click', guardarPaciente);
    document.getElementById('guardarMedico').addEventListener('click', guardarMedico);
    
    // Event listener para cambio de pestañas
    document.getElementById('reportes-tab').addEventListener('click', cargarReportes);
}

// ==================== CARGA DE DATOS ====================

async function loadAllData() {
    await Promise.all([
        loadCitas(),
        loadPacientes(), 
        loadMedicos(),
        loadCatalogos()
    ]);
}

async function loadCatalogos() {
    await Promise.all([
        loadEspecialidades(),
        loadUbicaciones(), 
        loadMetodosPago(),
        loadEstadosCita()
    ]);
}

// ==================== PACIENTES ====================

// GET /pacientes
async function loadPacientes() {
    try {
        const res = await fetch(`${API_BASE}/pacientes`);
        const pacientes = await res.json();
        
        renderPacientesTable(pacientes);
        populateSelect('citaPaciente', pacientes, 'id', 'nombre');
        
        console.log('✅ Pacientes cargados:', pacientes.length);
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
        showAlert('Error al cargar pacientes', 'danger');
    }
}

function renderPacientesTable(pacientes) {
    const tbody = document.getElementById('pacientesTableBody');
    
    if (pacientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1"></i>
                    <p>No hay pacientes registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = pacientes.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.email}</td>
            <td>${p.telefono || 'N/A'}</td>
            <td>${new Date(p.created_at).toLocaleDateString()}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editarPaciente(${p.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="eliminarPaciente(${p.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// POST /pacientes
async function guardarPaciente() {
    try {
        const nombre = document.getElementById('pacienteNombre').value;
        const email = document.getElementById('pacienteEmail').value;
        const telefono = document.getElementById('pacienteTelefono').value;
        
        const res = await fetch(`${API_BASE}/pacientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                email,
                telefono
            })
        });
        
        if (res.ok) {
            const result = await res.json();
            showAlert('Paciente creado exitosamente', 'success');
            
            // Cerrar modal y recargar datos
            bootstrap.Modal.getInstance(document.getElementById('pacienteModal')).hide();
            document.getElementById('pacienteForm').reset();
            loadPacientes();
        } else {
            throw new Error('Error al crear paciente');
        }
    } catch (error) {
        console.error('❌ Error creando paciente:', error);
        showAlert('Error al crear paciente', 'danger');
    }
}

// DELETE /pacientes/:id
async function eliminarPaciente(id) {
    if (!confirm('¿Estás seguro de eliminar este paciente?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/pacientes/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            showAlert('Paciente eliminado exitosamente', 'success');
            loadPacientes();
        } else {
            throw new Error('Error al eliminar paciente');
        }
    } catch (error) {
        console.error('❌ Error eliminando paciente:', error);
        showAlert('Error al eliminar paciente', 'danger');
    }
}

// ==================== MÉDICOS ====================

// GET /medicos
async function loadMedicos() {
    try {
        const res = await fetch(`${API_BASE}/medicos`);
        const medicos = await res.json();
        
        renderMedicosTable(medicos);
        populateSelect('citaMedico', medicos, 'id', 'nombre');
        
        console.log('✅ Médicos cargados:', medicos.length);
    } catch (error) {
        console.error('❌ Error cargando médicos:', error);
        showAlert('Error al cargar médicos', 'danger');
    }
}

function renderMedicosTable(medicos) {
    const tbody = document.getElementById('medicosTableBody');
    
    if (medicos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1"></i>
                    <p>No hay médicos registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = medicos.map(m => `
        <tr>
            <td>${m.id}</td>
            <td>${m.nombre}</td>
            <td>${m.especialidad}</td>
            <td>${m.email || 'N/A'}</td>
            <td>${m.telefono || 'N/A'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editarMedico(${m.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="eliminarMedico(${m.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// POST /medicos
async function guardarMedico() {
    try {
        const nombre = document.getElementById('medicoNombre').value;
        const especialidad_id = document.getElementById('medicoEspecialidad').value;
        const email = document.getElementById('medicoEmail').value;
        const telefono = document.getElementById('medicoTelefono').value;
        
        const res = await fetch(`${API_BASE}/medicos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                especialidad_id: parseInt(especialidad_id),
                email,
                telefono
            })
        });
        
        if (res.ok) {
            showAlert('Médico creado exitosamente', 'success');
            
            bootstrap.Modal.getInstance(document.getElementById('medicoModal')).hide();
            document.getElementById('medicoForm').reset();
            loadMedicos();
        } else {
            throw new Error('Error al crear médico');
        }
    } catch (error) {
        console.error('❌ Error creando médico:', error);
        showAlert('Error al crear médico', 'danger');
    }
}

// DELETE /medicos/:id
async function eliminarMedico(id) {
    if (!confirm('¿Estás seguro de eliminar este médico?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/medicos/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            showAlert('Médico eliminado exitosamente', 'success');
            loadMedicos();
        } else {
            throw new Error('Error al eliminar médico');
        }
    } catch (error) {
        console.error('❌ Error eliminando médico:', error);
        showAlert('Error al eliminar médico', 'danger');
    }
}

// ==================== CITAS ====================

// GET /citas
async function loadCitas() {
    try {
        const res = await fetch(`${API_BASE}/citas`);
        const citas = await res.json();
        
        renderCitasTable(citas);
        
        console.log('✅ Citas cargadas:', citas.length);
    } catch (error) {
        console.error('❌ Error cargando citas:', error);
        showAlert('Error al cargar citas', 'danger');
    }
}

function renderCitasTable(citas) {
    const tbody = document.getElementById('citasTableBody');
    
    if (citas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1"></i>
                    <p>No hay citas registradas</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = citas.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.paciente}</td>
            <td>${c.medico}</td>
            <td>${c.especialidad}</td>
            <td>${new Date(c.fecha).toLocaleDateString()}</td>
            <td>${c.hora}</td>
            <td>
                <span class="badge" style="background-color: ${c.estado_color}">
                    ${c.estado}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editarCita(${c.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="eliminarCita(${c.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// POST /citas
async function guardarCita() {
    try {
        const paciente_id = document.getElementById('citaPaciente').value;
        const medico_id = document.getElementById('citaMedico').value;
        const ubicacion_id = document.getElementById('citaUbicacion').value;
        const fecha = document.getElementById('citaFecha').value;
        const hora = document.getElementById('citaHora').value;
        const motivo = document.getElementById('citaMotivo').value;
        const descripcion = document.getElementById('citaDescripcion').value;
        const metodo_pago_id = document.getElementById('citaMetodoPago').value;
        const estado_id = document.getElementById('citaEstado').value;
        
        const res = await fetch(`${API_BASE}/citas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paciente_id: parseInt(paciente_id),
                medico_id: parseInt(medico_id),
                ubicacion_id: parseInt(ubicacion_id),
                fecha,
                hora,
                motivo,
                descripcion,
                metodo_pago_id: parseInt(metodo_pago_id),
                estado_id: parseInt(estado_id)
            })
        });
        
        if (res.ok) {
            showAlert('Cita creada exitosamente', 'success');
            
            bootstrap.Modal.getInstance(document.getElementById('citaModal')).hide();
            document.getElementById('citaForm').reset();
            loadCitas();
        } else {
            throw new Error('Error al crear cita');
        }
    } catch (error) {
        console.error('❌ Error creando cita:', error);
        showAlert('Error al crear cita', 'danger');
    }
}

// DELETE /citas/:id
async function eliminarCita(id) {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/citas/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            showAlert('Cita eliminada exitosamente', 'success');
            loadCitas();
        } else {
            throw new Error('Error al eliminar cita');
        }
    } catch (error) {
        console.error('❌ Error eliminando cita:', error);
        showAlert('Error al eliminar cita', 'danger');
    }
}

// ==================== CATÁLOGOS ====================

// GET /especialidades
async function loadEspecialidades() {
    try {
        const res = await fetch(`${API_BASE}/especialidades`);
        const especialidades = await res.json();
        
        populateSelect('medicoEspecialidad', especialidades, 'id', 'nombre');
        
        console.log('✅ Especialidades cargadas:', especialidades.length);
    } catch (error) {
        console.error('❌ Error cargando especialidades:', error);
    }
}

// GET /ubicaciones
async function loadUbicaciones() {
    try {
        const res = await fetch(`${API_BASE}/ubicaciones`);
        const ubicaciones = await res.json();
        
        populateSelect('citaUbicacion', ubicaciones, 'id', 'nombre');
        
        console.log('✅ Ubicaciones cargadas:', ubicaciones.length);
    } catch (error) {
        console.error('❌ Error cargando ubicaciones:', error);
    }
}

// GET /metodos-pago
async function loadMetodosPago() {
    try {
        const res = await fetch(`${API_BASE}/metodos-pago`);
        const metodos = await res.json();
        
        populateSelect('citaMetodoPago', metodos, 'id', 'nombre');
        
        console.log('✅ Métodos de pago cargados:', metodos.length);
    } catch (error) {
        console.error('❌ Error cargando métodos de pago:', error);
    }
}

// GET /estados-cita
async function loadEstadosCita() {
    try {
        const res = await fetch(`${API_BASE}/estados-cita`);
        const estados = await res.json();
        
        populateSelect('citaEstado', estados, 'id', 'nombre');
        
        console.log('✅ Estados de cita cargados:', estados.length);
    } catch (error) {
        console.error('❌ Error cargando estados de cita:', error);
    }
}

// ==================== REPORTES ====================

async function cargarReportes() {
    await Promise.all([
        cargarPacientesFrecuentes(),
        cargarEstadisticasMedicos(),
        cargarReporteIngresos()
    ]);
}

// GET /pacientes/frecuentes
async function cargarPacientesFrecuentes() {
    try {
        const res = await fetch(`${API_BASE}/pacientes/frecuentes`);
        const pacientes = await res.json();
        
        const container = document.getElementById('pacientesFrecuentes');
        
        if (pacientes.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay pacientes frecuentes</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>Total Citas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pacientes.map(p => `
                            <tr>
                                <td>${p.nombre}</td>
                                <td><span class="badge bg-primary">${p.total_citas}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        console.log('✅ Pacientes frecuentes cargados:', pacientes.length);
    } catch (error) {
        console.error('❌ Error cargando pacientes frecuentes:', error);
    }
}

// GET /medicos/estadisticas
async function cargarEstadisticasMedicos() {
    try {
        const res = await fetch(`${API_BASE}/medicos/estadisticas`);
        const medicos = await res.json();
        
        const container = document.getElementById('estadisticasMedicos');
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Médico</th>
                            <th>Especialidad</th>
                            <th>Citas (30 días)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medicos.map(m => `
                            <tr>
                                <td>${m.nombre}</td>
                                <td><small class="text-muted">${m.especialidad}</small></td>
                                <td><span class="badge bg-success">${m.citas_ultimo_mes}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        console.log('✅ Estadísticas médicos cargadas:', medicos.length);
    } catch (error) {
        console.error('❌ Error cargando estadísticas médicos:', error);
    }
}

// GET /ingresos/reporte
async function cargarReporteIngresos() {
    try {
        const res = await fetch(`${API_BASE}/ingresos/reporte`);
        const ingresos = await res.json();
        
        const container = document.getElementById('reporteIngresos');
        
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Método de Pago</th>
                            <th>Total Citas</th>
                            <th>Ingresos Estimados</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ingresos.map(i => `
                            <tr>
                                <td>${i.metodo_pago}</td>
                                <td><span class="badge bg-info">${i.total_citas}</span></td>
                                <td><span class="fw-bold text-success">${i.ingresos_estimados.toLocaleString()}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        console.log('✅ Reporte de ingresos cargado:', ingresos.length);
    } catch (error) {
        console.error('❌ Error cargando reporte de ingresos:', error);
    }
}

// ==================== UTILIDADES ====================

function populateSelect(selectId, data, valueField, textField) {
    const select = document.getElementById(selectId);
    const firstOption = select.querySelector('option:first-child');
    
    // Limpiar opciones excepto la primera
    select.innerHTML = firstOption.outerHTML;
    
    // Agregar nuevas opciones
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueField];
        option.textContent = item[textField];
        select.appendChild(option);
    });
}

function showAlert(message, type = 'info') {
    // Crear alert temporal
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

// Funciones placeholder para edición (se pueden implementar después)
function editarPaciente(id) {
    showAlert('Función de edición en desarrollo', 'info');
}

function editarMedico(id) {
    showAlert('Función de edición en desarrollo', 'info');
}

function editarCita(id) {
    showAlert('Función de edición en desarrollo', 'info');
}

console.log('📱 CrudClinic App cargada completamente');