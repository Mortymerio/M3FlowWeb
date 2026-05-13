# Changelog

All notable changes to this project will be documented in this file.

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
