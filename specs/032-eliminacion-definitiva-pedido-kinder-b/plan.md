# Plan de Implementación — Spec 032: Eliminación Definitiva del Pedido "BRS Kinder B"

## Arquitectura de Solución

### 1. Diagnóstico de la Causa Raíz
- En `assets/js/storage.js`: `asegurarPedidoKinderB()` realizaba un `find()` sobre `novaprint_orders`. Si no encontraba el pedido (porque el usuario lo había borrado), volvía a insertarlo con `orders.unshift(pedidoFinal)`.
- En `assets/js/main.js`: `init()` llamaba a `asegurarPedidoKinderB()` en cada recarga de página de forma incondicional, a diferencia de la Spec 031 que utiliza un flag idempotente `inventoryZeroStockApplied_v1`.

### 2. Modificaciones en Persistencia (`assets/js/storage.js`)
1. **Actualización de `deleteOrder(id)`:**
   - Al eliminar una orden, verificar si corresponde al pedido canónico de Kinder B (`id === 'NP-20261102-003'` o `order.clientName.toLowerCase().includes('kinder b')`).
   - Si corresponde, registrar en la configuración (`settings`) las banderas:
     - `kinderBOrderDeleted: true`
     - `kinderBRecoveryApplied_v1: true`
   - Guardar las configuraciones actualizadas con `saveSettings(settings)`.
2. **Modificación de `asegurarPedidoKinderB(opciones = {})`:**
   - Leer `getSettings()`.
   - Si `opciones.forzar !== true`:
     - Si `settings.kinderBOrderDeleted === true` o `settings.kinderBRecoveryApplied_v1 === true` y no existe el pedido:
       - Retornar inmediatamente `{ success: true, restaurado: false, eliminadoPorUsuario: true }` sin modificar `novaprint_orders`.
   - Si el pedido ya existe en la lista de órdenes, marcar `settings.kinderBRecoveryApplied_v1 = true` para sellar la migración histórica.
   - Solo en caso de que sea la primera ejecución histórica (ni borrado ni migrado previamente), reconstituir el pedido y marcar `settings.kinderBRecoveryApplied_v1 = true`.

### 3. Modificaciones en Ciclo de Vida (`assets/js/main.js`)
1. En `main.js:init()`:
   - Proteger la invocación de `asegurarPedidoKinderB()` evaluando las configuraciones:
     ```javascript
     const config = global.NovaprintStorage.getSettings() || {};
     if (!config.kinderBRecoveryApplied_v1 && !config.kinderBOrderDeleted) {
       global.NovaprintStorage.asegurarPedidoKinderB();
       config.kinderBRecoveryApplied_v1 = true;
       global.NovaprintStorage.saveSettings(config);
     }
     ```
   - Si `config.kinderBOrderDeleted === true`, no invocar la recuperación.

### 4. Pruebas Unitarias Automatizadas
1. Crear `tests/kinder_b_deletion_preservation.test.js`:
   - Verificar que al invocar `deleteOrder('NP-20261102-003')`, el pedido se elimine de `orders` y se active `settings.kinderBOrderDeleted = true`.
   - Verificar que subsecuentes llamadas a `asegurarPedidoKinderB()` o ejecuciones de `init()` NO recrean el pedido.
   - Verificar que recargar la página o simular reinicio de sesión mantiene el pedido eliminado.
   - Verificar que las pruebas existentes en `tests/kinder_b_preservation.test.js` y el resto de suites (267 pruebas) se actualicen y sigan pasando al 100%.

### 5. Documentación y Cierre
1. Actualizar `memory.md` (Secciones 2 y 3).
2. Crear `tasks.md` con checklist de ejecución.
3. Commit y push a `main`.

