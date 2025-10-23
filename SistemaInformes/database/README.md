# 🗄️ Base de Datos - Sistema de Informes

## 📋 Resumen

El Sistema de Informes utiliza MySQL como base de datos para gestionar usuarios, áreas, informes y actividades del Ayuntamiento de Atlacomulco.

## 🏗️ Estructura de la Base de Datos

### 📊 Tablas Principales

#### 1. **roles**
Gestiona los roles de usuario del sistema.
```sql
- id (INT, PK, AUTO_INCREMENT)
- nombre (VARCHAR(50), UNIQUE)
- descripcion (TEXT)
- permisos (JSON)
- created_at, updated_at (TIMESTAMP)
```

**Roles incluidos:**
- `administrador`: Acceso completo al sistema
- `capturista`: Crear y gestionar informes
- `visitante`: Acceso de solo lectura

#### 2. **areas**
Áreas organizacionales del ayuntamiento.
```sql
- id (INT, PK, AUTO_INCREMENT)
- nombre (VARCHAR(100), UNIQUE)
- descripcion (TEXT)
- responsable (VARCHAR(100))
- telefono (VARCHAR(20))
- email (VARCHAR(100))
- activa (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 3. **usuarios**
Usuarios del sistema.
```sql
- id (INT, PK, AUTO_INCREMENT)
- username (VARCHAR(50), UNIQUE)
- email (VARCHAR(100), UNIQUE)
- password_hash (VARCHAR(255))
- nombre (VARCHAR(100))
- apellido (VARCHAR(100))
- telefono (VARCHAR(20))
- area_id (FK → areas.id)
- rol_id (FK → roles.id)
- activo (BOOLEAN)
- ultimo_login (TIMESTAMP)
- intentos_login (INT)
- bloqueado_hasta (TIMESTAMP)
- created_at, updated_at (TIMESTAMP)
```

#### 4. **informes**
Informes de actividades.
```sql
- id (INT, PK, AUTO_INCREMENT)
- usuario_id (FK → usuarios.id)
- area_id (FK → areas.id)
- titulo (VARCHAR(200))
- sector_beneficia (VARCHAR(200))
- lugar_actividad (VARCHAR(200))
- tipo_actividad (VARCHAR(200))
- numero_beneficiarios (INT)
- monto_generado (DECIMAL(12,2))
- monto_invertido (DECIMAL(12,2))
- responde_solicitud_ciudadania (BOOLEAN)
- pertenece_procedimientos_area (BOOLEAN)
- descripcion_actividad (TEXT)
- objetivos (TEXT)
- resultados (TEXT)
- observaciones (TEXT)
- evidencia_fotografica (VARCHAR(500))
- fecha_actividad (DATE)
- fecha_creacion (TIMESTAMP)
- estado (ENUM: 'borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado')
- comentarios_revision (TEXT)
- aprobado_por (FK → usuarios.id)
- fecha_aprobacion (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 📊 Tablas de Soporte

#### 5. **sesiones**
Gestión de sesiones de usuario.
```sql
- id (VARCHAR(128), PK)
- usuario_id (FK → usuarios.id)
- ip_address (VARCHAR(45))
- user_agent (TEXT)
- expires (TIMESTAMP)
- data (TEXT)
- created_at (TIMESTAMP)
```

#### 6. **activity_logs**
Registro de actividades del sistema.
```sql
- id (INT, PK, AUTO_INCREMENT)
- usuario_id (FK → usuarios.id)
- accion (VARCHAR(100))
- tabla_afectada (VARCHAR(50))
- registro_id (INT)
- datos_anteriores (JSON)
- datos_nuevos (JSON)
- ip_address (VARCHAR(45))
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

## 🚀 Configuración e Instalación

### 1. **Requisitos Previos**
- MySQL 5.7+ o 8.0+
- Node.js 14+
- NPM o Yarn

### 2. **Configuración de Variables de Entorno**
Edita el archivo `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=sistema_informes
DB_PORT=3306
```

### 3. **Instalación de Dependencias**
```bash
npm install
```

### 4. **Configuración Automática de BD**
```bash
npm run setup-db
```

Este comando:
- ✅ Crea la base de datos
- ✅ Ejecuta el esquema (tablas, índices)
- ✅ Inserta datos de ejemplo
- ✅ Muestra las credenciales de acceso

### 5. **Iniciar el Servidor**
```bash
npm start
# o para desarrollo:
npm run dev
```

## 🔑 Credenciales por Defecto

### Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Permisos:** Acceso completo

### Capturistas (por área)
- **marissa.gomez** / admin123 (Finanzas)
- **cecilia.davila** / admin123 (RH)
- **jesus.saucedo** / admin123 (TI)
- **daniel.navarrete** / admin123 (Mercadotecnia)
- **wayne.ramirez** / admin123 (Logística)
- **alan.guzman** / admin123 (Operaciones)

### Visitante
- **Usuario:** `visitante`
- **Contraseña:** `admin123`
- **Permisos:** Solo lectura

## 🔧 API de Base de Datos

### Funciones Disponibles (database/connection.js)

#### Usuarios
```javascript
userQueries.getByCredentials(credential)  // Login
userQueries.getAll()                      // Listar usuarios
userQueries.create(userData)              // Crear usuario
userQueries.updateLastLogin(userId)       // Actualizar login
```

#### Áreas
```javascript
areaQueries.getAll()                      // Listar áreas
areaQueries.create(areaData)              // Crear área
```

#### Informes
```javascript
informeQueries.getAll()                   // Todos los informes
informeQueries.getByUser(userId)          // Informes por usuario
informeQueries.create(informeData)        // Crear informe
informeQueries.updateStatus(id, estado)   // Cambiar estado
```

#### Logs
```javascript
logQueries.log(logData)                   // Registrar actividad
```

## 📊 Estados de Informes

| Estado | Descripción |
|--------|-------------|
| `borrador` | Informe en edición |
| `enviado` | Enviado para revisión |
| `en_revision` | En proceso de revisión |
| `aprobado` | Aprobado por administrador |
| `rechazado` | Rechazado con comentarios |

## 🔍 Consultas Útiles

### Estadísticas Generales
```sql
-- Informes por estado
SELECT estado, COUNT(*) as total 
FROM informes 
GROUP BY estado;

-- Usuarios por rol
SELECT r.nombre as rol, COUNT(*) as total 
FROM usuarios u 
JOIN roles r ON u.rol_id = r.id 
GROUP BY r.nombre;

-- Informes por área
SELECT a.nombre as area, COUNT(*) as total 
FROM informes i 
JOIN areas a ON i.area_id = a.id 
GROUP BY a.nombre;
```

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Validación de sesiones
- ✅ Control de intentos de login
- ✅ Logs de actividad
- ✅ Sanitización de inputs
- ✅ Permisos por rol (JSON)

## 🗂️ Estructura de Archivos

```
database/
├── schema.sql          # Esquema de BD
├── sample_data.sql     # Datos de ejemplo
├── connection.js       # Conexión y queries
├── setup.js           # Script de configuración
└── README.md          # Esta documentación
```

## 🆘 Solución de Problemas

### Error de Conexión
```bash
Error: ER_ACCESS_DENIED_ERROR
```
**Solución:** Verificar credenciales en `.env`

### Error de Base de Datos
```bash
Error: ER_BAD_DB_ERROR
```
**Solución:** Ejecutar `npm run setup-db`

### Puerto en Uso
```bash
Error: EADDRINUSE
```
**Solución:** Cambiar `PORT` en `.env` o liberar puerto 3000

## 📈 Próximas Mejoras

- [ ] Backup automático
- [ ] Migraciones de BD
- [ ] Índices adicionales
- [ ] Particionado por fecha
- [ ] Replicación (si es necesario)

---

🏛️ **Sistema de Informes - Ayuntamiento de Atlacomulco**  
📧 Contacto: admin@atlacomulco.gob.mx