# Spec 013 — Flexibilidad de Precios Libres y Acceso a Descuentos por Volumen

## 1. Qué y Por Qué
1. **Flexibilidad en Ingreso de Precios:** Los usuarios del taller y vendedores necesitan libertad para ingresar cualquier precio unitario en los pedidos (incluyendo precios con cualquier decimal o múltiplos distintos de 500, muestras a costo $0 o promociones especiales) sin que el sistema ni el navegador validen, bloqueen o restrinjan el campo con errores de paso HTML5 (`step="500"`) ni obliguen a montos mínimos estrictos.
2. **Acceso a Descuentos por Volumen:** Actualmente la escala de descuentos por volumen de Novaprint (5% desde 6 un., 10% desde 12 un., 15% desde 25 un., 20% desde 50+ un.) solo se hace visible en el formulario cuando ya se superan las 6 unidades. El usuario requiere un botón visible para acceder y consultar la escala de descuentos por volumen en cualquier momento, tanto desde el panel de pedidos como dentro del modal de cotización de pedido.

## 2. Historias de Usuario
- **Como vendedor o cotizador**, quiero poder ingresar cualquier precio unitario libremente en la tabla de prendas del pedido sin que el formulario me exija múltiplos específicos ni valide restricciones de precio.
- **Como cliente o vendedor**, quiero presionar un botón visible "Descuentos por Volumen" para consultar rápidamente los tramos de descuento disponibles por cantidad de prendas y saber cuántas unidades faltan para acceder al siguiente tramo.

## 3. Requisitos Funcionales (EARS)
- **Ubiquitous (Precios Libres Sin Validación Bloqueante):** Los campos de precio unitario en pedidos no deberán tener restricciones de paso (`step="500"`) ni validaciones que impidan el guardado o disparen advertencias nativas de formulario. Deberán permitir cualquier valor numérico (incluyendo $0).
- **Ubiquitous (Cálculo Financiero con Precios Libres):** Las funciones de cálculo financiero (`calcularSubtotalItem`, `calcularTotalesPedido`) deberán aceptar cualquier precio unitario numérico válido sin forzar `precio > 0`.
- **Event-Driven (Botón de Acceso a Descuentos por Volumen):** La aplicación deberá proveer botones interactivos visibles ("🏷️ Descuentos por Volumen"):
  1. En la barra de herramientas de Pedidos (`#view-orders`).
  2. En el formulario de Nuevo Pedido (`#dialog-order`), junto a la sección de totales y prendas.
- **Event-Driven (Modal de Descuentos por Volumen):** Al presionar cualquiera de los botones de Descuentos por Volumen, el sistema deberá abrir un modal informativo estilizado (`#dialog-volume-discounts`) que despliegue la escala completa de descuentos por volumen de Novaprint, con sus porcentajes y cantidades mínimas. Si el usuario está cotizando un pedido, el modal resaltará dinámicamente el tramo alcanzado y las prendas faltantes para el siguiente nivel.

## 4. Criterios de Aceptación
1. El usuario puede escribir cualquier precio (ej. $3.250, $1.990, $0, etc.) en los pedidos y el formulario guarda sin bloqueos de validación.
2. Se incluye el botón "🏷️ Descuentos por Volumen" tanto en la barra de pedidos como en el formulario de pedido.
3. Al pulsar el botón, se abre el modal `#dialog-volume-discounts` con la tabla explicativa y badges de cada tramo de descuento.
4. El checkbox para activar/desactivar el descuento por volumen sigue operativo.
5. Todas las pruebas unitarias pasan al 100% en verde sin regresiones en ventas, producción, taller ni almacenamiento.

