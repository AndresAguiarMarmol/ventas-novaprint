# Especificación Técnica — Spec 048: Edición Interactiva de la Escala de Descuentos por Volumen

## 1. Contexto y Propósito
En la Spec 047 se incorporó en Ajustes el botón `🏷️ Modificar Escala de Descuentos` que abre el modal `#dialog-volume-discounts`. La tabla mostrada era estática y solo informativa.
Con la aprobación de las decisiones (1B, 2A, 3A), se implementará:
- Edición interactiva **tanto de los rangos de unidades (min y max) como de los porcentajes de descuento (%)** de cada tramo.
- Botones de acción en el modal: `[💾 Guardar Escala]`, `[🔄 Restablecer]` y `[Cerrar / Entendido]`.
- Persistencia en `novaprint_settings.volumeDiscountTiers` con valores predeterminados canónicos de respaldo (1-5: 0%, 6-11: 5%, 12-24: 10%, 25-49: 15%, 50+: 20%).
- Cero alteración de datos operativos existentes ni fórmulas financieras base.

---

## 2. Historias de Usuario

### HU-01: Modificación de Rangos y Porcentajes de Descuento
**Como** dueño o administrador del taller,  
**Quiero** editar los rangos de prendas (mínimos y máximos) y los porcentajes de ahorro de cada tramo en la tabla de descuentos,  
**Para** definir libremente la política comercial de promociones por volumen según las necesidades del negocio.

### HU-02: Guardado y Restablecimiento Confiable
**Como** usuario del sistema,  
**Quiero** guardar mis cambios en la configuración y poder volver a los valores predeterminados de fábrica con un solo clic,  
**Para** experimentar con distintas escalas y restaurar los valores canónicos ante cualquier equivocación.

---

## 3. Requisitos Funcionales (Formato EARS)

### Ubiquitous (Siempre activo)
- **RF-01:** En `index.html` (y dinámicamente en `ui.js`), cada fila de tramo en `#dialog-volume-discounts` DEBE incluir campos numéricos editables para las cantidades del rango (`min`, `max`) y para el porcentaje de descuento (`percent` de `0` a `100%`).
- **RF-02:** Los tramos predeterminados canónicos DEBEN ser:
  - Fila 0: 1 a 5 un. -> 0% (Precio regular base)
  - Fila 1: 6 a 11 un. -> 5% (Medio volumen)
  - Fila 2: 12 a 24 un. -> 10% (Docena)
  - Fila 3: 25 a 49 un. -> 15% (Mayorista)
  - Fila 4: 50 un. o más -> 20% (Gran volumen)
- **RF-03:** El modal DEBE incorporar los botones de acción en su pie:
  - `[💾 Guardar Escala]` (`#btn-save-volume-discounts`): Valida y guarda los tramos en `novaprint_settings.volumeDiscountTiers`.
  - `[🔄 Restablecer]` (`#btn-reset-volume-discounts`): Restaura los 5 tramos canónicos predeterminados.
  - `[Cerrar / Entendido]` (`#btn-close-volume-discounts`): Cierra el diálogo modal.
- **RF-04:** La lógica de cálculo en `assets/js/sales.js` (`calcularDescuentoVolumen`) DEBE consultar dinámicamente la escala configurada en `storage.getVolumeDiscountTiers()`. Si no hay personalización o en ausencia de storage, utiliza los tramos predeterminados canónicos.
- **RF-05:** La consulta en vivo en el modal desde el formulario de Nuevo Pedido DEBE seguir resaltando el tramo activo e indicar las prendas faltantes en función de la escala configurada.

---

## 4. Reglas de Negocio
- **RN-01 (Inmutabilidad de Datos Existentes):** Ningún pedido registrado previamente sufrirá recálculos retrospectivos en sus importes guardados.
- **RN-02 (Validación de Rango y Consistencia):** Cada porcentaje debe ser un entero entre `0%` y `100%`. Las cantidades mínimas y máximas deben ser $\ge 1$ con $\text{min} \le \text{max}$.
- **RN-03 (Persistencia Atómica):** La configuración se guarda en `novaprint_settings` y se respalda/restaura normalmente con `exportBackup` e `importBackup`.

---

## 5. Criterios de Aceptación
1. Al abrir `#dialog-volume-discounts`, los campos de rangos y porcentajes se presentan como inputs editables.
2. Al modificar cualquier tramo y pulsar `[💾 Guardar Escala]`, se persiste en `localStorage` y se notifica con toast de confirmación.
3. Al pulsar `[🔄 Restablecer]`, los campos vuelven inmediatamente a los tramos canónicos (1-5: 0%, 6-11: 5%, 12-24: 10%, 25-49: 15%, 50+: 20%).
4. Los cálculos de pedidos nuevos aplican los porcentajes y rangos configurados.
5. El 100% de las suites de prueba unitarias pasan sin fallos ni regresiones.
