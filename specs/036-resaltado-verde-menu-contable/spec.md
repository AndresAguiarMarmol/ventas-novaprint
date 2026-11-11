# Spec 036 — Resaltado con Recuadro Verde del Menú Horizontal de Contabilidad

## 1. Contexto y Problema
En la vista de Contabilidad (`#view-accounting`), la barra de sub-navegación horizontal permite alternar entre las 4 sub-vistas contables:
1. `🏛️ Balance General` (`#btn-acc-sub-balance`)
2. `📈 Estado de Resultados (P&L)` (`#btn-acc-sub-pnl`)
3. `📖 Libro Diario de Movimientos` (`#btn-acc-sub-journal`)
4. `📑 Plan de Cuentas` (`#btn-acc-sub-chart`)

Actualmente, el contenedor de este menú (`index.html:652`) posee un estilo estándar y discreto:
`class="bg-white p-2 rounded-xl border border-gray-200 shadow-xs flex flex-wrap gap-2 items-center"`
lo que dificulta su visibilidad y rápido reconocimiento por parte del usuario entre los paneles contables y métricas.

El usuario solicita explícitamente:
> *"Coordinator , El Menu Horizontal de la contabilidad resaltarlo en un recuadro Verde de manera de hacerlo mas visible. Procesar usando metodologia sdd. No mofificar nada adicional"*

---

## 2. Historias de Usuario
- **HU-01 (Visibilidad del Menú Contable):** Como usuario del taller contable, quiero que el menú horizontal de sub-navegación esté enmarcado en un recuadro verde nítido y distinguido, para ubicar y alternar inmediatamente entre las pestañas contables.
- **HU-02 (Preservación Funcional):** Como operador, requiero que el resaltado sea visual, preservando íntegramente los identificadores (`#btn-acc-sub-*`), eventos onclick y comportamiento de navegación sin alterar nada adicional.

---

## 3. Requisitos del Sistema (Formato EARS)

### Requisitos Ubicuos (En todo momento)
- **EARS-U-01:** El contenedor del menú horizontal de sub-navegación contable DEBERÁ tener un identificador específico `#acc-subnav-container` y estar resaltado con un recuadro verde distintivo:
  - Borde verde visible (`border-2 border-emerald-500` o `border-green-500`).
  - Fondo sutilmente entonado que realce el contenedor (`bg-emerald-50/60` o `bg-green-50/50`) o contraste limpio.
  - Sombra suave verde (`shadow-sm shadow-emerald-100`).
- **EARS-U-02:** Los botones internos (`#btn-acc-sub-balance`, `#btn-acc-sub-pnl`, `#btn-acc-sub-journal`, `#btn-acc-sub-chart`) DEBERÁN mantener sus IDs, clases de estado activo/inactivo y funciones `NovaprintUI.cambiarSubVistaContable(...)`.
- **EARS-U-03:** Ninguna otra sección, botón o lógica del sistema DEBERÁ ser modificada ("No modificar nada adicional").

---

## 4. Criterios de Aceptación
1. El contenedor del menú horizontal en `#view-accounting` muestra un borde verde notorio y resaltado visual.
2. La navegación entre Balance General, P&L, Libro Diario y Plan de Cuentas sigue funcionando al 100%.
3. Todas las suites de pruebas automatizadas existentes pasan al 100%.

