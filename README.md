<p align="center">
  <img src="public/banner.png" alt="M3Flow Banner" width="100%">
</p>

<h1 align="center">🚀 M3Flow</h1>

<p align="center">
  <strong>The High-Performance, Local-First Knowledge Vault</strong>
</p>

<p align="center">
  <a href="https://github.com/Mortymerio/M3Flow/releases">
    <img src="https://img.shields.io/github/v/release/Mortymerio/M3Flow?style=for-the-badge&color=8A2BE2" alt="Version">
  </a>
  <a href="https://github.com/Mortymerio/M3Flow/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Mortymerio/M3Flow?style=for-the-badge&color=blue" alt="License">
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript" alt="TS">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron" alt="Electron">
</p>

<p align="center">
  M3Flow is a high-performance writing platform designed for mental clarity and constant creative flow. Unlike other editors, M3Flow lives on your machine, flies with SQLite, and adapts to your visual style through a next-generation reactive theme engine.
</p>

---

<details>
  <summary><b>Table of Contents</b> (Click to expand)</summary>
  
- [🔥 What's New (Update 0.1.20)](#-whats-new-this-version-update-0120)
- [🔥 What's New (Update 0.1.19)](#-whats-new-in-previous-version-update-0119)
- [🔥 What's New (Update 0.1.18)](#-whats-new-in-previous-version-update-0118)
- [🔥 What's New (Update 0.1.17)](#-whats-new-in-previous-version-update-0117)
- [🔥 What's New (Update 0.1.16)](#-whats-new-in-previous-version-update-0116)
- [🔥 What's New (Update 0.1.15)](#-whats-new-in-previous-version-update-0115)
- [✨ Core Features](#-core-features)
- [🛡️ Architecture and Fallbacks](#-resilient-architecture-and-fallbacks)
- [📝 Editing Engines](#-dual-editing-engines)
- [🚀 Quick Start Guide](#-quick-start-guide-for-developers)
- [⌨️ Key Commands](#-key-commands)
- [🤖 Artificial Intelligence](#-artificial-intelligence-your-powered-digital-brain)
- [👤 Credits](#-credits-and-vision)
</details>

---

## 🔥 What's New this Version (Update 0.1.20)

### 📝 Customizable Templates System & Smart Export
- **Templates Manager:** A powerful new visual interface to manage your system templates. You can now modify the default Daily Standup and Meeting templates, or create an infinite amount of your own custom templates with magic variables like `{{date}}` and `{{time}}`.
- **Smart CSV Export:** Added a new 1-click CSV export option in the status bar. The backend engine intelligently parses Markdown tables and converts them into native CSV grids with proper UTF-8 BOM, automatically preserving the tabular structure perfectly when imported into Excel.

---

## 🔥 What's New in Previous Version (Update 0.1.19)

### 📊 System Telemetry & Writing Metrics
- **Performance Monitor:** Integrated a native lightweight IPC polling mechanism to fetch OS-level system stats. The editor status bar now displays real-time Application RAM usage and System CPU load (e.g., `APP: 45MB | SYS: 21%`). Polling is extremely gentle (5-second intervals via `os` and `process.memoryUsage()`) for zero impact on editor fluidity.
- **Word Count:** Added a real-time word count metric directly into the editor's status bar to complement the existing character count, instantly updating without noticeable performance overhead.

---

## 🔥 What's New in Previous Version (Update 0.1.18)

### 🏗️ Major Editor Refactoring & Architecture
- **Component Decomposition:** The monolithic `Editor.tsx` (1100+ lines) was meticulously refactored into focused modular components (`EditorToolbar.tsx`, `EditorStatusBar.tsx`), massively improving code maintainability and rendering performance.
- **Zero-Flicker State Management:** State is now purely delegated to Zustand, decoupling the AI panel and dropdowns from the main editor lifecycle to guarantee that typing in `CodeMirror` remains buttery smooth.

### ⚡ UX & Workflow Features
- **📅 Quick Daily Notes:** New "Today" button and `Ctrl+D` shortcut that instantly navigates to or creates a Daily Scrum note in the auto-generated "Daily Journal" notebook.
- **👥 Meeting Notes Template:** New "Meeting" button and `Ctrl+M` shortcut that generates fresh meeting minutes with attendees, agenda, and action items matrices on the fly.
- **✨ Enhanced AI Chat Panel:** Fully polished slide-in animations, memory of open/closed states across reloads, robust `z-index` layering, and a dedicated `Ctrl+Shift+A` hotkey for instantaneous AI access.
- **🔄 Granular Sync Progress:** GitHub synchronization now displays real-time, step-by-step progress percentages instead of binary states.



## ✨ Core Features

| Feature | Detail |
| :--- | :--- |
| **🏠 Local-First** | Full privacy. Local SQLite with enterprise-grade performance. |
| **🔄 Dynamic Contexts** | Organize your brain into Notebooks with AI configurations and custom views. |
| **🤖 AI & Vault** | Side chat with `@vault` commands to extract semantic context from your local notes. |
| **🔄 Dual Mode** | Swap between a WYSIWYG Editor (BlockNote) and a RAW Editor (CodeMirror). |
| **⌨️ Power Users** | Deep support for **VIM** and **Emacs** modes in the RAW editor. |
| **🎨 Customization** | 20+ dynamic themes (VS Code Style) and universal font scaling. |

---

## 🛠️ Architecture and Tech Stack

M3Flow is built under the *Local-First* philosophy, ensuring the software is incredibly fast, private, and fault-tolerant.

### 🧠 Core and Database
- **Framework & Interface:** `React 19` + `Vite` + `Tailwind CSS 4`.
- **Persistence (Backend):** `Better-SQLite3`. The heart of the system for instant searches across thousands of notes.
- **Synchronization:** GitHub Trees API with YAML metadata injection (id, title, notebookId, status).

### 🛡️ Resilient Architecture and Fallbacks
M3Flow is designed to be virtually indestructible regarding data integrity:
- **Survival Mode:** If the `userData` folder is inaccessible, the app automatically redirects persistence to a secure local location.
- **Atomic Integrity (WAL Mode):** SQLite configured with **Write-Ahead Logging** to prevent data corruption during failures.
- **Fault-Tolerant Sync:** The backup engine operates asynchronously and isolated from the main thread.

### 📝 Dual Editing Engines
- **RAW Editor (`CodeMirror 6`):** Absolute control, pure Markdown syntax, and terminal shortcuts.
- **RICH Editor (`BlockNote`):** Block-based WYSIWYG experience, ideal for rapid visual structuring.

---

## 🚀 Quick Start Guide for Developers

### 1. Prepare the Environment
```bash
# Install dependencies
npm install

# Configure Electron native binaries
npm run postinstall
```

### 2. Launch in Development
```bash
npm run dev
```

### 3. Build & Packaging
```bash
npm run build
```

---

## ⌨️ Key Commands

- `Ctrl + P`: Open global note search (FTS5).
- `Ctrl + N`: Create new note.
- `Ctrl + B`: Toggle Sidebar.
- `Ctrl + F`: Search within the current note.

---

## 🤖 Artificial Intelligence: Your Powered Digital Brain

M3Flow integrates AI not as a simple plugin, but as a deep extension of your own knowledge base. Our architecture is designed to maximize the utility of LLMs without compromising your privacy.

### 📂 The Achievement: @vault & Dynamic Contexts (Evolved RAG)
M3Flow's most powerful feature is how it combines the **`@vault`** command with **Dynamic Contexts**:

- **Thematic Vaults**: Unlike a generic AI, M3Flow allows defining **Context Prompts** for each Notebook. This means if you are in your "Programming" notebook, the AI already knows it should respond with code and technical documentation, while in "Creative Writing" it will focus on style and narrative.
- **Local Semantic Search (RAG)**: M3Flow uses the SQLite FTS5 engine for instant information retrieval. When invoking `@vault`, the system not only searches through all your notes but prioritizes knowledge from the **active Notebook**, injecting that specialized context into the model.
- **Working Memory**: Each notebook acts as a curated knowledge silo. The AI doesn't just "read" your notes; it "reasons" within the conceptual framework you've defined for that specific project.
- **Absolute Privacy**: All context processing (filtering, ranking, and fragment selection) occurs locally. Your data is never sent for training; it's only used to answer you in the moment.

### 🔌 BYOM (Bring Your Own Model) Philosophy
M3Flow is an agnostic orchestrator that lets you choose the brain you prefer:

- **Cloud Providers**: Connect with **OpenAI (GPT-4o)**, **Anthropic (Claude 3.5)**, **Google Gemini**, or **DeepSeek**.
- **Total Privacy with Ollama**: Run local models and keep your data 100% offline.
- **Embedded Models (WebLLM)**: Leverage your hardware's GPU acceleration to run models directly without external dependencies.

### ✨ Power Examples
> *"@vault Analyze the contradictions between my notes for this project and external references."*

> *"Act according to the context of this notebook (@vault) and draft the introduction for the technical document."*

---

## 👤 Credits and Vision

Designed and developed by **Mariano**.
*M3Flow was born from the need for a tool that doesn't just store text, but facilitates structured thinking without external distractions or network latency.*

---

## 📄 License

This project is open-source under the **MIT** license.
