import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Download, Layout, Eye, PenTool, Book, Settings2, Plus, ChevronDown, Trash2, Search, Check, Columns, LayoutList, Bell, Calendar, Sparkles } from 'lucide-react';
import RichEditor from './RichEditor';
import AiChatPanel from './AiChatPanel';
import NotebookDashboard from './NotebookDashboard';

const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
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
  const [dropdownOpen, setDropdownOpen] = useState<'none' | 'notebook' | 'status' | 'tags' | 'settings' | 'reminder'>('none');
  const [tagSearch, setTagSearch] = useState('');
  const [splitRatio, setSplitRatio] = useState(0.5);
  const isResizingSplit = useRef(false);
  const editorRef = useRef<any>(null);
  const [tempReminder, setTempReminder] = useState<number | null>(null);
  const lastLoadedNoteId = useRef<string | null>(null);

  // Status bar state
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [totalLines, setTotalLines] = useState(0);
  const [vimMode, setVimMode] = useState('NORMAL');

  // AI Panel State
  const isAiPanelOpen = useStore(state => state.isAiPanelOpen);
  const toggleAiPanel = useStore(state => state.toggleAiPanel);

  const tags = useStore(state => state.tags);
  const noteTags = useStore(state => state.noteTags);
  const updateNoteStatus = useStore(state => state.updateNoteStatus);
  const moveNote = useStore(state => state.moveNote);
  const toggleNoteTag = useStore(state => state.toggleNoteTag);
  const createTag = useStore(state => state.createTag);
  const updateTag = useStore(state => state.updateTag);
  const deleteTag = useStore(state => state.deleteTag);
  const setCustomColor = useStore(state => state.setCustomColor);
  const customColors = useStore(state => state.customColors);


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
  const editorExtensions: any[] = [];
  if (editorMode === 'vim') editorExtensions.push(vim());
  if (editorMode === 'emacs') editorExtensions.push(emacs());
  editorExtensions.push(markdown({ base: markdownLanguage, codeLanguages: languages }));
  editorExtensions.push(cursorTracker());

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
      securityLevel: 'loose',
      fontFamily: 'inherit'
    });
  }, [themeStyle.codeTheme]);

  useEffect(() => {
    const renderMermaid = async () => {
      if (viewMode !== 'edit') {
        try { 
          const elements = document.querySelectorAll('.mermaid');
          if (elements.length > 0) {
            elements.forEach(el => {
              const src = el.getAttribute('data-mermaid-src');
              if (src) {
                el.innerHTML = src;
                el.removeAttribute('data-processed');
              }
            });
            await mermaid.run({ querySelector: '.mermaid' }); 
          }
        } catch (e) {
          console.error('Mermaid error:', e);
        }
      }
    };

    const timeout = setTimeout(renderMermaid, 50);
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
      renderMermaid();
    };

    const debounceResize = () => {
      clearTimeout(timeout);
      setTimeout(renderMermaid, 250);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', debounceResize);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', debounceResize);
    };
  }, [content, viewMode, editorMode, themeStyle.codeTheme, editorFontSize, dropdownOpen, isSidebarCollapsed, isNoteListCollapsed]);

  useEffect(() => {
    // IMPORTANTE: Solo guardar si el ID activo coincide con lo que cargamos en el editor.
    // Esto evita que el contenido de una nota anterior se guarde sobre una nueva nota
    // durante la transición.
    if (!activeNoteId || activeNoteId !== lastLoadedNoteId.current) return;

    const activeNote = notes.find(n => n.id === activeNoteId);
    if (activeNote && activeNote.body === content) return;

    const timeout = setTimeout(() => {
      const lines = content.split('\n');
      const titleLine = lines.find(line => line.trim().startsWith('#')) || lines[0] || 'Untitled Note';
      const title = titleLine.replace(/^#+\s*/, '').trim().substring(0, 50);
      saveNote(activeNoteId, title, content);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [content, activeNoteId, saveNote, notes]);

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
      onClick={() => setDropdownOpen('none')}
    >
      {/* Dynamic Font Size Injector */}
      <style dangerouslySetInnerHTML={{ __html: `
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

      {/* Top Header / minimal draggable area */}
      <div 
        id="editor-header"
        className={`h-12 flex items-center justify-between no-drag text-[13px] border-b relative z-[100] transition-all duration-300 ${themeStyle.editorHeader} ${themeStyle.editorBorder} px-4 print:hidden`} 
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {/* Left: Metadata Bar Restored */}
        <div className="flex items-center gap-2 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Metadata Property Bar */}
          <div className={`flex items-center p-0.5 rounded-[10px] border ${themeStyle.editorBorder} bg-black/5 backdrop-blur-sm shadow-sm`}>
            
            {/* Notebook Selector */}
            <div className="relative group">
              <div 
                className={`flex items-center gap-2 cursor-pointer transition-all px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-tight ${themeStyle.sidebarHover} active:scale-95`}
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === 'notebook' ? 'none' : 'notebook'); }}
              >
                <Book size={12} className="opacity-50" />
                <span className="max-w-[120px] truncate">{notebooks.find(n => n.id === activeNote?.notebookId)?.name || 'Default'}</span>
                <ChevronDown size={10} className="opacity-40 group-hover:opacity-100" />
              </div>
              {dropdownOpen === 'notebook' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-9 left-0 w-56 rounded-xl shadow-2xl border overflow-hidden z-[9999] ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder} animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                  <div className={`px-3 py-2 text-[10px] uppercase font-bold border-b opacity-60 ${themeStyle.editorBorder}`}>Move to Notebook</div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {notebooks.map(nb => (
                      <div key={nb.id} onClick={() => { if(activeNoteId) moveNote(activeNoteId, nb.id); setDropdownOpen('none'); }} className={`px-3 py-2 cursor-pointer text-xs transition-colors flex items-center justify-between ${themeStyle.sidebarHover}`}>
                        {nb.name}
                        {activeNote?.notebookId === nb.id && <Check size={12} className="text-blue-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`w-px h-4 mx-0.5 ${themeStyle.editorBorder} opacity-50`}></div>

            {/* Status Badge Dropdown */}
            <div className="relative group">
              <div 
                className={`flex items-center gap-2 cursor-pointer transition-all px-2.5 py-1 rounded-lg ${themeStyle.sidebarHover} active:scale-95`}
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === 'status' ? 'none' : 'status'); }}
              >
                <div className={`w-2 h-2 rounded-full ${
                  (activeNote?.status || 'none') === 'active' ? 'bg-blue-400' : 
                  (activeNote?.status || 'none') === 'on-hold' ? 'bg-amber-400' : 
                  (activeNote?.status || 'none') === 'completed' ? 'bg-emerald-400' : 
                  (activeNote?.status || 'none') === 'dropped' ? 'bg-red-400' : 
                  'bg-gray-400'
                }`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest opacity-80`}>
                   {activeNote?.status || 'Status'}
                </span>
                <ChevronDown size={10} className="opacity-40" />
              </div>
              
              {dropdownOpen === 'status' && (activeNoteId) && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-9 left-0 w-48 rounded-xl shadow-2xl border overflow-hidden z-[9999] ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder} animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                  {['active', 'on-hold', 'completed', 'dropped'].map(s => (
                    <div 
                      key={s}
                      onClick={() => { updateNoteStatus(activeNoteId, s); setDropdownOpen('none'); }} 
                      className={`px-3 py-2.5 cursor-pointer text-[12px] transition-all flex items-center justify-between group ${themeStyle.sidebarHover}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${
                          s === 'active' ? 'bg-blue-400' : 
                          s === 'on-hold' ? 'bg-amber-400' : 
                          s === 'completed' ? 'bg-emerald-400' : 
                          'bg-red-400'
                        }`}></div>
                        <span className="capitalize font-medium opacity-80 group-hover:opacity-100">{s}</span>
                      </div>
                      {activeNote?.status === s && <Check size={14} className="text-blue-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`w-px h-4 mx-0.5 ${themeStyle.editorBorder} opacity-50`}></div>

            {/* Tags Toggle Restored */}
            <div className="relative group">
              <button 
                onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === 'tags' ? 'none' : 'tags'); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${themeStyle.sidebarHover} ${themeStyle.dropdownText}`}
              >
                <Plus size={12} className="opacity-50" />
                <span className="text-[11px] font-semibold opacity-80">Tags</span>
                {noteTags.filter(nt => nt.noteId === activeNoteId).length > 0 && (
                  <span className="bg-blue-500/90 backdrop-blur-sm text-[9px] text-white px-1.5 py-0.5 min-w-[18px] h-4 rounded-full flex items-center justify-center font-black shadow-lg shadow-blue-500/30 border border-white/20">
                    {noteTags.filter(nt => nt.noteId === activeNoteId).length}
                  </span>
                )}
              </button>
              
              {dropdownOpen === 'tags' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-9 left-0 w-64 rounded-xl shadow-2xl border overflow-hidden z-[9999] ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder} animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                  <div className={`px-4 py-3 border-b flex items-center gap-3 bg-white/5 backdrop-blur-md ${themeStyle.editorBorder}`}>
                    <div className="bg-white/10 p-1.5 rounded-lg">
                      <Search size={14} className="opacity-60 text-blue-400" />
                    </div>
                    <input 
                      autoFocus
                      className="bg-transparent border-0 outline-none text-xs w-full py-1 h-7 font-medium placeholder:opacity-30 tracking-tight"
                      placeholder="Search or add tags..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).map(tag => (
                      <div 
                        key={tag.id}
                        onClick={() => { if(activeNoteId) toggleNoteTag(activeNoteId, tag.id); }}
                        className={`px-3 py-2.5 cursor-pointer text-xs transition-all flex items-center justify-between group/tag ${themeStyle.sidebarHover}`}
                      >
                        <div className="flex items-center gap-2.5">
                           <div className="relative">
                             <input 
                               type="color"
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                               value={tag.color}
                               onChange={(e) => {
                                 updateTag(tag.id, tag.name, e.target.value);
                               }}
                               onClick={(e) => e.stopPropagation()}
                             />
                             <div 
                               className="w-4 h-4 rounded-full shadow-md ring-2 ring-white/10 hover:scale-125 transition-transform" 
                               style={{ backgroundColor: tag.color }} 
                             />
                           </div>
                           <span className="font-semibold text-[13px]">{tag.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteTag(tag.id); }}
                            className="p-1.5 rounded-md hover:bg-red-500/20 text-red-500 opacity-0 group-hover/tag:opacity-100 transition-all hover:scale-110"
                            title="Delete Tag"
                          >
                            <Trash2 size={12} />
                          </button>
                          {noteTags.some(nt => nt.noteId === activeNoteId && nt.tagId === tag.id) ? (
                            <Check size={14} className="text-blue-500" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-md border border-white/10 opacity-0 group-hover/tag:opacity-50 transition-opacity" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {tagSearch && !tags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                      <div className={`mt-2 p-3 border-t ${themeStyle.editorBorder} bg-black/5`}>
                        <div className="text-[10px] uppercase font-bold opacity-40 mb-2.5 tracking-widest pl-1">Create New Tag</div>
                        <div 
                          onClick={async () => {
                            if (activeNoteId) {
                              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                              const randomColor = colors[Math.floor(Math.random() * colors.length)];
                              const newTagId = await createTag(tagSearch, randomColor);
                              await toggleNoteTag(activeNoteId, newTagId);
                              setTagSearch('');
                            }
                          }}
                          className={`px-3 py-2.5 rounded-xl bg-blue-600 text-white cursor-pointer hover:bg-blue-500 transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20 active:scale-[0.98] group`}
                        >
                          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                          <span className="font-bold text-xs">Create "{tagSearch}"</span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3 px-1">
                          <div className="flex gap-1.5">
                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                              <div 
                                key={c} 
                                className="w-4 h-4 rounded-full cursor-help hover:scale-125 transition-transform ring-1 ring-white/10 shadow-sm"
                                style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] opacity-30 font-bold uppercase">suggested colors</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={`w-px h-4 mx-0.5 ${themeStyle.editorBorder} opacity-50`}></div>

            {/* Reminder Toggle */}
            <div className="relative group">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const isOpen = dropdownOpen === 'reminder';
                  if (!isOpen) setTempReminder(activeNote?.reminderAt || null);
                  setDropdownOpen(isOpen ? 'none' : 'reminder'); 
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${themeStyle.sidebarHover} ${themeStyle.dropdownText} ${activeNote?.reminderAt ? 'text-amber-400' : ''}`}
                title="Schedule Alert"
              >
                <Bell size={12} className={activeNote?.reminderAt ? 'animate-pulse' : 'opacity-50'} />
                {activeNote?.reminderAt && <span className="text-[9px] font-bold">SET</span>}
              </button>
              
              {dropdownOpen === 'reminder' && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute top-9 left-0 w-64 p-4 rounded-xl shadow-2xl border z-[9999] ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder} animate-in fade-in slide-in-from-top-2 duration-200`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Programar Alerta</span>
                  </div>
                  <input 
                    type="datetime-local"
                    className={`w-full bg-black/20 border ${themeStyle.editorBorder} rounded-lg p-2 text-xs outline-none focus:border-blue-500 transition-colors mb-3`}
                    value={tempReminder ? new Date(tempReminder).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value).getTime() : null;
                      setTempReminder(date);
                    }}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setTempReminder(null); setDropdownOpen('none'); useStore.getState().updateNoteReminder(activeNoteId, null); }}
                      className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-colors"
                    >
                      LIMPIAR
                    </button>
                    <button 
                      onClick={() => { 
                        useStore.getState().updateNoteReminder(activeNoteId, tempReminder);
                        setDropdownOpen('none'); 
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 transition-colors shadow-lg"
                    >
                      GUARDAR
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Settings */}
        <div className="relative no-drag flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === 'settings' ? 'none' : 'settings'); }} className="opacity-50 hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-white/5">
            <Settings2 size={16} />
          </button>
          
          {dropdownOpen === 'settings' && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`absolute top-8 right-0 w-56 rounded-md shadow-2xl border overflow-hidden z-[9999] ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder}`}
            >
              <div className={`px-3 py-2 text-[10px] uppercase font-bold border-b opacity-60 ${themeStyle.editorBorder}`}>Format Settings</div>
              <div className="p-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5 text-[11px]">
                  <label className="opacity-70 font-semibold tracking-tight">Theme Customization</label>
                  {themeName === 'custom' ? (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[
                        { label: 'Sidebar Bg', key: 'sidebarBg' },
                        { label: 'Side Header', key: 'sidebarHeader' },
                        { label: 'List Bg', key: 'listBg' },
                        { label: 'List Header', key: 'listHeader' },
                        { label: 'Editor Bg', key: 'editorBg' },
                        { label: 'ED Header', key: 'editorHeader' },
                        { label: 'Preview BG', key: 'previewBg' },
                      ].map((item: any) => (
                        <div key={item.key} className="flex flex-col gap-0.5">
                          <span className="text-[9px] opacity-40 uppercase font-black">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="color" 
                              value={(customColors as any)[item.key]} 
                              onChange={(e) => setCustomColor(item.key, e.target.value)} 
                              className="w-full h-6 rounded border-none cursor-pointer bg-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] opacity-40 italic py-1 border border-dashed rounded px-2">Choose 'Custom' theme to edit colors</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        
        {/* Formatting Toolbar */}
        <div id="format-toolbar" className={`flex items-center justify-between px-4 py-2 border-b ${themeStyle.editorBorder} opacity-80 print:hidden relative z-[90]`}>
           <div className="flex gap-4">
              <span onClick={() => applyFormat('bold')} className="font-bold cursor-pointer hover:opacity-70 px-1">B</span>
              <span onClick={() => applyFormat('italic')} className="italic cursor-pointer hover:opacity-70 px-1">I</span>
              <span onClick={() => applyFormat('strike')} className="cursor-pointer hover:opacity-70 px-1"><s>S</s></span>
              <span className={`mx-2 w-px h-4 border-l ${themeStyle.editorBorder} opacity-50`}></span>
              <span onClick={() => applyFormat('code')} className="cursor-pointer hover:opacity-70 px-1 font-mono">&lt;/&gt;</span>
              <span onClick={() => applyFormat('h1')} className="cursor-pointer hover:opacity-70 px-1 font-bold">A</span>
              
              <span className={`mx-2 w-px h-4 border-l ${themeStyle.editorBorder} opacity-50`}></span>
               <span className={`mx-2 w-px h-4 border-l ${themeStyle.editorBorder} opacity-50`}></span>
               <button 
                  onClick={(e) => { e.stopPropagation(); toggleAiPanel(); }} 
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-blue-500/20 text-blue-500 transition-colors ${isAiPanelOpen ? 'bg-blue-500/20' : ''}`}
                >
                  <Sparkles size={14} />
                  <span className="text-[11px] font-bold">AI</span>
                </button>

               <span className={`mx-2 w-px h-4 border-l ${themeStyle.editorBorder} opacity-50`}></span>
                
                {/* Font Size Setup */}
                <div className="flex items-center gap-2">
                   <span className="text-[10px] opacity-50 font-bold">Aa</span>
                   <input type="range" min="12" max="24" value={editorFontSize} onChange={(e) => useStore.getState().setEditorFontSize(parseInt(e.target.value))} className={`w-16 h-1 accent-blue-500 rounded-lg appearance-none ${isDark ? "bg-black/20" : "bg-black/10"} cursor-pointer`} />
                </div>
           </div>


            {/* Editor Type Toggle (RAW / RICH) */}
            <div className="flex items-center">
              <div className={`flex items-center p-0.5 rounded-lg border shadow-inner ${themeStyle.editorBorder} ${isDark ? "bg-black/15" : "bg-white/50 shadow-sm"} backdrop-blur-sm`}>
                <button
                  onClick={() => setEditorType('raw')}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all duration-200 ${editorType === 'raw' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'opacity-40 hover:opacity-80'}`}
                >
                  RAW
                </button>
                <button
                  onClick={() => setEditorType('rich')}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all duration-200 ${editorType === 'rich' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' : 'opacity-40 hover:opacity-80'}`}
                >
                  RICH
                </button>
              </div>
            </div>

           <div className={`flex items-center p-0.5 rounded-lg border relative z-[50] ${themeStyle.editorBorder} ${themeStyle.sidebarHover.replace('hover:', '')}`}>
             <div className="flex items-center gap-1 border-r border-white/5 pr-1 mr-1">
               <button 
                 onClick={(e) => { e.stopPropagation(); toggleSidebar(); }} 
                 className={`p-1.5 rounded-md transition-all relative z-[100] ${isSidebarCollapsed ? 'bg-blue-600/20 text-blue-500 font-bold' : 'opacity-40 hover:opacity-100'}`}
                 title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
               >
                 <Columns size={14} />
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); toggleNoteList(); }} 
                 className={`p-1.5 rounded-md transition-all relative z-[100] ${isNoteListCollapsed ? 'bg-blue-600/20 text-blue-500 font-bold' : 'opacity-40 hover:opacity-100'}`}
                 title={isNoteListCollapsed ? "Show Note List" : "Hide Note List"}
               >
                 <LayoutList size={14} />
               </button>
             </div>
             {editorType === 'raw' && (
                <>
                  <button onClick={() => setViewMode('edit')} className={`p-1.5 rounded-md transition-colors ${viewMode==='edit'?'bg-blue-600/20 text-blue-500':''}`}><PenTool size={14} /></button>
                  <button onClick={() => setViewMode('split')} className={`p-1.5 rounded-md transition-colors ${viewMode==='split'?'bg-blue-600/20 text-blue-500':''}`}><Layout size={14} /></button>
                  <button onClick={() => setViewMode('preview')} className={`p-1.5 rounded-md transition-colors ${viewMode==='preview'?'bg-blue-600/20 text-blue-500':''}`}><Eye size={14} /></button>
                </>
              )}
           </div>
        </div>

        <div id="editor-content-area" className={`flex-1 flex overflow-hidden relative ${dropdownOpen !== 'none' ? 'pointer-events-none' : ''}`}>

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
                  style={{ flex: viewMode === 'split' ? splitRatio : 1 }}
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
                    flex: viewMode === 'split' ? (1 - splitRatio) : 1,
                    fontSize: `${editorFontSize}px` 
                  }}
                >
                  <div 
                    id="preview-area"
                    className={`${themeStyle.prose} prose-custom-size max-w-3xl mx-auto block print:!text-black`}
                    dangerouslySetInnerHTML={{ __html: mdParser.render(content) }} 
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
            onContentChange={(md) => setContent(md)}
          />
        </div>
      </div>

      {/* Status Bar — Vim/VS Code style */}
      <div className={`status-bar h-6 flex items-center justify-between px-3 border-t ${themeStyle.editorBorder} ${isDark ? "bg-black/20" : "bg-black/5"} backdrop-blur-sm print:hidden`}>
        <div className="flex items-center gap-3">
          {/* Editor type indicator */}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${editorType === 'rich' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {editorType === 'rich' ? 'RICH' : 'RAW'}
          </span>
          {/* Vim mode indicator (only in vim mode + raw mode) */}
          {editorMode === 'vim' && editorType === 'raw' && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${
              vimMode === 'INSERT' ? 'bg-emerald-500/20 text-emerald-400' :
              vimMode === 'VISUAL' || vimMode === 'V-LINE' || vimMode === 'V-BLOCK' ? 'bg-purple-500/20 text-purple-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              -- {vimMode} --
            </span>
          )}
          {/* Editor mode badge */}
          {editorType === 'raw' && (
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
              {editorMode === 'vim' ? 'VIM' : editorMode === 'emacs' ? 'EMACS' : 'NORMAL'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 opacity-60">
          {editorType === 'raw' && (
            <>
              <span className="text-[10px]">Ln {cursorLine}, Col {cursorCol}</span>
              <span className="text-[10px]">{totalLines} lines</span>
            </>
          )}
          <span className="text-[10px]">{content.length} chars</span>
          <span className="text-[10px] uppercase">UTF-8</span>
          <span className="text-[10px] uppercase">Markdown</span>
        </div>
      </div>
      
      {/* Floating Export Box */}
      <div className="absolute bottom-10 right-6 flex gap-2 z-10 print:hidden">
          <button 
            className={`flex items-center gap-2 text-xs font-semibold shadow-lg hover:shadow-xl transition-all px-3 py-2 border rounded-full hover:-translate-y-0.5 ${themeStyle.editorBg} ${themeStyle.editorBorder} ${themeStyle.editorText}`}
            onClick={async () => {
              const lines = content.split('\n');
              const title = (lines.find(l => l.trim().startsWith('#')) || lines[0] || 'Untitled Note').replace(/^#+\s*/, '').trim().substring(0, 50);
              await (window as any).dbAPI.exportMarkdown(title, content);
            }}
          >
            <Download size={14} /> MD
          </button>
          <button 
            className={`flex items-center gap-2 text-xs font-semibold shadow-lg hover:shadow-xl transition-all px-3 py-2 border rounded-full hover:-translate-y-0.5 ${themeStyle.editorBg} ${themeStyle.editorBorder} ${themeStyle.editorText}`}
            onClick={async () => {
              const lines = content.split('\n');
              const title = (lines.find(l => l.trim().startsWith('#')) || lines[0] || 'Untitled Note').replace(/^#+\s*/, '').trim().substring(0, 50);
              await (window as any).dbAPI.exportPDF(title);
            }}
          >
            <Download size={14} /> PDF
          </button>
      </div>
    </div>
  );
};

export default Editor;
