# Plan de Implementación — Spec 052: Repetición de Cabecera de Tabla en Página 2 y Margen Superior en Impresión

## 1. Arquitectura de Estilos y Componentes Afectados

```mermaid
flowchart TD
    PrintTrigger[imprimirTicket / Ctrl+P] --> PageMargin[@page margin-top: 15mm en todas las hojas]
    PageMargin --> HtmlBodyReset[html/body: min-height: 0, height: auto, overflow: visible]
    HtmlBodyReset --> TicketTable[table.ticket-table display: table, thead table-header-group]
    TicketTable --> RepeatHeader[Chromium duplica Detalle Prenda | P. Unit | Subtotal en Página 2+]
```

### Módulos a intervenir:
1. **`assets/js/ticket.js`:**
   - En `generarTicketHTML(pedido, settings)`:
     - Asignar la clase distintiva `ticket-table` a la tabla de prendas:
       `<table class="ticket-table w-full text-xs border-collapse">`.
     - Asegurar estructura canónica `<thead>` con `<tr>` y `<th>`, y `<tbody>` con `<tr>` y `<td>`.
2. **`assets/css/custom.css`:**
   - En `@media print`:
     - Configurar `@page { margin-top: 15mm; margin-bottom: 12mm; margin-left: 8mm; margin-right: 8mm; size: auto; }`.
     - En `html, body`: sustituir `min-height: 100%` por `min-height: 0 !important; height: auto !important; overflow: visible !important;`.
     - Agregar reglas especializadas para `table.ticket-table`:
       - `display: table !important; border-collapse: collapse !important;`
       - `thead { display: table-header-group !important; break-inside: avoid !important; }`
       - `tbody { display: table-row-group !important; }`
       - `thead th { background-color: #f3f4f6 !important; border-bottom: 2px solid #9ca3af !important; padding: 6px 4px !important; }`
       - `tbody tr { break-inside: avoid !important; page-break-inside: avoid !important; }`

---

## 2. Plan de Pruebas Unitarias
Crear `tests/comprobante_cabecera_margen_print.test.js`:
1. **Verificación de Estructura de Tabla en `ticket.js`:**
   - Verifica que `generarTicketHTML` incluya la clase `ticket-table` en la tabla de prendas.
   - Verifica la presencia del bloque `<thead>` con los títulos *Detalle Prenda*, *P. Unit* y *Subtotal*.
2. **Verificación de Reglas CSS de `@media print` en `custom.css`:**
   - Verifica la regla `@page` con `margin-top: 15mm`.
   - Verifica que `html` y `body` tengan `min-height: 0` y no contengan `min-height: 100%` en print.
   - Verifica las declaraciones `table-header-group` y `table-row-group` para `table.ticket-table`.
