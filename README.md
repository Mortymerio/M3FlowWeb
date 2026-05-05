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
  
- [🔥 Novedades (Update 0.1.10)](#-novedades-de-esta-versión-update-0110)
- [✨ Características Principales](#-características-principales)
- [🛡️ Arquitectura y Fallbacks](#-arquitectura-resiliente-y-fallbacks)
- [📝 Motores de Edición](#-motores-de-edición-dual)
- [🚀 Guía de Inicio](#-guía-rápida-para-desarrolladores)
- [⌨️ Comandos Clave](#-comandos-clave)
- [🤖 Inteligencia Artificial](#-guía-práctica-de-inteligencia-artificial)
- [👤 Créditos](#-créditos-y-visión)
</details>

---

## 🔥 Novedades de esta Versión (Update 0.1.10)

- **📂 Dynamic Contexts & Portability:** Nueva arquitectura de libretas basada en `notebooks.json` y metadatos YAML. Tu base de conocimientos ahora es 100% portable y reconstruible solo desde GitHub.
- **🛠️ Hardened Sync Engine:** Sincronización por ID único en lugar de títulos. Adiós a las notas duplicadas y conflictos de nombres.
- **🔍 Notebook Dashboards:** Cada libreta tiene ahora su propio panel de contexto con prompts personalizados, notas rápidas y visualización de progreso.
- **🎨 Universal Font Scaling:** El control "Aa" ahora es global. Afecta al editor RAW (CodeMirror), al editor RICH (BlockNote) y a la previsualización Markdown simultáneamente.
- **🚀 Instant-On Architecture:** Eliminación de pantallas de bienvenida obligatorias. La app se auto-inicializa y está lista para escribir en milisegundos.
- **✏️ UX Refined:** Edición de nombres de carpetas en línea, creación instantánea de notebooks y mejor visibilidad de controles en el Sidebar.

---

## ✨ Características Principales

| Característica | Detalle |
| :--- | :--- |
| **🏠 Local-First** | Privacidad total. SQLite local con rendimiento de grado empresarial. |
| **🔄 Contextos Dinámicos** | Organiza tu cerebro en Notebooks con configuraciones de IA y vistas personalizadas. |
| **🤖 IA & Vault** | Chat lateral con comandos `@vault` para extraer contexto semántico de tus notas locales. |
| **🔄 Dual Mode** | Intercambia entre un Editor WYSIWYG (BlockNote) y un Editor RAW (CodeMirror). |
| **⌨️ Power Users** | Soporte profundo de modos **VIM** y **Emacs** en el editor RAW. |
| **🎨 Personalización** | Más de 20 temas dinámicos (VS Code Style) y escalado de fuente universal. |

---

## 🛠️ Arquitectura y Stack Tecnológico

M3Flow está construido bajo la filosofía *Local-First*, asegurando que el software sea increíblemente rápido, privado y tolerante a fallos.

### 🧠 Core y Base de Datos
- **Framework & Interfaz:** `React 19` + `Vite` + `Tailwind CSS 4`.
- **Persistencia (Backend):** `Better-SQLite3`. El corazón del sistema para búsquedas instantáneas sobre miles de notas.
- **Sincronización:** GitHub Trees API con inyección de metadatos YAML (id, title, notebookId, status).

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

- `Ctrl + P`: Abrir buscador global de notas (FTS5).
- `Ctrl + N`: Crear nueva nota.
- `Ctrl + B`: Mostrar / Ocultar Sidebar.
- `Ctrl + F`: Buscar dentro de la nota actual.

---

## 🤖 Inteligencia Artificial: Tu Cerebro Digital Potenciado

M3Flow integra la IA no como un simple plugin, sino como una extensión profunda de tu propia base de conocimientos. Nuestra arquitectura está diseñada para maximizar la utilidad de los LLMs sin comprometer tu privacidad.

### 🧠 El Logro: @vault (Local Mini-RAG)
La característica más potente de M3Flow es el comando **`@vault`**. Hemos implementado un sistema **RAG (Retrieval-Augmented Generation)** ligero y ultra-eficiente que vive dentro de la aplicación:

- **Búsqueda Semántica Local**: M3Flow utiliza el motor SQLite FTS5 para realizar una recuperación de información instantánea en toda tu bóveda de notas.
- **Inyección de Contexto**: Al invocar `@vault` en el chat, el sistema identifica y recupera los fragmentos de conocimiento más relevantes para tu pregunta y los inyecta automáticamente en el contexto del modelo.
- **Privacidad Absoluta**: A diferencia de las soluciones basadas en la nube, el proceso de búsqueda y filtrado de contexto ocurre íntegramente en tu máquina. La IA responde basándose específicamente en *tus* datos, *tus* proyectos y *tu* estilo de pensamiento.

---

## 👤 Créditos y Visión

Diseñado y desarrollado por **Mariano**.
*M3Flow nació de la necesidad de una herramienta que no solo guarde texto, sino que facilite el pensamiento estructurado sin distracciones externas ni latencia de red.*

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia **MIT**.
