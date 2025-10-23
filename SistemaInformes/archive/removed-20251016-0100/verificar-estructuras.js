const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_informes',
  port: process.env.DB_PORT || 3306
};

async function verificarEstructuras() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🔍 Verificando estructuras de tablas...\n');
    
    // Verificar estructura de usuarios
    console.log('👥 TABLA USUARIOS:');
    const [userColumns] = await connection.execute('DESCRIBE usuarios');
    userColumns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(REQUIRED)' : '(OPTIONAL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Verificar algunos usuarios
    const [users] = await connection.execute('SELECT id, username, nombre, apellido, email FROM usuarios LIMIT 3');
    console.log('   Datos de muestra:');
    users.forEach(user => {
      console.log(`     ID: ${user.id} | ${user.username} | ${user.nombre} ${user.apellido} | ${user.email}`);
    });
    
    console.log('\n🏢 TABLA AREAS:');
    const [areaColumns] = await connection.execute('DESCRIBE areas');
    areaColumns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(REQUIRED)' : '(OPTIONAL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Verificar algunas áreas
    const [areas] = await connection.execute('SELECT id, nombre, responsable FROM areas LIMIT 5');
    console.log('   Datos de muestra:');
    areas.forEach(area => {
      console.log(`     ID: ${area.id} | ${area.nombre} | Responsable: ${area.responsable || 'N/A'}`);
    });
    
    console.log('\n📋 TABLA INFORMES:');
    const [informeColumns] = await connection.execute('DESCRIBE informes');
    informeColumns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(REQUIRED)' : '(OPTIONAL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Verificar algunos informes
    const [informes] = await connection.execute('SELECT id, titulo, area_id, usuario_id, estado FROM informes LIMIT 3');
    console.log('   Datos de muestra:');
    informes.forEach(informe => {
      console.log(`     ID: ${informe.id} | ${informe.titulo} | Area: ${informe.area_id} | Usuario: ${informe.usuario_id} | Estado: ${informe.estado}`);
    });
    
    console.log('\n🔐 TABLA ROLES:');
    const [roleColumns] = await connection.execute('DESCRIBE roles');
    roleColumns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(REQUIRED)' : '(OPTIONAL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Verificar roles
    const [roles] = await connection.execute('SELECT id, nombre, descripcion FROM roles');
    console.log('   Roles disponibles:');
    roles.forEach(role => {
      console.log(`     ID: ${role.id} | ${role.nombre} | ${role.descripcion || 'Sin descripción'}`);
    });
    
    console.log('\n🎯 Verificación de estructuras completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

verificarEstructuras();