# Plan de Implementación — Spec 018: Módulo de Contabilidad

## 1. Alcance
- Crear el motor contable `assets/js/accounting.js` (Plan de cuentas, Balance General, Estado de Resultados, Libro Diario de Asientos, KPIs financieros).
- Extender `assets/js/storage.js` para persistencia de gastos operacionales (`novaprint_expenses`) y su inclusión en el respaldo/restauración JSON.
- Actualizar `index.html` con la nueva pestaña "📊 Contabilidad", la vista `#view-accounting` con sub-vistas (Balance, Estado de Resultados, Libro Diario) y el modal `#dialog-expense`.
- Implementar la lógica de renderizado en `assets/js/ui.js` y conectar la reactividad en `assets/js/main.js`.
- Crear la suite de pruebas unitarias en `tests/accounting.test.js`.
- Actualizar `memory.md`, marcar especificación como implementada y versionar en GitHub (`main`).

## 2. Componentes Afectados
1. `assets/js/accounting.js` (Nuevo):
   - Motor puro de reglas contables y enlace con pedidos, compras e inventario.
2. `assets/js/storage.js`:
   - Clave `STORAGE_KEYS.EXPENSES`.
   - Métodos `getExpenses()`, `getExpenseById()`, `saveExpense()`, `deleteExpense()`.
   - Soporte en `exportBackup()` e `importBackup()`.
3. `index.html`:
   - Pestaña de navegación en `<nav>`.
   - Sección `<section id="view-accounting">` y modal `<dialog id="dialog-expense">`.
   - Inclusión de script `<script src="assets/js/accounting.js"></script>`.
4. `assets/js/ui.js`:
   - Funciones de renderizado contable y modales de gastos.
   - Exponer en `NovaprintUI`.
5. `assets/js/main.js`:
   - `refrescarContabilidad()` dentro de `refrescarDatos()`.
   - Listeners de sub-pestañas contables y formulario de gastos.
6. `tests/accounting.test.js` (Nuevo):
   - Cobertura de cálculos, balance general, estado de resultados y enlaces automáticos.

## 3. Riesgos y Mitigación
- **Riesgo:** Inconsistencias en el saldo de caja si los abonos de pedidos superan o difieren del total.
- **Mitigación:** Se utiliza la fórmula estándar de cobranza: `montoCobrado = min(total, abono)` para pedidos con abono, o el total si el estado es `Entregado` o pagado, garantizando que el dinero disponible en caja sea estrictamente el efectivamente ingresado.
- **Riesgo:** Conflicto con las 127 pruebas unitarias existentes.
- **Mitigación:** Ninguna función existente de ventas, clientes, compras, inventario o taller es alterada. Las funciones contables operan como consumidores de solo lectura de esas entidades.
