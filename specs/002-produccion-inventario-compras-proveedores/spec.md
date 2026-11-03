# Spec 002 — Módulo de Producción: Compras de Insumos, Inventarios y Proveedores
Estado: implementada

## Contexto y objetivo
Novaprint requiere aprovisionar y controlar el stock de prendas lisas en blanco (Poleras, Polerones, Buzos, Gorras) y de insumos gráficos (láminas DTF, poliamida, tintas de serigrafía, vinilos textiles e hilos para bordado) provistos por distintos distribuidores mayoristas.

El objetivo de esta especificación es dotar a Novaprint de:
1. **Control de Proveedores:** Registro y administración de distribuidores con datos de contacto, categoría de insumos provistos y condiciones de compra.
2. **Control de Inventarios:** Catálogo de existencias de prendas base (clasificadas por tipo, color y talla) y de materiales de estampado, con cálculo de stock actual, stock mínimo y alertas automáticas de reposición.
3. **Control de Compras de Insumos:** Registro de compras realizadas a proveedores, sumando automáticamente las cantidades compradas al stock del inventario y registrando el costo de adquisición.

---

## Usuarios
- **Encargado de Compras / Taller:** Registra proveedores, ingresa compras y supervisa el inventario disponible para no detener la producción.

---

## Historias de usuario
- **HU-1:** Como encargado de compras, quiero registrar proveedores con sus teléfonos y categorías para cotizar y contactar rápidamente ante escasez de materiales.
- **HU-2:** Como encargado de taller, quiero ver el inventario de prendas base y materiales con indicadores visuales de stock bajo para saber cuándo comprar.
- **HU-3:** Como encargado de compras, quiero registrar una orden de compra detallando ítems, cantidades y costo total para que el stock de inventario se incremente de forma automática y transparente.

---

## Requisitos funcionales (EARS)
- **RF-1.1:** CUANDO el usuario registre o modifique un proveedor, EL SISTEMA almacenará nombre, contacto, teléfono/WhatsApp, correo y categoría de suministros.
- **RF-2.1:** CUANDO se registre una compra de insumos asociada a un proveedor, EL SISTEMA actualizará automáticamente el stock actual de cada ítem en el inventario sumando las unidades compradas.
- **RF-2.2:** SI el stock actual de un ítem es menor o igual a su stock mínimo configurado, ENTONCES EL SISTEMA mostrará un badge de alerta roja ("Stock Crítico / Reponer").
- **RF-3.1:** CUANDO el usuario filtre el inventario por categoría (Prendas lisas, Tintas/Insumos DTF, Vinilos, Gorras), EL SISTEMA mostrará las existencias correspondientes con su costo unitario promedio y valor total de inventario.

---

## Criterios de finalización
- [ ] Catálogo de proveedores con acciones CRUD y botón de contacto por WhatsApp.
- [ ] Vista de inventario de prendas base y materiales con alertas de stock mínimo.
- [ ] Registro de compras de insumos que incrementa automáticamente las existencias.
- [ ] Pruebas unitarias de actualización de stock y validación de compras.

