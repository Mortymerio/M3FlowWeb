import { useStore } from '../store';
import { THEMES } from '../themes';
import { LayoutDashboard, Brain, FileText, Plus, Tags, Clock, Sparkles } from 'lucide-react';

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
    return (
      <div className={`flex-1 flex items-center justify-center flex-col p-10 text-center ${themeStyle.editorBg} ${themeStyle.editorText}`}>
        <div className="opacity-20 flex flex-col items-center max-w-sm">
          <FileText size={80} className="mb-6 stroke-[1]" />
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">M3Flow Vault</h2>
          <p className="text-sm leading-relaxed">Select a notebook or note to start building your knowledge base.</p>
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
