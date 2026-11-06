# PLAN-014: Plan de Implementación de Edición y Eliminación de Compras

## 1. Arquitectura y Contratos de Funciones

### A. Capa de Persistencia (`assets/js/storage.js`)
1. **`getPurchaseById(id)`**:
   - Retorna el objeto compra con el ID dado o `null` si no existe.
2. **`savePurchase(purchaseData)`**:
   - Soporte para creación y edición:
     - Si `purchaseData.id` coincide con una compra existente:
       - Obtener `oldPurchase`.
       - Revertir en `novaprint_inventory` las cantidades de `oldPurchase.items`.
       - Aplicar en `novaprint_inventory` las cantidades y costos de `purchaseData.items`.
       - Reemplazar el registro en `novaprint_purchases` preservando `createdAt` y añadiendo `updatedAt`.
     - Si es nueva:
       - Crear ID, aplicar existencias a inventario, agregar con `unshift`.
3. **`deletePurchase(id)`**:
   - Localiza la compra.
   - Por cada ítem con `inventoryItemId`, descuenta `quantity` del stock (`Math.max(0, currentStock - item.quantity)`).
   - Filtra y guarda `novaprint_purchases`.
   - Guarda `novaprint_inventory`.
   - Retorna `true` si fue eliminada, `false` si no se encontró.
4. Exportar `getPurchaseById` y `deletePurchase` en el objeto público `NovaprintStorage`.

### B. Capa de Interfaz de Usuario (`assets/js/ui.js` e `index.html`)
1. **`index.html`**:
   - Añadir `<th class="py-3 px-3 text-right">Acciones</th>` a la tabla `#view-purchases`.
   - Añadir `<input type="hidden" id="purchase-id-hidden">` en `#form-purchase`.
   - Añadir identificadores a título `#purchase-modal-title`, subtítulo `#purchase-modal-subtitle` y botón `#btn-submit-purchase`.
2. **`assets/js/ui.js`**:
   - `renderPurchasesTable(compras)`:
     - Renderizar columnas con botones de acción:
       - `✏️` para `NovaprintUI.editarCompra(id)`
       - `🗑️` para `NovaprintUI.confirmarEliminarCompra(id)`
     - Si la lista está vacía, mostrar `<td colspan="7">`.
   - `editarCompra(purchaseId)`:
     - Obtener compra vía `storage.getPurchaseById(purchaseId)`.
     - Cargar `#purchase-id-hidden`, proveedor, fecha, factura, notas, IVA, delivery.
     - Cargar `currentPurchaseItems` y renderizar filas.
     - Cambiar textos del modal a modo edición.
     - Abrir `#dialog-purchase`.
   - `confirmarEliminarCompra(purchaseId)`:
     - Diálogo `confirm()`.
     - Llamar `storage.deletePurchase(purchaseId)`.
     - Notificar toast y llamar `global.NovaprintMain.refrescarDatos()`.
   - `abrirModalNuevaCompra()`:
     - Limpiar `#purchase-id-hidden`, restaurar título a *"Registrar Compra de Insumos"* y botón a *"📥 Ingresar Compra al Stock"*.
   - `guardarCompraDesdeFormulario()`:
     - Pasar `#purchase-id-hidden` en el payload de guardado si existe.
   - Exportar `editarCompra` y `confirmarEliminarCompra` en `NovaprintUI`.

---

## 2. Plan de Pruebas Unitarias
1. **`tests/storage.test.js`**:
   - Prueba: `getPurchaseById` recupera la compra correcta.
   - Prueba: `savePurchase` en modo edición ajusta el stock de inventario diferencialmente.
   - Prueba: `deletePurchase` revierte las existencias en inventario y elimina la compra.
2. **`tests/production.test.js`**:
   - Prueba: `renderPurchasesTable` genera los botones de acción (editar y eliminar) en cada fila.
