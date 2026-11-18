# Tareas de Implementación — Spec 052: Repetición de Cabecera de Tabla en Página 2 y Margen Superior en Impresión

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Redactar especificación técnica (`specs/052-repeticion-cabecera-tabla-margen-superior-print/spec.md`).
- [x] T02: Diseñar arquitectura del componente y plan de pruebas (`specs/052-repeticion-cabecera-tabla-margen-superior-print/plan.md`).
- [x] T03: Desglosar tareas ejecutables (`specs/052-repeticion-cabecera-tabla-margen-superior-print/tasks.md`).
- [x] T04: Presentar opciones y decisiones al usuario y aguardar aprobación explícita.

---

## Fase 2: Implementación
- [x] T05: En `assets/js/ticket.js`, incorporar la clase `ticket-table` a la tabla de prendas en `generarTicketHTML`.
- [x] T06: En `assets/css/custom.css`, configurar `@page` con `margin-top: 15mm;`, remover `min-height: 100%` en `html, body` y añadir reglas para `table.ticket-table` con `table-header-group` y estilos de cabecera visible.

---

## Fase 3: Pruebas y Verificación
- [x] T07: Crear suite de pruebas `tests/comprobante_cabecera_margen_print.test.js`.
- [x] T08: Ejecutar la nueva suite de pruebas unitarias.
- [x] T09: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones (43 suites, 370 tests pasando).

---

## Fase 4: Documentación y Despliegue
- [x] T10: Actualizar `memory.md` (Sección 1, Sección 2 y Sección 3).
- [x] T11: Commit y push a `origin/main`.
- [x] T12: Entregar reporte final con pasos de verificación al usuario.
