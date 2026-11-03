# Spec 007 — Incorporación de Tallas Infantiles (Niños) en Pedidos e Inventario

## 1. Qué y Por Qué
En el taller de estampado textil Novaprint, una porción significativa de los pedidos corresponde a indumentaria infantil y colegial (poleras de curso, buzos de colegio, polerones de graduación básica y eventos deportivos).
Hasta el momento, la lista desplegable de tallas en el formulario de pedidos (`#dialog-order`) solo ofrecía tallas de adultos estándar (`XS, S, M, L, XL, XXL, Única`).

Esta especificación anexa formalmente las tallas infantiles numéricas estándar de la industria textil chilena:
**4, 6, 8, 10, 12, 14, 16, 18**

Asimismo, se estructuran las opciones en la lista desplegable mediante grupos visuales semánticos (`<optgroup>`) para diferenciar con claridad las tallas de **Niños** de las tallas de **Adultos / Estándar**, manteniendo total interoperabilidad con el motor de cotización de precios (`sales.js`), el control de existencias en bodega (`production.js`) y las sugerencias de autocompletado en inventario (`index.html`).

---

## 2. Historias de Usuario
- **US-01 (Registro de Pedidos Infantiles):** Como vendedor o administrador de Novaprint, al registrar una prenda en un pedido para colegios o niños, deseo seleccionar directamente su talla numérica (4, 6, 8, 10, 12, 14, 16, 18) desde el desplegable de tallas, para evitar tener que recurrir a notas manuales o descripciones ambiguas.
- **US-02 (Claridad Visual en la Selección):** Como usuario del sistema, al desplegar la lista de tallas, deseo ver claramente organizadas las opciones entre tallas de niños y tallas de adultos, para agilizar la selección en pedidos mixtos.
- **US-03 (Compatibilidad con Inventario y Taller):** Como encargado de taller y bodega, cuando un pedido incluya una prenda en talla de niño (ej. "Polera Negro Talla 10"), deseo que el sistema cruce y descuente correctamente el stock en bodega si existe inventario registrado con esa misma talla.

---

## 3. Requisitos Funcionales en Formato EARS

### Requisitos Ubicuos (Ubiquitous)
- **REQ-01:** El módulo de ventas DEBE definir la lista oficial de tallas infantiles `4, 6, 8, 10, 12, 14, 16, 18` junto con las tallas adultas `XS, S, M, L, XL, XXL, Única`.
- **REQ-02:** Las tallas infantiles NO DEBEN recibir recargo de talla especial (el recargo de +$1.200 se reserva exclusivamente para XXL y 3XL según `skill.md`).

### Requisitos de Evento (Event-Driven)
- **REQ-03:** CUANDO se renderice una fila de prenda en la tabla de ítems de pedido (`#dialog-order`), el selector de talla DEBE mostrar las opciones agrupadas por `<optgroup label="Niños">` y `<optgroup label="Adultos / Estándar">`.
- **REQ-04:** CUANDO el usuario seleccione una talla infantil (ej. "8" o "12"), el ítem de pedido DEBE guardar ese valor exacto en su propiedad `size`.
- **REQ-05:** CUANDO se edite un pedido existente o se cargue una prenda con una talla ya asignada (infantil o adulta), dicha talla DEBE quedar preseleccionada en el elemento `<select>`.
- **REQ-06:** CUANDO se ingrese un artículo en el inventario (`#inventory-size-input`), el sistema DEBE sugerir mediante datalist las tallas estándar incluyendo las infantiles.

---

## 4. Criterios de Aceptación
1. El desplegable de tallas en cada ítem del formulario de nuevo pedido incluye las opciones: `4, 6, 8, 10, 12, 14, 16, 18, XS, S, M, L, XL, XXL, Única`.
2. Las opciones están organizadas semánticamente con grupos visuales (`Niños` y `Adultos / Estándar`).
3. La selección de una talla infantil calcula el subtotal y cotización correctamente sin recargo extra.
4. El cruce con inventario (`verificarDisponibilidadPrenda`) funciona de manera transparente para prendas en tallas infantiles.
5. Los comprobantes imprimibles y mensajes de WhatsApp reflejan la talla infantil seleccionada.
6. La suite de pruebas unitarias incluye casos para tallas de niños y pasa al 100% en verde.

