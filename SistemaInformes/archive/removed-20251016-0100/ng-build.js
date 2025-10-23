#!/usr/bin/env node

/**
 * BUILD SCRIPT - Equivalente a "ng build" para Sistema de Informes
 * Sistema: Node.js + Express + EJS + MySQL
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

// Configuración del build
const config = {
  projectName: 'Sistema de Informes',
  version: '1.0.0',
  framework: 'Node.js + Express + EJS',
  buildTime: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
};

function showBanner() {
  console.log('\n'.repeat(2));
  console.log('🚀'.repeat(50));
  console.log(`🏗️  BUILD SYSTEM - ${config.projectName}`);
  console.log(`📦  Framework: ${config.framework}`);
  console.log(`🔢  Versión: ${config.version}`);
  console.log(`🌍  Ambiente: ${config.environment}`);
  console.log(`⏰  Tiempo: ${new Date().toLocaleString()}`);
  console.log('🚀'.repeat(50));
  console.log('\n');
}

async function generateBuildManifest() {
  const distDir = path.join(__dirname, '..', 'dist');
  const manifest = {
    ...config,
    files: {
      css: [],
      js: [],
      images: [],
      total: 0
    }
  };

  try {
    // Contar archivos CSS
    const cssDir = path.join(distDir, 'public', 'css');
    if (await fs.pathExists(cssDir)) {
      const cssFiles = await fs.readdir(cssDir);
      manifest.files.css = cssFiles.filter(f => f.endsWith('.css'));
    }

    // Contar archivos JS
    const jsDir = path.join(distDir, 'public', 'js');
    if (await fs.pathExists(jsDir)) {
      const jsFiles = await fs.readdir(jsDir);
      manifest.files.js = jsFiles.filter(f => f.endsWith('.js'));
    }

    // Contar imágenes
    const imgDir = path.join(distDir, 'public', 'Img');
    if (await fs.pathExists(imgDir)) {
      const imgFiles = await fs.readdir(imgDir);
      manifest.files.images = imgFiles;
    }

    manifest.files.total = manifest.files.css.length + manifest.files.js.length + manifest.files.images.length;

    await fs.writeFile(
      path.join(distDir, 'build-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    return manifest;
  } catch (error) {
    console.warn('⚠️ No se pudo generar el manifest:', error.message);
    return manifest;
  }
}

function showBuildSummary(manifest) {
  console.log('\n📊 RESUMEN DEL BUILD:');
  console.log('==========================================');
  console.log(`✅ Archivos CSS procesados: ${manifest.files.css.length}`);
  console.log(`✅ Archivos JS procesados: ${manifest.files.js.length}`);
  console.log(`✅ Imágenes copiadas: ${manifest.files.images.length}`);
  console.log(`📁 Total de archivos: ${manifest.files.total}`);
  console.log('==========================================');
  
  if (manifest.files.css.length > 0) {
    console.log('\n🎨 Archivos CSS:');
    manifest.files.css.forEach(file => console.log(`   • ${file}`));
  }
  
  if (manifest.files.js.length > 0) {
    console.log('\n⚡ Archivos JavaScript:');
    manifest.files.js.forEach(file => console.log(`   • ${file}`));
  }
  
  console.log('\n🎯 Build completado exitosamente!');
  console.log(`📁 Archivos disponibles en: ./dist/`);
  console.log('💡 Para ejecutar en producción: npm run build:prod\n');
}

async function main() {
  try {
    showBanner();
    
    // Ejecutar el proceso de build
    console.log('🔧 Iniciando proceso de build...\n');
    
    await new Promise((resolve, reject) => {
      exec('npm run build:clean && npm run build:css && npm run build:js && npm run build:assets', 
        { cwd: path.join(__dirname, '..') }, 
        (error, stdout, stderr) => {
          if (stdout) console.log(stdout);
          if (stderr) console.warn(stderr);
          if (error) reject(error);
          else resolve();
        }
      );
    });
    
    // Generar manifest y mostrar resumen
    const manifest = await generateBuildManifest();
    showBuildSummary(manifest);
    
  } catch (error) {
    console.error('\n❌ Error durante el build:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main, config };