const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Spec 023 — Transferencia entre Cuentas Contables', () => {
  let accounting;
  let storage;
  let sales;

  beforeEach(() => {
    // Reset module cache
    delete require.cache[require.resolve('../assets/js/accounting.js')];
    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    sales = require('../assets/js/sales.js');
    accounting = require('../assets/js/accounting.js');

    global.NovaprintStorage = storage;
    global.NovaprintSales = sales;
    global.NovaprintAccounting = accounting;

    if (storage.clearAllData) {
      storage.clearAllData();
    }
  });

  describe('Validación de Transferencias (accounting.js)', () => {
    it('debe rechazar transferencias vacías o nulas', () => {
      const res = accounting.validarTransferenciaContable(null);
      assert.equal(res.valido, false);
      assert.ok(res.errores.some(e => e.includes('requeridos')));
    });

    it('debe exigir cuenta de origen y de destino distintas', () => {
      const sinOrigen = accounting.validarTransferenciaContable({ destinationAccountId: 'ACC-1101', amount: 10000, date: '2026-11-10' });
      assert.equal(sinOrigen.valido, false);
      assert.ok(sinOrigen.errores.some(e => e.includes('origen')));

      const sinDestino = accounting.validarTransferenciaContable({ sourceAccountId: 'ACC-1101', amount: 10000, date: '2026-11-10' });
      assert.equal(sinDestino.valido, false);
      assert.ok(sinDestino.errores.some(e => e.includes('destino')));

      const mismaCuenta = accounting.validarTransferenciaContable({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1101',
        amount: 25000,
        date: '2026-11-10'
      });
      assert.equal(mismaCuenta.valido, false);
      assert.ok(mismaCuenta.errores.some(e => e.includes('no pueden ser la misma')));
    });

    it('debe exigir monto mayor a cero y fecha válida', () => {
      const montoCero = accounting.validarTransferenciaContable({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1102',
        amount: 0,
        date: '2026-11-10'
      });
      assert.equal(montoCero.valido, false);
      assert.ok(montoCero.errores.some(e => e.includes('mayor a cero')));

      const montoNegativo = accounting.validarTransferenciaContable({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1102',
        amount: -5000,
        date: '2026-11-10'
      });
      assert.equal(montoNegativo.valido, false);
      assert.ok(montoNegativo.errores.some(e => e.includes('mayor a cero')));

      const sinFecha = accounting.validarTransferenciaContable({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1102',
        amount: 15000,
        date: ''
      });
      assert.equal(sinFecha.valido, false);
      assert.ok(sinFecha.errores.some(e => e.includes('fecha')));
    });

    it('debe validar y normalizar correctamente una transferencia válida resolviendo nombres de cuentas', () => {
      const cuentas = storage.getAccounts();
      const val = accounting.validarTransferenciaContable({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1201',
        amount: 150000.75,
        date: '2026-11-10',
        description: ' Compra de plotter menor contado ',
        reference: ' Ref-001 '
      }, cuentas);

      assert.equal(val.valido, true);
      assert.equal(val.errores.length, 0);
      assert.equal(val.datosNormalizados.amount, 150001);
      assert.equal(val.datosNormalizados.sourceAccountCode, '1101');
      assert.equal(val.datosNormalizados.sourceAccountName, 'Caja y Bancos (Disponible)');
      assert.equal(val.datosNormalizados.destinationAccountCode, '1201');
      assert.equal(val.datosNormalizados.destinationAccountName, 'Maquinaria y Equipos de Taller');
      assert.equal(val.datosNormalizados.description, 'Compra de plotter menor contado');
      assert.equal(val.datosNormalizados.reference, 'Ref-001');
    });
  });

  describe('Libro Diario con Transferencias Contables (accounting.js)', () => {
    it('generarLibroDiario debe mantener compatibilidad retroactiva sin transferencias', () => {
      const asientos = accounting.generarLibroDiario([], [], []);
      assert.ok(Array.isArray(asientos));
      assert.equal(asientos.length, 0);
    });

    it('generarLibroDiario debe registrar asientos de transferencia de partida doble estrictamente balanceados', () => {
      const transferencias = [
        {
          id: 'TRF-TEST-1',
          date: '2026-11-10',
          sourceAccountId: 'ACC-1101',
          sourceAccountCode: '1101',
          sourceAccountName: 'Caja y Bancos (Disponible)',
          destinationAccountId: 'ACC-1103',
          destinationAccountCode: '1103',
          destinationAccountName: 'Inventario de Existencias',
          amount: 80000,
          description: 'Ajuste directo de fondos a inventario',
          reference: 'OP-456'
        }
      ];

      const asientos = accounting.generarLibroDiario([], [], [], transferencias);
      assert.equal(asientos.length, 1);

      const asiento = asientos[0];
      assert.equal(asiento.id, 'AS-TRF-TRF-TEST-1');
      assert.equal(asiento.tipo, 'Transferencia');
      assert.equal(asiento.origen, 'Transferencia entre Cuentas');
      assert.equal(asiento.cuentaDebe, 'Inventario de Existencias');
      assert.equal(asiento.debe, 80000);
      assert.equal(asiento.cuentaHaber, 'Caja y Bancos (Disponible)');
      assert.equal(asiento.haber, 80000);
      assert.equal(asiento.debe, asiento.haber, 'Partida doble estrictamente balanceada');
      assert.ok(asiento.concepto.includes('1101'));
      assert.ok(asiento.concepto.includes('1103'));
      assert.ok(asiento.concepto.includes('Ajuste directo de fondos a inventario'));
      assert.ok(asiento.concepto.includes('OP-456'));
    });
  });

  describe('Persistencia y Operaciones CRUD de Transferencias (storage.js)', () => {
    it('getTransfers debe retornar lista vacía inicialmente', () => {
      const items = storage.getTransfers();
      assert.ok(Array.isArray(items));
      assert.equal(items.length, 0);
    });

    it('saveTransfer debe persistir una transferencia con ID único y timestamp', () => {
      const nueva = storage.saveTransfer({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-2101',
        amount: 45000,
        date: '2026-11-10',
        description: 'Abono a proveedor textiles',
        reference: 'Voucher 9988'
      });

      assert.ok(nueva.id.startsWith('TRF-'));
      assert.ok(nueva.createdAt);
      assert.equal(nueva.amount, 45000);
      assert.equal(nueva.sourceAccountCode, '1101');
      assert.equal(nueva.destinationAccountCode, '2101');

      const recuperada = storage.getTransferById(nueva.id);
      assert.ok(recuperada);
      assert.equal(recuperada.id, nueva.id);
      assert.equal(recuperada.description, 'Abono a proveedor textiles');

      const todas = storage.getTransfers();
      assert.equal(todas.length, 1);
    });

    it('saveTransfer debe rechazar operaciones que no cumplan validación contable', () => {
      assert.throws(() => {
        storage.saveTransfer({
          sourceAccountId: 'ACC-1101',
          destinationAccountId: 'ACC-1101', // Misma cuenta
          amount: 50000,
          date: '2026-11-10'
        });
      }, /no pueden ser la misma/i);

      assert.throws(() => {
        storage.saveTransfer({
          sourceAccountId: 'ACC-1101',
          destinationAccountId: 'ACC-2101',
          amount: 0, // Monto inválido
          date: '2026-11-10'
        });
      }, /mayor a cero/i);
    });

    it('deleteTransfer debe eliminar una transferencia por su ID', () => {
      const t1 = storage.saveTransfer({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-1102',
        amount: 20000,
        date: '2026-11-10',
        description: 'Traspaso temporal'
      });

      assert.equal(storage.getTransfers().length, 1);

      const delRes = storage.deleteTransfer(t1.id);
      assert.equal(delRes.success, true);
      assert.equal(storage.getTransfers().length, 0);
      assert.equal(storage.getTransferById(t1.id), null);

      const delInexistente = storage.deleteTransfer('TRF-INEXISTENTE');
      assert.equal(delInexistente.success, false);
    });

    it('exportBackup e importBackup deben preservar las transferencias entre cuentas', () => {
      storage.saveTransfer({
        sourceAccountId: 'ACC-1101',
        destinationAccountId: 'ACC-3101',
        amount: 75000,
        date: '2026-11-10',
        description: 'Retiro parcial de socios'
      });

      const backupJson = storage.exportBackup();
      const parsed = JSON.parse(backupJson);
      assert.ok(parsed.data.transfers, 'El backup debe incluir transfers');
      assert.equal(parsed.data.transfers.length, 1);
      assert.equal(parsed.data.transfers[0].amount, 75000);

      // Limpiar almacenamiento
      storage.clearAllData();
      assert.equal(storage.getTransfers().length, 0);

      // Restaurar respaldo
      const importRes = storage.importBackup(backupJson);
      assert.equal(importRes.success, true);
      assert.equal(storage.getTransfers().length, 1);
      assert.equal(storage.getTransfers()[0].amount, 75000);
    });
  });

  describe('Integración con Interfaz de Usuario (index.html & ui.js)', () => {
    it('index.html debe contener el botón #btn-new-transfer junto a #btn-new-expense en la cabecera contable', () => {
      const htmlPath = path.join(__dirname, '..', 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');

      assert.ok(html.includes('id="btn-new-transfer"'), 'Debe existir el botón #btn-new-transfer');
      assert.ok(html.includes('id="btn-new-expense"'), 'Debe existir el botón #btn-new-expense');

      const idxTransfer = html.indexOf('id="btn-new-transfer"');
      const idxExpense = html.indexOf('id="btn-new-expense"');
      assert.ok(idxTransfer < idxExpense, '#btn-new-transfer debe estar ubicado junto y antes de #btn-new-expense');
    });

    it('index.html debe contener el modal <dialog id="dialog-transfer"> y el formulario #form-transfer', () => {
      const htmlPath = path.join(__dirname, '..', 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');

      assert.ok(html.includes('id="dialog-transfer"'), 'Debe existir <dialog id="dialog-transfer">');
      assert.ok(html.includes('id="form-transfer"'), 'Debe existir el formulario #form-transfer');
      assert.ok(html.includes('id="transfer-source-account"'), 'Debe existir selector de cuenta origen');
      assert.ok(html.includes('id="transfer-destination-account"'), 'Debe existir selector de cuenta destino');
      assert.ok(html.includes('id="transfer-amount"'), 'Debe existir campo de monto');
      assert.ok(html.includes('id="transfer-date"'), 'Debe existir campo de fecha');
      assert.ok(html.includes('id="transfer-description"'), 'Debe existir campo de descripción');
      assert.ok(html.includes('id="transfer-double-entry-preview"'), 'Debe existir panel de preview de partida doble');
      assert.ok(html.includes('value="Transferencia"'), 'El filtro del libro diario debe incluir opción Transferencia');
    });

    it('ui.js debe exponer las funciones de control de transferencias', () => {
      const ui = require('../assets/js/ui.js');
      assert.equal(typeof ui.abrirModalTransferencia, 'function');
      assert.equal(typeof ui.actualizarPreviewTransferencia, 'function');
      assert.equal(typeof ui.guardarTransferenciaDesdeFormulario, 'function');
      assert.equal(typeof ui.confirmarEliminarTransferencia, 'function');
    });
  });
});

