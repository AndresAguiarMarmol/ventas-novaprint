# Plan Técnico — Spec 021: Separar Compra de Poleras y Estampado DTF en 2 Facturas para 2 Proveedores Distintos

## 1. Arquitectura y Módulos Involucrados

1. **`assets/js/production.js` (Lógica de Producción y Compras):**
   - Incorporar `clasificarItemCompra(item, inventario)`: retorna `'textil'` o `'dtf'`.
   - Incorporar `esCompraMixta(items, inventario)`: booleano que valida si hay al menos 1 ítem textil y 1 ítem DTF.
   - Incorporar `separarItemsCompra(items, inventario)`: agrupa los ítems en `{ itemsPoleras: [], itemsDtf: [] }`.
   - Incorporar `resolverProveedorParaCategoria(categoria, proveedores)`: busca inteligentemente el proveedor más adecuado según `category === 'Prendas Lisas'` vs `category === 'Insumos DTF'`.

2. **`assets/js/storage.js` (Capa de Persistencia y Separación Atómica):**
   - Incorporar `separarCompraEnDos(compraOriginalId, datosPoleras, datosDtf)`:
     - Gestiona la transacción de actualización para la compra textil y la creación de la nueva compra DTF.
     - Garantiza que la reversión y reaplicación de inventario en `savePurchase` no altere las existencias totales en bodega (cuadratura de stock $\Delta = 0$).

3. **`index.html` (Estructura de la Vista y Modales):**
   - Añadir en `#dialog-purchase` el banner interactivo `#purchase-split-banner` con el botón `#btn-split-purchase`.
   - Añadir el diálogo nativo `<dialog id="dialog-split-purchase">` con las dos columnas/tarjetas para Factura 1 (Poleras) y Factura 2 (Estampados DTF), selectores de proveedor, campos de N° de factura, tablas de ítems y desgloses de totales con botón de confirmación.

4. **`assets/js/ui.js` (Interfaz de Usuario y Controladores):**
   - En `editarCompra(purchaseId)` y `renderTablaItemsCompraFormulario()`:
     - Evaluar si los ítems cargados corresponden a compra mixta; si es así, mostrar `#purchase-split-banner`.
   - En `renderPurchasesTable()`:
     - Si una compra tiene ítems mixtos, mostrar el botón `[✂️]` en la columna de operaciones.
   - Implementar `abrirModalSepararCompra(purchaseIdOItems)`:
     - Carga los datos de las dos facturas en `#dialog-split-purchase`, asignando proveedores sugeridos (`Textiles Mayoristas Chile` para poleras y `Insumos Gráficos DTF Sur` para DTF), correlativos de factura, y calcula totales por separado.
   - Implementar `confirmarSeparacionCompra()`:
     - Lee los datos de ambas facturas, ejecuta la separación en almacenamiento, cierra modales, emite toast y refresca la aplicación.

5. **`tests/split_purchases_poleras_dtf.test.js` (Pruebas Automatizadas):**
   - Pruebas unitarias de clasificación de ítems (textil vs dtf).
   - Pruebas de detección de compra mixta (`esCompraMixta`).
   - Pruebas de agrupación y cálculo de totales independientes.
   - Pruebas de persistencia atómica en `storage` con verificación de balance de stock en inventario y Libro Diario contable.
   - Pruebas de integración de UI con modales y eventos.

---

## 2. Flujo de Datos

```
[Compra Mixta en Formulario / Tabla]
          │
          ▼
   esCompraMixta() === true
          │
          ▼
  Mostrar banner / botón [✂️ Separar en 2 Facturas]
          │
          ▼ Click
  abrirModalSepararCompra()
          │
          ├──> Factura 1: Proveedor Textil (Poleras/Prendas)
          │    - Items: [Polera Algodón M, Polerón L, ...]
          │    - Doc: FAC-123-POL
          │    - Totales Factura 1
          │
          └──> Factura 2: Proveedor DTF (Estampado DTF)
               - Items: [Estampado DTF Adelante, Estampado DTF Ambos, ...]
               - Doc: FAC-123-DTF
               - Totales Factura 2
          │
          ▼ Click "Confirmar y Generar 2 Facturas"
  confirmarSeparacionCompra()
          │
          ├──> Factura 1: savePurchase(compraPoleras, originalId)
          └──> Factura 2: savePurchase(compraDtf)
          │
          ▼
  Inventario cuadrado (Stock neto = Stock previo)
  Contabilidad actualizada (2 facturas de compras registradas)
  Toast de éxito + Refrescar UI
```

