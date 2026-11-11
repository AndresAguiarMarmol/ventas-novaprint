# Spec 031: Colocar Saldo 0 en el Stock Actual de Todos los Elementos del Inventario

## 1. Contexto y Problema
El taller de estampados Novaprint inicia un proceso de ajuste o reinicio de existencias físicas reales en bodega. Actualmente, diversos ítems del inventario (`novaprint_inventory`) cuentan con saldos positivos o variados heredados de operaciones o pruebas anteriores.

El usuario solicita:
> *"Coordinator : Colocar saldo 0 para todos los elementos del Stock Actual de los Inventarios. Usar metodologia sdd para su ejecucion."*

## 2. Requerimientos
1. **Puesta a Saldo Cero Generalizada (`currentStock = 0`):**
   - Recorrer la totalidad de los artículos registrados en el catálogo de inventario (`novaprint_inventory`), sin importar categoría (Prendas Lisas, Gorras, Insumos DTF, Sublimación, etc.), tipo de prenda, color o talla.
   - Asignar estrictamente `item.currentStock = 0` a cada uno.
2. **Preservación Total del Catálogo y Metadatos:**
   - NO eliminar ningún artículo del inventario. Deben conservarse íntegros: `id`, `code`, `name`, `category`, `garmentType`, `color`, `size`, `unit`, `minStock`, `unitCost`, `supplierId`, `supplierName`, `createdAt`.
   - Registrar la auditoría o ajuste en `lastStockAdjustment` con motivo `"Ajuste general a saldo cero (Spec 031)"`, fecha actual y el stock anterior.
3. **Mecanismo de Ejecución y Persistencia:**
   - Implementar la función `ponerStockCeroATodosLosItems()` en `assets/js/storage.js`.
   - Ejecutar la sincronización para que el `localStorage` del navegador quede con stock 0 de forma inmediata al iniciar o mediante acción explícita.
   - En la interfaz de usuario de Inventario (`#view-inventory`), disponer de un botón de acción rápida `[📦 Poner Stock en 0]` con confirmación previa y diálogo explicativo.
   - Refrescar reactivamente las métricas de bodega, alertas de stock crítico y la tabla de inventario.
4. **Preservación Estricta de Resto del Sistema:**
   - El pedido y cliente de "BRS Kinder B" (Spec 030), el Plan de Cuentas Contable (Spec 027), los clientes, compras, gastos y transferencias no deben sufrir alteraciones.

## 3. Criterios de Aceptación
- Todos los elementos en `storage.getInventory()` tienen `currentStock === 0`.
- El catálogo de artículos se mantiene completo en su estructura y metadatos.
- La tabla de inventario en `index.html` muestra "0" en la columna de Stock Actual para todos los ítems.
- Las tarjetas de métricas de bodega y stock crítico se recalculan de forma reactiva y consistente.
- 100% de las pruebas automatizadas pasando.
