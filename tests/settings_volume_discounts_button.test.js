// tests/settings_volume_discounts_button.test.js
// Spec 047 — Botón para Modificar Escala de Descuentos en Ajustes de Novaprint

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Spec 047 — Botón Escala de Descuentos en Ajustes (index.html & main.js)', () => {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  it('index.html incluye el modal #dialog-settings con el botón #btn-settings-volume-discounts', () => {
    assert.match(htmlContent, /<dialog[^>]*id="dialog-settings"/, 'Debe existir el diálogo #dialog-settings');
    assert.match(htmlContent, /id="btn-settings-volume-discounts"/, 'Debe existir el botón #btn-settings-volume-discounts');
  });

  it('el botón tiene la etiqueta y elementos visuales correspondientes', () => {
    assert.match(htmlContent, /Modificar Escala de Descuentos/, 'Debe contener el texto "Modificar Escala de Descuentos"');
    assert.match(htmlContent, /🏷️/, 'Debe contener el icono de etiqueta 🏷️');
    assert.match(htmlContent, /Configurar ➔/, 'Debe contener el indicador "Configurar ➔"');
  });

  it('el botón está ubicado en la sección Políticas Comerciales antes de la sección de Respaldo JSON', () => {
    const dialogStart = htmlContent.indexOf('id="dialog-settings"');
    const buttonPos = htmlContent.indexOf('id="btn-settings-volume-discounts"');
    const backupPos = htmlContent.indexOf('id="btn-export-backup"');

    assert.ok(dialogStart < buttonPos, 'El botón debe estar dentro del diálogo #dialog-settings');
    assert.ok(buttonPos < backupPos, 'El botón debe ubicarse antes de la sección de Respaldo JSON');
    assert.match(htmlContent, /Políticas Comerciales & Descuentos/, 'Debe titularse Políticas Comerciales & Descuentos');
  });

  it('main.js registra el escuchador de clic en #btn-settings-volume-discounts para abrir el modal de descuentos', () => {
    let abrirModalLlamado = false;
    const listeners = {};

    global.localStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    };

    global.document = {
      readyState: 'loading',
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      documentElement: {
        classList: {
          add() {},
          remove() {},
          contains() { return false; },
          toggle() {}
        }
      },
      getElementById(id) {
        if (id === 'btn-settings-volume-discounts') {
          return {
            id,
            addEventListener(event, fn) {
              listeners[event] = fn;
            }
          };
        }
        return {
          addEventListener() {},
          setAttribute() {},
          classList: { add() {}, remove() {} },
          value: ''
        };
      }
    };

    const mockUI = new Proxy({
      abrirModalDescuentosVolumen() {
        abrirModalLlamado = true;
      }
    }, {
      get(target, prop) {
        if (prop in target) return target[prop];
        return () => {};
      }
    });

    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];
    const storage = require('../assets/js/storage.js');
    const sales = require('../assets/js/sales.js');
    const production = require('../assets/js/production.js');

    global.window = {
      location: { hash: '' },
      addEventListener: () => {},
      removeEventListener: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      NovaprintUI: mockUI,
      NovaprintStorage: storage,
      NovaprintSales: sales,
      NovaprintProduction: production
    };

    global.NovaprintUI = mockUI;
    global.NovaprintStorage = storage;
    global.NovaprintSales = sales;
    global.NovaprintProduction = production;

    delete require.cache[require.resolve('../assets/js/main.js')];
    const main = require('../assets/js/main.js');

    if (typeof main.init === 'function') {
      main.init();
    }

    assert.ok(typeof listeners['click'] === 'function', 'Debe haber un listener de click registrado en el botón');
    listeners['click']();
    assert.equal(abrirModalLlamado, true, 'Debe haber invocado abrirModalDescuentosVolumen()');

    delete global.document;
    delete global.window;
    delete global.NovaprintUI;
    delete global.NovaprintStorage;
    delete global.NovaprintSales;
    delete global.NovaprintProduction;
    delete global.localStorage;
  });
});
