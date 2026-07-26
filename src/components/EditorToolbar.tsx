import { useState } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { 
  ChevronRight, Sparkles, LayoutList, Columns, Eye, Settings2, Pin 
} from 'lucide-react';
import { 
  NotebookDropdown, StatusDropdown, TagsDropdown, ReminderDropdown, HistoryDropdown 
} from './EditorToolbarDropdowns';

interface EditorToolbarProps {
  viewMode: 'split' | 'edit' | 'preview';
  setViewMode: (mode: 'split' | 'edit' | 'preview') => void;
}

type DropdownType = 'none' | 'notebook' | 'status' | 'tags' | 'reminder' | 'history' | 'assistant';



const EditorToolbar = ({ viewMode, setViewMode }: EditorToolbarProps) => {
  const [isRow2Open, setIsRow2Open] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState<DropdownType>('none');

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
                aria-label={mode.title}
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
            aria-label="Toggle AI Assistant"
          >
            <Sparkles size={14} />
          </button>

          {/* Pin Toggle */}
          <button
            onClick={() => {
              if (activeNote) {
                useStore.getState().updateNoteIsPinned(activeNoteId, !activeNote.isPinned);
              }
            }}
            className={`p-1.5 rounded-lg border transition-all ${activeNote.isPinned ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : `bg-black/5 opacity-50 hover:opacity-100 ${themeStyle.editorBorder}`}`}
            title={activeNote.isPinned ? "Unpin Note" : "Pin Note"}
            aria-label={activeNote.isPinned ? "Unpin Note" : "Pin Note"}
          >
            <Pin size={14} className={activeNote.isPinned ? 'fill-amber-500/20' : ''} />
          </button>

          {/* Row 2 Toggle (Metadata & Tools) */}
          <button
            onClick={() => setIsRow2Open(!isRow2Open)}
            className={`p-1.5 rounded-lg border transition-all relative ${isRow2Open ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : `bg-black/5 opacity-50 hover:opacity-100 ${themeStyle.editorBorder}`}`}
            title="Toggle Properties Bar"
            aria-label="Toggle Properties Bar"
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
          
          <NotebookDropdown activeNote={activeNote} breadcrumb={breadcrumb} dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} themeStyle={themeStyle} moveNote={moveNote} />
          <StatusDropdown activeNote={activeNote} activeNoteId={activeNoteId} statusColor={statusColor} dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} themeStyle={themeStyle} />
          <TagsDropdown activeNoteId={activeNoteId} myTags={myTags} dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} themeStyle={themeStyle} />
          <ReminderDropdown activeNote={activeNote} activeNoteId={activeNoteId} hasReminder={hasReminder} dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} themeStyle={themeStyle} />

          <div className="flex-1" />

          <HistoryDropdown activeNoteId={activeNoteId} myHistory={myHistory} dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} themeStyle={themeStyle} revertToHistory={revertToHistory} />

        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
