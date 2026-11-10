const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
global.localStorage = localStorageMock;

// Mock window / document for UI checks
global.window = global;

const storage = require('../assets/js/storage.js');
const sales = require('../assets/js/sales.js');
const accounting = require('../assets/js/accounting.js');
const ui = require('../assets/js/ui.js');

describe('Spec 025 — Filtros por Mes de Transacción y por Cuenta Contable en Libro Diario', () => {

  const catalogoCuentasPrueba = [
    { id: 'acc-1101', codigo: '1101', nombre: 'Caja y Bancos (Disponible)', tipo: 'Activo', esSistema: true },
    { id: 'acc-1102', codigo: '1102', nombre: 'Cuentas por Cobrar Clientes', tipo: 'Activo', esSistema: true },
    { id: 'acc-1103', codigo: '1103', nombre: 'Inventario Bodega Insumos y Textiles', tipo: 'Activo', esSistema: true },
    { id: 'acc-1201', codigo: '1201', nombre: 'Maquinaria y Equipos de Estampado', tipo: 'Activo', esSistema: true },
    { id: 'acc-2101', codigo: '2101', nombre: 'Cuentas por Pagar Proveedores', tipo: 'Pasivo', esSistema: true },
    { id: 'acc-3101', codigo: '3101', nombre: 'Capital Social / Aportes de Taller', tipo: 'Capital', esSistema: true },
    { id: 'acc-4101', codigo: '4101', nombre: 'Ventas de Poleras y Confección Textil', tipo: 'Ingreso', esSistema: true },
    { id: 'acc-5101', codigo: '5101', nombre: 'Costo de Insumos y Prendas Base', tipo: 'Egreso', esSistema: true },
    { id: 'acc-5201', codigo: '5201', nombre: 'Arriendo de Taller y Local', tipo: 'Egreso', esSistema: true },
    { id: 'acc-5202', codigo: '5202', nombre: 'Electricidad y Energía Térmica', tipo: 'Egreso', esSistema: true }
  ];

  const asientosEjemplo = [
    // 1. Venta Noviembre 2026 (Abono a Caja)
    {
      id: 'AS-ORD-PED-101-BANCO',
      fecha: '2026-11-05T10:00:00.000Z',
      tipo: 'Ingreso',
      origen: 'Venta de Pedido (Abono)',
      subcuenta: 'Banco',
      referenciaId: 'PED-101',
      concepto: 'Abono Pedido — Cliente Uno (PED-101)',
      cuentaDebe: 'Caja y Bancos (Disponible)',
      debe: 50000,
      cuentaHaber: 'Ventas de Poleras y Confección Textil',
      haber: 50000
    },
    // 2. Venta Noviembre 2026 (Saldo a CxC)
    {
      id: 'AS-ORD-PED-101-CXC',
      fecha: '2026-11-05T10:00:00.000Z',
      tipo: 'Ingreso',
      origen: 'Venta de Pedido (Crédito)',
      subcuenta: 'Cuentas por Cobrar',
      referenciaId: 'PED-101',
      concepto: 'Saldo Pendiente Pedido — Cliente Uno (PED-101)',
      cuentaDebe: 'Cuentas por Cobrar Clientes',
      debe: 30000,
      cuentaHaber: 'Ventas de Poleras y Confección Textil',
      haber: 30000
    },
    // 3. Compra Insumos Noviembre 2026
    {
      id: 'AS-PUR-PUR-201',
      fecha: '2026-11-08T15:30:00.000Z',
      tipo: 'Costo',
      origen: 'Compra de Insumos',
      referenciaId: 'PUR-201',
      concepto: 'Compra insumos — Textiles Chile (Factura: F-100)',
      cuentaDebe: 'Costo de Insumos y Prendas Base',
      debe: 40000,
      cuentaHaber: 'Caja y Bancos (Disponible)',
      haber: 40000
    },
    // 4. Gasto Arriendo Noviembre 2026
    {
      id: 'AS-EXP-EXP-301',
      fecha: '2026-11-01T09:00:00.000Z',
      tipo: 'Gasto',
      origen: 'Gasto Operacional',
      referenciaId: 'EXP-301',
      concepto: 'Arriendo — Mes de Noviembre',
      cuentaDebe: 'Arriendo de Taller y Local',
      debe: 250000,
      cuentaHaber: 'Caja y Bancos (Disponible)',
      haber: 250000
    },
    // 5. Transferencia Noviembre 2026 (Caja 1101 a Maquinaria 1201)
    {
      id: 'AS-TRF-TRF-401',
      fecha: '2026-11-09T12:00:00.000Z',
      tipo: 'Transferencia',
      origen: 'Transferencia entre Cuentas',
      referenciaId: 'TRF-401',
      concepto: 'Traspaso: 1101 Caja y Bancos ➔ 1201 Maquinaria',
      cuentaDebe: 'Maquinaria y Equipos de Estampado',
      debe: 150000,
      cuentaHaber: 'Caja y Bancos (Disponible)',
      haber: 150000,
      detalle: {
        origenId: 'acc-1101',
        origenCodigo: '1101',
        origenNombre: 'Caja y Bancos (Disponible)',
        destinoId: 'acc-1201',
        destinoCodigo: '1201',
        destinoNombre: 'Maquinaria y Equipos de Estampado'
      }
    },
    // 6. Gasto Octubre 2026 (Electricidad de Octubre)
    {
      id: 'AS-EXP-EXP-302',
      fecha: '2026-10-25T11:00:00.000Z',
      tipo: 'Gasto',
      origen: 'Gasto Operacional',
      referenciaId: 'EXP-302',
      concepto: 'Electricidad — Boleta Enel Octubre',
      cuentaDebe: 'Electricidad y Energía Térmica',
      debe: 35000,
      cuentaHaber: 'Caja y Bancos (Disponible)',
      haber: 35000
    },
    // 7. Venta Octubre 2026 (Abono)
    {
      id: 'AS-ORD-PED-090-BANCO',
      fecha: '2026-10-20T16:00:00.000Z',
      tipo: 'Ingreso',
      origen: 'Venta de Pedido (Abono)',
      subcuenta: 'Banco',
      referenciaId: 'PED-090',
      concepto: 'Abono Pedido — Cliente Antiguo (PED-090)',
      cuentaDebe: 'Caja y Bancos (Disponible)',
      debe: 60000,
      cuentaHaber: 'Ventas de Poleras y Confección Textil',
      haber: 60000
    }
  ];

  describe('Función pura asientoAfectaCuenta (accounting.js)', () => {
    it('debe devolver true para cuenta "todas" o término vacío', () => {
      const a = asientosEjemplo[0];
      assert.strictEqual(accounting.asientoAfectaCuenta(a, 'todas', catalogoCuentasPrueba), true);
      assert.strictEqual(accounting.asientoAfectaCuenta(a, '', catalogoCuentasPrueba), true);
      assert.strictEqual(accounting.asientoAfectaCuenta(a, null, catalogoCuentasPrueba), true);
    });

    it('debe identificar coincidencia por código contable en cuentaDebe o cuentaHaber', () => {
      const ventaBanco = asientosEjemplo[0];
      // Debe en Caja y Bancos (1101), Haber en Ventas (4101)
      assert.strictEqual(accounting.asientoAfectaCuenta(ventaBanco, '1101', catalogoCuentasPrueba), true);
      assert.strictEqual(accounting.asientoAfectaCuenta(ventaBanco, '4101', catalogoCuentasPrueba), true);
      // No afecta a Maquinaria (1201) ni Arriendo (5201)
      assert.strictEqual(accounting.asientoAfectaCuenta(ventaBanco, '1201', catalogoCuentasPrueba), false);
      assert.strictEqual(accounting.asientoAfectaCuenta(ventaBanco, '5201', catalogoCuentasPrueba), false);
    });

    it('debe identificar coincidencia en asientos de Transferencia entre cuentas (origen y destino)', () => {
      const transfer = asientosEjemplo[4];
      // Origen: 1101 Caja, Destino: 1201 Maquinaria
      assert.strictEqual(accounting.asientoAfectaCuenta(transfer, '1101', catalogoCuentasPrueba), true);
      assert.strictEqual(accounting.asientoAfectaCuenta(transfer, '1201', catalogoCuentasPrueba), true);
      assert.strictEqual(accounting.asientoAfectaCuenta(transfer, '5101', catalogoCuentasPrueba), false);
    });
  });

  describe('Función pura filtrarAsientosContables (accounting.js)', () => {
    it('debe retornar todos los asientos cuando no se aplican filtros restrictivos', () => {
      const res = accounting.filtrarAsientosContables(asientosEjemplo, {
        tipo: 'todos',
        mes: '',
        cuenta: 'todas',
        catalogoCuentas: catalogoCuentasPrueba
      });
      assert.strictEqual(res.length, 7);
    });

    it('debe filtrar exclusivamente por Tipo de transacción', () => {
      const gastos = accounting.filtrarAsientosContables(asientosEjemplo, { tipo: 'Gasto' });
      assert.strictEqual(gastos.length, 2);
      assert.ok(gastos.every(g => g.tipo === 'Gasto'));

      const transferencias = accounting.filtrarAsientosContables(asientosEjemplo, { tipo: 'Transferencia' });
      assert.strictEqual(transferencias.length, 1);
      assert.strictEqual(transferencias[0].id, 'AS-TRF-TRF-401');
    });

    it('debe filtrar exclusivamente por Mes de la transacción (YYYY-MM)', () => {
      const nov2026 = accounting.filtrarAsientosContables(asientosEjemplo, { mes: '2026-11' });
      assert.strictEqual(nov2026.length, 5);
      assert.ok(nov2026.every(a => a.fecha.startsWith('2026-11')));

      const oct2026 = accounting.filtrarAsientosContables(asientosEjemplo, { mes: '2026-10' });
      assert.strictEqual(oct2026.length, 2);
      assert.ok(oct2026.every(a => a.fecha.startsWith('2026-10')));

      const dic2026 = accounting.filtrarAsientosContables(asientosEjemplo, { mes: '2026-12' });
      assert.strictEqual(dic2026.length, 0);
    });

    it('debe filtrar exclusivamente por Cuenta Contable (código)', () => {
      const movsArriendo = accounting.filtrarAsientosContables(asientosEjemplo, {
        cuenta: '5201',
        catalogoCuentas: catalogoCuentasPrueba
      });
      assert.strictEqual(movsArriendo.length, 1);
      assert.strictEqual(movsArriendo[0].id, 'AS-EXP-EXP-301');

      const movsElectricidad = accounting.filtrarAsientosContables(asientosEjemplo, {
        cuenta: '5202',
        catalogoCuentas: catalogoCuentasPrueba
      });
      assert.strictEqual(movsElectricidad.length, 1);
      assert.strictEqual(movsElectricidad[0].id, 'AS-EXP-EXP-302');
    });

    it('debe combinar filtros simultáneamente con operador lógico AND (Tipo + Mes + Cuenta)', () => {
      // Gastos de Noviembre 2026 en Arriendo (5201) -> 1 resultado
      const res1 = accounting.filtrarAsientosContables(asientosEjemplo, {
        tipo: 'Gasto',
        mes: '2026-11',
        cuenta: '5201',
        catalogoCuentas: catalogoCuentasPrueba
      });
      assert.strictEqual(res1.length, 1);
      assert.strictEqual(res1[0].id, 'AS-EXP-EXP-301');

      // Gastos de Octubre 2026 en Arriendo (5201) -> 0 resultados (en Octubre solo hubo electricidad)
      const res2 = accounting.filtrarAsientosContables(asientosEjemplo, {
        tipo: 'Gasto',
        mes: '2026-10',
        cuenta: '5201',
        catalogoCuentas: catalogoCuentasPrueba
      });
      assert.strictEqual(res2.length, 0);

      // Ingresos de Noviembre 2026 en Cuentas por Cobrar (1102) -> 1 resultado
      const res3 = accounting.filtrarAsientosContables(asientosEjemplo, {
        tipo: 'Ingreso',
        mes: '2026-11',
        cuenta: '1102',
        catalogoCuentas: catalogoCuentasPrueba
      });
      assert.strictEqual(res3.length, 1);
      assert.strictEqual(res3[0].id, 'AS-ORD-PED-101-CXC');
    });
  });

  describe('Integración con Interfaz HTML (index.html)', () => {
    const htmlPath = path.join(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    it('debe contener el filtro por tipo #acc-journal-filter-type', () => {
      assert.ok(htmlContent.includes('id="acc-journal-filter-type"'), 'Debe existir #acc-journal-filter-type');
    });

    it('debe contener el filtro por mes #acc-journal-filter-month y botón limpiar mes #btn-journal-clear-month', () => {
      assert.ok(htmlContent.includes('id="acc-journal-filter-month"'), 'Debe existir #acc-journal-filter-month');
      assert.ok(htmlContent.includes('type="month"'), 'El filtro de mes debe ser de tipo month');
      assert.ok(htmlContent.includes('id="btn-journal-clear-month"'), 'Debe existir #btn-journal-clear-month');
    });

    it('debe contener el filtro por cuenta contable #acc-journal-filter-account', () => {
      assert.ok(htmlContent.includes('id="acc-journal-filter-account"'), 'Debe existir #acc-journal-filter-account');
      assert.ok(htmlContent.includes('Todas las Cuentas'), 'Debe incluir opción por defecto Todas las Cuentas');
    });

    it('debe contener el botón de restablecimiento general #btn-journal-reset-filters', () => {
      assert.ok(htmlContent.includes('id="btn-journal-reset-filters"'), 'Debe existir #btn-journal-reset-filters');
    });
  });

  describe('Controladores en ui.js', () => {
    it('debe exponer las funciones de filtrado, población y limpieza en NovaprintUI', () => {
      assert.strictEqual(typeof ui.poblarSelectorCuentasLibroDiario, 'function');
      assert.strictEqual(typeof ui.limpiarFiltroMesLibroDiario, 'function');
      assert.strictEqual(typeof ui.resetFiltrosLibroDiario, 'function');
      assert.strictEqual(typeof ui.filtrarLibroDiario, 'function');
      assert.strictEqual(typeof ui.verMovimientosCuenta, 'function');
    });
  });
});
