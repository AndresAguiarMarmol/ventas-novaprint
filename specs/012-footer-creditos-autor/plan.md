# Plan de Implementación — Spec 012: Pie de Página con Créditos y Contacto

## 1. Estructura HTML (`index.html`)
- Ubicar el elemento `<footer class="mt-auto py-4 bg-white border-t border-gray-200 text-center text-xs text-gray-500 no-print">` justo después de `</main>` y antes de los `<dialog>` modales.
- Estructurar el texto:
  ```html
  <footer class="mt-auto py-4 bg-white border-t border-gray-200 text-center text-xs text-gray-500 no-print">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <p id="app-footer-text" class="flex flex-wrap items-center justify-center gap-1 sm:gap-2 leading-relaxed">
        <span>Análisis/Diseño de Andres Aguiar V <strong id="footer-version-code">26.11</strong> Santiago de Chile (<span id="footer-date-name">Noviembre 2026</span>)</span>
        <span class="hidden sm:inline text-gray-300">•</span>
        <span>Contacto <a href="tel:+56933395447" class="font-medium text-gray-700 hover:text-blue-600 underline transition-colors">+56933395447</a></span>
        <span class="hidden sm:inline text-gray-300">•</span>
        <span>WhatsApp <a href="https://wa.me/56933395447" target="_blank" rel="noopener noreferrer" class="font-medium text-emerald-600 hover:text-emerald-700 underline transition-colors">+56933395447</a></span>
      </p>
    </div>
  </footer>
  ```

## 2. Lógica JavaScript (`assets/js/main.js`)
- Crear función `actualizarFooterCreditos()`:
  - Obtiene la fecha actual `new Date()`.
  - Calcula `aa = String(fecha.getFullYear()).slice(-2)` y `mm = String(fecha.getMonth() + 1).padStart(2, '0')`.
  - Determina el nombre del mes en español capitalizado (ej. "Noviembre") y el año (ej. 2026).
  - Actualiza los elementos correspondientes en el DOM (`#footer-version-code` y `#footer-date-name`).
- Invocar `actualizarFooterCreditos()` en `init()`.
- Exportar `actualizarFooterCreditos` en `NovaprintMain` para permitir pruebas automatizadas.

## 3. Pruebas Unitarias
- Extender `tests/theme.test.js` o crear prueba unitaria comprobando que la generación de la fecha de versión y el texto del footer calculan correctamente el formato `AA.MM` y `(Mes Año)`.

## 4. Memoria del Proyecto (`memory.md`)
- Actualizar `memory.md` en Sección 2 (Decisiones vigentes) y Sección 3 (Historial de cambios).

