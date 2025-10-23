#!/usr/bin/env node

/**
 * Script principal de build para Sistema de Informes
 * Ejecuta todo el proceso de construcción
 */

const { exec } = require('child_process');
const path = require('path');

const scripts = [
  'build:clean',
  'build:css', 
  'build:js',
  'build:assets'
];

async function runScript(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 Ejecutando: npm run ${script}`);
    
    exec(`npm run ${script}`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error en ${script}:`, error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️ Advertencia en ${script}:`, stderr);
      }
      
      console.log(stdout);
      resolve();
    });
  });
}

async function build() {
  console.log('🚀 Iniciando proceso de build del Sistema de Informes...');
  console.log('📦 Proyecto: Node.js + Express + EJS + MySQL');
  
  try {
    for (const script of scripts) {
      await runScript(script);
    }
    
    console.log('\n✅ ¡Build completado exitosamente!');
    console.log('📁 Archivos optimizados disponibles en: ./dist/');
    console.log('🎯 Para ejecutar en producción: npm run build:prod');
    
  } catch (error) {
    console.error('\n❌ Build falló:', error.message);
    process.exit(1);
  }
}

build();