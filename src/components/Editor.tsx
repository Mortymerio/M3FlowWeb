import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';


import { vim } from '@replit/codemirror-vim';
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
import TabsBar from './TabsBar';
import TasksDashboard from './TasksDashboard';
import SelectionToolbar from './SelectionToolbar';
import { GhostwriterContextMenu } from './GhostwriterContextMenu';
import { ghostwriterField } from '../lib/ghostwriterExtension';
import { animate } from 'animejs';
import { MarkdownPreview } from './MarkdownPreview';
import { useNoteManager } from '../hooks/useNoteManager';
import { createCursorTracker } from '../lib/cm-extensions/cursorTracker';
import { useGhostwriterActions } from '../hooks/useGhostwriterActions';
import { ghostwriterCoordsTracker } from '../lib/cm-extensions/ghostwriterTracker';

// Markdown components extracted to src/components/MarkdownPreview.tsx and src/lib/MarkdownEngine.ts

const Editor = () => {
  const tabs = useStore(state => state.tabs);
  const notes = useStore(state => state.notes);
  const notebooks = useStore(state => state.notebooks);

  const activeTabId = useStore(state => state.activeTabId);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeNoteId = activeTab?.type === 'note' ? activeTab.noteId : null;

  const editorMode = useStore(state => state.editorMode);
  const editorFontSize = useStore(state => state.editorFontSize);
  const editorType = useStore(state => state.editorType);
  const currentBacklinks = useStore(state => state.currentBacklinks);
  const setActiveNote = useStore(state => state.setActiveNote);
  const setActiveNotebook = useStore(state => state.setActiveNotebook);

  const { content, setContent, viewMode, setViewMode, splitRatio, setSplitRatio, isResizingSplit } = useNoteManager(activeNoteId || null);
  
  const editorRef = useRef<any>(null);
  const lastRenderedContent = useRef<string>('');
  const lastRenderedViewMode = useRef<string>('');

  // Status bar state
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [totalLines, setTotalLines] = useState(1);

  const [editorOpacity, setEditorOpacity] = useState(1);

  useEffect(() => {
    setEditorOpacity(0);
    const timeout = setTimeout(() => {
      setEditorOpacity(1);
    }, 75);
    return () => clearTimeout(timeout);
  }, [activeNoteId]);

  const [vimMode, setVimMode] = useState('NORMAL');

  // AI Panel & Ghostwriter State
  const isAiPanelOpen = useStore(state => state.isAiPanelOpen);
  const toggleAiPanel = useStore(state => state.toggleAiPanel);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const {
    contextMenu,
    setContextMenu,
    ghostwriterReview,
    isAiLoading,
    reviewCoords,
    handleContextMenu,
    handleGhostwriterAction,
    handleGhostwriterDecision
  } = useGhostwriterActions(editorRef, editorType, activeNoteId || null, notes, notebooks);

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

  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const isDark = themeStyle.isDark !== false;


  // Cursor position tracking extension extracted to src/lib/cm-extensions/cursorTracker.ts

  // Build extensions: vim/emacs MUST come before markdown for keymap precedence
  const editorExtensions = useMemo(() => {
    const exts: any[] = [];
    if (editorMode === 'vim') exts.push(vim());
    if (editorMode === 'emacs') exts.push(emacs());
    exts.push(markdown({ base: markdownLanguage, codeLanguages: languages }));
    exts.push(createCursorTracker({ editorMode, setCursorLine, setCursorCol, setTotalLines, setVimMode }));
    exts.push(ghostwriterField);
    exts.push(ghostwriterCoordsTracker);
    return exts;
  }, [editorMode]);

  // Note loading logic extracted to useNoteManager





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

  // Auto-save logic extracted to useNoteManager

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

  // Ghostwriter handlers extracted to useGhostwriterActions

  if (!activeTabId) {
    return (
      <div className={`flex-[2_2_0%] flex flex-col h-full font-sans relative shadow-[-5px_0_15px_rgba(0,0,0,0.02)] ${themeStyle.editorBg} ${themeStyle.editorText}`}>
        <TabsBar />
        <NotebookDashboard />
      </div>
    );
  }

  if (activeTab?.type === 'tasks') {
    return (
      <div className={`flex-[2_2_0%] flex flex-col h-full font-sans relative shadow-[-5px_0_15px_rgba(0,0,0,0.02)] ${themeStyle.editorBg} ${themeStyle.editorText}`}>
        <TabsBar />
        <TasksDashboard />
      </div>
    );
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
      <TabsBar />
      <EditorToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <SelectionToolbar applyFormat={applyFormat} />

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
          className="flex-1 flex overflow-hidden relative transition-opacity duration-150 ease-in-out"
          style={{ opacity: editorOpacity }}
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
                  className={`h-full overflow-y-auto ${themeStyle.editorBg} ${viewMode === 'split' ? `border-r ${themeStyle.editorBorder}` : ''} print:hidden relative`}
                  onContextMenu={handleContextMenu}
                >
                  <div className="h-full relative" style={{ fontSize: `${editorFontSize}px` }}>
                    {isAiLoading && (
                      <div className="absolute top-2 right-2 z-50 bg-blue-500 text-white p-1.5 rounded-full shadow-lg animate-pulse flex items-center gap-2 px-3">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">AI Thinking...</span>
                      </div>
                    )}
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
          
          {contextMenu && (
            <GhostwriterContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              hasSelection={!!contextMenu.selection}
              onClose={() => setContextMenu(null)}
              onAction={handleGhostwriterAction}
            />
          )}

          {ghostwriterReview && reviewCoords && (
            <div 
              className="fixed z-[999] flex items-center gap-1.5 bg-green-500/10 backdrop-blur-md border border-green-500/30 p-1.5 rounded-lg shadow-2xl animate-in slide-in-from-bottom-2 fade-in"
              style={{ top: reviewCoords.top, left: reviewCoords.left }}
            >
              <button 
                onClick={() => handleGhostwriterDecision('keep')}
                className="px-2 py-1 bg-green-500/20 hover:bg-green-500 text-green-200 hover:text-white rounded-md text-[10px] font-bold uppercase transition-colors"
              >
                Keep
              </button>
              <button 
                onClick={() => handleGhostwriterDecision('try_again')}
                className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500 text-blue-200 hover:text-white rounded-md text-[10px] font-bold uppercase transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => handleGhostwriterDecision('discard')}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-md text-[10px] font-bold uppercase transition-colors"
              >
                Discard
              </button>
            </div>
          )}
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
