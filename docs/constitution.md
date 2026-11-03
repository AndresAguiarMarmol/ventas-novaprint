# Constitución del Proyecto — Novaprint App

## 1. Misión y Propósito
**Novaprint** es una aplicación web integral diseñada específicamente para una microempresa de personalización y estampado textil (poleras, polerones, buzos y gorras). Su objetivo es proporcionar un control operativo completo, ágil y visual a través de dos grandes módulos:
- **Módulo de Ventas:** Control de Clientes y Control de Pedidos (con detalles de prendas, técnicas de estampado, tallas, colores, estados de entrega y pagos/abonos).
- **Módulo de Producción:** Control de Compras de Insumos, Control de Inventarios (prendas base y materiales), Control de Proveedores y Control de Proyectos/Órdenes de Trabajo en taller.

---

## 2. Principios Técnicos y Stack Tecnológico (Estilo Momentos Cookie)
1. **Cero dependencias de compilación:** Sin Webpack, Vite, Node build steps ni empaquetadores complejos. La aplicación debe ser 100% funcional abriendo `index.html` en el navegador (`file://`) o mediante un servidor estático ligero (`npx serve`, `python -m http.server`).
2. **Modularidad Vanilla JavaScript:** Arquitectura desacoplada en módulos con responsabilidades aisladas:
   - `storage.js`: Capa de persistencia en `localStorage`, esquemas, validaciones, exportación/importación JSON y seed data de demostración.
   - `sales.js`: Lógica de clientes, cotizaciones, pedidos, cálculos de abonos y saldos pendientes.
   - `production.js`: Lógica de compras, control de stock, catálogo de insumos/prendas lisas, proveedores y avance de proyectos/órdenes de estampado.
   - `ui.js`: Renderizado reactivo en el DOM, control de modales nativos (`<dialog>`), tablas, tarjetas, alertas y badges de estado.
   - `ticket.js`: Generación de comprobantes y órdenes de trabajo imprimibles (`@media print`) y compartibles por WhatsApp.
   - `main.js`: Inicialización, navegación entre módulos y controladores de eventos.
3. **Estética y UI:**
   - Tailwind CSS vía CDN con configuración visual propia para Novaprint (tonos modernos, tipografía nítida, paleta contrastada para taller y oficina: índigo/azul eléctrico, grafito, toques neón/ámbar).
   - Lucide Icons vía CDN para iconografía coherente.
   - Componentes nativos accesibles: modales con `<dialog>`, feedback visual inmediato (toasts/notificaciones) y navegación por pestañas accesible.
4. **Resiliencia de Datos y PWA:**
   - Persistencia local robusta en `localStorage`.
   - Sistema de respaldo integral descargable en formato `.json` y restauración validada.
   - Service Worker (`sw.js`) y `manifest.json` para capacidad offline y uso como aplicación instalable (PWA) en móviles y tablets de taller.
5. **Optimización de Impresión:**
   - Reglas de `@media print` para emitir órdenes de taller (para el operador de la plancha/estampado) y comprobantes de cliente en formato ticket/A4 sin elementos innecesarios de navegación.

---

## 3. Metodología de Desarrollo — SDD (Spec-Driven Development)
1. **Flujo de desarrollo:** Constitución → Especificación (`spec.md`) → Clarificación con Usuario → Plan Técnico (`plan.md`) → Lista de Tareas (`tasks.md`) → Implementación → Validación con Tests.
2. **Prioridad de la especificación:** "La spec manda". No se implementa código que no esté especificado ni aprobado.
3. **División modular por especificaciones:**
   - `specs/001-modulo-ventas`: Control de Clientes y Gestión de Pedidos de estampado.
   - `specs/002-inventario-proveedores`: Control de Proveedores, Compras e Inventarios de Insumos/Prendas.
   - `specs/003-control-proyectos`: Control de Proyectos y Órdenes de Trabajo en Producción.
