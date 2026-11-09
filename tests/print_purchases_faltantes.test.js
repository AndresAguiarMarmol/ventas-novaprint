/**
 * tests/print_purchases_faltantes.test.js
 * Pruebas unitarias para la Spec 020:
 * Inclusión de compra de estampados para cada unidad en Material Faltante
 * con opciones diferenciadas: Adelante ($1.800), Atrás ($2.200) y Ambos ($3.500).
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const production = require('../assets/js/production.js');
const sales = require('../assets/js/sales.js');
const storage = require('../assets/js/storage.js');

describe('Spec 020 — Compra de Estampados en Material Faltante (Adelante, Atrás, Ambos)', () => {

  const inventarioPrueba = [
    { id: 'INV-01', code: 'POL-NEG-L', name: 'Polera Lisa - Negro L', garmentType: 'Polera', color: 'Negro', size: 'L', currentStock: 10, unitCost: 2800 },
    { id: 'INV-02', code: 'POL-BLA-M', name: 'Polera Lisa - Blanco M', garmentType: 'Polera', color: 'Blanco', size: 'M', currentStock: 0, unitCost: 2800 }
  ];

  beforeEach(() => {
    storage.clearAllData(true);
  });

  describe('Opciones de Estampado y Precios Diferenciados (production.js)', () => {
    it('define las 3 opciones oficiales con sus costos de compra de referencia', () => {
      const opciones = production.OPCIONES_ESTAMPADO;
      assert.ok(opciones.ADELANTE, 'Debe existir opción ADELANTE');
      assert.ok(opciones.ATRAS, 'Debe existir opción ATRAS');
      assert.ok(opciones.AMBOS, 'Debe existir opción AMBOS');

      assert.equal(opciones.ADELANTE.costoCompra, 1800);
      assert.equal(opciones.ATRAS.costoCompra, 2200);
      assert.equal(opciones.AMBOS.costoCompra, 3500);
    });

    it('normaliza ubicaciones de texto a las 3 opciones oficiales', () => {
      assert.equal(production.normalizarOpcionEstampado('Adelante').nombre, 'Adelante');
      assert.equal(production.normalizarOpcionEstampado('pecho frontal').nombre, 'Adelante');
      assert.equal(production.normalizarOpcionEstampado('Atrás').nombre, 'Atrás');
      assert.equal(production.normalizarOpcionEstampado('espalda grande').nombre, 'Atrás');
      assert.equal(production.normalizarOpcionEstampado('Ambos').nombre, 'Ambos');
      assert.equal(production.normalizarOpcionEstampado('pecho y espalda').nombre, 'Ambos');
      assert.equal(production.normalizarOpcionEstampado('adelante y atras').nombre, 'Ambos');
    });

    it('retorna el costo de compra correspondiente mediante obtenerCostoCompraEstampado', () => {
      assert.equal(production.obtenerCostoCompraEstampado('Adelante'), 1800);
      assert.equal(production.obtenerCostoCompraEstampado('Atrás'), 2200);
      assert.equal(production.obtenerCostoCompraEstampado('Ambos'), 3500);
    });
  });

  describe('Precios de Venta Sugeridos en Cotizador (sales.js)', () => {
    it('calcula el precio sugerido con estampado Adelante ($3.200)', () => {
      const precio = sales.calcularPrecioSugeridoPrenda({
        garmentType: 'Polera',
        size: 'L',
        printLocation: 'Adelante'
      });
      // Algodón base 3500 + Adelante 3200 = 6700
      assert.equal(precio, 6700);
    });

    it('calcula el precio sugerido con estampado Atrás ($3.500)', () => {
      const precio = sales.calcularPrecioSugeridoPrenda({
        garmentType: 'Polera',
        size: 'L',
        printLocation: 'Atrás'
      });
      // Algodón base 3500 + Atrás 3500 = 7000
      assert.equal(precio, 7000);
    });

    it('calcula el precio sugerido con estampado Ambos ($5.500)', () => {
      const precio = sales.calcularPrecioSugeridoPrenda({
        garmentType: 'Polera',
        size: 'L',
        printLocation: 'Ambos'
      });
      // Algodón base 3500 + Ambos 5500 = 9000
      assert.equal(precio, 9000);
    });

    it('combina recargo de talla especial con estampado Ambos', () => {
      const precio = sales.calcularPrecioSugeridoPrenda({
        garmentType: 'Polera',
        size: 'XXL',
        printLocation: 'Ambos'
      });
      // Algodón base 3500 + Recargo XXL 1200 + Ambos 5500 = 10200
      assert.equal(precio, 10200);
    });
  });

  describe('Cálculo de Material Faltante con Estampados (production.js)', () => {
    it('incluye la compra del estampado para cada unidad cuando incluirEstampados es true', () => {
      const itemsPedido = [
        {
          garmentType: 'Polera',
          color: 'Negro',
          size: 'L',
          quantity: 10,
          technique: 'DTF',
          printLocation: 'Adelante'
        }
      ];

      // En inventarioPrueba hay 10 Poleras Negras L (stock suficiente), pero no hay estampados
      const res = production.calcularFaltantesPedido(inventarioPrueba, itemsPedido, { incluirEstampados: true });

      assert.equal(res.tieneFaltantes, true);
      assert.equal(res.totalPrendasFaltantes, 0, 'No faltan prendas base');
      assert.equal(res.totalEstampadosFaltantes, 10, 'Deben faltar 10 estampados');

      assert.equal(res.faltantesParaCompra.length, 1);
      const est = res.faltantesParaCompra[0];
      assert.equal(est.isEstampado, true);
      assert.equal(est.name, 'Estampado DTF - Adelante');
      assert.equal(est.quantityNeeded, 10);
      assert.equal(est.unitCost, 1800);
      assert.equal(est.subtotal, 18000);
    });

    it('calcula tanto prendas faltantes como estampados diferenciados en pedidos combinados', () => {
      const itemsPedido = [
        {
          garmentType: 'Polera',
          color: 'Negro',
          size: 'L',
          quantity: 15, // Stock: 10 -> faltan 5 prendas
          technique: 'DTF',
          printLocation: 'Atrás' // Costo estampado: $2.200
        },
        {
          garmentType: 'Polera',
          color: 'Blanco',
          size: 'M',
          quantity: 8, // Stock: 0 -> faltan 8 prendas
          technique: 'DTF',
          printLocation: 'Ambos' // Costo estampado: $3.500
        }
      ];

      const res = production.calcularFaltantesPedido(inventarioPrueba, itemsPedido, { incluirEstampados: true });

      assert.equal(res.tieneFaltantes, true);
      assert.equal(res.totalPrendasFaltantes, 13); // 5 + 8
      assert.equal(res.totalEstampadosFaltantes, 23); // 15 + 8

      // Deben existir 4 ítems de compra: 2 prendas base y 2 estampados
      assert.equal(res.faltantesParaCompra.length, 4);

      const estampadosAtras = res.faltantesParaCompra.find(i => i.isEstampado && i.printLocation === 'Atrás');
      assert.ok(estampadosAtras);
      assert.equal(estampadosAtras.quantityNeeded, 15);
      assert.equal(estampadosAtras.unitCost, 2200);
      assert.equal(estampadosAtras.subtotal, 33000);

      const estampadosAmbos = res.faltantesParaCompra.find(i => i.isEstampado && i.printLocation === 'Ambos');
      assert.ok(estampadosAmbos);
      assert.equal(estampadosAmbos.quantityNeeded, 8);
      assert.equal(estampadosAmbos.unitCost, 3500);
      assert.equal(estampadosAmbos.subtotal, 28000);
    });

    it('mantiene retrocompatibilidad y no incluye estampados si la opción está desactivada u omitida', () => {
      const itemsPedido = [
        { garmentType: 'Polera', color: 'Negro', size: 'L', quantity: 15 }
      ];

      const res = production.calcularFaltantesPedido(inventarioPrueba, itemsPedido);
      assert.equal(res.totalPrendasFaltantes, 5);
      assert.equal(res.totalEstampadosFaltantes, 0);
      assert.equal(res.faltantesParaCompra.length, 1);
      assert.equal(res.faltantesParaCompra[0].isEstampado, false);
    });
  });

  describe('Enlace con Inventario (storage.js: asegurarItemInventarioEstampado)', () => {
    it('crea el ítem de estampado en bodega con categoría Insumos DTF y stock inicial 0', () => {
      const itemEstampado = storage.asegurarItemInventarioEstampado('DTF', 'Ambos', { unitCost: 3500 });
      assert.ok(itemEstampado.id);
      assert.equal(itemEstampado.code, 'EST-DTF-AMB');
      assert.equal(itemEstampado.name, 'Estampado DTF - Ambos');
      assert.equal(itemEstampado.category, 'Insumos DTF');
      assert.equal(itemEstampado.currentStock, 0);
      assert.equal(itemEstampado.unitCost, 3500);

      // Si se invoca nuevamente, reutiliza el existente sin duplicarlo
      const reconsultado = storage.asegurarItemInventarioEstampado('DTF', 'Ambos');
      assert.equal(reconsultado.id, itemEstampado.id);
      assert.equal(storage.getInventory().filter(i => i.code === 'EST-DTF-AMB').length, 1);
    });
  });

  describe('Consistencia en la Interfaz (index.html)', () => {
    it('index.html incluye la columna de encabezado Estampado en el modal de pedido', () => {
      const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
      assert.ok(html.includes('<th class="py-2 px-1">Estampado</th>'), 'Debe incluir el encabezado Estampado en la tabla de prendas');
    });
  });
});

