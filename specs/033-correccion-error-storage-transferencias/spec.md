# Spec 033: Corrección de Excepción "storage is not defined" al Registrar Transferencias entre Cuentas y Refrescar Compras

## 1. Contexto y Problema
Al realizar una transferencia entre dos cuentas contables (por ejemplo, entre la cuenta `3101` y `3102`) en el modal `#dialog-transfer`, la aplicación muestra en pantalla la alerta:
> *"storage is not defined"* (o *"Storage is not Definid"*).

### Causa Raíz Identificada
1. Al confirmar una transferencia desde el formulario (`NovaprintUI.guardarTransferenciaDesdeFormulario`), la transferencia se valida y se persiste correctamente en `NovaprintStorage.saveTransfer(datos)`.
2. A continuación, el flujo ejecuta `refrescarContabilidadCompleta()`, la cual invoca la sincronización reactiva global `NovaprintMain.refrescarDatos()`.
3. Dentro de `refrescarDatos()`, se llama a `refrescarCompras()`, la cual a su vez ejecuta `NovaprintUI.renderPurchasesTable(todasCompras)`.
4. En [`assets/js/ui.js`](file:///d:/Carpetas/Desarrollos/Desarrollos%20WEB/Ventas%20Novaprint/assets/js/ui.js#L1815), dentro de `renderPurchasesTable(compras = [])`, cuando existen compras registradas (`compras.length > 0`), se ejecuta:
   ```javascript
   const inventario = storage ? storage.getInventory() : [];
   ```
   Sin embargo, en el ámbito de la función `renderPurchasesTable` **no se había declarado la variable `storage`** (`const storage = global.NovaprintStorage;`).
5. El motor de JavaScript lanza inmediatamente `ReferenceError: storage is not defined`.
6. Como la invocación se originó dentro del bloque `try { ... }` de `guardarTransferenciaDesdeFormulario`, la excepción es capturada por el bloque `catch (err)` y proyectada al usuario a través del componente de notificaciones `showToast(err.message, 'error')`.

---

## 2. Requerimientos Funcionales (Formato EARS)

### [REQ-01] Declaración Segura de Dependencias en `renderPurchasesTable`
- **Mientras** se renderice la tabla de compras mediante `NovaprintUI.renderPurchasesTable(compras)`:
  - **El sistema deberá** resolver de forma segura la capa de persistencia `storage` a través de `global.NovaprintStorage` (o parámetro local de respaldo).
  - **Si** `storage` está disponible, se obtendrá el inventario (`storage.getInventory()`); en caso contrario, se utilizará un array vacío `[]` como valor por defecto seguro, previniendo cualquier excepción de tipo `ReferenceError`.

### [REQ-02] Ejecución Fluida de Transferencias entre Cuentas Contables
- **Cuándo** el usuario complete el formulario de transferencia entre cuentas (ej. entre `3101` y `3102` o cualquier par de cuentas válidas) y presione *"Confirmar Transferencia"*:
  - **El sistema deberá** registrar el traspaso en `novaprint_transfers`.
  - **El sistema deberá** cerrar el modal `#dialog-transfer`.
  - **El sistema deberá** mostrar el mensaje de éxito `Transferencia de $X registrada con éxito.`
  - **El sistema deberá** refrescar sin errores la contabilidad, el balance general, el libro mayor y la tabla de compras.

---

## 3. Criterios de Aceptación
1. Al registrar una transferencia entre cuentas contables (incluyendo cuentas de Capital como `3101` y `3102`), la operación se procesa exitosamente sin arrojar el error *"storage is not defined"*.
2. La función `renderPurchasesTable(compras)` renderiza correctamente cualquier colección de compras (vacía o con múltiples ítems) sin referencias a variables no declaradas.
3. Se agrega una prueba unitaria específica que ejecute `renderPurchasesTable` con compras registradas para blindar contra regresiones.
4. El 100% de la suite de pruebas automatizadas continúa pasando con éxito.

