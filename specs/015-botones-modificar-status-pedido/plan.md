# Plan de Implementación — Spec 015: Botones para Modificar el Status de un Pedido

## 1. Arquitectura de Componentes

### A. Modal Rápido de Estados (`#dialog-change-order-status`)
En `index.html`:
- Diálogo nativo `<dialog id="dialog-change-order-status">` con backdrop styling.
- Cabecera con ID del pedido, nombre del cliente y estado actual.
- Cuadrícula de 6 botones de estado:
  - `Cotización` (bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300)
  - `Confirmado` (bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300)
  - `En producción` (bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300)
  - `Listo para entrega` (bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300)
  - `Entregado` (bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300)
  - `Cancelado` (bg-red-50 hover:bg-red-100 text-red-800 border-red-300)
- El botón correspondiente al estado actual del pedido llevará un anillo o badge `✓ Actual` y estará deshabilitado o destacado.
- Botón de cierre `Cancelar / Cerrar`.

### B. Integración en la Tabla de Pedidos (`assets/js/ui.js` -> `renderOrdersTable`)
- En la columna `Estado` (`td`):
  El badge de estado se convierte en un botón interactivo o se le acompaña de un botón `[🔄 Cambiar]` con estilo elegante:
  `<button type="button" class="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border ${badgeClass} hover:opacity-80 transition cursor-pointer" onclick="NovaprintUI.abrirModalCambiarEstado('${p.id}')" title="Modificar estado de este pedido">${p.status} ▾</button>`
- En la columna `Acciones`:
  Añadir botón `<button class="p-1 text-blue-600 hover:text-blue-800 rounded" title="Modificar Estado" onclick="NovaprintUI.abrirModalCambiarEstado('${p.id}')">🔄</button>`.

### C. Integración en las Tarjetas Kanban (`assets/js/ui.js` -> `renderOrderCard`)
- En la barra inferior de acciones de cada tarjeta:
  Añadir un botón táctil `<button type="button" class="btn-change-status p-1.5 text-blue-700 hover:bg-blue-50 rounded text-xs flex items-center gap-1 border border-blue-200 font-semibold" title="Modificar Estado del Pedido" onclick="NovaprintUI.abrirModalCambiarEstado('${pedido.id}')">🔄 Estado</button>` junto al botón `Avanzar ➔` (o incluso como selector directo de estados).

### D. Funciones de Controlador (`assets/js/ui.js`)
- `abrirModalCambiarEstado(orderId)`:
  - Obtiene el pedido por `orderId` desde `NovaprintStorage.getOrders()`.
  - Inyecta los datos en el diálogo `#dialog-change-order-status`.
  - Asigna los eventos de clic a cada botón llamando a `NovaprintUI.cambiarEstado(orderId, nuevoEstado)` y cerrando el diálogo.
  - Abre el diálogo con `.showModal()`.

## 2. Fases de Ejecución

### Fase 1: Marcado HTML en `index.html`
- Añadir el elemento `<dialog id="dialog-change-order-status">`.

### Fase 2: Lógica de UI en `assets/js/ui.js`
- Implementar `abrirModalCambiarEstado(orderId)`.
- Exportar en `NovaprintUI`.
- Actualizar `renderOrdersTable` y `renderOrderCard` para incluir los botones.

### Fase 3: Pruebas Unitarias Automatizadas
- Crear `tests/order_status_buttons.test.js`.
- Ejecutar suite completa con `node --test tests/*.test.js`.

### Fase 4: Documentación y Memoria
- Actualizar `memory.md` (Sección 2 y Sección 3).
- Marcar `tasks.md` y `spec.md`.
- Versionar y sincronizar en GitHub (`main`).
