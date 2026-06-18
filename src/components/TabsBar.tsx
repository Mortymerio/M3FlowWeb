import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { FileText, CheckCircle2, X, Menu } from 'lucide-react';

const TabsBar = () => {
  const tabs = useStore((state) => state.tabs);
  const activeTabId = useStore((state) => state.activeTabId);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const closeTab = useStore((state) => state.closeTab);
  const themeName = useStore((state) => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  
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

  if (tabs.length === 0) return null;

  return (
    <div 
      className={`flex items-center h-9 border-b overflow-x-auto overflow-y-hidden select-none no-scrollbar ${themeStyle.editorBg} ${themeStyle.editorBorder} relative z-40`}
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
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 h-full px-3 min-w-32 max-w-48 border-r cursor-pointer transition-colors relative group no-drag
              ${themeStyle.editorBorder}
              ${isActive ? `${themeStyle.editorBg} text-white` : 'opacity-60 hover:opacity-100 bg-black/10'}
            `}
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-500 shadow-[0_-2px_8px_rgba(245,158,11,0.5)]"></div>
            )}
            
            <div className="flex-shrink-0 text-amber-500">
              {isNote ? <FileText size={12} /> : <CheckCircle2 size={12} />}
            </div>
            
            <span className="text-[11px] font-medium truncate flex-1 tracking-wide">
              {tab.title || (isNote ? 'Untitled' : 'Tasks')}
            </span>
            
            <div 
              className={`p-0.5 rounded-md hover:bg-white/10 transition-colors ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            >
              <X size={12} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TabsBar;
