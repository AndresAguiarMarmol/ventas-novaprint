---
name: cotizador-textil-pedidos
description: Procesa solicitudes de cotización textil, desglosa prendas, tallas y técnicas de estampado (DTF, sublimación, vinilo, serigrafía), y calcula costos totales en JSON estructurado. Úsala cuando un cliente envíe requerimientos de poleras, polerones o buzos para generar presupuestos y órdenes de taller.
---

# Cotizador Textil y Pedidos

Esta skill convierte consultas informales o mensajes de clientes sobre prendas personalizadas en presupuestos estructurados, detallando la viabilidad técnica de estampado, desglose de tallas y cálculo transparente de costos.

## Cuándo Usar

* Al recibir solicitudes de clientes por WhatsApp, correo o formularios web pidiendo precios por poleras, polerones, buzos o gorros.
* Para determinar la técnica de estampado adecuada según el color y composición de la tela.
* Para emitir una orden de cotización estructurada en JSON y un resumen en texto para el cliente.

---

## Parámetros Base y Reglas de Negocio

### 1. Compatibilidad de Técnicas según Prenda

* **Sublimación:**
  * Exclusivo para telas de **Poliéster** o mezclas con ≥70% poliéster.
  * Solo sobre telas **blancas o colores muy claros** (no apto para prendas oscuras).
* **DTF (Direct to Film):**
  * Universal: Apto para 100% algodón, poliéster o mezclas.
  * Excelente adherencia y opacidad en prendas oscuras (negras, azul marino, rojo) y claras.
* **Vinilo Textil:**
  * Ideal para textos, números deportivos, siluetas o logos a 1-2 colores planos.
  * No recomendado para degradados o detalles fotográficos finos.
* **Serigrafía:**
  * Recomendada solo para tirajes medianos a grandes (mínimo 30-50 unidades con el mismo diseño) debido al costo de matrices.

### 2. Tabla de Costos de Referencia (Valores en CLP)

| Concepto | Costo Base |
| :--- | :--- |
| **Polera básica algodón (S a XL)** | $3.500 |
| **Polera básica poliéster/sublimable (S a XL)** | $2.800 |
| **Polerón canguro con capucha (S a XL)** | $11.000 |
| **Recargo Tallas Especiales (XXL, 3XL)** | +$1.200 por prenda |
| **Estampado Logo Pecho (hasta 10x10 cm - DTF/Vinilo)** | $1.500 |
| **Estampado Grande Pecho/Espalda (hasta A4 / 20x30 cm)** | $3.200 |
| **Estampado Extra Grande (hasta A3 / 30x40 cm)** | $4.800 |
| **Estampado Sublimación A4 (en polera blanca poliéster)** | $1.800 |

### 3. Escala de Descuentos por Volumen

* **1 a 5 unidades:** Precio unitario regular.
* **6 a 11 unidades:** 5% de descuento en el total.
* **12 a 24 unidades (Docena):** 10% de descuento en el total.
* **25 a 49 unidades:** 15% de descuento en el total.
* **50+ unidades:** 20% de descuento en el total.

---

## Procedimiento de Cálculo

1. **Identificar prendas:** Clasificar tipo de prenda, color y cantidades desglosadas por talla (`S`, `M`, `L`, `XL`, `XXL`, etc.).
2. **Asignar técnica:** Evaluar el color y tipo de tela. Si el cliente pide sublimación sobre prenda de algodón o prenda oscura, corregir a **DTF** indicando el motivo técnico.
3. **Calcular costo unitario:**
   $$\text{Costo Unitario} = \text{Prenda Base} + \text{Recargo Talla} + \sum \text{Costos de Estampado}$$
4. **Calcular subtotal y aplicar escala de volumen:** Multiplicar por cantidades y aplicar el porcentaje de descuento correspondiente al tramo.

---

## Formato de Salida

La respuesta debe incluir siempre dos partes:
1. **Bloque JSON estricto** (para consumo en backend Python / frontend JS).
2. **Resumen amigable para el cliente** (para copiar y pegar en WhatsApp o correo).

### Esquema JSON

```json
{
  "cotizacion_id": "COT-YYYYMMDD-001",
  "cliente": "Nombre detectado o null",
  "fecha": "YYYY-MM-DD",
  "total_unidades": 0,
  "resumen_prendas": [
    {
      "tipo_prenda": "polera | poleron | buzo | gorro",
      "color": "color de la tela",
      "material_sugerido": "algodon | poliester | mezcla",
      "desglose_tallas": {
        "S": 0,
        "M": 0,
        "L": 0,
        "XL": 0,
        "XXL": 0
      },
      "tecnica_estampado": "DTF | Sublimacion | Vinilo | Serigrafia",
      "posiciones_estampado": [
        {
          "ubicacion": "pecho_izquierdo | pecho_centro | espalda | manga",
          "tamano": "logo_pequeno | A4 | A3",
          "costo_unitario_estampado": 0
        }
      ],
      "costo_base_prenda": 0,
      "costo_unitario_promedio": 0,
      "subtotal_linea": 0
    }
  ],
  "calculo_financiero": {
    "subtotal_bruto": 0,
    "porcentaje_descuento": 0,
    "monto_descuento": 0,
    "total_neto": 0,
    "moneda": "CLP"
  },
  "observaciones_tecnicas": [
    "Notas sobre compatibilidad de tela, resolución de arte requerida o tiempos estimados"
  ]
}