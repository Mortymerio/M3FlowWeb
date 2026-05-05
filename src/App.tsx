import { useEffect, useState, useRef } from 'react';
import { Minus, Square, X, Bell } from 'lucide-react';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import Editor from './components/Editor';
import CommandPalette from './components/CommandPalette';
import WelcomeScreen from './components/WelcomeScreen';
import HelpOverlay from './components/HelpOverlay';
import AboutModal from './components/AboutModal';
import SyncSettingsModal from './components/SyncSettingsModal';
import NotebookContextModal from './components/NotebookContextModal';
import { useStore } from './store';
import { THEMES } from './themes';

const isLightColor = (hex: string) => {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

const App = () => {
  const loadInitialData = useStore(state => state.loadInitialData);
  const isFallbackMode = useStore(state => state.isFallbackMode);
  const isBrowserMode = useStore(state => state.isBrowserMode);
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['cyber-ronin'];
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [noteListWidth, setNoteListWidth] = useState(300);

  const isSidebarCollapsed = useStore(state => state.isSidebarCollapsed);
  const isNoteListCollapsed = useStore(state => state.isNoteListCollapsed);
  const isResizingSidebar = useRef(false);
  const isResizingNoteList = useRef(false);

  const isSyncModalOpen = useStore(state => state.isSyncModalOpen);
  const setSyncModalOpen = useStore(state => state.setSyncModalOpen);
  
  // Auto-sync Watchdog (DISABLED per user request)
  useEffect(() => {
    // Solo mantenemos el listener del progreso para la UI
    const dbAPI = (window as any).dbAPI;
    if (dbAPI?.onGithubProgress) {
      dbAPI.onGithubProgress((data: any) => {
        useStore.getState().setSyncProgress(data);
      });
    }
  }, []);

  useEffect(() => {
    loadInitialData().catch(_e => {
      console.error('[App] Error:', _e);
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar.current) {
        let newWidth = e.clientX;
        if (newWidth < 100) newWidth = 0; // colapsar
        if (newWidth > 400) newWidth = 400;
        setSidebarWidth(newWidth);
      } else if (isResizingNoteList.current) {
        let newWidth = e.clientX - sidebarWidth;
        if (newWidth < 150) newWidth = 0; // colapsar
        if (newWidth > 600) newWidth = 600;
        setNoteListWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingSidebar.current = false;
      isResizingNoteList.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [loadInitialData, sidebarWidth]);

  // Recordatorios (Alert System Watchdog)
  const triggeredReminders = useRef<Set<string>>(new Set());
  const [activeAlert, setActiveAlert] = useState<string | null>(null); // Title of the active alert

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      const currentNotes = useStore.getState().notes;
      currentNotes.forEach(note => {
        if (note.reminderAt && now >= note.reminderAt && !triggeredReminders.current.has(note.id)) {
          // Trigger Alert!
          setActiveAlert(note.title);
          triggeredReminders.current.add(note.id);
          
          // Native notification if possible
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
             new Notification('M3Flow Reminder', { body: note.title });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10s for better accuracy
    checkReminders(); // Initial check

    // Request permissions
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearInterval(interval);
  }, []); // Re-run only once on mount

  // Global Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        useStore.getState().createNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        useStore.getState().toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const customColors = useStore(state => state.customColors);
  const isCustomMenuOpen = useStore(state => state.isCustomMenuOpen);

  return (
    <div id="app-root-container" className={`flex h-screen w-screen overflow-hidden font-sans selection:bg-blue-500/30 relative rounded-[20px] border border-white/5 ${themeStyle.sidebarBg} print:!bg-white`}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --custom-sidebar-bg: ${customColors.sidebarBg};
          --custom-sidebar-header: ${customColors.sidebarHeader};
          --custom-list-bg: ${customColors.listBg};
          --custom-list-header: ${customColors.listHeader};
          --custom-editor-bg: ${customColors.editorBg};
          --custom-editor-header: ${customColors.editorHeader};
          --custom-preview-bg: ${customColors.previewBg};
          
          --custom-sidebar-text: ${isLightColor(customColors.sidebarBg) ? '#1e293b' : '#cbd5e1'};
          --custom-list-text: ${isLightColor(customColors.listBg) ? '#1e293b' : '#cbd5e1'};
          --custom-editor-text: ${isLightColor(customColors.editorBg) ? '#1e293b' : '#cbd5e1'};
        }
      `}} />

      {/* Panel 1: Sidebar */}
      <div 
        id="sidebar-panel"
        style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }} 
        className={`flex-shrink-0 flex flex-col h-full relative ${isCustomMenuOpen ? 'z-[100]' : 'z-[10]'} ${(isCustomMenuOpen && !isSidebarCollapsed) ? '' : 'overflow-hidden'} transition-all duration-300 ease-in-out print:hidden`}
      >
        <div style={{ width: sidebarWidth }} className="h-full">
          <Sidebar />
        </div>
        {/* Splitter */}
        {!isSidebarCollapsed && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-50 no-drag"
            style={{ WebkitAppRegion: 'no-drag' } as any}
            onMouseDown={() => { isResizingSidebar.current = true; document.body.style.cursor = 'col-resize'; }}
          />
        )}
      </div>

      {/* Panel 2: Lista de notas */}
      <div 
        id="notelist-panel"
        style={{ width: isNoteListCollapsed ? 0 : noteListWidth }} 
        className={`flex-shrink-0 flex flex-col h-full relative z-20 overflow-hidden transition-all duration-300 ease-in-out print:hidden`}
      >
        <div style={{ width: noteListWidth }} className="h-full">
          <NoteList />
        </div>
        {/* Splitter */}
        {!isNoteListCollapsed && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 z-50 no-drag"
            style={{ WebkitAppRegion: 'no-drag' } as any}
            onMouseDown={() => { isResizingNoteList.current = true; document.body.style.cursor = 'col-resize'; }}
          />
        )}
      </div>

      {/* Panel 3: Editor y Preview */}
      <div className="flex-1 min-w-0 flex flex-col relative z-0 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]">
        <Editor />
      </div>

      {/* Global Alert Toast */}
      {activeAlert && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-[999999] flex items-center gap-4 animate-alert-in">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
            <Bell size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold opacity-60">Recordatorio</p>
            <p className="font-bold">{activeAlert}</p>
          </div>
          <button onClick={() => setActiveAlert(null)} className="ml-4 p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Survival Indicators */}
      {(isFallbackMode || isBrowserMode) && (
        <div className="fixed top-12 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
          {isFallbackMode && (
             <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/50 text-amber-500 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse">
               Survival Mode: Local DB
             </div>
          )}
          {isBrowserMode && (
             <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-500 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest animate-pulse">
               Web Bridge: RAM Mode
             </div>
          )}
        </div>
      )}

      {/* Global Window Controls (Windows Style, Premium Rounded) */}
      <div className="absolute top-0 right-0 h-10 flex items-center gap-0.5 z-[999999] px-3 pointer-events-auto no-drag print:hidden" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className={`flex items-center gap-0.5 backdrop-blur-2xl rounded-full border p-1 shadow-2xl ${themeStyle.isDark !== false ? 'bg-white/10 border-white/20' : 'bg-black/5 border-black/10'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); (window as any).dbAPI.minimizeApp(); }} 
            className={`w-7 h-7 rounded-full transition-all flex items-center justify-center group ${themeStyle.isDark !== false ? 'text-white/80 hover:bg-white/25 hover:text-white' : 'text-black/60 hover:bg-black/15 hover:text-black'}`}
          >
            <Minus size={14} className="group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); (window as any).dbAPI.maximizeApp(); }} 
            className={`w-7 h-7 rounded-full transition-all flex items-center justify-center group ${themeStyle.isDark !== false ? 'text-white/80 hover:bg-white/25 hover:text-white' : 'text-black/60 hover:bg-black/15 hover:text-black'}`}
          >
            <Square size={10} className="group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); (window as any).dbAPI.closeApp(); }} 
            className="w-7 h-7 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg flex items-center justify-center text-red-400 group"
          >
            <X size={14} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Overlays at the end of DOM for better event handling */}
      <WelcomeScreen />
      <HelpOverlay />
      <AboutModal />
      <CommandPalette />
      <SyncSettingsModal isOpen={isSyncModalOpen} onClose={() => setSyncModalOpen(false)} />
      <NotebookContextModal />
    </div>
  );
};

export default App;
