#!/usr/bin/env node

/**
 * Script para procesar y minificar archivos JavaScript
 * Optimiza el código JS para producción
 */

const fs = require('fs-extra');
const path = require('path');
const UglifyJS = require('uglify-js');

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist', 'public');

async function buildJS() {
  try {
    console.log('⚡ Procesando archivos JavaScript...');
    
    const jsDir = path.join(publicDir, 'js');
    
    if (await fs.pathExists(jsDir)) {
      const jsFiles = await fs.readdir(jsDir);
      
      for (const file of jsFiles) {
        if (file.endsWith('.js')) {
          const filePath = path.join(jsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Configuración de minificación
          const options = {
            compress: {
              drop_console: process.env.NODE_ENV === 'production',
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info']
            },
            mangle: {
              toplevel: false
            },
            output: {
              comments: false
            },
            parse: {
              ecma: 2020
            }
          };
          
          const minified = UglifyJS.minify(content, options);
          
          if (minified.error) {
            console.warn(`⚠️ Error minificando ${file}, copiando original:`, minified.error.message);
            // Si hay error en minificación, copiar archivo original
            await fs.writeFile(
              path.join(distDir, 'js', file),
              content
            );
            console.log(`✅ ${file} -> ${file} (original copiado)`);
            continue;
          }
          
          const outputName = file.replace('.js', '.min.js');
          await fs.writeFile(
            path.join(distDir, 'js', outputName),
            minified.code
          );
          
          console.log(`✅ ${file} -> ${outputName}`);
          console.log(`📉 Reducción: ${content.length} -> ${minified.code.length} bytes`);
        }
      }
    }
    
    console.log('🎯 Procesamiento JavaScript completado');
    
  } catch (error) {
    console.error('❌ Error procesando JavaScript:', error.message);
    process.exit(1);
  }
}

buildJS();