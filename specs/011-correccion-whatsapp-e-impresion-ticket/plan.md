# Plan de Implementación — Spec 011: Corrección de WhatsApp e Impresión Unitaria de Ticket

## 1. Corrección de Resolución de Teléfono y WhatsApp (`assets/js/ticket.js` y `assets/js/ui.js`)
- En `assets/js/ticket.js`:
  - Implementar función auxiliar `obtenerTelefonoCliente(pedido)`:
    1. Verifica si `pedido.clientPhone` tiene valor no vacío.
    2. Si no, busca en `NovaprintStorage.getClientById(pedido.clientId)` si `pedido.clientId` existe.
    3. Si no, busca en `NovaprintStorage.getClients()` por nombre de cliente coincidente (`pedido.clientName`).
    4. Retorna el teléfono limpio o cadena vacía si no existe.
  - En `generarTicketHTML(pedido, settings)`:
    - Utilizar `obtenerTelefonoCliente(pedido)` para mostrar el teléfono del cliente en el ticket cuando esté disponible en cualquier fuente.
  - En `abrirWhatsAppPedido(pedido, settings)`:
    - Usar `obtenerTelefonoCliente(pedido)`.
    - Si se obtiene de la base de datos pero no estaba en `pedido.clientPhone`, actualizar el pedido en `NovaprintStorage.saveOrder(...)`.
    - Si no existe en ninguna fuente, solicitarlo con `prompt(...)`. Si el usuario ingresa un teléfono, guardarlo en el pedido y continuar el flujo de apertura de `https://wa.me/`.
- En `assets/js/ui.js`:
  - En `guardarPedidoDesdeFormulario`:
    - Asegurar que si `clientId` tiene valor, se verifique y asegure `clientPhone` directamente desde `storage.getClientById(clientId)`.

## 2. Corrección de Impresión de Ticket (`assets/css/custom.css` y `assets/js/ticket.js`)
- En `assets/css/custom.css`:
  - En la sección `@media print`:
    - Eliminar la regla genérica `dialog { display: none !important; }` que ocultaba el ticket.
    - Ocultar explícitamente todos los contenedores de aplicación:
      ```css
      @media print {
        header, nav, main, footer, #toast-container, .floating-contact-pill, .no-print, dialog:not(#dialog-ticket) {
          display: none !important;
        }
      ```
    - Configurar `#dialog-ticket` y `#printable-ticket-content` para impresión aislada:
      ```css
      dialog#dialog-ticket,
      dialog#dialog-ticket[open],
      body.printing-ticket dialog#dialog-ticket {
        display: block !important;
        position: static !important;
        margin: 0 auto !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: 80mm !important;
      }
      ```
- En `assets/js/ticket.js` y `assets/js/main.js`:
  - Controlar eventos `beforeprint` y `afterprint`:
    - Si `#dialog-ticket` está abierto (`dialog.open`), activar la clase `printing-ticket` en `document.body` para garantizar que Ctrl+P funcione idéntico al botón de impresión.

## 3. Pruebas Unitarias (`tests/ticket.test.js`)
- Añadir pruebas unitarias verificando:
  - `obtenerTelefonoCliente` resuelve desde `pedido.clientPhone`.
  - `obtenerTelefonoCliente` resuelve desde `storage.getClientById(pedido.clientId)` si el pedido no lo tenía.
  - `obtenerTelefonoCliente` resuelve desde coincidencia de nombre de cliente en `storage.getClients()`.
  - `generarTicketHTML` renderiza el teléfono obtenido desde la ficha del cliente.
  - Formato de URL de WhatsApp generado con número chileno normalizado (+569...).

