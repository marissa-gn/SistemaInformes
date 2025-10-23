const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_informes',
  port: process.env.DB_PORT || 3306
};

async function verificarBaseDatos() {
  let connection;
  
  try {
    console.log('🔍 Verificando estado de la base de datos...\n');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida correctamente');
    console.log(`📊 Base de datos: ${dbConfig.database}`);
    console.log(`🖥️ Servidor: ${dbConfig.host}:${dbConfig.port}\n`);
    
    // Verificar tablas existentes
    console.log('📋 Verificando tablas...');
    const [tables] = await connection.execute('SHOW TABLES');
    
    const expectedTables = ['roles', 'areas', 'usuarios', 'informes', 'notificaciones'];
    const existingTables = tables.map(row => Object.values(row)[0]);
    
    console.log(`✅ Tablas encontradas (${existingTables.length}):`);
    existingTables.forEach(table => console.log(`   • ${table}`));
    
    // Verificar tablas faltantes
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    if (missingTables.length > 0) {
      console.log(`⚠️ Tablas faltantes (${missingTables.length}):`);
      missingTables.forEach(table => console.log(`   • ${table}`));
    }
    
    console.log('\n🔍 Verificando contenido de tablas...');
    
    // Verificar contenido de cada tabla
    for (const table of existingTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`📊 ${table}: ${count} registros`);
        
        // Si es tabla de usuarios, mostrar datos de prueba
        if (table === 'usuarios' && count > 0) {
          const [users] = await connection.execute('SELECT username, nombre, apellido FROM usuarios LIMIT 3');
          console.log('   Usuarios de prueba:');
          users.forEach(user => console.log(`     • ${user.username} (${user.nombre} ${user.apellido})`));
        }
      } catch (error) {
        console.log(`❌ Error verificando ${table}: ${error.message}`);
      }
    }
    
    // Verificar usuario de prueba específico
    console.log('\n🔍 Verificando usuario de administrador...');
    const [adminUser] = await connection.execute(
      'SELECT u.username, u.nombre, u.apellido, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = ?',
      ['marissa.gomez']
    );
    
    if (adminUser.length > 0) {
      const user = adminUser[0];
      console.log(`✅ Usuario administrador encontrado: ${user.username}`);
      console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
      console.log(`   Rol: ${user.rol}`);
    } else {
      console.log('⚠️ Usuario administrador (marissa.gomez) no encontrado');
    }
    
    console.log('\n🎯 Verificación de base de datos completada');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verificarBaseDatos();