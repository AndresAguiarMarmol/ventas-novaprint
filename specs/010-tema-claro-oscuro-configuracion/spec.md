# Spec 010 — Selector de Tema Claro / Oscuro en Configuración

## 1. Qué y Por Qué
La aplicación Novaprint es utilizada tanto en mostradores de atención al público como en talleres de estampado y en horarios nocturnos. Los usuarios necesitan poder seleccionar la apariencia visual de la pantalla (Modo Claro, Modo Oscuro o Modo Automático/Sistema) directamente desde el panel de Configuración y Ajustes, adaptando el contraste a la iluminación de su entorno de trabajo y preservando su preferencia entre sesiones.

## 2. Historias de Usuario
- **Como usuario del taller**, quiero ingresar a los Ajustes de Novaprint y poder elegir entre el tema Claro, Oscuro o Sistema, para trabajar con menor fatiga visual según la iluminación.
- **Como administrador**, quiero que mi elección de tema se guarde automáticamente en el navegador y se aplique inmediatamente al cargar la app sin parpadeos visuales (FOUC).
- **Como usuario con preferencia del sistema**, quiero poder seleccionar la opción "Sistema" para que la aplicación responda automáticamente al tema de mi sistema operativo o dispositivo móvil.

## 3. Requisitos Funcionales (EARS)
- **Ubiquitous (General):** El sistema deberá soportar tres estados de apariencia: `light` (Claro), `dark` (Oscuro) y `system` (Automático / según sistema operativo).
- **Event-Driven (Apertura de Ajustes):** Cuando el usuario abra el diálogo de Ajustes (`#dialog-settings`), el selector de apariencia deberá reflejar el tema actualmente activo.
- **Event-Driven (Cambio de opción):** Cuando el usuario seleccione una opción de tema en el formulario de configuración, la interfaz deberá aplicar el tema en tiempo real (`document.documentElement.classList` y `<meta name="color-scheme">`) para vista previa inmediata.
- **Event-Driven (Guardado de Ajustes):** Cuando el usuario guarde la configuración, el valor del tema se persistirá en `localStorage` dentro del objeto `novaprint_settings`.
- **State-Driven (Modo Sistema):** Mientras la opción activa sea `system`, el sistema deberá escuchar cambios en la media query `prefers-color-scheme: dark` y alternar la apariencia automáticamente si el sistema operativo cambia de modo.
- **Event-Driven (Carga inicial):** Cuando la página se cargue en el navegador, un script síncrono temprano en `<head>` deberá leer la preferencia guardada y aplicar la clase `.dark` antes del renderizado para evitar destellos de contenido desalineado (FOUC).

## 4. Criterios de Aceptación
1. El modal `#dialog-settings` incluye una sección visible y atractiva de "Apariencia y Tema de Pantalla" con tres opciones: ☀️ Claro, 🌙 Oscuro y 💻 Automático / Sistema.
2. La preferencia seleccionada se persiste en `novaprint_settings` de `localStorage`.
3. Al seleccionar o cambiar de tema, la aplicación actualiza inmediatamente su esquema cromático en toda la pantalla (barra superior, paneles, tarjetas, tablas, formularios, modales y botones).
4. El modo oscuro mantiene contraste accesible (WCAG AA) y armonía visual con la paleta de colores de Novaprint.
5. Los comprobantes y tickets de impresión (`@media print`) permanecen siempre en fondo blanco y texto negro de alta legibilidad física.
6. La suite completa de pruebas unitarias pasa al 100% en verde.
