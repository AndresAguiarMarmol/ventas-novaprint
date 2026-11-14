# Spec 040 — Enlace de Categoría de Gastos de Taller con Cuentas del Plan de Cuentas

## 1. Contexto y Justificación
En el Módulo de Contabilidad, el diálogo de registro de gastos operacionales (`#dialog-expense`) cuenta actualmente con un selector estático (`#expense-category-select`) con opciones fijas (ej. "Arriendo de Taller", "Electricidad y Servicios", etc.).
Por otra parte, la aplicación dispone de un Plan de Cuentas dinámico (Spec 022) donde las cuentas del Grupo 5 ("Egresos" / "Gastos", códigos `5xxx`) representan las cuentas oficiales de costos y gastos del taller (tanto las canónicas como las creadas por el usuario).

El usuario ha solicitado formalmente:
> "la 'Categoria de Gastos' que se encuentre dentro de 'Registrar Gastos de Taller', debe estar enlazada a las cuentas de Gastos del Plan de Cuentas. No modificar nada adicional"

Esta especificación formaliza el enlace dinámico y bidireccional entre el selector de categoría en "Registrar Gastos de Taller" y el catálogo de cuentas de Egresos/Gastos del Plan de Cuentas, permitiendo que cualquier cuenta de gasto existente o nueva cuenta creada por el usuario esté disponible de inmediato al registrar un gasto operacional, imputando contablemente de forma precisa los asientos en el Libro Diario y los saldos del Plan de Cuentas.

---

## 2. Historias de Usuario

- **US-01:** Como encargado de finanzas del taller, quiero que al abrir el modal "Registrar Gasto de Taller", el selector "Categoría de Gasto" cargue dinámicamente las cuentas de egreso/gasto del Plan de Cuentas, para que las opciones reflejen siempre la estructura contable real del negocio.
- **US-02:** Como usuario contable, quiero que si creo una nueva cuenta contable bajo el grupo "Egreso" (ej. `5207 Publicidad y Marketing`), dicha cuenta aparezca disponible inmediatamente en el formulario de gastos de taller.
- **US-03:** Como usuario, quiero que al guardar un gasto se asocie no solo el nombre de la categoría sino también el código y ID de la cuenta contable (`accountCode`, `accountId`, `accountName`), para que el asiento del Libro Diario y el saldo del Plan de Cuentas se imputen con total precisión.
- **US-04:** Como usuario, quiero que al editar o duplicar un gasto existente, la categoría/cuenta previamente guardada se preseleccione fielmente en el formulario.

---

## 3. Requisitos Funcionales (EARS)

- **RF-01 (Poblado Dinámico de Cuentas de Gasto):**
  - *Cuando* se abra el modal `#dialog-expense` mediante `abrirModalNuevoGasto`, `editarGasto` o `duplicarGasto`, el sistema *deberá* poblar dinámicamente `#expense-category-select` a partir de las cuentas de gasto activas (`tipo: 'Egreso'` o grupo `5xxx`) obtenidas de `storage.getAccounts()`.

- **RF-02 (Formato de Opciones en el Selector):**
  - *Cuando* se generen las opciones de `#expense-category-select`, el sistema *deberá* mostrar cada cuenta con su código y nombre (ej. `5201 — Arriendo de Taller`), almacenando los atributos `data-code` y `data-id`.

- **RF-03 (Persistencia de la Cuenta en la Entidad Gasto):**
  - *Cuando* el usuario guarde un gasto mediante `guardarGastoDesdeFormulario`, el sistema *deberá* almacenar en el objeto de gasto: `category` (nombre de la cuenta), `accountCode` (código de la cuenta contable), `accountId` (ID único de la cuenta) y `accountName` (nombre oficial).

- **RF-04 (Imputación Exacta en Libro Diario y Libro Mayor):**
  - *Cuando* `accounting.js:generarLibroDiario` genere los asientos de gastos (`tipo: 'Gasto'`), *deberá* imputar `cuentaDebe` a la cuenta contable asociada (`accountName || category`), y `asientoAfectaCuenta` / `calcularSaldosPlanCuentas` *deberán* vincular el movimiento por `accountCode`, `accountId` o nombre.

- **RF-05 (Retrocompatibilidad con Gastos Preexistentes):**
  - *Cuando* se edite un gasto registrado previamente con nombres de categoría antiguos (ej. `'Arriendo de Taller'`, `'Servicios Básicos'`, `'Otros Gastos'`), el sistema *deberá* resolver la cuenta correspondiente por coincidencia de nombre o código para preseleccionarla sin alterar registros históricos.

---

## 4. Reglas de Negocio

1. **Filtro de Cuentas Elegibles:** Únicamente participan en el selector las cuentas contables activas (`activo !== false`) cuyo tipo sea `'Egreso'` (o `'Gasto'`) o cuyo código inicie con `'5'`.
2. **Orden de Presentación:** Las opciones se ordenan de forma ascendente por código contable (`5101`, `5201`, `5202`, ..., `5206`, `5207`).
3. **No Modificar Nada Adicional:** La vinculación se limita a conectar la categoría de gastos con las cuentas de egreso del Plan de Cuentas sin alterar cotizaciones, pedidos, compras, stock de inventario ni balance general.

---

## 5. Criterios de Aceptación

- [ ] `#expense-category-select` se puebla dinámicamente desde `storage.getAccounts()` al registrar, editar o duplicar gastos.
- [ ] Las cuentas creadas por el usuario en el Plan de Cuentas bajo el grupo "Egreso" figuran automáticamente en el selector.
- [ ] Cada opción presenta el código y nombre de la cuenta (ej. `5201 — Arriendo de Taller`).
- [ ] Al guardar un gasto, se persisten `category`, `accountCode`, `accountId` y `accountName`.
- [ ] En el Libro Diario, el asiento de gasto refleja la cuenta del Plan de Cuentas al Debe y Caja/Bancos al Haber.
- [ ] En el Plan de Cuentas, el filtro de movimientos y el saldo dinámico reconocen los gastos imputados.
- [ ] Suite de pruebas unitarias actualizada y 100% pasando (0 regresiones sobre las 31 suites).

