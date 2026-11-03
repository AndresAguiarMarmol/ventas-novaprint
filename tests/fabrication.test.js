const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const production = require('../assets/js/production.js');

describe('Spec 003 - Control de Fabricación en Taller (production.js)', () => {

  describe('obtenerSiguienteEtapa', () => {
    it('avanza ordenadamente por las 5 estaciones del taller', () => {
      assert.equal(production.obtenerSiguienteEtapa('Diseño'), 'Preparación');
      assert.equal(production.obtenerSiguienteEtapa('Preparación'), 'Estampado');
      assert.equal(production.obtenerSiguienteEtapa('Estampado'), 'Control Calidad');
      assert.equal(production.obtenerSiguienteEtapa('Control Calidad'), 'Terminado');
      assert.equal(production.obtenerSiguienteEtapa('Terminado'), null);
    });

    it('retorna null para etapas inválidas o desconocidas', () => {
      assert.equal(production.obtenerSiguienteEtapa('Inexistente'), null);
      assert.equal(production.obtenerSiguienteEtapa(null), null);
    });
  });

  describe('clasificarProyectosPorEtapa', () => {
    const proyectos = [
      { id: 'PRJ-1', stage: 'Diseño' },
      { id: 'PRJ-2', stage: 'Estampado' },
      { id: 'PRJ-3', stage: 'Estampado' },
      { id: 'PRJ-4', stage: 'Terminado' }
    ];

    it('agrupa los proyectos exactamente en las 5 estaciones', () => {
      const agrupados = production.clasificarProyectosPorEtapa(proyectos);
      assert.equal(agrupados['Diseño'].length, 1);
      assert.equal(agrupados['Preparación'].length, 0);
      assert.equal(agrupados['Estampado'].length, 2);
      assert.equal(agrupados['Control Calidad'].length, 0);
      assert.equal(agrupados['Terminado'].length, 1);
    });
  });

  describe('crearProyectoDesdePedido', () => {
    const pedido = {
      id: 'NP-20261101-001',
      clientName: 'Club Deportivo Leones',
      dates: { deliveryDate: '2026-11-05' },
      items: [
        { garmentType: 'Polera', color: 'Negro', size: 'L', technique: 'DTF', printLocation: 'Pecho', quantity: 15 },
        { garmentType: 'Gorra', color: 'Rojo', size: 'Única', technique: 'Bordado', printLocation: 'Frontal', quantity: 10 }
      ],
      totals: { totalQuantity: 25 },
      notes: 'Entregar doblado individual'
    };

    it('construye una orden de fabricación completa con detalle consolidado', () => {
      const proyecto = production.crearProyectoDesdePedido(pedido, 'Rodrigo (Taller)');
      assert.ok(proyecto.id.startsWith('PRJ-'));
      assert.equal(proyecto.orderId, 'NP-20261101-001');
      assert.equal(proyecto.clientName, 'Club Deportivo Leones');
      assert.equal(proyecto.quantity, 25);
      assert.equal(proyecto.stage, 'Diseño');
      assert.equal(proyecto.assignedTo, 'Rodrigo (Taller)');
      assert.ok(proyecto.garmentType.includes('Polera'));
      assert.ok(proyecto.printTechnique.includes('DTF'));
    });
  });

  describe('filtrarProyectosFabricacion', () => {
    const proyectos = [
      { id: 'PRJ-1', code: 'FAB-001', name: 'Poleras Colegio', garmentType: 'Polera', printTechnique: 'DTF', stage: 'Diseño' },
      { id: 'PRJ-2', code: 'FAB-002', name: 'Gorras Evento', garmentType: 'Gorra', printTechnique: 'Bordado', stage: 'Estampado' }
    ];

    it('filtra por búsqueda de texto en nombre, código o prenda', () => {
      const res = production.filtrarProyectosFabricacion(proyectos, { textoBusqueda: 'colegio' });
      assert.equal(res.length, 1);
      assert.equal(res[0].id, 'PRJ-1');
    });

    it('filtra por etapa', () => {
      const res = production.filtrarProyectosFabricacion(proyectos, { etapa: 'Estampado' });
      assert.equal(res.length, 1);
      assert.equal(res[0].id, 'PRJ-2');
    });
  });

});

