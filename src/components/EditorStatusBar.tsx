import { useState, useEffect } from 'react';
import { Download, Cpu } from 'lucide-react';

interface EditorStatusBarProps {
  editorType: 'raw' | 'rich';
  editorMode: 'normal' | 'vim' | 'emacs';
  vimMode: string;
  cursorLine: number;
  cursorCol: number;
  totalLines: number;
  contentLength: number;
  content: string;
  themeStyle: any;
  isDark: boolean;
}

const EditorStatusBar = ({
  editorType,
  editorMode,
  vimMode,
  cursorLine,
  cursorCol,
  totalLines,
  contentLength,
  content,
  themeStyle,
  isDark,
}: EditorStatusBarProps) => {
  const [sysMemPct, setSysMemPct] = useState<number | null>(null);
  const [processMemMb, setProcessMemMb] = useState<number | null>(null);

  useEffect(() => {
    // Poll system stats gently every 5 seconds
    const fetchStats = async () => {
      try {
        if (window.dbAPI && window.dbAPI.getSystemStats) {
          const stats = await window.dbAPI.getSystemStats();
          setSysMemPct(stats.sysMemPct);
          setProcessMemMb(stats.processMemMb);
        }
      } catch (e) {
        // Ignore quietly
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className={`status-bar h-6 flex items-center justify-between px-3 border-t ${themeStyle.editorBorder} ${isDark ? "bg-black/20" : "bg-black/5"} backdrop-blur-sm print:hidden`}>
      <div className="flex items-center gap-3">
        {/* Editor type indicator */}
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${editorType === 'rich' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
          {editorType === 'rich' ? 'RICH' : 'RAW'}
        </span>
        {/* Vim mode indicator (only in vim mode + raw mode) */}
        {editorMode === 'vim' && editorType === 'raw' && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${vimMode === 'INSERT' ? 'bg-emerald-500/20 text-emerald-400' :
            vimMode === 'VISUAL' || vimMode === 'V-LINE' || vimMode === 'V-BLOCK' ? 'bg-purple-500/20 text-purple-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
            -- {vimMode} --
          </span>
        )}
        {/* Editor mode badge */}
        {editorType === 'raw' && (
          <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
            {editorMode === 'vim' ? 'VIM' : editorMode === 'emacs' ? 'EMACS' : 'NORMAL'}
          </span>
        )}
        
        {/* System & RAM Stats */}
        {sysMemPct !== null && processMemMb !== null && (
          <>
            <span className={`mx-1 w-px h-3 border-l ${themeStyle.editorBorder}`}></span>
            <span className="flex items-center gap-1.5 text-[10px] opacity-40 hover:opacity-100 transition-opacity" title="M3Flow Memory Usage / System Memory Load">
              <Cpu size={10} />
              <span>APP: {processMemMb}MB</span>
              <span className="opacity-50">|</span>
              <span>SYS: {sysMemPct}%</span>
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4 opacity-60">
        {editorType === 'raw' && (
          <>
            <span className="text-[10px]">Ln {cursorLine}, Col {cursorCol}</span>
            <span className="text-[10px]">{totalLines} lines</span>
          </>
        )}
        <span className="text-[10px]">{wordCount} words</span>
        <span className="text-[10px]">{contentLength} chars</span>
        <span className="text-[10px]">UTF-8</span>
        <span className="text-[10px] uppercase">Markdown</span>

        <span className={`mx-1 w-px h-3 border-l ${themeStyle.editorBorder}`}></span>

        {/* Export buttons — integrated into status bar */}
        <button
          className="flex items-center gap-1 text-[10px] font-semibold opacity-60 hover:opacity-100 transition-all hover:text-blue-400 print:hidden"
          title="Export as Markdown"
          onClick={async () => {
            const lines = content.split('\n');
            const title = (lines.find(l => l.trim().startsWith('#')) || lines[0] || 'Untitled Note').replace(/^#+\s*/, '').trim().substring(0, 50);
            await window.dbAPI.exportMarkdown(title, content);
          }}
        >
          <Download size={10} /> MD
        </button>
        <button
          className="flex items-center gap-1 text-[10px] font-semibold opacity-60 hover:opacity-100 transition-all hover:text-purple-400 print:hidden"
          title="Export as PDF"
          onClick={async () => {
            const lines = content.split('\n');
            const title = (lines.find(l => l.trim().startsWith('#')) || lines[0] || 'Untitled Note').replace(/^#+\s*/, '').trim().substring(0, 50);
            await window.dbAPI.exportPDF(title);
          }}
        >
          <Download size={10} /> PDF
        </button>
      </div>
    </div>
  );
};

export default EditorStatusBar;
