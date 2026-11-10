const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

describe('Spec 021 — Separar Compra de Poleras y Estampado DTF en 2 Facturas (production.js, storage.js, ui.js)', () => {
  let prod;
  let storage;
  let ui;
  let elements = {};
  let showModalCalled = false;
  let closeCalled = false;

  beforeEach(() => {
    showModalCalled = false;
    closeCalled = false;

    // Cargar módulos limpios
    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    prod = require('../assets/js/production.js');
    const sales = require('../assets/js/sales.js');

    global.NovaprintStorage = storage;
    global.NovaprintProduction = prod;
    global.NovaprintSales = sales;

    storage.clearAllData();

    // Crear proveedores de prueba
    storage.saveSupplier({ id: 'prov-tex-1', name: 'Textiles Mayoristas Chile', category: 'Prendas Lisas' });
    storage.saveSupplier({ id: 'prov-dtf-1', name: 'Insumos Gráficos DTF Sur', category: 'Insumos DTF' });

    // Crear artículos de inventario de prueba
    storage.saveInventoryItem({
      id: 'inv-pol-1',
      code: 'POL-NEG-M',
      name: 'Polera Algodón 160g - Negro M',
      category: 'Prendas Lisas',
      garmentType: 'Polera',
      currentStock: 10,
      unitCost: 2800,
      supplierId: 'prov-tex-1'
    });

    storage.saveInventoryItem({
      id: 'inv-dtf-1',
      code: 'EST-DTF-ADE',
      name: 'Estampado DTF - Adelante',
      category: 'Insumos DTF',
      garmentType: 'Estampado',
      currentStock: 5,
      unitCost: 1800,
      supplierId: 'prov-dtf-1'
    });

    elements = {
      'purchase-id-hidden': { value: '' },
      'purchase-modal-title': { textContent: '' },
      'purchase-modal-subtitle': { textContent: '' },
      'btn-submit-purchase': { textContent: '' },
      'purchase-supplier-select': {
        innerHTML: '',
        value: 'prov-tex-1',
        options: [{ selectedIndex: 0, getAttribute: () => 'Textiles Mayoristas Chile' }]
      },
      'purchase-date-input': { value: '2026-11-09' },
      'purchase-invoice-input': { value: 'FAC-ORIGINAL-100' },
      'purchase-notes-input': { value: 'Compra combinada de taller' },
      'purchase-apply-iva': { checked: true },
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
      'purchase-split-banner': { classList: { remove: () => {}, add: () => {} } },
      'dialog-purchase': {
        showModal: () => { showModalCalled = true; },
        close: () => { closeCalled = true; }
      },
      // Elementos de diálogo separación
      'dialog-split-purchase': {
        showModal: () => { showModalCalled = true; },
        close: () => { closeCalled = true; }
      },
      'split-supplier-poleras': {
        innerHTML: '',
        value: '',
        options: [
          { value: 'prov-tex-1', getAttribute: () => 'Textiles Mayoristas Chile' },
          { value: 'prov-dtf-1', getAttribute: () => 'Insumos Gráficos DTF Sur' }
        ],
        selectedIndex: 0
      },
      'split-invoice-poleras': { value: '' },
      'split-date-poleras': { value: '' },
      'split-badge-count-poleras': { textContent: '' },
      'split-items-poleras-tbody': { innerHTML: '' },
      'split-iva-poleras': { checked: false },
      'split-delivery-check-poleras': { checked: false },
      'split-delivery-poleras': { value: '0' },
      'split-delivery-container-poleras': { classList: { remove: () => {}, add: () => {} } },
      'split-total-poleras': { textContent: '' },
      'split-supplier-dtf': {
        innerHTML: '',
        value: '',
        options: [
          { value: 'prov-tex-1', getAttribute: () => 'Textiles Mayoristas Chile' },
          { value: 'prov-dtf-1', getAttribute: () => 'Insumos Gráficos DTF Sur' }
        ],
        selectedIndex: 1
      },
      'split-invoice-dtf': { value: '' },
      'split-date-dtf': { value: '' },
      'split-badge-count-dtf': { textContent: '' },
      'split-items-dtf-tbody': { innerHTML: '' },
      'split-iva-dtf': { checked: false },
      'split-delivery-check-dtf': { checked: false },
      'split-delivery-dtf': { value: '0' },
      'split-delivery-container-dtf': { classList: { remove: () => {}, add: () => {} } },
      'split-total-dtf': { textContent: '' },
      'split-grand-total': { textContent: '' }
    };

    global.document = {
      getElementById: (id) => elements[id] || null,
      querySelectorAll: () => []
    };
    global.window = global;

    ui = require('../assets/js/ui.js');
    global.NovaprintUI = ui;
  });

  describe('1. Clasificación y Detección de Ítems (production.js)', () => {
    it('clasificarItemCompra identifica correctamente poleras y estampados DTF', () => {
      const inv = storage.getInventory();

      // Por inventario vinculado
      const itemPolera = { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M' };
      const itemDtf = { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante' };

      assert.equal(prod.clasificarItemCompra(itemPolera, inv), 'textil');
      assert.equal(prod.clasificarItemCompra(itemDtf, inv), 'dtf');

      // Por nombre sin inventario vinculado
      assert.equal(prod.clasificarItemCompra({ name: 'Polerón Canguro Algodón XL' }), 'textil');
      assert.equal(prod.clasificarItemCompra({ name: 'Estampado DTF - Ambos' }), 'dtf');
      assert.equal(prod.clasificarItemCompra({ name: 'Bobina de Film DTF 60cm' }), 'dtf');
      assert.equal(prod.clasificarItemCompra({ name: 'Buzo Deportivo Adulto L' }), 'textil');
    });

    it('esCompraMixta detecta si hay mezcla de poleras y DTF', () => {
      const inv = storage.getInventory();

      const soloPoleras = [
        { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M', quantity: 10, unitCost: 2800 },
        { name: 'Polera Algodón 160g - Blanco L', quantity: 5, unitCost: 2800 }
      ];
      assert.equal(prod.esCompraMixta(soloPoleras, inv), false);

      const soloDtf = [
        { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante', quantity: 10, unitCost: 1800 },
        { name: 'Estampado DTF - Ambos', quantity: 5, unitCost: 3500 }
      ];
      assert.equal(prod.esCompraMixta(soloDtf, inv), false);

      const mixta = [
        { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M', quantity: 10, unitCost: 2800 },
        { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante', quantity: 10, unitCost: 1800 }
      ];
      assert.equal(prod.esCompraMixta(mixta, inv), true);
    });

    it('separarItemsCompra agrupa los ítems en poleras y dtf sin pérdida de datos', () => {
      const inv = storage.getInventory();
      const mixta = [
        { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M', quantity: 10, unitCost: 2800 },
        { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante', quantity: 10, unitCost: 1800 },
        { name: 'Polerón Negro L', quantity: 4, unitCost: 11000 },
        { name: 'Estampado DTF - Atrás', quantity: 4, unitCost: 2200 }
      ];

      const resultado = prod.separarItemsCompra(mixta, inv);
      assert.equal(resultado.itemsPoleras.length, 2);
      assert.equal(resultado.itemsDtf.length, 2);
      assert.equal(resultado.itemsPoleras[0].name, 'Polera Algodón 160g - Negro M');
      assert.equal(resultado.itemsDtf[0].name, 'Estampado DTF - Adelante');
    });

    it('resolverProveedorParaCategoria sugiere el proveedor apropiado', () => {
      const proveedores = storage.getSuppliers();
      const provTextil = prod.resolverProveedorParaCategoria('textil', proveedores);
      const provDtf = prod.resolverProveedorParaCategoria('dtf', proveedores);

      assert.equal(provTextil.id, 'prov-tex-1');
      assert.equal(provDtf.id, 'prov-dtf-1');
    });
  });

  describe('2. Separación de Compras y Cuadratura de Stock en storage.js', () => {
    it('separarCompraEnDos actualiza la compra original para poleras y crea una nueva para DTF cuadrando existencias', () => {
      // 1. Guardar compra mixta inicial
      const compraInicial = storage.savePurchase({
        supplierId: 'prov-tex-1',
        supplierName: 'Textiles Mayoristas Chile',
        invoiceNumber: 'FAC-COMBINADA-001',
        date: '2026-11-09',
        items: [
          { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M', quantity: 10, unitCost: 2800 },
          { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante', quantity: 10, unitCost: 1800 }
        ]
      });

      // El stock inicial era 10 poleras y 5 DTF. Con la compra +10 poleras = 20, +10 DTF = 15.
      let invItemPolera = storage.getInventoryItemById('inv-pol-1');
      let invItemDtf = storage.getInventoryItemById('inv-dtf-1');
      assert.equal(invItemPolera.currentStock, 20);
      assert.equal(invItemDtf.currentStock, 15);

      // 2. Separar compra en dos
      const datosPoleras = {
        supplierId: 'prov-tex-1',
        supplierName: 'Textiles Mayoristas Chile',
        invoiceNumber: 'FAC-POL-001',
        date: '2026-11-09',
        items: [
          { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M', quantity: 10, unitCost: 2800 }
        ]
      };

      const datosDtf = {
        supplierId: 'prov-dtf-1',
        supplierName: 'Insumos Gráficos DTF Sur',
        invoiceNumber: 'FAC-DTF-001',
        date: '2026-11-09',
        items: [
          { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante', quantity: 10, unitCost: 1800 }
        ]
      };

      const resSeparacion = storage.separarCompraEnDos(compraInicial.id, datosPoleras, datosDtf);

      assert.equal(resSeparacion.compraPoleras.id, compraInicial.id, 'La factura de poleras conserva el ID original');
      assert.ok(resSeparacion.compraDtf.id, 'La factura de DTF recibe un nuevo ID formal');
      assert.notEqual(resSeparacion.compraDtf.id, compraInicial.id);

      // Verificar proveedores
      assert.equal(resSeparacion.compraPoleras.supplierId, 'prov-tex-1');
      assert.equal(resSeparacion.compraDtf.supplierId, 'prov-dtf-1');

      // Verificar facturas en base de datos
      const todasCompras = storage.getPurchases();
      assert.equal(todasCompras.length, 2, 'Ahora deben existir 2 compras en el historial');

      // Cuadratura estricta de stock: el stock NO debe cambiar respecto a antes de separar
      invItemPolera = storage.getInventoryItemById('inv-pol-1');
      invItemDtf = storage.getInventoryItemById('inv-dtf-1');
      assert.equal(invItemPolera.currentStock, 20, 'Stock de poleras debe mantenerse en 20 unidades');
      assert.equal(invItemDtf.currentStock, 15, 'Stock de DTF debe mantenerse en 15 unidades');
    });

    it('separarCompraEnDos soporta creación directa sin ID previo', () => {
      const datosPoleras = {
        supplierId: 'prov-tex-1',
        supplierName: 'Textiles Mayoristas Chile',
        invoiceNumber: 'FAC-POL-100',
        date: '2026-11-09',
        items: [
          { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M', quantity: 5, unitCost: 2800 }
        ]
      };

      const datosDtf = {
        supplierId: 'prov-dtf-1',
        supplierName: 'Insumos Gráficos DTF Sur',
        invoiceNumber: 'FAC-DTF-100',
        date: '2026-11-09',
        items: [
          { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante', quantity: 5, unitCost: 1800 }
        ]
      };

      const res = storage.separarCompraEnDos(null, datosPoleras, datosDtf);
      assert.ok(res.compraPoleras.id);
      assert.ok(res.compraDtf.id);
      assert.notEqual(res.compraPoleras.id, res.compraDtf.id);

      const todasCompras = storage.getPurchases();
      assert.equal(todasCompras.length, 2);
    });
  });

  describe('3. Integración con Interfaz de Usuario (ui.js)', () => {
    it('abrirModalSepararCompra precarga correctamente ambas facturas y abre dialog-split-purchase', () => {
      const compraMixta = storage.savePurchase({
        supplierId: 'prov-tex-1',
        supplierName: 'Textiles Mayoristas Chile',
        invoiceNumber: 'FAC-MIX-777',
        date: '2026-11-09',
        applyIva: true,
        items: [
          { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M', quantity: 12, unitCost: 2800 },
          { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante', quantity: 12, unitCost: 1800 }
        ]
      });

      assert.doesNotThrow(() => {
        ui.abrirModalSepararCompra(compraMixta.id);
      });

      assert.equal(showModalCalled, true, 'Debe haber abierto el modal dialog-split-purchase');
      assert.equal(elements['split-invoice-poleras'].value, 'FAC-MIX-777-POL');
      assert.equal(elements['split-invoice-dtf'].value, 'FAC-MIX-777-DTF');
      assert.equal(elements['split-badge-count-poleras'].textContent, '12 prendas');
      assert.equal(elements['split-badge-count-dtf'].textContent, '12 estampados');
    });

    it('confirmarSeparacionCompra ejecuta la división, actualiza almacenamiento y cierra modales', () => {
      const compraMixta = storage.savePurchase({
        supplierId: 'prov-tex-1',
        supplierName: 'Textiles Mayoristas Chile',
        invoiceNumber: 'FAC-MIX-888',
        date: '2026-11-09',
        items: [
          { inventoryItemId: 'inv-pol-1', name: 'Polera Algodón 160g - Negro M', quantity: 8, unitCost: 2800 },
          { inventoryItemId: 'inv-dtf-1', name: 'Estampado DTF - Adelante', quantity: 8, unitCost: 1800 }
        ]
      });

      ui.abrirModalSepararCompra(compraMixta.id);

      // Simular selección de proveedores en el DOM
      elements['split-supplier-poleras'].value = 'prov-tex-1';
      elements['split-supplier-dtf'].value = 'prov-dtf-1';

      assert.doesNotThrow(() => {
        ui.confirmarSeparacionCompra();
      });

      assert.equal(closeCalled, true, 'Debe cerrar los modales tras completar la división');

      const comprasFinales = storage.getPurchases();
      assert.equal(comprasFinales.length, 2, 'Deben existir 2 compras en el historial');
      const compraPoleras = comprasFinales.find(c => c.id === compraMixta.id);
      const compraDtf = comprasFinales.find(c => c.id !== compraMixta.id);

      assert.ok(compraPoleras, 'Compra de poleras preserva el ID original');
      assert.ok(compraDtf, 'Compra de DTF generada con nuevo ID');
      assert.equal(compraPoleras.items.length, 1);
      assert.equal(compraDtf.items.length, 1);
      assert.equal(compraPoleras.supplierId, 'prov-tex-1');
      assert.equal(compraDtf.supplierId, 'prov-dtf-1');
    });
  });
});

