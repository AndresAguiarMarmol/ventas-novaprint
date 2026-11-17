# Tareas de Implementación — Spec 048: Edición Interactiva de la Escala de Descuentos por Volumen

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Redactar especificación técnica (`specs/048-edicion-escala-descuentos/spec.md`).
- [x] T02: Diseñar arquitectura del componente y plan de pruebas (`specs/048-edicion-escala-descuentos/plan.md`).
- [x] T03: Desglosar tareas ejecutables (`specs/048-edicion-escala-descuentos/tasks.md`).
- [x] T04: Presentar opciones y decisiones al usuario y aguardar aprobación explícita (Confirmado 1B, 2A, 3A).

---

## Fase 2: Implementación
- [x] T05: En `assets/js/storage.js`, implementar `getVolumeDiscountTiers()`, `saveVolumeDiscountTiers()` y `resetVolumeDiscountTiers()`.
- [x] T06: En `assets/js/sales.js`, actualizar `calcularDescuentoVolumen()` para consultar dinámicamente los tramos configurados.
- [x] T07: En `index.html`, actualizar `#dialog-volume-discounts` con inputs editables para cada tramo (min, max, percent) y botones de Guardar, Restablecer y Cerrar.
- [x] T08: En `assets/js/ui.js`, actualizar `abrirModalDescuentosVolumen()` para hidratar los inputs y crear los controladores de guardado (`guardarEscalaDescuentosDesdeFormulario`) y restablecimiento (`restablecerEscalaDescuentos`).

---

## Fase 3: Pruebas y Verificación
- [x] T09: Crear suite de pruebas `tests/volume_discounts_editable.test.js`.
- [x] T10: Ejecutar la nueva suite de pruebas unitarias (6/6 pasando).
- [x] T11: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones (39 suites, 346 pruebas pasando).

---

## Fase 4: Documentación y Despliegue
- [x] T12: Actualizar `memory.md` (Sección 1, Sección 2 y Sección 3).
- [x] T13: Commit y push a `origin/main`.
- [x] T14: Entregar reporte final con pasos de verificación al usuario.
