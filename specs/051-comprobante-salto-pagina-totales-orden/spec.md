# Especificación Técnica — Spec 051: Corrección de Salto de Página, Visibilidad de Totales y Orden por Código en Comprobante de Venta & Taller

## 1. Contexto y Problema
En la Spec 050 se completaron los datos del "Comprobante de Venta & Taller" tanto para impresión física/PDF como para WhatsApp. Sin embargo, en el uso real se identifican tres problemas operativos:

1. **No da salto de página en la impresión:**
   Al imprimir tickets con múltiples prendas o pedidos extensos desde el navegador, la impresión se corta abruptamente al terminar la primera página y no genera las páginas siguientes (página 2, 3, etc.).
   *Causa raíz identificada:* El modal `#dialog-ticket` es un elemento HTML `<dialog>` abierto mediante `showModal()`, situándolo en el **Top Layer** del motor de renderizado de los navegadores (Chromium/Chrome/Edge). Los elementos en el Top Layer no se fragmentan en páginas impresas (`do not paginate`), limitando la impresión a una única página rígida.

2. **Los subtotales y totales no se ven:**
   Dado que el bloque financiero (Subtotal Bruto, Descuentos, Neto, IVA, Delivery, Total, Abonos y Saldo Pendiente) se ubica al final del ticket, al cortarse la impresión en la página 1 queda completamente fuera de la hoja física y del PDF.
   Adicionalmente, en la tabla de prendas las columnas de precio unitario y subtotal carecían de anchos dedicados y de `whitespace-nowrap`, permitiendo que textos largos de descripción apretaran o desplazaran los montos monetarios.

3. **Falta de ordenamiento por código de producto:**
   Las prendas se presentaban en el orden en que fueron digitadas por el vendedor, dificultando la preparación en bodega y el control en taller textil. Se requiere ordenar las prendas alfabética y numéricamente por su código de inventario (`inventoryCode`), ubicando al final aquellas prendas que no tengan código asociado.

---

## 2. Historias de Usuario

### HU-01: Impresión Continua con Salto de Página Real
**Como** encargado de taller o vendedor de Novaprint,  
**quiero** que al imprimir un comprobante con varias prendas el documento continúe fluidamente en las páginas necesarias (página 1, 2, etc.),  
**para que** el comprobante físico o PDF no se corte jamás y la orden de taller se lea completa.

### HU-02: Visibilidad Garantizada de Subtotales y Totales
**Como** cliente o cajero de taller,  
**quiero** que cada subtotal de prenda y el resumen financiero final (Subtotal Bruto, Neto, IVA, Total a Pagar, Abono y Saldo) sean siempre claramente visibles y legibles,  
**para que** no existan dudas sobre los montos facturados ni el saldo pendiente de cobro.

### HU-03: Ordenamiento de Prendas por Código de Producto
**Como** operario de bodega o estampador,  
**quiero** que la lista de prendas en el ticket y en WhatsApp esté ordenada alfabética y numéricamente por código de inventario (ej. `[BUZ-001]`, `[POL-001]`, `[POL-002]`),  
**para que** sea inmediato localizar las prendas en bodega y verificar la producción en taller.

---

## 3. Requisitos Funcionales (Formato EARS)

### RF-01: Área de Impresión Fuera de `<dialog>` (Paginación Libre)
- **Cuando** el usuario dispare la impresión (`imprimirTicket()` o atajo `Ctrl+P`),
- **el sistema debe** montar el contenido del comprobante en un contenedor directo de `<body>` (`#print-mount-point`), fuera del top-layer de `<dialog>`, permitiendo que el motor de impresión del navegador fragmente el documento en tantas páginas continuas como sea necesario.

### RF-02: Garantía de Visibilidad de Subtotales y Bloque de Totales
- **Cuando** se renderice la tabla de prendas en el ticket,
- **el sistema debe** asignar a las columnas `P. Unit` y `Subtotal` clases de ancho fijo y `whitespace-nowrap`, y dotar al bloque de totales de la regla `break-inside: avoid; page-break-inside: avoid;`, evitando que los montos se fracturen o desaparezcan.

### RF-03: Ordenamiento Natural por Código de Inventario
- **Cuando** se generen las prendas para el Ticket (`generarTicketHTML`) o para WhatsApp (`generarTextoWhatsApp`),
- **el sistema debe** ordenar los ítems usando comparación alfanumérica natural sobre `inventoryCode` (ej. `POL-2` antes de `POL-10`), ubicando al final los ítems sin código asignado.

---

## 4. Reglas de Negocio
1. **Inmutabilidad de datos históricos:** Los datos guardados de los pedidos en `novaprint_orders` no se modifican; el ordenamiento se realiza dinámicamente en la capa de presentación (ticket y WhatsApp).
2. **Compatibilidad total con impresión térmica y estándar:** El comprobante debe seguir siendo legible tanto en rollos de 80mm de punto de venta como en hojas completas Carta/A4 o exportación PDF.
3. **Cero regresiones:** Las 41 suites y 359 pruebas previas deben continuar pasando al 100%.

---

## 5. Criterios de Aceptación
- [ ] La impresión física/PDF pagina naturalmente a través de múltiples hojas sin cortarse.
- [ ] Los subtotales de cada prenda y el resumen de totales final son visibles al 100%.
- [ ] La lista de prendas en el ticket y en WhatsApp aparece ordenada por código de producto (`inventoryCode`).
- [ ] Suite completa de pruebas pasando al 100%.
- [ ] `memory.md` actualizado y cambios registrados en Git.
