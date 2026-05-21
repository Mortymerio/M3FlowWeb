/**
 * EditorToolbar — Top header bar with all metadata dropdowns and formatting controls.
 * Extracted from Editor.tsx for modularity.
 * 
 * Contains: Notebook selector, Status badge, Tags manager, Reminder, History,
 * Writing Assistant, Settings, Format bar, View mode toggles, AI button.
 */

import { useState } from 'react';
import {
  Download, Layout, Eye, PenTool, Book, Settings2, Plus,
  ChevronDown, Trash2, Search, Check, Columns, LayoutList,
  Bell, Calendar, Sparkles, History, Brain
} from 'lucide-react';
import { useStore } from '../store';

// ---- Types ----

interface Note {
  id: string;
  title: string;
  body: string;
  notebookId: string;
  status?: string;
  reminderAt?: number | null;
  updatedAt: number;
}

interface Notebook {
  id: string;
  name: string;
  parentId: string | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface NoteTag {
  noteId: string;
  tagId: string;
}

type DropdownType = 'none' | 'notebook' | 'status' | 'tags' | 'settings' | 'reminder' | 'history' | 'writing-assistant';

interface EditorToolbarProps {
  activeNote: Note;
  activeNoteId: string;
  notebooks: Notebook[];
  tags: Tag[];
  noteTags: NoteTag[];
  themeStyle: any;
  themeName: string;
  isDark: boolean;
  editorType: 'raw' | 'rich';
  editorFontSize: number;
  viewMode: 'split' | 'edit' | 'preview';
  isSidebarCollapsed: boolean;
  isNoteListCollapsed: boolean;
  isAiPanelOpen: boolean;
  myHistory: { body: string; timestamp: number }[];
  customColors: any;
  setViewMode: (mode: 'split' | 'edit' | 'preview') => void;
  setEditorType: (type: 'raw' | 'rich') => void;
  applyFormat: (type: string) => void;
  setContent: (content: string) => void;
}

const EditorToolbar = ({
  activeNote,
  activeNoteId,
  notebooks,
  tags,
  noteTags,
  themeStyle,
  themeName,
  isDark,
  editorType,
  editorFontSize,
  viewMode,
  isSidebarCollapsed,
  isNoteListCollapsed,
  isAiPanelOpen,
  myHistory,
  customColors,
  setViewMode,
  setEditorType,
  applyFormat,
  setContent,
}: EditorToolbarProps) => {

  const [dropdownOpen, setDropdownOpen] = useState<DropdownType>('none');
  const [tagSearch, setTagSearch] = useState('');
  const [tempReminder, setTempReminder] = useState<number | null>(null);

  // Store actions
  const moveNote = useStore(state => state.moveNote);
  const updateNoteStatus = useStore(state => state.updateNoteStatus);
  const toggleNoteTag = useStore(state => state.toggleNoteTag);
  const createTag = useStore(state => state.createTag);
  const updateTag = useStore(state => state.updateTag);
  const deleteTag = useStore(state => state.deleteTag);
  const toggleSidebar = useStore(state => state.toggleSidebar);
  const toggleNoteList = useStore(state => state.toggleNoteList);
  const toggleAiPanel = useStore(state => state.toggleAiPanel);
  const revertToHistory = useStore(state => state.revertToHistory);
  const setCustomColor = useStore(state => state.setCustomColor);

  return (
    <>
      {/* Top Header / minimal draggable area */}
      <div
        id="editor-header"
        className={`h-12 flex items-center justify-between no-drag text-[13px] border-b relative z-[100] transition-all duration-300 ${themeStyle.editorHeader} ${themeStyle.editorBorder} px-4 print:hidden`}
        style={{ WebkitAppRegion: 'drag' } as any}
        onClick={() => setDropdownOpen('none')}
      >
        {/* Left: Metadata Bar */}
        <div className="flex items-center gap-2 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
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
                      <div key={nb.id} onClick={() => { if (activeNoteId) moveNote(activeNoteId, nb.id); setDropdownOpen('none'); }} className={`px-3 py-2 cursor-pointer text-xs transition-colors flex items-center justify-between ${themeStyle.sidebarHover}`}>
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
                <div className={`w-2 h-2 rounded-full ${(activeNote?.status || 'none') === 'active' ? 'bg-blue-400' :
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
                        <div className={`w-2 h-2 rounded-full ${s === 'active' ? 'bg-blue-400' :
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

            {/* Tags Toggle */}
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
                  className={`absolute top-9 left-0 w-64 rounded-xl shadow-2xl border overflow-hidden z-[9999] ${themeStyle.dropdownText} ${themeStyle.editorBorder} animate-in fade-in slide-in-from-top-2 duration-200`}
                  style={{
                    backgroundColor: themeStyle.isDark ? '#1e2329' : '#ffffff',
                    opacity: 1,
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none'
                  }}
                >
                  <div className={`px-4 py-3 border-b flex items-center gap-3 bg-black/10 ${themeStyle.editorBorder}`}>
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
                        onClick={() => { if (activeNoteId) toggleNoteTag(activeNoteId, tag.id); }}
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

          <div className="flex items-center gap-2">
            <span className="text-[10px] opacity-50 font-bold">Aa</span>
            <input type="range" min="12" max="24" value={editorFontSize} onChange={(e) => useStore.getState().setEditorFontSize(parseInt(e.target.value))} className={`w-16 h-1 accent-blue-500 rounded-lg appearance-none ${isDark ? "bg-black/20" : "bg-black/10"} cursor-pointer`} />
          </div>

          <span className={`mx-2 w-px h-4 border-l ${themeStyle.editorBorder} opacity-50`}></span>

          {/* Writing Assistant Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === 'writing-assistant' ? 'none' : 'writing-assistant'); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${dropdownOpen === 'writing-assistant' ? 'bg-indigo-500/20 text-indigo-500' : 'opacity-60 hover:opacity-100 hover:text-indigo-400'}`}
            >
              <Brain size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Asistente de Escritura</span>
              <ChevronDown size={10} className={`transition-transform duration-200 ${dropdownOpen === 'writing-assistant' ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen === 'writing-assistant' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute top-8 left-0 w-64 rounded-xl shadow-2xl border z-[9999] ${themeStyle.dropdownText} ${themeStyle.editorBorder} animate-in fade-in slide-in-from-top-2 duration-200`}
                style={{
                  backgroundColor: themeStyle.isDark ? '#1e2329' : '#ffffff',
                  opacity: 1,
                }}
              >
                <div className={`px-4 py-3 border-b flex items-center justify-between bg-black/10 ${themeStyle.editorBorder}`}>
                  <span className="text-[10px] uppercase font-bold opacity-60 tracking-widest">M3Synthesis Studio</span>
                  <Sparkles size={12} className="text-indigo-400" />
                </div>
                <div className="p-1.5 space-y-1">
                  {[
                    {
                      id: 'socratic',
                      label: 'Entrevista Socrática',
                      desc: 'Desafía tu lógica y expande tu tesis.',
                      prompt: 'REPLY: Actúa como un mentor socrático y un "Abogado del Diablo". Analiza mi tratado y desafía mis premisas. Hazme 3 preguntas críticas que pongan a prueba la lógica de mi argumento y me obliguen a expandir mi tesis con más rigor técnico.'
                    },
                    {
                      id: 'hierarchy',
                      label: 'Jerarquía de Conceptos',
                      desc: 'Analiza el flujo lógico y dependencias.',
                      prompt: 'REPLY: Analiza la jerarquía de conceptos de este escrito. ¿El orden lógico es correcto? ¿Hay conceptos complejos que se introducen sin base previa? Genera un mapa de dependencias lógicas y sugiere si algún apartado debería moverse para mejorar la fluidez del tratado.'
                    },
                    {
                      id: 'taxonomy',
                      label: 'Glosario & Taxonomía',
                      desc: 'Extrae y define términos técnicos.',
                      prompt: 'REPLY: Escanea este tratado y extrae una taxonomía de términos técnicos clave. Para cada término, genera una definición precisa basada en el contexto del documento y sugiéreme dónde incluir un glosario o referencias cruzadas para mejorar la claridad técnica.'
                    },
                    {
                      id: 'synthesis',
                      label: 'Síntesis de Fuentes',
                      desc: 'Resume y estructura múltiples notas.',
                      prompt: 'REPLY: Basándote en el contenido actual y cualquier nota del @vault relevante, sintetiza una base sólida para el siguiente apartado del tratado. Asegúrate de mantener la integridad técnica y la cohesión con los argumentos ya establecidos.'
                    },
                  ].map(action => (
                    <div
                      key={action.id}
                      onClick={() => {
                        useStore.getState().toggleAiPanel(true);
                        useStore.getState().setPendingAiPrompt(action.prompt);
                        setDropdownOpen('none');
                      }}
                      className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all ${themeStyle.sidebarHover} group/wa`}
                    >
                      <div className="text-[11px] font-bold group-hover/wa:text-indigo-400 transition-colors">{action.label}</div>
                      <div className="text-[9px] opacity-40 leading-tight mt-0.5">{action.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className={`mx-2 w-px h-4 border-l ${themeStyle.editorBorder} opacity-50`}></span>

          {/* History Button */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === 'history' ? 'none' : 'history'); }}
              disabled={myHistory.length === 0}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors ${dropdownOpen === 'history' ? 'bg-amber-500/20 text-amber-500' : 'opacity-40 hover:opacity-100 hover:text-amber-500'} disabled:opacity-10`}
              title="Note History"
            >
              <History size={14} />
              {myHistory.length > 0 && <span className="text-[10px] font-black">{myHistory.length}</span>}
            </button>

            {dropdownOpen === 'history' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute top-8 left-0 w-64 rounded-xl shadow-2xl border z-[9999] ${themeStyle.dropdownText} ${themeStyle.editorBorder} animate-in fade-in slide-in-from-top-2 duration-200`}
                style={{
                  backgroundColor: themeStyle.isDark ? '#1e2329' : '#ffffff',
                  opacity: 1,
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none'
                }}
              >
                <div className={`px-4 py-3 border-b flex items-center justify-between bg-black/10 ${themeStyle.editorBorder}`}>
                  <span className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Version History</span>
                  <History size={12} className="opacity-40" />
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {myHistory.map((version, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (activeNoteId) {
                          setContent(version.body);
                          revertToHistory(activeNoteId, idx);
                        }
                        setDropdownOpen('none');
                      }}
                      className={`px-4 py-3 cursor-pointer transition-all border-b last:border-0 ${themeStyle.editorBorder} ${themeStyle.sidebarHover} group/hist`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold group-hover/hist:text-amber-500 transition-colors">
                          {idx === 0 ? 'Last Auto-Snapshot' : `Version ${idx + 1}`}
                        </span>
                        <span className="text-[9px] opacity-40 font-mono">
                          {new Date(version.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[10px] opacity-50 line-clamp-1 italic truncate">
                        {version.body.substring(0, 50).replace(/\n/g, ' ') || '(Empty content)'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-black/5">
                  <p className="text-[9px] opacity-40 leading-tight">Click to restore content. Snapshots are captured automatically when changes are detected.</p>
                </div>
              </div>
            )}
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
              <button onClick={() => setViewMode('edit')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'edit' ? 'bg-blue-600/20 text-blue-500' : ''}`}><PenTool size={14} /></button>
              <button onClick={() => setViewMode('split')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'split' ? 'bg-blue-600/20 text-blue-500' : ''}`}><Layout size={14} /></button>
              <button onClick={() => setViewMode('preview')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'preview' ? 'bg-blue-600/20 text-blue-500' : ''}`}><Eye size={14} /></button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default EditorToolbar;
