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
  M3Flow es una plataforma de escritura de alto rendimiento diseñada para la claridad mental y el flujo creativo constante. A diferencia de otros editores, M3Flow vive en tu máquina, vuela con SQLite y se adapta a tu estilo visual mediante un motor de temas reactivo de última generación.
</p>

---

<details>
  <summary><b>Table of Contents</b> (Click to expand)</summary>
  
- [🔥 Novedades (Update 0.1.9)](#-novedades-de-esta-versión-update-019)
- [✨ Características Principales](#-características-principales)
- [🛡️ Arquitectura y Fallbacks](#-arquitectura-resiliente-y-fallbacks)
- [📝 Motores de Edición](#-motores-de-edición-dual)
- [🚀 Guía de Inicio](#-guía-rápida-para-desarrolladores)
- [⌨️ Comandos Clave](#-comandos-clave)
- [🤖 Inteligencia Artificial](#-guía-práctica-de-inteligencia-artificial)
- [👤 Créditos](#-créditos-y-visión)
</details>

---

## 🔥 Novedades de esta Versión (Update 0.1.9)

- **🔍 Full-Text Search (FTS5):** Búsqueda ultra-rápida en toda la base de conocimientos. Ahora `Ctrl+P` busca dentro del contenido de todas tus notas con fragmentos resaltados.
- **🔗 Bidirectional Backlinks:** Sistema automático de detección de enlaces `[[Nota]]`. M3Flow rastrea qué notas mencionan a la actual, permitiendo una navegación orgánica.
- **🚀 Mejoras en Command Palette:** Interfaz optimizada con previsualización de fragmentos (snippets) y resaltado visual.
- **🛠️ Refactor de Base de Datos:** Optimización de esquemas para soportar grafos de conocimiento y futura visualización espacial.
- **☁️ Cloud Sync & Backup:** Integración con GitHub Trees API para respaldos atómicos en repositorios privados.

---

## ✨ Características Principales

| Característica | Detalle |
| :--- | :--- |
| **🏠 Local-First** | Privacidad total. SQLite local con rendimiento de grado empresarial. |
| **🤖 IA & Vault** | Chat lateral con comandos `@vault` para extraer contexto semántico de tus notas locales. |
| **🔄 Dual Mode** | Intercambia entre un Editor WYSIWYG (BlockNote) y un Editor RAW (CodeMirror). |
| **⌨️ Power Users** | Soporte profundo de modos **VIM** y **Emacs** en el editor RAW. |
| **🎨 Personalización** | Más de 20 temas dinámicos (VS Code Style) y modo **Custom**. |
| **📊 Diagramas** | Soporte nativo para `Mermaid`, resaltado `hljs` y renders de Markdown. |

---

## 🛠️ Arquitectura y Stack Tecnológico

M3Flow está construido bajo la filosofía *Local-First*, asegurando que el software sea increíblemente rápido, privado y tolerante a fallos.

### 🧠 Core y Base de Datos
- **Framework & Interfaz:** `React 19` + `Vite` + `Tailwind CSS 4`.
- **Persistencia (Backend):** `Better-SQLite3`. El corazón del sistema para búsquedas instantáneas sobre miles de notas.

### 🛡️ Arquitectura Resiliente y Fallbacks
M3Flow está diseñado para ser virtualmente indestructible en cuanto a integridad de datos:
- **Modo Supervivencia:** Si la carpeta `userData` es inaccesible, la app redirige automáticamente la persistencia a una ubicación local segura.
- **Integridad Atómica (WAL Mode):** SQLite configurado con **Write-Ahead Logging** para prevenir corrupción de datos ante fallos.
- **Sync Tolerante a Fallos:** El motor de backup opera de forma asíncrona y aislada del hilo principal.

### 📝 Motores de Edición Dual
- **Editor RAW (`CodeMirror 6`):** Control absoluto, sintaxis Markdown pura y atajos de terminal.
- **Editor RICH (`BlockNote`):** Experiencia WYSIWYG basada en bloques, ideal para estructuración visual rápida.

---

## 🚀 Guía Rápida para Desarrolladores

### 1. Preparar el entorno
```bash
# Instalar dependencias
npm install

# Configurar binarios nativos de Electron
npm run postinstall
```

### 2. Lanzar en Desarrollo
```bash
npm run dev
```

### 3. Build & Packaging
```bash
npm run build
```

---

## ⌨️ Comandos Clave

- `Ctrl + P`: Abrir buscador global de notas.
- `Ctrl + N`: Crear nueva nota.
- `Ctrl + B`: Mostrar / Ocultar Sidebar.
- `Ctrl + F`: Buscar dentro de la nota actual.

---

## 🤖 Guía Práctica de Inteligencia Artificial

M3Flow te ofrece total libertad para dictar qué debe hacer la IA con tu documento. Presiona el botón "Sparkles" y dale una orden.

- **Vault Context**: Usa `@vault` en el chat para que la IA consulte toda tu base de notas.
- **Proveedores**: Soporte para OpenAI, Anthropic, Gemini, Ollama y WebLLM (local en browser).

---

## 👤 Créditos y Visión

Diseñado y desarrollado por **Mariano**.
*M3Flow nació de la necesidad de una herramienta que no solo guarde texto, sino que facilite el pensamiento estructurado sin distracciones externas ni latencia de red.*

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia **MIT**.
