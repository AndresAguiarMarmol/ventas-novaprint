# Spec 015 — Botones para Modificar el Status de un Pedido

Estado: implementada

## 1. Contexto y Objetivo
En la aplicación **Novaprint App**, los pedidos transitan por un flujo operativo de 6 estados:
1. `Cotización`
2. `Confirmado`
3. `En producción`
4. `Listo para entrega`
5. `Entregado`
6. `Cancelado`

Actualmente, para cambiar el estado de un pedido en la vista tabular, el usuario está obligado a abrir el formulario completo de edición de pedidos (`NovaprintUI.editarPedido`), desplazarse hasta el selector de estado al final del formulario y guardar todos los campos. En la vista Kanban, únicamente existe un botón lineal `Avanzar ➔` que solo permite pasar al estado inmediato siguiente y desaparece en pedidos completados o cancelados, sin permitir cancelar un pedido, regresarlo a cotización ni saltar a otro estado de forma directa.

El objetivo de esta especificación es incorporar **botones dedicados para modificar el status de un pedido** de forma ágil, directa y ergonómica tanto en la **Tabla de Pedidos** como en las **Tarjetas Kanban**, permitiendo seleccionar o alternar el estado con un solo clic sin necesidad de abrir el formulario de edición de la orden.

## 2. Usuarios y Roles
- **Operador / Vendedor de Novaprint:** Necesita actualizar el estado de los pedidos a medida que se aprueban, avanzan en el taller textil, quedan listos para despacho o son entregados al cliente, sin pasos intermedios innecesarios.

## 3. Historias de Usuario
- **HU-1**: Como operador, quiero ver botones accesibles en la tabla de pedidos para cambiar el estado de cualquier orden con un solo clic sin abrir el formulario de edición.
- **HU-2**: Como operador, quiero que en las tarjetas del tablero Kanban existan botones o un selector rápido que me permita asignar directamente cualquiera de los 6 estados operativos (incluyendo "Cancelado" o "Listo para entrega").
- **HU-3**: Como operador, quiero que al pulsar un botón de cambio de estado se actualice la persistencia local de inmediato, se emita un toast informativo y se sincronicen reactivamente todas las vistas (Kanban, Tabla, Filtro de saldo por cobrar y KPIs).

## 4. Definiciones
- **Estados Válidos de Pedido:**
  - `Cotización` (Gris)
  - `Confirmado` (Azul)
  - `En producción` (Ámbar)
  - `Listo para entrega` (Púrpura)
  - `Entregado` (Verde)
  - `Cancelado` (Rojo)
- **Modal de Cambio Rápido de Estado (`dialog-change-order-status`):** Diálogo nativo accesible que muestra el pedido, su estado actual y los 6 botones táctiles de estado correspondientes.

## 5. Requisitos Funcionales (EARS)
- **RF-1 (Ubicuidad)**: EL SISTEMA dispone en `assets/js/ui.js` de la función `abrirModalCambiarEstado(orderId)` que despliega el diálogo interactivo con botones estilizados para cada uno de los 6 estados operativos.
- **RF-2 (Basado en Estado)**: MIENTRAS se visualice la **Tabla de Pedidos** (`renderOrdersTable`), EL SISTEMA incluye en la columna `Estado` un botón/insignia interactivo y en la columna `Acciones` un botón dedicado `[🔄]` (title "Modificar Estado") que abre el selector de estados para ese pedido.
- **RF-3 (Basado en Estado)**: MIENTRAS se visualice el **Tablero Kanban** (`renderOrderCard`), EL SISTEMA incluye en la barra de acciones de cada tarjeta un botón `[🔄 Estado]` junto a las acciones rápidas para permitir la modificación directa del estado.
- **RF-4 (Evento)**: CUANDO el usuario hace clic en el botón de un estado dentro del modal rápido o selector, EL SISTEMA ejecuta `NovaprintStorage.updateOrderStatus(orderId, nuevoEstado)`, muestra un mensaje toast de confirmación y refresca las vistas sin recargar la página.
- **RF-5 (Basado en Estado)**: EL SISTEMA resalta visualmente en el diálogo el botón correspondiente al estado actual del pedido con un borde o distintivo `(Actual)`.
- **RF-6 (Compatibilidad)**: No alterar la funcionalidad existente de edición completa del formulario de pedidos (`editarPedido`), cálculo de precios libres ni filtros por estado.

## 6. Requisitos No Funcionales
- **RNF-1 (Accesibilidad y Ergonomía)**: Botones táctiles de mínimo 40px en móvil, etiquetas `aria-label` claras y colores con contraste conforme a WCAG AA.
- **RNF-2 (No Regresión)**: Mantener el 100% de la suite existente de pruebas unitarias (`tests/*.test.js`) aprobadas.

## 7. Criterios de Finalización (DoD)
- [ ] Diálogo nativo `<dialog id="dialog-change-order-status">` en `index.html` con estructura accesible y botones para los 6 estados.
- [ ] Botones para modificar estado integrados en la tabla de pedidos (`renderOrdersTable` en `ui.js`).
- [ ] Botón para modificar estado integrado en las tarjetas Kanban (`renderOrderCard` en `ui.js`).
- [ ] Función `abrirModalCambiarEstado` y manejadores de evento en `assets/js/ui.js` y `assets/js/main.js`.
- [ ] Suite de pruebas unitarias en `tests/order_status_buttons.test.js` verificando la presencia y funcionamiento de los botones.
- [ ] 100% de la suite de pruebas del proyecto pasando en verde con `node --test`.
- [ ] `memory.md` actualizado con el nuevo requerimiento y cambios versionados en Git.
