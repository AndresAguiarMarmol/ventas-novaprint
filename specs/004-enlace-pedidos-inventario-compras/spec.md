# Spec 004 — Enlace de Pedidos con Inventario, Detección de Faltantes y Descuento de Stock

## 1. Qué y Por Qué
En un taller de estampado textil como **Novaprint**, los pedidos de clientes requieren prendas lisas base (poleras, polerones, buzos, gorras) que deben estar disponibles en bodega antes de entrar a las estaciones de producción (preparación y estampado).
Actualmente, el catálogo de inventario almacena las prendas base con su color, talla y existencias, pero el módulo de pedidos opera de forma independiente, obligando al usuario a revisar el stock manualmente para saber si debe comprar material extra.

Esta especificación formaliza el **enlace automático bidireccional entre Ventas y Producción**:
1. Cruce en tiempo real entre las prendas solicitadas en un pedido (`garmentType`, `color`, `size`) y los artículos del inventario.
2. Detección automática de faltantes con balance de unidades:
   $$\text{Faltante} = \max(0, \text{Cantidad Requerida} - \text{Stock en Bodega})$$
3. Acceso directo con un solo clic a la orden de compra de insumos (`🛒 Comprar Faltante`) para surtir exactamente lo que falta.
4. Descuento automático del stock de bodega cuando el pedido entra a fabricación en el taller (`⚡ Taller`).

---

## 2. Historias de Usuario
- **US-01 (Verificación en toma de pedido):** Como encargado de ventas, al registrar o editar las prendas de un pedido deseo ver inmediatamente cuántas unidades existen en bodega para comprometer fechas de entrega realistas con el cliente.
- **US-02 (Detección y alerta de compras necesarias):** Como encargado de abastecimiento, al revisar un pedido confirmado deseo ver un resumen de materiales faltantes y presionar un botón para generar automáticamente la compra a los proveedores correspondientes.
- **US-03 (Descuento de stock en taller):** Como jefe de taller, al despachar un pedido al área de producción mediante `⚡ Taller` deseo que las prendas usadas se resten automáticamente de la bodega para que el inventario siempre refleje las existencias físicas reales.

---

## 3. Requisitos Funcionales en formato EARS

### Requisitos Ubicuos (Ubiquitous)
- **REQ-01:** El sistema DEBE cruzar cada prenda del pedido con el inventario comparando normalizadamente `garmentType`, `color` y `size`.
- **REQ-02:** El sistema DEBE clasificar cada requerimiento en uno de tres estados:
  - `suficiente`: Stock actual $\ge$ Cantidad pedida.
  - `faltante`: Stock actual $<$ Cantidad pedida (déficit $> 0$).
  - `no_registrado`: No existe un artículo en inventario con esa combinación exacta.

### Requisitos Conducidos por Eventos (Event-Driven)
- **REQ-03:** CUANDO el usuario agregue, modifique o cambie la prenda, color, talla o cantidad en el formulario de pedido, el sistema DEBE actualizar en vivo el indicador de disponibilidad de cada fila.
- **REQ-04:** CUANDO exista al menos un ítem con estado `faltante`, el sistema DEBE mostrar un banner de aviso en el pedido con el total de prendas a comprar y un botón directo `[ 🛒 Generar Compra de Faltantes ]`.
- **REQ-05:** CUANDO el usuario haga clic en `[ 🛒 Generar Compra de Faltantes ]`, el sistema DEBE abrir el modal de compra `#dialog-purchase` con las líneas de compra pre-cargadas con los ítems y cantidades faltantes.
- **REQ-06:** CUANDO el usuario presione el botón `[ ⚡ Taller ]` para enviar un pedido a fabricación, el sistema DEBE descontar del inventario las existencias correspondientes a las prendas encontradas y registrar la salida.

---

## 4. Reglas de Negocio
1. **Búsqueda por Atributos:** La coincidencia de stock se realiza por `garmentType` (ej. "Polera"), `color` (ej. "Negro") y `size` (ej. "L").
2. **Protección contra Stock Negativo:** Si el stock actual es menor a la cantidad a descontar, el stock se ajusta a 0 y se genera una notificación de advertencia sobre la diferencia no cubierta.
3. **Prendas No Registradas:** Si un pedido incluye una prenda que no está en el catálogo de inventario (ej. un color especial), se informa como "Sin control de stock en bodega" sin bloquear el pedido.

---

## 5. Criterios de Aceptación
- [ ] En el formulario de nuevo pedido, cada fila de prenda muestra su disponibilidad en tiempo real (verde si hay stock, rojo si falta, gris si no está registrado).
- [ ] Si faltan prendas, el pedido muestra claramente cuántas faltan y ofrece la acción directa de compra.
- [ ] Al presionar `⚡ Taller`, el stock en inventario disminuye exactamente en la cantidad de prendas utilizadas.
- [ ] Todas las pruebas unitarias pasan en verde y cubren la lógica pura de verificación, cálculo de faltantes y descuento.

