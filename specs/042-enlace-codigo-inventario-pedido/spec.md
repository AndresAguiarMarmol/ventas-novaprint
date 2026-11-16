# Especificación SDD — Spec 042: Enlace de Pedido con Código de Inventario en Detalle de Prendas & Técnicas

## 1. Problema y Contexto
En el formulario de pedidos (`#dialog-order`), la sección *"Detalle de Prendas & Técnicas"* permitía configurar prendas mediante los campos independientes Prenda, Color, Talla, Técnica, Estampado, Cantidad y Precio. La asociación con los artículos registrados en bodega (`novaprint_inventory`) se realizaba de forma inferida a través del cruce de texto de la terna `garmentType`, `color` y `size`.

El usuario requiere agregar explícitamente el campo **Código del Inventario** en cada fila de la tabla de prendas para enlazar el pedido de manera unívoca y directa con las existencias registradas en bodega.

---

## 2. Historias de Usuario
- **HU-01 (Selección por Código de Inventario):** Como vendedor o encargado de taller, al agregar o editar una fila de prenda en un pedido, quiero disponer de un selector desplegable con los códigos de las prendas existentes en inventario (ej. `POL-AZU-M — Polera Lisa Azul M (Stock: 15)`), para seleccionar de forma rápida e inequívoca el insumo físico que se utilizará.
- **HU-02 (Sincronización Bidireccional):** Como operador, cuando selecciono un código de inventario, quiero que los campos Prenda, Color y Talla se completen automáticamente; y si decido cambiar la prenda, color o talla manualmente, quiero que el selector de código se actualice automáticamente si el artículo existe en bodega.
- **HU-03 (Soporte de Prendas No Registradas):** Como vendedor, si el cliente solicita una prenda que aún no existe en el catálogo de inventario, quiero poder seleccionar `(Sin código / Prenda nueva)` y especificar la prenda, color y talla libremente para que se auto-cree al comprar faltantes (según Spec 008).
- **HU-04 (Trazabilidad en Tickets y Comprobantes):** Como operario de confección y estampado en taller, quiero ver el código de inventario impreso entre corchetes (ej. `Polera Azul M [POL-AZU-M]`) en el ticket impreso o térmico para ubicar de inmediato la prenda en los estantes de bodega.
- **HU-05 (Deducción Exacta por Código):** Como encargado de bodega, cuando el pedido se concluye o pasa a producción, el descuento de stock debe realizarse directamente sobre el artículo que coincida con el `inventoryCode` / `inventoryItemId` seleccionado.

---

## 3. Requisitos Funcionales (EARS)

- **RF-01 (Columna de Código en Formulario):** *EL SISTEMA DEBE* incluir la columna `Cód. Inventario` en la cabecera `<thead>` y en cada fila `<tr>` del cuerpo `#order-items-tbody` dentro de *"Detalle de Prendas & Técnicas"*.
- **RF-02 (Selector Desplegable de Códigos):** *EL SISTEMA DEBE* renderizar en cada fila un `<select>` que liste los códigos de inventario de prendas físicas disponibles con su nombre y stock actual, precedido por la opción `"(Sin código / Prenda nueva)"`.
- **RF-03 (Auto-completado al Seleccionar Código):** *CUANDO* el usuario seleccione un código del desplegable, *EL SISTEMA DEBE* rellenar automáticamente los campos `garmentType`, `color` y `size` de la fila con los valores correspondientes al artículo de inventario, actualizando el precio sugerido y la insignia de disponibilidad de bodega.
- **RF-04 (Auto-detección al Modificar Prenda/Color/Talla):** *CUANDO* el usuario modifique manualmente `garmentType`, `color` o `size`, *EL SISTEMA DEBE* buscar en `novaprint_inventory` si existe un artículo con esa terna y, de encontrarlo, seleccionar automáticamente su código en el selector de la fila. Si no existe, fijar la opción en `"(Sin código / Prenda nueva)"`.
- **RF-05 (Persistencia en el Pedido):** *AL GUARDAR EL PEDIDO* (`guardarPedidoDesdeFormulario`), *EL SISTEMA DEBE* persistir los campos `inventoryCode` (string) e `inventoryItemId` (string) en cada elemento del arreglo `items[]`.
- **RF-06 (Prioridad de Búsqueda en Inventario):** *AL VERIFICAR DISPONIBILIDAD, DESCONTAR O RESTITUIR STOCK* (`verificarDisponibilidadPrenda`, `descontarInventarioPorPedido`, `restituirInventarioPorPedido`), *EL SISTEMA DEBE* buscar en primer lugar por `inv.id === item.inventoryItemId || inv.code === item.inventoryCode`, utilizando la terna `garmentType + color + size` únicamente como fallback retrocompatible.
- **RF-07 (Comprobantes y Tickets Imprimibles):** *EN EL COMPROBANTE DE TALLER* (`ticket.js`), *EL SISTEMA DEBE* presentar el código de inventario entre corchetes (ej. `[POL-AZU-M]`) junto a la descripción de la prenda cuando esté presente.
- **RF-08 (No modificar nada adicional):** *EL SISTEMA DEBE* conservar el 100% de las 320 pruebas unitarias existentes y su compatibilidad histórica.

---

## 4. Criterios de Aceptación
1. En la tabla del modal de pedido se muestra la columna `Cód. Inventario` con su desplegable respectivo.
2. Al elegir un código del selector, la prenda, color y talla se actualizan instantáneamente.
3. Al cambiar prenda, color o talla, el código se actualiza si el artículo existe en bodega.
4. Si se selecciona `(Sin código / Prenda nueva)`, el pedido se guarda válidamente con `inventoryCode: ''`.
5. Al avanzar o culminar el pedido, el descuento de existencias se aplica exactamente sobre el artículo del inventario vinculado.
6. El ticket impreso incluye el código entre corchetes cuando está definido.
7. 100% de pruebas unitarias pasando satisfactoriamente sin regresiones.
