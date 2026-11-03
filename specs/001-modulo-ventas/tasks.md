# Tareas — Spec 001: Módulo de Ventas (Clientes y Pedidos)

- [x] **T1. Lógica de negocio pura de ventas y pruebas unitarias (`tests/sales.test.js` y `assets/js/sales.js`).** RF-2.2, RF-2.3, RF-2.4, RF-2.5, RF-3.1, RF-3.2, RF-4.2
  - Hecho cuando: `tests/sales.test.js` valide cálculos de subtotales por prenda, totales, abonos, saldos pendientes, semáforo determinista de fechas, filtros y mensajes de WhatsApp pasando al 100% en verde con `node --test tests/sales.test.js`.

- [x] **T2. Capa de persistencia local resiliente, esquemas y backup (`tests/storage.test.js` y `assets/js/storage.js`).** RF-1.1, RF-2.1, RNF-2
  - Hecho cuando: `assets/js/storage.js` soporte operaciones CRUD para clientes, pedidos y configuración, precargue datos de prueba (seed data) realistas de estampado textil y valide importación/exportación JSON con pruebas pasando en `tests/storage.test.js`.

- [x] **T3. Maquetación SPA, estética Novaprint y modales nativos (`index.html` y `assets/css/custom.css`).** RF-1.1, RF-2.1, RNF-1, RNF-3
  - Hecho cuando: `index.html` contenga el encabezado con marca Novaprint, navegación por módulos (Ventas: Pedidos y Clientes; tabs de Producción preparadas), modales nativos `<dialog>` para Nuevo Pedido, Nuevo Cliente, Ticket de Venta y Configuración/Backup, con estilos en `assets/css/custom.css`.

- [x] **T4. Directorio y gestión de Clientes (`assets/js/ui.js` y `assets/js/main.js`).** RF-1.1, RF-1.2, RF-1.3, RF-1.4
  - Hecho cuando: El usuario pueda crear, editar y buscar clientes en vivo por nombre/teléfono/RUT, ver tarjetas con métricas de pedidos acumulados y abrir el historial de compras de cada cliente.

- [x] **T5. Formulario interactivo de Pedidos multi-prenda con cálculo en tiempo real (`assets/js/ui.js` y `assets/js/main.js`).** RF-2.1, RF-2.2, RF-2.3, RF-2.4, RF-2.5
  - Hecho cuando: El formulario modal permita agregar dinámicamente múltiples prendas (poleras, polerones, buzos, gorras), especificando color, talla, técnica de estampado y ubicación, calculando subtotales, total general, abono y saldo pendiente en vivo al teclear.

- [x] **T6. Tablero Semáforo y Listado Tabular de Pedidos con cambio rápido de estado (`assets/js/ui.js`).** RF-3.1, RF-3.2
  - Hecho cuando: La vista de pedidos permita alternar entre Semáforo de Urgencia (Atrasados, Hoy/Próximos, En fecha) y Tabla general, con filtros por estado (`Cotización`, `Confirmado`, `En producción`, `Listo`, `Entregado`) y botones de avance de estado en un clic.

- [x] **T7. Módulo de Ticket de Venta y comunicación por WhatsApp (`assets/js/ticket.js` y `assets/js/ui.js`).** RF-4.1, RF-4.2
  - Hecho cuando: El modal de ticket renderice el comprobante listo para imprimir (`Ctrl + P`) sin barras de navegación, y el botón de WhatsApp abra el chat con el mensaje preformateado y detallado del pedido.

- [x] **T8. Respaldo JSON, verificación integral de la SPA y registro en memoria (`memory.md`).** RNF-1, RNF-2, RNF-3, RNF-4
  - Hecho cuando: Se verifique la descarga y restauración de respaldo JSON, todas las pruebas pasen (`node --test`), la sintaxis sea válida (`node -c`) y `memory.md` quede actualizado con la implementación completa de la Spec 001.

