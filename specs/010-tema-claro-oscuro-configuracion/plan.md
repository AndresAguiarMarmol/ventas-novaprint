# Plan de Implementación — Spec 010: Tema Claro / Oscuro en Configuración

## 1. Arquitectura de Datos y Persistencia
- Clave existente: `novaprint_settings` en `localStorage`.
- Extensión del esquema de `DEFAULT_SETTINGS`:
  ```javascript
  const DEFAULT_SETTINGS = {
    businessName: 'Novaprint Estampados',
    rut: '76.890.123-4',
    phone: '+56987654321',
    email: 'contacto@novaprint.cl',
    address: 'Av. Salvador 450, Providencia, Santiago',
    currencySymbol: '$',
    ticketFooter: '¡Gracias por confiar en Novaprint! Plazo de reclamo: 48 hrs con comprobante.',
    theme: 'system' // 'light' | 'dark' | 'system'
  };
  ```

## 2. Prevención de FOUC y Metadata en `<head>` (`index.html`)
- Declaración de soporte de esquema de color del navegador:
  ```html
  <meta name="color-scheme" content="light dark">
  ```
- Script síncrono inline inmediatamente en `<head>` para resolver y aplicar el tema antes de pintar el DOM:
  ```html
  <script>
    (function() {
      try {
        var raw = localStorage.getItem('novaprint_settings');
        var theme = 'system';
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.theme) theme = parsed.theme;
        }
        var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  </script>
  ```

## 3. Componentes de Interfaz en `#dialog-settings`
- Agregar sección de "Apariencia de Pantalla" en `#form-settings` con un grupo de botones / radio interactivos estilizados:
  - Opción Claro (`light`): ☀️ Claro
  - Opción Oscuro (`dark`): 🌙 Oscuro
  - Opción Sistema (`system`): 💻 Sistema
- Estados activos visuales con borde azul y resalte sutil.

## 4. Lógica de Aplicación en `assets/js/main.js`
- Función `aplicarTema(tema)`:
  - Determina si debe activarse `.dark` evaluando si es `'dark'` o (`'system'` y media query activa).
  - Modifica `document.documentElement.classList.toggle('dark', isDark)`.
  - Actualiza el `<meta name="color-scheme">` a `'dark'` o `'light'`.
  - Sincroniza el selector visual en `#dialog-settings`.
- Listener a `matchMedia('(prefers-color-scheme: dark)')`:
  - Si el tema configurado es `'system'`, reacciona a cambios de tema en caliente del sistema operativo.
- Integración en `setupBackupAndSettings()`:
  - Al abrir ajustes, marca la opción activa.
  - Al pulsar una opción de tema, ejecuta `aplicarTema(opcion)`.
  - Al guardar el formulario `#form-settings`, incluye `theme` en los datos guardados en `NovaprintStorage.saveSettings()`.

## 5. Cobertura de Estilos en `assets/css/custom.css`
- Mapear de forma coherente los contenedores, modales, tablas, entradas y tarjetas para que cuando `html.dark` esté presente, utilicen las variables CSS `--bg-primary`, `--bg-secondary`, `--bg-card`, `--border-color`, `--text-primary`, `--text-secondary`, y `--modal-bg` ya preparadas en el archivo de diseño.
- Asegurar que la impresión (`@media print`) conserve siempre fondo blanco puro y texto negro.

## 6. Pruebas Unitarias
- Extender `tests/storage.test.js` para comprobar:
  - Que `getSettings()` retorna `theme: 'system'` por defecto.
  - Que `saveSettings({ theme: 'dark' })` persiste correctamente la propiedad.
  - Que la restauración de respaldos maneja limpiamente la propiedad `theme`.
