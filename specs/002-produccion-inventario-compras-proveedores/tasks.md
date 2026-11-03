# Tareas — Spec 002: Compras de Insumos, Inventarios y Proveedores

- [x] **T1. Lógica pura de inventario y compras con tests unitarios (`tests/production.test.js` y `assets/js/production.js`).** RF-2.1, RF-2.2, RF-3.1
  - Hecho cuando: `tests/production.test.js` valide la detección de alertas de stock crítico, aplicación de compras con incremento de existencias, cálculo de valorización monetaria total y filtros pasando al 100% en verde con `node --test tests/production.test.js`.

- [x] **T2. Persistencia y seed data de producción en `storage.js`.** RF-1.1, RF-2.1, RF-3.1
  - Hecho cuando: `storage.js` incorpore seed data realista de insumos de estampado (poleras lisas, polerones, gorras, film DTF, tintas, vinilo) y métodos de guardado/consulta para proveedores, inventario y compras.

- [x] **T3. Interfaz y gestión de Proveedores (`index.html`, `assets/js/ui.js` y `assets/js/main.js`).** RF-1.1
  - Hecho cuando: La pestaña `#view-suppliers` muestre el directorio de distribuidores con búsqueda, categorías, botón para registrar/editar en modal `<dialog>` y contacto directo por WhatsApp.

- [x] **T4. Interfaz de Inventario con semáforo de existencias y alertas de stock mínimo (`index.html`, `assets/js/ui.js` y `assets/js/main.js`).** RF-2.2, RF-3.1
  - Hecho cuando: La pestaña `#view-inventory` muestre la tabla de existencias, filtros por categoría, tarjetas de valorización total y badges de stock crítico destacados en rojo cuando `currentStock <= minStock`.

- [x] **T5. Interfaz de Compras de Insumos con incremento automático de existencias (`index.html`, `assets/js/ui.js` y `assets/js/main.js`).** RF-2.1
  - Hecho cuando: El usuario pueda registrar una compra a un proveedor con múltiples ítems, registrar el costo total y al guardar, el stock del inventario se incremente automáticamente.

- [x] **T6. Verificación integral, ejecución de tests y registro en memoria (`memory.md`).** RF-1.1, RF-2.1, RF-2.2, RF-3.1
  - Hecho cuando: Toda la suite de pruebas (`node --test`) pase en verde, sintaxis validada con `node -c`, la SPA opere fluidamente sin errores en consola y `memory.md` quede actualizado.
