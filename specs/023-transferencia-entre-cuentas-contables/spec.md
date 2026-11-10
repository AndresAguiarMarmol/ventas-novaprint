# Spec 023 — Transferencia entre Cuentas Contables

Estado: implementada

## 1. Contexto y Problema
En las especificaciones previas (Spec 018, Spec 019 y Spec 022), **Novaprint** implementó su Módulo de Contabilidad con Plan de Cuentas dinámico (Activos, Pasivos, Capital, Ingresos y Egresos), Balance General, Estado de Resultados, Libro Diario enlazado y operaciones CRUD para cuentas contables.

Sin embargo, en la operación diaria del taller textil existen movimientos financieros y reclasificaciones que no corresponden a una venta a cliente ni a una compra de insumos a proveedor o gasto directo de taller, sino a **traspasos y transferencias de dinero entre cuentas contables**, tales como:
- Traspaso de fondos desde la cuenta bancaria principal (`1101 Caja y Bancos`) a una caja chica física (`1105 Caja Chica`) para pagos menores.
- Depósito o recaudación de efectivo de caja chica en la cuenta bancaria corriente.
- Inyección de fondos por aportes de capital de socios (`3101 Capital y Aportes`) hacia la cuenta bancaria disponible (`1101 Caja y Bancos`).
- Pago o abono directo a deudas u obligaciones con proveedores (`2101 Cuentas por Pagar Proveedores`) desde la cuenta de banco (`1101 Caja y Bancos`).
- Movimientos internos entre cuentas de activos, pasivos o patrimonio sin duplicar ingresos ni gastos operacionales.

Se requiere incorporar en la cabecera del Módulo de Contabilidad, **junto al botón "Registrar Gasto"**, un botón dedicado para **"Transferir entre Cuentas"**, el cual desplegará un modal interactivo que permita seleccionar la cuenta de origen, la cuenta de destino, el monto, la fecha, una glosa/descripción y número de comprobante, registrando el asiento contable balanceado en el Libro Diario y actualizando la persistencia local.

## 2. Historias de Usuario
- **Como administrador del taller**, quiero disponer de un botón visible junto a "Registrar Gasto" en el módulo contable para registrar de forma rápida transferencias y traspasos entre mis cuentas contables.
- **Como contador / operador financiero**, quiero seleccionar la cuenta de origen y la cuenta de destino desde el Plan de Cuentas oficial, garantizando que el sistema valide que no se transfiera a la misma cuenta y que el monto sea positivo.
- **Como encargado de taller**, quiero que las transferencias generen automáticamente su asiento de partida doble en el Libro Diario (Debe en cuenta destino, Haber en cuenta origen) y que se reflejen en los reportes y balances contables.
- **Como usuario**, quiero poder filtrar en el Libro Diario las transferencias y, en caso de error, tener la opción de eliminar una transferencia registrada.

## 3. Requisitos Funcionales (Formato EARS)

### [REQ-023-1] Botón de Acción en Cabecera Contable (`index.html`)
- **El sistema** debe ubicar un botón `#btn-new-transfer` en la cabecera de la sección `#view-accounting`, inmediatamente contiguo (junto) al botón `#btn-new-expense` ("+ Registrar Gasto").
- **El botón** debe presentar el texto `⇄ Transferir entre Cuentas` (o variante clara con ícono), con estilo consistente con la estética visual de la aplicación.
- **Al hacer clic en el botón**, el sistema debe abrir el diálogo modal `<dialog id="dialog-transfer">`.

### [REQ-023-2] Diálogo Modal de Transferencia (`<dialog id="dialog-transfer">`)
- **El sistema** debe incluir un diálogo nativo accesible con:
  - Título claro: "Transferencia entre Cuentas Contables".
  - Campo Fecha (`#transfer-date`): selector de fecha requerido, con valor por defecto la fecha actual (`YYYY-MM-DD`).
  - Selector Cuenta Origen (`#transfer-source-account`): lista desplegable cargada dinámicamente con las cuentas activas del Plan de Cuentas (`NovaprintStorage.getAccounts()`), mostrando código y nombre (ej. `1101 - Caja y Bancos (Disponible)`).
  - Selector Cuenta Destino (`#transfer-destination-account`): lista desplegable cargada dinámicamente con las cuentas activas del Plan de Cuentas.
  - Campo Monto (`#transfer-amount`): entrada numérica requerida, mayor a 0 (`min="1"`, `step="any"`).
  - Campo Glosa / Descripción (`#transfer-description`): texto descriptivo de la operación (ej. "Traspaso a Caja Chica Taller", "Aporte de capital a cuenta bancaria").
  - Campo N° Referencia / Comprobante (`#transfer-reference`): texto opcional (ej. "Transf. #98124").
  - Panel visual de Partida Doble en tiempo real que muestre:
    - **Debe (Cargo):** Cuenta Destino +$Monto.
    - **Haber (Abono):** Cuenta Origen -$Monto.
    - Indicador de ecuación balanceada ($\sum \text{Debe} = \sum \text{Haber}$).
  - Botones de acción: "Cancelar" y "Confirmar Transferencia" (`#btn-submit-transfer`).

### [REQ-023-3] Validaciones de Negocio (`accounting.js` y `ui.js`)
- **Cuando el usuario intente guardar una transferencia:**
  - El sistema debe verificar que la cuenta de origen y la de destino sean obligatorias y no sean idénticas (`sourceAccountId !== destinationAccountId`).
  - El monto debe ser un número estrictamente mayor que cero ($> 0$).
  - La fecha debe ser una fecha válida.
  - Si alguna validación falla, debe alertar amigablemente al usuario sin cerrar el formulario ni persistir datos incorrectos.

### [REQ-023-4] Capa de Persistencia y CRUD (`storage.js`)
- **El sistema** debe almacenar las transferencias en la clave `STORAGE_KEYS.TRANSFERS = 'novaprint_transfers'` de `localStorage`.
- **El sistema** debe exponer en `NovaprintStorage`:
  - `getTransfers()`: retorna el listado de transferencias registradas (ordenadas cronológicamente).
  - `getTransferById(id)`: retorna la transferencia solicitada o `null`.
  - `saveTransfer(transferData)`: genera ID único `TRF-...`, timestamp `createdAt`, persiste la transferencia y retorna el objeto creado.
  - `deleteTransfer(id)`: elimina la transferencia especificada.
- **Las funciones de respaldo `exportBackup` e `importBackup`** deben incluir íntegramente la clave `transfers`.
- **La función `clearAllData`** debe limpiar `novaprint_transfers`.

### [REQ-023-5] Integración en Libro Diario y Reportes Contables (`accounting.js`)
- **La función `generarLibroDiario`** debe aceptar opcionalmente el listado de transferencias (4° parámetro `transferencias = []` manteniendo retrocompatibilidad total con llamadas de 3 parámetros).
- **Cada transferencia** debe generar un asiento contable con:
  - `id`: `AS-TRF-${t.id}`
  - `fecha`: fecha de la transferencia
  - `tipo`: `'Transferencia'`
  - `origen`: `'Transferencia entre Cuentas'`
  - `concepto`: detalle de cuentas involucradas y glosa
  - `cuentaDebe`: nombre de la cuenta de destino
  - `debe`: monto transferido
  - `cuentaHaber`: nombre de la cuenta de origen
  - `haber`: monto transferido
- **En la tabla del Libro Diario (`renderAccountingJournal`)**:
  - Las transferencias deben mostrar la insignia `Transferencia` en color índigo/azul.
  - Las transferencias manuales deben incluir el botón `[🗑️]` para permitir su reversión/eliminación con confirmación.
  - El selector `#acc-journal-filter-type` debe incluir la opción "Transferencias entre Cuentas".

### [REQ-023-6] Preservación de Compatibilidad y No Regresión
- No se debe modificar ni alterar la operativa existente de ventas, compras, inventario, balance ni gastos.
- Las 180 pruebas unitarias existentes deben seguir pasando al 100%.

## 4. Criterios de Aceptación
1. El botón `⇄ Transferir entre Cuentas` es visible junto a `+ Registrar Gasto` en la cabecera de Contabilidad.
2. Al presionar el botón se abre el modal `<dialog id="dialog-transfer">` con las cuentas del Plan de Cuentas cargadas en origen y destino.
3. Se rechaza la transferencia si la cuenta de origen y destino son la misma o si el monto es $\le 0$.
4. Al confirmar, se guarda en `novaprint_transfers` y aparece inmediatamente en el Libro Diario con insignia de tipo `Transferencia`.
5. Se puede eliminar una transferencia desde el Libro Diario mediante confirmación.
6. El respaldo JSON (`exportBackup`) y restauración (`importBackup`) incluyen las transferencias.
7. La suite de pruebas unitarias verifica el 100% de la funcionalidad nueva y existente.
