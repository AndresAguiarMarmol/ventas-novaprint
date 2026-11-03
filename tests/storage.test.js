const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../assets/js/storage.js');

describe('Capa de Persistencia Local (storage.js)', () => {

  beforeEach(() => {
    storage.clearAll();
  });

  describe('Gestión de Clientes', () => {
    it('guarda y recupera clientes correctamente', () => {
      const cliente = {
        name: 'Andrés Eloy',
        phone: '+56912345678',
        email: 'andres@ejemplo.com',
        rut: '12.345.678-9'
      };
      const guardado = storage.saveClient(cliente);
      assert.ok(guardado.id);
      assert.equal(guardado.name, 'Andrés Eloy');

      const lista = storage.getClients();
      assert.equal(lista.length, 1);
      assert.equal(lista[0].id, guardado.id);
    });

    it('actualiza un cliente existente si se provee ID', () => {
      const c1 = storage.saveClient({ name: 'Carlos', phone: '+569000' });
      const c1Actualizado = storage.saveClient({ id: c1.id, name: 'Carlos Actualizado', phone: '+569999' });
      assert.equal(c1Actualizado.name, 'Carlos Actualizado');

      const lista = storage.getClients();
      assert.equal(lista.length, 1);
      assert.equal(lista[0].name, 'Carlos Actualizado');
    });

    it('elimina un cliente por ID', () => {
      const c1 = storage.saveClient({ name: 'Eliminar Me', phone: '+569111' });
      assert.equal(storage.getClients().length, 1);

      const res = storage.deleteClient(c1.id);
      assert.equal(res, true);
      assert.equal(storage.getClients().length, 0);
    });
  });

  describe('Gestión de Pedidos', () => {
    it('guarda y recupera pedidos con items y totales calculados', () => {
      const pedido = {
        clientName: 'Colegio San José',
        clientPhone: '+569555',
        dates: { deliveryDate: '2026-11-10' },
        items: [
          { garmentType: 'Polerón', color: 'Azul Marino', size: 'L', technique: 'Bordado', quantity: 20, unitPrice: 15000, subtotal: 300000 }
        ],
        totals: { totalQuantity: 20, totalAmount: 300000, depositAmount: 150000, balanceAmount: 150000, paymentStatus: 'Abonado' },
        status: 'Confirmado'
      };

      const guardado = storage.saveOrder(pedido);
      assert.ok(guardado.id.startsWith('NP-'));
      assert.equal(guardado.clientName, 'Colegio San José');

      const pedidos = storage.getOrders();
      assert.equal(pedidos.length, 1);
      assert.equal(pedidos[0].id, guardado.id);
    });

    it('permite actualizar el estado de un pedido', () => {
      const p = storage.saveOrder({ clientName: 'Prueba', status: 'Confirmado' });
      const actualizado = storage.updateOrderStatus(p.id, 'En producción');
      assert.equal(actualizado.status, 'En producción');
      assert.equal(storage.getOrderById(p.id).status, 'En producción');
    });

    it('elimina un pedido por ID', () => {
      const p = storage.saveOrder({ clientName: 'Borrar', status: 'Cotización' });
      assert.equal(storage.getOrders().length, 1);
      storage.deleteOrder(p.id);
      assert.equal(storage.getOrders().length, 0);
    });
  });

  describe('Gestión de Proveedores e Inventario', () => {
    it('guarda y elimina proveedores', () => {
      const prv = storage.saveSupplier({ name: 'Textiles Sur', category: 'Prendas Lisas', phone: '+56900' });
      assert.ok(prv.id);
      assert.equal(storage.getSuppliers().length, 1);
      storage.deleteSupplier(prv.id);
      assert.equal(storage.getSuppliers().length, 0);
    });

    it('guarda y actualiza artículos de inventario con colores estándar o personalizados', () => {
      const itemEstandar = storage.saveInventoryItem({
        name: 'Polera Algodón Azul Marino L',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Azul Marino',
        size: 'L',
        currentStock: 10,
        minStock: 5,
        unitCost: 3000
      });
      assert.ok(itemEstandar.id);
      assert.equal(itemEstandar.color, 'Azul Marino');

      const itemPersonalizado = storage.saveInventoryItem({
        name: 'Polera Algodón Turquesa Neón XL',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Turquesa Neón',
        size: 'XL',
        currentStock: 8,
        minStock: 4,
        unitCost: 3200
      });
      assert.ok(itemPersonalizado.id);
      assert.equal(itemPersonalizado.color, 'Turquesa Neón');

      storage.saveInventoryItem({ id: itemEstandar.id, currentStock: 25 });
      const recuperado = storage.getInventoryItemById(itemEstandar.id);
      assert.equal(recuperado.currentStock, 25);
      assert.equal(recuperado.color, 'Azul Marino');
    });

    it('guardar una compra incrementa automáticamente el stock del inventario', () => {
      const item = storage.saveInventoryItem({
        name: 'Polerón Negro M',
        category: 'Prendas Lisas',
        currentStock: 5,
        minStock: 10,
        unitCost: 10000
      });

      storage.savePurchase({
        supplierName: 'Distribuidora',
        items: [
          { inventoryItemId: item.id, quantity: 15, unitCost: 9500 }
        ],
        subtotalNeto: 142500,
        applyIva: true,
        ivaPercent: 19,
        ivaAmount: 27075,
        applyDelivery: true,
        deliveryAmount: 4500,
        totalAmount: 174075
      });

      const comprasGuardadas = storage.getPurchases();
      assert.equal(comprasGuardadas.length, 1);
      assert.equal(comprasGuardadas[0].applyIva, true);
      assert.equal(comprasGuardadas[0].ivaAmount, 27075);
      assert.equal(comprasGuardadas[0].applyDelivery, true);
      assert.equal(comprasGuardadas[0].deliveryAmount, 4500);
      assert.equal(comprasGuardadas[0].totalAmount, 174075);

      const inventarioActualizado = storage.getInventory();
      const itemEncontrado = inventarioActualizado.find(i => i.id === item.id);
      assert.equal(itemEncontrado.currentStock, 20); // 5 + 15
      assert.equal(itemEncontrado.unitCost, 9500);
    });

    it('descontarStockPorPedido disminuye las existencias físicas en inventario', () => {
      const item = storage.saveInventoryItem({
        name: 'Polera Algodón Negro L',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'L',
        currentStock: 30,
        unitCost: 2800
      });

      const resultado = storage.descontarStockPorPedido([
        { garmentType: 'Polera', color: 'Negro', size: 'L', quantity: 12 }
      ]);

      assert.equal(resultado.descontados.length, 1);
      const itemActualizado = storage.getInventoryItemById(item.id);
      assert.equal(itemActualizado.currentStock, 18); // 30 - 12
    });

    it('Spec 008: asegurarItemInventarioPrenda retorna ítem existente o crea uno nuevo con stock 0', () => {
      // 1. Crear nuevo ítem que no existía
      const nuevo = storage.asegurarItemInventarioPrenda('Polera', 'Azul Marino', '10');
      assert.ok(nuevo.id);
      assert.equal(nuevo.garmentType, 'Polera');
      assert.equal(nuevo.color, 'Azul Marino');
      assert.equal(nuevo.size, '10');
      assert.equal(nuevo.currentStock, 0);
      assert.equal(nuevo.minStock, 5);
      assert.equal(nuevo.unitCost, 2800);
      assert.ok(nuevo.code.includes('POL'));

      // Verificar que está en inventario
      const inventario = storage.getInventory();
      assert.ok(inventario.some(i => i.id === nuevo.id));

      // 2. Si se vuelve a solicitar la misma prenda-color-talla, retorna el existente sin duplicar
      const existente = storage.asegurarItemInventarioPrenda('polera', 'azul marino', '10');
      assert.equal(existente.id, nuevo.id);
      assert.equal(storage.getInventory().filter(i => i.size === '10').length, 1);
    });
  });

  describe('Gestión de Fabricación en Taller (Spec 003)', () => {
    it('guarda, actualiza etapa y elimina órdenes de fabricación', () => {
      const prj = storage.saveProject({
        name: 'Lote Poleras DTF',
        stage: 'Diseño',
        quantity: 20
      });
      assert.ok(prj.id);
      assert.equal(storage.getProjects().length, 1);

      const actualizado = storage.updateProjectStage(prj.id, 'Preparación');
      assert.equal(actualizado.stage, 'Preparación');
      assert.equal(storage.getProjectById(prj.id).stage, 'Preparación');

      storage.deleteProject(prj.id);
      assert.equal(storage.getProjects().length, 0);
    });
  });

  describe('Configuración, Respaldo y Restauración JSON', () => {
    it('obtiene valores por defecto si no hay configuración', () => {
      const config = storage.getSettings();
      assert.ok(config.businessName);
      assert.equal(config.currencySymbol, '$');
    });

    it('exporta e importa una copia de respaldo completa en JSON', () => {
      storage.saveClient({ name: 'Cliente Backup', phone: '+569111222' });
      storage.saveOrder({ clientName: 'Cliente Backup', status: 'En producción' });

      const backupJson = storage.exportBackup();
      assert.ok(typeof backupJson === 'string');

      storage.clearAll();
      assert.equal(storage.getClients().length, 0);
      assert.equal(storage.getOrders().length, 0);

      const restoreResult = storage.importBackup(backupJson);
      assert.equal(restoreResult.success, true);
      assert.equal(storage.getClients().length, 1);
      assert.equal(storage.getOrders().length, 1);
    });

    it('inicializa datos demo si el almacenamiento está vacío solo con force=true', () => {
      storage.clearAllData(true);
      storage.initDemoData(false);
      assert.equal(storage.getClients().length, 0);
      assert.equal(storage.getOrders().length, 0);

      storage.initDemoData(true);
      assert.ok(storage.getClients().length >= 3);
      assert.ok(storage.getOrders().length >= 3);
      assert.ok(storage.getSuppliers().length >= 3);
      assert.ok(storage.getInventory().length >= 5);
    });

    it('clearAllData vacía todas las entidades preservando la configuración del taller', () => {
      storage.initDemoData(true);
      storage.saveSettings({ businessName: 'Novaprint Test Custom' });

      storage.clearAllData(true);
      assert.equal(storage.getClients().length, 0);
      assert.equal(storage.getOrders().length, 0);
      assert.equal(storage.getSuppliers().length, 0);
      assert.equal(storage.getInventory().length, 0);
      assert.equal(storage.getPurchases().length, 0);
      assert.equal(storage.getProjects().length, 0);
      assert.equal(storage.getSettings().businessName, 'Novaprint Test Custom');
    });
  });

});

