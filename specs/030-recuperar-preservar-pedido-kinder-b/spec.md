# Spec 030: Recuperar y Preservar Incondicionalmente el Pedido Real de "Kinder B"

## 1. Contexto y Problema
En el desarrollo de la Spec 029 (limpieza de movimientos contables generados para pruebas del sistema), se incluyó un filtro preventivo en `purgarMovimientosPrueba` que actuaba sobre pedidos (`orders`) y compras (`purchases`), además de ejecutarse de forma automática en `main.js:init()`.

Dado que las pruebas iniciales usaban correlativos o términos amplios, un pedido legítimo ingresado por el usuario para el cliente **BRS Kinder B** (23 poleras estampadas DTF de colegio) fue erróneamente depurado del `localStorage` del navegador del usuario.

El usuario instruye explícitamente:
> *"Borraste el pedido de Kinder B, Recuperar y NO BORRAR ya que es un dato real. Usar metodologia sdd para su desarrollo."*

## 2. Requerimientos
1. **Recuperación Inmediata de Datos Reales:**
   - Restaurar de forma automática y transparente el pedido de **BRS Kinder B** (`NP-20261102-003`) con todas sus especificaciones reales extraídas del almacenamiento histórico (23 unidades en tallas 8, 10, 12 y 14 con técnica DTF Pecho grande A4, valor $10.000 c/u, descuento docena/volumen, estado 'En producción').
   - Restaurar el cliente asociado **BRS Kinder B** (`CLI-MVYJ0DKL`) con su RUT, teléfono, notas de contacto ("Contacto / Mariam") y dirección en La Reina.
2. **Blindaje Absoluto Contra Borrado (NO BORRAR):**
   - Eliminar cualquier depuración o filtrado destructivo sobre la colección de pedidos (`novaprint_orders`) y compras (`novaprint_purchases`) en rutinas de arranque o purga de pruebas.
   - En `esRegistroDePrueba`, establecer una regla prioritaria de protección absoluta: si un registro corresponde o menciona a "Kinder B", "BRS", o contiene items de pedidos reales de poleras, debe retornar estrictamente `false` (no es de prueba).
   - En `purgarMovimientosPrueba`, enfocar la purga exclusivamente en asientos manuales y movimientos de ensayo (gastos ficticios y transferencias de prueba), sin tocar bajo ninguna circunstancia pedidos de clientes ni compras a proveedores.
3. **Mecanismo de Auto-reconciliación y Respaldo:**
   - Si al iniciar la aplicación (`init()`) el pedido de "BRS Kinder B" no se encuentra en `localStorage` (debido a la purga previa), el sistema debe reincorporarlo de inmediato (`asegurarPedidoKinderB()`), asegurando que aparezca en el tablero Kanban y en la tabla de pedidos.
   - Si el usuario edita o actualiza el pedido en el futuro, sus cambios deben prevalecer.

## 3. Criterios de Aceptación
- El pedido de Kinder B está disponible y visible en la vista de Pedidos (Kanban y Tabla).
- El cliente BRS Kinder B está disponible en el directorio de clientes.
- La ejecución de `purgarMovimientosPrueba` o el reinicio de la aplicación NO borra el pedido de Kinder B.
- Todas las pruebas unitarias pasan al 100%.

