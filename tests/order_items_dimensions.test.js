// tests/order_items_dimensions.test.js
// Spec 043 — Optimización y Ajuste de Anchos en Detalle de Prendas & Técnicas

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

describe('Spec 043 — Optimización y Ajuste de Anchos en Detalle de Prendas & Técnicas', () => {

  it('index.html debe contener las cabeceras th de Talla (w-14), Técnica (w-28) y Cantidad (w-12)', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Verificar cabecera Talla con w-14 y text-center
    assert.match(html, /<th[^>]*class="[^"]*w-14[^"]*text-center[^"]*"[^>]*>Talla<\/th>/i,
      'La cabecera Talla debe tener clases w-14 y text-center');

    // Verificar cabecera Técnica con w-28
    assert.match(html, /<th[^>]*class="[^"]*w-28[^"]*"[^>]*>T[eé]cnica<\/th>/i,
      'La cabecera Técnica debe tener clase w-28');

    // Verificar cabecera Cantidad con w-12 y text-center
    assert.match(html, /<th[^>]*class="[^"]*w-12[^"]*text-center[^"]*"[^>]*>Cant\.<\/th>/i,
      'La cabecera Cant. debe tener clases w-12 y text-center');
  });

  describe('Renderizado de items en ui.js y límite de cantidad', () => {
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

    it('renderTablaItemsFormulario debe generar select de Talla con w-14, Técnica con w-28 y Cantidad con w-12 y max 999', () => {
      ui.abrirModalNuevoPedido();

      const tbody = dom.elements['order-items-tbody'];
      assert.ok(tbody.innerHTML.length > 0, 'El tbody debe tener contenido tras abrir modal');

      // Verificar Talla: w-14 y px-1
      assert.match(tbody.innerHTML, /class="[^"]*w-14[^"]*px-1[^"]*"/,
        'El select de Talla debe tener clases w-14 y px-1 para optimizar 2 caracteres');

      // Verificar Técnica: w-28 y text-[11px]
      assert.match(tbody.innerHTML, /class="[^"]*w-28[^"]*text-\[11px\][^"]*"/,
        'El select de Técnica debe tener clases w-28 y text-[11px] para alojar 11 caracteres');

      // Verificar Cantidad: w-12, min 1 y max 999
      assert.match(tbody.innerHTML, /class="[^"]*w-12[^"]*"/,
        'El input de Cantidad debe tener clase w-12');
      assert.match(tbody.innerHTML, /max="999"/,
        'El input de Cantidad debe tener atributo max="999"');
      assert.match(tbody.innerHTML, /min="1"/,
        'El input de Cantidad debe tener atributo min="1"');
    });

    it('actualizarItemProp con quantity debe limitar el valor al rango 0-999', () => {
      ui.abrirModalNuevoPedido();

      const tbody = dom.elements['order-items-tbody'];
      const match = tbody.innerHTML.match(/NovaprintUI\.actualizarItemProp\('([^']+)', 'quantity'/);
      assert.ok(match, 'Debe encontrarse el ID del ítem en el HTML');
      const itemId = match[1];
      const totalQtyEl = dom.elements['form-total-quantity'];

      // Probar valor normal (25)
      ui.actualizarItemProp(itemId, 'quantity', '25');
      assert.strictEqual(totalQtyEl.textContent, '25 un.', 'El total de prendas debe reflejar 25');

      // Probar valor excedido (> 999)
      ui.actualizarItemProp(itemId, 'quantity', '1500');
      assert.strictEqual(totalQtyEl.textContent, '999 un.', 'La cantidad debe toparse en un máximo de 999');

      // Probar valor negativo (< 0)
      ui.actualizarItemProp(itemId, 'quantity', '-10');
      assert.strictEqual(totalQtyEl.textContent, '0 un.', 'La cantidad no debe ser negativa');
    });
  });
});
