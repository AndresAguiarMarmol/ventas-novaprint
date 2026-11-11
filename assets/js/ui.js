/**
 * assets/js/ui.js — Capa de Renderizado, Manipulación del DOM y Modales Nativos
 */

(function (global) {
  'use strict';

  // Contenedor temporal de items para el formulario de pedidos activo
  let currentOrderItems = [];
  let editingOrderId = null;

  /**
   * Muestra notificaciones flotantes tipo Toast
   */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-amber-600 text-white',
      info: 'bg-blue-600 text-white'
    };

    toast.className = `toast px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center justify-between gap-3 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button type="button" class="text-white hover:text-gray-200" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Actualiza las tarjetas métricas superiores (KPIs)
   */
  function renderMetrics(pedidos = [], hoy = new Date()) {
    const sales = global.NovaprintSales;
    if (!sales) return;

    const activos = pedidos.filter(p => p.status !== 'Entregado' && p.status !== 'Cancelado');
    let atrasadosCount = 0;
    let urgentesCount = 0;
    let saldoPorCobrar = 0;
    let pedidosConSaldoCount = 0;

    pedidos.forEach(p => {
      const saldo = Number(p.totals?.balanceAmount) || 0;
      if (saldo > 0 && p.status !== 'Cancelado') {
        pedidosConSaldoCount++;
      }
    });

    activos.forEach(p => {
      const urgencia = sales.clasificarPedidoPorUrgencia(p.dates?.deliveryDate, p.status, hoy);
      if (urgencia === 'atrasado') atrasadosCount++;
      if (urgencia === 'urgente_hoy') urgentesCount++;
      saldoPorCobrar += (p.totals?.balanceAmount || 0);
    });

    const elTotalActivos = document.getElementById('metric-total-active');
    const elUrgentes = document.getElementById('metric-urgent-today');
    const elAtrasados = document.getElementById('metric-delayed');
    const elSaldoPorCobrar = document.getElementById('metric-pending-balance');
    const elBadgeSaldo = document.getElementById('badge-count-pending-balance');

    if (elTotalActivos) elTotalActivos.textContent = activos.length;
    if (elUrgentes) elUrgentes.textContent = urgentesCount;
    if (elAtrasados) elAtrasados.textContent = atrasadosCount;
    if (elSaldoPorCobrar) elSaldoPorCobrar.textContent = sales.formatearMoneda(saldoPorCobrar);
    if (elBadgeSaldo) elBadgeSaldo.textContent = pedidosConSaldoCount;
  }

  /**
   * Obtiene la clase de borde de tarjeta según urgencia
   */
  function getBorderClassByUrgency(urgencia) {
    switch (urgencia) {
      case 'atrasado': return 'order-card-urgent';
      case 'urgente_hoy': return 'order-card-warning';
      case 'esta_semana': return 'order-card-info';
      default: return 'order-card-success';
    }
  }

  /**
   * Genera el HTML de una tarjeta de pedido individual
   */
  function renderOrderCard(pedido, hoy = new Date()) {
    const sales = global.NovaprintSales;
    const urgencia = sales.clasificarPedidoPorUrgencia(pedido.dates?.deliveryDate, pedido.status, hoy);
    const borderClass = getBorderClassByUrgency(urgencia);
    const totalStr = sales.formatearMoneda(pedido.totals?.totalAmount || 0);
    const saldoStr = sales.formatearMoneda(pedido.totals?.balanceAmount || 0);

    const badgesEstado = {
      'Cotización': 'bg-gray-100 text-gray-700 border-gray-300',
      'Confirmado': 'bg-blue-100 text-blue-800 border-blue-300',
      'En producción': 'bg-amber-100 text-amber-800 border-amber-300',
      'Listo para entrega': 'bg-purple-100 text-purple-800 border-purple-300',
      'Entregado': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'Cancelado': 'bg-red-100 text-red-800 border-red-300'
    };

    const resumenItems = (pedido.items || []).map(it => `
      <div class="flex justify-between items-center text-xs py-0.5 border-b border-gray-100 last:border-none">
        <span class="font-medium text-gray-800">${it.quantity}x ${it.garmentType} (${it.size})</span>
        <span class="text-[11px] px-1.5 py-0.5 rounded font-semibold ${getTechniqueClass(it.technique)}">${it.technique}</span>
      </div>
    `).join('');

    const proximoEstadoMap = {
      'Cotización': 'Confirmado',
      'Confirmado': 'En producción',
      'En producción': 'Listo para entrega',
      'Listo para entrega': 'Entregado'
    };
    const proximoEstado = proximoEstadoMap[pedido.status];

    return `
      <div class="order-card bg-white rounded-xl p-4 shadow-sm ${borderClass} flex flex-col justify-between" data-order-id="${pedido.id}">
        <div>
          <!-- Cabecera de la tarjeta -->
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">${pedido.id}</span>
              <h4 class="font-bold text-gray-900 text-base leading-tight mt-1">${pedido.clientName}</h4>
              ${pedido.clientPhone ? `<p class="text-xs text-gray-500">📱 ${pedido.clientPhone}</p>` : ''}
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full border ${badgesEstado[pedido.status] || 'bg-gray-100'}">
              ${pedido.status}
            </span>
          </div>

          <!-- Fecha de entrega acordada -->
          <div class="text-xs mb-3 flex items-center justify-between text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
            <span>📅 Entrega:</span>
            <span class="font-bold ${urgencia === 'atrasado' ? 'text-red-600' : 'text-gray-900'}">${pedido.dates?.deliveryDate || 'Sin fecha'}</span>
          </div>

          <!-- Resumen de prendas del pedido -->
          <div class="space-y-1 mb-3 bg-white p-2 rounded-lg border border-gray-100">
            <div class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prendas (${pedido.totals?.totalQuantity || 0} un.)</div>
            ${resumenItems || '<div class="text-xs text-gray-400">Sin prendas especificadas</div>'}
          </div>

          ${(() => {
            const storage = global.NovaprintStorage;
            const prod = global.NovaprintProduction;
            const inventarioActual = storage ? storage.getInventory() : [];
            const faltantesInfo = (prod && inventarioActual.length > 0) ? prod.calcularFaltantesPedido(inventarioActual, pedido.items || []) : null;
            if (faltantesInfo && faltantesInfo.tieneFaltantes && pedido.status !== 'Entregado' && pedido.status !== 'Listo para entrega') {
              return `
                <div class="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs">
                  <span class="text-red-700 font-bold text-[11px] flex items-center gap-1">⚠️ Faltan ${faltantesInfo.totalPrendasFaltantes} un. en bodega</span>
                  <button type="button" class="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-xs transition-colors" onclick="NovaprintUI.comprarFaltantesDePedido('${pedido.id}')">
                    🛒 Comprar
                  </button>
                </div>
              `;
            }
            return '';
          })()}

          <!-- Finanzas resumidas -->
          <div class="flex justify-between items-center text-xs py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-200 mb-3">
            <div>
              <span class="text-gray-500">Total:</span>
              <span class="font-bold text-gray-900 ml-1">${totalStr}</span>
            </div>
            <div>
              <span class="text-gray-500">Saldo:</span>
              <span class="font-bold ${pedido.totals?.balanceAmount > 0 ? 'text-red-600' : 'text-emerald-700'} ml-1">${saldoStr}</span>
            </div>
          </div>
        </div>

        <!-- Botones de Acción Rápida -->
        <div class="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5 items-center justify-between">
          <div class="flex gap-1">
            <button type="button" class="btn-ticket p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded text-xs flex items-center gap-1 border border-gray-200" title="Ver Ticket Imprimible" onclick="NovaprintUI.verTicket('${pedido.id}')">
              📄 Ticket
            </button>
            <button type="button" class="btn-whatsapp p-1.5 text-emerald-700 hover:bg-emerald-50 rounded text-xs flex items-center gap-1 border border-emerald-200" title="Enviar WhatsApp" onclick="NovaprintUI.enviarWhatsApp('${pedido.id}')">
              💬 WhatsApp
            </button>
            <button type="button" class="btn-send-fabrication p-1.5 text-indigo-700 hover:bg-indigo-50 rounded text-xs flex items-center gap-1 border border-indigo-200 font-semibold" title="Enviar a Fabricación en Taller" onclick="NovaprintUI.enviarPedidoAFabricacion('${pedido.id}')">
              ⚡ Taller
            </button>
          </div>

          <div class="flex gap-1 items-center">
            <button type="button" class="btn-change-status px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer" title="Modificar estado del pedido" onclick="NovaprintUI.abrirModalCambiarEstado('${pedido.id}')">
              🔄 Estado
            </button>
            ${proximoEstado ? `
              <button type="button" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm cursor-pointer" onclick="NovaprintUI.cambiarEstado('${pedido.id}', '${proximoEstado}')">
                Avanzar ➔
              </button>
            ` : ''}
            <button type="button" class="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded text-xs" title="Editar Pedido" onclick="NovaprintUI.editarPedido('${pedido.id}')">
              ✏️
            </button>
            <button type="button" class="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded text-xs" title="Eliminar Pedido" onclick="NovaprintUI.confirmarEliminarPedido('${pedido.id}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function getTechniqueClass(technique) {
    switch (technique) {
      case 'DTF': return 'technique-dtf';
      case 'Serigrafía': return 'technique-serigrafia';
      case 'Sublimación': return 'technique-sublimacion';
      case 'Vinilo Textil': return 'technique-vinilo';
      case 'Bordado': return 'technique-bordado';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  /**
   * Renderiza los 4 bloques del Semáforo de Urgencia (Vista Kanban)
   */
  function renderOrdersKanban(pedidos = [], hoy = new Date()) {
    const sales = global.NovaprintSales;
    const colAtrasados = document.getElementById('col-atrasados');
    const colUrgentes = document.getElementById('col-urgentes');
    const colSemana = document.getElementById('col-semana');
    const colListos = document.getElementById('col-listos');

    if (!colAtrasados || !colUrgentes || !colSemana || !colListos) return;

    const atrasados = [];
    const urgentes = [];
    const semana = [];
    const listos = [];

    pedidos.forEach(p => {
      if (p.status === 'Listo para entrega' || p.status === 'Entregado') {
        listos.push(p);
      } else {
        const urg = sales.clasificarPedidoPorUrgencia(p.dates?.deliveryDate, p.status, hoy);
        if (urg === 'atrasado') atrasados.push(p);
        else if (urg === 'urgente_hoy') urgentes.push(p);
        else semana.push(p);
      }
    });

    const renderLista = (arr, emptyMsg) => {
      if (arr.length === 0) {
        return `<div class="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">${emptyMsg}</div>`;
      }
      return arr.map(p => renderOrderCard(p, hoy)).join('');
    };

    colAtrasados.innerHTML = renderLista(atrasados, 'Sin pedidos atrasados');
    colUrgentes.innerHTML = renderLista(urgentes, 'Sin entregas pendientes para hoy');
    colSemana.innerHTML = renderLista(semana, 'Sin pedidos en cola semanal');
    colListos.innerHTML = renderLista(listos, 'Sin pedidos listos o entregados');

    document.getElementById('count-atrasados').textContent = `(${atrasados.length})`;
    document.getElementById('count-urgentes').textContent = `(${urgentes.length})`;
    document.getElementById('count-semana').textContent = `(${semana.length})`;
    document.getElementById('count-listos').textContent = `(${listos.length})`;
  }

  /**
   * Renderiza el listado tabular de pedidos
   */
  function renderOrdersTable(pedidos = [], hoy = new Date()) {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;

    const sales = global.NovaprintSales;

    if (pedidos.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-gray-400 text-sm">
            No se encontraron pedidos registrados o que coincidan con la búsqueda.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = pedidos.map(p => {
      const urg = sales.clasificarPedidoPorUrgencia(p.dates?.deliveryDate, p.status, hoy);
      const totalStr = sales.formatearMoneda(p.totals?.totalAmount || 0);
      const saldoStr = sales.formatearMoneda(p.totals?.balanceAmount || 0);
      const prendasStr = (p.items || []).map(i => `${i.quantity} ${i.garmentType} (${i.technique})`).join(', ');

      return `
        <tr class="border-b border-gray-100 hover:bg-blue-50/40 text-xs">
          <td class="py-3 px-3 font-mono font-bold text-blue-600">${p.id}</td>
          <td class="py-3 px-3">
            <div class="font-bold text-gray-900">${p.clientName}</div>
            <div class="text-[11px] text-gray-400">${p.clientPhone || 'Sin tel'}</div>
          </td>
          <td class="py-3 px-3 font-semibold ${urg === 'atrasado' ? 'text-red-600' : 'text-gray-700'}">
            ${p.dates?.deliveryDate || 'S/F'}
          </td>
          <td class="py-3 px-3 text-gray-600 max-w-xs truncate" title="${prendasStr}">
            <span class="font-bold">${p.totals?.totalQuantity || 0} un:</span> ${prendasStr || 'Sin ítems'}
          </td>
          <td class="py-3 px-3">
            <span class="font-bold text-gray-900">${totalStr}</span>
            <div class="text-[11px] ${p.totals?.balanceAmount > 0 ? 'text-red-600 font-semibold' : 'text-emerald-700'}">
              Saldo: ${saldoStr}
            </div>
          </td>
          <td class="py-3 px-3">
            <button type="button" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${getStatusBadgeClass(p.status)} hover:shadow-xs hover:brightness-95 transition cursor-pointer" onclick="NovaprintUI.abrirModalCambiarEstado('${p.id}')" title="Modificar estado de este pedido">
              <span>${p.status}</span>
              <span class="text-[10px] opacity-60">▾</span>
            </button>
          </td>
          <td class="py-3 px-3 text-right space-x-1">
            <button class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded" title="Modificar Estado" onclick="NovaprintUI.abrirModalCambiarEstado('${p.id}')">🔄</button>
            <button class="p-1 text-gray-600 hover:text-blue-600 rounded" title="Ver Ticket" onclick="NovaprintUI.verTicket('${p.id}')">📄</button>
            <button class="p-1 text-emerald-600 hover:text-emerald-800 rounded" title="WhatsApp" onclick="NovaprintUI.enviarWhatsApp('${p.id}')">💬</button>
            <button class="p-1 text-gray-500 hover:text-gray-800 rounded" title="Editar" onclick="NovaprintUI.editarPedido('${p.id}')">✏️</button>
            <button class="p-1 text-red-500 hover:text-red-700 rounded" title="Eliminar" onclick="NovaprintUI.confirmarEliminarPedido('${p.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'Cotización': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'Confirmado': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'En producción': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Listo para entrega': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Entregado': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  /**
   * Renderiza el catálogo de clientes
   */
  function renderClientsGrid(clientes = []) {
    const container = document.getElementById('clients-grid-container');
    if (!container) return;

    const storage = global.NovaprintStorage;
    const sales = global.NovaprintSales;
    const todosPedidos = storage ? storage.getOrders() : [];

    if (clientes.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center text-gray-400">
          <p class="text-base font-semibold">No hay clientes registrados.</p>
          <p class="text-xs text-gray-500 mt-1">Usa el botón "+ Nuevo Cliente" para comenzar tu directorio.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = clientes.map(c => {
      const pedidosCliente = todosPedidos.filter(p => p.clientId === c.id || p.clientName.toLowerCase() === c.name.toLowerCase());
      const totalGastado = pedidosCliente.reduce((sum, p) => sum + (p.totals?.totalAmount || 0), 0);
      const totalDeuda = pedidosCliente.reduce((sum, p) => sum + (p.totals?.balanceAmount || 0), 0);

      return `
        <div class="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="font-bold text-gray-900 text-lg">${c.name}</h3>
                ${c.rut ? `<span class="text-xs font-mono text-gray-500">RUT: ${c.rut}</span>` : ''}
              </div>
              <span class="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                ${pedidosCliente.length} pedidos
              </span>
            </div>

            <div class="space-y-1.5 text-xs text-gray-600 mb-4">
              ${c.phone ? `<div class="flex items-center gap-1.5"><span>📱</span> <a href="tel:${c.phone}" class="hover:underline">${c.phone}</a></div>` : ''}
              ${c.email ? `<div class="flex items-center gap-1.5"><span>✉️</span> <a href="mailto:${c.email}" class="hover:underline">${c.email}</a></div>` : ''}
              ${c.address ? `<div class="flex items-center gap-1.5"><span>📍</span> <span>${c.address}</span></div>` : ''}
              ${c.notes ? `<div class="p-2 bg-gray-50 rounded text-gray-500 italic mt-2">${c.notes}</div>` : ''}
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
              <div>
                <div class="text-[10px] uppercase text-gray-400 font-bold">Total Comprado</div>
                <div class="font-bold text-gray-900">${sales ? sales.formatearMoneda(totalGastado) : `$${totalGastado}`}</div>
              </div>
              <div>
                <div class="text-[10px] uppercase text-gray-400 font-bold">Saldo Pendiente</div>
                <div class="font-bold ${totalDeuda > 0 ? 'text-red-600' : 'text-emerald-700'}">${sales ? sales.formatearMoneda(totalDeuda) : `$${totalDeuda}`}</div>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
            <button type="button" class="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1" onclick="NovaprintUI.verHistorialCliente('${c.id}')">
              📜 Historial
            </button>
            <div class="flex gap-2">
              ${c.phone ? `
                <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}" target="_blank" class="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100" title="Contactar WhatsApp">
                  💬
                </a>
              ` : ''}
              <button type="button" class="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Editar Cliente" onclick="NovaprintUI.editarCliente('${c.id}')">
                ✏️
              </button>
              <button type="button" class="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar Cliente" onclick="NovaprintUI.confirmarEliminarCliente('${c.id}')">
                🗑️
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function toggleOrderDeliveryInput() {
    const checkbox = document.getElementById('order-apply-delivery');
    const container = document.getElementById('order-delivery-input-container');
    const input = document.getElementById('order-delivery-input');
    if (checkbox && container) {
      if (checkbox.checked) {
        container.classList.remove('hidden');
        if (input && (!input.value || Number(input.value) === 0)) {
          input.value = 0;
          input.focus();
        }
      } else {
        container.classList.add('hidden');
      }
    }
    recalcularTotalesFormulario();
  }

  function togglePurchaseDeliveryInput() {
    const checkbox = document.getElementById('purchase-apply-delivery');
    const container = document.getElementById('purchase-delivery-input-container');
    const input = document.getElementById('purchase-delivery-input');
    if (checkbox && container) {
      if (checkbox.checked) {
        container.classList.remove('hidden');
        if (input && (!input.value || Number(input.value) === 0)) {
          input.value = 0;
          input.focus();
        }
      } else {
        container.classList.add('hidden');
      }
    }
    recalcularTotalesCompraFormulario();
  }

  // --- FORMULARIO DE PEDIDOS DINÁMICO ---
  function abrirModalNuevoPedido(clientePreseleccionado = null) {
    editingOrderId = null;
    currentOrderItems = [];
    document.getElementById('form-order').reset();
    document.getElementById('order-modal-title').textContent = 'Registrar Nuevo Pedido de Estampado';
    document.getElementById('order-id-display').textContent = 'Correlativo Automático';

    // Resetear IVA y Delivery
    const checkIva = document.getElementById('order-apply-iva');
    if (checkIva) checkIva.checked = false;
    const checkDeliv = document.getElementById('order-apply-delivery');
    if (checkDeliv) checkDeliv.checked = false;
    const inputDeliv = document.getElementById('order-delivery-input');
    if (inputDeliv) inputDeliv.value = 0;
    const contDeliv = document.getElementById('order-delivery-input-container');
    if (contDeliv) contDeliv.classList.add('hidden');

    // Poblar selector de clientes
    const storage = global.NovaprintStorage;
    const clients = storage ? storage.getClients() : [];
    const clientSelect = document.getElementById('order-client-select');
    clientSelect.innerHTML = '<option value="">-- Seleccionar Cliente --</option>' + 
      clients.map(c => `<option value="${c.id}" data-name="${c.name}" data-phone="${c.phone}">${c.name} (${c.phone || 'Sin tel'})</option>`).join('');

    if (clientePreseleccionado) {
      clientSelect.value = clientePreseleccionado;
    }

    // Fecha de entrega por defecto: 3 días después
    const fechaMin = new Date();
    fechaMin.setDate(fechaMin.getDate() + 3);
    document.getElementById('order-delivery-date').value = fechaMin.toISOString().split('T')[0];

    // Añadir una primera prenda por defecto
    agregarFilaPrenda();
    recalcularTotalesFormulario();

    document.getElementById('dialog-order').showModal();
  }

  function agregarFilaPrenda(datos = {}) {
    const sales = global.NovaprintSales;
    const item = {
      id: datos.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      garmentType: datos.garmentType || 'Polera',
      color: datos.color || 'Negro',
      size: datos.size || 'L',
      technique: datos.technique || 'DTF',
      printLocation: datos.printLocation || 'Adelante',
      quantity: datos.quantity || 1,
      unitPrice: datos.unitPrice || (sales ? sales.calcularPrecioSugeridoPrenda({ garmentType: datos.garmentType || 'Polera', color: datos.color || 'Negro', size: datos.size || 'L', technique: datos.technique || 'DTF', printLocation: datos.printLocation || 'Adelante' }) : 6700),
      notes: datos.notes || ''
    };
    currentOrderItems.push(item);
    renderTablaItemsFormulario();
    recalcularTotalesFormulario();
  }

  function eliminarFilaPrenda(itemId) {
    currentOrderItems = currentOrderItems.filter(it => it.id !== itemId);
    if (currentOrderItems.length === 0) {
      agregarFilaPrenda();
    } else {
      renderTablaItemsFormulario();
      recalcularTotalesFormulario();
    }
  }

  function generarOpcionesColor(colorActual = 'Negro') {
    const sales = global.NovaprintSales;
    const colores = (sales && sales.COLORES_TEXTILES) ? sales.COLORES_TEXTILES : [
      'Negro', 'Blanco', 'Gris Melange', 'Gris Grafito', 'Azul Marino',
      'Azul Rey', 'Rojo', 'Burdeo', 'Verde Botella', 'Verde Militar',
      'Amarillo', 'Naranjo', 'Celeste', 'Rosado', 'Beige', 'Morado', 'Otro'
    ];

    let html = '';
    let coincide = false;
    colores.forEach(c => {
      const selected = c.toLowerCase() === (colorActual || '').toLowerCase();
      if (selected) coincide = true;
      html += `<option value="${c}" ${selected ? 'selected' : ''}>${c}</option>`;
    });

    if (!coincide && colorActual && colorActual.trim() !== '') {
      html = `<option value="${colorActual}" selected>${colorActual}</option>` + html;
    }
    return html;
  }

  function generarOpcionesTalla(tallaActual = 'L') {
    const sales = global.NovaprintSales;
    const grupos = (sales && sales.TALLAS_GRUPOS) ? sales.TALLAS_GRUPOS : [
      { grupo: 'Niños', tallas: ['4', '6', '8', '10', '12', '14', '16', '18'] },
      { grupo: 'Adultos / Estándar', tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'] }
    ];

    let html = '';
    let coincide = false;
    const tallaNorm = String(tallaActual || '').trim().toUpperCase();

    grupos.forEach(g => {
      html += `<optgroup label="${g.grupo}">`;
      g.tallas.forEach(t => {
        const selected = String(t).trim().toUpperCase() === tallaNorm;
        if (selected) coincide = true;
        html += `<option value="${t}" ${selected ? 'selected' : ''}>${t}</option>`;
      });
      html += `</optgroup>`;
    });

    if (!coincide && tallaActual && String(tallaActual).trim() !== '') {
      html = `<option value="${tallaActual}" selected>${tallaActual}</option>` + html;
    }
    return html;
  }

  function manejarCambioColor(itemId, valor) {
    if (valor === 'Otro') {
      const personalizado = prompt('Especifica el color de la prenda:');
      if (personalizado && personalizado.trim()) {
        actualizarItemProp(itemId, 'color', personalizado.trim());
      } else {
        actualizarItemProp(itemId, 'color', 'Otro');
      }
    } else {
      actualizarItemProp(itemId, 'color', valor);
    }
  }

  function manejarCambioColorInventario(valor) {
    const selectEl = document.getElementById('inventory-color-select');
    if (!selectEl) return;
    if (valor === 'Otro') {
      const personalizado = prompt('Especifica el color de la prenda / insumo:');
      if (personalizado && personalizado.trim()) {
        const colorLimpio = personalizado.trim();
        selectEl.innerHTML = `<option value="${colorLimpio}" selected>${colorLimpio}</option>` + generarOpcionesColor(colorLimpio);
        selectEl.value = colorLimpio;
      } else {
        selectEl.value = 'Negro';
      }
    }
  }

  function obtenerBadgeStockHtml(item) {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const inventario = storage ? storage.getInventory() : [];
    if (!prod || inventario.length === 0) {
      return `<span class="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Bodega: Sin stock reg.</span>`;
    }

    const dispo = prod.verificarDisponibilidadPrenda(inventario, item);
    if (dispo.estado === 'suficiente') {
      return `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
        ✅ Bodega: ${dispo.stockActual} un.
      </span>`;
    } else if (dispo.estado === 'faltante') {
      return `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
        ⚠️ Bodega: ${dispo.stockActual} | Faltan: ${dispo.faltante}
      </span>`;
    } else {
      return `<span class="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
        ⚪ Sin reg. bodega
      </span>`;
    }
  }

  function normalizarUbicacionEstampado(ubicacion) {
    const prod = global.NovaprintProduction;
    if (prod && typeof prod.normalizarOpcionEstampado === 'function') {
      return prod.normalizarOpcionEstampado(ubicacion).nombre;
    }
    const txt = (ubicacion || '').toString().toLowerCase();
    if (txt.includes('ningun') || txt.includes('sin') || txt === 'lisa' || txt === 'liso' || txt === 'no') return 'Ninguno';
    if (txt.includes('ambos') || txt.includes('adelante y atras') || txt.includes('pecho y espalda')) return 'Ambos';
    if (txt.includes('atras') || txt.includes('espalda') || txt.includes('posterior')) return 'Atrás';
    return 'Adelante';
  }

  function renderTablaItemsFormulario() {
    const tbody = document.getElementById('order-items-tbody');
    if (!tbody) return;

    tbody.innerHTML = currentOrderItems.map((it, idx) => `
      <tr class="border-b border-gray-200 text-xs">
        <td class="py-2 pr-1">
          <select class="w-full p-1.5 border border-gray-300 rounded font-semibold text-gray-800" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'garmentType', this.value)">
            <option value="Polera" ${it.garmentType === 'Polera' ? 'selected' : ''}>Polera</option>
            <option value="Polerón" ${it.garmentType === 'Polerón' ? 'selected' : ''}>Polerón</option>
            <option value="Buzo" ${it.garmentType === 'Buzo' ? 'selected' : ''}>Buzo</option>
            <option value="Gorra" ${it.garmentType === 'Gorra' ? 'selected' : ''}>Gorra</option>
            <option value="Otro" ${it.garmentType === 'Otro' ? 'selected' : ''}>Otro</option>
          </select>
          <div id="badge-stock-${it.id}" class="mt-1">${obtenerBadgeStockHtml(it)}</div>
        </td>
        <td class="py-2 px-1">
          <select class="w-28 p-1.5 border border-gray-300 rounded font-medium text-gray-800" onchange="NovaprintUI.manejarCambioColor('${it.id}', this.value)">
            ${generarOpcionesColor(it.color)}
          </select>
        </td>
        <td class="py-2 px-1">
          <select class="w-20 p-1.5 border border-gray-300 rounded font-medium" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'size', this.value)">
            ${generarOpcionesTalla(it.size)}
          </select>
        </td>
        <td class="py-2 px-1">
          <select class="w-28 p-1.5 border border-gray-300 rounded font-semibold text-blue-700" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'technique', this.value)">
            <option value="DTF" ${it.technique === 'DTF' ? 'selected' : ''}>DTF</option>
            <option value="Serigrafía" ${it.technique === 'Serigrafía' ? 'selected' : ''}>Serigrafía</option>
            <option value="Sublimación" ${it.technique === 'Sublimación' ? 'selected' : ''}>Sublimación</option>
            <option value="Vinilo Textil" ${it.technique === 'Vinilo Textil' ? 'selected' : ''}>Vinilo Textil</option>
            <option value="Bordado" ${it.technique === 'Bordado' ? 'selected' : ''}>Bordado</option>
          </select>
          ${(() => {
            const sales = global.NovaprintSales;
            const comp = sales ? sales.validarCompatibilidadTecnica(it) : { valido: true };
            if (!comp.valido) {
              return `<div class="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 mt-1" title="${comp.mensaje}">⚠️ ${comp.mensaje}</div>`;
            }
            return '';
          })()}
        </td>
        <td class="py-2 px-1">
          <select class="w-32 p-1.5 border border-gray-300 rounded font-semibold text-gray-800" onchange="NovaprintUI.actualizarItemProp('${it.id}', 'printLocation', this.value)">
            <option value="Ninguno" ${normalizarUbicacionEstampado(it.printLocation) === 'Ninguno' ? 'selected' : ''}>Ninguno ($0)</option>
            <option value="Adelante" ${normalizarUbicacionEstampado(it.printLocation) === 'Adelante' ? 'selected' : ''}>Adelante ($1.800)</option>
            <option value="Atrás" ${normalizarUbicacionEstampado(it.printLocation) === 'Atrás' ? 'selected' : ''}>Atrás ($2.200)</option>
            <option value="Ambos" ${normalizarUbicacionEstampado(it.printLocation) === 'Ambos' ? 'selected' : ''}>Ambos ($3.500)</option>
          </select>
        </td>
        <td class="py-2 px-1">
          <input type="number" min="1" value="${it.quantity}" class="w-16 p-1.5 border border-gray-300 rounded text-center font-bold" oninput="NovaprintUI.actualizarItemProp('${it.id}', 'quantity', this.value)">
        </td>
        <td class="py-2 px-1">
          <input id="input-price-${it.id}" type="number" step="any" value="${it.unitPrice ?? 0}" placeholder="0" class="w-24 p-1.5 border border-gray-300 rounded text-right font-medium focus:bg-white" oninput="NovaprintUI.actualizarItemProp('${it.id}', 'unitPrice', this.value)">
        </td>
        <td class="py-2 px-1 text-right font-bold text-gray-900 subtotal-cell">
          $${it.quantity * it.unitPrice}
        </td>
        <td class="py-2 pl-1 text-center">
          <button type="button" class="text-red-500 hover:text-red-700 p-1 font-bold" onclick="NovaprintUI.eliminarFilaPrenda('${it.id}')">✕</button>
        </td>
      </tr>
    `).join('');
  }

  function actualizarItemProp(itemId, prop, value) {
    const item = currentOrderItems.find(it => it.id === itemId);
    const sales = global.NovaprintSales;
    if (item) {
      if (prop === 'quantity') {
        item.quantity = Math.max(0, parseInt(value, 10) || 0);
      } else if (prop === 'unitPrice') {
        item.unitPrice = Number(value) || 0;
        item._manualPrice = true;
      } else {
        item[prop] = value;
        if (!item._manualPrice && sales && typeof sales.calcularPrecioSugeridoPrenda === 'function') {
          item.unitPrice = sales.calcularPrecioSugeridoPrenda(item);
        }
      }
      item.subtotal = (item.quantity || 0) * (item.unitPrice || 0);

      // Si cambió un selector (no el input de cantidad/precio), re-renderizar para reflejar precio sugerido y subtotales
      if (prop !== 'quantity' && prop !== 'unitPrice') {
        renderTablaItemsFormulario();
      } else {
        const badgeEl = document.getElementById(`badge-stock-${itemId}`);
        if (badgeEl) {
          badgeEl.innerHTML = obtenerBadgeStockHtml(item);
        }
      }

      recalcularTotalesFormulario();
    }
  }

  function recalcularTotalesFormulario() {
    const sales = global.NovaprintSales;
    const inputAbono = document.getElementById('order-deposit-input');
    const montoAbono = inputAbono ? Number(inputAbono.value) || 0 : 0;
    const checkboxDesc = document.getElementById('form-apply-discount');
    const aplicarDesc = checkboxDesc ? checkboxDesc.checked : true;
    const checkboxIva = document.getElementById('order-apply-iva');
    const aplicarIva = checkboxIva ? checkboxIva.checked : false;
    const checkboxDeliv = document.getElementById('order-apply-delivery');
    const aplicarDeliv = checkboxDeliv ? checkboxDeliv.checked : false;
    const inputDeliv = document.getElementById('order-delivery-input');
    const montoDelivery = (aplicarDeliv && inputDeliv) ? Math.max(0, Number(inputDeliv.value) || 0) : 0;

    const totales = sales.calcularTotalesPedido(currentOrderItems, montoAbono, {
      aplicarDescuentoVolumen: aplicarDesc,
      aplicarIva,
      montoDelivery
    });

    document.getElementById('form-total-quantity').textContent = `${totales.totalQuantity} un.`;
    document.getElementById('form-total-amount').textContent = sales.formatearMoneda(totales.totalAmount);
    document.getElementById('form-balance-amount').textContent = sales.formatearMoneda(totales.balanceAmount);

    // Contenedores de Subtotal Bruto, Descuento por Volumen y Neto
    const subtotalContainer = document.getElementById('form-subtotal-container');
    const discountContainer = document.getElementById('form-discount-container');
    const discountLabel = document.getElementById('form-discount-label');
    const subtotalEl = document.getElementById('form-subtotal-amount');
    const netoContainer = document.getElementById('form-neto-container');
    const netoEl = document.getElementById('form-neto-amount');

    if (totales.volumeDiscountPercent > 0) {
      if (subtotalContainer) {
        subtotalContainer.classList.remove('hidden');
        if (subtotalEl) subtotalEl.textContent = sales.formatearMoneda(totales.subtotalBruto);
      }
      if (discountContainer) {
        discountContainer.classList.remove('hidden');
        if (discountLabel) {
          discountLabel.textContent = `Desc. Volumen (${totales.volumeDiscountPercent}%): -${sales.formatearMoneda(totales.volumeDiscountAmount)}`;
        }
      }
    } else {
      if (subtotalContainer) subtotalContainer.classList.add('hidden');
      if (discountContainer) discountContainer.classList.add('hidden');
    }

    if (netoContainer && netoEl) {
      if (totales.volumeDiscountAmount > 0 || totales.applyIva || totales.deliveryAmount > 0) {
        netoContainer.classList.remove('hidden');
        netoEl.textContent = sales.formatearMoneda(totales.netAmount);
      } else {
        netoContainer.classList.add('hidden');
      }
    }

    // Fila IVA
    const ivaRow = document.getElementById('form-iva-row');
    const ivaAmountEl = document.getElementById('form-iva-amount');
    if (ivaRow && ivaAmountEl) {
      if (totales.applyIva) {
        ivaRow.classList.remove('hidden');
        ivaAmountEl.textContent = `+${sales.formatearMoneda(totales.ivaAmount)}`;
      } else {
        ivaRow.classList.add('hidden');
      }
    }

    // Fila Delivery
    const delivRow = document.getElementById('form-delivery-row');
    const delivAmountEl = document.getElementById('form-delivery-amount');
    if (delivRow && delivAmountEl) {
      if (totales.applyDelivery) {
        delivRow.classList.remove('hidden');
        delivAmountEl.textContent = `+${sales.formatearMoneda(totales.deliveryAmount)}`;
      } else {
        delivRow.classList.add('hidden');
      }
    }

    const badgeEstadoPago = document.getElementById('form-payment-status');
    if (badgeEstadoPago) {
      badgeEstadoPago.textContent = totales.paymentStatus;
      badgeEstadoPago.className = `px-2 py-0.5 rounded text-xs font-bold ${
        totales.paymentStatus === 'Pagado Total' ? 'bg-emerald-100 text-emerald-800' :
        totales.paymentStatus === 'Abonado' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
      }`;
    }

    // Actualizar visualmente subtotales de la tabla
    const celdasSubtotales = document.querySelectorAll('.subtotal-cell');
    currentOrderItems.forEach((it, idx) => {
      if (celdasSubtotales[idx]) {
        celdasSubtotales[idx].textContent = sales.formatearMoneda(it.quantity * it.unitPrice);
      }
    });

    // Spec 004 & Spec 020: Evaluar faltantes en el inventario y mostrar banner de compra (Prendas y Estampados)
    const prod = global.NovaprintProduction;
    const storage = global.NovaprintStorage;
    const alertContainer = document.getElementById('order-stock-alert-container');
    if (prod && storage && alertContainer) {
      const inventario = storage.getInventory();
      const balance = prod.calcularFaltantesPedido(inventario, currentOrderItems, { incluirEstampados: true });
      if (balance.tieneFaltantes) {
        alertContainer.classList.remove('hidden');

        let mensajeFaltantes = '';
        if (balance.totalPrendasFaltantes > 0 && balance.totalEstampadosFaltantes > 0) {
          mensajeFaltantes = `Este pedido requiere comprar <strong>${balance.totalPrendasFaltantes} prendas</strong> y <strong>${balance.totalEstampadosFaltantes} estampados</strong> adicionales para ser completado.`;
        } else if (balance.totalPrendasFaltantes > 0) {
          mensajeFaltantes = `Este pedido requiere comprar <strong>${balance.totalPrendasFaltantes} prendas</strong> adicionales para ser completado.`;
        } else {
          mensajeFaltantes = `Prendas disponibles en bodega. Requiere comprar <strong>${balance.totalEstampadosFaltantes} estampados</strong> para las unidades del pedido.`;
        }

        alertContainer.innerHTML = `
          <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">⚠️</span>
              <div>
                <p class="text-xs font-bold text-red-900">Material de Pedido por Adquirir</p>
                <p class="text-[11px] text-red-700">${mensajeFaltantes}</p>
              </div>
            </div>
            <button type="button" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" onclick="NovaprintUI.abrirModalCompraConFaltantes()">
              🛒 Comprar Material Faltante
            </button>
          </div>
        `;
      } else {
        alertContainer.classList.add('hidden');
        alertContainer.innerHTML = '';
      }
    }
  }

  /**
   * Abre el modal informativo de la escala oficial de descuentos por volumen (Spec 013).
   * Si el formulario de pedido está abierto, resalta el tramo actual e indica cuántas prendas
   * faltan para alcanzar el siguiente porcentaje de ahorro.
   */
  function abrirModalDescuentosVolumen() {
    const dialog = document.getElementById('dialog-volume-discounts');
    if (!dialog) return;

    // Contabilizar prendas actuales en el formulario si está abierto
    const orderDialog = document.getElementById('dialog-order');
    const isOrderOpen = orderDialog && orderDialog.open;
    const totalPrendas = isOrderOpen 
      ? currentOrderItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0)
      : 0;

    const statusEl = document.getElementById('volume-discounts-status-info');
    if (statusEl) {
      if (isOrderOpen && totalPrendas > 0) {
        let activePercent = 0;
        let nextMessage = '';

        if (totalPrendas >= 50) {
          activePercent = 20;
          nextMessage = '🏆 ¡Has alcanzado el tramo máximo de ahorro (20% OFF)!';
        } else if (totalPrendas >= 25) {
          activePercent = 15;
          const falta = 50 - totalPrendas;
          nextMessage = `💡 Agrega <strong>${falta}</strong> prenda${falta > 1 ? 's' : ''} más para subir al <strong>20% OFF (Gran volumen)</strong>.`;
        } else if (totalPrendas >= 12) {
          activePercent = 10;
          const falta = 25 - totalPrendas;
          nextMessage = `💡 Agrega <strong>${falta}</strong> prenda${falta > 1 ? 's' : ''} más para subir al <strong>15% OFF (Mayorista)</strong>.`;
        } else if (totalPrendas >= 6) {
          activePercent = 5;
          const falta = 12 - totalPrendas;
          nextMessage = `💡 Agrega <strong>${falta}</strong> prenda${falta > 1 ? 's' : ''} más para subir al <strong>10% OFF (Docena)</strong>.`;
        } else {
          activePercent = 0;
          const falta = 6 - totalPrendas;
          nextMessage = `💡 Agrega <strong>${falta}</strong> prenda${falta > 1 ? 's' : ''} más para activar tu primer descuento (<strong>5% OFF</strong>).`;
        }

        statusEl.innerHTML = `
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-900">
            <div class="flex justify-between items-center font-bold">
              <span>Prendas en el pedido actual:</span>
              <span class="text-sm text-blue-700 bg-white px-2 py-0.5 rounded shadow-2xs font-black">${totalPrendas} un.</span>
            </div>
            <div class="flex justify-between items-center font-semibold">
              <span>Descuento aplicado:</span>
              <span class="text-sm font-black ${activePercent > 0 ? 'text-emerald-600' : 'text-gray-500'}">${activePercent}% OFF</span>
            </div>
            <p class="text-[11px] text-blue-800 pt-1.5 border-t border-blue-200/60">${nextMessage}</p>
          </div>
        `;
      } else {
        statusEl.innerHTML = `
          <div class="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
            <p class="font-bold text-gray-800">ℹ️ Cálculo automático por volumen</p>
            <p class="text-[11px] mt-0.5">La escala se activa y recalcula automáticamente al agregar prendas en el formulario de Nuevo Pedido.</p>
          </div>
        `;
      }
    }

    // Resaltar visualmente la fila del tramo activo
    document.querySelectorAll('.volume-tier-row').forEach(row => {
      const min = parseInt(row.getAttribute('data-min') || '0', 10);
      const max = parseInt(row.getAttribute('data-max') || '999999', 10);
      if (isOrderOpen && totalPrendas >= min && totalPrendas <= max) {
        row.classList.add('bg-emerald-50', 'border-emerald-300', 'font-black');
        row.classList.remove('bg-white');
      } else {
        row.classList.remove('bg-emerald-50', 'border-emerald-300', 'font-black');
        row.classList.add('bg-white');
      }
    });

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function guardarPedidoDesdeFormulario() {
    const storage = global.NovaprintStorage;
    const sales = global.NovaprintSales;
    const clientSelect = document.getElementById('order-client-select');
    const selectedOption = clientSelect.options[clientSelect.selectedIndex];

    const clientId = clientSelect.value;
    const clientName = selectedOption ? (selectedOption.getAttribute('data-name') || 'Cliente General') : 'Cliente General';
    let clientPhone = selectedOption ? (selectedOption.getAttribute('data-phone') || '') : '';
    if (!clientPhone && clientId && storage && typeof storage.getClientById === 'function') {
      const cli = storage.getClientById(clientId);
      if (cli && cli.phone) clientPhone = cli.phone;
    }
    const deliveryDate = document.getElementById('order-delivery-date').value;
    const status = document.getElementById('order-status-select').value;
    const notes = document.getElementById('order-notes-input').value;
    const inputAbono = document.getElementById('order-deposit-input');
    const depositAmount = inputAbono ? Number(inputAbono.value) || 0 : 0;

    if (!clientId && !clientName) {
      showToast('Por favor selecciona un cliente para el pedido.', 'warning');
      return;
    }

    if (currentOrderItems.length === 0) {
      showToast('Debes añadir al menos una prenda al pedido.', 'warning');
      return;
    }

    const checkboxDesc = document.getElementById('form-apply-discount');
    const aplicarDesc = checkboxDesc ? checkboxDesc.checked : true;
    const checkboxIva = document.getElementById('order-apply-iva');
    const aplicarIva = checkboxIva ? checkboxIva.checked : false;
    const checkboxDeliv = document.getElementById('order-apply-delivery');
    const aplicarDeliv = checkboxDeliv ? checkboxDeliv.checked : false;
    const inputDeliv = document.getElementById('order-delivery-input');
    const montoDelivery = (aplicarDeliv && inputDeliv) ? Math.max(0, Number(inputDeliv.value) || 0) : 0;

    const totals = sales.calcularTotalesPedido(currentOrderItems, depositAmount, {
      aplicarDescuentoVolumen: aplicarDesc,
      aplicarIva,
      montoDelivery
    });

    const orderPayload = {
      id: editingOrderId,
      clientId,
      clientName,
      clientPhone,
      dates: {
        deliveryDate: deliveryDate || new Date().toISOString().split('T')[0]
      },
      items: currentOrderItems,
      totals,
      status,
      notes
    };

    // Spec 008: Asegurar que las prendas del pedido queden registradas en el catálogo de inventario
    if (storage && typeof storage.asegurarItemInventarioPrenda === 'function') {
      currentOrderItems.forEach(it => {
        storage.asegurarItemInventarioPrenda(it.garmentType, it.color, it.size);
      });
    }

    const saved = storage.saveOrder(orderPayload);
    document.getElementById('dialog-order').close();
    showToast(`Pedido ${saved.id} guardado con éxito.`, 'success');

    // Refrescar vistas
    global.NovaprintMain.refrescarDatos();
  }

  function editarPedido(orderId) {
    const storage = global.NovaprintStorage;
    const pedido = storage.getOrderById(orderId);
    if (!pedido) return;

    abrirModalNuevoPedido();
    editingOrderId = pedido.id;
    document.getElementById('order-modal-title').textContent = `Editar Pedido ${pedido.id}`;
    document.getElementById('order-id-display').textContent = pedido.id;

    document.getElementById('order-client-select').value = pedido.clientId || '';
    document.getElementById('order-delivery-date').value = pedido.dates?.deliveryDate || '';
    document.getElementById('order-status-select').value = pedido.status || 'Cotización';
    document.getElementById('order-notes-input').value = pedido.notes || '';
    document.getElementById('order-deposit-input').value = pedido.totals?.depositAmount || 0;

    // Cargar IVA y Delivery
    const checkIva = document.getElementById('order-apply-iva');
    if (checkIva) checkIva.checked = Boolean(pedido.totals?.applyIva);
    const checkDeliv = document.getElementById('order-apply-delivery');
    const inputDeliv = document.getElementById('order-delivery-input');
    const contDeliv = document.getElementById('order-delivery-input-container');
    const hasDelivery = Boolean(pedido.totals?.applyDelivery || (pedido.totals?.deliveryAmount > 0));
    if (checkDeliv) checkDeliv.checked = hasDelivery;
    if (inputDeliv) inputDeliv.value = pedido.totals?.deliveryAmount || 0;
    if (contDeliv) {
      if (hasDelivery) contDeliv.classList.remove('hidden');
      else contDeliv.classList.add('hidden');
    }

    currentOrderItems = (pedido.items && pedido.items.length > 0) ? JSON.parse(JSON.stringify(pedido.items)) : [];
    if (currentOrderItems.length === 0) agregarFilaPrenda();
    renderTablaItemsFormulario();
    recalcularTotalesFormulario();
  }

  function duplicarPedido(orderId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;
    const pedido = storage.getOrderById(orderId);
    if (!pedido) {
      showToast('No se encontró el pedido a duplicar.', 'error');
      return;
    }

    abrirModalNuevoPedido();
    editingOrderId = null; // Limpiar ID para generar un nuevo identificador al guardar

    const titleEl = document.getElementById('order-modal-title');
    if (titleEl) titleEl.textContent = `Duplicar Pedido (Copia de ${pedido.id})`;
    const idDisp = document.getElementById('order-id-display');
    if (idDisp) idDisp.textContent = 'Nuevo (Copia)';

    const clientSel = document.getElementById('order-client-select');
    if (clientSel) clientSel.value = pedido.clientId || '';

    // Fecha de entrega: hoy o mantener si existía
    const deliveryDateEl = document.getElementById('order-delivery-date');
    if (deliveryDateEl) {
      deliveryDateEl.value = pedido.dates?.deliveryDate || new Date().toISOString().split('T')[0];
    }

    const statusSel = document.getElementById('order-status-select');
    if (statusSel) statusSel.value = 'Cotización';

    const notesInput = document.getElementById('order-notes-input');
    if (notesInput) {
      const origNotes = pedido.notes ? `${pedido.notes} ` : '';
      notesInput.value = `${origNotes}[Copia de pedido ${pedido.id}]`.trim();
    }

    const depInput = document.getElementById('order-deposit-input');
    if (depInput) depInput.value = 0; // Iniciar abono en 0 para nuevo pedido

    // IVA y Delivery
    const checkIva = document.getElementById('order-apply-iva');
    if (checkIva) checkIva.checked = Boolean(pedido.totals?.applyIva);
    const checkDeliv = document.getElementById('order-apply-delivery');
    const inputDeliv = document.getElementById('order-delivery-input');
    const contDeliv = document.getElementById('order-delivery-input-container');
    const hasDelivery = Boolean(pedido.totals?.applyDelivery || (pedido.totals?.deliveryAmount > 0));
    if (checkDeliv) checkDeliv.checked = hasDelivery;
    if (inputDeliv) inputDeliv.value = pedido.totals?.deliveryAmount || 0;
    if (contDeliv) {
      if (hasDelivery) contDeliv.classList.remove('hidden');
      else contDeliv.classList.add('hidden');
    }

    currentOrderItems = (pedido.items && pedido.items.length > 0) ? JSON.parse(JSON.stringify(pedido.items)) : [];
    if (currentOrderItems.length === 0) agregarFilaPrenda();
    renderTablaItemsFormulario();
    recalcularTotalesFormulario();

    showToast(`Pedido ${pedido.id} clonado. Revisa y haz clic en "Guardar Pedido".`, 'info');
  }

  function cambiarEstado(orderId, nuevoEstado) {
    const storage = global.NovaprintStorage;
    storage.updateOrderStatus(orderId, nuevoEstado);
    showToast(`Pedido ${orderId} actualizado a "${nuevoEstado}"`, 'info');
    global.NovaprintMain.refrescarDatos();
  }

  const ESTADOS_PEDIDO = [
    { estado: 'Cotización', icono: '📝', desc: 'Presupuesto inicial enviado al cliente', clase: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300' },
    { estado: 'Confirmado', icono: '👍', desc: 'Aprobado por el cliente, listo para programar', clase: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300' },
    { estado: 'En producción', icono: '⚙️', desc: 'En proceso de estampado / taller textil', clase: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300' },
    { estado: 'Listo para entrega', icono: '📦', desc: 'Terminado en taller, esperando retiro o despacho', clase: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300' },
    { estado: 'Entregado', icono: '✅', desc: 'Entregado conforme al cliente', clase: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300' },
    { estado: 'Cancelado', icono: '❌', desc: 'Anulado o desistido por el cliente', clase: 'bg-red-50 hover:bg-red-100 text-red-800 border-red-300' }
  ];

  function abrirModalCambiarEstado(orderId) {
    if (typeof document === 'undefined') return;
    const dialog = document.getElementById('dialog-change-order-status');
    if (!dialog) return;

    const storage = global.NovaprintStorage;
    const pedidos = storage ? storage.getOrders() : [];
    const pedido = pedidos.find(p => p.id === orderId);
    if (!pedido) {
      showToast(`No se encontró el pedido ${orderId}`, 'error');
      return;
    }

    const orderIdEl = document.getElementById('status-modal-order-id');
    const clientNameEl = document.getElementById('status-modal-client-name');
    const currentBadgeEl = document.getElementById('status-modal-current-badge');
    const container = document.getElementById('status-modal-buttons-container');

    if (orderIdEl) orderIdEl.textContent = pedido.id;
    if (clientNameEl) clientNameEl.textContent = pedido.clientName || 'Cliente';
    if (currentBadgeEl) {
      currentBadgeEl.textContent = pedido.status;
      currentBadgeEl.className = `px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeClass(pedido.status)}`;
    }

    if (container) {
      container.innerHTML = ESTADOS_PEDIDO.map(item => {
        const esActual = item.estado === pedido.status;
        return `
          <button type="button" 
            class="btn-status-option w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${item.clase} ${esActual ? 'ring-2 ring-offset-1 ring-blue-500 font-bold shadow-xs' : 'opacity-90 hover:opacity-100'}"
            data-target-status="${item.estado}"
            onclick="NovaprintUI.seleccionarNuevoEstado('${pedido.id}', '${item.estado}')">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">${item.icono}</span>
              <div>
                <div class="text-xs font-bold flex items-center gap-1.5">
                  <span>${item.estado}</span>
                  ${esActual ? '<span class="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-black">Actual</span>' : ''}
                </div>
                <div class="text-[10px] text-gray-500 font-normal">${item.desc}</div>
              </div>
            </div>
            <span class="text-xs font-bold ${esActual ? 'text-blue-700' : 'text-gray-400'}">
              ${esActual ? '✓' : '➔'}
            </span>
          </button>
        `;
      }).join('');
    }

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function seleccionarNuevoEstado(orderId, nuevoEstado) {
    if (typeof document !== 'undefined') {
      const dialog = document.getElementById('dialog-change-order-status');
      if (dialog && typeof dialog.close === 'function') {
        dialog.close();
      }
    }
    cambiarEstado(orderId, nuevoEstado);
  }

  function confirmarEliminarPedido(orderId) {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el pedido ${orderId}?`)) {
      const storage = global.NovaprintStorage;
      storage.deleteOrder(orderId);
      showToast(`Pedido ${orderId} eliminado.`, 'info');
      global.NovaprintMain.refrescarDatos();
    }
  }

  // --- CLIENTES FORMULARIO ---
  function abrirModalNuevoCliente() {
    document.getElementById('form-client').reset();
    document.getElementById('client-id-hidden').value = '';
    document.getElementById('client-modal-title').textContent = 'Registrar Nuevo Cliente';
    document.getElementById('dialog-client').showModal();
  }

  function editarCliente(clientId) {
    const storage = global.NovaprintStorage;
    const c = storage.getClientById(clientId);
    if (!c) return;

    document.getElementById('client-id-hidden').value = c.id;
    document.getElementById('client-name-input').value = c.name || '';
    document.getElementById('client-rut-input').value = c.rut || '';
    document.getElementById('client-phone-input').value = c.phone || '';
    document.getElementById('client-email-input').value = c.email || '';
    document.getElementById('client-address-input').value = c.address || '';
    document.getElementById('client-notes-input').value = c.notes || '';

    document.getElementById('client-modal-title').textContent = `Editar Cliente: ${c.name}`;
    document.getElementById('dialog-client').showModal();
  }

  function guardarClienteDesdeFormulario() {
    const id = document.getElementById('client-id-hidden').value;
    const name = document.getElementById('client-name-input').value.trim();
    const phone = document.getElementById('client-phone-input').value.trim();
    const rut = document.getElementById('client-rut-input').value.trim();
    const email = document.getElementById('client-email-input').value.trim();
    const address = document.getElementById('client-address-input').value.trim();
    const notes = document.getElementById('client-notes-input').value.trim();

    if (!name) {
      showToast('El nombre del cliente es obligatorio.', 'warning');
      return;
    }

    const storage = global.NovaprintStorage;
    storage.saveClient({ id: id || undefined, name, phone, rut, email, address, notes });
    document.getElementById('dialog-client').close();
    showToast(`Cliente "${name}" guardado correctamente.`, 'success');
    global.NovaprintMain.refrescarDatos();
  }

  function confirmarEliminarCliente(clientId) {
    const storage = global.NovaprintStorage;
    const c = storage.getClientById(clientId);
    if (confirm(`¿Eliminar al cliente "${c ? c.name : clientId}"?`)) {
      storage.deleteClient(clientId);
      showToast('Cliente eliminado.', 'info');
      global.NovaprintMain.refrescarDatos();
    }
  }

  function verHistorialCliente(clientId) {
    const storage = global.NovaprintStorage;
    const sales = global.NovaprintSales;
    const c = storage.getClientById(clientId);
    if (!c) return;

    const pedidos = storage.getOrders().filter(p => p.clientId === clientId || p.clientName.toLowerCase() === c.name.toLowerCase());
    const modal = document.getElementById('dialog-client-history');
    document.getElementById('history-client-name').textContent = c.name;

    const container = document.getElementById('history-orders-list');
    if (pedidos.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-500 py-4 text-center">Este cliente aún no registra pedidos.</p>';
    } else {
      container.innerHTML = pedidos.map(p => `
        <div class="border border-gray-200 rounded-lg p-3 bg-white text-xs flex justify-between items-center">
          <div>
            <div class="font-bold text-gray-900">${p.id} — ${p.dates?.deliveryDate || 'S/F'}</div>
            <div class="text-gray-500">${(p.items || []).length} tipos de prendas | Total: ${sales.formatearMoneda(p.totals?.totalAmount)}</div>
            <div class="text-gray-400">Estado: <span class="font-semibold text-gray-700">${p.status}</span></div>
          </div>
          <div class="space-x-1">
            <button class="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-semibold" onclick="NovaprintUI.verTicket('${p.id}')">Ticket</button>
          </div>
        </div>
      `).join('');
    }

    modal.showModal();
  }

  // --- TICKET Y WHATSAPP ---
  function verTicket(orderId) {
    const storage = global.NovaprintStorage;
    const ticket = global.NovaprintTicket;
    const pedido = storage.getOrderById(orderId);
    if (!pedido) return;

    const settings = storage.getSettings();
    const html = ticket.generarTicketHTML(pedido, settings);
    document.getElementById('ticket-container-render').innerHTML = html;

    const btnWhatsAppTicket = document.getElementById('btn-ticket-whatsapp');
    if (btnWhatsAppTicket) {
      btnWhatsAppTicket.onclick = () => ticket.abrirWhatsAppPedido(pedido, settings);
    }

    document.getElementById('dialog-ticket').showModal();
  }

  function enviarWhatsApp(orderId) {
    const storage = global.NovaprintStorage;
    const ticket = global.NovaprintTicket;
    const pedido = storage.getOrderById(orderId);
    if (pedido) {
      ticket.abrirWhatsAppPedido(pedido, storage.getSettings());
    }
  }

  // --- GESTIÓN DE PROVEEDORES (SPEC 002) ---
  function renderSuppliersGrid(proveedores = []) {
    const container = document.getElementById('suppliers-grid-container');
    if (!container) return;

    if (proveedores.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center text-gray-400">
          <p class="text-base font-semibold">No hay proveedores registrados.</p>
          <p class="text-xs text-gray-500 mt-1">Usa el botón "+ Nuevo Proveedor" para agregar distribuidores.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = proveedores.map(p => `
      <div class="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                ${p.category || 'General'}
              </span>
              <h3 class="font-bold text-gray-900 text-lg mt-1.5">${p.name}</h3>
            </div>
            <span class="font-mono text-xs text-gray-400 font-bold">${p.id}</span>
          </div>

          <div class="space-y-1.5 text-xs text-gray-600 mb-4 mt-2">
            ${p.contact ? `<div class="flex items-center gap-1.5"><span>👤 Contacto:</span> <span class="font-semibold text-gray-800">${p.contact}</span></div>` : ''}
            ${p.phone ? `<div class="flex items-center gap-1.5"><span>📱 Tel:</span> <a href="tel:${p.phone}" class="hover:underline text-blue-600">${p.phone}</a></div>` : ''}
            ${p.email ? `<div class="flex items-center gap-1.5"><span>✉️ Email:</span> <a href="mailto:${p.email}" class="hover:underline">${p.email}</a></div>` : ''}
            ${p.address ? `<div class="flex items-center gap-1.5"><span>📍 Dirección:</span> <span>${p.address}</span></div>` : ''}
            ${p.notes ? `<div class="p-2 bg-gray-50 rounded text-gray-500 italic mt-2">${p.notes}</div>` : ''}
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
          ${p.phone ? `
            <a href="https://wa.me/${p.phone.replace(/[^0-9]/g, '')}" target="_blank" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold hover:bg-emerald-100 flex items-center gap-1">
              💬 WhatsApp
            </a>
          ` : '<span></span>'}
          <div class="flex gap-2">
            <button type="button" class="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Editar Proveedor" onclick="NovaprintUI.editarProveedor('${p.id}')">
              ✏️
            </button>
            <button type="button" class="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Eliminar Proveedor" onclick="NovaprintUI.confirmarEliminarProveedor('${p.id}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function abrirModalNuevoProveedor() {
    document.getElementById('form-supplier').reset();
    document.getElementById('supplier-id-hidden').value = '';
    document.getElementById('supplier-modal-title').textContent = 'Registrar Nuevo Proveedor';
    document.getElementById('dialog-supplier').showModal();
  }

  function editarProveedor(supplierId) {
    const storage = global.NovaprintStorage;
    const p = storage.getSupplierById(supplierId);
    if (!p) return;

    document.getElementById('supplier-id-hidden').value = p.id;
    document.getElementById('supplier-name-input').value = p.name || '';
    document.getElementById('supplier-contact-input').value = p.contact || '';
    document.getElementById('supplier-category-select').value = p.category || 'Prendas Lisas';
    document.getElementById('supplier-phone-input').value = p.phone || '';
    document.getElementById('supplier-email-input').value = p.email || '';
    document.getElementById('supplier-address-input').value = p.address || '';
    document.getElementById('supplier-notes-input').value = p.notes || '';

    document.getElementById('supplier-modal-title').textContent = `Editar Proveedor: ${p.name}`;
    document.getElementById('dialog-supplier').showModal();
  }

  function guardarProveedorDesdeFormulario() {
    const id = document.getElementById('supplier-id-hidden').value;
    const name = document.getElementById('supplier-name-input').value.trim();
    const contact = document.getElementById('supplier-contact-input').value.trim();
    const category = document.getElementById('supplier-category-select').value;
    const phone = document.getElementById('supplier-phone-input').value.trim();
    const email = document.getElementById('supplier-email-input').value.trim();
    const address = document.getElementById('supplier-address-input').value.trim();
    const notes = document.getElementById('supplier-notes-input').value.trim();

    if (!name) {
      showToast('El nombre del proveedor es obligatorio.', 'warning');
      return;
    }

    const storage = global.NovaprintStorage;
    storage.saveSupplier({ id: id || undefined, name, contact, category, phone, email, address, notes });
    document.getElementById('dialog-supplier').close();
    showToast(`Proveedor "${name}" guardado correctamente.`, 'success');
    global.NovaprintMain.refrescarDatos();
  }

  function confirmarEliminarProveedor(supplierId) {
    const storage = global.NovaprintStorage;
    const p = storage.getSupplierById(supplierId);
    if (confirm(`¿Eliminar al proveedor "${p ? p.name : supplierId}"?`)) {
      storage.deleteSupplier(supplierId);
      showToast('Proveedor eliminado.', 'info');
      global.NovaprintMain.refrescarDatos();
    }
  }

  // --- GESTIÓN DE INVENTARIOS (SPEC 002) ---
  function renderInventoryMetrics(inventario = []) {
    const prod = global.NovaprintProduction;
    const sales = global.NovaprintSales;
    if (!prod || !sales) return;

    const val = prod.calcularValorizacionInventario(inventario);
    let criticosCount = 0;
    inventario.forEach(it => {
      if (prod.evaluarEstadoStock(it.currentStock, it.minStock) === 'critico') {
        criticosCount++;
      }
    });

    const elTotalItems = document.getElementById('metric-inv-total-items');
    const elTotalUnidades = document.getElementById('metric-inv-total-units');
    const elCriticos = document.getElementById('metric-inv-critical');
    const elValorTotal = document.getElementById('metric-inv-total-value');

    if (elTotalItems) elTotalItems.textContent = inventario.length;
    if (elTotalUnidades) elTotalUnidades.textContent = `${val.totalUnidades} un.`;
    if (elCriticos) elCriticos.textContent = criticosCount;
    if (elValorTotal) elValorTotal.textContent = sales.formatearMoneda(val.totalMonetario);
  }

  function renderInventoryTable(inventario = []) {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    const prod = global.NovaprintProduction;
    const sales = global.NovaprintSales;

    if (inventario.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-gray-400 text-sm">
            No se encontraron insumos o prendas registrados en el inventario.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = inventario.map(it => {
      const estado = prod.evaluarEstadoStock(it.currentStock, it.minStock);
      const isCritico = estado === 'critico';
      const costoU = sales.formatearMoneda(it.unitCost || 0);
      const valorTotal = sales.formatearMoneda((it.currentStock || 0) * (it.unitCost || 0));

      return `
        <tr class="border-b border-gray-100 hover:bg-slate-50 text-xs">
          <td class="py-3 px-3 font-mono font-bold text-gray-600">${it.code || it.id}</td>
          <td class="py-3 px-3">
            <div class="font-bold text-gray-900">${it.name}</div>
            <div class="text-[11px] text-gray-400">${it.category} ${it.size ? `• Talla: ${it.size}` : ''} ${it.color ? `• Color: ${it.color}` : ''}</div>
          </td>
          <td class="py-3 px-3">
            <button type="button"
              class="group flex items-center gap-1.5 hover:bg-blue-50 px-1.5 py-0.5 -mx-1.5 rounded transition text-left cursor-pointer"
              title="Modificar stock actual de ${it.name}"
              onclick="NovaprintUI.abrirModalModificarStock('${it.id}')">
              <span class="text-sm font-black ${isCritico ? 'text-red-600' : 'text-gray-900'} group-hover:text-blue-700">${it.currentStock || 0}</span>
              <span class="text-[11px] text-gray-400 group-hover:text-blue-500">${it.unit || 'un.'}</span>
              <span class="text-[10px] text-blue-600 opacity-60 group-hover:opacity-100 font-bold transition">✏️</span>
            </button>
            <div class="text-[10px] text-gray-400">Mínimo: ${it.minStock || 0}</div>
          </td>
          <td class="py-3 px-3">
            ${isCritico ? `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                🚨 Stock Bajo
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✅ Normal
              </span>
            `}
          </td>
          <td class="py-3 px-3 text-gray-700 font-medium">${costoU}</td>
          <td class="py-3 px-3 font-bold text-gray-900">${valorTotal}</td>
          <td class="py-3 px-3 text-right space-x-1 whitespace-nowrap">
            <button class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded" title="Modificar Stock" onclick="NovaprintUI.abrirModalModificarStock('${it.id}')">📦</button>
            <button class="p-1 text-gray-500 hover:text-gray-800 rounded" title="Editar Artículo" onclick="NovaprintUI.editarItemInventario('${it.id}')">✏️</button>
            <button class="p-1 text-red-500 hover:text-red-700 rounded" title="Eliminar Artículo" onclick="NovaprintUI.confirmarEliminarItemInventario('${it.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function abrirModalNuevoItemInventario() {
    document.getElementById('form-inventory').reset();
    document.getElementById('inventory-id-hidden').value = '';
    document.getElementById('inventory-modal-title').textContent = 'Registrar Artículo en Inventario';

    // Poblar selector de colores con la paleta textil
    const colorSelect = document.getElementById('inventory-color-select');
    if (colorSelect) {
      colorSelect.innerHTML = generarOpcionesColor('Negro');
      colorSelect.value = 'Negro';
    }

    // Poblar selector de proveedores
    const storage = global.NovaprintStorage;
    const proveedores = storage ? storage.getSuppliers() : [];
    const selectProv = document.getElementById('inventory-supplier-select');
    if (selectProv) {
      selectProv.innerHTML = '<option value="">-- Sin Proveedor Asignado --</option>' +
        proveedores.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name} (${p.category})</option>`).join('');
    }

    document.getElementById('dialog-inventory').showModal();
  }

  function editarItemInventario(itemId) {
    const storage = global.NovaprintStorage;
    const it = storage.getInventoryItemById(itemId);
    if (!it) return;

    abrirModalNuevoItemInventario();
    document.getElementById('inventory-id-hidden').value = it.id;
    document.getElementById('inventory-code-input').value = it.code || '';
    document.getElementById('inventory-name-input').value = it.name || '';
    document.getElementById('inventory-category-select').value = it.category || 'Prendas Lisas';
    document.getElementById('inventory-garment-select').value = it.garmentType || 'Polera';

    // Preseleccionar color textil
    const colorSelect = document.getElementById('inventory-color-select');
    if (colorSelect) {
      colorSelect.innerHTML = generarOpcionesColor(it.color || 'Negro');
      colorSelect.value = it.color || 'Negro';
    }

    document.getElementById('inventory-size-input').value = it.size || '';
    document.getElementById('inventory-unit-input').value = it.unit || 'unidad';
    document.getElementById('inventory-stock-input').value = it.currentStock || 0;
    document.getElementById('inventory-minstock-input').value = it.minStock || 5;
    document.getElementById('inventory-cost-input').value = it.unitCost || 0;
    document.getElementById('inventory-supplier-select').value = it.supplierId || '';

    document.getElementById('inventory-modal-title').textContent = `Editar: ${it.name}`;
    document.getElementById('dialog-inventory').showModal();
  }

  function guardarItemInventarioDesdeFormulario() {
    const id = document.getElementById('inventory-id-hidden').value;
    const code = document.getElementById('inventory-code-input').value.trim();
    const name = document.getElementById('inventory-name-input').value.trim();
    const category = document.getElementById('inventory-category-select').value;
    const garmentType = document.getElementById('inventory-garment-select').value;
    const colorSelect = document.getElementById('inventory-color-select');
    const color = colorSelect ? colorSelect.value.trim() : 'Negro';
    const size = document.getElementById('inventory-size-input').value.trim();
    const unit = document.getElementById('inventory-unit-input').value.trim() || 'unidad';
    const currentStock = Number(document.getElementById('inventory-stock-input').value) || 0;
    const minStock = Number(document.getElementById('inventory-minstock-input').value) || 0;
    const unitCost = Number(document.getElementById('inventory-cost-input').value) || 0;

    const selectProv = document.getElementById('inventory-supplier-select');
    const supplierId = selectProv ? selectProv.value : null;
    const selectedOption = selectProv && selectProv.selectedIndex >= 0 ? selectProv.options[selectProv.selectedIndex] : null;
    const supplierName = selectedOption ? selectedOption.getAttribute('data-name') : '';

    if (!name) {
      showToast('El nombre del artículo es obligatorio.', 'warning');
      return;
    }

    const storage = global.NovaprintStorage;
    storage.saveInventoryItem({
      id: id || undefined,
      code,
      name,
      category,
      garmentType,
      color,
      size,
      unit,
      currentStock,
      minStock,
      unitCost,
      supplierId,
      supplierName
    });

    document.getElementById('dialog-inventory').close();
    showToast(`Artículo "${name}" guardado en inventario.`, 'success');
    global.NovaprintMain.refrescarDatos();
  }

  function confirmarEliminarItemInventario(itemId) {
    const storage = global.NovaprintStorage;
    const it = storage.getInventoryItemById(itemId);
    if (confirm(`¿Eliminar el artículo "${it ? it.name : itemId}" del inventario?`)) {
      storage.deleteInventoryItem(itemId);
      showToast('Artículo eliminado del inventario.', 'info');
      global.NovaprintMain.refrescarDatos();
    }
  }

  // --- MODIFICACIÓN RÁPIDA DE STOCK (SPEC 017) ---
  let currentStockEditingItem = null;

  function abrirModalModificarStock(itemId) {
    if (typeof document === 'undefined') return;
    const dialog = document.getElementById('dialog-adjust-stock');
    if (!dialog) return;

    const storage = global.NovaprintStorage;
    const item = storage ? storage.getInventoryItemById(itemId) : null;
    if (!item) {
      showToast('Artículo de inventario no encontrado', 'error');
      return;
    }

    currentStockEditingItem = item;

    const idInput = document.getElementById('adjust-stock-item-id');
    const codeEl = document.getElementById('adjust-stock-code');
    const catEl = document.getElementById('adjust-stock-category');
    const nameEl = document.getElementById('adjust-stock-name');
    const specsEl = document.getElementById('adjust-stock-specs');
    const curStockEl = document.getElementById('adjust-stock-current');
    const unitLabelEl = document.getElementById('adjust-stock-unit-label');
    const minAlertEl = document.getElementById('adjust-stock-min-alert');
    const newInput = document.getElementById('adjust-stock-new-input');
    const reasonSelect = document.getElementById('adjust-stock-reason-select');
    const notesInput = document.getElementById('adjust-stock-notes-input');

    if (idInput) idInput.value = item.id;
    if (codeEl) codeEl.textContent = item.code || item.id;
    if (catEl) catEl.textContent = item.category || 'General';
    if (nameEl) nameEl.textContent = item.name;
    if (specsEl) {
      const specs = [
        item.garmentType,
        item.size ? `Talla: ${item.size}` : null,
        item.color ? `Color: ${item.color}` : null,
        `Unidad: ${item.unit || 'un.'}`
      ].filter(Boolean);
      specsEl.textContent = specs.join(' • ');
    }
    if (curStockEl) curStockEl.textContent = item.currentStock != null ? String(item.currentStock) : '0';
    if (unitLabelEl) unitLabelEl.textContent = item.unit || 'un.';
    if (minAlertEl) minAlertEl.textContent = `Mínimo sugerido: ${item.minStock || 0} ${item.unit || 'un.'}`;

    if (newInput) {
      newInput.value = item.currentStock != null ? String(item.currentStock) : '0';
    }
    if (reasonSelect) reasonSelect.value = 'Conteo físico / Cuadratura';
    if (notesInput) notesInput.value = '';

    recalcularDeltaStock();

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function recalcularDeltaStock() {
    if (typeof document === 'undefined') return;
    const item = currentStockEditingItem;
    const currentStock = item ? (Number(item.currentStock) || 0) : 0;
    const newInput = document.getElementById('adjust-stock-new-input');
    const deltaBadge = document.getElementById('adjust-stock-delta-badge');
    const deltaText = document.getElementById('adjust-stock-delta-text');

    if (!newInput || !deltaBadge) return;

    let nuevoValor = Number(newInput.value);
    if (isNaN(nuevoValor) || nuevoValor < 0) nuevoValor = 0;

    const delta = nuevoValor - currentStock;
    const signo = delta > 0 ? '+' : '';

    deltaBadge.textContent = `${signo}${delta}`;

    if (deltaText) {
      if (delta > 0) {
        deltaText.textContent = `Aumento de ${delta} unidades`;
        deltaText.className = 'text-[10px] text-emerald-600 font-bold mt-0.5';
      } else if (delta < 0) {
        deltaText.textContent = `Disminución de ${Math.abs(delta)} unidades`;
        deltaText.className = 'text-[10px] text-red-600 font-bold mt-0.5';
      } else {
        deltaText.textContent = 'Sin variación de existencias';
        deltaText.className = 'text-[10px] text-gray-500 font-medium mt-0.5';
      }
    }
  }

  function aplicarAjusteStockDelta(delta) {
    if (typeof document === 'undefined') return;
    const newInput = document.getElementById('adjust-stock-new-input');
    if (!newInput) return;

    if (delta === 'zero') {
      newInput.value = '0';
    } else {
      const actual = Number(newInput.value) || 0;
      const nuevo = Math.max(0, actual + Number(delta));
      newInput.value = String(nuevo);
    }

    recalcularDeltaStock();
  }

  function guardarModificacionStock() {
    if (typeof document === 'undefined') return;
    const dialog = document.getElementById('dialog-adjust-stock');
    const idInput = document.getElementById('adjust-stock-item-id');
    const newInput = document.getElementById('adjust-stock-new-input');
    const reasonSelect = document.getElementById('adjust-stock-reason-select');
    const notesInput = document.getElementById('adjust-stock-notes-input');

    const itemId = idInput ? idInput.value : null;
    if (!itemId) {
      showToast('Error: No se identificó el artículo a modificar', 'error');
      return;
    }

    let nuevoStock = Number(newInput ? newInput.value : 0);
    if (isNaN(nuevoStock) || nuevoStock < 0) {
      nuevoStock = 0;
    }

    const reason = reasonSelect ? reasonSelect.value : 'Ajuste manual';
    const notes = notesInput ? notesInput.value.trim() : '';

    const storage = global.NovaprintStorage;
    if (!storage || typeof storage.updateInventoryStock !== 'function') {
      showToast('Error interno: storage no disponible', 'error');
      return;
    }

    const updated = storage.updateInventoryStock(itemId, nuevoStock, { reason, notes });
    if (!updated) {
      showToast('No se pudo actualizar el stock en inventario', 'error');
      return;
    }

    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    }

    showToast(`Stock de "${updated.name}" actualizado a ${updated.currentStock} ${updated.unit || 'un.'}`, 'success');

    if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    }
  }

  // Spec 031: Colocar Saldo 0 en el Stock Actual de Todos los Elementos del Inventario
  function confirmarPonerStockCero() {
    if (typeof document === 'undefined') return;
    const storage = global.NovaprintStorage;
    if (!storage || typeof storage.ponerStockCeroATodosLosItems !== 'function') {
      if (typeof showToast === 'function') showToast('Error: Servicio de almacenamiento no disponible', 'error');
      return;
    }

    const items = typeof storage.getInventory === 'function' ? storage.getInventory() : [];
    if (items.length === 0) {
      if (typeof showToast === 'function') showToast('No hay artículos registrados en el inventario', 'info');
      return;
    }

    const totalConStock = items.filter(i => (Number(i.currentStock) || 0) > 0).length;
    const mensaje = `¿Estás seguro de colocar el Stock Actual en 0 para TODOS los ${items.length} artículos del inventario?\n\n` +
      `• Se preservarán íntegros todos los códigos, nombres, categorías, proveedores y costos.\n` +
      `• Actualmente hay ${totalConStock} artículos con existencias > 0 que pasarán a saldo 0.\n\n` +
      `Esta acción reinicia el saldo físico de bodega a cero.`;

    const confirmado = typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(mensaje)
      : true;

    if (!confirmado) return;

    const res = storage.ponerStockCeroATodosLosItems({
      reason: 'Reinicio general de inventario a saldo 0 (Spec 031)',
      notes: 'Ejecutado por el usuario desde la vista de inventarios'
    });

    if (res && res.success) {
      if (typeof showToast === 'function') {
        showToast(`Se colocó el stock en 0 para los ${res.totalItemsAjustados} artículos del inventario`, 'success');
      }
      if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
        global.NovaprintMain.refrescarDatos();
      }
    } else {
      if (typeof showToast === 'function') showToast('Ocurrió un error al reiniciar el stock', 'error');
    }
  }

  // --- GESTIÓN DE COMPRAS DE INSUMOS (SPEC 002) ---
  let currentPurchaseItems = [];

  function renderPurchasesTable(compras = []) {
    const tableBody = document.getElementById('purchases-table-body');
    if (!tableBody) return;

    const storage = global.NovaprintStorage;
    const sales = global.NovaprintSales;

    if (compras.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-gray-400 text-sm">
            No hay compras registradas en el historial.
          </td>
        </tr>
      `;
      return;
    }

    const prod = global.NovaprintProduction;
    const inventario = storage && typeof storage.getInventory === 'function' ? storage.getInventory() : [];

    tableBody.innerHTML = compras.map(c => {
      const totalStr = sales ? sales.formatearMoneda(c.totalAmount || 0) : `$${c.totalAmount}`;
      const itemsStr = (c.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
      const esMixta = prod && typeof prod.esCompraMixta === 'function' ? prod.esCompraMixta(c.items || [], inventario) : false;

      return `
        <tr class="border-b border-gray-100 hover:bg-slate-50 text-xs">
          <td class="py-3 px-3 font-mono font-bold text-emerald-700">${c.id}</td>
          <td class="py-3 px-3 font-semibold text-gray-800">${c.supplierName}</td>
          <td class="py-3 px-3 text-gray-600">${c.invoiceNumber || 'S/N'}</td>
          <td class="py-3 px-3 text-gray-500">${c.date}</td>
          <td class="py-3 px-3 text-gray-600 max-w-xs truncate" title="${itemsStr}">${itemsStr || 'Sin ítems'}</td>
          <td class="py-3 px-3 font-bold text-gray-900">${totalStr}</td>
          <td class="py-3 px-3 text-right space-x-1 whitespace-nowrap">
            ${esMixta ? `<button type="button" class="p-1 text-amber-600 hover:text-amber-800 rounded font-bold cursor-pointer" title="Separar en 2 Facturas (Poleras y DTF)" onclick="NovaprintUI.abrirModalSepararCompra('${c.id}')">✂️</button>` : ''}
            <button type="button" class="p-1 text-gray-500 hover:text-gray-800 rounded cursor-pointer" title="Editar Compra" onclick="NovaprintUI.editarCompra('${c.id}')">✏️</button>
            <button type="button" class="p-1 text-red-500 hover:text-red-700 rounded cursor-pointer" title="Eliminar Compra" onclick="NovaprintUI.confirmarEliminarCompra('${c.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function abrirModalNuevaCompra() {
    currentPurchaseItems = [];
    const form = document.getElementById('form-purchase');
    if (form) form.reset();

    const hiddenId = document.getElementById('purchase-id-hidden');
    if (hiddenId) hiddenId.value = '';

    const modalTitle = document.getElementById('purchase-modal-title');
    if (modalTitle) modalTitle.textContent = 'Registrar Compra de Insumos';
    const modalSub = document.getElementById('purchase-modal-subtitle');
    if (modalSub) modalSub.textContent = 'El stock de los ítems seleccionados se incrementará automáticamente';
    const submitBtn = document.getElementById('btn-submit-purchase');
    if (submitBtn) submitBtn.textContent = '📥 Ingresar Compra al Stock';

    const hoy = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('purchase-date-input');
    if (dateInput) dateInput.value = hoy;

    // Resetear IVA y Delivery para compras
    const checkIva = document.getElementById('purchase-apply-iva');
    if (checkIva) checkIva.checked = false;
    const checkDeliv = document.getElementById('purchase-apply-delivery');
    if (checkDeliv) checkDeliv.checked = false;
    const inputDeliv = document.getElementById('purchase-delivery-input');
    if (inputDeliv) inputDeliv.value = 0;
    const contDeliv = document.getElementById('purchase-delivery-input-container');
    if (contDeliv) contDeliv.classList.add('hidden');

    const splitBanner = document.getElementById('purchase-split-banner');
    if (splitBanner) splitBanner.classList.add('hidden');

    // Poblar selector de proveedores
    const storage = global.NovaprintStorage;
    const proveedores = storage ? storage.getSuppliers() : [];
    const selectProv = document.getElementById('purchase-supplier-select');
    if (selectProv) {
      selectProv.innerHTML = '<option value="">-- Seleccionar Proveedor --</option>' +
        proveedores.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name} (${p.category})</option>`).join('');
    }

    agregarFilaItemCompra();
    recalcularTotalesCompraFormulario();

    const dlg = document.getElementById('dialog-purchase');
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
  }

  function editarCompra(purchaseId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const compra = storage.getPurchaseById(purchaseId);
    if (!compra) {
      showToast('No se encontró la compra seleccionada.', 'error');
      return;
    }

    const form = document.getElementById('form-purchase');
    if (form) form.reset();

    const hiddenId = document.getElementById('purchase-id-hidden');
    if (hiddenId) hiddenId.value = compra.id;

    const modalTitle = document.getElementById('purchase-modal-title');
    if (modalTitle) modalTitle.textContent = `Editar Compra (${compra.id})`;
    const modalSub = document.getElementById('purchase-modal-subtitle');
    if (modalSub) modalSub.textContent = 'Modifica los datos de la compra. Las existencias en inventario se actualizarán automáticamente.';
    const submitBtn = document.getElementById('btn-submit-purchase');
    if (submitBtn) submitBtn.textContent = '💾 Guardar Cambios de Compra';

    // Poblar selector de proveedores
    const proveedores = storage.getSuppliers();
    const selectProv = document.getElementById('purchase-supplier-select');
    if (selectProv) {
      selectProv.innerHTML = '<option value="">-- Seleccionar Proveedor --</option>' +
        proveedores.map(p => `<option value="${p.id}" data-name="${p.name}" ${p.id === compra.supplierId ? 'selected' : ''}>${p.name} (${p.category})</option>`).join('');
      selectProv.value = compra.supplierId || '';
    }

    const dateInput = document.getElementById('purchase-date-input');
    if (dateInput) dateInput.value = compra.date || new Date().toISOString().split('T')[0];

    const invoiceInput = document.getElementById('purchase-invoice-input');
    if (invoiceInput) invoiceInput.value = compra.invoiceNumber || '';

    const notesInput = document.getElementById('purchase-notes-input');
    if (notesInput) notesInput.value = compra.notes || '';

    // IVA y Delivery
    const checkIva = document.getElementById('purchase-apply-iva');
    if (checkIva) checkIva.checked = Boolean(compra.applyIva);

    const checkDeliv = document.getElementById('purchase-apply-delivery');
    if (checkDeliv) checkDeliv.checked = Boolean(compra.applyDelivery);

    const inputDeliv = document.getElementById('purchase-delivery-input');
    if (inputDeliv) inputDeliv.value = compra.deliveryAmount || 0;

    const contDeliv = document.getElementById('purchase-delivery-input-container');
    if (contDeliv) {
      if (compra.applyDelivery) contDeliv.classList.remove('hidden');
      else contDeliv.classList.add('hidden');
    }

    // Cargar ítems
    currentPurchaseItems = Array.isArray(compra.items) && compra.items.length > 0
      ? JSON.parse(JSON.stringify(compra.items)).map((it, idx) => ({
          id: it.id || `p-it-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          inventoryItemId: it.inventoryItemId || '',
          name: it.name || '',
          quantity: Math.max(1, Number(it.quantity) || 1),
          unitCost: Math.max(0, Number(it.unitCost) || 0),
          subtotal: (Math.max(1, Number(it.quantity) || 1)) * (Math.max(0, Number(it.unitCost) || 0))
        }))
      : [];

    if (currentPurchaseItems.length === 0) {
      agregarFilaItemCompra();
    } else {
      renderTablaItemsCompraFormulario();
    }

    recalcularTotalesCompraFormulario();

    const dlg = document.getElementById('dialog-purchase');
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
  }

  function duplicarCompra(purchaseId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const compra = storage.getPurchaseById(purchaseId);
    if (!compra) {
      showToast('No se encontró la compra a duplicar.', 'error');
      return;
    }

    abrirModalNuevaCompra();

    const hiddenId = document.getElementById('purchase-id-hidden');
    if (hiddenId) hiddenId.value = '';

    const modalTitle = document.getElementById('purchase-modal-title');
    if (modalTitle) modalTitle.textContent = `Duplicar Compra (Copia de ${compra.id})`;
    const modalSub = document.getElementById('purchase-modal-subtitle');
    if (modalSub) modalSub.textContent = 'Nueva compra generada a partir de los datos existentes. Revisa y guarda.';
    const submitBtn = document.getElementById('btn-submit-purchase');
    if (submitBtn) submitBtn.textContent = '💾 Guardar Nueva Compra';

    // Proveedor
    const selectProv = document.getElementById('purchase-supplier-select');
    if (selectProv) {
      selectProv.value = compra.supplierId || '';
    }

    const dateInput = document.getElementById('purchase-date-input');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const invoiceInput = document.getElementById('purchase-invoice-input');
    if (invoiceInput) invoiceInput.value = compra.invoiceNumber ? `${compra.invoiceNumber}-COPIA` : '';

    const notesInput = document.getElementById('purchase-notes-input');
    if (notesInput) {
      const origNotes = compra.notes ? `${compra.notes} ` : '';
      notesInput.value = `${origNotes}[Copia de compra ${compra.id}]`.trim();
    }

    // IVA y Delivery
    const checkIva = document.getElementById('purchase-apply-iva');
    if (checkIva) checkIva.checked = Boolean(compra.applyIva);

    const checkDeliv = document.getElementById('purchase-apply-delivery');
    if (checkDeliv) checkDeliv.checked = Boolean(compra.applyDelivery);

    const inputDeliv = document.getElementById('purchase-delivery-input');
    if (inputDeliv) inputDeliv.value = compra.deliveryAmount || 0;

    const contDeliv = document.getElementById('purchase-delivery-input-container');
    if (contDeliv) {
      if (compra.applyDelivery) contDeliv.classList.remove('hidden');
      else contDeliv.classList.add('hidden');
    }

    // Cargar ítems clonados
    currentPurchaseItems = Array.isArray(compra.items) && compra.items.length > 0
      ? JSON.parse(JSON.stringify(compra.items)).map((it, idx) => ({
          id: `p-it-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          inventoryItemId: it.inventoryItemId || '',
          name: it.name || '',
          quantity: Math.max(1, Number(it.quantity) || 1),
          unitCost: Math.max(0, Number(it.unitCost) || 0),
          subtotal: (Math.max(1, Number(it.quantity) || 1)) * (Math.max(0, Number(it.unitCost) || 0))
        }))
      : [];

    if (currentPurchaseItems.length === 0) {
      agregarFilaItemCompra();
    } else {
      renderTablaItemsCompraFormulario();
    }

    recalcularTotalesCompraFormulario();

    showToast(`Compra ${compra.id} clonada. Revisa y haz clic en "Guardar Nueva Compra".`, 'info');
  }

  function confirmarEliminarCompra(purchaseId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const compra = storage.getPurchaseById(purchaseId);
    const invoiceTxt = compra && compra.invoiceNumber ? ` (Doc: ${compra.invoiceNumber})` : '';
    if (confirm(`¿Eliminar la compra ${purchaseId}${invoiceTxt}?\nLas existencias ingresadas al inventario se revertirán automáticamente.`)) {
      const deleted = storage.deletePurchase(purchaseId);
      if (deleted) {
        showToast(`Compra ${purchaseId} eliminada y stock revertido.`, 'info');
        if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
          global.NovaprintMain.refrescarDatos();
        }
      } else {
        showToast('No se pudo eliminar la compra.', 'error');
      }
    }
  }

  function abrirModalCompraConFaltantes(itemsFaltantes = null) {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const inventario = storage ? storage.getInventory() : [];

    if (!itemsFaltantes) {
      const balance = prod ? prod.calcularFaltantesPedido(inventario, currentOrderItems, { incluirEstampados: true }) : null;
      itemsFaltantes = balance ? balance.faltantesParaCompra : [];
    }

    if (!itemsFaltantes || itemsFaltantes.length === 0) {
      showToast('No hay materiales faltantes registrados en el inventario para comprar.', 'info');
      return;
    }

    // Spec 008 & Spec 020: Asegurar que todos los faltantes (prendas y estampados) existan en inventario con ID
    itemsFaltantes = itemsFaltantes.map(f => {
      if (!f.inventoryId && storage) {
        if (f.isEstampado && typeof storage.asegurarItemInventarioEstampado === 'function') {
          const itemEstampado = storage.asegurarItemInventarioEstampado(f.technique, f.printLocation, { unitCost: f.unitCost });
          return {
            ...f,
            inventoryId: itemEstampado.id,
            code: itemEstampado.code,
            name: itemEstampado.name,
            supplierId: f.supplierId || itemEstampado.supplierId || '',
            supplierName: f.supplierName || itemEstampado.supplierName || '',
            unitCost: Number(itemEstampado.unitCost) || f.unitCost
          };
        } else if (typeof storage.asegurarItemInventarioPrenda === 'function') {
          const itemCreado = storage.asegurarItemInventarioPrenda(f.garmentType, f.color, f.size, { unitCost: f.unitCost });
          return {
            ...f,
            inventoryId: itemCreado.id,
            code: itemCreado.code,
            name: itemCreado.name,
            supplierId: f.supplierId || itemCreado.supplierId || '',
            supplierName: f.supplierName || itemCreado.supplierName || '',
            unitCost: Number(itemCreado.unitCost) || f.unitCost
          };
        }
      }
      return f;
    });

    const dialogOrder = document.getElementById('dialog-order');
    if (dialogOrder && typeof dialogOrder.close === 'function') {
      dialogOrder.close();
    }

    document.getElementById('form-purchase').reset();
    const hiddenId = document.getElementById('purchase-id-hidden');
    if (hiddenId) hiddenId.value = '';

    const modalTitle = document.getElementById('purchase-modal-title');
    if (modalTitle) modalTitle.textContent = 'Registrar Compra de Insumos';
    const modalSub = document.getElementById('purchase-modal-subtitle');
    if (modalSub) modalSub.textContent = 'El stock de los ítems seleccionados se incrementará automáticamente';
    const submitBtn = document.getElementById('btn-submit-purchase');
    if (submitBtn) submitBtn.textContent = '📥 Ingresar Compra al Stock';

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('purchase-date-input').value = hoy;

    // Resetear IVA y Delivery para compras
    const checkIva = document.getElementById('purchase-apply-iva');
    if (checkIva) checkIva.checked = false;
    const checkDeliv = document.getElementById('purchase-apply-delivery');
    if (checkDeliv) checkDeliv.checked = false;
    const inputDeliv = document.getElementById('purchase-delivery-input');
    if (inputDeliv) inputDeliv.value = 0;
    const contDeliv = document.getElementById('purchase-delivery-input-container');
    if (contDeliv) contDeliv.classList.add('hidden');

    const proveedores = storage ? storage.getSuppliers() : [];
    const selectProv = document.getElementById('purchase-supplier-select');
    if (selectProv) {
      selectProv.innerHTML = '<option value="">-- Seleccionar Proveedor --</option>' +
        proveedores.map(p => `<option value="${p.id}" data-name="${p.name}">${p.name} (${p.category})</option>`).join('');

      if (itemsFaltantes[0] && itemsFaltantes[0].supplierId) {
        selectProv.value = itemsFaltantes[0].supplierId;
      }
    }

    currentPurchaseItems = itemsFaltantes.map(f => ({
      id: `p-it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      inventoryItemId: f.inventoryId,
      name: f.name,
      quantity: f.quantityNeeded,
      unitCost: f.unitCost,
      subtotal: f.quantityNeeded * f.unitCost
    }));

    const notesInput = document.getElementById('purchase-notes-input');
    if (notesInput) {
      notesInput.value = 'Compra automática generada por faltantes de pedido de estampado.';
    }

    renderTablaItemsCompraFormulario();
    recalcularTotalesCompraFormulario();

    document.getElementById('dialog-purchase').showModal();
    showToast(`Se han cargado ${currentPurchaseItems.length} materiales faltantes en la orden de compra.`, 'success');
  }

  function comprarFaltantesDePedido(orderId) {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const pedido = storage ? storage.getOrderById(orderId) : null;
    if (!pedido) return;

    const balance = prod ? prod.calcularFaltantesPedido(storage.getInventory(), pedido.items || [], { incluirEstampados: true }) : null;
    if (balance && balance.tieneFaltantes) {
      abrirModalCompraConFaltantes(balance.faltantesParaCompra);
    } else {
      showToast('Este pedido tiene todo su material disponible en bodega.', 'success');
    }
  }

  function agregarFilaItemCompra() {
    const storage = global.NovaprintStorage;
    const inventario = storage ? storage.getInventory() : [];

    const nuevoItem = {
      id: `p-it-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      inventoryItemId: inventario.length > 0 ? inventario[0].id : '',
      name: inventario.length > 0 ? inventario[0].name : '',
      quantity: 10,
      unitCost: inventario.length > 0 ? inventario[0].unitCost : 3000,
      subtotal: (inventario.length > 0 ? inventario[0].unitCost : 3000) * 10
    };

    currentPurchaseItems.push(nuevoItem);
    renderTablaItemsCompraFormulario();
    recalcularTotalesCompraFormulario();
  }

  function eliminarFilaItemCompra(itemId) {
    currentPurchaseItems = currentPurchaseItems.filter(i => i.id !== itemId);
    if (currentPurchaseItems.length === 0) {
      agregarFilaItemCompra();
    } else {
      renderTablaItemsCompraFormulario();
      recalcularTotalesCompraFormulario();
    }
  }

  function renderTablaItemsCompraFormulario() {
    const tbody = document.getElementById('purchase-items-tbody');
    if (!tbody) return;

    const storage = global.NovaprintStorage;
    const inventario = storage ? storage.getInventory() : [];

    tbody.innerHTML = currentPurchaseItems.map(it => {
      let optionsHtml = inventario.map(inv => `
        <option value="${inv.id}" data-name="${inv.name}" data-cost="${inv.unitCost}" ${inv.id === it.inventoryItemId ? 'selected' : ''}>
          ${inv.name} (Stock actual: ${inv.currentStock})
        </option>
      `).join('');

      if (it.inventoryItemId && !inventario.some(inv => inv.id === it.inventoryItemId)) {
        optionsHtml = `<option value="${it.inventoryItemId}" data-name="${it.name || 'Artículo'}" data-cost="${it.unitCost || 0}" selected>${it.name || 'Artículo'} (Histórico)</option>` + optionsHtml;
      }

      return `
        <tr class="border-b border-gray-200 text-xs">
          <td class="py-2 pr-2">
            <select class="w-full p-1.5 border border-gray-300 rounded text-xs font-semibold" onchange="NovaprintUI.actualizarItemCompraSelect('${it.id}', this)">
              ${optionsHtml}
            </select>
          </td>
          <td class="py-2 px-1">
            <input type="number" min="1" value="${it.quantity}" class="w-20 p-1.5 border border-gray-300 rounded text-center font-bold" oninput="NovaprintUI.actualizarItemCompraVal('${it.id}', 'quantity', this.value)">
          </td>
          <td class="py-2 px-1">
            <input type="number" min="0" step="any" value="${it.unitCost}" class="w-24 p-1.5 border border-gray-300 rounded text-right font-medium" oninput="NovaprintUI.actualizarItemCompraVal('${it.id}', 'unitCost', this.value)">
          </td>
          <td class="py-2 px-1 text-right font-bold text-gray-900 purchase-subtotal-cell">
            $${it.quantity * it.unitCost}
          </td>
          <td class="py-2 pl-1 text-center">
            <button type="button" class="text-red-500 hover:text-red-700 p-1 font-bold" onclick="NovaprintUI.eliminarFilaItemCompra('${it.id}')">✕</button>
          </td>
        </tr>
      `;
    }).join('');

    const prod = global.NovaprintProduction;
    const splitBanner = document.getElementById('purchase-split-banner');
    if (splitBanner) {
      const esMixta = prod && typeof prod.esCompraMixta === 'function' ? prod.esCompraMixta(currentPurchaseItems, inventario) : false;
      if (esMixta) {
        splitBanner.classList.remove('hidden');
      } else {
        splitBanner.classList.add('hidden');
      }
    }
  }

  function actualizarItemCompraSelect(rowId, selectEl) {
    const item = currentPurchaseItems.find(i => i.id === rowId);
    if (!item) return;

    const selectedOption = selectEl.options[selectEl.selectedIndex];
    item.inventoryItemId = selectEl.value;
    item.name = selectedOption.getAttribute('data-name');
    item.unitCost = Number(selectedOption.getAttribute('data-cost')) || 0;
    item.subtotal = item.quantity * item.unitCost;

    renderTablaItemsCompraFormulario();
    recalcularTotalesCompraFormulario();
  }

  function actualizarItemCompraVal(rowId, prop, val) {
    const item = currentPurchaseItems.find(i => i.id === rowId);
    if (!item) return;

    item[prop] = Math.max(0, Number(val) || 0);
    item.subtotal = item.quantity * item.unitCost;
    recalcularTotalesCompraFormulario();
  }

  function recalcularTotalesCompraFormulario() {
    const sales = global.NovaprintSales;
    const prod = global.NovaprintProduction;

    const checkIva = document.getElementById('purchase-apply-iva');
    const aplicarIva = checkIva ? checkIva.checked : false;
    const checkDeliv = document.getElementById('purchase-apply-delivery');
    const aplicarDeliv = checkDeliv ? checkDeliv.checked : false;
    const inputDeliv = document.getElementById('purchase-delivery-input');
    const montoDelivery = (aplicarDeliv && inputDeliv) ? Math.max(0, Number(inputDeliv.value) || 0) : 0;

    const totales = prod ? prod.calcularTotalesCompra(currentPurchaseItems, {
      aplicarIva,
      montoDelivery
    }) : {
      totalUnidades: 0,
      subtotalNeto: 0,
      applyIva: false,
      ivaPercent: 0,
      ivaAmount: 0,
      applyDelivery: false,
      deliveryAmount: 0,
      totalAmount: 0
    };

    const subtotalEl = document.getElementById('purchase-form-subtotal');
    if (subtotalEl) {
      subtotalEl.textContent = sales ? sales.formatearMoneda(totales.subtotalNeto) : `$${totales.subtotalNeto}`;
    }

    const ivaRow = document.getElementById('purchase-form-iva-row');
    const ivaEl = document.getElementById('purchase-form-iva');
    if (ivaRow && ivaEl) {
      if (totales.applyIva) {
        ivaRow.classList.remove('hidden');
        ivaEl.textContent = `+${sales ? sales.formatearMoneda(totales.ivaAmount) : `$${totales.ivaAmount}`}`;
      } else {
        ivaRow.classList.add('hidden');
      }
    }

    const delivRow = document.getElementById('purchase-form-delivery-row');
    const delivEl = document.getElementById('purchase-form-delivery');
    if (delivRow && delivEl) {
      if (totales.applyDelivery) {
        delivRow.classList.remove('hidden');
        delivEl.textContent = `+${sales ? sales.formatearMoneda(totales.deliveryAmount) : `$${totales.deliveryAmount}`}`;
      } else {
        delivRow.classList.add('hidden');
      }
    }

    const elTotal = document.getElementById('purchase-form-total');
    if (elTotal) {
      elTotal.textContent = sales ? sales.formatearMoneda(totales.totalAmount) : `$${totales.totalAmount}`;
    }

    const celdas = document.querySelectorAll('.purchase-subtotal-cell');
    currentPurchaseItems.forEach((it, idx) => {
      if (celdas[idx]) {
        celdas[idx].textContent = sales ? sales.formatearMoneda(it.quantity * it.unitCost) : `$${it.quantity * it.unitCost}`;
      }
    });
  }

  function guardarCompraDesdeFormulario() {
    const selectProv = document.getElementById('purchase-supplier-select');
    const selectedOption = selectProv ? selectProv.options[selectProv.selectedIndex] : null;
    const supplierId = selectProv ? selectProv.value : null;
    const supplierName = selectedOption ? selectedOption.getAttribute('data-name') : 'Proveedor General';
    const invoiceNumber = document.getElementById('purchase-invoice-input').value.trim();
    const date = document.getElementById('purchase-date-input').value;
    const notes = document.getElementById('purchase-notes-input').value.trim();

    if (!supplierId) {
      showToast('Por favor selecciona un proveedor.', 'warning');
      return;
    }

    if (currentPurchaseItems.length === 0) {
      showToast('Debes añadir al menos un artículo a la compra.', 'warning');
      return;
    }

    const prod = global.NovaprintProduction;
    const checkIva = document.getElementById('purchase-apply-iva');
    const aplicarIva = checkIva ? checkIva.checked : false;
    const checkDeliv = document.getElementById('purchase-apply-delivery');
    const aplicarDeliv = checkDeliv ? checkDeliv.checked : false;
    const inputDeliv = document.getElementById('purchase-delivery-input');
    const montoDelivery = (aplicarDeliv && inputDeliv) ? Math.max(0, Number(inputDeliv.value) || 0) : 0;

    const itemsLímpios = currentPurchaseItems.map(it => {
      const q = Math.max(0, Number(it.quantity) || 0);
      const c = Math.max(0, Number(it.unitCost) || 0);
      const sub = q * c;
      return {
        inventoryItemId: it.inventoryItemId,
        name: it.name,
        quantity: q,
        unitCost: c,
        subtotal: sub
      };
    });

    const totalesCompra = prod ? prod.calcularTotalesCompra(itemsLímpios, {
      aplicarIva,
      montoDelivery
    }) : {
      subtotalNeto: 0,
      applyIva: false,
      ivaPercent: 0,
      ivaAmount: 0,
      applyDelivery: false,
      deliveryAmount: 0,
      totalAmount: 0
    };

    const hiddenId = document.getElementById('purchase-id-hidden');
    const existingId = hiddenId ? hiddenId.value.trim() : '';

    const storage = global.NovaprintStorage;
    const compraGuardada = storage.savePurchase({
      ...(existingId ? { id: existingId } : {}),
      supplierId,
      supplierName,
      invoiceNumber,
      date,
      items: itemsLímpios,
      subtotalNeto: totalesCompra.subtotalNeto,
      applyIva: totalesCompra.applyIva,
      ivaPercent: totalesCompra.ivaPercent,
      ivaAmount: totalesCompra.ivaAmount,
      applyDelivery: totalesCompra.applyDelivery,
      deliveryAmount: totalesCompra.deliveryAmount,
      totalAmount: totalesCompra.totalAmount,
      notes
    });

    const dlg = document.getElementById('dialog-purchase');
    if (dlg && typeof dlg.close === 'function') dlg.close();

    if (existingId) {
      showToast(`Compra ${compraGuardada.id} actualizada correctamente.`, 'success');
    } else {
      showToast(`Compra ${compraGuardada.id} registrada. ¡Stock de inventario incrementado!`, 'success');
    }
    if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    }
  }

  // ========================================================
  // SEPARACIÓN DE COMPRAS: POLERAS Y ESTAMPADOS DTF (SPEC 021)
  // ========================================================

  let currentSplitState = {
    originalPurchaseId: null,
    itemsPoleras: [],
    itemsDtf: [],
    baseNotes: ''
  };

  function abrirModalSepararCompra(purchaseId = null) {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const sales = global.NovaprintSales;
    if (!storage || !prod) return;

    const inventario = storage.getInventory();
    const proveedores = storage.getSuppliers();

    let itemsParaSeparar = [];
    let baseInvoice = '';
    let baseDate = new Date().toISOString().split('T')[0];
    let originalId = null;
    let baseNotes = '';
    let applyIvaBase = false;
    let applyDeliveryBase = false;
    let deliveryAmountBase = 0;

    if (purchaseId && typeof purchaseId === 'string') {
      const compra = storage.getPurchaseById(purchaseId);
      if (!compra) {
        showToast('No se encontró la compra a separar.', 'error');
        return;
      }
      originalId = compra.id;
      itemsParaSeparar = Array.isArray(compra.items) ? JSON.parse(JSON.stringify(compra.items)) : [];
      baseInvoice = compra.invoiceNumber || '';
      baseDate = compra.date || baseDate;
      baseNotes = compra.notes || '';
      applyIvaBase = Boolean(compra.applyIva);
      applyDeliveryBase = Boolean(compra.applyDelivery);
      deliveryAmountBase = Number(compra.deliveryAmount) || 0;
    } else {
      const hiddenId = document.getElementById('purchase-id-hidden');
      originalId = hiddenId && hiddenId.value ? hiddenId.value.trim() : null;
      itemsParaSeparar = JSON.parse(JSON.stringify(currentPurchaseItems));

      const invInput = document.getElementById('purchase-invoice-input');
      baseInvoice = invInput ? invInput.value.trim() : '';

      const dateInput = document.getElementById('purchase-date-input');
      baseDate = dateInput && dateInput.value ? dateInput.value : baseDate;

      const notesInput = document.getElementById('purchase-notes-input');
      baseNotes = notesInput ? notesInput.value.trim() : '';

      const checkIva = document.getElementById('purchase-apply-iva');
      applyIvaBase = checkIva ? checkIva.checked : false;

      const checkDeliv = document.getElementById('purchase-apply-delivery');
      applyDeliveryBase = checkDeliv ? checkDeliv.checked : false;

      const inputDeliv = document.getElementById('purchase-delivery-input');
      deliveryAmountBase = (applyDeliveryBase && inputDeliv) ? Math.max(0, Number(inputDeliv.value) || 0) : 0;
    }

    if (!prod.esCompraMixta(itemsParaSeparar, inventario)) {
      showToast('Esta compra no contiene una mezcla de Poleras y Estampados DTF para separar.', 'info');
      return;
    }

    const separacion = prod.separarItemsCompra(itemsParaSeparar, inventario);
    currentSplitState = {
      originalPurchaseId: originalId,
      itemsPoleras: separacion.itemsPoleras,
      itemsDtf: separacion.itemsDtf,
      baseNotes
    };

    // Proveedor sugerido para Poleras (Prendas Lisas)
    const provPoleras = prod.resolverProveedorParaCategoria('textil', proveedores);
    const selectPoleras = document.getElementById('split-supplier-poleras');
    if (selectPoleras) {
      selectPoleras.innerHTML = '<option value="">-- Seleccionar Proveedor Textil --</option>' +
        proveedores.map(p => `<option value="${p.id}" data-name="${p.name}" ${provPoleras && provPoleras.id === p.id ? 'selected' : ''}>${p.name} (${p.category})</option>`).join('');
      if (provPoleras) selectPoleras.value = provPoleras.id;
    }

    // Proveedor sugerido para Estampado DTF
    const provDtf = prod.resolverProveedorParaCategoria('dtf', proveedores);
    const selectDtf = document.getElementById('split-supplier-dtf');
    if (selectDtf) {
      selectDtf.innerHTML = '<option value="">-- Seleccionar Proveedor DTF --</option>' +
        proveedores.map(p => `<option value="${p.id}" data-name="${p.name}" ${provDtf && provDtf.id === p.id ? 'selected' : ''}>${p.name} (${p.category})</option>`).join('');
      if (provDtf) selectDtf.value = provDtf.id;
    }

    // Facturas sugeridas
    const inputInvPoleras = document.getElementById('split-invoice-poleras');
    if (inputInvPoleras) {
      inputInvPoleras.value = baseInvoice ? `${baseInvoice}-POL` : 'FAC-POL-001';
    }
    const inputInvDtf = document.getElementById('split-invoice-dtf');
    if (inputInvDtf) {
      inputInvDtf.value = baseInvoice ? `${baseInvoice}-DTF` : 'FAC-DTF-001';
    }

    // Fechas
    const inputDatePoleras = document.getElementById('split-date-poleras');
    if (inputDatePoleras) inputDatePoleras.value = baseDate;
    const inputDateDtf = document.getElementById('split-date-dtf');
    if (inputDateDtf) inputDateDtf.value = baseDate;

    // Badges de conteo
    const countPoleras = currentSplitState.itemsPoleras.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const countDtf = currentSplitState.itemsDtf.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const badgePoleras = document.getElementById('split-badge-count-poleras');
    if (badgePoleras) badgePoleras.textContent = `${countPoleras} prendas`;
    const badgeDtf = document.getElementById('split-badge-count-dtf');
    if (badgeDtf) badgeDtf.textContent = `${countDtf} estampados`;

    // Renderizar tablas de items (Spec 034: inputs editables para cantidad y costo unitario)
    const tbodyPoleras = document.getElementById('split-items-poleras-tbody');
    if (tbodyPoleras) {
      tbodyPoleras.innerHTML = currentSplitState.itemsPoleras.map((it, idx) => `
        <tr class="hover:bg-blue-50/50">
          <td class="py-2 px-2.5 font-medium text-gray-800">${it.name}</td>
          <td class="py-1 px-1 text-center">
            <input type="number" min="1" step="1" value="${it.quantity}" class="w-16 p-1 bg-white border border-gray-300 rounded text-center text-xs font-bold text-gray-900 focus:outline-none focus:border-blue-500" oninput="NovaprintUI.actualizarItemSplit('poleras', ${idx}, 'quantity', this.value)">
          </td>
          <td class="py-1 px-1 text-right">
            <input type="number" min="0" step="any" value="${it.unitCost}" class="w-20 p-1 bg-white border border-gray-300 rounded text-right text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500" oninput="NovaprintUI.actualizarItemSplit('poleras', ${idx}, 'unitCost', this.value)">
          </td>
          <td id="split-subtotal-poleras-${idx}" class="py-2 pr-2.5 text-right font-bold text-blue-900">${sales ? sales.formatearMoneda((it.quantity || 0) * (it.unitCost || 0)) : `$${(it.quantity || 0) * (it.unitCost || 0)}`}</td>
        </tr>
      `).join('');
    }

    const tbodyDtf = document.getElementById('split-items-dtf-tbody');
    if (tbodyDtf) {
      tbodyDtf.innerHTML = currentSplitState.itemsDtf.map((it, idx) => `
        <tr class="hover:bg-purple-50/50">
          <td class="py-2 px-2.5 font-medium text-gray-800">${it.name}</td>
          <td class="py-1 px-1 text-center">
            <input type="number" min="1" step="1" value="${it.quantity}" class="w-16 p-1 bg-white border border-gray-300 rounded text-center text-xs font-bold text-gray-900 focus:outline-none focus:border-purple-500" oninput="NovaprintUI.actualizarItemSplit('dtf', ${idx}, 'quantity', this.value)">
          </td>
          <td class="py-1 px-1 text-right">
            <input type="number" min="0" step="any" value="${it.unitCost}" class="w-20 p-1 bg-white border border-gray-300 rounded text-right text-xs font-medium text-gray-800 focus:outline-none focus:border-purple-500" oninput="NovaprintUI.actualizarItemSplit('dtf', ${idx}, 'unitCost', this.value)">
          </td>
          <td id="split-subtotal-dtf-${idx}" class="py-2 pr-2.5 text-right font-bold text-purple-900">${sales ? sales.formatearMoneda((it.quantity || 0) * (it.unitCost || 0)) : `$${(it.quantity || 0) * (it.unitCost || 0)}`}</td>
        </tr>
      `).join('');
    }

    // Configurar IVA y Delivery
    const checkIvaPoleras = document.getElementById('split-iva-poleras');
    if (checkIvaPoleras) checkIvaPoleras.checked = applyIvaBase;
    const checkIvaDtf = document.getElementById('split-iva-dtf');
    if (checkIvaDtf) checkIvaDtf.checked = applyIvaBase;

    const checkDelivPoleras = document.getElementById('split-delivery-check-poleras');
    const inputDelivPoleras = document.getElementById('split-delivery-poleras');
    const contDelivPoleras = document.getElementById('split-delivery-container-poleras');
    if (checkDelivPoleras) checkDelivPoleras.checked = applyDeliveryBase;
    if (inputDelivPoleras) inputDelivPoleras.value = deliveryAmountBase;
    if (contDelivPoleras) {
      if (applyDeliveryBase) contDelivPoleras.classList.remove('hidden');
      else contDelivPoleras.classList.add('hidden');
    }

    const checkDelivDtf = document.getElementById('split-delivery-check-dtf');
    const inputDelivDtf = document.getElementById('split-delivery-dtf');
    const contDelivDtf = document.getElementById('split-delivery-container-dtf');
    if (checkDelivDtf) checkDelivDtf.checked = false;
    if (inputDelivDtf) inputDelivDtf.value = 0;
    if (contDelivDtf) contDelivDtf.classList.add('hidden');

    recalcularTotalesSeparacion();

    const dlg = document.getElementById('dialog-split-purchase');
    if (dlg && typeof dlg.showModal === 'function') {
      dlg.showModal();
    }
  }

  function toggleSplitDeliveryPoleras() {
    const chk = document.getElementById('split-delivery-check-poleras');
    const cont = document.getElementById('split-delivery-container-poleras');
    if (chk && cont) {
      if (chk.checked) cont.classList.remove('hidden');
      else cont.classList.add('hidden');
    }
    recalcularTotalesSeparacion();
  }

  function toggleSplitDeliveryDtf() {
    const chk = document.getElementById('split-delivery-check-dtf');
    const cont = document.getElementById('split-delivery-container-dtf');
    if (chk && cont) {
      if (chk.checked) cont.classList.remove('hidden');
      else cont.classList.add('hidden');
    }
    recalcularTotalesSeparacion();
  }

  // Spec 034: Edición interactiva de cantidad y costo unitario al separar en 2 facturas
  function actualizarItemSplit(tipo, index, campo, valor) {
    if (!currentSplitState) return;
    const list = tipo === 'poleras' ? currentSplitState.itemsPoleras : currentSplitState.itemsDtf;
    if (!Array.isArray(list) || !list[index]) return;

    const it = list[index];
    const num = Number(valor);
    if (campo === 'quantity') {
      it.quantity = isNaN(num) || num < 0 ? 0 : Math.round(num);
    } else if (campo === 'unitCost') {
      it.unitCost = isNaN(num) || num < 0 ? 0 : num;
    }
    it.subtotal = (Number(it.quantity) || 0) * (Number(it.unitCost) || 0);

    // Actualizar celda de subtotal de la fila
    const sales = global.NovaprintSales;
    const cellSubtotal = document.getElementById(`split-subtotal-${tipo}-${index}`);
    if (cellSubtotal) {
      cellSubtotal.textContent = sales && typeof sales.formatearMoneda === 'function'
        ? sales.formatearMoneda(it.subtotal)
        : `$${it.subtotal}`;
    }

    // Actualizar badges de conteo
    const countPoleras = currentSplitState.itemsPoleras.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    const countDtf = currentSplitState.itemsDtf.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
    const badgePoleras = document.getElementById('split-badge-count-poleras');
    if (badgePoleras) badgePoleras.textContent = `${countPoleras} prendas`;
    const badgeDtf = document.getElementById('split-badge-count-dtf');
    if (badgeDtf) badgeDtf.textContent = `${countDtf} estampados`;

    // Recalcular subtotales netos, IVA, delivery y gran total
    recalcularTotalesSeparacion();
  }

  function recalcularTotalesSeparacion() {
    const prod = global.NovaprintProduction;
    const sales = global.NovaprintSales;

    // Factura 1 (Poleras)
    const chkIvaPoleras = document.getElementById('split-iva-poleras');
    const aplicarIvaPoleras = chkIvaPoleras ? chkIvaPoleras.checked : false;
    const chkDelivPoleras = document.getElementById('split-delivery-check-poleras');
    const aplicarDelivPoleras = chkDelivPoleras ? chkDelivPoleras.checked : false;
    const inputDelivPoleras = document.getElementById('split-delivery-poleras');
    const montoDelivPoleras = (aplicarDelivPoleras && inputDelivPoleras) ? Math.max(0, Number(inputDelivPoleras.value) || 0) : 0;

    const totalesPoleras = prod ? prod.calcularTotalesCompra(currentSplitState.itemsPoleras, {
      aplicarIva: aplicarIvaPoleras,
      montoDelivery: montoDelivPoleras
    }) : { totalAmount: 0 };

    const elTotalPoleras = document.getElementById('split-total-poleras');
    if (elTotalPoleras) {
      elTotalPoleras.textContent = sales ? sales.formatearMoneda(totalesPoleras.totalAmount) : `$${totalesPoleras.totalAmount}`;
    }

    // Factura 2 (DTF)
    const chkIvaDtf = document.getElementById('split-iva-dtf');
    const aplicarIvaDtf = chkIvaDtf ? chkIvaDtf.checked : false;
    const chkDelivDtf = document.getElementById('split-delivery-check-dtf');
    const aplicarDelivDtf = chkDelivDtf ? chkDelivDtf.checked : false;
    const inputDelivDtf = document.getElementById('split-delivery-dtf');
    const montoDelivDtf = (aplicarDelivDtf && inputDelivDtf) ? Math.max(0, Number(inputDelivDtf.value) || 0) : 0;

    const totalesDtf = prod ? prod.calcularTotalesCompra(currentSplitState.itemsDtf, {
      aplicarIva: aplicarIvaDtf,
      montoDelivery: montoDelivDtf
    }) : { totalAmount: 0 };

    const elTotalDtf = document.getElementById('split-total-dtf');
    if (elTotalDtf) {
      elTotalDtf.textContent = sales ? sales.formatearMoneda(totalesDtf.totalAmount) : `$${totalesDtf.totalAmount}`;
    }

    // Gran Total
    const granTotal = (totalesPoleras.totalAmount || 0) + (totalesDtf.totalAmount || 0);
    const elGrandTotal = document.getElementById('split-grand-total');
    if (elGrandTotal) {
      elGrandTotal.textContent = sales ? sales.formatearMoneda(granTotal) : `$${granTotal}`;
    }
  }

  function confirmarSeparacionCompra() {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    if (!storage || !prod) return;

    const selectProvPoleras = document.getElementById('split-supplier-poleras');
    const supplierIdPoleras = selectProvPoleras ? selectProvPoleras.value : '';
    const supplierNamePoleras = selectProvPoleras && selectProvPoleras.selectedIndex >= 0
      ? selectProvPoleras.options[selectProvPoleras.selectedIndex].getAttribute('data-name') || 'Proveedor Textil'
      : 'Proveedor Textil';

    const selectProvDtf = document.getElementById('split-supplier-dtf');
    const supplierIdDtf = selectProvDtf ? selectProvDtf.value : '';
    const supplierNameDtf = selectProvDtf && selectProvDtf.selectedIndex >= 0
      ? selectProvDtf.options[selectProvDtf.selectedIndex].getAttribute('data-name') || 'Proveedor DTF'
      : 'Proveedor DTF';

    if (!supplierIdPoleras) {
      showToast('Por favor selecciona el proveedor para la Factura de Poleras.', 'warning');
      return;
    }
    if (!supplierIdDtf) {
      showToast('Por favor selecciona el proveedor para la Factura de Estampado DTF.', 'warning');
      return;
    }

    const invoicePoleras = (document.getElementById('split-invoice-poleras')?.value || '').trim();
    const datePoleras = document.getElementById('split-date-poleras')?.value || new Date().toISOString().split('T')[0];
    const chkIvaPoleras = document.getElementById('split-iva-poleras');
    const aplicarIvaPoleras = chkIvaPoleras ? chkIvaPoleras.checked : false;
    const chkDelivPoleras = document.getElementById('split-delivery-check-poleras');
    const aplicarDelivPoleras = chkDelivPoleras ? chkDelivPoleras.checked : false;
    const montoDelivPoleras = (aplicarDelivPoleras && document.getElementById('split-delivery-poleras'))
      ? Math.max(0, Number(document.getElementById('split-delivery-poleras').value) || 0)
      : 0;

    const invoiceDtf = (document.getElementById('split-invoice-dtf')?.value || '').trim();
    const dateDtf = document.getElementById('split-date-dtf')?.value || new Date().toISOString().split('T')[0];
    const chkIvaDtf = document.getElementById('split-iva-dtf');
    const aplicarIvaDtf = chkIvaDtf ? chkIvaDtf.checked : false;
    const chkDelivDtf = document.getElementById('split-delivery-check-dtf');
    const aplicarDelivDtf = chkDelivDtf ? chkDelivDtf.checked : false;
    const montoDelivDtf = (aplicarDelivDtf && document.getElementById('split-delivery-dtf'))
      ? Math.max(0, Number(document.getElementById('split-delivery-dtf').value) || 0)
      : 0;

    const itemsPolerasLimpios = currentSplitState.itemsPoleras.map(it => ({
      inventoryItemId: it.inventoryItemId || it.inventoryId,
      name: it.name,
      quantity: Math.max(1, Number(it.quantity) || 1),
      unitCost: Math.max(0, Number(it.unitCost) || 0),
      subtotal: (Math.max(1, Number(it.quantity) || 1)) * (Math.max(0, Number(it.unitCost) || 0))
    }));

    const itemsDtfLimpios = currentSplitState.itemsDtf.map(it => ({
      inventoryItemId: it.inventoryItemId || it.inventoryId,
      name: it.name,
      quantity: Math.max(1, Number(it.quantity) || 1),
      unitCost: Math.max(0, Number(it.unitCost) || 0),
      subtotal: (Math.max(1, Number(it.quantity) || 1)) * (Math.max(0, Number(it.unitCost) || 0))
    }));

    const totalesPoleras = prod.calcularTotalesCompra(itemsPolerasLimpios, {
      aplicarIva: aplicarIvaPoleras,
      montoDelivery: montoDelivPoleras
    });

    const totalesDtf = prod.calcularTotalesCompra(itemsDtfLimpios, {
      aplicarIva: aplicarIvaDtf,
      montoDelivery: montoDelivDtf
    });

    const datosPoleras = {
      supplierId: supplierIdPoleras,
      supplierName: supplierNamePoleras,
      invoiceNumber: invoicePoleras,
      date: datePoleras,
      items: itemsPolerasLimpios,
      subtotalNeto: totalesPoleras.subtotalNeto,
      applyIva: totalesPoleras.applyIva,
      ivaPercent: totalesPoleras.ivaPercent,
      ivaAmount: totalesPoleras.ivaAmount,
      applyDelivery: totalesPoleras.applyDelivery,
      deliveryAmount: totalesPoleras.deliveryAmount,
      totalAmount: totalesPoleras.totalAmount,
      notes: currentSplitState.baseNotes ? `${currentSplitState.baseNotes} (Factura de Poleras)` : 'Factura separada de Poleras y Confección.'
    };

    const datosDtf = {
      supplierId: supplierIdDtf,
      supplierName: supplierNameDtf,
      invoiceNumber: invoiceDtf,
      date: dateDtf,
      items: itemsDtfLimpios,
      subtotalNeto: totalesDtf.subtotalNeto,
      applyIva: totalesDtf.applyIva,
      ivaPercent: totalesDtf.ivaPercent,
      ivaAmount: totalesDtf.ivaAmount,
      applyDelivery: totalesDtf.applyDelivery,
      deliveryAmount: totalesDtf.deliveryAmount,
      totalAmount: totalesDtf.totalAmount,
      notes: currentSplitState.baseNotes ? `${currentSplitState.baseNotes} (Factura de Estampado DTF)` : 'Factura separada de Estampado DTF e Insumos.'
    };

    const resultado = storage.separarCompraEnDos(currentSplitState.originalPurchaseId, datosPoleras, datosDtf);

    // Cerrar ambos modales
    const dlgSplit = document.getElementById('dialog-split-purchase');
    if (dlgSplit && typeof dlgSplit.close === 'function') dlgSplit.close();

    const dlgPurchase = document.getElementById('dialog-purchase');
    if (dlgPurchase && typeof dlgPurchase.close === 'function') dlgPurchase.close();

    showToast(`¡Compra dividida con éxito! Factura Poleras: ${resultado.compraPoleras.id} | Factura DTF: ${resultado.compraDtf.id}`, 'success');

    if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    }
  }

  // ==========================================
  // GESTIÓN DE FABRICACIÓN EN TALLER (SPEC 003)
  // ==========================================

  function renderFabricationMetrics(proyectos = []) {
    const total = proyectos.length;
    const enDiseno = proyectos.filter(p => p.stage === 'Diseño').length;
    const enEstampado = proyectos.filter(p => p.stage === 'Estampado').length;
    const terminados = proyectos.filter(p => p.stage === 'Terminado').length;

    const elTotal = document.getElementById('metric-fab-total');
    const elDiseno = document.getElementById('metric-fab-design');
    const elEstampado = document.getElementById('metric-fab-print');
    const elTerminados = document.getElementById('metric-fab-finished');

    if (elTotal) elTotal.textContent = total;
    if (elDiseno) elDiseno.textContent = enDiseno;
    if (elEstampado) elEstampado.textContent = enEstampado;
    if (elTerminados) elTerminados.textContent = terminados;
  }

  function renderFabricationCard(prj) {
    const prod = global.NovaprintProduction;
    const siguiente = prod ? prod.obtenerSiguienteEtapa(prj.stage) : null;

    return `
      <div class="bg-white rounded-xl p-3.5 border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between" data-project-id="${prj.id}">
        <div>
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                ${prj.code || prj.id}
              </span>
              <h4 class="font-bold text-gray-900 text-sm mt-1 leading-snug">${prj.name}</h4>
              <p class="text-xs text-gray-500">👤 ${prj.clientName || 'Cliente General'}</p>
            </div>
            <span class="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
              ${prj.quantity} un.
            </span>
          </div>

          <div class="space-y-1 bg-gray-50 p-2 rounded-lg text-xs text-gray-600 mb-3 border border-gray-100">
            <div class="flex justify-between">
              <span class="text-gray-400">Prenda:</span>
              <span class="font-bold text-gray-800">${prj.garmentType}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Técnica:</span>
              <span class="font-bold text-purple-700">${prj.printTechnique}</span>
            </div>
            ${prj.printLocation ? `
              <div class="flex justify-between">
                <span class="text-gray-400">Ubicación:</span>
                <span class="text-gray-700">${prj.printLocation}</span>
              </div>
            ` : ''}
            <div class="flex justify-between border-t border-gray-200 pt-1 mt-1">
              <span class="text-gray-400">📅 Entrega:</span>
              <span class="font-bold text-gray-900">${prj.targetDate || 'S/F'}</span>
            </div>
          </div>

          ${prj.assignedTo ? `
            <div class="text-[11px] text-gray-500 mb-2 flex items-center gap-1">
              <span>🔧 Responsable:</span>
              <span class="font-semibold text-gray-700">${prj.assignedTo}</span>
            </div>
          ` : ''}

          ${prj.notes ? `
            <div class="text-[11px] italic text-amber-800 bg-amber-50/70 p-1.5 rounded border border-amber-200 mb-3">
              ${prj.notes}
            </div>
          ` : ''}
        </div>

        <div class="pt-2 border-t border-gray-100 flex items-center justify-between gap-1 text-xs">
          ${siguiente ? `
            <button type="button" class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs" onclick="NovaprintUI.avanzarEtapaProyecto('${prj.id}')">
              <span>Avanzar a ${siguiente} ➔</span>
            </button>
          ` : `
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              ✅ Fabricación Concluida
            </span>
          `}
          <div class="flex gap-1">
            <button type="button" class="p-1 text-gray-400 hover:text-gray-700 rounded" title="Editar" onclick="NovaprintUI.editarOrdenFabricacion('${prj.id}')">✏️</button>
            <button type="button" class="p-1 text-red-400 hover:text-red-700 rounded" title="Eliminar" onclick="NovaprintUI.confirmarEliminarProyecto('${prj.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderFabricationKanban(proyectos = []) {
    const prod = global.NovaprintProduction;
    if (!prod) return;

    const agrupados = prod.clasificarProyectosPorEtapa(proyectos);

    const cols = {
      'Diseño': document.getElementById('col-fab-diseno'),
      'Preparación': document.getElementById('col-fab-prep'),
      'Estampado': document.getElementById('col-fab-estampado'),
      'Control Calidad': document.getElementById('col-fab-calidad'),
      'Terminado': document.getElementById('col-fab-terminado')
    };

    const counts = {
      'Diseño': document.getElementById('count-fab-diseno'),
      'Preparación': document.getElementById('count-fab-prep'),
      'Estampado': document.getElementById('count-fab-estampado'),
      'Control Calidad': document.getElementById('count-fab-calidad'),
      'Terminado': document.getElementById('count-fab-terminado')
    };

    Object.keys(cols).forEach(etapa => {
      const container = cols[etapa];
      const countEl = counts[etapa];
      const items = agrupados[etapa] || [];

      if (countEl) countEl.textContent = `(${items.length})`;
      if (container) {
        if (items.length === 0) {
          container.innerHTML = '<div class="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">Sin órdenes en esta estación</div>';
        } else {
          container.innerHTML = items.map(p => renderFabricationCard(p)).join('');
        }
      }
    });
  }

  function avanzarEtapaProyecto(projectId) {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const prj = storage.getProjectById(projectId);
    if (!prj) return;

    const siguiente = prod.obtenerSiguienteEtapa(prj.stage);
    if (siguiente) {
      storage.updateProjectStage(projectId, siguiente);
      showToast(`Lote ${prj.code || prj.id} avanzado a "${siguiente}"`, 'info');

      // Si se completó y tiene pedido vinculado, ofrecer o actualizar estado del pedido
      if (siguiente === 'Terminado' && prj.orderId) {
        storage.updateOrderStatus(prj.orderId, 'Listo para entrega');
        showToast(`Pedido ${prj.orderId} marcado como "Listo para entrega"`, 'success');
      }

      global.NovaprintMain.refrescarDatos();
    }
  }

  function enviarPedidoAFabricacion(orderId) {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const pedido = storage.getOrderById(orderId);
    if (!pedido) return;

    // Verificar si ya existe una orden de fabricación para este pedido
    const existentes = storage.getProjects().filter(p => p.orderId === orderId);
    if (existentes.length > 0) {
      if (!confirm(`Este pedido ya tiene una orden de fabricación (${existentes[0].code || existentes[0].id}). ¿Deseas crear un nuevo lote adicional?`)) {
        return;
      }
    }

    const nuevoProyecto = prod.crearProyectoDesdePedido(pedido, 'Operador de Taller');
    storage.saveProject(nuevoProyecto);

    // Spec 004: Descontar stock físico del inventario por las prendas del pedido
    const resDescuento = storage.descontarStockPorPedido(pedido.items || []);
    if (resDescuento && resDescuento.descontados && resDescuento.descontados.length > 0) {
      const resumenDesc = resDescuento.descontados.map(d => `${d.cantidadDescontada}x ${d.name} (Quedan: ${d.nuevoStock})`).join(', ');
      showToast(`📦 Inventario descontado: ${resumenDesc}`, 'info');
    }

    // Actualizar pedido a "En producción" si estaba en cotización/confirmado
    if (pedido.status === 'Cotización' || pedido.status === 'Confirmado') {
      storage.updateOrderStatus(orderId, 'En producción');
    }

    showToast(`¡Orden de Taller ${nuevoProyecto.code} generada con éxito!`, 'success');
    if (global.NovaprintMain && typeof global.NovaprintMain.cambiarVista === 'function') {
      global.NovaprintMain.cambiarVista('fabrication');
    } else if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    }
  }

  let editingProjectId = null;

  function abrirModalNuevaOrdenFabricacion() {
    editingProjectId = null;
    document.getElementById('form-project').reset();
    document.getElementById('project-id-hidden').value = '';
    document.getElementById('project-modal-title').textContent = 'Registrar Orden de Fabricación en Taller';

    // Poblar selector de pedidos confirmados
    const storage = global.NovaprintStorage;
    const pedidos = storage ? storage.getOrders() : [];
    const selectOrder = document.getElementById('project-order-select');
    if (selectOrder) {
      selectOrder.innerHTML = '<option value="">-- Fabricación para Stock (Sin Pedido) --</option>' +
        pedidos.map(p => `<option value="${p.id}" data-client="${p.clientName}">${p.id} — ${p.clientName} (${p.totals?.totalQuantity || 0} un.)</option>`).join('');
    }

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('project-target-date').value = hoy;

    document.getElementById('dialog-project').showModal();
  }

  function editarOrdenFabricacion(projectId) {
    const storage = global.NovaprintStorage;
    const p = storage.getProjectById(projectId);
    if (!p) return;

    abrirModalNuevaOrdenFabricacion();
    editingProjectId = p.id;
    document.getElementById('project-id-hidden').value = p.id;
    document.getElementById('project-code-input').value = p.code || '';
    document.getElementById('project-name-input').value = p.name || '';
    document.getElementById('project-client-input').value = p.clientName || '';
    document.getElementById('project-garment-input').value = p.garmentType || 'Polera';
    document.getElementById('project-technique-select').value = p.printTechnique || 'DTF';
    document.getElementById('project-location-input').value = p.printLocation || 'Pecho grande';
    document.getElementById('project-quantity-input').value = p.quantity || 1;
    document.getElementById('project-stage-select').value = p.stage || 'Diseño';
    document.getElementById('project-target-date').value = p.targetDate || '';
    document.getElementById('project-assigned-input').value = p.assignedTo || '';
    document.getElementById('project-notes-input').value = p.notes || '';
    document.getElementById('project-order-select').value = p.orderId || '';

    document.getElementById('project-modal-title').textContent = `Editar Lote: ${p.code || p.id}`;
    document.getElementById('dialog-project').showModal();
  }

  function guardarProyectoDesdeFormulario() {
    const id = document.getElementById('project-id-hidden').value;
    const code = document.getElementById('project-code-input').value.trim();
    const name = document.getElementById('project-name-input').value.trim();
    const clientName = document.getElementById('project-client-input').value.trim();
    const garmentType = document.getElementById('project-garment-input').value.trim();
    const printTechnique = document.getElementById('project-technique-select').value;
    const printLocation = document.getElementById('project-location-input').value.trim();
    const quantity = Number(document.getElementById('project-quantity-input').value) || 1;
    const stage = document.getElementById('project-stage-select').value;
    const targetDate = document.getElementById('project-target-date').value;
    const assignedTo = document.getElementById('project-assigned-input').value.trim();
    const notes = document.getElementById('project-notes-input').value.trim();
    const orderId = document.getElementById('project-order-select').value || null;

    if (!name) {
      showToast('El nombre de la orden de taller es obligatorio.', 'warning');
      return;
    }

    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;

    storage.saveProject({
      id: id || undefined,
      code: code || (prod ? prod.generarIdFabricacion(Math.floor(Math.random() * 900) + 100) : 'FAB-001'),
      name,
      clientName: clientName || 'Stock Interno',
      garmentType,
      printTechnique,
      printLocation,
      quantity,
      stage,
      targetDate,
      assignedTo,
      notes,
      orderId
    });

    document.getElementById('dialog-project').close();
    showToast(`Orden de taller "${name}" guardada.`, 'success');
    global.NovaprintMain.refrescarDatos();
  }

  function confirmarEliminarProyecto(projectId) {
    const storage = global.NovaprintStorage;
    const p = storage.getProjectById(projectId);
    if (confirm(`¿Eliminar la orden de fabricación "${p ? p.name : projectId}"?`)) {
      storage.deleteProject(projectId);
      showToast('Orden de fabricación eliminada.', 'info');
      global.NovaprintMain.refrescarDatos();
    }
  }

  // ==========================================
  // --- MÓDULO DE CONTABILIDAD (SPEC 018) ---
  // ==========================================
  let currentAccountingSubView = 'balance'; // 'balance' | 'pnl' | 'journal' | 'chart'
  let currentJournalFilter = 'todos';
  let currentJournalMonthFilter = '';
  let currentJournalAccountFilter = 'todas';
  let currentChartFilter = 'todos';
  let currentChartSearch = '';

  function cambiarSubVistaContable(subview) {
    currentAccountingSubView = subview;

    const btnBal = document.getElementById('btn-acc-sub-balance');
    const btnPnl = document.getElementById('btn-acc-sub-pnl');
    const btnJou = document.getElementById('btn-acc-sub-journal');
    const btnCha = document.getElementById('btn-acc-sub-chart');

    const viewBal = document.getElementById('acc-subview-balance');
    const viewPnl = document.getElementById('acc-subview-pnl');
    const viewJou = document.getElementById('acc-subview-journal');
    const viewCha = document.getElementById('acc-subview-chart');

    [btnBal, btnPnl, btnJou, btnCha].forEach(btn => {
      if (btn) {
        btn.className = 'px-4 py-2 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition';
      }
    });

    [viewBal, viewPnl, viewJou, viewCha].forEach(v => {
      if (v) v.classList.add('hidden');
    });

    if (subview === 'balance') {
      if (btnBal) btnBal.className = 'px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs transition';
      if (viewBal) viewBal.classList.remove('hidden');
    } else if (subview === 'pnl') {
      if (btnPnl) btnPnl.className = 'px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs transition';
      if (viewPnl) viewPnl.classList.remove('hidden');
    } else if (subview === 'journal') {
      if (btnJou) btnJou.className = 'px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs transition';
      if (viewJou) viewJou.classList.remove('hidden');
      const storage = global.NovaprintStorage;
      if (storage) {
        renderAccountingModule(
          storage.getOrders ? storage.getOrders() : [],
          storage.getPurchases ? storage.getPurchases() : [],
          storage.getInventory ? storage.getInventory() : [],
          storage.getExpenses ? storage.getExpenses() : [],
          storage.getSettings ? storage.getSettings() : {},
          storage.getTransfers ? storage.getTransfers() : []
        );
      }
    } else if (subview === 'chart') {
      if (btnCha) btnCha.className = 'px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs transition';
      if (viewCha) viewCha.classList.remove('hidden');
      renderAccountsChart();
    }
  }

  function renderAccountingModule(pedidos = [], compras = [], inventario = [], gastos = [], settings = {}, transferencias = null) {
    if (typeof document === 'undefined') return;

    const acc = global.NovaprintAccounting;
    const sales = global.NovaprintSales;
    if (!acc || !sales) return;

    const storage = global.NovaprintStorage;
    const trans = Array.isArray(transferencias)
      ? transferencias
      : (storage && typeof storage.getTransfers === 'function' ? storage.getTransfers() : []);

    const metricas = acc.calcularMetricasContables(pedidos, compras, inventario, gastos, settings, trans);
    const balance = acc.calcularBalanceGeneral(pedidos, compras, inventario, gastos, settings, trans);
    const pnl = acc.calcularEstadoResultados(pedidos, compras, gastos);
    const asientos = acc.generarLibroDiario(pedidos, compras, gastos, trans);

    renderAccountingMetrics(metricas, sales);
    renderAccountingBalance(balance, sales);
    renderAccountingIncomeStatement(pnl, sales);
    renderAccountingJournal(asientos, sales);
    renderAccountsChart();
  }

  function renderAccountingMetrics(m, sales) {
    const elAssets = document.getElementById('acc-metric-total-assets');
    const elLiabilities = document.getElementById('acc-metric-total-liabilities');
    const elRevenue = document.getElementById('acc-metric-total-revenue');
    const elNetIncome = document.getElementById('acc-metric-net-income');
    const elMargin = document.getElementById('acc-metric-margin-percent');
    const elIvaNeto = document.getElementById('acc-metric-iva-neto');

    if (elAssets) elAssets.textContent = sales.formatearMoneda(m.totalActivos || 0);
    if (elLiabilities) elLiabilities.textContent = sales.formatearMoneda(m.totalPasivos || 0);
    if (elRevenue) elRevenue.textContent = sales.formatearMoneda(m.ingresosTotales || 0);
    if (elNetIncome) {
      elNetIncome.textContent = sales.formatearMoneda(m.utilidadNeta || 0);
      elNetIncome.className = `text-2xl font-black mt-1 ${m.utilidadNeta >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
    }
    if (elMargin) {
      elMargin.textContent = `Margen: ${(m.margenNetoPorcentaje || 0).toFixed(1)}%`;
      elMargin.className = `text-[10px] font-bold mt-0.5 ${m.utilidadNeta >= 0 ? 'text-emerald-600' : 'text-red-600'}`;
    }
    if (elIvaNeto) {
      elIvaNeto.textContent = `IVA Neto: ${sales.formatearMoneda(m.ivaNetoPagar || 0)}`;
    }
  }

  function renderAccountingBalance(b, sales) {
    const act = b.activos;
    const pas = b.pasivos;
    const pat = b.patrimonio;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt('acc-balance-caja', sales.formatearMoneda(act.circulante.cajaBancos || 0));
    setTxt('acc-balance-cxc', sales.formatearMoneda(act.circulante.cuentasPorCobrar || 0));
    setTxt('acc-balance-inventario', sales.formatearMoneda(act.circulante.inventarioBodega || 0));
    setTxt('acc-balance-iva-credito', sales.formatearMoneda(act.circulante.creditoFiscalIva || 0));
    setTxt('acc-balance-activo-circulante', sales.formatearMoneda(act.circulante.subtotal || 0));
    setTxt('acc-balance-total-activos', sales.formatearMoneda(act.total || 0));
    setTxt('acc-badge-total-activos', sales.formatearMoneda(act.total || 0));

    setTxt('acc-balance-iva-debito', sales.formatearMoneda(pas.circulante.debitoFiscalIva || 0));
    setTxt('acc-balance-cxp', sales.formatearMoneda(pas.circulante.cuentasPorPagar || 0));
    setTxt('acc-balance-total-pasivos', sales.formatearMoneda(pas.total || 0));

    setTxt('acc-balance-capital', sales.formatearMoneda(pat.capital || 0));
    setTxt('acc-balance-utilidad', sales.formatearMoneda(pat.utilidadEjercicio || 0));
    setTxt('acc-balance-total-patrimonio', sales.formatearMoneda(pat.total || 0));
    setTxt('acc-badge-total-pasivo-patrimonio', sales.formatearMoneda((pas.total || 0) + (pat.total || 0)));
    setTxt('acc-balance-total-pasivo-patrimonio', sales.formatearMoneda((pas.total || 0) + (pat.total || 0)));

    setTxt('acc-cuad-activo', sales.formatearMoneda(act.total || 0).replace('$', ''));
    setTxt('acc-cuad-pasivo', sales.formatearMoneda(pas.total || 0).replace('$', ''));
    setTxt('acc-cuad-patrimonio', sales.formatearMoneda(pat.total || 0).replace('$', ''));
  }

  function renderAccountingIncomeStatement(pnl, sales) {
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt('acc-pnl-ventas', sales.formatearMoneda(pnl.ingresos.ventasPrendas || 0));
    setTxt('acc-pnl-delivery', sales.formatearMoneda(pnl.ingresos.delivery || 0));
    setTxt('acc-pnl-descuentos', `-${sales.formatearMoneda(pnl.ingresos.descuentosVolumen || 0)}`);
    setTxt('acc-pnl-total-ingresos', sales.formatearMoneda(pnl.ingresos.total || 0));

    setTxt('acc-pnl-costo-insumos', `-${sales.formatearMoneda(pnl.costos.insumosTextiles || 0)}`);
    setTxt('acc-pnl-compras-netas', sales.formatearMoneda(pnl.costos.insumosTextiles || 0));
    setTxt('acc-pnl-margen-bruto', sales.formatearMoneda(pnl.costos.margenBruto || 0));
    setTxt('acc-pnl-margen-bruto-pct', `(${(pnl.costos.margenBrutoPorcentaje || 0).toFixed(1)}%)`);

    setTxt('acc-pnl-gastos-generales', `-${sales.formatearMoneda(pnl.gastos.total || 0)}`);

    const containerGastos = document.getElementById('acc-pnl-desglose-gastos');
    if (containerGastos) {
      const cats = pnl.gastos.desgloseCategorias || {};
      const entries = Object.entries(cats);
      if (entries.length === 0 && pnl.gastos.fletesProveedores === 0) {
        containerGastos.innerHTML = `<div class="text-gray-400 py-1 sm:col-span-2">Sin gastos operacionales registrados en el periodo.</div>`;
      } else {
        let html = '';
        if (pnl.gastos.fletesProveedores > 0) {
          html += `
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-gray-600">🚚 Fletes a Proveedores:</span>
              <span class="font-bold font-mono text-gray-800">${sales.formatearMoneda(pnl.gastos.fletesProveedores)}</span>
            </div>
          `;
        }
        entries.forEach(([cat, monto]) => {
          html += `
            <div class="flex justify-between py-1 border-b border-gray-50">
              <span class="text-gray-600">${cat}:</span>
              <span class="font-bold font-mono text-gray-800">${sales.formatearMoneda(monto)}</span>
            </div>
          `;
        });
        containerGastos.innerHTML = html;
      }
    }

    setTxt('acc-pnl-utilidad-neta', sales.formatearMoneda(pnl.utilidadNeta || 0));
    setTxt('acc-pnl-margen-neto-pct', `Margen Neto: ${(pnl.margenNetoPorcentaje || 0).toFixed(1)}%`);

    const elPill = document.getElementById('acc-pnl-status-pill');
    if (elPill) {
      if (pnl.utilidadNeta > 0) {
        elPill.textContent = 'Rentable';
        elPill.className = 'px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800';
      } else if (pnl.utilidadNeta < 0) {
        elPill.textContent = 'En Pérdida';
        elPill.className = 'px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800';
      } else {
        elPill.textContent = 'Punto de Equilibrio';
        elPill.className = 'px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700';
      }
    }
  }

  function poblarSelectorCuentasLibroDiario(cuentas = null) {
    if (typeof document === 'undefined') return;
    const selAccount = document.getElementById('acc-journal-filter-account');
    if (!selAccount) return;

    const storage = global.NovaprintStorage;
    const listaCuentas = Array.isArray(cuentas) ? cuentas : (storage && typeof storage.getAccounts === 'function' ? storage.getAccounts() : []);

    const valorDeseado = currentJournalAccountFilter || 'todas';

    // Agrupar cuentas por su tipo canónico
    const grupos = {
      'Activo': [],
      'Pasivo': [],
      'Capital': [],
      'Ingreso': [],
      'Egreso': []
    };

    listaCuentas.forEach(c => {
      if (!c) return;
      const tipo = c.tipo || 'Activo';
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(c);
    });

    let html = '<option value="todas">Todas las Cuentas</option>';
    const ordenTipos = ['Activo', 'Pasivo', 'Capital', 'Ingreso', 'Egreso'];
    const etiquetas = {
      'Activo': '1. Activos',
      'Pasivo': '2. Pasivos',
      'Capital': '3. Capital / Patrimonio',
      'Ingreso': '4. Ingresos',
      'Egreso': '5. Egresos / Costos y Gastos'
    };

    ordenTipos.forEach(t => {
      const items = grupos[t] || [];
      if (items.length > 0) {
        // Ordenar por código
        items.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));
        html += `<optgroup label="${etiquetas[t] || t}">`;
        items.forEach(c => {
          const cod = c.codigo || '';
          const nom = c.nombre || '';
          html += `<option value="${cod}">${cod} — ${nom}</option>`;
        });
        html += '</optgroup>';
      }
    });

    selAccount.innerHTML = html;

    // Restaurar valor previo si existe en las opciones
    let existe = false;
    const opts = selAccount.options || [];
    for (let i = 0; i < opts.length; i++) {
      if (opts[i].value === valorDeseado) {
        selAccount.selectedIndex = i;
        existe = true;
        break;
      }
    }
    if (!existe) {
      selAccount.value = 'todas';
      currentJournalAccountFilter = 'todas';
    } else {
      currentJournalAccountFilter = valorDeseado;
    }
  }

  function renderAccountingJournal(asientos = [], sales) {
    const countEl = document.getElementById('acc-journal-count');
    const tbody = document.getElementById('acc-journal-tbody');
    if (!tbody) return;

    poblarSelectorCuentasLibroDiario();

    // Sincronizar controles si difieren del estado
    const selType = document.getElementById('acc-journal-filter-type');
    if (selType && currentJournalFilter && selType.value !== currentJournalFilter) {
      selType.value = currentJournalFilter;
    }
    const inputMonth = document.getElementById('acc-journal-filter-month');
    if (inputMonth && inputMonth.value !== currentJournalMonthFilter) {
      inputMonth.value = currentJournalMonthFilter;
    }
    const selAccount = document.getElementById('acc-journal-filter-account');
    if (selAccount && currentJournalAccountFilter && selAccount.value !== currentJournalAccountFilter) {
      selAccount.value = currentJournalAccountFilter;
    }

    const storage = global.NovaprintStorage;
    const acc = global.NovaprintAccounting;
    const catalogoCuentas = storage && typeof storage.getAccounts === 'function' ? storage.getAccounts() : [];

    let filtrados = [];
    if (acc && typeof acc.filtrarAsientosContables === 'function') {
      filtrados = acc.filtrarAsientosContables(asientos, {
        tipo: currentJournalFilter,
        mes: currentJournalMonthFilter,
        cuenta: currentJournalAccountFilter,
        catalogoCuentas
      });
    } else {
      filtrados = (Array.isArray(asientos) ? asientos : []).filter(a => {
        if (!a) return false;
        if (currentJournalFilter !== 'todos' && a.tipo !== currentJournalFilter) return false;
        if (currentJournalMonthFilter && (!a.fecha || !a.fecha.startsWith(currentJournalMonthFilter))) return false;
        return true;
      });
    }

    if (countEl) countEl.textContent = filtrados.length;

    if (filtrados.length === 0) {
      const hayFiltrosActivos = currentJournalFilter !== 'todos' || currentJournalMonthFilter !== '' || currentJournalAccountFilter !== 'todas';
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-gray-400 text-xs">
            ${hayFiltrosActivos ? `
              <div class="font-medium text-gray-500">No hay movimientos contables que coincidan con los filtros seleccionados.</div>
              <button type="button" onclick="NovaprintUI.resetFiltrosLibroDiario()" class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 transition cursor-pointer">
                <span>✕</span> Limpiar Filtros
              </button>
            ` : 'No hay movimientos contables registrados en el taller.'}
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtrados.map(a => {
      const fechaFmt = a.fecha ? a.fecha.split('T')[0] : '-';
      const refId = a.referenciaId || '';
      const isOrder = (a.id && a.id.startsWith('AS-NP-')) || refId.startsWith('NP-');
      const isPurchase = (a.id && a.id.startsWith('AS-CMP-')) || refId.startsWith('CMP-');
      const isExpense = (a.id && a.id.startsWith('AS-EXP-')) || refId.startsWith('EXP-') || a.tipo === 'Gasto';
      const isTransfer = (a.id && a.id.startsWith('AS-TRF-')) || refId.startsWith('TRF-') || a.tipo === 'Transferencia';

      let editFn = '';
      let dupFn = '';
      let delFn = '';
      let editTitle = 'Editar';
      let dupTitle = 'Duplicar';
      let delTitle = 'Eliminar';

      if (isOrder) {
        editFn = `NovaprintUI.editarPedido('${refId}')`;
        dupFn = `NovaprintUI.duplicarPedido('${refId}')`;
        delFn = `NovaprintUI.confirmarEliminarPedido('${refId}')`;
        editTitle = 'Editar Pedido de Venta';
        dupTitle = 'Duplicar Pedido de Venta';
        delTitle = 'Eliminar Pedido';
      } else if (isPurchase) {
        editFn = `NovaprintUI.editarCompra('${refId}')`;
        dupFn = `NovaprintUI.duplicarCompra('${refId}')`;
        delFn = `NovaprintUI.confirmarEliminarCompra('${refId}')`;
        editTitle = 'Editar Compra a Proveedor';
        dupTitle = 'Duplicar Compra a Proveedor';
        delTitle = 'Eliminar Compra';
      } else if (isTransfer) {
        editFn = `NovaprintUI.editarTransferencia('${refId}')`;
        dupFn = `NovaprintUI.duplicarTransferencia('${refId}')`;
        delFn = `NovaprintUI.confirmarEliminarTransferencia('${refId}')`;
        editTitle = 'Editar Transferencia Contable';
        dupTitle = 'Duplicar Transferencia Contable';
        delTitle = 'Eliminar Transferencia';
      } else {
        // Por defecto: Gasto Operacional
        editFn = `NovaprintUI.editarGasto('${refId}')`;
        dupFn = `NovaprintUI.duplicarGasto('${refId}')`;
        delFn = `NovaprintUI.confirmarEliminarGasto('${refId}')`;
        editTitle = 'Editar Gasto Operacional';
        dupTitle = 'Duplicar Gasto Operacional';
        delTitle = 'Eliminar Gasto';
      }

      let tipoBadge = '';
      if (a.tipo === 'Ingreso') {
        if (a.subcuenta === 'Banco') {
          tipoBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Abono Banco</span>';
        } else if (a.subcuenta === 'Cuentas por Cobrar') {
          tipoBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Saldo Crédito</span>';
        } else {
          tipoBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Venta Poleras</span>';
        }
      } else if (a.tipo === 'Costo') {
        tipoBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Compra Insumo</span>';
      } else if (a.tipo === 'Transferencia') {
        tipoBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Transferencia</span>';
      } else {
        tipoBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Gasto Taller</span>';
      }

      return `
        <tr class="border-b border-gray-100 hover:bg-slate-50 text-xs">
          <td class="py-2.5 px-3 font-mono text-gray-500 whitespace-nowrap">${fechaFmt}</td>
          <td class="py-2.5 px-3 whitespace-nowrap">${tipoBadge}</td>
          <td class="py-2.5 px-3">
            <div class="font-bold text-gray-900">${a.concepto}</div>
            <div class="text-[10px] text-gray-400 font-mono">Ref: ${a.referenciaId}</div>
          </td>
          <td class="py-2.5 px-3 text-gray-700 font-medium">
            <div class="text-xs">${a.cuentaDebe}</div>
            <div class="text-[10px] text-gray-400">vs ${a.cuentaHaber}</div>
          </td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-gray-900">${sales ? sales.formatearMoneda(a.debe || 0) : `$${a.debe}`}</td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-gray-900">${sales ? sales.formatearMoneda(a.haber || 0) : `$${a.haber}`}</td>
          <td class="py-2.5 px-3 text-right whitespace-nowrap">
            <div class="inline-flex items-center gap-1 justify-end">
              <button type="button" class="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition cursor-pointer" title="${editTitle}" onclick="${editFn}">
                ✏️
              </button>
              <button type="button" class="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer" title="${dupTitle}" onclick="${dupFn}">
                📋
              </button>
              <button type="button" class="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer" title="${delTitle}" onclick="${delFn}">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function refrescarVistaLibroDiario() {
    const storage = global.NovaprintStorage;
    const acc = global.NovaprintAccounting;
    const sales = global.NovaprintSales;
    if (storage && acc && sales) {
      const pedidos = storage.getOrders ? storage.getOrders() : [];
      const compras = storage.getPurchases ? storage.getPurchases() : [];
      const gastos = storage.getExpenses ? storage.getExpenses() : [];
      const trans = storage.getTransfers ? storage.getTransfers() : [];
      const todosAsientos = acc.generarLibroDiario(pedidos, compras, gastos, trans);
      renderAccountingJournal(todosAsientos, sales);
    } else if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    }
  }

  function filtrarLibroDiario() {
    const sel = document.getElementById('acc-journal-filter-type');
    if (sel) {
      currentJournalFilter = sel.value;
    }
    const inputMonth = document.getElementById('acc-journal-filter-month');
    if (inputMonth) {
      currentJournalMonthFilter = inputMonth.value.trim();
    }
    const selAccount = document.getElementById('acc-journal-filter-account');
    if (selAccount) {
      currentJournalAccountFilter = selAccount.value.trim();
    }
    refrescarVistaLibroDiario();
  }

  function limpiarFiltroMesLibroDiario() {
    const inputMonth = document.getElementById('acc-journal-filter-month');
    if (inputMonth) {
      inputMonth.value = '';
    }
    currentJournalMonthFilter = '';
    filtrarLibroDiario();
  }

  function resetFiltrosLibroDiario() {
    const selType = document.getElementById('acc-journal-filter-type');
    if (selType) selType.value = 'todos';
    currentJournalFilter = 'todos';

    const inputMonth = document.getElementById('acc-journal-filter-month');
    if (inputMonth) inputMonth.value = '';
    currentJournalMonthFilter = '';

    const selAccount = document.getElementById('acc-journal-filter-account');
    if (selAccount) selAccount.value = 'todas';
    currentJournalAccountFilter = 'todas';

    filtrarLibroDiario();
  }

  // Spec 029: Limpieza Segura de Movimientos Contables de Prueba
  function abrirModalLimpiarPruebas() {
    if (typeof document === 'undefined') return;
    const storage = global.NovaprintStorage;
    const summaryEl = document.getElementById('clean-tests-summary');
    const btnConfirm = document.getElementById('btn-confirm-clean-tests');
    const dialog = document.getElementById('dialog-clean-tests');

    if (!storage) {
      if (typeof showToast === 'function') showToast('Error: Almacenamiento no disponible', 'error');
      return;
    }

    const expenses = typeof storage.getExpenses === 'function' ? storage.getExpenses() : [];
    const transfers = typeof storage.getTransfers === 'function' ? storage.getTransfers() : [];
    const orders = typeof storage.getOrders === 'function' ? storage.getOrders() : [];
    const purchases = typeof storage.getPurchases === 'function' ? storage.getPurchases() : [];

    const isTest = typeof storage.esRegistroDePrueba === 'function' ? storage.esRegistroDePrueba : () => false;

    const testExpenses = expenses.filter(e => isTest(e, 'gastos'));
    const testTransfers = transfers.filter(t => isTest(t, 'transferencias'));

    const totalPruebas = testExpenses.length + testTransfers.length;

    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="flex justify-between items-center py-1 border-b border-gray-200">
          <span class="font-medium text-gray-700">Gastos detectados como prueba:</span>
          <span class="font-bold ${testExpenses.length > 0 ? 'text-amber-700 font-mono' : 'text-gray-500 font-mono'}">${testExpenses.length}</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-gray-200">
          <span class="font-medium text-gray-700">Transferencias detectadas como prueba:</span>
          <span class="font-bold ${testTransfers.length > 0 ? 'text-amber-700 font-mono' : 'text-gray-500 font-mono'}">${testTransfers.length}</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-gray-200">
          <span class="font-medium text-gray-700">Ventas y Pedidos de clientes:</span>
          <span class="font-bold text-emerald-700 font-mono">${orders.length} (100% Preservados)</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-gray-200">
          <span class="font-medium text-gray-700">Compras de insumos:</span>
          <span class="font-bold text-emerald-700 font-mono">${purchases.length} (100% Preservadas)</span>
        </div>
        <div class="flex justify-between items-center pt-2 font-bold text-gray-900">
          <span>Total movimientos de prueba a purgar:</span>
          <span class="text-sm font-mono ${totalPruebas > 0 ? 'text-amber-800' : 'text-emerald-700'}">${totalPruebas}</span>
        </div>
        <div class="mt-2 text-[11px] text-gray-500 bg-white p-2 rounded border border-gray-200">
          ℹ️ Registros legítimos protegidos: <strong>${orders.length}</strong> ventas, <strong>${purchases.length}</strong> compras, <strong>${expenses.length - testExpenses.length}</strong> gastos de taller y <strong>${transfers.length - testTransfers.length}</strong> transferencias.
        </div>
      `;
    }

    if (btnConfirm) {
      if (totalPruebas === 0) {
        btnConfirm.disabled = true;
        btnConfirm.classList.add('opacity-50', 'cursor-not-allowed');
        btnConfirm.title = 'No hay movimientos contables de prueba para depurar';
      } else {
        btnConfirm.disabled = false;
        btnConfirm.classList.remove('opacity-50', 'cursor-not-allowed');
        btnConfirm.title = `Depurar ${totalPruebas} registros de prueba`;
      }
    }

    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function confirmarLimpiarPruebas() {
    if (typeof document === 'undefined') return;
    const storage = global.NovaprintStorage;
    const dialog = document.getElementById('dialog-clean-tests');

    if (!storage || typeof storage.purgarMovimientosPrueba !== 'function') {
      if (typeof showToast === 'function') showToast('Error al ejecutar la purga', 'error');
      return;
    }

    const resultado = storage.purgarMovimientosPrueba();
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    }

    if (typeof showToast === 'function') {
      if (resultado.totalPurgados > 0) {
        showToast(`Se depuraron exitosamente ${resultado.totalPurgados} movimientos contables de prueba`, 'success');
      } else {
        showToast('No se encontraron registros contables de prueba para depurar', 'info');
      }
    }

    refrescarVistaLibroDiario();
    if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    }
  }

  function abrirModalNuevoGasto() {
    if (typeof document === 'undefined') return;
    const form = document.getElementById('form-expense');
    if (form) form.reset();

    const idInput = document.getElementById('expense-id-hidden');
    if (idInput) idInput.value = '';

    const dateInput = document.getElementById('expense-date-input');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    const titleEl = document.getElementById('expense-modal-title');
    if (titleEl) titleEl.textContent = 'Registrar Gasto de Taller';

    const dialog = document.getElementById('dialog-expense');
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function editarGasto(gastoId) {
    if (typeof document === 'undefined') return;
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const g = storage.getExpenseById(gastoId);
    if (!g) {
      showToast('No se encontró el gasto a editar.', 'error');
      return;
    }

    const form = document.getElementById('form-expense');
    if (form) form.reset();

    const idInput = document.getElementById('expense-id-hidden');
    if (idInput) idInput.value = g.id;

    const dateInput = document.getElementById('expense-date-input');
    if (dateInput) dateInput.value = g.date || new Date().toISOString().split('T')[0];

    const catInput = document.getElementById('expense-category-select');
    if (catInput) catInput.value = g.category || 'Otros Gastos';

    const descInput = document.getElementById('expense-desc-input');
    if (descInput) descInput.value = g.description || '';

    const amountInput = document.getElementById('expense-amount-input');
    if (amountInput) amountInput.value = g.amount || '';

    const methodInput = document.getElementById('expense-payment-method');
    if (methodInput) methodInput.value = g.paymentMethod || 'Transferencia / Banco';

    const notesInput = document.getElementById('expense-notes-input');
    if (notesInput) notesInput.value = g.notes || '';

    const titleEl = document.getElementById('expense-modal-title');
    if (titleEl) titleEl.textContent = `Editar Gasto (${g.id})`;

    const dialog = document.getElementById('dialog-expense');
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function duplicarGasto(gastoId) {
    if (typeof document === 'undefined') return;
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const g = storage.getExpenseById(gastoId);
    if (!g) {
      showToast('No se encontró el gasto a duplicar.', 'error');
      return;
    }

    const form = document.getElementById('form-expense');
    if (form) form.reset();

    const idInput = document.getElementById('expense-id-hidden');
    if (idInput) idInput.value = ''; // Limpiar ID para generar un nuevo gasto

    const dateInput = document.getElementById('expense-date-input');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const catInput = document.getElementById('expense-category-select');
    if (catInput) catInput.value = g.category || 'Otros Gastos';

    const descInput = document.getElementById('expense-desc-input');
    if (descInput) descInput.value = g.description ? `${g.description} (Copia)` : 'Gasto (Copia)';

    const amountInput = document.getElementById('expense-amount-input');
    if (amountInput) amountInput.value = g.amount || '';

    const methodInput = document.getElementById('expense-payment-method');
    if (methodInput) methodInput.value = g.paymentMethod || 'Transferencia / Banco';

    const notesInput = document.getElementById('expense-notes-input');
    if (notesInput) {
      const origNotes = g.notes ? `${g.notes} ` : '';
      notesInput.value = `${origNotes}[Copia de gasto ${g.id}]`.trim();
    }

    const titleEl = document.getElementById('expense-modal-title');
    if (titleEl) titleEl.textContent = `Duplicar Gasto (Copia de ${g.id})`;

    const dialog = document.getElementById('dialog-expense');
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }

    showToast(`Gasto ${g.id} clonado. Revisa y haz clic en "Guardar Gasto".`, 'info');
  }

  function guardarGastoDesdeFormulario() {
    if (typeof document === 'undefined') return;

    const idInput = document.getElementById('expense-id-hidden');
    const dateInput = document.getElementById('expense-date-input');
    const catInput = document.getElementById('expense-category-select');
    const descInput = document.getElementById('expense-desc-input');
    const amountInput = document.getElementById('expense-amount-input');
    const methodInput = document.getElementById('expense-payment-method');
    const notesInput = document.getElementById('expense-notes-input');

    const id = idInput ? idInput.value.trim() : '';
    const date = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];
    const category = catInput ? catInput.value : 'Otros Gastos';
    const description = descInput ? descInput.value.trim() : '';
    const amount = Number(amountInput ? amountInput.value : 0);
    const paymentMethod = methodInput ? methodInput.value : 'Transferencia / Banco';
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!description) {
      showToast('Ingresa una descripción del gasto.', 'warning');
      return;
    }

    if (!amount || amount <= 0) {
      showToast('Ingresa un monto válido mayor a 0.', 'warning');
      return;
    }

    const storage = global.NovaprintStorage;
    if (!storage || typeof storage.saveExpense !== 'function') {
      showToast('Error interno: storage no disponible', 'error');
      return;
    }

    storage.saveExpense({
      id: id || undefined,
      date,
      category,
      description,
      amount,
      paymentMethod,
      notes
    });

    const dialog = document.getElementById('dialog-expense');
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
    }

    showToast(`Gasto "${description}" guardado con éxito.`, 'success');

    if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    }
  }

  function confirmarEliminarGasto(gastoId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const g = storage.getExpenseById(gastoId);
    if (confirm(`¿Eliminar el registro de gasto "${g ? g.description : gastoId}"?`)) {
      storage.deleteExpense(gastoId);
      showToast('Gasto operacional eliminado.', 'info');
      if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
        global.NovaprintMain.refrescarDatos();
      }
    }
  }

  // ==========================================
  // PLAN DE CUENTAS CONTABLE Y CRUD (SPEC 022)
  // ==========================================

  function renderAccountsChart() {
    if (typeof document === 'undefined') return;
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const allAccounts = storage.getAccounts();

    // Calcular saldos dinámicos de cada cuenta a partir de todos los movimientos (Spec 024)
    const accModule = global.NovaprintAccounting;
    const sales = global.NovaprintSales;
    let saldosPorCuenta = {};
    if (accModule && typeof accModule.calcularSaldosPlanCuentas === 'function' && typeof accModule.generarLibroDiario === 'function') {
      const pedidos = storage.getOrders ? storage.getOrders() : [];
      const compras = storage.getPurchases ? storage.getPurchases() : [];
      const gastos = storage.getExpenses ? storage.getExpenses() : [];
      const trans = storage.getTransfers ? storage.getTransfers() : [];
      const settings = storage.getSettings ? storage.getSettings() : {};
      const asientos = accModule.generarLibroDiario(pedidos, compras, gastos, trans);
      saldosPorCuenta = accModule.calcularSaldosPlanCuentas(asientos, allAccounts, settings);
    }

    // Actualizar contadores
    const countTotal = allAccounts.length;
    const countActivos = allAccounts.filter(a => a.tipo === 'Activo').length;
    const countPasivos = allAccounts.filter(a => a.tipo === 'Pasivo').length;
    const countCapital = allAccounts.filter(a => a.tipo === 'Capital').length;
    const countIngresos = allAccounts.filter(a => a.tipo === 'Ingreso').length;
    const countEgresos = allAccounts.filter(a => a.tipo === 'Egreso').length;

    const elTotal = document.getElementById('chart-count-total');
    if (elTotal) elTotal.textContent = countTotal;
    const elActivos = document.getElementById('chart-count-activos');
    if (elActivos) elActivos.textContent = countActivos;
    const elPasivos = document.getElementById('chart-count-pasivos');
    if (elPasivos) elPasivos.textContent = countPasivos;
    const elCapital = document.getElementById('chart-count-capital');
    if (elCapital) elCapital.textContent = countCapital;
    const elIngresos = document.getElementById('chart-count-ingresos');
    if (elIngresos) elIngresos.textContent = countIngresos;
    const elEgresos = document.getElementById('chart-count-egresos');
    if (elEgresos) elEgresos.textContent = countEgresos;

    const selectFilter = document.getElementById('acc-chart-filter-type');
    const filterType = selectFilter ? selectFilter.value : currentChartFilter;

    const searchInput = document.getElementById('acc-chart-search');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : currentChartSearch;

    let filtered = allAccounts;
    if (filterType && filterType !== 'todos') {
      filtered = filtered.filter(a => a.tipo === filterType);
    }
    if (query) {
      filtered = filtered.filter(a =>
        (a.codigo || '').toLowerCase().includes(query) ||
        (a.nombre || '').toLowerCase().includes(query) ||
        (a.subtipo || '').toLowerCase().includes(query) ||
        (a.descripcion || '').toLowerCase().includes(query)
      );
    }

    const tbody = document.getElementById('acc-chart-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="py-8 text-center text-gray-400 text-xs">
            No se encontraron cuentas contables que coincidan con la búsqueda o filtro.
          </td>
        </tr>
      `;
      return;
    }

    const badgeTipo = (tipo) => {
      switch (tipo) {
        case 'Activo':
          return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">1. Activo</span>';
        case 'Pasivo':
          return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">2. Pasivo</span>';
        case 'Capital':
          return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">3. Capital</span>';
        case 'Ingreso':
          return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">4. Ingreso</span>';
        case 'Egreso':
          return '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">5. Egreso</span>';
        default:
          return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">${tipo}</span>`;
      }
    };

    tbody.innerHTML = filtered.map(acc => {
      const esSis = Boolean(acc.esSistema);
      const badgeSis = esSis
        ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300" title="Cuenta base del sistema protegida">Base Sistema</span>'
        : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200" title="Cuenta personalizada añadida por el usuario">Personalizada</span>';

      const btnEliminar = esSis
        ? '<button type="button" class="p-1 text-gray-300 cursor-not-allowed" title="Las cuentas base del sistema no se pueden eliminar" disabled>🔒</button>'
        : `<button type="button" class="p-1 text-red-500 hover:text-red-700 rounded cursor-pointer transition" title="Eliminar Cuenta" onclick="NovaprintUI.confirmarEliminarCuenta('${acc.id}')">🗑️</button>`;

      const saldoInfo = saldosPorCuenta[acc.id] || saldosPorCuenta[acc.codigo] || { saldo: 0, totalMovimientos: 0 };
      const saldo = saldoInfo.saldo || 0;
      const saldoFmt = sales && typeof sales.formatearMoneda === 'function'
        ? sales.formatearMoneda(saldo)
        : `$${saldo.toLocaleString('es-CL')}`;

      const saldoBadge = saldo > 0
        ? `<span class="inline-block px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">${saldoFmt}</span>`
        : saldo < 0
          ? `<span class="inline-block px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200">${saldoFmt}</span>`
          : `<span class="inline-block px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-gray-50 text-gray-600 border border-gray-200">$0</span>`;

      const nombreEscapado = (acc.nombre || '').replace(/'/g, "\\'");
      const btnVerMovimientos = `<button type="button" class="p-1 text-indigo-600 hover:text-indigo-800 rounded cursor-pointer transition" title="Ver movimientos de esta cuenta en el Libro Diario" onclick="NovaprintUI.verMovimientosCuenta('${acc.codigo}', '${nombreEscapado}')">👁️</button>`;

      return `
        <tr class="hover:bg-slate-50 transition border-b border-gray-100">
          <td class="py-2.5 px-3 font-mono font-bold text-gray-900">${acc.codigo}</td>
          <td class="py-2.5 px-3 font-bold text-gray-800">${acc.nombre}</td>
          <td class="py-2.5 px-3">${badgeTipo(acc.tipo)}</td>
          <td class="py-2.5 px-3 text-gray-600">${acc.subtipo || '-'}</td>
          <td class="py-2.5 px-3 text-gray-500 max-w-xs truncate" title="${acc.descripcion || ''}">${acc.descripcion || '-'}</td>
          <td class="py-2.5 px-3 text-center">${badgeSis}</td>
          <td class="py-2.5 px-3 text-right whitespace-nowrap">${saldoBadge}</td>
          <td class="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
            ${btnVerMovimientos}
            <button type="button" class="p-1 text-gray-500 hover:text-gray-800 rounded cursor-pointer transition" title="Editar Cuenta" onclick="NovaprintUI.editarCuenta('${acc.id}')">✏️</button>
            ${btnEliminar}
          </td>
        </tr>
      `;
    }).join('');
  }

  function filtrarPlanCuentas() {
    renderAccountsChart();
  }

  function abrirModalNuevaCuenta() {
    const form = document.getElementById('form-account');
    if (form) form.reset();

    const hiddenId = document.getElementById('account-id-hidden');
    if (hiddenId) hiddenId.value = '';

    const title = document.getElementById('account-modal-title');
    if (title) title.textContent = 'Registrar Cuenta Contable';
    const sub = document.getElementById('account-modal-subtitle');
    if (sub) sub.textContent = 'Define una nueva cuenta para el Plan de Cuentas del taller';

    const codeInput = document.getElementById('account-code-input');
    if (codeInput) {
      codeInput.readOnly = false;
      codeInput.classList.remove('bg-gray-100');
    }

    const dlg = document.getElementById('dialog-account');
    if (dlg && typeof dlg.showModal === 'function') {
      dlg.showModal();
    }
  }

  function editarCuenta(accountId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const acc = storage.getAccountById(accountId);
    if (!acc) {
      showToast('No se encontró la cuenta seleccionada.', 'error');
      return;
    }

    const hiddenId = document.getElementById('account-id-hidden');
    if (hiddenId) hiddenId.value = acc.id;

    const title = document.getElementById('account-modal-title');
    if (title) title.textContent = `Editar Cuenta Contable (${acc.codigo})`;
    const sub = document.getElementById('account-modal-subtitle');
    if (sub) sub.textContent = 'Modifica los datos y clasificación de la cuenta contable';

    const codeInput = document.getElementById('account-code-input');
    if (codeInput) {
      codeInput.value = acc.codigo || '';
      if (acc.esSistema) {
        codeInput.readOnly = true;
        codeInput.classList.add('bg-gray-100');
      } else {
        codeInput.readOnly = false;
        codeInput.classList.remove('bg-gray-100');
      }
    }

    const typeSelect = document.getElementById('account-type-select');
    if (typeSelect) typeSelect.value = acc.tipo || 'Activo';

    const nameInput = document.getElementById('account-name-input');
    if (nameInput) nameInput.value = acc.nombre || '';

    const subtypeInput = document.getElementById('account-subtype-input');
    if (subtypeInput) subtypeInput.value = acc.subtipo || '';

    const statusSelect = document.getElementById('account-status-select');
    if (statusSelect) statusSelect.value = acc.activo !== false ? 'true' : 'false';

    const descInput = document.getElementById('account-desc-input');
    if (descInput) descInput.value = acc.descripcion || '';

    const dlg = document.getElementById('dialog-account');
    if (dlg && typeof dlg.showModal === 'function') {
      dlg.showModal();
    }
  }

  function guardarCuentaDesdeFormulario() {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const hiddenId = document.getElementById('account-id-hidden');
    const existingId = hiddenId ? hiddenId.value.trim() : '';

    const codigo = (document.getElementById('account-code-input')?.value || '').trim();
    const nombre = (document.getElementById('account-name-input')?.value || '').trim();
    const tipo = document.getElementById('account-type-select')?.value || 'Activo';
    const subtipo = (document.getElementById('account-subtype-input')?.value || '').trim();
    const activo = document.getElementById('account-status-select')?.value !== 'false';
    const descripcion = (document.getElementById('account-desc-input')?.value || '').trim();

    if (!codigo) {
      showToast('Por favor ingresa un código contable (ej. 1105).', 'warning');
      return;
    }
    if (!nombre) {
      showToast('Por favor ingresa un nombre para la cuenta.', 'warning');
      return;
    }

    try {
      const cuentaData = {
        ...(existingId ? { id: existingId } : {}),
        codigo,
        nombre,
        tipo,
        subtipo,
        activo,
        descripcion
      };

      const guardada = storage.saveAccount(cuentaData);

      const dlg = document.getElementById('dialog-account');
      if (dlg && typeof dlg.close === 'function') dlg.close();

      showToast(`Cuenta "${guardada.codigo} — ${guardada.nombre}" guardada con éxito.`, 'success');
      renderAccountsChart();
    } catch (err) {
      showToast(err.message || 'Error al guardar la cuenta.', 'error');
    }
  }

  function confirmarEliminarCuenta(accountId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const acc = storage.getAccountById(accountId);
    if (!acc) return;

    if (acc.esSistema) {
      showToast('Las cuentas base del sistema no pueden eliminarse.', 'warning');
      return;
    }

    if (confirm(`¿Eliminar la cuenta contable "${acc.codigo} — ${acc.nombre}"?`)) {
      const res = storage.deleteAccount(accountId);
      if (res && res.success) {
        showToast(`Cuenta "${acc.codigo} — ${acc.nombre}" eliminada.`, 'info');
        renderAccountsChart();
      } else {
        showToast(res.error || 'No se pudo eliminar la cuenta.', 'error');
      }
    }
  }

  function confirmarRestablecerCuentas() {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    if (confirm('¿Restablecer el Plan de Cuentas oficial por defecto?\nEsto restaurará las 20 cuentas estándar del taller.')) {
      storage.resetDefaultAccounts();
      showToast('Plan de Cuentas restablecido al catálogo oficial.', 'success');
      renderAccountsChart();
    }
  }

  // --- SPEC 023: TRANSFERENCIA ENTRE CUENTAS CONTABLES ---
  function abrirModalTransferencia() {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const hiddenId = document.getElementById('transfer-id-hidden');
    if (hiddenId) hiddenId.value = '';

    const dateInput = document.getElementById('transfer-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const amountInput = document.getElementById('transfer-amount');
    if (amountInput) amountInput.value = '';

    const descInput = document.getElementById('transfer-description');
    if (descInput) descInput.value = '';

    const refInput = document.getElementById('transfer-reference');
    if (refInput) refInput.value = '';

    // Cargar cuentas del Plan de Cuentas
    const accounts = storage.getAccounts ? storage.getAccounts() : [];
    const activeAccounts = accounts.filter(a => a.activo !== false);

    const selectSource = document.getElementById('transfer-source-account');
    const selectDest = document.getElementById('transfer-destination-account');

    if (selectSource && selectDest) {
      // Agrupar por tipo
      const tipos = ['Activo', 'Pasivo', 'Capital', 'Ingreso', 'Egreso'];
      let optionsHtml = '';

      tipos.forEach(tipo => {
        const cuentasTipo = activeAccounts.filter(a => a.tipo === tipo);
        if (cuentasTipo.length > 0) {
          optionsHtml += `<optgroup label="${tipo}s">`;
          cuentasTipo.forEach(a => {
            optionsHtml += `<option value="${a.id}" data-code="${a.codigo}" data-name="${a.nombre}">${a.codigo} — ${a.nombre}</option>`;
          });
          optionsHtml += `</optgroup>`;
        }
      });

      selectSource.innerHTML = optionsHtml;
      selectDest.innerHTML = optionsHtml;

      // Por defecto origen: 1101 (Caja y Bancos) si existe
      const defaultSource = activeAccounts.find(a => a.codigo === '1101');
      if (defaultSource) {
        selectSource.value = defaultSource.id;
      }

      // Por defecto destino: otra cuenta distinta (ej. 1105 o la segunda)
      const defaultDest = activeAccounts.find(a => a.id !== selectSource.value && (a.codigo === '1105' || a.tipo === 'Activo')) || activeAccounts.find(a => a.id !== selectSource.value);
      if (defaultDest) {
        selectDest.value = defaultDest.id;
      }
    }

    actualizarPreviewTransferencia();

    const dlg = document.getElementById('dialog-transfer');
    if (dlg && typeof dlg.showModal === 'function') {
      dlg.showModal();
    }
  }

  function editarTransferencia(transferId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const trf = storage.getTransferById(transferId);
    if (!trf) {
      showToast('No se encontró la transferencia a editar.', 'error');
      return;
    }

    abrirModalTransferencia();

    const hiddenId = document.getElementById('transfer-id-hidden');
    if (hiddenId) hiddenId.value = trf.id;

    const dateInput = document.getElementById('transfer-date');
    if (dateInput) dateInput.value = trf.date || new Date().toISOString().split('T')[0];

    const amountInput = document.getElementById('transfer-amount');
    if (amountInput) amountInput.value = trf.amount || '';

    const descInput = document.getElementById('transfer-description');
    if (descInput) descInput.value = trf.description || '';

    const refInput = document.getElementById('transfer-reference');
    if (refInput) refInput.value = trf.reference || '';

    const selectSource = document.getElementById('transfer-source-account');
    if (selectSource && trf.sourceAccountId) selectSource.value = trf.sourceAccountId;

    const selectDest = document.getElementById('transfer-destination-account');
    if (selectDest && trf.destinationAccountId) selectDest.value = trf.destinationAccountId;

    actualizarPreviewTransferencia();
  }

  function duplicarTransferencia(transferId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const trf = storage.getTransferById(transferId);
    if (!trf) {
      showToast('No se encontró la transferencia a duplicar.', 'error');
      return;
    }

    abrirModalTransferencia();

    const hiddenId = document.getElementById('transfer-id-hidden');
    if (hiddenId) hiddenId.value = ''; // Limpiar ID para generar una nueva transferencia

    const dateInput = document.getElementById('transfer-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const amountInput = document.getElementById('transfer-amount');
    if (amountInput) amountInput.value = trf.amount || '';

    const descInput = document.getElementById('transfer-description');
    if (descInput) descInput.value = trf.description ? `${trf.description} (Copia)` : 'Transferencia (Copia)';

    const refInput = document.getElementById('transfer-reference');
    if (refInput) {
      const origRef = trf.reference ? `${trf.reference} ` : '';
      refInput.value = `${origRef}[Copia de TRF ${trf.id}]`.trim();
    }

    const selectSource = document.getElementById('transfer-source-account');
    if (selectSource && trf.sourceAccountId) selectSource.value = trf.sourceAccountId;

    const selectDest = document.getElementById('transfer-destination-account');
    if (selectDest && trf.destinationAccountId) selectDest.value = trf.destinationAccountId;

    actualizarPreviewTransferencia();

    showToast(`Transferencia ${trf.id} clonada. Revisa y haz clic en "Confirmar Transferencia".`, 'info');
  }

  function actualizarPreviewTransferencia() {
    const sales = global.NovaprintSales;

    const selectSource = document.getElementById('transfer-source-account');
    const selectDest = document.getElementById('transfer-destination-account');
    const amountInput = document.getElementById('transfer-amount');

    const sourceId = selectSource ? selectSource.value : '';
    const destId = selectDest ? selectDest.value : '';
    const amount = Number(amountInput ? amountInput.value : 0) || 0;

    const sourceOpt = selectSource && selectSource.selectedOptions ? selectSource.selectedOptions[0] : null;
    const destOpt = selectDest && selectDest.selectedOptions ? selectDest.selectedOptions[0] : null;

    const sourceText = sourceOpt ? sourceOpt.textContent : 'Cuenta Origen';
    const destText = destOpt ? destOpt.textContent : 'Cuenta Destino';

    const debeAccEl = document.getElementById('transfer-preview-debe-acc');
    const debeAmountEl = document.getElementById('transfer-preview-debe-amount');
    const haberAccEl = document.getElementById('transfer-preview-haber-acc');
    const haberAmountEl = document.getElementById('transfer-preview-haber-amount');
    const balanceTag = document.getElementById('transfer-preview-balance-tag');

    const montoFmt = sales && typeof sales.formatearMoneda === 'function' ? sales.formatearMoneda(amount) : `$${amount}`;

    if (debeAccEl) debeAccEl.textContent = destText;
    if (debeAmountEl) debeAmountEl.textContent = montoFmt;

    if (haberAccEl) haberAccEl.textContent = sourceText;
    if (haberAmountEl) haberAmountEl.textContent = montoFmt;

    if (balanceTag) {
      if (!sourceId || !destId) {
        balanceTag.textContent = 'Seleccione Cuentas';
        balanceTag.className = 'px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-700 font-bold';
      } else if (sourceId === destId) {
        balanceTag.textContent = 'Error: Misma Cuenta';
        balanceTag.className = 'px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-bold';
      } else if (amount <= 0) {
        balanceTag.textContent = 'Ingrese Monto > $0';
        balanceTag.className = 'px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold';
      } else {
        balanceTag.textContent = 'Partida Doble Cuadrada';
        balanceTag.className = 'px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold';
      }
    }
  }

  function guardarTransferenciaDesdeFormulario(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const storage = global.NovaprintStorage;
    if (!storage) return;

    const selectSource = document.getElementById('transfer-source-account');
    const selectDest = document.getElementById('transfer-destination-account');
    const amountInput = document.getElementById('transfer-amount');
    const dateInput = document.getElementById('transfer-date');
    const descInput = document.getElementById('transfer-description');
    const refInput = document.getElementById('transfer-reference');
    const hiddenId = document.getElementById('transfer-id-hidden');

    const sourceAccountId = selectSource ? selectSource.value : '';
    const destinationAccountId = selectDest ? selectDest.value : '';
    const amount = Number(amountInput ? amountInput.value : 0);
    const date = dateInput ? dateInput.value : '';
    const description = descInput ? descInput.value.trim() : '';
    const reference = refInput ? refInput.value.trim() : '';
    const existingId = hiddenId ? hiddenId.value.trim() : '';

    if (!sourceAccountId) {
      showToast('Seleccione la cuenta de origen.', 'warning');
      return;
    }
    if (!destinationAccountId) {
      showToast('Seleccione la cuenta de destino.', 'warning');
      return;
    }
    if (sourceAccountId === destinationAccountId) {
      showToast('La cuenta de origen y de destino no pueden ser la misma.', 'warning');
      return;
    }
    if (!amount || amount <= 0) {
      showToast('El monto debe ser un número mayor a cero ($ > 0).', 'warning');
      return;
    }
    if (!date) {
      showToast('Seleccione la fecha de la transferencia.', 'warning');
      return;
    }
    if (!description) {
      showToast('Ingrese una glosa o concepto descriptivo para la transferencia.', 'warning');
      return;
    }

    try {
      const datos = {
        ...(existingId ? { id: existingId } : {}),
        sourceAccountId,
        destinationAccountId,
        amount,
        date,
        description,
        reference
      };

      const guardada = storage.saveTransfer(datos);
      const dlg = document.getElementById('dialog-transfer');
      if (dlg && typeof dlg.close === 'function') dlg.close();

      showToast(`Transferencia de $${amount.toLocaleString('es-CL')} registrada con éxito.`, 'success');
      refrescarContabilidadCompleta();
    } catch (err) {
      showToast(err.message || 'Error al registrar la transferencia.', 'error');
    }
  }

  function confirmarEliminarTransferencia(transferId) {
    const storage = global.NovaprintStorage;
    if (!storage) return;

    const trf = storage.getTransferById(transferId);
    if (!trf) return;

    const montoStr = Number(trf.amount || 0).toLocaleString('es-CL');
    if (confirm(`¿Eliminar la transferencia de $${montoStr} entre "${trf.sourceAccountName || trf.sourceAccountCode}" y "${trf.destinationAccountName || trf.destinationAccountCode}"?\nEsta acción revertirá el asiento en el Libro Diario.`)) {
      const res = storage.deleteTransfer(transferId);
      if (res && res.success) {
        showToast('Transferencia eliminada con éxito.', 'info');
        refrescarContabilidadCompleta();
      } else {
        showToast(res.error || 'No se pudo eliminar la transferencia.', 'error');
      }
    }
  }

  function refrescarContabilidadCompleta() {
    const storage = global.NovaprintStorage;
    if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    } else if (global.NovaprintMain && typeof global.NovaprintMain.refrescarContabilidad === 'function') {
      global.NovaprintMain.refrescarContabilidad();
    } else if (typeof global.refrescarContabilidad === 'function') {
      global.refrescarContabilidad();
    } else if (typeof global.refrescarDatos === 'function') {
      global.refrescarDatos();
    }

    if (storage) {
      renderAccountingModule(
        storage.getOrders ? storage.getOrders() : [],
        storage.getPurchases ? storage.getPurchases() : [],
        storage.getInventory ? storage.getInventory() : [],
        storage.getExpenses ? storage.getExpenses() : [],
        storage.getSettings ? storage.getSettings() : {},
        storage.getTransfers ? storage.getTransfers() : []
      );
      renderAccountsChart();
    }
  }

  function verMovimientosCuenta(codigo, nombre) {
    cambiarSubVistaContable('journal');

    const codStr = (codigo || '').toString().trim();
    currentJournalAccountFilter = codStr || 'todas';
    currentJournalFilter = 'todos';
    currentJournalMonthFilter = '';

    const selType = document.getElementById('acc-journal-filter-type');
    if (selType) selType.value = 'todos';

    const inputMonth = document.getElementById('acc-journal-filter-month');
    if (inputMonth) inputMonth.value = '';

    poblarSelectorCuentasLibroDiario();
    const selAccount = document.getElementById('acc-journal-filter-account');
    if (selAccount) {
      selAccount.value = codStr || 'todas';
    }

    if (global.NovaprintMain && typeof global.NovaprintMain.refrescarDatos === 'function') {
      global.NovaprintMain.refrescarDatos();
    } else {
      const storage = global.NovaprintStorage;
      const acc = global.NovaprintAccounting;
      const sales = global.NovaprintSales;
      if (storage && acc && sales) {
        const pedidos = storage.getOrders ? storage.getOrders() : [];
        const compras = storage.getPurchases ? storage.getPurchases() : [];
        const gastos = storage.getExpenses ? storage.getExpenses() : [];
        const trans = storage.getTransfers ? storage.getTransfers() : [];
        const todosAsientos = acc.generarLibroDiario(pedidos, compras, gastos, trans);
        renderAccountingJournal(todosAsientos, sales);
      }
    }

    showToast(`Mostrando movimientos de cuenta ${codigo} — ${nombre || ''}`, 'info');
  }

  const uiModule = {
    showToast,
    renderMetrics,
    renderOrdersKanban,
    renderOrdersTable,
    renderClientsGrid,
    abrirModalNuevoPedido,
    agregarFilaPrenda,
    eliminarFilaPrenda,
    actualizarItemProp,
    generarOpcionesColor,
    generarOpcionesTalla,
    manejarCambioColor,
    toggleOrderDeliveryInput,
    recalcularTotalesFormulario,
    abrirModalDescuentosVolumen,
    guardarPedidoDesdeFormulario,
    editarPedido,
    duplicarPedido,
    cambiarEstado,
    abrirModalCambiarEstado,
    seleccionarNuevoEstado,
    confirmarEliminarPedido,
    abrirModalNuevoCliente,
    editarCliente,
    guardarClienteDesdeFormulario,
    confirmarEliminarCliente,
    verHistorialCliente,
    verTicket,
    enviarWhatsApp,
    // Spec 002: Proveedores
    renderSuppliersGrid,
    abrirModalNuevoProveedor,
    editarProveedor,
    guardarProveedorDesdeFormulario,
    confirmarEliminarProveedor,
    // Spec 002: Inventarios
    renderInventoryMetrics,
    renderInventoryTable,
    abrirModalNuevoItemInventario,
    editarItemInventario,
    manejarCambioColorInventario,
    guardarItemInventarioDesdeFormulario,
    confirmarEliminarItemInventario,
    // Spec 017: Modificar Stock de Inventario
    abrirModalModificarStock,
    recalcularDeltaStock,
    aplicarAjusteStockDelta,
    guardarModificacionStock,
    // Spec 002 & 014: Compras
    renderPurchasesTable,
    abrirModalNuevaCompra,
    editarCompra,
    duplicarCompra,
    confirmarEliminarCompra,
    agregarFilaItemCompra,
    eliminarFilaItemCompra,
    actualizarItemCompraSelect,
    actualizarItemCompraVal,
    togglePurchaseDeliveryInput,
    recalcularTotalesCompraFormulario,
    guardarCompraDesdeFormulario,
    // Spec 021 / Spec 034: Separación de Compras (Poleras y Estampado DTF)
    abrirModalSepararCompra,
    toggleSplitDeliveryPoleras,
    toggleSplitDeliveryDtf,
    recalcularTotalesSeparacion,
    confirmarSeparacionCompra,
    actualizarItemSplit,
    // Spec 004: Faltantes y Compras
    abrirModalCompraConFaltantes,
    comprarFaltantesDePedido,
    // Spec 003: Fabricación en Taller
    renderFabricationMetrics,
    renderFabricationKanban,
    avanzarEtapaProyecto,
    enviarPedidoAFabricacion,
    abrirModalNuevaOrdenFabricacion,
    editarOrdenFabricacion,
    guardarProyectoDesdeFormulario,
    confirmarEliminarProyecto,
    // Spec 018: Contabilidad y Balance General
    cambiarSubVistaContable,
    renderAccountingModule,
    renderAccountingMetrics,
    renderAccountingBalance,
    renderAccountingIncomeStatement,
    renderAccountingJournal,
    filtrarLibroDiario,
    abrirModalNuevoGasto,
    editarGasto,
    duplicarGasto,
    guardarGastoDesdeFormulario,
    confirmarEliminarGasto,
    // Spec 022: Plan de Cuentas Contable (CRUD)
    renderAccountsChart,
    filtrarPlanCuentas,
    abrirModalNuevaCuenta,
    editarCuenta,
    guardarCuentaDesdeFormulario,
    confirmarEliminarCuenta,
    confirmarRestablecerCuentas,
    // Spec 023/024/035: Transferencia entre Cuentas Contables y Movimientos
    abrirModalTransferencia,
    editarTransferencia,
    duplicarTransferencia,
    actualizarPreviewTransferencia,
    guardarTransferenciaDesdeFormulario,
    confirmarEliminarTransferencia,
    verMovimientosCuenta,
    // Spec 025/028: Filtros por Mes y Cuenta en Libro Diario
    poblarSelectorCuentasLibroDiario,
    limpiarFiltroMesLibroDiario,
    resetFiltrosLibroDiario,
    refrescarVistaLibroDiario,
    // Spec 029: Limpieza de Movimientos de Prueba
    abrirModalLimpiarPruebas,
    confirmarLimpiarPruebas,
    // Spec 031: Poner stock a cero en todo el inventario
    confirmarPonerStockCero
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = uiModule;
  }
  global.NovaprintUI = uiModule;

})(typeof window !== 'undefined' ? window : globalThis);

