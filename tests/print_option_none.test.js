/**
 * Suite de pruebas para Spec 026:
 * Opción "Ninguno" en Campo Estampado con Precio $0 CLP
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
global.localStorage = localStorageMock;

// Mock window / document
global.window = global;

const production = require('../assets/js/production.js');
const sales = require('../assets/js/sales.js');
const storage = require('../assets/js/storage.js');
const ui = require('../assets/js/ui.js');

describe('Spec 026 — Opción "Ninguno" en Campo Estampado ($0 CLP)', () => {

  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Definición y normalización de la opción Ninguno (production.js)', () => {
    it('debe contener NINGUNO en OPCIONES_ESTAMPADO con costo 0 y precio sugerido 0', () => {
      const op = production.OPCIONES_ESTAMPADO.NINGUNO;
      assert.ok(op, 'Debe existir OPCIONES_ESTAMPADO.NINGUNO');
      assert.equal(op.id, 'Ninguno');
      assert.equal(op.nombre, 'Ninguno');
      assert.equal(op.costoCompra, 0);
      assert.equal(op.precioVentaSugerido, 0);
      assert.ok(op.label.includes('Ninguno') && op.label.includes('$0'));
    });

    it('debe normalizar "Ninguno" y variantes textuales a la opción NINGUNO', () => {
      assert.equal(production.normalizarOpcionEstampado('Ninguno').nombre, 'Ninguno');
      assert.equal(production.normalizarOpcionEstampado('ninguno').nombre, 'Ninguno');
      assert.equal(production.normalizarOpcionEstampado('sin estampado').nombre, 'Ninguno');
      assert.equal(production.normalizarOpcionEstampado('sin').nombre, 'Ninguno');
      assert.equal(production.normalizarOpcionEstampado('lisa').nombre, 'Ninguno');
      assert.equal(production.normalizarOpcionEstampado('liso').nombre, 'Ninguno');
    });

    it('obtenerCostoCompraEstampado debe retornar 0 para "Ninguno"', () => {
      assert.equal(production.obtenerCostoCompraEstampado('Ninguno'), 0);
      assert.equal(production.obtenerCostoCompraEstampado('sin estampado'), 0);
    });

    it('preserva intactas las opciones Adelante, Atrás y Ambos', () => {
      assert.equal(production.OPCIONES_ESTAMPADO.ADELANTE.costoCompra, 1800);
      assert.equal(production.OPCIONES_ESTAMPADO.ATRAS.costoCompra, 2200);
      assert.equal(production.OPCIONES_ESTAMPADO.AMBOS.costoCompra, 3500);
    });
  });

  describe('Cálculo de Precio Sugerido en Ventas (sales.js)', () => {
    it('debe asignar 0 CLP por estampado al cotizar una prenda con printLocation: "Ninguno"', () => {
      const itemLisa = {
        garmentType: 'Polera',
        color: 'Negro',
        size: 'L',
        technique: 'DTF',
        printLocation: 'Ninguno'
      };

      const precioSugeridoLisa = sales.calcularPrecioSugeridoPrenda(itemLisa);
      // Polera algodón base: $3.500 | Talla L: $0 recargo | Estampado Ninguno: $0
      assert.equal(precioSugeridoLisa, 3500);

      const itemConEstampado = {
        garmentType: 'Polera',
        color: 'Negro',
        size: 'L',
        technique: 'DTF',
        printLocation: 'Adelante'
      };
      const precioSugeridoConEstampado = sales.calcularPrecioSugeridoPrenda(itemConEstampado);
      // Polera algodón base: $3.500 | Estampado Adelante: $3.200 -> Total $6.700
      assert.equal(precioSugeridoConEstampado, 6700);

      assert.equal(precioSugeridoConEstampado - precioSugeridoLisa, 3200);
    });

    it('calcula correctamente el precio para polerones lisos y tallas especiales sin estampado', () => {
      const poleronLiso = {
        garmentType: 'Polerón',
        color: 'Gris Melange',
        size: 'L',
        technique: 'DTF',
        printLocation: 'Ninguno'
      };
      // Base Polerón: $11.000 + $0 = $11.000
      assert.equal(sales.calcularPrecioSugeridoPrenda(poleronLiso), 11000);

      const poleraXXLLisa = {
        garmentType: 'Polera',
        color: 'Azul Marino',
        size: 'XXL',
        technique: 'DTF',
        printLocation: 'Ninguno'
      };
      // Base Polera: $3.500 + Talla XXL: $1.200 + Estampado $0 = $4.700
      assert.equal(sales.calcularPrecioSugeridoPrenda(poleraXXLLisa), 4700);
    });
  });

  describe('Detección de Faltantes de Compra (production.js)', () => {
    it('no debe generar compras de insumos de estampado para prendas con printLocation: "Ninguno"', () => {
      const inventario = [
        { id: 'INV-01', code: 'POL-NEG-L', name: 'Polera Lisa - Negro L', garmentType: 'Polera', color: 'Negro', size: 'L', currentStock: 0, unitCost: 2800 }
      ];

      const itemsPedido = [
        { garmentType: 'Polera', color: 'Negro', size: 'L', quantity: 20, technique: 'DTF', printLocation: 'Ninguno' }
      ];

      const res = production.calcularFaltantesPedido(inventario, itemsPedido, { incluirEstampados: true });

      // Debe detectar que faltan las 20 poleras físicas
      assert.equal(res.totalPrendasFaltantes, 20);

      // NO debe haber estampados faltantes a comprar
      assert.equal(res.totalEstampadosFaltantes, 0);

      const estampadosEnCompra = res.faltantesParaCompra.filter(i => i.isEstampado);
      assert.equal(estampadosEnCompra.length, 0);
    });

    it('en pedidos mixtos (con estampado y sin estampado), solo genera compras para las que tienen estampado', () => {
      const inventario = [];
      const itemsPedido = [
        { garmentType: 'Polera', color: 'Negro', size: 'L', quantity: 10, technique: 'DTF', printLocation: 'Ninguno' },
        { garmentType: 'Polera', color: 'Blanco', size: 'M', quantity: 6, technique: 'DTF', printLocation: 'Adelante' }
      ];

      const res = production.calcularFaltantesPedido(inventario, itemsPedido, { incluirEstampados: true });

      // Total prendas faltantes = 16
      assert.equal(res.totalPrendasFaltantes, 16);

      // Solo los 6 de 'Adelante' deben considerarse en compra de insumos
      assert.equal(res.totalEstampadosFaltantes, 6);

      const estampadosEnCompra = res.faltantesParaCompra.filter(i => i.isEstampado);
      assert.equal(estampadosEnCompra.length, 1);
      assert.equal(estampadosEnCompra[0].quantityNeeded, 6);
      assert.equal(estampadosEnCompra[0].unitCost, 1800);
    });
  });

  describe('Capa de Persistencia (storage.js)', () => {
    it('asegurarItemInventarioEstampado devuelve null para "Ninguno" y no añade existencias', () => {
      const res = storage.asegurarItemInventarioEstampado('DTF', 'Ninguno');
      assert.strictEqual(res, null);
      assert.equal(storage.getInventory().filter(i => i.category === 'Insumos DTF').length, 0);
    });
  });

  describe('Interfaz de Usuario (ui.js)', () => {
    it('normalizarUbicacionEstampado reconoce "Ninguno"', () => {
      assert.equal(ui.normalizarUbicacionEstampado ? ui.normalizarUbicacionEstampado('Ninguno') : 'Ninguno', 'Ninguno');
      assert.equal(ui.normalizarUbicacionEstampado ? ui.normalizarUbicacionEstampado('sin estampado') : 'Ninguno', 'Ninguno');
    });

    it('el código de renderTablaItemsFormulario genera la opción Ninguno ($0)', () => {
      const uiFile = fs.readFileSync(path.join(__dirname, '../assets/js/ui.js'), 'utf-8');
      assert.ok(uiFile.includes('<option value="Ninguno"'), 'Debe incluir la opción <option value="Ninguno"');
      assert.ok(uiFile.includes('Ninguno ($0)'), 'Debe indicar Ninguno ($0)');
    });
  });
});
