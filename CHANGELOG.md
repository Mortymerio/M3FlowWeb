# Changelog

All notable changes to this project will be documented in this file.

## [0.4.0] - 2026-07-02

### Added
- **Tasks Dashboard Enhancements**: New Calendar and Kanban views for tasks with drag-and-drop support.
- **Micro-Indicators**: Note list now displays task progress (e.g., ☑ 2/5) and reminder indicators directly on the cards.
- **Home Dashboard**: Rich empty state for Notebooks featuring Quick Actions, recent notes, stats, and upcoming reminders.
- **Command Palette Theming**: The Command Palette now respects the active theme colors.
- **Inline Tag Creation**: Quickly create and assign new tags with a color picker directly from the editor toolbar.
- **Editor UX**: Enabled line wrapping in the RAW CodeMirror editor for better readability of long paragraphs.

### Changed
- **Sidebar Organization**: Reorganized filters and tags into collapsible sections.
- **Sidebar Footer**: Compacted the sync status footer to reclaim screen real estate for notebooks.
- **Kanban Columns**: Changed to flexible width to evenly fill the screen without horizontal scrolling.

## [0.3.1] - 2026-06-19

### Added
- **Buscador Avanzado**: Nuevo panel flotante minimalista (estilo VS Code) para búsqueda y reemplazo.
- **Soporte Regex y Case**: Búsqueda avanzada con soporte para expresiones regulares y coincidencia de mayúsculas en el editor RAW.
- **Búsqueda Nativa en Modo Rich**: Integración de la API de búsqueda nativa de Electron (Chromium) para una experiencia perfecta en el editor visual.
- **Resaltado Inteligente**: Mejoras de UI con fondos amarillos de alto contraste para localizar coincidencias rápidamente.

### Fixed
- **Flecha Arriba (Búsqueda Inversa)**: Se corrigió la lógica de búsqueda hacia atrás y el salto cíclico de coincidencias.
- **Superposición de Paneles**: Se deshabilitó el panel nativo por defecto de CodeMirror que robaba el foco al usar las teclas de navegación.

## [0.3.0] - 2026-06-14

### Added
- **Tabs System**: Seamlessly navigate between multiple open notes or tasks using the new intuitive TabsBar.
- **Tasks Dashboard**: A dedicated SQLite-backed Kanban/List view to manage actionable tasks effectively.
- **Command Palette (`Ctrl+P`)**: Instantly jump between notes, execute actions, and control the UI via keyboard.
- **Zen Mode (`Ctrl+Shift+Z`)**: Collapse all sidebars instantly to focus completely on writing.
- **Auto-Updater**: Seamless over-the-air updates directly from GitHub Releases using `electron-updater`.

## [0.2.1] - 2026-06-14

### Added
- **Major Editor Refactoring**: Deep component decomposition extracting core logic to `useNoteManager.ts`.
- **Event-Driven AI Ghostwriter**: Custom CodeMirror native extensions for Zero CPU waste context menus.
- **Save Indicator & Ctrl+S**: Visual feedback for note saving.
- **Empty States**: Friendly UI empty states for notes.
- **Smooth Note Transitions**: Crossfade animations when navigating notes.

## [0.2.0] - 2026-05-24

### Added
- **AI Ghostwriter Mode**: In-line AI integration directly into the CodeMirror editor.
- **Context Menu Options**: Right-click to access "Directiva IA", "Desarrollar Selección", and "Continuar Escribiendo".
- **Visual Review Mode**: Copilot-style green highlights with floating Keep/Try Again/Discard buttons.

## [0.1.20] - 2026-05-22

### Added
- **Customizable Templates Manager**: Visual interface to manage and create custom note templates.
- **Smart CSV Export**: 1-click export of Markdown tables to native CSV format.

## [0.1.17] - 2026-05-13

### Added
- **Asistente de Escritura (M3Synthesis)**: New dedicated menu for non-fiction and technical writing.
  - **Socratic Interview**: Challenge your arguments and logic via AI.
  - **Hierarchy Mapping**: Analyze the conceptual flow of your treatise.
  - **Taxonomy & Glossary**: Automatic extraction and definition of technical terms.
  - **Source Synthesis**: Context-aware drafting based on Vault research.
- **Enhanced AI Panel**: Added "Asistente Técnico" category to quick actions.

## [0.1.16] - 2026-05-13

### Fixed
- **Windows 11 Keyboard Input**: Fixed a bug where alphanumeric keys were ignored in inputs and the editor on Windows 11 due to `-webkit-app-region: drag` interference.
- **Invisible Cursor**: Hardened `caret-color` and focus management to ensure the text cursor is always visible.
- **Window Stability**: Disabled `transparent: true` in Electron on Windows to prevent focus "ghosting" and improve OS-level event handling.

### Changed
- Refactored `src/index.css` to include global input hardening rules.
- Updated `electron/main.ts` for better Windows 11 compatibility.

---

## [0.1.15] - 2026-05-10

### Added
- **AI Quick Actions**: New category-based action panel for rapid note transformation.
- **AI Explanations**: The assistant now explains its reasoning when modifying documents.
- **Spanish Localization**: AI interface now fully supports Spanish.
- **Mermaid Preservation**: Hardened system prompts to protect diagrams during AI edits.
