// tests/inventory_material_usage.test.js
// Spec 038 — Vista de Material de Inventario Usado (al mes y acumulado)

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

function createMinimalDOM() {
  const elements = {};

  function makeEl(id, tagName = 'div') {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      value: '',
      textContent: '',
      innerHTML: '',
      className: '',
      classList: {
        classes: new Set(),
        add(...cls) { cls.forEach(c => this.classes.add(c)); },
        remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
        contains(c) { return this.classes.has(c); }
      },
      style: {},
      children: [],
      addEventListener() {},
      removeEventListener() {},
      querySelectorAll() { return []; },
      querySelector() { return null; },
      appendChild(child) { this.children.push(child); return child; }
    };
    elements[id] = el;
    return el;
  }

  // Sub-navegación y vistas
  makeEl('inv-subnav-container', 'div');
  makeEl('btn-inv-sub-stock', 'button');
  makeEl('btn-inv-sub-usage', 'button');
  makeEl('inv-subview-stock', 'div');
  makeEl('inv-subview-usage', 'div');

  // Métricas de uso
  makeEl('inv-usage-metric-units-month', 'div');
  makeEl('inv-usage-metric-cost-month', 'div');
  makeEl('inv-usage-metric-units-total', 'div');
  makeEl('inv-usage-metric-cost-total', 'div');
  makeEl('inv-usage-metric-month-label', 'div');

  // Filtros y tabla
  makeEl('inv-usage-search-input', 'input');
  makeEl('inv-usage-filter-month', 'input');
  makeEl('btn-inv-usage-current-month', 'button');
  makeEl('inv-usage-items-count', 'span');
  makeEl('inv-usage-table-body', 'tbody');

  // Elementos estándar de inventario para evitar errores en refrescarInventario
  makeEl('metric-inv-total-items', 'div');
  makeEl('metric-inv-total-units', 'div');
  makeEl('metric-inv-critical', 'div');
  makeEl('metric-inv-total-value', 'div');
  makeEl('inventory-search-input', 'input');
  makeEl('inventory-category-filter', 'select');
  makeEl('inventory-critical-only', 'input');
  makeEl('inventory-table-body', 'tbody');

  const doc = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = makeEl(id);
      }
      return elements[id];
    },
    createElement(tag) {
      return makeEl('elem-' + Math.random(), tag);
    }
  };

  return { doc, elements };
}

describe('Spec 038 — Vista de Material Usado en Inventario (al mes y acumulado)', () => {
  let storage, sales, production, ui, dom;

  beforeEach(() => {
    global.localStorage = createMockLocalStorage();
    dom = createMinimalDOM();
    global.document = dom.doc;
    global.window = {
      localStorage: global.localStorage,
      document: global.document,
      showToast: () => {}
    };

    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    sales = require('../assets/js/sales.js');
    production = require('../assets/js/production.js');
    ui = require('../assets/js/ui.js');

    global.NovaprintStorage = storage;
    global.NovaprintSales = sales;
    global.NovaprintProduction = production;
    global.NovaprintUI = ui;
  });

  describe('Cálculo de Consumo de Materiales (production.calcularConsumoMateriales)', () => {
    it('debe calcular el material usado al mes y acumulado a partir de pedidos válidos', () => {
      const inventario = [
        {
          id: 'INV-001',
          code: 'POL-NEG-M',
          name: 'Polera Algodón Negra Talla M',
          category: 'Prendas Lisas',
          garmentType: 'Polera',
          color: 'Negro',
          size: 'M',
          unit: 'un.',
          unitCost: 2800,
          currentStock: 50
        },
        {
          id: 'INV-002',
          code: 'POL-BLA-L',
          name: 'Polera Algodón Blanca Talla L',
          category: 'Prendas Lisas',
          garmentType: 'Polera',
          color: 'Blanco',
          size: 'L',
          unit: 'un.',
          unitCost: 2800,
          currentStock: 30
        }
      ];

      const pedidos = [
        {
          id: 'PED-001',
          status: 'En Proceso',
          dates: { deliveryDate: '2026-11-20' },
          items: [
            { garmentType: 'Polera', color: 'Negro', size: 'M', quantity: 10, printLocation: 'Ninguno' }
          ]
        },
        {
          id: 'PED-002',
          status: 'Entregado',
          dates: { deliveryDate: '2026-10-15' },
          items: [
            { garmentType: 'Polera', color: 'Negro', size: 'M', quantity: 15, printLocation: 'Ninguno' }
          ]
        },
        {
          id: 'PED-003',
          status: 'Cancelado',
          dates: { deliveryDate: '2026-11-10' },
          items: [
            { garmentType: 'Polera', color: 'Negro', size: 'M', quantity: 50, printLocation: 'Ninguno' }
          ]
        }
      ];

      const resultado = production.calcularConsumoMateriales(pedidos, inventario, '2026-11');

      assert.strictEqual(resultado.mesConsultado, '2026-11');
      assert.strictEqual(resultado.resumen.unidadesMes, 10, 'Mes actual debe tener 10 unidades (PED-001)');
      assert.strictEqual(resultado.resumen.costoMes, 28000, 'Costo mes debe ser 10 * 2800 = 28.000');
      assert.strictEqual(resultado.resumen.unidadesAcumulado, 25, 'Acumulado debe ser 10 + 15 = 25 (excluye cancelado PED-003)');
      assert.strictEqual(resultado.resumen.costoAcumulado, 70000, 'Costo acumulado debe ser 25 * 2800 = 70.000');
      assert.strictEqual(resultado.items.length, 1, 'Solo 1 artículo con consumo');
      assert.strictEqual(resultado.items[0].code, 'POL-NEG-M');
      assert.strictEqual(resultado.items[0].usadoMes, 10);
      assert.strictEqual(resultado.items[0].usadoAcumulado, 25);
    });

    it('debe registrar el consumo de insumos de estampado cuando printLocation no es Ninguno', () => {
      const inventario = [
        {
          id: 'INV-001',
          code: 'POL-NEG-M',
          name: 'Polera Algodón Negra M',
          category: 'Prendas Lisas',
          garmentType: 'Polera',
          color: 'Negro',
          size: 'M',
          unit: 'un.',
          unitCost: 2800,
          currentStock: 40
        }
      ];

      const pedidos = [
        {
          id: 'PED-010',
          status: 'En Proceso',
          dates: { deliveryDate: '2026-11-15' },
          items: [
            {
              garmentType: 'Polera',
              color: 'Negro',
              size: 'M',
              quantity: 20,
              technique: 'DTF',
              printLocation: 'Adelante'
            }
          ]
        }
      ];

      const resultado = production.calcularConsumoMateriales(pedidos, inventario, '2026-11');

      // Debe haber al menos 2 ítems: la prenda y el estampado DTF
      assert.strictEqual(resultado.items.length, 2);
      const itemEstampado = resultado.items.find(it => it.category === 'Insumos DTF' || it.garmentType === 'Estampado');
      assert.ok(itemEstampado, 'Debe registrarse el ítem de estampado');
      assert.strictEqual(itemEstampado.usadoMes, 20);
      assert.strictEqual(itemEstampado.usadoAcumulado, 20);
      assert.ok(itemEstampado.costoMes > 0, 'El costo de estampado debe ser mayor a 0');
    });
  });

  describe('Controlador de Sub-Vistas e Interfaz (ui.js)', () => {
    it('cambiarSubVistaInventario debe alternar entre catálogo de stock y material usado', () => {
      const btnStock = dom.elements['btn-inv-sub-stock'];
      const btnUsage = dom.elements['btn-inv-sub-usage'];
      const viewStock = dom.elements['inv-subview-stock'];
      const viewUsage = dom.elements['inv-subview-usage'];

      // Cambiar a vista de material usado
      ui.cambiarSubVistaInventario('usage');

      assert.ok(btnUsage.className.includes('bg-blue-600'), 'Botón usage debe tener clase activa');
      assert.ok(viewStock.classList.contains('hidden'), 'Subvista stock debe quedar oculta');
      assert.strictEqual(viewUsage.classList.contains('hidden'), false, 'Subvista usage no debe estar oculta');

      // Cambiar de vuelta a catálogo de stock
      ui.cambiarSubVistaInventario('stock');

      assert.ok(btnStock.className.includes('bg-blue-600'), 'Botón stock debe tener clase activa');
      assert.strictEqual(viewStock.classList.contains('hidden'), false, 'Subvista stock no debe estar oculta');
      assert.ok(viewUsage.classList.contains('hidden'), 'Subvista usage debe quedar oculta');
    });

    it('renderInventoryUsage debe actualizar las 4 tarjetas de métricas y la tabla de consumo', () => {
      const datosPrueba = {
        mesConsultado: '2026-11',
        resumen: {
          unidadesMes: 120,
          costoMes: 336000,
          unidadesAcumulado: 450,
          costoAcumulado: 1260000,
          totalArticulos: 2
        },
        items: [
          {
            id: 'INV-001',
            code: 'POL-NEG-M',
            name: 'Polera Algodón Negra M',
            category: 'Prendas Lisas',
            color: 'Negro',
            size: 'M',
            unit: 'un.',
            unitCost: 2800,
            currentStock: 10,
            usadoMes: 100,
            costoMes: 280000,
            usadoAcumulado: 350,
            costoAcumulado: 980000
          },
          {
            id: 'INV-002',
            code: 'POL-BLA-L',
            name: 'Polera Algodón Blanca L',
            category: 'Prendas Lisas',
            color: 'Blanco',
            size: 'L',
            unit: 'un.',
            unitCost: 2800,
            currentStock: 5,
            usadoMes: 20,
            costoMes: 56000,
            usadoAcumulado: 100,
            costoAcumulado: 280000
          }
        ]
      };

      ui.renderInventoryUsage(datosPrueba);

      assert.strictEqual(dom.elements['inv-usage-metric-units-month'].textContent, '120 un.');
      assert.ok(dom.elements['inv-usage-metric-cost-month'].textContent.includes('336.000'));
      assert.strictEqual(dom.elements['inv-usage-metric-units-total'].textContent, '450 un.');
      assert.ok(dom.elements['inv-usage-metric-cost-total'].textContent.includes('1.260.000'));
      assert.strictEqual(dom.elements['inv-usage-items-count'].textContent, '2');

      const tbodyHtml = dom.elements['inv-usage-table-body'].innerHTML;
      assert.ok(tbodyHtml.includes('POL-NEG-M'), 'La tabla debe listar la polera negra');
      assert.ok(tbodyHtml.includes('POL-BLA-L'), 'La tabla debe listar la polera blanca');
      assert.ok(tbodyHtml.includes('100 un.'), 'Debe figurar la cantidad mensual');
      assert.ok(tbodyHtml.includes('350 un.'), 'Debe figurar la cantidad acumulada');
    });

    it('renderInventoryUsage debe mostrar estado vacío si no hay consumos', () => {
      const datosVacios = {
        mesConsultado: '2026-11',
        resumen: {
          unidadesMes: 0,
          costoMes: 0,
          unidadesAcumulado: 0,
          costoAcumulado: 0,
          totalArticulos: 0
        },
        items: []
      };

      ui.renderInventoryUsage(datosVacios);

      assert.strictEqual(dom.elements['inv-usage-metric-units-month'].textContent, '0 un.');
      assert.strictEqual(dom.elements['inv-usage-items-count'].textContent, '0');
      assert.ok(dom.elements['inv-usage-table-body'].innerHTML.includes('No se registra material usado'));
    });

    it('filtrarMaterialUsado debe filtrar por búsqueda de texto reactivamente', () => {
      storage.saveInventoryItem({
        id: 'INV-10',
        code: 'POL-ROJ-S',
        name: 'Polera Roja S',
        category: 'Prendas Lisas',
        color: 'Rojo',
        size: 'S',
        currentStock: 20,
        unitCost: 2800
      });

      storage.saveOrder({
        id: 'PED-ROJO',
        status: 'En Proceso',
        dates: { deliveryDate: '2026-11-10' },
        items: [
          { garmentType: 'Polera', color: 'Rojo', size: 'S', quantity: 5, printLocation: 'Ninguno' }
        ]
      });

      // Búsqueda que coincide con Rojo
      dom.elements['inv-usage-search-input'].value = 'rojo';
      dom.elements['inv-usage-filter-month'].value = '2026-11';
      ui.filtrarMaterialUsado();

      assert.strictEqual(dom.elements['inv-usage-items-count'].textContent, '1');
      assert.ok(dom.elements['inv-usage-table-body'].innerHTML.includes('Polera Roja S'));

      // Búsqueda sin coincidencias
      dom.elements['inv-usage-search-input'].value = 'inexistente';
      ui.filtrarMaterialUsado();

      assert.strictEqual(dom.elements['inv-usage-items-count'].textContent, '0');
      assert.ok(dom.elements['inv-usage-table-body'].innerHTML.includes('No se registra material usado'));
    });

    it('seleccionarMesActualUso debe fijar el mes del selector al actual', () => {
      const mesActualEsperado = new Date().toISOString().slice(0, 7);
      dom.elements['inv-usage-filter-month'].value = '2024-01';

      ui.seleccionarMesActualUso();

      assert.strictEqual(dom.elements['inv-usage-filter-month'].value, mesActualEsperado);
    });
  });
});
