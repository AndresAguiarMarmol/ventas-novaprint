# Plan Técnico — Spec 035: CRUD Completo y Acción Duplicar en Libro Diario

## 1. Arquitectura de Componentes y Flujos de Datos

### A. Estructura de Asientos en el Libro Diario
Cada asiento `a` generado por `accounting.generarLibroDiario` contiene:
- `a.id`: ID del asiento contable (`AS-NP-...`, `AS-CMP-...`, `AS-EXP-...`, `AS-TRF-...`).
- `a.referenciaId`: Identificador único de la entidad subyacente (`NP-XXXXX`, `CMP-XXXXX`, `EXP-XXXXX`, `TRF-XXXXX`).
- `a.tipo`: Tipo de movimiento (`'VENTA'`, `'COMPRA'`, `'GASTO'`, `'TRANSFERENCIA'`).

### B. Mapeo de Acciones por Tipo de Movimiento

| Tipo de Movimiento | Prefijo / Detección | Editar `[✏️]` | Duplicar `[📋]` | Eliminar `[🗑️]` |
| :--- | :--- | :--- | :--- | :--- |
| **Venta / Pedido** | `a.tipo === 'VENTA'` o `a.referenciaId.startsWith('NP-')` | `NovaprintUI.editarPedido(refId)` | `NovaprintUI.duplicarPedido(refId)` | `NovaprintUI.confirmarEliminarPedido(refId)` |
| **Compra a Proveedor** | `a.tipo === 'COMPRA'` o `a.referenciaId.startsWith('CMP-')` | `NovaprintUI.editarCompra(refId)` | `NovaprintUI.duplicarCompra(refId)` | `NovaprintUI.confirmarEliminarCompra(refId)` |
| **Gasto Operacional** | `a.tipo === 'GASTO'` o `a.referenciaId.startsWith('EXP-')` | `NovaprintUI.editarGasto(refId)` | `NovaprintUI.duplicarGasto(refId)` | `NovaprintUI.confirmarEliminarGasto(refId)` |
| **Transferencia Contable** | `a.tipo === 'TRANSFERENCIA'` o `a.referenciaId.startsWith('TRF-')` | `NovaprintUI.editarTransferencia(refId)` | `NovaprintUI.duplicarTransferencia(refId)` | `NovaprintUI.confirmarEliminarTransferencia(refId)` |

---

## 2. Cambios Requeridos en `assets/js/ui.js`

### 1. `renderAccountingJournal(asientos = [], sales)`
Reemplazar la actual generación condicional de acciones en las líneas 3441-3453 por un generador de botones unificado:
```javascript
const refId = a.referenciaId || '';
const isOrder = a.tipo === 'VENTA' || refId.startsWith('NP-');
const isPurchase = a.tipo === 'COMPRA' || refId.startsWith('CMP-');
const isExpense = a.tipo === 'GASTO' || refId.startsWith('EXP-') || a.id.startsWith('AS-EXP-');
const isTransfer = a.tipo === 'TRANSFERENCIA' || refId.startsWith('TRF-') || a.id.startsWith('AS-TRF-');

let editFn = '';
let dupFn = '';
let delFn = '';
let editTitle = 'Editar';
let dupTitle = 'Duplicar';
let delTitle = 'Eliminar';

if (isOrder) {
  editFn = `NovaprintUI.editarPedido('${refId}')`;
  dupFn = `NovaprintUI.duplicarPedido('${refId}')`;
  delFn = `NovaprintUI.confirmarEliminarPedido('${refId}')`;
  editTitle = 'Editar Pedido de Venta';
  dupTitle = 'Duplicar Pedido de Venta';
  delTitle = 'Eliminar Pedido';
} else if (isPurchase) {
  editFn = `NovaprintUI.editarCompra('${refId}')`;
  dupFn = `NovaprintUI.duplicarCompra('${refId}')`;
  delFn = `NovaprintUI.confirmarEliminarCompra('${refId}')`;
  editTitle = 'Editar Compra a Proveedor';
  dupTitle = 'Duplicar Compra a Proveedor';
  delTitle = 'Eliminar Compra';
} else if (isExpense) {
  editFn = `NovaprintUI.editarGasto('${refId}')`;
  dupFn = `NovaprintUI.duplicarGasto('${refId}')`;
  delFn = `NovaprintUI.confirmarEliminarGasto('${refId}')`;
  editTitle = 'Editar Gasto Operacional';
  dupTitle = 'Duplicar Gasto Operacional';
  delTitle = 'Eliminar Gasto';
} else if (isTransfer) {
  editFn = `NovaprintUI.editarTransferencia('${refId}')`;
  dupFn = `NovaprintUI.duplicarTransferencia('${refId}')`;
  delFn = `NovaprintUI.confirmarEliminarTransferencia('${refId}')`;
  editTitle = 'Editar Transferencia Contable';
  dupTitle = 'Duplicar Transferencia Contable';
  delTitle = 'Eliminar Transferencia';
}
```
Y renderizar en la columna de acciones:
```html
<td class="py-2.5 px-3 text-right whitespace-nowrap">
  <div class="inline-flex items-center gap-1 justify-end">
    <button type="button" class="p-1 text-gray-500 hover:text-gray-800 rounded transition cursor-pointer" title="${editTitle}" onclick="${editFn}">
      ✏️
    </button>
    <button type="button" class="p-1 text-blue-600 hover:text-blue-800 rounded transition cursor-pointer" title="${dupTitle}" onclick="${dupFn}">
      📋
    </button>
    <button type="button" class="p-1 text-red-500 hover:text-red-700 rounded transition cursor-pointer" title="${delTitle}" onclick="${delFn}">
      🗑️
    </button>
  </div>
</td>
```

### 2. Nuevas Funciones en `ui.js`:
- `editarGasto(gastoId)`:
  - Carga el gasto mediante `storage.getExpenseById(gastoId)`.
  - Llena `#expense-id-hidden` con `gasto.id`.
  - Precarga fecha, categoría, descripción, monto, método de pago y notas en `#dialog-expense`.
  - Actualiza el título del modal a `'Editar Gasto de Taller'`.
  - Abre el modal `#dialog-expense`.
- `duplicarGasto(gastoId)`:
  - Carga el gasto original.
  - Limpia `#expense-id-hidden` (`value = ''`).
  - Establece la fecha de hoy.
  - Precarga categoría, descripción añadiendo `(Copia)`, monto, método de pago y notas.
  - Actualiza el título del modal a `'Duplicar Gasto de Taller'`.
  - Abre el modal `#dialog-expense`.
- `editarTransferencia(transferId)`:
  - Carga la transferencia mediante `storage.getTransferById(transferId)`.
  - Llena `#transfer-id-hidden` con `trf.id`.
  - Precarga fecha, cuentas origen/destino, monto, descripción y referencia en `#dialog-transfer`.
  - Actualiza título del modal a `'Editar Transferencia entre Cuentas'`.
  - Ejecuta `actualizarPreviewTransferencia()` y abre el modal `#dialog-transfer`.
- `duplicarTransferencia(transferId)`:
  - Carga la transferencia original.
  - Limpia `#transfer-id-hidden` (`value = ''`).
  - Establece fecha de hoy.
  - Precarga cuentas origen/destino, monto, descripción añadiendo `(Copia)` y referencia.
  - Actualiza título a `'Duplicar Transferencia entre Cuentas'`.
  - Ejecuta `actualizarPreviewTransferencia()` y abre `#dialog-transfer`.
- `duplicarPedido(orderId)`:
  - Carga el pedido mediante `storage.getOrderById(orderId)`.
  - Abre `#dialog-order` mediante `abrirModalPedido()`.
  - Clona los ítems, tallas, colores, técnicas, cliente seleccionado y valores.
  - Limpia el campo oculto de ID del pedido para que se genere un nuevo `NP-...` correlativo al guardar.
  - Establece fecha de entrega sugerida y fecha de hoy.
  - Muestra un toast informativo indicando que el pedido ha sido clonado y está listo para revisar y guardar.
- `duplicarCompra(purchaseId)`:
  - Carga la compra mediante `storage.getPurchaseById(purchaseId)`.
  - Abre `#dialog-purchase` mediante `abrirModalCompra()`.
  - Clona proveedor seleccionado, ítems, cantidades, costos, banderas de IVA y Delivery.
  - Limpia el ID oculto de la compra y sugiere factura `FAC-COPIA` o vacía.
  - Establece fecha de hoy.
  - Muestra un toast informativo indicando que la compra ha sido clonada y está lista para guardar.

### 3. Exposición en `NovaprintUI`
Exportar en el objeto público de `NovaprintUI`:
- `editarGasto`
- `duplicarGasto`
- `editarTransferencia`
- `duplicarTransferencia`
- `duplicarPedido`
- `duplicarCompra`

---

## 3. Plan de Pruebas Automatizadas
Crear `tests/journal_crud_duplicate.test.js`:
1. **Renderizado de Botones CRUD + Duplicar:** Verificar que cada fila de Venta, Compra, Gasto y Transferencia genera exactamente los botones `[✏️]`, `[📋]` y `[🗑️]` con las funciones de invocación correctas.
2. **Edición y Carga de Modales:**
   - `editarGasto` carga valores y el ID existente en `#dialog-expense`.
   - `editarTransferencia` carga valores y el ID existente en `#dialog-transfer`.
3. **Duplicación sin ID previo:**
   - `duplicarGasto` deja `#expense-id-hidden` vacío y conserva datos con sufijo `(Copia)`.
   - `duplicarTransferencia` deja `#transfer-id-hidden` vacío y conserva datos con sufijo `(Copia)`.
   - `duplicarPedido` y `duplicarCompra` clonan los ítems y restablecen el identificador para nueva creación.
4. **Prueba de Regresión:** Ejecutar las 27 suites existentes para verificar 0 efectos colaterales.

