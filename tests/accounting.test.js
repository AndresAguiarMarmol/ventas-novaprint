const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

describe('Spec 018 — Módulo de Contabilidad (accounting.js & storage.js)', () => {
  let accounting;
  let storage;
  let sales;
  let ui;

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
    global.NovaprintProduction = require('../assets/js/production.js');
  });

  describe('Plan de Cuentas y Estructura Contable', () => {
    it('debe definir las cuentas principales de Activos, Pasivos, Patrimonio, Ingresos y Costos', () => {
      const cuentas = accounting.CUENTAS_CONTABLES;
      assert.ok(cuentas.CAJA_BANCOS, 'Debe existir cuenta 1101 Caja y Bancos');
      assert.equal(cuentas.CAJA_BANCOS.codigo, '1101');
      assert.equal(cuentas.CAJA_BANCOS.tipo, 'Activo');

      assert.ok(cuentas.CUENTAS_POR_COBRAR, 'Debe existir cuenta 1102 Cuentas por Cobrar');
      assert.equal(cuentas.CUENTAS_POR_COBRAR.codigo, '1102');

      assert.ok(cuentas.INVENTARIO_BODEGA, 'Debe existir cuenta 1103 Inventario');
      assert.equal(cuentas.INVENTARIO_BODEGA.codigo, '1103');

      assert.ok(cuentas.IVA_DEBITO_FISCAL, 'Debe existir cuenta 2102 Débito Fiscal IVA');
      assert.equal(cuentas.IVA_DEBITO_FISCAL.codigo, '2102');
      assert.equal(cuentas.IVA_DEBITO_FISCAL.tipo, 'Pasivo');

      assert.ok(cuentas.VENTAS_POLERAS, 'Debe existir cuenta 4101 Ventas de Poleras');
      assert.equal(cuentas.VENTAS_POLERAS.codigo, '4101');
      assert.equal(cuentas.VENTAS_POLERAS.tipo, 'Ingreso');

      assert.ok(cuentas.COSTO_INSUMOS, 'Debe existir cuenta 5101 Costo de Insumos');
      assert.equal(cuentas.COSTO_INSUMOS.codigo, '5101');
      assert.equal(cuentas.COSTO_INSUMOS.tipo, 'Costo');
    });

    it('debe listar categorías oficiales para gastos operacionales de taller', () => {
      const cats = accounting.CATEGORIAS_GASTO;
      assert.ok(Array.isArray(cats));
      assert.ok(cats.some(c => c.valor === 'Arriendo de Taller'));
      assert.ok(cats.some(c => c.valor === 'Electricidad y Servicios'));
      assert.ok(cats.some(c => c.valor === 'Mantenimiento de Maquinaria'));
    });
  });

  describe('Consolidación y Enlace de Ventas de Poleras (Pedidos)', () => {
    it('consolida correctamente ventas netas, IVA, delivery, abonos cobrados y saldos por cobrar', () => {
      const pedidos = [
        {
          id: 'ORD-001',
          status: 'Confirmado',
          items: [{ description: 'Poleras DTF', quantity: 10, unitPrice: 5000, total: 50000 }],
          volumeDiscountAmount: 2500, // 5% desc docena
          netSubtotal: 47500,
          ivaAmount: 9025,
          deliveryAmount: 3000,
          total: 59525,
          deposit: 30000 // Abono parcial
        },
        {
          id: 'ORD-002',
          status: 'Entregado',
          items: [{ description: 'Polerones bordados', quantity: 5, unitPrice: 15000, total: 75000 }],
          volumeDiscountAmount: 0,
          netSubtotal: 75000,
          ivaAmount: 0,
          deliveryAmount: 0,
          total: 75000,
          deposit: 0 // Entregado: se asume cobro total
        },
        {
          id: 'ORD-003',
          status: 'Cancelado',
          items: [{ description: 'Gorras', quantity: 20, unitPrice: 3000, total: 60000 }],
          netSubtotal: 60000,
          total: 60000,
          deposit: 10000
        }
      ];

      const res = accounting.obtenerConsolidadoPedidos(pedidos);

      // ORD-003 debe ser ignorado por estar cancelado
      assert.equal(res.pedidosCount, 2);
      assert.equal(res.totalNetoVentas, 47500 + 75000);
      assert.equal(res.totalDescuentos, 2500);
      assert.equal(res.totalIvaDebito, 9025);
      assert.equal(res.totalDeliveryVentas, 3000);
      assert.equal(res.totalFacturado, 59525 + 75000);

      // Cobrado en efectivo: 30.000 (abono ORD-001) + 75.000 (ORD-002 entregado) = 105.000
      assert.equal(res.totalCobradoEfectivo, 105000);
      // Saldo pendiente por cobrar: 59.525 - 30.000 = 29.525
      assert.equal(res.totalCuentasPorCobrar, 29525);
    });
  });

  describe('Consolidación de Compras de Insumos y Valorización de Bodega', () => {
    it('consolida costos netos de compras, IVA crédito y delivery a proveedores', () => {
      const compras = [
        {
          id: 'PUR-001',
          subtotalNeto: 100000,
          applyIva: true,
          ivaAmount: 19000,
          applyDelivery: true,
          deliveryAmount: 5000,
          totalAmount: 124000
        },
        {
          id: 'PUR-002',
          subtotalNeto: 50000,
          applyIva: false,
          ivaAmount: 0,
          applyDelivery: false,
          deliveryAmount: 0,
          totalAmount: 50000
        }
      ];

      const res = accounting.obtenerConsolidadoCompras(compras);
      assert.equal(res.comprasCount, 2);
      assert.equal(res.totalSubtotalNeto, 150000);
      assert.equal(res.totalIvaCredito, 19000);
      assert.equal(res.totalDeliveryCompras, 5000);
      assert.equal(res.totalPagadoCompras, 174000);
    });

    it('valoriza el stock físico de bodega según costo unitario de reposición', () => {
      const inventario = [
        { id: 'INV-1', currentStock: 20, unitCost: 3500 }, // 70.000
        { id: 'INV-2', currentStock: 10, unitCost: 11000 }, // 110.000
        { id: 'INV-3', currentStock: -5, unitCost: 2000 } // Protege contra negativos (0)
      ];

      const res = accounting.obtenerValorizacionInventario(inventario);
      assert.equal(res.totalUnidades, 30);
      assert.equal(res.valorInventario, 70000 + 110000);
    });
  });

  describe('Estado de Resultados (P&L) y Rentabilidad', () => {
    it('calcula ingresos, margen bruto, gastos operacionales y utilidad neta', () => {
      const pedidos = [
        { id: 'P1', status: 'Confirmado', netSubtotal: 200000, deliveryAmount: 10000, total: 210000 }
      ];
      const compras = [
        { id: 'C1', subtotalNeto: 80000, deliveryAmount: 4000, totalAmount: 84000 }
      ];
      const gastos = [
        { id: 'G1', category: 'Arriendo de Taller', amount: 50000 },
        { id: 'G2', category: 'Electricidad y Servicios', amount: 15000 }
      ];

      const pnl = accounting.calcularEstadoResultados(pedidos, compras, gastos);

      assert.equal(pnl.ingresos.ventasPrendas, 200000);
      assert.equal(pnl.ingresos.delivery, 10000);
      assert.equal(pnl.ingresos.total, 210000);

      assert.equal(pnl.costos.insumosTextiles, 80000);
      assert.equal(pnl.costos.margenBruto, 130000); // 210.000 - 80.000

      // Gastos de operación = 4.000 (flete compra) + 50.000 (arriendo) + 15.000 (luz) = 69.000
      assert.equal(pnl.gastos.total, 69000);

      // Utilidad neta = 130.000 - 69.000 = 61.000
      assert.equal(pnl.utilidadNeta, 61000);
      assert.equal(Math.round(pnl.margenNetoPorcentaje), Math.round((61000 / 210000) * 100));
    });
  });

  describe('Balance General y Ecuación Patrimonial (Activo = Pasivo + Patrimonio)', () => {
    it('mantiene la ecuación contable estrictamente balanceada', () => {
      const pedidos = [
        { id: 'P1', status: 'Confirmado', netSubtotal: 300000, ivaAmount: 57000, total: 357000, deposit: 200000 }
      ];
      const compras = [
        { id: 'C1', subtotalNeto: 120000, ivaAmount: 22800, totalAmount: 142800 }
      ];
      const inventario = [
        { id: 'INV-1', currentStock: 50, unitCost: 3000 } // 150.000
      ];
      const gastos = [
        { id: 'G1', category: 'Arriendo de Taller', amount: 40000 }
      ];
      const settings = { initialCapital: 100000, fixedAssetsValue: 500000 };

      const bal = accounting.calcularBalanceGeneral(pedidos, compras, inventario, gastos, settings);

      assert.equal(bal.balanceEquilibrado, true, 'El balance general debe estar equilibrado');
      assert.equal(bal.diferenciaCuadratura, 0, 'La diferencia entre Activos y (Pasivo + Patrimonio) debe ser 0');

      // Verificar que los activos contengan caja, CxC, existencias y crédito fiscal
      assert.ok(bal.activos.circulante.cajaBancos !== undefined);
      assert.equal(bal.activos.circulante.cuentasPorCobrar, 157000); // 357.000 - 200.000 abono
      assert.equal(bal.activos.circulante.inventarioBodega, 150000);
      assert.equal(bal.activos.circulante.creditoFiscalIva, 22800);
      assert.equal(bal.activos.fijo.maquinariaEquipos, 500000);

      // Verificar pasivo por débito fiscal IVA
      assert.equal(bal.pasivos.circulante.debitoFiscalIva, 57000);
      assert.equal(bal.pasivos.ivaNetoPagar, 57000 - 22800); // 34.200 neto ante SII
    });
  });

  describe('Libro Diario de Movimientos Contables', () => {
    it('genera asientos cronológicos para pedidos, compras y gastos manuales', () => {
      const pedidos = [
        { id: 'ORD-10', date: '2026-11-01', clientName: 'Cliente A', total: 50000, deposit: 50000, status: 'Confirmado' }
      ];
      const compras = [
        { id: 'PUR-20', date: '2026-11-03', supplierName: 'Distribuidor Textil', totalAmount: 30000 }
      ];
      const gastos = [
        { id: 'EXP-30', date: '2026-11-05', category: 'Electricidad y Servicios', description: 'Pago Enel Taller', amount: 15000 }
      ];

      const asientos = accounting.generarLibroDiario(pedidos, compras, gastos);

      assert.equal(asientos.length, 3);
      // Orden cronológico descendente (EXP-30 primero por ser 2026-11-05)
      assert.equal(asientos[0].referenciaId, 'EXP-30');
      assert.equal(asientos[0].tipo, 'Gasto');
      assert.equal(asientos[0].debe, 15000);
      assert.equal(asientos[0].haber, 15000);

      assert.equal(asientos[1].referenciaId, 'PUR-20');
      assert.equal(asientos[1].tipo, 'Costo');

      assert.equal(asientos[2].referenciaId, 'ORD-10');
      assert.equal(asientos[2].tipo, 'Ingreso');
    });
  });

  describe('Capa de Persistencia de Gastos en storage.js', () => {
    it('permite guardar, consultar por ID y eliminar gastos operacionales', () => {
      storage.clearAllData(true);

      const saved = storage.saveExpense({
        category: 'Arriendo de Taller',
        description: 'Arriendo Noviembre 2026',
        amount: 80000,
        date: '2026-11-01'
      });

      assert.ok(saved.id);
      assert.ok(saved.id.startsWith('EXP-'));
      assert.equal(saved.amount, 80000);

      const items = storage.getExpenses();
      assert.equal(items.length, 1);
      assert.equal(items[0].description, 'Arriendo Noviembre 2026');

      const found = storage.getExpenseById(saved.id);
      assert.equal(found.amount, 80000);

      // Eliminar
      const deleted = storage.deleteExpense(saved.id);
      assert.equal(deleted, true);
      assert.equal(storage.getExpenses().length, 0);
    });

    it('exportBackup e importBackup preservan y restauran los gastos operacionales', () => {
      storage.clearAllData(true);
      storage.saveExpense({
        id: 'EXP-BACKUP-TEST',
        category: 'Mantenimiento de Maquinaria',
        description: 'Cambio de cabezal plotter',
        amount: 120000
      });

      const backupJson = storage.exportBackup();
      const parsed = JSON.parse(backupJson);
      assert.ok(Array.isArray(parsed.data.expenses));
      assert.equal(parsed.data.expenses.length, 1);
      assert.equal(parsed.data.expenses[0].id, 'EXP-BACKUP-TEST');

      // Vaciar y restaurar
      storage.clearAllData(true);
      assert.equal(storage.getExpenses().length, 0);

      const importRes = storage.importBackup(backupJson);
      assert.equal(importRes.success, true);
      assert.equal(storage.getExpenses().length, 1);
      assert.equal(storage.getExpenses()[0].id, 'EXP-BACKUP-TEST');
    });
  });

  describe('Integración con Interfaz de Usuario (index.html)', () => {
    it('index.html incluye la pestaña de navegación, la sección view-accounting y el modal dialog-expense', () => {
      const indexPath = path.resolve(__dirname, '../index.html');
      const html = fs.readFileSync(indexPath, 'utf-8');

      assert.ok(html.includes('data-view="accounting"'), 'Debe existir tab con data-view="accounting"');
      assert.ok(html.includes('id="view-accounting"'), 'Debe existir sección #view-accounting');
      assert.ok(html.includes('id="acc-metric-total-assets"'), 'Debe existir KPI total activos');
      assert.ok(html.includes('id="acc-metric-net-income"'), 'Debe existir KPI utilidad neta');
      assert.ok(html.includes('id="acc-subview-balance"'), 'Debe existir sub-vista balance');
      assert.ok(html.includes('id="acc-subview-pnl"'), 'Debe existir sub-vista P&L');
      assert.ok(html.includes('id="acc-subview-journal"'), 'Debe existir sub-vista libro diario');
      assert.ok(html.includes('id="dialog-expense"'), 'Debe existir modal #dialog-expense');
      assert.ok(html.includes('assets/js/accounting.js'), 'Debe cargar el script accounting.js');
    });
  });
});
