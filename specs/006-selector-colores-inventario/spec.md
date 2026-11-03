# Spec 006 — Selector de Colores Textiles en Inventario

## 1. Qué y Por Qué
En el módulo de Ventas ("Nuevo Pedido"), los colores de las prendas se seleccionan mediante un catálogo desplegable estandarizado (`COLORES_TEXTILES`: *Negro, Blanco, Gris Melange, Gris Grafito, Azul Marino, Azul Rey, Rojo, Burdeo, Verde Botella, Verde Militar, Amarillo, Naranjo, Celeste, Rosado, Beige, Morado, Otro*).

Sin embargo, en el módulo de Producción ("Registrar Artículo en Inventario"), el campo `Color` era hasta ahora un campo de texto libre (`<input type="text">`). Esto provocaba inconsistencias de tipeo (por ejemplo: "negro", "NEGRO", "Negro ", "negrita") que dificultaban la coincidencia exacta de stock entre las prendas solicitadas en un pedido y las existencias registradas en bodega (`NovaprintProduction.verificarDisponibilidadPrenda`).

Esta especificación unifica la experiencia de usuario y la consistencia de datos, reemplazando el campo de texto en "Registrar Artículo en Inventario" por una lista desplegable (`<select>`) que utiliza exactamente el mismo catálogo de colores textiles de "Nuevo Pedido", permitiendo además ingresar colores personalizados mediante la opción interactiva "Otro".

---

## 2. Historias de Usuario
- **US-01 (Selección Rápida de Colores Estándar):** Como encargado de bodega/inventario, al dar de alta o editar una prenda en el inventario, deseo seleccionar su color desde una lista desplegable con los colores textiles estándar de Novaprint, para evitar errores tipográficos y acelerar el registro.
- **US-02 (Colores Especiales / Personalizados):** Como usuario del sistema, cuando registre una prenda con un color no convencional, deseo poder elegir la opción "Otro" y escribir el nombre del color personalizado, de modo que quede seleccionado y guardado adecuadamente.
- **US-03 (Edición de Artículos Existentes):** Como usuario, al editar un artículo ya existente en inventario, deseo que su color actual aparezca preseleccionado en la lista desplegable, sin importar si es estándar o personalizado.

---

## 3. Requisitos Funcionales en Formato EARS

### Requisitos Ubicuos (Ubiquitous)
- **REQ-01:** El campo de selección de color en el formulario de inventario (`#dialog-inventory`) DEBE utilizar la lista de colores textiles oficial provista por `NovaprintSales.COLORES_TEXTILES`.
- **REQ-02:** El catálogo DEBE incluir las opciones estándar: *Negro, Blanco, Gris Melange, Gris Grafito, Azul Marino, Azul Rey, Rojo, Burdeo, Verde Botella, Verde Militar, Amarillo, Naranjo, Celeste, Rosado, Beige, Morado* y la opción interactiva *Otro*.

### Requisitos de Evento (Event-Driven)
- **REQ-03:** CUANDO el usuario abra el modal para registrar un nuevo artículo en inventario (`abrirModalNuevoItemInventario`), el sistema DEBE poblar la lista desplegable de colores y preseleccionar "Negro" por defecto.
- **REQ-04:** CUANDO el usuario seleccione la opción "Otro" en el desplegable de inventario, el sistema DEBE solicitar mediante un prompt el color personalizado, agregarlo y seleccionarlo dinámicamente en el selector.
- **REQ-05:** CUANDO el usuario edite un artículo existente (`editarItemInventario`), el sistema DEBE preseleccionar el color del artículo en la lista desplegable; si el color no está en la lista estándar, DEBE incluirse dinámicamente como opción seleccionada.
- **REQ-06:** CUANDO el usuario guarde el formulario de inventario (`guardarItemInventarioDesdeFormulario`), el sistema DEBE almacenar el valor del selector de color en la entidad de inventario en `localStorage`.

---

## 4. Criterios de Aceptación
1. El modal `#dialog-inventory` presenta un elemento `<select id="inventory-color-select">` en reemplazo del antiguo `<input type="text">`.
2. Las opciones desplegadas son idénticas a las utilizadas en la tabla de prendas de "Nuevo Pedido".
3. Al seleccionar "Otro", se solicita y valida el color personalizado.
4. Al editar un artículo existente, su color se refleja correctamente en el desplegable.
5. Los artículos guardados persisten el color elegido en `novaprint_inventory`.
6. Todas las pruebas unitarias automáticas pasan al 100% sin regresiones.

