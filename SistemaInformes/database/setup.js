const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de base de datos...\n');

  let connection;
  
  try {
    // Conectar sin especificar base de datos para crearla
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    });

    console.log('✅ Conexión a MySQL establecida');

    // Crear la base de datos primero
    console.log('🏗️ Creando base de datos...');
    await connection.query('CREATE DATABASE IF NOT EXISTS sistema_informes');
    await connection.query('USE sistema_informes');
    console.log('✅ Base de datos creada/seleccionada');

    // Leer y ejecutar el esquema
    console.log('📋 Ejecutando esquema de base de datos...');
    const schemaPath = path.join(__dirname, 'schema.sql');
  let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  // Hacer idempotente: convertir 'CREATE TABLE ' en 'CREATE TABLE IF NOT EXISTS ' para evitar errores al re-ejecutar
  schemaSQL = schemaSQL.replace(/CREATE\s+TABLE\s+/gi, 'CREATE TABLE IF NOT EXISTS ');
    
    // Ejecutar los statements uno por uno para poder ignorar errores benignos (índices duplicados, etc.)
    // multipleStatements ya está habilitado en la conexión inicial, pero ejecutar por separado
    // nos permite capturar y continuar en caso de errores específicos.
    const statements = schemaSQL
      .split(/;\s*\n/) // dividir por punto y coma seguido de nueva línea para evitar cortar declaraciones internas
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await connection.query(stmt);
      } catch (err) {
        // Ignorar errores relacionados con índices/keys duplicados o tablas ya existentes
        if (err && (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY')) {
          console.warn('⚠️ Ignorado (posible duplicado):', err.message);
          continue;
        }
        // Re-throw para errores inesperados
        throw err;
      }
    }
    console.log('✅ Esquema de base de datos creado exitosamente');

    // Leer y ejecutar los datos de ejemplo (insertar solo si no existen)
    console.log('📝 Insertando datos de ejemplo (si faltan)...');
    const [existingRoles] = await connection.query("SELECT nombre FROM roles");
    const roleNames = existingRoles.map(r => r.nombre);

    const requiredRoles = [
      { nombre: 'administrador', descripcion: 'Acceso completo' },
      { nombre: 'capturista', descripcion: 'Puede capturar informes' },
      { nombre: 'visitante', descripcion: 'Acceso limitado' }
    ];

    for (const role of requiredRoles) {
      if (!roleNames.includes(role.nombre)) {
        try {
          await connection.query('INSERT INTO roles (nombre, descripcion) VALUES (?, ?)', [role.nombre, role.descripcion]);
          console.log(`✅ Rol creado: ${role.nombre}`);
        } catch (err) {
          console.warn('⚠️ No se pudo insertar rol (posible duplicado):', err.message);
        }
      } else {
        console.log(`ℹ️ Rol ya existe: ${role.nombre}`);
      }
    }

    // Insertar datos de ejemplo para areas/usuarios/informes solo si no existen
    const [areasCount] = await connection.query('SELECT COUNT(*) as c FROM areas');
    if (areasCount[0].c === 0) {
      const sampleAreasPath = path.join(__dirname, 'insert_areas.sql');
      if (fs.existsSync(sampleAreasPath)) {
        const areasSQL = fs.readFileSync(sampleAreasPath, 'utf8');
        try { await connection.query(areasSQL); console.log('✅ Áreas de ejemplo insertadas'); } catch (e) { console.warn('⚠️ Error insertando áreas de ejemplo:', e.message); }
      }
    } else {
      console.log('ℹ️ Áreas ya existentes — no se insertaron áreas de ejemplo');
    }

    // Usuarios de ejemplo: insertar solo si no hay usuarios
    const [usuariosCount] = await connection.query('SELECT COUNT(*) as c FROM usuarios');
    if (usuariosCount[0].c === 0) {
      const sampleDataPath = path.join(__dirname, 'sample_data.sql');
      if (fs.existsSync(sampleDataPath)) {
        const dataSQL = fs.readFileSync(sampleDataPath, 'utf8');
        try { await connection.query(dataSQL); console.log('✅ Datos de ejemplo insertados exitosamente'); } catch (e) { console.warn('⚠️ Error insertando datos de ejemplo:', e.message); }
      }
    } else {
      console.log('ℹ️ Usuarios ya existen — no se insertaron usuarios de ejemplo');
    }

    console.log('\n🎉 ¡Base de datos configurada correctamente!\n');
    
    console.log('📊 INFORMACIÓN DE LA BASE DE DATOS:');
    console.log('════════════════════════════════════');
    console.log(`📍 Servidor: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    console.log(`🗄️ Base de datos: ${process.env.DB_NAME || 'sistema_informes'}`);
    console.log(`👤 Usuario: ${process.env.DB_USER || 'root'}`);
    
    console.log('\n🔑 CREDENCIALES DE ACCESO AL SISTEMA:');
    console.log('═══════════════════════════════════════════');
    console.log('👑 ADMINISTRADOR:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
    console.log('');
    console.log('✏️ CAPTURISTAS:');
    console.log('   Usuario: marissa.gomez     | Contraseña: admin123');
    console.log('   Usuario: cecilia.davila    | Contraseña: admin123');
    console.log('   Usuario: jesus.saucedo     | Contraseña: admin123');
    console.log('   Usuario: daniel.navarrete  | Contraseña: admin123');
    console.log('   Usuario: wayne.ramirez     | Contraseña: admin123');
    console.log('   Usuario: alan.guzman       | Contraseña: admin123');
    console.log('');
    console.log('👁️ VISITANTE:');
    console.log('   Usuario: visitante         | Contraseña: admin123');
    
    console.log('\n📋 RESUMEN DE DATOS CREADOS:');
    console.log('═══════════════════════════════');
    
    // Mostrar estadísticas
    const [roles] = await connection.query('SELECT COUNT(*) as count FROM roles');
    const [areas] = await connection.query('SELECT COUNT(*) as count FROM areas');
    const [usuarios] = await connection.query('SELECT COUNT(*) as count FROM usuarios');
    const [informes] = await connection.query('SELECT COUNT(*) as count FROM informes');
    
    console.log(`🏷️ Roles creados: ${roles[0].count}`);
    console.log(`🏢 Áreas creadas: ${areas[0].count}`);
    console.log(`👥 Usuarios creados: ${usuarios[0].count}`);
    console.log(`📄 Informes de ejemplo: ${informes[0].count}`);
    
    console.log('\n🚀 SIGUIENTE PASO:');
    console.log('═══════════════════');
    console.log('Ejecuta: npm start');
    console.log('Luego visita: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 POSIBLES SOLUCIONES:');
      console.log('1. Verifica las credenciales en el archivo .env');
      console.log('2. Asegúrate de que MySQL esté ejecutándose');
      console.log('3. Verifica que el usuario tenga permisos para crear bases de datos');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 POSIBLES SOLUCIONES:');
      console.log('1. Asegúrate de que MySQL esté ejecutándose');
      console.log('2. Verifica el host y puerto en el archivo .env');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };