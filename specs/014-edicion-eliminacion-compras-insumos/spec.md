# SPEC-014: Acciones para Editar y Eliminar Compras de Insumos con Ajuste Automático de Inventario

## 1. Contexto y Justificación
En el taller de estampado textil Novaprint, el módulo **Compras de Insumos & Textiles** permite registrar compras a proveedores para aumentar automáticamente el stock en bodega de prendas lisas (poleras, polerones, buzos, gorras) e insumos de impresión (films DTF, poliamida, tintas, vinilos).

Hasta ahora, la tabla de compras solo permitía registrar nuevas compras y listar el historial de compras en modo solo lectura, sin botones de acción para editar datos erróneos (por ejemplo, corregir un número de factura, modificar cantidades recibidas o cambiar el costo unitario) ni para anular/eliminar compras duplicadas o devueltas al proveedor.

Esta especificación define la incorporación de las acciones de **Edición** (✏️) y **Eliminación** (🗑️) de compras, con sincronización automática y segura del inventario (reversión de existencias al eliminar o ajuste diferencial de stock al editar).

---

## 2. Requisitos Funcionales (Formato EARS)

### RF-01: Columna de Acciones en la Tabla de Compras
- **Ubicación:** En la tabla de compras (`#purchases-table-body`), añadir la columna `Acciones` alineada a la derecha.
- **Botones:** Para cada fila de compra, mostrar:
  1. `[✏️]` Botón para **Editar Compra** (`NovaprintUI.editarCompra(id)`).
  2. `[🗑️]` Botón para **Eliminar Compra** (`NovaprintUI.confirmarEliminarCompra(id)`).

### RF-02: Edición de Compra con Ajuste de Inventario
- **Carga de Datos:** Al pulsar `[✏️]`, se abre el diálogo `#dialog-purchase` en modo edición:
  - Título: *"Editar Compra de Insumos (ID)"*.
  - Campo oculto `#purchase-id-hidden` con el ID de la compra.
  - Precarga del proveedor, fecha, número de factura/boleta, observaciones, casilla de IVA (19%) y casilla/monto de Flete/Delivery.
  - Precarga de los ítems comprados (insumo, cantidad y costo unitario).
  - Botón de guardado: *"💾 Guardar Cambios de Compra"*.
- **Ajuste Diferencial en Inventario:**
  - Al guardar la edición, el sistema:
    1. Revertirá las cantidades de los ítems de la compra anterior en el inventario (`stock = stock - cantidadAnterior`).
    2. Aplicará las nuevas cantidades y costos en el inventario (`stock = stock + cantidadNueva`).
    3. Actualizará los totales financieros de la compra (subtotal neto, IVA, delivery y total).

### RF-03: Eliminación de Compra con Reversión de Stock
- **Confirmación:** Al pulsar `[🗑️]`, se despliega un diálogo de confirmación:
  > *"¿Eliminar la compra [ID]? Las existencias ingresadas al inventario se revertirán automáticamente."*
- **Reversión de Stock:**
  - Si el usuario confirma:
    1. Por cada ítem de la compra que tenga un `inventoryItemId`, se descuenta la cantidad comprada de `currentStock` (protegiendo que nunca baje de 0: `Math.max(0, currentStock - item.quantity)`).
    2. Se remueve la compra del listado persistente `novaprint_purchases`.
    3. Se guarda el inventario y las compras en `localStorage`.
    4. Se muestra notificación toast informativa: *"Compra [ID] eliminada y stock revertido."*
    5. Se refresca la interfaz completa.

---

## 3. Reglas de Negocio
1. **Conservación de Identificadores y Fechas Originales:** La edición preserva el `id` original de la compra y su marca temporal de creación `createdAt`, añadiendo la marca `updatedAt`.
2. **Protección de Stock No Negativo:** Si se elimina una compra y parte del stock ya fue consumido en órdenes de taller, el stock remanente se ajusta al valor no negativo más cercano (`Math.max(0, stock - qty)`).
3. **Cálculo Financiero Exacto:** Las compras editadas aplican las mismas fórmulas de la Spec 005: $\text{IVA} = 19\%$ y $\text{Total} = \text{Neto} + \text{IVA} + \text{Delivery}$.

---

## 4. Criterios de Aceptación
- [ ] La tabla de compras en `index.html` cuenta con cabecera `Acciones` y botones de editar y eliminar en cada fila.
- [ ] Al hacer clic en editar, se cargan todos los datos de la compra en el formulario.
- [ ] Al guardar la compra editada, los cambios persisten en `novaprint_purchases` y el inventario refleja el diferencial de existencias.
- [ ] Al eliminar una compra, se pide confirmación, se borra de la lista y se descuenta el stock previamente sumado.
- [ ] La suite de pruebas unitarias (`tests/`) incluye pruebas para `getPurchaseById`, edición de compra, eliminación con reversión de stock y renderizado de acciones.

