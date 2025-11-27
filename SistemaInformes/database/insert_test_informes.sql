-- Script para insertar 2 informes de prueba para cada capturista

-- Insertar informes para usuario 18 (Ceci)
INSERT INTO informes (usuario_id, area_id, fecha_actividad, nombre_director, lugar_actividad, colonia_comunidad, tipo_actividad, cantidad, descripcion_actividad, sector_beneficia, numero_beneficiarios, monto_generado, pertenece_procedimientos_area, responde_solicitud_ciudadania, observaciones, estado) VALUES
(18, 14, '2025-11-20', 'Juan García', 'Centro Comunitario', 'Centro', 'Capacitación', 50, 'Capacitación en temas de salud comunitaria', 'Salud', 50, 1500.00, TRUE, TRUE, 'Informe de prueba 1 para Ceci', 'enviado'),
(18, 14, '2025-11-21', 'María López', 'Escuela Primaria', 'Barrio Nuevo', 'Taller', 30, 'Taller de educación ambiental para estudiantes', 'Educación', 30, 800.00, TRUE, FALSE, 'Informe de prueba 2 para Ceci', 'borrador');

-- Insertar informes para usuario 23 (Mario)
INSERT INTO informes (usuario_id, area_id, fecha_actividad, nombre_director, lugar_actividad, colonia_comunidad, tipo_actividad, cantidad, descripcion_actividad, sector_beneficia, numero_beneficiarios, monto_generado, pertenece_procedimientos_area, responde_solicitud_ciudadania, observaciones, estado) VALUES
(23, 14, '2025-11-19', 'Carlos Rodríguez', 'Parque Municipal', 'San José', 'Limpieza', 40, 'Jornada de limpieza de espacios públicos', 'Ambiente', 40, 500.00, TRUE, TRUE, 'Informe de prueba 1 para Mario', 'aprobado'),
(23, 14, '2025-11-22', 'Ana Martínez', 'Mercado Central', 'Centro Histórico', 'Organización', 25, 'Organización de programas comunitarios', 'Comercio', 25, 1200.00, FALSE, TRUE, 'Informe de prueba 2 para Mario', 'enviado');

-- Insertar informes para usuario 24
INSERT INTO informes (usuario_id, area_id, fecha_actividad, nombre_director, lugar_actividad, colonia_comunidad, tipo_actividad, cantidad, descripcion_actividad, sector_beneficia, numero_beneficiarios, monto_generado, pertenece_procedimientos_area, responde_solicitud_ciudadania, observaciones, estado) VALUES
(24, 14, '2025-11-18', 'Pedro Sánchez', 'Hospital Local', 'Zona Médica', 'Campaña', 60, 'Campaña de prevención de enfermedades', 'Salud', 60, 2000.00, TRUE, TRUE, 'Informe de prueba 1 para usuario 24', 'rechazado'),
(24, 14, '2025-11-23', 'Rosa García', 'Instituto Técnico', 'San Marcos', 'Conferencia', 80, 'Conferencia sobre emprendimiento', 'Educación', 80, 1800.00, TRUE, FALSE, 'Informe de prueba 2 para usuario 24', 'aprobado');

-- Insertar informes para usuario 25
INSERT INTO informes (usuario_id, area_id, fecha_actividad, nombre_director, lugar_actividad, colonia_comunidad, tipo_actividad, cantidad, descripcion_actividad, sector_beneficia, numero_beneficiarios, monto_generado, pertenece_procedimientos_area, responde_solicitud_ciudadania, observaciones, estado) VALUES
(25, 14, '2025-11-17', 'Luis Fernández', 'Centro de Convenciones', 'Administración', 'Seminario', 100, 'Seminario sobre gobernanza comunitaria', 'Política', 100, 3000.00, TRUE, TRUE, 'Informe de prueba 1 para usuario 25', 'borrador'),
(25, 14, '2025-11-24', 'Diego López', 'Biblioteca Municipal', 'Sur', 'Lectura', 45, 'Actividad de fomento de lectura', 'Cultura', 45, 600.00, FALSE, TRUE, 'Informe de prueba 2 para usuario 25', 'enviado');

-- Opcional: Agregar un comentario de revisión a los informes aprobados/rechazados
UPDATE informes SET comentarios_revision = 'Muy buen trabajo, cumple con todos los requisitos', aprobado_por = 1 WHERE estado = 'aprobado' AND comentarios_revision IS NULL;
UPDATE informes SET comentarios_revision = 'Falta información sobre beneficiarios. Por favor revisar y reenviar.', aprobado_por = 1 WHERE estado = 'rechazado' AND comentarios_revision IS NULL;

SELECT 'Informes de prueba insertados exitosamente' AS resultado;
