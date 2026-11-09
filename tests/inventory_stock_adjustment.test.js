const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Spec 017 — Opción para Modificar el Stock de Inventarios', () => {
  let storage;
  let ui;
  let elements = {};
  let showModalCalled = false;
  let closeModalCalled = false;
  let refrescarDatosCalled = false;

  beforeEach(() => {
    showModalCalled = false;
    closeModalCalled = false;
    refrescarDatosCalled = false;

    elements = {
      'dialog-adjust-stock': {
        showModal: () => { showModalCalled = true; },
        close: () => { closeModalCalled = true; }
      },
      'adjust-stock-item-id': { value: '' },
      'adjust-stock-code': { textContent: '' },
      'adjust-stock-category': { textContent: '' },
      'adjust-stock-name': { textContent: '' },
      'adjust-stock-specs': { textContent: '' },
      'adjust-stock-current': { textContent: '' },
      'adjust-stock-unit-label': { textContent: '' },
      'adjust-stock-min-alert': { textContent: '' },
      'adjust-stock-new-input': { value: '0' },
      'adjust-stock-delta-badge': { textContent: '0' },
      'adjust-stock-delta-text': { textContent: '', className: '' },
      'adjust-stock-reason-select': { value: 'Conteo físico / Cuadratura' },
      'adjust-stock-notes-input': { value: '' },
      'inventory-table-body': { innerHTML: '' }
    };

    global.document = {
      getElementById: (id) => elements[id] || null,
      querySelectorAll: () => []
    };

    global.window = global;
    global.alert = () => {};
    global.confirm = () => true;

    // Reset module cache
    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    global.NovaprintStorage = storage;
    global.NovaprintProduction = require('../assets/js/production.js');
    global.NovaprintSales = require('../assets/js/sales.js');

    global.NovaprintMain = {
      refrescarDatos: () => { refrescarDatosCalled = true; }
    };

    ui = require('../assets/js/ui.js');
  });

  describe('Capa de Persistencia (storage.updateInventoryStock)', () => {
    it('actualiza correctamente el currentStock y registra los metadatos de ajuste', () => {
      storage.clearAllData(true);
      const item = storage.saveInventoryItem({
        id: 'INV-TEST-001',
        code: 'POL-ALG-M',
        name: 'Polera Algodón Negra M',
        category: 'Prendas Lisas',
        currentStock: 20,
        minStock: 5,
        unitCost: 3500
      });

      const updated = storage.updateInventoryStock('INV-TEST-001', 35, {
        reason: 'Conteo físico',
        notes: 'Conteo mensual verificado en bodega'
      });

      assert.ok(updated);
      assert.equal(updated.currentStock, 35);
      assert.ok(updated.updatedAt);
      assert.deepEqual(updated.lastStockAdjustment, {
        previousStock: 20,
        newStock: 35,
        delta: 15,
        date: updated.lastStockAdjustment.date,
        reason: 'Conteo físico',
        notes: 'Conteo mensual verificado en bodega'
      });

      // Debe persistirse en getInventory
      const persisted = storage.getInventoryItemById('INV-TEST-001');
      assert.equal(persisted.currentStock, 35);
      assert.equal(persisted.unitCost, 3500, 'Debe preservar el costo y otros atributos');
    });

    it('protege contra valores negativos ajustando el stock mínimo a 0', () => {
      storage.clearAllData(true);
      storage.saveInventoryItem({
        id: 'INV-TEST-002',
        name: 'Gorra Blanca',
        currentStock: 10
      });

      const updated = storage.updateInventoryStock('INV-TEST-002', -15);
      assert.ok(updated);
      assert.equal(updated.currentStock, 0, 'El stock nunca debe ser negativo');
      assert.equal(updated.lastStockAdjustment.delta, -10);
    });

    it('retorna null cuando el ID del artículo no existe', () => {
      const result = storage.updateInventoryStock('ID-INEXISTENTE', 10);
      assert.equal(result, null);
    });
  });

  describe('Integración en Interfaz de Usuario (index.html & ui.js)', () => {
    it('el archivo index.html debe incluir el diálogo modal #dialog-adjust-stock con sus controles', () => {
      const indexPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(indexPath, 'utf-8');

      assert.ok(html.includes('id="dialog-adjust-stock"'), 'Debe existir #dialog-adjust-stock');
      assert.ok(html.includes('id="form-adjust-stock"'), 'Debe existir #form-adjust-stock');
      assert.ok(html.includes('id="adjust-stock-new-input"'), 'Debe existir #adjust-stock-new-input');
      assert.ok(html.includes('id="adjust-stock-reason-select"'), 'Debe existir #adjust-stock-reason-select');
      assert.ok(html.includes('id="adjust-stock-delta-badge"'), 'Debe existir #adjust-stock-delta-badge');
    });

    it('renderInventoryTable genera botón de acción [📦] y acceso rápido en la columna de stock', () => {
      const items = [{
        id: 'INV-TEST-010',
        code: 'POL-BLA-L',
        name: 'Polera Blanca L',
        category: 'Prendas Lisas',
        currentStock: 12,
        minStock: 5,
        unitCost: 3000
      }];

      ui.renderInventoryTable(items);
      const html = elements['inventory-table-body'].innerHTML;

      // Debe incluir botón en celda de stock
      assert.match(html, /onclick="NovaprintUI\.abrirModalModificarStock\('INV-TEST-010'\)"/);
      assert.match(html, /title="Modificar stock actual de Polera Blanca L"/);

      // Debe incluir botón 📦 en la columna de acciones
      assert.match(html, /title="Modificar Stock"[^>]*>📦<\/button>/);
    });

    it('abrirModalModificarStock abre el modal y precarga los datos del artículo', () => {
      storage.clearAllData(true);
      storage.saveInventoryItem({
        id: 'INV-TEST-020',
        code: 'POL-NEG-XL',
        name: 'Polera Negra XL',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'XL',
        unit: 'un.',
        currentStock: 25,
        minStock: 10
      });

      ui.abrirModalModificarStock('INV-TEST-020');

      assert.equal(showModalCalled, true, 'Debe invocar showModal() en el diálogo');
      assert.equal(elements['adjust-stock-item-id'].value, 'INV-TEST-020');
      assert.equal(elements['adjust-stock-code'].textContent, 'POL-NEG-XL');
      assert.equal(elements['adjust-stock-name'].textContent, 'Polera Negra XL');
      assert.equal(elements['adjust-stock-current'].textContent, '25');
      assert.equal(elements['adjust-stock-new-input'].value, '25');
      assert.equal(elements['adjust-stock-delta-badge'].textContent, '0');
    });

    it('aplicarAjusteStockDelta y recalcularDeltaStock calculan variaciones positivas, negativas y límite cero', () => {
      storage.clearAllData(true);
      storage.saveInventoryItem({
        id: 'INV-TEST-030',
        name: 'Insumo DTF Poliamida',
        currentStock: 50
      });

      ui.abrirModalModificarStock('INV-TEST-030');

      // Aumentar en +10
      ui.aplicarAjusteStockDelta(10);
      assert.equal(elements['adjust-stock-new-input'].value, '60');
      assert.equal(elements['adjust-stock-delta-badge'].textContent, '+10');

      // Disminuir en -20
      ui.aplicarAjusteStockDelta(-20);
      assert.equal(elements['adjust-stock-new-input'].value, '40');
      assert.equal(elements['adjust-stock-delta-badge'].textContent, '-10');

      // Establecer agotado (0)
      ui.aplicarAjusteStockDelta('zero');
      assert.equal(elements['adjust-stock-new-input'].value, '0');
      assert.equal(elements['adjust-stock-delta-badge'].textContent, '-50');
    });

    it('guardarModificacionStock persiste el nuevo stock, cierra el diálogo y refresca los datos', () => {
      storage.clearAllData(true);
      storage.saveInventoryItem({
        id: 'INV-TEST-040',
        name: 'Gorra Trucker Roja',
        currentStock: 8
      });

      ui.abrirModalModificarStock('INV-TEST-040');

      elements['adjust-stock-new-input'].value = '18';
      elements['adjust-stock-reason-select'].value = 'Ingreso manual de stock';
      elements['adjust-stock-notes-input'].value = 'Caja recibida de bodega central';

      ui.guardarModificacionStock();

      assert.equal(closeModalCalled, true, 'Debe cerrar el modal tras guardar');
      assert.equal(refrescarDatosCalled, true, 'Debe solicitar refrescarDatos en NovaprintMain');

      const itemGuardado = storage.getInventoryItemById('INV-TEST-040');
      assert.equal(itemGuardado.currentStock, 18);
      assert.equal(itemGuardado.lastStockAdjustment.reason, 'Ingreso manual de stock');
    });
  });
});
