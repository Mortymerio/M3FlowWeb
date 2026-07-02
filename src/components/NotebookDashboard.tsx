import { useStore } from '../store';
import { THEMES } from '../themes';
import { LayoutDashboard, Brain, FileText, Plus, Tags, Clock, Sparkles, Bell } from 'lucide-react';

const NotebookDashboard = () => {
  const activeNotebookId = useStore(state => state.activeNotebookId);
  const notebooks = useStore(state => state.notebooks);
  const notes = useStore(state => state.notes);
  const themeName = useStore(state => state.theme);
  const createNote = useStore(state => state.createNote);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const isDark = themeStyle.isDark !== false;

  const notebook = notebooks.find(nb => nb.id === activeNotebookId);
  
  if (!notebook) {
    const recentNotes = notes.slice(0, 6);
    const pendingReminders = notes.filter(n => n.reminderAt && n.reminderAt > Date.now()).sort((a, b) => (a.reminderAt || 0) - (b.reminderAt || 0)).slice(0, 5);
    const statusCounts = {
      active: notes.filter(n => n.status === 'active').length,
      onHold: notes.filter(n => n.status === 'on-hold').length,
      completed: notes.filter(n => n.status === 'completed').length,
    };

    return (
      <div className={`flex-1 overflow-y-auto font-sans p-8 md:p-12 ${themeStyle.editorBg} ${themeStyle.editorText} animate-in fade-in duration-500`}>
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Welcome Header */}
          <div className="flex items-end justify-between pb-6 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg border border-white/10">
                  <img src="./icon.png" alt="M3Flow" className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30">M3Flow Home</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter">Welcome back</h1>
              <p className="text-sm opacity-40 mt-1">{notes.length} notes across {notebooks.length} notebooks</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'New Note', shortcut: 'Ctrl+N', icon: '📝', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20', action: () => createNote() },
                { label: 'Daily Note', shortcut: 'Ctrl+D', icon: '📅', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20', action: () => useStore.getState().openDailyNote() },
                { label: 'Meeting', shortcut: 'Ctrl+M', icon: '👥', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20', action: () => useStore.getState().openMeetingNote() },
                { label: 'Tasks', shortcut: '', icon: '✅', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20', action: () => useStore.getState().openTab({ type: 'tasks', title: 'Tasks' }) },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${item.color}`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <span className="text-[12px] font-bold block">{item.label}</span>
                    {item.shortcut && <span className="text-[9px] opacity-40 font-mono">{item.shortcut}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
              <div className="text-2xl font-black text-blue-500">{statusCounts.active}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Active</div>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50 border-amber-100'}`}>
              <div className="text-2xl font-black text-amber-500">{statusCounts.onHold}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">On Hold</div>
            </div>
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="text-2xl font-black text-emerald-500">{statusCounts.completed}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Completed</div>
            </div>
          </div>

          {/* Recent Notes */}
          {recentNotes.length > 0 && (
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4 flex items-center gap-2">
                <Clock size={12} /> Recent Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recentNotes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => useStore.getState().openTab({ type: 'note', noteId: note.id, title: note.title })}
                    className={`group p-3 rounded-xl border cursor-pointer transition-all hover:shadow-lg ${isDark ? 'bg-black/10 border-white/5 hover:border-blue-500/30' : 'bg-white border-gray-100 hover:border-blue-200'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold truncate group-hover:text-blue-400 transition-colors">{note.title || 'Untitled'}</h3>
                        <p className="text-[11px] opacity-30 mt-0.5 truncate">{note.body?.replace(/[#*`_>\-]/g, '').slice(0, 80) || 'No content'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {note.status !== 'none' && (
                          <span className={`w-2 h-2 rounded-full ${note.status === 'active' ? 'bg-blue-500' : note.status === 'on-hold' ? 'bg-amber-500' : note.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        )}
                        <span className="text-[9px] opacity-20">{new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Reminders */}
          {pendingReminders.length > 0 && (
            <div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-4 flex items-center gap-2">
                <Bell size={12} /> Upcoming Reminders
              </h2>
              <div className="flex flex-col gap-1.5">
                {pendingReminders.map(note => (
                  <div
                    key={note.id}
                    onClick={() => useStore.getState().openTab({ type: 'note', noteId: note.id, title: note.title })}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${isDark ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30' : 'bg-amber-50 border-amber-100'}`}
                  >
                    <Bell size={14} className="text-amber-500 flex-shrink-0" />
                    <span className="text-[12px] font-medium flex-1 truncate">{note.title}</span>
                    <span className="text-[10px] font-bold text-amber-500/60">{new Date(note.reminderAt!).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pro tip */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border border-dashed ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'}`}>
            <Sparkles size={16} className="text-blue-500 flex-shrink-0" />
            <p className="text-[11px] opacity-40">
              <span className="font-bold">Pro tip:</span> Press <kbd className="px-1 py-0.5 rounded bg-black/10 text-[10px] font-mono mx-0.5">Ctrl+P</kbd> to search notes, or <kbd className="px-1 py-0.5 rounded bg-black/10 text-[10px] font-mono mx-0.5">Ctrl+Shift+P</kbd> for commands.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const notebookNotes = notes.filter(n => n.notebookId === notebook.id);
  const config = notebook.config ? JSON.parse(notebook.config) : {};
  
  // Stats
  const lastUpdated = notebookNotes.length > 0 
    ? Math.max(...notebookNotes.map(n => n.updatedAt)) 
    : null;

  return (
    <div className={`flex-1 overflow-y-auto font-sans p-8 md:p-12 ${themeStyle.editorBg} ${themeStyle.editorText} animate-in fade-in duration-500`}>
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-10 border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                <LayoutDashboard size={18} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Notebook Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">{notebook.name}</h1>
            <div className="flex items-center gap-4 text-[11px] font-bold opacity-50 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><FileText size={12} /> {notebookNotes.length} Notes</span>
              <span className="flex items-center gap-1.5"><Clock size={12} /> Last update: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Never'}</span>
            </div>
          </div>
          
          <button 
            onClick={createNote}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={16} />
            NEW NOTE
          </button>
        </div>

        {/* Dynamic Context Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* AI Context Card */}
          <div className={`p-6 rounded-[2rem] border transition-all hover:shadow-2xl ${isDark ? 'bg-black/20 border-white/5 hover:border-purple-500/30' : 'bg-white border-gray-100 hover:shadow-gray-200'} relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
              <Brain size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-purple-400">
                <Brain size={18} />
                <span className="text-xs font-black uppercase tracking-widest">AI Context</span>
              </div>
              <p className="text-sm leading-relaxed opacity-70 mb-6 italic">
                {config.systemPrompt ? `"${config.systemPrompt.substring(0, 150)}${config.systemPrompt.length > 150 ? '...' : ''}"` : 'No custom AI instructions set for this context.'}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-purple-500/80 bg-purple-500/10 w-fit px-3 py-1 rounded-full border border-purple-500/20">
                <Sparkles size={10} />
                ACTIVE KNOWLEDGE INJECTION
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className={`p-6 rounded-[2rem] border transition-all hover:shadow-2xl ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100 shadow-sm'} relative overflow-hidden`}>
            <div className="flex items-center gap-2 mb-6 text-emerald-400">
              <Tags size={18} />
              <span className="text-xs font-black uppercase tracking-widest">Analytics</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs opacity-50 font-bold uppercase tracking-tighter">Completion Rate</span>
                <span className="text-sm font-black text-emerald-500">
                  {Math.round((notebookNotes.filter(n => n.status === 'completed').length / (notebookNotes.length || 1)) * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs opacity-50 font-bold uppercase tracking-tighter">Active Tasks</span>
                <span className="text-sm font-black text-blue-500">{notebookNotes.filter(n => n.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs opacity-50 font-bold uppercase tracking-tighter">Preferred Vibe</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest">
                  {config.theme || themeName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Insights Placeholder */}
        <div className={`p-10 rounded-[3rem] border border-dashed flex flex-col items-center justify-center text-center space-y-4 ${isDark ? 'border-white/5 bg-black/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Sparkles size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Semantic Connections</h3>
            <p className="text-xs opacity-40 max-w-xs mx-auto">Soon: Automatic visual graph of your knowledge within this context.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotebookDashboard;
