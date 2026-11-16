// tests/order_details_field.test.js
// Spec 047 — Incorporación del Campo "Detalles" y Ampliación de Modal a max-w-7xl

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

function createMockLocalStorage() {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; }
  };
}

function createMinimalDOM() {
  const elements = {};

  function makeEl(id, tagName = 'div') {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      value: '',
      textContent: '',
      innerHTML: '',
      className: '',
      checked: false,
      options: [],
      selectedIndex: 0,
      classList: {
        classes: new Set(),
        add(...cls) { cls.forEach(c => this.classes.add(c)); },
        remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
        contains(c) { return this.classes.has(c); }
      },
      style: {},
      children: [],
      appendChild(c) { this.children.push(c); return c; },
      showModal() { this.open = true; },
      close() { this.open = false; },
      reset() { this.value = ''; },
      remove() {},
      addEventListener() {},
      removeEventListener() {},
      querySelectorAll() { return []; },
      querySelector() { return null; }
    };
    elements[id] = el;
    return el;
  }

  makeEl('dialog-order', 'dialog');
  makeEl('form-order', 'form');
  makeEl('order-client-select', 'select');
  makeEl('order-delivery-date', 'input');
  makeEl('order-status-select', 'select');
  makeEl('order-notes-input', 'textarea');
  makeEl('order-deposit-input', 'input');
  makeEl('form-apply-discount', 'input');
  makeEl('order-apply-iva', 'input');
  makeEl('order-apply-delivery', 'input');
  makeEl('order-delivery-input', 'input');
  makeEl('order-delivery-input-container', 'div');
  makeEl('order-items-tbody', 'tbody');
  makeEl('form-total-quantity', 'span');
  makeEl('form-subtotal-amount', 'span');
  makeEl('form-subtotal-container', 'div');
  makeEl('form-discount-container', 'div');
  makeEl('order-modal-title', 'h3');
  makeEl('order-id-display', 'span');

  const doc = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = makeEl(id);
      }
      return elements[id];
    },
    createElement(tag) {
      const el = makeEl('elem-' + Math.random(), tag);
      return el;
    },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };

  return { doc, elements };
}

describe('Spec 047 — Incorporación del Campo "Detalles" y Ampliación de Modal a max-w-7xl', () => {

  it('index.html debe configurar #dialog-order con max-w-7xl y cabecera "Detalles" (w-40)', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Verificar ampliación del modal a max-w-7xl
    assert.match(
      html,
      /<dialog[^>]*id="dialog-order"[^>]*class="[^"]*max-w-7xl[^"]*"/i,
      '#dialog-order debe tener la clase max-w-7xl'
    );

    // Verificar cabecera Detalles con w-40 inmediatamente tras Artículo
    assert.match(
      html,
      /<th[^>]*>Art[íi]culo<\/th>\s*<th[^>]*class="[^"]*w-40[^"]*"[^>]*>Detalles<\/th>/i,
      'index.html debe contener la cabecera Detalles con w-40 después de Artículo'
    );
  });

  describe('Renderizado de input, auto-relleno y persistencia en ui.js', () => {
    let mockStorage;
    let storage;
    let prod;
    let sales;
    let ui;
    let ticket;
    let dom;

    beforeEach(() => {
      mockStorage = createMockLocalStorage();
      global.window = { localStorage: mockStorage };
      global.localStorage = mockStorage;

      dom = createMinimalDOM();
      global.document = dom.doc;

      delete require.cache[require.resolve('../assets/js/production.js')];
      delete require.cache[require.resolve('../assets/js/sales.js')];
      delete require.cache[require.resolve('../assets/js/storage.js')];
      delete require.cache[require.resolve('../assets/js/ui.js')];
      delete require.cache[require.resolve('../assets/js/ticket.js')];

      prod = require('../assets/js/production.js');
      global.NovaprintProduction = prod;

      sales = require('../assets/js/sales.js');
      global.NovaprintSales = sales;

      storage = require('../assets/js/storage.js');
      global.NovaprintStorage = storage;

      ticket = require('../assets/js/ticket.js');
      global.NovaprintTicket = ticket;

      ui = require('../assets/js/ui.js');
      global.NovaprintUI = ui;

      global.NovaprintMain = { refrescarDatos: () => {} };
    });

    it('renderTablaItemsFormulario debe generar celda con input para details con w-40', () => {
      ui.abrirModalNuevoPedido();

      const tbody = dom.elements['order-items-tbody'];
      assert.ok(tbody.innerHTML.length > 0, 'El tbody debe tener contenido');

      assert.match(tbody.innerHTML, /<input[^>]*placeholder="Detalles de prenda"[^>]*class="[^"]*w-40[^"]*"/,
        'Debe incluir input para details con clase w-40');
    });

    it('actualizarItemProp con details debe persistir el texto en el pedido', () => {
      ui.abrirModalNuevoPedido();

      const tbody = dom.elements['order-items-tbody'];
      const match = tbody.innerHTML.match(/NovaprintUI\.actualizarItemProp\('([^']+)', 'details'/);
      assert.ok(match, 'Debe encontrarse el ID del ítem');
      const itemId = match[1];

      // Escribir detalle personalizado
      ui.actualizarItemProp(itemId, 'details', 'Corte Dama / Cuello V');
      ui.guardarPedidoDesdeFormulario();

      const pedidos = storage.getOrders();
      assert.strictEqual(pedidos[0].items[0].details, 'Corte Dama / Cuello V',
        'El detalle debe guardarse en el pedido');
    });

    it('al seleccionar inventoryCode debe sugerir y auto-completar details con el nombre del artículo', () => {
      // Registrar artículo en inventario con nombre descriptivo
      storage.saveInventoryItem({
        id: 'INV-DET-01',
        code: 'POL-ALGV-M',
        name: 'Polera Algodón 24/1 Cuello V',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'M',
        currentStock: 25,
        minStock: 5,
        unitCost: 3800
      });

      ui.abrirModalNuevoPedido();
      const tbody = dom.elements['order-items-tbody'];
      const match = tbody.innerHTML.match(/NovaprintUI\.actualizarItemProp\('([^']+)', 'inventoryCode'/);
      assert.ok(match, 'Debe encontrarse el ID del ítem');
      const itemId = match[1];

      // Seleccionar el código
      ui.actualizarItemProp(itemId, 'inventoryCode', 'POL-ALGV-M');

      // Comprobar que details se auto-completó con el nombre del artículo
      ui.guardarPedidoDesdeFormulario();
      const pedidos = storage.getOrders();
      assert.strictEqual(pedidos[0].items[0].details, 'Polera Algodón 24/1 Cuello V',
        'El campo details debe auto-rellenarse con el nombre del ítem en bodega');
    });

    it('generarTicketHTML debe visualizar el detalle en el comprobante', () => {
      const pedidoConDetalle = {
        id: 'NP-20261116-001',
        clientName: 'Cliente Prueba',
        clientPhone: '+56912345678',
        dates: { createdAt: '2026-11-16T10:00:00Z', deliveryDate: '2026-11-20' },
        status: 'En producción',
        items: [
          {
            id: 'it-1',
            inventoryCode: 'POL-NEG-L',
            garmentType: 'Polera',
            details: 'Corte Dama Cuello Redondo',
            color: 'Negro',
            size: 'L',
            technique: 'DTF',
            printLocation: 'Pecho',
            quantity: 5,
            unitPrice: 6500,
            subtotal: 32500
          }
        ],
        totals: {
          subtotalBruto: 32500,
          totalAmount: 32500,
          depositAmount: 15000,
          balanceAmount: 17500
        }
      };

      const htmlTicket = ticket.generarTicketHTML(pedidoConDetalle);
      assert.ok(htmlTicket.includes('Detalle: Corte Dama Cuello Redondo'),
        'El ticket HTML debe imprimir el detalle de la prenda');
    });
  });
});
