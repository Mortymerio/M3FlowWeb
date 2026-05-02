# Changelog

All notable changes to this project will be documented in this file.

## [0.1.8] - 2026-05-02

### Added
- **☁️ Cloud Sync & Backup:** Integración completa con GitHub a través de la API de Trees para respaldos atómicos y asíncronos. Permite respaldar la base de datos completa de SQLite o exportar notas como archivos Markdown legibles automáticamente en repositorios privados.
- **🛡️ Fallback de Base de Datos (Modo Supervivencia):** Se implementó un robusto sistema de contingencia. Si la carpeta principal de datos de la aplicación falla o está bloqueada por OneDrive, M3Flow intentará usar una carpeta local o habilitará el "Modo RAM/Navegador" para garantizar la continuidad ininterrumpida.

### Changed
- **✨ UI del Dashboard de Sincronización:** El botón de sincronización fue rediseñado y movido al pie de la barra lateral, incluyendo una barra de progreso inteligente y reportes precisos en tiempo real sobre el estado de la conexión a GitHub y subida de archivos.
- **🌍 Internacionalización Parcial:** Se estandarizó la interfaz de las herramientas laterales al inglés (STATUS, TAGS, FILTERS, y paneles de carga) para apuntar a un mercado más global en esta próxima etapa.

### Fixed
- **🎨 Z-Index & Theme Fixes:** Se han resuelto problemas complejos de superposición (Stacking Contexts) para los modales globales y se asegura que todos los elementos hereden impecablemente los estilos de los temas personalizados (incluyendo mejoras de accesibilidad en el color de la fuente de los menús de configuración).
- **TypeScript & Compilación:** Corrección de tipos estrictos en integraciones de API e importaciones no utilizadas para garantizar compilaciones (`build`) estables y sin errores en Windows y Linux.
