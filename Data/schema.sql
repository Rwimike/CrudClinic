-- CRUDCLINIC - Base de datos normalizada hasta 3FN
-- Sistema de agenda médica

USE crudclinic;

-- ==================== TABLAS CATÁLOGO ====================

-- Especialidades médicas
CREATE TABLE especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ubicaciones de la clínica
CREATE TABLE ubicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Métodos de pago
CREATE TABLE metodos_pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estados de las citas
CREATE TABLE estados_cita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6c757d',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ENTIDADES PRINCIPALES ====================

-- Pacientes
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_nombre (nombre)
);

-- Médicos
CREATE TABLE medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    especialidad_id INT NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (especialidad_id) REFERENCES especialidades(id),
    INDEX idx_nombre (nombre),
    INDEX idx_especialidad (especialidad_id)
);

-- Citas médicas
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    medico_id INT NOT NULL,
    ubicacion_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo VARCHAR(255),
    descripcion TEXT,
    metodo_pago_id INT NOT NULL,
    estado_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (medico_id) REFERENCES medicos(id),
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id),
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id),
    FOREIGN KEY (estado_id) REFERENCES estados_cita(id),
    
    INDEX idx_fecha (fecha),
    INDEX idx_paciente (paciente_id),
    INDEX idx_medico (medico_id),
    INDEX idx_fecha_medico (fecha, medico_id)
);

-- ==================== DATOS INICIALES ====================

-- Insertar especialidades
INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Atención médica general y preventiva'),
('Pediatría', 'Especialidad médica dedicada a la salud infantil'),
('Cardiología', 'Especialidad médica del corazón y sistema cardiovascular'),
('Dermatología', 'Especialidad médica de la piel');

-- Insertar ubicaciones
INSERT INTO ubicaciones (nombre, direccion) VALUES
('Sede Norte', 'Av. Principal Norte #123'),
('Sede Centro', 'Calle Central #456'),
('Sede Sur', 'Av. Sur #789');

-- Insertar métodos de pago (normalizados)
INSERT INTO metodos_pago (nombre) VALUES
('Efectivo'),
('Transferencia'),
('Tarjeta Crédito'),
('Tarjeta Débito');

-- Insertar estados de cita
INSERT INTO estados_cita (nombre, color) VALUES
('Pendiente', '#ffc107'),
('Confirmada', '#28a745'),
('Cancelada', '#dc3545'),
('Reprogramada', '#17a2b8');

-- Insertar médicos (un médico = una especialidad)
INSERT INTO medicos (nombre, especialidad_id, email) VALUES
('Dra. Martínez', 1, 'dra.martinez@crudclinic.com'),
('Dra. Torres', 2, 'dra.torres@crudclinic.com'),
('Dr. Ramírez', 3, 'dr.ramirez@crudclinic.com'),
('Dr. López', 4, 'dr.lopez@crudclinic.com');

-- Mensaje de confirmación
SELECT 'Base de datos CrudClinic creada exitosamente' AS status;