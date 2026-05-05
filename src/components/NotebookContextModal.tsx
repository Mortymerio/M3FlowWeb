import { useState, useEffect } from 'react';
import { X, LayoutDashboard, Brain, Palette, FileCode, Save, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { THEMES } from '../themes';

const NotebookContextModal = () => {
  const isOpen = useStore(state => state.isNotebookContextModalOpen);
  const notebookId = useStore(state => state.contextNotebookId);
  const notebooks = useStore(state => state.notebooks);
  const updateNotebook = useStore(state => state.updateNotebook);
  const setNotebookContextModal = useStore(state => state.setNotebookContextModal);
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const isDark = themeStyle.isDark !== false;

  const notebook = notebooks.find(nb => nb.id === notebookId);
  
  const [config, setConfig] = useState({
    systemPrompt: '',
    theme: '',
    template: '',
  });
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (notebook) {
      setName(notebook.name);
      try {
        const parsed = notebook.config ? JSON.parse(notebook.config) : {};
        setConfig({
          systemPrompt: parsed.systemPrompt || '',
          theme: parsed.theme || '',
          template: parsed.template || '',
        });
      } catch (e) {
        console.error('Error parsing notebook config:', e);
      }
    }
  }, [notebook]);

  if (!isOpen || !notebook) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateNotebook(notebook.id, name, notebook.parentId, config);
      setNotebookContextModal(false);
    } catch (e) {
      alert('Error saving context');
    } finally {
      setIsSaving(false);
    }
  };

  const bgClass = themeStyle.sidebarBg || (isDark ? 'bg-[#15191e]' : 'bg-white');
  const textClass = themeStyle.sidebarText || (isDark ? 'text-slate-200' : 'text-gray-800');
  const borderClass = themeStyle.sidebarBorder || (isDark ? 'border-white/10' : 'border-gray-200');
  const inputBg = isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 no-drag">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${bgClass} ${borderClass} ${textClass} animate-in fade-in zoom-in duration-200`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${borderClass} bg-black/10`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center shadow-inner">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Notebook Context</h2>
              <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Configure Dynamic Knowledge</p>
            </div>
          </div>
          <button onClick={() => setNotebookContextModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto max-h-[75vh]">
          
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-[11px] font-black opacity-50 uppercase tracking-wider flex items-center gap-2">
              <LayoutDashboard size={12} /> Notebook Name
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold ${inputBg}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Context */}
            <div className="space-y-2 flex flex-col">
              <label className="text-[11px] font-black opacity-50 uppercase tracking-wider flex items-center gap-2">
                <Brain size={12} className="text-purple-400" /> AI System Prompt
              </label>
              <p className="text-[10px] opacity-40 leading-tight">Instructions for the AI when working in this notebook.</p>
              <textarea 
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                placeholder="Ex: You are a senior React developer helping with the M3Flow project..."
                className={`flex-1 min-h-[120px] w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-xs leading-relaxed ${inputBg}`}
              />
            </div>

            {/* Template */}
            <div className="space-y-2 flex flex-col">
              <label className="text-[11px] font-black opacity-50 uppercase tracking-wider flex items-center gap-2">
                <FileCode size={12} className="text-emerald-400" /> Note Template
              </label>
              <p className="text-[10px] opacity-40 leading-tight">Default content for all new notes in this folder.</p>
              <textarea 
                value={config.template}
                onChange={(e) => setConfig({ ...config, template: e.target.value })}
                placeholder="# {{title}}\n\n## Overview\n..."
                className={`flex-1 min-h-[120px] w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-xs font-mono leading-relaxed ${inputBg}`}
              />
            </div>
          </div>

          {/* Theme Override */}
          <div className="space-y-3">
            <label className="text-[11px] font-black opacity-50 uppercase tracking-wider flex items-center gap-2">
              <Palette size={12} className="text-amber-400" /> Preferred Theme (Optional)
            </label>
            <select 
              value={config.theme}
              onChange={(e) => setConfig({ ...config, theme: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-bold ${inputBg}`}
            >
              <option value="">Default (Global Theme)</option>
              {Object.keys(THEMES).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-8 py-6 border-t flex justify-end gap-3 ${borderClass} bg-black/10`}>
          <button 
            onClick={() => setNotebookContextModal(false)}
            className="px-6 py-2.5 rounded-xl text-xs font-bold opacity-60 hover:opacity-100 transition-opacity"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            SAVE CONTEXT
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebookContextModal;
