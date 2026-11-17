const { test, describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Spec 049 — Descuento por Volumen Editable en Pedido (sales.js, ui.js, index.html)', () => {
  let sales;
  let storage;
  let dom;

  function setupMockDOM() {
    const elements = {};

    function makeEl(id, tagName = 'div') {
      const el = {
        id,
        tagName: tagName.toUpperCase(),
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); },
          toggle(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); }
        },
        children: [],
        appendChild(child) {
          this.children.push(child);
          return child;
        },
        removeChild(child) {
          const idx = this.children.indexOf(child);
          if (idx !== -1) this.children.splice(idx, 1);
          return child;
        },
        dataset: {},
        value: '',
        checked: false,
        textContent: '',
        innerHTML: '',
        open: false,
        style: {},
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k] || null; },
        showModal() { this.open = true; },
        close() { this.open = false; },
        reset() {
          this.value = '';
          this.checked = false;
        },
        focus() {}
      };
      elements[id] = el;
      return el;
    }

    makeEl('dialog-order', 'dialog');
    makeEl('form-order', 'form');
    makeEl('order-modal-title', 'h3');
    makeEl('order-id-display', 'span');
    makeEl('order-client-select', 'select');
    makeEl('order-delivery-date', 'input');
    makeEl('order-status-select', 'select');
    makeEl('order-notes-input', 'textarea');
    makeEl('order-deposit-input', 'input');
    makeEl('form-total-quantity', 'span');
    makeEl('form-total-amount', 'span');
    makeEl('form-balance-amount', 'span');
    makeEl('form-subtotal-container', 'div');
    makeEl('form-subtotal-amount', 'span');
    makeEl('form-discount-container', 'div');
    makeEl('form-apply-discount', 'input');
    makeEl('form-discount-badge', 'span');
    makeEl('form-discount-percent-input', 'input');
    makeEl('form-discount-label', 'span');
    makeEl('form-discount-amount', 'span');
    makeEl('form-neto-container', 'div');
    makeEl('form-neto-amount', 'span');
    makeEl('order-apply-iva', 'input');
    makeEl('form-iva-row', 'div');
    makeEl('form-iva-amount', 'span');
    makeEl('order-apply-delivery', 'input');
    makeEl('order-delivery-input', 'input');
    makeEl('order-delivery-input-container', 'div');
    makeEl('form-delivery-row', 'div');
    makeEl('form-delivery-amount', 'span');
    makeEl('form-payment-status', 'span');
    makeEl('order-items-tbody', 'tbody');

    const fakeDoc = {
      getElementById(id) {
        if (!elements[id]) {
          return makeEl(id);
        }
        return elements[id];
      },
      querySelectorAll() {
        return [];
      },
      querySelector() {
        return null;
      },
      createElement(tag) {
        return makeEl(`elem-${Date.now()}-${Math.random()}`, tag);
      },
      activeElement: null
    };

    return {
      elements,
      document: fakeDoc
    };
  }

  before(() => {
    // Configurar entorno global antes de requerir módulos
    global.window = global;
    global.localStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    };

    dom = setupMockDOM();
    global.document = dom.document;

    // Cargar storage y sales
    require(path.join(__dirname, '../assets/js/storage.js'));
    storage = global.NovaprintStorage;

    require(path.join(__dirname, '../assets/js/sales.js'));
    sales = global.NovaprintSales;

    require(path.join(__dirname, '../assets/js/ui.js'));
  });

  beforeEach(() => {
    global.localStorage.clear();
    dom = setupMockDOM();
    global.document = dom.document;
  });

  describe('1. Lógica Financiera en sales.calcularTotalesPedido', () => {
    it('aplica porcentaje manual cuando aplicarDescuentoVolumen es true y porcentajeDescuentoManual está definido', () => {
      const items = [
        { id: 1, garmentType: 'Polera', color: 'Negro', size: 'M', quantity: 10, unitPrice: 10000, total: 100000 }
      ];

      // Sin porcentaje manual para 10 prendas sugeriría 5%
      const resAuto = sales.calcularTotalesPedido(items, 0, { aplicarDescuentoVolumen: true });
      assert.strictEqual(resAuto.volumeDiscountPercent, 5);
      assert.strictEqual(resAuto.volumeDiscountAmount, 5000);
      assert.strictEqual(resAuto.netAmount, 95000);

      // Con porcentaje manual del 12% otorgado por el vendedor
      const resManual = sales.calcularTotalesPedido(items, 0, {
        aplicarDescuentoVolumen: true,
        porcentajeDescuentoManual: 12
      });
      assert.strictEqual(resManual.volumeDiscountPercent, 12);
      assert.strictEqual(resManual.volumeDiscountAmount, 12000);
      assert.strictEqual(resManual.netAmount, 88000);
      assert.strictEqual(resManual.totalAmount, 88000);
      assert.strictEqual(resManual.balanceAmount, 88000);
    });

    it('no aplica descuento si el vendedor desmarca la casilla aplicarDescuentoVolumen aunque haya porcentaje manual', () => {
      const items = [
        { id: 1, garmentType: 'Polera', color: 'Negro', size: 'M', quantity: 10, unitPrice: 10000, total: 100000 }
      ];

      const res = sales.calcularTotalesPedido(items, 0, {
        aplicarDescuentoVolumen: false,
        porcentajeDescuentoManual: 15
      });
      assert.strictEqual(res.applyDiscount, false);
      assert.strictEqual(res.volumeDiscountPercent, 0);
      assert.strictEqual(res.volumeDiscountAmount, 0);
      assert.strictEqual(res.netAmount, 100000);
      assert.strictEqual(res.totalAmount, 100000);
    });

    it('calcula correctamente IVA y Delivery combinados con porcentaje de descuento manual', () => {
      const items = [
        { id: 1, garmentType: 'Polerón Canguro', color: 'Gris', size: 'L', quantity: 20, unitPrice: 20000, total: 400000 }
      ];

      // 20 prendas con 10% manual: Subtotal 400.000, Descuento 40.000, Neto 360.000
      // IVA 19% sobre 360.000 = 68.400, Delivery 5.000 -> Total = 360.000 + 68.400 + 5.000 = 433.400
      const res = sales.calcularTotalesPedido(items, 100000, {
        aplicarDescuentoVolumen: true,
        porcentajeDescuentoManual: 10,
        aplicarIva: true,
        montoDelivery: 5000
      });

      assert.strictEqual(res.subtotalBruto, 400000);
      assert.strictEqual(res.volumeDiscountPercent, 10);
      assert.strictEqual(res.volumeDiscountAmount, 40000);
      assert.strictEqual(res.netAmount, 360000);
      assert.strictEqual(res.ivaAmount, 68400);
      assert.strictEqual(res.deliveryAmount, 5000);
      assert.strictEqual(res.totalAmount, 433400);
      assert.strictEqual(res.depositAmount, 100000);
      assert.strictEqual(res.balanceAmount, 333400);
    });
  });

  describe('2. Estructura de index.html', () => {
    it('index.html contiene el contenedor permanente, checkbox, input editable y badges de descuento', () => {
      const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

      assert.match(htmlContent, /id="form-discount-container"/, 'Debe contener form-discount-container');
      assert.match(htmlContent, /id="form-apply-discount"/, 'Debe contener form-apply-discount');
      assert.match(htmlContent, /id="form-discount-percent-input"/, 'Debe contener form-discount-percent-input');
      assert.match(htmlContent, /id="form-discount-badge"/, 'Debe contener form-discount-badge');
      assert.match(htmlContent, /id="form-discount-amount"/, 'Debe contener form-discount-amount');
      assert.match(htmlContent, /id="form-discount-label"/, 'Debe contener form-discount-label');
      assert.match(htmlContent, /NovaprintUI\.recalcularTotalesFormulario\(true\)/, 'El input debe invocar recalcularTotalesFormulario(true)');
    });
  });

  describe('3. Reactividad en ui.js', () => {
    it('sugiere porcentaje de la escala automáticamente al añadir prendas si el vendedor no ha editado manualmente', () => {
      const ui = global.NovaprintUI;
      assert.ok(ui, 'NovaprintUI debe estar disponible');

      // Simular apertura de modal nuevo pedido
      ui.abrirModalNuevoPedido();
      const checkDesc = dom.elements['form-apply-discount'];
      const percentInput = dom.elements['form-discount-percent-input'];
      const badge = dom.elements['form-discount-badge'];

      assert.strictEqual(checkDesc.checked, true, 'Debe estar marcado por defecto');
      assert.ok(badge.textContent.includes('Escala'), 'El badge debe decir Escala');

      // Modificar el porcentaje manualmente
      percentInput.value = '15';
      ui.recalcularTotalesFormulario(true);

      assert.strictEqual(badge.textContent, 'Manual', 'El badge debe reflejar Manual tras edición');
    });

    it('al desmarcar form-apply-discount el badge pasa a Inactivo y el ahorro es $0', () => {
      const ui = global.NovaprintUI;
      ui.abrirModalNuevoPedido();

      const checkDesc = dom.elements['form-apply-discount'];
      const badge = dom.elements['form-discount-badge'];
      const amountEl = dom.elements['form-discount-amount'];

      checkDesc.checked = false;
      ui.recalcularTotalesFormulario();

      assert.strictEqual(badge.textContent, 'Inactivo');
      assert.ok(amountEl.textContent.includes('0'), 'Ahorro debe ser $0');
    });

    it('editarPedido restaura el porcentaje y activa el modo manual preservando el valor', () => {
      const ui = global.NovaprintUI;

      // Crear un pedido de prueba con 18% de descuento
      const pedidoMock = {
        id: 'PED-TEST-049',
        clientId: 'CLI-001',
        clientName: 'Cliente Test',
        items: [
          { id: 1, garmentType: 'Polera', color: 'Negro', size: 'M', quantity: 10, unitPrice: 10000, total: 100000 }
        ],
        totals: {
          subtotalBruto: 100000,
          applyDiscount: true,
          volumeDiscountPercent: 18,
          volumeDiscountAmount: 18000,
          netAmount: 82000,
          totalAmount: 82000,
          balanceAmount: 82000,
          depositAmount: 0
        },
        status: 'Cotización'
      };

      storage.saveOrder(pedidoMock);
      ui.editarPedido(pedidoMock.id);

      const percentInput = dom.elements['form-discount-percent-input'];
      const badge = dom.elements['form-discount-badge'];
      const amountEl = dom.elements['form-discount-amount'];

      assert.strictEqual(Number(percentInput.value), 18, 'El input debe cargarse con 18%');
      assert.strictEqual(badge.textContent, 'Manual', 'El badge debe marcar Manual al ser restaurado');
      assert.ok(amountEl.textContent.includes('18.000'), 'El monto debe reflejar $18.000');
    });
  });
});
