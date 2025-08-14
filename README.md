# 🏥 CrudClinic - Sistema de Agenda Médica

Sistema completo para la gestión de citas médicas con base de datos normalizada hasta 3FN, desarrollado para **Crudzaso**.

## 📋 Características del Sistema

- ✅ **Base de datos normalizada** hasta 3FN (MySQL)
- ✅ **API REST completa** con todos los métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- ✅ **Frontend responsivo** con Bootstrap 5
- ✅ **CRUD completo** para todas las entidades
- ✅ **Consultas avanzadas** según especificaciones del proyecto
- ✅ **Datos normalizados** a partir del Excel problemático
- ✅ **Docker** para fácil despliegue de MySQL

## 🗂️ Estructura del Proyecto

```
CrudClinic/
├── frontend/
│   ├── index.html          # Frontend con Bootstrap 5
│   └── js/
│       └── app.js          # JavaScript para consumir API
├── backend/
│   ├── api-server.js       # Servidor con todos los endpoints
│   └── package.json        # Dependencias Node.js
├── database/
│   ├── schema.sql          # Base de datos normalizada
│   ├── docker-compose.yml  # MySQL dockerizado
│   └── normalized_data.csv # Datos limpios del Excel
└── README.md
```

## 🚀 Instalación y Ejecución

### 1. Configurar la Base de Datos

```bash
# Navegar a la carpeta database
cd database/

# Iniciar MySQL con Docker
docker-compose up -d

# Verificar que esté ejecutándose
docker ps
```

**Credenciales de la base de datos:**
- **Host:** localhost:3306
- **Usuario:** clinicuser
- **Contraseña:** clinicpass
- **Base de datos:** crudclinic
- **phpMyAdmin:** http://localhost:8080

### 2. Iniciar el Backend

```bash
# Navegar a la carpeta backend
cd backend/

# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

El servidor estará disponible en **http://localhost:3000**

### 3. Abrir el Frontend

```bash
# Navegar a la carpeta frontend
cd frontend/

# Servir con cualquier servidor web
python -m http.server 8000
# o usar Live Server de VS Code
```

La aplicación estará disponible en **http://localhost:8000**

## 📊 Proceso de Normalización

### Problemas Identificados en el Excel Original:

1. **❌ Médicos con múltiples especialidades:** Un médico aparecía con diferentes especialidades
2. **❌ Métodos de pago duplicados:** "Tarjeta Crédito" vs "tarjeta crédito"
3. **❌ Email duplicado:** juan.rodríguez43@hotmail.com repetido
4. **❌ Datos redundantes:** Información repetida sin estructura relacional

### Solución Aplicada (3FN):

#### **1FN - Eliminación de grupos repetitivos:**
- Separación de pacientes, médicos y citas en tablas independientes

#### **2FN - Eliminación de dependencias parciales:**
- Creación de tablas catálogo: especialidades, ubicaciones, métodos_pago, estados_cita
- Cada médico tiene UNA sola especialidad

#### **3FN - Eliminación de dependencias transitivas:**
- Las especialidades no dependen directamente de las citas
- Los métodos de pago son independientes de los pacientes

## 🗃️ Modelo de Base de Datos

### Entidades Principales:
- **pacientes** - Información de pacientes
- **medicos** - Médicos con su especialidad específica
- **citas** - Citas médicas con todas las relaciones

### Entidades Catálogo:
- **especialidades** - Medicina General, Pediatría, Cardiología, Dermatología
- **ubicaciones** - Sede Norte, Centro, Sur
- **metodos_pago** - Efectivo, Transferencia, Tarjetas
- **estados_cita** - Pendiente, Confirmada, Cancelada, Reprogramada

## 🌐 Endpoints de la API

### Pacientes
```
GET    /pacientes       - Listar todos
GET    /pacientes/:id   - Obtener uno
POST   /pacientes       - Crear
PUT    /pacientes/:id   - Actualizar completo
PATCH  /pacientes/:id   - Actualizar parcial
DELETE /pacientes/:id   - Eliminar
```

### Médicos
```
GET    /medicos         - Listar todos (con especialidad)
GET    /medicos/:id     - Obtener uno
POST   /medicos         - Crear
PUT    /medicos/:id     - Actualizar completo
PATCH  /medicos/:id     - Actualizar parcial
DELETE /medicos/:id     - Eliminar
```

### Citas
```
GET    /citas           - Listar todas (con información completa)
GET    /citas/:id       - Obtener una
POST   /citas           - Crear
PUT    /citas/:id       - Actualizar completa
PATCH  /citas/:id       - Actualizar parcial
DELETE /citas/:id       - Eliminar
```

### Entidades Catálogo
```
GET    /especialidades  - Listar especialidades
GET    /ubicaciones     - Listar ubicaciones
GET    /metodos-pago    - Listar métodos de pago
GET    /estados-cita    - Listar estados de cita
```

## 🔍 Consultas Avanzadas (Según Especificaciones)

### 1. Citas con información completa
```
GET /citas
```
Devuelve: paciente, médico, especialidad, fecha, hora, estatus

### 2. Filtrar citas por médico y fechas
```
GET /citas/medico/:medico_id?fecha_inicio=2024-01-01&fecha_fin=2024-12-31
```

### 3. Pacientes con más de 3 citas
```
GET /pacientes/frecuentes
```

### 4. Médicos con estadísticas del último mes
```
GET /medicos/estadisticas
```

### 5. Ingresos por método de pago
```
GET /ingresos/reporte?fecha_inicio=2024-01-01&fecha_fin=2024-12-31
```

## 💻 Tecnologías Utilizadas

### Backend
- **Node.js + Express** - Servidor web
- **MySQL2** - Driver de base de datos
- **CORS** - Habilitación de peticiones cross-origin

### Frontend
- **HTML5** - Estructura
- **Bootstrap 5** - Framework CSS responsivo
- **Vanilla JavaScript** - Lógica del frontend
- **Fetch API** - Consumo de endpoints REST

### Base de Datos
- **MySQL 8.0** - Sistema de gestión de base de datos
- **Docker** - Contenedorización de MySQL
- **phpMyAdmin** - Interfaz de administración

## 📈 Funcionalidades del Frontend

### Dashboard Principal
- **Pestañas organizadas:** Citas, Pacientes, Médicos, Reportes
- **Tablas responsivas** con Bootstrap
- **Modales** para crear/editar registros
- **Alertas** de confirmación y error

### CRUD Completo
- ✅ **Crear** nuevos registros
- ✅ **Leer** y listar todos los datos
- ✅ **Actualizar** registros existentes
- ✅ **Eliminar** con confirmación

### Reportes Avanzados
- 📊 **Pacientes frecuentes** (más de 3 citas)
- 👨‍⚕️ **Estadísticas de médicos** por mes
- 💰 **Ingresos por método** de pago

## 🔧 Desarrollo y Personalización

### Agregar Nuevas Funcionalidades
1. **Backend:** Agregar endpoint en `api-server.js`
2. **Frontend:** Agregar función en `app.js`
3. **UI:** Modificar `index.html` según necesidad

### Estructura de Respuesta API
```json
{
  "id": 1,
  "message": "Operación exitosa"
}
```

### Manejo de Errores
```json
{
  "error": "Descripción del error"
}
```

## 🚨 Solución de Problemas

### MySQL no se conecta
```bash
# Verificar contenedores
docker ps

# Reiniciar MySQL
cd database/
docker-compose restart mysql
```

### Frontend no carga datos
- Verificar que el backend esté en http://localhost:3000
- Revisar consola del navegador para errores
- Confirmar que MySQL esté ejecutándose

### Error de CORS
- El backend ya tiene CORS habilitado
- Verificar que el frontend esté en un servidor web (no file://)

## 📝 Datos de Prueba

El sistema incluye datos iniciales:
- **4 especialidades** médicas
- **3 ubicaciones** de la clínica
- **4 métodos** de pago
- **4 estados** de cita
- **4 médicos** de ejemplo

Los datos normalizados del Excel original se pueden cargar usando el endpoint:
```
POST /cargar-datos
```

## 🎯 Cumplimiento de Requerimientos

✅ **Normalización hasta 3FN** - Aplicada correctamente  
✅ **Base de datos MySQL** - Dockerizada y funcional  
✅ **API REST completa** - Todos los endpoints CRUD  
✅ **Frontend Bootstrap** - Responsivo y moderno  
✅ **Consultas avanzadas** - Todas las especificadas  
✅ **Carga de datos CSV** - Proceso de normalización implementado  

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

## 🏆 Proyecto Completado

**CrudClinic** está ahora completamente funcional con:

- 🗄️ **Base de datos normalizada** hasta 3FN
- 🚀 **API REST robusta** con todos los métodos HTTP
- 💻 **Frontend moderno** y responsivo
- 📊 **Reportes avanzados** según especificaciones
- 🐳 **Docker** para fácil despliegue
- 📋 **Datos normalizados** del Excel problemático

### 🎯 Próximos Pasos de Implementación:

1. **Ejecutar Docker**: `cd database && docker-compose up -d`
2. **Instalar dependencias**: `cd backend && npm install`
3. **Iniciar backend**: `npm start`
4. **Servir frontend**: `cd frontend && python -m http.server 8000`
5. **Acceder**: http://localhost:8000

### 🔥 Características Destacadas:

- **Sin autenticación**: Acceso directo como solicitaste
- **Un solo archivo backend**: `api-server.js` con todos los endpoints
- **HTML limpio**: Sin CSS/JS embebido
- **Bootstrap CDN**: Sin archivos CSS locales
- **Fetch async/await**: Exactamente como tus ejemplos
- **MySQL dockerizado**: Setup automático

¡El sistema está listo para usar y cumple todas las especificaciones del proyecto **CrudClinic**! 🚀