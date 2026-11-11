/**
 * tests/inventory_zero_stock.test.js — Pruebas unitarias para Spec 031
 * Colocar saldo 0 para todos los elementos del Stock Actual de los Inventarios.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
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

describe('Spec 031 — Colocar Saldo 0 en el Stock Actual de Todos los Inventarios', () => {
  let storage;
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    global.localStorage = mockStorage;
    global.window = { localStorage: mockStorage };

    const storagePath = path.resolve(__dirname, '../assets/js/storage.js');
    delete require.cache[require.resolve(storagePath)];
    storage = require(storagePath);
    global.NovaprintStorage = storage;
  });

  describe('Función de Persistencia ponerStockCeroATodosLosItems', () => {
    it('establece currentStock = 0 para todos los artículos de inventario', () => {
      const inventarioInicial = [
        {
          id: 'INV-001',
          code: 'POL-NEG-M',
          name: 'Polera Algodón Negra M',
          category: 'Prendas Lisas',
          garmentType: 'Polera',
          color: 'Negro',
          size: 'M',
          unit: 'unidad',
          currentStock: 45,
          minStock: 10,
          unitCost: 2800,
          supplierId: 'PRV-01',
          supplierName: 'Distribuidora Textil'
        },
        {
          id: 'INV-002',
          code: 'GOR-BLA-U',
          name: 'Gorra Blanca Trucker',
          category: 'Gorras en Blanco',
          garmentType: 'Gorra',
          color: 'Blanco',
          size: 'Única',
          unit: 'unidad',
          currentStock: 20,
          minStock: 5,
          unitCost: 3500,
          supplierId: 'PRV-01',
          supplierName: 'Distribuidora Textil'
        },
        {
          id: 'INV-003',
          code: 'DTF-FILM-A3',
          name: 'Film DTF Rollo 30cm',
          category: 'Insumos DTF',
          unit: 'rollo',
          currentStock: 3,
          minStock: 1,
          unitCost: 45000,
          supplierId: 'PRV-02',
          supplierName: 'DTF Sur'
        }
      ];

      mockStorage.setItem('novaprint_inventory', JSON.stringify(inventarioInicial));

      const res = storage.ponerStockCeroATodosLosItems();
      assert.equal(res.success, true);
      assert.equal(res.totalItemsAjustados, 3);

      const inventarioFinal = storage.getInventory();
      assert.equal(inventarioFinal.length, 3);

      inventarioFinal.forEach(item => {
        assert.equal(item.currentStock, 0, `El artículo ${item.code} debe tener currentStock = 0`);
      });
    });

    it('preserva intactos todos los metadatos y catálogo de los artículos', () => {
      const itemOriginal = {
        id: 'INV-POL-AZU-10',
        code: 'POL-AZU-10',
        name: 'Polera Lisa - Azul Talla 10',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Azul',
        size: '10',
        unit: 'unidad',
        currentStock: 18,
        minStock: 8,
        unitCost: 2950,
        supplierId: 'PRV-99',
        supplierName: 'Textiles Bellavista',
        createdAt: '2026-11-01T10:00:00.000Z'
      };

      mockStorage.setItem('novaprint_inventory', JSON.stringify([itemOriginal]));

      storage.ponerStockCeroATodosLosItems();

      const [itemGuardado] = storage.getInventory();
      assert.equal(itemGuardado.id, itemOriginal.id);
      assert.equal(itemGuardado.code, itemOriginal.code);
      assert.equal(itemGuardado.name, itemOriginal.name);
      assert.equal(itemGuardado.category, itemOriginal.category);
      assert.equal(itemGuardado.garmentType, itemOriginal.garmentType);
      assert.equal(itemGuardado.color, itemOriginal.color);
      assert.equal(itemGuardado.size, itemOriginal.size);
      assert.equal(itemGuardado.unitCost, itemOriginal.unitCost);
      assert.equal(itemGuardado.supplierId, itemOriginal.supplierId);
      assert.equal(itemGuardado.supplierName, itemOriginal.supplierName);
      assert.equal(itemGuardado.createdAt, itemOriginal.createdAt);
      assert.equal(itemGuardado.currentStock, 0);
    });

    it('registra la auditoría del ajuste en lastStockAdjustment con el delta correspondiente', () => {
      const item = {
        id: 'INV-TEST-STOCK',
        code: 'POL-ROJ-L',
        name: 'Polera Roja L',
        currentStock: 25
      };

      mockStorage.setItem('novaprint_inventory', JSON.stringify([item]));

      storage.ponerStockCeroATodosLosItems({ reason: 'Reinicio general de inventario (Spec 031)' });

      const [itemAjustado] = storage.getInventory();
      assert.ok(itemAjustado.lastStockAdjustment, 'Debe registrar lastStockAdjustment');
      assert.equal(itemAjustado.lastStockAdjustment.previousStock, 25);
      assert.equal(itemAjustado.lastStockAdjustment.newStock, 0);
      assert.equal(itemAjustado.lastStockAdjustment.delta, -25);
      assert.equal(itemAjustado.lastStockAdjustment.reason, 'Reinicio general de inventario (Spec 031)');
    });

    it('opera de forma segura con inventario vacío', () => {
      mockStorage.setItem('novaprint_inventory', JSON.stringify([]));

      const res = storage.ponerStockCeroATodosLosItems();
      assert.equal(res.success, true);
      assert.equal(res.totalItemsAjustados, 0);
      assert.equal(storage.getInventory().length, 0);
    });
  });

  describe('Integración con Interfaz de Usuario (index.html & ui.js)', () => {
    it('index.html contiene el botón #btn-reset-inventory-stock con evento a NovaprintUI.confirmarPonerStockCero()', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      assert.ok(
        htmlContent.includes('id="btn-reset-inventory-stock"'),
        'Debe existir el botón #btn-reset-inventory-stock en index.html'
      );
      assert.ok(
        htmlContent.includes('NovaprintUI.confirmarPonerStockCero()'),
        'El botón debe invocar NovaprintUI.confirmarPonerStockCero()'
      );
    });

    it('ui.js exporta confirmarPonerStockCero como función ejecutable', () => {
      const uiPath = path.resolve(__dirname, '../assets/js/ui.js');
      const ui = require(uiPath);

      assert.equal(typeof ui.confirmarPonerStockCero, 'function');
    });
  });
});
