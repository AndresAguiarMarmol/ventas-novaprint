const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

describe('Spec 050 — Comprobante de Venta & Taller Completo (Ticket & WhatsApp)', () => {
  let sales;
  let ticket;
  let storage;

  const mockSettings = {
    businessName: 'Novaprint Estampados',
    rut: '76.890.123-4',
    phone: '+56987654321',
    address: 'Av. Salvador 450, Santiago',
    ticketFooter: '¡Gracias por confiar en Novaprint!'
  };

  const mockPedidoCompleto = {
    id: 'NP-20261118-001',
    clientId: 'CLI-001',
    clientName: 'Deportes Cordillera',
    clientPhone: '+56911223344',
    dates: {
      createdAt: '2026-11-18T10:00:00.000Z',
      deliveryDate: '2026-11-25'
    },
    items: [
      {
        id: 'item-1',
        inventoryCode: 'POL-001',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'L',
        technique: 'DTF',
        printLocation: 'Adelante',
        quantity: 12,
        unitPrice: 10000,
        subtotal: 120000,
        notes: 'Logo en pecho izquierdo 10cm'
      },
      {
        id: 'item-2',
        inventoryCode: '',
        garmentType: 'Polerón Canguro',
        color: 'Gris Melange',
        size: 'XL',
        technique: 'Bordado',
        printLocation: 'Ambos',
        quantity: 4,
        unitPrice: 25000,
        subtotal: 100000,
        notes: 'Espalda con número bordado'
      }
    ],
    totals: {
      totalQuantity: 16,
      subtotalBruto: 220000,
      applyDiscount: true,
      volumeDiscountPercent: 10,
      volumeDiscountAmount: 22000,
      netAmount: 198000,
      applyIva: true,
      ivaPercent: 19,
      ivaAmount: 37620,
      applyDelivery: true,
      deliveryAmount: 5000,
      totalAmount: 240620,
      depositAmount: 100000,
      balanceAmount: 140620,
      paymentStatus: 'Abonado'
    },
    status: 'En producción',
    notes: 'Despachar por Starken a sucursal La Florida'
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
    storage = global.NovaprintStorage;

    require(path.join(__dirname, '../assets/js/sales.js'));
    sales = global.NovaprintSales;

    require(path.join(__dirname, '../assets/js/ticket.js'));
    ticket = global.NovaprintTicket;
  });

  beforeEach(() => {
    global.localStorage.clear();
    // Registrar cliente de prueba con RUT y dirección
    if (storage && typeof storage.saveClient === 'function') {
      storage.saveClient({
        id: 'CLI-001',
        name: 'Deportes Cordillera',
        rut: '77.555.444-3',
        address: 'Calle Los Andes 789, Santiago',
        phone: '+56911223344'
      });
    }
  });

  describe('1. Mensaje de WhatsApp Completo (sales.generarTextoWhatsApp)', () => {
    it('incluye título oficial, N° de comprobante, fecha de emisión, estado de taller y datos del cliente', () => {
      const msg = sales.generarTextoWhatsApp(mockPedidoCompleto, mockSettings);

      assert.ok(msg.includes('Comprobante de Venta & Taller'), 'Debe incluir el título oficial de Comprobante de Venta & Taller');
      assert.ok(msg.includes('NP-20261118-001'), 'Debe incluir el N° de comprobante');
      assert.ok(msg.includes('Fecha de Emisión:'), 'Debe incluir la fecha de emisión');
      assert.ok(msg.includes('Deportes Cordillera'), 'Debe incluir el nombre del cliente');
      assert.ok(msg.includes('77.555.444-3'), 'Debe incluir el RUT del cliente');
      assert.ok(msg.includes('Calle Los Andes 789'), 'Debe incluir la dirección del cliente');
      assert.ok(msg.includes('En producción'), 'Debe incluir el Estado de Taller');
    });

    it('incluye desglose completo por prenda con precio unitario, subtotal de línea, código de bodega y observaciones', () => {
      const msg = sales.generarTextoWhatsApp(mockPedidoCompleto, mockSettings);

      assert.ok(msg.includes('[POL-001]'), 'Debe incluir el código de inventario de la prenda');
      assert.ok(msg.includes('$10.000'), 'Debe incluir el precio unitario de la prenda 1');
      assert.ok(msg.includes('$120.000'), 'Debe incluir el subtotal de la línea de prenda 1');
      assert.ok(msg.includes('Logo en pecho izquierdo 10cm'), 'Debe incluir la observación de la prenda 1');
      assert.ok(msg.includes('$25.000'), 'Debe incluir el precio unitario de la prenda 2');
      assert.ok(msg.includes('$100.000'), 'Debe incluir el subtotal de la línea de prenda 2');
      assert.ok(msg.includes('Espalda con número bordado'), 'Debe incluir la observación de la prenda 2');
    });

    it('incluye resumen financiero transparente con Total Prendas, Subtotal Bruto, Descuentos, Neto, IVA, Delivery, Total, Abono, Saldo y Estado de Pago', () => {
      const msg = sales.generarTextoWhatsApp(mockPedidoCompleto, mockSettings);

      assert.ok(msg.includes('16 un.'), 'Debe incluir el total de prendas acumuladas');
      assert.ok(msg.includes('Subtotal:'), 'Debe incluir el Subtotal Bruto');
      assert.ok(msg.includes('$220.000'), 'Debe contener el monto del subtotal bruto');
      assert.ok(msg.includes('Descuento por volumen (10%):'), 'Debe incluir el porcentaje de descuento');
      assert.ok(msg.includes('-$22.000'), 'Debe incluir el monto del descuento');
      assert.ok(msg.includes('Monto Neto:'), 'Debe incluir el Monto Neto');
      assert.ok(msg.includes('$198.000'), 'Debe contener el monto neto tras descuento');
      assert.ok(msg.includes('IVA (19%):'), 'Debe incluir el IVA');
      assert.ok(msg.includes('Delivery / Envío:'), 'Debe incluir el delivery');
      assert.ok(msg.includes('$240.620'), 'Debe incluir el total general');
      assert.ok(msg.includes('$100.000'), 'Debe incluir el abono');
      assert.ok(msg.includes('$140.620'), 'Debe incluir el saldo pendiente');
      assert.ok(msg.includes('Estado de Pago:* Abonado'), 'Debe incluir el estado de pago explícito');
      assert.ok(msg.includes('Despachar por Starken a sucursal La Florida'), 'Debe incluir las notas generales del taller');
      assert.ok(msg.includes('76.890.123-4'), 'Debe incluir el RUT de la empresa');
    });
  });

  describe('2. Ticket de Impresión HTML Completo (ticket.generarTicketHTML)', () => {
    it('incluye el Estado de Taller destacado y datos ampliados del cliente (RUT y Dirección)', () => {
      const html = ticket.generarTicketHTML(mockPedidoCompleto, mockSettings);

      assert.ok(html.includes('Estado de Taller:'), 'Debe incluir el rótulo de Estado de Taller');
      assert.ok(html.includes('En producción'), 'Debe mostrar el estado actual del pedido');
      assert.ok(html.includes('77.555.444-3'), 'Debe mostrar el RUT del cliente');
      assert.ok(html.includes('Calle Los Andes 789'), 'Debe mostrar la dirección del cliente');
    });

    it('incluye siempre el Subtotal Bruto y el Monto Neto en el ticket impreso', () => {
      // Caso 1: Con descuento
      const htmlConDesc = ticket.generarTicketHTML(mockPedidoCompleto, mockSettings);
      assert.ok(htmlConDesc.includes('Subtotal Bruto:'), 'Debe mostrar Subtotal Bruto con descuento');
      assert.ok(htmlConDesc.includes('Monto Neto:'), 'Debe mostrar Monto Neto con descuento');

      // Caso 2: Sin descuento ni IVA ni delivery
      const pedidoSimple = {
        id: 'NP-SIMPLE',
        clientName: 'Cliente Simple',
        dates: { createdAt: '2026-11-18', deliveryDate: '2026-11-20' },
        status: 'Cotización',
        items: [
          { garmentType: 'Polera', color: 'Blanco', size: 'M', technique: 'DTF', quantity: 2, unitPrice: 8000, subtotal: 16000 }
        ],
        totals: {
          totalQuantity: 2,
          subtotalBruto: 16000,
          netAmount: 16000,
          totalAmount: 16000,
          depositAmount: 0,
          balanceAmount: 16000,
          paymentStatus: 'Pendiente'
        }
      };

      const htmlSimple = ticket.generarTicketHTML(pedidoSimple, mockSettings);
      assert.ok(htmlSimple.includes('Subtotal Bruto:'), 'Debe mostrar Subtotal Bruto incluso en pedidos simples');
      assert.ok(htmlSimple.includes('Monto Neto:'), 'Debe mostrar Monto Neto incluso en pedidos simples');
      assert.ok(htmlSimple.includes('Cotización'), 'Debe mostrar el estado Cotización');
    });
  });

  describe('3. Estilos de Impresión (@media print en custom.css)', () => {
    it('custom.css define reglas para evitar recortes de página y saltos rotos', () => {
      const cssContent = fs.readFileSync(path.join(__dirname, '../assets/css/custom.css'), 'utf8');

      assert.match(cssContent, /break-inside:\s*avoid/i, 'Debe incluir reglas de break-inside: avoid');
      assert.match(cssContent, /page-break-inside:\s*avoid/i, 'Debe incluir reglas de page-break-inside: avoid');
      assert.match(cssContent, /overflow:\s*visible/i, 'Debe garantizar overflow: visible en impresión');
      assert.match(cssContent, /max-height:\s*none/i, 'Debe remover restricciones de max-height al imprimir');
    });
  });
});
