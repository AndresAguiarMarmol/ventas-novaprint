// tests/expense_accounts_link.test.js
// Spec 040 — Enlace de Categoría de Gastos de Taller con Cuentas del Plan de Cuentas

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
      open: false,
      options: [],
      selectedIndex: 0,
      classList: {
        classes: new Set(),
        add(...cls) { cls.forEach(c => this.classes.add(c)); },
        remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
        contains(c) { return this.classes.has(c); }
      },
      style: {},
      children: [],
      showModal() { this.open = true; },
      close() { this.open = false; },
      reset() { this.value = ''; },
      remove() {},
      addEventListener() {},
      removeEventListener() {},
      querySelectorAll() { return []; },
      querySelector() { return null; },
      appendChild(child) {
        this.children.push(child);
        if (this.tagName === 'SELECT') {
          this.options.push(child);
        }
        return child;
      }
    };
    elements[id] = el;
    return el;
  }

  // Modal de Gastos
  makeEl('dialog-expense', 'dialog');
  makeEl('form-expense', 'form');
  makeEl('expense-id-hidden', 'input');
  makeEl('expense-date-input', 'input');
  const catSelect = makeEl('expense-category-select', 'select');
  makeEl('expense-desc-input', 'input');
  makeEl('expense-amount-input', 'input');
  makeEl('expense-payment-method', 'select');
  makeEl('expense-notes-input', 'textarea');
  makeEl('expense-modal-title', 'h3');

  // Propiedad getter/setter para sincronizar innerHTML de select con options en mock
  Object.defineProperty(catSelect, 'innerHTML', {
    get() {
      return this._innerHTML || '';
    },
    set(html) {
      this._innerHTML = html;
      this.options = [];
      const optionRegex = /<option\s+value="([^"]*)"(?:\s+data-code="([^"]*)")?(?:\s+data-id="([^"]*)")?[^>]*>([\s\S]*?)<\/option>/gi;
      let match;
      while ((match = optionRegex.exec(html)) !== null) {
        const val = match[1];
        const code = match[2] || '';
        const id = match[3] || '';
        const text = match[4].trim();
        const opt = {
          value: val,
          text: text,
          textContent: text,
          getAttribute(attr) {
            if (attr === 'data-code') return code;
            if (attr === 'data-id') return id;
            return null;
          }
        };
        this.options.push(opt);
      }
      if (this.options.length > 0) {
        this.selectedIndex = 0;
        this.value = this.options[0].value;
      }
    }
  });

  const doc = {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = makeEl(id);
      }
      return elements[id];
    },
    createElement(tag) {
      const el = makeEl('elem-' + Math.random(), tag);
      el.getAttribute = (attr) => el[attr] || null;
      el.setAttribute = (attr, val) => { el[attr] = val; };
      return el;
    }
  };

  return { doc, elements };
}

describe('Spec 040 — Enlace de Categoría de Gastos con Plan de Cuentas', () => {
  let storage, accounting, ui, dom;

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
    delete require.cache[require.resolve('../assets/js/accounting.js')];
    delete require.cache[require.resolve('../assets/js/ui.js')];

    storage = require('../assets/js/storage.js');
    accounting = require('../assets/js/accounting.js');
    ui = require('../assets/js/ui.js');

    global.NovaprintStorage = storage;
    global.NovaprintAccounting = accounting;
    global.NovaprintUI = ui;
  });

  describe('1. Poblado Dinámico de Categorías desde el Plan de Cuentas', () => {
    it('poblarSelectorCategoriasGasto debe cargar las cuentas de Egreso del Plan de Cuentas en el select', () => {
      ui.poblarSelectorCategoriasGasto();

      const catSelect = dom.elements['expense-category-select'];
      assert.ok(catSelect.options.length >= 6, 'Debe cargar al menos las 6 cuentas canónicas de gastos de taller');

      const codigos = catSelect.options.map(opt => opt.getAttribute('data-code'));
      assert.ok(codigos.includes('5201'), 'Debe incluir 5201 Arriendo de Taller');
      assert.ok(codigos.includes('5202'), 'Debe incluir 5202 Electricidad y Servicios Básicos');
      assert.ok(codigos.includes('5203'), 'Debe incluir 5203 Mantenimiento de Maquinaria Textil');
    });

    it('debe incluir automáticamente cuentas personalizadas creadas por el usuario en el Plan de Cuentas', () => {
      // Usuario crea una nueva cuenta de egreso en el taller
      storage.saveAccount({
        id: 'ACC-5207',
        codigo: '5207',
        nombre: 'Publicidad y Marketing Digital',
        tipo: 'Egreso',
        subtipo: 'Operacional',
        descripcion: 'Campañas de Instagram y Google Ads para ventas de poleras.'
      });

      ui.poblarSelectorCategoriasGasto();

      const catSelect = dom.elements['expense-category-select'];
      const optPublicidad = catSelect.options.find(opt => opt.getAttribute('data-code') === '5207');
      assert.ok(optPublicidad, 'La nueva cuenta 5207 debe figurar en el selector');
      assert.strictEqual(optPublicidad.value, 'Publicidad y Marketing Digital');
    });

    it('abrirModalNuevoGasto debe invocar el poblado y abrir el diálogo dialog-expense', () => {
      ui.abrirModalNuevoGasto();

      assert.strictEqual(dom.elements['dialog-expense'].open, true);
      assert.ok(dom.elements['expense-category-select'].options.length > 0);
      assert.strictEqual(dom.elements['expense-id-hidden'].value, '');
    });
  });

  describe('2. Persistencia y Precarga de Cuentas en Edición y Duplicación', () => {
    it('guardarGastoDesdeFormulario debe persistir category, accountCode, accountId y accountName', () => {
      ui.poblarSelectorCategoriasGasto();

      const catSelect = dom.elements['expense-category-select'];
      // Seleccionar 5202 Electricidad y Servicios Básicos
      const idx = catSelect.options.findIndex(opt => opt.getAttribute('data-code') === '5202');
      assert.ok(idx !== -1);
      catSelect.selectedIndex = idx;
      catSelect.value = catSelect.options[idx].value;

      dom.elements['expense-desc-input'].value = 'Boleta Enel mes en curso';
      dom.elements['expense-amount-input'].value = '45000';
      dom.elements['expense-date-input'].value = '2026-11-14';

      ui.guardarGastoDesdeFormulario();

      const gastos = storage.getExpenses();
      assert.strictEqual(gastos.length, 1);
      const g = gastos[0];
      assert.strictEqual(g.category, 'Electricidad y Servicios Básicos');
      assert.strictEqual(g.accountCode, '5202');
      assert.strictEqual(g.accountId, 'ACC-5202');
      assert.strictEqual(g.accountName, 'Electricidad y Servicios Básicos');
      assert.strictEqual(g.amount, 45000);
    });

    it('editarGasto debe preseleccionar fielmente la cuenta asociada al gasto', () => {
      const gasto = storage.saveExpense({
        date: '2026-11-12',
        category: 'Mantenimiento de Maquinaria Textil',
        accountCode: '5203',
        accountId: 'ACC-5203',
        accountName: 'Mantenimiento de Maquinaria Textil',
        description: 'Cambio de teflón estampadora',
        amount: 32000,
        paymentMethod: 'Transferencia / Banco'
      });

      ui.editarGasto(gasto.id);

      assert.strictEqual(dom.elements['dialog-expense'].open, true);
      assert.strictEqual(dom.elements['expense-id-hidden'].value, gasto.id);
      assert.strictEqual(dom.elements['expense-category-select'].value, 'Mantenimiento de Maquinaria Textil');
    });

    it('duplicarGasto debe clonar el gasto preseleccionando la cuenta contable y limpiando el ID', () => {
      const gasto = storage.saveExpense({
        date: '2026-11-10',
        category: 'Arriendo de Taller',
        accountCode: '5201',
        accountId: 'ACC-5201',
        accountName: 'Arriendo de Taller',
        description: 'Pago mensual galpón',
        amount: 350000,
        paymentMethod: 'Transferencia / Banco'
      });

      ui.duplicarGasto(gasto.id);

      assert.strictEqual(dom.elements['dialog-expense'].open, true);
      assert.strictEqual(dom.elements['expense-id-hidden'].value, '');
      assert.strictEqual(dom.elements['expense-category-select'].value, 'Arriendo de Taller');
      assert.ok(dom.elements['expense-desc-input'].value.includes('(Copia)'));
    });
  });

  describe('3. Imputación en Libro Diario y Libro Mayor (accounting.js)', () => {
    it('generarLibroDiario debe reflejar accountCode y accountId en el asiento de gasto', () => {
      const gasto = {
        id: 'EXP-TEST-01',
        date: '2026-11-14',
        category: 'Publicidad y Marketing Digital',
        accountCode: '5207',
        accountId: 'ACC-5207',
        accountName: 'Publicidad y Marketing Digital',
        description: 'Campaña Meta Ads',
        amount: 50000
      };

      const asientos = accounting.generarLibroDiario([], [], [gasto]);
      assert.strictEqual(asientos.length, 1);
      const asiento = asientos[0];

      assert.strictEqual(asiento.tipo, 'Gasto');
      assert.strictEqual(asiento.cuentaDebe, 'Publicidad y Marketing Digital');
      assert.strictEqual(asiento.accountCode, '5207');
      assert.strictEqual(asiento.accountId, 'ACC-5207');
      assert.strictEqual(asiento.debe, 50000);
      assert.strictEqual(asiento.haber, 50000);
    });

    it('asientoAfectaCuenta debe vincular el gasto con la cuenta por accountCode o accountId', () => {
      const gasto = {
        id: 'EXP-TEST-02',
        date: '2026-11-14',
        category: 'Mantenimiento de Maquinaria Textil',
        accountCode: '5203',
        accountId: 'ACC-5203',
        accountName: 'Mantenimiento de Maquinaria Textil',
        description: 'Repuesto plotter',
        amount: 25000
      };

      const asientos = accounting.generarLibroDiario([], [], [gasto]);
      const asiento = asientos[0];

      const cuenta5203 = { id: 'ACC-5203', codigo: '5203', nombre: 'Mantenimiento de Maquinaria Textil', tipo: 'Egreso' };
      const cuenta5201 = { id: 'ACC-5201', codigo: '5201', nombre: 'Arriendo de Taller', tipo: 'Egreso' };

      assert.strictEqual(accounting.asientoAfectaCuenta(asiento, cuenta5203), true);
      assert.strictEqual(accounting.asientoAfectaCuenta(asiento, cuenta5201), false);
    });

    it('calcularSaldosPlanCuentas debe imputar el débito en el saldo de la cuenta específica', () => {
      const gasto = {
        id: 'EXP-TEST-03',
        date: '2026-11-14',
        category: 'Electricidad y Servicios Básicos',
        accountCode: '5202',
        accountId: 'ACC-5202',
        accountName: 'Electricidad y Servicios Básicos',
        description: 'Luz taller',
        amount: 40000
      };

      const cuentas = [
        { id: 'ACC-5202', codigo: '5202', nombre: 'Electricidad y Servicios Básicos', tipo: 'Egreso', subtipo: 'Operacional' }
      ];

      const asientos = accounting.generarLibroDiario([], [], [gasto]);
      const saldos = accounting.calcularSaldosPlanCuentas(asientos, cuentas);

      assert.strictEqual(saldos['ACC-5202'].saldo, 40000);
      assert.strictEqual(saldos['ACC-5202'].totalDebe, 40000);
      assert.strictEqual(saldos['ACC-5202'].totalMovimientos, 1);
    });
  });
});
