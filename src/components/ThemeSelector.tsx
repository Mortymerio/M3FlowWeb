import { Paintbrush, Palette } from 'lucide-react';
import { useStore } from '../store';

export const ThemeSelector = ({ themeStyle }: { themeStyle: any }) => {
  const themeName = useStore(state => state.theme);
  const isCustomMenuOpen = useStore(state => state.isCustomMenuOpen);
  const setCustomMenuOpen = useStore(state => state.setCustomMenuOpen);
  const customColors = useStore(state => state.customColors);
  const setCustomColor = useStore(state => state.setCustomColor);
  const setTheme = useStore(state => state.setTheme);

  return (
    <>
      <select 
        value={themeName} 
        onChange={(e) => setTheme(e.target.value as any)}
        className={`bg-transparent text-[10px] uppercase font-bold focus:outline-none cursor-pointer opacity-70 hover:opacity-100 transition-opacity w-[90px] ${themeStyle.sidebarText}`}
      >
        <optgroup label="✨ ORIGINAL ✨" className="bg-[#1b1c28] text-white">
          <option value="midnight-indigo" className="bg-[#1b1c28] text-white">Midnight</option>
          <option value="cloud-nine" className="bg-[#1b1c28] text-white">Cloud9</option>
          <option value="arctic-night" className="bg-[#1b1c28] text-white">Arctic</option>
          <option value="cyber-ronin" className="bg-[#1b1c28] text-white">Ronin</option>
        </optgroup>
        <optgroup label="🌙 DARK 🌙" className="bg-[#1b1c28] text-white">
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
        <optgroup label="☀️ LIGHT ☀️" className="bg-[#1b1c28] text-white">
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
        <optgroup label="🎨 CUSTOM 🎨" className="bg-[#1b1c28] text-white">
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
    </>
  );
};
