# Tareas de Implementación — Spec 050: Comprobante de Venta & Taller Completo (Ticket & WhatsApp)

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Redactar especificación técnica (`specs/050-comprobante-venta-taller-completo/spec.md`).
- [x] T02: Diseñar arquitectura del componente y plan de pruebas (`specs/050-comprobante-venta-taller-completo/plan.md`).
- [x] T03: Desglosar tareas ejecutables (`specs/050-comprobante-venta-taller-completo/tasks.md`).
- [x] T04: Presentar opciones y decisiones al usuario y aguardar aprobación explícita.

---

## Fase 2: Implementación
- [x] T05: En `assets/js/sales.js`, enriquecer `generarTextoWhatsApp` con precios unitarios, subtotales por prenda, códigos de inventario, subtotal bruto, neto, estado de pago, total de prendas, notas y datos de empresa.
- [x] T06: En `assets/js/ticket.js`, enriquecer `generarTicketHTML` incorporando Estado de Taller (`pedido.status`), datos ampliados del cliente (RUT, dirección) y visibilidad permanente de Subtotal Bruto y Monto Neto.
- [x] T07: En `assets/css/custom.css`, optimizar `@media print` eliminando restricciones de altura (`max-height`), añadiendo `break-inside: avoid` y asegurando compatibilidad fluida con rollos térmicos de 80mm y formatos de hoja completa sin recortes.

---

## Fase 3: Pruebas y Verificación
- [x] T08: Crear suite de pruebas `tests/comprobante_venta_taller_completo.test.js`.
- [x] T09: Ejecutar la nueva suite de pruebas unitarias.
- [x] T10: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones.

---

## Fase 4: Documentación y Despliegue
- [x] T11: Actualizar `memory.md` (Sección 1, Sección 2 y Sección 3).
- [x] T12: Commit y push a `origin/main`.
- [x] T13: Entregar reporte final con pasos de verificación al usuario.
