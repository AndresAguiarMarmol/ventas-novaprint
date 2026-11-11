/**
 * tests/kinder_b_deletion_preservation.test.js — Pruebas unitarias para Spec 032
 * Respeto a la eliminación voluntaria del pedido "BRS Kinder B" (sin resurrección zombie).
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

describe('Spec 032 — Respeto a la Eliminación Definitiva del Pedido "BRS Kinder B"', () => {
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

  describe('Eliminación Voluntaria y Registro de Banderas en Configuración', () => {
    it('al eliminar el pedido de Kinder B con deleteOrder se persiste la bandera kinderBOrderDeleted en settings', () => {
      // 1. Reconstituir inicialmente el pedido de Kinder B
      const resInit = storage.asegurarPedidoKinderB();
      assert.equal(resInit.success, true);
      assert.equal(storage.getOrders().length, 1);
      assert.equal(storage.getOrders()[0].id, 'NP-20261102-003');

      // 2. Eliminar el pedido mediante deleteOrder
      const eliminado = storage.deleteOrder('NP-20261102-003');
      assert.equal(eliminado, true);
      assert.equal(storage.getOrders().length, 0);

      // 3. Verificar que la configuración registró la eliminación voluntaria
      const settings = storage.getSettings();
      assert.equal(settings.kinderBOrderDeleted, true);
      assert.equal(settings.kinderBRecoveryApplied_v1, true);
    });

    it('la eliminación de otros pedidos no activa la bandera kinderBOrderDeleted', () => {
      storage.saveOrder({
        id: 'ORD-OTRO-01',
        clientName: 'Colegio San Agustín',
        items: [{ garmentType: 'Polerón', quantity: 10 }]
      });

      const eliminado = storage.deleteOrder('ORD-OTRO-01');
      assert.equal(eliminado, true);

      const settings = storage.getSettings();
      assert.notEqual(settings.kinderBOrderDeleted, true);
    });
  });

  describe('Prevención de Efecto Zombie (No-Resurrección)', () => {
    it('asegurarPedidoKinderB respeta la bandera kinderBOrderDeleted y no resucita el pedido', () => {
      // Inicializar y luego eliminar
      storage.asegurarPedidoKinderB();
      storage.deleteOrder('NP-20261102-003');
      assert.equal(storage.getOrders().length, 0);

      // Invocación posterior de asegurarPedidoKinderB (como si el navegador recargara)
      const resPosterior = storage.asegurarPedidoKinderB();
      assert.equal(resPosterior.success, true);
      assert.equal(resPosterior.restaurado, false);
      assert.equal(resPosterior.eliminadoPorUsuario, true);

      // El array de órdenes sigue estrictamente vacío
      assert.equal(storage.getOrders().length, 0);
    });

    it('si kinderBRecoveryApplied_v1 ya fue aplicada, la falta del pedido no provoca su recreación', () => {
      // Simular que la migración histórica ya concluyó
      const settings = storage.getSettings();
      settings.kinderBRecoveryApplied_v1 = true;
      storage.saveSettings(settings);

      // Lista de pedidos vacía
      assert.equal(storage.getOrders().length, 0);

      // Llamada a asegurarPedidoKinderB
      const res = storage.asegurarPedidoKinderB();
      assert.equal(res.restaurado, false);
      assert.equal(storage.getOrders().length, 0);
    });

    it('permite forzar la recuperación únicamente si se envía la opción { forzar: true }', () => {
      // Marcar como eliminado
      const settings = storage.getSettings();
      settings.kinderBOrderDeleted = true;
      storage.saveSettings(settings);

      // Llamada estándar: no restaura
      const resNorm = storage.asegurarPedidoKinderB();
      assert.equal(resNorm.restaurado, false);
      assert.equal(storage.getOrders().length, 0);

      // Llamada forzada administrativa: sí restaura
      const resForzado = storage.asegurarPedidoKinderB({ forzar: true });
      assert.equal(resForzado.restaurado, true);
      assert.equal(storage.getOrders().length, 1);
      assert.equal(storage.getOrders()[0].id, 'NP-20261102-003');
    });
  });

  describe('Ciclo de Vida de Inicialización (main.js)', () => {
    it('la guardia en arranque omite asegurarPedidoKinderB si el pedido fue eliminado', () => {
      // Simular configuración con el pedido eliminado
      const configKinder = {
        kinderBOrderDeleted: true,
        kinderBRecoveryApplied_v1: true
      };
      mockStorage.setItem('novaprint_settings', JSON.stringify(configKinder));

      // Simular la condición de main.js:init()
      let llamado = false;
      const cfg = storage.getSettings() || {};
      if (!cfg.kinderBRecoveryApplied_v1 && !cfg.kinderBOrderDeleted) {
        llamado = true;
        storage.asegurarPedidoKinderB();
      }

      assert.equal(llamado, false);
      assert.equal(storage.getOrders().length, 0);
    });
  });
});

