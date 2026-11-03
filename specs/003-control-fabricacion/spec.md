# Spec 003 — Módulo de Producción: Control de Fabricación en Taller
Estado: implementada

## Contexto y objetivo
Novaprint requiere controlar el flujo físico de fabricación de los pedidos y lotes de estampado dentro del taller textil (poleras, polerones, buzos y gorras) a través de estaciones de trabajo especializadas.

El objetivo de esta especificación es dotar a Novaprint de:
1. **Control de Proyectos / Órdenes de Fabricación:** Generación de órdenes de taller vinculadas a pedidos de clientes o producción para stock.
2. **Estaciones de Fabricación:** Seguimiento visual por etapas:
   - `1. Diseño / Vectorización` (Aprobación y ajuste del archivo gráfico).
   - `2. Preparación de Prenda` (Selección de prendas base y materiales).
   - `3. Estampado / Termofijado` (Plancha térmica, pulpo serigráfico o bordadora).
   - `4. Control de Calidad` (Revisión de fijación, curado y medidas).
   - `5. Empacado & Listo` (Doblado, embolsado y disponible para entrega).
3. **Tablero Visual de Taller (Kanban de Fabricación):** Monitoreo en tiempo real de los lotes en curso por cada estación con avance rápido en 1 clic.

---

## Usuarios
- **Jefe de Taller / Operador de Estampado:** Visualiza las órdenes en curso, especificaciones técnicas de planchado/técnica y avanza las etapas del lote.

---

## Historias de usuario
- **HU-1:** Como operador de taller, quiero ver un tablero visual con las órdenes de fabricación divididas por estación para saber qué trabajo debo estampar primero.
- **HU-2:** Como operador de taller, quiero avanzar un proyecto de estación en 1 clic para que ventas y administración conozcan el progreso real del estampado.
- **HU-3:** Como administrador, quiero crear una orden de fabricación a partir de un pedido confirmado con sus especificaciones de prendas, técnicas y colores.

---

## Requisitos funcionales (EARS)
- **RF-1.1:** CUANDO un pedido sea confirmado o el usuario presione "Enviar a Fabricación", EL SISTEMA creará una orden de fabricación con código único (ej. `FAB-001`), prenda, cantidad, técnica y fecha objetivo.
- **RF-1.2:** EL SISTEMA organizará las órdenes de fabricación en un tablero de 5 columnas según su etapa: `Diseño`, `Preparación`, `Estampado/Planchado`, `Control Calidad` y `Terminado`.
- **RF-1.3:** CUANDO el operador pulse "Avanzar Estación", EL SISTEMA moverá la orden a la siguiente etapa de producción y actualizará la fecha de modificación.
- **RF-1.4:** CUANDO una orden alcance la etapa `Terminado`, EL SISTEMA ofrecerá sincronizar el estado del pedido vinculado a `Listo para entrega`.

---

## Criterios de finalización
- [ ] Creación de órdenes de fabricación (manual o desde pedido).
- [ ] Tablero Kanban de 5 estaciones de taller operativo.
- [ ] Botón de avance rápido de etapa por tarjeta.
- [ ] Pruebas unitarias de flujo de fabricación.

