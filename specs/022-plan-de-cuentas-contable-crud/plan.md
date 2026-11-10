# Plan Técnico — Spec 022: Plan de Cuentas Contable y Operaciones CRUD

## 1. Arquitectura y Módulos Involucrados

1. **`assets/js/accounting.js` (Lógica y Catálogo de Cuentas):**
   - Definir `TIPOS_CUENTA`: `Activo`, `Pasivo`, `Capital`, `Ingreso`, `Egreso`.
   - Definir `PLAN_CUENTAS_DEFECTO`: Catálogo canónico con las 20 cuentas predeterminadas de Novaprint (códigos 1xxx, 2xxx, 3xxx, 4xxx, 5xxx), sus tipos, subtipos y descripciones.
   - Proveer métodos de validación de estructura contable: `validarCuentaContable(cuenta, cuentasExistentes)`.
   - Adaptar `CUENTAS_CONTABLES` para interoperar transparentemente con las cuentas dinámicas de `storage`.

2. **`assets/js/storage.js` (Persistencia y CRUD en `localStorage`):**
   - Añadir `STORAGE_KEYS.ACCOUNTS = 'novaprint_accounts'`.
   - Implementar:
     - `getAccounts(filtroTipo = null)`: con inicialización automática a `PLAN_CUENTAS_DEFECTO` si la clave no existe o está vacía.
     - `getAccountById(id)`
     - `getAccountByCode(codigo)`
     - `saveAccount(accountData)`: genera ID `ACC-[codigo]`, valida campos obligatorios y unicidad de código, actualiza si ya existe o inserta al listado.
     - `deleteAccount(id)`: impide eliminar si `esSistema === true` y retorna `{ success, error }`.
     - `resetDefaultAccounts()`: reinicializa con las cuentas por defecto.
   - Extender `exportBackup` e `importBackup` para incluir `accounts`.
   - Extender `clearAllData` preservando o regenerando el Plan de Cuentas por defecto.

3. **`index.html` (Estructura Visual y Modales):**
   - En `#view-accounting`:
     - Agregar botón de pestaña `#btn-acc-sub-chart` ("📑 Plan de Cuentas").
     - Agregar sección `#acc-subview-chart` con:
       - Cabecera y botón `#btn-new-account`.
       - Badges/contadores para cada uno de los 5 tipos: Activos, Pasivos, Capital, Ingresos, Egresos.
       - Filtros rápidos por tipo (`Todos`, `Activo`, `Pasivo`, `Capital`, `Ingreso`, `Egreso`) e input buscador `#acc-search-account`.
       - Tabla responsiva `#acc-table-accounts` con cuerpo `#acc-tbody-accounts`.
   - Agregar modal `<dialog id="dialog-account">` con formulario `#form-account` para crear y editar cuentas.

4. **`assets/js/ui.js` (Controladores y Renderizado):**
   - En `cambiarSubVistaContable`: soportar el valor `'chart'` para activar `#acc-subview-chart` y resaltar `#btn-acc-sub-chart`.
   - Implementar `renderAccountsChart(filtroTipo = null, terminoBusqueda = '')`:
     - Renderiza las insignias de conteo por grupo.
     - Renderiza las filas de la tabla con estilos diferenciados por tipo (azul para Activo, ámbar para Pasivo, púrpura para Capital, esmeralda para Ingreso, rojo/naranja para Egreso).
     - Botones `[✏️]` para editar y `[🗑️]` para eliminar (deshabilitado o informativo para cuentas del sistema).
   - Implementar `abrirModalNuevaCuenta()`.
   - Implementar `editarCuenta(accountId)`.
   - Implementar `guardarCuentaDesdeFormulario()`.
   - Implementar `confirmarEliminarCuenta(accountId)`.
   - Integrar eventos en `main.js` para `#btn-new-account`, `#form-account` y filtros de cuentas.

5. **`tests/chart_of_accounts_crud.test.js` (Pruebas Automatizadas):**
   - Validación de tipos de cuenta (Activo, Pasivo, Capital, Ingreso, Egreso).
   - Pruebas de CRUD en `storage.js` (crear, leer, actualizar, eliminar, protección de cuentas del sistema).
   - Pruebas de unicidad de códigos contables.
   - Pruebas de integración de respaldo y restauración JSON.
   - Pruebas de renderizado y modales en `ui.js`.

---

## 2. Flujo de Datos

```
[Usuario en Vista Contabilidad]
         │
         ├──> Clic en "📑 Plan de Cuentas"
         │         │
         │         ▼
         │   cambiarSubVistaContable('chart')
         │   renderAccountsChart() ───> getAccounts() de storage
         │
         ├──> Filtro por Tipo (Activo / Pasivo / Capital / Ingreso / Egreso) o Búsqueda
         │         │
         │         ▼
         │   renderAccountsChart(filtro, query)
         │
         ├──> Clic en "+ Nueva Cuenta" / "✏️ Editar"
         │         │
         │         ▼
         │   abrirModalNuevaCuenta() / editarCuenta(id)
         │   Muestra <dialog id="dialog-account">
         │
         ├──> Submit en formulario
         │         │
         │         ▼
         │   guardarCuentaDesdeFormulario() ───> saveAccount(data) en storage
         │   Refresca vista y emite toast de éxito
         │
         └──> Clic en "🗑️ Eliminar"
                   │
                   ▼
             confirmarEliminarCuenta(id) ───> deleteAccount(id) (Valida esSistema)
             Refresca vista y emite toast
```
