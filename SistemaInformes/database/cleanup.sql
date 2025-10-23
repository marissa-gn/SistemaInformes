-- Limpiar usuarios excepto Marissa
DELETE FROM usuarios WHERE username NOT IN ('marissa', 'marissa.gomez');

-- Actualizar username de Marissa si es necesario
UPDATE usuarios SET username = 'marissa' WHERE username = 'marissa.gomez';

-- Verificar usuarios restantes
SELECT id, username, nombre, apellido, email, rol_id FROM usuarios;