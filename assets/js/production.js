/**
 * assets/js/production.js — Módulo de Lógica de Negocio de Producción para Novaprint
 * Gestión de inventarios, compras, proveedores y control de fabricación en taller.
 */

(function (global) {
  'use strict';

  function normalizarTexto(texto) {
    if (!texto) return '';
    return String(texto)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // ==========================================
  // INVENTARIO Y ALERTAS (SPEC 002)
  // ==========================================

  function evaluarEstadoStock(currentStock, minStock) {
    const cur = Number(currentStock) || 0;
    const min = Number(minStock) || 0;
    return cur <= min ? 'critico' : 'normal';
  }

  function aplicarCompraAInventario(inventario = [], itemsComprados = []) {
    if (!Array.isArray(inventario)) return [];
    if (!Array.isArray(itemsComprados) || itemsComprados.length === 0) {
      return JSON.parse(JSON.stringify(inventario));
    }

    const mapaCompras = {};
    itemsComprados.forEach(it => {
      const id = it.inventoryItemId;
      const cant = Math.max(0, Number(it.quantity) || 0);
      const costo = Math.max(0, Number(it.unitCost) || 0);
      if (id) {
        if (!mapaCompras[id]) mapaCompras[id] = { quantity: 0, unitCost: costo };
        mapaCompras[id].quantity += cant;
        if (costo > 0) mapaCompras[id].unitCost = costo;
      }
    });

    return inventario.map(item => {
      const compra = mapaCompras[item.id];
      if (compra) {
        return {
          ...item,
          currentStock: (Number(item.currentStock) || 0) + compra.quantity,
          unitCost: compra.unitCost > 0 ? compra.unitCost : item.unitCost,
          updatedAt: new Date().toISOString()
        };
      }
      return { ...item };
    });
  }

  const TASA_IVA_CHILE = 0.19;

  // Spec 020/026: Opciones oficiales de estampado y costos de compra / precios sugeridos
  const OPCIONES_ESTAMPADO = Object.freeze({
    NINGUNO: {
      id: 'Ninguno',
      nombre: 'Ninguno',
      label: 'Ninguno ($0)',
      costoCompra: 0,
      precioVentaSugerido: 0
    },
    ADELANTE: {
      id: 'Adelante',
      nombre: 'Adelante',
      label: 'Adelante (Pecho)',
      costoCompra: 1800,
      precioVentaSugerido: 3200
    },
    ATRAS: {
      id: 'Atrás',
      nombre: 'Atrás',
      label: 'Atrás (Espalda)',
      costoCompra: 2200,
      precioVentaSugerido: 3500
    },
    AMBOS: {
      id: 'Ambos',
      nombre: 'Ambos',
      label: 'Ambos (Adelante y Atrás)',
      costoCompra: 3500,
      precioVentaSugerido: 5500
    }
  });

  function normalizarOpcionEstampado(ubicacion) {
    if (!ubicacion) return OPCIONES_ESTAMPADO.ADELANTE;
    const txt = normalizarTexto(String(ubicacion));
    if (txt.includes('ningun') || txt.includes('sin estampado') || txt === 'sin' || txt === 'lisa' || txt === 'liso' || txt === 'ninguna' || txt === 'no') {
      return OPCIONES_ESTAMPADO.NINGUNO;
    }
    if (txt.includes('ambos') || txt.includes('adelante y atras') || txt.includes('pecho y espalda')) {
      return OPCIONES_ESTAMPADO.AMBOS;
    }
    if (txt.includes('atras') || txt.includes('espalda') || txt.includes('posterior')) {
      return OPCIONES_ESTAMPADO.ATRAS;
    }
    return OPCIONES_ESTAMPADO.ADELANTE;
  }

  function obtenerCostoCompraEstampado(ubicacion) {
    return normalizarOpcionEstampado(ubicacion).costoCompra;
  }

  function calcularTotalesCompra(items = [], opciones = {}) {
    const aplicarIva = Boolean(opciones && opciones.aplicarIva);
    const montoDelivery = Math.max(0, Number(opciones && opciones.montoDelivery) || 0);

    let totalUnidades = 0;
    let subtotalNeto = 0;

    if (Array.isArray(items)) {
      items.forEach(it => {
        const q = Math.max(0, Number(it.quantity) || 0);
        const c = Math.max(0, Number(it.unitCost) || 0);
        totalUnidades += q;
        subtotalNeto += Math.round(q * c);
      });
    }

    const applyIva = aplicarIva;
    const ivaPercent = applyIva ? 19 : 0;
    const ivaAmount = applyIva ? Math.round(subtotalNeto * TASA_IVA_CHILE) : 0;
    const applyDelivery = montoDelivery > 0;
    const deliveryAmount = montoDelivery;
    const totalAmount = subtotalNeto + ivaAmount + deliveryAmount;

    return {
      totalUnidades,
      subtotalNeto,
      applyIva,
      ivaPercent,
      ivaAmount,
      applyDelivery,
      deliveryAmount,
      totalAmount
    };
  }

  function calcularValorizacionInventario(inventario = []) {
    if (!Array.isArray(inventario) || inventario.length === 0) {
      return { totalUnidades: 0, totalMonetario: 0 };
    }

    let totalUnidades = 0;
    let totalMonetario = 0;

    inventario.forEach(it => {
      const q = Math.max(0, Number(it.currentStock) || 0);
      const c = Math.max(0, Number(it.unitCost) || 0);
      totalUnidades += q;
      totalMonetario += Math.round(q * c);
    });

    return { totalUnidades, totalMonetario };
  }

  function filtrarInventario(inventario = [], { textoBusqueda = '', categoria = 'todos', soloCriticos = false } = {}) {
    const query = normalizarTexto(textoBusqueda);

    return inventario.filter(it => {
      if (categoria && categoria !== 'todos' && it.category !== categoria) {
        return false;
      }

      if (soloCriticos) {
        if (evaluarEstadoStock(it.currentStock, it.minStock) !== 'critico') {
          return false;
        }
      }

      if (!query) return true;

      const coincideNombre = normalizarTexto(it.name).includes(query);
      const coincideCodigo = normalizarTexto(it.code).includes(query);
      const coincideCat = normalizarTexto(it.category).includes(query);
      const coincideProv = normalizarTexto(it.supplierName).includes(query);

      return coincideNombre || coincideCodigo || coincideCat || coincideProv;
    });
  }

  function filtrarProveedores(proveedores = [], { textoBusqueda = '', categoria = 'todos' } = {}) {
    const query = normalizarTexto(textoBusqueda);

    return proveedores.filter(p => {
      if (categoria && categoria !== 'todos' && p.category !== categoria) {
        return false;
      }

      if (!query) return true;

      const coincideNombre = normalizarTexto(p.name).includes(query);
      const coincideContacto = normalizarTexto(p.contact).includes(query);
      const coincideTel = normalizarTexto(p.phone).includes(query);
      const coincideCat = normalizarTexto(p.category).includes(query);

      return coincideNombre || coincideContacto || coincideTel || coincideCat;
    });
  }

  function generarIdCompra(secuencia, fecha = new Date()) {
    const d = new Date(fecha);
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const sec = String(secuencia || 1).padStart(3, '0');
    return `CMP-${año}${mes}${dia}-${sec}`;
  }

  // ==========================================
  // CONTROL DE FABRICACIÓN EN TALLER (SPEC 003)
  // ==========================================

  const ETAPAS_FABRICACION = [
    'Diseño',
    'Preparación',
    'Estampado',
    'Control Calidad',
    'Terminado'
  ];

  /**
   * Obtiene la siguiente etapa lógica del flujo de taller
   */
  function obtenerSiguienteEtapa(etapaActual) {
    const idx = ETAPAS_FABRICACION.indexOf(etapaActual);
    if (idx === -1 || idx === ETAPAS_FABRICACION.length - 1) {
      return null;
    }
    return ETAPAS_FABRICACION[idx + 1];
  }

  /**
   * Clasifica los proyectos en las 5 columnas del tablero de taller
   */
  function clasificarProyectosPorEtapa(proyectos = []) {
    const estructura = {
      'Diseño': [],
      'Preparación': [],
      'Estampado': [],
      'Control Calidad': [],
      'Terminado': []
    };

    if (!Array.isArray(proyectos)) return estructura;

    proyectos.forEach(prj => {
      const etapa = prj.stage || 'Diseño';
      if (estructura[etapa]) {
        estructura[etapa].push(prj);
      } else {
        estructura['Diseño'].push(prj);
      }
    });

    return estructura;
  }

  /**
   * Construye un proyecto/orden de fabricación a partir de un pedido confirmado
   */
  function crearProyectoDesdePedido(pedido, asignadoA = 'Taller Central') {
    const now = new Date();
    const año = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const dia = String(now.getDate()).padStart(2, '0');
    const id = `PRJ-${año}${mes}${dia}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Consolidar tipos de prendas y técnicas únicas
    const tiposPrendas = [...new Set((pedido.items || []).map(i => i.garmentType))].join(' / ') || 'Textiles';
    const tecnicas = [...new Set((pedido.items || []).map(i => i.technique))].join(' / ') || 'Estampado';
    const ubicaciones = [...new Set((pedido.items || []).map(i => i.printLocation).filter(Boolean))].join(', ') || 'Pecho';

    return {
      id,
      code: `FAB-${pedido.id ? pedido.id.replace('NP-', '') : Date.now().toString(36).toUpperCase()}`,
      orderId: pedido.id || null,
      clientName: pedido.clientName || 'Cliente General',
      name: `Lote ${tiposPrendas} — ${pedido.clientName || 'Cliente'}`,
      garmentType: tiposPrendas,
      quantity: pedido.totals?.totalQuantity || (pedido.items || []).reduce((acc, i) => acc + (i.quantity || 0), 0) || 1,
      printTechnique: tecnicas,
      printLocation: ubicaciones,
      stage: 'Diseño',
      startDate: now.toISOString().split('T')[0],
      targetDate: pedido.dates?.deliveryDate || now.toISOString().split('T')[0],
      assignedTo: asignadoA,
      notes: pedido.notes || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  /**
   * Filtra proyectos de fabricación
   */
  function filtrarProyectosFabricacion(proyectos = [], { textoBusqueda = '', etapa = 'todos', tecnica = 'todos' } = {}) {
    const query = normalizarTexto(textoBusqueda);

    return proyectos.filter(p => {
      if (etapa && etapa !== 'todos' && p.stage !== etapa) {
        return false;
      }

      if (tecnica && tecnica !== 'todos' && !normalizarTexto(p.printTechnique).includes(normalizarTexto(tecnica))) {
        return false;
      }

      if (!query) return true;

      const coincideNombre = normalizarTexto(p.name).includes(query);
      const coincideCodigo = normalizarTexto(p.code).includes(query);
      const coincideCliente = normalizarTexto(p.clientName).includes(query);
      const coincidePrenda = normalizarTexto(p.garmentType).includes(query);
      const coincideTecnica = normalizarTexto(p.printTechnique).includes(query);

      return coincideNombre || coincideCodigo || coincideCliente || coincidePrenda || coincideTecnica;
    });
  }

  function generarIdFabricacion(secuencia, fecha = new Date()) {
    const d = new Date(fecha);
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const sec = String(secuencia || 1).padStart(3, '0');
    return `FAB-${año}${mes}${dia}-${sec}`;
  }

  /**
   * Spec 004 — Cruza una prenda de pedido con el inventario por prenda, color y talla
   */
  function verificarDisponibilidadPrenda(inventario = [], itemPedido = {}) {
    if (!Array.isArray(inventario)) inventario = [];
    const prendaBuscada = normalizarTexto(itemPedido.garmentType);
    const colorBuscado = normalizarTexto(itemPedido.color);
    const tallaBuscada = normalizarTexto(itemPedido.size);
    const cantidadRequerida = Math.max(0, Number(itemPedido.quantity) || 0);

    const encontrado = inventario.find(inv => {
      const matchPrenda = normalizarTexto(inv.garmentType) === prendaBuscada || normalizarTexto(inv.name).includes(prendaBuscada);
      const matchColor = normalizarTexto(inv.color) === colorBuscado || normalizarTexto(inv.name).includes(colorBuscado);
      const matchTalla = normalizarTexto(inv.size) === tallaBuscada || normalizarTexto(inv.name).includes(tallaBuscada);
      return matchPrenda && matchColor && matchTalla;
    }) || null;

    if (!encontrado) {
      return {
        encontrado: false,
        itemInventario: null,
        stockActual: 0,
        cantidadRequerida,
        faltante: cantidadRequerida,
        estado: 'no_registrado'
      };
    }

    const stockActual = Math.max(0, Number(encontrado.currentStock) || 0);
    const faltante = Math.max(0, cantidadRequerida - stockActual);
    const estado = faltante === 0 ? 'suficiente' : 'faltante';

    return {
      encontrado: true,
      itemInventario: encontrado,
      stockActual,
      cantidadRequerida,
      faltante,
      estado
    };
  }

  /**
   * Spec 004 & Spec 020 — Evalúa todas las prendas de un pedido y calcula los materiales a comprar.
   * Si opciones.incluirEstampados es true, considera la compra del estampado para cada unidad
   * según sea Adelante ($1.800), Atrás ($2.200) o Ambos ($3.500).
   */
  function calcularFaltantesPedido(inventario = [], itemsPedido = [], opciones = {}) {
    if (!Array.isArray(inventario)) inventario = [];
    if (!Array.isArray(itemsPedido)) itemsPedido = [];

    const detalle = [];
    const faltantesParaCompra = [];
    let totalPrendasFaltantes = 0;
    let totalEstampadosFaltantes = 0;

    itemsPedido.forEach(it => {
      const verif = verificarDisponibilidadPrenda(inventario, it);
      detalle.push({ ...verif, itemPedido: it });

      if (verif.faltante > 0) {
        totalPrendasFaltantes += verif.faltante;
        if (verif.itemInventario) {
          const inv = verif.itemInventario;
          faltantesParaCompra.push({
            inventoryId: inv.id,
            isEstampado: false,
            code: inv.code,
            name: inv.name,
            garmentType: it.garmentType || inv.garmentType,
            color: it.color || inv.color,
            size: it.size || inv.size,
            supplierId: inv.supplierId || '',
            supplierName: inv.supplierName || 'Proveedor General',
            quantityNeeded: verif.faltante,
            unitCost: Number(inv.unitCost) || 0,
            subtotal: verif.faltante * (Number(inv.unitCost) || 0)
          });
        } else {
          // Spec 008: Prenda no registrada en inventario aún
          const pB = normalizarTexto(it.garmentType);
          let unitCost = 2800;
          if (pB.includes('poleron')) unitCost = 11000;
          else if (pB.includes('buzo')) unitCost = 12000;
          else if (pB.includes('gorra')) unitCost = 3500;
          else if (pB.includes('polera')) unitCost = 2800;

          faltantesParaCompra.push({
            inventoryId: null,
            isNew: true,
            isEstampado: false,
            code: '',
            name: `${it.garmentType || 'Prenda'} Lisa - ${it.color || 'Estándar'} Talla ${it.size || 'L'}`,
            garmentType: it.garmentType || 'Polera',
            color: it.color || 'Negro',
            size: it.size || 'L',
            supplierId: '',
            supplierName: '',
            quantityNeeded: verif.faltante,
            unitCost,
            subtotal: verif.faltante * unitCost
          });
        }
      }

      // Spec 020/026: Considerar compra del estampado para cada unidad (omitir si es "Ninguno" con costo $0)
      if (opciones && opciones.incluirEstampados) {
        const qty = Math.max(0, Number(it.quantity) || 0);
        const opEstampado = normalizarOpcionEstampado(it.printLocation || 'Adelante');
        if (qty > 0 && opEstampado.id !== 'Ninguno' && opEstampado.costoCompra > 0) {
          totalEstampadosFaltantes += qty;
          const tecnica = it.technique || 'DTF';
          const unitCost = opEstampado.costoCompra;
          const subtotal = qty * unitCost;

          // Buscar si existe en inventario
          const itemInvEstampado = inventario.find(inv => {
            const n = normalizarTexto(inv.name || '');
            const c = normalizarTexto(inv.category || '');
            const matchTec = n.includes(normalizarTexto(tecnica)) || c.includes(normalizarTexto(tecnica));
            const matchUbi = n.includes(normalizarTexto(opEstampado.nombre));
            return (inv.garmentType === 'Estampado' || c.includes('estampado') || c.includes('dtf')) && matchTec && matchUbi;
          });

          faltantesParaCompra.push({
            inventoryId: itemInvEstampado ? itemInvEstampado.id : null,
            isNew: !itemInvEstampado,
            isEstampado: true,
            code: itemInvEstampado ? itemInvEstampado.code : `EST-${tecnica.toUpperCase().slice(0, 3)}-${opEstampado.nombre.toUpperCase().slice(0, 3)}`,
            name: `Estampado ${tecnica} - ${opEstampado.nombre}`,
            garmentType: 'Estampado',
            color: 'Full Color',
            size: opEstampado.nombre,
            technique: tecnica,
            printLocation: opEstampado.nombre,
            supplierId: itemInvEstampado ? (itemInvEstampado.supplierId || '') : '',
            supplierName: itemInvEstampado ? (itemInvEstampado.supplierName || 'Proveedor de Insumos') : 'Proveedor Insumos DTF',
            quantityNeeded: qty,
            unitCost,
            subtotal
          });
        }
      }
    });

    const tieneFaltantes = totalPrendasFaltantes > 0 || (Boolean(opciones && opciones.incluirEstampados) && totalEstampadosFaltantes > 0);

    return {
      tieneFaltantes,
      totalPrendasFaltantes,
      totalEstampadosFaltantes,
      detalle,
      faltantesParaCompra
    };
  }

  /**
   * Spec 004 — Descuenta del inventario físico las prendas usadas en un pedido
   */
  function descontarInventarioPorPedido(inventario = [], itemsPedido = []) {
    if (!Array.isArray(inventario)) inventario = [];
    if (!Array.isArray(itemsPedido)) itemsPedido = [];

    const descontados = [];
    const noEncontrados = [];
    const nuevoInventario = inventario.map(item => ({ ...item }));

    itemsPedido.forEach(it => {
      const prendaBuscada = normalizarTexto(it.garmentType);
      const colorBuscado = normalizarTexto(it.color);
      const tallaBuscada = normalizarTexto(it.size);
      const cantidad = Math.max(0, Number(it.quantity) || 0);

      const invItem = nuevoInventario.find(inv => {
        const matchPrenda = normalizarTexto(inv.garmentType) === prendaBuscada || normalizarTexto(inv.name).includes(prendaBuscada);
        const matchColor = normalizarTexto(inv.color) === colorBuscado || normalizarTexto(inv.name).includes(colorBuscado);
        const matchTalla = normalizarTexto(inv.size) === tallaBuscada || normalizarTexto(inv.name).includes(tallaBuscada);
        return matchPrenda && matchColor && matchTalla;
      });

      if (invItem) {
        const stockAnterior = Math.max(0, Number(invItem.currentStock) || 0);
        const nuevoStock = Math.max(0, stockAnterior - cantidad);
        const cantidadDescontada = stockAnterior - nuevoStock;
        invItem.currentStock = nuevoStock;
        descontados.push({
          id: invItem.id,
          code: invItem.code,
          name: invItem.name,
          stockAnterior,
          cantidadDescontada,
          nuevoStock
        });
      } else {
        noEncontrados.push(it);
      }
    });

    return {
      nuevoInventario,
      descontados,
      noEncontrados
    };
  }

  /**
   * Spec 021: Clasifica un ítem de compra como 'textil' (Poleras/prendas lisas)
   * o 'dtf' (Estampados DTF/insumos de estampado).
   */
  function clasificarItemCompra(item, inventario = []) {
    if (!item) return 'textil';
    const normalizar = (txt) => (txt || '').toString().toLowerCase().trim();

    const invId = item.inventoryItemId || item.inventoryId || item.id;
    let invItem = null;
    if (invId && Array.isArray(inventario)) {
      invItem = inventario.find(i => i.id === invId || i.code === invId);
    }

    if (!invItem && item.name && Array.isArray(inventario)) {
      const nomItem = normalizar(item.name);
      invItem = inventario.find(i => normalizar(i.name) === nomItem);
    }

    const cat = normalizar(invItem ? invItem.category : (item.category || ''));
    const gType = normalizar(invItem ? invItem.garmentType : (item.garmentType || ''));
    const nombre = normalizar(item.name || (invItem ? invItem.name : ''));

    const esDtf = cat.includes('dtf') ||
                  cat.includes('estampado') ||
                  gType === 'estampado' ||
                  nombre.includes('dtf') ||
                  nombre.includes('estampado') ||
                  nombre.includes('transfer') ||
                  nombre.includes('poliamida') ||
                  nombre.includes('pelicula') ||
                  nombre.includes('película') ||
                  Boolean(item.isEstampado);

    if (esDtf) {
      return 'dtf';
    }

    return 'textil';
  }

  /**
   * Spec 021: Determina si una lista de ítems contiene tanto prendas textiles como estampados DTF.
   */
  function esCompraMixta(items = [], inventario = []) {
    if (!Array.isArray(items) || items.length < 2) return false;
    let tieneTextil = false;
    let tieneDtf = false;

    for (const it of items) {
      const tipo = clasificarItemCompra(it, inventario);
      if (tipo === 'textil') tieneTextil = true;
      if (tipo === 'dtf') tieneDtf = true;
      if (tieneTextil && tieneDtf) return true;
    }
    return false;
  }

  /**
   * Spec 021: Separa una lista de ítems de compra en dos listas:
   * itemsPoleras (textiles) e itemsDtf (estampados).
   */
  function separarItemsCompra(items = [], inventario = []) {
    const itemsPoleras = [];
    const itemsDtf = [];

    if (!Array.isArray(items)) {
      return { itemsPoleras, itemsDtf };
    }

    items.forEach(it => {
      const tipo = clasificarItemCompra(it, inventario);
      if (tipo === 'dtf') {
        itemsDtf.push(it);
      } else {
        itemsPoleras.push(it);
      }
    });

    return { itemsPoleras, itemsDtf };
  }

  /**
   * Spec 021: Resuelve el proveedor más adecuado según la categoría ('textil' o 'dtf').
   */
  function resolverProveedorParaCategoria(categoria, proveedores = []) {
    if (!Array.isArray(proveedores) || proveedores.length === 0) return null;
    const normalizar = (txt) => (txt || '').toString().toLowerCase().trim();
    const catBuscada = normalizar(categoria);

    if (catBuscada === 'dtf' || catBuscada.includes('dtf') || catBuscada.includes('estampado')) {
      const provDtf = proveedores.find(p => {
        const c = normalizar(p.category);
        const n = normalizar(p.name);
        return c.includes('dtf') || c.includes('insumo') || n.includes('dtf');
      });
      if (provDtf) return provDtf;
    } else {
      const provTextil = proveedores.find(p => {
        const c = normalizar(p.category);
        const n = normalizar(p.name);
        return c.includes('prenda') || c.includes('textil') || c.includes('lisa') || n.includes('textil') || n.includes('mayorista');
      });
      if (provTextil) return provTextil;
    }

    return proveedores[0] || null;
  }

  const modulo = {
    TASA_IVA_CHILE,
    evaluarEstadoStock,
    aplicarCompraAInventario,
    calcularTotalesCompra,
    calcularValorizacionInventario,
    filtrarInventario,
    filtrarProveedores,
    generarIdCompra,
    // Spec 003: Fabricación
    ETAPAS_FABRICACION,
    obtenerSiguienteEtapa,
    clasificarProyectosPorEtapa,
    crearProyectoDesdePedido,
    filtrarProyectosFabricacion,
    generarIdFabricacion,
    // Spec 004: Enlace Pedidos ➔ Inventario y Faltantes
    verificarDisponibilidadPrenda,
    calcularFaltantesPedido,
    descontarInventarioPorPedido,
    // Spec 020: Opciones y Compra de Estampados
    OPCIONES_ESTAMPADO,
    normalizarOpcionEstampado,
    obtenerCostoCompraEstampado,
    // Spec 021: Separación de compras Poleras y Estampados DTF
    clasificarItemCompra,
    esCompraMixta,
    separarItemsCompra,
    resolverProveedorParaCategoria
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = modulo;
  }
  global.NovaprintProduction = modulo;

})(typeof window !== 'undefined' ? window : globalThis);
