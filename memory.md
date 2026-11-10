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
- **`novaprint_expenses`:** Registro de gastos operacionales de taller (`id, date, category, description, amount, paymentMethod, reference, notes, createdAt`).
- **`novaprint_accounts`:** Catálogo oficial del Plan de Cuentas Contable del taller (`id, codigo, nombre, tipo, subtipo, descripcion, esSistema, activo, createdAt, updatedAt`).
- **`novaprint_transfers`:** Registro de transferencias y traspasos entre cuentas contables (`id, date, sourceAccountId, sourceAccountCode, sourceAccountName, destinationAccountId, destinationAccountCode, destinationAccountName, amount, description, reference, createdAt, updatedAt`).

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
- **Datos Propios y Seguridad en Producción (Spec 016):** La aplicación opera exclusivamente con datos reales propios sin precarga de datos de muestra. Se eliminaron de la interfaz de usuario de "Ajustes & Respaldo" (`#dialog-settings`) los botones "Vaciar Base de Datos" y "Cargar datos de Prueba", erradicando el riesgo de eliminación accidental de registros en el taller. La seguridad y portabilidad de datos se gestiona exclusivamente mediante las opciones oficiales de Descargar Respaldo JSON y Restaurar Respaldo JSON. Los métodos `storage.clearAllData` e `initDemoData` permanecen intactos como APIs de bajo nivel para suites de pruebas automatizadas.
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
  - **Spec 014 (Implementada):** Edición y Eliminación de Compras de Insumos & Textiles con Ajuste Diferencial y Reversión de Stock en Inventario.
  - **Spec 015 (Implementada):** Botones Dedicados para Modificar el Status de un Pedido en Tabla y Tablero Kanban.
  - **Spec 016 (Implementada):** Eliminación de Opciones "Vaciar Base de Datos" y "Cargar datos de Prueba" en Ajustes y Respaldos.
  - **Spec 017 (Implementada):** Opción para Modificar el Stock de Inventarios (Ajuste Rápido y Cuadratura).
  - **Spec 018 (Implementada):** Módulo de Contabilidad con Plan de Cuentas, Activos, Pasivos, Ingresos por Ventas de Poleras y Gastos Enlazados (Balance General, P&L y Libro Diario).
  - **Spec 019 (Implementada):** Asientos Contables al Registrar Pedidos: Abono a Banco y Saldo a Cuentas por Cobrar.
  - **Spec 020 (Implementada):** Inclusión de Compra de Estampados en Material Faltante (Adelante, Atrás, Ambos con Precios Diferenciados).
  - **Spec 021 (Implementada):** Separar Compra de Poleras y Estampado DTF en 2 Facturas para 2 Proveedores Distintos.
  - **Spec 022 (Implementada):** Plan de Cuentas Contable Dinámico y Operaciones CRUD (Activos, Pasivos, Capital, Ingresos y Egresos) con Protección de Cuentas de Sistema.
  - **Spec 023 (Implementada):** Transferencia entre Cuentas Contables (Botón en Cabecera, Asientos de Partida Doble en Libro Diario y Modal Interactivo).
  - **Spec 024 (Implementada):** Reflejo Dinámico de Transferencias en Cuentas Contables (Origen y Destino) y Listado de Movimientos.
  - **Spec 025 (Implementada):** Filtros por Mes de Transacción y por Cuenta Contable en Libro Diario de Movimientos.
- **Filtros por Mes y Cuenta en Libro Diario (Spec 025):**
  - **Filtro por Mes de la Transacción (`YYYY-MM`):** En `#acc-subview-journal`, se incluye `<input type="month" id="acc-journal-filter-month">` junto al botón interactivo `[Todos]` (`#btn-journal-clear-month`). Permite acotar los asientos contables a cualquier mes y año específico (`a.fecha.startsWith(mes)`) o ver el historial completo.
  - **Filtro por Cuenta Contable:** Selector desplegable `#acc-journal-filter-account` poblado dinámicamente con las cuentas activas del Plan de Cuentas (`poblarSelectorCuentasLibroDiario`), organizadas y agrupadas por categorías contables (1. Activos, 2. Pasivos, 3. Capital, 4. Ingresos, 5. Egresos), permitiendo filtrar únicamente los asientos donde la cuenta participe al Debe o al Haber (incluyendo orígenes y destinos de transferencias).
  - **Combinación Lógica AND y Restablecimiento Rápido:** `NovaprintAccounting.filtrarAsientosContables` evalúa simultáneamente $\text{Tipo} \land \text{Mes} \land \text{Cuenta}$. Si no hay coincidencias se despliega un mensaje amigable con botón de reseteo. El botón `[✕ Limpiar]` (`#btn-journal-reset-filters` / `resetFiltrosLibroDiario`) restablece los 3 filtros a sus valores predeterminados.
  - **Enlace Unificado con Plan de Cuentas:** La acción rápida `[👁️]` en el Plan de Cuentas (`NovaprintUI.verMovimientosCuenta`) pre-selecciona automáticamente la cuenta en `#acc-journal-filter-account` y activa el Libro Diario mostrando sus movimientos en vivo.
- **Reflejo de Transferencias en Cuentas Contables y Movimientos (Spec 024):**
  - **Cálculo de Saldos Dinámicos por Cuenta (Libro Mayor):** Implementación de `calcularSaldosPlanCuentas(asientos, accounts, settings)` en `assets/js/accounting.js` que consolida todos los débitos y créditos a partir de la totalidad de asientos contables del sistema (Ventas, Compras, Gastos y Transferencias). Determina el saldo según la naturaleza contable de cada cuenta: $\text{Debe} - \text{Haber}$ para cuentas deudoras (Activo y Egreso) y $\text{Haber} - \text{Debe}$ para cuentas acreedoras (Pasivo, Capital e Ingreso). Para `1101 Caja y Bancos` considera además el capital inicial de `settings.initialCapital`.
  - **Columna de Saldo Actual y Botón de Movimientos en Plan de Cuentas:** En `#acc-table-accounts` se incorpora la columna visible "Saldo Actual ($)", resaltando saldos positivos en verde/esmeralda y saldos cero en tono neutro. Se añade el botón de acción rápida `[👁️]` ("Ver Movimientos") en cada fila que redirige inmediatamente a la pestaña de Libro Diario filtrando los asientos contables en los que participa esa cuenta específica (`NovaprintUI.verMovimientosCuenta`).
  - **Impacto de Transferencias en Balance General y Métricas:** `calcularBalanceGeneral` y `calcularMetricasContables` reciben el array de transferencias de `storage.getTransfers()`, ajustando el disponible neto de Caja y Bancos (`1101`) sumando transferencias entrantes (destino) y restando transferencias salientes (origen), al igual que en cuentas de activo fijo (ej. `1201 Maquinaria`) o pasivos (`2101 Cuentas por Pagar`), preservando rigurosamente la ecuación contable: $\text{Activos} = \text{Pasivos} + \text{Patrimonio}$.
  - **Reactividad Inmediata en Guardado y Navegación:** En `assets/js/main.js` se exportan explícitamente `refrescarContabilidad` y `refrescarDatos` en el objeto global `window` y en `NovaprintMain`. En `assets/js/ui.js` la función `refrescarContabilidadCompleta` asegura la re-renderización sincronizada de `renderAccountingModule` y `renderAccountsChart` al confirmar (`guardarTransferenciaDesdeFormulario`) o eliminar (`confirmarEliminarTransferencia`) un traspaso entre cuentas, y la navegación a la pestaña `journal` en `cambiarSubVistaContable` re-ejecuta la hidratación de asientos para reflejar las transferencias al instante.
- **Transferencia entre Cuentas Contables (Spec 023):**
  - **Ubicación en Cabecera Contable:** Botón dedicado `#btn-new-transfer` (`⇄ Transferir entre Cuentas`) contiguo a `#btn-new-expense` (`+ Registrar Gasto`) en la vista `#view-accounting`.
  - **Diálogo Modal `<dialog id="dialog-transfer">`:** Formulario asistido con selectores dinámicos de cuenta de origen y destino poblados desde `NovaprintStorage.getAccounts()` (agrupados por tipos), fecha, monto numérico, glosa y comprobante.
  - **Previsualización de Partida Doble en Vivo:** Panel interactivo que desglosa en tiempo real el Debe (cargo a cuenta de destino) y Haber (abono a cuenta de origen), validando que origen y destino no sean la misma cuenta y que el monto sea $> 0$.
  - **Capa de Persistencia (`storage.js`):** Clave `novaprint_transfers` gestionada con `getTransfers()`, `getTransferById(id)`, `saveTransfer(datos)` y `deleteTransfer(id)`, integrada en `exportBackup`, `importBackup` y `clearAllData`.
  - **Integración con Libro Diario (`accounting.js` y `ui.js`):** `generarLibroDiario` incorpora las transferencias como asientos balanceados con tipo `'Transferencia'`, insignia índigo distintiva, detalle de cuentas y botón de reversión/eliminación `[🗑️]` para transferencias manuales.
  - **Filtro Rápido en Libro Diario:** Selector `#acc-journal-filter-type` enriquecido con la opción "Transferencias entre Cuentas".
- **Plan de Cuentas Contable y Operaciones CRUD (Spec 022):**
  - **Estructura Canónica en 5 Grupos:** El catálogo contable categoriza formalmente todas las cuentas en `Activo` (1xxx), `Pasivo` (2xxx), `Capital` (3xxx - Patrimonio / Capital Social), `Ingreso` (4xxx) y `Egreso` (5xxx - Costos y Gastos), con normalización de alias mediante `normalizarTipoCuenta`.
  - **Catálogo Predeterminado y Auto-Seed (`PLAN_CUENTAS_DEFECTO`):** 21 cuentas oficiales del taller pre-cargadas (`esSistema: true`), incluyendo cuentas operativas (Caja y Bancos 1101, Cuentas por Cobrar 1102, Inventario 1103, IVA Crédito 1104, Maquinaria 1201, Cuentas por Pagar 2101, IVA Débito 2102, Capital Social 3101, Resultado del Ejercicio 3201, Ventas de Poleras 4101, Servicios DTF 4102, Costo de Insumos 5101, Arriendo 5201, Electricidad 5202, etc.).
  - **Protección de Cuentas de Sistema:** Las cuentas con `esSistema: true` tienen su código contable protegido contra edición y no pueden ser eliminadas vía `deleteAccount`, garantizando que ningún usuario rompa los asientos contables automáticos de ventas, compras e inventario.
  - **Operaciones CRUD Completas (`storage.js`):** `getAccounts(filtroTipo)`, `getAccountById(id)`, `getAccountByCode(codigo)`, `saveAccount(accountData)` (creación y edición con validación de código único y campos obligatorios), `deleteAccount(id)` (exclusivo para cuentas de usuario) y `resetDefaultAccounts()`.
  - **Sub-vista Visual `#acc-subview-chart` (`ui.js` e `index.html`):** Incorporación del botón de acceso `[📑 Plan de Cuentas]` en la barra contable, tarjetas de conteo KPI en tiempo real por cada uno de los 5 grupos, buscador en vivo, botones de filtrado rápido y tabla responsiva con acciones `[✏️]` (Editar) y `[🗑️]` (Eliminar).
  - **Modal de Creación y Edición `<dialog id="dialog-account">`:** Formulario accesible con validación reactiva, selectores de grupo, subtipo y descripción.
  - **Persistencia y Respaldo:** La clave `novaprint_accounts` se sincroniza con `localStorage`, se incluye en `exportBackup` e `importBackup`, y se restablece a los valores canónicos en `clearAllData`.
- **Separar Compra de Poleras y Estampado DTF (Spec 021):**
  - **Clasificación y Detección de Ítems (`production.js`):** `clasificarItemCompra(item, inventario)` determina si un ítem corresponde a `'textil'` (Prendas Lisas, Gorras, Poleras, Polerones) o a `'dtf'` (Insumos DTF, Insumos de Estampado, transfers, películas). `esCompraMixta` evalúa si una compra combina ambos tipos de materiales.
  - **Resolución Automática de Proveedores:** `resolverProveedorParaCategoria` sugiere automáticamente el proveedor textil (`Textiles Mayoristas Chile` o categoría 'Prendas Lisas') para la factura de poleras, y el proveedor gráfico/DTF (`Insumos Gráficos DTF Sur` o categoría 'Insumos DTF') para la factura de estampado.
  - **Acción Rápida en Tabla y Modal de Compras (`ui.js` e `index.html`):**
    - En `#dialog-purchase` (en "Editar Compra" o al registrar faltantes), se despliega el banner `#purchase-split-banner` con el botón `[✂️ Separar en 2 Facturas]`.
    - En la tabla de compras `#view-purchases`, las compras mixtas muestran el botón de acción rápida `[✂️]` en su fila.
  - **Modal de 2 Facturas (`<dialog id="dialog-split-purchase">`):** Presenta dos columnas independientes (Factura 1: Poleras / Factura 2: DTF) con selectores de proveedor, correlativos de factura (`-POL` y `-DTF`), tablas de artículos, casillas de IVA (19%) y Delivery, y cálculo en tiempo real del gran total consolidado.
  - **Persistencia y Cuadratura Estricta de Inventario (`storage.separarCompraEnDos`):** Al confirmar, la compra previa se actualiza para retener solo los ítems textiles bajo el proveedor textil, y se genera una nueva compra independiente para DTF bajo el proveedor DTF. El stock de bodega se mantiene idéntico y cuadrado ($\Delta = 0$), garantizando la integridad de existencias y reflejando las 2 compras en el Libro Diario contable.
- **Compra de Estampados en Material Faltante (Spec 020):**
  - **Opciones Oficiales y Precios Diferenciados:** Se parametrizaron las 3 opciones oficiales de estampado en `OPCIONES_ESTAMPADO` (`assets/js/production.js`):
    - **Adelante:** Costo de compra $1.800 CLP | Precio venta sugerido $3.200 CLP.
    - **Atrás:** Costo de compra $2.200 CLP | Precio venta sugerido $3.500 CLP.
    - **Ambos (Adelante y Atrás):** Costo de compra $3.500 CLP | Precio venta sugerido $5.500 CLP.
  - **Cálculo de Material Faltante:** `calcularFaltantesPedido(pedido, inventario, { incluirEstampados: true })` contabiliza tanto las prendas base faltantes en bodega como 1 unidad de estampado por cada prenda del pedido, asignando su costo de compra según la opción seleccionada.
  - **Auto-creación y Enlace en Inventario (`storage.asegurarItemInventarioEstampado`):** Crea o recupera el ítem en bodega bajo categoría `Insumos DTF` con stock 0 y costo de compra oficial, permitiendo enlazarlo a la orden de compra con `inventoryItemId` formal para incrementar el stock físico al confirmar la compra.
  - **Selector y Dinamismo en Formulario de Pedido (`#dialog-order` y `ui.js`):** La columna de estampado se presenta como `<select>` con las 3 opciones oficiales y sus precios. Al cambiar la opción o la cantidad, se recalculan inmediatamente el precio sugerido de venta, el subtotal de la fila, el resumen financiero y la alerta informativa de material faltante.
  - **Carga en Orden de Compra (`abrirModalCompraConFaltantes`):** Al presionar "🛒 Comprar Material Faltante", el modal `#dialog-purchase` precarga automáticamente tanto las prendas faltantes como los insumos de estampado necesarios con sus cantidades y costos respectivos.
- **Asientos Contables al Registrar Pedidos (Spec 019):**
  - **Partida Doble por Pedido:** Al registrar o actualizar una orden en el taller (`NovaprintStorage.saveOrder` o formulario de pedidos), se invoca `generarAsientosPedido` para desglosar la transacción:
    - **Abono Inicial (`depositAmount > 0`):** Se asienta como débito (Debe) en la cuenta `1101 Caja y Bancos (Disponible)` contra crédito (Haber) en `4101 Ventas de Poleras y Confección`.
    - **Saldo Pendiente (`balanceAmount > 0`):** Se asienta como débito (Debe) en la cuenta `1102 Cuentas por Cobrar Clientes` contra crédito (Haber) en `4101 Ventas de Poleras y Confección`.
    - **Suma de Partida Doble:** Cumple estrictamente $\text{Debe}_{Banco} + \text{Debe}_{CxC} = \text{Total del Pedido} = \text{Haber}_{Ventas}$.
  - **Visualización en Libro Diario (`generarLibroDiario` & `ui.js`):** Cada componente del pedido se presenta con su respectiva insignia identificadora (*Abono Banco* con tono esmeralda o *Saldo Crédito* con tono azul) permitiendo auditar tanto el efectivo ingresado como los saldos adeudados por cobrar.
  - **Persistencia en la Orden:** La propiedad `order.asientosContables` se asocia automáticamente a la entidad del pedido, manteniendo retrocompatibilidad total con pedidos preexistentes.
- **Módulo de Contabilidad Integral Enlazado (Spec 018):**
  - **Plan de Cuentas Estándar:** Estructuración en 5 grupos contables (`1. ACTIVOS`, `2. PASIVOS`, `3. PATRIMONIO`, `4. INGRESOS`, `5. COSTOS Y GASTOS`) con códigos estándar (1101 Caja y Bancos, 1102 Cuentas por Cobrar, 1103 Inventario Bodega, 1104 IVA Crédito Fiscal, 2101 Cuentas por Pagar, 2102 IVA Débito Fiscal, 3101 Capital, 3201 Utilidad del Ejercicio, 4101 Venta de Poleras y Prendas, 4102 Delivery Cobrado, 5101 Costo de Insumos Comprados, 5201 Gastos Operacionales de Taller).
  - **Enlace Reactivo Automático:** La contabilidad no requiere duplicar registros manuales; se alimenta directamente de los pedidos de clientes (`novaprint_orders`), compras de insumos (`novaprint_purchases`), inventario físico (`novaprint_inventory`) y gastos de taller (`novaprint_expenses`). Al guardar o editar cualquiera de estas entidades, `refrescarDatos()` ejecuta `refrescarContabilidad()`.
  - **Ecuación Patrimonial Balanceada:** $\text{Activos} = \text{Pasivos} + \text{Patrimonio}$. El balance cuadra estrictamente: la Utilidad Neta del Ejercicio ($\text{Ingresos} - \text{Costos/Gastos}$) se transfiere al patrimonio, y el disponible en Caja/Bancos refleja el flujo de efectivo neto (Cobros de pedidos - Compras pagadas - Gastos pagados).
  - **Subvistas Contables y Libro Diario:** La vista `#view-accounting` incluye pestañas internas para alternar entre "Balance General", "Estado de Resultados" y "Libro Diario de Movimientos", este último con filtrado cronológico y desglose de debe/haber por cada transacción.
  - **Gestión de Gastos de Taller:** Modal `<dialog id="dialog-expense">` con persistencia en `storage.saveExpense` / `storage.deleteExpense` y exportación/importación JSON.
- **Modificación Rápida y Ajuste de Stock en Inventario (Spec 017):**
  - **Flujo Especializado de Existencias:** Permite ajustar existencias de prendas base e insumos sin requerir la edición integral del catálogo (código, nombre, proveedor, costo).
  - **Puntos de Acceso en Tabla de Inventario (`renderInventoryTable`):** Botón directo de acción rápida `[📦]` con tooltip "Modificar Stock" y conversión de la cifra en la columna "Stock Actual" en un botón interactivo táctil con previsualización del ícono lápiz.
  - **Modal Especializado `<dialog id="dialog-adjust-stock">`:** Despliega código, nombre, categoría, especificaciones textiles (talla/color), stock actual, cálculo en vivo de la variación ($\Delta$), entrada numérica directa, botones de incremento/decremento rápido (`-10, -5, -1, Agotado (0), +1, +5, +10`) y selección opcional de motivo (conteo físico, merma, consumo en taller, devolución) con notas.
  - **Capa de Persistencia (`storage.updateInventoryStock`):** Valida que el stock nunca sea negativo ($\ge 0$), actualiza `currentStock`, `updatedAt` y guarda el registro del ajuste en `lastStockAdjustment`. Al guardar, dispara `refrescarDatos()` sincronizando inventarios, alertas de stock crítico y disponibilidad en pedidos.
- **Protección de Datos en Producción y Eliminación de Acciones Destructivas (Spec 016):**
  - **Limpieza en `#dialog-settings`:** Se retiró la sección completa "Gestión de Registros" junto con los botones `#btn-clear-database` y `#btn-load-demo-data`.
  - **Preservación Total de Capacidades Operativas:** Se conservaron íntegras las opciones de configuración de empresa, RUT, teléfono/WhatsApp, dirección, pie de ticket, selector de tema (claro/oscuro/sistema) y el sistema de copias de seguridad JSON (`#btn-export-backup` y `#file-import-backup`).
  - **Depuración de Eventos en `main.js`:** Se eliminaron los escuchadores de clic asociados a dichos botones en `initEventosConfiguracion`, manteniendo la carga del sistema limpia y sin referencias a elementos inexistentes.
- **Botones Dedicados para Modificación Rápida de Estados de Pedido (Spec 015):**
  - **Modal de Selección Rápida de Estados:** Se implementó el diálogo nativo `<dialog id="dialog-change-order-status">` con presentación accesible de los 6 estados del flujo textil (`Cotización`, `Confirmado`, `En producción`, `Listo para entrega`, `Entregado`, `Cancelado`), resaltando visualmente el estado actual con la insignia `Actual` e ícono de selección.
  - **Accesibilidad y Puntos de Activación en UI:**
    - En la **Tabla de Pedidos** (`renderOrdersTable`): La insignia de estado en la columna "Estado" se convirtió en un botón interactivo (`NovaprintUI.abrirModalCambiarEstado`) y se agregó un botón de acción rápida `[🔄]` en la columna de operaciones.
    - En las **Tarjetas Kanban** (`renderOrderCard`): Se añadió el botón táctil `[🔄 Estado]` permitiendo alternar o saltar a cualquier estado sin depender únicamente del botón lineal `[Avanzar ➔]`.
  - **Persistencia y Reactividad Inmediata:** Al pulsar sobre cualquier estado objetivo se ejecuta `NovaprintUI.seleccionarNuevoEstado`, el cual cierra el diálogo, actualiza la orden mediante `storage.updateOrderStatus`, despacha toast de confirmación y refresca de forma sincronizada todas las vistas (Kanban, Tabla, filtro de saldo por cobrar y KPIs).
- **Edición y Eliminación de Compras con Ajuste de Inventario (Spec 014):**
  - **Edición con Ajuste Diferencial:** Al editar una compra existente (`savePurchase(purchaseData, existingId)`), el sistema calcula el impacto neto sobre el stock de bodega: revierte las cantidades de los ítems de la versión previa (`Math.max(0, currentStock - oldQty)`), aplica las nuevas cantidades (`currentStock + newQty`) y actualiza el costo unitario de reposición `unitCost`.
  - **Eliminación con Reversión de Stock:** Al eliminar una compra (`deletePurchase(id)`), se descuentan las existencias añadidas a cada artículo en bodega (`Math.max(0, currentStock - qty)`), previniendo números negativos si parte de los insumos ya fueron consumidos en órdenes de taller.
  - **Acciones en Interfaz y Diálogos:** La tabla `#view-purchases` incorpora la columna de acciones con botones interactivos de edición (`[✏️]`) y eliminación (`[🗑️]`). El formulario `#form-purchase` reutiliza el modal existente alternando título, subtítulo, botón de envío ("Actualizar Compra" vs "Confirmar Compra") y limpiando el campo oculto `#purchase-id-hidden` al abrir una nueva compra.
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

### 2026-11-10 (Filtros por Mes y Cuenta Contable en Libro Diario — Spec 025)
- **Motor Contable (`assets/js/accounting.js`):**
  - Implementación de `asientoAfectaCuenta(asiento, cuentaIdentificador, catalogoCuentas)`: evalúa coincidencia de cuenta contable por código, ID o nombre en cuentas Debe, Haber y detalles de transferencias (origen y destino).
  - Implementación de `filtrarAsientosContables(asientos, { tipo, mes, cuenta, catalogoCuentas })`: combina con operador lógico AND el filtro por Tipo (`todos` o específico), Mes (`YYYY-MM`) y Cuenta Contable (`todas` o código/nombre).
  - Exportación de `asientoAfectaCuenta` y `filtrarAsientosContables` en el namespace público `NovaprintAccounting`.
- **Estructura HTML (`index.html`):**
  - En `#acc-subview-journal`, se incorporó la barra de filtros responsiva con: selector de Tipo (`#acc-journal-filter-type`), selector de Mes de tipo `<input type="month">` (`#acc-journal-filter-month`), botón rápido para ver todos los meses (`#btn-journal-clear-month`), selector desplegable de Cuenta Contable (`#acc-journal-filter-account`) y botón de restablecimiento general (`#btn-journal-reset-filters`).
- **Interfaz de Usuario y Controladores (`assets/js/ui.js`):**
  - Gestión reactiva del estado con `currentJournalFilter`, `currentJournalMonthFilter` y `currentJournalAccountFilter`.
  - Implementación de `poblarSelectorCuentasLibroDiario(cuentas)`: puebla dinámicamente el selector agrupando por categorías (Activos, Pasivos, Capital, Ingresos, Egresos) y preserva la selección activa.
  - Actualización de `renderAccountingJournal`: ejecuta `filtrarAsientosContables`, actualiza `#acc-journal-count` y muestra mensaje con botón de restablecimiento cuando ningún asiento coincide.
  - Implementación de `limpiarFiltroMesLibroDiario()` y `resetFiltrosLibroDiario()`.
  - Conexión de `verMovimientosCuenta`: ahora pre-selecciona automáticamente la cuenta en `#acc-journal-filter-account` y re-renderiza el Libro Diario.
- **Orquestador Principal (`assets/js/main.js`):**
  - Añadidos escuchadores de eventos para `change` en los 3 filtros y `click` en los botones de reseteo.
- **Pruebas Automatizadas (`tests/journal_filters_month_account.test.js`):**
  - 13 nuevas pruebas unitarias cubriendo función pura de detección de cuenta, filtrado por tipo, por mes, por cuenta, combinación AND, verificación de elementos en DOM y métodos en UI.
  - Suite global completa: 213 pruebas unitarias en 18 suites ejecutándose y pasando al 100% en verde (0 fallos).
- **Seguridad y Respaldo:**
  - Respaldo de seguridad previo generado en `backups/backup_pre_filtros_mes_cuenta_libro_diario_20261110.json` y tag git `backup-pre-filtros-mes-cuenta-libro-diario-20261110`.
- **Metodología SDD:** Especificación completa en `specs/025-filtros-mes-cuenta-libro-diario/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-10 (Reflejo de Transferencias en Cuentas Contables y Listado de Movimientos — Spec 024)
- **Motor Contable (`assets/js/accounting.js`):**
  - Implementación de `calcularSaldosPlanCuentas(asientos, accounts, settings)` para consolidar débitos y créditos según la partida doble de cada asiento, determinando el saldo contable conforme a su naturaleza deudora o acreedora y sumando el capital inicial en Caja y Bancos (`1101`).
  - Actualización de `calcularBalanceGeneral` y `calcularMetricasContables` para recibir el parámetro `transferencias = []`, sumando entradas y deduciendo salidas en `1101 Caja y Bancos` e impactando cuentas de pasivo o activo fijo, manteniendo estrictamente equilibrada la ecuación fundamental $\text{Activos} = \text{Pasivos} + \text{Patrimonio}$.
  - Exportación de `calcularSaldosPlanCuentas` en el módulo público `NovaprintAccounting`.
- **Estructura HTML (`index.html`):**
  - Incorporada la cabecera `<th class="py-3 px-3 text-right font-bold">Saldo Actual</th>` en la tabla `#acc-table-accounts` del Plan de Cuentas.
- **Interfaz de Usuario y Controladores (`assets/js/ui.js`):**
  - `renderAccountsChart`: integración del cálculo dinámico de saldos por cuenta mediante `calcularSaldosPlanCuentas`, renderizado de badges de saldo en verde esmeralda y adición del botón `[👁️]` ("Ver Movimientos") en la columna de operaciones.
  - Implementación de `verMovimientosCuenta(codigo, nombre)`: cambia a la sub-vista de Libro Diario y filtra los asientos que involucran a dicha cuenta.
  - Creación de `refrescarContabilidadCompleta()` y enlace en `guardarTransferenciaDesdeFormulario` y `confirmarEliminarTransferencia` para rehidratar inmediatamente la UI tras cualquier transferencia.
  - Actualización de `cambiarSubVistaContable('journal')` para sincronizar en vivo el listado de movimientos.
- **Orquestador Principal (`assets/js/main.js`):**
  - Exposición de `refrescarContabilidad` y `refrescarDatos` tanto en el objeto global `window` como en `NovaprintMain`.
- **Pruebas Automatizadas (`tests/transfers_reflection_accounts_movements.test.js`):**
  - 6 nuevas pruebas unitarias cubriendo cálculo dinámico de saldos (Libro Mayor), impacto en cuentas origen y destino tras transferencias, preservación de la ecuación patrimonial en Balance General, cabeceras en DOM y disponibilidad de funciones en UI y Main.
  - Suite global completa: 200 pruebas unitarias en 17 suites ejecutándose y pasando al 100% en verde (0 fallos).
- **Seguridad y Respaldo:**
  - Respaldo de seguridad previo generado en `backups/backup_pre_fix_transferencias_reflejo_20261110.json` y tag git `backup-pre-fix-transferencias-reflejo-20261110`.
- **Metodología SDD:** Especificación completa en `specs/024-reflejo-transferencias-cuentas-y-movimientos/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-10 (Transferencia entre Cuentas Contables — Spec 023)
- **Motor Contable (`assets/js/accounting.js`):**
  - Implementación de `validarTransferenciaContable(transfer, cuentasExistentes)`: validación de cuenta de origen y destino requeridas y distintas, monto numérico $> 0$ y fecha válida.
  - Actualización de `generarLibroDiario(pedidos, compras, gastos, transferencias)`: generación de asientos de partida doble con tipo `'Transferencia'`, cargo al Debe en cuenta de destino y abono al Haber en cuenta de origen ($\sum \text{Debe} = \sum \text{Haber}$).
- **Capa de Persistencia y Métodos CRUD (`assets/js/storage.js`):**
  - Añadida clave `STORAGE_KEYS.TRANSFERS = 'novaprint_transfers'`.
  - Implementados métodos `getTransfers()`, `getTransferById(id)`, `saveTransfer(datos)` con validación previa y `deleteTransfer(id)`.
  - Integración en `exportBackup` e `importBackup` para respaldar y restaurar transferencias entre cuentas, y en `clearAllData`.
- **Interfaz de Usuario y Diálogos (`index.html`, `assets/js/ui.js` y `assets/js/main.js`):**
  - Botón `#btn-new-transfer` (`⇄ Transferir entre Cuentas`) contiguo a `#btn-new-expense` en la cabecera del módulo contable.
  - Diálogo modal nativo `<dialog id="dialog-transfer">` con formulario `#form-transfer`, selectores agrupados por tipo de cuenta, panel en vivo de previsualización de partida doble e indicador de cuadratura.
  - Funciones en `NovaprintUI`: `abrirModalTransferencia`, `actualizarPreviewTransferencia`, `guardarTransferenciaDesdeFormulario` y `confirmarEliminarTransferencia`.
  - Actualización de `renderAccountingJournal`: insignia índigo `Transferencia`, filtrado rápido por tipo y botón de eliminación `[🗑️]` para transferencias manuales.
  - Escuchadores de eventos integrados en `assets/js/main.js`.
- **Pruebas Automatizadas (`tests/transfers_between_accounts.test.js`):**
  - 14 nuevas pruebas unitarias cubriendo validación de datos, generación balanceada de asientos de partida doble, persistencia CRUD, rechazo de cuentas idénticas o montos inválidos, soporte en respaldos JSON y elementos visuales en DOM.
  - Test suite global: 194 pruebas en 16 suites ejecutándose y pasando al 100% (0 fallos).
- **Seguridad y Respaldo:**
  - Respaldo de base de datos en `backups/backup_pre_transferencia_cuentas_20261110.json` y tag git `backup-pre-transferencia-cuentas-20261110`.
- **Metodología SDD:** Especificación completa en `specs/023-transferencia-entre-cuentas-contables/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-10 (Plan de Cuentas Contable y Operaciones CRUD — Spec 022)
- **Motor Contable (`assets/js/accounting.js`):**
  - Implementación de `TIPOS_CUENTA` (`Activo`, `Pasivo`, `Capital`, `Ingreso`, `Egreso`), `normalizarTipoCuenta(tipo)` y `validarCuentaContable(cuenta, cuentasExistentes)`.
  - Definición oficial del catálogo predeterminado de 21 cuentas del taller en `PLAN_CUENTAS_DEFECTO` con marcas de sistema `esSistema: true`.
- **Capa de Persistencia y Métodos CRUD (`assets/js/storage.js`):**
  - Añadida clave `STORAGE_KEYS.ACCOUNTS = 'novaprint_accounts'`.
  - Implementados métodos `getAccounts(filtroTipo)` con auto-seed de las 21 cuentas base, `getAccountById(id)`, `getAccountByCode(codigo)`, `saveAccount(accountData)` (creación/edición con validación de código único), `deleteAccount(id)` (con protección estricta para cuentas de sistema) y `resetDefaultAccounts()`.
  - Integración en `exportBackup` e `importBackup` para respaldar y restaurar el plan de cuentas.
  - Sincronización en `clearAllData` para restablecer el catálogo de fábrica.
- **Interfaz de Usuario y Modales (`index.html`, `assets/js/ui.js` y `assets/js/main.js`):**
  - Botón de navegación `[📑 Plan de Cuentas]` (`#btn-acc-sub-chart`) en la barra de subvistas de Contabilidad.
  - Sub-vista `#acc-subview-chart` con tarjetas resumen KPI por cada grupo (Total, Activos, Pasivos, Capital, Ingresos, Egresos), buscador en tiempo real, selector de filtro por grupo, tabla responsiva con botones de acción rápida `[✏️]` y `[🗑️]`.
  - Modal accesible `<dialog id="dialog-account">` con `#form-account` para creación y edición asistida de cuentas.
  - Controladores en `NovaprintUI`: `renderAccountsChart`, `filtrarPlanCuentas`, `abrirModalNuevaCuenta`, `editarCuenta`, `guardarCuentaDesdeFormulario`, `confirmarEliminarCuenta` y `confirmarRestablecerCuentas`.
- **Pruebas Automatizadas (`tests/chart_of_accounts_crud.test.js`):**
  - 14 nuevas pruebas unitarias cubriendo definición de grupos, normalización semántica de alias, validación de cuentas, auto-seed en storage, filtrado por tipo, operaciones CRUD, rechazo de códigos duplicados, protección de cuentas del sistema y respaldo/restauración.
  - Test suite global: 180 pruebas unitarias en 15 suites ejecutándose y pasando al 100% (0 errores).
- **Seguridad y Respaldo:**
  - Respaldo de seguridad previo generado en `backups/backup_pre_crud_plan_cuentas_20261110.json` y tag git `backup-pre-crud-plan-cuentas-20261110`.
- **Metodología SDD:** Especificación completa en `specs/022-plan-de-cuentas-contable-crud/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-09 (Separar Compra de Poleras y Estampado DTF en 2 Facturas para 2 Proveedores — Spec 021)
- **Motor de Producción y Proveedores (`assets/js/production.js`):**
  - Implementación de `clasificarItemCompra(item, inventario)`: clasifica con precisión insumos como `'textil'` o `'dtf'`.
  - `esCompraMixta(items, inventario)`: detecta automáticamente si una compra combina prendas textiles y estampados DTF.
  - `separarItemsCompra(items, inventario)`: agrupa los ítems en `{ itemsPoleras, itemsDtf }`.
  - `resolverProveedorParaCategoria(categoria, proveedores)`: sugiere automáticamente el proveedor adecuado (textil o gráfico/DTF).
- **Capa de Persistencia Atómica (`assets/js/storage.js`):**
  - Implementación de `separarCompraEnDos(compraOriginalId, datosPoleras, datosDtf)`: actualiza la compra previa con los ítems y proveedor textil, y crea una nueva compra con los ítems y proveedor DTF garantizando cuadratura estricta de stock ($\Delta = 0$).
- **Interfaz de Usuario y Modales (`assets/js/ui.js` e `index.html`):**
  - Banner dinámico `#purchase-split-banner` con botón `[✂️ Separar en 2 Facturas]` en `#dialog-purchase` al editar o registrar compras mixtas.
  - Botón de acción rápida `[✂️]` en la tabla de compras `#view-purchases`.
  - Modal nativo `<dialog id="dialog-split-purchase">` con configuración simultánea de Factura 1 (Poleras) y Factura 2 (Estampados DTF), selectores de proveedor, numeración de factura, desglose de IVA (19%), Delivery y cálculo consolidado.
- **Pruebas Automatizadas (`tests/split_purchases_poleras_dtf.test.js`):**
  - 8 nuevas pruebas unitarias cubriendo clasificación, detección mixta, separación de ítems, resolución de proveedores, persistencia y cuadratura de bodega, y flujo de UI.
  - Test suite global: 166 tests ejecutándose y pasando al 100% (0 fallos).
- **Seguridad y Respaldo:**
  - Respaldo de base de datos en `backups/backup_pre_separar_compras_poleras_dtf_20261109.json` y tag git `backup-pre-separar-compras-poleras-dtf-20261109`.
- **Metodología SDD:** Especificación completa en `specs/021-separar-compra-poleras-estampado-dtf-dos-facturas-proveedores/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-09 (Compra de Estampados en Material Faltante: Adelante, Atrás, Ambos — Spec 020)
- **Motor de Producción y Cotización (`assets/js/production.js`, `assets/js/sales.js`):**
  - Implementación de `OPCIONES_ESTAMPADO`, `normalizarOpcionEstampado` y `obtenerCostoCompraEstampado`: Adelante ($1.800 compra / $3.200 sugerido), Atrás ($2.200 compra / $3.500 sugerido) y Ambos ($3.500 compra / $5.500 sugerido).
  - Extensión de `calcularFaltantesPedido` para admitir `{ incluirEstampados: true }`, agregando 1 unidad de estampado por cada prenda confeccionada con su costo de compra correspondiente.
  - Actualización de `calcularPrecioSugeridoPrenda` en `sales.js` para reflejar el precio sugerido de venta según la opción seleccionada.
- **Capa de Persistencia (`assets/js/storage.js`):**
  - Implementación de `asegurarItemInventarioEstampado(technique, location, datosExtra)`: crea o recupera ítems de estampado en `novaprint_inventory` con categoría de insumo y costo de compra, enlazando la compra de material faltante a bodega.
- **Interfaz de Usuario (`assets/js/ui.js` e `index.html`):**
  - Tabla de prendas en `#dialog-order`: conversión del campo de ubicación en selector `<select>` con opciones Adelante, Atrás y Ambos indicando costo de referencia.
  - Recálculo reactivo en tiempo real de precios sugeridos y subtotales al cambiar de estampado.
  - Actualización de la alerta visual `#order-stock-alert-container` para detallar conteo de prendas y estampados a adquirir.
  - `abrirModalCompraConFaltantes`: carga transparente de prendas base e insumos de estampado en `#dialog-purchase`.
- **Pruebas Automatizadas (`tests/print_purchases_faltantes.test.js`):**
  - 12 nuevas pruebas unitarias cubriendo parametrización de costos, precios de venta, cálculo de faltantes con estampados, auto-creación de ítems de inventario y retrocompatibilidad.
  - Suite global completa: 158 tests pasando exitosamente (0 fallos).
- **Seguridad y Respaldo:**
  - Respaldo previo creado en `backups/backup_pre_compra_estampados_20261109.json` y tag git `backup-pre-compra-estampados-20261109`.
- **Metodología SDD:** Especificación completa en `specs/020-compra-material-faltante-estampados-adelante-atras-ambos/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-09 (Asientos Contables al Registrar Pedidos: Abono a Banco y Saldo a CxC — Spec 019)
- **Motor Contable (`assets/js/accounting.js`):**
  - Implementación de `generarAsientosPedido(pedido)`: separa el monto abonado en débito a `1101 Caja y Bancos (Disponible)` y el saldo pendiente en débito a `1102 Cuentas por Cobrar Clientes`, contrapartiendo en crédito a `4101 Ventas de Poleras y Confección`.
  - Normalización unificada en `normalizarMontosPedido(p)` para leer tanto atributos en la raíz como dentro del objeto anidado `totals`.
  - Actualización de `generarLibroDiario` para incorporar los asientos contables detallados de cada pedido activo.
- **Capa de Persistencia (`assets/js/storage.js`):**
  - Actualización de `saveOrder`: al registrar o editar un pedido, calcula y adjunta automáticamente el array `asientosContables` al objeto de la orden preservando la inmutabilidad de los datos.
- **Interfaz de Usuario (`assets/js/ui.js`):**
  - En `renderAccountingJournal`, se añadieron insignias contextuales para distinguir los asientos de ventas: *Abono Banco* (verde esmeralda) y *Saldo Crédito* (azul cielo), mejorando la legibilidad del Libro Diario.
- **Respaldo previo & Pruebas Automatizadas (`tests/order_accounting_entries.test.js`):**
  - Respaldo de seguridad previo generado en `backups/backup_pre_asientos_pedidos_20261109.json` y tag git `backup-pre-asientos-pedidos-20261109`.
  - 8 nuevas pruebas unitarias cubriendo generación de asientos para abono parcial, pago total, pedidos a crédito, persistencia en storage y consistencia de Balance General.
  - Test suite global: 146 pruebas unitarias pasando al 100% en verde (0 fallos).
- **Metodología SDD:** Especificación completa en `specs/019-asientos-contables-abono-banco-saldo-cuentas-por-cobrar/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-09 (Módulo de Contabilidad Integral — Spec 018)
- **Motor Contable (`assets/js/accounting.js`):**
  - Implementación del Plan de Cuentas estándar (`CUENTAS_CONTABLES`) y consolidadores de datos enlazados a la operativa actual: `obtenerConsolidadoPedidos` (ventas de poleras, abonos, cuentas por cobrar, débito fiscal IVA), `obtenerConsolidadoCompras` (costo de insumos, crédito fiscal IVA, cuentas por pagar), `obtenerValorizacionInventario` (activos en existencias de bodega) y `obtenerConsolidadoGastos` (gastos operacionales de taller).
  - Funciones de cálculo contable y financiero: `calcularEstadoResultados` (P&L), `calcularBalanceGeneral` (con ecuación $\text{Activos} = \text{Pasivos} + \text{Patrimonio}$ balanceada), `generarLibroDiario` (asientos cronológicos) y `calcularMetricasContables`.
- **Capa de Persistencia (`assets/js/storage.js`):**
  - Agregada clave `novaprint_expenses` (`STORAGE_KEYS.EXPENSES`) y métodos CRUD: `getExpenses`, `getExpenseById`, `saveExpense`, `deleteExpense`.
  - Actualización de `clearAllData`, `exportBackup` e `importBackup` para respaldar y restaurar gastos de taller.
- **Interfaz de Usuario (`index.html`, `assets/js/ui.js`, `assets/js/main.js`):**
  - Pestaña de navegación "📊 Contabilidad" (`data-view="accounting"`).
  - Sección `#view-accounting` con tarjetas KPI (Total Activos, Total Pasivos, Patrimonio Neto, Utilidad Neta), sub-pestañas ("Balance General", "Estado de Resultados", "Libro Diario de Movimientos") y tablas detalladas con códigos contables.
  - Modal nativo `<dialog id="dialog-expense">` con selector de categorías estándar de taller, método de pago, monto y notas.
  - Sincronización reactiva en `refrescarDatos()` que actualiza el módulo contable al registrar o modificar pedidos, compras, stock o gastos.
- **Respaldo previo & Pruebas Automatizadas (`tests/accounting.test.js`):**
  - Respaldo de seguridad previo generado en `backups/backup_pre_contabilidad_20261109.json` y tag git `backup-pre-contabilidad-20261109`.
  - 11 nuevas pruebas unitarias cubriendo plan de cuentas, ventas de poleras, compras, inventario, estado de resultados, balance general, libro diario, persistencia y elementos UI.
  - Test suite global: 138 pruebas pasando al 100% en verde (0 fallos).
- **Metodología SDD:** Especificación completa en `specs/018-modulo-contabilidad-activos-pasivos-ingresos-gastos/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-08 (Opción para Modificar el Stock de Inventarios — Spec 017)
- **Capa de Persistencia (`storage.js`):**
  - Implementada la función `updateInventoryStock(id, newStock, options)` con validación de límite inferior ($\ge 0$), actualización de timestamp y registro de metadatos en `lastStockAdjustment` (stock anterior, nuevo stock, delta, motivo y notas).
- **Interfaz y Diálogos (`index.html` & `ui.js`):**
  - Creado el diálogo modal nativo `<dialog id="dialog-adjust-stock">` con ficha técnica del artículo, comparación de existencias, cálculo en vivo de variación ($\Delta$), selector numérico con botones rápidos (`-10, -5, -1, Agotado (0), +1, +5, +10`) y selección de motivo.
  - En la tabla de inventarios (`renderInventoryTable`), la celda de stock actual se convirtió en un botón interactivo y se añadió el botón directo `[📦]` ("Modificar Stock") en la columna de operaciones.
  - Implementadas `abrirModalModificarStock`, `recalcularDeltaStock`, `aplicarAjusteStockDelta` y `guardarModificacionStock` en `NovaprintUI`, y conectado el envío de formulario en `main.js`.
- **Pruebas Automatizadas (`tests/inventory_stock_adjustment.test.js`):**
  - 8 pruebas unitarias cubriendo persistencia, corrección de números negativos, preservación de atributos, renderizado de botones y ciclo completo de guardado/cierre.
  - Test suite global: 127 pruebas en 10 suites pasando al 100% (0 errores).
- **Metodología SDD:** Especificación completa en `specs/017-modificar-stock-inventario/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-08 (Eliminación de Opciones "Vaciar Base de Datos" y "Cargar datos de Prueba" — Spec 016)
- **Seguridad en Ajustes & Respaldo (`index.html` & `assets/js/main.js`):**
  - Removido el bloque "Gestión de Registros" con los botones `#btn-clear-database` ("Vaciar Base de Datos") y `#btn-load-demo-data` ("Cargar Datos de Prueba") de `#dialog-settings`.
  - Retirados los listeners de eventos en `main.js` (`initEventosConfiguracion`), evitando referencias colgantes a elementos eliminados.
  - Preservadas al 100% las funciones de configuración empresarial, preferencias de tema y herramientas de respaldo JSON (`#btn-export-backup` y `#file-import-backup`).
- **Pruebas Automatizadas (`tests/settings_cleanup.test.js`):**
  - 5 pruebas unitarias verificando la ausencia de botones de vaciado/demo en `index.html`, la conservación de herramientas de respaldo y la integridad del formulario de ajustes.
  - Test suite global: 119 pruebas en 9 suites pasando al 100% (0 errores).
- **Metodología SDD:** Especificación completa en `specs/016-eliminar-opciones-vaciar-cargar-datos-prueba/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-08 (Botones para Modificar el Status de un Pedido — Spec 015)
- **Modal de Selección Rápida de Estados (`index.html` & `assets/js/ui.js`):**
  - Creado el diálogo nativo `<dialog id="dialog-change-order-status">` con resumen del pedido (ID, Cliente, Estado actual) y cuadrícula táctil con los 6 estados del flujo textil (`Cotización`, `Confirmado`, `En producción`, `Listo para entrega`, `Entregado`, `Cancelado`).
  - Implementadas las funciones `abrirModalCambiarEstado(orderId)` y `seleccionarNuevoEstado(orderId, nuevoEstado)` en `NovaprintUI`.
- **Integración en Vistas (`ui.js`):**
  - **Tabla de Pedidos:** La insignia de la columna "Estado" es ahora un botón interactivo y se agregó el botón `[🔄]` en la columna "Acciones".
  - **Tablero Kanban:** Incorporado el botón táctil `[🔄 Estado]` en cada tarjeta de orden.
- **Pruebas Automatizadas (`tests/order_status_buttons.test.js`):**
  - Creadas 5 pruebas unitarias verificando exportación, generación de botones interactivos en tabla y kanban, renderizado de opciones con resaltado del estado actual y ejecución de la actualización vía storage.
  - Test suite global: 114 pruebas en 8 suites pasando al 100% (0 errores).
- **Metodología SDD:** Especificación completa en `specs/015-botones-modificar-status-pedido/` (`spec.md`, `plan.md`, `tasks.md`).

### 2026-11-06 (Edición y Eliminación de Compras de Insumos — Spec 014)
- **Corrección en Botón de Edición de Compras:** Se corrigió un error en `assets/js/ui.js` (`editarCompra`) que invocaba una función inexistente (`renderizarFilasItemsCompra` en vez de `renderTablaItemsCompraFormulario`), se garantizó la asignación de IDs de fila para los ítems editados, se aisló el estado en compras de faltantes y se añadió la prueba `tests/ui_purchase.test.js` (alcanzando 109/109 pruebas pasando).
- **Capa de Persistencia (`storage.js`):** Implementadas funciones `getPurchaseById`, edición en `savePurchase` con ajuste diferencial de existencias en bodega y `deletePurchase` con reversión de inventario protegida contra stock negativo (`Math.max(0, ...)`).
- **Interfaz de Usuario (`index.html` y `ui.js`):** Columna de acciones en tabla de compras con botones de editar y eliminar; modal dinámico `#dialog-purchase` compatible con creación y edición; alertas de confirmación nativas para eliminación y toasts informativos.
- **Pruebas Automatizadas (`storage.test.js` & `ui_purchase.test.js`):** 4 pruebas unitarias cubriendo consulta, edición diferencial, eliminación con reversión de stock y renderizado interactivo del modal de edición.
- **Sincronización:** Documentación formal SDD en `specs/014-edicion-eliminacion-compras-insumos/` y actualización en repositorio GitHub.

### 2026-11-05 (Despliegue y Ejecución Remota vía GitHub Pages)
- **Activación de GitHub Pages:** Se habilitó GitHub Pages en el repositorio `ventas-novaprint` sirviendo desde la rama `main` en la raíz (`/`).
- **Enlace de Ejecución Remota Activo:** La aplicación quedó publicada y operativa en producción en la URL: `https://andresaguiarmarmol.github.io/ventas-novaprint/`.
- **Configuración en Repositorio & README:** Se estableció la URL en la sección *Homepage / About* del repositorio en GitHub y se integró el enlace directo en `README.md`.

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
