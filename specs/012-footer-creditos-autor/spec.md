# Spec 012 — Pie de Página (Footer) con Créditos de Autoría y Contacto

## 1. Qué y Por Qué
La aplicación web Novaprint carecía de un pie de página (`footer`) semántico y visible que identificara la autoría del sistema, fecha de versión y canales directos de soporte/contacto. Se solicita incorporar un pie de página corporativo sobrio al final de la interfaz con los créditos de análisis, diseño, ubicación, fecha dinámica (mes y año actual) y accesos directos de contacto telefónico y WhatsApp.

## 2. Historias de Usuario
- **Como usuario u operador de la aplicación**, quiero ver al final de la pantalla un pie de página con información de autoría, versión (AA.MM / Mes y Año actual) y enlaces directos a contacto telefónico y WhatsApp, para contar con respaldo técnico y contacto inmediato.
- **Como autor del software**, quiero que el pie de página refleje claramente el análisis/diseño realizado, mantenga el formato requerido y se adapte fluidamente a los modos Claro y Oscuro sin afectar la impresión ni la operatividad de los módulos.

## 3. Requisitos Funcionales (EARS)
- **Ubiquitous (Contenido del Footer):** La aplicación deberá mostrar en la base de la pantalla el texto:
  `"Análisis/Diseño de Andres Aguiar V AA.MM Santiago de Chile (Mes y Año Actual) - Contacto +56933395447 - Whatsapp +56933395447"`, donde `AA.MM` corresponda al año de dos dígitos y mes de dos dígitos (ej. `26.11`), y `(Mes y Año Actual)` al nombre completo del mes y año (ej. `(Noviembre 2026)`).
- **Ubiquitous (Interactividad):** Los números de teléfono y WhatsApp deberán ser hipervínculos funcionales (`tel:+56933395447` y `https://wa.me/56933395447`).
- **State-Driven (Valor Fijo de Generación):** El pie de página se genera con valores fijos inmutables (`BUILD_VERSION`: `2611.04` y `Noviembre 2026`) correspondientes al momento exacto de generación/modificación de la app, sin recalcularse dinámicamente con la fecha futura del cliente.
- **State-Driven (Modo Oscuro / Claro):** El pie de página deberá sincronizarse armónicamente con los tokens de modo claro y modo oscuro (`html.dark`) usando Tailwind y estilos CSS.
- **State-Driven (Impresión):** El pie de página deberá tener la clase `.no-print` y estar excluido en `@media print` para no interferir en la impresión de tickets de venta ni órdenes de taller.

## 4. Criterios de Aceptación
1. El elemento `<footer>` se ubica al final del cuerpo del documento (`min-h-screen flex flex-col` con `mt-auto`).
2. Contiene el texto exacto solicitado con `AA.MM` y `(Mes y Año Actual)` dinámicos.
3. Los enlaces a llamada y WhatsApp funcionan correctamente.
4. El footer luce integrado en modo claro y en modo oscuro.
5. No aparece en la impresión física de tickets (`@media print`).
6. La suite completa de pruebas unitarias pasa al 100% en verde sin alterar la funcionalidad existente.

