const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

describe('Spec 016 — Eliminación de Opciones "Vaciar Base de Datos" y "Cargar datos de Prueba" (Ajustes y Respaldos)', () => {
  const indexPath = path.resolve(__dirname, '../index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  it('no debe contener el botón ni ID "btn-clear-database" ni "btn-load-demo-data" en index.html', () => {
    assert.equal(indexHtml.includes('id="btn-clear-database"'), false, 'No debe existir id="btn-clear-database" en index.html');
    assert.equal(indexHtml.includes('id="btn-load-demo-data"'), false, 'No debe existir id="btn-load-demo-data" en index.html');
  });

  it('no debe contener los textos "Vaciar Base de Datos" ni "Cargar Datos de Prueba" en el modal de Ajustes', () => {
    assert.equal(indexHtml.includes('Vaciar Base de Datos'), false, 'No debe existir texto "Vaciar Base de Datos"');
    assert.equal(indexHtml.includes('Cargar Datos de Prueba'), false, 'No debe existir texto "Cargar Datos de Prueba"');
  });

  it('debe conservar intacto el diálogo de Ajustes y Respaldos con sus opciones de exportar e importar JSON', () => {
    assert.ok(indexHtml.includes('id="dialog-settings"'), 'El modal #dialog-settings debe existir');
    assert.ok(indexHtml.includes('id="btn-open-settings"'), 'El botón para abrir ajustes debe existir');
    assert.ok(indexHtml.includes('id="btn-export-backup"'), 'El botón de descarga de respaldo JSON debe existir');
    assert.ok(indexHtml.includes('id="file-import-backup"'), 'El input para restaurar respaldo debe existir');
    assert.ok(indexHtml.includes('id="form-settings"'), 'El formulario de configuración empresarial debe existir');
  });

  it('debe conservar todos los campos de configuración de taller y selector de tema', () => {
    assert.ok(indexHtml.includes('id="settings-business-name"'), 'Campo nombre de empresa debe existir');
    assert.ok(indexHtml.includes('id="settings-rut"'), 'Campo RUT debe existir');
    assert.ok(indexHtml.includes('id="settings-phone"'), 'Campo teléfono debe existir');
    assert.ok(indexHtml.includes('id="settings-email"'), 'Campo email debe existir');
    assert.ok(indexHtml.includes('id="settings-address"'), 'Campo dirección debe existir');
    assert.ok(indexHtml.includes('id="settings-ticket-footer"'), 'Campo pie de ticket debe existir');
    assert.ok(indexHtml.includes('id="settings-theme"'), 'Campo de tema debe existir');
  });

  it('main.js no contiene referencias ni escuchadores a btn-clear-database ni btn-load-demo-data', () => {
    const mainJsPath = path.resolve(__dirname, '../assets/js/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');

    assert.equal(mainJs.includes('btn-clear-database'), false, 'main.js no debe contener btn-clear-database');
    assert.equal(mainJs.includes('btn-load-demo-data'), false, 'main.js no debe contener btn-load-demo-data');
  });
});
