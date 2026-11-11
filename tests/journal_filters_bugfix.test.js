/**
 * tests/journal_filters_bugfix.test.js
 *
 * Pruebas automatizadas para Spec 028: Corrección y Optimización de Filtros en Libro Diario de Movimientos.
 * Valida la resolución precisa de cuentas (incluyendo gastos operacionales 5201-5206, IVA 1104/2102 y Delivery 4103),
 * normalización de fechas y reactividad de filtros.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const storage = require('../assets/js/storage.js');
const accounting = require('../assets/js/accounting.js');

describe('Spec 028 — Corrección y Optimización de Filtros en Libro Diario', () => {

  let catalogoCuentas = [];

  beforeEach(() => {
    storage.clearAllData(true);
    catalogoCuentas = storage.getAccounts();
  });

  describe('1. Resolución precisa de cuentas de Gastos Operacionales (5201 - 5206)', () => {
    const gastosPrueba = [
      { id: 'EXP-1', category: 'Arriendo de Taller', date: '2026-11-01', amount: 350000, description: 'Arriendo mes' },
      { id: 'EXP-2', category: 'Electricidad y Servicios', date: '2026-11-02', amount: 48000, description: 'Luz y agua' },
      { id: 'EXP-3', category: 'Mantenimiento de Maquinaria', date: '2026-11-03', amount: 25000, description: 'Teflón y grasa termoprensa' },
      { id: 'EXP-4', category: 'Fletes y Envíos', date: '2026-11-04', amount: 15000, description: 'Envío insumos textiles' },
      { id: 'EXP-5', category: 'Mermas y Pruebas', date: '2026-11-05', amount: 12000, description: 'Calibración cabezal DTF' },
      { id: 'EXP-6', category: 'Otros Gastos', date: '2026-11-06', amount: 8500, description: 'Cinta térmica de embalaje' }
    ];

    it('debe filtrar correctamente el gasto de Electricidad con cuenta 5202', () => {
      const asientos = accounting.generarLibroDiario([], [], gastosPrueba, []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '5202',
        catalogoCuentas
      });

      assert.equal(filtrados.length, 1);
      assert.equal(filtrados[0].referenciaId, 'EXP-2');
      assert.ok(filtrados[0].concepto.includes('Electricidad y Servicios'));
    });

    it('debe filtrar correctamente el gasto de Mantenimiento con cuenta 5203', () => {
      const asientos = accounting.generarLibroDiario([], [], gastosPrueba, []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '5203',
        catalogoCuentas
      });

      assert.equal(filtrados.length, 1);
      assert.equal(filtrados[0].referenciaId, 'EXP-3');
    });

    it('debe filtrar correctamente el gasto de Fletes y Despacho con cuenta 5204', () => {
      const asientos = accounting.generarLibroDiario([], [], gastosPrueba, []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '5204',
        catalogoCuentas
      });

      assert.equal(filtrados.length, 1);
      assert.equal(filtrados[0].referenciaId, 'EXP-4');
    });

    it('debe filtrar correctamente Mermas y Pruebas con cuenta 5205', () => {
      const asientos = accounting.generarLibroDiario([], [], gastosPrueba, []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '5205',
        catalogoCuentas
      });

      assert.equal(filtrados.length, 1);
      assert.equal(filtrados[0].referenciaId, 'EXP-5');
    });

    it('debe filtrar correctamente Otros Gastos con cuenta 5206', () => {
      const asientos = accounting.generarLibroDiario([], [], gastosPrueba, []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '5206',
        catalogoCuentas
      });

      assert.equal(filtrados.length, 1);
      assert.equal(filtrados[0].referenciaId, 'EXP-6');
    });

    it('debe filtrar correctamente Arriendo de Taller con cuenta 5201', () => {
      const asientos = accounting.generarLibroDiario([], [], gastosPrueba, []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '5201',
        catalogoCuentas
      });

      assert.equal(filtrados.length, 1);
      assert.equal(filtrados[0].referenciaId, 'EXP-1');
    });
  });

  describe('2. Vinculación contable de IVA, Delivery e Inventario', () => {
    const pedidoConIvaYDelivery = {
      id: 'ORD-100',
      clientName: 'Cliente Colegio',
      date: '2026-11-05',
      status: 'En producción',
      items: [{ garmentType: 'polera', quantity: 20, unitPrice: 6000 }],
      totals: { total: 147800, depositAmount: 70000, balanceAmount: 77800, subtotal: 120000, ivaAmount: 22800, deliveryAmount: 5000 }
    };

    const compraConIva = {
      id: 'PUR-100',
      supplierName: 'Distribuidora Mayorista',
      date: '2026-11-06',
      totalAmount: 59500,
      subtotalNeto: 50000,
      ivaAmount: 9500,
      invoiceNumber: 'FAC-777'
    };

    it('debe vincular compras con IVA a la cuenta 1104 (Crédito Fiscal IVA)', () => {
      const asientos = accounting.generarLibroDiario([], [compraConIva], [], []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '1104',
        catalogoCuentas
      });

      assert.equal(filtrados.length, 1);
      assert.equal(filtrados[0].referenciaId, 'PUR-100');
    });

    it('debe vincular ventas con IVA a la cuenta 2102 (Débito Fiscal IVA)', () => {
      const asientos = accounting.generarLibroDiario([pedidoConIvaYDelivery], [], [], []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '2102',
        catalogoCuentas
      });

      assert.ok(filtrados.length >= 1, 'Debe encontrar los asientos de venta que originan débito fiscal');
      assert.ok(filtrados.some(a => a.referenciaId === 'ORD-100'));
    });

    it('debe vincular ventas con delivery a la cuenta 4103 (Ingresos por Despacho y Flete)', () => {
      const asientos = accounting.generarLibroDiario([pedidoConIvaYDelivery], [], [], []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '4103',
        catalogoCuentas
      });

      assert.ok(filtrados.length >= 1);
      assert.ok(filtrados.some(a => a.referenciaId === 'ORD-100'));
    });

    it('debe vincular compras de insumos a la cuenta 1103 (Inventario)', () => {
      const asientos = accounting.generarLibroDiario([], [compraConIva], [], []);
      const filtrados = accounting.filtrarAsientosContables(asientos, {
        cuenta: '1103',
        catalogoCuentas
      });

      assert.equal(filtrados.length, 1);
      assert.equal(filtrados[0].referenciaId, 'PUR-100');
    });
  });

  describe('3. Normalización y resiliencia del filtro por Mes (YYYY-MM)', () => {
    const asientosFechas = [
      { id: 'AS-1', fecha: '2026-11-05', tipo: 'Ingreso', debe: 10000, haber: 10000 },
      { id: 'AS-2', fecha: '2026-11-10T14:32:00.000Z', tipo: 'Gasto', debe: 5000, haber: 5000 },
      { id: 'AS-3', fecha: '2026-10-25', tipo: 'Costo', debe: 20000, haber: 20000 },
      { id: 'AS-4', fecha: '2026-12-01T08:00:00Z', tipo: 'Ingreso', debe: 15000, haber: 15000 }
    ];

    it('debe filtrar correctamente asientos de noviembre 2026 con formato YYYY-MM tanto simple como ISO', () => {
      const nov = accounting.filtrarAsientosContables(asientosFechas, { mes: '2026-11' });
      assert.equal(nov.length, 2);
      assert.deepEqual(nov.map(a => a.id), ['AS-1', 'AS-2']);
    });

    it('debe filtrar correctamente asientos de octubre 2026', () => {
      const oct = accounting.filtrarAsientosContables(asientosFechas, { mes: '2026-10' });
      assert.equal(oct.length, 1);
      assert.equal(oct[0].id, 'AS-3');
    });

    it('debe filtrar correctamente asientos de diciembre 2026', () => {
      const dic = accounting.filtrarAsientosContables(asientosFechas, { mes: '2026-12' });
      assert.equal(dic.length, 1);
      assert.equal(dic[0].id, 'AS-4');
    });
  });

  describe('4. Interfaz de Usuario y HTML (index.html & ui.js)', () => {
    it('index.html debe contar con oninput y onchange en #acc-journal-filter-month', () => {
      const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
      assert.ok(html.includes('id="acc-journal-filter-month"'));
      assert.ok(html.includes('oninput="NovaprintUI.filtrarLibroDiario()"'));
      assert.ok(html.includes('onchange="NovaprintUI.filtrarLibroDiario()"'));
    });

    it('ui.js debe exponer refrescarVistaLibroDiario y resetFiltrosLibroDiario', () => {
      const ui = require('../assets/js/ui.js');
      assert.equal(typeof ui.filtrarLibroDiario, 'function');
      assert.equal(typeof ui.limpiarFiltroMesLibroDiario, 'function');
      assert.equal(typeof ui.resetFiltrosLibroDiario, 'function');
      assert.equal(typeof ui.refrescarVistaLibroDiario, 'function');
    });
  });

});
