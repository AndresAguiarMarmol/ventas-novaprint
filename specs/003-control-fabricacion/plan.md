# Plan Técnico — Spec 003: Control de Fabricación en Taller

## 1. Archivos y responsabilidades

| Archivo | Responsabilidad principal | Requisitos cubiertos |
| :--- | :--- | :--- |
| `assets/js/production.js` | Funciones puras para el flujo de fabricación: transición entre estaciones de taller (`avanzarEtapaFabricacion`), clasificación en columnas Kanban, constructor de órdenes desde pedidos confirmados y filtrado. | RF-1.1, RF-1.2, RF-1.3, RF-1.4 |
| `assets/js/storage.js` | Persistencia y métodos para órdenes de fabricación (`novaprint_projects`), con seed data demostrativo de lotes en curso en el taller. | RF-1.1, RF-1.2 |
| `index.html` | Estructura completa de la pestaña `#view-fabrication` con métricas de taller, tablero Kanban de 5 estaciones (`Diseño`, `Preparación`, `Estampado/Planchado`, `Control Calidad`, `Terminado`) y modal de nueva orden de taller. | RF-1.1, RF-1.2, RF-1.3 |
| `assets/js/ui.js` | Renderizado dinámico de tarjetas de fabricación en cada estación, badges de técnicas (DTF, Serigrafía, Bordado, etc.), botón de avance en 1 clic y modal de orden de fabricación. | RF-1.2, RF-1.3, RF-1.4 |
| `assets/js/main.js` | Listeners de filtros de fabricación, modal de órdenes de taller y botón "Enviar a Fabricación" desde las tarjetas de pedidos. | RF-1.1, RF-1.3, RF-1.4 |
| `tests/fabrication.test.js` | Pruebas unitarias nativas con `node --test` para validar transiciones de etapas, generación de proyectos desde pedidos y consistencia de estaciones. | RF-1.1, RF-1.2, RF-1.3, RF-1.4 |

---

## 2. Modelo de datos (Schema de Fabricación)

```json
{
  "id": "PRJ-20261101-001",
  "code": "FAB-001",
  "orderId": "NP-20261101-001",
  "clientName": "Club Deportivo Leones",
  "name": "Lote Camisetas & Gorras Club Leones",
  "garmentType": "Polera / Gorra",
  "quantity": 30,
  "printTechnique": "DTF / Bordado",
  "printLocation": "Pecho grande + Frontal gorra",
  "stage": "Estampado",
  "startDate": "2026-11-01",
  "targetDate": "2026-11-03",
  "assignedTo": "Rodrigo (Operador Plancha)",
  "notes": "Parámetro térmico DTF: 160°C por 15 seg. Presión media-alta.",
  "createdAt": "2026-11-01T10:00:00.000Z",
  "updatedAt": "2026-11-01T14:30:00.000Z"
}
```

Estaciones de Taller válidas (`stage`):
1. `"Diseño"` (Vectorización, revisión de arte y aprobación)
2. `"Preparación"` (Separación de prendas en blanco y preparación de insumos)
3. `"Estampado"` (Planchado térmico, pulpo de serigrafía o máquina de bordar)
4. `"Control Calidad"` (Revisión de fijación, curado, desprendimiento y confección)
5. `"Terminado"` (Doblado, embolsado y entrega a ventas)

---

## 3. Funciones puras en `assets/js/production.js`

```javascript
// Obtiene la siguiente estación del flujo
function obtenerSiguienteEtapa(etapaActual)

// Clasifica proyectos en las 5 columnas del Kanban
function clasificarProyectosPorEtapa(proyectos)

// Construye una orden de fabricación a partir de un pedido de ventas
function crearProyectoDesdePedido(pedido, asignadoA)

// Filtra órdenes de fabricación
function filtrarProyectosFabricacion(proyectos, { textoBusqueda, etapa, tecnica })

// Genera ID secuencial para fabricación
function generarIdFabricacion(secuencia, fecha)
```

---

## 4. Estrategia de pruebas unitarias (`tests/fabrication.test.js`)
- Validar el avance secuencial exacto de las 5 estaciones:
  `Diseño` ➔ `Preparación` ➔ `Estampado` ➔ `Control Calidad` ➔ `Terminado` ➔ `null` (finalizado).
- Validar la extracción de prendas, técnicas y cantidades al crear una orden desde un pedido multi-ítem.
- Validar el agrupamiento determinista en las 5 columnas Kanban.
- Validar filtrado por texto, etapa y técnica.

