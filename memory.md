# memory.md — Memoria del proyecto Novaprint

Registro de todo lo que debe preservarse entre sesiones de trabajo: arquitectura de datos, decisiones técnicas tomadas e historial de cambios.
**Los agentes deben leer este archivo antes de empezar y actualizarlo al terminar cada tarea** (ver `AGENTS.md`).

---

## 1. Estructura de datos y persistencia

### A. Claves en `localStorage`
- **`novaprint_settings`:** Configuración de la empresa (nombre, RUT, teléfono/WhatsApp, dirección, moneda `$`, mensaje pie de ticket, preferencia de tema `theme: 'light' | 'dark' | 'system'`).
- **`novaprint_clients`:** Directorio de clientes (`id, name, phone, email, rut, address, notes, createdAt`).
- **`novaprint_orders`:** Registro de pedidos con prendas (poleras, polerones, buzos, gorras), técnicas de estampado (DTF, serigrafía, sublimación, vinilo, bordado), tallas, colores, montos, desglose de IVA (19%), Delivery, abonos y estado.
- **`novaprint_suppliers`:** Catálogo de proveedores (`id, name, contact, phone, email, category, address, notes, createdAt, updatedAt`).
- **`novaprint_inventory`:** Existencias de insumos y prendas base (`id, code, name, category, garmentType, color, size, unit, currentStock, minStock, unitCost, supplierId, supplierName, createdAt, updatedAt`).
- **`novaprint_purchases`:** Historial de compras de insumos/prendas a proveedores (`id, supplierId, supplierName, invoiceNumber, date, items, subtotalNeto, applyIva, ivaPercent, ivaAmount, applyDelivery, deliveryAmount, totalAmount, notes, createdAt`).
- **`novaprint_projects`:** Órdenes de fabricación / proyectos de taller vinculadas a pedidos o stock (`id, code, orderId, name, garmentType, quantity, printTechnique, stage, startDate, targetDate, assignedTo, notes`).

---

## 2. Decisiones vigentes

- **Reglas del Cotizador Textil (skill.md):**
  - **Compatibilidad Técnica:** Sublimación exclusiva para prendas blancas o claras de poliéster (invalida automáticamente telas oscuras o algodón recomendando DTF). Serigrafía sugerida solo para tirajes de 30+ unidades.
  - **Costos de Referencia:** Polera algodón base $3.500, Polera poliéster $2.800, Polerón $11.000, Buzo $12.000, Gorra $3.500. Recargo por tallas especiales (XXL, 3XL) de +$1.200. Estampado logo pecho hasta 10x10 cm ($1.500), grande A4 ($3.200), extra grande A3 ($4.800), sublimación A4 ($1.800).
  - **Escala de Descuento por Volumen:** 1 a 5 un. (0%), 6 a 11 un. (5%), 12 a 24 un. (10% docena), 25 a 49 un. (15%), 50+ un. (20%). Se aplica automáticamente sobre el subtotal bruto en formulario de pedidos, tickets imprimibles y comprobantes de WhatsApp.
- **IVA (19% Chile) y Delivery en Pedidos y Compras (Spec 005):**
  - **Tasa de IVA según legislación chilena (D.L. 825):** 19% (`TASA_IVA_CHILE = 0.19`).
  - **Pregunta interactiva en ambos módulos:** Tanto en el formulario de Pedidos como en el de Compras a proveedores se pregunta si aplica IVA mediante casilla interactiva (`[ ] ¿Aplica IVA (19%)?` / `[ ] ¿Factura con IVA (19%)?`).
  - **Pregunta interactiva y campo Delivery (por defecto $0):** Tanto en Pedidos como en Compras se pregunta si aplica Delivery/Flete con una casilla (`[ ] ¿Aplica Delivery / Envío?` / `[ ] ¿Aplica Flete / Delivery?`), desplegando un campo numérico con valor por defecto `0`.
  - **Fórmula financiera en Ventas:** $\text{Neto} = \text{Subtotal} - \text{Descuento Volumen}$; $\text{IVA} = \text{round}(\text{Neto} \times 0.19)$; $\text{Total} = \text{Neto} + \text{IVA} + \text{Delivery}$; $\text{Saldo} = \text{Total} - \text{Abono}$.
  - **Fórmula financiera en Compras:** $\text{Subtotal Neto} = \sum (\text{cantidad} \times \text{costo unitario})$; $\text{IVA} = \text{round}(\text{Subtotal Neto} \times 0.19)$; $\text{Total} = \text{Subtotal Neto} + \text{IVA} + \text{Delivery}$.
  - **Soporte en comprobantes:** Desglose en vivo en los modales, en tickets imprimibles/térmicos (`ticket.js`) y en mensajes estructurados de WhatsApp (`sales.js`).
- **Datos Propios vs Datos Demo:** La aplicación no inserta datos de muestra automáticamente al iniciar. Inicia con las entidades vacías (`[]`) para uso con datos reales. En `Ajustes` (⚙️) existen botones para vaciar la base de datos o cargar datos de muestra manualmente si se desea hacer pruebas.
- **Selector de Colores Textiles Unificado:** Tanto en el formulario de "Nuevo Pedido" como en "Registrar Artículo en Inventario" (`#dialog-inventory`) se utiliza la misma lista desplegable estandarizada con los colores de la industria textil de estampados (`COLORES_TEXTILES`), garantizando concordancia exacta de stock y permitiendo además especificar colores personalizados mediante la opción interactiva "Otro".
- **Catálogo de Tallas Textiles Estandarizado (Spec 007):** Tanto en Pedidos como en Bodega e Inventario se soportan formalmente las tallas infantiles numéricas (`4, 6, 8, 10, 12, 14, 16, 18`) junto con las tallas adultas (`XS, S, M, L, XL, XXL, Única`). En la interfaz se organizan mediante `<optgroup>` semánticos ("Niños" y "Adultos / Estándar"). Las tallas infantiles no reciben recargo por talla especial y son plenamente compatibles con el cálculo de disponibilidad de bodega y cotizaciones de pedidos.
- **Enlace Prenda-Color-Talla y Auto-creación en Inventario (Spec 008):** Toda prenda de pedido se vincula con el inventario mediante la coincidencia normalizada de su terna `garmentType`, `color` y `size`. Si una prenda requerida no existe previamente en `novaprint_inventory`, el sistema la contabiliza como faltante (`totalPrendasFaltantes`) y, al proceder a la compra de faltantes (`abrirModalCompraConFaltantes`) o guardar el pedido, crea automáticamente el ítem en bodega (`asegurarItemInventarioPrenda`) con stock 0, código estructurado (`POL-AZU-10`) y costo base de referencia. Esto permite enlazarla a la orden de compra con un `inventoryItemId` formal y, al confirmar la compra, incrementar su stock automáticamente en bodega.
- **Botón y Filtro de Saldo por Cobrar (Spec 009):** En la barra de estados/filtros de pedidos se incorpora un botón interactivo rápido (`#btn-filter-balance`) con insignia de conteo en vivo (`#badge-count-pending-balance`) y la opción `<option value="con_saldo">` en el selector de estados. Al activarlo, tanto el tablero Kanban como la tabla de pedidos se filtran deterministamente para mostrar únicamente los pedidos con dinero pendiente de cobro (`totals.balanceAmount > 0`), con activación adicional al hacer clic en la tarjeta KPI "Por Cobrar".
- **Identidad Visual e Iconografía Oficial de la App:** Se estableció el logotipo e isotipo oficial de Novaprint (diseño textil con gotas de tinta CMY y tipografía corporativa) como imagen representativa en toda la aplicación: favicon multi-resolución (`favicon.ico`, `favicon-32x32.png`, `favicon-16x16.png`), icono PWA y pantalla de inicio móvil (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`), encabezado de la barra de navegación (`index.html`) y encabezado de comprobantes imprimibles (`ticket.js`).
- **Selector de Tema Claro / Oscuro / Sistema (Spec 010):**
  - Modelo tri-estado (`light`, `dark`, `system`), persistido en `novaprint_settings`.
  - Prevención de destellos (FOUC) mediante script síncrono temprano y meta tag `<meta name="color-scheme" content="light dark">` en `<head>`.
  - Adaptación cromática integral en `assets/css/custom.css` con variables CSS sobre contenedores, tarjetas, tablas, modales y formularios.
- **Resolución Resiliente de Teléfono y Envío a WhatsApp (Spec 011):**
  - Cascada de resolución telefónica `obtenerTelefonoCliente(pedido)`: busca en `pedido.clientPhone`, en `storage.getClientById(pedido.clientId)`, o por nombre en `storage.getClients()`.
  - Si el teléfono está en la ficha del cliente pero faltaba en el pedido, se sincroniza y persiste automáticamente.
  - Si no existe en el sistema, se solicita amigablemente mediante diálogo interactivo `prompt()`, se almacena en el pedido y se despacha el mensaje sin bloquear la operación.
- **Aislamiento Estricto de Impresión para Tickets y Comprobantes (Spec 011):**
  - En `@media print`, se oculta completamente la aplicación de fondo (`header`, `nav`, `main`, `footer`, vistas SPA, botones y otros modales) evitando que se impriman órdenes ajenas o el tablero Kanban.
  - `#dialog-ticket` y `#printable-ticket-content` se imprimen de forma exclusiva y centrada con ancho estándar de 80mm, compatible con impresoras térmicas de punto de venta y hojas estándar Carta/A4.
  - Sincronización transparente con el botón de impresión, eventos nativos `beforeprint`/`afterprint` y atajo de teclado Ctrl+P.
- **Metodología SDD:** Especificación previa obligatoria antes de escribir código de componentes. El roadmap se divide en especificaciones ordenadas:
  - **Spec 001 (Implementada):** Módulo de Ventas (Control de Clientes y Control de Pedidos de estampado: poleras, polerones, buzos, gorras).
  - **Spec 002 (Implementada):** Módulo de Producción — Control de Compras de Insumos, Control de Inventarios y Control de Proveedores con incremento automático de existencias.
  - **Spec 003 (Implementada):** Módulo de Producción — Control de Fabricación en Taller por estaciones (Diseño, Preparación, Estampado, Calidad y Empacado).
  - **Spec 004 (Implementada):** Enlace Pedidos ➔ Inventario, Detección de Faltantes, Pre-llenado de Compra a Proveedor y Descuento Automático de Bodega en Taller.
  - **Spec 005 (Implementada):** IVA 19% chileno y Delivery en Pedidos y Compras.
  - **Spec 006 (Implementada):** Selector de Colores Textiles en Inventario unificado con Pedidos.
  - **Spec 007 (Implementada):** Tallas Infantiles (4, 6, 8, 10, 12, 14, 16, 18) en Pedidos e Inventario.
  - **Spec 008 (Implementada):** Enlace Prenda-Color-Talla y Auto-creación en Inventario para Compras de Faltantes.
  - **Spec 009 (Implementada):** Botón y Filtro de Pedidos con Saldo por Cobrar en Barra de Estados.
  - **Spec 010 (Implementada):** Selector de Tema Claro / Oscuro / Sistema en Configuración y Prevención FOUC.
  - **Spec 011 (Implementada):** Corrección de WhatsApp e Impresión Unitaria Exclusiva de Ticket.
  - **Spec 012 (Implementada):** Pie de Página con Créditos de Autoría y Contacto Directo.
  - **Spec 013 (Implementada):** Flexibilidad de Precios Libres y Escala Oficial de Descuentos por Volumen.
- **Flexibilidad de Precios y Escala Oficial de Descuentos por Volumen (Spec 013):**
  - **Ingreso Libre de Precios:** Se eliminó cualquier validación restrictiva que forzara múltiplos de $500 o $100 mediante `step="any"` y `novalidate` en `<form id="form-order">`. Se permite registrar prendas con precios libres, promocionales ($0) o personalizados sin bloqueos del navegador.
  - **Botones y Modal de Descuentos por Volumen:** Se incorporó un botón de consulta rápida (`#btn-view-volume-discounts`) en la barra de pedidos y un botón directo (`#btn-open-volume-discounts-order`) dentro del modal de pedido para consultar la escala oficial: 1 a 5 un. (0%), 6 a 11 un. (5%), 12 a 24 un. (10% docena), 25 a 49 un. (15% mayorista) y 50+ un. (20% gran volumen).
  - **Modal Interactivo:** El diálogo `<dialog id="dialog-volume-discounts">` resalta dinámicamente el tramo alcanzado en función de la cantidad de prendas del pedido actual e informa amigablemente cuántas prendas faltan para desbloquear el siguiente nivel de descuento.
- **Pie de Página Corporativo con Créditos de Autoría (Spec 012):**
  - Ubicación semántica `<footer>` al final de la pantalla (`mt-auto`, `.no-print`) adaptado a temas Claro y Oscuro.
  - Presenta: `"Análisis/Diseño de Andres Aguiar V AAMM.DD Santiago de Chile Mes y Año Actual - Contacto +56933395447 - Whatsapp +56933395447"`.
  - El código de versión `AAMM.DD` (`2611.04`) y `Mes y Año Actual` (`Noviembre 2026`) se definen como un valor fijo inmutable de compilación/generación en `BUILD_VERSION` e `index.html`, preservándose estático en el cliente y renovándose únicamente al regenerar o modificar el código de la aplicación.
- **Tecnología sin compilador (inspirado en Momentos Cookie):**
  - Vanilla JS modular ejecutable directamente sin bundlers ni compiladores.
  - Tailwind CSS vía CDN y Lucide Icons vía CDN.
  - Modales nativos con `<dialog>` y backdrop styling.
  - Soporte de impresión física con `@media print` para tickets de clientes y órdenes de taller.
  - Arquitectura PWA (`manifest.json` y Service Worker `sw.js`) para uso en móviles y taller sin conexión continua.
  - Soporte completo de Backup/Restauración en formato JSON para seguridad de datos de la microempresa.

---

## 3. Historial de cambios

### 2026-11-05 (Creación y Publicación del Repositorio Oficial en GitHub — ventas-novaprint)
- **Creación de Repositorio Oficial:** Se creó el repositorio público independiente `ventas-novaprint` en GitHub (`https://github.com/AndresAguiarMarmol/ventas-novaprint`).
- **Configuración de Origen Remoto:** Se reconfiguró el origen remoto de Git apuntando a `https://github.com/AndresAguiarMarmol/ventas-novaprint.git`.
- **Publicación de la Rama Principal:** Se publicó la rama `main` completa con las Specs 001 a 013, suite de 105 pruebas unitarias, documentación y recursos PWA.
- **Limpieza de ramas temporales:** Se eliminó la rama temporal `novaprint` de `cv-web.git`, manteniendo ambos proyectos desacoplados e independientes.

### 2026-11-05 (Sincronización con GitHub — Specs 001 a 013)
- Se consolidaron y confirmaron todos los cambios en Git (Specs 010 a 013 y documentación del README).
- Se sincronizó el repositorio remoto en la rama dedicada `novaprint` (`origin/novaprint`), preservando la rama `main` original y dejando el árbol de trabajo local 100% limpio y actualizado.

### 2026-11-05 (Spec 013 — Flexibilidad de Precios Libres y Descuentos por Volumen)
- **Flexibilización de ingreso de precios:**
  - `assets/js/sales.js`: Ajuste de `calcularSubtotalItem` para permitir precio $0 (promociones) y precios libres sin restricciones.
  - `assets/js/ui.js` & `index.html`: Reemplazo de `step="500"` y `step="100"` por `step="any"` en las filas de prendas y compras/costos, e incorporación de `novalidate` en `<form id="form-order">` para erradicar bloqueos de validación nativa de HTML5.
- **Acceso y consulta a Descuentos por Volumen:**
  - `index.html`: Incorporación de botones de acceso rápido `🏷️ Descuentos por Volumen` en la barra de pedidos (`#btn-view-volume-discounts`) y dentro del formulario de pedidos (`#btn-open-volume-discounts-order`).
  - Creación del modal nativo `<dialog id="dialog-volume-discounts">` con la tabla oficial de tramos (1-5 un: 0%, 6-11 un: 5%, 12-24 un: 10%, 25-49 un: 15%, 50+ un: 20%).
  - `assets/js/ui.js`: Implementación de `abrirModalDescuentosVolumen()` con cálculo dinámico del tramo activo según las prendas del pedido en curso, mensaje inteligente de progreso ("agrega X prendas para 10% OFF") y resaltado visual del tramo.
  - `assets/js/main.js`: Binding de eventos para los botones de apertura de la escala.
  - `tests/sales.test.js`: Incorporación de suite de pruebas unitarias para precios libres y escala de descuentos (105 tests pasando al 100% en verde).

### 2026-11-04 (Spec 012 — Pie de Página con Créditos de Autoría y Contacto Directo)
- Incorporación del pie de página semántico (`<footer>`) corporativo:
  - `index.html`: Estructura en la base de la pantalla (`mt-auto`, `.no-print`) con texto de autoría: `"Análisis/Diseño de Andres Aguiar V AAMM.DD Santiago de Chile Mes y Año Actual - Contacto +56933395447 - Whatsapp +56933395447"`, código de versión (`2611.04`), fecha dinámica (`Noviembre 2026`) y enlaces directos clicables para llamadas telefónicas (`tel:+56933395447`) y WhatsApp (`https://wa.me/56933395447`).
  - `assets/js/main.js`: Constante inmutable `BUILD_VERSION` fija (`2611.04` y `Noviembre 2026`) establecida al generar la aplicación, inmutable hasta la próxima modificación y regeneración.
  - Integración completa con modo Claro, modo Oscuro y exclusión automática en impresión física.
  - Pruebas automatizadas: 101 tests pasando al 100% en verde.

### 2026-11-04 (Spec 011 — Corrección de WhatsApp e Impresión Unitaria Exclusiva de Ticket)
- Corrección de los dos errores reportados en "Comprobante de Venta & Taller":
  - `assets/js/ticket.js`:
    - Implementación de `obtenerTelefonoCliente(pedido)` que resuelve en cascada el teléfono desde `pedido.clientPhone`, `storage.getClientById(pedido.clientId)` o coincidencia de nombre en `storage.getClients()`.
    - Actualización de `generarTicketHTML` para mostrar el teléfono resuelto del cliente.
    - En `abrirWhatsAppPedido`: apertura directa con el número resuelto, persistencia en el pedido si faltaba, y en caso de no existir número registrado, diálogo interactivo `prompt()` para ingresarlo y enviarlo al instante.
  - `assets/js/ui.js`: Garantía de obtención de teléfono en `guardarPedidoDesdeFormulario` consultando la ficha del cliente en `NovaprintStorage`.
  - `assets/css/custom.css`:
    - Eliminación de la regla destructiva `dialog { display: none !important; }` que ocultaba el comprobante.
    - Ocultamiento estricto en `@media print` de todos los elementos de fondo (`header`, `nav`, `main`, `footer`, vistas SPA, tablero Kanban y otros modales).
    - Despliegue e impresión aislada y centrada del ticket (`dialog#dialog-ticket`, `#printable-ticket-content`) con ancho de 80mm compatible con rollo térmico e impresoras convencionales.
  - `assets/js/main.js`: Soporte de atajo de teclado Ctrl+P / Cmd+P e intercepción con `beforeprint`/`afterprint`.
  - Pruebas automatizadas: Nuevos tests unitarios en `tests/ticket.test.js`. 100 pruebas pasando al 100% en verde sin regresiones.

### 2026-11-04 (Spec 010 — Selector de Tema Claro / Oscuro / Sistema en Configuración)
- Incorporación del selector de modo visual de pantalla:
  - `assets/js/storage.js`: Adición de `theme: 'system'` a `DEFAULT_SETTINGS` y soporte en `getSettings()` y `saveSettings()`.
  - `index.html`: Inclusión de `<meta name="color-scheme" content="light dark">`, script temprano inline anti-FOUC y tarjetas de selección interactiva (☀️ Claro, 🌙 Oscuro, 💻 Sistema) en `#dialog-settings`.
  - `assets/css/custom.css`: Adaptación exhaustiva de tokens y variables para `html.dark` en modales, tablas, entradas y barras.
  - `assets/js/main.js`: Función `aplicarTema(tema)`, listener para `prefers-color-scheme: dark` y enlace bidireccional en ajustes y restauración de copias de seguridad.
  - Pruebas automatizadas: Suite `tests/theme.test.js` y extensión de `tests/storage.test.js`.

### 2026-11-03 (Spec 009 — Botón y Filtro de Pedidos con Saldo por Cobrar en Barra de Estados)
- Incorporación del botón y filtro de cobranza para pedidos pendientes de pago:
  - `assets/js/sales.js`: Soporte de `estadoFiltro === 'con_saldo'` y `soloConSaldo: true` en `filtrarPedidos`, seleccionando únicamente pedidos con `balanceAmount > 0` que no estén cancelados.
  - `index.html`:
    - Adición del botón interactivo `#btn-filter-balance` con insignia dinámica `#badge-count-pending-balance` en la barra de filtros y estados de pedidos.
    - Opción `con_saldo` incorporada en el menú desplegable `#orders-status-filter`.
    - Tarjeta KPI "Por Cobrar" (`#kpi-card-pending-balance`) habilitada como enlace interactivo con cursor pointer y hover.
  - `assets/js/ui.js`: Conteo automático de pedidos con saldo pendiente y actualización de la insignia en `renderMetrics`.
  - `assets/js/main.js`: Controladores para alternar el filtro al pulsar `#btn-filter-balance` o `#kpi-card-pending-balance`, sincronización bidireccional con `#orders-status-filter` y refresco dinámico de Kanban y Tabla.
  - Pruebas automatizadas: Nueva prueba en `tests/sales.test.js`. 90 pruebas pasando al 100% en verde.

### 2026-11-03 (Spec 008 — Enlace Prenda-Color-Talla y Auto-creación en Inventario para Compras)
- Implementación de la Spec 008 para enlazar pedidos con inventario y auto-crear ítems no existentes:
  - `assets/js/storage.js`:
    - Función pura `generarCodigoPrenda(garmentType, color, size)` para códigos estructurados (`POL-AZU-10`, `POL-NEG-L`).
    - Función `asegurarItemInventarioPrenda(garmentType, color, size, datosExtra)`: busca por la terna o crea automáticamente el ítem con stock 0, costo de referencia del cotizador textil y asignación de proveedor sugerido. Exportada en `NovaprintStorage`.
  - `assets/js/production.js`:
    - Actualización de `calcularFaltantesPedido` para contabilizar prendas no registradas en `totalPrendasFaltantes` y agregarlas a `faltantesParaCompra` como requerimientos pendientes de adquisición.
  - `assets/js/ui.js`:
    - En `abrirModalCompraConFaltantes`, creación automática en inventario de cualquier ítem faltante no registrado para asignar su `inventoryItemId` antes de abrir `#dialog-purchase`.
    - En `guardarPedidoDesdeFormulario`, registro de las prendas del pedido en `novaprint_inventory` para trazabilidad inmediata en tarjetas de pedidos y semáforos de stock.
  - Pruebas automatizadas: Nuevas pruebas en `tests/storage.test.js` y `tests/production.test.js`. 89 pruebas pasando al 100% en verde sin regresiones.

### 2026-11-02 (Spec 007 — Incorporación de Tallas Infantiles 4 a 18 en Pedidos e Inventario)
- Incorporación y estandarización de las tallas para niños en toda la aplicación:
  - `assets/js/sales.js`: Definición de `TALLAS_TEXTILES` y `TALLAS_GRUPOS` que incluyen las tallas infantiles `4, 6, 8, 10, 12, 14, 16, 18` junto con las tallas adultas `XS, S, M, L, XL, XXL, Única`.
  - `assets/js/ui.js`:
    - Creación de la función generadora `generarOpcionesTalla(tallaActual)` con agrupación visual semántica (`<optgroup label="Niños">` y `<optgroup label="Adultos / Estándar">`) y preservación automática de tallas personalizadas.
    - Actualización de la tabla de ítems de prendas en `#dialog-order` para renderizar el nuevo catálogo dinámico de tallas.
  - `index.html`: Incorporación de `<datalist id="inventory-size-datalist">` enlazado al campo de talla/medida de inventario (`#inventory-size-input`), proveyendo sugerencias automáticas de tallas infantiles y adultas al ingresar existencias en bodega.
  - Pruebas automatizadas: Nuevas pruebas en `tests/sales.test.js` y `tests/production.test.js` validando la presencia del catálogo, ausencia de recargos especiales en tallas infantiles, cotizaciones estructuradas y disponibilidad en bodega. 87 pruebas pasando al 100% en verde.

### 2026-11-02 (Identidad Visual: Integración del Logotipo Oficial como Icono y Favicon)
- Establecimiento del logotipo oficial de Novaprint como icono central de la aplicación web y PWA:
  - Generación de activos optimizados en `assets/img/`: `icon-512.png` (512x512), `icon-192.png` (192x192), `apple-touch-icon.png` (180x180), `favicon-32x32.png` (32x32), `favicon-16x16.png` (16x16), `logo.png` (512x512), `favicon.ico` y `favicon.png`.
  - `index.html`: Enlace en el `<head>` a favicon estándar, favicon PNG y Apple Touch Icon; reemplazo del placeholder tipográfico `NP` en la barra de navegación por la imagen oficial del logotipo.
  - `manifest.json`: Actualización de los iconos PWA a `assets/img/icon-192.png` y `assets/img/icon-512.png` con propósito `any maskable`.
  - `sw.js`: Inclusión de los nuevos recursos gráficos en la lista de precaché offline y actualización de versión a `novaprint-v2`.
  - `assets/js/ticket.js`: Incorporación del logotipo en el encabezado de los comprobantes y tickets físicos de venta.
  - Suite de pruebas: 82 pruebas pasando al 100% en verde sin regresiones.

### 2026-11-02 (Spec 006 — Selector de Colores Textiles en Inventario)
- Implementación de la Spec 006 para unificar el catálogo de colores entre Ventas y Producción:
  - `index.html`: Reemplazo del campo de texto libre `<input id="inventory-color-input">` por la lista desplegable `<select id="inventory-color-select">` en el modal `#dialog-inventory`.
  - `assets/js/ui.js`:
    - Función interactiva `manejarCambioColorInventario(valor)` con soporte de opción "Otro" y solicitud dinámica de color personalizado.
    - Poblado automático con la paleta textil oficial (`generarOpcionesColor`) al abrir modal de nuevo ítem (`abrirModalNuevoItemInventario`) y al editar un ítem existente (`editarItemInventario`).
    - Lectura estandarizada en `guardarItemInventarioDesdeFormulario`.
  - `assets/js/storage.js`: Robustecimiento en la generación de identificadores únicos (`INV-`, `PRV-`, `CMP-`, `PRJ-`) con sufijos pseudoaleatorios para prevenir colisiones en llamadas síncronas rápidas.
  - Pruebas automatizadas: Verificación en `tests/storage.test.js`, con 82 pruebas pasando al 100% en verde.

### 2026-11-02 (Spec 005 — IVA 19% Legislación Chilena y Delivery en Pedidos y Compras)
- Implementación completa de la Spec 005:
  - `assets/js/sales.js`:
    - Constante `TASA_IVA_CHILE = 0.19` (19% según D.L. 825).
    - Extensión de `calcularTotalesPedido` con soporte de `opciones: { aplicarDescuentoVolumen, aplicarIva, montoDelivery }` (manteniendo retrocompatibilidad booleana).
    - Desglose financiero completo: Subtotal Bruto, Descuento Volumen, Neto, IVA (19%), Delivery ($0 por defecto), Total, Abono y Saldo.
    - Soporte de filas de IVA y Delivery en el generador de texto de WhatsApp (`generarTextoWhatsApp`).
  - `assets/js/production.js`:
    - Constante `TASA_IVA_CHILE = 0.19`.
    - Función pura `calcularTotalesCompra(items, opciones)` que calcula Subtotal Neto, IVA 19% opcional y Flete/Delivery opcional ($0 por defecto).
  - `assets/js/storage.js`:
    - Normalización y persistencia de desglose de IVA y Delivery en compras (`savePurchase`) y pedidos (`saveOrder`).
  - `index.html` y `assets/js/ui.js`:
    - Formulario de Pedido (`#dialog-order`): Casillas `[ ] ¿Aplica IVA (19%)?` y `[ ] ¿Aplica Delivery / Envío?` con input de delivery inicializado en 0. Resumen financiero en tiempo real con filas condicionales de Neto, IVA y Delivery.
    - Formulario de Compra (`#dialog-purchase`): Casillas `[ ] ¿Factura con IVA (19%)?` y `[ ] ¿Aplica Flete / Delivery?` con input de delivery inicializado en 0. Desglose en vivo de Subtotal Neto, IVA, Flete/Delivery y Total Compra.
    - Métodos interactivos `toggleOrderDeliveryInput()` y `togglePurchaseDeliveryInput()`.
  - `assets/js/ticket.js`:
    - Desglose de filas de Monto Neto, IVA (19%) y Delivery/Envío en los tickets de venta impresos y térmicos.
  - Pruebas automatizadas: 9 nuevas pruebas en `tests/sales.test.js`, `tests/production.test.js`, `tests/storage.test.js` y `tests/ticket.test.js`. Suite total: 82 pruebas pasando al 100% en verde.

### 2026-11-02 (Integración de Reglas de Cotizador Textil y Descuentos por Volumen — skill.md)
- Incorporación de las reglas de negocio del archivo `.agents/skills/sdd/skill.md`:
  - `assets/js/sales.js`:
    - Constante `COSTOS_REFERENCIA` con valores base para prendas, recargo por tallas especiales (+$1.200) y dimensiones de estampado.
    - Función pura `calcularPrecioSugeridoPrenda` que calcula el precio de referencia unitario automáticamente.
    - Función pura `validarCompatibilidadTecnica` que verifica telas y colores (alerta si se intenta sublimar en telas oscuras o de algodón, o si se usa serigrafía en <30 unidades).
    - Función pura `calcularDescuentoVolumen` con la escala oficial (5% desde 6 un., 10% desde 12 un., 15% desde 25 un. y 20% desde 50 un.).
    - Función `generarCotizacionEstructurada` que emite el esquema JSON estricto y desglose por tallas según `skill.md`.
    - Actualización de `calcularTotalesPedido` y `generarTextoWhatsApp` con soporte de desglose de descuentos.
  - `assets/js/ui.js` e `index.html`:
    - Precios sugeridos automáticos al agregar prendas en `#dialog-order`.
    - Alerta visual en tiempo real de compatibilidad técnica en cada fila del pedido.
    - Desglose financiero en el formulario con Subtotal Bruto, Descuento por Volumen (con casilla de activación) y Total Neto.
  - `assets/js/ticket.js`:
    - Desglose de subtotal y descuento por volumen en el comprobante impreso y térmico.
  - Pruebas unitarias: 12 nuevas pruebas agregadas en `tests/sales.test.js`, con un total de 73 pruebas pasando al 100%.

### 2026-11-02 (Spec 004 — Enlace Pedidos ➔ Inventario, Detección de Faltantes y Descuento en Taller)
- Implementación completa de la Spec 004:
  - `assets/js/production.js`: Funciones puras `verificarDisponibilidadPrenda` (compara prenda, color y talla contra bodega), `calcularFaltantesPedido` (detecta requerimientos y prepara lista consolidada para compra) y `descontarInventarioPorPedido` (descuenta unidades usadas sin generar stock negativo).
  - `assets/js/storage.js`: Método `descontarStockPorPedido(itemsPedido)` para sincronizar la reducción física de prendas en `novaprint_inventory`.
  - `assets/js/ui.js` e `index.html`: Badges visuales en tiempo real en cada fila del pedido (🟢 *Bodega: X un.* / 🔴 *⚠️ Faltan Y un.*), banner de advertencia cuando faltan prendas con botón directo `[ 🛒 Comprar Material Faltante ]` que pre-carga `#dialog-purchase` con las prendas y cantidades exactas, y descuento automático de stock de bodega al despachar el pedido a fabricación con `⚡ Taller`.
  - Pruebas automatizadas: 8 nuevas pruebas unitarias en `tests/production.test.js` y `tests/storage.test.js`, alcanzando 61 pruebas pasando al 100%.

### 2026-11-02 (Selector de Colores de Prendas y Limpieza de Datos Demo)
- **Selector de colores en Pedidos:**
  - `assets/js/sales.js`: Constante `COLORES_TEXTILES` exportada con la lista de colores comunes para estampados (*Negro, Blanco, Gris Melange, Gris Grafito, Azul Marino, Azul Rey, Rojo, Burdeo, Verde Botella, Verde Militar, Amarillo, Naranjo, Celeste, Rosado, Beige, Morado, Otro*).
  - `assets/js/ui.js`: Campo "Color" reemplazado por un elemento `<select>` desplegable con opciones estándar y opción interactiva "Otro" para colores especiales.
- **Limpieza de datos de prueba:**
  - `assets/js/storage.js`: Nueva función `clearAllData(preserveSettings = true)` para vaciar todos los registros manteniendo la configuración del taller (nombre, RUT, teléfono, etc.). Modificación de `initDemoData(force)` para no autosembrarse si `force` no es `true`.
  - `assets/js/main.js`: Detección y limpieza automática de datos de muestra preexistentes de la plantilla en el navegador para comenzar desde cero con datos reales.
  - `index.html` y `assets/js/main.js`: Botones en el modal de Ajustes (⚙️) para "Vaciar Base de Datos" o "Cargar Datos de Prueba".
  - `tests/sales.test.js` y `tests/storage.test.js`: Pruebas añadidas y pasando en verde (53 pruebas totales).

### 2026-11-01 (Corrección Navegación SPA y Visibilidad de Vistas)
- Solución al problema de navegación donde los botones de la barra horizontal parecían inactivos:
  - `assets/css/custom.css`: Se agregaron las reglas de visibilidad `.view-panel { display: none !important; }` y `.view-panel.active { display: block !important; animation: fadeInView ... }`. Anteriormente, al no existir esta regla, todas las vistas estaban visibles simultáneamente una debajo de otra en una única página gigante, por lo que al hacer clic en las pestañas no se ocultaban ni mostraban las secciones.
  - `assets/js/main.js`: Soporte de navegación por hash de URL (`#orders`, `#clients`, `#inventory`, `#purchases`, `#suppliers`, `#fabrication`), manejo de botones con estilo activo y refresco de vista al cambiar de pestaña.
  - `assets/js/ui.js`: Redirección automática a la vista `#view-fabrication` al enviar un pedido al taller mediante `⚡ Taller`.

### 2026-11-01 (Módulo de Producción: Control de Fabricación en Taller - Spec 003 Completado)
- Implementación completa de la Spec 003 (Control de Fabricación en Taller):
  - `assets/js/production.js`: Funciones puras para progresión secuencial de estaciones (`Diseño` ➔ `Preparación` ➔ `Estampado` ➔ `Control Calidad` ➔ `Terminado`), agrupamiento determinista en tablero Kanban de 5 columnas, constructor de órdenes de fabricación desde pedidos de clientes y filtros por técnica y texto.
  - `assets/js/storage.js`: CRUD y persistencia para proyectos de fabricación (`novaprint_projects`), método `updateProjectStage` y seed data con lotes activos en taller.
  - `assets/js/ui.js` y `assets/js/main.js`: Renderizado del tablero Kanban de 5 columnas, botón de avance rápido en 1 clic (`Avanzar a [Etapa] ➔`), botón integrado en pedidos de ventas (`⚡ Taller`) para despachar pedidos directamente a fabricación y modal `#dialog-project` para órdenes directas o lotes para stock.
  - `index.html`: Despliegue de la pestaña `#view-fabrication` y modales de taller.
  - `tests/fabrication.test.js`: Suite de pruebas unitarias pasando al 100% en verde (51 pruebas totales en la suite general).

### 2026-11-01 (Módulo de Producción: Compras, Inventario y Proveedores - Spec 002 Completado)
- Implementación completa de la Spec 002:
  - `assets/js/production.js`: Lógica pura para evaluación de alertas de stock crítico (`currentStock <= minStock`), cálculo de valorización monetaria de inventario, aplicación de compras con incremento automático de existencias y filtros combinados.
  - `assets/js/storage.js`: CRUD para proveedores, inventario y compras, seed data completo de insumos de estampado (poleras lisas, polerones franela, gorras trucker, bobinas film DTF, poliamida, vinilo reflectivo) y sincronización automática de existencias al guardar compras.
  - `assets/js/ui.js`: Renderizado de directorio de proveedores con WhatsApp, tabla de inventario con badges de stock bajo y tabla de compras.
  - `index.html`: Vistas funcionales `#view-inventory`, `#view-purchases`, `#view-suppliers` y modales nativos `<dialog>` para registrar/editar proveedores, ítems de inventario y registrar compras.
  - `tests/production.test.js`: Suite completa de pruebas pasando en verde (44 pruebas totales en la suite general).
  - Creación del borrador de la **Spec 003: Control de Fabricación en Taller** (`specs/003-control-fabricacion/spec.md`).

### 2026-11-01 (Módulo de Ventas Completado - Spec 001)
- Implementación completa de la Spec 001 (Módulo de Ventas: Control de Pedidos y Control de Clientes):
  - `assets/js/sales.js`, `assets/js/ticket.js`, `assets/js/ui.js`, `assets/js/main.js`, `index.html`, `manifest.json`, `sw.js`.
