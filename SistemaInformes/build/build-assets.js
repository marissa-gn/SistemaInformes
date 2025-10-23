#!/usr/bin/env node

/**
 * Script para copiar assets estáticos optimizados
 * Copia imágenes y otros recursos
 */

const fs = require('fs-extra');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist', 'public');

async function buildAssets() {
  try {
    console.log('📁 Procesando assets estáticos...');
    
    // Copiar directorio de imágenes
    const imgDir = path.join(publicDir, 'Img');
    if (await fs.pathExists(imgDir)) {
      await fs.copy(imgDir, path.join(distDir, 'Img'));
      console.log('✅ Imágenes copiadas');
    }
    
    // Copiar otros archivos estáticos si existen
    const staticFiles = await fs.readdir(publicDir);
    
    for (const file of staticFiles) {
      const filePath = path.join(publicDir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile() && !file.endsWith('.css') && !file.endsWith('.js')) {
        await fs.copy(filePath, path.join(distDir, file));
        console.log(`✅ ${file} copiado`);
      }
    }
    
    console.log('🎯 Assets procesados correctamente');
    
  } catch (error) {
    console.error('❌ Error procesando assets:', error.message);
    process.exit(1);
  }
}

buildAssets();