// tests/inventory_order_deduction.test.js
// Spec 041 — Descuento Automático de Inventario al Terminar o Avanzar Pedido

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

describe('Spec 041 — Descuento Automático de Inventario al Terminar o Avanzar Pedido', () => {
  let mockStorage;
  let storage;
  let prod;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    global.window = { localStorage: mockStorage };
    global.localStorage = mockStorage;

    delete require.cache[require.resolve('../assets/js/production.js')];
    delete require.cache[require.resolve('../assets/js/storage.js')];

    prod = require('../assets/js/production.js');
    global.NovaprintProduction = prod;

    storage = require('../assets/js/storage.js');
    global.NovaprintStorage = storage;
  });

  describe('1. Funciones Puras en production.js', () => {
    it('descontarInventarioPorPedido debe descontar las prendas y registrar lastStockAdjustment', () => {
      const inventario = [
        { id: 'INV-01', code: 'POL-AZU-M', name: 'Polera Azul Talla M', garmentType: 'Polera', color: 'Azul', size: 'M', currentStock: 20 },
        { id: 'INV-02', code: 'POL-NEG-L', name: 'Polera Negra Talla L', garmentType: 'Polera', color: 'Negro', size: 'L', currentStock: 10 }
      ];

      const itemsPedido = [
        { garmentType: 'Polera', color: 'Azul', size: 'M', quantity: 5 }
      ];

      const res = prod.descontarInventarioPorPedido(inventario, itemsPedido, 'NP-20261111-002');
      assert.strictEqual(res.descontados.length, 1);
      assert.strictEqual(res.descontados[0].id, 'INV-01');
      assert.strictEqual(res.descontados[0].nuevoStock, 15);
      assert.strictEqual(res.descontados[0].cantidadDescontada, 5);

      const itemModificado = res.nuevoInventario.find(i => i.id === 'INV-01');
      assert.strictEqual(itemModificado.currentStock, 15);
      assert.ok(itemModificado.lastStockAdjustment);
      assert.strictEqual(itemModificado.lastStockAdjustment.delta, -5);
      assert.strictEqual(itemModificado.lastStockAdjustment.reason, 'Consumo por Pedido NP-20261111-002');
    });

    it('restituirInventarioPorPedido debe reintegrar las prendas al stock ante anulación', () => {
      const inventario = [
        { id: 'INV-01', code: 'POL-AZU-M', name: 'Polera Azul Talla M', garmentType: 'Polera', color: 'Azul', size: 'M', currentStock: 15 }
      ];

      const itemsPedido = [
        { garmentType: 'Polera', color: 'Azul', size: 'M', quantity: 5 }
      ];

      const res = prod.restituirInventarioPorPedido(inventario, itemsPedido, 'NP-20261111-002');
      assert.strictEqual(res.restituidos.length, 1);
      assert.strictEqual(res.restituidos[0].nuevoStock, 20);
      assert.strictEqual(res.restituidos[0].cantidadRestituida, 5);

      const itemRestituido = res.nuevoInventario.find(i => i.id === 'INV-01');
      assert.strictEqual(itemRestituido.currentStock, 20);
      assert.strictEqual(itemRestituido.lastStockAdjustment.delta, 5);
      assert.strictEqual(itemRestituido.lastStockAdjustment.reason, 'Restitución por Cancelación Pedido NP-20261111-002');
    });
  });

  describe('2. Integración en storage.js y Control de Estados', () => {
    it('updateOrderStatus debe descontar stock automáticamente al pasar a "Listo para entrega" y fijar stockDeducted', () => {
      storage.saveInventoryItem({
        id: 'INV-01',
        code: 'POL-AZU-M',
        name: 'Polera Azul Talla M',
        garmentType: 'Polera',
        color: 'Azul',
        size: 'M',
        currentStock: 25
      });

      const pedido = storage.saveOrder({
        id: 'NP-20261111-002',
        clientId: 'CLI-01',
        items: [{ garmentType: 'Polera', color: 'Azul', size: 'M', quantity: 10, unitPrice: 5000 }],
        status: 'Confirmado'
      });

      assert.strictEqual(pedido.stockDeducted, undefined);
      assert.strictEqual(storage.getInventoryItemById('INV-01').currentStock, 25);

      // Avanzar a 'Listo para entrega'
      const actualizado = storage.updateOrderStatus('NP-20261111-002', 'Listo para entrega');

      assert.strictEqual(actualizado.status, 'Listo para entrega');
      assert.strictEqual(actualizado.stockDeducted, true);
      assert.ok(actualizado.stockDeductedAt);

      // Comprobar que el inventario se rebajó de 25 a 15
      const itemInv = storage.getInventoryItemById('INV-01');
      assert.strictEqual(itemInv.currentStock, 15, 'El stock debió disminuir de 25 a 15');
    });

    it('debe ser estrictamente idempotente: no descontar doble al pasar de "Listo para entrega" a "Entregado"', () => {
      storage.saveInventoryItem({
        id: 'INV-01',
        code: 'POL-AZU-M',
        name: 'Polera Azul Talla M',
        garmentType: 'Polera',
        color: 'Azul',
        size: 'M',
        currentStock: 20
      });

      storage.saveOrder({
        id: 'NP-20261111-002',
        clientId: 'CLI-01',
        items: [{ garmentType: 'Polera', color: 'Azul', size: 'M', quantity: 6, unitPrice: 5000 }],
        status: 'Confirmado'
      });

      // Primer avance: 'Listo para entrega'
      storage.updateOrderStatus('NP-20261111-002', 'Listo para entrega');
      assert.strictEqual(storage.getInventoryItemById('INV-01').currentStock, 14);

      // Segundo avance: 'Entregado'
      storage.updateOrderStatus('NP-20261111-002', 'Entregado');
      assert.strictEqual(storage.getInventoryItemById('INV-01').currentStock, 14, 'El stock no debió cambiar de 14');
    });

    it('updateOrderStatus debe restituir el stock si un pedido con stockDeducted pasa a "Cancelado"', () => {
      storage.saveInventoryItem({
        id: 'INV-01',
        code: 'POL-AZU-M',
        name: 'Polera Azul Talla M',
        garmentType: 'Polera',
        color: 'Azul',
        size: 'M',
        currentStock: 30
      });

      storage.saveOrder({
        id: 'NP-20261111-002',
        clientId: 'CLI-01',
        items: [{ garmentType: 'Polera', color: 'Azul', size: 'M', quantity: 8, unitPrice: 5000 }],
        status: 'Confirmado'
      });

      // Pasar a producción/terminado: descuenta
      storage.updateOrderStatus('NP-20261111-002', 'Listo para entrega');
      assert.strictEqual(storage.getInventoryItemById('INV-01').currentStock, 22);

      // Pasar a Cancelado: restituye
      const cancelado = storage.updateOrderStatus('NP-20261111-002', 'Cancelado');
      assert.strictEqual(cancelado.status, 'Cancelado');
      assert.strictEqual(cancelado.stockDeducted, false);
      assert.strictEqual(storage.getInventoryItemById('INV-01').currentStock, 30, 'El stock debió volver a 30');
    });

    it('reconciliarDescuentosPedidosTerminados debe procesar órdenes concluidas preexistentes sin stockDeducted', () => {
      storage.saveInventoryItem({
        id: 'INV-POLERONES',
        code: 'POL-AZU-XL',
        name: 'Polerón Lisa - Azul Talla XL',
        garmentType: 'Polerón',
        color: 'Azul',
        size: 'XL',
        currentStock: 50
      });

      // Simular pedido previamente concluido por el usuario sin bandera stockDeducted
      const ordenesPrevias = [
        {
          id: 'NP-20261111-002',
          clientId: 'CLI-002',
          items: [{ garmentType: 'Polerón', color: 'Azul', size: 'XL', quantity: 15 }],
          status: 'Listo para entrega'
        }
      ];
      mockStorage.setItem('novaprint_orders', JSON.stringify(ordenesPrevias));

      assert.strictEqual(storage.getInventoryItemById('INV-POLERONES').currentStock, 50);

      // Ejecutar reconciliación automática (como ocurre en main.js:init)
      const res = storage.reconciliarDescuentosPedidosTerminados();
      assert.strictEqual(res.pedidosReconciliados, 1);

      // Comprobar que el inventario disminuyó en las 15 unidades del pedido
      const itemInv = storage.getInventoryItemById('INV-POLERONES');
      assert.strictEqual(itemInv.currentStock, 35, 'El stock debió rebajarse a 35');

      const ordenActualizada = storage.getOrderById('NP-20261111-002');
      assert.strictEqual(ordenActualizada.stockDeducted, true);
    });
  });

  describe('3. Integración en ui.js y Fabricación', () => {
    it('avanzarEtapaProyecto a "Terminado" debe actualizar el pedido a "Listo para entrega" y descontar existencias', () => {
      // Mock de showToast y NovaprintMain
      global.NovaprintMain = { refrescarDatos: () => {} };

      storage.saveInventoryItem({
        id: 'INV-FAB',
        code: 'POL-NEG-M',
        name: 'Polera Negra Talla M',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'M',
        currentStock: 40
      });

      const pedido = storage.saveOrder({
        id: 'NP-20261111-005',
        clientId: 'CLI-005',
        items: [{ garmentType: 'Polera', color: 'Negro', size: 'M', quantity: 12 }],
        status: 'Confirmado'
      });

      const proyecto = storage.saveProject({
        id: 'PRJ-TEST-001',
        orderId: 'NP-20261111-005',
        stage: 'Control Calidad'
      });

      delete require.cache[require.resolve('../assets/js/ui.js')];
      const ui = require('../assets/js/ui.js');
      global.NovaprintUI = ui;

      // Avanzar de 'Control Calidad' a 'Terminado'
      ui.avanzarEtapaProyecto('PRJ-TEST-001');

      const prjActualizado = storage.getProjectById('PRJ-TEST-001');
      assert.strictEqual(prjActualizado.stage, 'Terminado');

      const pedActualizado = storage.getOrderById('NP-20261111-005');
      assert.strictEqual(pedActualizado.status, 'Listo para entrega');
      assert.strictEqual(pedActualizado.stockDeducted, true);

      const invItem = storage.getInventoryItemById('INV-FAB');
      assert.strictEqual(invItem.currentStock, 28, 'El stock debió rebajarse de 40 a 28');
    });
  });
});
