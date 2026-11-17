# Plan de Arquitectura e Implementación — Spec 047: Botón para Modificar Escala de Descuentos en Ajustes

## 1. Arquitectura y Componentes Afectados

### A. Vista / DOM (`index.html`)
- **Contenedor objetivo:** `#dialog-settings` (línea ~1650 aprox.).
- **Nueva subsección:** Insertar un bloque temático antes de la sección de Respaldo JSON:
  ```html
  <!-- Políticas Comerciales y Descuentos -->
  <div class="pt-4 border-t border-gray-200 space-y-2">
    <h4 class="text-xs font-bold text-gray-500 uppercase">Políticas Comerciales</h4>
    <p class="text-xs text-gray-500">Consulta y administra las reglas de precios y descuentos por cantidad de prendas del taller.</p>
    <button id="btn-settings-volume-discounts" type="button" class="w-full px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center justify-between border border-blue-200 transition-colors shadow-2xs">
      <span class="flex items-center gap-2">
        <span class="text-base">🏷️</span>
        <span>Modificar Escala de Descuentos</span>
      </span>
      <span class="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Configurar ➔</span>
    </button>
  </div>
  ```

### B. Controlador de Eventos (`assets/js/main.js` o `assets/js/ui.js`)
- En `assets/js/main.js` (dentro de `initEventosConfiguracion`):
  Vincular el evento de clic en `#btn-settings-volume-discounts` para que invoque `NovaprintUI.abrirModalDescuentosVolumen()` (o cierre/superponga con `#dialog-volume-discounts` según la experiencia fluida de usuario).

### C. Módulos Intactos (Garantía de Inmutabilidad)
- `assets/js/sales.js`: Sin cambios (la fórmula de escala de volumen y cálculo de totales permanece inalterada).
- `assets/js/storage.js`: Sin cambios (la persistencia en `novaprint_settings` se mantiene idéntica).
- `assets/js/production.js` & `assets/js/accounting.js`: Sin cambios.

---

## 2. Pruebas Automatizadas (`tests/settings_volume_discounts_button.test.js`)
- **Test 1:** Comprobar que `index.html` incluye `#dialog-settings` y el nuevo botón `#btn-settings-volume-discounts`.
- **Test 2:** Comprobar que el botón tiene la etiqueta y clases accesibles correspondientes.
- **Test 3:** Comprobar que en `main.js` se registra el listener para abrir el diálogo de escala de descuentos al pulsar `#btn-settings-volume-discounts`.
- **Test 4:** Comprobar que las 37 suites de pruebas globales se mantienen pasando al 100%.
