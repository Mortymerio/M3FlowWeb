import { useState } from 'react';
import { useStore } from '../store';
import { Layout, ChevronDown, Check, Tag as TagIcon, Bell, History } from 'lucide-react';

const TAG_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const NotebookDropdown = ({ activeNote, breadcrumb, dropdownOpen, setDropdownOpen, themeStyle, moveNote }: any) => {
  const notebooks = useStore(state => state.notebooks);
  return (
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
  );
};

export const StatusDropdown = ({ activeNote, activeNoteId, statusColor, dropdownOpen, setDropdownOpen, themeStyle }: any) => {
  return (
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
  );
};

export const TagsDropdown = ({ activeNoteId, myTags, dropdownOpen, setDropdownOpen, themeStyle }: any) => {
  const tags = useStore(state => state.tags);
  const noteTags = useStore(state => state.noteTags);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  return (
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
          {/* Inline tag creation */}
          <div className={`mt-2 pt-2 border-t ${themeStyle.editorBorder}`}>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5 flex-shrink-0">
                {TAG_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewTagColor(c)}
                    className={`w-3 h-3 rounded-full transition-all ${newTagColor === c ? 'ring-2 ring-white/50 scale-125' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: newTagColor }} />
              <input
                type="text"
                placeholder="New tag..."
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTagName.trim()) {
                    useStore.getState().createTag(newTagName.trim(), newTagColor).then(tagId => {
                      useStore.getState().toggleNoteTag(activeNoteId!, tagId);
                    });
                    setNewTagName('');
                  }
                }}
                className={`flex-1 bg-transparent border rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-blue-500/50 ${themeStyle.editorBorder} min-w-0`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReminderDropdown = ({ activeNote, activeNoteId, hasReminder, dropdownOpen, setDropdownOpen, themeStyle }: any) => {
  const [tempReminder, setTempReminder] = useState<number | null>(null);

  return (
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
  );
};

export const HistoryDropdown = ({ activeNoteId, myHistory, dropdownOpen, setDropdownOpen, themeStyle, revertToHistory }: any) => {
  return (
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
  );
};
