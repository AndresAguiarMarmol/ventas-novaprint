# Spec 024 — Reflejo de Transferencias en Cuentas Contables (Origen/Destino) y Listado de Movimientos

Estado: implementada

## 1. Contexto y Problema
En la Spec 023, se incorporó el botón y modal de "Transferencia entre Cuentas" (`#btn-new-transfer` y `<dialog id="dialog-transfer">`) junto al botón de registrar gasto. Sin embargo, el usuario ha reportado que al ejecutar una transferencia entre cuentas:
1. **Los movimientos no se reflejan en las cuentas de origen ni de destino:**
   - En el **Plan de Cuentas** (`#acc-subview-chart`), la tabla de cuentas no exhibe el **Saldo Actual ($ CLP)** de cada cuenta contable calculado a partir de los débitos y créditos acumulados (Ventas, Compras, Gastos y Transferencias). Por ende, el usuario no visualiza cómo disminuye el saldo de la cuenta origen (ej. `1101 Caja y Bancos`) ni cómo aumenta el saldo de la cuenta destino (ej. `1105 Caja Chica`, `1201 Maquinaria`, etc.).
   - En el **Balance General** (`#acc-subview-balance`), la función `calcularBalanceGeneral` no incorporaba el parámetro ni el impacto de las transferencias en el saldo disponible de Caja y Bancos ni en las restantes cuentas patrimoniales.
2. **Los movimientos no se reflejan en el listado de movimientos (Libro Diario):**
   - Al confirmar el formulario `#form-transfer`, la función `guardarTransferenciaDesdeFormulario` intentaba invocar `global.refrescarContabilidad()` y `global.refrescarDatos()`, las cuales no estaban expuestas en el ámbito global del navegador (`window`), provocando que la UI no se refrescara reactivamente tras guardar la transferencia.
   - Al alternar entre pestañas en `cambiarSubVistaContable('journal')`, no se forzaba la re-hidratación de asientos actualizados con las transferencias de `storage.getTransfers()`.

Se requiere implementar el motor de cálculo de **Saldos por Cuenta (Libro Mayor)** que consolide la partida doble de todos los asientos del sistema, agregar la columna visible de **Saldo Actual** en el Plan de Cuentas, actualizar el Balance General para que las transferencias impacten efectivamente a las cuentas origen y destino, y corregir el refresco reactivo para que cualquier transferencia aparezca inmediatamente en el listado del Libro Diario de Movimientos.

## 2. Historias de Usuario
- **Como administrador y operador contable**, quiero que al realizar una transferencia entre cuentas (ej. de Caja a Caja Chica o de Banco a Proveedores), el saldo de la cuenta de origen disminuya y el saldo de la cuenta de destino aumente de forma inmediata y visible.
- **Como usuario**, quiero ver en la tabla del Plan de Cuentas una columna clara con el **Saldo Actual ($ CLP)** de cada cuenta contable, calculada de forma dinámica con la suma de todos sus movimientos históricos.
- **Como auditor**, quiero que la transferencia aparezca al instante en el **Libro Diario de Movimientos** tras presionar "Confirmar Transferencia", sin necesidad de recargar la página.
- **Como contador**, quiero poder ver los movimientos específicos de una cuenta haciendo clic en un botón de consulta rápida desde la fila de esa cuenta en el Plan de Cuentas.

## 3. Requisitos Funcionales (Formato EARS)

### [REQ-024-1] Cálculo Dinámico de Saldos por Cuenta (`accounting.js`)
- **El sistema** debe proveer la función `calcularSaldosPlanCuentas(asientos = [], accounts = [], settings = {})` que consolide todos los débitos (Debe) y créditos (Haber) por cuenta contable a partir de la totalidad de movimientos del Libro Diario (`generarLibroDiario`).
- **Para cuentas de Activo y Egreso** (naturaleza deudora):
  $$\text{Saldo} = \sum \text{Debe} - \sum \text{Haber}$$
- **Para cuentas de Pasivo, Capital e Ingreso** (naturaleza acreedora):
  $$\text{Saldo} = \sum \text{Haber} - \sum \text{Debe}$$
- **Para la cuenta `1101 Caja y Bancos`**, el saldo inicial debe considerar el capital inicial registrado en `settings.initialCapital`.

### [REQ-024-2] Columna "Saldo Actual" en Plan de Cuentas (`index.html` y `ui.js`)
- **En la tabla `#acc-table-accounts`**, el sistema debe agregar la columna **"Saldo Actual ($)"** entre la Clasificación y las Acciones.
- **En cada fila de cuenta contable**, el sistema debe renderizar el saldo actual formateado en moneda chilena (CLP), resaltando saldos positivos en tono verde/esmeralda y saldos cero en tono neutro.
- **En la columna de Acciones**, se debe incorporar el botón interactivo `[👁️]` ("Ver Movimientos") que filtre o enlace directamente al Libro Diario mostrando los movimientos específicos donde participa dicha cuenta.

### [REQ-024-3] Reflejo de Transferencias en Balance General (`accounting.js`)
- **La función `calcularBalanceGeneral`** debe recibir y procesar el parámetro `transferencias = []`.
- **El saldo disponible en Caja y Bancos (`1101`)** debe sumar las transferencias donde `1101` es destino (entradas) y restar las transferencias donde `1101` es origen (salidas).
- **Las cuentas de activos, pasivos y patrimonio** involucradas en transferencias deben ajustar sus valores respectivos manteniendo la ecuación fundamental de la contabilidad balanceada:
  $$\text{Activos} = \text{Pasivos} + \text{Patrimonio}$$

### [REQ-024-4] Reactividad Inmediata en Listado de Movimientos (`ui.js` y `main.js`)
- **Al confirmar una transferencia (`guardarTransferenciaDesdeFormulario`) o eliminarla (`confirmarEliminarTransferencia`)**:
  - El sistema debe guardar atómicamente en `NovaprintStorage.saveTransfer`.
  - El sistema debe invocar `NovaprintMain.refrescarDatos()` y `NovaprintMain.refrescarContabilidad()`.
  - El sistema debe forzar el re-renderizado inmediato de `renderAccountingModule` y `renderAccountsChart`.
- **En `assets/js/main.js`**, se debe exportar explícitamente `refrescarContabilidad` en `NovaprintMain` y en `global` para garantizar su disponibilidad.
- **Al alternar a la sub-vista `#acc-subview-journal`**, el sistema debe invocar la actualización de asientos para garantizar que el listado de movimientos siempre esté al día.

### [REQ-024-5] Preservación de Compatibilidad y No Regresión
- No se debe alterar ninguna funcionalidad previa de ventas, compras, proyectos o inventario.
- Todas las pruebas unitarias existentes (194 tests) deben continuar pasando al 100%.

## 4. Criterios de Aceptación
1. Tras guardar una transferencia, la lista de movimientos en el Libro Diario se actualiza de inmediato sin requerir recargar la página.
2. La tabla del Plan de Cuentas muestra la columna "Saldo Actual" con los montos exactos actualizados tras cualquier transferencia.
3. El saldo de la cuenta de origen disminuye exactamente en el monto transferido.
4. El saldo de la cuenta de destino aumenta exactamente en el monto transferido.
5. El Balance General refleja la variación neta de fondos en Caja y Bancos y demás cuentas afectadas, manteniéndose cuadrado.
6. El botón `[👁️]` permite filtrar los movimientos contables de una cuenta específica en el Libro Diario.
7. El 100% de la suite de pruebas unitarias pasa exitosamente.
