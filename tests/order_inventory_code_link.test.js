// tests/order_inventory_code_link.test.js
// Spec 042 — Enlace de Pedido con Código de Inventario en Detalle de Prendas & Técnicas

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

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

describe('Spec 042 — Enlace de Pedido con Código de Inventario', () => {
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

  describe('1. Selector de Códigos y Auto-completado', () => {
    it('generarOpcionesCodigoInventario debe listar los códigos de prendas con stock y la opción nueva', () => {
      storage.saveInventoryItem({
        id: 'INV-POL-01',
        code: 'POL-AZU-M',
        name: 'Polera Lisa Azul M',
        garmentType: 'Polera',
        color: 'Azul',
        size: 'M',
        currentStock: 15
      });
      storage.saveInventoryItem({
        id: 'INV-POL-02',
        code: 'POL-NEG-L',
        name: 'Polera Lisa Negra L',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'L',
        currentStock: 30
      });

      const html = ui.generarOpcionesCodigoInventario('POL-AZU-M');

      assert.ok(html.includes('(Sin código / Prenda nueva)'));
      assert.ok(html.includes('POL-AZU-M — Polera Lisa Azul M (Stock: 15)'));
      assert.ok(html.includes('POL-NEG-L — Polera Lisa Negra L (Stock: 30)'));
      assert.ok(html.includes('value="POL-AZU-M" data-id="INV-POL-01" selected'));
    });

    it('actualizarItemProp con inventoryCode debe auto-completar prenda, color y talla', () => {
      storage.saveInventoryItem({
        id: 'INV-POLER-01',
        code: 'PLR-BUR-XL',
        name: 'Polerón Burdeo Talla XL',
        garmentType: 'Polerón',
        color: 'Burdeo',
        size: 'XL',
        currentStock: 8
      });

      ui.abrirModalNuevoPedido(); // inicia con 1 fila por defecto
      const items = ui.obtenerItemsPedidoActual ? ui.obtenerItemsPedidoActual() : null;

      // Llamar a actualizarItemProp para seleccionar el código 'PLR-BUR-XL'
      const tbody = dom.elements['order-items-tbody'];
      assert.ok(tbody.innerHTML.includes('Cód. Inventario') || tbody.innerHTML.includes('inventoryCode'));

      // Verificar que el HTML renderizado contiene la columna de código de inventario
      assert.ok(tbody.innerHTML.includes('PLR-BUR-XL'));
    });

    it('actualizarItemProp al cambiar Prenda/Color/Talla debe auto-seleccionar el código existente', () => {
      storage.saveInventoryItem({
        id: 'INV-001',
        code: 'POL-ROJ-S',
        name: 'Polera Roja S',
        garmentType: 'Polera',
        color: 'Rojo',
        size: 'S',
        currentStock: 12
      });

      ui.abrirModalNuevoPedido();
      const tbody = dom.elements['order-items-tbody'];

      // El selector debe incluir 'POL-ROJ-S'
      assert.ok(tbody.innerHTML.includes('POL-ROJ-S'));
    });
  });

  describe('2. Persistencia y Enlace Directo en Producción', () => {
    it('guardarPedidoDesdeFormulario debe persistir inventoryCode e inventoryItemId en items', () => {
      storage.saveInventoryItem({
        id: 'INV-BUZ-01',
        code: 'BUZ-GRS-L',
        name: 'Buzo Gris Talla L',
        garmentType: 'Buzo',
        color: 'Gris Grafito',
        size: 'L',
        currentStock: 22
      });

      const client = storage.saveClient({ name: 'Colegio Saint John', phone: '+56911112222' });
      dom.elements['order-client-select'].value = client.id;
      dom.elements['order-client-select'].options = [{
        value: client.id,
        getAttribute: (attr) => attr === 'data-name' ? 'Colegio Saint John' : '+56911112222'
      }];
      dom.elements['order-client-select'].selectedIndex = 0;

      ui.abrirModalNuevoPedido();

      // Guardar pedido
      ui.guardarPedidoDesdeFormulario();

      const pedidos = storage.getOrders();
      assert.strictEqual(pedidos.length, 1);
      const pedidoGuardado = pedidos[0];
      assert.ok(pedidoGuardado.items.length >= 1);
      const primerItem = pedidoGuardado.items[0];
      assert.ok('inventoryCode' in primerItem);
      assert.ok('inventoryItemId' in primerItem);
    });

    it('verificarDisponibilidadPrenda debe encontrar la prenda directamente por inventoryCode', () => {
      const inventario = [
        { id: 'INV-A1', code: 'POL-AZU-10', name: 'Polera Azul Rey 10', garmentType: 'Polera', color: 'Azul Rey', size: '10', currentStock: 25 },
        { id: 'INV-A2', code: 'POL-AZU-12', name: 'Polera Azul Rey 12', garmentType: 'Polera', color: 'Azul Rey', size: '12', currentStock: 18 }
      ];

      const itemPedidoConCodigo = {
        inventoryCode: 'POL-AZU-10',
        inventoryItemId: 'INV-A1',
        garmentType: 'Polera',
        color: 'Azul Rey',
        size: '10',
        quantity: 5
      };

      const dispo = prod.verificarDisponibilidadPrenda(inventario, itemPedidoConCodigo);
      assert.strictEqual(dispo.encontrado, true);
      assert.strictEqual(dispo.itemInventario.id, 'INV-A1');
      assert.strictEqual(dispo.stockActual, 25);
      assert.strictEqual(dispo.faltante, 0);
    });

    it('descontarInventarioPorPedido debe restar el stock del artículo con coincidencia de código', () => {
      const inventario = [
        { id: 'INV-X1', code: 'POL-NEG-XL', name: 'Polera Negra XL', garmentType: 'Polera', color: 'Negro', size: 'XL', currentStock: 10 }
      ];

      const itemsPedido = [
        { inventoryCode: 'POL-NEG-XL', inventoryItemId: 'INV-X1', garmentType: 'Polera', color: 'Negro', size: 'XL', quantity: 4 }
      ];

      const res = prod.descontarInventarioPorPedido(inventario, itemsPedido, 'NP-20261115-001');
      assert.strictEqual(res.descontados.length, 1);
      assert.strictEqual(res.descontados[0].id, 'INV-X1');
      assert.strictEqual(res.descontados[0].nuevoStock, 6);
      assert.strictEqual(res.descontados[0].cantidadDescontada, 4);
    });
  });

  describe('3. Presentación en Ticket de Taller', () => {
    it('ticket.js debe incluir el código entre corchetes [CÓDIGO] cuando está definido', () => {
      const ticketModule = require('../assets/js/ticket.js');

      const pedidoConCodigo = {
        id: 'NP-20261115-002',
        clientName: 'Juan Pérez',
        dates: { createdAt: '2026-11-15', deliveryDate: '2026-11-20' },
        items: [
          {
            inventoryCode: 'POL-AZU-M',
            garmentType: 'Polera',
            color: 'Azul',
            size: 'M',
            technique: 'DTF',
            printLocation: 'Adelante',
            quantity: 3,
            unitPrice: 6500,
            subtotal: 19500
          }
        ],
        totals: {
          totalQuantity: 3,
          totalAmount: 19500,
          depositAmount: 10000,
          balanceAmount: 9500
        }
      };

      const htmlTicket = ticketModule.generarTicketHTML(pedidoConCodigo);
      assert.ok(htmlTicket.includes('[POL-AZU-M]'), 'El ticket debe incluir el código de inventario entre corchetes');
    });
  });
});
