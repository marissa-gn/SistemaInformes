-- ========================================
-- SISTEMA DE INFORMES - DATOS DE EJEMPLO
-- ========================================

-- ========================================
-- INSERTAR ROLES
-- ========================================
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('administrador', 'Administrador del sistema con acceso completo', 
 '{"usuarios": {"ver": true, "crear": true, "editar": true, "eliminar": true}, 
   "areas": {"ver": true, "crear": true, "editar": true, "eliminar": true}, 
   "informes": {"ver": true, "crear": true, "editar": true, "eliminar": true, "aprobar": true}, 
   "estadisticas": {"ver": true}, 
   "configuracion": {"ver": true, "editar": true}}'),

('capturista', 'Usuario que puede crear y gestionar informes', 
 '{"usuarios": {"ver": false, "crear": false, "editar": false, "eliminar": false}, 
   "areas": {"ver": true, "crear": false, "editar": false, "eliminar": false}, 
   "informes": {"ver": true, "crear": true, "editar": true, "eliminar": false, "aprobar": false}, 
   "estadisticas": {"ver": false}, 
   "configuracion": {"ver": false, "editar": false}}'),

('visitante', 'Usuario con acceso de solo lectura', 
 '{"usuarios": {"ver": false, "crear": false, "editar": false, "eliminar": false}, 
   "areas": {"ver": true, "crear": false, "editar": false, "eliminar": false}, 
   "informes": {"ver": true, "crear": false, "editar": false, "eliminar": false, "aprobar": false}, 
   "estadisticas": {"ver": true}, 
   "configuracion": {"ver": false, "editar": false}}');

-- ========================================
-- INSERTAR ÁREAS
-- ========================================
INSERT INTO areas (nombre, descripcion, responsable, telefono, email) VALUES
('Finanzas y Contabilidad', 'Área encargada de la gestión financiera y contable del ayuntamiento', 'Carlos Mendoza', '722-123-4567', 'finanzas@atlacomulco.gob.mx'),
('Recursos Humanos', 'Gestión del personal y desarrollo humano', 'María González', '722-123-4568', 'rh@atlacomulco.gob.mx'),
('Tecnologías de la Información', 'Desarrollo y mantenimiento de sistemas informáticos', 'Jesus Saucedo', '722-123-4569', 'ti@atlacomulco.gob.mx'),
('Mercadotecnia', 'Promoción y comunicación institucional', 'Ana Jiménez', '722-123-4570', 'mercadotecnia@atlacomulco.gob.mx'),
('Departamento de Logística', 'Gestión de recursos materiales y logística', 'Roberto Silva', '722-123-4571', 'logistica@atlacomulco.gob.mx'),
('Producción / Operaciones', 'Operaciones y procesos productivos municipales', 'Elena Torres', '722-123-4572', 'operaciones@atlacomulco.gob.mx');

-- ========================================
-- INSERTAR USUARIOS DE EJEMPLO
-- ========================================
-- Nota: Las contraseñas están hasheadas con bcrypt
INSERT INTO usuarios (username, email, password_hash, nombre, apellido, telefono, area_id, rol_id) VALUES
-- Administrador Marissa (password: "admin123")
('marissa', 'marissa.gomez@atlacomulco.gob.mx', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marissa', 'Gómez', '722-555-0001', 1, 1),
-- Visitante Jesus Saucedo (password: "Frio567")
('jesus.sau', 'jesus.saucedo@atlacomulco.gob.mx', '$2a$10$WyYf0Z8XHJCFNXhCBKsSaepwm6Xc86JtR9C5OEc2dzoOdvK70VkBq', 'Jesus', 'Saucedo Zavala', '722-555-0003', 3, 3);

-- ========================================
-- INSERTAR INFORMES DE EJEMPLO
-- ========================================
INSERT INTO informes (
    usuario_id, area_id, titulo, sector_beneficia, lugar_actividad, tipo_actividad, 
    numero_beneficiarios, monto_generado, monto_invertido, responde_solicitud_ciudadania, 
    pertenece_procedimientos_area, descripcion_actividad, objetivos, resultados, 
    observaciones, fecha_actividad, estado, aprobado_por, fecha_aprobacion
) VALUES
-- Informe 1 - Finanzas
(2, 1, 'Capacitación en Gestión Financiera Municipal', 'Empleados del Ayuntamiento', 'Palacio Municipal', 'Capacitación', 
 25, 0.00, 15000.00, false, true, 
 'Capacitación integral para el personal del área financiera en nuevas normativas contables y presupuestarias.',
 'Mejorar las competencias del personal en gestión financiera municipal y implementar mejores prácticas.',
 'Personal capacitado con conocimientos actualizados. Mejora en los procesos de registro contable.',
 'Excelente participación del personal. Se recomienda dar seguimiento con capacitaciones periódicas.',
 '2024-09-15', 'aprobado', 1, '2024-09-16 10:30:00'),

-- Informe 2 - Recursos Humanos  
(3, 2, 'Programa de Bienestar Laboral', 'Empleados municipales y sus familias', 'Centro Recreativo Municipal', 'Evento recreativo',
 150, 0.00, 25000.00, false, true,
 'Evento recreativo familiar para promover el bienestar laboral y fortalecer el ambiente de trabajo.',
 'Mejorar el clima organizacional y promover la integración entre empleados y sus familias.',
 'Alta participación del personal. Mejora notable en el ambiente laboral según encuestas posteriores.',
 'Evento muy exitoso. Se sugiere realizar eventos similares trimestralmente.',
 '2024-09-20', 'aprobado', 1, '2024-09-21 09:15:00'),

-- Informe 3 - Tecnologías (en revisión)
(4, 3, 'Actualización de Infraestructura de Red', 'Empleados del Ayuntamiento', 'Instalaciones municipales', 'Mantenimiento tecnológico',
 200, 0.00, 80000.00, true, true,
 'Actualización completa de la infraestructura de red para mejorar la conectividad y seguridad.',
 'Modernizar la infraestructura tecnológica y mejorar la eficiencia operativa.',
 'Red actualizada con mayor velocidad y seguridad. Reducción del 70% en incidencias de conectividad.',
 'Proyecto ejecutado exitosamente. Se recomienda mantenimiento preventivo semestral.',
 '2024-09-25', 'en_revision', NULL, NULL);

-- ========================================
-- INSERTAR LOGS DE ACTIVIDAD DE EJEMPLO
-- ========================================
INSERT INTO activity_logs (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos, ip_address) VALUES
(1, 'login', 'usuarios', 1, '{"success": true, "timestamp": "2024-09-26"}', '192.168.1.100'),
(2, 'crear_informe', 'informes', 1, '{"titulo": "Capacitación en Gestión Financiera Municipal"}', '192.168.1.101'),
(1, 'aprobar_informe', 'informes', 1, '{"estado": "aprobado", "aprobado_por": 1}', '192.168.1.100'),
(3, 'crear_informe', 'informes', 2, '{"titulo": "Programa de Bienestar Laboral"}', '192.168.1.102'),
(4, 'crear_informe', 'informes', 3, '{"titulo": "Actualización de Infraestructura de Red"}', '192.168.1.103');

-- ========================================
-- CONSULTAS DE VERIFICACIÓN
-- ========================================

-- Verificar roles creados
SELECT 'ROLES CREADOS:' as info;
SELECT id, nombre, descripcion FROM roles;

-- Verificar áreas creadas
SELECT 'ÁREAS CREADAS:' as info;
SELECT id, nombre, responsable FROM areas;

-- Verificar usuarios creados
SELECT 'USUARIOS CREADOS:' as info;
SELECT u.id, u.username, u.nombre, u.apellido, a.nombre as area, r.nombre as rol 
FROM usuarios u 
LEFT JOIN areas a ON u.area_id = a.id 
JOIN roles r ON u.rol_id = r.id;

-- Verificar informes creados
SELECT 'INFORMES CREADOS:' as info;
SELECT i.id, i.titulo, u.nombre as creador, a.nombre as area, i.estado 
FROM informes i 
JOIN usuarios u ON i.usuario_id = u.id 
JOIN areas a ON i.area_id = a.id;

-- Mostrar credenciales de acceso
SELECT 'CREDENCIALES DE ACCESO:' as info;
SELECT 
    'Administrador: marissa / admin123' as credenciales;