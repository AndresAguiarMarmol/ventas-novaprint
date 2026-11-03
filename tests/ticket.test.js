const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const ticket = require('../assets/js/ticket.js');
const sales = require('../assets/js/sales.js');

describe('Spec 001 - Módulo de Tickets y Comprobantes (ticket.js)', () => {
  const settings = {
    businessName: 'Novaprint Estampados',
    rut: '76.890.123-4',
    phone: '+56987654321',
    address: 'Av. Salvador 450, Santiago',
    ticketFooter: '¡Gracias por su compra!'
  };

  const pedido = {
    id: 'NP-20261101-001',
    clientName: 'Club Deportivo Leones',
    clientPhone: '+56987654321',
    dates: {
      createdAt: '2026-11-01T10:00:00.000Z',
      deliveryDate: '2026-11-05'
    },
    items: [
      {
        garmentType: 'Polera',
        color: 'Rojo',
        size: 'L',
        technique: 'DTF',
        printLocation: 'Pecho grande',
        quantity: 10,
        unitPrice: 7500,
        subtotal: 75000
      }
    ],
    totals: {
      totalQuantity: 10,
      totalAmount: 75000,
      depositAmount: 40000,
      balanceAmount: 35000,
      paymentStatus: 'Abonado'
    },
    status: 'En producción',
    notes: 'Entregar doblado'
  };

  it('genera correctamente el HTML del ticket con todos los datos clave', () => {
    const html = ticket.generarTicketHTML(pedido, settings);
    assert.ok(html.includes('Novaprint Estampados'));
    assert.ok(html.includes('NP-20261101-001'));
    assert.ok(html.includes('Club Deportivo Leones'));
    assert.ok(html.includes('Polera'));
    assert.ok(html.includes('DTF'));
    assert.ok(html.includes('75.000') || html.includes('75000'));
    assert.ok(html.includes('40.000') || html.includes('40000'));
    assert.ok(html.includes('35.000') || html.includes('35000'));
    assert.ok(html.includes('¡Gracias por su compra!'));
  });

  it('incluye desglose de IVA (19%) y Delivery cuando están presentes en los totales', () => {
    const pedidoConIvaYDelivery = {
      ...pedido,
      totals: {
        totalQuantity: 10,
        subtotalBruto: 75000,
        volumeDiscountPercent: 5,
        volumeDiscountAmount: 3750,
        netAmount: 71250,
        applyIva: true,
        ivaPercent: 19,
        ivaAmount: 13538,
        applyDelivery: true,
        deliveryAmount: 4000,
        totalAmount: 88788,
        depositAmount: 50000,
        balanceAmount: 38788,
        paymentStatus: 'Abonado'
      }
    };

    const html = ticket.generarTicketHTML(pedidoConIvaYDelivery, settings);
    assert.ok(html.includes('IVA (19%):'));
    assert.ok(html.includes('13.538') || html.includes('13538'));
    assert.ok(html.includes('Delivery / Envío:'));
    assert.ok(html.includes('4.000') || html.includes('4000'));
    assert.ok(html.includes('88.788') || html.includes('88788'));
  });

  it('maneja de forma segura pedidos nulos o vacíos', () => {
    const html = ticket.generarTicketHTML(null, settings);
    assert.ok(html.includes('No se ha seleccionado ningún pedido'));
  });
});

