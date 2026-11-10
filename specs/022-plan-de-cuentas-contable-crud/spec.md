# Spec 022 — Plan de Cuentas Contable y Operaciones CRUD (Activos, Pasivos, Capital, Ingresos y Egresos)

Estado: implementada

## 1. Contexto y Problema
En las especificaciones previas (Spec 018 y Spec 019), **Novaprint** incorporó su Módulo de Contabilidad con Plan de Cuentas, Balance General, Estado de Resultados y Libro Diario enlazado en tiempo real con las ventas de poleras, compras de insumos y gastos de taller. Sin embargo, el catálogo de cuentas contables operaba de forma estática en código duro, impidiendo que el administrador del taller:
- Cree nuevas cuentas contables específicas (ej. cuentas bancarias adicionales, pasivos bancarios, aportes de capital, líneas de ingresos o categorías de egresos como publicidad y marketing).
- Consulte, edite o actualice descripciones, códigos y nombres de las cuentas.
- Elimine o desactive cuentas personalizadas obsoletas.
- Visualice de forma agrupada y estructurada el **Plan de Cuentas oficial** dividido en los 5 grandes grupos de la contabilidad financiera: **Activos, Pasivos, Capital (Patrimonio), Ingresos y Egresos (Costos y Gastos)**.

Se requiere implementar la estructura dinámica y las capacidades completas de **CRUD (Crear, Leer, Actualizar y Eliminar)** para el Plan de Cuentas, dotándolo de persistencia local en `localStorage`, exportación/importación en respaldos JSON y una interfaz visual accesible e intuitiva en la sección de Contabilidad.

## 2. Historias de Usuario
- **Como administrador del taller**, quiero consultar el Plan de Cuentas completo de Novaprint agrupado por Activos, Pasivos, Capital, Ingresos y Egresos, para tener una visión clara de la estructura contable de la empresa.
- **Como usuario contable**, quiero poder crear nuevas cuentas contables (indicando código, nombre, tipo, subtipo y descripción) para registrar operaciones particulares de mi taller.
- **Como operador**, quiero editar cuentas existentes o eliminar cuentas personalizadas que ya no utilice, manteniendo siempre protegidas las cuentas críticas del sistema que alimentan los asientos automáticos de ventas y compras.

## 3. Requisitos Funcionales (Formato EARS)

### [REQ-022-1] Estructura de los 5 Grupos Contables
- **El sistema** debe clasificar todas las cuentas contables bajo los 5 tipos oficiales:
  1. **Activos (Código 1xxx):** Bienes, derechos y recursos económicos (Caja, Bancos, Clientes CxC, Inventario en Bodega, IVA Crédito Fiscal, Maquinaria y Equipos).
  2. **Pasivos (Código 2xxx):** Obligaciones y deudas con terceros (Proveedores CxP, Débito Fiscal IVA, Retenciones y Préstamos).
  3. **Capital / Patrimonio (Código 3xxx):** Recursos propios aportados o generados por el taller (Capital Social, Aportes de Socios, Utilidades Acumuladas y Resultado del Ejercicio).
  4. **Ingresos (Código 4xxx):** Entradas económicas operacionales y no operacionales (Ventas de Poleras, Servicios de Estampado, Fletes/Delivery Cobrados, Otros Ingresos).
  5. **Egresos / Costos y Gastos (Código 5xxx):** Salidas, costos de insumos textiles y gastos operacionales (Costo de Insumos/Prendas, Arriendo de Taller, Servicios Básicos, Mantenimiento de Maquinaria, Publicidad, Mermas).

### [REQ-022-2] Capa de Persistencia y Catálogo Predeterminado (`storage.js`)
- **El sistema** debe persistir el catálogo en la clave `novaprint_accounts` de `localStorage`.
- **Si el almacenamiento no contiene cuentas**, el sistema debe auto-inicializarse con el Plan de Cuentas predeterminado de 20 cuentas oficiales, marcadas con `esSistema: true`.
- **El sistema** debe proveer las funciones CRUD en `NovaprintStorage`:
  - `getAccounts(filtroTipo = null)`: Retorna la lista completa o filtrada por tipo.
  - `getAccountById(id)`: Retorna una cuenta por su identificador único.
  - `getAccountByCode(codigo)`: Retorna una cuenta por su código contable.
  - `saveAccount(accountData)`: Crea o actualiza una cuenta contable validando unicidad de código y campos requeridos.
  - `deleteAccount(id)`: Elimina una cuenta personalizada (impidiendo la eliminación de cuentas protegidas con `esSistema: true` para evitar inconsistencias en asientos contables).
  - `resetDefaultAccounts()`: Permite restablecer el catálogo oficial si se requiere.
- **Las funciones `exportBackup` e `importBackup`** deben incluir íntegramente la clave `accounts`.

### [REQ-022-3] Sub-Vista de Plan de Cuentas en Contabilidad (`index.html` y `ui.js`)
- **En la barra de sub-navegación de `#view-accounting`**, se debe incorporar el botón `[📑 Plan de Cuentas]` (`#btn-acc-sub-chart`) junto a Balance General, Estado de Resultados y Libro Diario.
- **La sub-vista `#acc-subview-chart`** debe incluir:
  - Cabecera con botón `[+ Nueva Cuenta Contable]`.
  - Tarjetas/insignias con el conteo de cuentas por cada uno de los 5 grupos (Activos, Pasivos, Capital, Ingresos, Egresos).
  - Buscador en tiempo real por texto o código, y botones de filtro rápido por tipo (`Todos`, `Activos`, `Pasivos`, `Capital`, `Ingresos`, `Egresos`).
  - Tabla dinámica responsiva listando: Código, Nombre de Cuenta, Grupo/Tipo, Subtipo, Descripción, Distintivo Sistema/Personalizada, y Botones de Acción (`[✏️]` Editar, `[🗑️]` Eliminar).

### [REQ-022-4] Diálogo Modal de Creación / Edición (`#dialog-account`)
- **El sistema** debe proveer el diálogo nativo `<dialog id="dialog-account">` con:
  - Campo `Código` (ej. `1105`, `5207`), numérico o alfanumérico estandarizado.
  - Campo `Nombre de la Cuenta` (ej. `Banco Santander Taller`, `Publicidad Meta Ads`).
  - Selector `Tipo de Cuenta` con opciones: `Activo`, `Pasivo`, `Capital`, `Ingreso`, `Egreso`.
  - Campo `Subtipo` (ej. `Circulante`, `Fijo`, `Operacional`, `Costo de Ventas`, `Capital Social`).
  - Campo `Descripción / Propósito` (opcional).
  - Botones `Cancelar` y `Guardar Cuenta`.

### [REQ-022-5] Preservación y Retrocompatibilidad
- La integración con `calcularBalanceGeneral`, `calcularEstadoResultados` y `generarLibroDiario` debe mantenerse 100% funcional y retrocompatible.
- La suite previa de 166 pruebas unitarias debe continuar pasando con 0 errores.
