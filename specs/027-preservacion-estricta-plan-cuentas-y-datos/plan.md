# Plan de Implementación — Spec 027: Preservación Estricta del Plan de Cuentas y Datos del Taller

## 1. Fase de Respaldo y Protección Previa (Completada)
- [x] Generación de respaldo JSON del estado actual de datos en `backups/backup_pre_preservacion_plan_cuentas_20261110.json`.
- [x] Creación y publicación del tag Git `backup-pre-preservacion-plan-cuentas-20261110`.

## 2. Fase de Neutralización de Riesgos de Borrado
- [ ] **Modificar `assets/js/main.js`:**
  - En `init()` (línea ~50), remover la llamada a `limpiarDatosDemoPrevios()`.
  - En la definición de `limpiarDatosDemoPrevios()` (líneas ~24-44), reemplazar el cuerpo de la función por un retorno no-op inocuo para asegurar que jamás invoque `storage.clearAllData()`.
- [ ] **Modificar `index.html`:**
  - En `#acc-subview-chart` (líneas ~1025-1028), remover el elemento `<button id="btn-reset-accounts">`.
  - Asegurar que la cabecera mantenga el botón `#btn-new-account` ("+ Nueva Cuenta") limpio y accesible.
- [ ] **Modificar `assets/js/ui.js`:**
  - Proteger `confirmarRestablecerCuentas` o desvincular el event listener huérfano de `#btn-reset-accounts` de manera segura, sin provocar advertencias en consola.
- [ ] **Modificar `assets/js/storage.js`:**
  - Actualizar `resetDefaultAccounts(forzarReemplazo = false)`:
    - Si `forzarReemplazo === true`, restablece el array canónico de 21 cuentas (para testing).
    - Por defecto (`forzarReemplazo === false`), obtiene las cuentas existentes. Mantiene todas las cuentas del usuario (personalizadas y existentes) y únicamente añade aquellas cuentas de sistema predeterminadas que no existan por código.

## 3. Fase de Testing Automatizado
- [ ] Crear suite de pruebas `tests/data_preservation_chart_accounts.test.js` cubriendo:
  - Preservación de cuentas personalizadas en `resetDefaultAccounts()`.
  - Verificación de no-borrado ante proveedores con ID `PRV-001` o clientes `CLI-001`.
  - Ausencia de `#btn-reset-accounts` en el archivo `index.html`.
  - Integridad de datos en `localStorage` ante llamadas de inicialización de cuentas.
- [ ] Ejecutar suite completa con `node --test tests/*.test.js` y verificar que 100% pase sin fallas.

## 4. Fase de Documentación y Cierre
- [ ] Actualizar `memory.md` (Sección 1, Sección 2 con Spec 027 y Sección 3 con registro histórico).
- [ ] Completar `tasks.md` marcando todas las tareas como completadas.
- [ ] Realizar commit descriptivo y push al repositorio remoto.
