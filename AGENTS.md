# AGENTS.md — Novaprint App (Ventas & Producción)

Guía para agentes de IA que trabajen en este proyecto.

## Memoria del proyecto (`memory.md`) — OBLIGATORIO
`memory.md` guarda todo lo que debe preservarse entre sesiones: la estructura de los datos, las decisiones de diseño/arquitectura vigentes y el historial de cambios.

1. **Al empezar cualquier tarea:** leer `memory.md` completo antes de tocar código.
2. **Durante la tarea:** respetar la estructura de datos en `assets/js/storage.js` y las decisiones vigentes.
3. **Al terminar cualquier tarea que cambie algo:** actualizar `memory.md`:
   - Sección 1 si cambia la estructura de datos o persistencia en `localStorage`.
   - Sección 2 si se toma, cambia o elimina una decisión arquitectónica o de diseño.
   - Sección 3: añadir arriba una entrada con la fecha y un resumen breve del cambio.
4. Si `memory.md` y el código no coinciden, avisar al usuario antes de seguir.

---

## Metodología SDD (Spec-Driven Development)
- Todo desarrollo se rige por especificaciones organizadas en carpetas bajo `specs/NNN-nombre/`:
  - `spec.md`: Qué y Por qué (historias de usuario, requisitos funcionales en formato EARS, reglas de negocio y criterios de aceptación).
  - `plan.md`: Cómo (arquitectura de datos, módulos de JS, contratos de funciones y diseño de componentes).
  - `tasks.md`: Lista de tareas ejecutables paso a paso con criterios de verificación verificables.
- Nunca saltar a la implementación sin la aprobación del usuario sobre la especificación y el plan.

---

## Stack y restricciones técnicas
- **HTML5 semántico:** `index.html` con estructura accesible y responsive design.
- **Tailwind CSS via CDN:** Configurado en el `<head>` de `index.html` con modo oscuro (`darkMode: 'class'`).
- **CSS personalizado:** `assets/css/custom.css` para estilos de impresión (`@media print`), animaciones y ajustes visuales finos.
- **JavaScript Vanilla puro (sin compilación ni bundlers):**
  - `assets/js/storage.js`: Almacenamiento `localStorage`, importación/exportación JSON, backup y datos iniciales.
  - `assets/js/sales.js`: Módulo de clientes y pedidos.
  - `assets/js/production.js`: Módulo de proveedores, compras, inventario y proyectos.
  - `assets/js/ui.js`: Renderizado dinámico, modales nativos `<dialog>`, semáforos de entrega y filtros.
  - `assets/js/ticket.js`: Generación de comprobante y tickets imprimibles.
  - `assets/js/main.js`: Orquestador principal, navegación por pestañas y bindings globales.
- **Iconografía:** Lucide Icons cargado vía CDN (`window.lucide.createIcons()`).
- **PWA:** `manifest.json` y `sw.js` para compatibilidad offline y soporte de instalación en dispositivos móviles.

---

## Formato de respuesta al terminar una tarea
- Resumen de 3-4 líneas de lo creado o cambiado.
- Pasos para probarlo.
- Decisiones tomadas por cuenta propia que el usuario deba revisar.
- Confirmar que `memory.md` se ha actualizado.
