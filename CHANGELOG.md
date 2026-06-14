# Changelog

All notable changes to this project will be documented in this file.

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
