// tests/order_item_details_layout.test.js
// Spec 044 — Fusión Vertical de "Cód. Inventario" y "Artículo/Detalle"

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

describe('Spec 044 — Fusión Vertical de "Cód. Inventario" y "Artículo/Detalle"', () => {

  it('index.html debe contener la cabecera unificada "Cód. Inventario / Artículo" con clase min-w-[160px]', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.match(
      html,
      /<th[^>]*class="[^"]*min-w-\[160px\][^"]*"[^>]*>C[oó]d\. Inventario \/ Art[íi]culo<\/th>/i,
      'index.html debe contener la cabecera Cód. Inventario / Artículo con min-w-[160px]'
    );
  });

  describe('Renderizado agrupado y sincronización en ui.js', () => {
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

    it('renderTablaItemsFormulario debe generar celda inicial con selector de código y debajo el selector de prenda con badge de stock', () => {
      ui.abrirModalNuevoPedido();

      const tbody = dom.elements['order-items-tbody'];
      assert.ok(tbody.innerHTML.length > 0, 'El tbody debe tener contenido');

      // Verificar celda con min-w-[160px] y space-y-1
      assert.match(tbody.innerHTML, /<td[^>]*class="[^"]*min-w-\[160px\][^"]*space-y-1[^"]*"/,
        'La celda inicial debe tener clases min-w-[160px] y space-y-1');

      // Verificar que contiene el selector de inventoryCode
      assert.match(tbody.innerHTML, /NovaprintUI\.actualizarItemProp\('[^']+', 'inventoryCode', this\.value\)/,
        'Debe incluir el selector de inventoryCode');

      // Verificar que contiene el selector de garmentType en la misma celda
      assert.match(tbody.innerHTML, /NovaprintUI\.actualizarItemProp\('[^']+', 'garmentType', this\.value\)/,
        'Debe incluir el selector de garmentType');

      // Verificar que contiene el contenedor del badge de stock
      assert.match(tbody.innerHTML, /id="badge-stock-[^"]+"/,
        'Debe incluir el badge de stock en la misma celda agrupada');
    });

    it('sincronización bidireccional entre código de inventario y prenda/artículo opera correctamente en la celda agrupada', () => {
      // Registrar un ítem de inventario con stock
      storage.saveInventoryItem({
        id: 'INV-TEST-001',
        code: 'POL-ROJ-S',
        name: 'Polera Algodón Roja S',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Rojo',
        size: 'S',
        currentStock: 15,
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
      assert.ok(tbodyAfter.innerHTML.includes('Bodega: 15 un.'), 'Debe reflejar el stock disponible de 15 un.');
    });
  });
});
