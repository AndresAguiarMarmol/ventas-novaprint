# Plan de Implementación — Spec 009: Botón y Filtro de Pedidos con "Saldo por Cobrar"

## 1. Lógica de Negocio (`assets/js/sales.js`)
- En la función pura `filtrarPedidos(pedidos, { textoBusqueda, estadoFiltro, clienteId, soloConSaldo })`:
  - Extender la condición de `estadoFiltro`:
    - Si `estadoFiltro === 'con_saldo'`, filtrar:
      `Number(p.totals?.balanceAmount) > 0 && p.status !== 'Cancelado'`.
    - Si `soloConSaldo === true`, filtrar:
      `Number(p.totals?.balanceAmount) > 0 && p.status !== 'Cancelado'`.
  - Preservar todas las demás condiciones existentes de búsqueda por texto, cliente y estados convencionales.

---

## 2. Marcado y Estilos de Interfaz (`index.html`)
- En `#view-orders`:
  - En la tarjeta KPI "Por Cobrar" (`div` contenedor), añadir atributos interactivos:
    - `id="kpi-card-pending-balance"`, clases `cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all` y `title="Ver pedidos con saldo pendiente"`.
  - En la barra de filtros y estados (`div.flex.flex-wrap.items-center.gap-2`):
    - Añadir la opción en el `<select id="orders-status-filter">`:
      `<option value="con_saldo">💰 Saldo por Cobrar</option>`.
    - Añadir el botón rápido con insignia de conteo:
      ```html
      <button id="btn-filter-balance" type="button" class="py-2 px-3 rounded-lg text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer" title="Filtrar pedidos con saldo pendiente de cobro">
        <span>💰 Saldo por Cobrar</span>
        <span id="badge-count-pending-balance" class="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.5 rounded-full font-black">0</span>
      </button>
      ```

---

## 3. Renderizado y Sincronización en UI (`assets/js/ui.js`)
- En `renderMetrics(pedidos, hoy)`:
  - Calcular `pedidosConSaldoCount`:
    `pedidos.filter(p => Number(p.totals?.balanceAmount) > 0 && p.status !== 'Cancelado').length`.
  - Actualizar `#badge-count-pending-balance` con dicho valor.

---

## 4. Controladores y Eventos (`assets/js/main.js`)
- Añadir variable de estado o lógica para `btn-filter-balance`:
  - Al hacer clic en `#btn-filter-balance`:
    - Si el filtro actual es `'con_saldo'`, volver a `'todos'`.
    - Si es otro, cambiar a `'con_saldo'`.
    - Actualizar el selector `#orders-status-filter`.
    - Actualizar estilos visuales del botón (clase activa `bg-emerald-600 text-white border-emerald-700` vs inactiva `bg-emerald-50 text-emerald-800 border-emerald-300`).
    - Invocar `refrescarPedidos()`.
  - En el listener de `change` de `#orders-status-filter`:
    - Actualizar el estado visual del botón según si el valor es `'con_saldo'`.
  - En el listener de clic en `#kpi-card-pending-balance`:
    - Activar el filtro `'con_saldo'` e invocar `refrescarPedidos()`.

---

## 5. Pruebas Unitarias
- `tests/sales.test.js`:
  - Probar que `filtrarPedidos` con `estadoFiltro: 'con_saldo'` retorna solo pedidos con `balanceAmount > 0`.
  - Probar que excluye pedidos con saldo 0 (totalmente pagados) o cancelados.
  - Probar que combina correctamente búsqueda de texto y filtro de saldo por cobrar.
