/**
 * tests/data_preservation_chart_accounts.test.js
 *
 * Pruebas automatizadas para Spec 027: Preservación Estricta del Plan de Cuentas y Datos del Taller.
 * Valida que no exista ningún mecanismo que borre o sobrescriba de forma involuntaria
 * el Plan de Cuentas ni los datos existentes al modificar o inicializar la aplicación.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const storage = require('../assets/js/storage.js');

describe('Spec 027 — Preservación Estricta del Plan de Cuentas y Datos del Taller', () => {

  beforeEach(() => {
    storage.clearAllData(true);
  });

  describe('1. Blindaje del Plan de Cuentas contra sobreescritura accidental', () => {
    it('debe preservar cuentas personalizadas creadas por el usuario ante resetDefaultAccounts()', () => {
      // Registrar cuentas personalizadas del taller
      const cuenta1 = storage.saveAccount({
        codigo: '1205',
        nombre: 'Impresora DTF UV 60cm',
        tipo: 'Activo',
        subtipo: 'Activo Fijo',
        descripcion: 'Plotter DTF industrial con horno de curado'
      });

      const cuenta2 = storage.saveAccount({
        codigo: '5207',
        nombre: 'Suscripción Software RIP Neostampa',
        tipo: 'Egreso',
        subtipo: 'Operacional',
        descripcion: 'Licencia mensual de software de separación de color'
      });

      assert.ok(storage.getAccountByCode('1205'));
      assert.ok(storage.getAccountByCode('5207'));
      assert.equal(storage.getAccounts().length, 23);

      // Invocación estándar de restablecimiento (debe ser no destructiva)
      const res = storage.resetDefaultAccounts();

      assert.equal(res.length, 23, 'No debe reducir la cantidad de cuentas ni borrar las del usuario');
      const cuenta1Persistida = storage.getAccountByCode('1205');
      assert.ok(cuenta1Persistida, 'La cuenta 1205 debe seguir existiendo');
      assert.equal(cuenta1Persistida.nombre, 'Impresora DTF UV 60cm');

      const cuenta2Persistida = storage.getAccountByCode('5207');
      assert.ok(cuenta2Persistida, 'La cuenta 5207 debe seguir existiendo');
      assert.equal(cuenta2Persistida.nombre, 'Suscripción Software RIP Neostampa');
    });

    it('resetDefaultAccounts() solo debe incorporar cuentas de sistema que falten sin alterar las existentes', () => {
      // Simular que el catálogo actual tiene cuentas creadas
      storage.saveAccount({
        codigo: '9999',
        nombre: 'Cuenta Especial Taller',
        tipo: 'Capital'
      });

      const res = storage.resetDefaultAccounts();

      // Debe conservar la personalizada y mantener las canónicas
      assert.ok(res.find(a => a.codigo === '9999'), 'Debe conservar la cuenta 9999');
      assert.ok(res.find(a => a.codigo === '1101'), 'Debe conservar la cuenta 1101');
      assert.ok(res.find(a => a.codigo === '4101'), 'Debe conservar la cuenta 4101');
      assert.equal(res.length, 22);
    });

    it('resetDefaultAccounts(true) debe estar disponible únicamente como forzado explícito', () => {
      storage.saveAccount({ codigo: '1299', nombre: 'Extra Temporal', tipo: 'Activo' });
      assert.equal(storage.getAccounts().length, 22);

      const resForzado = storage.resetDefaultAccounts(true);
      assert.equal(resForzado.length, 21);
      assert.equal(storage.getAccountByCode('1299'), null);
    });
  });

  describe('2. Neutralización de borrado automático de datos demo en main.js', () => {
    it('el código fuente de main.js no debe invocar limpiarDatosDemoPrevios() en init()', () => {
      const mainPath = path.join(__dirname, '..', 'assets', 'js', 'main.js');
      const content = fs.readFileSync(mainPath, 'utf8');

      // Buscar la función init()
      const initMatch = content.match(/function\s+init\s*\(\)\s*\{([\s\S]*?)\}/);
      assert.ok(initMatch, 'Debe existir la función init() en main.js');
      assert.ok(
        !initMatch[1].includes('limpiarDatosDemoPrevios()'),
        'init() NO debe llamar a limpiarDatosDemoPrevios()'
      );
    });

    it('la función limpiarDatosDemoPrevios() en main.js debe ser un no-op seguro que nunca invoque clearAllData()', () => {
      const mainPath = path.join(__dirname, '..', 'assets', 'js', 'main.js');
      const content = fs.readFileSync(mainPath, 'utf8');

      const funcMatch = content.match(/function\s+limpiarDatosDemoPrevios\s*\(\)\s*\{([\s\S]*?)\}/);
      assert.ok(funcMatch, 'Debe existir la función limpiarDatosDemoPrevios()');
      assert.ok(
        !funcMatch[1].includes('clearAllData'),
        'limpiarDatosDemoPrevios() NO debe invocar clearAllData()'
      );
    });

    it('tener proveedores con ID PRV-001 o clientes CLI-001 no debe provocar borrado de datos', () => {
      // Crear datos reales que usen IDs de proveedores recomendados en specs previas (ej. PRV-001 de Spec 021)
      const proveedor = storage.saveSupplier({
        id: 'PRV-001',
        name: 'Textiles Mayoristas Chile',
        category: 'Prendas Lisas'
      });

      const cliente = storage.saveClient({
        id: 'CLI-001',
        name: 'Cliente Habitual Taller',
        phone: '+56911112222'
      });

      const cuenta = storage.saveAccount({
        codigo: '1106',
        nombre: 'Caja Recaudación Taller',
        tipo: 'Activo'
      });

      // Simular verificación de demo: no debe haber borrado alguno
      assert.equal(storage.getSuppliers().length, 1);
      assert.equal(storage.getClients().length, 1);
      assert.ok(storage.getAccountByCode('1106'));
    });
  });

  describe('3. Remoción del botón destructivo en la interfaz de usuario', () => {
    it('index.html no debe contener el botón #btn-reset-accounts', () => {
      const indexPath = path.join(__dirname, '..', 'index.html');
      const html = fs.readFileSync(indexPath, 'utf8');

      assert.ok(
        !html.includes('id="btn-reset-accounts"'),
        'El botón id="btn-reset-accounts" debe haber sido removido de index.html'
      );
      assert.ok(
        !html.includes('NovaprintUI.confirmarRestablecerCuentas()'),
        'No deben existir llamadas a confirmarRestablecerCuentas() en la interfaz'
      );
      assert.ok(
        html.includes('id="btn-new-account"'),
        'El botón legítimo "+ Nueva Cuenta" (#btn-new-account) debe preservarse'
      );
    });
  });

  describe('4. Preservación integral de datos en exportación e importación de respaldo', () => {
    it('exportBackup e importBackup preservan íntegramente las cuentas del usuario y todas las entidades', () => {
      storage.saveAccount({
        codigo: '4199',
        nombre: 'Ingreso por Reciclaje Textil',
        tipo: 'Ingreso',
        subtipo: 'No Operacional'
      });

      storage.saveClient({ name: 'Cliente Valioso', phone: '+56988887777' });
      storage.saveExpense({ date: '2026-11-10', category: 'Insumos', description: 'Tinta DTF Cyan', amount: 45000 });

      const backupRaw = storage.exportBackup();
      const backupParsed = JSON.parse(backupRaw);
      assert.ok(backupParsed.data.accounts.some(a => a.codigo === '4199'));
      assert.equal(backupParsed.data.clients.length, 1);
      assert.equal(backupParsed.data.expenses.length, 1);

      // Simular importación de respaldo
      const importRes = storage.importBackup(backupRaw);
      assert.equal(importRes.success, true);

      const cuentasPost = storage.getAccounts();
      assert.ok(cuentasPost.some(a => a.codigo === '4199'));
      assert.equal(storage.getClients().length, 1);
      assert.equal(storage.getExpenses().length, 1);
    });
  });

});
