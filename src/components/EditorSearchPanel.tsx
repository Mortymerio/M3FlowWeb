import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { X, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from 'lucide-react';
import { setSearchQuery, SearchQuery, replaceNext, replaceAll, closeSearchPanel } from '@codemirror/search';

interface EditorSearchPanelProps {
  editorRef: React.MutableRefObject<any>;
}

export const EditorSearchPanel = ({ editorRef }: EditorSearchPanelProps) => {
  const isSearchPanelOpen = useStore(state => state.isSearchPanelOpen);
  const setSearchPanelOpen = useStore(state => state.setSearchPanelOpen);
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const editorType = useStore(state => state.editorType);

  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [matchCase, setMatchCase] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isSearchPanelOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    } else if (!isSearchPanelOpen && editorRef.current?.view) {
      closeSearchPanel(editorRef.current.view);
    }
  }, [isSearchPanelOpen]);

  // Update CM search query or native find
  useEffect(() => {
    if (editorType === 'rich') {
       if (isSearchPanelOpen && query) {
          if ((window as any).dbAPI?.findInPage) {
             // Initial search to highlight occurrences
             (window as any).dbAPI.findInPage(query, { forward: true, matchCase, findNext: false });
          }
       } else {
          if ((window as any).dbAPI?.stopFindInPage) {
             (window as any).dbAPI.stopFindInPage('clearSelection');
          }
       }
       return;
    }

    if (!editorRef.current || !editorRef.current.view) return;
    const view = editorRef.current.view;
    if (isSearchPanelOpen && query) {
       try {
         view.dispatch({
           effects: setSearchQuery.of(new SearchQuery({
             search: query,
             caseSensitive: matchCase,
             regexp: useRegex,
             replace: replaceText,
           }))
         });
       } catch (e) {
         // Regex might be invalid while typing
       }
    } else {
       // Clear search when closed or empty
       view.dispatch({
         effects: setSearchQuery.of(new SearchQuery({ search: '' }))
       });
    }
  }, [query, matchCase, useRegex, replaceText, isSearchPanelOpen, editorRef, editorType]);

  const doFind = (reverse = false) => {
    if (!query) return;

    if (editorType === 'rich') {
      if ((window as any).dbAPI?.findInPage) {
        (window as any).dbAPI.findInPage(query, { forward: !reverse, matchCase, findNext: true });
      } else {
        (window as any).find(query, matchCase, reverse, true, false, false, false);
      }
      return;
    }

    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    try {
      const sq = new SearchQuery({ search: query, caseSensitive: matchCase, regexp: useRegex });
      const cursor = sq.getCursor(view.state);
      const selFrom = view.state.selection.main.from;
      const selTo = view.state.selection.main.to;
      
      let match = null;
      let firstMatch = null;
      let lastMatch = null;
      let prevMatch = null;

      let iter = cursor.next();
      while (!iter.done) {
        const val = iter.value;
        if (!firstMatch) firstMatch = val;
        lastMatch = val;

        if (!reverse) {
          // Forward search: find the first match starting after the current selection starts
          if (val.from >= selTo || (val.from > selFrom && val.to > selTo)) {
            match = val;
            break;
          }
        } else {
          // Reverse search: keep tracking until we hit current selection
          if (val.from < selFrom || (val.from === selFrom && val.to < selTo)) {
             prevMatch = val;
          }
        }
        iter = cursor.next();
      }

      if (reverse) {
         match = prevMatch || lastMatch;
      } else if (!match) {
         match = firstMatch;
      }

      if (match) {
        view.dispatch({
          selection: { anchor: match.from, head: match.to },
          scrollIntoView: true,
          userEvent: "select.search"
        });
      }
    } catch (e) {
      // Regex invalid
    }
  };

  const doReplace = () => {
    if (editorType === 'rich') {
      const selection = window.getSelection();
      // Only replace if the current selection matches the query (simple check)
      if (selection && selection.toString().toLowerCase() === query.toLowerCase() && query !== '') {
        document.execCommand('insertText', false, replaceText);
      }
      doFind(false);
      return;
    }
    if (editorRef.current?.view) replaceNext(editorRef.current.view);
  };

  const doReplaceAll = () => {
    if (editorType === 'rich') {
      let count = 0;
      window.getSelection()?.removeAllRanges();
      while ((window as any).find(query, matchCase, false, false, false, false, false)) {
        document.execCommand('insertText', false, replaceText);
        count++;
        if (count > 1000) break;
      }
      return;
    }
    if (editorRef.current?.view) replaceAll(editorRef.current.view);
  };

  // Hotkeys inside panel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchPanelOpen(false);
      editorRef.current?.view?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      doFind(e.shiftKey);
    }
  };

  const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.altKey || e.ctrlKey || e.metaKey) {
        doReplaceAll();
      } else {
        doReplace();
      }
    } else if (e.key === 'Escape') {
      setSearchPanelOpen(false);
      editorRef.current?.view?.focus();
    }
  };

  if (!isSearchPanelOpen) return null;

  return (
    <div className={`absolute top-4 right-6 z-50 rounded-xl border shadow-2xl backdrop-blur-xl p-2.5 w-[360px] flex flex-col gap-2 animate-in slide-in-from-top-4 fade-in duration-200 ${themeStyle.isDark !== false ? 'bg-[#1e1e1e]/85 border-white/10 text-white' : 'bg-white/90 border-black/10 text-black'}`}>
      {/* Search Row */}
      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => setShowReplace(!showReplace)}
          className={`p-1 rounded transition-colors ${themeStyle.isDark !== false ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
        >
          {showReplace ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        
        <div className={`flex-1 flex items-center px-2 py-1.5 rounded border transition-colors ${themeStyle.isDark !== false ? 'bg-black/20 border-white/10 focus-within:border-blue-500/50 focus-within:bg-black/40' : 'bg-black/5 border-black/10 focus-within:border-blue-500/50 focus-within:bg-white'}`}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find"
            className="w-full bg-transparent outline-none text-[12px] placeholder:opacity-40"
          />
          <button 
            onClick={() => setMatchCase(!matchCase)}
            className={`px-1 rounded text-[10px] font-mono font-bold transition-all ${matchCase ? 'bg-blue-500 text-white' : 'opacity-50 hover:opacity-100 hover:bg-white/10'}`}
            title="Match Case"
          >
            Aa
          </button>
          <button 
            onClick={() => setUseRegex(!useRegex)}
            className={`px-1 rounded text-[10px] font-mono font-bold transition-all ml-0.5 ${useRegex ? 'bg-blue-500 text-white' : 'opacity-50 hover:opacity-100 hover:bg-white/10'}`}
            title="Use Regular Expression"
          >
            .*
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={() => doFind(true)} className={`p-1.5 rounded transition-colors ${themeStyle.isDark !== false ? 'hover:bg-white/10' : 'hover:bg-black/5'}`} title="Previous Match (Shift+Enter)">
            <ArrowUp size={14} />
          </button>
          <button onClick={() => doFind(false)} className={`p-1.5 rounded transition-colors ${themeStyle.isDark !== false ? 'hover:bg-white/10' : 'hover:bg-black/5'}`} title="Next Match (Enter)">
            <ArrowDown size={14} />
          </button>
        </div>
        
        <button onClick={() => { setSearchPanelOpen(false); editorRef.current?.view?.focus(); }} className={`p-1.5 rounded transition-colors ml-0.5 ${themeStyle.isDark !== false ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-500/10 text-red-500'}`} title="Close (Esc)">
          <X size={14} />
        </button>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="flex items-center gap-1.5 pl-[28px] pr-8">
          <div className={`flex-1 flex items-center px-2 py-1.5 rounded border transition-colors ${themeStyle.isDark !== false ? 'bg-black/20 border-white/10 focus-within:border-blue-500/50 focus-within:bg-black/40' : 'bg-black/5 border-black/10 focus-within:border-blue-500/50 focus-within:bg-white'}`}>
            <input
              type="text"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              onKeyDown={handleReplaceKeyDown}
              placeholder="Replace"
              className="w-full bg-transparent outline-none text-[12px] placeholder:opacity-40"
            />
          </div>
          
          <button 
            onClick={() => doReplace()} 
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors border shadow-sm ${themeStyle.isDark !== false ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-black/5 border-black/10 hover:bg-black/10'}`}
            title="Replace (Enter)"
          >
            Replace
          </button>
          <button 
            onClick={() => doReplaceAll()} 
            className={`px-2 py-1.5 rounded text-[11px] font-medium transition-colors border shadow-sm ${themeStyle.isDark !== false ? 'bg-white/5 border-white/10 hover:bg-white/15' : 'bg-black/5 border-black/10 hover:bg-black/10'}`}
            title="Replace All (Ctrl+Enter)"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
};
