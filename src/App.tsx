import { useEffect, useState, useRef, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { X, Bell } from 'lucide-react';
import Sidebar from './components/Sidebar';
import NoteList from './components/NoteList';
import Editor from './components/Editor';
import CommandPalette from './components/CommandPalette';
import WelcomeScreen from './components/WelcomeScreen';
import HelpOverlay from './components/HelpOverlay';
import AboutModal from './components/AboutModal';
import SyncSettingsModal from './components/SyncSettingsModal';
import { TemplatesManagerModal } from './components/TemplatesManagerModal';
import NotebookContextModal from './components/NotebookContextModal';
import LoginScreen from './components/LoginScreen';
import dbAPI from './services/db';
import { useStore } from './store';
import { THEMES } from './themes';
import { Toaster } from 'react-hot-toast';

const isLightColor = (hex: string) => {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

const App = () => {
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
  
  // Apply dark mode class to html element
  useEffect(() => {
    if (themeStyle.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeStyle.isDark]);
  
  // Auto-sync Watchdog (DISABLED per user request)
  useEffect(() => {
    // Solo mantenemos el listener del progreso para la UI
    if (dbAPI.onGithubProgress) {
      dbAPI.onGithubProgress((data: any) => {
        useStore.getState().setSyncProgress(data);
      });
    }
  }, []);

  useEffect(() => {
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
  }, [sidebarWidth]);

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
          
          // Auto-dismiss after 10 seconds
          setTimeout(() => setActiveAlert(null), 10000);
          
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
        // Guard: only create note if notebooks are loaded
        if (useStore.getState().notebooks.length > 0) {
          useStore.getState().createNote();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        useStore.getState().toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        useStore.getState().toggleAiPanel();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        useStore.getState().openDailyNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        useStore.getState().openMeetingNote();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        useStore.getState().toggleZenMode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        useStore.getState().setSearchPanelOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        useStore.getState().setSearchPanelOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const customColors = useStore(state => state.customColors);
  const isCustomMenuOpen = useStore(state => state.isCustomMenuOpen);

  // --- Auth Integration ---
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    import('./services/auth').then(({ subscribeToAuthChanges }) => {
      const unsub = subscribeToAuthChanges((u) => {
        setUser(u);
        setAuthChecked(true);
        if (u) {
          useStore.getState().loadInitialData().catch(e => console.error(e));
        }
      });
      return unsub;
    });
  }, []);

  if (!authChecked) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>;
  }

  if (!user) {
    // Requires importing LoginScreen - we'll do it via lazy or require to avoid changing the top level imports just for this block, actually let's just inline a require since we are hacking it, wait, Vite doesn't like require. I will add the import at the top of the file in a separate replace_file_content call, and here I'll just render it if available, but for now I'll return it directly assuming the import exists.
    return (
      <LoginScreen onLogin={(u) => setUser(u)} />
    );
  }

  return (
    <div id="app-root-container" className={`flex h-screen w-screen overflow-hidden font-sans selection:bg-blue-500/30 relative rounded-[20px] border border-white/5 ${themeStyle.sidebarBg} print:!bg-white`}>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e2329',
            color: '#e2e8f0',
            border: '1px solid #334155'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }} 
      />
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
        className={`flex-shrink-0 flex flex-col h-full relative max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-2xl ${isCustomMenuOpen ? 'z-[100]' : 'z-[50]'} ${(isCustomMenuOpen && !isSidebarCollapsed) ? '' : 'overflow-hidden'} transition-all duration-300 ease-in-out print:hidden`}
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
        style={{ 
          width: isNoteListCollapsed ? 0 : noteListWidth,
          transform: (window.innerWidth <= 768 && !isSidebarCollapsed) ? `translateX(${sidebarWidth}px)` : 'none'
        }} 
        className={`flex-shrink-0 flex flex-col h-full relative max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-xl z-40 overflow-hidden transition-all duration-300 ease-in-out print:hidden`}
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

      {/* Global Window Controls (Removed for Web) */}

      {/* Overlays at the end of DOM for better event handling */}
      <WelcomeScreen />
      <HelpOverlay />
      <AboutModal />
      <CommandPalette />
      <SyncSettingsModal isOpen={isSyncModalOpen} onClose={() => setSyncModalOpen(false)} />
      <NotebookContextModal />
      <TemplatesManagerModal />
    </div>
  );
};

export default App;

// Error Boundary to prevent unhandled React errors from crashing the Electron window
class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[M3Flow ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui', color: '#e2e8f0', backgroundColor: '#1a1b26', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16, color: '#f87171' }}>⚠️ M3Flow encountered an error</h1>
          <pre style={{ fontSize: 12, color: '#94a3b8', maxWidth: 600, overflow: 'auto', padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
            {this.state.error?.message}\n{this.state.error?.stack}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); }}
            style={{ marginTop: 20, padding: '10px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}
          >
            Try to Recover
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export { AppErrorBoundary };
