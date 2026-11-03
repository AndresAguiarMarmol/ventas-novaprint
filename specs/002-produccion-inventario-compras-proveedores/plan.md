# Plan Técnico — Spec 002: Compras de Insumos, Inventarios y Proveedores

## 1. Archivos y responsabilidades

| Archivo | Responsabilidad principal | Requisitos cubiertos |
| :--- | :--- | :--- |
| `assets/js/production.js` | Funciones puras de lógica de producción: evaluación de stock crítico, aplicación de compras al inventario (incremento de existencias), cálculo de valorización monetaria de inventario y filtros por categoría/proveedor. | RF-1.1, RF-2.1, RF-2.2, RF-3.1 |
| `assets/js/storage.js` | Persistencia y métodos para proveedores (`novaprint_suppliers`), inventario (`novaprint_inventory`) y compras (`novaprint_purchases`), incluyendo seed data de insumos textiles (prendas lisas, bobinas DTF, vinilos, poliamida). | RF-1.1, RF-2.1, RF-3.1 |
| `index.html` | Estructura de las vistas completas de Inventario (`#view-inventory`), Compras (`#view-purchases`) y Proveedores (`#view-suppliers`), además de modales nativos `<dialog>` para registrar/editar proveedores, ítems y compras. | RF-1.1, RF-2.1, RF-2.2, RF-3.1 |
| `assets/js/ui.js` | Renderizado dinámico de tarjetas de proveedores, tabla de inventario con semáforo de existencias (badges de Stock Crítico vs Stock OK), listado de compras y modales reactivos. | RF-1.1, RF-2.1, RF-2.2, RF-3.1 |
| `assets/js/main.js` | Navegación entre las pestañas de producción, listeners de formularios de compras/proveedores/inventario y sincronización de datos. | RF-2.1, RF-3.1 |
| `tests/production.test.js` | Pruebas unitarias nativas con `node --test` para validar incrementos de stock por compra, detección de alertas críticas y valorización. | RF-2.1, RF-2.2, RF-3.1 |

---

## 2. Modelos de datos (Schemas)

### Proveedor (`Supplier`)
```json
{
  "id": "PRV-001",
  "name": "Textiles Mayoristas Chile",
  "contact": "Marcos Rivera",
  "phone": "+56911223344",
  "email": "ventas@textileschile.cl",
  "category": "Prendas Lisas",
  "address": "Av. Recoleta 890, Santiago",
  "notes": "Distribuidor de poleras 100% algodón y polerones franela."
}
```

### Ítem de Inventario (`InventoryItem`)
```json
{
  "id": "INV-001",
  "code": "POL-NEG-L",
  "name": "Polera Cuello Redondo 100% Algodón",
  "category": "Prendas Lisas",
  "garmentType": "Polera",
  "color": "Negro",
  "size": "L",
  "unit": "unidad",
  "currentStock": 35,
  "minStock": 20,
  "unitCost": 3200,
  "supplierId": "PRV-001",
  "supplierName": "Textiles Mayoristas Chile"
}
```

Categorías de Inventario permitidas:
- `"Prendas Lisas"` (Poleras, Polerones, Buzos)
- `"Gorras en Blanco"`
- `"Insumos DTF"` (Bobinas de Film DTF, Poliamida, Tintas DTF)
- `"Insumos Serigrafía"` (Tintas Plastisol, Emulsión)
- `"Vinilo Textil"` (Bobinas de Vinilo corte y reflectivo)
- `"Hilos y Accesorios"` (Conos de hilo de bordado, agujas, packaging)

### Compra de Insumos (`Purchase`)
```json
{
  "id": "CMP-20261101-001",
  "supplierId": "PRV-001",
  "supplierName": "Textiles Mayoristas Chile",
  "invoiceNumber": "FAC-8842",
  "date": "2026-11-01",
  "items": [
    {
      "inventoryItemId": "INV-001",
      "name": "Polera Cuello Redondo 100% Algodón (Negro L)",
      "quantity": 50,
      "unitCost": 3200,
      "subtotal": 160000
    }
  ],
  "totalAmount": 160000,
  "notes": "Compra para pedidos de colegios y empresas."
}
```

---

## 3. Funciones puras en `assets/js/production.js`

```javascript
// Detección de alerta de stock
function evaluarEstadoStock(currentStock, minStock) // 'critico' si currentStock <= minStock, sino 'normal'

// Aplicación de compra al inventario
function aplicarCompraAInventario(inventarioActual, itemsComprados)

// Valorización total del inventario
function calcularValorizacionInventario(inventario)

// Filtro de inventario por búsqueda y categoría
function filtrarInventario(inventario, { textoBusqueda, categoria, soloCriticos })

// Filtro de proveedores
function filtrarProveedores(proveedores, { textoBusqueda, categoria })

// Generador de ID correlativo de compra
function generarIdCompra(secuencia, fecha)
```

---

## 4. Estrategia de pruebas unitarias (`node --test tests/production.test.js`)
- Validar que al aplicar una compra a un inventario existente, se incremente la cantidad exacta de cada ítem.
- Validar que los ítems con stock menor o igual al mínimo sean marcados como 'critico'.
- Validar el cálculo de valorización monetaria total del inventario (`suma de currentStock * unitCost`).
- Validar filtrado de inventario y proveedores insensible a acentos y mayúsculas.

