// tests/accounting_subnav_highlight.test.js
// Spec 036 — Resaltado con Recuadro Verde del Menú Horizontal de Contabilidad

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Spec 036 — Resaltado del Menú Horizontal de Contabilidad', () => {
  const htmlPath = path.resolve(__dirname, '../index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  it('debe existir el contenedor acc-subnav-container con recuadro verde visible (border-2 border-emerald-500)', () => {
    assert.ok(html.includes('id="acc-subnav-container"'), 'El contenedor de sub-navegación debe tener id="acc-subnav-container"');
    
    // Verificar clases de borde verde
    const subnavRegex = /<div\s+id="acc-subnav-container"[^>]*class="([^"]+)"/;
    const match = html.match(subnavRegex);
    assert.ok(match, 'Debe encontrarse el div con id="acc-subnav-container" y su atributo class');

    const classes = match[1];
    assert.ok(classes.includes('border-2'), 'Debe tener grosor de borde 2px (border-2)');
    assert.ok(classes.includes('border-emerald-500') || classes.includes('border-green-500'), 'Debe tener borde verde (border-emerald-500)');
    assert.ok(classes.includes('bg-emerald-50') || classes.includes('bg-green-50'), 'Debe tener fondo suave verde');
  });

  it('debe contener los 4 botones de sub-navegación contable con sus IDs exactos', () => {
    assert.ok(html.includes('id="btn-acc-sub-balance"'), 'Debe existir btn-acc-sub-balance');
    assert.ok(html.includes('id="btn-acc-sub-pnl"'), 'Debe existir btn-acc-sub-pnl');
    assert.ok(html.includes('id="btn-acc-sub-journal"'), 'Debe existir btn-acc-sub-journal');
    assert.ok(html.includes('id="btn-acc-sub-chart"'), 'Debe existir btn-acc-sub-chart');
  });
});
