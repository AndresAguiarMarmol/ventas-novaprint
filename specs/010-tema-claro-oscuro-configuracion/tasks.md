# Tareas de Implementación — Spec 010: Tema Claro / Oscuro en Configuración

- [x] **Tarea 1: Especificación y Diseño Técnico (SDD)**
  - Crear `spec.md`, `plan.md` y `tasks.md` en `specs/010-tema-claro-oscuro-configuracion/`.

- [x] **Tarea 2: Soporte en Persistencia y Almacenamiento (`assets/js/storage.js`)**
  - Añadir `theme: 'system'` a `DEFAULT_SETTINGS`.
  - Asegurar que `getSettings()` y `saveSettings()` manejen `theme`.
  - Extender pruebas unitarias en `tests/storage.test.js`.

- [x] **Tarea 3: Estilos y Tokens de Modo Oscuro (`assets/css/custom.css`)**
  - Añadir reglas complementarias para `html.dark` que adapten integralmente encabezados, modales, tarjetas, tablas, inputs y barras con las variables CSS existentes.
  - Diseñar `.theme-selector-card` y estados activos para la selección de tema.
  - Asegurar que `@media print` preserve tickets y reportes en blanco y negro nítido.

- [x] **Tarea 4: Interfaz de Usuario y Prevención FOUC (`index.html`)**
  - Agregar `<meta name="color-scheme" content="light dark">` en `<head>`.
  - Añadir script inline síncrono en `<head>` para evitar destellos (FOUC) al cargar la página.
  - Añadir selector visual interactivo de tema (Claro / Oscuro / Sistema) dentro del modal `#dialog-settings`.

- [x] **Tarea 5: Lógica de Aplicación y Reactividad (`assets/js/main.js`)**
  - Implementar funciones `aplicarTema(tema)` y `resolverEsOscuro(tema)`.
  - Sincronizar botones interactivos en `#dialog-settings` con vista previa en tiempo real.
  - Añadir listener a `window.matchMedia('(prefers-color-scheme: dark)')` para el modo `system`.
  - Guardar el tema seleccionado al guardar los ajustes del taller y al restaurar respaldos.

- [x] **Tarea 6: Pruebas Automatizadas y Verificación**
  - Crear suite `tests/theme.test.js` con pruebas completas de resolución, aplicación DOM y normalización.
  - Ejecutar suite de pruebas con `node --test tests/*.test.js` (96 pruebas pasando al 100% en verde).

- [x] **Tarea 7: Documentación y Memoria del Proyecto (`memory.md`)**
  - Actualizar `memory.md` en Sección 1 (Estructura de datos), Sección 2 (Decisiones vigentes) y Sección 3 (Historial de cambios).
