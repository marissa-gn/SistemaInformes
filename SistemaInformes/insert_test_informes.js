const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'si_user',
  password: 'si_password',
  database: 'sistema_informes'
});

const capturistas = [
  { id: 2, nombre: 'Emanuel Hugo Gómez Navor' },
  { id: 3, nombre: 'Cecilia Dávila Solís' },
  { id: 18, nombre: 'Cecilia Dávila Solís' },
  { id: 19, nombre: 'Emanuel Hugo Gómez Navor' },
  { id: 21, nombre: 'Verónica Navor Bartolo' },
  { id: 22, nombre: 'Francisco Daniel Navarrete Castro' },
  { id: 23, nombre: 'Mario Alberto Canana Reyes' }
];

const estados = ['borrador', 'enviado', 'aprobado', 'rechazado'];
const areas = [1, 2, 3, 4, 5]; // Assuming these area IDs exist
const lugares = [
  'Centro Comunitario',
  'Escuela Primaria',
  'Biblioteca Municipal',
  'Parque Central',
  'Auditorio Regional'
];
const descripciones = [
  'Taller de capacitación para jóvenes',
  'Programa educativo comunitario',
  'Actividad de sensibilización',
  'Evento de promoción cultural',
  'Reunión de coordinación interinstitucional'
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('🔄 Iniciando creación de test informes...\n');

    let contador = 0;

    // For each capturista, create 2 informes
    for (const capturista of capturistas) {
      for (let i = 0; i < 2; i++) {
        const fecha = getRandomDate();
        const estado = getRandomElement(estados);
        const area = getRandomElement(areas);
        const lugar = getRandomElement(lugares);
        const descripcion = getRandomElement(descripciones);
        const beneficiarios = getRandomInt(10, 100);
        const monto = getRandomInt(1000, 50000);
        
        // Only add comments if estado is aprobado or rechazado
        let comentarios = null;
        let aprobadoPor = null;
        if (estado === 'aprobado') {
          comentarios = 'Informe aprobado. Todas las actividades cumplen con los requisitos.';
          aprobadoPor = 1; // Admin user
        } else if (estado === 'rechazado') {
          comentarios = 'Informe rechazado. Requiere más información sobre beneficiarios.';
          aprobadoPor = 1;
        }

        const sql = `
          INSERT INTO informes (
            usuario_id, area_id, nombre_director, lugar_actividad, 
            descripcion_actividad, numero_beneficiarios, monto_generado, 
            estado, observaciones, comentarios_revision, aprobado_por, 
            fecha_creacion, fecha_actualizacion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          capturista.id,
          area,
          capturista.nombre,
          lugar,
          descripcion,
          beneficiarios,
          monto,
          estado,
          'Observaciones generales del informe',
          comentarios,
          aprobadoPor,
          formatDate(fecha),
          formatDate(new Date())
        ];

        await conn.execute(sql, params);
        contador++;
        console.log(`✅ Creado informe ${contador} para ${capturista.nombre} (ID: ${capturista.id}) - Estado: ${estado}`);
      }
    }

    console.log(`\n🎉 Total: ${contador} informes creados exitosamente`);
    conn.release();
    pool.end();
  } catch(e) { 
    console.error('❌ Error:', e.message); 
  }
})();
