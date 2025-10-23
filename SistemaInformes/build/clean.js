#!/usr/bin/env node

/**
 * Script para limpiar directorio de distribución
 * Equivalente a ng build --clean
 */

const fs = require('fs-extra');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

async function clean() {
  try {
    console.log('🧹 Limpiando directorio de distribución...');
    
    // Remover directorio dist si existe
    if (await fs.pathExists(distDir)) {
      await fs.remove(distDir);
      console.log('✅ Directorio dist eliminado');
    }
    
    // Recrear directorio dist
    await fs.ensureDir(distDir);
    await fs.ensureDir(path.join(distDir, 'public'));
    await fs.ensureDir(path.join(distDir, 'public', 'css'));
    await fs.ensureDir(path.join(distDir, 'public', 'js'));
    await fs.ensureDir(path.join(distDir, 'public', 'Img'));
    
    console.log('✅ Directorio dist recreado');
    console.log('🎯 Limpeza completada');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    process.exit(1);
  }
}

clean();