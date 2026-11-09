/**
 * tests/order_accounting_entries.test.js
 * Pruebas unitarias para la Spec 019:
 * Asientos contables automáticos al registrar un pedido:
 * 1. Abono colocado en la cuenta Banco (Caja y Bancos).
 * 2. Saldo pendiente colocado en la cuenta Cuentas por Cobrar.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const accounting = require('../assets/js/accounting.js');
const storage = require('../assets/js/storage.js');

describe('Spec 019 — Asientos Contables al Registrar Pedidos (accounting.js & storage.js)', () => {

  beforeEach(() => {
    storage.clearAllData(true);
  });

  describe('Función generarAsientosPedido', () => {

    it('genera 2 asientos diferenciados (Banco y Cuentas por Cobrar) cuando hay abono parcial', () => {
      const pedido = {
        id: 'NP-20261109-001',
        clientName: 'Colegio San Agustín',
        date: '2026-11-09',
        total: 50000,
        deposit: 20000,
        balance: 30000,
        status: 'Confirmado'
      };

      const asientos = accounting.generarAsientosPedido(pedido);
      assert.equal(asientos.length, 2);

      // Asiento 1: Abono a Banco
      const asientoBanco = asientos.find(a => a.subcuenta === 'Banco');
      assert.ok(asientoBanco, 'Debe existir asiento con subcuenta Banco');
      assert.equal(asientoBanco.id, 'AS-ORD-NP-20261109-001-BANCO');
      assert.equal(asientoBanco.cuentaDebe, 'Caja y Bancos (Disponible)');
      assert.equal(asientoBanco.debe, 20000);
      assert.equal(asientoBanco.cuentaHaber, 'Ventas de Poleras y Confección');
      assert.equal(asientoBanco.haber, 20000);
      assert.equal(asientoBanco.referenciaId, 'NP-20261109-001');

      // Asiento 2: Saldo a Cuentas por Cobrar
      const asientoCxC = asientos.find(a => a.subcuenta === 'Cuentas por Cobrar');
      assert.ok(asientoCxC, 'Debe existir asiento con subcuenta Cuentas por Cobrar');
      assert.equal(asientoCxC.id, 'AS-ORD-NP-20261109-001-CXC');
      assert.equal(asientoCxC.cuentaDebe, 'Cuentas por Cobrar Clientes');
      assert.equal(asientoCxC.debe, 30000);
      assert.equal(asientoCxC.cuentaHaber, 'Ventas de Poleras y Confección');
      assert.equal(asientoCxC.haber, 30000);
      assert.equal(asientoCxC.referenciaId, 'NP-20261109-001');

      // Cuadratura por partida doble
      const sumaDebe = asientoBanco.debe + asientoCxC.debe;
      const sumaHaber = asientoBanco.haber + asientoCxC.haber;
      assert.equal(sumaDebe, 50000);
      assert.equal(sumaHaber, 50000);
    });

    it('genera un único asiento a Banco cuando el pedido está 100% abonado (sin saldo)', () => {
      const pedido = {
        id: 'NP-20261109-002',
        clientName: 'Banda Los Rockeros',
        date: '2026-11-09',
        total: 45000,
        deposit: 45000,
        balance: 0,
        status: 'Confirmado'
      };

      const asientos = accounting.generarAsientosPedido(pedido);
      assert.equal(asientos.length, 1);
      assert.equal(asientos[0].subcuenta, 'Banco');
      assert.equal(asientos[0].cuentaDebe, 'Caja y Bancos (Disponible)');
      assert.equal(asientos[0].debe, 45000);
      assert.equal(asientos[0].haber, 45000);
    });

    it('genera un único asiento a Cuentas por Cobrar cuando el pedido no tiene abono inicial', () => {
      const pedido = {
        id: 'NP-20261109-003',
        clientName: 'Empresa Metalúrgica',
        date: '2026-11-09',
        total: 80000,
        deposit: 0,
        balance: 80000,
        status: 'Cotización'
      };

      const asientos = accounting.generarAsientosPedido(pedido);
      assert.equal(asientos.length, 1);
      assert.equal(asientos[0].subcuenta, 'Cuentas por Cobrar');
      assert.equal(asientos[0].cuentaDebe, 'Cuentas por Cobrar Clientes');
      assert.equal(asientos[0].debe, 80000);
      assert.equal(asientos[0].haber, 80000);
    });

    it('lee correctamente los montos desde la estructura anidada totals', () => {
      const pedido = {
        id: 'NP-20261109-004',
        clientName: 'Club Deportivo',
        dates: { deliveryDate: '2026-11-12' },
        totals: {
          totalAmount: 120000,
          depositAmount: 50000,
          balanceAmount: 70000,
          paymentStatus: 'Abonado'
        },
        status: 'En producción'
      };

      const asientos = accounting.generarAsientosPedido(pedido);
      assert.equal(asientos.length, 2);

      const banco = asientos.find(a => a.subcuenta === 'Banco');
      const cxc = asientos.find(a => a.subcuenta === 'Cuentas por Cobrar');

      assert.equal(banco.debe, 50000);
      assert.equal(cxc.debe, 70000);
    });

    it('retorna array vacío si el pedido está cancelado', () => {
      const pedido = {
        id: 'NP-20261109-005',
        total: 30000,
        deposit: 10000,
        status: 'Cancelado'
      };

      const asientos = accounting.generarAsientosPedido(pedido);
      assert.deepEqual(asientos, []);
    });
  });

  describe('Integración con NovaprintStorage.saveOrder', () => {

    it('asocia asientosContables automáticamente al registrar un nuevo pedido', () => {
      const nuevoPedido = storage.saveOrder({
        clientName: 'Restaurante Fuego',
        items: [
          { garmentType: 'polera', color: 'Negro', size: 'L', quantity: 10, unitPrice: 6000, total: 60000 }
        ],
        totals: {
          totalQuantity: 10,
          totalAmount: 60000,
          depositAmount: 25000,
          balanceAmount: 35000,
          paymentStatus: 'Abonado'
        },
        status: 'Confirmado'
      });

      assert.ok(nuevoPedido.id, 'Debe asignar un ID al pedido');
      assert.ok(Array.isArray(nuevoPedido.asientosContables), 'Debe contener la propiedad asientosContables');
      assert.equal(nuevoPedido.asientosContables.length, 2);

      const banco = nuevoPedido.asientosContables.find(a => a.subcuenta === 'Banco');
      const cxc = nuevoPedido.asientosContables.find(a => a.subcuenta === 'Cuentas por Cobrar');

      assert.ok(banco);
      assert.equal(banco.debe, 25000);
      assert.ok(cxc);
      assert.equal(cxc.debe, 35000);

      // Verificación de persistencia
      const recuperado = storage.getOrderById(nuevoPedido.id);
      assert.equal(recuperado.asientosContables.length, 2);
    });

    it('actualiza los asientos contables al editar el abono de un pedido existente', () => {
      const creado = storage.saveOrder({
        clientName: 'Liceo Bicentenario',
        totals: {
          totalAmount: 100000,
          depositAmount: 30000,
          balanceAmount: 70000,
          paymentStatus: 'Abonado'
        },
        status: 'Confirmado'
      });

      // Modificamos el abono a 60000
      const editado = storage.saveOrder({
        id: creado.id,
        clientName: 'Liceo Bicentenario',
        totals: {
          totalAmount: 100000,
          depositAmount: 60000,
          balanceAmount: 40000,
          paymentStatus: 'Abonado'
        },
        status: 'Confirmado'
      });

      const banco = editado.asientosContables.find(a => a.subcuenta === 'Banco');
      const cxc = editado.asientosContables.find(a => a.subcuenta === 'Cuentas por Cobrar');

      assert.equal(banco.debe, 60000);
      assert.equal(cxc.debe, 40000);
    });
  });

  describe('Libro Diario y Cuadratura Contable', () => {

    it('desglosa asientos en el Libro Diario preservando la ecuación Activo = Pasivo + Patrimonio', () => {
      const pedidos = [
        {
          id: 'ORD-01',
          date: '2026-11-01',
          clientName: 'Cliente 1',
          totals: { totalAmount: 50000, depositAmount: 20000, balanceAmount: 30000 },
          status: 'Confirmado'
        },
        {
          id: 'ORD-02',
          date: '2026-11-02',
          clientName: 'Cliente 2',
          totals: { totalAmount: 40000, depositAmount: 40000, balanceAmount: 0 },
          status: 'Confirmado'
        }
      ];

      const compras = [
        { id: 'PUR-01', date: '2026-11-03', supplierName: 'Textiles Chile', totalAmount: 25000, subtotalNeto: 25000 }
      ];

      const gastos = [
        { id: 'EXP-01', date: '2026-11-04', category: 'Electricidad y Servicios', amount: 10000 }
      ];

      const asientos = accounting.generarLibroDiario(pedidos, compras, gastos);

      // ORD-01 genera 2 asientos, ORD-02 genera 1 asiento, PUR-01 genera 1, EXP-01 genera 1 -> 5 asientos
      assert.equal(asientos.length, 5);

      // Verificamos que existan asientos con Banco y Cuentas por Cobrar
      const asientosBanco = asientos.filter(a => a.subcuenta === 'Banco');
      const asientosCxC = asientos.filter(a => a.subcuenta === 'Cuentas por Cobrar');

      assert.equal(asientosBanco.length, 2);
      assert.equal(asientosCxC.length, 1);

      // Verificamos cuadratura general
      const balance = accounting.calcularBalanceGeneral(pedidos, compras, [], gastos);
      assert.equal(balance.balanceEquilibrado, true);
      assert.equal(balance.diferenciaCuadratura, 0);

      // Caja = Cobros pedidos ($20000 + $40000 = $60000) - Compras ($25000) - Gastos ($10000) = $25000
      assert.equal(balance.activos.circulante.cajaBancos, 25000);
      // Cuentas por Cobrar = $30000
      assert.equal(balance.activos.circulante.cuentasPorCobrar, 30000);
    });
  });
});
