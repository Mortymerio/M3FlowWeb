import { useStore } from '../store';
import { THEMES } from '../themes';
import { X, Globe, GitBranch, Heart, Coffee, Shield, Zap } from 'lucide-react';

const AboutModal = () => {
  const showAboutModal = useStore(state => state.showAboutModal);
  const setShowAboutModal = useStore(state => state.setShowAboutModal);
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['cyber-ronin'];

  if (!showAboutModal) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={() => setShowAboutModal(false)}
    >
      <div 
        className={`relative w-full max-w-md overflow-hidden rounded-[32px] border shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ${themeStyle.sidebarBg} ${themeStyle.sidebarBorder} ${themeStyle.sidebarText}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        {/* Close Button */}
        <button 
          onClick={() => setShowAboutModal(false)}
          className={`absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors z-10 opacity-60 hover:opacity-100 ${themeStyle.sidebarText}`}
        >
          <X size={20} />
        </button>

        <div className="relative p-8 flex flex-col items-center">
          {/* App Icon / Logo */}
          <div className="w-20 h-20 mb-6 relative group">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img 
              src="./icon.png" 
              alt="M3Flow Logo" 
              className="w-full h-full object-cover rounded-2xl border border-white/20 shadow-2xl relative z-10" 
            />
          </div>

          <h2 className={`text-3xl font-black tracking-tight mb-1 ${themeName.includes('light') || themeName === 'cloud-nine' ? 'text-slate-900' : 'text-white'}`}>M3Flow</h2>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400 mb-6 opacity-80">v0.1.20 Beta</p>

          <div className="w-full space-y-4 mb-8">
            <p className="text-sm text-center leading-relaxed opacity-70">
              Una plataforma de escritura de alto rendimiento diseñada para la claridad mental y el flujo creativo constante.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-bold border border-black/5 flex items-center gap-1.5 backdrop-blur-md">
                <Zap size={10} className="text-yellow-400" /> VITE
              </span>
              <span className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-bold border border-black/5 flex items-center gap-1.5 backdrop-blur-md">
                <Shield size={10} className="text-emerald-400" /> SQLITE
              </span>
              <span className="px-3 py-1 bg-black/5 rounded-full text-[10px] font-bold border border-black/5 flex items-center gap-1.5 backdrop-blur-md">
                <Globe size={10} /> ELECTRON
              </span>
            </div>
          </div>

          <div className={`w-full p-6 rounded-2xl border border-black/5 bg-black/5 backdrop-blur-xl relative overflow-hidden group`}>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-inner">
                M
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Created by</span>
                <span className={`text-lg font-bold tracking-tight ${themeName.includes('light') || themeName === 'cloud-nine' ? 'text-slate-900' : 'text-white'}`}>Mariano</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                 <Heart size={14} className="text-red-500 opacity-60 hover:opacity-100 cursor-pointer transition-opacity" />
                 <GitBranch size={14} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold opacity-40 italic">
                <Coffee size={12} /> built with passion
              </div>
            </div>

            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>

          <p className="mt-8 text-[9px] font-medium opacity-30 uppercase tracking-[0.2em]">
            © 2026 M3Flow Labs • All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
