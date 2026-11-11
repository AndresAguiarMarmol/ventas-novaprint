# Spec 035 — CRUD Completo y Acción Duplicar en el Libro Diario de Movimientos Contables

## 1. Contexto y Problema
En el submódulo contable **"Libro Diario de Movimientos"** (`#acc-subview-journal`), la tabla consolidada (`#acc-journal-tbody`) lista cronológicamente todos los asientos derivados de:
1. **Pedidos de Clientes** (`a.tipo === 'VENTA'`, referencia `NP-...`)
2. **Compras a Proveedores** (`a.tipo === 'COMPRA'`, referencia `CMP-...`)
3. **Gastos Operacionales** (`a.tipo === 'GASTO'`, referencia `EXP-...`)
4. **Transferencias entre Cuentas** (`a.tipo === 'TRANSFERENCIA'`, referencia `TRF-...`)

Sin embargo, la columna **"Acciones"** (`assets/js/ui.js:3441-3453`):
- Únicamente muestra un botón de eliminación `[🗑️]` para Gastos manuales y Transferencias manuales.
- Para Pedidos y Compras muestra un texto estático `Auto` o `-` sin opciones interactivas.
- No dispone de botones de edición `[✏️]`.
- No dispone de la acción **Duplicar** `[📋]` solicitada por el usuario para agilizar la creación repetitiva de movimientos similares en el taller.

El usuario solicita explícitamente:
> *"en el 'libro Diario de Movimientos', en el Bton 'Acciones', habilitar el CRUD y ademas crear la accion 'Duplicar', para todos los registros. Procesar usando metodologia sdd. No mofificar nada adicional"*

---

## 2. Historias de Usuario
- **HU-01 (Editar Asiento/Movimiento):** Como usuario del taller, quiero presionar el botón `[✏️]` (Editar) en cualquier fila del Libro Diario para abrir el modal correspondiente (`dialog-order`, `dialog-purchase`, `dialog-expense` o `dialog-transfer`) cargado con los datos del registro original y poder modificarlo.
- **HU-02 (Duplicar Asiento/Movimiento):** Como usuario del taller, quiero presionar el botón `[📋]` (Duplicar) en cualquier fila del Libro Diario para clonar los datos del registro (cliente/proveedor, cuentas, montos, desglose o insumos) abriendo el formulario respectivo listo para guardar con fecha de hoy y sin sobrescribir el original.
- **HU-03 (Eliminar Asiento/Movimiento):** Como usuario del taller, quiero presionar el botón `[🗑️]` (Eliminar) en cualquier fila del Libro Diario para solicitar confirmación y eliminar el pedido, compra, gasto o transferencia asociada, recalculando en tiempo real el Libro Diario y los balances.
- **HU-04 (Preservación de Datos e Integridad):** Como administrador, requiero que ninguna otra vista ni dato contable se altere ("no modificar nada adicional"), preservando reglas existentes y compatibilidad total.

---

## 3. Requisitos del Sistema (Formato EARS)

### Requisitos Ubicuos (En todo momento)
- **EARS-U-01:** La tabla `#acc-journal-tbody` DEBERÁ renderizar para **cada asiento contable** un grupo de acciones consistente:
  - Botón **Editar** `[✏️]`
  - Botón **Duplicar** `[📋]`
  - Botón **Eliminar** `[🗑️]`
- **EARS-U-02:** Cada botón DEBERÁ tener un tooltip descriptivo (`title`), atributos de accesibilidad (`aria-label`) y respuesta visual clara en hover.

### Requisitos Conducidos por Eventos (When / Cuando)
- **EARS-E-01 (Editar Pedido):** CUANDO el usuario presione Editar `[✏️]` en un asiento de Venta (`NP-...`), el sistema DEBERÁ invocar `NovaprintUI.editarPedido(a.referenciaId)`, abriendo `#dialog-order` con los datos cargados del pedido.
- **EARS-E-02 (Editar Compra):** CUANDO el usuario presione Editar `[✏️]` en un asiento de Compra (`CMP-...`), el sistema DEBERÁ invocar `NovaprintUI.editarCompra(a.referenciaId)`, abriendo `#dialog-purchase` con los datos cargados de la compra.
- **EARS-E-03 (Editar Gasto):** CUANDO el usuario presione Editar `[✏️]` en un asiento de Gasto (`EXP-...`), el sistema DEBERÁ invocar `NovaprintUI.editarGasto(a.referenciaId)`, abriendo `#dialog-expense` con los datos cargados del gasto para su actualización.
- **EARS-E-04 (Editar Transferencia):** CUANDO el usuario presione Editar `[✏️]` en un asiento de Transferencia (`TRF-...`), el sistema DEBERÁ invocar `NovaprintUI.editarTransferencia(a.referenciaId)`, abriendo `#dialog-transfer` con los datos cargados de la transferencia para su actualización.
- **EARS-E-05 (Duplicar Pedido):** CUANDO el usuario presione Duplicar `[📋]` en un asiento de Venta (`NP-...`), el sistema DEBERÁ invocar `NovaprintUI.duplicarPedido(a.referenciaId)`, el cual cargará los ítems, tallas, técnicas y valores del pedido en `#dialog-order`, asignando fecha actual, limpiando el ID para generar uno nuevo al guardar y añadiendo nota descriptiva de copia.
- **EARS-E-06 (Duplicar Compra):** CUANDO el usuario presione Duplicar `[📋]` en un asiento de Compra (`CMP-...`), el sistema DEBERÁ invocar `NovaprintUI.duplicarCompra(a.referenciaId)`, el cual cargará proveedor e ítems en `#dialog-purchase`, asignando fecha actual, factura sugerida en blanco/copia y limpiando el ID para generar una nueva compra.
- **EARS-E-07 (Duplicar Gasto):** CUANDO el usuario presione Duplicar `[📋]` en un asiento de Gasto (`EXP-...`), el sistema DEBERÁ invocar `NovaprintUI.duplicarGasto(a.referenciaId)`, abriendo `#dialog-expense` pre-llenado con la categoría, monto, método y descripción `(Copia)` pero con fecha de hoy y sin ID.
- **EARS-E-08 (Duplicar Transferencia):** CUANDO el usuario presione Duplicar `[📋]` en un asiento de Transferencia (`TRF-...`), el sistema DEBERÁ invocar `NovaprintUI.duplicarTransferencia(a.referenciaId)`, abriendo `#dialog-transfer` pre-llenado con cuenta origen, cuenta destino, monto y glosa `(Copia)` pero con fecha de hoy y sin ID.
- **EARS-E-09 (Eliminar desde Diario):** CUANDO el usuario presione Eliminar `[🗑️]` en cualquier asiento, el sistema DEBERÁ invocar la función de confirmación correspondiente:
  - Venta: `NovaprintUI.confirmarEliminarPedido(a.referenciaId)`
  - Compra: `NovaprintUI.confirmarEliminarCompra(a.referenciaId)`
  - Gasto: `NovaprintUI.confirmarEliminarGasto(a.referenciaId)`
  - Transferencia: `NovaprintUI.confirmarEliminarTransferencia(a.referenciaId)`
  y refrescar inmediatamente el Libro Diario y balances tras la eliminación confirmada.

---

## 4. Criterios de Aceptación
1. **Acciones Habilitadas en 100% de Registros:** Ninguna fila del Libro Diario muestra `-` o `Auto` sin botones de acción; todas presentan `[✏️]`, `[📋]` y `[🗑️]`.
2. **Edición Funcional:** Al hacer clic en Editar para cualquier tipo de registro, se abre el diálogo nativo correspondiente con todos los datos precargados.
3. **Duplicación Segura:** Al hacer clic en Duplicar, se abre el formulario respectivo con los campos clonados, fecha actual y sin ID previo, impidiendo sobreescritura accidental del registro origen.
4. **Eliminación Coherente:** El botón Eliminar en cada fila invoca el diálogo de confirmación ya probado en la aplicación y sincroniza las vistas contables.
5. **No Regresión:** Las 27 suites de pruebas existentes continúan pasando al 100%, y una nueva suite específica verifica los botones, llamadas y flujos de CRUD y Duplicación en el Libro Diario.

