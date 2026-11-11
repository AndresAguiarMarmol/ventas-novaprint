/**
 * tests/clean_test_movements.test.js — Pruebas unitarias para Spec 029
 * Limpieza segura de movimientos contables de prueba preservando operaciones normales de compra y venta de poleras.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock simple de localStorage para el entorno de test
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

describe('Spec 029 — Limpieza Segura de Movimientos Contables de Prueba', () => {
  let storage;
  let accounting;
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    global.localStorage = mockStorage;
    global.window = { localStorage: mockStorage };

    // Limpiar caché de require
    const storagePath = path.resolve(__dirname, '../assets/js/storage.js');
    const accountingPath = path.resolve(__dirname, '../assets/js/accounting.js');
    delete require.cache[require.resolve(storagePath)];
    delete require.cache[require.resolve(accountingPath)];

    storage = require(storagePath);
    accounting = require(accountingPath);
    global.NovaprintStorage = storage;
    global.NovaprintAccounting = accounting;
  });

  describe('Función de Detección esRegistroDePrueba', () => {
    it('detecta registros con IDs de prueba o demo de fábrica', () => {
      assert.equal(storage.esRegistroDePrueba({ id: 'ORD-TEST-001' }, 'pedidos'), true);
      assert.equal(storage.esRegistroDePrueba({ id: 'PUR-TEST-001' }, 'compras'), true);
      assert.equal(storage.esRegistroDePrueba({ id: 'TEST-EXP-01' }, 'gastos'), true);
      assert.equal(storage.esRegistroDePrueba({ id: 'TRF-TEST-88' }, 'transferencias'), true);
    });

    it('detecta gastos y transferencias con descripciones de prueba o ensayo del sistema', () => {
      assert.equal(storage.esRegistroDePrueba({ id: 'EXP-101', description: 'Gasto de prueba del sistema contable' }, 'gastos'), true);
      assert.equal(storage.esRegistroDePrueba({ id: 'TRF-102', description: 'Traspaso de prueba entre cuentas' }, 'transferencias'), true);
      assert.equal(storage.esRegistroDePrueba({ id: 'TRF-103', reference: 'TRF-DEMO-SISTEMA' }, 'transferencias'), true);
    });

    it('preserva operaciones normales de venta y compra de poleras del taller', () => {
      const pedidoReal = {
        id: 'ORD-20261105-001',
        clientName: 'Colegio Saint George',
        items: [{ garmentType: 'Polera Polo', color: 'Negro', quantity: 45, unitPrice: 7500 }],
        notes: 'Entrega para evento deportivo anual'
      };
      assert.equal(storage.esRegistroDePrueba(pedidoReal, 'pedidos'), false);

      const compraReal = {
        id: 'CMP-20261106-001',
        supplierName: 'Distribuidora Textil Bellavista',
        items: [{ itemName: 'Polera Algodón 100% Cuello Redondo', quantity: 100, unitCost: 2800 }],
        invoiceNumber: 'FAC-88412'
      };
      assert.equal(storage.esRegistroDePrueba(compraReal, 'compras'), false);
    });

    it('preserva gastos de taller legítimos clasificados en Mermas y Pruebas', () => {
      const gastoMerma = {
        id: 'EXP-20261108-001',
        category: 'Mermas y Pruebas',
        description: 'Pérdida por ajuste de temperatura en plancha de sublimación',
        amount: 8500
      };
      assert.equal(storage.esRegistroDePrueba(gastoMerma, 'gastos'), false);
    });

    it('preserva transferencias y gastos legítimos del usuario', () => {
      const gastoReal = {
        id: 'EXP-20261109-002',
        category: 'Insumos de Impresión',
        description: 'Compra de cinta térmica y papel protector',
        amount: 14900
      };
      assert.equal(storage.esRegistroDePrueba(gastoReal, 'gastos'), false);

      const transferenciaReal = {
        id: 'TRF-20261110-001',
        originAccountId: '1102',
        destinationAccountId: '1101',
        amount: 50000,
        description: 'Retiro en efectivo para caja chica de taller'
      };
      assert.equal(storage.esRegistroDePrueba(transferenciaReal, 'transferencias'), false);
    });
  });

  describe('Purga Segura de Movimientos Contables (purgarMovimientosPrueba)', () => {
    it('elimina los movimientos de prueba y mantiene intactas las ventas y compras reales', () => {
      // Configurar datos iniciales combinando reales y de prueba
      const pedidos = [
        { id: 'NP-20261101-001', clientName: 'Club Deportivo Leones', total: 120000 }, // Prueba demo
        { id: 'ORD-20261102-005', clientName: 'Constructora Andes', items: [{ garmentType: 'Polera Pique', quantity: 30 }], total: 240000 } // Real
      ];
      const compras = [
        { id: 'CMP-20261028-001', supplierName: 'Textiles Santiago', invoiceNumber: 'FAC-9120', total: 95000 }, // Prueba demo
        { id: 'PUR-20261103-001', supplierName: 'Roly Chile', invoiceNumber: 'FAC-74125', total: 185000 } // Real
      ];
      const gastos = [
        { id: 'EXP-TEST-001', description: 'Gasto ficticio para testing contable', amount: 15000 }, // Prueba
        { id: 'EXP-20261104-001', category: 'Servicios Básicos', description: 'Pago de electricidad taller', amount: 45000 } // Real usuario
      ];
      const transferencias = [
        { id: 'TRF-TEST-001', description: 'Traspaso de prueba QA', amount: 10000 }, // Prueba
        { id: 'TRF-20261104-002', description: 'Traspaso a cuenta corriente operativa', amount: 80000 } // Real usuario
      ];

      mockStorage.setItem('novaprint_orders', JSON.stringify(pedidos));
      mockStorage.setItem('novaprint_purchases', JSON.stringify(compras));
      mockStorage.setItem('novaprint_expenses', JSON.stringify(gastos));
      mockStorage.setItem('novaprint_transfers', JSON.stringify(transfers = transferencias));

      // Ejecutar purga (Spec 030: Pedidos y compras NUNCA se eliminan)
      const res = storage.purgarMovimientosPrueba();
      assert.equal(res.success, true);
      assert.equal(res.totalPurgados, 2);
      assert.equal(res.eliminados.pedidos, 0);
      assert.equal(res.eliminados.compras, 0);
      assert.equal(res.eliminados.gastos, 1);
      assert.equal(res.eliminados.transferencias, 1);

      // Verificar que los pedidos y compras se preservan íntegramente
      const pedidosFinales = storage.getOrders();
      const comprasFinales = storage.getPurchases();
      const gastosFinales = storage.getExpenses();
      const transferenciasFinales = storage.getTransfers();

      assert.equal(pedidosFinales.length, 2);
      assert.equal(comprasFinales.length, 2);
      assert.equal(gastosFinales.length, 1);
      assert.equal(gastosFinales[0].id, 'EXP-20261104-001');
      assert.equal(transferenciasFinales.length, 1);
      assert.equal(transferenciasFinales[0].id, 'TRF-20261104-002');
    });

    it('no modifica ni elimina el Plan de Cuentas Contable bajo ninguna circunstancia', () => {
      const planOriginal = storage.getAccounts();
      assert.ok(planOriginal.length >= 10, 'El plan de cuentas debe tener al menos 10 cuentas');

      storage.purgarMovimientosPrueba();

      const planPosterior = storage.getAccounts();
      assert.equal(planPosterior.length, planOriginal.length);
      assert.deepEqual(planPosterior.map(c => c.code), planOriginal.map(c => c.code));
    });
  });

  describe('Integración con Interfaz de Usuario (index.html & ui.js)', () => {
    it('index.html incluye el botón #btn-journal-clean-tests y el modal #dialog-clean-tests', () => {
      const htmlPath = path.resolve(__dirname, '../index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');

      assert.ok(
        htmlContent.includes('id="btn-journal-clean-tests"'),
        'Debe existir el botón #btn-journal-clean-tests en index.html'
      );
      assert.ok(
        htmlContent.includes('id="dialog-clean-tests"'),
        'Debe existir el modal <dialog id="dialog-clean-tests"> en index.html'
      );
      assert.ok(
        htmlContent.includes('id="btn-confirm-clean-tests"'),
        'Debe existir el botón de confirmación #btn-confirm-clean-tests'
      );
    });

    it('ui.js exporta abrirModalLimpiarPruebas y confirmarLimpiarPruebas', () => {
      const uiPath = path.resolve(__dirname, '../assets/js/ui.js');
      const ui = require(uiPath);

      assert.equal(typeof ui.abrirModalLimpiarPruebas, 'function');
      assert.equal(typeof ui.confirmarLimpiarPruebas, 'function');
    });
  });
});

