const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Spec 024 — Reflejo de Transferencias en Cuentas Contables y Listado de Movimientos', () => {
  let accounting;
  let storage;
  let sales;
  let ui;
  let main;

  beforeEach(() => {
    delete require.cache[require.resolve('../assets/js/accounting.js')];
    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];
    delete require.cache[require.resolve('../assets/js/main.js')];

    storage = require('../assets/js/storage.js');
    sales = require('../assets/js/sales.js');
    accounting = require('../assets/js/accounting.js');
    ui = require('../assets/js/ui.js');
    main = require('../assets/js/main.js');

    global.NovaprintStorage = storage;
    global.NovaprintSales = sales;
    global.NovaprintAccounting = accounting;
    global.NovaprintUI = ui;
    global.NovaprintMain = main;

    if (storage.clearAllData) {
      storage.clearAllData();
    }
  });

  describe('Cálculo de Saldos Dinámicos por Cuenta (Libro Mayor)', () => {
    it('debe reflejar la disminución en la cuenta origen y el incremento en la cuenta destino tras una transferencia', () => {
      const accounts = storage.getAccounts();
      const settings = { initialCapital: 100000 };

      // Registrar una transferencia de $35.000 desde Caja y Bancos (1101) a Maquinaria (1201)
      const t1 = storage.saveTransfer({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1201',
        amount: 35000,
        date: '2026-11-10',
        description: 'Compra de equipo menor con fondos de caja'
      });

      const trans = storage.getTransfers();
      assert.equal(trans.length, 1);

      // Generar asientos y saldos
      const asientos = accounting.generarLibroDiario([], [], [], trans);
      const saldos = accounting.calcularSaldosPlanCuentas(asientos, accounts, settings);

      // Cuenta Origen 1101: Activo con Capital Inicial 100.000 - Salida 35.000 = 65.000
      const saldoCaja = saldos['ACC-1101'] || saldos['1101'];
      assert.ok(saldoCaja, 'Debe existir saldo para 1101');
      assert.equal(saldoCaja.totalHaber, 35000, 'Debe registrar 35.000 al Haber');
      assert.equal(saldoCaja.saldo, 65000, 'El saldo de Caja debe disminuir a 65.000');

      // Cuenta Destino 1201: Activo con Entrada 35.000 = 35.000
      const saldoMaq = saldos['ACC-1201'] || saldos['1201'];
      assert.ok(saldoMaq, 'Debe existir saldo para 1201');
      assert.equal(saldoMaq.totalDebe, 35000, 'Debe registrar 35.000 al Debe');
      assert.equal(saldoMaq.saldo, 35000, 'El saldo de Maquinaria debe aumentar a 35.000');
    });

    it('debe calcular correctamente saldos con múltiples transferencias consecutivas', () => {
      const accounts = storage.getAccounts();
      const settings = { initialCapital: 200000 };

      // Transferencia 1: 1101 ➔ 1103 (Inventario) por $50.000
      storage.saveTransfer({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1103',
        amount: 50000,
        date: '2026-11-10',
        description: 'Traspaso a inventario'
      });

      // Transferencia 2: 1101 ➔ 2101 (Cuentas por Pagar) por $30.000
      storage.saveTransfer({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-2101',
        amount: 30000,
        date: '2026-11-10',
        description: 'Pago a proveedor'
      });

      const trans = storage.getTransfers();
      assert.equal(trans.length, 2);

      const asientos = accounting.generarLibroDiario([], [], [], trans);
      const saldos = accounting.calcularSaldosPlanCuentas(asientos, accounts, settings);

      // Caja 1101: 200.000 inicial - 50.000 - 30.000 = 120.000
      const saldoCaja = saldos['ACC-1101'];
      assert.equal(saldoCaja.totalHaber, 80000);
      assert.equal(saldoCaja.saldo, 120000);

      // Inventario 1103: Debe 50.000 = 50.000
      const saldoInv = saldos['ACC-1103'];
      assert.equal(saldoInv.totalDebe, 50000);
      assert.equal(saldoInv.saldo, 50000);

      // Cuentas por Pagar 2101: Pasivo que se carga al Debe con 30.000 -> saldo -30.000 (o disminución neta)
      const saldoCxP = saldos['ACC-2101'];
      assert.equal(saldoCxP.totalDebe, 30000);
      assert.equal(saldoCxP.saldo, -30000);
    });
  });

  describe('Reflejo de Transferencias en Balance General (accounting.js)', () => {
    it('debe ajustar el saldo de Caja y Bancos y mantener la ecuación patrimonial cuadrada', () => {
      const settings = { initialCapital: 150000 };
      const transferencias = [
        {
          id: 'TRF-1',
          sourceAccountCode: '1101',
          sourceAccountName: 'Caja y Bancos (Disponible)',
          destinationAccountCode: '1201',
          destinationAccountName: 'Maquinaria y Equipos de Taller',
          amount: 60000
        }
      ];

      const balance = accounting.calcularBalanceGeneral([], [], [], [], settings, transferencias);
      assert.ok(balance);
      assert.equal(balance.activos.circulante.cajaBancos, 90000, 'Caja debe ser 150.000 - 60.000 = 90.000');
      assert.equal(balance.activos.fijo.maquinariaEquipos, 60000, 'Maquinaria debe ser 0 + 60.000 = 60.000');
      assert.equal(balance.activos.total, 150000, 'Total Activos se mantiene en 150.000');
      assert.equal(balance.balanceEquilibrado, true, 'El Balance General debe estar perfectamente equilibrado');
      assert.equal(balance.diferenciaCuadratura, 0);
    });
  });

  describe('Integración con Interfaz de Usuario y Listado de Movimientos', () => {
    it('index.html debe incluir la cabecera Saldo Actual en la tabla del Plan de Cuentas', () => {
      const htmlPath = path.join(__dirname, '..', 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');

      assert.ok(html.includes('Saldo Actual'), 'Debe existir la columna Saldo Actual en la cabecera');
    });

    it('ui.js debe exponer verMovimientosCuenta', () => {
      assert.equal(typeof ui.verMovimientosCuenta, 'function');
    });

    it('main.js debe exponer refrescarContabilidad y refrescarDatos en global y en NovaprintMain', () => {
      assert.equal(typeof main.refrescarContabilidad, 'function');
      assert.equal(typeof main.refrescarDatos, 'function');
      assert.equal(typeof global.refrescarContabilidad, 'function');
      assert.equal(typeof global.refrescarDatos, 'function');
    });
  });
});

