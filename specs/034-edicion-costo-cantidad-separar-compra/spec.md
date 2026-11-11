# Spec 034: Edición de Costo y Cantidad al "Separar Compra en 2 Facturas"

## 1. Contexto y Problema
En el módulo de Compras de Insumos (`#dialog-purchase`), la funcionalidad **"Separar en 2 Facturas"** (`#dialog-split-purchase`, Spec 021) permite dividir una orden de compra mixta en dos facturas independientes para dos proveedores distintos:
1. **Factura 1:** Poleras y prendas textiles de confección (Proveedor Textil).
2. **Factura 2:** Estampados DTF e insumos gráficos (Proveedor de Estampado).

Actualmente, al abrir este modal (`abrirModalSepararCompra`), los artículos de ambas tablas (`#split-items-poleras-tbody` y `#split-items-dtf-tbody`) se renderizan como texto estático (`<td>${it.quantity}</td>` y `<td>${it.unitCost}</td>`).

El usuario no tiene la posibilidad de:
- Modificar las cantidades de las prendas o estampados si el proveedor despachó o facturó una cantidad distinta.
- Modificar el costo unitario si los precios pactados o negociados con cada proveedor varían respecto al costo de referencia original.

El usuario solicita:
> *"al registrar una "Compra de Insumos" opcion "Separar en 2 Facturas", no se puede editar costo ni cantidad . Procesar usando metodologia sdd"*

---

## 2. Requerimientos Funcionales (Formato EARS)

### [REQ-01] Entradas Editables para Cantidad y Costo Unitario
- **Mientras** el modal de separación de compras (`#dialog-split-purchase`) esté abierto:
  - **El sistema deberá** renderizar cada fila de la tabla de Poleras (`#split-items-poleras-tbody`) y de la tabla de Estampado DTF (`#split-items-dtf-tbody`) con campos de entrada interactivos (`<input type="number">`) para la **Cantidad** (`min="1"`) y el **Costo Unitario** (`min="0" step="any"`).
  - **El sistema deberá** pre-poblar dichos campos con los valores provenientes de la compra original o material faltante.

### [REQ-02] Reactividad Instantánea y Recálculo de Totales
- **Cuándo** el usuario modifique la cantidad o el costo unitario de cualquier prenda o estampado:
  - **El sistema deberá** actualizar en tiempo real el subtotal de la fila afectada ($\text{Subtotal} = \text{Cantidad} \times \text{Costo Unitario}$).
  - **El sistema deberá** recalcular reactivamente el contador de unidades de la factura (`split-badge-count-poleras` y `split-badge-count-dtf`).
  - **El sistema deberá** recalcular automáticamente el subtotal neto, el IVA (si está activo el 19%), el Delivery y el total de la factura correspondiente.
  - **El sistema deberá** actualizar el Gran Total Consolidado (`#split-grand-total`) de ambas facturas.

### [REQ-03] Persistencia y Cuadratura al Confirmar
- **Cuándo** el usuario presione *"Confirmar y Generar 2 Facturas"* (`#btn-confirm-split-purchase`):
  - **El sistema deberá** generar o actualizar las dos órdenes de compra en `novaprint_purchases` utilizando exactamente las cantidades y costos unitarios editados por el usuario.
  - **El sistema deberá** impactar el stock físico de bodega y los costos unitarios de reposición en `novaprint_inventory` reflejando fielmente los valores finales confirmados.

---

## 3. Criterios de Aceptación
1. En el diálogo "Separar en 2 Facturas", las columnas "Cant." y "Costo" contienen inputs numéricos interactivos editables tanto para Poleras como para DTF.
2. Al cambiar cantidad o costo en cualquier fila, el subtotal de fila, el badge de conteo, el total de la factura y el gran total consolidado se recalculan inmediatamente sin recargar la página.
3. Al confirmar, las dos compras creadas/actualizadas registran las cantidades y costos unitarios modificados.
4. Las pruebas automatizadas existentes y las nuevas pruebas de edición en separación pasan al 100%.

