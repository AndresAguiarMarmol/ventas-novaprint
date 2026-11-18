# Tareas de Implementación — Spec 051: Corrección de Salto de Página, Visibilidad de Totales y Orden por Código en Comprobante de Venta & Taller

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Redactar especificación técnica (`specs/051-comprobante-salto-pagina-totales-orden/spec.md`).
- [x] T02: Diseñar arquitectura del componente y plan de pruebas (`specs/051-comprobante-salto-pagina-totales-orden/plan.md`).
- [x] T03: Desglosar tareas ejecutables (`specs/051-comprobante-salto-pagina-totales-orden/tasks.md`).
- [x] T04: Presentar opciones y decisiones al usuario y aguardar aprobación explícita.

---

## Fase 2: Implementación
- [x] T05: En `index.html`, agregar el contenedor de montaje de impresión directo en body (`#print-mount-point`).
- [x] T06: En `assets/js/ticket.js`, ordenar prendas por código de producto, blindar columnas con `whitespace-nowrap`, añadir `.ticket-totals-section` y actualizar `imprimirTicket()` para montar el HTML en `#print-mount-point` garantizando saltos de página fluidos.
- [x] T07: En `assets/js/sales.js`, ordenar las prendas por código de producto en `generarTextoWhatsApp`.
- [x] T08: En `assets/css/custom.css`, actualizar `@media print` para renderizar `#print-mount-point` con soporte multi-página, `thead { display: table-header-group }` y `break-inside: avoid`.

---

## Fase 3: Pruebas y Verificación
- [x] T09: Crear suite de pruebas `tests/comprobante_paginacion_totales_orden.test.js`.
- [x] T10: Ejecutar la nueva suite de pruebas unitarias.
- [x] T11: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T12: Actualizar `memory.md` (Sección 1, Sección 2 y Sección 3).
- [x] T13: Commit y push a `origin/main`.
- [x] T14: Entregar reporte final con pasos de verificación al usuario.
