const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const usuarios = [
  // ADMINISTRADORES (6)
  { username: 'marissa.gomez', email: 'marissa.gomez@atlacomulco.gob.mx', nombre: 'Marissa', apellido: 'Gómez Navor', numero_nomina: 'ADM001', telefono: '722-555-0001', rol: 'administrador' },
  { username: 'raul.jimenez', email: 'raul.jimenez@atlacomulco.gob.mx', nombre: 'Raúl', apellido: 'Jiménez Pineda', numero_nomina: 'ADM002', telefono: '722-555-0002', rol: 'administrador' },
  { username: 'lourdes.ibanez', email: 'lourdes.ibanez@atlacomulco.gob.mx', nombre: 'Lourdes', apellido: 'Ibáñez Ramírez', numero_nomina: 'ADM003', telefono: '722-555-0003', rol: 'administrador' },
  { username: 'ricardo.delgado', email: 'ricardo.delgado@atlacomulco.gob.mx', nombre: 'Ricardo', apellido: 'Delgado Suárez', numero_nomina: 'ADM004', telefono: '722-555-0004', rol: 'administrador' },
  { username: 'daniela.vega', email: 'daniela.vega@atlacomulco.gob.mx', nombre: 'Daniela', apellido: 'Vega Ibáñez', numero_nomina: 'ADM005', telefono: '722-555-0005', rol: 'administrador' },
  { username: 'silvia.rodriguez', email: 'silvia.rodriguez@atlacomulco.gob.mx', nombre: 'Silvia', apellido: 'Rodríguez Torres', numero_nomina: 'ADM006', telefono: '722-555-0006', rol: 'administrador' },
  
  // VISITANTES (5)
  { username: 'consuelo.lopez', email: 'consuelo.lopez@atlacomulco.gob.mx', nombre: 'Consuelo', apellido: 'López Reyes', numero_nomina: 'VIS001', telefono: '722-555-0007', rol: 'visitante' },
  { username: 'josefa.navarro', email: 'josefa.navarro@atlacomulco.gob.mx', nombre: 'Josefa', apellido: 'Navarro Ramírez', numero_nomina: 'VIS002', telefono: '722-555-0008', rol: 'visitante' },
  { username: 'luis.cruz', email: 'luis.cruz@atlacomulco.gob.mx', nombre: 'Luis', apellido: 'Cruz Rojas', numero_nomina: 'VIS003', telefono: '722-555-0009', rol: 'visitante' },
  { username: 'fatima.bravo', email: 'fatima.bravo@atlacomulco.gob.mx', nombre: 'Fátima', apellido: 'Bravo Jiménez', numero_nomina: 'VIS004', telefono: '722-555-0010', rol: 'visitante' },
  { username: 'carmen.rodriguez', email: 'carmen.rodriguez@atlacomulco.gob.mx', nombre: 'Carmen', apellido: 'Rodríguez Córdova', numero_nomina: 'VIS005', telefono: '722-555-0011', rol: 'visitante' },
  
  // CAPTURISTAS (20)
  { username: 'luis.cabrera', email: 'luis.cabrera@atlacomulco.gob.mx', nombre: 'Luis', apellido: 'Cabrera Suárez', numero_nomina: 'CAP001', telefono: '722-555-0012', rol: 'capturista' },
  { username: 'virtudes.cordova', email: 'virtudes.cordova@atlacomulco.gob.mx', nombre: 'Virtudes', apellido: 'Córdova González', numero_nomina: 'CAP002', telefono: '722-555-0013', rol: 'capturista' },
  { username: 'david.molina', email: 'david.molina@atlacomulco.gob.mx', nombre: 'David', apellido: 'Molina Vega', numero_nomina: 'CAP003', telefono: '722-555-0014', rol: 'capturista' },
  { username: 'alberto.pineda', email: 'alberto.pineda@atlacomulco.gob.mx', nombre: 'Alberto', apellido: 'Pineda Acosta', numero_nomina: 'CAP004', telefono: '722-555-0015', rol: 'capturista' },
  { username: 'consuelo.medina', email: 'consuelo.medina@atlacomulco.gob.mx', nombre: 'Consuelo', apellido: 'Medina Ríos', numero_nomina: 'CAP005', telefono: '722-555-0016', rol: 'capturista' },
  { username: 'josefa.pineda', email: 'josefa.pineda@atlacomulco.gob.mx', nombre: 'Josefa', apellido: 'Pineda Delgado', numero_nomina: 'CAP006', telefono: '722-555-0017', rol: 'capturista' },
  { username: 'pablo.rodriguez', email: 'pablo.rodriguez@atlacomulco.gob.mx', nombre: 'Pablo', apellido: 'Rodríguez Ramírez', numero_nomina: 'CAP007', telefono: '722-555-0018', rol: 'capturista' },
  { username: 'luis.cabrera1', email: 'luis.cabrera1@atlacomulco.gob.mx', nombre: 'Luis', apellido: 'Cabrera Rivera', numero_nomina: 'CAP008', telefono: '722-555-0019', rol: 'capturista' },
  { username: 'daniela.torres', email: 'daniela.torres@atlacomulco.gob.mx', nombre: 'Daniela', apellido: 'Torres Navor', numero_nomina: 'CAP009', telefono: '722-555-0020', rol: 'capturista' },
  { username: 'rosa.rodriguez', email: 'rosa.rodriguez@atlacomulco.gob.mx', nombre: 'Rosa', apellido: 'Rodríguez Torres', numero_nomina: 'CAP010', telefono: '722-555-0021', rol: 'capturista' },
  { username: 'lourdes.diaz', email: 'lourdes.diaz@atlacomulco.gob.mx', nombre: 'Lourdes', apellido: 'Díaz Ruiz', numero_nomina: 'CAP011', telefono: '722-555-0022', rol: 'capturista' },
  { username: 'daniela.rodriguez', email: 'daniela.rodriguez@atlacomulco.gob.mx', nombre: 'Daniela', apellido: 'Rodríguez Acosta', numero_nomina: 'CAP012', telefono: '722-555-0023', rol: 'capturista' },
  { username: 'diego.gutierrez', email: 'diego.gutierrez@atlacomulco.gob.mx', nombre: 'Diego', apellido: 'Gutiérrez Jiménez', numero_nomina: 'CAP013', telefono: '722-555-0024', rol: 'capturista' },
  { username: 'miguel.gomez', email: 'miguel.gomez@atlacomulco.gob.mx', nombre: 'Miguel', apellido: 'Gómez Chávez', numero_nomina: 'CAP014', telefono: '722-555-0025', rol: 'capturista' },
  { username: 'hector.salazar', email: 'hector.salazar@atlacomulco.gob.mx', nombre: 'Héctor', apellido: 'Salazar Guerrero', numero_nomina: 'CAP015', telefono: '722-555-0026', rol: 'capturista' },
  { username: 'raul.castro', email: 'raul.castro@atlacomulco.gob.mx', nombre: 'Raúl', apellido: 'Castro Bravo', numero_nomina: 'CAP016', telefono: '722-555-0027', rol: 'capturista' },
  { username: 'victor.morales', email: 'victor.morales@atlacomulco.gob.mx', nombre: 'Víctor', apellido: 'Morales Vargas', numero_nomina: 'CAP017', telefono: '722-555-0028', rol: 'capturista' },
  { username: 'raul.morales', email: 'raul.morales@atlacomulco.gob.mx', nombre: 'Raúl', apellido: 'Morales Suárez', numero_nomina: 'CAP018', telefono: '722-555-0029', rol: 'capturista' },
  { username: 'javier.morales', email: 'javier.morales@atlacomulco.gob.mx', nombre: 'Javier', apellido: 'Morales Pineda', numero_nomina: 'CAP019', telefono: '722-555-0030', rol: 'capturista' },
  { username: 'andres.torres', email: 'andres.torres@atlacomulco.gob.mx', nombre: 'Andrés', apellido: 'Torres Reyes', numero_nomina: 'CAP020', telefono: '722-555-0031', rol: 'capturista' }
];

async function insertUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'si_user',
    password: process.env.DB_PASSWORD || 'si_password',
    database: process.env.DB_NAME || 'sistema_informes'
  });

  try {
    console.log('🔐 Hasheando contraseña "PelussaGN2"...');
    const passwordHash = await bcrypt.hash('PelussaGN2', 10);
    
    // Obtener IDs de roles y área
    const [roles] = await connection.query('SELECT id, nombre FROM roles');
    const [areas] = await connection.query('SELECT id FROM areas LIMIT 1');
    
    const roleMap = {};
    for (const role of roles) {
      roleMap[role.nombre] = role.id;
    }
    
    const areaId = areas[0].id;
    
    console.log('✅ Hash generado');
    console.log(`🔍 Rol Admin ID: ${roleMap.administrador}`);
    console.log(`🔍 Rol Visitante ID: ${roleMap.visitante}`);
    console.log(`🔍 Rol Capturista ID: ${roleMap.capturista}`);
    console.log(`🔍 Área ID: ${areaId}\n`);

    // Insertar usuarios
    let contador = 0;
    for (const user of usuarios) {
      const rolId = roleMap[user.rol];
      
      const query = `
        INSERT INTO usuarios 
        (username, email, password_hash, nombre, apellido, numero_nomina, telefono, area_id, rol_id, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `;
      
      await connection.execute(query, [
        user.username,
        user.email,
        passwordHash,
        user.nombre,
        user.apellido,
        user.numero_nomina,
        user.telefono,
        areaId,
        rolId
      ]);
      
      contador++;
      process.stdout.write(`\r✅ Usuarios insertados: ${contador}/${usuarios.length}`);
    }

    console.log(`\n\n✅ ¡ÉXITO! Se insertaron ${contador} usuarios\n`);
    
    // Mostrar resumen
    const [adminCount] = await connection.query(
      'SELECT COUNT(*) as count FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = "administrador"'
    );
    const [captCount] = await connection.query(
      'SELECT COUNT(*) as count FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = "capturista"'
    );
    const [visCount] = await connection.query(
      'SELECT COUNT(*) as count FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE r.nombre = "visitante"'
    );
    
    console.log('═'.repeat(50));
    console.log('📊 RESUMEN DE USUARIOS CREADOS');
    console.log('═'.repeat(50));
    console.log(`👑 Administradores: ${adminCount[0].count}`);
    console.log(`✏️ Capturistas: ${captCount[0].count}`);
    console.log(`👁️ Visitantes: ${visCount[0].count}`);
    console.log(`📝 Total: ${contador}`);
    console.log('\n🔑 CREDENCIALES:');
    console.log(`   Usuario: marissa.gomez`);
    console.log(`   Contraseña: PelussaGN2`);
    console.log('═'.repeat(50) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

insertUsers();
