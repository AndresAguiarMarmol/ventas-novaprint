// tests/order_checkboxes_preservation.test.js
// Spec 037 — Preservación de Checkboxes (Desc. Volumen, IVA, Delivery) al Avanzar o Modificar Estado

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

// Mock localStorage
function createMockLocalStorage() {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; }
  };
}

// Mock DOM
function createMinimalDOM() {
  const elements = {};

  function makeEl(id, tagName = 'div') {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      value: '',
      textContent: '',
      innerHTML: '',
      checked: false,
      classList: {
        classes: new Set(),
        add(...cls) { cls.forEach(c => this.classes.add(c)); },
        remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
        contains(c) { return this.classes.has(c); }
      },
      style: {},
      children: [],
      selectedOptions: [],
      showModal() { this.open = true; },
      close() { this.open = false; },
      reset() { this.value = ''; },
      addEventListener() {},
      removeEventListener() {},
      querySelectorAll() { return []; },
      querySelector() { return null; },
      closest() { return null; },
      appendChild(child) { this.children.push(child); return child; },
      remove() {}
    };
    elements[id] = el;
    return el;
  }

  // Elementos del formulario de pedido
  makeEl('dialog-order', 'dialog');
  makeEl('form-order', 'form');
  makeEl('order-modal-title', 'h3');
  makeEl('order-id-display', 'span');
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
  makeEl('form-total-amount', 'span');
  makeEl('form-balance-amount', 'span');
  makeEl('form-subtotal-container', 'div');
  makeEl('form-subtotal-amount', 'span');
  makeEl('form-discount-container', 'div');
  makeEl('form-discount-label', 'span');
  makeEl('form-neto-container', 'div');
  makeEl('form-neto-amount', 'span');
  makeEl('form-iva-row', 'div');
  makeEl('form-iva-amount', 'span');
  makeEl('form-delivery-row', 'div');
  makeEl('form-delivery-amount', 'span');
  makeEl('form-payment-status', 'span');

  // Modal rápido de estado
  makeEl('dialog-change-order-status', 'dialog');
  makeEl('status-modal-order-id', 'span');
  makeEl('status-modal-client-name', 'span');
  makeEl('status-modal-current-badge', 'span');
  makeEl('status-modal-buttons-container', 'div');

  const doc = {
    getElementById(id) {
      if (!elements[id]) {
        return makeEl(id);
      }
      return elements[id];
    },
    createElement(tag) {
      return makeEl(`elem-${Date.now()}-${Math.random()}`, tag);
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    body: { appendChild() {} }
  };

  return { doc, elements };
}

describe('Spec 037 — Preservación de Checkboxes (Desc. Volumen, IVA, Delivery) al Avanzar o Modificar Estado', () => {
  let storage;
  let sales;
  let ui;
  let dom;

  beforeEach(() => {
    global.window = global;
    global.localStorage = createMockLocalStorage();
    dom = createMinimalDOM();
    global.document = dom.doc;
    global.alert = () => {};
    global.confirm = () => true;

    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    sales = require('../assets/js/sales.js');
    ui = require('../assets/js/ui.js');

    global.NovaprintStorage = storage;
    global.NovaprintSales = sales;
    global.NovaprintUI = ui;
    global.NovaprintMain = { refrescarDatos: () => {} };
  });

  describe('1. Contrato de Totales en sales.js', () => {
    it('calcularTotalesPedido debe exportar explícitamente applyDiscount según las opciones', () => {
      const items = [{ quantity: 12, unitPrice: 10000 }];

      // Con descuento por volumen activado
      const conDesc = sales.calcularTotalesPedido(items, 0, {
        aplicarDescuentoVolumen: true,
        aplicarIva: true,
        montoDelivery: 5000
      });
      assert.strictEqual(conDesc.applyDiscount, true);
      assert.strictEqual(conDesc.applyIva, true);
      assert.strictEqual(conDesc.applyDelivery, true);
      assert.strictEqual(conDesc.volumeDiscountPercent, 10);
      assert.strictEqual(conDesc.volumeDiscountAmount, 12000);

      // Con descuento por volumen desactivado por el usuario
      const sinDesc = sales.calcularTotalesPedido(items, 0, {
        aplicarDescuentoVolumen: false,
        aplicarIva: false,
        montoDelivery: 0
      });
      assert.strictEqual(sinDesc.applyDiscount, false);
      assert.strictEqual(sinDesc.applyIva, false);
      assert.strictEqual(sinDesc.applyDelivery, false);
      assert.strictEqual(sinDesc.volumeDiscountPercent, 0);
      assert.strictEqual(sinDesc.volumeDiscountAmount, 0);
    });
  });

  describe('2. Preservación en Formulario al Editar / Modificar Estado', () => {
    it('editarPedido debe restaurar los 3 checkboxes con los valores con que se guardó el pedido (sin descuento)', () => {
      const pedidoSinDesc = storage.saveOrder({
        id: 'NP-20261111-001',
        clientId: 'CLI-001',
        items: [{ garmentType: 'Polera', color: 'Negro', size: 'L', quantity: 20, unitPrice: 5000 }],
        totals: {
          subtotalBruto: 100000,
          applyDiscount: false, // El vendedor desmarcó descuento por volumen
          volumeDiscountPercent: 0,
          volumeDiscountAmount: 0,
          netAmount: 100000,
          applyIva: true, // Marcó IVA
          ivaAmount: 19000,
          applyDelivery: false, // Sin delivery
          deliveryAmount: 0,
          totalAmount: 119000,
          depositAmount: 50000,
          balanceAmount: 69000,
          paymentStatus: 'Abonado'
        },
        status: 'Cotización'
      });

      ui.editarPedido(pedidoSinDesc.id);

      // Verificar que los checkboxes restaurados coinciden fielmente
      assert.strictEqual(dom.elements['form-apply-discount'].checked, false, 'Desc. Volumen debe permanecer desmarcado');
      assert.strictEqual(dom.elements['order-apply-iva'].checked, true, 'Aplica IVA debe permanecer marcado');
      assert.strictEqual(dom.elements['order-apply-delivery'].checked, false, 'Aplica Delivery debe permanecer desmarcado');
    });

    it('editarPedido debe restaurar los 3 checkboxes cuando todos están activos', () => {
      const pedidoFull = storage.saveOrder({
        id: 'NP-20261111-002',
        clientId: 'CLI-002',
        items: [{ garmentType: 'Polerón', color: 'Azul', size: 'XL', quantity: 15, unitPrice: 15000 }],
        totals: {
          subtotalBruto: 225000,
          applyDiscount: true,
          volumeDiscountPercent: 10,
          volumeDiscountAmount: 22500,
          netAmount: 202500,
          applyIva: true,
          ivaAmount: 38475,
          applyDelivery: true,
          deliveryAmount: 6000,
          totalAmount: 246975,
          depositAmount: 100000,
          balanceAmount: 146975,
          paymentStatus: 'Abonado'
        },
        status: 'Confirmado'
      });

      ui.editarPedido(pedidoFull.id);

      assert.strictEqual(dom.elements['form-apply-discount'].checked, true, 'Desc. Volumen debe estar marcado');
      assert.strictEqual(dom.elements['order-apply-iva'].checked, true, 'Aplica IVA debe estar marcado');
      assert.strictEqual(dom.elements['order-apply-delivery'].checked, true, 'Aplica Delivery debe estar marcado');
      assert.strictEqual(Number(dom.elements['order-delivery-input'].value), 6000, 'Monto Delivery debe ser $6.000');
    });
  });

  describe('3. Preservación al Avanzar Estado o Cambiar Estado Rápido', () => {
    it('NovaprintUI.cambiarEstado y storage.updateOrderStatus deben preservar applyDiscount, applyIva y applyDelivery intactos', () => {
      const pedidoOriginal = storage.saveOrder({
        id: 'NP-20261111-003',
        clientId: 'CLI-003',
        items: [{ garmentType: 'Gorra', color: 'Rojo', size: 'U', quantity: 30, unitPrice: 4000 }],
        totals: {
          subtotalBruto: 120000,
          applyDiscount: false, // Sin descuento
          volumeDiscountPercent: 0,
          volumeDiscountAmount: 0,
          netAmount: 120000,
          applyIva: true,
          ivaAmount: 22800,
          applyDelivery: true,
          deliveryAmount: 4500,
          totalAmount: 147300,
          depositAmount: 147300,
          balanceAmount: 0,
          paymentStatus: 'Pagado Total'
        },
        status: 'Cotización'
      });

      // Avanzar estado a 'Confirmado'
      ui.cambiarEstado(pedidoOriginal.id, 'Confirmado');

      const pedidoActualizado = storage.getOrderById(pedidoOriginal.id);
      assert.strictEqual(pedidoActualizado.status, 'Confirmado');

      // Las selecciones comerciales y montos NO deben haber cambiado
      assert.strictEqual(pedidoActualizado.totals.applyDiscount, false);
      assert.strictEqual(pedidoActualizado.totals.applyIva, true);
      assert.strictEqual(pedidoActualizado.totals.applyDelivery, true);
      assert.strictEqual(pedidoActualizado.totals.deliveryAmount, 4500);
      assert.strictEqual(pedidoActualizado.totals.totalAmount, 147300);
      assert.strictEqual(pedidoActualizado.totals.balanceAmount, 0);

      // Avanzar estado a 'En producción' mediante modal rápido
      ui.seleccionarNuevoEstado(pedidoOriginal.id, 'En producción');

      const pedidoProduccion = storage.getOrderById(pedidoOriginal.id);
      assert.strictEqual(pedidoProduccion.status, 'En producción');
      assert.strictEqual(pedidoProduccion.totals.applyDiscount, false);
      assert.strictEqual(pedidoProduccion.totals.applyIva, true);
      assert.strictEqual(pedidoProduccion.totals.applyDelivery, true);
      assert.strictEqual(pedidoProduccion.totals.deliveryAmount, 4500);
    });
  });

  describe('4. Preservación al Duplicar Pedido', () => {
    it('duplicarPedido debe clonar los 3 checkboxes con los mismos valores del pedido base', () => {
      const pedido = storage.saveOrder({
        id: 'NP-20261111-004',
        clientId: 'CLI-004',
        items: [{ garmentType: 'Polera', color: 'Blanco', size: 'S', quantity: 50, unitPrice: 3500 }],
        totals: {
          subtotalBruto: 175000,
          applyDiscount: false, // Desmarcado
          volumeDiscountAmount: 0,
          applyIva: false, // Desmarcado
          ivaAmount: 0,
          applyDelivery: true, // Marcado
          deliveryAmount: 7000,
          totalAmount: 182000,
          depositAmount: 0,
          balanceAmount: 182000
        },
        status: 'Cotización'
      });

      ui.duplicarPedido(pedido.id);

      assert.strictEqual(dom.elements['form-apply-discount'].checked, false, 'Desc. Volumen clonado debe ser false');
      assert.strictEqual(dom.elements['order-apply-iva'].checked, false, 'IVA clonado debe ser false');
      assert.strictEqual(dom.elements['order-apply-delivery'].checked, true, 'Delivery clonado debe ser true');
      assert.strictEqual(Number(dom.elements['order-delivery-input'].value), 7000);
    });
  });
});
