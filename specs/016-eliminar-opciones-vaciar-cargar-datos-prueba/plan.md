# Plan de Implementación — Spec 016: Eliminación de Opciones "Vaciar Base de Datos" y "Cargar datos de Prueba"

## 1. Alcance
- Modificar `index.html` para remover la sección de "Gestión de Registros" (`#btn-clear-database` y `#btn-load-demo-data`).
- Modificar `assets/js/main.js` para retirar los listeners de dichos botones en `initEventosConfiguracion`.
- Crear prueba unitaria en `tests/settings_cleanup.test.js` para verificar la ausencia de los elementos en el HTML y la inicialización segura de `main.js`.
- Actualizar `memory.md` y sincronizar en GitHub (`main`).

## 2. Componentes Afectados
1. `index.html`:
   - Eliminar el bloque `<div class="pt-4 border-t border-gray-200 space-y-3">` que contenía `Gestión de Registros`, `#btn-clear-database` y `#btn-load-demo-data`.
2. `assets/js/main.js`:
   - Limpiar el bloque de asignación de eventos para `btnClearDb` y `btnLoadDemo`.
3. `tests/settings_cleanup.test.js`:
   - Prueba que analiza `index.html` para asegurar que no existen los IDs `#btn-clear-database` ni `#btn-load-demo-data`.
   - Prueba que verifica que los botones de respaldo (`#btn-export-backup` y `#file-import-backup`) siguen presentes en el DOM.
   - Prueba de inicialización segura en `main.js`.

## 3. Riesgos y Mitigación
- **Riesgo:** Que alguna prueba unitaria existente dependa de la presencia en el DOM de `#btn-clear-database` o `#btn-load-demo-data`.
- **Mitigación:** Previamente revisamos todo el directorio `tests/` y comprobamos que ningún test busca esos botones en el DOM; `storage.test.js` invoca `storage.clearAllData` y `storage.initDemoData` a nivel de API programática, las cuales se mantendrán intactas en `storage.js`.
