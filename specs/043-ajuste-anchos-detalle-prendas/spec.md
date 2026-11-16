# Especificación Técnica — Spec 043: Optimización y Ajuste de Anchos en "Detalle de Prendas & Técnicas"

## 1. Contexto y Propósito
En el formulario modal de pedidos (`#dialog-order`), la tabla "Detalle de Prendas & Técnicas" contiene 10 columnas horizontales (`Cód. Inventario`, `Prenda`, `Color`, `Talla`, `Técnica`, `Estampado`, `Cant.`, `P. Unit`, `Subtotal`, `Acciones`). En pantallas estándar o laptops, los anchos de celdas previos provocaban saturación horizontal o desalineación visual.
El propósito de esta especificación es ajustar de manera óptima y compacta los campos solicitados por el usuario:
- **Talla:** Ancho compacto optimizado para 2 caracteres (`w-14` / 56px, padding `px-1`), permitiendo visualizar claramente tallas de 2 caracteres (`10`, `12`, `14`, `16`, `18`, `XS`, `S`, `M`, `L`, `XL`) y especiales como `XXL`.
- **Técnica:** Ancho ajustado a 11 caracteres (`w-28` / 112px, texto `text-[11px]`), optimizado para alojar la palabra de mayor longitud (`Sublimación` - 11 caracteres) sin desbordarse.
- **Cantidad:** Ancho compacto para 3 caracteres (`w-12` / 48px, texto centrado), con restricción dura de 3 dígitos (`max="999"`, `min="1"`).
- **Alineación de Cabeceras (`<th>`):** Sincronización explícita de anchos en las cabeceras de `index.html` para lograr alineación vertical limpia con las filas de datos.

---

## 2. Historias de Usuario

### HU-01: Visualización Compacta y Confortable del Detalle de Prendas
**Como** vendedor o administrador del taller,  
**Quiero** que los campos de Talla, Técnica y Cantidad ocupen exactamente el espacio necesario en pantalla,  
**Para** ver la tabla de prendas de forma ordenada, equilibrada y sin desplazamientos horizontales innecesarios.

### HU-02: Control de Entrada en Cantidad a 3 Dígitos
**Como** usuario que registra pedidos,  
**Quiero** que el campo de cantidad esté diseñado y restringido a 3 caracteres (`1` a `999`),  
**Para** evitar errores de digitación de cantidades desmesuradas por fila y mantener el diseño perfectamente alineado.

---

## 3. Requisitos Funcionales (Formato EARS)

### Ubiquitous (Siempre activo)
- **RF-01:** El sistema DEBE renderizar el selector de Talla con ancho `w-14` (56px) y padding horizontal `px-1`, optimizado para mostrar 2 caracteres legibles más el icono de selección sin recortes.
- **RF-02:** El sistema DEBE renderizar el selector de Técnica con ancho `w-28` (112px) y tamaño de texto `text-[11px]`, garantizando la lectura completa de técnicas de hasta 11 caracteres (`Sublimación`, `Serigrafía`, `Bordado`, `DTF`).
- **RF-03:** El sistema DEBE renderizar el campo de entrada de Cantidad con ancho `w-12` (48px), texto centrado `text-center`, padding `p-1`, `min="1"` y restricción `max="999"`.
- **RF-04:** Las cabeceras `<th>` de Talla (`w-14 text-center`), Técnica (`w-28`) y Cantidad (`w-12 text-center`) en `index.html` DEBEN tener clases de ancho sincronizadas con sus respectivas celdas de datos `<td>`.

### Event-driven (Ante eventos)
- **RF-05:** CUANDO el usuario ingrese o modifique la cantidad, el sistema DEBE limitar el valor numérico al rango de 1 a 999 prendas por fila.

---

## 4. Reglas de Negocio
- **RN-01 (Inmutabilidad Comercial):** Los ajustes son de presentación visual en interfaz (CSS / DOM); no se modifican cálculos financieros, descuentos por volumen, subtotales, IVA ni enlaces de inventario.
- **RN-02 (Retrocompatibilidad):** Todos los pedidos guardados previamente se siguen cargando y renderizando correctamente sin importar la cantidad o talla registrada.

---

## 5. Criterios de Aceptación
1. En `index.html`, las cabeceras `<th>` de Talla, Técnica y Cantidad poseen anchos coincidentes `w-14`, `w-28` y `w-12`.
2. En `assets/js/ui.js`, `renderTablaItemsFormulario()` genera los elementos con las clases `w-14`, `w-28` y `w-12`, e incluye `max="999"` en el input de cantidad.
3. Las 34 suites preexistentes y la nueva suite de pruebas pasan al 100% (327+ pruebas ok, 0 fallos).
