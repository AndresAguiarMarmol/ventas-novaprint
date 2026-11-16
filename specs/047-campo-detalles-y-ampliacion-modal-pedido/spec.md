# Especificación Técnica — Spec 047: Incorporación del Campo "Detalles" y Ampliación del Modal de Pedidos a max-w-7xl

## 1. Contexto y Propósito
En el formulario modal de pedidos (`#dialog-order`), los usuarios necesitan registrar especificaciones adicionales de cada prenda en la misma fila horizontal (por ejemplo: el nombre de catálogo de la prenda en bodega o detalles particulares como "Corte Dama", "Cuello V", "Manga Larga", "Algodón peinado 24/1").
Para dar cabida a esta nueva columna sin provocar desbordamiento ni barras de desplazamiento horizontal forzadas:
1. **Ampliación de la ventana modal:** Se agranda el contenedor de `#dialog-order` a `max-w-7xl` (1280px).
2. **Columna "Detalles":** Se incorpora la columna `Detalles` inmediatamente después de `Artículo` en la misma fila horizontal, con un `<input type="text" placeholder="Detalles de la prenda">` editable que se auto-completa con el nombre del artículo al seleccionar un código de inventario y permite anotaciones personalizadas.
3. **Visibilidad en Comprobantes:** Si la prenda posee `details`, se visualiza en los tickets imprimibles de taller y cliente para dar trazabilidad completa a los operarios.

---

## 2. Historias de Usuario

### HU-01: Anotación y Visualización de Detalles por Prenda en la Misma Fila
**Como** vendedor o confeccionista del taller,  
**Quiero** ingresar especificaciones detalladas en una columna dedicada contigua al tipo de artículo,  
**Para** aclarar el modelo exacto, tipo de cuello o corte de la prenda en la misma fila horizontal sin amontonar la información.

### HU-02: Mayor Amplitud y Confort Visual en el Formulario
**Como** usuario del sistema,  
**Quiero** que la ventana modal del pedido sea amplia (1280px),  
**Para** leer y editar los 11 conceptos de cada prenda de forma panorámica y limpia.

### HU-03: Instrucciones Claras en Comprobante de Taller
**Como** operario de estampado,  
**Quiero** ver las especificaciones de corte o modelo en el ticket impreso,  
**Para** no cometer errores en la selección de prendas físicas para estampar.

---

## 3. Requisitos Funcionales (Formato EARS)

### Ubiquitous (Siempre activo)
- **RF-01:** El diálogo modal `#dialog-order` en `index.html` DEBE configurarse con clase `max-w-7xl` (1280px).
- **RF-02:** La cabecera de la tabla de prendas en `index.html` DEBE incluir `<th class="py-2 px-1 w-40">Detalles</th>` inmediatamente después de `<th class="py-2 px-1">Artículo</th>`.
- **RF-03:** En `renderTablaItemsFormulario()` de `assets/js/ui.js`, cada fila DEBE renderizar en la columna "Detalles" un input `<input type="text" placeholder="Detalle (opcional)" value="${it.details || ''}" class="w-40 p-1.5 border border-gray-300 rounded text-xs font-medium focus:bg-white" oninput="NovaprintUI.actualizarItemProp('${it.id}', 'details', this.value)">`.
- **RF-04:** En `actualizarItemProp(itemId, prop, value)`, cuando `prop === 'inventoryCode'` y se detecte el artículo en inventario, si `item.details` está vacío, DEBE auto-completarse con `inv.name`.
- **RF-05:** En `ticket.js`, si un ítem contiene `details`, DEBE incluirse en el renglón de la prenda (ej. `[CÓDIGO] Prenda (Color, Talla) - Detalles [Técnica]`).

---

## 4. Reglas de Negocio
- **RN-01 (Inmutabilidad Financiera):** El campo "Detalles" es de carácter descriptivo; no altera precios, costos ni subtotales.
- **RN-02 (Persistencia):** El atributo `details` se persiste en `items[]` de `novaprint_orders`. Si un pedido previo no tiene `details`, opera como string vacío.

---

## 5. Criterios de Aceptación
1. `index.html` tiene `#dialog-order` con `max-w-7xl` y la cabecera `<th class="py-2 px-1 w-40">Detalles</th>` contigua a `Artículo`.
2. `ui.js` renderiza el campo de entrada de `details` en la misma fila horizontal y guarda el valor en el pedido.
3. Al seleccionar un código de inventario, el campo `details` se auto-rellena con el nombre del producto en bodega.
4. `ticket.js` visualiza el detalle si está presente.
5. El 100% de las pruebas automatizadas pasan con 0 fallos.
