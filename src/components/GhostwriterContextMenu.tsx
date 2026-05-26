import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Wand2, PenTool, Play, X } from 'lucide-react';

interface GhostwriterContextMenuProps {
  x: number;
  y: number;
  hasSelection: boolean;
  onClose: () => void;
  onAction: (action: 'directive' | 'expand' | 'continue', prompt?: string) => void;
}

export const GhostwriterContextMenu: React.FC<GhostwriterContextMenuProps> = ({ x, y, hasSelection, onClose, onAction }) => {
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [promptText, setPromptText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      // Small timeout to prevent immediate close on the right-click event itself
      setTimeout(() => onClose(), 10);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (!showPromptInput) {
      document.addEventListener('click', handleGlobalClick);
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPromptInput, onClose]);

  useEffect(() => {
    if (showPromptInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showPromptInput]);

  // Prevent menu from flowing off the bottom of the screen
  const estimatedHeight = showPromptInput ? 100 : 160;
  const safeY = y + estimatedHeight > window.innerHeight ? Math.max(10, window.innerHeight - estimatedHeight - 10) : y;
  // Prevent menu from flowing off the right of the screen
  const safeX = x + 256 > window.innerWidth ? Math.max(10, window.innerWidth - 266) : x;

  return (
    <div 
      className="fixed z-[999999] bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden w-64 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: safeX, top: safeY }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {showPromptInput ? (
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={10} /> Directiva IA
            </span>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X size={12}/></button>
          </div>
          <div className="flex gap-1">
            <input 
              ref={inputRef}
              type="text"
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && promptText.trim()) {
                  onAction('directive', promptText.trim());
                  onClose();
                }
              }}
              placeholder="Ej: Describe la tormenta..."
              className="flex-1 bg-black/30 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
            />
            <button 
              onClick={() => {
                if (promptText.trim()) {
                  onAction('directive', promptText.trim());
                  onClose();
                }
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-md transition-colors"
            >
              <Play size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col py-1">
          <button 
            onClick={() => setShowPromptInput(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-blue-500 hover:text-white transition-colors text-left"
          >
            <Sparkles size={14} className="text-blue-400 group-hover:text-white" />
            <div className="flex flex-col">
              <span className="font-semibold">Directiva IA...</span>
              <span className="text-[9px] opacity-60">Escribir prompt en línea</span>
            </div>
          </button>
          
          <button 
            onClick={() => { onAction('expand'); onClose(); }}
            disabled={!hasSelection}
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-blue-500 hover:text-white transition-colors text-left disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <Wand2 size={14} className="text-purple-400" />
            <div className="flex flex-col">
              <span className="font-semibold">Desarrollar Selección</span>
              <span className="text-[9px] opacity-60">Expandir viñetas a prosa</span>
            </div>
          </button>

          <div className="h-px bg-white/10 my-1 mx-2" />

          <button 
            onClick={() => { onAction('continue'); onClose(); }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:bg-blue-500 hover:text-white transition-colors text-left"
          >
            <PenTool size={14} className="text-green-400" />
            <div className="flex flex-col">
              <span className="font-semibold">Continuar Escribiendo</span>
              <span className="text-[9px] opacity-60">Autocompletar historia</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
