# Spec 018 — Módulo de Contabilidad: Cuentas de Activos, Pasivos, Ingresos y Gastos Enlazados

Estado: implementada

## 1. Contexto y Objetivo
La aplicación **Novaprint App** gestiona operativamente el taller de confección y estampados textiles: pedidos de clientes (ventas de poleras, polerones, buzos y gorras con técnicas DTF, serigrafía, vinilo y sublimación), inventario de bodega con valorización de insumos/prendas base y compras a proveedores con control de IVA (19%) y delivery.

Sin embargo, el negocio carecía de una visión financiera y contable formal consolidada. El propietario del taller necesita conocer con precisión:
1. **Activos:** Cuánto dinero hay en caja/bancos por cobros realizados, cuánto dinero está pendiente por cobrar a clientes morosos/con saldo, y cuál es el valor monetario de las existencias de insumos y prendas almacenadas en bodega.
2. **Pasivos:** Compromisos por pagar y obligaciones tributarias devengadas (Débito Fiscal IVA del 19% generado en ventas con factura menos el Crédito Fiscal IVA de compras).
3. **Ingresos:** Desglose del total facturado por venta de poleras/prendas estampadas, servicios adicionales y cobros de delivery.
4. **Gastos y Costos:** Costo de compras de insumos textiles enlazado con la bodega, más el registro de gastos operacionales fijos y variables del taller (arriendo, electricidad, mantención de maquinaria, mermas, etc.).
5. **Estados Financieros en Tiempo Real:** Balance General y Estado de Resultados (P&L) con cálculo automático de Utilidad Neta del ejercicio.

El objetivo de esta especificación es **diseñar e implementar un Módulo de Contabilidad integral (`assets/js/accounting.js`), enlazado de forma reactiva con los pedidos de ventas, compras de insumos, inventario y gastos de taller**, sin modificar ni romper ninguna de las funcionalidades operativas vigentes.

## 2. Usuarios y Roles
- **Dueño / Administrador de Novaprint:** Consulta el Balance General, el Estado de Resultados y el Libro Diario de movimientos para la toma de decisiones, cálculo de rentabilidad y cumplimiento tributario.
- **Operador / Contador del Taller:** Registra gastos operacionales adicionales y concilia los cobros de ventas y pagos a proveedores.

## 3. Plan de Cuentas Contables Estándar
Se implementa un plan de cuentas estructurado según normas contables:
- **1. ACTIVOS (Assets):**
  - `1101` — **Caja y Bancos (Disponible):** Flujo neto de efectivo (Cobros de pedidos + otros ingresos - Pagos de compras de insumos - Gastos operacionales pagados).
  - `1102` — **Cuentas por Cobrar a Clientes:** Saldos pendientes por cobrar de pedidos confirmados (`total - abono`).
  - `1103` — **Inventario de Existencias (Bodega):** Valorización total de existencias físicas en bodega (`sum(currentStock * unitCost)`).
  - `1104` — **Crédito Fiscal IVA a Favor (Compras):** 19% de IVA recuperable pagado en compras de insumos.
  - `1201` — **Activo Fijo y Maquinaria de Taller:** Equipamiento textil (planchas, impresoras DTF, pulpos serigráficos).
- **2. PASIVOS (Liabilities):**
  - `2101` — **Cuentas por Pagar a Proveedores:** Compromisos pendientes con distribuidores de prendas/insumos.
  - `2102` — **Débito Fiscal IVA por Pagar:** 19% de IVA recaudado en ventas facturadas a clientes.
  - `2103` — **IVA Neto por Pagar al SII:** Saldo neto de IVA ($\text{Débito Fiscal} - \text{Crédito Fiscal}$).
- **3. PATRIMONIO (Equity):**
  - `3101` — **Capital del Taller:** Aportes y capital de trabajo.
  - `3201` — **Resultado del Ejercicio / Utilidad Neta:** $\text{Ingresos} - \text{Costos} - \text{Gastos}$.
- **4. INGRESOS (Revenues):**
  - `4101` — **Ingresos por Venta de Poleras y Confección:** Monto neto de ventas generado en pedidos (`novaprint_orders`).
  - `4102` — **Ingresos por Servicios de Estampado / Personalización.**
  - `4103` — **Ingresos por Despacho y Delivery (Clientes).**
  - `4104` — **Otros Ingresos Operacionales.**
- **5. COSTOS Y GASTOS (Expenses):**
  - `5101` — **Costo de Insumos y Textiles:** Compras de insumos y prendas base (`novaprint_purchases`).
  - `5201` — **Gastos de Arriendo de Taller.**
  - `5202` — **Gastos de Servicios Básicos (Luz/Electricidad planchas, agua, internet).**
  - `5203` — **Mantenimiento y Calibración de Maquinaria.**
  - `5204` — **Gastos de Flete y Envíos (Proveedores).**
  - `5205` — **Mermas, Daños y Pruebas de Calidad.**
  - `5206` — **Otros Gastos Operacionales.**

## 4. Requisitos Funcionales
- **RF-1 (Motor Contable en `assets/js/accounting.js`):**
  - `calcularBalanceGeneral(orders, purchases, inventory, expenses)`: Consolida Activos, Pasivos, Patrimonio y verifica la ecuación contable ($\text{Activo} = \text{Pasivo} + \text{Patrimonio}$).
  - `calcularEstadoResultados(orders, purchases, expenses)`: Consolida Ingresos Brutos, Descuentos de Volumen, Ingresos Netos, Costo de Insumos, Margen Bruto, Gastos de Operación y Utilidad Neta.
  - `generarLibroDiario(orders, purchases, expenses)`: Lista cronológica de todos los asientos y movimientos con Debe, Haber y Saldo.
  - `calcularMetricasContables(...)`: KPIs clave para la cabecera del módulo.
- **RF-2 (Persistencia en `assets/js/storage.js`):**
  - Nueva clave `STORAGE_KEYS.EXPENSES = 'novaprint_expenses'` para gastos operacionales directos del taller.
  - Funciones CRUD: `getExpenses()`, `getExpenseById(id)`, `saveExpense(expense)`, `deleteExpense(id)`.
  - Integración en `exportBackup()` e `importBackup()` para asegurar respaldo y restauración JSON total.
- **RF-3 (Interfaz de Usuario en `index.html`):**
  - Nuevo botón de pestaña en la cabecera: `📊 Contabilidad` (`data-view="accounting"`).
  - Panel `<section id="view-accounting" class="view-panel space-y-6">` con:
    - Tarjetas KPI: Total Activos, Total Pasivos, Ingresos por Ventas, Utilidad Neta del Ejercicio.
    - Selector de vistas secundarias:
      - `Balance General` (cuentas de Activo, Pasivo y Patrimonio).
      - `Estado de Resultados` (P&L detallado).
      - `Libro Diario / Movimientos` (listado con filtros y botón `+ Registrar Gasto`).
    - Modal `<dialog id="dialog-expense">` para registrar gastos operacionales manuales (arriendo, luz, etc.).
- **RF-4 (Renderizado e Interacción en `assets/js/ui.js` & `assets/js/main.js`):**
  - Funciones `renderAccountingModule`, `renderAccountingMetrics`, `renderAccountingBalance`, `renderAccountingIncomeStatement`, `renderAccountingJournal`.
  - Integración en `NovaprintMain.refrescarDatos()` (`refrescarContabilidad()`) para sincronización en vivo ante cualquier nuevo pedido, compra o ajuste de stock.
- **RF-5 (Pruebas Automatizadas):**
  - Crear `tests/accounting.test.js` con cobertura exhaustiva de la ecuación contable, cálculo de balance, estado de resultados, libro diario y enlace con pedidos y compras.
- **RF-6 (No Regresión):**
  - Mantener pasando al 100% las 127 pruebas unitarias previas en `tests/*.test.js`.

## 5. Criterios de Aceptación
1. La pestaña "📊 Contabilidad" permite navegar fluidamente entre Balance General, Estado de Resultados y Libro Diario.
2. Los ingresos por Venta de Poleras y prendas se calculan y desglosan automáticamente desde `novaprint_orders`.
3. Las compras de insumos (`novaprint_purchases`) y la valorización de inventario (`novaprint_inventory`) se integran directamente a Costos y Activos.
4. Es posible registrar, editar y eliminar gastos operacionales adicionales (arriendo, luz, mantenimiento).
5. La ecuación contable Activo = Pasivo + Patrimonio cuadra exactamente.
6. 100% de las pruebas unitarias pasan exitosamente.
