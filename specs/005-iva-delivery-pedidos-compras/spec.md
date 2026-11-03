# Spec 005 — IVA y Delivery en Pedidos y Compras de Insumos

## 1. Qué y Por Qué
En Chile, la legislación tributaria (D.L. 825) establece una tasa del **19% de Impuesto al Valor Agregado (IVA)** tanto para ventas con boleta/factura como para compras de insumos a proveedores con factura comercial.
Asimismo, en la operación diaria del taller **Novaprint**:
1. No todas las operaciones llevan IVA obligatorio o el cliente puede solicitar cotización neta o con boleta/factura, por lo que el sistema debe consultar explícitamente si aplica IVA (19%) en cada pedido y en cada compra.
2. Tanto los pedidos de clientes como las compras a proveedores pueden incurrir en costos de **Delivery / Flete de despacho**, el cual debe ser opcional, preguntar si aplica y venir con valor por defecto en **$0** para no recargar costos innecesariamente.

Esta especificación estandariza el cálculo financiero tributario y logístico en ambos extremos: **Ventas (Pedidos)** y **Producción (Compras)**.

---

## 2. Historias de Usuario
- **US-01 (IVA y Delivery en Ventas):** Como encargado de ventas, deseo indicar si un pedido lleva IVA (19%) y si requiere despacho a domicilio (Delivery), para entregarle al cliente un presupuesto claro y cobrar el saldo exacto.
- **US-02 (IVA y Delivery en Compras):** Como encargado de compras, al registrar una factura de insumos deseo marcar si los precios son netos con IVA adicional y si el proveedor cobró flete/delivery, para que el costo total de la compra coincida al centavo con la factura física.
- **US-03 (Comprobantes y WhatsApp):** Como cliente, deseo ver en mi ticket físico y mensaje de WhatsApp el detalle claro de Neto, IVA (si aplica) y Delivery (si aplica).

---

## 3. Requisitos Funcionales en formato EARS

### Requisitos Ubicuos (Ubiquitous)
- **REQ-01:** La tasa de IVA DEBE ser exactamente del **19%** según la legislación chilena vigente.
- **REQ-02:** El campo de Delivery DEBE iniciar por defecto en **$0** tanto en pedidos como en compras.
- **REQ-03:** En todo momento, el sistema DEBE preguntar si aplica IVA y si aplica Delivery mediante casillas interactivas en los formularios correspondientes.

### Requisitos Conducidos por Eventos (Event-Driven)
- **REQ-04:** CUANDO el usuario active o desactive la casilla "¿Aplica IVA (19%)?", el sistema DEBE recalcular inmediatamente el impuesto sobre la base neta:
  $$\text{IVA} = \begin{cases} \text{round}(\text{Neto} \times 0.19) & \text{si aplica} \\ 0 & \text{si no aplica} \end{cases}$$
- **REQ-05:** CUANDO el usuario active "¿Aplica Delivery?" e ingrese un monto de despacho, el sistema DEBE sumarlo al total final:
  $$\text{Total} = \text{Neto} + \text{IVA} + \text{Delivery}$$
- **REQ-06:** CUANDO se emita el ticket impreso o mensaje de WhatsApp de un pedido con IVA o Delivery, el sistema DEBE desglosarlos explícitamente en el resumen financiero.

---

## 4. Reglas de Negocio
1. **Base Imponible en Ventas:** El IVA se calcula sobre el valor neto de las prendas después de aplicar el descuento por volumen (si este estuviese activo).
2. **Delivery no imponible o adicional:** El costo de flete/delivery se añade como costo de servicio logístico al total general a pagar.
3. **Persistencia Transparente:** Tanto pedidos como compras guardan `applyIva`, `ivaPercent (19)`, `ivaAmount`, `applyDelivery`, `deliveryAmount` y `totalAmount`.

