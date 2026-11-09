# Spec 016 — Eliminación de Opciones "Vaciar Base de Datos" y "Cargar datos de Prueba" en Ajustes y Respaldos

Estado: implementada

## 1. Contexto y Objetivo
En el modal de configuración de la aplicación (**Ajustes de Novaprint & Respaldo** — `#dialog-settings`), existía una sección denominada "Gestión de Registros" con dos botones de acción:
1. `🗑️ Vaciar Base de Datos` (`#btn-clear-database`): Eliminaba de forma irreversible todos los pedidos, clientes, inventario, proveedores y compras.
2. `📦 Cargar Datos de Prueba` (`#btn-load-demo-data`): Sobrescribía o inyectaba registros de demostración en el sistema.

Dado que **Novaprint App** se encuentra operando en entorno productivo con datos reales de la empresa, la presencia de estos botones representa un riesgo operativo crítico de pérdida accidental de datos o alteración de inventarios y saldos contables reales.

El objetivo de esta especificación es **eliminar de forma definitiva las opciones "Vaciar Base de Datos" y "Cargar datos de Prueba" del modal de Ajustes y Respaldos**, conservando de manera íntegra todas las demás funciones de configuración empresarial, tema (claro, oscuro, sistema) y copias de seguridad (Descargar Respaldo JSON y Restaurar Respaldo JSON).

## 2. Usuarios y Roles
- **Administrador / Operador de Novaprint:** Debe poder configurar los datos de su empresa y gestionar respaldos JSON sin el riesgo de presionar por error botones destructivos o de inyección de datos de muestra.

## 3. Historias de Usuario
- **HU-1**: Como operador, al abrir el modal "Ajustes de Novaprint & Respaldo", no debo ver ningún botón ni sección para vaciar la base de datos ni para cargar datos de prueba.
- **HU-2**: Como operador, debo continuar teniendo acceso sin alteraciones a la configuración del taller (Nombre, RUT, Teléfono/WhatsApp, Dirección, Pie de ticket y Selector de Tema) y a las herramientas de exportación e importación de respaldos en archivo JSON.
- **HU-3**: Como desarrollador, el código de inicialización en `main.js` no debe fallar ni registrar excepciones por la ausencia de los elementos `#btn-clear-database` y `#btn-load-demo-data`.

## 4. Requisitos Funcionales
- **RF-1 (Limpieza de UI en `index.html`):** Retirar del modal `#dialog-settings` el bloque HTML correspondiente a "Gestión de Registros" y los botones `#btn-clear-database` y `#btn-load-demo-data`.
- **RF-2 (Depuración en `main.js`):** Eliminar los escuchadores de eventos asociados a `#btn-clear-database` y `#btn-load-demo-data`, asegurando que `initEventosConfiguracion` se ejecute limpiamente.
- **RF-3 (Preservación de Capacidades):**
  - Mantener intactas las opciones de respaldo (`#btn-export-backup` y `#file-import-backup`).
  - Mantener intacto el formulario `#form-settings` y la persistencia de tema en `localStorage`.
  - Mantener los métodos de `storage.js` (`clearAllData`, `initDemoData`) como APIs programáticas para uso en pruebas automatizadas y comandos de desarrollo en consola, sin exposición accidental en la interfaz de usuario.
- **RF-4 (Pruebas Automatizadas):** Crear pruebas unitarias que verifiquen la no existencia de estos botones en la plantilla de ajustes y el correcto funcionamiento del modal y respaldos.

## 5. Criterios de Aceptación
1. El modal `#dialog-settings` no contiene los botones `#btn-clear-database` ni `#btn-load-demo-data`.
2. Las opciones de descarga e importación de respaldo JSON funcionan con normalidad.
3. El formulario de configuración empresarial y selector de tema continúan funcionando y persistiendo datos correctamente.
4. 100% de las pruebas unitarias pasan sin errores.
