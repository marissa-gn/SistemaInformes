#!/usr/bin/env node

/**
 * Script de prueba para verificar que todos los endpoints de estadísticas funcionan
 * Uso: node test-endpoints.js
 */

const http = require('http');

// Datos de prueba - Ajusta según tus credenciales
const TEST_COOKIE = 'connect.sid=tu_session_id_aqui'; // Necesitarás una sesión válida

// Lista de endpoints a probar
const ENDPOINTS = [
  '/api/estadisticas/beneficiarios',
  '/api/estadisticas/montos',
  '/api/estadisticas/areas',
  '/api/estadisticas/sectores',
  '/api/estadisticas/colonias',
  '/api/estadisticas/lugares',
  '/api/estadisticas/tipos-actividad',
  '/api/estadisticas/evidencia',
  '/api/estadisticas/solicitudes',
  '/api/estadisticas/procedimientos',
  '/api/estadisticas/fechas'
];

/**
 * Función para hacer requests HTTP
 */
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': TEST_COOKIE
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            endpoint,
            status: res.statusCode,
            success: json.success,
            dataCount: Array.isArray(json.data) ? json.data.length : (json.data ? 1 : 0),
            response: json
          });
        } catch (e) {
          reject({ endpoint, error: 'Invalid JSON response', data });
        }
      });
    });

    req.on('error', (e) => {
      reject({ endpoint, error: e.message });
    });

    req.end();
  });
}

/**
 * Ejecutar pruebas
 */
async function runTests() {
  console.log('🧪 Iniciando pruebas de endpoints de estadísticas...\n');

  const results = [];

  for (const endpoint of ENDPOINTS) {
    try {
      const result = await makeRequest(endpoint);
      results.push(result);
      console.log(`✅ ${endpoint}`);
      console.log(`   Status: ${result.status} | Success: ${result.success} | Data items: ${result.dataCount}`);
    } catch (error) {
      console.log(`❌ ${error.endpoint}`);
      console.log(`   Error: ${error.error}`);
      results.push({ endpoint: error.endpoint, error: error.error, status: 0 });
    }
  }

  // Resumen
  console.log('\n📊 RESUMEN DE PRUEBAS\n');
  const success = results.filter(r => r.status === 200).length;
  const failed = results.filter(r => r.status !== 200).length;
  
  console.log(`✅ Exitosas: ${success}/${ENDPOINTS.length}`);
  console.log(`❌ Fallidas: ${failed}/${ENDPOINTS.length}`);

  if (failed === 0) {
    console.log('\n🎉 ¡Todos los endpoints funcionan correctamente!');
  } else {
    console.log('\n⚠️  Algunos endpoints tuvieron problemas.');
  }
}

runTests().catch(console.error);
