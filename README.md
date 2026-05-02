# 🚀 M3Flow
> **The High-Performance, Local-First Knowledge Vault**

M3Flow es una plataforma de escritura de alto rendimiento diseñada para la claridad mental y el flujo creativo constante. A diferencia de otros editores, M3Flow vive en tu máquina, vuela con SQLite y se adapta a tu estilo visual mediante un motor de temas reactivo de última generación.

---

## 🔥 Novedades de esta Versión (Update 0.1.8)

- **☁️ Cloud Sync & Backup:** Integración completa con GitHub a través de la API de Trees para respaldos atómicos y asíncronos. Permite respaldar la base de datos completa de SQLite o exportar notas como archivos Markdown legibles automáticamente en repositorios privados.
- **🛡️ Fallback de Base de Datos (Modo Supervivencia):** Se implementó un robusto sistema de fallback. Si la carpeta principal de datos de la aplicación falla o está bloqueada por OneDrive, M3Flow intentará usar una carpeta local o habilitará el "Modo RAM/Navegador" para garantizar la continuidad.
- **✨ UI del Dashboard de Sincronización:** El botón de sincronización fue rediseñado y movido al pie del Sidebar, incluyendo una barra de progreso inteligente y reportes precisos en tiempo real sobre el estado de la conexión a GitHub y subida de archivos.
- **🎨 Z-Index & Theme Fixes:** Se han resuelto problemas complejos de superposición (Stacking Contexts) para los modales globales y se asegura que todos los elementos hereden impecablemente los estilos de los temas personalizados (incluyendo el color de la fuente).
- **💬 AI Chat Panel & Vault Integration:** El flujo de IA ha sido rediseñado como un chat lateral persistente. Al usar `@vault`, la IA busca en toda la base de SQLite local.
- **📝 Editor Rich Text (WYSIWYG):** Alterna en caliente entre RAW (CodeMirror) y RICH (BlockNote).
- **🎨 Temas VS Code Edition:** Más de 20 temas dinámicos que se aplican consistentemente a lo largo de la app.

---

## ✨ Características Principales

| Característica | Detalle |
| :--- | :--- |
| **Local-First Architecture** | Privacidad total. SQLite local con rendimiento de grado empresarial. |
| **Inteligencia Artificial & Vault** | Panel de chat lateral con comandos como `@vault` para que la IA (OpenAI, Ollama, Claude, Gemini) extraiga contexto semántico de tus propias notas locales. |
| **Dual Editor Mode** | Intercambia con un solo click entre un Editor WYSIWYG de texto enriquecido (BlockNote) y un Editor RAW (CodeMirror). |
| **Modos Neovim / Emacs** | Soporte profundo de atajos y navegación para power-users de terminal dentro del editor RAW. |
| **Temas Dinámicos & VS Code** | Soporte de +20 temas (oscuros y claros) ultra-populares y un modo **Custom** para definir tu propia paleta. |
| **Mermaid & Markdown** | Soporte nativo para diagramas de flujo, diagramas de secuencia y resaltado de sintaxis `hljs`. |
| **Exportación PRO** | Genera archivos `.md` limpios o documentos `.pdf` profesionales con un clic. |

---

## 🛠️ Arquitectura y Stack Tecnológico

M3Flow está construido bajo la filosofía *Local-First*, asegurando que el software sea increíblemente rápido, privado y tolerante a fallos. Seleccionamos cuidadosamente cada pieza para maximizar el rendimiento:

### 🧠 Core y Base de Datos
- **Framework & Interfaz:** `React 19` + `Vite` + `Tailwind CSS 4`. Proporcionan una experiencia fluida, sin bloqueos de renderizado y con una interfaz ultra-personalizable.
- **Persistencia (Backend):** `Better-SQLite3`. Funciona como el corazón del sistema. Al usar SQLite localmente, logramos búsquedas y filtrados instantáneos sobre miles de notas. Incluye un robusto **"Modo Supervivencia"** capaz de redirigir la base de datos a entornos seguros en caso de bloqueos por el sistema operativo o OneDrive.

### 📝 Motores de Edición Dual
Para cubrir todos los espectros de escritura, M3Flow implementa un enfoque de **Dual Engine**:
- **Editor RAW (`CodeMirror 6`):** Pensado para los "power users" y programadores. Permite una interacción cruda con el texto, ofreciendo atajos de terminal (nativos VIM / Emacs), y un control absoluto sobre la sintaxis Markdown pura y bloques de código.
- **Editor RICH (`BlockNote`):** Pensado para el flujo creativo visual. Un editor WYSIWYG basado en bloques que te libera de la sintaxis, permitiéndote estructurar pensamientos rápidamente con formato enriquecido (drag & drop, menús slash), ideal para quienes prefieren la experiencia tipo Notion.

### ☁️ Sincronización en la Nube
- **GitHub Trees API Integration:** M3Flow rechaza la dependencia de servidores propietarios opacos. Utiliza llamadas atómicas a la API de GitHub para inyectar respaldos directamente a repositorios privados en formato SQLite o como archivos `.md` planos legibles en cualquier celular. Se integra de manera asíncrona ("auto-sync"), cuidando el rendimiento del hilo principal.

### 🎨 UI/UX y Orquestación
- El estado de la aplicación es orquestado por `Zustand` (minimalista y asíncrono), con iconografía de `Lucide React`. Todo envuelto en un **Motor de Temas Dinámicos** capaz de aplicar más de 20 paletas de colores populares (VS Code style) sin degradar el rendimiento visual.

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
# Servidor de desarrollo con Hot Module Replacement (HMR)
npm run dev
```

### 3. Build & Packaging
```bash
# Generar el instalable optimizado para Windows
npm run build
```

---

## ⌨️ Comandos Clave

- `Ctrl + P`: Abrir buscador global de notas.
- `Ctrl + N`: Crear nueva nota.
- `Ctrl + B`: Mostrar / Ocultar panel lateral (Sidebar).
- `B / I / S / </> / A`: Atajos visuales de formato en el toolbar del editor.

---

## 🤖 Guía Práctica de Inteligencia Artificial

M3Flow te ofrece total libertad para dictar qué debe hacer la IA con tu documento. Solo presiona el botón "Sparkles" (Magia) y dale una orden. 

### Configuración (API Keys)
Ingresa a las configuraciones dentro del **AI Chat Panel**. Podrás elegir el proveedor deseado y guardar tus credenciales de forma encriptada:
- Para modelos locales (*Ollama*, *LM Studio*) solo necesitas especificar la URL local (`http://localhost:11434`).
- Para IA embebida en navegador (*WebLLM*), M3Flow descargará un modelo ligero a tu caché.
- Para servicios en la nube (*OpenAI*, *Claude*, *Gemini*), la clave ingresada vivirá únicamente en tu máquina.

### Ejemplos Ingeniosos de Prompts

> *"Pule este código y agrega comentarios explicativos al estilo JSDoc."*

> *"Soy disléxico. Por favor corrige todos los posibles errores ortográficos, pero no cambies ni mi tono ni mis expresiones."*

> *"Resume estas notas de la reunión en 3 viñetas principales y crea una lista de tareas (TODO) con los responsables mencionados."*

> *"Toma este documento crudo y transórmalo en un Soneto Shakesperiano."*

> *"Actúa como un CTO severo. 'Roastea' mis decisiones de diseño técnico en esta nota y dime dónde mi lógica es débil."*

---

## ⌨️ Atajos de Teclado y Comandos

M3Flow utiliza **CodeMirror 6**, lo que permite una edición fluida con los siguientes comandos estándar:

### Edición e Historial
- `Ctrl + Z` / `Cmd + Z`: Deshacer.
- `Ctrl + Y` / `Cmd + Shift + Z`: Rehacer.
- `Alt + ↑ / ↓`: Mover línea actual hacia arriba o abajo.
- `Shift + Alt + ↑ / ↓`: Duplicar línea o bloque.
- `Ctrl + Shift + K`: Eliminar línea actual.

### Navegación y Selección
- `Ctrl + A`: Seleccionar todo el documento.
- `Ctrl + D`: Selección múltiple (selecciona la siguiente ocurrencia).
- `Alt + ← / →`: Mover cursor por palabras.
- `Ctrl + /`: Comentar o des-comentar línea.

### Búsqueda
- `Ctrl + F`: Buscar dentro de la nota actual.
- `Ctrl + H`: Buscar y reemplazar.
- `F3`: Saltar al siguiente resultado de búsqueda.

> [!IMPORTANT]
> Si tienes activado el **Modo VIM** o **Emacs**, estos comandos cambiarán para seguir los estándares de navegación de dichos editores.

---

## 👤 Créditos y Visión

Diseñado y desarrollado por **Mariano**.
*M3Flow nació de la necesidad de una herramienta que no solo guarde texto, sino que facilite el pensamiento estructurado sin distracciones externas ni latencia de red.*

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia **MIT**.

---
