import { useEffect, useState } from 'react';
import { Bold, Italic, Strikethrough, Code, Heading1, Highlighter } from 'lucide-react';

interface SelectionToolbarProps {
  applyFormat: (format: string) => void;
}

const SelectionToolbar = ({ applyFormat }: SelectionToolbarProps) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setPosition(null);
        return;
      }

      // Evitar que aparezca si se seleccionan cosas fuera del editor raw
      const activeEl = document.activeElement;
      if (activeEl?.className.includes('cm-content')) {
        // En CodeMirror es más difícil obtener el bounding rect del selection nativo
        // porque usa su propio DOM virtual. Pero CodeMirror expone la selección.
        // Por simplicidad en esta fase, podemos basarnos en getBoundingClientRect
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (rect.width > 0) {
          setPosition({
            top: rect.top - 45, // 45px arriba de la selección
            left: rect.left + rect.width / 2, // Centrado
          });
        } else {
          setPosition(null);
        }
      } else {
        setPosition(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  if (!position) return null;

  return (
    <div 
      className="fixed z-[9999] flex items-center gap-1 p-1 bg-[#1e1e2e]/90 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: Math.max(10, position.top),
        left: position.left,
        transform: 'translateX(-50%)'
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevenir que se pierda el foco
    >
      {[
        { id: 'bold', icon: Bold, label: 'B' },
        { id: 'italic', icon: Italic, label: 'I' },
        { id: 'strikethrough', icon: Strikethrough, label: 'S' },
        { id: 'code', icon: Code, label: '</>' },
        { id: 'h1', icon: Heading1, label: 'H1' },
        { id: 'highlight', icon: Highlighter, label: 'H' },
      ].map(fmt => (
        <button
          key={fmt.id}
          onClick={() => applyFormat(fmt.id)}
          className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title={fmt.id}
        >
          <fmt.icon size={14} />
        </button>
      ))}
    </div>
  );
};

export default SelectionToolbar;
