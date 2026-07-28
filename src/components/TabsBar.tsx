import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { FileText, CheckCircle2, X, Menu, Plus } from 'lucide-react';

const TabsBar = () => {
  const tabs = useStore((state) => state.tabs);
  const activeTabId = useStore((state) => state.activeTabId);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const closeTab = useStore((state) => state.closeTab);
  const themeName = useStore((state) => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  
  const createNote = useStore((state) => state.createNote);
  const notes = useStore((state) => state.notes);
  const activeNoteId = useStore((state) => state.activeNoteId);
  const setActiveNotebook = useStore((state) => state.setActiveNotebook);
  
  // Phase 6: Zen Mode
  const isSidebarCollapsed = useStore(state => state.isSidebarCollapsed);
  const isNoteListCollapsed = useStore(state => state.isNoteListCollapsed);
  const toggleZenMode = useStore(state => state.toggleZenMode);
  const isZenMode = isSidebarCollapsed && isNoteListCollapsed;

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    if (activeTabId && scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTabId]);

  const handleNewNote = () => {
    if (activeNoteId) {
      const activeNote = notes.find((n) => n.id === activeNoteId);
      if (activeNote && activeNote.notebookId) {
        setActiveNotebook(activeNote.notebookId);
      }
    }
    createNote();
  };

  if (tabs.length === 0) return null;

  return (
    <div 
      role="tablist"
      aria-label="Open Notes Tabs"
      className={`flex items-center h-10 border-b overflow-x-auto overflow-y-hidden select-none no-scrollbar glass relative z-40`}
      ref={scrollRef}
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Zen Mode Restore Button */}
      {isZenMode && (
        <div 
          className={`flex items-center justify-center h-full px-3 border-r cursor-pointer transition-all ${themeStyle.editorBorder} hover:bg-white/10 opacity-50 hover:opacity-100 flex-shrink-0 sticky left-0 z-50 no-drag`}
          onClick={toggleZenMode}
          title="Exit Zen Mode (Ctrl+Shift+Z)"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <Menu size={14} />
        </div>
      )}
      
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isNote = tab.type === 'note';
        
        return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 h-full px-3 min-w-32 max-w-48 border-r cursor-pointer transition-colors relative group no-drag border-[var(--glass-stroke)]
              ${isActive ? `bg-z-bg text-z-fg` : 'opacity-60 hover:opacity-100 bg-z-bg-1/40'}
            `}
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-z-accent shadow-[0_-2px_8px_var(--color-z-accent)] opacity-80"></div>
            )}
            
            <div className="flex-shrink-0 text-z-accent" aria-hidden="true">
              {isNote ? <FileText size={12} /> : <CheckCircle2 size={12} />}
            </div>
            
            <span className="text-[11px] font-medium truncate flex-1 tracking-wide">
              {tab.title || (isNote ? 'Untitled' : 'Tasks')}
            </span>
            
            <button 
              aria-label={`Close ${tab.title || (isNote ? 'Untitled' : 'Tasks')} tab`}
              className={`p-0.5 rounded-md hover:bg-white/10 transition-colors ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      {/* New Note Button (Zen Mode) */}
      {isZenMode && (
        <div
          className={`flex items-center justify-center h-full px-3 border-r cursor-pointer transition-colors opacity-60 hover:opacity-100 hover:bg-white/10 flex-shrink-0 no-drag ${themeStyle.editorBorder}`}
          onClick={handleNewNote}
          title="New Note in current notebook"
          style={{ WebkitAppRegion: 'no-drag' } as any}
        >
          <Plus size={14} />
        </div>
      )}
    </div>
  );
};

export default TabsBar;
