// tests/order_item_details_layout.test.js
// Spec 046 — Ampliación de Modal a max-w-6xl y Columnas Horizontales de Cód. Inventario y Artículo

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

describe('Spec 046 — Ampliación de Modal y Columnas Horizontales de Cód. Inventario y Artículo', () => {

  it('index.html debe configurar #dialog-order con max-w-6xl y cabeceras horizontales Cód. Inventario y Artículo', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Verificar ampliación del modal a max-w-6xl o superior (max-w-7xl)
    assert.match(
      html,
      /<dialog[^>]*id="dialog-order"[^>]*class="[^"]*max-w-(?:6|7)xl[^"]*"/i,
      '#dialog-order debe tener la clase max-w-6xl o max-w-7xl para mayor holgura horizontal'
    );

    // Verificar cabecera Cód. Inventario
    assert.match(
      html,
      /<th[^>]*class="[^"]*w-36[^"]*"[^>]*>C[oó]d\. Inventario<\/th>/i,
      'index.html debe contener la cabecera Cód. Inventario con clase w-36'
    );

    // Verificar cabecera Artículo
    assert.match(
      html,
      /<th[^>]*>Art[íi]culo<\/th>/i,
      'index.html debe contener la cabecera Artículo'
    );
  });

  describe('Renderizado de celdas horizontales y sincronización en ui.js', () => {
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

    it('renderTablaItemsFormulario debe generar celdas horizontales independientes para Cód. Inventario y Artículo', () => {
      ui.abrirModalNuevoPedido();

      const tbody = dom.elements['order-items-tbody'];
      assert.ok(tbody.innerHTML.length > 0, 'El tbody debe tener contenido');

      // Verificar que Cód. Inventario tiene su propia celda td
      assert.match(tbody.innerHTML, /<td[^>]*class="[^"]*py-2\s+pr-1[^"]*"[^>]*>[\s\S]*?inventoryCode/,
        'La primera celda td debe alojar el selector de inventoryCode');

      // Verificar que Artículo tiene su propia celda td en la misma fila
      assert.match(tbody.innerHTML, /<td[^>]*class="[^"]*py-2\s+px-1[^"]*"[^>]*>[\s\S]*?garmentType[\s\S]*?badge-stock-/,
        'La segunda celda td debe alojar el selector de garmentType y el badge de stock');
    });

    it('sincronización bidireccional entre código y artículo opera correctamente en las celdas horizontales', () => {
      // Registrar ítem en inventario
      storage.saveInventoryItem({
        id: 'INV-TEST-002',
        code: 'POL-ROJ-S',
        name: 'Polera Algodón Roja S',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Rojo',
        size: 'S',
        currentStock: 18,
        minStock: 2,
        unitCost: 3500
      });

      ui.abrirModalNuevoPedido();
      const tbody = dom.elements['order-items-tbody'];
      const match = tbody.innerHTML.match(/NovaprintUI\.actualizarItemProp\('([^']+)', 'inventoryCode'/);
      assert.ok(match, 'Debe encontrarse el ID del ítem');
      const itemId = match[1];

      // Seleccionar el código 'POL-ROJ-S'
      ui.actualizarItemProp(itemId, 'inventoryCode', 'POL-ROJ-S');

      // Comprobar que en el HTML renderizado se auto-seleccionó Polera, Rojo y S
      const tbodyAfter = dom.elements['order-items-tbody'];
      assert.ok(tbodyAfter.innerHTML.includes('selected>Polera<'), 'Debe seleccionarse Polera');
      assert.ok(tbodyAfter.innerHTML.includes('selected>Rojo<'), 'Debe seleccionarse Rojo');
      assert.ok(tbodyAfter.innerHTML.includes('selected>S<'), 'Debe seleccionarse talla S');
      assert.ok(tbodyAfter.innerHTML.includes('Bodega: 18 un.'), 'Debe reflejar el stock disponible de 18 un.');
    });
  });
});
