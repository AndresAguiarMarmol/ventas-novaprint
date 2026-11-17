# Tareas de Implementación — Spec 047: Botón para Modificar Escala de Descuentos en Ajustes

## Fase 1: Especificación y Aprobación (SDD)
- [x] T01: Redactar especificación técnica (`specs/047-boton-escala-descuentos-ajustes/spec.md`).
- [x] T02: Diseñar arquitectura del componente y plan de pruebas (`specs/047-boton-escala-descuentos-ajustes/plan.md`).
- [x] T03: Desglosar tareas ejecutables (`specs/047-boton-escala-descuentos-ajustes/tasks.md`).
- [x] T04: Presentar opciones y decisiones al usuario y aguardar aprobación explícita (Confirmado 1A, 2A, 3A).

---

## Fase 2: Implementación
- [x] T05: En `index.html`, agregar la subsección "Políticas Comerciales & Descuentos" y el botón `#btn-settings-volume-discounts` en `#dialog-settings`.
- [x] T06: En `assets/js/main.js` (`setupBackupAndSettings`), vincular el evento `click` de `#btn-settings-volume-discounts` para invocar `NovaprintUI.abrirModalDescuentosVolumen()`.

---

## Fase 3: Pruebas y Verificación
- [x] T07: Crear suite de pruebas `tests/settings_volume_discounts_button.test.js`.
- [x] T08: Ejecutar la nueva suite de pruebas unitarias (4/4 pruebas pasando).
- [x] T09: Ejecutar la suite completa `node --test tests/*.test.js` asegurando 100% de éxito y 0 regresiones (38 suites, 340 pruebas pasando).

---

## Fase 4: Documentación y Despliegue
- [x] T10: Actualizar `memory.md` (Sección 2 y Sección 3).
- [x] T11: Commit y push a `origin/main`.
- [x] T12: Entregar reporte final con pasos de verificación al usuario.
