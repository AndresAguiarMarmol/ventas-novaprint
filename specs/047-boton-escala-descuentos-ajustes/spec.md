# Especificación Técnica — Spec 047: Botón para Modificar Escala de Descuentos en Ajustes

## 1. Contexto y Propósito
Actualmente, la escala de descuentos por volumen (1 a 5 prendas: 0%, 6 a 11: 5%, 12 a 24: 10%, 25 a 49: 15%, 50+: 20%) está definida de manera fija en el sistema y se consulta mediante `#dialog-volume-discounts` desde la barra de pedidos y el modal de pedidos.
En el modal de **Ajustes de Novaprint & Respaldo** (`#dialog-settings`), el usuario necesita disponer de un acceso visible y directo mediante un botón dedicado para la **Escala de Descuentos**.
El requerimiento específico solicita:
- Crear únicamente el botón en la interfaz de Ajustes.
- No alterar ni modificar la estructura de datos existente ni la lógica de cálculo actual.
- Mantener intactas las 336 pruebas unitarias existentes y preparar la base para la futura edición parametrizable de tramos.

---

## 2. Historias de Usuario

### HU-01: Acceso a la Escala de Descuentos desde Ajustes
**Como** administrador o encargado de ventas del taller,  
**Quiero** ver un botón para la "Escala de Descuentos" dentro del modal de Ajustes de Novaprint,  
**Para** tener centralizado el acceso a la configuración de descuentos comerciales del negocio sin alterar los datos operativos actuales.

---

## 3. Requisitos Funcionales (Formato EARS)

### Ubiquitous (Siempre activo)
- **RF-01:** En `index.html`, dentro del modal `#dialog-settings`, DEBE incorporarse un botón interactivo identificado como `#btn-settings-volume-discounts` (o `#btn-settings-edit-discounts`).
- **RF-02:** El botón DEBE ubicarse en una sección visualmente diferenciada y coherente (ej. "Políticas Comerciales & Descuentos").
- **RF-03:** El botón DEBE presentar una etiqueta clara con icono: `🏷️ Modificar Escala de Descuentos` (o `🏷️ Escala de Descuentos`).
- **RF-04:** Al hacer clic en el botón, el sistema DEBE abrir el modal oficial existente `#dialog-volume-discounts` (o disparar la acción controlada en `ui.js`) sin modificar ningún registro en `localStorage` ni en la configuración.
- **RF-05:** Ninguna función de cálculo financiero (`sales.js`), tarifas o persistencia DEBE ser alterada.

---

## 4. Reglas de Negocio
- **RN-01 (Inmutabilidad de Datos y Lógica):** La creación de este botón no modifica la escala de descuentos actual ni los datos guardados en `novaprint_settings`.
- **RN-02 (Compatibilidad de Interfaz):** El botón debe respetar el tema Claro/Oscuro y las clases de Tailwind CSS del modal de ajustes.

---

## 5. Criterios de Aceptación
1. El modal `#dialog-settings` en `index.html` contiene el botón `#btn-settings-volume-discounts`.
2. Al pulsar el botón desde Ajustes, se abre el modal `#dialog-volume-discounts` para visualizar los tramos de descuento vigentes.
3. No se produce ninguna mutación de datos en `novaprint_settings` ni en pedidos.
4. El 100% de las pruebas automatizadas del proyecto (37+ suites, 336+ pruebas) pasan con éxito sin regresiones.
