# Spec 001 — Módulo de Ventas: Control de Clientes y Control de Pedidos
Estado: implementada

## Contexto y objetivo
Novaprint es una microempresa de personalización y estampado textil de prendas como:
- **Poleras:** Algodón, Poliéster, Piqué.
- **Polerones:** Canguro, Cuello redondo, Con cierre.
- **Buzos:** Pantalones deportivos y conjuntos.
- **Gorras:** Trucker, Jockey estructurado, Snapback.

Las técnicas de estampado habituales incluyen: **DTF (Direct to Film), Serigrafía, Sublimación, Vinilo Textil y Bordado**.

El objetivo de esta especificación es dotar a Novaprint de un **Módulo de Ventas** ágil, visual y robusto que permita gestionar la cartera de clientes, cotizar y registrar pedidos multi-ítem con especificaciones textiles exactas, controlar abonos/saldos y emitir comprobantes de venta digitales e impresos.

---

## Usuarios
- **Administrador / Encargado de Ventas:** Registra y consulta clientes, carga pedidos, registra pagos y emite tickets.
- **Operador de Taller (consulta):** Consulta especificaciones de prendas y fechas límite para preparar producción.
- **Cliente (receptor final):** Recibe el ticket detallado y resumen por WhatsApp con fecha de entrega acordada.

---

## Historias de usuario
- **HU-1:** Como encargado de ventas, quiero registrar, editar y buscar clientes con su nombre, teléfono/WhatsApp, correo y RUT para asociarlos a sus pedidos y mantener su historial unificado.
- **HU-2:** Como encargado de ventas, quiero registrar pedidos multi-ítem indicando prenda (polera, polerón, buzo, gorra), color, talla, técnica de estampado, ubicación del estampado, cantidad y precio unitario para cotizar con exactitud.
- **HU-3:** Como encargado de ventas, quiero registrar el abono/seña inicial y calcular automáticamente el saldo pendiente para tener control financiero de cada pedido.
- **HU-4:** Como encargado de ventas, quiero ver los pedidos con indicadores visuales de estado y semáforo cronológico de entrega (Atrasado, Hoy, Próximos días) para asegurar el cumplimiento de plazos.
- **HU-5:** Como encargado de ventas, quiero generar e imprimir un comprobante/ticket de venta limpio (formato ticket o A4) y generar un mensaje para enviar directamente por WhatsApp al cliente con un solo clic.

---

## Definiciones
- **Prenda:** Categoría textil base (`Polera`, `Polerón`, `Buzo`, `Gorra`, `Otro`).
- **Técnica de Estampado:** Proceso de personalización (`DTF`, `Serigrafía`, `Sublimación`, `Vinilo Textil`, `Bordado`).
- **Ubicación de Estampado:** Posición en la prenda (`Pecho grande`, `Pechera izq. (logo)`, `Espalda completa`, `Espalda alta`, `Manga`, `Frontal gorra`).
- **Estados de Pedido:** `Cotización` | `Confirmado` | `En producción` | `Listo para entrega` | `Entregado` | `Cancelado`.
- **Estado de Pago:** `Pendiente (0%)` | `Abonado (Parcial)` | `Pagado Total (100%)`.

---

## Requisitos funcionales (Formato EARS en español)

### Gestión de Clientes
- **RF-1.1:** CUANDO el usuario registre o actualice un cliente con nombre y teléfono válidos, EL SISTEMA almacenará el cliente en el catálogo con un identificador único y fecha de registro.
- **RF-1.2:** SI el usuario intenta guardar un cliente sin nombre o teléfono, ENTONCES EL SISTEMA bloqueará el guardado e indicará los campos obligatorios.
- **RF-1.3:** CUANDO el usuario escriba en el buscador de clientes, EL SISTEMA filtrará en tiempo real por nombre, teléfono o RUT.
- **RF-1.4:** CUANDO se visualice el detalle de un cliente, EL SISTEMA mostrará su historial completo de pedidos asociados, total comprado y saldo adeudado.

### Gestión de Pedidos y Líneas de Pedido
- **RF-2.1:** CUANDO el usuario cree un nuevo pedido, EL SISTEMA permitirá seleccionar un cliente existente o registrar uno nuevo al vuelo.
- **RF-2.2:** CUANDO el usuario añada prendas a un pedido, EL SISTEMA permitirá agregar múltiples ítems detallando:
  - Tipo de prenda (`Polera`, `Polerón`, `Buzo`, `Gorra`).
  - Color y Talla (`XS`, `S`, `M`, `L`, `XL`, `XXL`, `Especial`, `Única` para gorras).
  - Técnica de estampado (`DTF`, `Serigrafía`, `Sublimación`, `Vinilo Textil`, `Bordado`).
  - Ubicación de estampado (`Pecho`, `Espalda`, `Manga`, `Frontal`, etc.).
  - Cantidad y Precio Unitario.
  - Subtotal automático (`Cantidad × Precio Unitario`).
- **RF-2.3:** EL SISTEMA calculará dinámicamente el monto total sumando todos los ítems del pedido.
- **RF-2.4:** CUANDO el usuario ingrese un monto de abono, EL SISTEMA calculará automáticamente el saldo pendiente (`Total - Abono`) y actualizará el estado de pago (`Pendiente`, `Abonado`, `Pagado Total`).
- **RF-2.5:** SI el monto de abono supera el total del pedido, ENTONCES EL SISTEMA alertará al usuario y ajustará el monto al valor máximo permitido.

### Control de Estados y Semáforo de Entregas
- **RF-3.1:** CUANDO cambie el estado operativo del pedido (`Cotización` → `Confirmado` → `En producción` → `Listo` → `Entregado` → `Cancelado`), EL SISTEMA registrará la fecha de actualización y reflejará el nuevo estado en todas las vistas.
- **RF-3.2:** EL SISTEMA clasificará visualmente los pedidos según su fecha de entrega acordada:
  - **Rojo (Urgente / Atrasado):** Fecha de entrega vencida y estado distinto de `Entregado` o `Cancelado`.
  - **Ámbar (Atención):** Entrega programada para hoy o las próximas 24 horas.
  - **Azul/Verde (En plazo):** Entrega programada para los próximos días.

### Ticket y Comunicación con Cliente
- **RF-4.1:** CUANDO el usuario presione "Imprimir Ticket", EL SISTEMA abrirá la vista de impresión optimizada (`@media print`) conteniendo los datos de Novaprint, datos del cliente, detalle de prendas/tallas/técnicas, fechas, totales, abono y saldo pendiente.
- **RF-4.2:** CUANDO el usuario presione "Enviar WhatsApp", EL SISTEMA construirá un enlace `https://wa.me/<telefono>?text=...` con el resumen formal del pedido formateado con saltos de línea y emojis para envío directo.

---

## Requisitos no funcionales
- **RNF-1 (Cero compilación):** Ejecución directa en navegador estándar moderno (Chrome, Edge, Firefox, Safari) sin dependencias de Node.js en tiempo de ejecución.
- **RNF-2 (Persistencia Local y Exportable):** Todos los datos se guardan en `localStorage` con opción de exportar e importar copia de respaldo `.json`.
- **RNF-3 (Responsive & Mobile First):** La interfaz debe operar fluidamente en pantallas de escritorio y teléfonos móviles.
- **RNF-4 (Rendimiento):** Búsquedas y filtros instantáneos (< 50 ms) para catálogos de cientos de pedidos.

---

## Casos límite
- Clientes con múltiples pedidos simultáneos.
- Pedidos sin abono inicial (quedan con estado `Pendiente` y saldo igual al total).
- Pedidos que se cancelan luego de haber recibido abono (debe reflejarse en el estado sin romper el historial).
- Modificación de ítems de un pedido ya confirmado (recalcula totales y saldos automáticamente).

---

## Fuera de alcance de esta Spec (se abordará en Specs 002 y 003)
- Gestión de compras a proveedores de prendas lisas y tintas (Spec 002).
- Descuento automático de stock en inventario (Spec 002).
- Seguimiento de órdenes de trabajo por puesto de estampado (Spec 003).

---

## Criterios de finalización
- [ ] Catálogo de clientes funcional con búsqueda, creación, edición y vista de historial.
- [ ] Creación y edición de pedidos multi-prenda (poleras, polerones, buzos, gorras) con técnicas de estampado y tallas.
- [ ] Cálculo automático de totales, abonos y saldo pendiente.
- [ ] Semáforo visual de fechas de entrega y filtros por estado.
- [ ] Ticket imprimible y generador de mensaje para WhatsApp.
- [ ] Respaldo y restauración de datos en JSON funcional.

---

## Dudas abiertas / Clarificaciones
- [ ] ¿Deseas que la moneda por defecto sea CLP (Pesos Chilenos `$`), USD o configurable en la pantalla de ajustes de Novaprint?
- [ ] ¿Hay alguna técnica de estampado adicional que utilicen en Novaprint (por ejemplo, bordado o vinilo reflectivo)?
- [ ] ¿Aprobamos esta Spec 001 para generar el Plan Técnico (`plan.md`) y la lista de tareas (`tasks.md`) correspondientes?

