# 🚀 M3Flow
> **The High-Performance, Local-First Knowledge Vault**

M3Flow es una plataforma de escritura de alto rendimiento diseñada para la claridad mental y el flujo creativo constante. A diferencia de otros editores, M3Flow vive en tu máquina, vuela con SQLite y se adapta a tu estilo visual mediante un motor de temas reactivo de última generación.

---

## 🔥 Novedades de esta Versión (Update 0.1.7)

- **💬 AI Chat Panel & Vault Integration:** El flujo de IA ha sido rediseñado como un chat lateral persistente. Además, al usar la etiqueta `@vault` en el prompt, la IA es capaz de buscar y leer el contexto de todas las notas locales guardadas en SQLite para dar respuestas informadas sobre tu conocimiento almacenado.
- **📝 Editor Rich Text (WYSIWYG):** Ahora puedes alternar en caliente entre el editor RAW (CodeMirror crudo) y el nuevo entorno RICH (BlockNote). El modo enriquecido facilita una experiencia de escritura visual con formato en bloque sin necesidad de conocer la sintaxis Markdown.
- **🎨 20 Nuevos Temas (VS Code Edition):** Se han incorporado los temas oscuros y claros más famosos del ecosistema (One Dark Pro, Dracula, Night Owl, GitHub Light, SynthWave '84, etc). Todos los elementos UI (paneles, botones, barras) ahora reaccionan si el fondo es claro u oscuro.
- **📊 Status Bar Mejorada:** La barra inferior indica en todo momento el modo de editor activo (RICH o RAW) y persiste el estado de tus paneles entre sesiones.
- **🤖 WebLLM AI Mirror & Claude API:** (0.1.0) La IA "Zero-Cost" incrustada soporta descargas por repositorios Mirror. Además, soporte oficial para Anthropic (Claude-Sonnet 3.5/4).

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

## 🛠️ Stack Tecnológico

- **Core:** `React 19` + `Vite` + `Tailwind CSS 4`.
- **Backend:** `Better-SQLite3` con optimización de persistencia asíncrona.
- **UI/UX:** `Lucide React` + `Framer Motion` (animaciones) + `Zustand` (estado global).
- **Editor:** `CodeMirror 6` con extensiones personalizadas de Markdown y Lenguajes.

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
