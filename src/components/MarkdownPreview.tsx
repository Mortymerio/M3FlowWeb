import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { mdParser } from '../lib/MarkdownEngine';
import { useStore } from '../store';
import { THEMES } from '../themes';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview = React.memo(({ content, className = '' }: MarkdownPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: themeStyle.codeTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'sandbox',
      fontFamily: 'inherit',
      suppressErrorRendering: true
    });
  }, [themeStyle.codeTheme]);

  useEffect(() => {
    let isCancelled = false;
    
    const renderMermaid = async () => {
      if (!containerRef.current) return;
      const elements = containerRef.current.querySelectorAll('.mermaid');
      if (elements.length === 0) return;

      for (let i = 0; i < elements.length; i++) {
        if (isCancelled) break;
        const el = elements[i];
        
        // Skip if already processed or has error
        if (el.querySelector('svg') || el.querySelector('.mermaid-error')) continue;
        
        const src = el.getAttribute('data-mermaid-src');
        if (src) {
          try {
            const uniqueId = `mermaid-${Date.now()}-${i}`;
            const renderPromise = mermaid.render(uniqueId, src);
            const timeoutPromise = new Promise<{svg: string}>((_, reject) => 
              setTimeout(() => reject(new Error('Mermaid timeout')), 2000)
            );
            
            const { svg } = await Promise.race([renderPromise, timeoutPromise]);
            
            if (!isCancelled) {
              el.innerHTML = svg;
              el.setAttribute('data-processed', 'true');
            }
          } catch (err) {
            if (!isCancelled) {
              console.error('Mermaid render error:', err);
              el.innerHTML = `<div class="mermaid-error" style="color:red; font-size:12px; margin-top:10px; padding:10px; border:1px solid red; border-radius:5px;">Error de Sintaxis en Mermaid. Revisa el código.</div>`;
            }
          }
        }
      }
    };

    const timeout = setTimeout(renderMermaid, 500);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [content]);

  return (
    <div
      id="preview-area"
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: mdParser.render(content) }}
    />
  );
});
