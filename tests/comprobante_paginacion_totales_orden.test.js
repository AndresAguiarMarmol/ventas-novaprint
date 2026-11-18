const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('Spec 051 — Salto de Página, Visibilidad de Totales y Orden por Código (Ticket & WhatsApp)', () => {
  let sales;
  let ticket;

  const mockSettings = {
    businessName: 'Novaprint Estampados',
    rut: '76.890.123-4',
    phone: '+56987654321',
    address: 'Av. Salvador 450, Santiago',
    ticketFooter: '¡Gracias por confiar en Novaprint!'
  };

  // Pedido con prendas desordenadas deliberadamente para probar el ordenamiento alfanumérico natural
  const mockPedidoDesordenado = {
    id: 'NP-20261118-051',
    clientName: 'Colegio San Agustín',
    clientPhone: '+56977889900',
    dates: {
      createdAt: '2026-11-18T12:00:00.000Z',
      deliveryDate: '2026-11-30'
    },
    items: [
      {
        id: 'item-10',
        inventoryCode: 'POL-10',
        garmentType: 'Polera',
        color: 'Blanco',
        size: '14',
        technique: 'Serigrafía',
        printLocation: 'Adelante',
        quantity: 20,
        unitPrice: 6000,
        subtotal: 120000
      },
      {
        id: 'item-sin-codigo',
        inventoryCode: '',
        garmentType: 'Gorra Trucker',
        color: 'Azul Marino',
        size: 'Única',
        technique: 'Bordado',
        printLocation: 'Frente',
        quantity: 10,
        unitPrice: 5000,
        subtotal: 50000
      },
      {
        id: 'item-2',
        inventoryCode: 'POL-2',
        garmentType: 'Polera',
        color: 'Negro',
        size: '12',
        technique: 'Serigrafía',
        printLocation: 'Adelante',
        quantity: 15,
        unitPrice: 6000,
        subtotal: 90000
      },
      {
        id: 'item-buzo',
        inventoryCode: 'BUZ-001',
        garmentType: 'Buzo Completo',
        color: 'Azul Marino',
        size: '14',
        technique: 'Bordado',
        printLocation: 'Pecho',
        quantity: 10,
        unitPrice: 22000,
        subtotal: 220000
      }
    ],
    totals: {
      totalQuantity: 55,
      subtotalBruto: 480000,
      applyDiscount: true,
      volumeDiscountPercent: 20,
      volumeDiscountAmount: 96000,
      netAmount: 384000,
      applyIva: true,
      ivaPercent: 19,
      ivaAmount: 72960,
      applyDelivery: false,
      deliveryAmount: 0,
      totalAmount: 456960,
      depositAmount: 200000,
      balanceAmount: 256960,
      paymentStatus: 'Abonado'
    },
    status: 'En producción'
  };

  before(() => {
    global.window = global;
    global.localStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    };

    require(path.join(__dirname, '../assets/js/storage.js'));
    require(path.join(__dirname, '../assets/js/sales.js'));
    sales = global.NovaprintSales;
    require(path.join(__dirname, '../assets/js/ticket.js'));
    ticket = global.NovaprintTicket;
  });

  describe('1. Ordenamiento Alfanumérico Natural por Código de Producto', () => {
    it('WhatsApp ordena los ítems por código: BUZ-001 primero, luego POL-2, luego POL-10 y sin código al final', () => {
      const msg = sales.generarTextoWhatsApp(mockPedidoDesordenado, mockSettings);

      const idxBuz = msg.indexOf('[BUZ-001]');
      const idxPol2 = msg.indexOf('[POL-2]');
      const idxPol10 = msg.indexOf('[POL-10]');
      const idxGorra = msg.indexOf('Gorra Trucker');

      assert.ok(idxBuz !== -1, 'Debe incluir BUZ-001');
      assert.ok(idxPol2 !== -1, 'Debe incluir POL-2');
      assert.ok(idxPol10 !== -1, 'Debe incluir POL-10');
      assert.ok(idxGorra !== -1, 'Debe incluir Gorra Trucker');

      assert.ok(idxBuz < idxPol2, 'BUZ-001 debe aparecer antes de POL-2');
      assert.ok(idxPol2 < idxPol10, 'POL-2 debe aparecer antes de POL-10 (orden numérico natural)');
      assert.ok(idxPol10 < idxGorra, 'Las prendas con código deben aparecer antes que las prendas sin código');
    });

    it('Ticket HTML ordena los ítems en la tabla por código: BUZ-001, POL-2, POL-10 y sin código al final', () => {
      const html = ticket.generarTicketHTML(mockPedidoDesordenado, mockSettings);

      const idxBuz = html.indexOf('[BUZ-001]');
      const idxPol2 = html.indexOf('[POL-2]');
      const idxPol10 = html.indexOf('[POL-10]');
      const idxGorra = html.indexOf('Gorra Trucker');

      assert.ok(idxBuz !== -1, 'Debe incluir BUZ-001');
      assert.ok(idxPol2 !== -1, 'Debe incluir POL-2');
      assert.ok(idxPol10 !== -1, 'Debe incluir POL-10');
      assert.ok(idxGorra !== -1, 'Debe incluir Gorra Trucker');

      assert.ok(idxBuz < idxPol2, 'BUZ-001 debe preceder a POL-2');
      assert.ok(idxPol2 < idxPol10, 'POL-2 debe preceder a POL-10 en la tabla HTML');
      assert.ok(idxPol10 < idxGorra, 'Los ítems con código van antes de los ítems sin código');
    });
  });

  describe('2. Visibilidad y Blindaje de Subtotales y Totales', () => {
    it('la tabla HTML del ticket asigna anchos dedicados y whitespace-nowrap a P. Unit y Subtotal', () => {
      const html = ticket.generarTicketHTML(mockPedidoDesordenado, mockSettings);

      assert.ok(html.includes('whitespace-nowrap'), 'Debe incluir clase whitespace-nowrap para evitar saltos rotos en cifras');
      assert.ok(html.includes('w-20'), 'Debe incluir ancho dedicado para P. Unit');
      assert.ok(html.includes('w-24'), 'Debe incluir ancho dedicado para Subtotal');
      assert.ok(html.includes('$220.000'), 'Debe mostrar el subtotal de BUZ-001');
      assert.ok(html.includes('$90.000'), 'Debe mostrar el subtotal de POL-2');
      assert.ok(html.includes('$120.000'), 'Debe mostrar el subtotal de POL-10');
    });

    it('el resumen financiero tiene la clase ticket-totals-section para aislamiento de salto de página', () => {
      const html = ticket.generarTicketHTML(mockPedidoDesordenado, mockSettings);

      assert.ok(html.includes('ticket-totals-section'), 'Debe contener la clase ticket-totals-section');
      assert.ok(html.includes('Subtotal Bruto:'), 'Debe mostrar el Subtotal Bruto');
      assert.ok(html.includes('TOTAL A PAGAR:'), 'Debe mostrar el TOTAL A PAGAR');
      assert.ok(html.includes('SALDO PENDIENTE:'), 'Debe mostrar el SALDO PENDIENTE');
    });
  });

  describe('3. Paginación e Impresión Fuera de <dialog> (index.html & custom.css)', () => {
    it('index.html incluye el contenedor print-mount-point directo en body', () => {
      const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
      assert.match(htmlContent, /id="print-mount-point"/, 'index.html debe contener el elemento #print-mount-point');
    });

    it('custom.css define reglas para #print-mount-point y paginación con table-header-group', () => {
      const cssContent = fs.readFileSync(path.join(__dirname, '../assets/css/custom.css'), 'utf8');

      assert.match(cssContent, /#print-mount-point/, 'custom.css debe contener reglas para #print-mount-point');
      assert.match(cssContent, /table-header-group/i, 'Debe repetir encabezados con table-header-group');
      assert.match(cssContent, /\.ticket-totals-section/, 'Debe aplicar break-inside: avoid a .ticket-totals-section');
    });

    it('imprimirTicket monta el contenido en print-mount-point si los elementos existen en el DOM', () => {
      const mountEl = {
        innerHTML: '',
        classList: {
          add(c) {},
          remove(c) {}
        }
      };
      const renderEl = { innerHTML: '<p>Contenido Ticket</p>' };

      global.document = {
        getElementById(id) {
          if (id === 'print-mount-point') return mountEl;
          if (id === 'ticket-container-render') return renderEl;
          return null;
        },
        body: {
          classList: {
            add() {},
            remove() {}
          }
        }
      };
      global.window.print = () => {};

      ticket.imprimirTicket();

      assert.equal(mountEl.innerHTML, '<p>Contenido Ticket</p>', 'imprimirTicket debe copiar el HTML a print-mount-point');
    });
  });
});
