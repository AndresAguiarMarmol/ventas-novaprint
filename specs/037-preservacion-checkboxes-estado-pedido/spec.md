# Spec 037 — Preservación de Checkboxes (Desc. Volumen, IVA, Delivery) al Avanzar o Modificar Estado del Pedido

## 1. Contexto y Problema
En el flujo comercial y de taller de Novaprint, cada pedido (`novaprint_orders`) se cotiza y registra con tres opciones comerciales clave seleccionadas mediante checkboxes:
1. **Desc. Volumen** (`#form-apply-discount`): Si aplica la escala de descuentos por volumen del taller.
2. **Aplica IVA (19%)** (`#order-apply-iva`): Si la venta incluye débito fiscal chileno.
3. **Aplica Delivery / Envío** (`#order-apply-delivery`): Si la entrega incluye despacho o flete con su correspondiente monto (`deliveryAmount`).

### El Problema Identificado:
1. **Persistencia y Restauración en Edición / Formulario (`editarPedido`):**
   - Al abrir un pedido para **"Modificar Estado"** a través del formulario de pedido (`NovaprintUI.editarPedido(id)` cambiando `#order-status-select`), el sistema restauraba `totals.applyIva` y `totals.applyDelivery`, pero **no restauraba el estado del checkbox `#form-apply-discount`** desde los totales persistidos (`totals.applyDiscount` o `totals.volumeDiscountAmount > 0` o `totals.volumeDiscountPercent > 0`).
   - Por defecto, `#form-apply-discount` permanecía en su valor por defecto de nuevo pedido (`checked = true`), lo que alteraba involuntariamente la decisión previa del vendedor si este había desmarcado el descuento.
2. **Preservación Incondicional en Transición de Estados:**
   - Al **"Avanzar"** de estado rápidamente desde la tarjeta Kanban / lista (`NovaprintUI.cambiarEstado(orderId, nuevoEstado)` que invoca `storage.updateOrderStatus(id, newStatus)`):
     - `orders[idx].status` se actualiza al nuevo estado operativo (`Confirmado`, `En producción`, `Listo para entrega`, `Entregado`).
     - Se debe garantizar que bajo ninguna circunstancia se alteren, recalculen a la fuerza ni sobreescriban los campos `totals.applyDiscount`, `totals.applyIva`, `totals.applyDelivery` ni los montos de `volumeDiscountAmount`, `ivaAmount` y `deliveryAmount`.
3. **Modal Rápido de Cambio de Estado (`#dialog-change-order-status`):**
   - Al invocar `NovaprintUI.seleccionarNuevoEstado(orderId, nuevoEstado)` desde el modal de cambio rápido de estado, debe mantenerse intacta la configuración original del pedido.

El usuario solicita explícitamente:
> *"Coordinator , Al "Avanzar" o "Modificar Estado del Pedido", no cambiar las selecciones (Check Box) de : 1.- Desc. Volumen 2.- Aplica IVA 3.- Aplica Delivery/Envio . Procesar usando metodologia sdd. No mofificar nada adicional"*

---

## 2. Historias de Usuario
- **HU-01 (Preservación al Editar/Modificar Estado vía Formulario):** Como vendedor o administrador, al abrir un pedido existente mediante `editarPedido(id)` para cambiar su estado (o cualquier otro dato), quiero que los 3 checkboxes (`Desc. Volumen`, `Aplica IVA` y `Aplica Delivery/Envío`) reflejen fielmente el estado con el que el pedido fue guardado, sin reestablecer ninguno a valores por defecto.
- **HU-02 (Preservación al Avanzar Estado Directamente):** Como jefe de taller, al presionar `Avanzar ➔` en el Kanban o tabla, o al cambiar el estado desde el modal rápido `Modificar Estado`, quiero que el pedido mantenga exactamente sus totales, IVA, descuento por volumen y delivery intactos.
- **HU-03 (Preservación en Duplicar Pedido):** Como usuario, al duplicar un pedido, también quiero que las 3 selecciones del pedido original se copien fielmente.
- **HU-04 (No Regresión):** Ninguna otra funcionalidad, vista ni cálculo contable debe ser alterado ("No modificar nada adicional").

---

## 3. Requisitos del Sistema (Formato EARS)

### Requisitos Ubicuos (En todo momento)
- **EARS-U-01:** La función `sales.calcularTotalesPedido` DEBERÁ registrar explícitamente en el objeto `totals` el atributo booleano `applyDiscount: Boolean(aplicarDescuentoVolumen)` (además de `applyIva` y `applyDelivery`).

### Requisitos Conducidos por Eventos (When / Cuando)
- **EARS-E-01 (Cargar en Edición de Pedido):** CUANDO se invoque `NovaprintUI.editarPedido(orderId)`, el sistema DEBERÁ leer del pedido original:
  - `applyDiscount`: Evaluado como `pedido.totals?.applyDiscount !== undefined ? Boolean(pedido.totals.applyDiscount) : (pedido.totals?.volumeDiscountAmount > 0 || (pedido.totals?.volumeDiscountPercent > 0 && pedido.totals?.subtotalBruto > 0))`.
  - `applyIva`: Evaluado como `Boolean(pedido.totals?.applyIva)`.
  - `applyDelivery`: Evaluado como `Boolean(pedido.totals?.applyDelivery || (pedido.totals?.deliveryAmount > 0))`.
  Y DEBERÁ asignar esos valores booleanos a los checkboxes `#form-apply-discount`, `#order-apply-iva` y `#order-apply-delivery`.
- **EARS-E-02 (Cargar en Duplicar Pedido):** CUANDO se invoque `NovaprintUI.duplicarPedido(orderId)`, el sistema DEBERÁ preservar los 3 checkboxes con los mismos valores del pedido origen.
- **EARS-E-03 (Avanzar / Modificar Estado Rápido):** CUANDO se ejecute `NovaprintUI.cambiarEstado(orderId, nuevoEstado)` o `NovaprintUI.seleccionarNuevoEstado(orderId, nuevoEstado)`, el sistema DEBERÁ actualizar única y exclusivamente el campo `status` (y `deliveredAt` / `updatedAt` si aplica), preservando el 100% de los atributos de `totals` (`applyDiscount`, `applyIva`, `applyDelivery`, `deliveryAmount`, `ivaAmount`, `volumeDiscountAmount`).

---

## 4. Criterios de Aceptación
1. Al editar un pedido que fue guardado sin descuento por volumen (`applyDiscount: false`), el checkbox `#form-apply-discount` permanece desmarcado (`checked = false`).
2. Al editar un pedido que fue guardado con descuento por volumen (`applyDiscount: true`), el checkbox `#form-apply-discount` permanece marcado (`checked = true`).
3. Al editar un pedido con IVA o Delivery activo/inactivo, los checkboxes `#order-apply-iva` y `#order-apply-delivery` (y el input de delivery) reflejan exactamente los valores guardados.
4. Al hacer clic en `Avanzar ➔` o cambiar estado desde `#dialog-change-order-status`, las propiedades `applyDiscount`, `applyIva`, `applyDelivery`, montos y saldos del pedido en almacenamiento permanecen inalterados.
5. El 100% de las 29 suites de pruebas unitarias existentes continúan pasando, y se añade una nueva suite para verificar la preservación de los 3 checkboxes.

