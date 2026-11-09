# Spec 021 — Separar Compra de Poleras y Estampado DTF en 2 Facturas para 2 Proveedores Distintos

Estado: implementada

## 1. Contexto y Problema
En el taller de **Novaprint**, las prendas textiles base (poleras de algodón, poleras de poliéster, polerones, buzos y gorras) y los insumos de estampado (matrices y transferencias DTF, películas, tintas) provienen de **cadenas de suministro y proveedores comerciales completamente diferentes**:
1. **Proveedor Textil:** Especialistas en confección y distribución mayorista de prendas lisas (ej. *Textiles Mayoristas Chile*).
2. **Proveedor Gráfico / DTF:** Especialistas en insumos de impresión, bajada de matrices y metros lineales de transferencias DTF (ej. *Insumos Gráficos DTF Sur*).

Cuando un operador genera una compra —especialmente al utilizar la función **"🛒 Comprar Material Faltante"** (Spec 020) que agrupa en una misma lista las prendas faltantes y las unidades de estampado necesarias para el pedido, o al editar manualmente una compra mixta preexistente—, todos los artículos quedan agrupados bajo una sola factura y un solo proveedor.

Esta agrupación mixta genera inconsistencias tributarias y operativas:
- No es posible rendir contablemente una única factura a un proveedor textil si este no vende estampados DTF, ni a un proveedor de DTF si este no provee las poleras.
- El operador debe poder **separar la compra en dos facturas independientes**, una dirigida al proveedor de Poleras y otra dirigida al proveedor de Estampado DTF, asignando a cada una su respectivo número de factura/boleta, proveedor y desglose de costos.

## 2. Historias de Usuario
- **Como operador o encargado de compras**, al editar una compra (o al registrar compras desde material faltante) que contenga tanto prendas como estampados DTF, quiero poder separar la compra en 2 facturas con un clic, asignando automáticamente cada grupo de ítems a su proveedor correspondiente.
- **Como administrador contable**, quiero que el sistema genere dos compras formales e independientes en el módulo de compras y en el libro diario contable, cada una con su número de documento de respaldo (factura o boleta) y totales exactos.
- **Como encargado de bodega**, quiero que las existencias de inventario de las poleras y de los estampados se mantengan exactamente cuadradas sin sufrir duplicación ni descuento erróneo de stock durante la división.

## 3. Requisitos Funcionales (Formato EARS)

### [REQ-021-1] Clasificación Inteligente de Ítems (Textiles vs Estampado DTF)
- **El sistema** debe proveer la función `clasificarItemCompra(item, inventario)` en `NovaprintProduction`:
  - Retorna `'textil'` cuando el ítem pertenezca a la categoría `'Prendas Lisas'`, `'Gorras en Blanco'` o su nombre contenga `'Polera'`, `'Polerón'`, `'Buzo'`, `'Gorra'`, `'Algodón'` o `'Poliéster'`.
  - Retorna `'dtf'` cuando el ítem pertenezca a la categoría `'Insumos DTF'`, `'Insumos de Estampado'` o su nombre contenga `'Estampado'`, `'DTF'`, `'Transfer'`, `'Película'` o `'Poliamida'`.
- Debe proveer la función `esCompraMixta(items, inventario)` que determine si una lista de ítems contiene simultáneamente al menos 1 ítem textil y al menos 1 ítem DTF.

### [REQ-021-2] Detección y Acción de Separación en "Editar Compra" y Modal de Compras
- **En el modal `#dialog-purchase`**, cuando los ítems cargados en el formulario constituyan una compra mixta:
  - El sistema debe desplegar un banner informativo visible con el botón de acción rápida `[✂️ Separar en 2 Facturas (Poleras / DTF)]`.
- **En la tabla de Compras (`#view-purchases`)**:
  - Toda compra registrada que contenga ítems mixtos debe incluir en su columna de acciones el botón `[✂️]` con tooltip *"Separar en 2 Facturas: Poleras y DTF"*.

### [REQ-021-3] Modal Especializado de División (`#dialog-split-purchase`)
- **Al presionar "Separar en 2 Facturas"**, el sistema debe abrir el diálogo modal `#dialog-split-purchase` presentando dos secciones independientes y simultáneas:
  - **Factura 1 — Poleras / Prendas Textiles:**
    - Selector de Proveedor preseleccionado con el proveedor textil oficial (*Textiles Mayoristas Chile* o categoría 'Prendas Lisas').
    - Campo editable N° Factura / Boleta (sugerido con sufijo `-POL`).
    - Fecha de emisión de la compra.
    - Tabla con las poleras/prendas a facturar, cantidades, costos unitarios y subtotales.
    - Casilla de IVA (19%) y Flete/Delivery correspondiente a este proveedor.
    - Subtotal Neto, IVA, Delivery y Total de Factura 1.
  - **Factura 2 — Estampado DTF:**
    - Selector de Proveedor preseleccionado con el proveedor DTF oficial (*Insumos Gráficos DTF Sur* o categoría 'Insumos DTF').
    - Campo editable N° Factura / Boleta (sugerido con sufijo `-DTF`).
    - Fecha de emisión de la compra.
    - Tabla con los insumos de estampado DTF a facturar, cantidades, costos unitarios y subtotales.
    - Casilla de IVA (19%) y Flete/Delivery correspondiente a este proveedor.
    - Subtotal Neto, IVA, Delivery y Total de Factura 2.

### [REQ-021-4] Ejecución de la Separación y Cuadratura de Stock
- **Al pulsar "✅ Confirmar y Generar 2 Facturas"**:
  - Si la compra original ya tenía ID persistido (`existingId`):
    - Se actualiza la compra original conservando exclusivamente los ítems de Poleras con el proveedor textil y sus totales recalculados.
    - Se crea una nueva compra en `novaprint_purchases` con los ítems de Estampado DTF, el proveedor de DTF y sus totales recalculados.
  - Si la compra estaba siendo creada desde el formulario sin ID guardado aún (ej. generada por faltantes):
    - Se registran ambas compras como nuevas entidades independientes en `novaprint_purchases`.
  - El stock físico de bodega debe mantenerse estrictamente idéntico y sin variaciones espurias (la suma de ítems de ambas facturas coincide con los ítems de la compra previa).
  - Ambos modales se cierran, se notifica con un toast informativo de éxito indicando ambos IDs de compra y se refrescan las vistas de Compras, Inventario y Contabilidad.

### [REQ-021-5] Preservación de Compras Simples y Retrocompatibilidad
- Las compras que contengan únicamente prendas textiles o únicamente insumos de estampado no activarán el banner de separación obligatoria y mantendrán su flujo de edición estándar sin alteraciones.
- Las 158 pruebas unitarias existentes deben continuar ejecutándose con 0 errores.
