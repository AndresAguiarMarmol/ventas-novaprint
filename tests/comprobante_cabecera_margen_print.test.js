const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('Spec 052 — Repetición de Cabecera en Página 2 y Margen Superior Print', () => {
  let ticket;
  let customCssContent;

  const mockSettings = {
    businessName: 'Novaprint Estampados',
    rut: '76.890.123-4',
    phone: '+56987654321',
    address: 'Av. Salvador 450, Santiago',
    ticketFooter: '¡Gracias por su compra!'
  };

  const mockPedido = {
    id: 'NP-20261118-052',
    clientName: 'Cliente Prueba 052',
    clientPhone: '+56911223344',
    dates: {
      createdAt: '2026-11-18T10:00:00.000Z',
      deliveryDate: '2026-11-28'
    },
    items: [
      {
        id: 'item-1',
        inventoryCode: 'POL-001',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'M',
        technique: 'DTF',
        printLocation: 'Frente',
        quantity: 20,
        unitPrice: 5000,
        subtotal: 100000
      }
    ],
    totals: {
      totalQuantity: 20,
      subtotalBruto: 100000,
      applyDiscount: false,
      volumeDiscountPercent: 0,
      volumeDiscountAmount: 0,
      netAmount: 100000,
      applyIva: true,
      ivaPercent: 19,
      ivaAmount: 19000,
      applyDelivery: false,
      deliveryAmount: 0,
      totalAmount: 119000,
      depositAmount: 50000,
      balanceAmount: 69000,
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
    require(path.join(__dirname, '../assets/js/ticket.js'));
    ticket = global.NovaprintTicket;

    customCssContent = fs.readFileSync(path.join(__dirname, '../assets/css/custom.css'), 'utf-8');
  });

  it('1. Genera tabla con clase ticket-table y thead estructurado para repetición', () => {
    const html = ticket.generarTicketHTML(mockPedido, mockSettings);

    assert.ok(html.includes('<table class="ticket-table'), 'La tabla debe tener la clase "ticket-table"');
    assert.ok(html.includes('<thead>'), 'Debe contener un <thead> explícito');
    assert.ok(html.includes('Detalle Prenda'), 'Debe contener la cabecera "Detalle Prenda"');
    assert.ok(html.includes('P. Unit'), 'Debe contener la cabecera "P. Unit"');
    assert.ok(html.includes('Subtotal'), 'Debe contener la cabecera "Subtotal"');
    assert.ok(html.includes('<tbody>'), 'Debe contener un <tbody>');
  });

  it('2. custom.css define @page con margen superior de 15mm en todas las páginas', () => {
    assert.match(customCssContent, /@page\s*\{[^}]*margin-top:\s*15mm;/i, 'Debe tener margin-top: 15mm en @page');
    assert.match(customCssContent, /@page\s*\{[^}]*margin-bottom:\s*12mm;/i, 'Debe tener margin-bottom: 12mm en @page');
    assert.match(customCssContent, /@page\s*\{[^}]*margin-left:\s*8mm;/i, 'Debe tener margin-left: 8mm en @page');
    assert.match(customCssContent, /@page\s*\{[^}]*margin-right:\s*8mm;/i, 'Debe tener margin-right: 8mm en @page');
  });

  it('3. custom.css no congela paginación en @media print (html/body con min-height: 0 !important)', () => {
    assert.match(customCssContent, /html,\s*body\s*\{[^}]*min-height:\s*0\s*!important;/i, 'html, body en print debe tener min-height: 0 !important');
  });

  it('4. custom.css define reglas de table-header-group y estilo para thead en impresión', () => {
    assert.match(customCssContent, /table\.ticket-table[^\{]*\{[^}]*display:\s*table\s*!important;/i, 'table.ticket-table debe tener display: table !important');
    assert.match(customCssContent, /table\.ticket-table thead[^\{]*\{[^}]*display:\s*table-header-group\s*!important;/i, 'thead debe ser table-header-group !important');
    assert.match(customCssContent, /background-color:\s*#f3f4f6\s*!important;/i, 'thead th debe tener fondo gris suave (#f3f4f6)');
    assert.match(customCssContent, /border-bottom:\s*2px\s*solid\s*#9ca3af\s*!important;/i, 'thead th debe tener borde inferior de 2px');
  });
});
