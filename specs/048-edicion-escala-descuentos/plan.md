# Plan de Arquitectura e Implementación — Spec 048: Edición Interactiva de la Escala de Descuentos por Volumen

## 1. Arquitectura y Componentes Afectados

### A. Capa de Datos y Persistencia (`assets/js/storage.js`)
- Definir la constante `DEFAULT_VOLUME_TIERS`:
  ```javascript
  const DEFAULT_VOLUME_TIERS = [
    { min: 1, max: 5, percent: 0, label: '1 a 5 unidades', category: 'Precio regular base' },
    { min: 6, max: 11, percent: 5, label: '6 a 11 unidades', category: 'Medio volumen' },
    { min: 12, max: 24, percent: 10, label: '12 a 24 unidades', category: 'Docena' },
    { min: 25, max: 49, percent: 15, label: '25 a 49 unidades', category: 'Mayorista' },
    { min: 50, max: 999999, percent: 20, label: '50 o más unidades', category: 'Gran volumen' }
  ];
  ```
- Implementar y exportar en `NovaprintStorage`:
  - `getVolumeDiscountTiers()`: Retorna `settings.volumeDiscountTiers` (clonado) o `DEFAULT_VOLUME_TIERS`.
  - `saveVolumeDiscountTiers(tiers)`: Valida la estructura y guarda en `novaprint_settings.volumeDiscountTiers`.
  - `resetVolumeDiscountTiers()`: Restaura `DEFAULT_VOLUME_TIERS` en `novaprint_settings`.

### B. Lógica de Negocio y Cotización (`assets/js/sales.js`)
- En `calcularDescuentoVolumen(totalCantidad, subtotalBruto, escalaOpciones = null)`:
  - Si `escalaOpciones` no se pasa, consultar `global.NovaprintStorage.getVolumeDiscountTiers()` si está disponible; fallback a `DEFAULT_VOLUME_TIERS`.
  - Ordenar los tramos descendentemente por `min`.
  - Encontrar el primer tramo donde `qty >= tier.min`.
  - Calcular el descuento según `tier.percent`.

### C. Interfaz de Usuario y DOM (`index.html` & `assets/js/ui.js`)
- En `index.html` (`#dialog-volume-discounts`):
  - Actualizar la tabla con contenedor `#volume-discounts-table-body` para permitir renderizado e inputs interactivos:
    - Fila 0..3: `<input id="tier-min-${i}">` a `<input id="tier-max-${i}">` un. | Descuento: `<input id="tier-percent-${i}"> %` | Categoría fija
    - Fila 4: `<input id="tier-min-4">` un. o más | Descuento: `<input id="tier-percent-4"> %` | Categoría fija
  - En el pie del modal:
    - `<button id="btn-save-volume-discounts" class="...">💾 Guardar Escala</button>`
    - `<button id="btn-reset-volume-discounts" class="...">🔄 Predeterminados</button>`
    - `<button id="btn-close-volume-discounts" class="..." onclick="dialog.close()">Cerrar</button>`
- En `assets/js/ui.js`:
  - `abrirModalDescuentosVolumen()`: Lee los tramos guardados y llena los inputs. Si hay pedido abierto, resalta el tramo activo.
  - `guardarEscalaDescuentosDesdeFormulario()`: Lee los inputs, valida, guarda con `storage.saveVolumeDiscountTiers()`, recalcula totales si el pedido está abierto y muestra toast.
  - `restablecerEscalaDescuentos()`: Llama a `storage.resetVolumeDiscountTiers()`, actualiza inputs y muestra toast.

---

## 2. Pruebas Automatizadas (`tests/volume_discounts_editable.test.js`)
- **Test 1:** `storage.getVolumeDiscountTiers()` retorna los 5 tramos predeterminados si no hay configuración personalizada.
- **Test 2:** `storage.saveVolumeDiscountTiers()` persiste rangos y porcentajes modificados.
- **Test 3:** `sales.calcularDescuentoVolumen()` aplica la escala personalizada de almacenamiento.
- **Test 4:** `storage.resetVolumeDiscountTiers()` restaura los tramos originales.
- **Test 5:** `index.html` contiene los inputs de min, max y porcentaje, y los botones de Guardar y Restablecer.
