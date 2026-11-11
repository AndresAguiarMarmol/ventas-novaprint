/**
 * assets/js/sales.js — Módulo de Lógica de Negocio de Ventas para Novaprint
 * Funciones puras para cálculos de ítems, totales, semáforos, búsquedas y WhatsApp.
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

  function formatearMoneda(monto, simbolo = '$') {
    const num = Number(monto);
    if (isNaN(num)) return `${simbolo}0`;
    const formateado = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${simbolo}${formateado}`;
  }

  function generarIdPedido(secuencia, fecha = new Date()) {
    const d = new Date(fecha);
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const sec = String(secuencia || 1).padStart(3, '0');
    return `NP-${año}${mes}${dia}-${sec}`;
  }

  function calcularSubtotalItem(cantidad, precioUnitario) {
    const cant = Number(cantidad);
    const precio = Number(precioUnitario);
    if (isNaN(cant) || isNaN(precio) || cant <= 0) {
      return 0;
    }
    return Math.round(cant * Math.max(0, precio));
  }

  // --- REGLAS DE NEGOCIO Y COTIZADOR TEXTIL (skill.md) ---
  const COSTOS_REFERENCIA = {
    prendasBase: {
      polera_algodon: 3500,
      polera_poliester: 2800,
      poleron: 11000,
      buzo: 12000,
      gorra: 3500,
      otro: 3500
    },
    recargoTallasEspeciales: 1200, // XXL, 3XL
    estampados: {
      logo_pequeno: 1500, // hasta 10x10 cm
      grande_a4: 3200,    // hasta A4 / 20x30 cm
      extra_grande_a3: 4800, // hasta A3 / 30x40 cm
      sublimacion_a4: 1800   // Sublimación A4 en poliéster blanco
    }
  };

  /**
   * Escala de descuentos por volumen según skill.md:
   * 1 a 5 un: 0% | 6 a 11 un: 5% | 12 a 24 un: 10% | 25 a 49 un: 15% | 50+ un: 20%
   */
  function calcularDescuentoVolumen(totalCantidad, subtotalBruto = 0) {
    const qty = Math.max(0, Number(totalCantidad) || 0);
    const sub = Math.max(0, Number(subtotalBruto) || 0);

    let porcentaje = 0;
    if (qty >= 50) {
      porcentaje = 20;
    } else if (qty >= 25) {
      porcentaje = 15;
    } else if (qty >= 12) {
      porcentaje = 10;
    } else if (qty >= 6) {
      porcentaje = 5;
    }

    const montoDescuento = Math.round((sub * porcentaje) / 100);
    const totalNeto = Math.max(0, sub - montoDescuento);

    return {
      porcentaje,
      montoDescuento,
      totalNeto
    };
  }

  /**
   * Valida compatibilidad técnica de estampado según color y tela (skill.md)
   */
  function validarCompatibilidadTecnica(prenda = {}) {
    const color = normalizarTexto(prenda.color);
    const tecnica = prenda.technique || '';
    const cantidad = Number(prenda.quantity) || 1;
    const material = normalizarTexto(prenda.material || '');

    const esColorClaro = ['blanco', 'crema', 'crudo', 'hueso'].includes(color);

    if (tecnica === 'Sublimación') {
      if (!esColorClaro) {
        return {
          valido: false,
          tipo: 'error',
          tecnicaSugerida: 'DTF',
          mensaje: 'La sublimación solo funciona en telas blancas o muy claras. Para prendas oscuras o de color debes usar DTF o Vinilo.'
        };
      }
      if (material && !material.includes('poliester') && !material.includes('sintetico')) {
        return {
          valido: false,
          tipo: 'advertencia',
          tecnicaSugerida: 'DTF',
          mensaje: 'La sublimación requiere tela de poliéster (≥70%). Si la prenda es 100% algodón, usa DTF.'
        };
      }
    }

    if (tecnica === 'Serigrafía' && cantidad < 30) {
      return {
        valido: false,
        tipo: 'advertencia',
        tecnicaSugerida: 'DTF',
        mensaje: `La serigrafía se recomienda para tirajes de 30+ unidades (tienes ${cantidad} un.) por el costo de matrices. Para pocas unidades se sugiere DTF.`
      };
    }

    return {
      valido: true,
      tipo: 'ok',
      mensaje: 'Técnica compatible con la prenda.'
    };
  }

  /**
   * Calcula el precio unitario de referencia según la tabla de costos de skill.md
   */
  function calcularPrecioSugeridoPrenda(item = {}) {
    const prenda = normalizarTexto(item.garmentType || 'Polera');
    const talla = (item.size || 'L').toUpperCase();
    const tecnica = item.technique || 'DTF';
    const ubicacion = normalizarTexto(item.printLocation || 'pecho');

    // Costo base de la prenda
    let costoBase = COSTOS_REFERENCIA.prendasBase.polera_algodon;
    if (prenda.includes('poleron')) costoBase = COSTOS_REFERENCIA.prendasBase.poleron;
    else if (prenda.includes('buzo')) costoBase = COSTOS_REFERENCIA.prendasBase.buzo;
    else if (prenda.includes('gorra')) costoBase = COSTOS_REFERENCIA.prendasBase.gorra;
    else if (tecnica === 'Sublimación') costoBase = COSTOS_REFERENCIA.prendasBase.polera_poliester;

    // Recargo por talla especial
    let recargoTalla = 0;
    if (['XXL', '3XL', 'XXXL'].includes(talla)) {
      recargoTalla = COSTOS_REFERENCIA.recargoTallasEspeciales;
    }

    // Costo de estampado (Spec 020/026: Opciones Ninguno ($0), Adelante, Atrás y Ambos)
    let costoEstampado = COSTOS_REFERENCIA.estampados.grande_a4;
    if (ubicacion === 'ninguno' || ubicacion.includes('ningun') || ubicacion.includes('sin estampado') || ubicacion === 'sin' || ubicacion === 'lisa' || ubicacion === 'liso' || ubicacion === 'no') {
      costoEstampado = 0;
    } else if (ubicacion === 'ambos' || ubicacion.includes('ambos') || ubicacion.includes('adelante y atras') || ubicacion.includes('pecho y espalda')) {
      costoEstampado = 5500;
    } else if (ubicacion === 'atras' || ubicacion.includes('atras') || ubicacion.includes('espalda') || ubicacion.includes('posterior')) {
      costoEstampado = 3500;
    } else if (ubicacion === 'adelante' || ubicacion.includes('adelante') || ubicacion.includes('frontal')) {
      costoEstampado = 3200;
    } else if (ubicacion.includes('logo') || ubicacion.includes('pequeno') || ubicacion.includes('manga') || ubicacion.includes('bolsillo')) {
      costoEstampado = COSTOS_REFERENCIA.estampados.logo_pequeno;
    } else if (ubicacion.includes('extra') || ubicacion.includes('a3') || ubicacion.includes('completo')) {
      costoEstampado = COSTOS_REFERENCIA.estampados.extra_grande_a3;
    } else if (tecnica === 'Sublimación') {
      costoEstampado = COSTOS_REFERENCIA.estampados.sublimacion_a4;
    }

    return costoBase + recargoTalla + costoEstampado;
  }

  const TASA_IVA_CHILE = 0.19;

  function calcularTotalesPedido(items = [], montoAbono = 0, opciones = {}) {
    let aplicarDescuentoVolumen = false;
    let aplicarIva = false;
    let montoDelivery = 0;

    if (typeof opciones === 'boolean') {
      aplicarDescuentoVolumen = opciones;
    } else if (opciones && typeof opciones === 'object') {
      aplicarDescuentoVolumen = Boolean(opciones.aplicarDescuentoVolumen);
      aplicarIva = Boolean(opciones.aplicarIva);
      montoDelivery = Math.max(0, Number(opciones.montoDelivery) || 0);
    }

    const applyIva = Boolean(aplicarIva);
    const ivaPercent = applyIva ? 19 : 0;
    const applyDelivery = montoDelivery > 0;
    const deliveryAmount = montoDelivery;
    const applyDiscount = Boolean(aplicarDescuentoVolumen);

    if (!Array.isArray(items) || items.length === 0) {
      const totalAmount = deliveryAmount;
      const abonoIngresado = Math.max(0, Number(montoAbono) || 0);
      const depositAmount = Math.min(totalAmount, abonoIngresado);
      const balanceAmount = Math.max(0, totalAmount - depositAmount);

      return {
        totalQuantity: 0,
        subtotalBruto: 0,
        applyDiscount,
        volumeDiscountPercent: 0,
        volumeDiscountAmount: 0,
        netAmount: 0,
        applyIva,
        ivaPercent,
        ivaAmount: 0,
        applyDelivery,
        deliveryAmount,
        totalAmount,
        depositAmount,
        balanceAmount,
        paymentStatus: totalAmount > 0 && depositAmount >= totalAmount ? 'Pagado Total' : (depositAmount > 0 ? 'Abonado' : 'Pendiente')
      };
    }

    let totalQuantity = 0;
    let subtotalBruto = 0;

    items.forEach(item => {
      const q = Math.max(0, Number(item.quantity) || 0);
      const p = Math.max(0, Number(item.unitPrice) || 0);
      totalQuantity += q;
      subtotalBruto += Math.round(q * p);
    });

    const desc = calcularDescuentoVolumen(totalQuantity, subtotalBruto);
    const volumeDiscountPercent = aplicarDescuentoVolumen ? desc.porcentaje : 0;
    const volumeDiscountAmount = aplicarDescuentoVolumen ? desc.montoDescuento : 0;
    const netAmount = subtotalBruto - volumeDiscountAmount;
    const ivaAmount = applyIva ? Math.round(netAmount * TASA_IVA_CHILE) : 0;
    const totalAmount = netAmount + ivaAmount + deliveryAmount;

    const abonoIngresado = Math.max(0, Number(montoAbono) || 0);
    const depositAmount = Math.min(totalAmount, abonoIngresado);
    const balanceAmount = Math.max(0, totalAmount - depositAmount);

    let paymentStatus = 'Pendiente';
    if (totalAmount > 0) {
      if (depositAmount >= totalAmount) {
        paymentStatus = 'Pagado Total';
      } else if (depositAmount > 0) {
        paymentStatus = 'Abonado';
      }
    }

    return {
      totalQuantity,
      subtotalBruto,
      applyDiscount,
      volumeDiscountPercent,
      volumeDiscountAmount,
      netAmount,
      applyIva,
      ivaPercent,
      ivaAmount,
      applyDelivery,
      deliveryAmount,
      totalAmount,
      depositAmount,
      balanceAmount,
      paymentStatus
    };
  }

  function clasificarPedidoPorUrgencia(fechaEntrega, estadoPedido, hoy = new Date()) {
    if (estadoPedido === 'Entregado' || estadoPedido === 'Cancelado') {
      return 'finalizado';
    }

    if (!fechaEntrega) return 'proximos';

    const [año, mes, dia] = fechaEntrega.split('-').map(Number);
    if (!año || !mes || !dia) return 'proximos';

    const fechaObj = new Date(año, mes - 1, dia, 23, 59, 59);
    const hoyObj = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);

    const diferenciaMs = fechaObj.getTime() - hoyObj.getTime();
    const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diferenciaDias < 0) {
      return 'atrasado';
    } else if (diferenciaDias <= 1) {
      return 'urgente_hoy';
    } else if (diferenciaDias <= 7) {
      return 'esta_semana';
    } else {
      return 'proximos';
    }
  }

  function ordenarPedidosPorUrgencia(pedidos = [], hoy = new Date()) {
    const ordenPesos = {
      atrasado: 1,
      urgente_hoy: 2,
      esta_semana: 3,
      proximos: 4,
      finalizado: 5
    };

    return [...pedidos].sort((a, b) => {
      const urgA = clasificarPedidoPorUrgencia(a.dates?.deliveryDate, a.status, hoy);
      const urgB = clasificarPedidoPorUrgencia(b.dates?.deliveryDate, b.status, hoy);

      if (ordenPesos[urgA] !== ordenPesos[urgB]) {
        return ordenPesos[urgA] - ordenPesos[urgB];
      }

      const fechaA = a.dates?.deliveryDate || '9999-12-31';
      const fechaB = b.dates?.deliveryDate || '9999-12-31';
      return fechaA.localeCompare(fechaB);
    });
  }

  function filtrarPedidos(pedidos = [], { textoBusqueda = '', estadoFiltro = 'todos', clienteId = null, soloConSaldo = false } = {}) {
    const query = normalizarTexto(textoBusqueda);

    return pedidos.filter(p => {
      if (clienteId && p.clientId !== clienteId) {
        return false;
      }

      // Spec 009: Soporte de filtro por saldo pendiente de cobro
      if (estadoFiltro === 'con_saldo' || estadoFiltro === 'saldo_pendiente' || soloConSaldo) {
        const saldo = Number(p.totals?.balanceAmount) || 0;
        if (saldo <= 0 || p.status === 'Cancelado') {
          return false;
        }
      } else if (estadoFiltro && estadoFiltro !== 'todos' && p.status !== estadoFiltro) {
        return false;
      }

      if (!query) return true;

      const coincideId = normalizarTexto(p.id).includes(query);
      const coincideCliente = normalizarTexto(p.clientName).includes(query);
      const coincideTelefono = normalizarTexto(p.clientPhone).includes(query);
      
      const coincideItems = Array.isArray(p.items) && p.items.some(item => {
        return (
          normalizarTexto(item.garmentType).includes(query) ||
          normalizarTexto(item.technique).includes(query) ||
          normalizarTexto(item.color).includes(query) ||
          normalizarTexto(item.printLocation).includes(query)
        );
      });

      return coincideId || coincideCliente || coincideTelefono || coincideItems;
    });
  }

  function filtrarClientes(clientes = [], textoBusqueda = '') {
    const query = normalizarTexto(textoBusqueda);
    if (!query) return [...clientes];

    return clientes.filter(c => {
      return (
        normalizarTexto(c.name).includes(query) ||
        normalizarTexto(c.phone).includes(query) ||
        normalizarTexto(c.rut).includes(query) ||
        normalizarTexto(c.email).includes(query)
      );
    });
  }

  function generarTextoWhatsApp(pedido, settings = {}) {
    const empresa = settings.businessName || 'Novaprint Estampados';
    const total = formatearMoneda(pedido.totals?.totalAmount || 0);
    const abono = formatearMoneda(pedido.totals?.depositAmount || 0);
    const saldo = formatearMoneda(pedido.totals?.balanceAmount || 0);
    const fecha = pedido.dates?.deliveryDate || 'A coordinar';

    let itemsTexto = '';
    if (Array.isArray(pedido.items)) {
      itemsTexto = pedido.items.map(it => 
        `• ${it.quantity}x ${it.garmentType} (${it.size}, ${it.color}) - ${it.technique} [${it.printLocation || 'Pecho'}]`
      ).join('\n');
    }

    let descuentoTexto = '';
    if (pedido.totals?.volumeDiscountAmount > 0) {
      descuentoTexto = `🎁 *Descuento por volumen (${pedido.totals.volumeDiscountPercent}%):* -${formatearMoneda(pedido.totals.volumeDiscountAmount)}\n`;
    }

    let ivaTexto = '';
    if (pedido.totals?.ivaAmount > 0) {
      ivaTexto = `🏛️ *IVA (19%):* +${formatearMoneda(pedido.totals.ivaAmount)}\n`;
    }

    let deliveryTexto = '';
    if (pedido.totals?.deliveryAmount > 0) {
      deliveryTexto = `🚚 *Delivery / Envío:* +${formatearMoneda(pedido.totals.deliveryAmount)}\n`;
    }

    return (
      `👕 *${empresa}* — Comprobante de Pedido\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *Pedido:* ${pedido.id}\n` +
      `👤 *Cliente:* ${pedido.clientName}\n` +
      `📅 *Entrega estimada:* ${fecha}\n` +
      `⚡ *Estado:* ${pedido.status}\n\n` +
      `📦 *Detalle de prendas:*\n${itemsTexto}\n\n` +
      descuentoTexto +
      ivaTexto +
      deliveryTexto +
      `💰 *Total:* ${total}\n` +
      `💵 *Abonado:* ${abono}\n` +
      `⏳ *Saldo pendiente:* ${saldo}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `¡Muchas gracias por preferirnos!`
    );
  }

  function generarCotizacionEstructurada(solicitud = {}, secuencia = 1) {
    const d = new Date();
    const fecha = d.toISOString().split('T')[0];
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const cotizacion_id = `COT-${año}${mes}${dia}-${String(secuencia).padStart(3, '0')}`;

    const items = solicitud.prendas || [];
    let total_unidades = 0;
    let subtotal_bruto = 0;
    const observaciones_tecnicas = [];

    const resumen_prendas = items.map(p => {
      const cant = Number(p.quantity || p.cantidad) || 1;
      total_unidades += cant;
      const precioUnit = calcularPrecioSugeridoPrenda(p);
      const subtotalLinea = cant * precioUnit;
      subtotal_bruto += subtotalLinea;

      const comp = validarCompatibilidadTecnica(p);
      if (!comp.valido) {
        observaciones_tecnicas.push(`${p.garmentType || 'Prenda'} ${p.color || ''}: ${comp.mensaje}`);
      }

      return {
        tipo_prenda: p.garmentType || 'Polera',
        color: p.color || 'Negro',
        material_sugerido: p.material || (p.technique === 'Sublimación' ? 'poliester' : 'algodon'),
        desglose_tallas: p.desglose_tallas || { [p.size || 'L']: cant },
        tecnica_estampado: p.technique || 'DTF',
        posiciones_estampado: [
          {
            ubicacion: p.printLocation || 'pecho_centro',
            tamano: p.tamano || 'A4',
            costo_unitario_estampado: 3200
          }
        ],
        costo_base_prenda: p.technique === 'Sublimación' ? 2800 : 3500,
        costo_unitario_promedio: precioUnit,
        subtotal_linea: subtotalLinea
      };
    });

    const desc = calcularDescuentoVolumen(total_unidades, subtotal_bruto);

    return {
      cotizacion_id,
      cliente: solicitud.cliente || null,
      fecha,
      total_unidades,
      resumen_prendas,
      calculo_financiero: {
        subtotal_bruto,
        porcentaje_descuento: desc.porcentaje,
        monto_descuento: desc.montoDescuento,
        total_neto: desc.totalNeto,
        moneda: 'CLP'
      },
      observaciones_tecnicas
    };
  }

  const COLORES_TEXTILES = [
    'Negro',
    'Blanco',
    'Gris Melange',
    'Gris Grafito',
    'Azul Marino',
    'Azul Rey',
    'Rojo',
    'Burdeo',
    'Verde Botella',
    'Verde Militar',
    'Amarillo',
    'Naranjo',
    'Celeste',
    'Rosado',
    'Beige',
    'Morado',
    'Otro'
  ];

  const TALLAS_TEXTILES = [
    '4', '6', '8', '10', '12', '14', '16', '18',
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'
  ];

  const TALLAS_GRUPOS = [
    { grupo: 'Niños', tallas: ['4', '6', '8', '10', '12', '14', '16', '18'] },
    { grupo: 'Adultos / Estándar', tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'] }
  ];

  const modulo = {
    TASA_IVA_CHILE,
    COLORES_TEXTILES,
    TALLAS_TEXTILES,
    TALLAS_GRUPOS,
    COSTOS_REFERENCIA,
    calcularDescuentoVolumen,
    validarCompatibilidadTecnica,
    calcularPrecioSugeridoPrenda,
    generarCotizacionEstructurada,
    normalizarTexto,
    formatearMoneda,
    generarIdPedido,
    calcularSubtotalItem,
    calcularTotalesPedido,
    clasificarPedidoPorUrgencia,
    ordenarPedidosPorUrgencia,
    filtrarPedidos,
    filtrarClientes,
    generarTextoWhatsApp
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = modulo;
  }
  global.NovaprintSales = modulo;

})(typeof window !== 'undefined' ? window : globalThis);

