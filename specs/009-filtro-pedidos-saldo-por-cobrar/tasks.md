# Tareas de Implementación — Spec 009: Botón y Filtro de Pedidos con "Saldo por Cobrar"

- [x] **Tarea 1: Lógica de Filtrado en `assets/js/sales.js`**
  - Adaptar `filtrarPedidos` para reconocer `estadoFiltro === 'con_saldo'` y `soloConSaldo === true`.
  - *Criterio de verificación:* Pruebas unitarias en `sales.test.js`.

- [x] **Tarea 2: Elementos de Interfaz en `index.html`**
  - Añadir opción `<option value="con_saldo">💰 Saldo por Cobrar</option>` en `#orders-status-filter`.
  - Añadir botón interactivo `#btn-filter-balance` con su badge `#badge-count-pending-balance`.
  - Añadir `id="kpi-card-pending-balance"` y cursor pointer a la tarjeta de saldo.
  - *Criterio de verificación:* Elementos visibles y accesibles en el DOM.

- [x] **Tarea 3: Insignia y Métricas en `assets/js/ui.js`**
  - Calcular y actualizar el conteo en `#badge-count-pending-balance` dentro de `renderMetrics`.
  - *Criterio de verificación:* El contador refleja en vivo la cantidad de pedidos con saldo pendiente.

- [x] **Tarea 4: Bindings y Sincronización en `assets/js/main.js`**
  - Configurar event listeners para `#btn-filter-balance` y `#kpi-card-pending-balance`.
  - Sincronizar estilos activos/inactivos del botón con el `<select id="orders-status-filter">`.
  - *Criterio de verificación:* Clic en el botón o KPI filtra los pedidos en Kanban y Tabla; segundo clic restablece la lista.

- [x] **Tarea 5: Pruebas unitarias e integración**
  - Añadir casos de prueba para filtro `con_saldo` en `tests/sales.test.js`.
  - Ejecutar `node --test tests/*.test.js` y constatar 100% de pruebas en verde (90/90 pruebas superadas).
  - *Criterio de verificación:* 0 fallos.

- [x] **Tarea 6: Actualización de `memory.md`**
  - Documentar la decisión en Sección 2 e incorporar el cambio en Sección 3.
  - *Criterio de verificación:* `memory.md` actualizado según protocolo `AGENTS.md`.
