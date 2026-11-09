# Spec 019 — Asientos Contables al Registrar Pedidos: Abono a Banco y Saldo a Cuentas por Cobrar

Estado: implementada

## 1. Contexto y Problema
En la aplicación **Novaprint**, la gestión de pedidos de confección y estampados textiles permite a los clientes encargar trabajos (poleras, polerones, buzos, gorras) entregando un anticipo o abono (`depositAmount`), quedando un saldo restante (`balanceAmount`) por pagar al momento del retiro o entrega del pedido.

Con la reciente incorporación del Módulo de Contabilidad (Spec 018), el Libro Diario registraba cada pedido como un único movimiento simplificado asignando la totalidad del valor a una sola cuenta contable (o todo a Caja/Bancos o todo a Cuentas por Cobrar).

Esta simplificación no refleja la realidad del principio de partida doble contable ni la instrucción de control financiero del negocio:
1. **Monto Abonado:** El efectivo o transferencia efectivamente percibido al momento del registro debe asentarse en la cuenta de Activo Circulante **Banco / Caja** (`1101 Caja y Bancos (Disponible)`).
2. **Saldo Pendiente:** La diferencia adeudada por el cliente debe asentarse de forma separada en la cuenta de Activo Circulante **Cuentas por Cobrar** (`1102 Cuentas por Cobrar Clientes`).
3. Ambos cargos (Debe) contraparten el reconocimiento del ingreso por venta (Haber) en **Ventas de Poleras y Confección** (`4101`), garantizando que la suma de los débitos sea estrictamente igual a la suma de los créditos ($\text{Debe} = \text{Haber} = \text{Total del Pedido}$).

## 2. Historias de Usuario
- **Como dueño/contador de Novaprint**, quiero que al registrar un pedido con abono parcial, se generen asientos contables diferenciados para el monto abonado (en la cuenta Banco) y para el saldo pendiente (en la cuenta Cuentas por Cobrar), para tener trazabilidad exacta del flujo de caja real y de la cartera de clientes.
- **Como operador del taller**, quiero que este registro contable ocurra de forma automática e instantánea al guardar un pedido desde el formulario habitual, sin tener que digitar manualmente transacciones en el Libro Diario.
- **Como administrador**, quiero que al consultar el Libro Diario o el Balance General, se distingan claramente los movimientos de entrada de dinero en banco versus los derechos de cobro pendientes.

## 3. Requisitos Funcionales (Formato EARS)

### [REQ-019-1] Asiento de Abono a Cuenta Banco
- **Cuándo** se registra un pedido que contenga un monto abonado mayor a cero (`depositAmount > 0`),
- **el sistema** debe generar un asiento contable en el Libro Diario debitando (Debe) la cuenta `1101 - Caja y Bancos (Disponible)` y acreditando (Haber) la cuenta `4101 - Ventas de Poleras y Confección` por el valor exacto del abono.

### [REQ-019-2] Asiento de Saldo Pendiente a Cuentas por Cobrar
- **Cuándo** se registra un pedido que contenga un saldo pendiente mayor a cero (`balanceAmount > 0`),
- **el sistema** debe generar un asiento contable en el Libro Diario debitando (Debe) la cuenta `1102 - Cuentas por Cobrar Clientes` y acreditando (Haber) la cuenta `4101 - Ventas de Poleras y Confección` por el valor exacto del saldo adeudado.

### [REQ-019-3] Pedidos con Pago Total Anticipado
- **Cuándo** se registra un pedido totalmente pagado al contado (`depositAmount >= totalAmount` o `balanceAmount === 0`),
- **el sistema** debe generar un único asiento contable debitando el 100% del total a la cuenta `1101 - Caja y Bancos (Disponible)`, sin crear asientos espurios con monto cero en Cuentas por Cobrar.

### [REQ-019-4] Pedidos a Crédito Total (Sin Abono)
- **Cuándo** se registra un pedido sin abono inicial (`depositAmount === 0` y `balanceAmount === totalAmount`),
- **el sistema** debe generar un único asiento contable debitando el 100% del total a la cuenta `1102 - Cuentas por Cobrar Clientes`, sin crear asientos espurios con monto cero en Caja y Bancos.

### [REQ-019-5] Persistencia e Inmutabilidad en Almacenamiento
- **Cuándo** se invoca `NovaprintStorage.saveOrder(orderData)` o se confirma el formulario de pedido en `NovaprintUI`,
- **el sistema** debe adjuntar en la estructura del pedido la propiedad `asientosContables` con el desglose de los asientos generados, preservando compatibilidad retrospectiva con pedidos previos que no posean dicha propiedad.

### [REQ-019-6] Consistencia con Balance General y Estado de Resultados
- **En todo momento**, la suma de los débitos generados por los pedidos en Banco y en Cuentas por Cobrar debe coincidir milimétricamente con los valores calculados en `calcularBalanceGeneral` (`activos.circulante.cajaBancos` y `activos.circulante.cuentasPorCobrar`), manteniendo la ecuación patrimonial equilibrada ($\text{Activos} = \text{Pasivos} + \text{Patrimonio}$).

## 4. Reglas de Negocio
1. **Principio de Partida Doble:** Para cada pedido $p$, la suma de los débitos ($Debe_{Banco} + Debe_{CxC}$) debe ser exactamente igual al total del pedido ($Haber_{Ventas}$).
2. **Subcuentas e Identificadores Únicos:**
   - Asiento de banco: `id: AS-ORD-${p.id}-BANCO`, subcuenta `'Banco'`, concepto: `"Abono Pedido — [Cliente] ([ID])"`.
   - Asiento de cuentas por cobrar: `id: AS-ORD-${p.id}-CXC`, subcuenta `'Cuentas por Cobrar'`, concepto: `"Saldo Pendiente Pedido — [Cliente] ([ID])"`.
3. **No regresión:** Las 138 pruebas automatizadas existentes deben continuar pasando sin alteraciones.
