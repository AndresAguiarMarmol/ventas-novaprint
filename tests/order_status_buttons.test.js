const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

describe('Spec 015 — Botones para Modificar el Status de un Pedido (ui.js)', () => {
  let ui;
  let storage;
  let elements = {};
  let showModalCalled = false;
  let closeModalCalled = false;
  let updatedOrderState = null;

  beforeEach(() => {
    showModalCalled = false;
    closeModalCalled = false;
    updatedOrderState = null;

    elements = {
      'dialog-change-order-status': {
        showModal: () => { showModalCalled = true; },
        close: () => { closeModalCalled = true; }
      },
      'status-modal-order-id': { textContent: '' },
      'status-modal-client-name': { textContent: '' },
      'status-modal-current-badge': { textContent: '', className: '' },
      'status-modal-buttons-container': { innerHTML: '' },
      'orders-table-body': { innerHTML: '' },
      'orders-empty-state': { classList: { add: () => {}, remove: () => {} } },
      'col-atrasados': { innerHTML: '' },
      'col-urgentes': { innerHTML: '' },
      'col-semana': { innerHTML: '' },
      'col-listos': { innerHTML: '' },
      'count-atrasados': { textContent: '' },
      'count-urgentes': { textContent: '' },
      'count-semana': { textContent: '' },
      'count-listos': { textContent: '' },
      'kanban-view': { classList: { contains: () => false, remove: () => {}, add: () => {} } },
      'table-view': { classList: { contains: () => true, remove: () => {}, add: () => {} } }
    };

    global.document = {
      getElementById: (id) => elements[id] || null,
      querySelectorAll: () => []
    };

    global.window = global;
    global.alert = () => {};
    global.confirm = () => true;

    // Reset require cache
    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    global.NovaprintStorage = storage;
    global.NovaprintProduction = require('../assets/js/production.js');
    global.NovaprintSales = require('../assets/js/sales.js');

    // Mock storage methods needed for tests
    const dummyOrder = {
      id: 'PED-TEST-001',
      clientName: 'Cliente Prueba SpA',
      status: 'Confirmado',
      date: '2026-11-08',
      deliveryDate: '2026-11-12',
      items: [{ description: 'Poleras', quantity: 10, unitPrice: 5000, total: 50000 }],
      total: 50000,
      notes: ''
    };

    storage.getOrders = () => [dummyOrder];
    storage.updateOrderStatus = (id, newStatus) => {
      updatedOrderState = { id, newStatus };
      dummyOrder.status = newStatus;
      return dummyOrder;
    };

    global.NovaprintMain = {
      refrescarDatos: () => {}
    };

    ui = require('../assets/js/ui.js');
  });

  it('debe exportar abrirModalCambiarEstado y seleccionarNuevoEstado en NovaprintUI', () => {
    assert.equal(typeof ui.abrirModalCambiarEstado, 'function');
    assert.equal(typeof ui.seleccionarNuevoEstado, 'function');
  });

  it('renderOrdersTable debe generar botones interactivos para cambiar estado tanto en la columna Estado como en Acciones', () => {
    const orders = storage.getOrders();
    ui.renderOrdersTable(orders);

    const html = elements['orders-table-body'].innerHTML;

    // Debe contener el botón en la columna de estado
    assert.match(html, /onclick="NovaprintUI\.abrirModalCambiarEstado\('PED-TEST-001'\)"/);
    assert.match(html, /title="Modificar estado de este pedido"/);

    // Debe contener el botón 🔄 en las acciones rápidas
    assert.match(html, /title="Modificar Estado"[^>]*>🔄<\/button>/);
  });

  it('renderOrdersKanban debe incluir el botón directo "🔄 Estado" para abrir el modal selector', () => {
    const orders = storage.getOrders();
    ui.renderOrdersKanban(orders);

    // Como la fecha de entrega es 2026-11-12 (semana), se renderiza en una de las columnas
    const kanbanHtml = elements['col-atrasados'].innerHTML +
                       elements['col-urgentes'].innerHTML +
                       elements['col-semana'].innerHTML +
                       elements['col-listos'].innerHTML;

    assert.match(kanbanHtml, /btn-change-status/);
    assert.match(kanbanHtml, /onclick="NovaprintUI\.abrirModalCambiarEstado\('PED-TEST-001'\)"/);
    assert.match(kanbanHtml, /🔄 Estado/);
  });

  it('abrirModalCambiarEstado debe poblar datos del pedido y renderizar los 6 estados con el actual marcado', () => {
    ui.abrirModalCambiarEstado('PED-TEST-001');

    assert.equal(showModalCalled, true, 'Debe llamar a showModal() en el dialog');
    assert.equal(elements['status-modal-order-id'].textContent, 'PED-TEST-001');
    assert.equal(elements['status-modal-client-name'].textContent, 'Cliente Prueba SpA');
    assert.equal(elements['status-modal-current-badge'].textContent, 'Confirmado');

    const containerHtml = elements['status-modal-buttons-container'].innerHTML;

    // Verificar que los 6 estados están presentes
    const estadosEsperados = [
      'Cotización',
      'Confirmado',
      'En producción',
      'Listo para entrega',
      'Entregado',
      'Cancelado'
    ];

    estadosEsperados.forEach(estado => {
      assert.ok(
        containerHtml.includes(`data-target-status="${estado}"`),
        `El contenedor debe incluir opción para el estado: ${estado}`
      );
    });

    // El estado actual (Confirmado) debe tener indicador visual "Actual"
    assert.match(containerHtml, /<span class="text-\[10px\] bg-blue-600 text-white px-1\.5 py-0\.2 rounded font-black">Actual<\/span>/);
  });

  it('seleccionarNuevoEstado debe cerrar el dialog y actualizar el estado vía storage', () => {
    ui.seleccionarNuevoEstado('PED-TEST-001', 'Listo para entrega');

    assert.equal(closeModalCalled, true, 'Debe invocar close() en el dialog');
    assert.deepEqual(updatedOrderState, {
      id: 'PED-TEST-001',
      newStatus: 'Listo para entrega'
    });
  });
});
