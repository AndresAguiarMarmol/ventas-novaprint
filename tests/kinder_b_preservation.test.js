/**
 * tests/kinder_b_preservation.test.js — Pruebas unitarias para Spec 030
 * Recuperación y preservación incondicional del pedido y cliente real "BRS Kinder B".
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

describe('Spec 030 — Recuperación y Preservación Incondicional del Pedido "Kinder B"', () => {
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

  describe('Auto-recuperación de Datos Reales (asegurarPedidoKinderB)', () => {
    it('restaura el cliente BRS Kinder B y el pedido si no existen en la base de datos', () => {
      // Estado inicial vacío
      assert.equal(storage.getClients().length, 0);
      assert.equal(storage.getOrders().length, 0);

      const resultado = storage.asegurarPedidoKinderB();
      assert.equal(resultado.success, true);
      assert.equal(resultado.restaurado, true);

      // Verificar cliente restaurado
      const clientes = storage.getClients();
      assert.equal(clientes.length, 1);
      assert.equal(clientes[0].id, 'CLI-MVYJ0DKL');
      assert.equal(clientes[0].name, 'BRS Kinder B');
      assert.equal(clientes[0].rut, '28037830-5');
      assert.equal(clientes[0].phone, '+56933395447');
      assert.equal(clientes[0].address, 'La Reina');

      // Verificar pedido restaurado
      const pedidos = storage.getOrders();
      assert.equal(pedidos.length, 1);
      assert.equal(pedidos[0].id, 'NP-20261102-003');
      assert.equal(pedidos[0].clientName, 'BRS Kinder B');
      assert.equal(pedidos[0].totals.totalQuantity, 23);
      assert.equal(pedidos[0].totals.totalAmount, 207000);
      assert.equal(pedidos[0].status, 'En producción');
      assert.equal(pedidos[0].items.length, 4); // tallas 8, 10, 12, 14
    });

    it('no duplica ni sobreescribe el pedido si ya existe en la base de datos', () => {
      storage.asegurarPedidoKinderB();
      assert.equal(storage.getOrders().length, 1);

      // Modificación legítima del usuario
      const pedidos = storage.getOrders();
      pedidos[0].notes = 'Actualizado por profesor jefe de Kinder B';
      mockStorage.setItem('novaprint_orders', JSON.stringify(pedidos));

      // Segunda llamada
      const segunda = storage.asegurarPedidoKinderB();
      assert.equal(segunda.restaurado, false);
      const pedidosFinales = storage.getOrders();
      assert.equal(pedidosFinales.length, 1);
      assert.equal(pedidosFinales[0].notes, 'Actualizado por profesor jefe de Kinder B');
    });
  });

  describe('Blindaje Contra Borrado (NO BORRAR)', () => {
    it('esRegistroDePrueba retorna estrictamente false para cualquier entidad de Kinder B', () => {
      const pedidoKinder = {
        id: 'NP-20261102-003',
        clientName: 'BRS Kinder B',
        items: [{ garmentType: 'Polera', quantity: 23 }],
        notes: 'Poleras curso Kinder B'
      };
      assert.equal(storage.esRegistroDePrueba(pedidoKinder, 'pedido'), false);

      const clienteKinder = {
        id: 'CLI-MVYJ0DKL',
        name: 'BRS Kinder B'
      };
      assert.equal(storage.esRegistroDePrueba(clienteKinder, 'cliente'), false);
    });

    it('purgarMovimientosPrueba preserva al 100% el pedido de Kinder B y todos los pedidos de poleras', () => {
      // Registrar Kinder B y otros pedidos
      storage.asegurarPedidoKinderB();

      const pedidoOtro = {
        id: 'ORD-20261108-01',
        clientName: 'Colegio Mariano',
        items: [{ garmentType: 'Polerón', quantity: 15 }]
      };
      storage.saveOrder(pedidoOtro);

      // Agregar gastos de prueba
      mockStorage.setItem('novaprint_expenses', JSON.stringify([
        { id: 'EXP-TEST-99', description: 'Gasto ficticio para testing', amount: 5000 },
        { id: 'EXP-REAL-01', description: 'Compra de cinta para plancha', amount: 12000 }
      ]));

      // Ejecutar purga de movimientos de prueba
      const res = storage.purgarMovimientosPrueba();
      assert.equal(res.success, true);
      assert.equal(res.eliminados.gastos, 1);
      assert.equal(res.eliminados.pedidos, 0); // Pedidos NUNCA se eliminan

      // Verificar que ambos pedidos siguen 100% íntegros
      const pedidos = storage.getOrders();
      assert.equal(pedidos.length, 2);
      assert.ok(pedidos.some(p => p.clientName === 'BRS Kinder B'), 'El pedido de BRS Kinder B debe existir');
      assert.ok(pedidos.some(p => p.clientName === 'Colegio Mariano'), 'El pedido de Colegio Mariano debe existir');
    });

    it('las compras reales a proveedores nunca son alteradas por purgarMovimientosPrueba', () => {
      mockStorage.setItem('novaprint_purchases', JSON.stringify([
        { id: 'CMP-20261108-01', supplierName: 'Textiles Bellavista', items: [{ name: 'Polera Lisa', quantity: 50 }] }
      ]));

      storage.purgarMovimientosPrueba();
      const compras = storage.getPurchases();
      assert.equal(compras.length, 1);
      assert.equal(compras[0].id, 'CMP-20261108-01');
    });
  });
});
