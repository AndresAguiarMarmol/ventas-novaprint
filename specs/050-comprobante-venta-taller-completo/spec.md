# Especificación Técnica — Spec 050: Comprobante de Venta & Taller Completo (Ticket & WhatsApp)

## 1. Contexto y Problema
En el flujo operativo diario de Novaprint, el modal **"Comprobante de Venta & Taller"** (`#dialog-ticket`) permite generar tanto la versión impresa/PDF del ticket (`ticket.generarTicketHTML`) como el mensaje estructurado de WhatsApp (`sales.generarTextoWhatsApp`).

Actualmente, ambos canales presentan omisiones críticas de información ("salen incompletos"):
1. **Mensaje de WhatsApp (`sales.generarTextoWhatsApp`):**
   - No desglosa el **precio unitario** ni el **subtotal** de cada prenda en la lista de ítems (solo dice cantidad, prenda, color, talla y técnica).
   - No incluye el **código de inventario** de las prendas cuando está asociado (`[POL-001]`).
   - No incluye el **Subtotal Bruto** ni el **Monto Neto** en el desglose financiero.
   - No indica el **Total de Prendas** acumulado (`X un.`).
   - No indica el **Estado de Pago** (`Pagado Total`, `Abonado` o `Pendiente`).
   - No indica la **Fecha de Emisión** del comprobante.
   - No incluye las **Observaciones generales del pedido** (`pedido.notes`) ni observaciones específicas de cada prenda (`it.notes`).
   - No incluye los datos formales de la empresa (RUT, dirección, teléfono de contacto).
   - El título dice *"Comprobante de Pedido"* en lugar de reflejar su carácter oficial de *"Comprobante de Venta & Taller"*.

2. **Impresión del Ticket (`ticket.generarTicketHTML` y estilos `@media print`):**
   - **Datos faltantes:**
     - No muestra el **Estado del Pedido / Taller** (`pedido.status`: Ej. `Confirmado`, `En producción`, `Listo para entrega`, `Cotización`).
     - Si el pedido no tiene descuento por volumen, IVA o delivery, se omiten el **Subtotal** y el **Neto**, pasando directo a Total sin desglose estructurado.
     - Si el cliente tiene RUT (`cliente.rut`) o dirección registrada (`cliente.address`), no se reflejan en el ticket.
   - **Problema de corte de impresión (Print Clipping / CSS):**
     - En Chromium/Chrome/Edge, cuando el pedido tiene varias prendas o excede la altura de una página, el diálogo se recorta o no salta de página por la presencia de `max-h-[92vh]`, `overflow: hidden/auto` y `max-width: 80mm` rígidos en los contenedores.
     - Falta la regla `break-inside: avoid; page-break-inside: avoid` en filas y bloques para garantizar una impresión íntegra y legible tanto en impresoras de rollo de 80mm como en hojas estándar A4/Carta o PDF.

---

## 2. Historias de Usuario

### HU-01: Comprobante de WhatsApp Completo y Transparente
**Como** vendedor o encargado de taller de Novaprint,  
**quiero** que al enviar el comprobante por WhatsApp al cliente o al equipo de taller,  
**para que** el mensaje incluya el desglose completo de prendas con sus precios unitarios, subtotales, código de bodega, subtotal bruto, descuentos, neto, IVA, delivery, abonos, saldos, estado de pago y observaciones técnicas.

### HU-02: Ticket de Impresión Completo y Sin Recortes
**Como** operador de taller o cliente en mesón,  
**quiero** que el ticket impreso incluya el estado de taller (`pedido.status`), datos del cliente (RUT, dirección si existen), desglose financiero completo (Subtotal y Neto siempre visibles) y estilos de impresión adaptables,  
**para que** el ticket no se corte, respete saltos de página fluidos y salga 100% completo en papel o PDF.

---

## 3. Requisitos Funcionales (Formato EARS)

### RF-01: Desglose Completo de Prendas en WhatsApp
- **Cuando** se genere el mensaje de WhatsApp mediante `sales.generarTextoWhatsApp(pedido, settings)`,
- **el sistema debe** listar cada prenda incluyendo:
  - Cantidad (`${it.quantity}x`)
  - Tipo de prenda (`${it.garmentType}`)
  - Código de inventario si existe (`[${it.inventoryCode}]`)
  - Talla y color (`(${it.size}, ${it.color})`)
  - Técnica y ubicación (`- ${it.technique} [${it.printLocation}]`)
  - Precio unitario y subtotal (`a ${precioUnit} = ${subtotalLinea}`)
  - Observaciones de la prenda si existen (`↳ Obs: ${it.notes}`).

### RF-02: Desglose Financiero Completo en WhatsApp
- **Cuando** se genere el texto de WhatsApp,
- **el sistema debe** incluir en el resumen financiero:
  - Total Prendas: `${totalQuantity} un.`
  - Subtotal: `${subtotalBruto}`
  - Descuento por Volumen (si aplica): `-${montoDescuento} (${porcentaje}%)`
  - Monto Neto: `${netAmount}`
  - IVA (19%) (si aplica): `+${montoIva}`
  - Delivery / Envío (si aplica): `+${montoDelivery}`
  - TOTAL A PAGAR: `${totalAmount}`
  - Monto Abonado: `${depositAmount}`
  - SALDO PENDIENTE: `${balanceAmount}`
  - Estado de Pago: `${paymentStatus}` (`Pagado Total`, `Abonado`, `Pendiente`).

### RF-03: Metadatos y Observaciones en WhatsApp
- **Cuando** el pedido posea observaciones (`pedido.notes`), fecha de emisión o datos del cliente/empresa,
- **el sistema debe** incluir:
  - Título: `👕 *${empresa}* — Comprobante de Venta & Taller`
  - N° Comprobante: `${pedido.id}`
  - Fecha de Emisión: `${fechaEmision}`
  - Compromiso Entrega: `${fechaEntrega}`
  - Estado de Taller: `${pedido.status}`
  - Cliente: `${clientName}` (con teléfono y RUT si están registrados)
  - Bloque `📝 *Observaciones / Taller:* ${pedido.notes}` si existe.
  - Pie con RUT, dirección y contacto de la empresa.

### RF-04: Estado de Taller y Datos Ampliados en Ticket Impreso
- **Cuando** se renderice `ticket.generarTicketHTML(pedido, settings)`,
- **el sistema debe** mostrar:
  - Estado de Taller destacado (`pedido.status`: Cotización, Confirmado, En producción, etc.).
  - RUT del cliente (`cliente.rut`) y dirección (`cliente.address`) si están disponibles en el pedido o en el catálogo de clientes.
  - Subtotal Bruto y Monto Neto siempre visibles en el resumen financiero, incluso cuando no apliquen descuentos, para transparencia comercial total.
  - Total de prendas, desglose de IVA, delivery, total, abono, saldo y estado de pago.

### RF-05: Eliminación de Recortes de Impresión (CSS `@media print`)
- **Cuando** el usuario imprima el ticket (`Ctrl+P` o botón "Imprimir Ticket"),
- **el sistema debe** asegurar en `assets/css/custom.css`:
  - Supresión de `max-height` y `overflow-y` que provoquen recortes de contenido.
  - Reglas `break-inside: avoid; page-break-inside: avoid` en filas de tabla y contenedores.
  - Ancho adaptable que garantice compatibilidad tanto con rollos de ticket térmico de 80mm como con impresoras de hoja suelta (A4/Carta) y exportación a PDF sin truncamiento.

---

## 4. Reglas de Negocio
1. **Cero regresiones en datos existentes:** Los pedidos históricos y fórmulas de cálculo de totales (`sales.calcularTotalesPedido`) permanecen 100% inalteradas.
2. **Respeto a retrocompatibilidad:** Si un pedido no tiene cliente registrado con RUT, dirección o notas, estos campos se omiten limpiamente sin mostrar `undefined` o espacios en blanco.
3. **Preservación de suites de prueba:** Las 40 suites preexistentes (353 pruebas) deben continuar pasando al 100%.

---

## 5. Criterios de Aceptación
- [ ] El mensaje de WhatsApp incluye precios unitarios, subtotales por prenda, códigos de inventario, subtotal bruto, neto, estado de pago, total de prendas y notas.
- [ ] El ticket impreso incluye el estado de taller (`pedido.status`), datos ampliados del cliente (RUT, dirección si existen) y subtotal/neto siempre presentes.
- [ ] La impresión no se corta en navegadores basados en Chromium ante pedidos extensos.
- [ ] 100% de pruebas pasando en `node --test tests/*.test.js`.
- [ ] `memory.md` actualizado y cambios confirmados en Git.
