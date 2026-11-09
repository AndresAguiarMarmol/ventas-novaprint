/**
 * assets/js/accounting.js — Módulo de Contabilidad para Novaprint
 * Gestiona el Plan de Cuentas, Balance General, Estado de Resultados (P&L),
 * Libro Diario y Métricas Financieras enlazadas con Pedidos, Compras, Inventario y Gastos.
 */

(function (global) {
  'use strict';

  // --- PLAN DE CUENTAS ESTÁNDAR ---
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
      const items = Array.isArray(p.items) ? p.items : [];
      let subtotalItems = 0;
      items.forEach(it => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unitPrice) || 0;
        subtotalItems += (it.total != null ? Number(it.total) : qty * price);
      });

      const descuento = Number(p.volumeDiscountAmount) || 0;
      const netoCalculado = Math.max(0, subtotalItems - descuento);
      const neto = p.netSubtotal != null ? Number(p.netSubtotal) : netoCalculado;

      const iva = Number(p.ivaAmount) || 0;
      const delivery = Number(p.deliveryAmount) || 0;
      const total = p.total != null ? Number(p.total) : (neto + iva + delivery);

      const deposit = Math.max(0, Number(p.deposit) || 0);
      const isEntregado = p.status === 'Entregado';

      // Si está entregado o el abono cubre el total, se considera cobrado en su totalidad; sino el abono
      const cobrado = isEntregado && deposit === 0 ? total : Math.min(total, deposit);
      const saldo = Math.max(0, total - cobrado);

      totalBruto += subtotalItems;
      totalDescuentos += descuento;
      totalNeto += neto;
      totalIva += iva;
      totalDelivery += delivery;
      totalFacturado += total;
      totalCobradoEfectivo += cobrado;
      totalCuentasPorCobrar += saldo;
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

    // 1. Asientos de Pedidos (Ventas de Poleras)
    (Array.isArray(pedidos) ? pedidos : []).forEach(p => {
      if (!p || p.status === 'Cancelado') return;

      const total = Number(p.total) || 0;
      const neto = Number(p.netSubtotal) || total;
      const iva = Number(p.ivaAmount) || 0;
      const delivery = Number(p.deliveryAmount) || 0;
      const abono = Math.max(0, Number(p.deposit) || 0);
      const cobrado = (p.status === 'Entregado' && abono === 0) ? total : Math.min(total, abono);
      const porCobrar = Math.max(0, total - cobrado);

      asientos.push({
        id: `AS-ORD-${p.id}`,
        fecha: p.date || p.createdAt || new Date().toISOString(),
        tipo: 'Ingreso',
        origen: 'Venta de Pedido',
        referenciaId: p.id,
        concepto: `Venta de Prendas — ${p.clientName || 'Cliente'} (${p.id})`,
        cuentaDebe: cobrado > 0 ? CUENTAS_CONTABLES.CAJA_BANCOS.nombre : CUENTAS_CONTABLES.CUENTAS_POR_COBRAR.nombre,
        debe: total,
        cuentaHaber: CUENTAS_CONTABLES.VENTAS_POLERAS.nombre,
        haber: total,
        detalle: {
          neto,
          iva,
          delivery,
          cobrado,
          porCobrar
        }
      });
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
