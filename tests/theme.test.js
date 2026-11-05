const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

describe('Spec 010 — Selector de Tema Claro / Oscuro (main.js & storage.js)', () => {
  let main;
  let storage;

  beforeEach(() => {
    const classListSet = new Set();
    global.document = {
      readyState: 'complete',
      addEventListener: () => {},
      documentElement: {
        classList: {
          add: (cls) => classListSet.add(cls),
          remove: (cls) => classListSet.delete(cls),
          contains: (cls) => classListSet.has(cls),
          toggle: (cls, force) => {
            if (force === undefined) {
              if (classListSet.has(cls)) classListSet.delete(cls);
              else classListSet.add(cls);
            } else if (force) {
              classListSet.add(cls);
            } else {
              classListSet.delete(cls);
            }
          }
        }
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null
    };

    global.window = {
      location: { hash: '' },
      addEventListener: () => {},
      removeEventListener: () => {},
      matchMedia: (query) => ({
        matches: query.includes('dark'),
        addEventListener: () => {}
      })
    };

    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/main.js')];
    storage = require('../assets/js/storage.js');
    main = require('../assets/js/main.js');
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  it('resuelve correctamente si un tema es oscuro', () => {
    assert.equal(main.resolverEsOscuro('dark'), true);
    assert.equal(main.resolverEsOscuro('light'), false);
    assert.equal(main.resolverEsOscuro('system'), true);
  });

  it('aplica tema oscuro añadiendo la clase dark a documentElement', () => {
    const res = main.aplicarTema('dark');
    assert.equal(res.tema, 'dark');
    assert.equal(res.esOscuro, true);
    assert.equal(global.document.documentElement.classList.contains('dark'), true);
  });

  it('aplica tema claro retirando la clase dark de documentElement', () => {
    global.document.documentElement.classList.add('dark');
    const res = main.aplicarTema('light');
    assert.equal(res.tema, 'light');
    assert.equal(res.esOscuro, false);
    assert.equal(global.document.documentElement.classList.contains('dark'), false);
  });

  it('normaliza temas inválidos o desconocidos a "system"', () => {
    const res = main.aplicarTema('invalido-xyz');
    assert.equal(res.tema, 'system');
  });

  it('persiste la selección de tema en almacenamiento y se recupera con getSettings', () => {
    storage.saveSettings({ theme: 'dark' });
    assert.equal(storage.getSettings().theme, 'dark');
    storage.saveSettings({ theme: 'light' });
    assert.equal(storage.getSettings().theme, 'light');
  });

  it('Spec 012: BUILD_VERSION y obtenerDatosFechaFooter mantienen el valor fijo de generación', () => {
    assert.equal(main.BUILD_VERSION.releaseCode, '2611.04');
    assert.equal(main.BUILD_VERSION.releaseDate, 'Noviembre 2026');
    const res = main.obtenerDatosFechaFooter();
    assert.equal(res.codigoVersion, '2611.04');
    assert.equal(res.mesAño, 'Noviembre 2026');
  });
});
