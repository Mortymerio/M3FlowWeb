import { useStore } from '../store';
import { MousePointer2, Sparkles } from 'lucide-react';

const HelpItem = ({ title, description, position, arrowDirection }: any) => {
  const arrowStyles: any = {
    up: "bottom-full left-1/2 -translate-x-1/2 mb-1 rotate-180",
    down: "top-full left-1/2 -translate-x-1/2 mt-1",
    left: "right-full top-1/2 -translate-y-1/2 mr-1 rotate-90",
    right: "left-full top-1/2 -translate-y-1/2 ml-1 -rotate-90",
    upRight: "bottom-full left-0 mb-1 -rotate-[135deg]",
    upLeft: "bottom-full right-0 mb-1 rotate-[135deg]",
    downRight: "top-full left-0 mt-1 -rotate-[45deg]",
    downLeft: "top-full right-0 mt-1 rotate-[45deg]",
  };

  return (
    <div className={`absolute ${position} animate-in fade-in zoom-in duration-700 pointer-events-none`}>
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-[220px] relative z-10 ring-1 ring-white/10">
        <h4 className="text-blue-400 font-black text-[11px] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            {title}
        </h4>
        <p className="text-white/90 text-[12px] leading-relaxed font-semibold drop-shadow-sm">{description}</p>
      </div>
      <div className={`absolute text-blue-500 text-4xl pointer-events-none drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] leading-none ${arrowStyles[arrowDirection]}`}>
        ↑
      </div>
    </div>
  );
};

const Shortcut = ({ keys, label }: { keys: string[], label: string }) => (
  <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
    <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">{label}</span>
    <div className="flex gap-1">
      {keys.map(k => (
        <kbd key={k} className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] font-black text-blue-400 shadow-inner">{k}</kbd>
      ))}
    </div>
  </div>
);

const HelpOverlay = () => {
  const showHelpOverlay = useStore(state => state.showHelpOverlay);
  if (!showHelpOverlay) return null;

  return (
    <div 
      onClick={() => useStore.getState().setShowHelpOverlay(false)} 
      className="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-[2px] overflow-hidden cursor-pointer no-drag flex"
      style={{ WebkitAppRegion: 'no-drag' } as any}
    >
      {/* 1. Window Controls */}
      <HelpItem 
        title="Ventana" 
        description="Controles estándar para minimizar, maximizar y cerrar." 
        position="top-[60px] right-[40px]" 
        arrowDirection="upRight" 
      />

      {/* 2. Settings Sidebar */}
      <HelpItem 
        title="Ajustes" 
        description="Accede a la configuración general y acerca de M3Flow." 
        position="top-[45px] left-[200px]" 
        arrowDirection="upLeft" 
      />

      {/* 3. Metadata Bar */}
      <HelpItem 
        title="Metadatos" 
        description="Cambia carpeta, estado, etiquetas y recordatorios de la nota." 
        position="top-[110px] left-[620px]" 
        arrowDirection="up" 
      />

      {/* 4. AI Engine */}
      <HelpItem 
        title="Inteligencia Artificial" 
        description="Usa IA para resumir, traducir o mejorar tus notas (Local o Cloud)." 
        position="top-[160px] left-[780px]" 
        arrowDirection="up" 
      />

      {/* 5. Sidebar Filters */}
      <HelpItem 
        title="Navegación" 
        description="Filtra notas por categorías, estados o etiquetas personalizadas." 
        position="top-[40%] left-[280px]" 
        arrowDirection="left" 
      />

      {/* 6. Theme & Modes */}
      <HelpItem 
        title="Personalización" 
        description="Cambia el tema visual y el modo del editor (VIM/Emacs)." 
        position="bottom-[80px] left-[40px]" 
        arrowDirection="downLeft" 
      />

      {/* 7. Search & Sorting */}
      <HelpItem 
        title="Búsqueda" 
        description="Encuentra notas rápidamente y cambia el orden de la lista." 
        position="top-[180px] left-[320px]" 
        arrowDirection="up" 
      />

      {/* 8. Export Options */}
      <HelpItem 
        title="Exportar" 
        description="Guarda tu trabajo en formato Markdown o PDF profesional." 
        position="bottom-[100px] right-[60px]" 
        arrowDirection="downRight" 
      />

      {/* 9. View Modes */}
      <HelpItem 
        title="Visualización" 
        description="Alterna entre edición pura, vista dividida o previsualización." 
        position="top-[110px] right-[100px]" 
        arrowDirection="up" 
      />

      {/* 10. Format Toolbar */}
      <HelpItem 
        title="Formato" 
        description="Aplica negritas, cursivas, código o encabeza textos rápidamente." 
        position="top-[180px] left-[580px]" 
        arrowDirection="up" 
      />

      {/* Center Shortcuts & Welcome */}
      <div className="m-auto w-full max-w-2xl px-10 pointer-events-none flex flex-col items-center">
        
        <div className="bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.2)] flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="w-20 h-20 bg-blue-600 rounded-[24px] flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/50">
            <Sparkles size={40} className="text-white" />
          </div>
          
          <h1 className="text-white text-5xl font-black mb-3 tracking-tighter drop-shadow-2xl">
            Centro de <span className="text-blue-500">M3Flow</span>
          </h1>
          <p className="text-blue-200 text-lg opacity-80 mb-10 font-medium">Domina tu flujo de trabajo con atajos potentes.</p>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 w-full text-left">
            <div className="flex flex-col gap-2">
              <h5 className="text-[10px] font-black uppercase text-blue-500/50 tracking-[0.3em] mb-2 px-1">Global</h5>
              <Shortcut label="Nueva Nota" keys={['Ctrl', 'N']} />
              <Shortcut label="Paleta Comandos" keys={['Ctrl', 'P']} />
              <Shortcut label="Alternar Sidebar" keys={['Ctrl', 'B']} />
              <Shortcut label="Daily Note" keys={['Ctrl', 'D']} />
              <Shortcut label="Meeting" keys={['Ctrl', 'M']} />
            </div>
            <div className="flex flex-col gap-2">
              <h5 className="text-[10px] font-black uppercase text-blue-500/50 tracking-[0.3em] mb-2 px-1">Editor</h5>
              <Shortcut label="Guardar (Auto)" keys={['1s idle']} />
              <Shortcut label="Modo VIM" keys={['Esc', ':', 'w']} />
              <Shortcut label="IA Magic" keys={['Ctrl', 'Enter']} />
              <Shortcut label="Panel IA" keys={['Ctrl', '⇧', 'A']} />
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/40 text-[11px] font-bold">
               <MousePointer2 size={14} /> Haz click para continuar
            </div>
            <button className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-2xl transition-all shadow-blue-500/40 border border-white/20 active:scale-95">
              ¡ENTENDIDO!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpOverlay;
