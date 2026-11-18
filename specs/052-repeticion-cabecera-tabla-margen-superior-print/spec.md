# Especificación Técnica — Spec 052: Repetición de Cabecera de Tabla en Página 2 y Margen Superior en Impresión

## 1. Contexto y Problema
En el "Comprobante de Venta & Taller", la paginación multi-página ya se encuentra habilitada mediante el contenedor `#print-mount-point`. Sin embargo, los usuarios detectaron dos problemas específicos al imprimir comprobantes con múltiples páginas:

1. **La cabecera de la tabla de prendas no se repite en la página 2:**
   Los títulos de las columnas (*Detalle Prenda*, *P. Unit*, *Subtotal*) se visualizan únicamente en la primera página. Al saltar a la página 2, los ítems continúan sin cabecera identificatoria, dificultando la lectura de las columnas monetarias.
   *Causa técnica en Chromium/Blink:* La regla `min-height: 100%` en `html` y `body` confunde el cálculo de paginación del motor de impresión, inhabilitando la duplicación del bloque `table-header-group`. Adicionalmente, la tabla carecía de declaraciones explícitas `display: table`, `display: table-header-group` y `display: table-row-group` con estilos específicos para la cabecera repetida.

2. **Ausencia de margen superior en todas las páginas:**
   La regla previa `@page { margin: 4mm; }` junto con `body { margin: 0; padding: 0; }` dejaba el comprobante prácticamente pegado al filo superior de la hoja física (menos de 4 mm, el cual en la mayoría de impresoras y lectores de PDF queda dentro del área no imprimible o sin espacio de respiración visual). El usuario exige un margen superior formal y visible para **todas las páginas** (página 1, página 2, etc.).

---

## 2. Historias de Usuario

### HU-01: Repetición Automática de Títulos en Páginas Subsiguientes
**Como** operario de taller o cliente,  
**quiero** que los títulos de columna (*Detalle Prenda*, *P. Unit*, *Subtotal*) se repitan en la cabecera de la página 2 (y subsecuentes),  
**para que** en pedidos largos siempre sepa a qué columna corresponde cada cifra y descripción.

### HU-02: Margen Superior Limpio en Todas las Páginas
**Como** usuario que imprime comprobantes u órdenes de taller físicas o en PDF,  
**quiero** que todas las páginas tengan un margen superior adecuado y visible (15 mm),  
**para que** el documento no comience al borde del papel y tenga una presentación profesional y estandarizada.

---

## 3. Requisitos Funcionales (Formato EARS)

### RF-01: Margen Superior Estandarizado en `@page`
- **Cuando** se active el modo de impresión (`@media print`),
- **el sistema debe** definir en `@page` un margen superior formal (`margin-top: 15mm`), margen inferior (`margin-bottom: 12mm`) y laterales (`margin-left: 8mm; margin-right: 8mm`), asegurando que cada hoja física y página de PDF conserve dicho margen sin recortes.

### RF-02: Repetición Estricta de `<thead>` en Chromium
- **Cuando** una tabla de prendas supere la primera hoja y salte a la página 2,
- **el sistema debe** forzar la repetición de los títulos de las columnas (*Detalle Prenda*, *P. Unit*, *Subtotal*) mediante:
  - Eliminación de `min-height: 100%` en `html` y `body` durante `@media print` (`min-height: 0 !important; height: auto !important`).
  - Declaración explícita de `table.ticket-table { display: table !important; border-collapse: collapse !important; }`.
  - Declaración de `table.ticket-table thead { display: table-header-group !important; break-inside: avoid !important; }`.
  - Declaración de `table.ticket-table tbody { display: table-row-group !important; }`.
  - Estilización de cabecera con contraste nítido (`background-color: #f3f4f6 !important; border-bottom: 2px solid #9ca3af !important`).

---

## 4. Reglas de Negocio
1. **Preservación de datos y WhatsApp:** No alterar la lógica de cálculo financiero ni el texto de WhatsApp previamente implementados en la Spec 051.
2. **Compatibilidad:** El diseño debe mantener total compatibilidad con rollos térmicos de 80 mm y hojas de oficina A4/Carta o exportación PDF.
3. **Cero regresiones:** Las 42 suites y 366 pruebas preexistentes deben continuar pasando al 100%.

---

## 5. Criterios de Aceptación
- [ ] En la vista previa de impresión (Ctrl+P / Imprimir Ticket), la página 2 repite los títulos de columna (*Detalle Prenda*, *P. Unit*, *Subtotal*).
- [ ] En todas las páginas impresas existe un margen superior visible y estandarizado de 15 mm.
- [ ] 100% de pruebas pasando en `node --test tests/*.test.js`.
- [ ] `memory.md` actualizado y cambios guardados en Git.
