// tests/journal_crud_duplicate.test.js
// Spec 035 — CRUD Completo y Acción Duplicar en el Libro Diario de Movimientos Contables

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

// Mock de localStorage
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

  // Elementos del Libro Diario
  makeEl('acc-journal-tbody', 'tbody');
  makeEl('acc-journal-count', 'span');
  makeEl('acc-journal-filter-type', 'select');
  makeEl('acc-journal-filter-month', 'input');
  makeEl('acc-journal-filter-account', 'select');

  // Modales y formularios
  makeEl('dialog-order', 'dialog');
  makeEl('order-modal-title', 'h3');
  makeEl('order-id-display', 'span');
  makeEl('order-client-select', 'select');
  makeEl('order-delivery-date', 'input');
  makeEl('order-status-select', 'select');
  makeEl('order-notes-input', 'textarea');
  makeEl('order-deposit-input', 'input');
  makeEl('order-apply-iva', 'input');
  makeEl('order-apply-delivery', 'input');
  makeEl('order-delivery-input', 'input');
  makeEl('order-delivery-input-container', 'div');
  makeEl('order-items-tbody', 'tbody');
  makeEl('order-summary-subtotal', 'span');
  makeEl('order-summary-iva', 'span');
  makeEl('order-summary-delivery', 'span');
  makeEl('order-summary-total', 'span');
  makeEl('order-summary-balance', 'span');

  makeEl('dialog-purchase', 'dialog');
  makeEl('form-purchase', 'form');
  makeEl('purchase-id-hidden', 'input');
  makeEl('purchase-modal-title', 'h3');
  makeEl('purchase-modal-subtitle', 'p');
  makeEl('btn-submit-purchase', 'button');
  makeEl('purchase-supplier-select', 'select');
  makeEl('purchase-date-input', 'input');
  makeEl('purchase-invoice-input', 'input');
  makeEl('purchase-notes-input', 'textarea');
  makeEl('purchase-apply-iva', 'input');
  makeEl('purchase-apply-delivery', 'input');
  makeEl('purchase-delivery-input', 'input');
  makeEl('purchase-delivery-input-container', 'div');
  makeEl('purchase-items-tbody', 'tbody');
  makeEl('purchase-summary-subtotal', 'span');
  makeEl('purchase-summary-iva', 'span');
  makeEl('purchase-summary-delivery', 'span');
  makeEl('purchase-summary-total', 'span');

  makeEl('dialog-expense', 'dialog');
  makeEl('form-expense', 'form');
  makeEl('expense-id-hidden', 'input');
  makeEl('expense-date-input', 'input');
  makeEl('expense-category-select', 'select');
  makeEl('expense-desc-input', 'input');
  makeEl('expense-amount-input', 'input');
  makeEl('expense-payment-method', 'select');
  makeEl('expense-notes-input', 'textarea');
  makeEl('expense-modal-title', 'h3');

  makeEl('dialog-transfer', 'dialog');
  makeEl('transfer-id-hidden', 'input');
  makeEl('transfer-source-account', 'select');
  makeEl('transfer-destination-account', 'select');
  makeEl('transfer-amount', 'input');
  makeEl('transfer-date', 'input');
  makeEl('transfer-description', 'input');
  makeEl('transfer-reference', 'input');
  makeEl('transfer-preview-debe-acc', 'span');
  makeEl('transfer-preview-debe-amount', 'span');
  makeEl('transfer-preview-haber-acc', 'span');
  makeEl('transfer-preview-haber-amount', 'span');
  makeEl('transfer-preview-balance-tag', 'span');

  makeEl('toast-container', 'div');

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
    querySelectorAll(selector) {
      return [];
    },
    querySelector(selector) {
      return null;
    },
    body: {
      appendChild() {}
    }
  };

  return { doc, elements };
}

describe('Spec 035 — CRUD Completo y Acción Duplicar en el Libro Diario', () => {
  let storage;
  let accounting;
  let sales;
  let ui;
  let dom;

  beforeEach(() => {
    // Configurar sandbox global
    global.window = global;
    global.localStorage = createMockLocalStorage();
    dom = createMinimalDOM();
    global.document = dom.doc;
    global.alert = () => {};
    global.confirm = () => true;

    // Cargar módulos
    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/accounting.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    accounting = require('../assets/js/accounting.js');
    sales = require('../assets/js/sales.js');
    ui = require('../assets/js/ui.js');

    global.NovaprintStorage = storage;
    global.NovaprintAccounting = accounting;
    global.NovaprintSales = sales;
    global.NovaprintUI = ui;
    global.NovaprintMain = { refrescarDatos: () => {} };
  });

  describe('1. Renderizado de Acciones CRUD y Duplicar en Libro Diario', () => {
    it('debe renderizar botones Editar [✏️], Duplicar [📋] y Eliminar [🗑️] para todos los tipos de asientos', () => {
      const mockAsientos = [
        {
          id: 'AS-NP-20261102-003',
          referenciaId: 'NP-20261102-003',
          tipo: 'Ingreso',
          concepto: 'Venta Poleras Colegio',
          cuentaDebe: '1105 - Clientes',
          cuentaHaber: '4101 - Venta',
          debe: 207000,
          haber: 207000,
          fecha: '2026-11-02'
        },
        {
          id: 'AS-CMP-001',
          referenciaId: 'CMP-20261102-001',
          tipo: 'Costo',
          concepto: 'Compra Insumos DTF',
          cuentaDebe: '5101 - Costos',
          cuentaHaber: '1101 - Banco',
          debe: 55000,
          haber: 55000,
          fecha: '2026-11-02'
        },
        {
          id: 'AS-EXP-001',
          referenciaId: 'EXP-20261102-001',
          tipo: 'Gasto',
          concepto: 'Gasto Luz y Energía',
          cuentaDebe: '5201 - Luz',
          cuentaHaber: '1101 - Banco',
          debe: 35000,
          haber: 35000,
          fecha: '2026-11-02'
        },
        {
          id: 'AS-TRF-001',
          referenciaId: 'TRF-20261102-001',
          tipo: 'Transferencia',
          concepto: 'Traspaso Caja a Banco',
          cuentaDebe: '1101 - Banco',
          cuentaHaber: '1102 - Caja',
          debe: 100000,
          haber: 100000,
          fecha: '2026-11-02'
        }
      ];

      ui.renderAccountingJournal(mockAsientos, sales);

      const tbody = dom.elements['acc-journal-tbody'];
      const html = tbody.innerHTML;

      // Ningún registro debe mostrar "-" o "Auto"
      assert.strictEqual(html.includes('>Auto<'), false, 'No debe haber texto "Auto" en la columna de acciones');
      assert.strictEqual(html.includes('>-<'), false, 'No debe haber guión "-" en la columna de acciones');

      // Debe contener llamadas a Editar
      assert.ok(html.includes("NovaprintUI.editarPedido('NP-20261102-003')"), 'Debe tener botón editar pedido');
      assert.ok(html.includes("NovaprintUI.editarCompra('CMP-20261102-001')"), 'Debe tener botón editar compra');
      assert.ok(html.includes("NovaprintUI.editarGasto('EXP-20261102-001')"), 'Debe tener botón editar gasto');
      assert.ok(html.includes("NovaprintUI.editarTransferencia('TRF-20261102-001')"), 'Debe tener botón editar transferencia');

      // Debe contener llamadas a Duplicar
      assert.ok(html.includes("NovaprintUI.duplicarPedido('NP-20261102-003')"), 'Debe tener botón duplicar pedido');
      assert.ok(html.includes("NovaprintUI.duplicarCompra('CMP-20261102-001')"), 'Debe tener botón duplicar compra');
      assert.ok(html.includes("NovaprintUI.duplicarGasto('EXP-20261102-001')"), 'Debe tener botón duplicar gasto');
      assert.ok(html.includes("NovaprintUI.duplicarTransferencia('TRF-20261102-001')"), 'Debe tener botón duplicar transferencia');

      // Debe contener llamadas a Eliminar
      assert.ok(html.includes("NovaprintUI.confirmarEliminarPedido('NP-20261102-003')"), 'Debe tener botón eliminar pedido');
      assert.ok(html.includes("NovaprintUI.confirmarEliminarCompra('CMP-20261102-001')"), 'Debe tener botón eliminar compra');
      assert.ok(html.includes("NovaprintUI.confirmarEliminarGasto('EXP-20261102-001')"), 'Debe tener botón eliminar gasto');
      assert.ok(html.includes("NovaprintUI.confirmarEliminarTransferencia('TRF-20261102-001')"), 'Debe tener botón eliminar transferencia');
    });
  });

  describe('2. Controladores de Gastos (Editar y Duplicar)', () => {
    it('editarGasto debe precargar el ID existente y abrir dialog-expense', () => {
      const gasto = storage.saveExpense({
        date: '2026-11-05',
        category: 'Insumos Taller',
        description: 'Cintas térmicas de estampado',
        amount: 18500,
        paymentMethod: 'Efectivo / Caja Chica',
        notes: 'Compra urgente local'
      });

      ui.editarGasto(gasto.id);

      assert.strictEqual(dom.elements['expense-id-hidden'].value, gasto.id);
      assert.strictEqual(dom.elements['expense-desc-input'].value, 'Cintas térmicas de estampado');
      assert.strictEqual(Number(dom.elements['expense-amount-input'].value), 18500);
      assert.strictEqual(dom.elements['expense-category-select'].value, 'Insumos Taller');
      assert.strictEqual(dom.elements['dialog-expense'].open, true);
    });

    it('duplicarGasto debe clonar los datos, agregar sufijo de copia y limpiar el ID para crear uno nuevo', () => {
      const gasto = storage.saveExpense({
        date: '2026-11-05',
        category: 'Servicios Básicos',
        description: 'Internet Fibra Óptica Taller',
        amount: 29990,
        paymentMethod: 'Transferencia / Banco',
        notes: 'Plan mensual'
      });

      ui.duplicarGasto(gasto.id);

      assert.strictEqual(dom.elements['expense-id-hidden'].value, '', 'El ID oculto debe quedar vacío para crear nuevo registro');
      assert.ok(dom.elements['expense-desc-input'].value.includes('(Copia)'), 'La descripción debe indicar que es copia');
      assert.strictEqual(Number(dom.elements['expense-amount-input'].value), 29990);
      assert.strictEqual(dom.elements['expense-category-select'].value, 'Servicios Básicos');
      assert.strictEqual(dom.elements['dialog-expense'].open, true);
    });
  });

  describe('3. Controladores de Transferencias (Editar y Duplicar)', () => {
    it('editarTransferencia debe precargar el ID de transferencia y los campos en dialog-transfer', () => {
      const trf = storage.saveTransfer({
        date: '2026-11-08',
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1102',
        amount: 75000,
        description: 'Retiro para caja menor',
        reference: 'CHQ-889'
      });

      ui.editarTransferencia(trf.id);

      assert.strictEqual(dom.elements['transfer-id-hidden'].value, trf.id);
      assert.strictEqual(Number(dom.elements['transfer-amount'].value), 75000);
      assert.strictEqual(dom.elements['transfer-description'].value, 'Retiro para caja menor');
      assert.strictEqual(dom.elements['transfer-reference'].value, 'CHQ-889');
      assert.strictEqual(dom.elements['dialog-transfer'].open, true);
    });

    it('duplicarTransferencia debe clonar montos y cuentas, limpiar ID y agregar sufijo de copia', () => {
      const trf = storage.saveTransfer({
        date: '2026-11-08',
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1102',
        amount: 50000,
        description: 'Reposición caja chica',
        reference: 'TRF-001'
      });

      ui.duplicarTransferencia(trf.id);

      assert.strictEqual(dom.elements['transfer-id-hidden'].value, '', 'ID oculto debe quedar vacío');
      assert.strictEqual(Number(dom.elements['transfer-amount'].value), 50000);
      assert.ok(dom.elements['transfer-description'].value.includes('(Copia)'), 'Descripción debe incluir (Copia)');
      assert.strictEqual(dom.elements['dialog-transfer'].open, true);
    });
  });

  describe('4. Controladores de Pedidos y Compras (Duplicar)', () => {
    it('duplicarPedido debe clonar ítems, limpiar editingOrderId y abrir dialog-order', () => {
      const pedidoOriginal = storage.saveOrder({
        id: 'NP-20261102-099',
        clientId: 'CLI-001',
        items: [
          { garmentType: 'Polera Polo', color: 'Negro', size: 'M', quantity: 15, unitPrice: 8500, printTechnique: 'DTF Pecho' }
        ],
        totals: {
          subtotalNeto: 127500,
          applyIva: true,
          ivaAmount: 24225,
          applyDelivery: false,
          totalAmount: 151725,
          depositAmount: 50000,
          balanceDue: 101725
        },
        dates: {
          createdAt: '2026-11-02',
          deliveryDate: '2026-11-15'
        },
        status: 'Confirmado',
        notes: 'Bordado en manga adicional'
      });

      ui.duplicarPedido(pedidoOriginal.id);

      assert.strictEqual(dom.elements['dialog-order'].open, true);
      assert.ok(dom.elements['order-modal-title'].textContent.includes('Duplicar Pedido'));
      assert.strictEqual(dom.elements['order-id-display'].textContent, 'Nuevo (Copia)');
      assert.strictEqual(dom.elements['order-client-select'].value, 'CLI-001');
      assert.strictEqual(dom.elements['order-status-select'].value, 'Cotización', 'Nuevo pedido duplicado debe iniciar como Cotización');
      assert.strictEqual(Number(dom.elements['order-deposit-input'].value), 0, 'Abono debe iniciar en 0 para pedido nuevo');
      assert.ok(dom.elements['order-notes-input'].value.includes('Copia de pedido NP-20261102-099'));
    });

    it('duplicarCompra debe clonar proveedor e ítems, limpiar ID y abrir dialog-purchase', () => {
      const compraOriginal = storage.savePurchase({
        supplierId: 'SUP-001',
        supplierName: 'Textil Chile Ltda',
        invoiceNumber: 'FAC-9988',
        date: '2026-11-01',
        items: [
          { name: 'Polera Algodón Negra L', quantity: 50, unitCost: 2800, subtotal: 140000 }
        ],
        subtotalNeto: 140000,
        applyIva: true,
        ivaPercent: 19,
        ivaAmount: 26600,
        applyDelivery: true,
        deliveryAmount: 5000,
        totalAmount: 171600,
        notes: 'Pedido mensual mayorista'
      });

      ui.duplicarCompra(compraOriginal.id);

      assert.strictEqual(dom.elements['dialog-purchase'].open, true);
      assert.strictEqual(dom.elements['purchase-id-hidden'].value, '', 'El ID de compra debe quedar vacío para crear una nueva');
      assert.ok(dom.elements['purchase-invoice-input'].value.includes('-COPIA'));
      assert.ok(dom.elements['purchase-notes-input'].value.includes(`Copia de compra ${compraOriginal.id}`));
      assert.strictEqual(dom.elements['purchase-supplier-select'].value, 'SUP-001');
    });
  });
});
