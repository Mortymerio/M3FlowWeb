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
  
- [🔥 What's New (Update 0.1.10)](#-whats-new-this-version-update-0110)
- [✨ Core Features](#-core-features)
- [🛡️ Architecture and Fallbacks](#-resilient-architecture-and-fallbacks)
- [📝 Editing Engines](#-dual-editing-engines)
- [🚀 Quick Start Guide](#-quick-start-guide-for-developers)
- [⌨️ Key Commands](#-key-commands)
- [🤖 Artificial Intelligence](#-artificial-intelligence-your-powered-digital-brain)
- [👤 Credits](#-credits-and-vision)
</details>

---

## 🔥 What's New this Version (Update 0.1.10)

- **📂 Dynamic Contexts & Portability:** New notebook architecture based on `notebooks.json` and YAML metadata. Your knowledge base is now 100% portable and reconstructible solely from GitHub.
- **🛠️ Hardened Sync Engine:** Synchronization via unique ID instead of titles. Say goodbye to duplicate notes and naming conflicts.
- **🔍 Notebook Dashboards:** Each notebook now has its own context panel with custom prompts, quick notes, and progress visualization.
- **🎨 Universal Font Scaling:** The "Aa" control is now global. It affects the RAW editor (CodeMirror), the RICH editor (BlockNote), and the Markdown preview simultaneously.
- **🚀 Instant-On Architecture:** Removal of mandatory splash screens. The app auto-initializes and is ready to write in milliseconds.
- **✏️ UX Refined:** Inline folder name editing, instant notebook creation, and improved control visibility in the Sidebar.

---

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
