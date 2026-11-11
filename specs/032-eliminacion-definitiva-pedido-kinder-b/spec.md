# Spec 032: Respetar Eliminación Definitiva del Pedido "BRS Kinder B" (Evitar Resurrección Automática)

## 1. Contexto y Problema
En la **Spec 030** se implementó un mecanismo de emergencia (`asegurarPedidoKinderB`) para recuperar de forma automática el pedido legítimo del cliente **BRS Kinder B** (`NP-20261102-003`), el cual había sido purgado accidentalmente en una limpieza previa de datos de prueba.

Sin embargo, dicho mecanismo quedó enganchado de forma **incondicional** en el arranque de la aplicación (`main.js:init()`). Cada vez que la aplicación carga o se recarga el navegador, `asegurarPedidoKinderB` verifica si el pedido existe en `novaprint_orders`; si no lo encuentra, lo vuelve a insertar automáticamente en `localStorage`.

Como consecuencia directa:
- Si el usuario elimina voluntariamente el pedido de **BRS Kinder B** desde el botón de la papelera en la tabla de pedidos (`NovaprintStorage.deleteOrder('NP-20261102-003')`), el pedido se elimina en la vista actual.
- Al recargar la página o abrir nuevamente el sistema, `init()` ejecuta `asegurarPedidoKinderB()`, detecta que no está en la lista y **lo vuelve a recrear (efecto "pedido zombie")**.

El usuario instruye explícitamente:
> *"El Pedido de BRS Kinder B" aparece despues de ser eliminado. Corregir esto. Usar metodologia sdd.*

---

## 2. Requerimientos Funcionales (Formato EARS)

### [REQ-01] Respeto Absoluto a la Eliminación de Pedidos
- **Cuándo** el usuario elimine un pedido mediante `NovaprintStorage.deleteOrder(orderId)` o la acción de papelera en la interfaz de usuario:
  - **El sistema deberá** remover permanentemente el pedido de la colección `novaprint_orders`.
  - **Si** el pedido eliminado corresponde a "BRS Kinder B" (`NP-20261102-003` o coincidencia por nombre/notas de Kinder B), **el sistema deberá** registrar una bandera persistente en la configuración (`novaprint_settings`: `kinderBOrderDeleted: true` y `kinderBRecoveryApplied_v1: true`) indicando que el pedido fue suprimido intencionalmente por el usuario.

### [REQ-02] Guardia de Control y Desactivación de Recreación Automática
- **Dado que** la recuperación de datos de la Spec 030 fue una reparación histórica puntual:
  - **El sistema deberá** comprobar si la migración/recuperación ya fue ejecutada (`kinderBRecoveryApplied_v1: true`) o si el usuario marcó la eliminación (`kinderBOrderDeleted: true`).
  - **Si** alguna de estas condiciones es verdadera, `asegurarPedidoKinderB` **no deberá** reinsertar ni forzar la creación del pedido en `novaprint_orders`.
  - En `main.js:init()`, la llamada a `asegurarPedidoKinderB()` debe estar estrictamente protegida por la bandera `settings.kinderBRecoveryApplied_v1 !== true && settings.kinderBOrderDeleted !== true`. Una vez ejecutada la recuperación inicial, se marca `kinderBRecoveryApplied_v1 = true` en configuración.

### [REQ-03] Comportamiento Idempotente y Persistencia Segura
- **Mientras** el pedido de Kinder B permanezca eliminado por el usuario:
  - Las recargas de página, aperturas de sesión, ejecuciones de `purgarMovimientosPrueba` o invocaciones de `init()` **no deberán** recrearlo bajo ninguna circunstancia.
- **Si** el usuario decide registrar un nuevo pedido para Kinder B o cualquier otro cliente en el futuro, el flujo estándar de pedidos debe operar con total normalidad sin interferencias.

---

## 3. Criterios de Aceptación
1. **Eliminación Permanente:** Al eliminar el pedido de "BRS Kinder B" desde la interfaz o vía API `deleteOrder`, este no vuelve a aparecer tras recargar el navegador (`F5`, `Ctrl+F5` o nueva sesión).
2. **Bandera de Configuración:** `novaprint_settings` guarda `kinderBOrderDeleted: true` ante la eliminación explícita del pedido `NP-20261102-003` / Kinder B.
3. **Guardia en Inicialización:** `main.js:init()` no re-inyecta el pedido si ya fue procesado o eliminado.
4. **No Regresión:** Las compras a proveedores, el catálogo de inventario en saldo 0 (Spec 031), el plan contable y los demás pedidos de clientes se mantienen intactos.
5. **Pruebas Automatizadas:** 100% de las pruebas unitarias pasando (incluyendo nuevas pruebas específicas para la no-resurrección tras borrado).

