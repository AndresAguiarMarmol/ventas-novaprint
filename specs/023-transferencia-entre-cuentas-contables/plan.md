# Plan de Implementación — Spec 023: Transferencia entre Cuentas Contables

## 1. Arquitectura de Datos

### Estructura de Entidad: `Transfer` (`novaprint_transfers`)
```javascript
{
  id: "TRF-M1ABCDE-1234",          // Identificador único generado
  date: "2026-11-10",             // Fecha de la operación YYYY-MM-DD
  sourceAccountId: "ACC-1101",     // ID de cuenta origen
  sourceAccountCode: "1101",       // Código de cuenta origen
  sourceAccountName: "Caja y Bancos (Disponible)", // Nombre de cuenta origen
  destinationAccountId: "ACC-1105",// ID de cuenta destino
  destinationAccountCode: "1105",  // Código de cuenta destino
  destinationAccountName: "Caja Chica Taller", // Nombre de cuenta destino
  amount: 50000,                   // Monto en CLP (> 0)
  description: "Traspaso fondos a caja chica", // Glosa/motivo
  reference: "Transf. #77812",     // Comprobante o referencia opcional
  createdAt: "2026-11-10T14:30:00.000Z"
}
```

## 2. Contratos y Módulos de Código

### A. `assets/js/accounting.js`
1. **Validación de Transferencia:**
   ```javascript
   function validarTransferenciaContable(transferData, accounts = [])
   ```
   - Retorna `{ valido: boolean, errores: string[], datosNormalizados: object }`.
   - Verifica: campos requeridos, `sourceAccountId !== destinationAccountId`, `amount > 0`, fecha válida.
2. **Generación de Asientos en `generarLibroDiario`:**
   ```javascript
   function generarLibroDiario(pedidos = [], compras = [], gastos = [], transferencias = [])
   ```
   - Si `transferencias` contiene elementos, mapea cada transferencia a un asiento con `tipo: 'Transferencia'`, `cuentaDebe: destinationAccountName`, `debe: amount`, `cuentaHaber: sourceAccountName`, `haber: amount`.

### B. `assets/js/storage.js`
1. Constante:
   ```javascript
   STORAGE_KEYS.TRANSFERS = 'novaprint_transfers';
   ```
2. Métodos CRUD:
   - `getTransfers()`
   - `getTransferById(id)`
   - `saveTransfer(transferData)`
   - `deleteTransfer(id)`
3. Métodos de integración:
   - `exportBackup`: incluye `transfers: getTransfers()`.
   - `importBackup`: deserializa y guarda `novaprint_transfers`.
   - `clearAllData`: limpia `novaprint_transfers`.
4. Exportación en objeto global `NovaprintStorage`.

### C. `index.html`
1. Botón `#btn-new-transfer` en cabecera contable (línea ~599), ubicado junto a `#btn-new-expense`.
2. Diálogo modal `<dialog id="dialog-transfer">` con formulario `#form-transfer`, selectores `#transfer-source-account` y `#transfer-destination-account`, campos `#transfer-date`, `#transfer-amount`, `#transfer-description`, `#transfer-reference`, contenedor de preview de partida doble `#transfer-double-entry-preview`, botón cancelar y botón `#btn-submit-transfer`.
3. Opción `<option value="Transferencia">Transferencias entre Cuentas</option>` en `#acc-journal-filter-type`.

### D. `assets/js/ui.js` y `assets/js/main.js`
1. Funciones en `NovaprintUI`:
   - `abrirModalTransferencia()`: puebla selectores de cuentas con `NovaprintStorage.getAccounts()`, inicializa fecha de hoy y monto vacío, y abre `<dialog id="dialog-transfer">`.
   - `actualizarPreviewTransferencia()`: recalcula dinámicamente la partida doble (Debe / Haber) mostrada en el modal.
   - `guardarTransferenciaDesdeFormulario(e)`: valida y guarda vía `NovaprintStorage.saveTransfer`, muestra toast de éxito y refresca contabilidad (`refrescarContabilidad`).
   - `confirmarEliminarTransferencia(transferId)`: solicita confirmación nativa `confirm(...)`, elimina vía `NovaprintStorage.deleteTransfer` y refresca el Libro Diario.
2. Actualización de `renderAccountingModule` y `refrescarContabilidad` para consultar `storage.getTransfers()` y suministrarlo a `generarLibroDiario`.
3. Actualización de `renderAccountingJournal` para renderizar el badge `Transferencia` y el botón `[🗑️]` de eliminación para transferencias manuales.
4. Escuchadores de eventos en `assets/js/main.js`.

## 3. Estrategia de Pruebas
Crear `tests/transfers_between_accounts.test.js`:
- Validación de datos de transferencia (campos vacíos, misma cuenta origen y destino, monto $\le 0$).
- Persistencia CRUD en `storage.js` (`getTransfers`, `saveTransfer`, `deleteTransfer`).
- Inclusión de transferencias en Libro Diario (`generarLibroDiario`) con cuadratura estricta Debe = Haber.
- Respaldo y restauración (`exportBackup` / `importBackup`).
- Ejecución completa del suite global (`node --test tests/*.test.js`) asegurando 0 regresiones.

