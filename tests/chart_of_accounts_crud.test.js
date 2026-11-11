const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

describe('Spec 022 — Plan de Cuentas Contable y Operaciones CRUD', () => {
  let accounting;
  let storage;

  beforeEach(() => {
    // Reset module caches to ensure clean storage & state
    delete require.cache[require.resolve('../assets/js/accounting.js')];
    delete require.cache[require.resolve('../assets/js/storage.js')];
    delete require.cache[require.resolve('../assets/js/sales.js')];
    delete require.cache[require.resolve('../assets/js/production.js')];

    storage = require('../assets/js/storage.js');
    accounting = require('../assets/js/accounting.js');

    global.NovaprintStorage = storage;
    global.NovaprintAccounting = accounting;

    if (storage.clearAllData) {
      storage.clearAllData();
    }
  });

  describe('Definición y Validación de Cuentas (accounting.js)', () => {
    it('debe definir los 5 tipos canónicos de cuenta: Activo, Pasivo, Capital, Ingreso y Egreso', () => {
      const tipos = accounting.TIPOS_CUENTA;
      assert.ok(Array.isArray(tipos), 'TIPOS_CUENTA debe ser un arreglo');
      assert.deepEqual([...tipos], ['Activo', 'Pasivo', 'Capital', 'Ingreso', 'Egreso']);
    });

    it('debe normalizar variantes semánticas y alias al tipo canónico', () => {
      assert.equal(accounting.normalizarTipoCuenta('activo'), 'Activo');
      assert.equal(accounting.normalizarTipoCuenta('ACTIVOS CIRCULANTES'), 'Activo');
      assert.equal(accounting.normalizarTipoCuenta('pasivo'), 'Pasivo');
      assert.equal(accounting.normalizarTipoCuenta('patrimonio'), 'Capital');
      assert.equal(accounting.normalizarTipoCuenta('Capital Social'), 'Capital');
      assert.equal(accounting.normalizarTipoCuenta('ingresos operacionales'), 'Ingreso');
      assert.equal(accounting.normalizarTipoCuenta('costos de ventas'), 'Egreso');
      assert.equal(accounting.normalizarTipoCuenta('gastos generales'), 'Egreso');
      assert.equal(accounting.normalizarTipoCuenta('egreso'), 'Egreso');
      assert.equal(accounting.normalizarTipoCuenta('desconocido'), 'Activo');
    });

    it('debe proveer un catálogo predeterminado de 21 cuentas base del taller', () => {
      const defaults = accounting.PLAN_CUENTAS_DEFECTO;
      assert.equal(defaults.length, 21);

      const tiposPresentes = new Set(defaults.map(c => c.tipo));
      assert.ok(tiposPresentes.has('Activo'), 'Debe contener Activos');
      assert.ok(tiposPresentes.has('Pasivo'), 'Debe contener Pasivos');
      assert.ok(tiposPresentes.has('Capital'), 'Debe contener Capital');
      assert.ok(tiposPresentes.has('Ingreso'), 'Debe contener Ingresos');
      assert.ok(tiposPresentes.has('Egreso'), 'Debe contener Egresos');

      // Todas las cuentas del sistema deben tener esSistema: true y código único
      const codigos = new Set();
      defaults.forEach(c => {
        assert.ok(c.id, 'Debe tener ID');
        assert.ok(c.codigo, 'Debe tener código');
        assert.ok(c.nombre, 'Debe tener nombre');
        assert.equal(c.esSistema, true, 'Debe marcarse como cuenta de sistema');
        assert.ok(!codigos.has(c.codigo), `Código duplicado en catálogo por defecto: ${c.codigo}`);
        codigos.add(c.codigo);
      });
    });

    it('debe validar cuentas contables correctamente rechazando datos vacíos o códigos duplicados', () => {
      const valVacio = accounting.validarCuentaContable(null);
      assert.equal(valVacio.valido, false);

      const valSinCodigo = accounting.validarCuentaContable({ nombre: 'Prueba', tipo: 'Activo' });
      assert.equal(valSinCodigo.valido, false);
      assert.ok(valSinCodigo.errores.some(e => e.includes('código contable')));

      const valSinNombre = accounting.validarCuentaContable({ codigo: '9999', tipo: 'Activo' });
      assert.equal(valSinNombre.valido, false);
      assert.ok(valSinNombre.errores.some(e => e.includes('nombre')));

      const existentes = [{ id: 'ACC-1101', codigo: '1101', nombre: 'Caja' }];
      const valDuplicado = accounting.validarCuentaContable({ codigo: '1101', nombre: 'Otra Caja' }, existentes);
      assert.equal(valDuplicado.valido, false);
      assert.ok(valDuplicado.errores.some(e => e.includes('ya está registrado')));

      const valOk = accounting.validarCuentaContable({
        codigo: '1105',
        nombre: ' Banco Estado Cuenta Rut ',
        tipo: 'Activo',
        subtipo: 'Circulante',
        descripcion: 'Cuenta corriente taller'
      }, existentes);
      assert.equal(valOk.valido, true);
      assert.equal(valOk.cuentaNormalizada.nombre, 'Banco Estado Cuenta Rut');
      assert.equal(valOk.cuentaNormalizada.tipo, 'Activo');
    });
  });

  describe('Persistencia y Operaciones CRUD (storage.js)', () => {
    it('getAccounts debe auto-sembrar las 21 cuentas iniciales en novaprint_accounts si el storage está vacío', () => {
      const cuentas = storage.getAccounts();
      assert.equal(cuentas.length, 21);
      assert.ok(cuentas.some(c => c.codigo === '1101'));
      assert.ok(cuentas.some(c => c.codigo === '2101'));
      assert.ok(cuentas.some(c => c.codigo === '3101'));
      assert.ok(cuentas.some(c => c.codigo === '4101'));
      assert.ok(cuentas.some(c => c.codigo === '5101'));
    });

    it('getAccounts con filtroTipo debe retornar únicamente las cuentas del grupo solicitado', () => {
      const activos = storage.getAccounts('Activo');
      assert.ok(activos.length > 0);
      activos.forEach(c => assert.equal(c.tipo, 'Activo'));

      const pasivos = storage.getAccounts('Pasivo');
      assert.ok(pasivos.length > 0);
      pasivos.forEach(c => assert.equal(c.tipo, 'Pasivo'));

      const capital = storage.getAccounts('Capital');
      assert.ok(capital.length > 0);
      capital.forEach(c => assert.equal(c.tipo, 'Capital'));

      const ingresos = storage.getAccounts('Ingreso');
      assert.ok(ingresos.length > 0);
      ingresos.forEach(c => assert.equal(c.tipo, 'Ingreso'));

      const egresos = storage.getAccounts('Egreso');
      assert.ok(egresos.length > 0);
      egresos.forEach(c => assert.equal(c.tipo, 'Egreso'));
    });

    it('getAccountById y getAccountByCode deben localizar cuentas existentes o retornar null', () => {
      const cuentaPorId = storage.getAccountById('ACC-1101');
      assert.ok(cuentaPorId);
      assert.equal(cuentaPorId.codigo, '1101');

      const cuentaPorCod = storage.getAccountByCode('1102');
      assert.ok(cuentaPorCod);
      assert.equal(cuentaPorCod.nombre, 'Cuentas por Cobrar Clientes');

      assert.equal(storage.getAccountById('ACC-INEXISTENTE'), null);
      assert.equal(storage.getAccountByCode('999999'), null);
    });

    it('saveAccount debe permitir crear una nueva cuenta contable personalizada', () => {
      const nueva = {
        codigo: '1105',
        nombre: 'Caja Chica Sucursal Centro',
        tipo: 'Activo',
        subtipo: 'Circulante',
        descripcion: 'Caja física menor en local comercial'
      };

      const guardada = storage.saveAccount(nueva);
      assert.ok(guardada.id);
      assert.equal(guardada.codigo, '1105');
      assert.equal(guardada.nombre, 'Caja Chica Sucursal Centro');
      assert.equal(guardada.tipo, 'Activo');
      assert.equal(guardada.esSistema, false, 'Las cuentas creadas por el usuario no son de sistema');

      const buscada = storage.getAccountByCode('1105');
      assert.ok(buscada);
      assert.equal(buscada.id, guardada.id);

      const todas = storage.getAccounts();
      assert.equal(todas.length, 22);
    });

    it('saveAccount debe permitir editar una cuenta existente actualizando sus campos', () => {
      const cuenta = storage.saveAccount({
        codigo: '5210',
        nombre: 'Servicio de Internet y Telefonía',
        tipo: 'Egreso',
        subtipo: 'Operacional',
        descripcion: 'Fibra óptica taller'
      });

      const editada = storage.saveAccount({
        id: cuenta.id,
        codigo: '5210',
        nombre: 'Internet Fibra Óptica Alta Velocidad',
        tipo: 'Egreso',
        subtipo: 'Servicios',
        descripcion: 'Plan 1Gbps simétrico para descargas DTF'
      });

      assert.equal(editada.id, cuenta.id);
      assert.equal(editada.nombre, 'Internet Fibra Óptica Alta Velocidad');
      assert.equal(editada.subtipo, 'Servicios');
      assert.equal(editada.descripcion, 'Plan 1Gbps simétrico para descargas DTF');

      const persistida = storage.getAccountById(cuenta.id);
      assert.equal(persistida.nombre, 'Internet Fibra Óptica Alta Velocidad');
    });

    it('saveAccount debe rechazar códigos duplicados', () => {
      assert.throws(() => {
        storage.saveAccount({
          codigo: '1101', // Ya existe en PLAN_CUENTAS_DEFECTO
          nombre: 'Cuenta Banco Duplicada',
          tipo: 'Activo'
        });
      }, /El código contable.*ya está/i);
    });

    it('deleteAccount debe proteger y rechazar la eliminación de cuentas base del sistema', () => {
      const res = storage.deleteAccount('ACC-1101');
      assert.equal(res.success, false);
      assert.ok(res.error.includes('cuenta base del sistema'));

      // Verificar que la cuenta sigue existiendo intacta
      const cuenta = storage.getAccountById('ACC-1101');
      assert.ok(cuenta);
    });

    it('deleteAccount debe eliminar satisfactoriamente cuentas personalizadas de usuario', () => {
      const custom = storage.saveAccount({
        codigo: '5299',
        nombre: 'Gasto Eventual Prototipos',
        tipo: 'Egreso',
        subtipo: 'Operacional'
      });

      assert.equal(storage.getAccounts().length, 22);

      const res = storage.deleteAccount(custom.id);
      assert.equal(res.success, true);
      assert.equal(storage.getAccounts().length, 21);
      assert.equal(storage.getAccountById(custom.id), null);
    });

    it('resetDefaultAccounts debe preservar cuentas existentes por defecto y solo restablecer si se fuerza', () => {
      // Agregar 2 cuentas adicionales
      storage.saveAccount({ codigo: '1191', nombre: 'Extra 1', tipo: 'Activo' });
      storage.saveAccount({ codigo: '1192', nombre: 'Extra 2', tipo: 'Activo' });
      assert.equal(storage.getAccounts().length, 23);

      // Spec 027: Llamada estándar no destructiva preserva cuentas de usuario
      const resNoDestructivo = storage.resetDefaultAccounts();
      assert.equal(resNoDestructivo.length, 23);
      assert.ok(storage.getAccountByCode('1191'), 'Cuenta personalizada 1191 debe preservarse');
      assert.ok(storage.getAccountByCode('1192'), 'Cuenta personalizada 1192 debe preservarse');

      // Restablecimiento forzado explícito (ej. para pruebas o reinicialización hard)
      const resetRes = storage.resetDefaultAccounts(true);
      assert.equal(resetRes.length, 21);
      assert.equal(storage.getAccounts().length, 21);
      assert.equal(storage.getAccountByCode('1191'), null);
      assert.equal(storage.getAccountByCode('1192'), null);
    });

    it('exportBackup e importBackup deben preservar el plan de cuentas', () => {
      storage.saveAccount({
        codigo: '1188',
        nombre: 'Cuenta Especial Inversiones',
        tipo: 'Activo'
      });

      const backupJson = storage.exportBackup();
      const parsed = JSON.parse(backupJson);
      assert.ok(parsed.data.accounts, 'El backup debe incluir accounts');
      assert.ok(parsed.data.accounts.some(a => a.codigo === '1188'));

      // Limpiar datos
      storage.clearAllData();
      assert.equal(storage.getAccountByCode('1188'), null);

      // Restaurar backup
      const importRes = storage.importBackup(backupJson);
      assert.equal(importRes.success, true);
      const restaurada = storage.getAccountByCode('1188');
      assert.ok(restaurada);
      assert.equal(restaurada.nombre, 'Cuenta Especial Inversiones');
    });
  });
});
