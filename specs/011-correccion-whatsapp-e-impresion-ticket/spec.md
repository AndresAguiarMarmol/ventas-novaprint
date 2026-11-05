# Spec 011 — Corrección de Envío a WhatsApp e Impresión Unitaria de Ticket

## 1. Qué y Por Qué
En el modal "Comprobante de Venta & Taller" (`#dialog-ticket`):
1. **Error en Envío a WhatsApp:** Al pulsar el botón "💬 Enviar WhatsApp", el sistema reporta que el pedido no tiene un número asociado a pesar de que el cliente tiene teléfono registrado en el sistema. Esto ocurre porque `ticket.abrirWhatsAppPedido` consulta únicamente la propiedad directa `pedido.clientPhone`, la cual puede no estar sincronizada con el registro del cliente en `novaprint_clients` o venir vacía.
2. **Error en Impresión de Ticket:** Al pulsar "🖨️ Imprimir Ticket", en lugar de imprimirse exclusivamente el comprobante del pedido visualizado, el navegador imprime todas las órdenes pendientes visibles en el tablero Kanban de fondo. Esto ocurre porque `@media print` en `custom.css` contiene una regla genérica `dialog { display: none !important; }` que oculta el modal del ticket y deja visible el contenedor principal de la vista con todos los pedidos.

Esta especificación corrige ambos comportamientos asegurando que el envío a WhatsApp resuelva de forma resiliente el teléfono del cliente (y permita ingresarlo interactivamente si no estuviese registrado) y que la impresión física/PDF aísle al 100% el ticket individual sin imprimir elementos de fondo ni otros pedidos.

## 2. Historias de Usuario
- **Como vendedor o administrador del taller**, al visualizar el Comprobante de Venta & Taller de un pedido y presionar "Enviar WhatsApp", quiero que la aplicación abra la conversación de WhatsApp con el número del cliente de forma automática y transparente, incluso si el pedido se creó antes de actualizar la ficha del cliente.
- **Como operador de taller o mostrador**, al presionar "Imprimir Ticket", quiero que en la hoja o impresora térmica salga única y exclusivamente el comprobante del pedido seleccionado en alta calidad y fondo blanco, sin incluir pedidos de fondo, barras de navegación ni menús.

## 3. Requisitos Funcionales (EARS)
- **Ubiquitous (Resolución de Teléfono):** El sistema deberá contar con una función robusta `obtenerTelefonoCliente(pedido)` que busque el teléfono en `pedido.clientPhone`, en `pedido.clientId` (vía `NovaprintStorage.getClientById`), o en `pedido.clientName` (vía `NovaprintStorage.getClients()`).
- **Event-Driven (WhatsApp con Teléfono Resuelto):** Cuando el usuario presione "Enviar WhatsApp", el sistema deberá resolver el teléfono mediante dicha cascada de búsqueda. Si el pedido tenía `clientPhone` vacío pero el cliente sí tenía teléfono registrado, deberá sincronizar y guardar `pedido.clientPhone` automáticamente.
- **Event-Driven (WhatsApp sin Teléfono Registrado):** Cuando ni el pedido ni el cliente tengan teléfono registrado, el sistema deberá solicitar amigablemente el número mediante un diálogo interactivo (`prompt`), guardarlo en el pedido/cliente y proceder al envío sin abortar bruscamente con un error cerrado.
- **Event-Driven (Impresión Exclusiva de Ticket):** Cuando el usuario imprima el comprobante (mediante el botón del modal o mediante Ctrl+P / Cmd+P teniendo el diálogo abierto), los estilos de impresión (`@media print`) deberán ocultar todos los elementos de la interfaz de usuario (`header`, `nav`, `main`, `#view-orders`, tarjetas Kanban, botones de acción) y desplegar única y exclusivamente el contenedor `#printable-ticket-content` del ticket activo.
- **State-Driven (Comportamiento de Impresión):** La impresión del ticket deberá tener ancho adaptable apto para rollos de impresora térmica (80mm) y formatos estándar Carta/A4, con tipografía nítida y fondo blanco puro.
- **Ubiquitous (Sin Regresiones):** Todos los módulos existentes (Ventas, Producción, Inventario, Compras, Taller, Modo Oscuro/Claro) deberán continuar funcionando sin alteraciones.

## 4. Criterios de Aceptación
1. Al pulsar "💬 Enviar WhatsApp" en el Comprobante de Venta & Taller de un pedido cuyo cliente tiene teléfono en el sistema, se abre la URL `https://wa.me/{numero}` con el mensaje estructurado de la orden.
2. Si un pedido no poseía teléfono pero el cliente sí, el teléfono se actualiza en el pedido y se muestra en el ticket.
3. Si el cliente no tiene teléfono en ninguna parte, se le solicita al usuario mediante un prompt que lo ingrese y al escribirlo se envía y se persiste.
4. Al pulsar "🖨️ Imprimir Ticket" o presionar Ctrl+P con el ticket abierto, la vista previa de impresión muestra únicamente el ticket del pedido seleccionado; ninguna tarjeta de pedidos de fondo ni elementos de la pantalla se imprimen.
5. Los 96 tests unitarios pasan al 100% en verde y se añaden pruebas específicas para la resolución de teléfono y la exclusión de impresión.

