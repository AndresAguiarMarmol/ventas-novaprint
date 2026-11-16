// tests/order_unit_price_dimension.test.js
// Spec 045 — Calibración y Longitud del Campo P. Unitario a 7 Caracteres

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

describe('Spec 045 — Longitud del Campo P. Unitario a 7 Caracteres en Pedidos', () => {

  it('index.html debe contener la cabecera P. Unit sincronizada con w-20', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(
      html,
      /<th[^>]*class="[^"]*w-20[^"]*"[^>]*>P\.\s*Unit<\/th>/i,
      'index.html debe tener la cabecera P. Unit con clase w-20'
    );
  });

  describe('Renderizado de input y límite de 7 cifras en ui.js', () => {
    let mockStorage;
    let storage;
    let prod;
    let sales;
    let ui;
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

      ui = require('../assets/js/ui.js');
      global.NovaprintUI = ui;

      global.NovaprintMain = { refrescarDatos: () => {} };
    });

    it('renderTablaItemsFormulario debe generar el input con w-20, min="0" y max="9999999"', () => {
      ui.abrirModalNuevoPedido();

      const tbody = dom.elements['order-items-tbody'];
      assert.ok(tbody.innerHTML.length > 0, 'El tbody debe tener contenido');

      // Verificar input con clase w-20
      assert.match(tbody.innerHTML, /id="input-price-[^"]+"[^>]*class="[^"]*w-20[^"]*"/,
        'El input de precio unitario debe tener clase w-20 para 7 caracteres');

      // Verificar min="0" y max="9999999"
      assert.match(tbody.innerHTML, /max="9999999"/,
        'El input de precio debe tener atributo max="9999999"');
      assert.match(tbody.innerHTML, /min="0"/,
        'El input de precio debe tener atributo min="0"');
    });

    it('actualizarItemProp con unitPrice debe limitar valores al rango 0 a 9999999 (7 cifras)', () => {
      ui.abrirModalNuevoPedido();

      const tbody = dom.elements['order-items-tbody'];
      const match = tbody.innerHTML.match(/NovaprintUI\.actualizarItemProp\('([^']+)', 'unitPrice'/);
      assert.ok(match, 'Debe encontrarse el ID del ítem');
      const itemId = match[1];

      // Probar precio normal (7500)
      ui.actualizarItemProp(itemId, 'quantity', '2');
      ui.actualizarItemProp(itemId, 'unitPrice', '7500');
      ui.guardarPedidoDesdeFormulario();

      let pedidos = storage.getOrders();
      assert.strictEqual(pedidos[0].items[0].unitPrice, 7500);
      assert.strictEqual(pedidos[0].items[0].subtotal, 15000);

      // Probar precio excedido (> 9999999, ej. 15.000.000)
      ui.actualizarItemProp(itemId, 'unitPrice', '15000000');
      ui.guardarPedidoDesdeFormulario();

      pedidos = storage.getOrders();
      assert.strictEqual(pedidos[0].items[0].unitPrice, 9999999,
        'El precio unitario debe toparse en 9999999 (7 caracteres)');

      // Probar precio negativo (< 0, ej. -5000)
      ui.actualizarItemProp(itemId, 'unitPrice', '-5000');
      ui.guardarPedidoDesdeFormulario();

      pedidos = storage.getOrders();
      assert.strictEqual(pedidos[0].items[0].unitPrice, 0,
        'El precio unitario no debe ser negativo');
    });
  });
});
