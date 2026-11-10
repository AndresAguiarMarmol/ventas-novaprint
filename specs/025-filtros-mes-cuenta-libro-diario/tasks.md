# Tareas — Spec 025: Filtro por Mes de Transacción y Filtro por Cuenta Contable en Libro Diario

- [x] T0: Respaldo previo de datos y código (archivo `backups/backup_pre_filtros_mes_cuenta_libro_diario_20261110.json` y tag git `backup-pre-filtros-mes-cuenta-libro-diario-20261110`).
- [x] T1: Implementar `filtrarAsientosContables` en `assets/js/accounting.js` y exportarla en `NovaprintAccounting`.
- [x] T2: Actualizar la barra de filtros del Libro Diario en `index.html` con `#acc-journal-filter-month`, `#btn-journal-clear-month`, `#acc-journal-filter-account` y `#btn-journal-reset-filters`.
- [x] T3: Implementar en `assets/js/ui.js` la lógica de filtrado combinado, la función `poblarSelectorCuentasLibroDiario`, los métodos de reseteo y actualizar `verMovimientosCuenta`.
- [x] T4: Asegurar en `assets/js/main.js` la inicialización reactiva y sincronización de los selectores del Libro Diario.
- [x] T5: Crear suite de pruebas en `tests/journal_filters_month_account.test.js` y verificar que el 100% de tests de la aplicación pasen exitosamente (0 regresiones).
- [x] T6: Actualizar `memory.md`, marcar tareas como completadas, comitear y pushear a GitHub (`main`).
