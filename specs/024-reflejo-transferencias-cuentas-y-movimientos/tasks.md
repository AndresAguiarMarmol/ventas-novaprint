# Tareas — Spec 024: Reflejo de Transferencias en Cuentas Contables y Listado de Movimientos

- [x] T0: Respaldo previo de datos y código (archivo `backups/backup_pre_fix_transferencias_reflejo_20261110.json` y tag git `backup-pre-fix-transferencias-reflejo-20261110`).
- [x] T1: Implementar `calcularSaldosPlanCuentas` y actualizar `calcularBalanceGeneral` en `assets/js/accounting.js` para reflejar transferencias en cuentas contables.
- [x] T2: Añadir columna "Saldo Actual" en la tabla del Plan de Cuentas `#acc-table-accounts` en `index.html`.
- [x] T3: Actualizar `renderAccountsChart` en `assets/js/ui.js` para renderizar los saldos calculados de cada cuenta y el botón `[👁️]` para consultar movimientos.
- [x] T4: Implementar `verMovimientosCuenta` y corregir la reactividad en `guardarTransferenciaDesdeFormulario`, `confirmarEliminarTransferencia` y `cambiarSubVistaContable` en `assets/js/ui.js`.
- [x] T5: Exponer `refrescarContabilidad` y `refrescarDatos` en `global` y en `NovaprintMain` en `assets/js/main.js`.
- [x] T6: Crear suite de pruebas en `tests/transfers_reflection_accounts_movements.test.js` y verificar que el 100% de tests continúe en verde (0 regresiones).
- [x] T7: Actualizar `memory.md`, marcar tareas como completadas, comitear y pushear a GitHub (`main`).
