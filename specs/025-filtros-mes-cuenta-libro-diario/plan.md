# Plan de Implementación — Spec 025: Filtro por Mes de Transacción y Filtro por Cuenta Contable en Libro Diario

## Arquitectura y Componentes Afectados

### 1. `assets/js/accounting.js`
- Diseñar la función pura `filtrarAsientosContables(asientos, { tipo, mes, cuenta, accounts })` que evalúe:
  - `tipo`: si es `'todos'` o coincide con `a.tipo`.
  - `mes`: si está vacío o si `a.fecha && a.fecha.startsWith(mes)`.
  - `cuenta`: si es `'todas'` o si coincide con la cuenta (código o ID o nombre) al Debe o al Haber.
- Exponer `filtrarAsientosContables` en el namespace público `NovaprintAccounting` para facilitar pruebas unitarias independientes y reusabilidad.

### 2. `index.html`
- En el bloque de filtros del Libro Diario (`#acc-subview-journal`), rediseñar la barra de filtros en un panel flexible y responsivo que albergue:
  - Filtro 1: "Tipo" (`#acc-journal-filter-type`).
  - Filtro 2: "Mes" (`#acc-journal-filter-month`, de tipo `<input type="month">`) con botón rápido `[Todos]` (`#btn-journal-clear-month`).
  - Filtro 3: "Cuenta Contable" (`#acc-journal-filter-account`, `<select>`) con opción `"todas"` y listado de cuentas.
  - Botón de acción: `[Limpiar Filtros]` (`#btn-journal-reset-filters`).
  - Contador de resultados: `#acc-journal-count`.

### 3. `assets/js/ui.js`
- Mantener variables de estado de filtrado:
  - `currentJournalFilter` (`'todos'`)
  - `currentJournalMonthFilter` (`''`)
  - `currentJournalAccountFilter` (`'todas'`)
- Implementar la función `poblarSelectorCuentasLibroDiario()` que llene `#acc-journal-filter-account` con las cuentas de `storage.getAccounts()`, preservando la selección activa.
- Actualizar `renderAccountingJournal(asientos, sales)` para filtrar los asientos usando los 3 criterios combinados.
- Actualizar `filtrarLibroDiario()` para capturar los valores de los 3 controles y solicitar el re-renderizado.
- Implementar `limpiarFiltroMesLibroDiario()` y `resetFiltrosLibroDiario()`.
- Actualizar `verMovimientosCuenta(codigo, nombre)` para que configure `#acc-journal-filter-account.value = codigo` y ejecute `filtrarLibroDiario()`.
- Exponer las nuevas funciones en `NovaprintUI`.

### 4. `assets/js/main.js`
- Conectar escuchadores de eventos para los nuevos filtros y botones si corresponde (además de los atributos `onchange`/`onclick` en el HTML).

### 5. `tests/journal_filters_month_account.test.js`
- Probar:
  - Filtrado puro por tipo (preservación de comportamiento existente).
  - Filtrado puro por mes (`YYYY-MM`).
  - Filtrado puro por cuenta (código, nombre, asiento Debe, asiento Haber, transferencias).
  - Combinación simultánea de filtros (tipo + mes + cuenta).
  - Comportamiento de limpieza y restablecimiento de filtros.
  - Existencia de elementos visuales en el DOM de `index.html`.
  - Integración con `verMovimientosCuenta`.
- Ejecutar la suite completa (`node --test tests/*.test.js`) asegurando 200+ tests en verde sin regresiones.

