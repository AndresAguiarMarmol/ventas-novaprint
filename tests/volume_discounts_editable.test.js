// tests/volume_discounts_editable.test.js
// Spec 048 — Edición Interactiva de la Escala de Descuentos por Volumen

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Spec 048 — Escala de Descuentos Editable (storage.js, sales.js, ui.js, index.html)', () => {
  let storage;
  let sales;
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    global.localStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    };

    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    storage = require('../assets/js/storage.js');
    global.NovaprintStorage = storage;
    sales = require('../assets/js/sales.js');
    global.NovaprintSales = sales;
  });

  afterEach(() => {
    delete global.NovaprintStorage;
    delete global.NovaprintSales;
    delete global.localStorage;
  });

  it('storage.getVolumeDiscountTiers retorna los 5 tramos canónicos oficiales por defecto', () => {
    const tiers = storage.getVolumeDiscountTiers();
    assert.equal(Array.isArray(tiers), true);
    assert.equal(tiers.length, 5);
    assert.deepEqual(tiers.map(t => t.percent), [0, 5, 10, 15, 20]);
    assert.deepEqual(tiers.map(t => t.min), [1, 6, 12, 25, 50]);
  });

  it('storage.saveVolumeDiscountTiers guarda rangos y porcentajes modificados en novaprint_settings', () => {
    const customTiers = [
      { min: 1, max: 9, percent: 0, label: '1 a 9 un.', category: 'Base' },
      { min: 10, max: 19, percent: 7, label: '10 a 19 un.', category: 'Promoción' },
      { min: 20, max: 29, percent: 12, label: '20 a 29 un.', category: 'Mayor' },
      { min: 30, max: 49, percent: 18, label: '30 a 49 un.', category: 'Granel' },
      { min: 50, max: 999999, percent: 25, label: '50+ un.', category: 'Especial' }
    ];

    const saved = storage.saveVolumeDiscountTiers(customTiers);
    assert.equal(saved.length, 5);
    assert.equal(saved[1].percent, 7);
    assert.equal(saved[1].min, 10);
    assert.equal(saved[4].percent, 25);

    const reloaded = storage.getVolumeDiscountTiers();
    assert.equal(reloaded[1].percent, 7);
    assert.equal(reloaded[4].percent, 25);
  });

  it('sales.calcularDescuentoVolumen aplica dinámicamente los tramos personalizados guardados', () => {
    // Con tramos por defecto
    const descDefecto = sales.calcularDescuentoVolumen(10, 100000);
    assert.equal(descDefecto.porcentaje, 5); // 6 a 11 es 5%
    assert.equal(descDefecto.montoDescuento, 5000);

    // Personalizar escala: 10 a 19 un es 8%
    storage.saveVolumeDiscountTiers([
      { min: 1, max: 9, percent: 0 },
      { min: 10, max: 19, percent: 8 },
      { min: 20, max: 29, percent: 14 },
      { min: 30, max: 49, percent: 20 },
      { min: 50, max: 999999, percent: 25 }
    ]);

    const descCustom = sales.calcularDescuentoVolumen(10, 100000);
    assert.equal(descCustom.porcentaje, 8);
    assert.equal(descCustom.montoDescuento, 8000);

    const desc50 = sales.calcularDescuentoVolumen(50, 200000);
    assert.equal(desc50.porcentaje, 25);
    assert.equal(desc50.montoDescuento, 50000);
  });

  it('storage.resetVolumeDiscountTiers restablece los tramos a los porcentajes oficiales (0, 5, 10, 15, 20)', () => {
    storage.saveVolumeDiscountTiers([
      { min: 1, max: 9, percent: 2 },
      { min: 10, max: 19, percent: 12 },
      { min: 20, max: 29, percent: 18 },
      { min: 30, max: 49, percent: 22 },
      { min: 50, max: 999999, percent: 30 }
    ]);

    const resetResult = storage.resetVolumeDiscountTiers();
    assert.deepEqual(resetResult.map(t => t.percent), [0, 5, 10, 15, 20]);
    assert.deepEqual(resetResult.map(t => t.min), [1, 6, 12, 25, 50]);

    const active = storage.getVolumeDiscountTiers();
    assert.deepEqual(active.map(t => t.percent), [0, 5, 10, 15, 20]);
  });

  it('index.html incluye los inputs editables y botones de acción en #dialog-volume-discounts', () => {
    assert.match(htmlContent, /id="tier-min-0"/, 'Debe existir el input tier-min-0');
    assert.match(htmlContent, /id="tier-max-0"/, 'Debe existir el input tier-max-0');
    assert.match(htmlContent, /id="tier-percent-0"/, 'Debe existir el input tier-percent-0');

    assert.match(htmlContent, /id="tier-min-4"/, 'Debe existir el input tier-min-4');
    assert.match(htmlContent, /id="tier-percent-4"/, 'Debe existir el input tier-percent-4');

    assert.match(htmlContent, /id="btn-save-volume-discounts"/, 'Debe existir el botón #btn-save-volume-discounts');
    assert.match(htmlContent, /id="btn-reset-volume-discounts"/, 'Debe existir el botón #btn-reset-volume-discounts');
    assert.match(htmlContent, /id="btn-close-volume-discounts"/, 'Debe existir el botón #btn-close-volume-discounts');
  });

  it('ui.guardarEscalaDescuentosDesdeFormulario y ui.restablecerEscalaDescuentos operan reactivamente', () => {
    delete require.cache[require.resolve('../assets/js/ui.js')];

    const elementStore = {};
    function makeElement(id) {
      return {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        setAttribute() {},
        classList: { add() {}, remove() {}, contains() { return false; } },
        appendChild() {},
        style: {}
      };
    }

    global.document = {
      readyState: 'complete',
      createElement: () => ({
        setAttribute() {},
        classList: { add() {} },
        style: {},
        appendChild() {},
        remove() {}
      }),
      body: {
        appendChild() {}
      },
      getElementById(id) {
        if (!elementStore[id]) {
          elementStore[id] = makeElement(id);
        }
        return elementStore[id];
      },
      querySelectorAll() { return []; },
      querySelector() { return null; }
    };

    global.window = {
      location: { hash: '' },
      addEventListener() {},
      removeEventListener() {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      NovaprintStorage: storage,
      NovaprintSales: sales
    };

    global.NovaprintStorage = storage;
    global.NovaprintSales = sales;

    const ui = require('../assets/js/ui.js');
    assert.equal(typeof ui.guardarEscalaDescuentosDesdeFormulario, 'function');
    assert.equal(typeof ui.restablecerEscalaDescuentos, 'function');

    // Configurar inputs simulados
    for (let i = 0; i < 5; i++) {
      elementStore[`tier-min-${i}`] = { value: String(i * 10 + 1) };
      elementStore[`tier-max-${i}`] = { value: String((i + 1) * 10) };
      elementStore[`tier-percent-${i}`] = { value: String(i * 5) };
    }
    elementStore['tier-percent-1'].value = '7'; // Cambiar a 7%

    ui.guardarEscalaDescuentosDesdeFormulario();

    const saved = storage.getVolumeDiscountTiers();
    assert.equal(saved[1].percent, 7);

    // Restablecer
    ui.restablecerEscalaDescuentos();
    const restored = storage.getVolumeDiscountTiers();
    assert.equal(restored[1].percent, 5);

    delete global.document;
    delete global.window;
  });
});
