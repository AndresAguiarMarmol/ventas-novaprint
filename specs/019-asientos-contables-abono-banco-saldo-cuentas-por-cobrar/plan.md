# Plan Técnico — Spec 019: Asientos Contables al Registrar Pedidos

## 1. Arquitectura y Módulos Afectados

```
[ Formulario de Pedido (index.html / ui.js) ]
                    │
                    ▼
       [ NovaprintStorage.saveOrder ]
                    │
                    ▼
[ NovaprintAccounting.generarAsientosPedido ]
    ├── Si abono > 0   ──> Asiento Debe: 1101 Caja/Bancos, Haber: 4101 Ventas
    └── Si saldo > 0   ──> Asiento Debe: 1102 Cuentas por Cobrar, Haber: 4101 Ventas
                    │
                    ▼
  [ Guardado en novaprint_orders con order.asientosContables ]
                    │
                    ▼
       [ NovaprintAccounting.generarLibroDiario ]
                    │
                    ▼
     [ Renderizado en Tabla de Libro Diario ]
```

## 2. Contratos de Funciones

### A. `assets/js/accounting.js`
- **Nueva función exportada:** `generarAsientosPedido(pedido)`:
  - **Entrada:** Objeto `pedido` (soporta propiedades en raíz o en `pedido.totals`).
  - **Salida:** `Array<AsientoContable>`
    - Si `abono > 0`:
      ```javascript
      {
        id: `AS-ORD-${p.id}-BANCO`,
        fecha: p.date || p.dates?.createdAt || p.createdAt || ...,
        tipo: 'Ingreso',
        origen: 'Venta de Pedido (Abono)',
        referenciaId: p.id,
        concepto: `Abono Pedido — ${clientName} (${p.id})`,
        cuentaDebe: CUENTAS_CONTABLES.CAJA_BANCOS.nombre,
        debe: abono,
        cuentaHaber: CUENTAS_CONTABLES.VENTAS_POLERAS.nombre,
        haber: abono,
        subcuenta: 'Banco',
        detalle: { total, abono, saldo }
      }
      ```
    - Si `saldo > 0`:
      ```javascript
      {
        id: `AS-ORD-${p.id}-CXC`,
        fecha: p.date || p.dates?.createdAt || p.createdAt || ...,
        tipo: 'Ingreso',
        origen: 'Venta de Pedido (Crédito)',
        referenciaId: p.id,
        concepto: `Saldo Pendiente Pedido — ${clientName} (${p.id})`,
        cuentaDebe: CUENTAS_CONTABLES.CUENTAS_POR_COBRAR.nombre,
        debe: saldo,
        cuentaHaber: CUENTAS_CONTABLES.VENTAS_POLERAS.nombre,
        haber: saldo,
        subcuenta: 'Cuentas por Cobrar',
        detalle: { total, abono, saldo }
      }
      ```
- **Modificación en `generarLibroDiario(pedidos, compras, gastos)`:**
  - Sustituye la generación de un único asiento genérico por la invocación de `generarAsientosPedido(p)` para cada pedido activo.
- **Normalización en `obtenerConsolidadoPedidos(pedidos)`:**
  - Garantiza lectura simétrica de montos tanto en `p.total` / `p.deposit` / `p.balance` como en `p.totals.totalAmount` / `p.totals.depositAmount` / `p.totals.balanceAmount`.

### B. `assets/js/storage.js`
- **Modificación en `saveOrder(orderData)`:**
  - Si el módulo `NovaprintAccounting` está cargado y expone `generarAsientosPedido`, se genera el array y se almacena en `orderToSave.asientosContables`.

### C. `assets/js/ui.js`
- **Actualización en `renderAccountingJournal`:**
  - Reconoce las subcuentas o variaciones de origen (`Venta de Pedido (Abono)`, `Venta de Pedido (Crédito)`) para mostrar badges informativos de venta clara (*Abono Banco* / *Saldo Crédito*).

## 3. Plan de Verificación y Pruebas
1. Prueba unitaria con pedido mixto ($50.000 total, $20.000 abono, $30.000 saldo): genera 2 asientos con Debe y Haber balanceados.
2. Prueba unitaria con pedido 100% abonado ($30.000 total, $30.000 abono): genera 1 asiento exclusivo en Banco.
3. Prueba unitaria con pedido 100% a crédito ($40.000 total, $0 abono): genera 1 asiento exclusivo en Cuentas por Cobrar.
4. Prueba de integración con `saveOrder`: verifica que `asientosContables` se asocie al pedido al registrarse.
5. Ejecución completa del test suite: verificar 100% pasando sin regresiones.

