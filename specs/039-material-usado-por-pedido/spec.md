# Spec 039 — Reporte de Material Usado / Consumo Ordenado por Pedido

## 1. Contexto y Justificación
En la especificación anterior (Spec 038), se implementó la sub-vista "Material Usado / Consumo" en el módulo de Inventario (`#view-inventory` ➔ `#inv-subview-usage`), permitiendo visualizar el material consumido al mes y acumulado con sus métricas y costos.
Actualmente, la tabla desglosa el consumo agrupado a nivel de catálogo de material, lo que no permite a los administradores y operarios del taller auditar en qué pedido específico se utilizó cada prenda o insumo ni conocer el consumo de materiales ordenado por cada orden de trabajo.

El usuario ha solicitado formalmente:
> "El Reporte 'Material Usado/Consumo' ordenarlo por Pedido. Procesar usando metodología sdd. No modificar nada adicional."

Esta especificación define la estructuración, ordenamiento y visualización del reporte de consumo por **Pedido**, desglosando los insumos textiles y de estampado empleados en cada orden del taller, manteniendo el cómputo de métricas mensuales y acumuladas y preservando íntegramente las capacidades existentes.

---

## 2. Historias de Usuario

- **US-01:** Como encargado de taller y producción, quiero que el Reporte de Material Usado / Consumo presente los datos ordenados por Pedido, para poder identificar de inmediato qué prendas e insumos de estampado se consumieron en cada orden de trabajo.
- **US-02:** Como administrador de compras y contabilidad, quiero ver el cliente, fecha de entrega, estado y costo total de materiales de cada pedido, junto al detalle unitario de insumos utilizados.
- **US-03:** Como usuario, quiero poder filtrar los pedidos por mes seleccionado o consultar el histórico acumulado, además de contar con un buscador en vivo por N° de pedido, cliente o material.
- **US-04:** Como usuario, quiero poder alternar de forma opcional entre la vista "Por Pedido" (predeterminada) y la vista consolidada "Por Material" sin perder contexto ni información.

---

## 3. Requisitos Funcionales (EARS)

- **RF-01 (Ordenamiento por Pedido):**
  - *Cuando* el usuario visualice la pestaña "📉 Material Usado / Consumo", el sistema *deberá* listar los registros ordenados por Pedido de forma cronológica / correlativa descendente (pedidos más recientes primero).

- **RF-02 (Estructuración de Consumo por Pedido en `production.js`):**
  - *Cuando* se invoque `calcularConsumoMateriales(pedidos, inventario, mesFiltro)`, la función *deberá* retornar, además del resumen general de métricas (`resumen`) y el consolidado por artículo (`items`), un arreglo estructurado `pedidos` con cada orden válida (`status !== 'Cancelado'`), detallando:
    - Identificador de la orden (`pedidoId`, ej. `NP-20261102-003`).
    - Nombre del cliente (`clienteNombre`).
    - Fecha de entrega o registro (`fecha`).
    - Mes de la transacción (`mesPedido`).
    - Banderas de período (`esMesConsultado`).
    - Estado operativo (`status`).
    - Unidades totales de materiales consumidas en la orden (`totalUnidades`).
    - Costo monetario total de reposición de materiales de la orden (`costoTotalMateriales`).
    - Detalle de materiales (`materiales`): prenda, talla, color, insumos de estampado DTF/bordado, costo unitario, cantidad y subtotal.

- **RF-03 (Presentación Visual en Tabla de Consumo):**
  - *Cuando* se renderice la tabla en `#inv-usage-table-body` en modalidad "Por Pedido", el sistema *deberá* desplegar una fila cabecera por cada pedido (con N° de Pedido, Cliente, Fecha, Estado, Total Unidades y Costo Total del Pedido) seguida de las filas de desglose de cada material e insumo utilizado.

- **RF-04 (Alternancia de Vista Opcional):**
  - *Cuando* el usuario utilice la barra de filtros, el sistema *deberá* ofrecer un conmutador rápido entre "📋 Por Pedido" (activo por defecto) y "📦 Por Material" (resumen consolidado de catálogo).

- **RF-05 (Filtro por Mes y Búsqueda Reactiva):**
  - *Cuando* el usuario seleccione un mes en `#inv-usage-filter-month`, el sistema *deberá* filtrar los pedidos correspondientes a dicho mes. Al presionar "Mes Actual" se fijará el mes corriente, y si el campo está vacío o se selecciona "Todos", se presentará el histórico acumulado.
  - *Cuando* el usuario ingrese texto en `#inv-usage-search-input`, el sistema *deberá* filtrar en tiempo real por N° de pedido, nombre de cliente o nombre/código de material.

---

## 4. Reglas de Negocio

1. **Exclusión de Pedidos Cancelados:** Las órdenes con estado `'Cancelado'` no computan consumo de inventario ni se listan en el reporte de materiales usados.
2. **Determinación de Fecha:** La fecha de asignación del pedido al mes se evalúa según `dates.deliveryDate || dates.createdAt || date || createdAt`.
3. **Insumos de Estampado:** Se contabilizan consumos de estampado (DTF, bordado, serigrafía) cuando `printLocation !== 'Ninguno'` y su costo de compra es $>0$.
4. **Métricas Superiores Intactas:** Las 4 tarjetas de KPI (Unidades Mes, Costo Mes, Total Usado Acumulado, Costo Total Acumulado) se mantienen calculando la totalidad de consumos según el mes consultado y el histórico.
5. **No Modificar Nada Adicional:** No alterar módulos de ventas, compras, proyectos de taller, plan contable ni transferencias. Preservar el 100% de los 300 tests existentes.

---

## 5. Criterios de Aceptación

- [ ] La función `production.calcularConsumoMateriales` retorna la propiedad `pedidos` con la lista de órdenes válidas ordenadas por pedido con su desglose de materiales, cantidades y costos.
- [ ] La tabla de `#inv-subview-usage` presenta el reporte estructurado y ordenado por Pedido.
- [ ] Cada pedido exhibe su código identificador, cliente, fecha, estado, total de unidades y costo monetario de materiales.
- [ ] Se desglosan las prendas lisas y los insumos de estampado consumidos por cada pedido.
- [ ] El conmutador de vista permite alternar entre "Por Pedido" y "Por Material".
- [ ] El buscador y el selector de mes funcionan reactivamente en ambas vistas.
- [ ] Las 4 tarjetas de métricas en la parte superior se actualizan fielmente.
- [ ] Suite de pruebas automatizadas actualizada con cobertura del ordenamiento por pedido.
- [ ] 0 regresiones en las 31 suites de pruebas preexistentes.

