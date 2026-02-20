const bcrypt = require('bcryptjs');
const fs = require('fs');

// Contraseña a hashear
const password = 'PelussaGN2';

// Listas de nombres y apellidos en español
const nombresHombres = [
  'Juan', 'Carlos', 'Miguel', 'Luis', 'David', 'Antonio', 'José', 'Manuel',
  'Francisco', 'Vicente', 'Rafael', 'Jorge', 'Ricardo', 'Fernando', 'Andrés',
  'Enrique', 'Pablo', 'Eduardo', 'Raúl', 'Sergio', 'Javier', 'Roberto',
  'Alejandro', 'Gabriel', 'Diego', 'Héctor', 'Octavio', 'Víctor', 'Alberto'
];

const nombresMujeres = [
  'Marissa', 'María', 'Carmen', 'Rosa', 'Teresa', 'Magdalena', 'Carlota',
  'Josefa', 'Matilde', 'Rosario', 'Esperanza', 'Consuelo', 'Jacinta',
  'Remedios', 'Amparo', 'Etelvina', 'Virtudes', 'Petrona', 'Asunción',
  'Natividad', 'Concepción', 'Adoración', 'Lourdes', 'Fátima', 'Marisol',
  'Vanessa', 'Alejandra', 'Adriana', 'Silvia', 'Cecilia', 'Daniela'
];

const apellidos = [
  'García', 'Martínez', 'López', 'Hernández', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Cruz', 'Díaz', 'Morales', 'Reyes',
  'Gutiérrez', 'Ortiz', 'Jiménez', 'Rojas', 'Castillo', 'Vargas', 'Medina',
  'Silva', 'Navarro', 'Ruiz', 'Vega', 'Salazar', 'Córdova', 'Castro', 'Bravo',
  'Gómez', 'Vásquez', 'Chávez', 'Rodríguez', 'Suárez', 'Guerrero', 'Delgado',
  'Ríos', 'Pineda', 'Cabrera', 'Montoya', 'Acosta', 'Ibáñez', 'Molina', 'Navor'
];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateUsername(nombre, apellido, index) {
  return `${nombre.toLowerCase()}.${apellido.toLowerCase()}${index > 0 ? index : ''}`;
}

function generateEmail(nombre, apellido) {
  return `${nombre.toLowerCase()}.${apellido.toLowerCase()}@atlacomulco.gob.mx`;
}

function generateNomina(role, index) {
  const rolePrefix = role === 'administrador' ? 'ADM' : (role === 'visitante' ? 'VIS' : 'CAP');
  return `${rolePrefix}${String(index + 1).padStart(3, '0')}`;
}

function randomPhone() {
  const area = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `722-${exchange}-${line}`;
}

async function generateUsers() {
  console.log('🔐 Hasheando contraseña "PelussaGN2"...');
  const passwordHash = await bcrypt.hash(password, 10);
  console.log(`✅ Hash generado: ${passwordHash}\n`);

  // Definir estructura de usuarios a crear
  const structure = [
    { role: 'administrador', count: 6, users: [] }, // 1 principal + 5 adicionales
    { role: 'visitante', count: 5, users: [] },
    { role: 'capturista', count: 20, users: [] }
  ];

  // El primer administrador es especial
  const firstAdmin = {
    username: 'marissa.gomez',
    email: 'marissa.gomez@atlacomulco.gob.mx',
    nombre: 'Marissa',
    apellido: 'Gómez Navor',
    numero_nomina: 'ADM001',
    telefono: '722-555-0001',
    rol: 'administrador'
  };

  structure[0].users.push(firstAdmin);

  // Generar usuarios restantes de cada rol
  for (const roleData of structure) {
    const startIndex = roleData.role === 'administrador' ? 1 : 0;
    
    for (let i = startIndex; i < roleData.count; i++) {
      const isMale = Math.random() > 0.4;
      const nombre = isMale ? randomElement(nombresHombres) : randomElement(nombresMujeres);
      const apellido1 = randomElement(apellidos);
      const apellido2 = randomElement(apellidos);
      const apellidoCompleto = `${apellido1} ${apellido2}`;

      let username = generateUsername(nombre, apellido1, 0);
      let counter = 1;
      // Evitar duplicados
      while (structure.some(s => s.users.some(u => u.username === username))) {
        username = generateUsername(nombre, apellido1, counter);
        counter++;
      }

      const user = {
        username,
        email: generateEmail(nombre, apellido1),
        nombre,
        apellido: apellidoCompleto,
        numero_nomina: generateNomina(roleData.role, i),
        telefono: randomPhone(),
        rol: roleData.role
      };

      roleData.users.push(user);
    }
  }

  // Generar SQL
  let sqlContent = `-- ========================================
-- USUARIOS GENERADOS AUTOMÁTICAMENTE
-- Contraseña: PelussaGN2
-- Fecha: ${new Date().toLocaleString()}
-- ========================================

-- Obtener IDs de roles
SET @admin_role_id = (SELECT id FROM roles WHERE nombre = 'administrador' LIMIT 1);
SET @capturista_role_id = (SELECT id FROM roles WHERE nombre = 'capturista' LIMIT 1);
SET @visitante_role_id = (SELECT id FROM roles WHERE nombre = 'visitante' LIMIT 1);

-- Obtener ID de área (primera disponible)
SET @default_area_id = (SELECT id FROM areas LIMIT 1);

-- Deletear usuarios existentes (opcional, comentado)
-- DELETE FROM usuarios WHERE username IN (
`;

  // Agregar usernames al DELETE comentado
  const allUsers = structure.flatMap(s => s.users);
  const usernames = allUsers.map(u => `'${u.username}'`).join(', ');
  sqlContent += usernames;
  sqlContent += `\n-- );\n\n`;

  sqlContent += `-- ========================================
-- INSERTAR USUARIOS
-- ========================================
INSERT INTO usuarios (username, email, password_hash, nombre, apellido, numero_nomina, telefono, area_id, rol_id, activo) VALUES\n`;

  const insertValues = [];

  for (const roleData of structure) {
    for (const user of roleData.users) {
      const roleId = roleData.role === 'administrador' ? '@admin_role_id' : 
                     (roleData.role === 'visitante' ? '@visitante_role_id' : '@capturista_role_id');

      insertValues.push(
        `('${user.username}', '${user.email}', '${passwordHash}', '${user.nombre}', '${user.apellido}', '${user.numero_nomina}', '${user.telefono}', @default_area_id, ${roleId}, TRUE)`
      );
    }
  }

  sqlContent += insertValues.join(',\n') + ';\n\n';

  // Agregar verificación
  sqlContent += `-- ========================================
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
`;

  // Guardar archivo SQL
  fs.writeFileSync('database/insert_usuarios_generados.sql', sqlContent);
  console.log('✅ Archivo SQL generado: database/insert_usuarios_generados.sql\n');

  // Mostrar resumen
  console.log('═══════════════════════════════════════════');
  console.log('📊 RESUMEN DE USUARIOS A CREAR');
  console.log('═══════════════════════════════════════════\n');

  for (const roleData of structure) {
    console.log(`\n${roleData.role.toUpperCase()} (${roleData.users.length} usuarios):`);
    console.log('─'.repeat(80));
    for (const user of roleData.users) {
      console.log(`  👤 ${user.username.padEnd(25)} | ${user.nombre.padEnd(15)} ${user.apellido.padEnd(20)} | Nómina: ${user.numero_nomina}`);
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`✅ Total usuarios: ${allUsers.length}`);
  console.log(`📝 Contraseña: ${password}`);
  console.log('═══════════════════════════════════════════\n');

  return sqlContent;
}

// Ejecutar
generateUsers().catch(console.error);
