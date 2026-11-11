# Plan de Implementación — Spec 029: Depuración y Limpieza de Movimientos Contables de Prueba

## 1. Fase de Respaldo y Protección Previa (Completada)
- [x] Generación de respaldo JSON en `backups/backup_pre_limpieza_movimientos_prueba_20261110.json`.
- [x] Creación y publicación del tag Git `backup-pre-limpieza-movimientos-prueba-20261110`.

## 2. Fase de Lógica de Depuración (`assets/js/storage.js`)
- [ ] Implementar `esRegistroDePrueba(item, tipoEntidad)`:
  - Evalúa `id`, `description`, `notes`, `reference`, `clientName`, `supplierName`, `invoiceNumber`.
  - Excluye explícitamente palabras legítimas de negocio como la categoría de gasto "Mermas y Pruebas" (a menos que su descripción o notas indiquen "prueba de sistema" o similar).
- [ ] Implementar `purgarMovimientosPrueba()`:
  - Lee y filtra `novaprint_expenses`, `novaprint_transfers`, `novaprint_orders`, `novaprint_purchases`.
  - Guarda las colecciones limpias en `localStorage`.
  - Retorna resumen estadístico de la operación.
  - Exportar en el namespace público `NovaprintStorage`.

## 3. Fase de Interfaz de Usuario (`index.html` & `assets/js/ui.js`)
- [ ] En `index.html`:
  - Agregar botón `#btn-journal-clean-tests` en la barra de herramientas del Libro Diario (`#acc-subview-journal`), junto a `[✕ Limpiar]`.
  - Agregar modal accesible `<dialog id="dialog-clean-tests">` con mensaje explicativo, conteo de ítems detectados y botones de cancelar / confirmar.
- [ ] En `assets/js/ui.js`:
  - Implementar `abrirModalLimpiarPruebas()` y `confirmarLimpiarPruebas()`.
  - Sincronizar reactivamente con `refrescarVistaLibroDiario()` y actualización de balances contables.

## 4. Fase de Limpieza Transparente al Iniciar (`assets/js/main.js`)
- [ ] En `init()` de `assets/js/main.js`:
  - Ejecutar `storage.purgarMovimientosPrueba({ silencioso: true })` para garantizar que la vista en el navegador del usuario se limpie automáticamente al recargar.

## 5. Fase de Pruebas Automatizadas
- [ ] Crear suite `tests/clean_test_movements.test.js`:
  - Validar depuración de gastos con patrones de prueba.
  - Validar depuración de transferencias de prueba.
  - Validar depuración de compras y pedidos demo/test.
  - Validar preservación estricta de compras y ventas reales de poleras.
  - Validar preservación de gastos legítimos (incluso de categoría "Mermas y Pruebas").
  - Validar preservación incondicional del Plan de Cuentas (`novaprint_accounts`).
- [ ] Ejecutar suite global con `node --test tests/*.test.js` y verificar 100% aprobado.

## 6. Fase de Documentación y Cierre
- [ ] Actualizar `memory.md` (Sección 2 con Spec 029 y Sección 3 con registro histórico).
- [ ] Completar `tasks.md`.
- [ ] Commit y push a `main`.

