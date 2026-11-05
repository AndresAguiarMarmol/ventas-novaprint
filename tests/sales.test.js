const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const sales = require('../assets/js/sales.js');

describe('Spec 001 - Lógica de Negocio de Ventas (sales.js)', () => {

  describe('COLORES_TEXTILES', () => {
    it('provee una lista completa de colores comunes para poleras y prendas', () => {
      assert.ok(Array.isArray(sales.COLORES_TEXTILES));
      assert.ok(sales.COLORES_TEXTILES.length >= 10);
      assert.ok(sales.COLORES_TEXTILES.includes('Negro'));
      assert.ok(sales.COLORES_TEXTILES.includes('Blanco'));
      assert.ok(sales.COLORES_TEXTILES.includes('Azul Marino'));
      assert.ok(sales.COLORES_TEXTILES.includes('Rojo'));
      assert.ok(sales.COLORES_TEXTILES.includes('Gris Melange'));
    });
  });

  describe('calcularSubtotalItem', () => {
    it('calcula correctamente cantidad por precio unitario', () => {
      assert.equal(sales.calcularSubtotalItem(10, 7500), 75000);
      assert.equal(sales.calcularSubtotalItem(1, 15000), 15000);
    });

    it('retorna 0 si los valores son inválidos o negativos', () => {
      assert.equal(sales.calcularSubtotalItem(-5, 5000), 0);
      assert.equal(sales.calcularSubtotalItem(10, -200), 0);
      assert.equal(sales.calcularSubtotalItem(null, undefined), 0);
      assert.equal(sales.calcularSubtotalItem('abc', 100), 0);
    });
  });

  describe('calcularTotalesPedido', () => {
    const itemsPrueba = [
      { quantity: 10, unitPrice: 5000 },
      { quantity: 2, unitPrice: 12000 }
    ];

    it('calcula total de prendas y total monetario con abono cero', () => {
      const res = sales.calcularTotalesPedido(itemsPrueba, 0);
      assert.equal(res.totalQuantity, 12);
      assert.equal(res.totalAmount, 74000);
      assert.equal(res.depositAmount, 0);
      assert.equal(res.balanceAmount, 74000);
      assert.equal(res.paymentStatus, 'Pendiente');
    });

    it('calcula abono parcial y saldo pendiente', () => {
      const res = sales.calcularTotalesPedido(itemsPrueba, 30000);
      assert.equal(res.totalAmount, 74000);
      assert.equal(res.depositAmount, 30000);
      assert.equal(res.balanceAmount, 44000);
      assert.equal(res.paymentStatus, 'Abonado');
    });

    it('calcula pago total exacto', () => {
      const res = sales.calcularTotalesPedido(itemsPrueba, 74000);
      assert.equal(res.depositAmount, 74000);
      assert.equal(res.balanceAmount, 0);
      assert.equal(res.paymentStatus, 'Pagado Total');
    });

    it('ajusta el abono al total si el abono ingresado supera el monto total', () => {
      const res = sales.calcularTotalesPedido(itemsPrueba, 90000);
      assert.equal(res.depositAmount, 74000);
      assert.equal(res.balanceAmount, 0);
      assert.equal(res.paymentStatus, 'Pagado Total');
    });

    it('maneja listas vacías de items de forma segura', () => {
      const res = sales.calcularTotalesPedido([], 1000);
      assert.equal(res.totalQuantity, 0);
      assert.equal(res.totalAmount, 0);
      assert.equal(res.depositAmount, 0);
      assert.equal(res.balanceAmount, 0);
      assert.equal(res.paymentStatus, 'Pendiente');
    });

    it('aplica descuento por volumen correctamente según escala de skill.md si se activa', () => {
      // 12 unidades (docena) = 10% descuento
      const itemsDocena = [{ quantity: 12, unitPrice: 10000 }]; // bruto 120.000
      const resConDesc = sales.calcularTotalesPedido(itemsDocena, 0, true);
      assert.equal(resConDesc.subtotalBruto, 120000);
      assert.equal(resConDesc.volumeDiscountPercent, 10);
      assert.equal(resConDesc.volumeDiscountAmount, 12000);
      assert.equal(resConDesc.totalAmount, 108000); // 120.000 - 10%
    });

    it('calcula IVA del 19% según legislación chilena cuando aplicarIva es true', () => {
      const items = [{ quantity: 10, unitPrice: 10000 }]; // Subtotal: 100.000
      const res = sales.calcularTotalesPedido(items, 0, {
        aplicarDescuentoVolumen: false,
        aplicarIva: true,
        montoDelivery: 0
      });

      assert.equal(res.subtotalBruto, 100000);
      assert.equal(res.netAmount, 100000);
      assert.equal(res.applyIva, true);
      assert.equal(res.ivaPercent, 19);
      assert.equal(res.ivaAmount, 19000); // 19% de 100.000
      assert.equal(res.totalAmount, 119000);
      assert.equal(res.balanceAmount, 119000);
    });

    it('suma recargo de Delivery con valor por defecto 0', () => {
      const items = [{ quantity: 2, unitPrice: 5000 }]; // Subtotal: 10.000
      
      // Con delivery en 0
      const resCero = sales.calcularTotalesPedido(items, 0, {
        montoDelivery: 0
      });
      assert.equal(resCero.deliveryAmount, 0);
      assert.equal(resCero.applyDelivery, false);
      assert.equal(resCero.totalAmount, 10000);

      // Con delivery con monto
      const resConDelivery = sales.calcularTotalesPedido(items, 0, {
        aplicarIva: false,
        montoDelivery: 3500
      });
      assert.equal(resConDelivery.applyDelivery, true);
      assert.equal(resConDelivery.deliveryAmount, 3500);
      assert.equal(resConDelivery.totalAmount, 13500);
    });

    it('calcula correctamente la combinación de Descuento por Volumen + IVA 19% + Delivery', () => {
      // 12 prendas a $10.000 = $120.000 bruto
      // Descuento docena (10%) = -$12.000 => Neto = $108.000
      // IVA 19% de $108.000 = $20.520
      // Delivery = $4.000
      // Total = $108.000 + $20.520 + $4.000 = $132.520
      const items = [{ quantity: 12, unitPrice: 10000 }];
      const res = sales.calcularTotalesPedido(items, 50000, {
        aplicarDescuentoVolumen: true,
        aplicarIva: true,
        montoDelivery: 4000
      });

      assert.equal(res.subtotalBruto, 120000);
      assert.equal(res.volumeDiscountAmount, 12000);
      assert.equal(res.netAmount, 108000);
      assert.equal(res.applyIva, true);
      assert.equal(res.ivaAmount, 20520);
      assert.equal(res.applyDelivery, true);
      assert.equal(res.deliveryAmount, 4000);
      assert.equal(res.totalAmount, 132520);
      assert.equal(res.depositAmount, 50000);
      assert.equal(res.balanceAmount, 82520);
      assert.equal(res.paymentStatus, 'Abonado');
    });
  });

  describe('Skill Cotizador Textil (skill.md)', () => {
    describe('calcularDescuentoVolumen', () => {
      it('calcula 0% para 1-5 unidades', () => {
        assert.equal(sales.calcularDescuentoVolumen(5, 50000).porcentaje, 0);
        assert.equal(sales.calcularDescuentoVolumen(5, 50000).montoDescuento, 0);
      });

      it('calcula 5% para 6-11 unidades', () => {
        const d = sales.calcularDescuentoVolumen(8, 100000);
        assert.equal(d.porcentaje, 5);
        assert.equal(d.montoDescuento, 5000);
        assert.equal(d.totalNeto, 95000);
      });

      it('calcula 10% para 12-24 unidades (Docena)', () => {
        const d = sales.calcularDescuentoVolumen(15, 100000);
        assert.equal(d.porcentaje, 10);
        assert.equal(d.montoDescuento, 10000);
      });

      it('calcula 15% para 25-49 unidades', () => {
        const d = sales.calcularDescuentoVolumen(30, 200000);
        assert.equal(d.porcentaje, 15);
        assert.equal(d.montoDescuento, 30000);
      });

      it('calcula 20% para 50+ unidades', () => {
        const d = sales.calcularDescuentoVolumen(60, 300000);
        assert.equal(d.porcentaje, 20);
        assert.equal(d.montoDescuento, 60000);
      });
    });

    describe('validarCompatibilidadTecnica', () => {
      it('invalida sublimación sobre prendas oscuras o de color', () => {
        const res = sales.validarCompatibilidadTecnica({
          garmentType: 'Polera',
          color: 'Negro',
          technique: 'Sublimación'
        });
        assert.equal(res.valido, false);
        assert.equal(res.tecnicaSugerida, 'DTF');
      });

      it('permite sublimación sobre prendas blancas', () => {
        const res = sales.validarCompatibilidadTecnica({
          garmentType: 'Polera',
          color: 'Blanco',
          technique: 'Sublimación'
        });
        assert.equal(res.valido, true);
      });

      it('advierte sobre serigrafía para pedidos menores a 30 unidades', () => {
        const res = sales.validarCompatibilidadTecnica({
          garmentType: 'Polera',
          color: 'Negro',
          technique: 'Serigrafía',
          quantity: 10
        });
        assert.equal(res.valido, false);
        assert.equal(res.tecnicaSugerida, 'DTF');
      });
    });

    describe('calcularPrecioSugeridoPrenda', () => {
      it('calcula precio base de polera algodón + estampado grande A4', () => {
        // Polera algodón: 3500 + Estampado A4: 3200 = 6700
        const precio = sales.calcularPrecioSugeridoPrenda({
          garmentType: 'Polera',
          size: 'L',
          technique: 'DTF',
          printLocation: 'Pecho grande A4'
        });
        assert.equal(precio, 6700);
      });

      it('incluye recargo para tallas especiales XXL', () => {
        // Polera algodón: 3500 + Recargo XXL: 1200 + Estampado A4: 3200 = 7900
        const precio = sales.calcularPrecioSugeridoPrenda({
          garmentType: 'Polera',
          size: 'XXL',
          technique: 'DTF',
          printLocation: 'Pecho grande A4'
        });
        assert.equal(precio, 7900);
      });

      it('calcula polerón con estampado logo pecho', () => {
        // Polerón: 11000 + Logo pecho: 1500 = 12500
        const precio = sales.calcularPrecioSugeridoPrenda({
          garmentType: 'Polerón',
          size: 'M',
          technique: 'DTF',
          printLocation: 'Logo Pecho 10x10'
        });
        assert.equal(precio, 12500);
      });
    });
  });

  describe('clasificarPedidoPorUrgencia (Semáforo determinista)', () => {
    const hoy = new Date('2026-11-01T12:00:00.000Z');

    it('retorna "finalizado" para pedidos entregados o cancelados', () => {
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-10-20', 'Entregado', hoy), 'finalizado');
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-10-20', 'Cancelado', hoy), 'finalizado');
    });

    it('retorna "atrasado" si la fecha es anterior a hoy', () => {
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-10-31', 'En producción', hoy), 'atrasado');
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-10-25', 'Confirmado', hoy), 'atrasado');
    });

    it('retorna "urgente_hoy" si la fecha es hoy o mañana', () => {
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-11-01', 'En producción', hoy), 'urgente_hoy');
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-11-02', 'Confirmado', hoy), 'urgente_hoy');
    });

    it('retorna "esta_semana" si la fecha es dentro de los próximos 7 días', () => {
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-11-05', 'En producción', hoy), 'esta_semana');
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-11-07', 'Confirmado', hoy), 'esta_semana');
    });

    it('retorna "proximos" para fechas más allá de 7 días', () => {
      assert.equal(sales.clasificarPedidoPorUrgencia('2026-11-20', 'En producción', hoy), 'proximos');
    });
  });

  describe('filtrarPedidos y filtrarClientes', () => {
    const pedidos = [
      { id: 'NP-001', clientName: 'Juan Pérez', clientPhone: '+569111', status: 'En producción', items: [{ garmentType: 'Polera', technique: 'DTF' }] },
      { id: 'NP-002', clientName: 'María Soto', clientPhone: '+569222', status: 'Listo para entrega', items: [{ garmentType: 'Polerón', technique: 'Bordado' }] },
      { id: 'NP-003', clientName: 'Colegio Andes', clientPhone: '+569333', status: 'Entregado', items: [{ garmentType: 'Gorras', technique: 'Sublimación' }] }
    ];

    it('filtra por texto de cliente, teléfono o id ignorando mayúsculas y acentos', () => {
      const res1 = sales.filtrarPedidos(pedidos, { textoBusqueda: 'perez' });
      assert.equal(res1.length, 1);
      assert.equal(res1[0].id, 'NP-001');

      const res2 = sales.filtrarPedidos(pedidos, { textoBusqueda: '9222' });
      assert.equal(res2.length, 1);
      assert.equal(res2[0].id, 'NP-002');
    });

    it('filtra por prenda o técnica de estampado', () => {
      const res = sales.filtrarPedidos(pedidos, { textoBusqueda: 'poleron' });
      assert.equal(res.length, 1);
      assert.equal(res[0].id, 'NP-002');
    });

    it('filtra por estado', () => {
      const res = sales.filtrarPedidos(pedidos, { estadoFiltro: 'Listo para entrega' });
      assert.equal(res.length, 1);
      assert.equal(res[0].id, 'NP-002');
    });

    it('Spec 009: filtra pedidos con saldo por cobrar (con_saldo o soloConSaldo)', () => {
      const pedidosConSaldos = [
        { id: 'NP-1', clientName: 'Abonado 1', status: 'En producción', totals: { totalAmount: 50000, depositAmount: 25000, balanceAmount: 25000 } },
        { id: 'NP-2', clientName: 'Pagado Total', status: 'Listo para entrega', totals: { totalAmount: 30000, depositAmount: 30000, balanceAmount: 0 } },
        { id: 'NP-3', clientName: 'Pendiente 100%', status: 'Confirmado', totals: { totalAmount: 80000, depositAmount: 0, balanceAmount: 80000 } },
        { id: 'NP-4', clientName: 'Cancelado con saldo', status: 'Cancelado', totals: { totalAmount: 40000, depositAmount: 0, balanceAmount: 40000 } }
      ];

      const res1 = sales.filtrarPedidos(pedidosConSaldos, { estadoFiltro: 'con_saldo' });
      assert.equal(res1.length, 2);
      assert.equal(res1[0].id, 'NP-1');
      assert.equal(res1[1].id, 'NP-3');

      const res2 = sales.filtrarPedidos(pedidosConSaldos, { soloConSaldo: true, textoBusqueda: 'Abonado' });
      assert.equal(res2.length, 1);
      assert.equal(res2[0].id, 'NP-1');
    });

    const clientes = [
      { id: 'CLI-1', name: 'Andrés Eloy', phone: '+56944445555', rut: '18.123.456-7' },
      { id: 'CLI-2', name: 'Bárbara Muñoz', phone: '+56977778888', rut: '16.987.654-3' }
    ];

    it('filtra clientes por nombre insensible a tildes o RUT', () => {
      const res1 = sales.filtrarClientes(clientes, 'barbara');
      assert.equal(res1.length, 1);
      assert.equal(res1[0].id, 'CLI-2');

      const res2 = sales.filtrarClientes(clientes, '18.123');
      assert.equal(res2.length, 1);
      assert.equal(res2[0].id, 'CLI-1');
    });
  });

  describe('formatearMoneda y generarIdPedido', () => {
    it('formatea números con separador de miles y símbolo', () => {
      assert.equal(sales.formatearMoneda(15000), '$15.000');
      assert.equal(sales.formatearMoneda(0), '$0');
      assert.equal(sales.formatearMoneda(1250300, '$'), '$1.250.300');
    });

    it('genera ID secuencial legible con prefijo de fecha', () => {
      const fecha = new Date('2026-11-01T15:00:00Z');
      assert.equal(sales.generarIdPedido(1, fecha), 'NP-20261101-001');
      assert.equal(sales.generarIdPedido(45, fecha), 'NP-20261101-045');
    });
  });

  describe('generarTextoWhatsApp', () => {
    it('construye un mensaje con detalles clave del pedido y saldo', () => {
      const pedido = {
        id: 'NP-20261101-001',
        clientName: 'Juan Pérez',
        dates: { deliveryDate: '2026-11-05' },
        status: 'Confirmado',
        items: [
          { garmentType: 'Polera', color: 'Negro', size: 'M', technique: 'DTF', quantity: 5, unitPrice: 6500, subtotal: 32500 }
        ],
        totals: { totalAmount: 32500, depositAmount: 15000, balanceAmount: 17500, paymentStatus: 'Abonado' }
      };
      const settings = { businessName: 'Novaprint Estampados' };
      const texto = sales.generarTextoWhatsApp(pedido, settings);
      assert.ok(texto.includes('Novaprint Estampados'));
      assert.ok(texto.includes('NP-20261101-001'));
      assert.ok(texto.includes('Juan Pérez'));
      assert.ok(texto.includes('$32.500'));
      assert.ok(texto.includes('$17.500'));
    });
  });

  describe('Spec 007 - Tallas Infantiles y Catálogo de Tallas', () => {
    it('TALLAS_TEXTILES incluye todas las tallas de niños (4 a 18) y adultos', () => {
      assert.ok(Array.isArray(sales.TALLAS_TEXTILES));
      const tallasEsperadas = ['4', '6', '8', '10', '12', '14', '16', '18', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
      tallasEsperadas.forEach(t => {
        assert.ok(sales.TALLAS_TEXTILES.includes(t), `Debe contener la talla ${t}`);
      });
    });

    it('TALLAS_GRUPOS estructura los grupos Niños y Adultos / Estándar', () => {
      assert.ok(Array.isArray(sales.TALLAS_GRUPOS));
      assert.equal(sales.TALLAS_GRUPOS.length, 2);
      assert.equal(sales.TALLAS_GRUPOS[0].grupo, 'Niños');
      assert.deepEqual(sales.TALLAS_GRUPOS[0].tallas, ['4', '6', '8', '10', '12', '14', '16', '18']);
      assert.equal(sales.TALLAS_GRUPOS[1].grupo, 'Adultos / Estándar');
    });

    it('calcularPrecioSugeridoPrenda no aplica recargo a tallas infantiles', () => {
      const precioInfantil = sales.calcularPrecioSugeridoPrenda({
        garmentType: 'Polera',
        size: '10',
        technique: 'DTF',
        printLocation: 'Pecho grande A4'
      });
      // Base algodón 3500 + A4 3200 = 6700 (sin recargo de 1200)
      assert.equal(precioInfantil, 6700);
    });

    it('generarCotizacionEstructurada preserva la talla infantil en el desglose', () => {
      const cotizacion = sales.generarCotizacionEstructurada({
        cliente: { nombre: 'Colegio San José', telefono: '+56911112222' },
        prendas: [
          { garmentType: 'Polera', color: 'Azul Marino', size: '8', quantity: 20, unitPrice: 6500 }
        ]
      });
      assert.equal(cotizacion.resumen_prendas[0].desglose_tallas['8'], 20);
    });
  });

  describe('Spec 013 - Flexibilidad de Precios Libres y Descuentos por Volumen', () => {
    it('permite ingresar precios de $0 (promociones o regalos) sin bloquear el cálculo', () => {
      assert.equal(sales.calcularSubtotalItem(5, 0), 0);
      const itemsConGratis = [
        { quantity: 10, unitPrice: 5000 },
        { quantity: 2, unitPrice: 0 } // Prenda promocional gratis
      ];
      const res = sales.calcularTotalesPedido(itemsConGratis, 0, false);
      assert.equal(res.totalQuantity, 12);
      assert.equal(res.subtotalBruto, 50000);
      assert.equal(res.totalAmount, 50000);
    });

    it('permite cualquier precio arbitrario no múltiplo de 500 ni 100', () => {
      assert.equal(sales.calcularSubtotalItem(3, 1990), 5970);
      assert.equal(sales.calcularSubtotalItem(7, 3249), 22743);
      assert.equal(sales.calcularSubtotalItem(2, 450.75), 902);
    });

    it('evalúa con precisión todos los tramos de la escala de descuentos por volumen', () => {
      // Tramo 1: 1 a 5 unidades -> 0%
      const res1 = sales.calcularDescuentoVolumen(5, 50000);
      assert.equal(res1.porcentaje, 0);
      assert.equal(res1.montoDescuento, 0);
      assert.equal(res1.totalNeto, 50000);

      // Tramo 2: 6 a 11 unidades -> 5%
      const res2 = sales.calcularDescuentoVolumen(6, 60000);
      assert.equal(res2.porcentaje, 5);
      assert.equal(res2.montoDescuento, 3000);
      assert.equal(res2.totalNeto, 57000);

      const res2b = sales.calcularDescuentoVolumen(11, 110000);
      assert.equal(res2b.porcentaje, 5);
      assert.equal(res2b.montoDescuento, 5500);
      assert.equal(res2b.totalNeto, 104500);

      // Tramo 3: 12 a 24 unidades -> 10% (Docena)
      const res3 = sales.calcularDescuentoVolumen(12, 120000);
      assert.equal(res3.porcentaje, 10);
      assert.equal(res3.montoDescuento, 12000);
      assert.equal(res3.totalNeto, 108000);

      const res3b = sales.calcularDescuentoVolumen(24, 240000);
      assert.equal(res3b.porcentaje, 10);
      assert.equal(res3b.montoDescuento, 24000);
      assert.equal(res3b.totalNeto, 216000);

      // Tramo 4: 25 a 49 unidades -> 15% (Mayorista)
      const res4 = sales.calcularDescuentoVolumen(25, 250000);
      assert.equal(res4.porcentaje, 15);
      assert.equal(res4.montoDescuento, 37500);
      assert.equal(res4.totalNeto, 212500);

      const res4b = sales.calcularDescuentoVolumen(49, 490000);
      assert.equal(res4b.porcentaje, 15);
      assert.equal(res4b.montoDescuento, 73500);
      assert.equal(res4b.totalNeto, 416500);

      // Tramo 5: 50+ unidades -> 20% (Gran volumen)
      const res5 = sales.calcularDescuentoVolumen(50, 500000);
      assert.equal(res5.porcentaje, 20);
      assert.equal(res5.montoDescuento, 100000);
      assert.equal(res5.totalNeto, 400000);

      const res5b = sales.calcularDescuentoVolumen(120, 1200000);
      assert.equal(res5b.porcentaje, 20);
      assert.equal(res5b.montoDescuento, 240000);
      assert.equal(res5b.totalNeto, 960000);
    });

    it('calcula totales combinando precios arbitrarios, descuento por volumen, IVA y delivery', () => {
      const items = [
        { quantity: 30, unitPrice: 3330 } // 30 * 3330 = 99.900 (tramo 15% desc)
      ];
      const res = sales.calcularTotalesPedido(items, 0, {
        aplicarDescuentoVolumen: true,
        aplicarIva: true,
        montoDelivery: 4500
      });

      assert.equal(res.totalQuantity, 30);
      assert.equal(res.subtotalBruto, 99900);
      assert.equal(res.volumeDiscountPercent, 15);
      assert.equal(res.volumeDiscountAmount, 14985);
      assert.equal(res.netAmount, 84915); // 99900 - 14985
      assert.equal(res.ivaAmount, 16134); // Math.round(84915 * 0.19)
      assert.equal(res.deliveryAmount, 4500);
      assert.equal(res.totalAmount, 105549); // 84915 + 16134 + 4500
    });
  });

});

