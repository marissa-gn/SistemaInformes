const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistema_informes',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true,
  charset: 'utf8mb4'
};

const passwordPlano = 'PelussaGN2';

const areas = [
  {
    nombre: 'Servicios públicos',
    descripcion: 'Limpia y recolección de basura, panteones, parques, jardines, alumbrado público y rastro municipal.',
    responsable: 'Raúl Mendoza',
    telefono: '7225550101',
    email: 'servicios.publicos@atlacomulco.gob.mx'
  },
  {
    nombre: 'Trámites y documentos',
    descripcion: 'Constancias de identidad y vecindad, Cartilla Militar, licencias de funcionamiento, licencias de construcción, uso de suelo y actas del Registro Civil.',
    responsable: 'Mariana López',
    telefono: '7225550102',
    email: 'tramites.documentos@atlacomulco.gob.mx'
  },
  {
    nombre: 'Desarrollo económico',
    descripcion: 'Impulso a pequeñas y medianas empresas, bolsa de trabajo y atención a la salud.',
    responsable: 'Alejandro Vargas',
    telefono: '7225550103',
    email: 'desarrollo.economico@atlacomulco.gob.mx'
  },
  {
    nombre: 'Seguridad y Protección Civil',
    descripcion: 'Comisaría municipal, inspección de medidas de seguridad, protección civil y bomberos.',
    responsable: 'Gabriela Torres',
    telefono: '7225550104',
    email: 'seguridad.proteccioncivil@atlacomulco.gob.mx'
  },
  {
    nombre: 'Tesorería y Catastro',
    descripcion: 'Gestión financiera, trámites de catastro y pago de predial en línea.',
    responsable: 'Javier Ruiz',
    telefono: '7225550105',
    email: 'tesoreria.catastro@atlacomulco.gob.mx'
  },
  {
    nombre: 'Cultura y turismo',
    descripcion: 'Gestión de museos como el Museo Histórico de Atlacomulco, Casa de tierra y promoción turística.',
    responsable: 'Fernanda Ortega',
    telefono: '7225550106',
    email: 'cultura.turismo@atlacomulco.gob.mx'
  },
  {
    nombre: 'Atención ciudadana',
    descripcion: 'Coordinación para recibir solicitudes ciudadanas y el Archivo municipal.',
    responsable: 'Valeria Castillo',
    telefono: '7225550107',
    email: 'atencion.ciudadana@atlacomulco.gob.mx'
  },
  {
    nombre: 'Tecnologías de la información',
    descripcion: 'Soporte tecnológico, infraestructura digital y desarrollo de sistemas internos.',
    responsable: 'Emiliano Guzmán',
    telefono: '7225550108',
    email: 'tecnologias.informacion@atlacomulco.gob.mx'
  }
];

const nombres = [
  'Sofía', 'Alejandro', 'Valentina', 'Mateo', 'Isabella', 'Santiago', 'Camila', 'Leonardo',
  'Valeria', 'Matías', 'Ximena', 'Emiliano', 'Luciana', 'Daniel', 'Mariana', 'Joaquín',
  'Victoria', 'Nicolás', 'Daniela', 'Sebastian', 'Fernanda', 'Miguel', 'Natalia', 'Ángel',
  'Andrea', 'Diego', 'Gabriela', 'David'
];

const apellidosPaterno = [
  'Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez',
  'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez',
  'Torres', 'Díaz', 'Gutiérrez', 'Ruiz', 'Mendoza', 'Aguilar', 'Ortiz', 'Moreno',
  'Castillo', 'Romero', 'Álvarez', 'Méndez'
];

const apellidosMaterno = [
  'Chávez', 'Rivera', 'Juárez', 'Ramos', 'Domínguez', 'Herrera', 'Medina', 'Castro',
  'Vargas', 'Guzmán', 'Velázquez', 'Muñoz', 'Rojas', 'De la Cruz', 'Contreras', 'Salazar',
  'Luna', 'Ortega', 'Santiago', 'Guerrero', 'Estrada', 'Bautista', 'Cortés', 'Lara',
  'León', 'Márquez', 'Rangel', 'Cárdenas'
];

const sectores = [
  'Familias', 'Comerciantes', 'Estudiantes', 'Adultos mayores', 'Emprendedores', 'Vecinos',
  'Deportistas', 'Productores', 'Jóvenes', 'Madres de familia'
];

const lugares = [
  'Plaza Central', 'Casa de Cultura', 'Centro Comunitario', 'Parque Municipal', 'Auditorio Local',
  'Unidad Deportiva', 'Mercado Municipal', 'Biblioteca Pública', 'Oficina de Atención', 'Delegación Municipal'
];

const tiposActividad = [
  'Jornada', 'Capacitación', 'Mantenimiento', 'Taller', 'Campaña', 'Conferencia', 'Reunión',
  'Entrega de apoyos', 'Limpieza', 'Asesoría'
];

const colonias = [
  'Centro', 'Las Flores', 'San Juan', 'La Esperanza', 'El Calvario', 'San Antonio', 'Vista Hermosa',
  'Hidalgo', 'La Purísima', 'Buenavista', 'La Cruz', 'San Isidro'
];

const descripciones = [
  'Se realizó la actividad programada con participación ciudadana y seguimiento puntual.',
  'La acción se desarrolló sin incidencias y con cobertura total de la zona asignada.',
  'Se atendieron solicitudes ciudadanas y se entregó apoyo conforme al plan operativo.',
  'La jornada permitió reforzar la atención a vecinos y mejorar la cobertura del servicio.',
  'Se ejecutó la actividad con evidencia fotográfica, registro completo y objetivos cumplidos.'
];

const observaciones = [
  'Se recomienda dar seguimiento trimestral.',
  'Actividad concluida satisfactoriamente.',
  'Favor de continuar con acciones preventivas.',
  'La ciudadanía mostró buena participación.',
  'No se presentaron incidentes relevantes.'
];

function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function fechaDesdeBase(dias) {
  const fecha = new Date('2026-01-01T10:00:00Z');
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

function fechaHoraDesdeBase(dias) {
  const fecha = new Date('2026-01-01T10:00:00Z');
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  fecha.setUTCHours(10 + (dias % 8), 15, 0, 0);
  return fecha.toISOString().replace('T', ' ').slice(0, 19);
}

function crearUsuariosBase() {
  const generated = [];
  const usedUsernames = new Set(['mayte.navor', 'marissa.gomez']);

  for (let i = 0; i < 28; i += 1) {
    const nombre = nombres[i];
    const paterno = apellidosPaterno[i];
    const materno = apellidosMaterno[i];
    let usernameBase = `${slugify(nombre)}.${slugify(paterno)}`;
    let username = usernameBase;
    let suffix = 2;

    while (usedUsernames.has(username)) {
      username = `${usernameBase}${suffix}`;
      suffix += 1;
    }
    usedUsernames.add(username);

    generated.push({
      username,
      email: `${username}@atlacomulco.gob.mx`,
      nombre,
      apellido: `${paterno} ${materno}`,
      numero_nomina: `CAP${String(i + 1).padStart(3, '0')}`,
      telefono: `722${String(5551000 + i).padStart(7, '0')}`,
      areaIndex: i % areas.length,
      rol: 'capturista'
    });
  }

  return [
    {
      username: 'mayte.navor',
      email: 'mayte.navor@atlacomulco.gob.mx',
      nombre: 'Mayte',
      apellido: 'Navor',
      numero_nomina: 'CAP029',
      telefono: '7225550007',
      areaIndex: 7,
      rol: 'capturista'
    },
    {
      username: 'marissa.gomez',
      email: 'marissa.gomez@atlacomulco.gob.mx',
      nombre: 'Marissa',
      apellido: 'Gómez Navor',
      numero_nomina: 'ADM001',
      telefono: '7225550001',
      areaIndex: 6,
      rol: 'administrador'
    },
    ...generated
  ];
}

function crearInformes(users, areaIdMap, userIdMap, adminId) {
  const capturistas = users.filter(user => user.rol === 'capturista');
  const reportes = [];
  const estados = ['aprobado', 'rechazado', 'aprobado'];

  capturistas.forEach((user, userIndex) => {
    const userId = userIdMap.get(user.username);
    const areaId = areaIdMap.get(areas[user.areaIndex].nombre);

    for (let i = 0; i < 3; i += 1) {
      const baseIndex = userIndex * 3 + i;
      const estado = estados[i % estados.length];
      const fechaActividad = fechaDesdeBase(baseIndex + 1);
      const fechaCreacion = fechaHoraDesdeBase(baseIndex + 1);
      const fechaAprobacion = fechaHoraDesdeBase(baseIndex + 2);
      const montoGenerado = Number((1250 + (baseIndex * 137) + (i * 85)).toFixed(2));
      const montoInvertido = Number((montoGenerado * 0.62).toFixed(2));

      reportes.push({
        usuario_id: userId,
        area_id: areaId,
        fecha_actividad: fechaActividad,
        nombre_director: `${nombres[(userIndex + i) % nombres.length]} ${apellidosPaterno[(userIndex + i) % apellidosPaterno.length]} ${apellidosMaterno[(userIndex + i) % apellidosMaterno.length]}`,
        lugar_actividad: `${lugares[(userIndex + i) % lugares.length]} - ${areas[user.areaIndex].nombre}`,
        colonia_comunidad: colonias[(userIndex + i) % colonias.length],
        tipo_actividad: tiposActividad[(userIndex + i) % tiposActividad.length],
        cantidad: 18 + userIndex + i,
        descripcion_actividad: `${descripciones[(userIndex + i) % descripciones.length]} Área: ${areas[user.areaIndex].nombre}.`,
        sector_beneficia: sectores[(userIndex + i) % sectores.length],
        numero_beneficiarios: 25 + (userIndex * 3) + i,
        monto_generado: montoGenerado,
        monto_invertido: montoInvertido,
        pertenece_procedimientos_area: (userIndex + i) % 2 === 0 ? 1 : 0,
        responde_solicitud_ciudadania: (userIndex + i) % 3 !== 0 ? 1 : 0,
        evidencia_fotografica: i % 2 === 0 ? '/Img/Usuario.jpg' : '/Img/Admin.jpg',
        observaciones: `${observaciones[(userIndex + i) % observaciones.length]} Registro generado para ${user.nombre}.`,
        fecha_creacion: fechaCreacion,
        estado,
        comentarios_revision: estado === 'rechazado'
          ? 'Se requiere una revisión adicional antes de su aprobación.'
          : 'Informe aprobado correctamente y sin observaciones relevantes.',
        aprobado_por: adminId,
        fecha_aprobacion: fechaAprobacion
      });
    }
  });

  return reportes;
}

async function main() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL');

    await connection.query('CREATE DATABASE IF NOT EXISTS sistema_informes');
    await connection.query('USE sistema_informes');

    try {
      await connection.query('ALTER TABLE informes ADD COLUMN monto_invertido DECIMAL(12,2) DEFAULT 0.00 AFTER monto_generado');
      console.log('✅ Columna monto_invertido agregada');
    } catch (error) {
      if (!String(error.message).toLowerCase().includes('duplicate column')) {
        throw error;
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE activity_logs');
    await connection.query('TRUNCATE TABLE sesiones');
    await connection.query('TRUNCATE TABLE informes');
    await connection.query('TRUNCATE TABLE usuarios');
    await connection.query('TRUNCATE TABLE areas');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    await connection.query(
      `INSERT INTO roles (nombre, descripcion, permisos)
       VALUES
         ('administrador', 'Acceso completo', NULL),
         ('capturista', 'Puede capturar informes', NULL),
         ('visitante', 'Acceso limitado', NULL)
       ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)`
    );

    const [rolesRows] = await connection.query('SELECT id, nombre FROM roles');
    const roleIdMap = new Map(rolesRows.map(row => [row.nombre, row.id]));
    const passwordHash = await bcrypt.hash(passwordPlano, 10);

    const areaIdMap = new Map();
    for (const area of areas) {
      const [result] = await connection.query(
        'INSERT INTO areas (nombre, descripcion, responsable, telefono, email, activa) VALUES (?, ?, ?, ?, ?, 1)',
        [area.nombre, area.descripcion, area.responsable, area.telefono, area.email]
      );
      areaIdMap.set(area.nombre, result.insertId);
    }

    const users = crearUsuariosBase();
    const userIdMap = new Map();

    for (const user of users) {
      const areaId = areaIdMap.get(areas[user.areaIndex].nombre);
      const roleId = roleIdMap.get(user.rol);
      const [result] = await connection.query(
        `INSERT INTO usuarios (username, email, password_hash, nombre, apellido, telefono, numero_nomina, area_id, rol_id, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [user.username, user.email, passwordHash, user.nombre, user.apellido, user.telefono, user.numero_nomina, areaId, roleId]
      );
      userIdMap.set(user.username, result.insertId);
    }

    const adminId = userIdMap.get('marissa.gomez');
    const reportes = crearInformes(users, areaIdMap, userIdMap, adminId);

    for (const reporte of reportes) {
      await connection.query(
        `INSERT INTO informes (
          usuario_id, area_id, fecha_actividad, nombre_director, lugar_actividad, colonia_comunidad,
          tipo_actividad, cantidad, descripcion_actividad, sector_beneficia, numero_beneficiarios,
          monto_generado, monto_invertido, pertenece_procedimientos_area, responde_solicitud_ciudadania,
          evidencia_fotografica, observaciones, fecha_creacion, estado, comentarios_revision,
          aprobado_por, fecha_aprobacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reporte.usuario_id,
          reporte.area_id,
          reporte.fecha_actividad,
          reporte.nombre_director,
          reporte.lugar_actividad,
          reporte.colonia_comunidad,
          reporte.tipo_actividad,
          reporte.cantidad,
          reporte.descripcion_actividad,
          reporte.sector_beneficia,
          reporte.numero_beneficiarios,
          reporte.monto_generado,
          reporte.monto_invertido,
          reporte.pertenece_procedimientos_area,
          reporte.responde_solicitud_ciudadania,
          reporte.evidencia_fotografica,
          reporte.observaciones,
          reporte.fecha_creacion,
          reporte.estado,
          reporte.comentarios_revision,
          reporte.aprobado_por,
          reporte.fecha_aprobacion
        ]
      );
    }

    const [usuariosCount] = await connection.query('SELECT COUNT(*) AS total FROM usuarios');
    const [informesCount] = await connection.query('SELECT COUNT(*) AS total FROM informes');
    const [areasCount] = await connection.query('SELECT COUNT(*) AS total FROM areas');

    console.log('🎉 Reseteo completo terminado');
    console.log(`👥 Usuarios: ${usuariosCount[0].total}`);
    console.log(`🏢 Áreas: ${areasCount[0].total}`);
    console.log(`📄 Informes: ${informesCount[0].total}`);
    console.log('🔑 Usuario especial preservado: mayte.navor / PelussaGN2');
    console.log('🔑 Usuario administrador creado: marissa.gomez / PelussaGN2');
  } catch (error) {
    console.error('❌ Error en el reseed completo:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();