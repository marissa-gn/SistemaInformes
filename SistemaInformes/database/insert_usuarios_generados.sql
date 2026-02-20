-- ========================================
-- USUARIOS GENERADOS AUTOMÁTICAMENTE
-- Contraseña: PelussaGN2
-- Fecha: 9/2/2026, 7:45:40 a.m.
-- ========================================

-- Obtener IDs de roles
SET @admin_role_id = (SELECT id FROM roles WHERE nombre = 'administrador' LIMIT 1);
SET @capturista_role_id = (SELECT id FROM roles WHERE nombre = 'capturista' LIMIT 1);
SET @visitante_role_id = (SELECT id FROM roles WHERE nombre = 'visitante' LIMIT 1);

-- Obtener ID de área (primera disponible)
SET @default_area_id = (SELECT id FROM areas LIMIT 1);

-- Deletear usuarios existentes (opcional, comentado)
-- DELETE FROM usuarios WHERE username IN (
'marissa.gomez', 'raúl.jiménez', 'lourdes.ibáñez', 'ricardo.delgado', 'daniela.vega', 'silvia.rodríguez', 'consuelo.lópez', 'josefa.navarro', 'luis.cruz', 'fátima.bravo', 'carmen.rodríguez', 'luis.cabrera', 'virtudes.córdova', 'david.molina', 'alberto.pineda', 'consuelo.medina', 'josefa.pineda', 'pablo.rodríguez', 'luis.cabrera1', 'daniela.torres', 'rosa.rodríguez', 'lourdes.díaz', 'daniela.rodríguez', 'diego.gutiérrez', 'miguel.gómez', 'héctor.salazar', 'raúl.castro', 'víctor.morales', 'raúl.morales', 'javier.morales', 'andrés.torres'
-- );

-- ========================================
-- INSERTAR USUARIOS
-- ========================================
INSERT INTO usuarios (username, email, password_hash, nombre, apellido, numero_nomina, telefono, area_id, rol_id, activo) VALUES
('marissa.gomez', 'marissa.gomez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Marissa', 'Gómez Navor', 'ADM001', '722-555-0001', @default_area_id, @admin_role_id, TRUE),
('raúl.jiménez', 'raúl.jiménez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Raúl', 'Jiménez Pineda', 'ADM002', '722-193-6984', @default_area_id, @admin_role_id, TRUE),
('lourdes.ibáñez', 'lourdes.ibáñez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Lourdes', 'Ibáñez Ramírez', 'ADM003', '722-279-8556', @default_area_id, @admin_role_id, TRUE),
('ricardo.delgado', 'ricardo.delgado@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Ricardo', 'Delgado Suárez', 'ADM004', '722-997-8591', @default_area_id, @admin_role_id, TRUE),
('daniela.vega', 'daniela.vega@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Daniela', 'Vega Ibáñez', 'ADM005', '722-987-1470', @default_area_id, @admin_role_id, TRUE),
('silvia.rodríguez', 'silvia.rodríguez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Silvia', 'Rodríguez Torres', 'ADM006', '722-590-7209', @default_area_id, @admin_role_id, TRUE),
('consuelo.lópez', 'consuelo.lópez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Consuelo', 'López Reyes', 'VIS001', '722-583-5120', @default_area_id, @visitante_role_id, TRUE),
('josefa.navarro', 'josefa.navarro@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Josefa', 'Navarro Ramírez', 'VIS002', '722-260-4046', @default_area_id, @visitante_role_id, TRUE),
('luis.cruz', 'luis.cruz@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Luis', 'Cruz Rojas', 'VIS003', '722-579-3183', @default_area_id, @visitante_role_id, TRUE),
('fátima.bravo', 'fátima.bravo@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Fátima', 'Bravo Jiménez', 'VIS004', '722-733-3799', @default_area_id, @visitante_role_id, TRUE),
('carmen.rodríguez', 'carmen.rodríguez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Carmen', 'Rodríguez Córdova', 'VIS005', '722-600-1431', @default_area_id, @visitante_role_id, TRUE),
('luis.cabrera', 'luis.cabrera@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Luis', 'Cabrera Suárez', 'CAP001', '722-740-9704', @default_area_id, @capturista_role_id, TRUE),
('virtudes.córdova', 'virtudes.córdova@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Virtudes', 'Córdova González', 'CAP002', '722-521-6874', @default_area_id, @capturista_role_id, TRUE),
('david.molina', 'david.molina@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'David', 'Molina Vega', 'CAP003', '722-743-4136', @default_area_id, @capturista_role_id, TRUE),
('alberto.pineda', 'alberto.pineda@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Alberto', 'Pineda Acosta', 'CAP004', '722-451-6144', @default_area_id, @capturista_role_id, TRUE),
('consuelo.medina', 'consuelo.medina@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Consuelo', 'Medina Ríos', 'CAP005', '722-950-2112', @default_area_id, @capturista_role_id, TRUE),
('josefa.pineda', 'josefa.pineda@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Josefa', 'Pineda Delgado', 'CAP006', '722-838-5934', @default_area_id, @capturista_role_id, TRUE),
('pablo.rodríguez', 'pablo.rodríguez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Pablo', 'Rodríguez Ramírez', 'CAP007', '722-836-4529', @default_area_id, @capturista_role_id, TRUE),
('luis.cabrera1', 'luis.cabrera@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Luis', 'Cabrera Rivera', 'CAP008', '722-132-8279', @default_area_id, @capturista_role_id, TRUE),
('daniela.torres', 'daniela.torres@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Daniela', 'Torres Navor', 'CAP009', '722-544-8077', @default_area_id, @capturista_role_id, TRUE),
('rosa.rodríguez', 'rosa.rodríguez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Rosa', 'Rodríguez Torres', 'CAP010', '722-849-4624', @default_area_id, @capturista_role_id, TRUE),
('lourdes.díaz', 'lourdes.díaz@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Lourdes', 'Díaz Ruiz', 'CAP011', '722-330-3225', @default_area_id, @capturista_role_id, TRUE),
('daniela.rodríguez', 'daniela.rodríguez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Daniela', 'Rodríguez Acosta', 'CAP012', '722-851-7930', @default_area_id, @capturista_role_id, TRUE),
('diego.gutiérrez', 'diego.gutiérrez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Diego', 'Gutiérrez Jiménez', 'CAP013', '722-772-2586', @default_area_id, @capturista_role_id, TRUE),
('miguel.gómez', 'miguel.gómez@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Miguel', 'Gómez Chávez', 'CAP014', '722-287-6182', @default_area_id, @capturista_role_id, TRUE),
('héctor.salazar', 'héctor.salazar@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Héctor', 'Salazar Guerrero', 'CAP015', '722-119-1158', @default_area_id, @capturista_role_id, TRUE),
('raúl.castro', 'raúl.castro@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Raúl', 'Castro Bravo', 'CAP016', '722-760-6237', @default_area_id, @capturista_role_id, TRUE),
('víctor.morales', 'víctor.morales@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Víctor', 'Morales Vargas', 'CAP017', '722-804-8550', @default_area_id, @capturista_role_id, TRUE),
('raúl.morales', 'raúl.morales@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Raúl', 'Morales Suárez', 'CAP018', '722-822-5793', @default_area_id, @capturista_role_id, TRUE),
('javier.morales', 'javier.morales@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Javier', 'Morales Pineda', 'CAP019', '722-239-4355', @default_area_id, @capturista_role_id, TRUE),
('andrés.torres', 'andrés.torres@atlacomulco.gob.mx', '$2a$10$d1.j3jDLlts/N1KioRGh9OawYbfbX9wd6dqjFnXrxRW9/CfuE4Cve', 'Andrés', 'Torres Reyes', 'CAP020', '722-178-5525', @default_area_id, @capturista_role_id, TRUE);

-- ========================================
-- VERIFICACIÓN
-- ========================================
SELECT COUNT(*) as 'Total Usuarios Creados' FROM usuarios;
SELECT 
  username, 
  nombre, 
  apellido,
  numero_nomina,
  (SELECT nombre FROM roles WHERE roles.id = usuarios.rol_id) as 'rol'
FROM usuarios 
ORDER BY id DESC 
LIMIT 31;
