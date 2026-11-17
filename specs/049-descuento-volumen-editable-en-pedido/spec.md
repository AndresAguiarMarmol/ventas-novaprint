# Especificación Técnica — Spec 049: Descuento por Volumen Visible y Editable en Pedidos

## 1. Contexto y Propósito
En el formulario de pedidos (`#dialog-order`), el descuento por volumen no se presentaba de forma visible cuando el porcentaje sugerido era 0% (se ocultaba con clase `hidden`), y cuando aparecía era un texto fijo no editable.
El usuario solicitó:
- Modificar el formulario de pedidos para que el Descuento por Volumen se presente siempre de manera visible y clara.
- Hacer que el descuento sea **Editable** por el vendedor (permitiendo ajustar el porcentaje de descuento sugerido o ingresar uno personalizado).
- Que el descuento se aplique efectivamente al cálculo del pedido **en caso de ser aceptado por el vendedor** mediante una casilla de verificación.
- Mantener intactos los datos existentes, las fórmulas de IVA (19%) y Delivery, y la retrocompatibilidad con las 346 pruebas del proyecto.

---

## 2. Historias de Usuario

### HU-01: Visualización y Edición del Descuento en Pedidos
**Como** vendedor o cotizador en el taller Novaprint,  
**Quiero** ver siempre en la sección financiera del pedido el campo de Descuento por Volumen con el porcentaje sugerido según la escala, y poder editar dicho porcentaje,  
**Para** ofrecer promociones especiales, acuerdos comerciales directos o aplicar la escala estándar de forma transparente.

### HU-02: Control de Aplicación por Aceptación del Vendedor
**Como** vendedor,  
**Quiero** activar o desactivar la aplicación del descuento mediante una casilla interactiva (`[x] ¿Aplica Descuento?`),  
**Para** decidir explícitamente si se otorga el descuento al cliente en la cotización o si se cobra a precio regular de lista.

---

## 3. Requisitos Funcionales (Formato EARS)

### Ubiquitous (Siempre activo)
- **RF-01:** En `index.html`, la sección financiera del pedido (`#dialog-order`) DEBE presentar de manera visible el bloque de Descuento por Volumen con:
  - Una casilla de verificación para aceptación del vendedor: `#form-apply-discount` (`[x] ¿Aplica Descuento por Volumen?`).
  - Un campo numérico editable para el porcentaje de descuento: `#form-discount-percent-input` (`<input type="number" min="0" max="100">`).
  - El monto en pesos deducido: `#form-discount-amount` (`-$X.XXX`).
- **RF-02:** Al agregar, eliminar o cambiar cantidades de prendas en el pedido:
  - El sistema DEBE sugerir automáticamente el porcentaje de la escala de volumen según el total de prendas en `#form-discount-percent-input` (a menos que el vendedor lo haya editado manualmente para el pedido en curso).
- **RF-03:** Si la casilla `#form-apply-discount` está marcada (aceptado por el vendedor):
  - El descuento se DEBE aplicar sobre el Subtotal Bruto: $\text{Monto Descuento} = \text{round}(\text{Subtotal Bruto} \times \text{Porcentaje} / 100)$.
  - El Neto imponible DEBE ser: $\text{Neto} = \text{Subtotal Bruto} - \text{Monto Descuento}$.
- **RF-04:** Si la casilla `#form-apply-discount` está desmarcada (no aceptado):
  - El descuento aplicado DEBE ser `$0`, y el Neto DEBE ser igual al Subtotal Bruto.
- **RF-05:** En `assets/js/sales.js`, `calcularTotalesPedido` DEBE aceptar opcionalmente `porcentajeDescuento` (o `customDiscountPercent`) en las opciones, respetando el porcentaje ingresado por el vendedor si se provee.

---

## 4. Reglas de Negocio
- **RN-01 (Inmutabilidad de Datos Previos):** Los pedidos históricos almacenados en `novaprint_orders` conservan sus importes y descuentos previamente calculados.
- **RN-02 (Alineación con IVA y Delivery):** El IVA (19%) se calcula siempre sobre el Neto final resultante tras aplicar (o no) el descuento. El Delivery se suma posteriormente al total.
- **RN-03 (Edición Controlada):** El porcentaje de descuento no puede ser negativo ni superior al 100% (`0` a `100%`).

---

## 5. Criterios de Aceptación
1. En `#dialog-order`, el bloque de Descuento por Volumen se muestra con casilla interactiva de aceptación y un input numérico editable para el porcentaje.
2. Al cambiar el porcentaje en el input, el monto descontado y el total del pedido se recalculan en tiempo real.
3. Si la casilla está marcada, el descuento se descuenta del subtotal; si está desmarcada, el descuento es $0.
4. Al guardar el pedido, el porcentaje y monto de descuento se persisten fielmente en `pedido.totals`.
5. El 100% de las suites de prueba (39+ suites, 346+ pruebas) pasan sin fallos ni regresiones.
