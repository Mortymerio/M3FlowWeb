import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import MarkdownIt from 'markdown-it';
import mermaid from 'mermaid';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css'; // Global fallback highlight
import { vim, getCM } from '@replit/codemirror-vim';
import { emacs } from '@replit/codemirror-emacs';
import { languages } from '@codemirror/language-data';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { Columns } from 'lucide-react';
import RichEditor from './RichEditor';
import AiChatPanel from './AiChatPanel';
import NotebookDashboard from './NotebookDashboard';
import EditorToolbar from './EditorToolbar';
import EditorStatusBar from './EditorStatusBar';
import { animate } from 'animejs';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) { }
    }
    return '';
  }
});

mdParser.renderer.rules.fence = (tokens: any[], idx: number, options: any, _env: any, _slf: any) => {
  const token = tokens[idx];
  const code = token.content.trim();
  if (token.info === 'mermaid') {
    const escapedCode = mdParser.utils.escapeHtml(code);
    return `<div class="mermaid" data-mermaid-src="${escapedCode}">${escapedCode}</div>`;
  }
  if (token.info) {
    const highlightedText = options.highlight?.(code, token.info, '') || mdParser.utils.escapeHtml(code);
    return `<pre><code class="hljs language-${token.info}">${highlightedText}</code></pre>`;
  }
  return `<pre><code class="hljs">${mdParser.utils.escapeHtml(code)}</code></pre>`;
};

const MarkdownPreview = React.memo(({ content, className }: { content: string, className: string }) => {
  return (
    <div
      id="preview-area"
      className={className}
      dangerouslySetInnerHTML={{ __html: mdParser.render(content) }}
    />
  );
});

const Editor = () => {
  const activeNoteId = useStore(state => state.activeNoteId);
  const notes = useStore(state => state.notes);
  const notebooks = useStore(state => state.notebooks);
  const saveNote = useStore(state => state.saveNote);
  const editorMode = useStore(state => state.editorMode);

  const isSidebarCollapsed = useStore(state => state.isSidebarCollapsed);
  const isNoteListCollapsed = useStore(state => state.isNoteListCollapsed);
  const toggleSidebar = useStore(state => state.toggleSidebar);
  const toggleNoteList = useStore(state => state.toggleNoteList);
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const isDark = themeStyle.isDark !== false;
  const editorFontSize = useStore(state => state.editorFontSize);
  const editorType = useStore(state => state.editorType);
  const setEditorType = useStore(state => state.setEditorType);
  const loadBacklinks = useStore(state => state.loadBacklinks);
  const currentBacklinks = useStore(state => state.currentBacklinks);
  const setActiveNote = useStore(state => state.setActiveNote);
  const setActiveNotebook = useStore(state => state.setActiveNotebook);

  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [splitRatio, setSplitRatio] = useState(0.5);
  const isResizingSplit = useRef(false);
  const editorRef = useRef<any>(null);
  const lastLoadedNoteId = useRef<string | null>(null);
  const lastRenderedContent = useRef<string>('');
  const lastRenderedViewMode = useRef<string>('');

  // Status bar state
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [totalLines, setTotalLines] = useState(0);
  const [vimMode, setVimMode] = useState('NORMAL');

  // AI Panel State
  const isAiPanelOpen = useStore(state => state.isAiPanelOpen);
  const toggleAiPanel = useStore(state => state.toggleAiPanel);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const triggerAiAnimation = useCallback(() => {
    if (!contentAreaRef.current) return;
    
    // Un efecto de pulso de brillo y una ligera escala para indicar transformación
    animate(contentAreaRef.current, {
      scale: [1, 1.002, 1],
      filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'],
      duration: 800,
      ease: 'easeOutQuart'
    });
  }, []);

  const tags = useStore(state => state.tags);
  const noteTags = useStore(state => state.noteTags);
  const customColors = useStore(state => state.customColors);

  const noteHistory = useStore(state => state.noteHistory);

  const myHistory = activeNoteId ? (noteHistory[activeNoteId] || []) : [];


  // Cursor position tracking extension
  const cursorTracker = useCallback(() => EditorView.updateListener.of((update) => {
    if (update.selectionSet || update.docChanged) {
      const pos = update.state.selection.main.head;
      const line = update.state.doc.lineAt(pos);
      setCursorLine(line.number);
      setCursorCol(pos - line.from + 1);
      setTotalLines(update.state.doc.lines);

      // Track vim mode
      if (editorMode === 'vim') {
        try {
          const cm = getCM(update.view);
          if (cm?.state?.vim) {
            const vs = cm.state.vim;
            if (vs.insertMode) setVimMode('INSERT');
            else if (vs.visualMode) {
              if (vs.visualLine) setVimMode('V-LINE');
              else if (vs.visualBlock) setVimMode('V-BLOCK');
              else setVimMode('VISUAL');
            } else setVimMode('NORMAL');
          }
        } catch { /* getCM may fail during init */ }
      }
    }
  }), [editorMode]);

  // Build extensions: vim/emacs MUST come before markdown for keymap precedence
  const editorExtensions = useMemo(() => {
    const exts: any[] = [];
    if (editorMode === 'vim') exts.push(vim());
    if (editorMode === 'emacs') exts.push(emacs());
    exts.push(markdown({ base: markdownLanguage, codeLanguages: languages }));
    exts.push(cursorTracker());
    return exts;
  }, [editorMode, cursorTracker]);

  useEffect(() => {
    if (activeNoteId) {
      // Solo cargar si cambió el ID o si aún no hemos cargado nada para este ID
      if (activeNoteId !== lastLoadedNoteId.current) {
        const activeNote = notes.find(n => n.id === activeNoteId);
        if (activeNote) {
          setContent(activeNote.body);
          lastLoadedNoteId.current = activeNoteId;
          loadBacklinks(activeNoteId);
        }
      }
    } else {
      setContent('');
      lastLoadedNoteId.current = null;
    }
  }, [activeNoteId, notes, loadBacklinks]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: themeStyle.codeTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'sandbox',
      fontFamily: 'inherit'
    });
  }, [themeStyle.codeTheme]);

  // MERMAID RENDERER: Guardián del DOM (MutationObserver)
  useEffect(() => {
    if (viewMode === 'edit' || editorType !== 'raw') return;

    let timeout: any;

    const renderMermaid = async () => {
      try {
        const previewArea = document.getElementById('preview-area');
        if (!previewArea) return;

        const elements = previewArea.querySelectorAll('.mermaid');

        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          // Si el gráfico ya está dibujado, lo ignoramos para evitar loops
          if (el.querySelector('svg')) continue;

          const src = el.getAttribute('data-mermaid-src');
          if (src) {
            try {
              const uniqueId = `mermaid-${Date.now()}-${i}`;
              const { svg } = await mermaid.render(uniqueId, src);
              el.innerHTML = svg;
              el.setAttribute('data-processed', 'true');
            } catch (err) {
              console.error('Error renderizando diagrama individual:', err);
              el.innerHTML = `<div style="color:red; font-size:12px;">Error en Mermaid: revisa la sintaxis.</div>`;
            }
          }
        }
      } catch (e) {
        console.error('Mermaid error global:', e);
      }
    };

    // Vigilamos si React sobrescribe el DOM con texto plano
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(renderMermaid, 150);
    });

    const previewArea = document.getElementById('preview-area');
    if (previewArea) {
      observer.observe(previewArea, { childList: true, subtree: true, characterData: true });
      // Primera ejecución al montar
      renderMermaid();
    }

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [viewMode, editorType]);

  // Reset Mermaid cache cuando el usuario cambia de modo de editor
  useEffect(() => {
    lastRenderedContent.current = '';
    lastRenderedViewMode.current = '';
  }, [editorType]);

  // GLOBAL LISTENERS: Resize, Splitters, etc (Sin disparar Mermaid innecesariamente)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSplit.current) {
        const container = document.getElementById('editor-content-area');
        if (container) {
          const rect = container.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setSplitRatio(Math.max(0.2, Math.min(0.8, ratio)));
        }
      }
    };

    const handleMouseUp = () => {
      isResizingSplit.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Auto-save: derive activeNoteBody to avoid reacting to changes in OTHER notes
  const activeNoteBody = useMemo(() => {
    if (!activeNoteId) return undefined;
    return notes.find(n => n.id === activeNoteId)?.body;
  }, [notes, activeNoteId]);

  useEffect(() => {
    // IMPORTANTE: Solo guardar si el ID activo coincide con lo que cargamos en el editor.
    if (!activeNoteId || activeNoteId !== lastLoadedNoteId.current) return;

    if (activeNoteBody === content) return;

    const timeout = setTimeout(() => {
      const lines = content.split('\n');
      const titleLine = lines.find(line => line.trim().startsWith('#')) || lines[0] || 'Untitled Note';
      const title = titleLine.replace(/^#+\s*/, '').trim().substring(0, 50);
      saveNote(activeNoteId, title, content);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [content, activeNoteId, saveNote, activeNoteBody]);

  const applyFormat = (type: string) => {
    if (!editorRef.current) return;
    const view = (editorRef.current as any).view;
    const { from, to } = view.state.selection.main;
    const selection = view.state.sliceDoc(from, to);

    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selection || 'text'}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        replacement = `_${selection || 'text'}_`;
        cursorOffset = 1;
        break;
      case 'strike':
        replacement = `~~${selection || 'text'}~~`;
        cursorOffset = 2;
        break;
      case 'code':
        replacement = `\`${selection || 'code'}\``;
        cursorOffset = 1;
        break;
      case 'h1':
        replacement = `# ${selection || 'Heading'}`;
        cursorOffset = 2;
        break;
    }

    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + cursorOffset, head: from + cursorOffset + (selection ? selection.length : replacement.length - cursorOffset * 2) }
    });
    view.focus();
  };

  if (!activeNoteId) {
    return <NotebookDashboard />;
  }

  const activeNote = notes.find(n => n.id === activeNoteId)!;
  const notebook = notebooks.find(nb => nb.id === activeNote?.notebookId);

  let breadcrumb = notebook?.name || 'Uncategorized';
  if (notebook?.parentId) {
    const parent = notebooks.find(nb => nb.id === notebook.parentId);
    if (parent) breadcrumb = `${parent.name} / ${breadcrumb}`;
  }

  return (
    <div
      className={`flex-[2_2_0%] flex flex-col h-full font-sans relative shadow-[-5px_0_15px_rgba(0,0,0,0.02)] ${themeStyle.editorBg} ${themeStyle.editorText}`}
    >
      <EditorToolbar
        activeNote={activeNote}
        activeNoteId={activeNoteId}
        notebooks={notebooks}
        tags={tags}
        noteTags={noteTags}
        themeStyle={themeStyle}
        themeName={themeName}
        isDark={isDark}
        editorType={editorType}
        editorFontSize={editorFontSize}
        viewMode={viewMode}
        isSidebarCollapsed={isSidebarCollapsed}
        isNoteListCollapsed={isNoteListCollapsed}
        isAiPanelOpen={isAiPanelOpen}
        myHistory={myHistory}
        customColors={customColors}
        setViewMode={setViewMode}
        setEditorType={setEditorType}
        applyFormat={applyFormat}
        setContent={setContent}
      />

      {/* Dynamic Font Size Injector */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .cm-editor .cm-content, 
        .cm-editor .cm-gutter,
        .bn-editor,
        .prose-custom-size {
          font-size: ${editorFontSize}px !important;
          line-height: 1.6 !important;
        }
        .prose-custom-size h1 { font-size: ${editorFontSize * 2}px !important; }
        .prose-custom-size h2 { font-size: ${editorFontSize * 1.5}px !important; }
        .prose-custom-size h3 { font-size: ${editorFontSize * 1.25}px !important; }
      `}} />

      {/* Editor Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div 
          id="editor-content-area" 
          ref={contentAreaRef}
          className="flex-1 flex overflow-hidden relative"
        >

          {/* RICH MODE: BlockNote replaces everything */}
          {editorType === 'rich' && (
            <div className="flex-1 h-full overflow-hidden" style={{ fontSize: `${editorFontSize}px` }}>
              <RichEditor
                content={content}
                onChange={(md) => setContent(md)}
                fontSize={editorFontSize}
                themeName={themeName}
              />
            </div>
          )}

          {/* RAW MODE: Original CodeMirror + Preview */}
          {editorType === 'raw' && (
            <>
              {/* CodeMirror */}
              {(viewMode === 'split' || viewMode === 'edit') && (
                <div
                  style={{
                    width: viewMode === 'split' ? `${splitRatio * 100}%` : '100%',
                    flexShrink: 0
                  }}
                  className={`h-full overflow-y-auto ${themeStyle.editorBg} ${viewMode === 'split' ? `border-r ${themeStyle.editorBorder}` : ''} print:hidden`}
                >
                  <div className="h-full" style={{ fontSize: `${editorFontSize}px` }}>
                    <CodeMirror
                      ref={editorRef}
                      value={content}
                      height="100%"
                      theme={themeStyle.codeTheme as 'light' | 'dark'}
                      extensions={editorExtensions}
                      onChange={(val) => setContent(val)}
                      autoFocus={true}
                      className="h-full"
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: true,
                        highlightActiveLine: true,
                        foldGutter: true,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Draggable Divider for Split Mode */}
              {viewMode === 'split' && (
                <div
                  className="absolute top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/40 z-50 transition-colors"
                  style={{ left: `calc(${splitRatio * 100}% - 3px)` }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    isResizingSplit.current = true;
                    document.body.style.cursor = 'col-resize';
                  }}
                />
              )}

              {/* Markdown-It Preview */}
              {(viewMode === 'split' || viewMode === 'preview') && (
                <div
                  id="preview-area-wrapper"
                  key={`${activeNoteId}-${viewMode}-${editorFontSize}-${themeName}`}
                  className={`h-full overflow-y-auto p-8 print:!bg-white print:!text-black ${themeStyle.previewBg}`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: `${editorFontSize}px`
                  }}
                >
                  <MarkdownPreview
                    content={content}
                    className={`${themeStyle.prose} prose-custom-size max-w-3xl mx-auto block print:!text-black`}
                  />

                  {/* Fase 1: Sección de Backlinks al final de la nota */}
                  {currentBacklinks.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-white/5 max-w-3xl mx-auto mb-20">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30 mb-6 flex items-center gap-2">
                        <Columns size={12} />
                        Linked Mentions ({currentBacklinks.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {currentBacklinks.map(link => (
                          <div
                            key={link.id}
                            onClick={() => {
                              const note = notes.find(n => n.id === link.id);
                              if (note) {
                                setActiveNotebook(note.notebookId);
                                setTimeout(() => setActiveNote(link.id), 50);
                              }
                            }}
                            className={`group p-4 rounded-xl border ${themeStyle.editorBorder} hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[13px] group-hover:text-blue-400 transition-colors">{link.title}</span>
                              <span className="text-[10px] opacity-30">
                                {new Date(link.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-[11px] opacity-40 line-clamp-1 italic">
                              Click to navigate to this reference
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* AI Chat Panel — slides in from right */}
          <AiChatPanel
            isOpen={isAiPanelOpen}
            onClose={() => toggleAiPanel()}
            content={content}
            noteTitle={(() => {
              const lines = content.split('\n');
              return (lines.find(l => l.trim().startsWith('#')) || lines[0] || 'Untitled').replace(/^#+\s*/, '').trim().substring(0, 60);
            })()}
            onContentChange={(md) => {
              setContent(md);
              triggerAiAnimation();
            }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <EditorStatusBar
        editorType={editorType}
        editorMode={editorMode}
        vimMode={vimMode}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
        totalLines={totalLines}
        contentLength={content.length}
        content={content}
        themeStyle={themeStyle}
        isDark={isDark}
      />


    </div>
  );
};

export default Editor;
