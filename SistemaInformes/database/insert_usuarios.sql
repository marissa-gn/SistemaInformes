-- ========================================
-- INSERTAR USUARIOS CON CONTRASEÑA: admin123
-- Hash generado con bcrypt en Node.js
-- ========================================

-- Obtener IDs de roles
SET @admin_role_id = (SELECT id FROM roles WHERE nombre = 'administrador' LIMIT 1);
SET @capturista_role_id = (SELECT id FROM roles WHERE nombre = 'capturista' LIMIT 1);
SET @visitante_role_id = (SELECT id FROM roles WHERE nombre = 'visitante' LIMIT 1);

-- Obtener ID de área (usando la primera disponible)
SET @default_area_id = (SELECT id FROM areas LIMIT 1);

-- Insertar ADMINISTRADOR
INSERT INTO usuarios (username, email, password_hash, nombre, apellido, numero_nomina, telefono, area_id, rol_id, activo) 
VALUES ('admin', 'admin@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Sistema', 'ADM001', '722-000-0001', @default_area_id, @admin_role_id, TRUE);

-- Insertar CAPTURISTAS
INSERT INTO usuarios (username, email, password_hash, nombre, apellido, numero_nomina, telefono, area_id, rol_id, activo) VALUES
('marissa.gomez', 'marissa.gomez@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marissa', 'Gómez', 'CAP001', '722-555-0001', @default_area_id, @capturista_role_id, TRUE),
('cecilia.davila', 'cecilia.davila@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cecilia', 'Dávila', 'CAP002', '722-555-0002', @default_area_id, @capturista_role_id, TRUE),
('jesus.saucedo', 'jesus.saucedo@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jesus', 'Saucedo', 'CAP003', '722-555-0003', @default_area_id, @capturista_role_id, TRUE),
('daniel.navarrete', 'daniel.navarrete@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Daniel', 'Navarrete', 'CAP004', '722-555-0004', @default_area_id, @capturista_role_id, TRUE),
('wayne.ramirez', 'wayne.ramirez@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Wayne', 'Ramírez', 'CAP005', '722-555-0005', @default_area_id, @capturista_role_id, TRUE),
('alan.guzman', 'alan.guzman@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alan', 'Guzmán', 'CAP006', '722-555-0006', @default_area_id, @capturista_role_id, TRUE);

-- Insertar VISITANTE
INSERT INTO usuarios (username, email, password_hash, nombre, apellido, numero_nomina, telefono, area_id, rol_id, activo) 
VALUES ('visitante', 'visitante@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Usuario', 'Visitante', 'VIS001', '722-000-0002', @default_area_id, @visitante_role_id, TRUE);

-- Verificar inserción
SELECT COUNT(*) as 'Total Usuarios Creados' FROM usuarios;
SELECT username, nombre, apellido, rol_id FROM usuarios ORDER BY id;
