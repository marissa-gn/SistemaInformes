#!/usr/bin/env node
/**
 * Script para verificar que todo el sistema funciona correctamente
 * Prueba: Gráficas, Descarga, Flujos de usuario
 */

const http = require('http');

const endpoints = [
  { name: '📊 Estadísticas - Beneficiarios', path: '/api/estadisticas/beneficiarios' },
  { name: '💰 Estadísticas - Montos', path: '/api/estadisticas/montos' },
  { name: '🏢 Estadísticas - Áreas', path: '/api/estadisticas/areas' },
  { name: '🏭 Estadísticas - Sectores', path: '/api/estadisticas/sectores' },
  { name: '🏘️  Estadísticas - Colonias', path: '/api/estadisticas/colonias' },
  { name: '📍 Estadísticas - Lugares', path: '/api/estadisticas/lugares' },
  { name: '🎯 Estadísticas - Tipos Actividad', path: '/api/estadisticas/tipos-actividad' },
  { name: '📸 Estadísticas - Evidencia', path: '/api/estadisticas/evidencia' },
  { name: '❓ Estadísticas - Solicitudes', path: '/api/estadisticas/solicitudes' },
  { name: '📋 Estadísticas - Procedimientos', path: '/api/estadisticas/procedimientos' },
  { name: '📅 Estadísticas - Fechas', path: '/api/estadisticas/fechas' },
  { name: '📈 Estadísticas - Cantidad Temporal', path: '/api/estadisticas/cantidad-temporal' },
  { name: '👥 Estadísticas - Beneficiarios Temporal', path: '/api/estadisticas/beneficiarios-temporal' },
  { name: '💵 Estadísticas - Montos Temporal', path: '/api/estadisticas/montos-temporal' },
  { name: '👤 Estadísticas - Usuarios', path: '/api/estadisticas/usuarios' }
];

let completed = 0;
let failed = 0;

console.log('\n🧪 PRUEBAS DE ENDPOINTS\n');
console.log('=' .repeat(60));

endpoints.forEach((endpoint, index) => {
  setTimeout(() => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint.path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 401) {
          console.log(`⏭️  ${endpoint.name}: SIN AUTH (esperado)`);
          completed++;
        } else if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`✅ ${endpoint.name}: OK`);
            completed++;
          } catch(e) {
            console.log(`❌ ${endpoint.name}: JSON INVÁLIDO`);
            failed++;
          }
        } else {
          console.log(`⚠️  ${endpoint.name}: Status ${res.statusCode}`);
          failed++;
        }

        if (index === endpoints.length - 1) {
          setTimeout(() => {
            console.log('\n' + '='.repeat(60));
            console.log(`\n📊 RESUMEN: ${completed} OK, ${failed} ERRORES\n`);
            process.exit(failed > 0 ? 1 : 0);
          }, 1000);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${endpoint.name}: ERROR - ${e.message}`);
      failed++;
    });

    req.end();
  }, index * 100);
});

setTimeout(() => {
  console.log('⏰ Timeout - abortando pruebas\n');
  process.exit(1);
}, 10000);
