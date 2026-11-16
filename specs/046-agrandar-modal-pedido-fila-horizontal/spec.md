# Especificación Técnica — Spec 046: Ampliación del Modal de Pedidos y Disposición Horizontal de Cód. Inventario y Artículo

## 1. Contexto y Propósito
El modal de pedidos `#dialog-order` utilizaba un ancho máximo de `max-w-4xl` (896px), lo que obligaba a comprimir la tabla de prendas en pantalla.
El usuario solicitó:
1. **Agrandar la ventana modal:** Ampliar el ancho del diálogo de `max-w-4xl` (896px) a `max-w-6xl` (1152px), aportando +256px de espacio horizontal libre para que todas las columnas entren en la misma fila con total holgura y lectura confortable.
2. **Colocar Cód. Inventario y Artículo en la misma fila horizontal:** Presentar `Cód. Inventario` y `Artículo` como dos columnas horizontales independientes en la tabla de prendas, con sus respectivas cabeceras `<th>` alineadas (`Cód. Inventario` y `Artículo`).

---

## 2. Historias de Usuario

### HU-01: Visualización Cómoda y Espaciosa del Pedido
**Como** vendedor o usuario que ingresa o edita pedidos en el taller,  
**Quiero** que la ventana modal sea más amplia y que cada concepto (Código, Artículo, Color, Talla, Técnica, Estampado, Cantidad y Precios) ocupe su propia columna en la misma fila,  
**Para** leer y editar toda la orden sin amontonamientos visuales ni desplazamientos forzados.

### HU-02: Separación Limpia entre Código de Inventario y Tipo de Artículo
**Como** usuario que gestiona el inventario de prendas,  
**Quiero** ver la columna del código físico al lado de la columna del tipo de prenda,  
**Para** identificar y modificar rápidamente ambos datos con claridad.

---

## 3. Requisitos Funcionales (Formato EARS)

### Ubiquitous (Siempre activo)
- **RF-01:** El diálogo `#dialog-order` en `index.html` DEBE configurarse con la clase `max-w-6xl` (1152px) en lugar de `max-w-4xl`.
- **RF-02:** En `index.html`, la tabla de prendas DEBE definir columnas separadas en la cabecera: `<th class="py-2 pr-1 w-36">Cód. Inventario</th>` y `<th class="py-2 px-1">Artículo</th>`.
- **RF-03:** En `renderTablaItemsFormulario()` de `assets/js/ui.js`, la fila `<tr>` DEBE renderizar en la primera celda el selector de `Cód. Inventario` (`w-36`) y en la segunda celda el selector de `Artículo` (`garmentType`) junto con su insignia de stock en bodega (`badge-stock-${it.id}`).
- **RF-04:** Las 10 columnas horizontales de la tabla DEBEN mostrarse alineadas en la misma fila: Cód. Inventario, Artículo, Color, Talla, Técnica, Estampado, Cant., P. Unit, Subtotal y Acciones.
- **RF-05:** La sincronización bidireccional entre código de inventario y prenda/color/talla DEBE operar de forma continua e instantánea.

---

## 4. Reglas de Negocio
- **RN-01 (Inmutabilidad Financiera):** La ampliación visual no modifica los cálculos de subtotales, descuentos, IVA ni saldos.
- **RN-02 (Compatibilidad Integral):** Aplica automáticamente a todas las aperturas del modal (Nuevo Pedido, Editar Pedido, Duplicar Pedido).

---

## 5. Criterios de Aceptación
1. `index.html` define `#dialog-order` con clase `max-w-6xl`.
2. `index.html` contiene las cabeceras `Cód. Inventario` y `Artículo` en columnas horizontales separadas.
3. `assets/js/ui.js` renderiza `inventoryCode` en la primera celda y `garmentType` con badge de stock en la segunda celda en la misma fila.
4. El 100% de las suites de prueba (37+ suites) pasan sin fallos ni regresiones.
