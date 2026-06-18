import { useState } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { 
  ChevronRight, Sparkles, Layout, Settings2, History, ChevronDown, 
  Check, Bell, Tag as TagIcon, Columns, LayoutList, Eye
} from 'lucide-react';

interface EditorToolbarProps {
  viewMode: 'split' | 'edit' | 'preview';
  setViewMode: (mode: 'split' | 'edit' | 'preview') => void;
}

type DropdownType = 'none' | 'notebook' | 'status' | 'tags' | 'reminder' | 'history' | 'assistant';

const EditorToolbar = ({ viewMode, setViewMode }: EditorToolbarProps) => {
  const [isRow2Open, setIsRow2Open] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<DropdownType>('none');
  const [tempReminder, setTempReminder] = useState<number | null>(null);

  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const activeTabId = useStore(state => state.activeTabId);
  const tabs = useStore(state => state.tabs);
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeNoteId = activeTab?.type === 'note' ? activeTab.noteId : null;

  const notes = useStore(state => state.notes);
  const notebooks = useStore(state => state.notebooks);
  const tags = useStore(state => state.tags);
  const noteTags = useStore(state => state.noteTags);
  const isAiPanelOpen = useStore(state => state.isAiPanelOpen);
  const toggleAiPanel = useStore(state => state.toggleAiPanel);
  const editorType = useStore(state => state.editorType);
  const setEditorType = useStore(state => state.setEditorType);
  const moveNote = useStore(state => state.moveNote);
  const noteHistory = useStore(state => state.noteHistory);
  const revertToHistory = useStore(state => state.revertToHistory);

  const activeNote = notes.find(n => n.id === activeNoteId);
  const notebook = notebooks.find(nb => nb.id === activeNote?.notebookId);
  const myHistory = activeNoteId ? (noteHistory[activeNoteId] || []) : [];

  if (!activeNote) return null;

  // Breadcrumbs
  let breadcrumb = notebook?.name || 'Uncategorized';
  if (notebook?.parentId) {
    const parent = notebooks.find(nb => nb.id === notebook.parentId);
    if (parent) breadcrumb = `${parent.name} / ${breadcrumb}`;
  }

  const myTags = noteTags.filter(nt => nt.noteId === activeNoteId).map(nt => tags.find(t => t.id === nt.tagId)).filter(Boolean) as any[];
  const hasReminder = !!activeNote.reminderAt;
  const statusColor = activeNote.status === 'active' ? 'bg-blue-500' :
                      activeNote.status === 'on-hold' ? 'bg-amber-500' :
                      activeNote.status === 'completed' ? 'bg-emerald-600' :
                      activeNote.status === 'dropped' ? 'bg-red-500' : null;

  return (
    <div className={`flex flex-col border-b relative z-[90] ${themeStyle.editorHeader} ${themeStyle.editorBorder}`}>
      {/* ROW 1: Minimalist Always Visible */}
      <div 
        className="h-10 flex items-center justify-between px-4 no-drag"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1.5 opacity-60 text-[11px] font-semibold tracking-wide" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <span>{breadcrumb}</span>
          <ChevronRight size={10} className="opacity-50" />
          <span className="opacity-70 truncate max-w-[150px]">{activeNote.title || 'Untitled'}</span>
        </div>

        {/* Right: Essential Tools */}
        <div className="flex items-center gap-1.5 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* View Mode Toggle */}
          <div className={`flex items-center p-0.5 rounded-lg border ${themeStyle.editorBorder} bg-black/5`}>
            {[
              { id: 'edit', icon: LayoutList, title: 'Edit Only' },
              { id: 'split', icon: Columns, title: 'Split View' },
              { id: 'preview', icon: Eye, title: 'Preview Only' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`p-1.5 rounded-md transition-all ${viewMode === mode.id ? 'bg-black/20 text-blue-400 shadow-sm' : `opacity-40 hover:opacity-100 ${themeStyle.sidebarHover}`}`}
                title={mode.title}
              >
                <mode.icon size={13} />
              </button>
            ))}
            <div className={`w-px h-3 mx-1 bg-white/10`} />
            <button
              onClick={() => setEditorType(editorType === 'raw' ? 'rich' : 'raw')}
              className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors ${editorType === 'raw' ? 'bg-blue-500/20 text-blue-400' : `opacity-40 hover:opacity-100 ${themeStyle.sidebarHover}`}`}
            >
              {editorType === 'raw' ? 'RAW' : 'RICH'}
            </button>
          </div>

          {/* AI Toggle */}
          <button
            onClick={() => toggleAiPanel()}
            className={`p-1.5 rounded-lg border transition-all ${isAiPanelOpen ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : `bg-black/5 opacity-50 hover:opacity-100 ${themeStyle.editorBorder}`}`}
            title="Toggle AI Assistant"
          >
            <Sparkles size={14} />
          </button>

          {/* Row 2 Toggle (Metadata & Tools) */}
          <button
            onClick={() => setIsRow2Open(!isRow2Open)}
            className={`p-1.5 rounded-lg border transition-all relative ${isRow2Open ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : `bg-black/5 opacity-50 hover:opacity-100 ${themeStyle.editorBorder}`}`}
            title="Note Properties"
          >
            <Settings2 size={14} />
            {/* Micro-Indicators */}
            <div className="absolute -top-1 -right-1 flex gap-0.5">
              {hasReminder && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              {statusColor && <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />}
              {myTags.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex items-center justify-center text-[6px] font-black text-white">{myTags.length}</span>}
            </div>
          </button>
        </div>
      </div>

      {/* ROW 2: Collapsible Properties Bar */}
      <div 
        className={`transition-all duration-200 ease-out ${isRow2Open ? 'overflow-visible' : 'overflow-hidden'}`}
        style={{ maxHeight: isRow2Open ? '48px' : '0px' }}
      >
        <div className={`h-12 flex items-center px-4 gap-3 border-t bg-black/5 ${themeStyle.editorBorder} text-[11px] font-medium`}>
          
          {/* Notebook */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(dropdownOpen === 'notebook' ? 'none' : 'notebook')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors border ${themeStyle.editorBorder}`}
            >
              <Layout size={12} className="opacity-50" />
              <span>{breadcrumb.split('/').pop()?.trim()}</span>
              <ChevronDown size={10} className="opacity-40" />
            </button>
            {dropdownOpen === 'notebook' && (
              <div className={`absolute top-full left-0 mt-1 w-48 rounded-lg shadow-xl border z-[100] ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder} max-h-48 overflow-y-auto`}>
                {notebooks.map(nb => (
                  <div key={nb.id} onClick={() => { moveNote(activeNote.id, nb.id); setDropdownOpen('none'); }} className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between ${themeStyle.sidebarHover}`}>
                    <span>{nb.name}</span>
                    {activeNote.notebookId === nb.id && <Check size={12} className="text-blue-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(dropdownOpen === 'status' ? 'none' : 'status')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors border ${themeStyle.editorBorder}`}
            >
              {statusColor ? <div className={`w-2 h-2 rounded-full ${statusColor}`} /> : <div className="w-2 h-2 rounded-full border border-gray-400" />}
              <span className="capitalize">{activeNote.status !== 'none' ? activeNote.status : 'No Status'}</span>
              <ChevronDown size={10} className="opacity-40" />
            </button>
            {dropdownOpen === 'status' && (
              <div className={`absolute top-full left-0 mt-1 w-40 rounded-lg shadow-xl border z-[100] p-1 ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder}`}>
                {['none', 'active', 'on-hold', 'completed', 'dropped'].map(s => (
                  <div key={s} onClick={() => { useStore.getState().updateNoteStatus(activeNoteId!, s); setDropdownOpen('none'); }} className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 rounded-md ${themeStyle.sidebarHover}`}>
                    {s !== 'none' ? <div className={`w-2 h-2 rounded-full ${s === 'active' ? 'bg-blue-500' : s === 'on-hold' ? 'bg-amber-500' : s === 'completed' ? 'bg-emerald-600' : 'bg-red-500'}`} /> : <div className="w-2 h-2 rounded-full border border-gray-400" />}
                    <span className="capitalize">{s}</span>
                    {activeNote.status === s && <Check size={12} className="ml-auto text-blue-500" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(dropdownOpen === 'tags' ? 'none' : 'tags')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors border ${themeStyle.editorBorder}`}
            >
              <TagIcon size={12} className="opacity-50" />
              <span>{myTags.length > 0 ? `${myTags.length} Tags` : 'Add Tag'}</span>
              <ChevronDown size={10} className="opacity-40" />
            </button>
            {dropdownOpen === 'tags' && (
              <div className={`absolute top-full left-0 mt-1 w-56 rounded-lg shadow-xl border z-[100] p-2 ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder}`}>
                <div className="max-h-48 overflow-y-auto">
                  {tags.map(tag => {
                    const isSelected = noteTags.some(nt => nt.noteId === activeNoteId && nt.tagId === tag.id);
                    return (
                      <div key={tag.id} onClick={() => useStore.getState().toggleNoteTag(activeNoteId!, tag.id)} className={`px-2 py-1.5 cursor-pointer transition-colors flex items-center gap-2 rounded-md ${themeStyle.sidebarHover}`}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="flex-1 truncate">{tag.name}</span>
                        {isSelected && <Check size={12} className="text-blue-500" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reminder */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(dropdownOpen === 'reminder' ? 'none' : 'reminder')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors border ${hasReminder ? `bg-amber-500/20 text-amber-500 border-amber-500/30` : `bg-white/5 hover:bg-white/10 ${themeStyle.editorBorder}`}`}
            >
              <Bell size={12} className={hasReminder ? '' : 'opacity-50'} />
              <span>{hasReminder ? new Date(activeNote.reminderAt!).toLocaleDateString() : 'Set Reminder'}</span>
            </button>
            {dropdownOpen === 'reminder' && (
              <div className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-xl border z-[100] p-3 ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder}`}>
                <div className={`text-[10px] uppercase font-bold opacity-60 mb-2`}>Set Reminder Date</div>
                <input 
                  type="datetime-local" 
                  className={`w-full bg-black/20 border rounded px-2 py-1 mb-2 text-xs focus:outline-none ${themeStyle.editorBorder}`}
                  onChange={(e) => {
                    const [datePart, timePart] = e.target.value.split('T');
                    if (datePart && timePart) {
                      const dt = new Date(`${datePart}T${timePart}`);
                      setTempReminder(dt.getTime());
                    }
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={() => { if (tempReminder) { useStore.getState().updateNoteReminder(activeNoteId!, tempReminder); setDropdownOpen('none'); } }} className="flex-1 bg-amber-500 text-white rounded py-1 font-bold transition-all hover:bg-amber-400 active:scale-95">Save</button>
                  {hasReminder && <button onClick={() => { useStore.getState().updateNoteReminder(activeNoteId!, null); setDropdownOpen('none'); }} className="flex-1 bg-red-500 text-white rounded py-1 font-bold transition-all hover:bg-red-400 active:scale-95">Clear</button>}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* History */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(dropdownOpen === 'history' ? 'none' : 'history')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors border ${themeStyle.editorBorder} opacity-70 hover:opacity-100`}
            >
              <History size={12} />
              <span>History</span>
              {myHistory.length > 0 && <span className="text-[9px] bg-white/10 px-1 rounded">{myHistory.length}</span>}
            </button>
            {dropdownOpen === 'history' && (
              <div className={`absolute top-full right-0 mt-1 w-64 rounded-lg shadow-xl border z-[100] p-2 ${themeStyle.dropdownBg} ${themeStyle.dropdownText} ${themeStyle.editorBorder} max-h-48 overflow-y-auto`}>
                <div className="text-[10px] uppercase font-bold opacity-60 mb-2 px-1">Version History</div>
                {myHistory.length === 0 ? (
                  <div className="text-xs opacity-50 px-1 pb-1">No history available yet.</div>
                ) : (
                  myHistory.map((h: any) => (
                    <div key={h.timestamp} onClick={() => { revertToHistory(activeNoteId!, h.timestamp); setDropdownOpen('none'); }} className={`px-2 py-1.5 cursor-pointer transition-colors flex items-center justify-between rounded-md ${themeStyle.sidebarHover}`}>
                      <span className="text-xs truncate mr-2">{new Date(h.timestamp).toLocaleString()}</span>
                      <History size={12} className="opacity-40" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
