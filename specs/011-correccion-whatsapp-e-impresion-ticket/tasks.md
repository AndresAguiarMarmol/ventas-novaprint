# Tareas de Implementación — Spec 011: Corrección de WhatsApp e Impresión Unitaria de Ticket

- [x] **Tarea 1: Especificación y Diseño Técnico (SDD)**
  - Crear `spec.md`, `plan.md` y `tasks.md` en `specs/011-correccion-whatsapp-e-impresion-ticket/`.

- [x] **Tarea 2: Corrección y Resiliencia en Envío a WhatsApp (`assets/js/ticket.js` y `assets/js/ui.js`)**
  - Implementar función `obtenerTelefonoCliente(pedido)` con cascada de fallback (pedido ➔ clientId ➔ clientName).
  - Actualizar `generarTicketHTML` para mostrar el teléfono resuelto del cliente.
  - Actualizar `abrirWhatsAppPedido` para utilizar el teléfono resuelto, persistirlo si faltaba en el pedido, o solicitarlo con `prompt()` si no existe.
  - Asegurar captura en `guardarPedidoDesdeFormulario` en `ui.js`.

- [x] **Tarea 3: Corrección de Aislamiento de Impresión (`assets/css/custom.css` y `assets/js/ticket.js`)**
  - Reemplazar `dialog { display: none !important; }` por reglas específicas que oculten `header`, `nav`, `main`, `footer`, y vistas SPA en `@media print`.
  - Configurar `#dialog-ticket` y `#printable-ticket-content` para visualización e impresión exclusiva y centrada (compatible con térmicas de 80mm y hojas A4/Carta).
  - Gestionar listeners `beforeprint` / `afterprint` y atajo de teclado Ctrl+P para soporte perfecto de botón y atajo.

- [x] **Tarea 4: Pruebas Unitarias Automatizadas (`tests/ticket.test.js`)**
  - Agregar tests para resolución de teléfono en cascada y normalización de WhatsApp.
  - Ejecutar la suite completa y confirmar 100% verde sin regresiones (100 pruebas pasando).

- [x] **Tarea 5: Documentación y Memoria del Proyecto (`memory.md`)**
  - Actualizar `memory.md` en Sección 2 (Decisiones vigentes) y Sección 3 (Historial de cambios).
