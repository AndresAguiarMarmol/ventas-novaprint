const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const production = require('../assets/js/production.js');

describe('Spec 002 - Lógica de Producción, Inventario y Compras (production.js)', () => {

  describe('evaluarEstadoStock', () => {
    it('retorna "critico" si el stock actual es menor o igual al mínimo', () => {
      assert.equal(production.evaluarEstadoStock(5, 10), 'critico');
      assert.equal(production.evaluarEstadoStock(10, 10), 'critico');
      assert.equal(production.evaluarEstadoStock(0, 5), 'critico');
    });

    it('retorna "normal" si el stock actual supera el mínimo', () => {
      assert.equal(production.evaluarEstadoStock(11, 10), 'normal');
      assert.equal(production.evaluarEstadoStock(50, 20), 'normal');
    });
  });

  describe('aplicarCompraAInventario', () => {
    const inventarioInicial = [
      { id: 'INV-1', name: 'Polera Negra L', currentStock: 10, unitCost: 3000 },
      { id: 'INV-2', name: 'Bobina Film DTF', currentStock: 2, unitCost: 45000 }
    ];

    const itemsComprados = [
      { inventoryItemId: 'INV-1', quantity: 20, unitCost: 3200 },
      { inventoryItemId: 'INV-2', quantity: 3, unitCost: 45000 }
    ];

    it('incrementa exactamente las existencias de los ítems comprados', () => {
      const nuevoInventario = production.aplicarCompraAInventario(inventarioInicial, itemsComprados);
      const item1 = nuevoInventario.find(i => i.id === 'INV-1');
      const item2 = nuevoInventario.find(i => i.id === 'INV-2');

      assert.equal(item1.currentStock, 30);
      assert.equal(item2.currentStock, 5);
    });

    it('preserva los ítems que no fueron parte de la compra', () => {
      const nuevoInventario = production.aplicarCompraAInventario(inventarioInicial, [
        { inventoryItemId: 'INV-1', quantity: 5, unitCost: 3000 }
      ]);
      const item2 = nuevoInventario.find(i => i.id === 'INV-2');
      assert.equal(item2.currentStock, 2);
    });
  });

  describe('calcularValorizacionInventario', () => {
    const inventario = [
      { currentStock: 10, unitCost: 3000 }, // 30.000
      { currentStock: 2, unitCost: 50000 }, // 100.000
      { currentStock: 5, unitCost: 4000 }   // 20.000
    ];

    it('calcula correctamente el total de unidades y el valor monetario total', () => {
      const valor = production.calcularValorizacionInventario(inventario);
      assert.equal(valor.totalUnidades, 17);
      assert.equal(valor.totalMonetario, 150000);
    });

    it('maneja inventario vacío sin fallar', () => {
      const valor = production.calcularValorizacionInventario([]);
      assert.equal(valor.totalUnidades, 0);
      assert.equal(valor.totalMonetario, 0);
    });
  });

  describe('calcularTotalesCompra', () => {
    const itemsCompra = [
      { quantity: 10, unitCost: 3500 }, // 35.000
      { quantity: 2, unitCost: 20000 }  // 40.000
    ];

    it('calcula totales base sin IVA ni delivery', () => {
      const res = production.calcularTotalesCompra(itemsCompra);
      assert.equal(res.totalUnidades, 12);
      assert.equal(res.subtotalNeto, 75000);
      assert.equal(res.applyIva, false);
      assert.equal(res.ivaAmount, 0);
      assert.equal(res.applyDelivery, false);
      assert.equal(res.deliveryAmount, 0);
      assert.equal(res.totalAmount, 75000);
    });

    it('calcula IVA del 19% chileno sobre el subtotal neto de compras', () => {
      // 19% de 75.000 = 14.250 => Total = 89.250
      const res = production.calcularTotalesCompra(itemsCompra, { aplicarIva: true });
      assert.equal(res.subtotalNeto, 75000);
      assert.equal(res.applyIva, true);
      assert.equal(res.ivaPercent, 19);
      assert.equal(res.ivaAmount, 14250);
      assert.equal(res.totalAmount, 89250);
    });

    it('suma flete / delivery con valor por defecto 0', () => {
      const resConDelivery = production.calcularTotalesCompra(itemsCompra, {
        aplicarIva: false,
        montoDelivery: 5000
      });
      assert.equal(resConDelivery.applyDelivery, true);
      assert.equal(resConDelivery.deliveryAmount, 5000);
      assert.equal(resConDelivery.totalAmount, 80000);
    });

    it('calcula correctamente Subtotal Neto + IVA 19% + Flete/Delivery', () => {
      // Subtotal neto: 75.000
      // IVA 19%: 14.250
      // Flete/Delivery: 5.000
      // Total: 94.250
      const res = production.calcularTotalesCompra(itemsCompra, {
        aplicarIva: true,
        montoDelivery: 5000
      });
      assert.equal(res.subtotalNeto, 75000);
      assert.equal(res.applyIva, true);
      assert.equal(res.ivaAmount, 14250);
      assert.equal(res.applyDelivery, true);
      assert.equal(res.deliveryAmount, 5000);
      assert.equal(res.totalAmount, 94250);
    });

    it('retorna ceros si la lista de items está vacía', () => {
      const res = production.calcularTotalesCompra([], { aplicarIva: true, montoDelivery: 3000 });
      assert.equal(res.totalUnidades, 0);
      assert.equal(res.subtotalNeto, 0);
      assert.equal(res.ivaAmount, 0);
      assert.equal(res.totalAmount, 3000);
    });
  });

  describe('filtrarInventario y filtrarProveedores', () => {
    const inventario = [
      { id: '1', name: 'Polera Algodón Negra M', category: 'Prendas Lisas', currentStock: 5, minStock: 10 },
      { id: '2', name: 'Polerón Canguro Azul L', category: 'Prendas Lisas', currentStock: 25, minStock: 10 },
      { id: '3', name: 'Rollo Vinilo Textil Dorado', category: 'Vinilo Textil', currentStock: 1, minStock: 2 }
    ];

    it('filtra por texto ignorando acentos y mayúsculas', () => {
      const res = production.filtrarInventario(inventario, { textoBusqueda: 'algodon' });
      assert.equal(res.length, 1);
      assert.equal(res[0].id, '1');
    });

    it('filtra por categoría', () => {
      const res = production.filtrarInventario(inventario, { categoria: 'Vinilo Textil' });
      assert.equal(res.length, 1);
      assert.equal(res[0].id, '3');
    });

    it('filtra solo artículos en estado crítico', () => {
      const res = production.filtrarInventario(inventario, { soloCriticos: true });
      assert.equal(res.length, 2); // id 1 (5<=10) y id 3 (1<=2)
    });

    const proveedores = [
      { id: 'P1', name: 'Distribuidora Textil Chile', category: 'Prendas Lisas', phone: '+569111' },
      { id: 'P2', name: 'Insumos Gráficos DTF', category: 'Insumos DTF', phone: '+569222' }
    ];

    it('filtra proveedores por nombre o categoría', () => {
      const res1 = production.filtrarProveedores(proveedores, { textoBusqueda: 'graficos' });
      assert.equal(res1.length, 1);
      assert.equal(res1[0].id, 'P2');

      const res2 = production.filtrarProveedores(proveedores, { categoria: 'Prendas Lisas' });
      assert.equal(res2.length, 1);
      assert.equal(res2[0].id, 'P1');
    });
  });

  describe('generarIdCompra', () => {
    it('genera ID legible con prefijo CMP y fecha', () => {
      const fecha = new Date('2026-11-01T10:00:00Z');
      assert.equal(production.generarIdCompra(1, fecha), 'CMP-20261101-001');
      assert.equal(production.generarIdCompra(12, fecha), 'CMP-20261101-012');
    });
  });

  describe('Spec 004 - Enlace Pedido ➔ Inventario y Detección de Faltantes', () => {
    const inventarioPrueba = [
      {
        id: 'INV-10',
        code: 'POL-NEG-L',
        name: 'Polera Lisa Algodón - Negro L',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Negro',
        size: 'L',
        currentStock: 15,
        unitCost: 2800,
        supplierId: 'PRV-1',
        supplierName: 'Textiles Chile'
      },
      {
        id: 'INV-11',
        code: 'POL-BLA-M',
        name: 'Polera Lisa Algodón - Blanco M',
        category: 'Prendas Lisas',
        garmentType: 'Polera',
        color: 'Blanco',
        size: 'M',
        currentStock: 4,
        unitCost: 2800,
        supplierId: 'PRV-1',
        supplierName: 'Textiles Chile'
      }
    ];

    describe('verificarDisponibilidadPrenda', () => {
      it('retorna "suficiente" cuando el stock en bodega cubre la cantidad requerida', () => {
        const res = production.verificarDisponibilidadPrenda(inventarioPrueba, {
          garmentType: 'Polera',
          color: 'Negro',
          size: 'L',
          quantity: 10
        });
        assert.equal(res.encontrado, true);
        assert.equal(res.stockActual, 15);
        assert.equal(res.cantidadRequerida, 10);
        assert.equal(res.faltante, 0);
        assert.equal(res.estado, 'suficiente');
      });

      it('retorna "faltante" con el cálculo exacto cuando no alcanza el stock', () => {
        const res = production.verificarDisponibilidadPrenda(inventarioPrueba, {
          garmentType: 'Polera',
          color: 'Blanco',
          size: 'M',
          quantity: 10
        });
        assert.equal(res.encontrado, true);
        assert.equal(res.stockActual, 4);
        assert.equal(res.cantidadRequerida, 10);
        assert.equal(res.faltante, 6);
        assert.equal(res.estado, 'faltante');
      });

      it('retorna "no_registrado" si la prenda/color/talla no existe en inventario', () => {
        const res = production.verificarDisponibilidadPrenda(inventarioPrueba, {
          garmentType: 'Polerón',
          color: 'Rojo',
          size: 'XL',
          quantity: 5
        });
        assert.equal(res.encontrado, false);
        assert.equal(res.stockActual, 0);
        assert.equal(res.faltante, 5);
        assert.equal(res.estado, 'no_registrado');
      });

      it('verifica disponibilidad de prendas en tallas infantiles numéricas', () => {
        const inventarioConNinos = [
          ...inventarioPrueba,
          {
            id: 'INV-KID-1',
            code: 'POL-NEG-10',
            name: 'Polera Algodón Negra Talla 10',
            category: 'Prendas Lisas',
            garmentType: 'Polera',
            color: 'Negro',
            size: '10',
            currentStock: 12,
            minStock: 5,
            unitCost: 2500
          }
        ];
        const res = production.verificarDisponibilidadPrenda(inventarioConNinos, {
          garmentType: 'Polera',
          color: 'Negro',
          size: '10',
          quantity: 8
        });
        assert.equal(res.encontrado, true);
        assert.equal(res.stockActual, 12);
        assert.equal(res.faltante, 0);
        assert.equal(res.estado, 'suficiente');
      });
    });

    describe('calcularFaltantesPedido', () => {
      it('calcula la lista consolidada de faltantes para orden de compra', () => {
        const itemsPedido = [
          { garmentType: 'Polera', color: 'Negro', size: 'L', quantity: 20 }, // stock: 15 -> faltan 5
          { garmentType: 'Polera', color: 'Blanco', size: 'M', quantity: 10 } // stock: 4 -> faltan 6
        ];

        const res = production.calcularFaltantesPedido(inventarioPrueba, itemsPedido);
        assert.equal(res.tieneFaltantes, true);
        assert.equal(res.totalPrendasFaltantes, 11);
        assert.equal(res.faltantesParaCompra.length, 2);

        const compraItem1 = res.faltantesParaCompra.find(i => i.code === 'POL-NEG-L');
        assert.equal(compraItem1.quantityNeeded, 5);
        assert.equal(compraItem1.subtotal, 5 * 2800);
      });

      it('indica que no hay faltantes si todo está cubierto por stock', () => {
        const itemsPedido = [
          { garmentType: 'Polera', color: 'Negro', size: 'L', quantity: 5 } // stock: 15
        ];
        const res = production.calcularFaltantesPedido(inventarioPrueba, itemsPedido);
        assert.equal(res.tieneFaltantes, false);
        assert.equal(res.totalPrendasFaltantes, 0);
        assert.equal(res.faltantesParaCompra.length, 0);
      });

      it('Spec 008: incluye prendas no registradas en inventario como faltantes para compra', () => {
        const itemsPedido = [
          { garmentType: 'Polerón', color: 'Burdeo', size: '14', quantity: 8 } // no existe en inventarioPrueba
        ];
        const res = production.calcularFaltantesPedido(inventarioPrueba, itemsPedido);
        assert.equal(res.tieneFaltantes, true);
        assert.equal(res.totalPrendasFaltantes, 8);
        assert.equal(res.faltantesParaCompra.length, 1);
        const itemCompra = res.faltantesParaCompra[0];
        assert.equal(itemCompra.isNew, true);
        assert.equal(itemCompra.inventoryId, null);
        assert.equal(itemCompra.quantityNeeded, 8);
        assert.equal(itemCompra.unitCost, 11000); // Polerón
        assert.equal(itemCompra.subtotal, 8 * 11000);
      });
    });

    describe('descontarInventarioPorPedido', () => {
      it('descuenta correctamente las prendas del inventario físico', () => {
        const itemsPedido = [
          { garmentType: 'Polera', color: 'Negro', size: 'L', quantity: 5 },
          { garmentType: 'Polera', color: 'Blanco', size: 'M', quantity: 2 }
        ];

        const resultado = production.descontarInventarioPorPedido(inventarioPrueba, itemsPedido);
        const itemNegro = resultado.nuevoInventario.find(i => i.id === 'INV-10');
        const itemBlanco = resultado.nuevoInventario.find(i => i.id === 'INV-11');

        assert.equal(itemNegro.currentStock, 10); // 15 - 5
        assert.equal(itemBlanco.currentStock, 2);  // 4 - 2
        assert.equal(resultado.descontados.length, 2);
      });

      it('no genera stock negativo si la cantidad solicitada supera el stock (ajusta a 0)', () => {
        const itemsPedido = [
          { garmentType: 'Polera', color: 'Blanco', size: 'M', quantity: 10 } // stock: 4
        ];
        const resultado = production.descontarInventarioPorPedido(inventarioPrueba, itemsPedido);
        const itemBlanco = resultado.nuevoInventario.find(i => i.id === 'INV-11');
        assert.equal(itemBlanco.currentStock, 0);
      });
    });
  });

});

