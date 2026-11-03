# Tareas — Spec 003: Control de Fabricación en Taller

- [x] **T1. Lógica pura de estaciones de fabricación y pruebas unitarias (`tests/fabrication.test.js` y `assets/js/production.js`).** RF-1.1, RF-1.2, RF-1.3, RF-1.4
  - Hecho cuando: `tests/fabrication.test.js` valide la progresión de etapas (`Diseño` ➔ `Preparación` ➔ `Estampado` ➔ `Control Calidad` ➔ `Terminado`), la creación de órdenes desde pedidos y el agrupamiento Kanban pasando al 100% en verde con `node --test tests/fabrication.test.js`.

- [x] **T2. Persistencia y seed data de proyectos de fabricación en `storage.js`.** RF-1.1, RF-1.2
  - Hecho cuando: `storage.js` soporte operaciones para proyectos/órdenes de fabricación (`saveProject`, `deleteProject`, `getProjects`, `getProjectById`) y precargue lotes de demostración activos en taller.

- [x] **T3. Tablero Kanban de 5 estaciones de taller y métricas de producción (`index.html` y `assets/js/ui.js`).** RF-1.2, RF-1.3
  - Hecho cuando: La pestaña `#view-fabrication` renderice las métricas superiores de taller y el tablero de 5 columnas con tarjetas de trabajo y botón de avance rápido en 1 clic.

- [x] **T4. Integración fluida Ventas ➔ Fabricación y modal de nueva orden (`assets/js/ui.js` y `assets/js/main.js`).** RF-1.1, RF-1.4
  - Hecho cuando: Las tarjetas de pedidos cuenten con el botón "⚡ Enviar a Taller" que genera automáticamente la orden de fabricación, y el modal permita además registrar órdenes manuales para stock.

- [x] **T5. Validación final de la aplicación completa, ejecución de tests y memoria (`memory.md`).** RF-1.1, RF-1.2, RF-1.3, RF-1.4
  - Hecho cuando: Toda la suite de pruebas pase en verde (`node --test`), la SPA sea completamente interactiva y `memory.md` registre la finalización exitosa del proyecto Novaprint.
