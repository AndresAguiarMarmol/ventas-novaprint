# Spec 009 — Botón y Filtro de Pedidos con "Saldo por Cobrar" en Barra de Estados

## 1. Qué y Por Qué
En el taller de estampado Novaprint, el flujo financiero habitual contempla un abono inicial (por ejemplo 50% al confirmar el pedido) y el pago del saldo restante al momento de la entrega o despacho. 
Actualmente, la barra de filtros y estados de pedidos en la vista de Ventas (`#view-orders`) solo permite filtrar pedidos por su estado operativo (`Cotización, Confirmado, En producción, Listo para entrega, Entregado`).

Para agilizar la gestión de cobranza y permitir al administrador identificar con un solo clic todos los pedidos que tienen dinero pendiente de cobro (`totals.balanceAmount > 0`), se solicita incorporar un botón dedicado en la barra de estados/filtros ("💰 Saldo por Cobrar") con su respectivo contador en vivo, además de la opción correspondiente en el selector de estados y el enlace interactivo desde la tarjeta KPI de métricas de cobranza.

---

## 2. Historias de Usuario
- **US-01 (Filtrado Rápido de Cobranza):** Como administrador o encargado de caja, deseo hacer clic en un botón "Saldo por Cobrar" en la barra de estados para ver inmediatamente la lista de pedidos con saldo pendiente, sin importar en qué etapa de producción se encuentren.
- **US-02 (Contador y Estado Visual Activo):** Como usuario, deseo ver cuántos pedidos tienen saldo pendiente directamente en una insignia numérica en el botón, y saber cuándo el filtro está activo mediante un estilo visual distintivo.
- **US-03 (Desactivación y Alternancia Simple):** Como usuario, al hacer clic nuevamente sobre el botón activo (o seleccionar "Todos los Estados"), deseo volver a ver todos los pedidos sin dificultad.

---

## 3. Requisitos Funcionales en Formato EARS

### Requisitos Ubicuos (Ubiquitous)
- **REQ-01:** La función pura `NovaprintSales.filtrarPedidos` DEBE admitir el criterio `estadoFiltro === 'con_saldo'` o la opción `soloConSaldo: true`, retornando únicamente aquellos pedidos donde `Number(pedido.totals?.balanceAmount) > 0` y `status !== 'Cancelado'`.
- **REQ-02:** El botón "Saldo por Cobrar" (`#btn-filter-balance`) DEBE ubicarse en la barra de filtros y estados de la vista de pedidos (`#view-orders`), junto al selector de estados.

### Requisitos de Evento (Event-Driven)
- **REQ-03:** CUANDO el usuario haga clic en `#btn-filter-balance`, el sistema DEBE alternar el filtro: si no estaba activo, aplicará el filtro de pedidos con saldo pendiente y cambiará el aspecto visual del botón a estado activo (resaltado con color esmeralda/verde); si ya estaba activo, desactivará el filtro volviendo al listado general.
- **REQ-04:** CUANDO se actualicen las métricas (`NovaprintUI.renderMetrics`), el sistema DEBE calcular el total de pedidos con saldo por cobrar y actualizar la insignia numérica del botón (`#badge-count-pending-balance`).
- **REQ-05:** CUANDO el usuario seleccione la opción "💰 Saldo por Cobrar" en el selector `#orders-status-filter`, el sistema DEBE filtrar la lista de pedidos de forma idéntica y sincronizar el estado visual del botón.
- **REQ-06:** CUANDO el usuario haga clic en la tarjeta KPI "Por Cobrar" (`#metric-pending-balance` / contenedor), el sistema DEBE activar el filtro de pedidos con saldo por cobrar.

---

## 4. Criterios de Aceptación
1. En la barra de estados de pedidos se visualiza el botón interactivo "💰 Saldo por Cobrar" con su insignia numérica con el conteo de pedidos pendientes de cobro.
2. Al pulsar el botón, tanto el tablero Kanban como la tabla de pedidos se filtran mostrando únicamente los pedidos con `balanceAmount > 0`.
3. Al pulsar nuevamente el botón, el filtro se desactiva y se muestran todos los pedidos.
4. El selector `#orders-status-filter` incluye la opción `<option value="con_saldo">💰 Saldo por Cobrar</option>` sincronizada con el botón.
5. La suite de pruebas automatizadas verifica la lógica de filtrado de saldo por cobrar y pasa al 100% en verde.

