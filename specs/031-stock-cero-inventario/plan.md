# Plan — Spec 031: Colocar Saldo 0 en el Stock Actual de Todos los Elementos del Inventario

## 1. Arquitectura y Diseño
- **Capa de Persistencia (`assets/js/storage.js`):**
  - Implementar la función `ponerStockCeroATodosLosItems()`:
    1. Obtiene los artículos con `getInventory()`.
    2. Itera sobre cada artículo y asigna:
       - `currentStock: 0`
       - `updatedAt: new Date().toISOString()`
       - `lastStockAdjustment: { previousStock: item.currentStock, newStock: 0, delta: -item.currentStock, date: new Date().toISOString(), reason: 'Reinicio general de inventario a saldo 0 (Spec 031)' }`
    3. Guarda la lista en `STORAGE_KEYS.INVENTORY`.
    4. Retorna `{ success: true, totalItemsAjustados: items.length, itemsAfectados: items }`.
  - Exportar `ponerStockCeroATodosLosItems` en `NovaprintStorage` y `module.exports`.
  - Añadir una bandera en `STORAGE_KEYS.SETTINGS` o ejecutar la puesta en 0 al iniciar si no ha sido aplicada, o ejecutarla directamente para asegurar que cualquier dato preexistente en el navegador pase a 0.

- **Capa de Interfaz de Usuario (`assets/js/ui.js` & `index.html`):**
  - En la barra de herramientas de la vista Inventario (`#view-inventory`):
    - Agregar el botón `#btn-reset-inventory-stock` con estilo ámbar/neutro: `[📦 Poner Stock en 0]`.
  - Implementar en `ui.js`:
    - `confirmarPonerStockCero()`: solicita confirmación al usuario (o modal nativo), ejecuta `storage.ponerStockCeroATodosLosItems()`, notifica con `showToast` y ejecuta `refrescarDatos()`.
  - Exportar `confirmarPonerStockCero` en `NovaprintUI`.

- **Capa de Orquestación (`assets/js/main.js`):**
  - En `init()`: aplicar la puesta a saldo cero si corresponde o asegurar que se refleje al arrancar la aplicación.

- **Pruebas Automatizadas (`tests/inventory_zero_stock.test.js`):**
  - Pruebas unitarias para verificar que todos los artículos quedan con `currentStock = 0`.
  - Pruebas de preservación de metadatos (precios, códigos, proveedores, tallas, colores).
  - Pruebas de integración con la UI.

## 2. Fases de Ejecución
1. Fase 1: Respaldo previo (JSON y Git tag) — Completada.
2. Fase 2: Documentación SDD (`spec.md`, `plan.md`, `tasks.md`).
3. Fase 3: Implementación en `storage.js`.
4. Fase 4: Integración en `index.html` y `ui.js`.
5. Fase 5: Inicialización en `main.js`.
6. Fase 6: Pruebas automatizadas.
7. Fase 7: Documentación en `memory.md`, commit y push a `main`.
