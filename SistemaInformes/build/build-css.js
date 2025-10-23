#!/usr/bin/env node

/**
 * Script para procesar y optimizar archivos CSS
 * Minifica y optimiza los estilos para producción
 */

const fs = require('fs-extra');
const path = require('path');
const CleanCSS = require('clean-css');

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist', 'public');

async function buildCSS() {
  try {
    console.log('🎨 Procesando archivos CSS...');
    
    const cleanCSS = new CleanCSS({
      level: 2,
      returnPromise: true
    });
    
    // Procesar styles.css principal
    const mainCSSPath = path.join(publicDir, 'styles.css');
    if (await fs.pathExists(mainCSSPath)) {
      const cssContent = await fs.readFile(mainCSSPath, 'utf8');
      const minified = await cleanCSS.minify(cssContent);
      
      if (minified.errors.length > 0) {
        console.warn('⚠️ Advertencias en CSS:', minified.warnings);
      }
      
      await fs.writeFile(
        path.join(distDir, 'css', 'styles.min.css'),
        minified.styles
      );
      
      console.log('✅ styles.css -> styles.min.css');
      console.log(`📉 Reducción: ${cssContent.length} -> ${minified.styles.length} bytes`);
    }
    
    // Procesar otros archivos CSS si existen
    const cssFiles = ['styles-backup.css', 'styles-limpio.css'];
    
    for (const file of cssFiles) {
      const filePath = path.join(publicDir, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        const minified = await cleanCSS.minify(content);
        const outputName = file.replace('.css', '.min.css');
        
        await fs.writeFile(
          path.join(distDir, 'css', outputName),
          minified.styles
        );
        
        console.log(`✅ ${file} -> ${outputName}`);
      }
    }
    
    // Copiar directorio css si existe
    const cssDir = path.join(publicDir, 'css');
    if (await fs.pathExists(cssDir)) {
      await fs.copy(cssDir, path.join(distDir, 'css'), {
        filter: (src) => !src.endsWith('.map')
      });
      console.log('✅ Directorio css copiado');
    }
    
    console.log('🎯 Procesamiento CSS completado');
    
  } catch (error) {
    console.error('❌ Error procesando CSS:', error.message);
    process.exit(1);
  }
}

buildCSS();