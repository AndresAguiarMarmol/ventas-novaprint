# Tareas de Implementación — Spec 008: Enlace Prenda-Color-Talla y Auto-creación en Inventario

- [x] **Tarea 1: Método `asegurarItemInventarioPrenda` en `assets/js/storage.js`**
  - Implementar generador de código de prenda legible (`generarCodigoPrenda`).
  - Implementar `asegurarItemInventarioPrenda(garmentType, color, size, datosExtra)`.
  - Exportar la función en `NovaprintStorage`.
  - *Criterio de verificación:* Pruebas unitarias en `storage.test.js`.

- [x] **Tarea 2: Ajuste en `calcularFaltantesPedido` en `assets/js/production.js`**
  - Modificar `calcularFaltantesPedido` para que ítems `no_registrado` se sumen a `totalPrendasFaltantes` y se agreguen a `faltantesParaCompra`.
  - *Criterio de verificación:* Pruebas unitarias en `production.test.js`.

- [x] **Tarea 3: Integración en la interfaz de usuario `assets/js/ui.js`**
  - En `abrirModalCompraConFaltantes`, asegurar que todos los faltantes tengan `inventoryId` llamando a `asegurarItemInventarioPrenda`.
  - En `guardarPedidoDesdeFormulario`, asegurar que las prendas queden registradas en inventario al guardar el pedido.
  - *Criterio de verificación:* Comprobación en navegador y flujo de compra pre-cargado.

- [x] **Tarea 4: Pruebas unitarias e integración**
  - Escribir casos de prueba en `tests/storage.test.js` y `tests/production.test.js`.
  - Ejecutar `node --test tests/*.test.js` y asegurar 0 fallos (89/89 pruebas superadas).
  - *Criterio de verificación:* 100% pruebas en verde.

- [x] **Tarea 5: Actualización de `memory.md`**
  - Registrar la decisión en Sección 2 y la entrada en Sección 3.
  - *Criterio de verificación:* `memory.md` actualizado según protocolo `AGENTS.md`.
