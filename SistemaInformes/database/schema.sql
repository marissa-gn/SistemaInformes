-- ========================================
-- SISTEMA DE INFORMES - ESQUEMA DE BASE DE DATOS
-- ========================================

-- ========================================
-- TABLA DE ROLES
-- ========================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA DE ÁREAS
-- ========================================
CREATE TABLE areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    responsable VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- TABLA DE USUARIOS
-- ========================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    numero_nomina VARCHAR(50) NOT NULL,
    area_id INT,
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    intentos_login INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- ========================================
-- TABLA DE INFORMES
-- ========================================
CREATE TABLE informes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    area_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    sector_beneficia VARCHAR(200),
    lugar_actividad VARCHAR(200),
    tipo_actividad VARCHAR(200),
    numero_beneficiarios INT,
    monto_generado DECIMAL(12,2),
    monto_invertido DECIMAL(12,2),
    responde_solicitud_ciudadania BOOLEAN,
    pertenece_procedimientos_area BOOLEAN,
    descripcion_actividad TEXT,
    objetivos TEXT,
    resultados TEXT,
    observaciones TEXT,
    evidencia_fotografica VARCHAR(500), -- Ruta del archivo
    fecha_actividad DATE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado') DEFAULT 'borrador',
    comentarios_revision TEXT,
    aprobado_por INT NULL,
    fecha_aprobacion TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE RESTRICT,
    FOREIGN KEY (aprobado_por) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ========================================
-- TABLA DE SESIONES (para manejo de sesiones)
-- ========================================
CREATE TABLE sesiones (
    id VARCHAR(128) PRIMARY KEY,
    usuario_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires TIMESTAMP NOT NULL,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ========================================
-- TABLA DE LOGS DE ACTIVIDAD
-- ========================================
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Índices para usuarios
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_area ON usuarios(area_id);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
-- Índice para número de nómina (búsquedas frecuentes)
CREATE INDEX idx_usuarios_nomina ON usuarios(numero_nomina);

-- Índices para informes
CREATE INDEX idx_informes_usuario ON informes(usuario_id);
CREATE INDEX idx_informes_area ON informes(area_id);
CREATE INDEX idx_informes_estado ON informes(estado);
CREATE INDEX idx_informes_fecha_creacion ON informes(fecha_creacion);
CREATE INDEX idx_informes_fecha_actividad ON informes(fecha_actividad);

-- Índices para sesiones
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX idx_sesiones_expires ON sesiones(expires);

-- Índices para logs
CREATE INDEX idx_logs_usuario ON activity_logs(usuario_id);
CREATE INDEX idx_logs_accion ON activity_logs(accion);
CREATE INDEX idx_logs_fecha ON activity_logs(created_at);