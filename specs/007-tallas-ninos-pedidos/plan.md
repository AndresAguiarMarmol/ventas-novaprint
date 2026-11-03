# Plan de Implementación — Spec 007: Tallas Infantiles en Pedidos e Inventario

## 1. Arquitectura y Definición de Datos (`assets/js/sales.js`)
- Definir y exportar las constantes oficiales:
  ```javascript
  const TALLAS_TEXTILES = [
    '4', '6', '8', '10', '12', '14', '16', '18',
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'
  ];

  const TALLAS_GRUPOS = [
    { grupo: 'Niños', tallas: ['4', '6', '8', '10', '12', '14', '16', '18'] },
    { grupo: 'Adultos / Estándar', tallas: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'] }
  ];
  ```
- Exportar `TALLAS_TEXTILES` y `TALLAS_GRUPOS` en el objeto expuesto `NovaprintSales`.

---

## 2. Lógica de Componentes de Interfaz (`assets/js/ui.js`)
1. **Función Generadora de Opciones de Talla:**
   - Crear la función pura `generarOpcionesTalla(tallaActual = 'L')`.
   - Genera dinámicamente los `<optgroup label="...">` correspondientes a "Niños" y "Adultos / Estándar".
   - Marca con `selected` la talla que coincida con `tallaActual`.
   - Si la talla guardada no coincide con ninguna predeterminada (por ejemplo una talla especial ingresada manualmente en el pasado), la añade al inicio para evitar pérdida de datos.
2. **Actualización de la Tabla de Ítems en `#dialog-order`:**
   - En la generación de la fila de prendas en `renderizarTablaItemsPedido`:
     - Reemplazar el bloque fijo de `<option>` por `${generarOpcionesTalla(it.size)}`.
     - Ajustar la clase de ancho del select a `w-20` para acomodar holgadamente etiquetas numéricas y de texto.
3. **Exportación en `NovaprintUI`:**
   - Exponer `generarOpcionesTalla` en `NovaprintUI` para pruebas y modularidad.

---

## 3. Sugerencia en Inventario (`index.html`)
- Añadir un elemento `<datalist id="inventory-size-datalist">` en `index.html` con las opciones de tallas infantiles y adultas, vinculándolo mediante `list="inventory-size-datalist"` al input `#inventory-size-input`.
- Esto mantiene el campo de inventario flexible para medidas en cm o metros (rollos DTF) y al mismo tiempo sugiere con un clic las tallas exactas 4 a 18 y XS a XXL.

---

## 4. Pruebas Automatizadas (`tests/sales.test.js`)
- Probar que `TALLAS_TEXTILES` y `TALLAS_GRUPOS` contienen todas las tallas infantiles solicitadas (4, 6, 8, 10, 12, 14, 16, 18).
- Probar que `calcularPrecioSugeridoPrenda` calcula la tarifa estándar para tallas de niños sin recargo especial.
- Probar que `generarCotizacionEstructurada` desglosa prendas en tallas infantiles correctamente.
- Probar el cruce de disponibilidad en `production.test.js` para una prenda infantil (ej: Polera Talla 10).

