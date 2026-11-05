/**
 * assets/js/storage.js — Capa de Almacenamiento y Persistencia para Novaprint
 * Gestiona localStorage con fallback a memoria, esquemas, respaldo/restauración JSON y seed data.
 */

(function (global) {
  'use strict';

  const STORAGE_KEYS = {
    SETTINGS: 'novaprint_settings',
    CLIENTS: 'novaprint_clients',
    ORDERS: 'novaprint_orders',
    SUPPLIERS: 'novaprint_suppliers',
    INVENTORY: 'novaprint_inventory',
    PURCHASES: 'novaprint_purchases',
    PROJECTS: 'novaprint_projects'
  };

  const DEFAULT_SETTINGS = {
    businessName: 'Novaprint Estampados',
    rut: '76.890.123-4',
    phone: '+56987654321',
    email: 'contacto@novaprint.cl',
    address: 'Av. Salvador 450, Providencia, Santiago',
    currencySymbol: '$',
    ticketFooter: '¡Gracias por confiar en Novaprint! Plazo de reclamo: 48 hrs con comprobante.',
    theme: 'system'
  };

  const memoryStore = {};

  function isLocalStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__novaprint_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  const hasLocalStorage = isLocalStorageAvailable();

  function getItem(key) {
    if (hasLocalStorage) {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error(`Error leyendo clave ${key} de localStorage:`, e);
        return null;
      }
    }
    return memoryStore[key] ? JSON.parse(JSON.stringify(memoryStore[key])) : null;
  }

  function setItem(key, value) {
    if (hasLocalStorage) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error(`Error guardando clave ${key} en localStorage:`, e);
        return false;
      }
    }
    memoryStore[key] = JSON.parse(JSON.stringify(value));
    return true;
  }

  function clearAll() {
    if (hasLocalStorage) {
      Object.values(STORAGE_KEYS).forEach(k => window.localStorage.removeItem(k));
    }
    Object.keys(memoryStore).forEach(k => delete memoryStore[k]);
  }

  function clearAllData(preserveSettings = true) {
    const currentSettings = preserveSettings ? getSettings() : null;
    clearAll();
    if (preserveSettings && currentSettings) {
      saveSettings(currentSettings);
    }
    setItem(STORAGE_KEYS.CLIENTS, []);
    setItem(STORAGE_KEYS.ORDERS, []);
    setItem(STORAGE_KEYS.SUPPLIERS, []);
    setItem(STORAGE_KEYS.INVENTORY, []);
    setItem(STORAGE_KEYS.PURCHASES, []);
    setItem(STORAGE_KEYS.PROJECTS, []);
    return true;
  }

  // --- CONFIGURACIÓN ---
  function getSettings() {
    const saved = getItem(STORAGE_KEYS.SETTINGS);
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
  }

  function saveSettings(newSettings) {
    const current = getSettings();
    const updated = { ...current, ...newSettings };
    setItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- CLIENTES ---
  function getClients() {
    const clients = getItem(STORAGE_KEYS.CLIENTS);
    return Array.isArray(clients) ? clients : [];
  }

  function getClientById(id) {
    return getClients().find(c => c.id === id) || null;
  }

  function saveClient(clientData) {
    const clients = getClients();
    let clientToSave;

    if (clientData.id) {
      const idx = clients.findIndex(c => c.id === clientData.id);
      if (idx !== -1) {
        clientToSave = {
          ...clients[idx],
          ...clientData,
          updatedAt: new Date().toISOString()
        };
        clients[idx] = clientToSave;
      } else {
        clientToSave = {
          ...clientData,
          createdAt: clientData.createdAt || new Date().toISOString()
        };
        clients.push(clientToSave);
      }
    } else {
      const id = `CLI-${Date.now().toString(36).toUpperCase()}`;
      clientToSave = {
        id,
        name: clientData.name || '',
        phone: clientData.phone || '',
        email: clientData.email || '',
        rut: clientData.rut || '',
        address: clientData.address || '',
        notes: clientData.notes || '',
        createdAt: new Date().toISOString()
      };
      clients.push(clientToSave);
    }

    setItem(STORAGE_KEYS.CLIENTS, clients);
    return clientToSave;
  }

  function deleteClient(id) {
    const clients = getClients();
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length !== clients.length) {
      setItem(STORAGE_KEYS.CLIENTS, filtered);
      return true;
    }
    return false;
  }

  // --- PEDIDOS ---
  function getOrders() {
    const orders = getItem(STORAGE_KEYS.ORDERS);
    return Array.isArray(orders) ? orders : [];
  }

  function getOrderById(id) {
    return getOrders().find(o => o.id === id) || null;
  }

  function saveOrder(orderData) {
    const orders = getOrders();
    let orderToSave;

    if (orderData.id) {
      const idx = orders.findIndex(o => o.id === orderData.id);
      if (idx !== -1) {
        orderToSave = {
          ...orders[idx],
          ...orderData,
          updatedAt: new Date().toISOString()
        };
        orders[idx] = orderToSave;
      } else {
        orderToSave = {
          ...orderData,
          createdAt: orderData.createdAt || new Date().toISOString()
        };
        orders.push(orderToSave);
      }
    } else {
      const now = new Date();
      const año = now.getFullYear();
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const dia = String(now.getDate()).padStart(2, '0');
      const prefijo = `NP-${año}${mes}${dia}`;
      
      const correlativosHoy = orders
        .filter(o => o.id && o.id.startsWith(prefijo))
        .map(o => {
          const parts = o.id.split('-');
          return parts.length >= 3 ? parseInt(parts[2], 10) : 0;
        })
        .filter(n => !isNaN(n));

      const siguienteNumero = (correlativosHoy.length > 0 ? Math.max(...correlativosHoy) : 0) + 1;
      const nuevoId = `${prefijo}-${String(siguienteNumero).padStart(3, '0')}`;

      orderToSave = {
        id: nuevoId,
        clientId: orderData.clientId || null,
        clientName: orderData.clientName || 'Cliente General',
        clientPhone: orderData.clientPhone || '',
        dates: {
          createdAt: new Date().toISOString(),
          deliveryDate: orderData.dates?.deliveryDate || new Date().toISOString().split('T')[0],
          deliveredAt: null
        },
        items: Array.isArray(orderData.items) ? orderData.items : [],
        totals: orderData.totals || {
          totalQuantity: 0,
          totalAmount: 0,
          depositAmount: 0,
          balanceAmount: 0,
          paymentStatus: 'Pendiente'
        },
        status: orderData.status || 'Cotización',
        notes: orderData.notes || ''
      };
      orders.unshift(orderToSave);
    }

    setItem(STORAGE_KEYS.ORDERS, orders);
    return orderToSave;
  }

  function updateOrderStatus(id, newStatus) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      orders[idx].updatedAt = new Date().toISOString();
      if (newStatus === 'Entregado') {
        if (!orders[idx].dates) orders[idx].dates = {};
        orders[idx].dates.deliveredAt = new Date().toISOString();
      }
      setItem(STORAGE_KEYS.ORDERS, orders);
      return orders[idx];
    }
    return null;
  }

  function deleteOrder(id) {
    const orders = getOrders();
    const filtered = orders.filter(o => o.id !== id);
    if (filtered.length !== orders.length) {
      setItem(STORAGE_KEYS.ORDERS, filtered);
      return true;
    }
    return false;
  }

  // --- PROVEEDORES ---
  function getSuppliers() {
    const items = getItem(STORAGE_KEYS.SUPPLIERS);
    return Array.isArray(items) ? items : [];
  }

  function getSupplierById(id) {
    return getSuppliers().find(s => s.id === id) || null;
  }

  function saveSupplier(item) {
    const items = getSuppliers();
    const id = item.id || `PRV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const toSave = { ...item, id };
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      toSave.updatedAt = new Date().toISOString();
      items[idx] = toSave;
    } else {
      toSave.createdAt = new Date().toISOString();
      items.push(toSave);
    }
    setItem(STORAGE_KEYS.SUPPLIERS, items);
    return toSave;
  }

  function deleteSupplier(id) {
    const items = getSuppliers();
    const filtered = items.filter(s => s.id !== id);
    if (filtered.length !== items.length) {
      setItem(STORAGE_KEYS.SUPPLIERS, filtered);
      return true;
    }
    return false;
  }

  // --- INVENTARIO ---
  function getInventory() {
    const items = getItem(STORAGE_KEYS.INVENTORY);
    return Array.isArray(items) ? items : [];
  }

  function getInventoryItemById(id) {
    return getInventory().find(i => i.id === id) || null;
  }

  function saveInventoryItem(item) {
    const items = getInventory();
    const id = item.id || `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const toSave = { ...item, id };
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      toSave.updatedAt = new Date().toISOString();
      items[idx] = { ...items[idx], ...toSave };
    } else {
      toSave.createdAt = new Date().toISOString();
      items.push(toSave);
    }
    setItem(STORAGE_KEYS.INVENTORY, items);
    return toSave;
  }

  function deleteInventoryItem(id) {
    const items = getInventory();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length !== items.length) {
      setItem(STORAGE_KEYS.INVENTORY, filtered);
      return true;
    }
    return false;
  }

  function generarCodigoPrenda(garmentType, color, size) {
    const clean = (str, len) => String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substr(0, len);

    const g = clean(garmentType, 3) || 'PRE';
    const c = clean(color, 3) || 'COL';
    const s = clean(size, 4) || 'U';
    return `${g}-${c}-${s}`;
  }

  /**
   * Spec 008 — Busca un artículo de inventario por terna Prenda-Color-Talla.
   * Si no existe en el catálogo, lo crea automáticamente con stock 0 y atributos estándar.
   */
  function asegurarItemInventarioPrenda(garmentType, color, size, datosExtra = {}) {
    const normalizar = (texto) => String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    const pB = normalizar(garmentType);
    const cB = normalizar(color);
    const tB = normalizar(size);

    const items = getInventory();
    const encontrado = items.find(inv => {
      const matchPrenda = normalizar(inv.garmentType) === pB || normalizar(inv.name).includes(pB);
      const matchColor = normalizar(inv.color) === cB || normalizar(inv.name).includes(cB);
      const matchTalla = normalizar(inv.size) === tB || normalizar(inv.name).includes(tB);
      return matchPrenda && matchColor && matchTalla;
    });

    if (encontrado) {
      return encontrado;
    }

    // Costo sugerido según prenda base
    let unitCost = 2800;
    if (pB.includes('poleron')) unitCost = 11000;
    else if (pB.includes('buzo')) unitCost = 12000;
    else if (pB.includes('gorra')) unitCost = 3500;
    else if (pB.includes('polera')) unitCost = 2800;

    const esGorra = pB.includes('gorra');
    const category = esGorra ? 'Gorras en Blanco' : 'Prendas Lisas';
    const code = generarCodigoPrenda(garmentType, color, size);

    const nuevoItem = {
      code,
      name: `${garmentType || 'Prenda'} Lisa - ${color || 'Estándar'} Talla ${size || 'L'}`,
      category,
      garmentType: garmentType || 'Polera',
      color: color || 'Negro',
      size: size || 'L',
      unit: 'unidad',
      currentStock: 0,
      minStock: 5,
      unitCost: Number(datosExtra.unitCost) > 0 ? Number(datosExtra.unitCost) : unitCost,
      supplierId: datosExtra.supplierId || '',
      supplierName: datosExtra.supplierName || ''
    };

    if (!nuevoItem.supplierId) {
      const proveedores = getSuppliers();
      const prov = proveedores.find(p => p.category === category) || proveedores[0];
      if (prov) {
        nuevoItem.supplierId = prov.id;
        nuevoItem.supplierName = prov.name;
      }
    }

    return saveInventoryItem(nuevoItem);
  }

  // --- COMPRAS DE INSUMOS ---
  function getPurchases() {
    const items = getItem(STORAGE_KEYS.PURCHASES);
    return Array.isArray(items) ? items : [];
  }

  function savePurchase(purchaseData) {
    const purchases = getPurchases();
    const id = purchaseData.id || `CMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const subtotalNeto = Number(purchaseData.subtotalNeto) >= 0
      ? Number(purchaseData.subtotalNeto)
      : (Number(purchaseData.totalAmount) || 0);
    const applyIva = Boolean(purchaseData.applyIva);
    const ivaPercent = applyIva ? 19 : 0;
    const ivaAmount = Number(purchaseData.ivaAmount) || 0;
    const applyDelivery = Boolean(purchaseData.applyDelivery);
    const deliveryAmount = Number(purchaseData.deliveryAmount) || 0;
    const totalAmount = Number(purchaseData.totalAmount) || (subtotalNeto + ivaAmount + deliveryAmount);

    const purchaseToSave = {
      ...purchaseData,
      id,
      subtotalNeto,
      applyIva,
      ivaPercent,
      ivaAmount,
      applyDelivery,
      deliveryAmount,
      totalAmount,
      date: purchaseData.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    purchases.unshift(purchaseToSave);
    setItem(STORAGE_KEYS.PURCHASES, purchases);

    // Incrementar existencias automáticamente en el inventario
    if (Array.isArray(purchaseData.items) && purchaseData.items.length > 0) {
      const inventory = getInventory();
      const updatedInventory = inventory.map(invItem => {
        const comprado = purchaseData.items.find(pi => pi.inventoryItemId === invItem.id);
        if (comprado) {
          const addQty = Math.max(0, Number(comprado.quantity) || 0);
          const newCost = Number(comprado.unitCost) > 0 ? Number(comprado.unitCost) : invItem.unitCost;
          return {
            ...invItem,
            currentStock: (Number(invItem.currentStock) || 0) + addQty,
            unitCost: newCost,
            updatedAt: new Date().toISOString()
          };
        }
        return invItem;
      });
      setItem(STORAGE_KEYS.INVENTORY, updatedInventory);
    }

    return purchaseToSave;
  }

  // --- DESCUENTO DE STOCK POR PEDIDO (Spec 004) ---
  function descontarStockPorPedido(itemsPedido = []) {
    const prod = global.NovaprintProduction || (typeof require !== 'undefined' ? require('./production.js') : null);
    if (!prod || typeof prod.descontarInventarioPorPedido !== 'function') {
      return { descontados: [], noEncontrados: itemsPedido, nuevoInventario: getInventory() };
    }
    const inventarioActual = getInventory();
    const resultado = prod.descontarInventarioPorPedido(inventarioActual, itemsPedido);
    setItem(STORAGE_KEYS.INVENTORY, resultado.nuevoInventario);
    return resultado;
  }

  // --- PROYECTOS / FABRICACIÓN (Spec 003) ---
  function getProjects() {
    const items = getItem(STORAGE_KEYS.PROJECTS);
    return Array.isArray(items) ? items : [];
  }

  function getProjectById(id) {
    return getProjects().find(p => p.id === id) || null;
  }

  function saveProject(item) {
    const items = getProjects();
    const id = item.id || `PRJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const toSave = { ...item, id };
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      toSave.updatedAt = new Date().toISOString();
      items[idx] = toSave;
    } else {
      toSave.createdAt = new Date().toISOString();
      items.push(toSave);
    }
    setItem(STORAGE_KEYS.PROJECTS, items);
    return toSave;
  }

  function updateProjectStage(id, newStage) {
    const items = getProjects();
    const idx = items.findIndex(p => p.id === id);
    if (idx !== -1) {
      items[idx].stage = newStage;
      items[idx].updatedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.PROJECTS, items);
      return items[idx];
    }
    return null;
  }

  function deleteProject(id) {
    const items = getProjects();
    const filtered = items.filter(p => p.id !== id);
    if (filtered.length !== items.length) {
      setItem(STORAGE_KEYS.PROJECTS, filtered);
      return true;
    }
    return false;
  }

  // --- RESPALDO Y RESTAURACIÓN JSON ---
  function exportBackup() {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Novaprint App',
      data: {
        settings: getSettings(),
        clients: getClients(),
        orders: getOrders(),
        suppliers: getSuppliers(),
        inventory: getInventory(),
        purchases: getPurchases(),
        projects: getProjects()
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  function importBackup(jsonString) {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!parsed || !parsed.data) {
        return { success: false, error: 'Formato de respaldo inválido' };
      }
      const data = parsed.data;
      if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
      if (Array.isArray(data.clients)) setItem(STORAGE_KEYS.CLIENTS, data.clients);
      if (Array.isArray(data.orders)) setItem(STORAGE_KEYS.ORDERS, data.orders);
      if (Array.isArray(data.suppliers)) setItem(STORAGE_KEYS.SUPPLIERS, data.suppliers);
      if (Array.isArray(data.inventory)) setItem(STORAGE_KEYS.INVENTORY, data.inventory);
      if (Array.isArray(data.purchases)) setItem(STORAGE_KEYS.PURCHASES, data.purchases);
      if (Array.isArray(data.projects)) setItem(STORAGE_KEYS.PROJECTS, data.projects);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // --- SEED DATA DEMOSTRATIVO ---
  function initDemoData(force = false) {
    if (!force) {
      return; // No sembrar datos automáticamente; el usuario registrará sus propios datos
    }

    // Proveedores de muestra
    const demoSuppliers = [
      {
        id: 'PRV-001',
        name: 'Textiles Mayoristas Chile',
        contact: 'Marcos Rivera',
        phone: '+56911223344',
        email: 'ventas@textileschile.cl',
        category: 'Prendas Lisas',
        address: 'Av. Recoleta 890, Santiago',
        notes: 'Distribuidor principal de poleras 100% algodón 160g y polerones franela.'
      },
      {
        id: 'PRV-002',
        name: 'Insumos Gráficos DTF Sur',
        contact: 'Camila Rojas',
        phone: '+56922334455',
        email: 'contacto@dtfsur.cl',
        category: 'Insumos DTF',
        address: 'Calle San Diego 1420, Santiago',
        notes: 'Bobinas de film DTF hot/cold peel y poliamida de alta adherencia.'
      },
      {
        id: 'PRV-003',
        name: 'Gorras & Jockeys Premium',
        contact: 'Ignacio Silva',
        phone: '+56933445566',
        email: 'ventas@gorraspremium.cl',
        category: 'Gorras en Blanco',
        address: 'Patronato 435, Recoleta',
        notes: 'Gorras trucker de 5 paneles y jockeys clásicos con cierre ajustable.'
      },
      {
        id: 'PRV-004',
        name: 'Vinilos & Tintas Santiago',
        contact: 'Valeria Castro',
        phone: '+56944556677',
        email: 'pedidos@vinilosantiago.cl',
        category: 'Vinilo Textil',
        address: 'Av. Matta 760, Santiago',
        notes: 'Vinilos textiles de corte PU, reflectivos y metálicos.'
      }
    ];

    // Artículos de inventario de muestra
    const demoInventory = [
      {
        id: 'INV-001',
        code: 'POL-AL-NEG-M',
        name: 'Polera 100% Algodón 160g - Negro M',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'M',
        unit: 'unidad',
        currentStock: 45,
        minStock: 20,
        unitCost: 2800,
        supplierId: 'PRV-001',
        supplierName: 'Textiles Mayoristas Chile'
      },
      {
        id: 'INV-002',
        code: 'POL-AL-NEG-L',
        name: 'Polera 100% Algodón 160g - Negro L',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'L',
        unit: 'unidad',
        currentStock: 12, // Estado crítico (< 25)
        minStock: 25,
        unitCost: 2800,
        supplierId: 'PRV-001',
        supplierName: 'Textiles Mayoristas Chile'
      },
      {
        id: 'INV-003',
        code: 'POL-FRAN-AZ-L',
        name: 'Polerón Canguro Franela - Azul Marino L',
        category: 'Prendas Lisas',
        garmentType: 'Polerón',
        color: 'Azul Marino',
        size: 'L',
        unit: 'unidad',
        currentStock: 8, // Estado crítico (< 10)
        minStock: 10,
        unitCost: 11500,
        supplierId: 'PRV-001',
        supplierName: 'Textiles Mayoristas Chile'
      },
      {
        id: 'INV-004',
        code: 'GOR-TRK-NG-BL',
        name: 'Gorra Trucker 5 Paneles - Negro / Blanco',
        category: 'Gorras en Blanco',
        garmentType: 'Gorra',
        color: 'Negro/Blanco',
        size: 'Única',
        unit: 'unidad',
        currentStock: 50,
        minStock: 15,
        unitCost: 2200,
        supplierId: 'PRV-003',
        supplierName: 'Gorras & Jockeys Premium'
      },
      {
        id: 'INV-005',
        code: 'INS-DTF-BOB-60',
        name: 'Bobina Film DTF 60cm x 100m',
        category: 'Insumos DTF',
        garmentType: 'Otro',
        color: 'Transparente',
        size: '60cm x 100m',
        unit: 'rollo',
        currentStock: 3,
        minStock: 2,
        unitCost: 65000,
        supplierId: 'PRV-002',
        supplierName: 'Insumos Gráficos DTF Sur'
      },
      {
        id: 'INV-006',
        code: 'INS-DTF-POL-1K',
        name: 'Poliamida Blanca DTF Fina (1 Kg)',
        category: 'Insumos DTF',
        garmentType: 'Otro',
        color: 'Blanco',
        size: '1 Kg',
        unit: 'bolsa',
        currentStock: 4,
        minStock: 3,
        unitCost: 18000,
        supplierId: 'PRV-002',
        supplierName: 'Insumos Gráficos DTF Sur'
      },
      {
        id: 'INV-007',
        code: 'INS-VIN-DOR-REF',
        name: 'Rollo Vinilo Textil Dorado Reflectivo (50cm x 25m)',
        category: 'Vinilo Textil',
        garmentType: 'Otro',
        color: 'Dorado',
        size: '50cm x 25m',
        unit: 'rollo',
        currentStock: 5,
        minStock: 2,
        unitCost: 28000,
        supplierId: 'PRV-004',
        supplierName: 'Vinilos & Tintas Santiago'
      }
    ];

    // Compras iniciales de muestra
    const demoPurchases = [
      {
        id: 'CMP-20261028-001',
        supplierId: 'PRV-001',
        supplierName: 'Textiles Mayoristas Chile',
        invoiceNumber: 'FAC-9120',
        date: '2026-10-28',
        items: [
          {
            inventoryItemId: 'INV-001',
            name: 'Polera 100% Algodón 160g - Negro M',
            quantity: 50,
            unitCost: 2800,
            subtotal: 140000
          },
          {
            inventoryItemId: 'INV-002',
            name: 'Polera 100% Algodón 160g - Negro L',
            quantity: 30,
            unitCost: 2800,
            subtotal: 84000
          }
        ],
        totalAmount: 224000,
        notes: 'Reposición para uniformes de empresas y colegios.'
      }
    ];

    // Clientes demo
    const demoClients = [
      {
        id: 'CLI-001',
        name: 'Club Deportivo Leones',
        phone: '+56987654321',
        email: 'leones@futbol.cl',
        rut: '65.123.456-7',
        address: 'Cancha 4, Estadio Municipal',
        notes: 'Equipos de fútbol y básquetbol. Pedidos recurrentes de camisetas y gorras.',
        createdAt: '2026-10-25T10:00:00.000Z'
      },
      {
        id: 'CLI-002',
        name: 'Pastelería Dulce Sabor',
        phone: '+56998877665',
        email: 'contacto@dulcesabor.cl',
        rut: '77.345.678-9',
        address: 'Calle Los Alerces 102',
        notes: 'Polerones corporativos con gorras bordadas para su equipo.',
        createdAt: '2026-10-28T14:30:00.000Z'
      },
      {
        id: 'CLI-003',
        name: 'Agencia Creativa Pixel',
        phone: '+56955443322',
        email: 'hola@pixelcreativa.com',
        rut: '76.999.888-1',
        address: 'Av. Andrés Bello 2115',
        notes: 'Poleras promocionales en DTF alta definición para eventos.',
        createdAt: '2026-10-30T11:15:00.000Z'
      }
    ];

    const hoyStr = new Date().toISOString().split('T')[0];
    const mañana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const proximaSemana = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

    const demoOrders = [
      {
        id: 'NP-20261101-001',
        clientId: 'CLI-001',
        clientName: 'Club Deportivo Leones',
        clientPhone: '+56987654321',
        dates: {
          createdAt: '2026-10-28T10:00:00.000Z',
          deliveryDate: hoyStr,
          deliveredAt: null
        },
        items: [
          {
            id: 'it-1',
            garmentType: 'Polera',
            color: 'Rojo Carmesí',
            size: 'L',
            technique: 'DTF',
            printLocation: 'Pecho grande + Número espalda',
            quantity: 15,
            unitPrice: 7500,
            subtotal: 112500,
            notes: 'Logo del club en alta resolución'
          },
          {
            id: 'it-2',
            garmentType: 'Gorra',
            color: 'Negro / Rojo',
            size: 'Única',
            technique: 'Bordado',
            printLocation: 'Frontal',
            quantity: 15,
            unitPrice: 5000,
            subtotal: 75000,
            notes: 'Gorra trucker con broche ajustable'
          }
        ],
        totals: {
          totalQuantity: 30,
          totalAmount: 187500,
          depositAmount: 100000,
          balanceAmount: 87500,
          paymentStatus: 'Abonado'
        },
        status: 'En producción',
        notes: 'Prioritario para el partido del fin de semana.'
      },
      {
        id: 'NP-20261101-002',
        clientId: 'CLI-002',
        clientName: 'Pastelería Dulce Sabor',
        clientPhone: '+56998877665',
        dates: {
          createdAt: '2026-10-29T15:00:00.000Z',
          deliveryDate: mañana,
          deliveredAt: null
        },
        items: [
          {
            id: 'it-3',
            garmentType: 'Polerón',
            color: 'Rosa Pastel',
            size: 'M',
            technique: 'Serigrafía',
            printLocation: 'Pechera izquierda + Espalda',
            quantity: 8,
            unitPrice: 18000,
            subtotal: 144000,
            notes: 'Tinta ecológica blanca y dorada'
          }
        ],
        totals: {
          totalQuantity: 8,
          totalAmount: 144000,
          depositAmount: 144000,
          balanceAmount: 0,
          paymentStatus: 'Pagado Total'
        },
        status: 'Listo para entrega',
        notes: 'Cliente retira en taller.'
      },
      {
        id: 'NP-20261101-003',
        clientId: 'CLI-003',
        clientName: 'Agencia Creativa Pixel',
        clientPhone: '+56955443322',
        dates: {
          createdAt: '2026-10-31T09:00:00.000Z',
          deliveryDate: proximaSemana,
          deliveredAt: null
        },
        items: [
          {
            id: 'it-4',
            garmentType: 'Polera',
            color: 'Blanco',
            size: 'S',
            technique: 'Sublimación',
            printLocation: 'Pecho completo',
            quantity: 25,
            unitPrice: 6000,
            subtotal: 150000,
            notes: 'Diseño full color degradé'
          },
          {
            id: 'it-5',
            garmentType: 'Buzo',
            color: 'Gris Melange',
            size: 'M',
            technique: 'Vinilo Textil',
            printLocation: 'Pierna izquierda',
            quantity: 10,
            unitPrice: 16000,
            subtotal: 160000,
            notes: 'Vinilo plateado reflectivo'
          }
        ],
        totals: {
          totalQuantity: 35,
          totalAmount: 310000,
          depositAmount: 0,
          balanceAmount: 310000,
          paymentStatus: 'Pendiente'
        },
        status: 'Cotización',
        notes: 'Esperando confirmación de presupuesto para dar inicio.'
      }
    ];

    // Proyectos de fabricación demo (Spec 003)
    const demoProjects = [
      {
        id: 'PRJ-20261101-001',
        code: 'FAB-001',
        orderId: 'NP-20261101-001',
        clientName: 'Club Deportivo Leones',
        name: 'Lote Camisetas & Gorras Club Leones',
        garmentType: 'Polera / Gorra',
        quantity: 30,
        printTechnique: 'DTF / Bordado',
        printLocation: 'Pecho grande + Frontal gorra',
        stage: 'Estampado',
        startDate: hoyStr,
        targetDate: hoyStr,
        assignedTo: 'Rodrigo (Plancha DTF)',
        notes: 'Parámetros DTF: 160°C por 15 seg. Retirar en frío.',
        createdAt: '2026-10-28T10:00:00.000Z',
        updatedAt: '2026-11-01T10:00:00.000Z'
      },
      {
        id: 'PRJ-20261101-002',
        code: 'FAB-002',
        orderId: 'NP-20261101-002',
        clientName: 'Pastelería Dulce Sabor',
        name: 'Lote Polerones Pastelería',
        garmentType: 'Polerón',
        quantity: 8,
        printTechnique: 'Serigrafía',
        printLocation: 'Pechera izq + Espalda',
        stage: 'Control Calidad',
        startDate: '2026-10-29',
        targetDate: mañana,
        assignedTo: 'Marta (Control & Curado)',
        notes: 'Verificar secado con pistola térmica y prueba de lavado.',
        createdAt: '2026-10-29T15:00:00.000Z',
        updatedAt: '2026-11-01T11:00:00.000Z'
      },
      {
        id: 'PRJ-20261101-003',
        code: 'FAB-003',
        orderId: 'NP-20261101-003',
        clientName: 'Agencia Creativa Pixel',
        name: 'Lote Poleras & Buzos Pixel',
        garmentType: 'Polera / Buzo',
        quantity: 35,
        printTechnique: 'Sublimación / Vinilo',
        printLocation: 'Pecho completo + Pierna',
        stage: 'Diseño',
        startDate: hoyStr,
        targetDate: proximaSemana,
        assignedTo: 'Lucas (Diseño Gráfico)',
        notes: 'Ajuste de perfil de color CMYK para sublimación de poleras blancas.',
        createdAt: '2026-10-31T09:00:00.000Z',
        updatedAt: '2026-11-01T09:00:00.000Z'
      }
    ];

    setItem(STORAGE_KEYS.CLIENTS, demoClients);
    setItem(STORAGE_KEYS.ORDERS, demoOrders);
    setItem(STORAGE_KEYS.SUPPLIERS, demoSuppliers);
    setItem(STORAGE_KEYS.INVENTORY, demoInventory);
    setItem(STORAGE_KEYS.PURCHASES, demoPurchases);
    setItem(STORAGE_KEYS.PROJECTS, demoProjects);
    if (!getItem(STORAGE_KEYS.SETTINGS)) {
      setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
  }

  const storageModule = {
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    clearAll,
    clearAllData,
    getSettings,
    saveSettings,
    getClients,
    getClientById,
    saveClient,
    deleteClient,
    getOrders,
    getOrderById,
    saveOrder,
    updateOrderStatus,
    deleteOrder,
    getSuppliers,
    getSupplierById,
    saveSupplier,
    deleteSupplier,
    getInventory,
    getInventoryItemById,
    saveInventoryItem,
    deleteInventoryItem,
    asegurarItemInventarioPrenda,
    getPurchases,
    savePurchase,
    descontarStockPorPedido,
    getProjects,
    getProjectById,
    saveProject,
    updateProjectStage,
    deleteProject,
    exportBackup,
    importBackup,
    initDemoData
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = storageModule;
  }
  global.NovaprintStorage = storageModule;

})(typeof window !== 'undefined' ? window : globalThis);

