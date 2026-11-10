/**
 * assets/js/accounting.js — Módulo de Contabilidad para Novaprint
 * Gestiona el Plan de Cuentas, Balance General, Estado de Resultados (P&L),
 * Libro Diario y Métricas Financieras enlazadas con Pedidos, Compras, Inventario y Gastos.
 */

(function (global) {
  'use strict';

  // --- PLAN DE CUENTAS ESTÁNDAR ---
  const TIPOS_CUENTA = Object.freeze([
    'Activo',
    'Pasivo',
    'Capital',
    'Ingreso',
    'Egreso'
  ]);

  function normalizarTipoCuenta(tipo) {
    if (!tipo) return 'Activo';
    const t = tipo.toString().trim().toLowerCase();
    if (t.includes('activ')) return 'Activo';
    if (t.includes('pasiv')) return 'Pasivo';
    if (t.includes('capit') || t.includes('patrimon')) return 'Capital';
    if (t.includes('ingres')) return 'Ingreso';
    if (t.includes('egres') || t.includes('cost') || t.includes('gast')) return 'Egreso';
    return 'Activo';
  }

  const PLAN_CUENTAS_DEFECTO = Object.freeze([
    // 1. ACTIVOS
    { id: 'ACC-1101', codigo: '1101', nombre: 'Caja y Bancos (Disponible)', tipo: 'Activo', subtipo: 'Circulante', descripcion: 'Fondos en caja chica y cuentas bancarias del taller.', esSistema: true, activo: true },
    { id: 'ACC-1102', codigo: '1102', nombre: 'Cuentas por Cobrar Clientes', tipo: 'Activo', subtipo: 'Circulante', descripcion: 'Saldos pendientes de cobro por pedidos de poleras y confección.', esSistema: true, activo: true },
    { id: 'ACC-1103', codigo: '1103', nombre: 'Inventario de Existencias', tipo: 'Activo', subtipo: 'Circulante', descripcion: 'Prendas base lisas, insumos DTF, tintas y vinilos en bodega.', esSistema: true, activo: true },
    { id: 'ACC-1104', codigo: '1104', nombre: 'Crédito Fiscal IVA (Compras)', tipo: 'Activo', subtipo: 'Circulante', descripcion: 'IVA 19% soportado en facturas de compras de insumos.', esSistema: true, activo: true },
    { id: 'ACC-1201', codigo: '1201', nombre: 'Maquinaria y Equipos de Taller', tipo: 'Activo', subtipo: 'Fijo', descripcion: 'Estampadoras, hornos, plotters DTF y computadores.', esSistema: true, activo: true },

    // 2. PASIVOS
    { id: 'ACC-2101', codigo: '2101', nombre: 'Cuentas por Pagar Proveedores', tipo: 'Pasivo', subtipo: 'Circulante', descripcion: 'Obligaciones y compras a crédito con proveedores de textiles y DTF.', esSistema: true, activo: true },
    { id: 'ACC-2102', codigo: '2102', nombre: 'Débito Fiscal IVA (Ventas)', tipo: 'Pasivo', subtipo: 'Circulante', descripcion: 'IVA 19% recargado en boletas y facturas de clientes.', esSistema: true, activo: true },
    { id: 'ACC-2103', codigo: '2103', nombre: 'Otras Obligaciones por Pagar', tipo: 'Pasivo', subtipo: 'Circulante', descripcion: 'Retenciones previsionales, impuestos mensuales o préstamos cortos.', esSistema: true, activo: true },

    // 3. CAPITAL / PATRIMONIO
    { id: 'ACC-3101', codigo: '3101', nombre: 'Capital y Aportes de Taller', tipo: 'Capital', subtipo: 'Capital Social', descripcion: 'Capital inicial y aportes de los socios/dueños del taller.', esSistema: true, activo: true },
    { id: 'ACC-3201', codigo: '3201', nombre: 'Resultado del Ejercicio (Utilidad/Pérdida)', tipo: 'Capital', subtipo: 'Resultados', descripcion: 'Ganancia neta o pérdida acumulada en el período operacional.', esSistema: true, activo: true },

    // 4. INGRESOS
    { id: 'ACC-4101', codigo: '4101', nombre: 'Ventas de Poleras y Confección', tipo: 'Ingreso', subtipo: 'Operacional', descripcion: 'Ingresos por venta y confección de poleras estampadas.', esSistema: true, activo: true },
    { id: 'ACC-4102', codigo: '4102', nombre: 'Servicios de Estampado / Muestras', tipo: 'Ingreso', subtipo: 'Operacional', descripcion: 'Servicios de impresión DTF sobre prendas aportadas por clientes.', esSistema: true, activo: true },
    { id: 'ACC-4103', codigo: '4103', nombre: 'Ingresos por Despacho y Flete', tipo: 'Ingreso', subtipo: 'Operacional', descripcion: 'Cobros realizados a clientes por delivery o envíos.', esSistema: true, activo: true },
    { id: 'ACC-4104', codigo: '4104', nombre: 'Otros Ingresos del Negocio', tipo: 'Ingreso', subtipo: 'No Operacional', descripcion: 'Venta de retazos, mermas recicladas o ingresos extraordinarios.', esSistema: true, activo: true },

    // 5. EGRESOS (COSTOS Y GASTOS)
    { id: 'ACC-5101', codigo: '5101', nombre: 'Costo de Insumos y Prendas Base', tipo: 'Egreso', subtipo: 'Costo de Ventas', descripcion: 'Costo de adquisición de prendas lisas y transferencias DTF vendidas.', esSistema: true, activo: true },
    { id: 'ACC-5201', codigo: '5201', nombre: 'Arriendo de Taller', tipo: 'Egreso', subtipo: 'Operacional', descripcion: 'Arriendo del local o galpón de producción textil.', esSistema: true, activo: true },
    { id: 'ACC-5202', codigo: '5202', nombre: 'Electricidad y Servicios Básicos', tipo: 'Egreso', subtipo: 'Operacional', descripcion: 'Luz, agua, internet y consumos eléctricos de las prensas.', esSistema: true, activo: true },
    { id: 'ACC-5203', codigo: '5203', nombre: 'Mantenimiento de Maquinaria Textil', tipo: 'Egreso', subtipo: 'Operacional', descripcion: 'Repuestos, teflón, servicio técnico y lubricación de equipos.', esSistema: true, activo: true },
    { id: 'ACC-5204', codigo: '5204', nombre: 'Fletes y Despacho de Insumos', tipo: 'Egreso', subtipo: 'Operacional', descripcion: 'Gastos de despacho pagados a transportistas por compras.', esSistema: true, activo: true },
    { id: 'ACC-5205', codigo: '5205', nombre: 'Mermas y Pruebas de Calidad', tipo: 'Egreso', subtipo: 'Operacional', descripcion: 'Prendas defectuosas o insumos gastados en calibración.', esSistema: true, activo: true },
    { id: 'ACC-5206', codigo: '5206', nombre: 'Otros Gastos Operacionales', tipo: 'Egreso', subtipo: 'Operacional', descripcion: 'Insumos de oficina, embalaje y gastos menores de taller.', esSistema: true, activo: true }
  ]);

  function validarCuentaContable(cuenta, cuentasExistentes = []) {
    const errores = [];
    if (!cuenta) {
      return { valido: false, errores: ['Los datos de la cuenta son requeridos.'] };
    }

    const codigo = (cuenta.codigo || '').toString().trim();
    if (!codigo) {
      errores.push('El código contable es obligatorio (ej. 1105).');
    } else {
      const duplicado = (Array.isArray(cuentasExistentes) ? cuentasExistentes : []).find(
        c => c.codigo && c.codigo.toString().trim() === codigo && c.id !== cuenta.id
      );
      if (duplicado) {
        errores.push(`El código contable "${codigo}" ya está registrado para la cuenta "${duplicado.nombre}".`);
      }
    }

    const nombre = (cuenta.nombre || '').toString().trim();
    if (!nombre) {
      errores.push('El nombre de la cuenta es obligatorio.');
    }

    const tipoNorm = normalizarTipoCuenta(cuenta.tipo);
    if (!TIPOS_CUENTA.includes(tipoNorm)) {
      errores.push(`El tipo de cuenta debe ser uno de: ${TIPOS_CUENTA.join(', ')}.`);
    }

    return {
      valido: errores.length === 0,
      errores,
      cuentaNormalizada: {
        ...cuenta,
        codigo,
        nombre,
        tipo: tipoNorm,
        subtipo: (cuenta.subtipo || 'General').toString().trim(),
        descripcion: (cuenta.descripcion || '').toString().trim(),
        activo: cuenta.activo !== false
      }
    };
  }

  const CUENTAS_CONTABLES = Object.freeze({
    // 1. ACTIVOS
    CAJA_BANCOS: { codigo: '1101', nombre: 'Caja y Bancos (Disponible)', tipo: 'Activo', subtipo: 'Circulante' },
    CUENTAS_POR_COBRAR: { codigo: '1102', nombre: 'Cuentas por Cobrar Clientes', tipo: 'Activo', subtipo: 'Circulante' },
    INVENTARIO_BODEGA: { codigo: '1103', nombre: 'Inventario de Existencias', tipo: 'Activo', subtipo: 'Circulante' },
    IVA_CREDITO_FISCAL: { codigo: '1104', nombre: 'Crédito Fiscal IVA (Compras)', tipo: 'Activo', subtipo: 'Circulante' },
    ACTIVO_FIJO: { codigo: '1201', nombre: 'Maquinaria y Equipos de Taller', tipo: 'Activo', subtipo: 'Fijo' },

    // 2. PASIVOS
    CUENTAS_POR_PAGAR: { codigo: '2101', nombre: 'Cuentas por Pagar Proveedores', tipo: 'Pasivo', subtipo: 'Circulante' },
    IVA_DEBITO_FISCAL: { codigo: '2102', nombre: 'Débito Fiscal IVA (Ventas)', tipo: 'Pasivo', subtipo: 'Circulante' },
    OBLIGACIONES_TALLER: { codigo: '2103', nombre: 'Otras Obligaciones por Pagar', tipo: 'Pasivo', subtipo: 'Circulante' },

    // 3. PATRIMONIO
    CAPITAL_TALLER: { codigo: '3101', nombre: 'Capital y Aportes de Taller', tipo: 'Patrimonio', subtipo: 'Capital' },
    UTILIDAD_EJERCICIO: { codigo: '3201', nombre: 'Resultado del Ejercicio (Utilidad/Pérdida)', tipo: 'Patrimonio', subtipo: 'Resultados' },

    // 4. INGRESOS
    VENTAS_POLERAS: { codigo: '4101', nombre: 'Ventas de Poleras y Confección', tipo: 'Ingreso', subtipo: 'Operacional' },
    SERVICIOS_ESTAMPADO: { codigo: '4102', nombre: 'Servicios de Estampado / Muestras', tipo: 'Ingreso', subtipo: 'Operacional' },
    INGRESOS_DELIVERY: { codigo: '4103', nombre: 'Ingresos por Despacho y Flete', tipo: 'Ingreso', subtipo: 'Operacional' },
    OTROS_INGRESOS: { codigo: '4104', nombre: 'Otros Ingresos del Negocio', tipo: 'Ingreso', subtipo: 'No Operacional' },

    // 5. COSTOS Y GASTOS
    COSTO_INSUMOS: { codigo: '5101', nombre: 'Costo de Insumos y Prendas Base', tipo: 'Costo', subtipo: 'Costo de Ventas' },
    GASTO_ARRIENDO: { codigo: '5201', nombre: 'Arriendo de Taller', tipo: 'Gasto', subtipo: 'Operacional' },
    GASTO_SERVICIOS: { codigo: '5202', nombre: 'Electricidad y Servicios Básicos', tipo: 'Gasto', subtipo: 'Operacional' },
    GASTO_MANTENCION: { codigo: '5203', nombre: 'Mantenimiento de Maquinaria Textil', tipo: 'Gasto', subtipo: 'Operacional' },
    GASTO_FLETE_COMPRAS: { codigo: '5204', nombre: 'Fletes y Despacho de Insumos', tipo: 'Gasto', subtipo: 'Operacional' },
    GASTO_MERMAS: { codigo: '5205', nombre: 'Mermas y Pruebas de Calidad', tipo: 'Gasto', subtipo: 'Operacional' },
    OTROS_GASTOS: { codigo: '5206', nombre: 'Otros Gastos Operacionales', tipo: 'Gasto', subtipo: 'Operacional' }
  });

  const CATEGORIAS_GASTO = Object.freeze([
    { valor: 'Arriendo de Taller', codigo: '5201', label: '🏠 Arriendo de Taller' },
    { valor: 'Electricidad y Servicios', codigo: '5202', label: '⚡ Electricidad y Servicios Básicos' },
    { valor: 'Mantenimiento de Maquinaria', codigo: '5203', label: '🔧 Mantenimiento de Maquinaria Textil' },
    { valor: 'Fletes y Envíos', codigo: '5204', label: '🚚 Fletes y Despachos' },
    { valor: 'Mermas y Pruebas', codigo: '5205', label: '⚠️ Mermas y Pruebas de Calibración' },
    { valor: 'Otros Gastos', codigo: '5206', label: '📋 Otros Gastos Operacionales' }
  ]);

  /**
   * Extrae y normaliza los montos clave de un pedido textil considerando tanto
   * propiedades en la raíz del objeto como en la estructura anidada totals.
   */
  function normalizarMontosPedido(p) {
    if (!p) {
      return {
        subtotalItems: 0,
        descuento: 0,
        neto: 0,
        iva: 0,
        delivery: 0,
        total: 0,
        abono: 0,
        saldo: 0
      };
    }

    const items = Array.isArray(p.items) ? p.items : [];
    let subtotalItems = 0;
    items.forEach(it => {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.unitPrice) || 0;
      subtotalItems += (it.total != null ? Number(it.total) : qty * price);
    });

    const descuento = Number(p.volumeDiscountAmount) || (p.totals?.volumeDiscountAmount != null ? Number(p.totals.volumeDiscountAmount) : 0);
    const netoCalculado = Math.max(0, subtotalItems - descuento);
    const neto = p.netSubtotal != null ? Number(p.netSubtotal) : (p.totals?.netAmount != null ? Number(p.totals.netAmount) : (p.totals?.subtotalNeto != null ? Number(p.totals.subtotalNeto) : netoCalculado));

    const iva = Number(p.ivaAmount) || (p.totals?.ivaAmount != null ? Number(p.totals.ivaAmount) : 0);
    const delivery = Number(p.deliveryAmount) || (p.totals?.deliveryAmount != null ? Number(p.totals.deliveryAmount) : 0);

    const totalCalculado = neto + iva + delivery;
    const total = p.total != null ? Number(p.total) : (p.totals?.totalAmount != null ? Number(p.totals.totalAmount) : (subtotalItems > 0 ? totalCalculado : 0));

    const depositVal = p.deposit != null ? Number(p.deposit) : (p.totals?.depositAmount != null ? Number(p.totals.depositAmount) : 0);
    const deposit = Math.max(0, depositVal);
    const isEntregado = p.status === 'Entregado';

    // Si está entregado y sin abono registrado, o si el abono cubre el total, se considera cobrado
    const cobrado = (isEntregado && deposit === 0) ? total : Math.min(total, deposit);
    const balanceVal = p.balance != null ? Number(p.balance) : (p.totals?.balanceAmount != null ? Number(p.totals.balanceAmount) : Math.max(0, total - cobrado));
    const saldo = Math.max(0, balanceVal);

    return {
      subtotalItems,
      descuento,
      neto,
      iva,
      delivery,
      total,
      abono: cobrado,
      saldo
    };
  }

  /**
   * Genera los asientos contables detallados de un pedido al momento de registrarse.
   * Spec 019:
   * 1. El monto abonado va a la cuenta 1101 Caja y Bancos (Disponible).
   * 2. El saldo pendiente va a la cuenta 1102 Cuentas por Cobrar Clientes.
   * La contrapartida en el Haber se reconoce en 4101 Ventas de Poleras y Confección.
   */
  function generarAsientosPedido(p) {
    if (!p || p.status === 'Cancelado') return [];

    const m = normalizarMontosPedido(p);
    const fecha = p.date || p.dates?.deliveryDate || p.dates?.createdAt || p.createdAt || new Date().toISOString();
    const cliente = p.clientName || 'Cliente General';
    const pedidoId = p.id || 'S/N';
    const asientos = [];

    // 1. Asiento para el monto abonado (Caja y Bancos)
    if (m.abono > 0) {
      asientos.push({
        id: `AS-ORD-${pedidoId}-BANCO`,
        fecha,
        tipo: 'Ingreso',
        origen: 'Venta de Pedido (Abono)',
        subcuenta: 'Banco',
        referenciaId: pedidoId,
        concepto: `Abono Pedido — ${cliente} (${pedidoId})`,
        cuentaDebe: CUENTAS_CONTABLES.CAJA_BANCOS.nombre,
        debe: m.abono,
        cuentaHaber: CUENTAS_CONTABLES.VENTAS_POLERAS.nombre,
        haber: m.abono,
        detalle: {
          total: m.total,
          abono: m.abono,
          saldo: m.saldo,
          neto: m.neto,
          iva: m.iva,
          delivery: m.delivery
        }
      });
    }

    // 2. Asiento para el saldo pendiente (Cuentas por Cobrar)
    if (m.saldo > 0) {
      asientos.push({
        id: `AS-ORD-${pedidoId}-CXC`,
        fecha,
        tipo: 'Ingreso',
        origen: 'Venta de Pedido (Crédito)',
        subcuenta: 'Cuentas por Cobrar',
        referenciaId: pedidoId,
        concepto: `Saldo Pendiente Pedido — ${cliente} (${pedidoId})`,
        cuentaDebe: CUENTAS_CONTABLES.CUENTAS_POR_COBRAR.nombre,
        debe: m.saldo,
        cuentaHaber: CUENTAS_CONTABLES.VENTAS_POLERAS.nombre,
        haber: m.saldo,
        detalle: {
          total: m.total,
          abono: m.abono,
          saldo: m.saldo,
          neto: m.neto,
          iva: m.iva,
          delivery: m.delivery
        }
      });
    }

    // Caso borde: Pedido promocional $0 (ambos son 0)
    if (asientos.length === 0 && m.total === 0) {
      asientos.push({
        id: `AS-ORD-${pedidoId}`,
        fecha,
        tipo: 'Ingreso',
        origen: 'Venta de Pedido ($0)',
        subcuenta: 'Banco',
        referenciaId: pedidoId,
        concepto: `Venta Promocional $0 — ${cliente} (${pedidoId})`,
        cuentaDebe: CUENTAS_CONTABLES.CAJA_BANCOS.nombre,
        debe: 0,
        cuentaHaber: CUENTAS_CONTABLES.VENTAS_POLERAS.nombre,
        haber: 0,
        detalle: { total: 0, abono: 0, saldo: 0 }
      });
    }

    return asientos;
  }

  /**
   * Consolida métricas de pedidos enlazadas a cobranza, facturación y cuentas por cobrar.
   */
  function obtenerConsolidadoPedidos(pedidos = []) {
    const validos = (Array.isArray(pedidos) ? pedidos : []).filter(p => p && p.status !== 'Cancelado');

    let totalBruto = 0;
    let totalDescuentos = 0;
    let totalNeto = 0;
    let totalIva = 0;
    let totalDelivery = 0;
    let totalFacturado = 0;
    let totalCobradoEfectivo = 0;
    let totalCuentasPorCobrar = 0;

    validos.forEach(p => {
      const m = normalizarMontosPedido(p);
      totalBruto += m.subtotalItems;
      totalDescuentos += m.descuento;
      totalNeto += m.neto;
      totalIva += m.iva;
      totalDelivery += m.delivery;
      totalFacturado += m.total;
      totalCobradoEfectivo += m.abono;
      totalCuentasPorCobrar += m.saldo;
    });

    return {
      pedidosCount: validos.length,
      totalBruto,
      totalDescuentos,
      totalNetoVentas: totalNeto,
      totalIvaDebito: totalIva,
      totalDeliveryVentas: totalDelivery,
      totalFacturado,
      totalCobradoEfectivo,
      totalCuentasPorCobrar
    };
  }

  /**
   * Consolida costos y pagos de compras a proveedores de insumos y prendas.
   */
  function obtenerConsolidadoCompras(compras = []) {
    const list = Array.isArray(compras) ? compras : [];

    let totalSubtotalNeto = 0;
    let totalIvaCredito = 0;
    let totalDeliveryCompras = 0;
    let totalPagadoCompras = 0;

    list.forEach(c => {
      const subtotal = Number(c.subtotalNeto) || 0;
      const iva = Number(c.ivaAmount) || 0;
      const delivery = Number(c.deliveryAmount) || 0;
      const total = Number(c.totalAmount) || (subtotal + iva + delivery);

      totalSubtotalNeto += subtotal;
      totalIvaCredito += iva;
      totalDeliveryCompras += delivery;
      totalPagadoCompras += total;
    });

    return {
      comprasCount: list.length,
      totalSubtotalNeto,
      totalIvaCredito,
      totalDeliveryCompras,
      totalPagadoCompras
    };
  }

  /**
   * Valoriza el stock físico actual de bodega.
   */
  function obtenerValorizacionInventario(inventario = []) {
    const list = Array.isArray(inventario) ? inventario : [];

    let valorTotal = 0;
    let totalUnidades = 0;

    list.forEach(it => {
      const stock = Math.max(0, Number(it.currentStock) || 0);
      const cost = Math.max(0, Number(it.unitCost) || 0);
      valorTotal += (stock * cost);
      totalUnidades += stock;
    });

    return {
      articulosCount: list.length,
      totalUnidades,
      valorInventario: valorTotal
    };
  }

  /**
   * Consolida gastos operacionales manuales del taller.
   */
  function obtenerConsolidadoGastos(gastos = []) {
    const list = Array.isArray(gastos) ? gastos : [];

    let totalGastos = 0;
    const desglosePorCategoria = {};

    list.forEach(g => {
      const monto = Math.max(0, Number(g.amount) || 0);
      const cat = g.category || 'Otros Gastos';
      totalGastos += monto;
      desglosePorCategoria[cat] = (desglosePorCategoria[cat] || 0) + monto;
    });

    return {
      gastosCount: list.length,
      totalGastos,
      desglosePorCategoria
    };
  }

  /**
   * Genera el Estado de Resultados (P&L) consolidando ingresos por venta de poleras,
   * costos de insumos y gastos operacionales.
   */
  function calcularEstadoResultados(pedidos = [], compras = [], gastos = []) {
    const v = obtenerConsolidadoPedidos(pedidos);
    const c = obtenerConsolidadoCompras(compras);
    const g = obtenerConsolidadoGastos(gastos);

    // 1. Ingresos Operacionales
    const ingresosVentasPrendas = v.totalNetoVentas;
    const ingresosDelivery = v.totalDeliveryVentas;
    const totalIngresosOperacionales = ingresosVentasPrendas + ingresosDelivery;

    // 2. Costos de Ventas (Compras de insumos netas)
    const costoInsumos = c.totalSubtotalNeto;
    const margenBruto = totalIngresosOperacionales - costoInsumos;
    const margenBrutoPorcentaje = totalIngresosOperacionales > 0
      ? (margenBruto / totalIngresosOperacionales) * 100
      : 0;

    // 3. Gastos Operacionales
    const gastosFletesCompras = c.totalDeliveryCompras;
    const gastosGeneralesTaller = g.totalGastos;
    const totalGastosOperacionales = gastosFletesCompras + gastosGeneralesTaller;

    // 4. Resultado Operacional Neto
    const utilidadNeta = margenBruto - totalGastosOperacionales;
    const margenNetoPorcentaje = totalIngresosOperacionales > 0
      ? (utilidadNeta / totalIngresosOperacionales) * 100
      : 0;

    return {
      ingresos: {
        ventasPrendas: ingresosVentasPrendas,
        delivery: ingresosDelivery,
        total: totalIngresosOperacionales,
        descuentosVolumen: v.totalDescuentos
      },
      costos: {
        insumosTextiles: costoInsumos,
        margenBruto,
        margenBrutoPorcentaje
      },
      gastos: {
        fletesProveedores: gastosFletesCompras,
        gastosTaller: gastosGeneralesTaller,
        desgloseCategorias: g.desglosePorCategoria,
        total: totalGastosOperacionales
      },
      utilidadNeta,
      margenNetoPorcentaje
    };
  }

  /**
   * Genera el Balance General clasificando Activos, Pasivos y Patrimonio.
   * Garantiza la ecuación contable: Activo = Pasivo + Patrimonio.
   */
  function calcularBalanceGeneral(pedidos = [], compras = [], inventario = [], gastos = [], settings = {}) {
    const v = obtenerConsolidadoPedidos(pedidos);
    const c = obtenerConsolidadoCompras(compras);
    const inv = obtenerValorizacionInventario(inventario);
    const g = obtenerConsolidadoGastos(gastos);
    const pnl = calcularEstadoResultados(pedidos, compras, gastos);

    // Caja y Bancos = Cobros en efectivo - Pagos de compras - Gastos pagados
    const capitalInicial = Number(settings.initialCapital) || 0;
    const ingresosCaja = v.totalCobradoEfectivo;
    const egresosCaja = c.totalPagadoCompras + g.totalGastos;
    const saldoCajaDisponible = capitalInicial + ingresosCaja - egresosCaja;

    // 1. ACTIVOS
    const activoCaja = saldoCajaDisponible;
    const activoCuentasPorCobrar = v.totalCuentasPorCobrar;
    const activoInventario = inv.valorInventario;
    const activoCreditoIva = c.totalIvaCredito;

    const totalActivoCirculante = activoCaja + activoCuentasPorCobrar + activoInventario + activoCreditoIva;
    const totalActivoFijo = Number(settings.fixedAssetsValue) || 0;
    const totalActivos = totalActivoCirculante + totalActivoFijo;

    // 2. PASIVOS
    const pasivoDebitoIva = v.totalIvaDebito;
    const pasivoCuentasPorPagar = 0; // Contado por defecto en microempresa
    const totalPasivos = pasivoDebitoIva + pasivoCuentasPorPagar;

    // IVA Neto: Débito Fiscal - Crédito Fiscal
    const ivaNeto = pasivoDebitoIva - activoCreditoIva;

    // 3. PATRIMONIO
    const utilidadEjercicio = pnl.utilidadNeta;
    // Capital Contable de Cierre que equilibra la ecuación patrimonial
    const capitalTrabajo = totalActivos - totalPasivos - utilidadEjercicio;
    const totalPatrimonio = capitalTrabajo + utilidadEjercicio;

    const cuadratura = Math.round(totalActivos - (totalPasivos + totalPatrimonio));

    return {
      activos: {
        circulante: {
          cajaBancos: activoCaja,
          cuentasPorCobrar: activoCuentasPorCobrar,
          inventarioBodega: activoInventario,
          creditoFiscalIva: activoCreditoIva,
          subtotal: totalActivoCirculante
        },
        fijo: {
          maquinariaEquipos: totalActivoFijo,
          subtotal: totalActivoFijo
        },
        total: totalActivos
      },
      pasivos: {
        circulante: {
          debitoFiscalIva: pasivoDebitoIva,
          cuentasPorPagar: pasivoCuentasPorPagar,
          subtotal: totalPasivos
        },
        ivaNetoPagar: ivaNeto,
        total: totalPasivos
      },
      patrimonio: {
        capital: capitalTrabajo,
        utilidadEjercicio: utilidadEjercicio,
        total: totalPatrimonio
      },
      balanceEquilibrado: cuadratura === 0,
      diferenciaCuadratura: cuadratura
    };
  }

  /**
   * Genera el Libro Diario de movimientos contables unificando
   * Ventas (pedidos), Compras de insumos y Gastos operacionales.
   */
  function generarLibroDiario(pedidos = [], compras = [], gastos = []) {
    const asientos = [];

    // 1. Asientos de Pedidos (Ventas de Poleras) — Spec 019: Abono a Banco y Saldo a Cuentas por Cobrar
    (Array.isArray(pedidos) ? pedidos : []).forEach(p => {
      if (!p || p.status === 'Cancelado') return;
      const asientosPedido = generarAsientosPedido(p);
      asientosPedido.forEach(a => asientos.push(a));
    });

    // 2. Asientos de Compras de Insumos
    (Array.isArray(compras) ? compras : []).forEach(c => {
      if (!c) return;

      const total = Number(c.totalAmount) || 0;
      const subtotal = Number(c.subtotalNeto) || total;
      const iva = Number(c.ivaAmount) || 0;
      const delivery = Number(c.deliveryAmount) || 0;

      asientos.push({
        id: `AS-PUR-${c.id}`,
        fecha: c.date || c.createdAt || new Date().toISOString(),
        tipo: 'Costo',
        origen: 'Compra de Insumos',
        referenciaId: c.id,
        concepto: `Compra insumos — ${c.supplierName || 'Proveedor'} (Factura: ${c.invoiceNumber || 'S/N'})`,
        cuentaDebe: CUENTAS_CONTABLES.COSTO_INSUMOS.nombre,
        debe: total,
        cuentaHaber: CUENTAS_CONTABLES.CAJA_BANCOS.nombre,
        haber: total,
        detalle: {
          subtotal,
          iva,
          delivery
        }
      });
    });

    // 3. Asientos de Gastos Operacionales Manuales
    (Array.isArray(gastos) ? gastos : []).forEach(g => {
      if (!g) return;

      const monto = Number(g.amount) || 0;

      asientos.push({
        id: `AS-EXP-${g.id}`,
        fecha: g.date || g.createdAt || new Date().toISOString(),
        tipo: 'Gasto',
        origen: 'Gasto Operacional',
        referenciaId: g.id,
        concepto: `${g.category || 'Gasto'} — ${g.description || 'Gasto de Taller'}`,
        cuentaDebe: g.accountName || g.category || CUENTAS_CONTABLES.OTROS_GASTOS.nombre,
        debe: monto,
        cuentaHaber: CUENTAS_CONTABLES.CAJA_BANCOS.nombre,
        haber: monto,
        detalle: {
          categoria: g.category,
          notas: g.notes
        }
      });
    });

    // Ordenar cronológicamente descendente
    asientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return asientos;
  }

  /**
   * Calcula el resumen de KPIs para las tarjetas superiores de la vista.
   */
  function calcularMetricasContables(pedidos = [], compras = [], inventario = [], gastos = [], settings = {}) {
    const bal = calcularBalanceGeneral(pedidos, compras, inventario, gastos, settings);
    const pnl = calcularEstadoResultados(pedidos, compras, gastos);

    return {
      totalActivos: bal.activos.total,
      totalPasivos: bal.pasivos.total,
      totalPatrimonio: bal.patrimonio.total,
      ingresosTotales: pnl.ingresos.total,
      utilidadNeta: pnl.utilidadNeta,
      margenNetoPorcentaje: pnl.margenNetoPorcentaje,
      saldoCaja: bal.activos.circulante.cajaBancos,
      cuentasPorCobrar: bal.activos.circulante.cuentasPorCobrar,
      valorInventario: bal.activos.circulante.inventarioBodega,
      ivaNetoPagar: bal.pasivos.ivaNetoPagar
    };
  }

  const accountingModule = {
    CUENTAS_CONTABLES,
    CATEGORIAS_GASTO,
    TIPOS_CUENTA,
    PLAN_CUENTAS_DEFECTO,
    normalizarTipoCuenta,
    validarCuentaContable,
    normalizarMontosPedido,
    generarAsientosPedido,
    obtenerConsolidadoPedidos,
    obtenerConsolidadoCompras,
    obtenerValorizacionInventario,
    obtenerConsolidadoGastos,
    calcularEstadoResultados,
    calcularBalanceGeneral,
    generarLibroDiario,
    calcularMetricasContables
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = accountingModule;
  }
  global.NovaprintAccounting = accountingModule;

})(typeof window !== 'undefined' ? window : global);
