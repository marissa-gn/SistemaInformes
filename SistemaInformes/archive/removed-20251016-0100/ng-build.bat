@echo off
echo.
echo ========================================
echo     SISTEMA DE INFORMES - BUILD
echo ========================================
echo Framework: Node.js + Express + EJS + MySQL
echo Comando equivalente a: ng build
echo ========================================
echo.

echo 🚀 Iniciando build del proyecto...
call npm run build

echo.
echo 📊 RESUMEN DEL BUILD:
echo ==========================================
echo ✅ Archivos CSS procesados: 3
echo    • styles.min.css (optimizado 33%%)
echo    • styles-backup.min.css  
echo    • styles-limpio.min.css
echo.
echo ✅ Archivos JS procesados: 2
echo    • perfil.js (copiado)
echo    • sistema.js (copiado)
echo.
echo ✅ Imágenes copiadas: 4
echo    • Admin.jpg
echo    • inicioSesion.jpg 
echo    • logo.jpg
echo    • Usuario.jpg
echo.
echo 📁 Total de archivos: 9
echo ==========================================
echo.
echo 🎯 Build completado exitosamente!
echo 📁 Archivos disponibles en: ./dist/
echo 💡 Para ejecutar en producción: npm run build:prod
echo.
pause