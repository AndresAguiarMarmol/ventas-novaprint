/**
 * tests/split_purchase_edit_items.test.js — Pruebas unitarias para Spec 034
 * Edición interactiva de cantidad y costo unitario al separar compras en 2 facturas.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function createLocalStorageMock() {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _dump: () => ({ ...store })
  };
}

function createMinimalDOM() {
  const elements = {};

  const getOrCreate = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        value: '',
        checked: false,
        textContent: '',
        innerHTML: '',
        className: '',
        style: {},
        selectedIndex: 0,
        options: [
          { value: 'PRV-TEXTIL', textContent: 'Textiles Mayoristas', getAttribute: () => 'Textiles Mayoristas' },
          { value: 'PRV-DTF', textContent: 'DTF Gráficos', getAttribute: () => 'DTF Gráficos' }
        ],
        selectedOptions: [{ textContent: 'Proveedor Test' }],
        children: [],
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false
        },
        addEventListener: () => {},
        reset: () => {},
        showModal: () => {},
        close: () => {},
        appendChild: (child) => {
          if (!elements[id].children) elements[id].children = [];
          elements[id].children.push(child);
        },
        removeChild: () => {},
        remove: () => {}
      };
    }
    return elements[id];
  };

  return {
    getElementById: (id) => getOrCreate(id),
    createElement: (tag) => ({
      tagName: tag,
      className: '',
      textContent: '',
      style: {},
      appendChild: () => {},
      removeChild: () => {},
      remove: () => {},
      classList: { add: () => {}, remove: () => {} }
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    _elements: elements
  };
}

describe('Spec 034 — Edición Interactiva de Cantidad y Costo en Separación de Compras', () => {
  let storage;
  let production;
  let sales;
  let ui;
  let dom;

  beforeEach(() => {
    const mockStorage = createLocalStorageMock();
    global.localStorage = mockStorage;
    global.window = { localStorage: mockStorage };
    dom = createMinimalDOM();
    global.document = dom;

    const storagePath = path.resolve(__dirname, '../assets/js/storage.js');
    const productionPath = path.resolve(__dirname, '../assets/js/production.js');
    const salesPath = path.resolve(__dirname, '../assets/js/sales.js');
    const uiPath = path.resolve(__dirname, '../assets/js/ui.js');

    delete require.cache[require.resolve(storagePath)];
    delete require.cache[require.resolve(productionPath)];
    delete require.cache[require.resolve(salesPath)];
    delete require.cache[require.resolve(uiPath)];

    storage = require(storagePath);
    production = require(productionPath);
    sales = require(salesPath);
    ui = require(uiPath);

    global.NovaprintStorage = storage;
    global.NovaprintProduction = production;
    global.NovaprintSales = sales;
    global.NovaprintUI = ui;

    // Poblar proveedores para selección en modales
    storage.saveSupplier({ id: 'PRV-TEXTIL', name: 'Textiles Bellavista', category: 'Prendas Lisas' });
    storage.saveSupplier({ id: 'PRV-DTF', name: 'Grafica DTF Sur', category: 'Insumos DTF' });

    // Poblar inventario inicial
    storage.saveInventoryItem({ id: 'INV-POL-01', name: 'Polera Blanca Algodón M', category: 'Prendas Lisas', currentStock: 0, unitCost: 3500 });
    storage.saveInventoryItem({ id: 'INV-DTF-01', name: 'Estampado DTF Adelante', category: 'Insumos DTF', currentStock: 0, unitCost: 1800 });
  });

  describe('Renderizado de Inputs de Cantidad y Costo', () => {
    it('abrirModalSepararCompra genera inputs de cantidad y costo en lugar de celdas estáticas', () => {
      // Registrar una compra mixta en storage
      const compraMixta = {
        id: 'CMP-MIXTA-01',
        supplierName: 'Distribuidora Global',
        invoiceNumber: 'FAC-991',
        date: '2026-11-11',
        items: [
          { inventoryItemId: 'INV-POL-01', name: 'Polera Blanca Algodón M', quantity: 20, unitCost: 3500 },
          { inventoryItemId: 'INV-DTF-01', name: 'Estampado DTF Adelante', quantity: 20, unitCost: 1800 }
        ],
        totalAmount: 106000
      };
      storage.savePurchase(compraMixta);

      // Abrir modal de separación
      ui.abrirModalSepararCompra('CMP-MIXTA-01');

      // Verificar tabla de Poleras
      const tbodyPoleras = dom.getElementById('split-items-poleras-tbody');
      assert.ok(tbodyPoleras.innerHTML.includes('<input type="number"'), 'Debe contener inputs numéricos en poleras');
      assert.ok(tbodyPoleras.innerHTML.includes("actualizarItemSplit('poleras', 0, 'quantity'"), 'Debe enlazar handler de cantidad');
      assert.ok(tbodyPoleras.innerHTML.includes("actualizarItemSplit('poleras', 0, 'unitCost'"), 'Debe enlazar handler de costo');
      assert.ok(tbodyPoleras.innerHTML.includes('split-subtotal-poleras-0'), 'Debe tener id en celda de subtotal');

      // Verificar tabla de DTF
      const tbodyDtf = dom.getElementById('split-items-dtf-tbody');
      assert.ok(tbodyDtf.innerHTML.includes('<input type="number"'), 'Debe contener inputs numéricos en DTF');
      assert.ok(tbodyDtf.innerHTML.includes("actualizarItemSplit('dtf', 0, 'quantity'"), 'Debe enlazar handler de cantidad DTF');
      assert.ok(tbodyDtf.innerHTML.includes("actualizarItemSplit('dtf', 0, 'unitCost'"), 'Debe enlazar handler de costo DTF');
      assert.ok(tbodyDtf.innerHTML.includes('split-subtotal-dtf-0'), 'Debe tener id en celda de subtotal DTF');
    });
  });

  describe('Controlador actualizarItemSplit y Reactividad', () => {
    it('actualizarItemSplit actualiza cantidad, costo unitario, subtotales y badges en tiempo real', () => {
      const compraMixta = {
        id: 'CMP-MIXTA-02',
        supplierName: 'Distribuidora Global',
        items: [
          { inventoryItemId: 'INV-POL-01', name: 'Polera Blanca Algodón M', quantity: 10, unitCost: 3000 },
          { inventoryItemId: 'INV-DTF-01', name: 'Estampado DTF Adelante', quantity: 10, unitCost: 1500 }
        ],
        totalAmount: 45000
      };
      storage.savePurchase(compraMixta);
      ui.abrirModalSepararCompra('CMP-MIXTA-02');

      // 1. Modificar cantidad y costo en Poleras
      ui.actualizarItemSplit('poleras', 0, 'quantity', '25');
      ui.actualizarItemSplit('poleras', 0, 'unitCost', '4000');

      // Comprobar celda de subtotal poleras: 25 * 4000 = 100.000
      const subtotalPolerasCell = dom.getElementById('split-subtotal-poleras-0');
      assert.ok(subtotalPolerasCell.textContent.includes('100.000'));

      // Comprobar badge de conteo poleras
      const badgePoleras = dom.getElementById('split-badge-count-poleras');
      assert.equal(badgePoleras.textContent, '25 prendas');

      // 2. Modificar cantidad y costo en DTF
      ui.actualizarItemSplit('dtf', 0, 'quantity', '30');
      ui.actualizarItemSplit('dtf', 0, 'unitCost', '2000');

      // Comprobar celda de subtotal DTF: 30 * 2000 = 60.000
      const subtotalDtfCell = dom.getElementById('split-subtotal-dtf-0');
      assert.ok(subtotalDtfCell.textContent.includes('60.000'));

      // Comprobar badge de conteo DTF
      const badgeDtf = dom.getElementById('split-badge-count-dtf');
      assert.equal(badgeDtf.textContent, '30 estampados');

      // Comprobar totales de factura y gran total: 100.000 + 60.000 = 160.000
      const totalPoleras = dom.getElementById('split-total-poleras');
      const totalDtf = dom.getElementById('split-total-dtf');
      const grandTotal = dom.getElementById('split-grand-total');

      assert.ok(totalPoleras.textContent.includes('100.000'));
      assert.ok(totalDtf.textContent.includes('60.000'));
      assert.ok(grandTotal.textContent.includes('160.000'));
    });
  });

  describe('Persistencia de Cambios en confirmarSeparacionCompra', () => {
    it('confirmarSeparacionCompra guarda las 2 facturas con las cantidades y costos modificados', () => {
      const compraMixta = {
        id: 'CMP-MIXTA-03',
        supplierName: 'Distribuidora Global',
        invoiceNumber: 'FAC-777',
        date: '2026-11-11',
        items: [
          { inventoryItemId: 'INV-POL-01', name: 'Polera Blanca Algodón M', quantity: 10, unitCost: 3500 },
          { inventoryItemId: 'INV-DTF-01', name: 'Estampado DTF Adelante', quantity: 10, unitCost: 1800 }
        ],
        totalAmount: 53000
      };
      storage.savePurchase(compraMixta);
      ui.abrirModalSepararCompra('CMP-MIXTA-03');

      // Modificar valores
      ui.actualizarItemSplit('poleras', 0, 'quantity', '50');
      ui.actualizarItemSplit('poleras', 0, 'unitCost', '3200');

      ui.actualizarItemSplit('dtf', 0, 'quantity', '50');
      ui.actualizarItemSplit('dtf', 0, 'unitCost', '1700');

      // Configurar selects de proveedores y números de factura en el DOM
      dom.getElementById('split-supplier-poleras').value = 'PRV-TEXTIL';
      dom.getElementById('split-supplier-dtf').value = 'PRV-DTF';
      dom.getElementById('split-invoice-poleras').value = 'FAC-POL-500';
      dom.getElementById('split-invoice-dtf').value = 'FAC-DTF-500';

      // Confirmar separación
      ui.confirmarSeparacionCompra();

      // Verificar en storage
      const compras = storage.getPurchases();
      assert.equal(compras.length, 2, 'Deben existir exactamente 2 facturas independientes');

      const compraPoleras = compras.find(c => c.invoiceNumber === 'FAC-POL-500');
      assert.ok(compraPoleras, 'Factura de poleras debe existir');
      assert.equal(compraPoleras.items[0].quantity, 50, 'Cantidad de poleras debe ser 50');
      assert.equal(compraPoleras.items[0].unitCost, 3200, 'Costo unitario de poleras debe ser 3200');
      assert.equal(compraPoleras.totalAmount, 50 * 3200, 'Total poleras debe ser 160.000');

      const compraDtf = compras.find(c => c.invoiceNumber === 'FAC-DTF-500');
      assert.ok(compraDtf, 'Factura de DTF debe existir');
      assert.equal(compraDtf.items[0].quantity, 50, 'Cantidad de DTF debe ser 50');
      assert.equal(compraDtf.items[0].unitCost, 1700, 'Costo unitario de DTF debe ser 1700');
      assert.equal(compraDtf.totalAmount, 50 * 1700, 'Total DTF debe ser 85.000');
    });
  });
});
