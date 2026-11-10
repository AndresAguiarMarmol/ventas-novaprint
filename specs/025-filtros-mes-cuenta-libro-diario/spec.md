# Spec 025 — Filtro por Mes de Transacción y Filtro por Cuenta Contable en Libro Diario de Movimientos

Estado: implementada

## 1. Contexto y Problema
En el Módulo de Contabilidad (`#view-accounting`), la sub-vista **Libro Diario de Movimientos** (`#acc-subview-journal`) presenta la totalidad de los asientos contables generados cronológicamente a partir de Pedidos (ventas), Compras (insumos), Gastos Operacionales y Transferencias entre cuentas.

Actualmente, el Libro Diario cuenta únicamente con un filtro por tipo de movimiento (`#acc-journal-filter-type` con opciones: Todos, Ventas de Poleras, Compras de Insumos, Gastos Operacionales, Transferencias entre Cuentas). A medida que el taller acumula cientos de transacciones a lo largo de las semanas y meses, resulta difícil para el administrador y contador:
1. **Auditar transacciones por período mensual:** No es posible acotar los asientos a un mes específico (ej. "Noviembre 2026") para realizar el cierre contable mensual o la conciliación de IVA y bancos de dicho período.
2. **Auditar una cuenta contable específica:** No es posible filtrar el Libro Diario para ver de forma aislada todos los movimientos (debe y haber) en los que interviene una cuenta contable determinada (ej. `1101 Caja y Bancos`, `1102 Cuentas por Cobrar`, `2101 Cuentas por Pagar`, `5101 Costo de Insumos`, etc.).

Se requiere implementar dos nuevos filtros en la cabecera del Libro Diario de Movimientos:
- Un **Filtro por Mes de la Transacción** (`YYYY-MM`) que permita seleccionar cualquier mes o ver todos los meses.
- Un **Filtro por Cuenta Contable** que liste las cuentas del Plan de Cuentas organizadas por grupo y permita filtrar asientos que afecten a dicha cuenta (tanto al Debe como al Haber).
- Ambos filtros deben operar en conjunto de forma combinada (operador lógico AND) con el filtro por Tipo de movimiento actual, sin romper ninguna funcionalidad existente.

## 2. Historias de Usuario
- **Como administrador del taller**, quiero filtrar los asientos del Libro Diario por un mes específico para conciliar las ventas y gastos correspondientes a ese mes de operación.
- **Como contador**, quiero seleccionar una cuenta contable en un menú desplegable para examinar únicamente los débitos y créditos asociados a ella en el Libro Diario.
- **Como usuario**, quiero poder combinar los tres filtros simultáneamente (ej. "Gastos Operacionales" del mes "2026-11" en la cuenta "5201 Arriendo") o restablecerlos fácilmente a sus valores predeterminados.
- **Como auditor**, cuando haga clic en el botón `[👁️]` ("Ver Movimientos") en el Plan de Cuentas, quiero que el selector de cuenta en el Libro Diario se posicione automáticamente en dicha cuenta y muestre sus movimientos de inmediato.

## 3. Requisitos Funcionales (Formato EARS)

### [REQ-025-1] Filtro por Mes de la Transacción
- **En la barra de filtros del Libro Diario (`#acc-subview-journal`)**, el sistema debe proporcionar un control de selección de mes (`#acc-journal-filter-month`) junto a un botón interactivo para restablecer a "Todos los meses" (`#btn-journal-clear-month`).
- **Cuando el usuario selecciona un mes (ej. `2026-11`)**, el sistema debe filtrar los asientos cuya propiedad `fecha` inicie con dicho prefijo (`YYYY-MM`).
- **Cuando el selector de mes esté vacío**, el sistema debe incluir transacciones de cualquier fecha (sin filtrar por mes).

### [REQ-025-2] Filtro por Cuenta Contable
- **En la barra de filtros del Libro Diario**, el sistema debe proporcionar un selector desplegable (`#acc-journal-filter-account`) poblado dinámicamente con las cuentas activas obtenidas de `NovaprintStorage.getAccounts()`.
- **Las opciones del selector** deben incluir `"todas"` ("Todas las Cuentas") como valor inicial por defecto, seguido de las cuentas contables organizadas con sus códigos y nombres oficiales (ej. `1101 - Caja y Bancos (Disponible)`), agrupadas preferentemente por grupo contable (`1. Activos`, `2. Pasivos`, etc.).
- **Cuando el usuario selecciona una cuenta específica (ej. código `1101` o ID)**, el sistema debe filtrar únicamente aquellos asientos donde la cuenta participe al Debe (`cuentaDebe` o `detalle.destinoCodigo`/`detalle.destinoId`) o al Haber (`cuentaHaber` o `detalle.origenCodigo`/`detalle.origenId`).

### [REQ-025-3] Coexistencia y Combinación de Filtros (Operador AND)
- **El sistema** debe permitir aplicar los tres filtros simultáneamente:
  $$\text{Asiento visible} \iff \text{coincide Tipo} \land \text{coincide Mes} \land \text{coincide Cuenta}$$
- **El indicador de conteo (`#acc-journal-count`)** debe actualizarse dinámicamente para reflejar el número exacto de asientos resultantes tras aplicar los filtros activos.
- **Si no existen asientos coincidentes**, la tabla debe mostrar un mensaje amigable indicando que no hay movimientos para los filtros seleccionados, con opción de restablecer los filtros.

### [REQ-025-4] Botón de Restablecimiento General de Filtros
- **El sistema** debe incluir una acción rápida de "Limpiar Filtros" (`#btn-journal-reset-filters`) que restablezca el tipo a `"todos"`, el mes a vacío (todos) y la cuenta a `"todas"`, refrescando la vista de inmediato.

### [REQ-025-5] Integración con Navegación desde Plan de Cuentas
- **Cuando el usuario pulsa `[👁️]` en una fila del Plan de Cuentas (`verMovimientosCuenta`)**, el sistema debe cambiar a la sub-vista de Libro Diario, establecer `#acc-journal-filter-account` con el código de dicha cuenta y ejecutar el filtrado reactivo completo.

### [REQ-025-6] Compatibilidad y No Regresión
- **No se debe alterar** la estructura de datos persistida en `localStorage` ni los cálculos de Balance General, P&L o Libro Mayor.
- **La suite existente de 200 pruebas automatizadas** debe continuar ejecutándose al 100% en verde.
