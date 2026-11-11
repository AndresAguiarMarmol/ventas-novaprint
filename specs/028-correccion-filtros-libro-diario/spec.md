# Spec 028 — Corrección y Optimización de Filtros en Libro Diario de Movimientos

## 1. Contexto y Problema
El usuario reportó: *"Los filtros colocados en el 'Libro Diario de Movimientos' no funcionan. Usar metodologia sdd para su desarrollo. No modificar datos actuales"*.

Tras una auditoría minuciosa del flujo de eventos, resolución contable e interfaz de usuario, se identificaron cuatro causas fundamentales:

1. **Fallo Crítico de Resolución en `asientoAfectaCuenta` (`accounting.js`):**
   - Para las cuentas de gastos operacionales (`5202 Electricidad y Servicios Básicos`, `5203 Mantenimiento de Maquinaria Textil`, `5204 Fletes y Despacho de Insumos`, `5205 Mermas y Pruebas de Calidad`, `5206 Otros Gastos Operacionales`), los asientos registran la categoría de gasto (ej. `"Electricidad y Servicios"`), mientras que el catálogo tiene el nombre ampliado (ej. `"Electricidad y Servicios Básicos"`). La comparación `cDebe.includes(nombre)` fallaba porque el nombre era más largo que la categoría, retornando 0 coincidencias siempre.
   - De igual manera, cuentas contables clave como `1104 Crédito Fiscal IVA`, `2102 Débito Fiscal IVA`, `4103 Ingresos por Despacho y Flete` y `1103 Inventario` no vinculaban los asientos contables correspondientes de compras y pedidos cuando el usuario las seleccionaba en el selector de cuentas o pulsaba `[👁️]` en el Plan de Cuentas.
2. **Dependencia Frágil de Recarga Global en `ui.js`:**
   - La función `filtrarLibroDiario()` dependía exclusivamente de `global.NovaprintMain.refrescarDatos()`, ejecutando un ciclo pesado de refresco que reconstruye kanbans, tablas de pedidos, clientes y bodega, en lugar de refrescar directamente y de forma instantánea la tabla del Libro Diario (`renderAccountingJournal`) con los datos contables en memoria.
3. **Ausencia de Evento `input` en el Selector de Mes (`index.html`):**
   - El control `<input type="month" id="acc-journal-filter-month">` solo escuchaba el evento `change`. En navegadores modernos (Chrome, Edge) y móviles, la selección en el calendario o tecleo manual no disparaba `change` de inmediato hasta que el control perdía el foco (`blur`), provocando la percepción de que el filtro no respondía.
4. **Resiliencia en Formato de Fechas (`accounting.js`):**
   - El filtro de mes comparaba con `a.fecha.startsWith(mesFiltro)`, lo cual fallaba si la fecha del asiento venía con separadores alternativos o formatos con hora.

## 2. Requerimientos
- **REQ-01: Resolución Robusta de Cuentas en `asientoAfectaCuenta`:**
  - Vincular determinísticamente las categorías de gasto del taller con sus códigos contables canónicos (`5201 Arriendo`, `5202 Electricidad`, `5203 Mantenimiento`, `5204 Fletes`, `5205 Mermas`, `5206 Otros Gastos`).
  - Reconocer compras con IVA para la cuenta `1104` (Crédito Fiscal IVA).
  - Reconocer ventas con IVA para la cuenta `2102` (Débito Fiscal IVA).
  - Reconocer ventas con despacho para la cuenta `4103` (Ingresos por Despacho y Flete).
  - Reconocer compras y movimientos de existencias para la cuenta `1103` (Inventario).
  - Permitir coincidencia por código exacto, ID de cuenta y nombre bidireccional.
- **REQ-02: Reactividad Directa e Inmediata en `ui.js`:**
  - `filtrarLibroDiario()`, `limpiarFiltroMesLibroDiario()` y `resetFiltrosLibroDiario()` deben re-renderizar directamente `renderAccountingJournal()` con los asientos generados al instante, sin latencia ni dependencia de refrescos globales de otras vistas ajenas.
- **REQ-03: Evento `input` y `change` en `<input type="month">` (`index.html`):**
  - Añadir `oninput="NovaprintUI.filtrarLibroDiario()"` al elemento `#acc-journal-filter-month`.
- **REQ-04: Extracción Normalizada de Mes (`YYYY-MM`):**
  - Implementar normalizador de fechas que extraiga consistentemente `YYYY-MM` independientemente de si la fecha viene en ISO (`2026-11-10T...`), formato fecha simple (`2026-11-10`) o fecha regional.

## 3. Criterios de Aceptación
1. Al filtrar por tipo (Ingreso, Costo, Gasto, Transferencia o Todos), la tabla del Libro Diario se actualiza de inmediato.
2. Al seleccionar un mes en `#acc-journal-filter-month`, el Libro Diario muestra de inmediato solo las transacciones de dicho mes.
3. Al pulsar `[Todos]` en el filtro de mes, se eliminan las restricciones cronológicas y se muestran todas las transacciones.
4. Al seleccionar cualquier cuenta contable (incluyendo Electricidad 5202, Mantenimiento 5203, Fletes 5204, Mermas 5205, Otros Gastos 5206, IVA 1104/2102, Delivery 4103, Inventario 1103, Caja 1101, CxC 1102), el Libro Diario filtra correctamente los asientos involucrados.
5. Al hacer clic en `[👁️]` en el Plan de Cuentas, el Libro Diario se abre mostrando los movimientos de esa cuenta sin tablas vacías falsas.
6. Al pulsar `[✕ Limpiar]`, todos los filtros se restablecen a sus valores por defecto y el listado muestra el total de movimientos.
7. 100% de los tests unitarios y de integración pasan satisfactoriamente.
