# Tareas — Spec 030: Recuperar y Preservar Incondicionalmente el Pedido Real de "Kinder B"

- [x] **Tarea 1 — Respaldo de seguridad previo**
  - [x] Generar JSON en `backups/backup_pre_recuperar_kinder_b_20261110.json`
  - [x] Crear y pushear tag Git `backup-pre-recuperar-kinder-b-20261110`

- [x] **Tarea 2 — Especificación SDD**
  - [x] Crear `specs/030-recuperar-preservar-pedido-kinder-b/spec.md`
  - [x] Crear `specs/030-recuperar-preservar-pedido-kinder-b/plan.md`
  - [x] Crear `specs/030-recuperar-preservar-pedido-kinder-b/tasks.md`

- [x] **Tarea 3 — Blindaje en capa de persistencia (`assets/js/storage.js`)**
  - [x] Blindar `esRegistroDePrueba`: retornar estrictamente `false` para Kinder B, pedidos reales y compras reales
  - [x] Ajustar `purgarMovimientosPrueba` para que nunca elimine pedidos ni compras reales
  - [x] Implementar `asegurarPedidoKinderB()` con los datos canónicos fidedignos recuperados
  - [x] Exportar `asegurarPedidoKinderB` en `NovaprintStorage` y `module.exports`

- [x] **Tarea 4 — Integración en ciclo de vida (`assets/js/main.js`)**
  - [x] Invocar `storage.asegurarPedidoKinderB()` en `init()` para garantizar su recuperación inmediata en el navegador del usuario
  - [x] Evitar cualquier purga automática sobre órdenes de venta

- [x] **Tarea 5 — Pruebas automatizadas**
  - [x] Crear suite de pruebas `tests/kinder_b_preservation.test.js`
  - [x] Ejecutar `node --test tests/*.test.js` y verificar 100% aprobado (261/261 tests passing)

- [x] **Tarea 6 — Documentación y cierre**
  - [x] Actualizar `memory.md` (Sección 1, 2 y 3)
  - [x] Actualizar `tasks.md`
  - [x] Commit y push a `main`
