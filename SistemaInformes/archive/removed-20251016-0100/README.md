Archivos movidos desde el proyecto principal el 2025-10-16T01:00

Motivo: limpieza de archivos auxiliares, backups y utilidades que no son necesarios en el runtime de producción. Se han movido en lugar de eliminar directamente para permitir restauración si fuera necesario.

Archivos incluidos:
- server-backup.js (backup del servidor antiguo)
- ng-build.js (script de build alternativo)
- ng-build.bat (script de build Windows)
- count_syntax.js (herramienta local de conteo de sintaxis)
- verificar-db.js (script de verificación de BD)
- verificar-estructuras.js (script de verificación de estructuras)
- verify-hash.js (script de verificación de hash de contraseña)
- tools/* (scripts de mantenimiento, backups y tests):
  - backup_deleted_users.sql
  - check_duplicates.js
  - cleanup_test_accounts.js
  - find_duplicate_functions.js
  - list_areas.js
  - list_users.js
  - test_informe_visibility.js
  - test_update_area_db.js

Instrucciones para restaurar:
Copiar los archivos de este directorio de vuelta a la raíz del proyecto y reiniciar la aplicación si es necesario.
