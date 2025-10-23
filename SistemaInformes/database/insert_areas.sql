

-- Insertar áreas adicionales para un ayuntamiento completo
INSERT INTO areas (nombre, descripcion, responsable, telefono, email, activa) VALUES
('Obras Públicas', 'Planificación, construcción y mantenimiento de infraestructura municipal', 'Ing. Miguel Hernández', '722-123-4573', 'obras@atlacomulco.gob.mx', true),

('Desarrollo Social', 'Programas sociales y apoyo a la comunidad', 'Lic. Patricia Morales', '722-123-4574', 'desarrollo@atlacomulco.gob.mx', true),

('Seguridad Pública', 'Protección civil y seguridad ciudadana', 'Cmte. José Luis Ramírez', '722-123-4575', 'seguridad@atlacomulco.gob.mx', true),

('Medio Ambiente', 'Protección ambiental y sustentabilidad', 'Biol. Carmen Vázquez', '722-123-4576', 'ambiente@atlacomulco.gob.mx', true),

('Desarrollo Económico', 'Promoción empresarial y desarrollo económico local', 'Lic. Alberto Mendoza', '722-123-4577', 'economia@atlacomulco.gob.mx', true),

('Servicios Públicos', 'Gestión de servicios básicos municipales', 'Ing. Rosa Elena Cruz', '722-123-4578', 'servicios@atlacomulco.gob.mx', true),

('Protección Civil', 'Prevención y atención de emergencias', 'Cap. Fernando García', '722-123-4579', 'proteccion@atlacomulco.gob.mx', true),

('Desarrollo Urbano', 'Planificación territorial y licencias de construcción', 'Arq. Mónica Jiménez', '722-123-4580', 'urbano@atlacomulco.gob.mx', true),

('Catastro', 'Registro de propiedades y avalúos', 'Ing. David Flores', '722-123-4581', 'catastro@atlacomulco.gob.mx', true),

('Transparencia y Acceso a la Información', 'Garantizar transparencia gubernamental', 'Lic. Sofía Robles', '722-123-4582', 'transparencia@atlacomulco.gob.mx', true),

('Cultura y Turismo', 'Promoción cultural y turística del municipio', 'Lic. Manuel Castro', '722-123-4583', 'cultura@atlacomulco.gob.mx', true),

('Deportes', 'Promoción del deporte y recreación', 'Prof. Diana López', '722-123-4584', 'deportes@atlacomulco.gob.mx', true),

('Educación', 'Apoyo al sector educativo municipal', 'Mtra. Isabel Guerrero', '722-123-4585', 'educacion@atlacomulco.gob.mx', true),

('Salud', 'Servicios de salud pública municipal', 'Dr. Alejandro Ruiz', '722-123-4586', 'salud@atlacomulco.gob.mx', true),

('Registro Civil', 'Actas de nacimiento, matrimonio y defunción', 'Lic. Gloria Herrera', '722-123-4587', 'registro@atlacomulco.gob.mx', true);

-- Verificar áreas insertadas
SELECT 'NUEVAS ÁREAS AÑADIDAS:' as info;
SELECT id, nombre, responsable, activa FROM areas WHERE id > 6 ORDER BY id;

-- Mostrar total de áreas
SELECT 'TOTAL DE ÁREAS:' as info;
SELECT COUNT(*) as total_areas FROM areas WHERE activa = true;

-- Mostrar todas las áreas ordenadas
SELECT 'TODAS LAS ÁREAS ACTIVAS:' as info;
SELECT id, nombre, responsable FROM areas WHERE activa = true ORDER BY nombre;