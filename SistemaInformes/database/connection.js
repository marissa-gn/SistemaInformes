const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_informes',
  port: process.env.DB_PORT || 3306,
  // Ensure UTF-8 (utf8mb4) charset so accented characters are handled correctly
  // Use the charset name (utf8mb4) rather than a collation string
  charset: process.env.DB_CHARSET || 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log('📊 Base de datos:', dbConfig.database);
    console.log('🖥️ Servidor:', dbConfig.host + ':' + dbConfig.port);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    return false;
  }
}

// Función para ejecutar queries
async function executeQuery(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('❌ Error ejecutando query:', error.message);
    throw error;
  }
}

// Función para obtener una sola fila
async function getOne(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows[0] || null;
  } catch (error) {
    console.error('❌ Error ejecutando query getOne:', error.message);
    throw error;
  }
}

// Función para insertar y obtener el ID
async function insertAndGetId(query, params = []) {
  try {
    const [result] = await pool.execute(query, params);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error ejecutando insert:', error.message);
    throw error;
  }
}

// Funciones específicas para el sistema

// Usuarios
const userQueries = {
  pool: pool,
  execute: pool.execute.bind(pool),
  
  // Obtener usuario por username
  getByUsername: async (username) => {
    const query = `
      SELECT u.*, r.nombre as rol_nombre
      FROM usuarios u 
      JOIN roles r ON u.rol_id = r.id 
      WHERE u.username = ? AND u.activo = true
    `;
    return await getOne(query, [username]);
  },

  // Obtener usuario por username o email
  getByCredentials: async (credential) => {
    const query = `
      SELECT u.*, a.nombre as area_nombre, r.nombre as rol_nombre, r.permisos
      FROM usuarios u 
      LEFT JOIN areas a ON u.area_id = a.id 
      JOIN roles r ON u.rol_id = r.id 
      WHERE (u.username = ? OR u.email = ?) AND u.activo = true
    `;
    return await getOne(query, [credential, credential]);
  },

  // Obtener todos los usuarios activos
  getAll: async () => {
    const query = `
      SELECT u.*, a.nombre as area_nombre, r.nombre as rol_nombre
      FROM usuarios u
      LEFT JOIN areas a ON u.area_id = a.id
      JOIN roles r ON u.rol_id = r.id
      WHERE u.activo = true
      ORDER BY u.id
    `;
    return await executeQuery(query);
  },

  // Crear nuevo usuario
  create: async (userData) => {
    const query = `
      INSERT INTO usuarios (username, email, password_hash, nombre, apellido, telefono, area_id, rol_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const queryWithNomina = `
      INSERT INTO usuarios (username, email, password_hash, nombre, apellido, telefono, numero_nomina, area_id, rol_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [userData.username, userData.email, userData.password_hash,
                   userData.nombre, userData.apellido, userData.telefono, userData.numero_nomina || null, userData.area_id, userData.rol_id];
    return await insertAndGetId(queryWithNomina, params);
  },

  // Obtener usuario por ID
  getById: async (id) => {
    const query = `
      SELECT u.*, a.nombre as area_nombre, r.nombre as rol_nombre
      FROM usuarios u 
      LEFT JOIN areas a ON u.area_id = a.id 
      JOIN roles r ON u.rol_id = r.id 
      WHERE u.id = ? AND u.activo = true
    `;
    return await getOne(query, [id]);
  },

  // Obtener usuario por email
  getByEmail: async (email) => {
    const query = `
      SELECT u.*, a.nombre as area_nombre, r.nombre as rol_nombre
      FROM usuarios u 
      LEFT JOIN areas a ON u.area_id = a.id 
      JOIN roles r ON u.rol_id = r.id 
      WHERE u.email = ? AND u.activo = true
    `;
    return await getOne(query, [email]);
  },

  // Actualizar usuario
  update: async (id, userData) => {
    let query = 'UPDATE usuarios SET ';
    const params = [];
    const fields = [];

    if (userData.nombre) {
      fields.push('nombre = ?');
      params.push(userData.nombre);
    }
    if (userData.apellido) {
      fields.push('apellido = ?');
      params.push(userData.apellido);
    }
    if (userData.email) {
      fields.push('email = ?');
      params.push(userData.email);
    }
    if (userData.telefono !== undefined) {
      fields.push('telefono = ?');
      params.push(userData.telefono);
    }
    if (userData.area_id !== undefined) {
      fields.push('area_id = ?');
      params.push(userData.area_id);
    }
    if (userData.rol_id !== undefined) {
      fields.push('rol_id = ?');
      params.push(userData.rol_id);
    }
    if (userData.numero_nomina !== undefined) {
      fields.push('numero_nomina = ?');
      params.push(userData.numero_nomina);
    }
    if (userData.password_hash) {
      fields.push('password_hash = ?');
      params.push(userData.password_hash);
    }

    if (fields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

  query += fields.join(', ') + ', updated_at = NOW() WHERE id = ? AND activo = true';
    params.push(id);

    const result = await executeQuery(query, params);
    return result.affectedRows > 0;
  },

  // Actualizar último login
  updateLastLogin: async (userId) => {
    const query = 'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?';
    return await executeQuery(query, [userId]);
  }
};

// Áreas
const areaQueries = {
  pool: pool,
  execute: pool.execute.bind(pool),
  
  // Obtener todas las áreas activas
  getAll: async () => {
    const query = 'SELECT * FROM areas WHERE (activa = 1 OR activa IS NULL) ORDER BY nombre';
    return await executeQuery(query);
  },

  // Crear nueva área
  create: async (areaData) => {
    const query = `
      INSERT INTO areas (nombre, descripcion)
      VALUES (?, ?)
    `;
    const params = [areaData.nombre, areaData.descripcion || ''];
    return await insertAndGetId(query, params);
  },

  // Actualizar área
  update: async (areaId, areaData) => {
    const query = `
      UPDATE areas 
      SET nombre = ?, descripcion = ?, updated_at = NOW()
      WHERE id = ? AND activa = true
    `;
    const params = [areaData.nombre, areaData.descripcion || '', areaId];
    return await executeQuery(query, params);
  },

  // Eliminar área (marcar como inactiva)
  delete: async (areaId) => {
    const query = 'UPDATE areas SET activa = false WHERE id = ?';
    return await executeQuery(query, [areaId]);
  }
};

// Informes
const informeQueries = {
  pool: pool,
  execute: pool.execute.bind(pool),
  
  // Obtener todos los informes con información relacionada
  getAll: async () => {
    const query = `
      SELECT i.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido,
             a.nombre as area_nombre, ap.nombre as aprobado_por_nombre
      FROM informes i
      JOIN usuarios u ON i.usuario_id = u.id AND u.activo = true
      JOIN areas a ON i.area_id = a.id AND a.activa = true
      LEFT JOIN usuarios ap ON i.aprobado_por = ap.id
      WHERE i.estado IN ('enviado', 'aprobado', 'rechazado')
      ORDER BY i.fecha_creacion DESC
    `;
    return await executeQuery(query);
  },

  // Obtener informes por usuario
  getByUser: async (userId) => {
    const query = `
      SELECT i.*, 
             u.nombre as usuario_nombre, 
             u.apellido as usuario_apellido,
             a.nombre as area_nombre,
             ap.nombre as aprobado_por_nombre
      FROM informes i
      JOIN usuarios u ON i.usuario_id = u.id AND u.activo = true
      JOIN areas a ON i.area_id = a.id AND a.activa = true
      LEFT JOIN usuarios ap ON i.aprobado_por = ap.id
      WHERE i.usuario_id = ?
      ORDER BY i.fecha_creacion DESC
    `;
    return await executeQuery(query, [userId]);
  },

  // Crear nuevo informe
  create: async (informeData) => {
    const query = `
      INSERT INTO informes (
        usuario_id, area_id, nombre_director, fecha_actividad, lugar_actividad, 
        colonia_comunidad, tipo_actividad, cantidad, descripcion_actividad, 
        sector_beneficia, numero_beneficiarios, monto_generado, 
        pertenece_procedimientos_area, responde_solicitud_ciudadania, 
        evidencia_fotografica, observaciones, estado, objetivos, resultados
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      informeData.usuario_id, 
      informeData.area_id, 
      informeData.nombre_director || null,
      informeData.fecha_actividad || null, 
      informeData.lugar_actividad || null, 
      informeData.colonia_comunidad || null,
      informeData.tipo_actividad || null,
      informeData.cantidad ? parseInt(informeData.cantidad) : null,
      informeData.descripcion_actividad || null,
      informeData.sector_beneficia || null,
      informeData.numero_beneficiarios ? parseInt(informeData.numero_beneficiarios) : null,
      informeData.monto_generado ? parseFloat(informeData.monto_generado) : null,
      informeData.pertenece_procedimientos_area !== undefined ? informeData.pertenece_procedimientos_area : null,
      informeData.responde_solicitud_ciudadania !== undefined ? informeData.responde_solicitud_ciudadania : null,
      informeData.evidencia_fotografica || null,
      informeData.observaciones || null,
      informeData.estado || 'borrador',
      informeData.objetivos || null,
      informeData.resultados || null
    ];
    return await insertAndGetId(query, params);
  },

  // Actualizar estado del informe
  updateStatus: async (informeId, estado, aprobadoPor = null, comentarios = null) => {
    const query = `
      UPDATE informes 
      SET estado = ?, aprobado_por = ?, comentarios_revision = ?, fecha_aprobacion = ?
      WHERE id = ?
    `;
    const fechaAprobacion = (estado === 'aprobado') ? new Date() : null;
    return await executeQuery(query, [estado, aprobadoPor, comentarios, fechaAprobacion, informeId]);
  }
};

// Logs de actividad
const logQueries = {
  // Registrar actividad
  log: async (logData) => {
    const query = `
      INSERT INTO activity_logs (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      logData.usuario_id, logData.accion, logData.tabla_afectada, logData.registro_id,
      JSON.stringify(logData.datos_anteriores), JSON.stringify(logData.datos_nuevos),
      logData.ip_address, logData.user_agent
    ];
    return await insertAndGetId(query, params);
  }
};

module.exports = {
  pool,
  testConnection,
  executeQuery,
  getOne,
  insertAndGetId,
  userQueries,
  areaQueries,
  informeQueries,
  logQueries
};