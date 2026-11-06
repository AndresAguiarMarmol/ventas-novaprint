const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

describe('Spec 014 — Interfaz de Edición de Compras (ui.js)', () => {
  let ui;
  let storage;
  let elements = {};
  let showModalCalled = false;

  beforeEach(() => {
    showModalCalled = false;
    elements = {
      'form-purchase': { reset: () => {} },
      'purchase-id-hidden': { value: '' },
      'purchase-modal-title': { textContent: '' },
      'purchase-modal-subtitle': { textContent: '' },
      'btn-submit-purchase': { textContent: '' },
      'purchase-supplier-select': {
        innerHTML: '',
        value: '',
        options: [{ selectedIndex: 0, getAttribute: () => 'Proveedor A' }]
      },
      'purchase-date-input': { value: '' },
      'purchase-invoice-input': { value: '' },
      'purchase-notes-input': { value: '' },
      'purchase-apply-iva': { checked: false },
      'purchase-apply-delivery': { checked: false },
      'purchase-delivery-input': { value: '0' },
      'purchase-delivery-input-container': { classList: { remove: () => {}, add: () => {} } },
      'purchase-items-tbody': { innerHTML: '' },
      'purchase-form-subtotal': { textContent: '' },
      'purchase-form-iva-row': { classList: { remove: () => {}, add: () => {} } },
      'purchase-form-iva': { textContent: '' },
      'purchase-form-delivery-row': { classList: { remove: () => {}, add: () => {} } },
      'purchase-form-delivery': { textContent: '' },
      'purchase-form-total': { textContent: '' },
      'dialog-purchase': {
        showModal: () => { showModalCalled = true; },
        close: () => {}
      }
    };

    global.document = {
      getElementById: (id) => elements[id] || null,
      querySelectorAll: () => []
    };

    global.window = global;

    // Cargar módulos
    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    global.NovaprintStorage = storage;
    global.NovaprintProduction = require('../assets/js/production.js');
    global.NovaprintSales = require('../assets/js/sales.js');
    ui = require('../assets/js/ui.js');
    global.NovaprintUI = ui;

    // Limpiar almacenamiento previo y preparar datos de prueba
    storage.clearAllData();
    storage.saveSupplier({ id: 'prov-1', name: 'Textil Sur', category: 'Prendas Lisas' });
    storage.saveInventoryItem({
      id: 'inv-item-1',
      name: 'Polera Negra M',
      unitCost: 3500,
      currentStock: 20
    });
  });

  it('editarCompra carga los datos de la compra sin lanzar ReferenceError y abre el modal dialog-purchase', () => {
    // 1. Guardar una compra inicial
    const compra = storage.savePurchase({
      supplierId: 'prov-1',
      supplierName: 'Textil Sur',
      invoiceNumber: 'FAC-999',
      date: '2026-11-06',
      notes: 'Factura de prueba para edición',
      applyIva: true,
      applyDelivery: true,
      deliveryAmount: 2500,
      items: [
        { inventoryItemId: 'inv-item-1', name: 'Polera Negra M', quantity: 10, unitCost: 3500 }
      ]
    });

    assert.ok(compra.id, 'La compra debe tener un ID generado');

    // 2. Ejecutar editarCompra desde la UI
    assert.doesNotThrow(() => {
      ui.editarCompra(compra.id);
    }, 'editarCompra no debe fallar con ReferenceError ni excepciones');

    // 3. Verificar que los campos fueron poblados correctamente en el DOM
    assert.equal(elements['purchase-id-hidden'].value, compra.id);
    assert.equal(elements['purchase-date-input'].value, '2026-11-06');
    assert.equal(elements['purchase-invoice-input'].value, 'FAC-999');
    assert.equal(elements['purchase-notes-input'].value, 'Factura de prueba para edición');
    assert.equal(elements['purchase-apply-iva'].checked, true);
    assert.equal(elements['purchase-apply-delivery'].checked, true);
    assert.equal(elements['purchase-delivery-input'].value, 2500);
    assert.equal(showModalCalled, true, 'dialog-purchase.showModal() debe haber sido invocado');
    assert.ok(elements['purchase-items-tbody'].innerHTML.includes('Polera Negra M'), 'La tabla de ítems debe contener el artículo');
  });
});
