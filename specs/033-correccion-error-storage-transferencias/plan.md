# Plan de Implementación — Spec 033: Corrección de "storage is not defined" en Transferencias y Tabla de Compras

## Arquitectura de Solución

### 1. Modificación en `assets/js/ui.js`
- Localizar `renderPurchasesTable(compras = [])` en `assets/js/ui.js` (alrededor de la línea 1797).
- Declarar al inicio de la función la referencia canónica:
  ```javascript
  const storage = global.NovaprintStorage;
  ```
- Mantener la resolución segura `const inventario = storage && typeof storage.getInventory === 'function' ? storage.getInventory() : [];`

### 2. Pruebas Automatizadas
- Crear `tests/purchases_table_render_storage.test.js` (o enriquecer suite existente):
  - Probar `renderPurchasesTable` con compras no vacías en un entorno DOM simulado, verificando que no se lance `ReferenceError: storage is not defined`.
  - Simular el flujo completo de `guardarTransferenciaDesdeFormulario` con cuentas `3101` y `3102` y compras preexistentes en bodega, asegurando que la transferencia concluya con éxito sin lanzar excepciones.
  - Ejecutar la suite global `node --test tests/*.test.js` y verificar 100% aprobado.

### 3. Documentación y Cierre
- Actualizar `memory.md` (Secciones 2 y 3).
- Completar `tasks.md`.
- Commit y push a `main`.

