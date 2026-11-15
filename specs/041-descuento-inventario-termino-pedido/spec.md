# Especificación SDD — Spec 041: Descuento Automático de Inventario al Terminar o Avanzar Pedido

## 1. Problema y Contexto
El usuario reporta que al terminar la orden **`NP-20261111-002`**, las existencias en el inventario de bodega no disminuyeron:
> *"Termine la Orden NP-20261111-002, sinembargo, veo que el stock de inventario no se disminuyo. Revisa y corrige . No mofificar nada adicional"*

### Causa Raíz Identificada
1. **Desconexión en el flujo de estados:**
   - En la Spec 004, `storage.descontarStockPorPedido(pedido.items)` fue implementado y vinculado exclusivamente al botón aislado `[⚡ Taller]` (`enviarPedidoAFabricacion`), que traslada un pedido a una orden de fabricación.
   - Sin embargo, los flujos habituales de los usuarios consisten en:
     - Avanzar el pedido en el Kanban de Ventas con `[Avanzar ➔]` (`NovaprintUI.cambiarEstado`).
     - Modificar el estado con el botón interactivo `[🔄 Estado]` (`NovaprintUI.seleccionarNuevoEstado`), seleccionando `"Listo para entrega"` o `"Entregado"`.
     - O avanzar una orden de fabricación en el Kanban de Taller (`NovaprintUI.avanzarEtapaProyecto`) hasta la etapa `"Terminado"`.
   - Ni `storage.updateOrderStatus`, ni `NovaprintUI.cambiarEstado`, ni `NovaprintUI.avanzarEtapaProyecto` llamaban a `descontarStockPorPedido`.
2. **Falta de Idempotencia y Banderas de Control (`stockDeducted`):**
   - El modelo de datos de pedidos (`novaprint_orders`) carecía de un indicador (`stockDeducted: boolean`) que registrara si el inventario de las prendas ya había sido rebajado de bodega.
   - Esto provocaba que, si no se usaba `enviarPedidoAFabricacion`, el stock nunca se descontaba; y si se usaba, no había forma de saber si ya había sido rebajado para evitar dobles descuentos al cambiar de estado.
3. **Casos preexistentes (Reconciliación):**
   - Órdenes ya terminadas o entregadas por el usuario (como `NP-20261111-002`) quedaron sin haber aplicado el descuento sobre los artículos de bodega.

---

## 2. Historias de Usuario

- **HU-01 (Descuento automático al terminar pedido):** Como encargado de taller o ventas, cuando cambio el estado de un pedido a `"Listo para entrega"` o `"Entregado"` (o avanzo la orden de fabricación a `"Terminado"`), quiero que el stock físico de las prendas de inventario disminuya automáticamente según las cantidades utilizadas, para que el catálogo de existencias refleje la realidad física de bodega.
- **HU-02 (Idempotencia y prevención de doble descuento):** Como operador, si un pedido ya descontó su inventario y posteriormente avanza a otro estado (por ejemplo, de `"Listo para entrega"` a `"Entregado"`), el sistema no debe volver a restar stock.
- **HU-03 (Reconciliación retroactiva para órdenes terminadas):** Como usuario, necesito que la orden `NP-20261111-002` (y cualquier pedido que ya haya sido marcado como terminado o entregado sin haber descontado inventario) descuente sus prendas de inmediato al cargar o refrescar la aplicación.
- **HU-04 (Restitución por cancelación):** Como administrador, si un pedido que ya había descontado inventario es cancelado (`status === 'Cancelado'`), el sistema debe reintegrar las cantidades de prendas a bodega y desmarcar la bandera de descuento.

---

## 3. Requisitos Funcionales (EARS)

- **RF-01 (Descuento en `updateOrderStatus`):** *CUANDO* `storage.updateOrderStatus(orderId, newStatus)` sea invocado con un estado de culminación (`'Listo para entrega'`, `'Entregado'` o `'En producción'`) y el pedido no tenga `stockDeducted === true`, *EL SISTEMA DEBE* descontar del inventario las prendas e insumos de la orden y marcar `stockDeducted: true` y `stockDeductedAt: ISOString`.
- **RF-02 (Garantía de idempotencia):** *MIENTRAS* un pedido posea `stockDeducted === true`, *EL SISTEMA DEBE* abstenerse de realizar descuentos adicionales ante cualquier transición de estado subsecuente.
- **RF-03 (Restitución ante cancelación):** *CUANDO* un pedido pase al estado `'Cancelado'` y posea `stockDeducted === true`, *EL SISTEMA DEBE* reintegrar las unidades descontadas al inventario mediante `restituirStockPorPedido`, registrando `stockDeducted: false` y auditoría en `lastStockAdjustment`.
- **RF-04 (Auto-reconciliación de pedidos terminados):** *AL INICIAR* la aplicación (`main.js:init()`), *EL SISTEMA DEBE* verificar si existen pedidos con estado `'Listo para entrega'` o `'Entregado'` (incluyendo `NP-20261111-002`) que aún no tengan `stockDeducted === true`, y aplicar su descuento de stock de bodega automáticamente.
- **RF-05 (Auditoría en inventario):** *CADA VEZ* que se descuente o restituya stock por un pedido, *EL SISTEMA DEBE* actualizar `lastStockAdjustment` en cada artículo de inventario afectado con el motivo `"Consumo por Pedido [ID]"` o `"Restitución por Cancelación Pedido [ID]"`.
- **RF-06 (No modificar nada adicional):** *EL SISTEMA DEBE* mantener intactas las 313 pruebas unitarias preexistentes sin alterar contratos ni APIs de otros módulos.

---

## 4. Criterios de Aceptación
1. Al marcar el pedido `NP-20261111-002` (o cualquier pedido) como `"Listo para entrega"` o `"Entregado"`, las existencias de sus prendas disminuyen exactamente en la cantidad del pedido.
2. Si el pedido pasa de `"Listo para entrega"` a `"Entregado"`, el stock no vuelve a disminuir (idempotente).
3. Si el stock inicial era 5 y el pedido usó 5, el stock final pasa a 0 (sin números negativos).
4. La auto-reconciliación en `init()` procesa pedidos terminados que aún no habían descontado existencias.
5. Si un pedido terminado se pasa a `"Cancelado"`, las prendas vuelven a sumarse al stock de bodega.
6. 100% de pruebas unitarias pasando satisfactoriamente.
