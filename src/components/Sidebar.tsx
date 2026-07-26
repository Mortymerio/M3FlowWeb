import { useState } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { ChevronRight, Settings, Plus, LayoutDashboard, Cloud, AlertCircle, CheckCircle2, Loader2 as SpinnerIcon, CalendarDays, Users, FileText, Trash2 } from 'lucide-react';
import { NotebookNode } from './NotebookTree';
import { ThemeSelector } from './ThemeSelector';

const Sidebar = () => {
  const notebooks = useStore(state => state.notebooks);
  const notes = useStore(state => state.notes);
  const tags = useStore(state => state.tags);
  const noteTags = useStore(state => state.noteTags);
  const activeNotebookId = useStore(state => state.activeNotebookId);
  const activeStatusId = useStore(state => state.activeStatusId);
  const activeTagId = useStore(state => state.activeTagId);
  const setActiveNotebook = useStore(state => state.setActiveNotebook);
  const themeName = useStore(state => state.theme);
  const editorMode = useStore(state => state.editorMode);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  
  const [expanded, setExpanded] = useState<Set<string>>(new Set(notebooks.map(nb => nb.id)));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(true);
  const setSyncModalOpen = useStore(state => state.setSyncModalOpen);
  
  const syncStatus = useStore(state => state.syncStatus);
  const syncProgress = useStore(state => state.syncProgress);
  const hasUnsyncedChanges = useStore(state => state.hasUnsyncedChanges);

  const rootNotebooks = notebooks.filter(nb => !nb.parentId);

  const getStatusCount = (status: string) => notes.filter(n => n.status === status).length;

  return (
    <div className={`flex-1 flex flex-col h-full font-sans relative pb-[90px] border-r rounded-l-xl ${themeStyle.sidebarBg} ${themeStyle.sidebarText} ${themeStyle.sidebarBorder}`} style={{ WebkitAppRegion: 'drag' } as any} onClick={() => setSettingsOpen(false)}>
      {/* Logo at the very top */}
      <div className={`px-4 pt-4 pb-1 flex items-center justify-between no-drag ${themeStyle.sidebarHeader}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg border border-white/10">
            <img src="./icon.png" alt="M3Flow Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-lg tracking-tighter opacity-90">M3Flow</span>
        </div>
        <div className="relative">
            <button aria-label="Settings" onClick={(e) => { e.stopPropagation(); setSettingsOpen(!settingsOpen); }} className="opacity-50 hover:opacity-100 transition-opacity p-1"><Settings size={14} /></button>
            {settingsOpen && (
              <div className={`absolute top-6 right-0 w-48 rounded-md shadow-2xl border overflow-hidden z-50 ${themeStyle.sidebarBg} ${themeStyle.sidebarBorder}`}>
               <div className={`px-3 py-2 text-[10px] uppercase font-bold border-b opacity-60 ${themeStyle.sidebarBorder}`}>General Settings</div>
               <div className="max-h-48 overflow-y-auto">
                 <div onClick={() => { setSettingsOpen(false); useStore.getState().setTemplatesModalOpen(true); }} className={`px-3 py-2 cursor-pointer text-xs transition-colors ${themeStyle.sidebarHover} flex items-center gap-2`}>
                   <FileText size={14} /> Templates
                 </div>
                 <div onClick={() => { setSettingsOpen(false); useStore.getState().setShowAboutModal(true); }} className={`px-3 py-2 cursor-pointer text-xs transition-colors ${themeStyle.sidebarHover}`}>
                   About
                 </div>
               </div>
             </div>
           )}
         </div>
      </div>

      <div className="px-3 pt-2 pb-2 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>

        <div 
          onClick={() => { setActiveNotebook(null); useStore.getState().setActiveStatus(null); useStore.getState().setActiveTag(null); }}
          className={`px-3 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors
            ${!activeNotebookId && !activeStatusId && !activeTagId ? themeStyle.sidebarActive : themeStyle.sidebarHover}
          `}
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard size={14} />
            <span className="text-[13px] font-medium">All Notes</span>
          </div>
          <span className="text-[10px] opacity-60 group-hover:block">{notes.length}</span>
        </div>

        {/* Daily Note Button */}
        <div 
          onClick={() => useStore.getState().openDailyNote()}
          className={`px-3 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors group mt-1 ${themeStyle.sidebarHover}`}
          title="Open today's daily note (Ctrl+D)"
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-amber-500" />
            <span className="text-[13px] font-medium">Today</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/20 tabular-nums">
            {new Date().getDate()}
          </span>
        </div>

        {/* Meeting Note Button */}
        <div 
          onClick={() => useStore.getState().openMeetingNote()}
          className={`px-3 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors group mt-1 ${themeStyle.sidebarHover}`}
          title="Create meeting notes (Ctrl+M)"
        >
          <div className="flex items-center gap-2">
            <Users size={14} className="text-purple-400" />
            <span className="text-[13px] font-medium">Meeting</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
            New
          </span>
        </div>

        {/* Tasks Button */}
        <div 
          onClick={() => useStore.getState().openTab({ type: 'tasks', title: 'Tasks' })}
          className={`px-3 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors group mt-1 ${themeStyle.sidebarHover}`}
          title="Open Tasks Dashboard"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-[13px] font-medium">Tasks</span>
          </div>
        </div>
      </div>

      {/* Notebooks Section */}
      <div className="px-3 flex-1 overflow-y-auto no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="text-[11px] font-semibold uppercase tracking-wider mt-4 mb-2 px-1 flex justify-between items-center opacity-100"
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => {
               e.preventDefault();
               const notebookId = e.dataTransfer.getData('notebookId');
               if (notebookId) useStore.getState().moveNotebook(notebookId, null);
             }}>
          <span className="flex items-center gap-2 opacity-60"><LayoutDashboard size={14}/> Notebooks</span>
          <button 
            className={`transition-all rounded-md p-1 ${themeStyle.sidebarHover} hover:text-blue-500 text-blue-500 bg-blue-500/10 shadow-sm`}
            title="New Folder"
            aria-label="New Folder"
            onClick={(e) => {
              e.stopPropagation();
              useStore.getState().createNotebook('New Folder', null);
            }}
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
        
        <ul className="space-y-0.5">
          {rootNotebooks.map(nb => (
            <NotebookNode 
              key={nb.id}
              notebook={nb}
              notebooks={notebooks}
              depth={0}
              expanded={expanded}
              setExpanded={setExpanded}
              activeNotebookId={activeNotebookId}
              setActiveNotebook={setActiveNotebook}
              themeStyle={themeStyle}
            />
          ))}
        </ul>

        <div className="mt-4 border-t border-white/5 pt-2">
          <div
            onClick={() => setActiveNotebook('trash')}
            className={`flex items-center gap-2 px-1 py-1.5 cursor-pointer rounded-md transition-colors text-[13px] font-medium
              ${activeNotebookId === 'trash' ? 'bg-red-500/20 text-red-400 font-bold' : `opacity-60 hover:opacity-100 ${themeStyle.sidebarHover} hover:text-red-400`}
            `}
          >
            <Trash2 size={14} />
            <span>Trash</span>
          </div>
        </div>

        {/* Sección de FILTROS — Collapsible */}
        <div className="mt-6">
          {/* Status — Collapsible */}
          <div className="mb-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`w-full px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] opacity-50 hover:opacity-80 flex items-center justify-between rounded-md transition-all ${themeStyle.sidebarHover}`}
            >
              <span className="flex items-center gap-1.5">STATUS</span>
              <ChevronRight size={12} className={`transition-transform duration-200 ${filtersOpen ? 'rotate-90' : ''}`} />
            </button>
            {filtersOpen && (
              <div className="flex flex-col gap-0.5 text-[13px] font-medium mt-1">
                {['none', 'active', 'on-hold', 'completed', 'dropped'].map(status => {
                   const isActive = activeStatusId === status;
                   const label = status === 'none' ? 'None' : status === 'active' ? 'Active' : status === 'on-hold' ? 'On Hold' : status === 'completed' ? 'Completed' : 'Dropped';
                   const icon = status === 'none' ? <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-400"></span> :
                                status === 'active' ? <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></span> :
                                status === 'on-hold' ? <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></span> :
                                status === 'completed' ? <div className="w-3 h-3 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white">✓</div> :
                                <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-[8px] text-white">×</div>;
                   return (
                      <div key={status} onClick={() => useStore.getState().setActiveStatus(isActive ? null : status)} className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${isActive ? themeStyle.sidebarActive : themeStyle.sidebarHover}`}>
                        <div className="flex items-center gap-3">{icon} {label}</div>
                        {status !== 'none' && <span className="text-[10px] opacity-60 tracking-tight">{getStatusCount(status)}</span>}
                      </div>
                   );
                })}
              </div>
            )}
          </div>

          {/* Tags — Collapsible */}
          <div className="mb-4">
            <button
              onClick={() => setTagsOpen(!tagsOpen)}
              className={`w-full px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] opacity-50 hover:opacity-80 flex items-center justify-between rounded-md transition-all ${themeStyle.sidebarHover}`}
            >
              <span className="flex items-center gap-1.5">TAGS <span className="text-[9px] font-normal opacity-60">{tags.length}</span></span>
              <ChevronRight size={12} className={`transition-transform duration-200 ${tagsOpen ? 'rotate-90' : ''}`} />
            </button>
            {tagsOpen && (
              <div className="flex flex-col gap-0.5 text-[13px] font-medium mt-1">
                {tags.map(tag => {
                  const isActive = activeTagId === tag.id;
                  const count = noteTags.filter(nt => nt.tagId === tag.id).length;
                  return (
                    <div 
                      key={tag.id} 
                      onClick={() => useStore.getState().setActiveTag(isActive ? null : tag.id)}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${isActive ? themeStyle.sidebarActive : themeStyle.sidebarHover}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }}></div>
                        <span className="truncate opacity-80">{tag.name}</span>
                      </div>
                      <span className="text-[10px] opacity-60 flex-shrink-0">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Area (Sync + Prefs) */}
      <div className={`absolute bottom-0 w-full z-10 border-t rounded-bl-xl flex flex-col ${themeStyle.sidebarBg} ${themeStyle.sidebarBorder} no-drag`} style={{ WebkitAppRegion: 'no-drag' } as any}>
        
        {/* Sync Status — Compact Row */}
        <div className="px-3 py-2">
          <div 
            onClick={() => setSyncModalOpen(true)}
            className={`relative overflow-hidden cursor-pointer rounded-lg border px-3 py-2 flex items-center justify-between gap-2 transition-all hover:shadow-md ${themeStyle.sidebarBorder} ${themeStyle.sidebarHover}`}
          >
            {syncStatus === 'syncing' && syncProgress && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-blue-500/10 transition-all duration-300"
                style={{ width: `${syncProgress.current}%` }}
              />
            )}
            <div className="relative flex items-center gap-2 z-10">
              {syncStatus === 'syncing' ? (
                <SpinnerIcon size={14} className="animate-spin text-blue-500" />
              ) : syncStatus === 'error' ? (
                <AlertCircle size={14} className="text-red-500" />
              ) : hasUnsyncedChanges ? (
                <Cloud size={14} className="text-amber-500" />
              ) : (
                <CheckCircle2 size={14} className="text-green-500" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'error' ? 'Error' : hasUnsyncedChanges ? 'Pending' : 'Synced'}
              </span>
            </div>
            {syncStatus === 'syncing' && syncProgress && (
              <span className="relative z-10 text-[10px] font-bold text-blue-400">{Math.round(syncProgress.current)}%</span>
            )}
          </div>
        </div>

        {/* Preferencias Globales (Keybindings & Theme) */}
        <div className="pt-1 pb-3 px-4 flex items-center justify-between gap-1">
        <select 
          value={editorMode} 
          onChange={(e) => useStore.getState().setEditorMode(e.target.value as any)}
          className={`bg-transparent text-[10px] uppercase font-bold focus:outline-none cursor-pointer opacity-70 hover:opacity-100 transition-opacity w-16 ${themeStyle.sidebarText}`}
        >
          <option value="normal" className="bg-[#1b1c28] text-white">NORM</option>
          <option value="vim" className="bg-[#1b1c28] text-white">VIM</option>
          <option value="emacs" className="bg-[#1b1c28] text-white">EMAC</option>
        </select>
        
        <ThemeSelector themeStyle={themeStyle} />

        <button 
          onClick={() => useStore.getState().setShowHelpOverlay(true)}
          className={`text-[10px] uppercase font-bold opacity-70 hover:opacity-100 transition-opacity border rounded px-1.5 py-0.5 ${themeStyle.sidebarBorder} ${themeStyle.sidebarText}`}
        >
          Help
        </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
