# Plan de Implementación — Spec 008: Enlace Prenda-Color-Talla y Auto-creación en Inventario

## 1. Capa de Persistencia y Almacenamiento (`assets/js/storage.js`)
- Añadir función auxiliar pura o interna `generarCodigoPrenda(garmentType, color, size)`:
  - Extrae prefijo de prenda (POL, POLER, BUZ, GOR), de color (NEG, BLA, AZM, etc.) y talla (10, 12, S, M, L, XL, U).
- Implementar la función `asegurarItemInventarioPrenda(garmentType, color, size, datosExtra = {})`:
  - Normaliza la terna: `garmentType`, `color`, `size`.
  - Busca en `getInventory()` si ya existe un artículo con esa coincidencia exacta.
  - Si existe, lo retorna.
  - Si no existe:
    - Determina `category`: `'Gorras en Blanco'` si la prenda incluye 'gorra', o `'Prendas Lisas'`.
    - Determina `unitCost`: asigna costo de referencia según prenda base (Polera: 2800, Polerón: 11000, Buzo: 12000, Gorra: 3500, etc.).
    - Crea un nuevo objeto de inventario con `currentStock: 0`, `minStock: 5`, `unit: 'unidad'`.
    - Guarda mediante `saveInventoryItem(nuevoItem)`.
    - Retorna el ítem recién creado.
- Exportar `asegurarItemInventarioPrenda` en `NovaprintStorage`.

---

## 2. Capa de Lógica de Negocio de Producción (`assets/js/production.js`)
- Ajustar `calcularFaltantesPedido(inventario, itemsPedido)`:
  - Cuando `verif.encontrado === false` (`verif.estado === 'no_registrado'`):
    - Sumar `verif.faltante` a `totalPrendasFaltantes`.
    - Incluir el ítem en `faltantesParaCompra` estructurado con `isNew: true`, `garmentType: it.garmentType`, `color: it.color`, `size: it.size`, `quantityNeeded: verif.faltante`, `unitCost: ...`, `name: `${it.garmentType} Lisa - ${it.color} Talla ${it.size}``.
  - Esto garantiza que `tieneFaltantes` sea `true` y que el pedido alerte correctamente sobre la necesidad de compra.

---

## 3. Capa de Interfaz de Usuario (`assets/js/ui.js`)
1. **Flujo de Compra de Faltantes (`abrirModalCompraConFaltantes` / `comprarFaltantesDePedido`):**
   - Antes de mapear los ítems a la orden de compra en `abrirModalCompraConFaltantes`:
     - Para cada ítem en `itemsFaltantes`: si no posee `inventoryId` o fue marcado como nuevo, se invoca `storage.asegurarItemInventarioPrenda(f.garmentType, f.color, f.size)`.
     - Se actualiza `f.inventoryId = itemCreado.id` y `f.unitCost = itemCreado.unitCost`.
   - Con esto, al poblar `currentPurchaseItems`, cada ítem cuenta con un `inventoryItemId` válido que enlaza directamente con el inventario físico.
2. **Registro de Pedidos (`guardarPedidoDesdeFormulario`):**
   - Al guardar un pedido, iterar sobre `pedidoData.items` y llamar a `storage.asegurarItemInventarioPrenda(it.garmentType, it.color, it.size)`.
   - Esto asegura que todas las prendas del pedido existan formalmente en bodega con sus registros de stock, permitiendo que las tarjetas del kanban muestren inmediatamente `⚠️ Bodega: 0 | Faltan: X` con el botón `[ 🛒 Comprar ]` activo.

---

## 4. Pruebas Unitarias y de Integración
- `tests/storage.test.js`:
  - Probar que `asegurarItemInventarioPrenda` retorna un ítem existente si ya existe.
  - Probar que crea un nuevo ítem en `novaprint_inventory` con stock 0 y atributos correctos si no existe.
- `tests/production.test.js`:
  - Probar que `calcularFaltantesPedido` contabiliza ítems no registrados como faltantes y los añade a `faltantesParaCompra`.
- Ejecutar suite completa `node --test tests/*.test.js` y verificar 100% en verde.

