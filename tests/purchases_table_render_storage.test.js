/**
 * tests/purchases_table_render_storage.test.js — Pruebas unitarias para Spec 033
 * Blindaje contra ReferenceError: storage is not defined en renderPurchasesTable y transferencias contables.
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
        textContent: '',
        innerHTML: '',
        className: '',
        style: {},
        selectedOptions: [{ textContent: 'Cuenta Test' }],
        children: [],
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

describe('Spec 033 — Corrección de ReferenceError en renderPurchasesTable y Transferencias Contables', () => {
  let storage;
  let accounting;
  let production;
  let sales;
  let ui;
  let mockStorage;
  let dom;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    global.localStorage = mockStorage;
    global.window = { localStorage: mockStorage };
    dom = createMinimalDOM();
    global.document = dom;

    const storagePath = path.resolve(__dirname, '../assets/js/storage.js');
    const accountingPath = path.resolve(__dirname, '../assets/js/accounting.js');
    const productionPath = path.resolve(__dirname, '../assets/js/production.js');
    const salesPath = path.resolve(__dirname, '../assets/js/sales.js');
    const uiPath = path.resolve(__dirname, '../assets/js/ui.js');

    delete require.cache[require.resolve(storagePath)];
    delete require.cache[require.resolve(accountingPath)];
    delete require.cache[require.resolve(productionPath)];
    delete require.cache[require.resolve(salesPath)];
    delete require.cache[require.resolve(uiPath)];

    storage = require(storagePath);
    accounting = require(accountingPath);
    production = require(productionPath);
    sales = require(salesPath);
    ui = require(uiPath);

    global.NovaprintStorage = storage;
    global.NovaprintAccounting = accounting;
    global.NovaprintProduction = production;
    global.NovaprintSales = sales;
    global.NovaprintUI = ui;
  });

  describe('renderPurchasesTable sin ReferenceError', () => {
    it('renderPurchasesTable se ejecuta sin error cuando hay compras registradas en el sistema', () => {
      // Simular existencia de inventario
      storage.saveInventoryItem({
        id: 'INV-POL-01',
        name: 'Polera Algodón Negra M',
        category: 'Prendas Lisas',
        currentStock: 10
      });

      const comprasEjemplo = [
        {
          id: 'CMP-20261111-001',
          supplierName: 'Distribuidora Textil',
          invoiceNumber: 'FAC-8891',
          date: '2026-11-11',
          totalAmount: 150000,
          items: [
            { name: 'Polera Algodón Negra M', quantity: 20, unitCost: 3500 }
          ]
        }
      ];

      // No debe lanzar ReferenceError: storage is not defined
      assert.doesNotThrow(() => {
        ui.renderPurchasesTable(comprasEjemplo);
      });

      const tableBody = dom.getElementById('purchases-table-body');
      assert.ok(tableBody.innerHTML.includes('CMP-20261111-001'), 'La tabla debe contener el ID de la compra');
      assert.ok(tableBody.innerHTML.includes('Distribuidora Textil'), 'La tabla debe contener el proveedor');
    });

    it('renderPurchasesTable maneja compras vacías adecuadamente', () => {
      assert.doesNotThrow(() => {
        ui.renderPurchasesTable([]);
      });

      const tableBody = dom.getElementById('purchases-table-body');
      assert.ok(tableBody.innerHTML.includes('No hay compras registradas'));
    });
  });

  describe('Flujo de Transferencia entre Cuentas 3101 y 3102 con Compras en Bodega', () => {
    it('guarda exitosamente una transferencia entre cuentas sin lanzar "storage is not defined"', () => {
      // 1. Asegurar cuentas 3101 y 3102
      storage.saveAccount({
        id: 'ACC-3101',
        codigo: '3101',
        nombre: 'Capital Social Taller',
        tipo: 'Capital',
        subtipo: 'Capital Social'
      });
      storage.saveAccount({
        id: 'ACC-3102',
        codigo: '3102',
        nombre: 'Aportes Extraordinarios Socios',
        tipo: 'Capital',
        subtipo: 'Capital Social'
      });

      // 2. Cargar compra previa en el storage
      storage.savePurchase({
        id: 'CMP-20261110-001',
        supplierName: 'Insumos DTF Express',
        invoiceNumber: 'FAC-1234',
        date: '2026-11-10',
        items: [{ name: 'Film DTF Rollo 30cm', quantity: 2, unitCost: 25000 }],
        totalAmount: 50000
      });

      // 3. Configurar formulario DOM para transferencia 3101 -> 3102
      dom.getElementById('transfer-source-account').value = 'ACC-3101';
      dom.getElementById('transfer-destination-account').value = 'ACC-3102';
      dom.getElementById('transfer-amount').value = '75000';
      dom.getElementById('transfer-date').value = '2026-11-11';
      dom.getElementById('transfer-description').value = 'Reclasificación de aportes de capital taller';

      // 4. Ejecutar guardarTransferenciaDesdeFormulario
      assert.doesNotThrow(() => {
        ui.guardarTransferenciaDesdeFormulario({ preventDefault: () => {} });
      });

      // 5. Validar que la transferencia se guardó con éxito
      const toastContainer = dom.getElementById('toast-container');
      const lastToast = toastContainer.children[toastContainer.children.length - 1];
      assert.ok(lastToast, 'Debe generarse un toast en el contenedor');
      assert.ok(lastToast.innerHTML.includes('Transferencia de $75.000 registrada con éxito'));
      assert.ok(lastToast.className.includes('bg-emerald-600'));

      const transfers = storage.getTransfers();
      assert.equal(transfers.length, 1);
      assert.equal(transfers[0].amount, 75000);
      assert.equal(transfers[0].sourceAccountCode, '3101');
      assert.equal(transfers[0].destinationAccountCode, '3102');
    });
  });
});
