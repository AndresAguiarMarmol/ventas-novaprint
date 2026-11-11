# Plan de Implementación — Spec 028: Corrección y Optimización de Filtros en Libro Diario

## 1. Fase de Respaldo y Protección Previa (Completada)
- [x] Generación de respaldo JSON en `backups/backup_pre_correccion_filtros_libro_diario_20261110.json`.
- [x] Creación y publicación del tag Git `backup-pre-correccion-filtros-libro-diario-20261110`.

## 2. Fase de Corrección del Motor Contable (`assets/js/accounting.js`)
- [ ] Refactorizar `asientoAfectaCuenta`:
  - Incorporar mapa canónico `CATEGORIAS_GASTO_MAP` para vincular categorías con códigos contables 5201 a 5206.
  - Soportar vinculación por cuentas de IVA compras (`1104`), IVA ventas (`2102`), delivery (`4103`), inventario (`1103`), ventas (`4101`), caja (`1101`) y cuentas por cobrar (`1102`).
  - Corregir coincidencia de nombres para evitar falsos negativos por extensiones de texto y falsos positivos por strings vacíos.
- [ ] Normalizar extracción de mes en `filtrarAsientosContables`:
  - Implementar helper `extraerMesTransaccion(fecha)` para comparar de manera confiable con el mes seleccionado (`YYYY-MM`).

## 3. Fase de Reactividad Inmediata en Interfaz (`assets/js/ui.js` e `index.html`)
- [ ] En `ui.js`:
  - Actualizar `filtrarLibroDiario()` para obtener asientos contables y re-renderizar directamente `renderAccountingJournal()` al instante.
  - Actualizar `limpiarFiltroMesLibroDiario()` y `resetFiltrosLibroDiario()` para re-renderizar inmediatamente.
- [ ] En `index.html`:
  - Agregar `oninput="NovaprintUI.filtrarLibroDiario()"` a `#acc-journal-filter-month`.

## 4. Fase de Pruebas Automatizadas
- [ ] Crear suite `tests/journal_filters_bugfix.test.js`:
  - Prueba de filtrado por cuentas de gastos (Electricidad 5202, Mantenimiento 5203, Fletes 5204, Mermas 5205, Otros Gastos 5206).
  - Prueba de filtrado por cuentas de IVA (1104 y 2102) y Delivery (4103).
  - Prueba de filtrado por mes con fechas ISO y fechas fecha-simple.
  - Prueba de reactividad y persistencia de valores en controles de UI.
- [ ] Ejecutar suite global con `node --test tests/*.test.js` y verificar 100% de aprobación.

## 5. Fase de Documentación y Cierre
- [ ] Actualizar `memory.md` (Sección 2 con Spec 028 y Sección 3 con registro histórico).
- [ ] Completar `tasks.md`.
- [ ] Commit y push a `main`.
