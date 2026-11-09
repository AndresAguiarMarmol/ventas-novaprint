# Spec 020 — Inclusión de Compra de Estampados en Material Faltante (Adelante, Atrás, Ambos con Precios Diferenciados)

Estado: implementada

## 1. Contexto y Problema
En el taller textil de **Novaprint**, la confección de pedidos personalizados no solo requiere las prendas textiles lisas (poleras, polerones, buzos, gorras), sino también la adquisición o aprovisionamiento de las matrices/transferencias de estampado (películas DTF, serigrafía, vinilo o insumos de sublimación) correspondientes a cada unidad solicitada por el cliente.

Anteriormente (Spec 004 / Spec 008), la funcionalidad de "Comprar Material Faltante" (`calcularFaltantesPedido` y `abrirModalCompraConFaltantes`) evaluaba exclusivamente las prendas base en bodega. Si un pedido requería 10 poleras estampadas, la orden de compra sugería únicamente adquirir las 10 poleras lisas, omitiendo el costo de compra de los estampados y obligando al operador a calcular o ingresar manualmente dichos insumos.

Además, los estampados presentan ubicaciones y consumos de material claramente diferenciados:
1. **Adelante:** Estampado en el pecho o parte frontal.
2. **Atrás:** Estampado en la espalda o parte posterior.
3. **Ambos:** Estampado combinado tanto en la parte delantera como en la trasera.

Cada una de estas opciones tiene costos de compra a proveedores y precios de cotización distintos.

## 2. Historias de Usuario
- **Como operador de producción / taller**, quiero que al pulsar "Comprar Material Faltante" desde el formulario de pedido o desde la orden, el sistema incluya automáticamente la compra del estampado para cada unidad de prenda solicitada, según si fue configurada para "Adelante", "Atrás" o "Ambos".
- **Como administrador**, quiero que cada opción de estampado aplique su respectivo precio de compra de referencia (con opción de edición libre) y su precio de venta sugerido, asegurando que los costos de producción y márgenes del pedido sean exactos.
- **Como usuario**, quiero que la interfaz de registro de pedido ofrezca un selector ágil y claro para elegir entre "Adelante", "Atrás" o "Ambos", sin alterar el funcionamiento de los pedidos existentes.

## 3. Requisitos Funcionales (Formato EARS)

### [REQ-020-1] Opciones Oficiales de Estampado y Precios Diferenciados
- **El sistema** debe definir las 3 opciones oficiales de estampado con sus costos de compra de referencia y precios de venta sugeridos:
  - **Adelante:** Costo de compra $1.800 CLP | Precio venta sugerido $3.200 CLP.
  - **Atrás:** Costo de compra $2.200 CLP | Precio venta sugerido $3.500 CLP.
  - **Ambos (Adelante y Atrás):** Costo de compra $3.500 CLP | Precio venta sugerido $5.500 CLP.

### [REQ-020-2] Selector de Estampado en el Formulario de Pedido
- **En la tabla de prendas** del modal `#dialog-order`, la columna "Estampado" debe permitir seleccionar de forma directa entre `Adelante`, `Atrás` o `Ambos`, actualizando en tiempo real el precio sugerido de venta de la fila y los totales del pedido.

### [REQ-020-3] Cálculo de Estampados en Material Faltante
- **Cuándo** se solicita comprar material faltante para un pedido (`abrirModalCompraConFaltantes`),
- **el sistema** debe generar una línea de compra de estampado por cada ítem de prenda del pedido:
  - Nombre: `Estampado [Técnica] - [Opción]` (ej. `Estampado DTF - Adelante`, `Estampado DTF - Ambos`).
  - Cantidad: 1 unidad de estampado por cada unidad de prenda (`quantityNeeded = item.quantity`).
  - Costo Unitario: El costo de compra correspondiente a la opción (`$1.800`, `$2.200` o `$3.500`).
  - Subtotal: `cantidad × costoUnitario`.

### [REQ-020-4] Registro y Enlace en Inventario de Bodega
- **El sistema** debe proveer la función `asegurarItemInventarioEstampado(technique, location, datosExtra)` en `NovaprintStorage`, de forma análoga a las prendas, permitiendo asociar el `inventoryItemId` correspondiente para que el stock de estampados se incremente al confirmar la compra.

### [REQ-020-5] Alerta Visual de Material Faltante Actualizada
- **El contenedor de alertas** del modal de pedido (`#order-stock-alert-container`) debe informar tanto las prendas faltantes como los estampados a comprar:
  - "Este pedido requiere comprar **X prendas** y **Y estampados** ([ubicaciones]) para ser completado."

### [REQ-020-6] Preservación y Retrocompatibilidad
- **En todo momento**, los pedidos preexistentes con descripciones libres (ej. 'Pecho grande A4', 'Logo Pecho') deben seguir funcionando sin errores y normalizarse automáticamente hacia la opción correspondiente (`Adelante`, `Atrás` o `Ambos`).
- La suite de 146 pruebas unitarias existentes debe continuar pasando al 100%.

## 4. Criterios de Aceptación
1. Selección de "Adelante", "Atrás" y "Ambos" disponible en cada fila del pedido.
2. Al presionar "🛒 Comprar Material Faltante", la orden de compra en `#dialog-purchase` carga tanto las prendas base faltantes como los estampados de cada unidad con su precio de compra respectivo.
3. Se pueden editar libremente los costos y cantidades en la orden de compra antes de confirmar.
4. Cobertura con pruebas unitarias específicas para cálculo de faltantes con estampados y retrocompatibilidad.
