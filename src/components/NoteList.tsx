import { useMemo, memo } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { Edit3, Search, Clock, SortDesc, Trash2, FileText } from 'lucide-react';

const NoteItem = memo(({ note, isActive, onSelect, themeStyle, themeName, allTags, allNoteTags }: any) => {
  const getTimeAgo = (ts: number) => {
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 60) return `${min || 1}m`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const snippet = note.body ? note.body.replace(/[#*`_>\-]/g, '').slice(0, 100).trim() : 'No content';
  
  // Memoize tags for this note to prevent unnecessary recalculations
  const myTags = useMemo(() => {
    const noteTagIds = allNoteTags.filter((nt: any) => nt.noteId === note.id).map((nt: any) => nt.tagId);
    return allTags.filter((t: any) => noteTagIds.includes(t.id));
  }, [note.id, allTags, allNoteTags]);

  return (
    <div 
      onClick={() => onSelect(note.id)}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('noteId', note.id)}
      className={`relative px-4 py-4 cursor-pointer border-b transition-all duration-200 group
         ${themeStyle.listBorder}
         ${isActive ? `${themeStyle.listActive} shadow-lg z-10` : `${themeStyle.listBg} ${themeStyle.listHover}`}
       `}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-500 shadow-[2px_0_12px_rgba(59,130,246,0.6)]"></div>}
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className={`text-[15px] font-extrabold leading-tight line-clamp-2 ${isActive ? (themeName === 'cloud-nine' ? 'text-slate-900' : 'text-white') : themeStyle.listText} ${!isActive && 'opacity-80'}`}>
            {note.title || 'Untitled Note'}
          </h3>
          {note.status !== 'none' && (
             <span className={`flex-shrink-0 px-2 py-0.5 rounded-md font-black uppercase text-[9px] tracking-widest shadow-md border border-white/10
               ${note.status === 'active' ? 'bg-blue-500 text-white shadow-blue-500/30' : 
                 note.status === 'on-hold' ? 'bg-amber-500 text-white shadow-amber-500/30' :
                 note.status === 'completed' ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-red-500 text-white shadow-red-500/30'}
             `}>
               {note.status}
             </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-1.5 text-[11px] font-bold ${isActive ? 'text-blue-200' : 'text-blue-400'}`}>
             <Clock size={12} strokeWidth={3} /> {getTimeAgo(note.updatedAt)}
           </div>
           <div className={`text-[10px] opacity-30 font-medium ${themeStyle.listText}`}>
             {new Date(note.updatedAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
           </div>
        </div>

        <p className={`text-[12px] line-clamp-2 opacity-50 leading-relaxed ${themeStyle.listText}`}>
          {snippet}
        </p>

        {myTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {myTags.map((tag: any) => (
              <span 
                key={tag.id} 
                className="px-2 py-0.5 rounded-md text-[9px] font-black text-white shadow-sm uppercase tracking-tighter"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

const NoteList = () => {
  const notebooks = useStore(state => state.notebooks);
  const notes = useStore(state => state.notes);
  const tags = useStore(state => state.tags);
  const noteTags = useStore(state => state.noteTags);
  const activeNotebookId = useStore(state => state.activeNotebookId);
  const activeStatusId = useStore(state => state.activeStatusId);
  const activeTagId = useStore(state => state.activeTagId);
  const activeNoteId = useStore(state => state.activeNoteId);
  const setActiveNote = useStore(state => state.setActiveNote);
  const searchQuery = useStore(state => state.searchQuery);
  const setSearchQuery = useStore(state => state.setSearchQuery);
  const sortOrder = useStore(state => state.sortOrder);
  const setSortOrder = useStore(state => state.setSortOrder);
  const createNote = useStore(state => state.createNote);
  
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];

  // Filtrado de Notas por Notebook, Status, Tag y Búsqueda Optimized
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      let matchesCategory = true;
      if (activeNotebookId) matchesCategory = note.notebookId === activeNotebookId;
      else if (activeStatusId) matchesCategory = note.status === activeStatusId;
      else if (activeTagId) matchesCategory = noteTags.some(nt => nt.noteId === note.id && nt.tagId === activeTagId);

      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (note.body && note.body.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [notes, activeNotebookId, activeStatusId, activeTagId, noteTags, searchQuery]);

  // Ordenamiento con useMemo
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (sortOrder === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [filteredNotes, sortOrder]);

  let listTitle = 'All Notes';
  if (activeNotebookId) {
    const nb = notebooks.find(n => n.id === activeNotebookId);
    if (nb) listTitle = nb.name;
  } else if (activeStatusId) {
    listTitle = activeStatusId.charAt(0).toUpperCase() + activeStatusId.slice(1);
  } else if (activeTagId) {
    const t = tags.find(tag => tag.id === activeTagId);
    if (t) listTitle = t.name;
  }

  return (
    <div className={`flex flex-col h-full border-r font-sans ${themeStyle.listBg} ${themeStyle.listBorder}`}>
      {/* Top Header */}
      <div 
        className={`py-3 px-4 flex justify-between items-center border-b mt-[4px] transition-all duration-300 ${themeStyle.listBorder} ${themeStyle.listHeader}`} 
        style={{ WebkitAppRegion: 'drag' } as any}
      >
          <div 
            onClick={() => setSortOrder(sortOrder === 'default' ? 'alphabetical' : 'default')}
            className={`flex items-center gap-2 cursor-pointer transition-all ${sortOrder === 'alphabetical' ? 'opacity-100 text-blue-500 scale-110' : 'opacity-60 hover:opacity-100'} ${themeStyle.listText}`} 
            title={sortOrder === 'alphabetical' ? 'Sorted by Title (A-Z)' : 'Sorted by Date'}
          >
            <SortDesc size={16} />
          </div>

        <div className={`font-semibold text-sm truncate px-2 ${themeStyle.listText}`}>{listTitle}</div>
        <div className="flex items-center gap-1 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (activeNoteId && window.confirm('¿Borrar esta nota?')) {
                useStore.getState().deleteNote(activeNoteId);
              }
            }}
            className={`transition-colors bg-transparent p-1 rounded-md opacity-40 hover:opacity-100 hover:text-red-500 ${themeStyle.listText} ${themeStyle.listHover}`}
            title="Delete active note"
          >
            <Trash2 size={16} />
          </button>
          <button 
            onClick={createNote}
            className={`transition-colors bg-transparent p-1 rounded-md opacity-60 hover:opacity-100 ${themeStyle.listText} ${themeStyle.listHover}`}
            title="New Note (Ctrl+N)"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`px-4 py-2 border-b no-drag ${themeStyle.listBg} ${themeStyle.listBorder}`} style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="relative flex items-center">
          <Search size={14} className={`absolute left-2.5 opacity-50 ${themeStyle.listText}`} />
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-transparent border rounded-md py-1.5 pl-8 pr-3 text-[13px] focus:outline-none transition-all ${themeStyle.listBorder} ${themeStyle.listText} focus:border-blue-400`}
            style={{ color: 'inherit' }}
          />
        </div>
      </div>

      {/* Lista de Notas (Scroll) */}
      <div className="flex-1 overflow-y-auto no-drag relative" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60%] px-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className={`p-4 rounded-2xl mb-4 border shadow-sm ${themeStyle.listHeader} ${themeStyle.listBorder}`}>
              <FileText size={32} className="opacity-40" />
            </div>
            <h3 className={`font-bold mb-1 ${themeStyle.listText}`}>No notes here</h3>
            <p className={`text-[11px] opacity-60 mb-6 ${themeStyle.listText}`}>
              Get started by creating your first note in this notebook.
            </p>
            <button 
              onClick={createNote}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 group"
            >
              <Edit3 size={14} className="group-hover:rotate-12 transition-transform" />
              Create Note
            </button>
            <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest opacity-40">
              <span className="px-1.5 py-0.5 rounded border border-current">Ctrl</span>
              <span>+</span>
              <span className="px-1.5 py-0.5 rounded border border-current">N</span>
            </div>
          </div>
        ) : (
          sortedNotes.map(note => (
            <NoteItem 
              key={note.id}
              note={note}
              isActive={note.id === activeNoteId}
              onSelect={setActiveNote}
              themeStyle={themeStyle}
              themeName={themeName}
              allTags={tags}
              allNoteTags={noteTags}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NoteList;
