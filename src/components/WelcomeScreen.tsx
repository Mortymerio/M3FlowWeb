import { Download } from 'lucide-react';
import { useStore } from '../store';

const WelcomeScreen = () => {
  const notebooks = useStore(state => state.notebooks);
  const loadInitialData = useStore(state => state.loadInitialData);

  if (notebooks.length > 0) return null;

  const handleSelect = async () => {
    const dbAPI = (window as any).dbAPI;
    const result = await dbAPI.importWorkspace();
    if (result) {
      await loadInitialData();
    }
  };

  return (
    <div className="absolute inset-0 z-[100000] bg-[#0f172a] flex items-center justify-center p-12 overflow-hidden font-sans border-none">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] opacity-50"></div>
      
      <div className="relative max-w-2xl w-full text-center flex flex-col items-center">
         <div className="w-24 h-24 mb-10 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)] border border-white/10 rotate-3 bg-[#1e293b] flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl">M3</div>
         </div>
         <h1 className="text-white text-5xl font-black mb-6 tracking-tighter">Welcome to M3Flow</h1>
         <p className="text-blue-200/60 text-xl mb-12 max-w-md leading-relaxed">Your personal and local note vault. Select a folder to start.</p>
         
         <button 
           onClick={handleSelect}
           className="group px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-blue-500/40 flex items-center gap-4 border border-white/20"
         >
           <Download size={24} className="rotate-180" />
           Configure Folder / Vault
         </button>
         
         <div className="mt-16 flex gap-6 opacity-30 text-[11px] uppercase font-black tracking-[0.3em] text-white">
           <span>Local-First</span>
           <span>•</span>
           <span>Markdown</span>
           <span>•</span>
           <span>Secured</span>
         </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
