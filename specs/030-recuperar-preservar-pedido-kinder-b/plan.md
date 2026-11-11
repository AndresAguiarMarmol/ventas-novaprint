# Plan — Spec 030: Recuperar y Preservar Incondicionalmente el Pedido Real de "Kinder B"

## 1. Análisis Técnico y Causa Raíz
- **Causa Raíz:** En `assets/js/storage.js`, `purgarMovimientosPrueba` realizaba un filtrado de `orders` y `purchases` utilizando `esRegistroDePrueba`. Además, `main.js:init()` llamaba a `purgarMovimientosPrueba({ silencioso: true })` en cada recarga de la aplicación.
- **Consecuencia:** Cualquier pedido real con IDs como `NP-20261101-001`, o que tuviese palabras coincidentes con notas o referencias de prueba fue eliminado de `localStorage`.
- **Solución:**
  1. Modificar `purgarMovimientosPrueba` para que **NUNCA** elimine pedidos ni compras de clientes.
  2. Blindar `esRegistroDePrueba` con lista de protección inmutable que salvaguarde pedidos reales, y específicamente cualquier entidad vinculada a "Kinder B" o "BRS".
  3. Implementar en `storage.js` la función `asegurarPedidoKinderB()` que comprueba la existencia de `CLI-MVYJ0DKL` y `NP-20261102-003` (o nombre de cliente "BRS Kinder B" / "Kinder B"). Si no existen, los reconstituye con los datos canónicos fidedignos recuperados de Chrome LevelDB.
  4. Llamar a `asegurarPedidoKinderB()` en `main.js:init()` antes de renderizar, asegurando que el pedido aparezca al instante para el usuario.
  5. Crear la suite de pruebas unitarias `tests/kinder_b_preservation.test.js`.

## 2. Fases de Implementación
1. **Fase 1:** Pre-task backup JSON y git tag (completada).
2. **Fase 2:** Especificación SDD (`spec.md`, `plan.md`, `tasks.md`).
3. **Fase 3:** Refactorización de `purgarMovimientosPrueba` y `esRegistroDePrueba` en `assets/js/storage.js`.
4. **Fase 4:** Implementación de `asegurarPedidoKinderB()` en `assets/js/storage.js`.
5. **Fase 5:** Invocación de `asegurarPedidoKinderB()` en `assets/js/main.js` y remoción de purgas destructivas sobre pedidos.
6. **Fase 6:** Suite de pruebas unitarias `tests/kinder_b_preservation.test.js`.
7. **Fase 7:** Actualización de `memory.md`, commit y push a `main`.

