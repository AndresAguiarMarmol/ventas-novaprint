# Novaprint App — Ventas & Producción Textil

[![Ejecutar en Remoto (GitHub Pages)](https://img.shields.io/badge/🌐_Demo_En_Vivo-GitHub_Pages-blue?style=for-the-badge)](https://andresaguiarmarmol.github.io/ventas-novaprint/)

Aplicación web integral para la microempresa **Novaprint**, especializada en servicios de estampado textil (Poleras, Polerones, Buzos y Gorras) con técnicas DTF, Sublimación, Vinilo, Serigrafía y Bordado.

> 🚀 **Ejecutar la App en remoto:**  
> Puedes abrir y utilizar la aplicación directamente desde cualquier dispositivo móvil o computadora en:  
> **[https://andresaguiarmarmol.github.io/ventas-novaprint/](https://andresaguiarmarmol.github.io/ventas-novaprint/)**

---

## 🚀 Características Principales

- **Módulo de Ventas:**
  - Control de Pedidos con estados de flujo (Cotización, Confirmado, En producción, Listo para entrega, Entregado).
  - Directorio y gestión completa de Clientes con historial de compras.
  - Cotizador textil inteligente con reglas técnicas (compatibilidad DTF vs Sublimación, recargos de tallas especiales).
  - Escala oficial de **Descuentos por Volumen** (5% desde 6 un., 10% docena, 15% mayorista, 20% gran volumen) con consulta interactiva.
  - Soporte de precios libres (promocionales a $0, decimales o valores arbitrarios).
  - Cálculo financiero con **IVA (19% Chile)** y **Delivery/Envío**.
  - Generación de comprobante y tickets imprimibles de 80mm para punto de venta / taller.
  - Envío directo del comprobante a WhatsApp con mensaje pre-armado y normalización de código país (+56).

- **Módulo de Producción:**
  - **Inventario:** Control de existencias, cálculo de stock mínimo con alertas críticas y valorización total de bodega.
  - **Compras a Proveedores:** Registro de órdenes de compra con cálculo de IVA y flete, e incremento automático de stock en bodega.
  - **Proveedores:** Catálogo centralizado de proveedores de insumos y prendas base.
  - **Detección Automática de Faltantes:** Comparación automática entre prendas del pedido y stock disponible, con botón para pre-llenar y generar la compra de faltantes al instante.
  - **Control de Fabricación en Taller:** Tablero Kanban con las 5 estaciones del proceso (Diseño, Preparación, Estampado, Control de Calidad y Empacado).

- **Diseño & Experiencia de Usuario:**
  - Selector de tema **Claro / Oscuro / Sistema** con prevención de parpadeo (FOUC).
  - PWA offline lista para instalación en dispositivos móviles y tablets del taller.
  - Iconos vía CDN (Lucide Icons) y Tailwind CSS.
  - Exportación, importación y respaldo completo de base de datos en JSON.

---

## 🛠️ Stack Tecnológico

- **HTML5 Semántico & Tailwind CSS** (vía CDN con soporte `darkMode: 'class'`).
- **JavaScript Vanilla Modular (ES6+):** Sin compiladores ni empaquetadores (ejecutable directamente en navegador).
- **Pruebas Automatizadas:** Suite completa con el runner nativo `node:test` (`tests/*.test.js`).
- **PWA:** `manifest.json` y `sw.js` para funcionamiento sin conexión.

---

## 🧪 Pruebas Automatizadas

Para ejecutar la suite completa de pruebas:

```bash
node --test tests/*.test.js
```

---

## 👤 Créditos y Autoría

Análisis, Diseño y Desarrollo por **Andres Aguiar V** — Santiago de Chile.  
Contacto directo: +56933395447
