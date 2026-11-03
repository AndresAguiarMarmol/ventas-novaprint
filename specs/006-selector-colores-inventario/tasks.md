# Tareas de Implementación — Spec 006: Selector de Colores en Inventario

- [x] **Tarea 1: Pruebas unitarias de consistencia de colores en inventario**
  - Verificar en `tests/storage.test.js` el correcto almacenamiento de colores textiles estándar y personalizados en inventario.
  - *Criterio de verificación:* Ejecución de pruebas con `node --test tests/*.test.js`.

- [x] **Tarea 2: Actualización de Interfaz en `index.html`**
  - Reemplazar `<input id="inventory-color-input">` por `<select id="inventory-color-select">` en `#dialog-inventory`.
  - Conectar evento `onchange="NovaprintUI.manejarCambioColorInventario(this.value)"`.
  - *Criterio de verificación:* Inspección de markup en `index.html`.

- [x] **Tarea 3: Lógica de Interacción en `assets/js/ui.js`**
  - Implementar `manejarCambioColorInventario(valor)` con soporte de opción "Otro" y prompt interactivo.
  - Poblar `#inventory-color-select` en `abrirModalNuevoItemInventario` y `editarItemInventario` usando `generarOpcionesColor`.
  - Actualizar lectura del campo de color en `guardarItemInventarioDesdeFormulario`.
  - Exportar `manejarCambioColorInventario` en `uiModule`.
  - *Criterio de verificación:* Pruebas automáticas y verificación de carga de opciones.

- [x] **Tarea 4: Verificación Integral y Memoria del Proyecto**
  - Ejecutar suite completa `node --test tests/*.test.js` para asegurar 0 regresiones.
  - Actualizar `memory.md` (Sección 2 y 3).
  - *Criterio de verificación:* 100% de pruebas pasando en verde.
