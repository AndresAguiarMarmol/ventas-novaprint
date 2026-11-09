# Tareas — Spec 018: Módulo de Contabilidad

- [x] T0: Hacer respaldo completo de datos y código previo (archivo JSON en `backups/` y tag git `backup-pre-contabilidad-20261109`).
- [x] T1: Crear el módulo `assets/js/accounting.js` con el plan de cuentas, balance general, estado de resultados, libro diario y métricas financieras.
- [x] T2: Extender `assets/js/storage.js` para persistencia de gastos operacionales (`novaprint_expenses`) y soporte en respaldo/restauración JSON.
- [x] T3: Actualizar `index.html` con la pestaña "📊 Contabilidad", la vista `#view-accounting`, el modal `#dialog-expense` y el script `assets/js/accounting.js`.
- [x] T4: Implementar las funciones de renderizado contable en `assets/js/ui.js` y conectar la reactividad en `assets/js/main.js`.
- [x] T5: Crear suite exhaustiva de pruebas unitarias en `tests/accounting.test.js` y verificar que el 100% de las pruebas (127+ anteriores y nuevas) pasen.
- [x] T6: Actualizar `memory.md`, marcar especificación como implementada y sincronizar repositorio en GitHub (`main`).
