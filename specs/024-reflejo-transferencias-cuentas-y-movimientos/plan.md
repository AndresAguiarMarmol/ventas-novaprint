# Plan de Implementación — Spec 024: Reflejo de Transferencias en Cuentas Contables y Listado de Movimientos

## 1. Arquitectura y Fórmulas Contables

### A. Consolidación de Saldos por Cuenta (Libro Mayor)
A partir de la totalidad de asientos en `generarLibroDiario(pedidos, compras, gastos, transferencias)`:
- Cada asiento posee: `cuentaDebe`, `debe`, `cuentaHaber`, `haber`, y en `detalle`: `origenCodigo`, `origenId`, `destinoCodigo`, `destinoId`.
- Para cada cuenta $A$ (por ID o código):
  ```javascript
  totalDebe = sum(asiento.debe donde cuentaDebe == A)
  totalHaber = sum(asiento.haber donde cuentaHaber == A)
  ```
- Saldo según naturaleza:
  - Activo: `saldo = totalDebe - totalHaber` (+ capitalInicial si es 1101)
  - Egreso: `saldo = totalDebe - totalHaber`
  - Pasivo: `saldo = totalHaber - totalDebe`
  - Capital: `saldo = totalHaber - totalDebe`
  - Ingreso: `saldo = totalHaber - totalDebe`

### B. Ajuste de Transferencias en Balance General
En `calcularBalanceGeneral`:
- Calcular flujo neto de transferencias para `1101 Caja y Bancos`:
  `netoTransferenciasCaja = sum(t.amount si destino == 1101) - sum(t.amount si origen == 1101)`
- Aplicar: `saldoCajaDisponible = capitalInicial + ingresosCaja - egresosCaja + netoTransferenciasCaja`.
- Para otras cuentas de activos (ej. `1201 Maquinaria`, inventario adicional):
  sumar transferencias entrantes y restar salientes.
- La ecuación patrimonial se mantiene exactamente balanceada.

## 2. Modificaciones en Módulos

### A. `assets/js/accounting.js`
1. Implementar `calcularSaldosPlanCuentas(asientos, accounts, settings)`.
2. Actualizar `calcularBalanceGeneral` para procesar el 6° parámetro opcional `transferencias = []`.
3. Actualizar `calcularMetricasContables` para pasar `transferencias` a `calcularBalanceGeneral`.
4. Exportar `calcularSaldosPlanCuentas`.

### B. `assets/js/ui.js`
1. En `renderAccountingModule`, pasar `trans` a `acc.calcularBalanceGeneral(pedidos, compras, inventario, gastos, settings, trans)`.
2. En `renderAccountsChart`:
   - Obtener los asientos actuales mediante `acc.generarLibroDiario(pedidos, compras, gastos, trans)`.
   - Obtener saldos vía `acc.calcularSaldosPlanCuentas(asientos, allAccounts, settings)`.
   - Renderizar la nueva celda en cada fila con el saldo formateado.
   - Añadir botón de acción `[👁️]` que invoque `NovaprintUI.verMovimientosCuenta(acc.codigo, acc.nombre)`.
3. Implementar `verMovimientosCuenta(codigo, nombre)`:
   - Cambia a la subvista `journal`.
   - Filtra el Libro Diario para mostrar los asientos que involucren a esa cuenta.
4. En `guardarTransferenciaDesdeFormulario` y `confirmarEliminarTransferencia`:
   - Corregir el refresco llamando tanto a `NovaprintMain.refrescarDatos()` como forzando de inmediato el renderizado directo con los datos de storage.
5. En `cambiarSubVistaContable(subview)`:
   - Si `subview === 'journal'` o `subview === 'chart'`, re-ejecutar el renderizado correspondiente con los datos más recientes.

### C. `index.html`
1. En `#acc-table-accounts` (línea ~1022), añadir la columna `<th>Saldo Actual</th>` antes de `<th>Acciones</th>`.

### D. `assets/js/main.js`
1. Exportar `refrescarContabilidad` en `mainModule`.
2. Asignar `global.refrescarContabilidad = refrescarContabilidad;` y `global.refrescarDatos = refrescarDatos;`.

## 3. Plan de Pruebas
Crear `tests/transfers_reflection_accounts_movements.test.js`:
- Verificar que `calcularSaldosPlanCuentas` descuenta de la cuenta origen y aumenta la cuenta destino.
- Verificar que `calcularBalanceGeneral` con transferencias refleja el saldo de Caja y Bancos y mantiene el balance cuadrado.
- Verificar que las transferencias aparecen en el listado del Libro Diario tras la inserción.
- Verificar que el DOM de `index.html` contiene la columna "Saldo Actual".
- Verificar que `verMovimientosCuenta` está exportada en `NovaprintUI`.
- Ejecutar suite global completa.

