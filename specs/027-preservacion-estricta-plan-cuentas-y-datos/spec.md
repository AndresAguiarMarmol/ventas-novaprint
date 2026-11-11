# Spec 027 — Preservación Estricta del Plan de Cuentas y Datos del Taller

## 1. Contexto y Problema
En el uso diario y modificaciones del sistema Novaprint, el usuario reportó que el Plan de Cuentas o cambios realizados en la aplicación no deben ser eliminados bajo ninguna circunstancia ("No borrar el Plan de Cuentas ni cualquier cambio que se haya realizado al modificar la app. No modificar datos actuales").

Al realizar la auditoría técnica del código, se identificaron tres vectores de riesgo y pérdida involuntaria de datos:
1. **Borrado Automático en Arranque (`main.js`):** La función `limpiarDatosDemoPrevios()` introducida en la Spec 016 se ejecutaba automáticamente en cada inicio de la app (`init()`). Evaluaba si existía algún registro con IDs que contuvieran prefijos demo como `PRV-001`, `CLI-001` o `ORD-001`. Dado que la Spec 021 introdujo como sugerencia el proveedor oficial de telas `PRV-001` ("Textiles Mayoristas Chile"), en cuanto un usuario creaba o usaba dicho proveedor o cliente, la función ejecutaba `storage.clearAllData(true)`, vaciando de forma irreversible todo el `localStorage` (clientes, órdenes, inventario, compras, gastos, transferencias y cuentas).
2. **Botón Destructivo en Interfaz (`index.html`):** En la cabecera de la sub-vista `#acc-subview-chart` existía un botón `#btn-reset-accounts` con etiqueta "🔄 Predeterminadas". Si el usuario lo pulsaba y confirmaba el diálogo, `confirmarRestablecerCuentas()` reemplazaba la totalidad del Plan de Cuentas por las 21 cuentas de fábrica, borrando todas las cuentas personalizadas creadas por el usuario.
3. **Sobrescritura Destructiva en Storage (`storage.js`):** `resetDefaultAccounts()` realizaba un `set(STORAGE_KEYS.ACCOUNTS, PLAN_CUENTAS_DEFECTO)` destructivo en lugar de una combinación o fusión no destructiva (merge) que preserve las cuentas existentes y sus ediciones.

## 2. Requerimientos
- **REQ-01: Neutralización Total de Borrado Automático:**
  - Desactivar completamente `limpiarDatosDemoPrevios()` en `main.js`. Ningún inicio o refresco de pantalla debe ejecutar `storage.clearAllData()`.
- **REQ-02: Remoción del Botón Destructivo en el Plan de Cuentas:**
  - Eliminar de `index.html` el botón `#btn-reset-accounts` ("🔄 Predeterminadas"). La barra de acciones del Plan de Cuentas debe conservar únicamente el botón "+ Nueva Cuenta" (`#btn-new-account`).
- **REQ-03: Blindaje No Destructivo en Storage (`storage.js`):**
  - `resetDefaultAccounts(forzarReemplazo = false)` debe actuar por defecto como una sincronización no destructiva: debe preservar íntegramente todas las cuentas existentes del usuario (tanto de sistema modificadas como cuentas personalizadas creadas por el usuario), limitándose únicamente a incorporar cuentas canónicas del sistema si faltase alguna esencial.
  - La sustitución completa solo se permitirá si explícitamente se pasa `forzarReemplazo === true` (utilizado exclusivamente en entornos de tests aislados).
- **REQ-04: Preservación Absoluta de Datos:**
  - Garantizar que ante cualquier migración, actualización o carga de la aplicación, el catálogo de cuentas contables (`novaprint_accounts`), clientes, pedidos, inventario, compras, gastos y transferencias permanezcan 100% intactos.

## 3. Criterios de Aceptación
1. Iniciar o recargar la aplicación nunca borra ni altera ninguna clave en `localStorage`.
2. Crear cuentas personalizadas en el Plan de Cuentas (ej. activos fijos, pasivos, ingresos, etc.) persiste sin riesgo alguno ante recargas o reinicios.
3. El botón `#btn-reset-accounts` ya no existe en el DOM de la aplicación.
4. `storage.resetDefaultAccounts()` preserva las cuentas personalizadas existentes a menos que se fuerce explícitamente en tests.
5. El 100% de la suite de pruebas unitarias y de integración se ejecuta exitosamente.
