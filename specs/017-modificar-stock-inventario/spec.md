# Spec 017 — Opción para Modificar el Stock de Inventarios

Estado: implementada

## 1. Contexto y Objetivo
En el taller textil y gráfico de **Novaprint**, el inventario de prendas base (poleras, polerones, buzos, gorras) e insumos (film DTF, poliamida, tintas, vinilos) experimenta variaciones operativas cotidianas: conteos físicos periódicos, mermas de producción por pruebas de calibración o fallas de planchado, devoluciones, muestras entregadas o ajustes manuales.

Anteriormente, para modificar las existencias de un artículo en inventario, el usuario debía recurrir al formulario completo de edición (`#dialog-inventory`), el cual solicita y revalida todos los atributos del ítem (código, nombre, categoría, tipo de prenda, color textil, talla, unidad, proveedor y costo unitario), lo que resulta lento y propenso a errores involuntarios al editar datos ajenos al stock.

El objetivo de esta especificación es **incorporar una opción dedicada y ágil para modificar el stock de inventario** directamente desde la tabla de inventario (`#view-inventory`), mediante un diálogo modal especializado (`#dialog-adjust-stock`) y una API de persistencia específica (`storage.updateInventoryStock`), permitiendo establecer el nuevo stock o ajustar cantidades con botones rápidos (+/-) y registro opcional de motivo, actualizando en tiempo real las métricas, alertas de stock crítico y disponibilidad para pedidos.

## 2. Usuarios y Roles
- **Encargado de Taller / Bodeguero de Novaprint:** Necesita registrar ajustes rápidos de existencias tras un conteo físico o reportar mermas sin alterar el catálogo de productos ni sus costos de compra.

## 3. Historias de Usuario
- **HU-1**: Como bodeguero/operador, quiero ver en la tabla de inventarios una opción clara y directa ("Modificar Stock" `[📦]`) para ajustar las existencias de cualquier artículo.
- **HU-2**: Como operador, quiero que al hacer clic en el botón de modificar stock o en la cifra de stock actual se abra un modal enfocado con los datos del artículo (código, nombre, stock actual) y un campo numérico para ingresar el nuevo valor o usar botones rápidos (+1, -1, +5, -5, +10, -10).
- **HU-3**: Como operador, quiero poder especificar opcionalmente el motivo del ajuste (conteo físico, merma, consumo en taller, etc.) y una breve nota explicativa.
- **HU-4**: Como operador, quiero que el sistema valide que el stock nunca sea negativo ($\ge 0$) y que al confirmar se actualice de inmediato la bodega, se refresquen las métricas de inventario, se emita un toast informativo y se actualicen los badges de stock en pedidos.

## 4. Requisitos Funcionales
- **RF-1 (API de Persistencia en `storage.js`):**
  - Implementar `updateInventoryStock(itemId, newStock, options = {})`.
  - Validar que `newStock` sea un número $\ge 0$.
  - Actualizar `currentStock`, `updatedAt` y opcionalmente registrar `lastStockAdjustment` con fecha, stock anterior, nuevo stock y motivo.
  - Persistir en `localStorage` bajo `novaprint_inventory` y retornar el ítem actualizado.
- **RF-2 (Diálogo Modal en `index.html`):**
  - Añadir `<dialog id="dialog-adjust-stock">` con cabecera, ficha del ítem (código, nombre, talla, color), visualización del stock actual y mínimo, campo numérico para el nuevo stock, botones de atajo (+/-), selector de motivo y notas opcionales.
- **RF-3 (Interacción en `ui.js`):**
  - En `renderInventoryTable`: convertir la cifra de stock actual en un elemento interactivo con tooltip y añadir en la columna Acciones el botón `[📦]` con título "Modificar Stock".
  - Implementar `abrirModalModificarStock(itemId)`, `aplicarAjusteStockDelta(delta)` y `guardarModificacionStock()`.
  - Sincronizar reactivamente con `NovaprintMain.refrescarDatos()`.
- **RF-4 (Preservación de Funcionalidades):**
  - Mantener intacto el modal `#dialog-inventory` para alta y edición integral de artículos.
  - Mantener intacto el incremento de stock por compras (`storage.savePurchase`) y el consumo en taller (`production.js`).
- **RF-5 (Pruebas Automatizadas):**
  - Crear suite en `tests/inventory_stock_adjustment.test.js` con pruebas unitarias para persistencia, validaciones de stock negativo, renderizado de botones y flujo de guardado.

## 5. Criterios de Aceptación
1. Cada fila de la tabla de inventario tiene botón directo `[📦]` y stock actual clicable para modificar stock.
2. El modal `#dialog-adjust-stock` carga con el stock actual y permite editar directamente o ajustar con botones rápidos.
3. No se permite guardar valores menores a 0 (se corrige a 0).
4. Al guardar, se actualiza el stock en bodega, se refrescan las métricas de artículos/valorización/alertas críticas y se emite un toast de confirmación.
5. 100% de pruebas unitarias aprobadas.
