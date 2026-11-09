/**
 * assets/js/main.js — Orquestador Principal de Novaprint App
 * Manejo de navegación SPA, listeners globales, filtros, respaldo y ciclo de vida.
 */

(function (global) {
  'use strict';

  let currentView = 'orders';
  let ordersDisplayMode = 'kanban'; // 'kanban' | 'table'

  // Filtros de búsqueda
  let currentSearchQuery = '';
  let currentStatusFilter = 'todos';
  let clientSearchQuery = '';
  let inventorySearchQuery = '';
  let inventoryCategoryFilter = 'todos';
  let inventoryOnlyCritical = false;
  let supplierSearchQuery = '';
  let supplierCategoryFilter = 'todos';
  let fabricationSearchQuery = '';
  let fabricationStageFilter = 'todos';

  function limpiarDatosDemoPrevios() {
    if (!global.NovaprintStorage) return;
    try {
      const storage = global.NovaprintStorage;
      const clientes = storage.getClients();
      const pedidos = storage.getOrders();
      const proveedores = storage.getSuppliers();

      // Detectar si aún existen datos de la plantilla inicial de prueba
      const tieneClientesDemo = clientes.some(c => c.id === 'CLI-001' || c.id === 'CLI-002' || c.id === 'CLI-003');
      const tienePedidosDemo = pedidos.some(p => p.id === 'ORD-2026-0001' || p.id === 'ORD-2026-0002');
      const tieneProveedoresDemo = proveedores.some(p => p.id === 'PRV-001' || p.id === 'PRV-002');

      if (tieneClientesDemo || tienePedidosDemo || tieneProveedoresDemo) {
        storage.clearAllData(true);
        console.log('Datos de prueba eliminados. La base de datos está limpia para uso de datos propios.');
      }
    } catch (e) {
      console.warn('Error al verificar datos de prueba iniciales:', e);
    }
  }

  function init() {
    console.log('Iniciando Novaprint App...');

    // Limpiar automáticamente los datos de muestra iniciales si aún existen en el navegador
    limpiarDatosDemoPrevios();

    // Aplicar tema guardado en configuración (Spec 010)
    if (global.NovaprintStorage) {
      const config = global.NovaprintStorage.getSettings();
      aplicarTema(config.theme || 'system');
    }

    setupNavigation();
    setupFiltersAndSearch();
    setupModalsAndForms();
    setupBackupAndSettings();
    actualizarFooterCreditos();
    refrescarDatos();

    // Inicializar iconos de Lucide
    if (global.lucide && typeof global.lucide.createIcons === 'function') {
      global.lucide.createIcons();
    }
  }

  function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.getAttribute('data-view');
        cambiarVista(targetView);
      });
    });

    // Soporte para hash en URL (#orders, #clients, #inventory, #purchases, #suppliers, #fabrication)
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById(`view-${hash}`)) {
          cambiarVista(hash, false);
        }
      });

      const initialHash = window.location.hash.replace('#', '');
      if (initialHash && document.getElementById(`view-${initialHash}`)) {
        cambiarVista(initialHash, false);
      }
    }

    // Alternar modo de visualización en pedidos (Semáforo vs Tabla)
    const btnKanban = document.getElementById('btn-mode-kanban');
    const btnTable = document.getElementById('btn-mode-table');

    if (btnKanban && btnTable) {
      btnKanban.addEventListener('click', () => {
        ordersDisplayMode = 'kanban';
        btnKanban.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
        btnKanban.classList.remove('bg-white', 'text-gray-700');
        btnTable.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
        btnTable.classList.add('bg-white', 'text-gray-700');

        document.getElementById('orders-kanban-container').classList.remove('hidden');
        document.getElementById('orders-table-container').classList.add('hidden');
      });

      btnTable.addEventListener('click', () => {
        ordersDisplayMode = 'table';
        btnTable.classList.add('bg-blue-600', 'text-white', 'shadow-sm');
        btnTable.classList.remove('bg-white', 'text-gray-700');
        btnKanban.classList.remove('bg-blue-600', 'text-white', 'shadow-sm');
        btnKanban.classList.add('bg-white', 'text-gray-700');

        document.getElementById('orders-kanban-container').classList.add('hidden');
        document.getElementById('orders-table-container').classList.remove('hidden');
      });
    }
  }

  function cambiarVista(viewName, updateHash = true) {
    if (!viewName) return;
    currentView = viewName;

    // Ocultar todos los paneles y activar el seleccionado
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`view-${viewName}`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    // Actualizar estilos de los botones de navegación
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-view') === viewName;
      if (isTarget) {
        btn.classList.add('border-blue-600', 'text-blue-600', 'font-bold');
        btn.classList.remove('border-transparent', 'text-gray-500');
      } else {
        btn.classList.remove('border-blue-600', 'text-blue-600', 'font-bold');
        btn.classList.add('border-transparent', 'text-gray-500');
      }
    });

    if (updateHash && typeof window !== 'undefined' && window.location) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `#${viewName}`);
      } else {
        window.location.hash = viewName;
      }
    }

    // Reinicializar iconos Lucide
    if (global.lucide && typeof global.lucide.createIcons === 'function') {
      global.lucide.createIcons();
    }

    refrescarDatos();
  }

  function setupFiltersAndSearch() {
    // Buscador de pedidos
    const orderSearchInput = document.getElementById('orders-search-input');
    if (orderSearchInput) {
      orderSearchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        refrescarPedidos();
      });
    }

    // Filtro por estado en pedidos (Spec 009: Botón Saldo por Cobrar)
    const btnFilterBalance = document.getElementById('btn-filter-balance');
    const statusFilterSelect = document.getElementById('orders-status-filter');
    const kpiPendingBalance = document.getElementById('kpi-card-pending-balance');

    function actualizarEstiloBotonSaldo(activo) {
      if (!btnFilterBalance) return;
      if (activo) {
        btnFilterBalance.classList.remove('bg-emerald-50', 'text-emerald-800', 'border-emerald-300');
        btnFilterBalance.classList.add('bg-emerald-600', 'text-white', 'border-emerald-700', 'shadow-sm');
        const badge = document.getElementById('badge-count-pending-balance');
        if (badge) {
          badge.classList.remove('bg-emerald-200', 'text-emerald-900');
          badge.classList.add('bg-white', 'text-emerald-800');
        }
      } else {
        btnFilterBalance.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-700', 'shadow-sm');
        btnFilterBalance.classList.add('bg-emerald-50', 'text-emerald-800', 'border-emerald-300');
        const badge = document.getElementById('badge-count-pending-balance');
        if (badge) {
          badge.classList.remove('bg-white', 'text-emerald-800');
          badge.classList.add('bg-emerald-200', 'text-emerald-900');
        }
      }
    }

    if (btnFilterBalance) {
      btnFilterBalance.addEventListener('click', () => {
        if (currentStatusFilter === 'con_saldo') {
          currentStatusFilter = 'todos';
          if (statusFilterSelect) statusFilterSelect.value = 'todos';
          actualizarEstiloBotonSaldo(false);
        } else {
          currentStatusFilter = 'con_saldo';
          if (statusFilterSelect) statusFilterSelect.value = 'con_saldo';
          actualizarEstiloBotonSaldo(true);
        }
        refrescarPedidos();
      });
    }

    if (kpiPendingBalance) {
      kpiPendingBalance.addEventListener('click', () => {
        currentStatusFilter = 'con_saldo';
        if (statusFilterSelect) statusFilterSelect.value = 'con_saldo';
        actualizarEstiloBotonSaldo(true);
        refrescarPedidos();
      });
    }

    if (statusFilterSelect) {
      statusFilterSelect.addEventListener('change', (e) => {
        currentStatusFilter = e.target.value;
        actualizarEstiloBotonSaldo(currentStatusFilter === 'con_saldo');
        refrescarPedidos();
      });
    }

    // Buscador de clientes
    const clientSearchInput = document.getElementById('clients-search-input');
    if (clientSearchInput) {
      clientSearchInput.addEventListener('input', (e) => {
        clientSearchQuery = e.target.value;
        refrescarClientes();
      });
    }

    // Buscador de inventario
    const invSearchInput = document.getElementById('inventory-search-input');
    if (invSearchInput) {
      invSearchInput.addEventListener('input', (e) => {
        inventorySearchQuery = e.target.value;
        refrescarInventario();
      });
    }

    // Filtro de categoría en inventario
    const invCategorySelect = document.getElementById('inventory-category-filter');
    if (invCategorySelect) {
      invCategorySelect.addEventListener('change', (e) => {
        inventoryCategoryFilter = e.target.value;
        refrescarInventario();
      });
    }

    // Checkbox de solo stock crítico
    const invCriticalCheckbox = document.getElementById('inventory-critical-only');
    if (invCriticalCheckbox) {
      invCriticalCheckbox.addEventListener('change', (e) => {
        inventoryOnlyCritical = e.target.checked;
        refrescarInventario();
      });
    }

    // Buscador de proveedores
    const supSearchInput = document.getElementById('suppliers-search-input');
    if (supSearchInput) {
      supSearchInput.addEventListener('input', (e) => {
        supplierSearchQuery = e.target.value;
        refrescarProveedores();
      });
    }

    // Filtro de categoría en proveedores
    const supCategorySelect = document.getElementById('suppliers-category-filter');
    if (supCategorySelect) {
      supCategorySelect.addEventListener('change', (e) => {
        supplierCategoryFilter = e.target.value;
        refrescarProveedores();
      });
    }

    // Buscador de fabricación (Spec 003)
    const fabSearchInput = document.getElementById('fabrication-search-input');
    if (fabSearchInput) {
      fabSearchInput.addEventListener('input', (e) => {
        fabricationSearchQuery = e.target.value;
        refrescarFabricacion();
      });
    }

    // Filtro de estación en fabricación (Spec 003)
    const fabStageSelect = document.getElementById('fabrication-stage-filter');
    if (fabStageSelect) {
      fabStageSelect.addEventListener('change', (e) => {
        fabricationStageFilter = e.target.value;
        refrescarFabricacion();
      });
    }
  }

  function setupModalsAndForms() {
    // Pedidos
    const btnNuevoPedido = document.getElementById('btn-new-order');
    if (btnNuevoPedido) {
      btnNuevoPedido.addEventListener('click', () => {
        global.NovaprintUI.abrirModalNuevoPedido();
      });
    }

    // Spec 013: Botón de acceso a escala de Descuentos por Volumen en barra de pedidos
    const btnVerDescVolumen = document.getElementById('btn-view-volume-discounts');
    if (btnVerDescVolumen) {
      btnVerDescVolumen.addEventListener('click', () => {
        if (global.NovaprintUI && typeof global.NovaprintUI.abrirModalDescuentosVolumen === 'function') {
          global.NovaprintUI.abrirModalDescuentosVolumen();
        }
      });
    }

    // Spec 013: Botón de acceso a escala de Descuentos por Volumen dentro del modal de pedido
    const btnOpenDescVolumenOrder = document.getElementById('btn-open-volume-discounts-order');
    if (btnOpenDescVolumenOrder) {
      btnOpenDescVolumenOrder.addEventListener('click', () => {
        if (global.NovaprintUI && typeof global.NovaprintUI.abrirModalDescuentosVolumen === 'function') {
          global.NovaprintUI.abrirModalDescuentosVolumen();
        }
      });
    }

    const btnAgregarPrenda = document.getElementById('btn-add-garment-item');
    if (btnAgregarPrenda) {
      btnAgregarPrenda.addEventListener('click', () => {
        global.NovaprintUI.agregarFilaPrenda();
      });
    }

    const inputAbono = document.getElementById('order-deposit-input');
    if (inputAbono) {
      inputAbono.addEventListener('input', () => {
        global.NovaprintUI.recalcularTotalesFormulario();
      });
    }

    const formOrder = document.getElementById('form-order');
    if (formOrder) {
      formOrder.addEventListener('submit', (e) => {
        e.preventDefault();
        global.NovaprintUI.guardarPedidoDesdeFormulario();
      });
    }

    // Clientes
    const btnNuevoCliente = document.getElementById('btn-new-client');
    if (btnNuevoCliente) {
      btnNuevoCliente.addEventListener('click', () => {
        global.NovaprintUI.abrirModalNuevoCliente();
      });
    }

    const formClient = document.getElementById('form-client');
    if (formClient) {
      formClient.addEventListener('submit', (e) => {
        e.preventDefault();
        global.NovaprintUI.guardarClienteDesdeFormulario();
      });
    }

    // Proveedores (Spec 002)
    const btnNuevoProveedor = document.getElementById('btn-new-supplier');
    if (btnNuevoProveedor) {
      btnNuevoProveedor.addEventListener('click', () => {
        global.NovaprintUI.abrirModalNuevoProveedor();
      });
    }

    const formSupplier = document.getElementById('form-supplier');
    if (formSupplier) {
      formSupplier.addEventListener('submit', (e) => {
        e.preventDefault();
        global.NovaprintUI.guardarProveedorDesdeFormulario();
      });
    }

    // Inventario (Spec 002)
    const btnNuevoItem = document.getElementById('btn-new-inventory-item');
    if (btnNuevoItem) {
      btnNuevoItem.addEventListener('click', () => {
        global.NovaprintUI.abrirModalNuevoItemInventario();
      });
    }

    const formInventory = document.getElementById('form-inventory');
    if (formInventory) {
      formInventory.addEventListener('submit', (e) => {
        e.preventDefault();
        global.NovaprintUI.guardarItemInventarioDesdeFormulario();
      });
    }

    // Compras (Spec 002)
    const btnNuevaCompra = document.getElementById('btn-new-purchase');
    if (btnNuevaCompra) {
      btnNuevaCompra.addEventListener('click', () => {
        global.NovaprintUI.abrirModalNuevaCompra();
      });
    }

    const btnAgregarItemCompra = document.getElementById('btn-add-purchase-item');
    if (btnAgregarItemCompra) {
      btnAgregarItemCompra.addEventListener('click', () => {
        global.NovaprintUI.agregarFilaItemCompra();
      });
    }

    const formPurchase = document.getElementById('form-purchase');
    if (formPurchase) {
      formPurchase.addEventListener('submit', (e) => {
        e.preventDefault();
        global.NovaprintUI.guardarCompraDesdeFormulario();
      });
    }

    // Fabricación en Taller (Spec 003)
    const btnNuevaFabricacion = document.getElementById('btn-new-fabrication-project');
    if (btnNuevaFabricacion) {
      btnNuevaFabricacion.addEventListener('click', () => {
        global.NovaprintUI.abrirModalNuevaOrdenFabricacion();
      });
    }

    const formProject = document.getElementById('form-project');
    if (formProject) {
      formProject.addEventListener('submit', (e) => {
        e.preventDefault();
        global.NovaprintUI.guardarProyectoDesdeFormulario();
      });
    }

    // Botón Imprimir Ticket en modal (Spec 011)
    const btnPrintTicket = document.getElementById('btn-ticket-print');
    if (btnPrintTicket) {
      btnPrintTicket.addEventListener('click', () => {
        if (global.NovaprintTicket) {
          global.NovaprintTicket.imprimirTicket();
        }
      });
    }

    // Atajo de teclado Ctrl+P / Cmd+P para imprimir ticket si el modal está abierto
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
          const dialogTicket = document.getElementById('dialog-ticket');
          if (dialogTicket && dialogTicket.open) {
            e.preventDefault();
            if (global.NovaprintTicket) {
              global.NovaprintTicket.imprimirTicket();
            }
          }
        }
      });
    }
  }

  // --- CONTROL DE TEMA CLARO / OSCURO (SPEC 010) ---
  function resolverEsOscuro(tema) {
    if (tema === 'dark') return true;
    if (tema === 'light') return false;
    return !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function aplicarTema(tema) {
    const temaVal = (tema === 'dark' || tema === 'light' || tema === 'system') ? tema : 'system';
    const esOscuro = resolverEsOscuro(temaVal);

    if (typeof document !== 'undefined') {
      if (esOscuro) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
      if (metaColorScheme) {
        metaColorScheme.setAttribute('content', esOscuro ? 'dark light' : 'light dark');
      }

      // Sincronizar botones de tema en el modal de configuración si están disponibles
      const selectorButtons = document.querySelectorAll('#theme-selector-group .theme-selector-card');
      selectorButtons.forEach(btn => {
        if (btn.getAttribute('data-theme-val') === temaVal) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      const hiddenInput = document.getElementById('settings-theme');
      if (hiddenInput) {
        hiddenInput.value = temaVal;
      }
    }

    return { tema: temaVal, esOscuro };
  }

  function setupBackupAndSettings() {
    const btnSettings = document.getElementById('btn-open-settings');
    const dialogSettings = document.getElementById('dialog-settings');

    // Botones interactivos de tema (Spec 010) con vista previa instantánea
    const themeCards = document.querySelectorAll('#theme-selector-group .theme-selector-card');
    themeCards.forEach(card => {
      card.addEventListener('click', () => {
        const selectedTheme = card.getAttribute('data-theme-val');
        aplicarTema(selectedTheme);
      });
    });

    // Escuchar cambios del sistema operativo si la preferencia activa es 'system'
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', () => {
          if (global.NovaprintStorage) {
            const config = global.NovaprintStorage.getSettings();
            if ((config.theme || 'system') === 'system') {
              aplicarTema('system');
            }
          }
        });
      } catch (e) {}
    }

    if (btnSettings && dialogSettings) {
      btnSettings.addEventListener('click', () => {
        const config = global.NovaprintStorage.getSettings();
        document.getElementById('settings-business-name').value = config.businessName || '';
        document.getElementById('settings-rut').value = config.rut || '';
        document.getElementById('settings-phone').value = config.phone || '';
        document.getElementById('settings-email').value = config.email || '';
        document.getElementById('settings-address').value = config.address || '';
        document.getElementById('settings-ticket-footer').value = config.ticketFooter || '';
        aplicarTema(config.theme || 'system');
        dialogSettings.showModal();
      });
    }

    const formSettings = document.getElementById('form-settings');
    if (formSettings) {
      formSettings.addEventListener('submit', (e) => {
        e.preventDefault();
        const themeInput = document.getElementById('settings-theme');
        const updated = {
          businessName: document.getElementById('settings-business-name').value.trim(),
          rut: document.getElementById('settings-rut').value.trim(),
          phone: document.getElementById('settings-phone').value.trim(),
          email: document.getElementById('settings-email').value.trim(),
          address: document.getElementById('settings-address').value.trim(),
          ticketFooter: document.getElementById('settings-ticket-footer').value.trim(),
          theme: themeInput ? themeInput.value : 'system'
        };
        global.NovaprintStorage.saveSettings(updated);
        aplicarTema(updated.theme);
        dialogSettings.close();
        global.NovaprintUI.showToast('Configuración actualizada con éxito.', 'success');
      });
    }

    const btnExportBackup = document.getElementById('btn-export-backup');
    if (btnExportBackup) {
      btnExportBackup.addEventListener('click', () => {
        const jsonStr = global.NovaprintStorage.exportBackup();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const hoy = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `novaprint-backup-${hoy}.json`;
        a.click();
        URL.revokeObjectURL(url);
        global.NovaprintUI.showToast('Copia de respaldo JSON descargada.', 'success');
      });
    }

    const fileImportInput = document.getElementById('file-import-backup');
    if (fileImportInput) {
      fileImportInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = global.NovaprintStorage.importBackup(event.target.result);
          if (res.success) {
            dialogSettings.close();
            const config = global.NovaprintStorage.getSettings();
            aplicarTema(config.theme || 'system');
            refrescarDatos();
            global.NovaprintUI.showToast('¡Datos restaurados con éxito!', 'success');
          } else {
            alert(`Error al restaurar: ${res.error}`);
          }
        };
        reader.readAsText(file);
      });
    }
  }

  function refrescarPedidos() {
    const storage = global.NovaprintStorage;
    const sales = global.NovaprintSales;
    const ui = global.NovaprintUI;

    if (!storage || !sales || !ui) return;

    const todosPedidos = storage.getOrders();
    ui.renderMetrics(todosPedidos);

    const filtrados = sales.filtrarPedidos(todosPedidos, {
      textoBusqueda: currentSearchQuery,
      estadoFiltro: currentStatusFilter
    });

    const ordenados = sales.ordenarPedidosPorUrgencia(filtrados);

    ui.renderOrdersKanban(ordenados);
    ui.renderOrdersTable(ordenados);
  }

  function refrescarClientes() {
    const storage = global.NovaprintStorage;
    const sales = global.NovaprintSales;
    const ui = global.NovaprintUI;

    if (!storage || !sales || !ui) return;

    const todosClientes = storage.getClients();
    const filtrados = sales.filtrarClientes(todosClientes, clientSearchQuery);
    ui.renderClientsGrid(filtrados);
  }

  function refrescarInventario() {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const ui = global.NovaprintUI;

    if (!storage || !prod || !ui) return;

    const todoInventario = storage.getInventory();
    ui.renderInventoryMetrics(todoInventario);

    const filtrados = prod.filtrarInventario(todoInventario, {
      textoBusqueda: inventorySearchQuery,
      categoria: inventoryCategoryFilter,
      soloCriticos: inventoryOnlyCritical
    });

    ui.renderInventoryTable(filtrados);
  }

  function refrescarProveedores() {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const ui = global.NovaprintUI;

    if (!storage || !prod || !ui) return;

    const todosProveedores = storage.getSuppliers();
    const filtrados = prod.filtrarProveedores(todosProveedores, {
      textoBusqueda: supplierSearchQuery,
      categoria: supplierCategoryFilter
    });

    ui.renderSuppliersGrid(filtrados);
  }

  function refrescarCompras() {
    const storage = global.NovaprintStorage;
    const ui = global.NovaprintUI;

    if (!storage || !ui) return;

    const todasCompras = storage.getPurchases();
    ui.renderPurchasesTable(todasCompras);
  }

  function refrescarFabricacion() {
    const storage = global.NovaprintStorage;
    const prod = global.NovaprintProduction;
    const ui = global.NovaprintUI;

    if (!storage || !prod || !ui) return;

    const todosProyectos = storage.getProjects();
    ui.renderFabricationMetrics(todosProyectos);

    const filtrados = prod.filtrarProyectosFabricacion(todosProyectos, {
      textoBusqueda: fabricationSearchQuery,
      etapa: fabricationStageFilter
    });

    ui.renderFabricationKanban(filtrados);
  }

  function refrescarDatos() {
    refrescarPedidos();
    refrescarClientes();
    refrescarInventario();
    refrescarProveedores();
    refrescarCompras();
    refrescarFabricacion();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  // --- PIE DE PÁGINA Y CRÉDITOS FIJOS DE GENERACIÓN (SPEC 012) ---
  // Valor fijo establecido al momento de generar la aplicación, inmutable hasta la próxima regeneración
  const BUILD_VERSION = Object.freeze({
    releaseCode: '2611.04',
    releaseDate: 'Noviembre 2026',
    author: 'Andres Aguiar V',
    location: 'Santiago de Chile',
    contact: '+56933395447',
    whatsapp: '+56933395447'
  });

  function obtenerDatosFechaFooter() {
    return {
      codigoVersion: BUILD_VERSION.releaseCode,
      mesAño: BUILD_VERSION.releaseDate
    };
  }

  function actualizarFooterCreditos() {
    if (typeof document === 'undefined') return;
    const spanCodigo = document.getElementById('footer-version-code');
    const spanMes = document.getElementById('footer-date-name');
    if (spanCodigo) spanCodigo.textContent = BUILD_VERSION.releaseCode;
    if (spanMes) spanMes.textContent = BUILD_VERSION.releaseDate;
  }

  const mainModule = {
    init,
    cambiarVista,
    refrescarDatos,
    refrescarPedidos,
    refrescarClientes,
    refrescarInventario,
    refrescarProveedores,
    refrescarCompras,
    aplicarTema,
    resolverEsOscuro,
    BUILD_VERSION,
    obtenerDatosFechaFooter,
    actualizarFooterCreditos
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = mainModule;
  }
  global.NovaprintMain = mainModule;

})(typeof window !== 'undefined' ? window : globalThis);
