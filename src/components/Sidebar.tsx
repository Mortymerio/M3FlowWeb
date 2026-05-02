import { useState } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { ChevronRight, ChevronDown, Settings, Plus, LayoutDashboard, Download, Trash2, Palette, Paintbrush, Cloud, AlertCircle, CheckCircle2, Loader2 as SpinnerIcon } from 'lucide-react';

const NotebookNode = ({ notebook, notebooks, depth, expanded, setExpanded, activeNotebookId, setActiveNotebook, themeStyle }: any) => {
  const children = notebooks.filter((nb: any) => nb.parentId === notebook.id);
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(notebook.id);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(notebook.id)) next.delete(notebook.id);
      else next.add(notebook.id);
      return next;
    });
  };

  return (
    <>
      <li 
        onClick={() => setActiveNotebook(notebook.id)}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('notebookId', notebook.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const droppedNotebookId = e.dataTransfer.getData('notebookId');
          const droppedNoteId = e.dataTransfer.getData('noteId');
          
          if (droppedNotebookId && droppedNotebookId !== notebook.id) {
            useStore.getState().moveNotebook(droppedNotebookId, notebook.id);
          } else if (droppedNoteId) {
            useStore.getState().moveNote(droppedNoteId, notebook.id);
          }
        }}
        className={`px-2 py-1.5 rounded-md cursor-pointer flex items-center justify-between transition-colors group
          ${activeNotebookId === notebook.id ? themeStyle.sidebarActive : themeStyle.sidebarHover}
        `}
        style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {hasChildren ? (
            <div onClick={toggleExpand} className={`p-0.5 rounded ${themeStyle.sidebarHover}`}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          ) : (
            <div className="w-5" /> 
          )}
          <span className="truncate flex-1 text-[13px]">{notebook.name}</span>
        </div>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (window.confirm(`¿Eliminar la carpeta "${notebook.name}" y todas sus notas?`)) {
              useStore.getState().deleteNotebook(notebook.id);
            }
          }}
          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all hover:text-red-500 ${themeStyle.sidebarHover}`}
        >
          <Trash2 size={12} />
        </button>
      </li>
      
      {isExpanded && hasChildren && (
        children.map((child: any) => (
          <NotebookNode 
            key={child.id} 
            notebook={child} 
            notebooks={notebooks} 
            depth={depth + 1}
            expanded={expanded}
            setExpanded={setExpanded}
            activeNotebookId={activeNotebookId}
            setActiveNotebook={setActiveNotebook}
            themeStyle={themeStyle}
          />
        ))
      )}
    </>
  );
};

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
  const setSyncModalOpen = useStore(state => state.setSyncModalOpen);
  
  const syncStatus = useStore(state => state.syncStatus);
  const syncProgress = useStore(state => state.syncProgress);
  const hasUnsyncedChanges = useStore(state => state.hasUnsyncedChanges);
  
  const isCustomMenuOpen = useStore(state => state.isCustomMenuOpen);
  const setCustomMenuOpen = useStore(state => state.setCustomMenuOpen);
  const customColors = useStore(state => state.customColors);
  const setCustomColor = useStore(state => state.setCustomColor);

  const rootNotebooks = notebooks.filter(nb => !nb.parentId);

  const getStatusCount = (status: string) => notes.filter(n => n.status === status).length;

  return (
    <div className={`flex-1 flex flex-col h-full font-sans relative pb-[120px] border-r rounded-l-xl ${themeStyle.sidebarBg} ${themeStyle.sidebarText} ${themeStyle.sidebarBorder}`} style={{ WebkitAppRegion: 'drag' } as any} onClick={() => setSettingsOpen(false)}>
      {/* Logo at the very top */}
      <div className={`px-4 pt-4 pb-1 flex items-center justify-between no-drag ${themeStyle.sidebarHeader}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg border border-white/10">
            <img src="./icon.png" alt="M3Flow Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-lg tracking-tighter opacity-90">M3Flow</span>
        </div>
        <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setSettingsOpen(!settingsOpen); }} className="opacity-50 hover:opacity-100 transition-opacity p-1"><Settings size={14} /></button>
            {settingsOpen && (
              <div className={`absolute top-6 right-0 w-48 rounded-md shadow-2xl border overflow-hidden z-50 ${themeStyle.sidebarBg} ${themeStyle.sidebarBorder}`}>
               <div className={`px-3 py-2 text-[10px] uppercase font-bold border-b opacity-60 ${themeStyle.sidebarBorder}`}>General Settings</div>
               <div className="max-h-48 overflow-y-auto">
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
      </div>

      {/* Notebooks Section */}
      <div className="px-3 flex-1 overflow-y-auto no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="text-[11px] font-semibold uppercase tracking-wider mt-4 mb-2 px-1 flex justify-between items-center group opacity-80"
             onDragOver={(e) => e.preventDefault()}
             onDrop={(e) => {
               e.preventDefault();
               const notebookId = e.dataTransfer.getData('notebookId');
               if (notebookId) useStore.getState().moveNotebook(notebookId, null);
             }}>
          <span className="flex items-center gap-2"><LayoutDashboard size={14}/> Notebooks</span>
          <button 
            className={`opacity-0 group-hover:opacity-100 transition-all rounded-md p-1 ${themeStyle.sidebarHover}`}
            title="New Folder"
            onClick={(e) => {
              e.stopPropagation();
              const name = window.prompt('Nombre de la nueva carpeta:');
              if (name) useStore.getState().createNotebook(name, null);
            }}
          >
            <Plus size={14} />
          </button>
          <button 
            className={`opacity-0 group-hover:opacity-100 transition-all rounded-md p-1 ${themeStyle.sidebarHover}`}
            title="Import Workspace"
            onClick={async () => {
              const dbAPI = (window as any).dbAPI;
              const result = await dbAPI.importWorkspace();
              if (result) {
                await useStore.getState().loadInitialData(); // refetch state
              }
            }}
          >
            <Download size={14} className="rotate-180" />
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

        {/* Sección de FILTROS */}
        <div className="mt-8">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 px-2 opacity-50 flex items-center justify-between">
            <span>FILTERS</span>
            <span className="text-[9px] lowercase font-normal opacity-50">{notes.length} notes</span>
          </div>

          {/* Statuses */}
          <div className="mb-6">
            <div className={`px-2 mb-2 text-[11px] font-bold opacity-70 ${themeStyle.sidebarText}`}>STATUS</div>
            <div className="flex flex-col gap-0.5 text-[13px] font-medium">
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
          </div>

          {/* Tags */}
          <div className="mb-8">
            <div className="px-2 mb-2 text-[11px] font-bold opacity-70 flex items-center justify-between">
              <span>TAGS</span>
              <span className="text-[9px] font-normal opacity-50 uppercase tracking-tighter">{tags.length} total</span>
            </div>
            <div className="flex flex-col gap-0.5 text-[13px] font-medium">
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
          </div>
        </div>
      </div>

      {/* Footer Area (Sync + Prefs) */}
      <div className={`absolute bottom-0 w-full z-10 border-t rounded-bl-xl flex flex-col ${themeStyle.sidebarBg} ${themeStyle.sidebarBorder} no-drag`} style={{ WebkitAppRegion: 'no-drag' } as any}>
        
        {/* Sync Status Button (Large) */}
        <div className="px-3 pt-3 pb-1">
          <div 
            onClick={() => setSyncModalOpen(true)}
            className={`relative overflow-hidden cursor-pointer rounded-xl border p-3 flex flex-col gap-2 transition-all hover:shadow-lg ${themeStyle.sidebarBorder} ${themeStyle.sidebarHover}`}
          >
            {/* Fondo de progreso animado si está sincronizando */}
            {syncStatus === 'syncing' && syncProgress && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-blue-500/10 transition-all duration-300"
                style={{ width: `${syncProgress.current}%` }}
              />
            )}

            <div className="relative flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                {syncStatus === 'syncing' ? (
                  <SpinnerIcon size={16} className={`animate-spin text-blue-500`} />
                ) : syncStatus === 'error' ? (
                  <AlertCircle size={16} className="text-red-500" />
                ) : hasUnsyncedChanges ? (
                  <Cloud size={16} className="text-amber-500" />
                ) : (
                  <CheckCircle2 size={16} className="text-green-500" />
                )}
                <span className={`text-[11px] font-bold uppercase tracking-wider`}>
                  {syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'error' ? 'Sync Error' : hasUnsyncedChanges ? 'Pending Sync' : 'Up to date'}
                </span>
              </div>
              {syncStatus === 'syncing' && syncProgress && (
                <span className="text-[10px] font-bold text-blue-400">{Math.round(syncProgress.current)}%</span>
              )}
            </div>
            
            <div className="relative z-10 text-[9px] opacity-60 flex justify-between items-end">
              {syncStatus === 'syncing' && syncProgress ? (
                <span className="truncate pr-2">{syncProgress.message}</span>
              ) : syncStatus === 'error' ? (
                <span className="text-red-400">Check your connection.</span>
              ) : hasUnsyncedChanges ? (
                <span>Pending auto-sync...</span>
              ) : (
                <span>Safely backed up to the cloud.</span>
              )}
            </div>
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
        
        <select 
          value={themeName} 
          onChange={(e) => useStore.getState().setTheme(e.target.value as any)}
          className={`bg-transparent text-[10px] uppercase font-bold focus:outline-none cursor-pointer opacity-70 hover:opacity-100 transition-opacity w-[90px] ${themeStyle.sidebarText}`}
        >
          <optgroup label="── ORIGINAL ──" className="bg-[#1b1c28] text-white">
            <option value="midnight-indigo" className="bg-[#1b1c28] text-white">Midnight</option>
            <option value="cloud-nine" className="bg-[#1b1c28] text-white">Cloud9</option>
            <option value="arctic-night" className="bg-[#1b1c28] text-white">Arctic</option>
            <option value="cyber-ronin" className="bg-[#1b1c28] text-white">Ronin</option>
          </optgroup>
          <optgroup label="── DARK ──" className="bg-[#1b1c28] text-white">
            <option value="one-dark-pro" className="bg-[#1b1c28] text-white">One Dark Pro</option>
            <option value="dracula" className="bg-[#1b1c28] text-white">Dracula</option>
            <option value="tokyo-night" className="bg-[#1b1c28] text-white">Tokyo Night</option>
            <option value="github-dark" className="bg-[#1b1c28] text-white">GitHub Dark</option>
            <option value="night-owl" className="bg-[#1b1c28] text-white">Night Owl</option>
            <option value="monokai-pro" className="bg-[#1b1c28] text-white">Monokai Pro</option>
            <option value="ayu-dark" className="bg-[#1b1c28] text-white">Ayu Dark</option>
            <option value="winter-is-coming" className="bg-[#1b1c28] text-white">Winter Coming</option>
            <option value="shades-of-purple" className="bg-[#1b1c28] text-white">Purple</option>
            <option value="catppuccin-mocha" className="bg-[#1b1c28] text-white">Catppuccin</option>
          </optgroup>
          <optgroup label="── LIGHT ──" className="bg-[#1b1c28] text-white">
            <option value="github-light" className="bg-[#1b1c28] text-white">GitHub Light</option>
            <option value="one-light" className="bg-[#1b1c28] text-white">One Light</option>
            <option value="solarized-light" className="bg-[#1b1c28] text-white">Solarized</option>
            <option value="quiet-light" className="bg-[#1b1c28] text-white">Quiet Light</option>
            <option value="ayu-light" className="bg-[#1b1c28] text-white">Ayu Light</option>
            <option value="catppuccin-latte" className="bg-[#1b1c28] text-white">Latte</option>
            <option value="rose-pine-dawn" className="bg-[#1b1c28] text-white">Rosé Pine</option>
            <option value="material-lighter" className="bg-[#1b1c28] text-white">Material</option>
            <option value="nord-light" className="bg-[#1b1c28] text-white">Nord Light</option>
            <option value="everforest-light" className="bg-[#1b1c28] text-white">Everforest</option>
          </optgroup>
          <optgroup label="── CUSTOM ──" className="bg-[#1b1c28] text-white">
            <option value="custom" className="bg-[#1b1c28] text-white">Custom</option>
          </optgroup>
        </select>
           {themeName === 'custom' && (
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setCustomMenuOpen(!isCustomMenuOpen); }}
              className={`p-1.5 rounded-md transition-all hover:scale-110 ${isCustomMenuOpen ? 'bg-blue-600 text-white shadow-lg' : 'opacity-70 hover:opacity-100 text-blue-400'}`}
              title="Personalizar Colores"
            >
              <Paintbrush size={14} />
            </button>
            
            {isCustomMenuOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className={`absolute bottom-10 left-0 w-56 p-4 rounded-2xl shadow-2xl border z-[10000] animate-in fade-in slide-in-from-bottom-2 duration-300 ${themeStyle.sidebarBg} ${themeStyle.sidebarBorder}`}
              >
                <div className="flex items-center gap-2 mb-4 border-b pb-2 opacity-80">
                  <Palette size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tematizador M4</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Sider BG', key: 'sidebarBg' },
                    { label: 'Side Head', key: 'sidebarHeader' },
                    { label: 'List BG', key: 'listBg' },
                    { label: 'List Head', key: 'listHeader' },
                    { label: 'Editor BG', key: 'editorBg' },
                    { label: 'Edit Head', key: 'editorHeader' },
                    { label: 'Preview BG', key: 'previewBg' },
                  ].map((item: any) => (
                    <div key={item.key} className="flex flex-col gap-1">
                      <label className="text-[9px] font-black opacity-40 uppercase tracking-tighter">{item.label}</label>
                      <input 
                        type="color"
                        value={(customColors as any)[item.key]}
                        onChange={(e) => setCustomColor(item.key, e.target.value)}
                        className="w-full h-8 rounded-lg cursor-pointer bg-white/5 border border-white/10 hover:border-white/30 transition-all"
                      />
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setCustomMenuOpen(false)}
                  className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg transition-all shadow-lg active:scale-95"
                >
                  CERRAR Y GUARDAR
                </button>
              </div>
            )}
          </div>
        )}

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
