# Spec 008 — Enlace Prenda-Color-Talla de Pedido con Inventario y Auto-creación para Compras

## 1. Qué y Por Qué
En Novaprint, los pedidos registran prendas compuestas por una terna fundamental: **Prenda (`garmentType`)**, **Color (`color`)** y **Talla (`size`)** (por ejemplo: *Polera - Negro - L*, *Polerón - Azul Marino - 10*, *Gorra - Rojo - Única*).

Anteriormente (Spec 004), el sistema verificaba la disponibilidad de materiales comparando dicha terna con los registros existentes en `novaprint_inventory`. Sin embargo, si una prenda solicitada en un pedido **no existía previamente en el catálogo de inventario**, el sistema marcaba el ítem como `no_registrado`, lo omitía de la lista consolidada de compras de faltantes (`faltantesParaCompra`) y el usuario no podía generar la orden de compra automática ni reabastecer stock de dicho ítem, bloqueando el flujo natural de producción.

Esta especificación resuelve dicha brecha enlazando de forma determinista la terna Prenda-Color-Talla del pedido con los ítems de inventario y, **en caso de que el ítem no exista en bodega, creándolo automáticamente en el catálogo de inventario** (con stock inicial 0, categoría correspondiente, código estructurado y costo sugerido de referencia) para permitir proceder de inmediato a la compra y registro de proveedores.

---

## 2. Historias de Usuario
- **US-01 (Detección Integral de Faltantes):** Como administrador del taller, cuando un cliente solicite una prenda de un color o talla que nunca antes se ha registrado en inventario, deseo que el sistema contabilice estas unidades como faltantes en bodega en vez de ignorarlas.
- **US-02 (Auto-creación de Artículo para Comprar):** Como encargado de compras, al pulsar "Comprar Material Faltante" desde el pedido, deseo que los artículos no existentes sean dados de alta automáticamente en el inventario con sus atributos completos (prenda, color, talla, categoría y costo base) para que la orden de compra quede pre-llenada con sus IDs reales y costos válidos.
- **US-03 (Reabastecimiento Directo a Bodega):** Como encargado de bodega, cuando se confirme y guarde la compra del material faltante, deseo que el stock del ítem recién creado se incremente automáticamente y refleje disponibilidad en el pedido vinculado.

---

## 3. Requisitos Funcionales en Formato EARS

### Requisitos Ubicuos (Ubiquitous)
- **REQ-01:** La vinculación entre una prenda de pedido y el inventario DEBE basarse en la coincidencia exacta normalizada (sin tildes, minúsculas, espacios recortados) de la terna: `garmentType`, `color` y `size`.
- **REQ-02:** Los artículos auto-creados en el inventario DEBEN persistirse en `novaprint_inventory` con los siguientes campos obligatorios:
  - `id`: Identificador único con prefijo `INV-` (ej. `INV-ABC123-XYZW`).
  - `code`: Código alfanumérico generado por formato `${PRENDA}-${COLOR}-${TALLA}` (ej. `POL-NEG-10`, `POL-AZU-L`, `GOR-ROJ-U`).
  - `name`: Nombre descriptivo formateado `${garmentType} Lisa - ${color} Talla ${size}`.
  - `category`: `'Gorras en Blanco'` si la prenda es Gorra, o `'Prendas Lisas'` para Poleras, Polerones y Buzos.
  - `garmentType`, `color`, `size`.
  - `unit`: `'unidad'`.
  - `currentStock`: `0`.
  - `minStock`: `5`.
  - `unitCost`: Costo base de referencia del cotizador textil (`COSTOS_REFERENCIA.prendasBase`).

### Requisitos de Evento (Event-Driven)
- **REQ-03:** CUANDO `calcularFaltantesPedido` evalúe un pedido, DEBE considerar cualquier prenda no registrada (`encontrado === false`) como faltante con `faltante = cantidadRequerida`, incluyéndola en `totalPrendasFaltantes`.
- **REQ-04:** CUANDO el usuario active el flujo de compra de faltantes (`abrirModalCompraConFaltantes` o `comprarFaltantesDePedido`), el sistema DEBE verificar si cada prenda existe en inventario; si no existe, DEBE invocar `asegurarItemInventarioPrenda` para crearla inmediatamente antes de abrir el modal de compra `#dialog-purchase`.
- **REQ-05:** CUANDO se guarde la compra generada (`guardarCompraDesdeFormulario`), el sistema DEBE actualizar el stock del artículo creado en el paso anterior mediante la sincronización estándar existente (`savePurchase`).
- **REQ-06:** CUANDO se guarde un nuevo pedido (`guardarPedidoDesdeFormulario`), el sistema DEBE asegurar que todas las prendas del pedido queden registradas en el catálogo de inventario para que los semáforos de stock y alertas en tarjetas de pedidos reflejen la disponibilidad de forma determinista.

---

## 4. Criterios de Aceptación
1. `NovaprintProduction.calcularFaltantesPedido` detecta tanto ítems con stock insuficiente como ítems no registrados previamente en inventario.
2. `NovaprintStorage.asegurarItemInventarioPrenda(garmentType, color, size, opciones)` busca por la terna o crea un nuevo ítem en `novaprint_inventory` con stock 0 y atributos estándar.
3. Al pulsar "Comprar Material Faltante" en un pedido con prendas nuevas, los artículos se crean en inventario y se precargan en el formulario de compra con sus respectivos IDs y cantidades.
4. Al guardar la compra, el stock del artículo en bodega pasa de 0 a la cantidad comprada.
5. El badge de stock en el formulario de pedido y en el tablero kanban se actualiza acorde al nuevo stock.
6. Ninguna funcionalidad previa (precios, descuentos, IVA, Delivery, fabricación, tickets) se ve alterada.
7. El 100% de la suite de pruebas automatizadas pasa en verde.

