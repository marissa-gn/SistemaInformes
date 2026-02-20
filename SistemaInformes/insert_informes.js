const mysql = require('mysql2/promise');
require('dotenv').config();

const tiposActividad = [
  'Capacitación', 'Reunión', 'Evento comunitario', 'Mantenimiento',
  'Inspección', 'Asesoría', 'Taller', 'Seminario', 'Conferencia',
  'Jornada sanitaria', 'Limpieza comunitaria', 'Gestión administrativa'
];

const sectores = [
  'Educación', 'Salud', 'Infraestructura', 'Servicios sociales',
  'Medio ambiente', 'Deporte', 'Cultura', 'Empleo', 'Seguridad',
  'Vivienda', 'Transporte', 'Tecnología'
];

const lugares = [
  'Palacio Municipal', 'Centro de Salud', 'Escuela Primaria',
  'Parque central', 'Mercado municipal', 'Biblioteca pública',
  'Centro comunitario', 'Plaza principal', 'Terminal de autobuses',
  'Instituto técnico', 'Auditorio municipal', 'Estadio deportivo'
];

const colonias = [
  'Centro histórico', 'Zona norte', 'Zona sur', 'Zona este',
  'Zona oeste', 'Barrio antiguo', 'Residencial', 'Comercial',
  'Industrial', 'Rural', 'Periférica', 'Nueva desarrollo'
];

const descripcionesBase = [
  'Se realizó una jornada de conciencia ciudadana sobre los derechos municipales.',
  'Taller teórico-práctico para mejorar las habilidades laborales de los beneficiarios.',
  'Evento de integración comunitaria con participación de diferentes sectores.',
  'Programa de capacitación dirigido a jóvenes y adultos del municipio.',
  'Actividad de prevención y promoción de la salud en la comunidad.',
  'Inspección y evaluación de instalaciones municipales.',
  'Asesoría técnica en temas de desarrollo económico y emprendimiento.',
  'Jornada de limpieza y embellecimiento de espacios públicos.',
  'Charla informativa sobre trámites y servicios municipales.',
  'Taller de fortalecimiento de capacidades para organizaciones comunitarias.'
];

const observacionesBase = [
  'Actividad ejecutada satisfactoriamente con buena participación.',
  'Se logró cumplir con todos los objetivos planteados.',
  'Excelente respuesta de la comunidad, se recomienda repetir.',
  'Actividad importante para el desarrollo local.',
  'Requiere seguimiento para evaluar impacto.',
  'Muy positivo el resultado, comunidad comprometida.',
  'Se logró identificar necesidades adicionales de la población.',
  'Evento exitoso, superó expectativas de participación.'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(daysAgo = 180) {
  const today = new Date();
  const pastDate = new Date(today.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return pastDate.toISOString().split('T')[0];
}

async function loadData(connection) {
  const [usuarios] = await connection.query(
    'SELECT id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE nombre = "capturista") LIMIT 20'
  );
  
  const [areas] = await connection.query('SELECT id FROM areas');
  
  const [admins] = await connection.query(
    'SELECT id FROM usuarios WHERE rol_id = (SELECT id FROM roles WHERE nombre = "administrador") LIMIT 5'
  );

  return {
    capturistas: usuarios.map(u => u.id),
    areas: areas.map(a => a.id),
    admins: admins.map(a => a.id)
  };
}

async function insertInformes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'si_user',
    password: process.env.DB_PASSWORD || 'si_password',
    database: process.env.DB_NAME || 'sistema_informes'
  });

  try {
    console.log('📊 Cargando datos de la base de datos...');
    const data = await loadData(connection);
    
    console.log(`✅ Capturistas encontrados: ${data.capturistas.length}`);
    console.log(`✅ Áreas encontradas: ${data.areas.length}`);
    console.log(`✅ Administradores encontrados: ${data.admins.length}\n`);

    console.log('📝 Generando 50 informes...\n');

    const estados = ['borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado'];
    const informes = [];

    for (let i = 0; i < 50; i++) {
      const estado = getRandomElement(estados);
      const usuarioId = getRandomElement(data.capturistas);
      const areaId = getRandomElement(data.areas);
      const fechaActividad = getRandomDate();
      const fechaCreacionDate = new Date(new Date(fechaActividad).getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      const fechaCreacion = fechaCreacionDate.toISOString().slice(0, 19).replace('T', ' ');
      
      let aprobadoPor = null;
      let fechaAprobacion = null;
      
      if (estado === 'aprobado' || estado === 'rechazado') {
        aprobadoPor = getRandomElement(data.admins);
        const fechaAprobacionDate = new Date(fechaCreacionDate.getTime() + getRandomBetween(1, 10) * 24 * 60 * 60 * 1000);
        fechaAprobacion = fechaAprobacionDate.toISOString().slice(0, 19).replace('T', ' ');
      }

      const informe = {
        usuario_id: usuarioId,
        area_id: areaId,
        fecha_actividad: fechaActividad,
        nombre_director: `Director_${i}`,
        lugar_actividad: getRandomElement(lugares),
        colonia_comunidad: getRandomElement(colonias),
        tipo_actividad: getRandomElement(tiposActividad),
        cantidad: getRandomBetween(1, 50),
        descripcion_actividad: getRandomElement(descripcionesBase),
        sector_beneficia: getRandomElement(sectores),
        numero_beneficiarios: getRandomBetween(10, 500),
        monto_generado: getRandomBetween(0, 100000) * 0.01,
        pertenece_procedimientos_area: getRandomBetween(0, 1),
        responde_solicitud_ciudadania: getRandomBetween(0, 1),
        evidencia_fotografica: `/uploads/evidence_${i}.jpg`,
        observaciones: getRandomElement(observacionesBase),
        estado: estado,
        comentarios_revision: (estado === 'rechazado' || estado === 'aprobado') ? `Evaluado el ${new Date().toLocaleDateString()} - ${getRandomElement(['Cumple requisitos', 'Necesita ajustes', 'Excelente ejecución'])}` : null,
        aprobado_por: aprobadoPor,
        fecha_aprobacion: fechaAprobacion,
        fecha_creacion: fechaCreacion
      };
      
      informes.push(informe);
    }

    // Insertar informes
    let contador = 0;
    for (const informe of informes) {
      const query = `
        INSERT INTO informes 
        (usuario_id, area_id, fecha_actividad, nombre_director, lugar_actividad, colonia_comunidad,
         tipo_actividad, cantidad, descripcion_actividad, sector_beneficia, numero_beneficiarios,
         monto_generado, pertenece_procedimientos_area, responde_solicitud_ciudadania,
         evidencia_fotografica, observaciones, estado, comentarios_revision, aprobado_por,
         fecha_aprobacion, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(query, [
        informe.usuario_id,
        informe.area_id,
        informe.fecha_actividad,
        informe.nombre_director,
        informe.lugar_actividad,
        informe.colonia_comunidad,
        informe.tipo_actividad,
        informe.cantidad,
        informe.descripcion_actividad,
        informe.sector_beneficia,
        informe.numero_beneficiarios,
        informe.monto_generado,
        informe.pertenece_procedimientos_area,
        informe.responde_solicitud_ciudadania,
        informe.evidencia_fotografica,
        informe.observaciones,
        informe.estado,
        informe.comentarios_revision,
        informe.aprobado_por,
        informe.fecha_aprobacion,
        informe.fecha_creacion
      ]);

      contador++;
      process.stdout.write(`\r✅ Informes insertados: ${contador}/50`);
    }

    console.log('\n\n✅ ¡EXITO! Se insertaron 50 informes\n');

    // Mostrar resumen
    const [borrador] = await connection.query('SELECT COUNT(*) as count FROM informes WHERE estado = "borrador"');
    const [enviado] = await connection.query('SELECT COUNT(*) as count FROM informes WHERE estado = "enviado"');
    const [enRevision] = await connection.query('SELECT COUNT(*) as count FROM informes WHERE estado = "en_revision"');
    const [aprobado] = await connection.query('SELECT COUNT(*) as count FROM informes WHERE estado = "aprobado"');
    const [rechazado] = await connection.query('SELECT COUNT(*) as count FROM informes WHERE estado = "rechazado"');
    const [informesTotal] = await connection.query('SELECT COUNT(*) as count FROM informes');

    console.log('═'.repeat(60));
    console.log('📊 RESUMEN DE INFORMES GENERADOS');
    console.log('═'.repeat(60));
    console.log(`📝 Total informes: ${informesTotal[0].count}`);
    console.log(`📄 Borradores: ${borrador[0].count}`);
    console.log(`📮 Enviados: ${enviado[0].count}`);
    console.log(`🔍 En revisión: ${enRevision[0].count}`);
    console.log(`✅ Aprobados: ${aprobado[0].count}`);
    console.log(`❌ Rechazados: ${rechazado[0].count}`);
    
    // Estadísticas de tablas relacionadas
    const [usuariosTotal] = await connection.query('SELECT COUNT(*) as count FROM usuarios');
    const [areasTotal] = await connection.query('SELECT COUNT(*) as count FROM areas');
    const [rolesTotal] = await connection.query('SELECT COUNT(*) as count FROM roles');
    
    console.log('\n📊 ESTADÍSTICAS POR TABLA:');
    console.log('─'.repeat(60));
    console.log(`👥 Total usuarios: ${usuariosTotal[0].count}`);
    console.log(`🏢 Total áreas: ${areasTotal[0].count}`);
    console.log(`🏷️ Total roles: ${rolesTotal[0].count}`);
    console.log(`📄 Total informes: ${informesTotal[0].count}`);
    console.log('═'.repeat(60));
    console.log('\n🎉 ¡BASE DE DATOS COMPLETAMENTE POBLADA!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

insertInformes();
