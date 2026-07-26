/**
 * AiChatPanel — Side panel for AI chat in M3Flow.
 * Replaces the old dropdown-based AI interaction with a persistent chat panel.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Trash2, X, Sparkles, Brain } from 'lucide-react';
import { THEMES } from '../themes';
import { useStore } from '../store';
import { executeAiPrompt } from '../services/aiService';
import { AiQuickActions } from './AiQuickActions';
import { AiProviderConfig } from './AiProviderConfig';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

interface AiChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  noteTitle: string;
  onContentChange: (markdown: string) => void;
}

const AiChatPanel = ({ isOpen, onClose, content, noteTitle, onContentChange }: AiChatPanelProps) => {
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const isDark = themeStyle.isDark !== false;

  // AI Provider state needed for execution
  const activeAiProvider = useStore(state => state.activeAiProvider);
  const openAiKey = useStore(state => state.openAiKey);
  const geminiKey = useStore(state => state.geminiKey);
  const geminiModel = useStore(state => state.geminiModel);
  const geminiApiVersion = useStore(state => state.geminiApiVersion);
  const claudeKey = useStore(state => state.claudeKey);
  const githubToken = useStore(state => state.githubToken);
  const azureUrl = useStore(state => state.azureUrl);
  const azureKey = useStore(state => state.azureKey);
  const ollamaUrl = useStore(state => state.ollamaUrl);
  const ollamaModel = useStore(state => state.ollamaModel);
  const lmStudioUrl = useStore(state => state.lmStudioUrl);
  const isWebLlmLoaded = useStore(state => state.isWebLlmLoaded);
  
  const notes = useStore(state => state.notes);

  // Local chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [undoContent, setUndoContent] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeNoteId = useStore(state => state.activeNoteId);
  const pendingAiPrompt = useStore(state => state.pendingAiPrompt);
  const aiChatHistory = useStore(state => state.aiChatHistory);
  const setAiChatHistory = useStore(state => state.setAiChatHistory);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  // Load chat history for the active note
  useEffect(() => {
    if (activeNoteId && aiChatHistory[activeNoteId]) {
      setMessages(aiChatHistory[activeNoteId]);
    } else {
      setMessages([]);
    }
  }, [activeNoteId]);

  // Save chat history when messages change
  useEffect(() => {
    if (activeNoteId && messages.length > 0) {
      setAiChatHistory(activeNoteId, messages);
    }
  }, [messages, activeNoteId]);

  // Consume pending AI prompt from Writing Assistant
  useEffect(() => {
    if (pendingAiPrompt && isOpen && !isLoading) {
      setPrompt(pendingAiPrompt);
      useStore.getState().setPendingAiPrompt(null);
      // Auto-send after a tick to let the UI update
      if (prompt.trim()) {
        setPrompt('');
      }
    }
  }, [pendingAiPrompt, isOpen, isLoading]);

  const handleSend = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: prompt.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setIsLoading(true);

    let vaultContext = '';
    let retrievedNotes: { title: string }[] = [];

    if (userMsg.text.toLowerCase().includes('@vault')) {
      const query = userMsg.text.replace(/@vault/ig, '').trim().toLowerCase();
      const keywords = query.split(/\s+/).filter(w => w.length > 2);

      if (keywords.length > 0) {
        const scoredNotes = notes.map(note => {
          let score = 0;
          const titleLower = note.title.toLowerCase();
          const bodyLower = note.body.toLowerCase();
          keywords.forEach(kw => {
            if (titleLower.includes(kw)) score += 5;
            if (bodyLower.includes(kw)) score += 1;
          });
          return { note, score };
        }).filter(n => n.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        if (scoredNotes.length > 0) {
          retrievedNotes = scoredNotes.map(sn => ({ title: sn.note.title }));
          vaultContext = "\n\nAdditional Vault Context:\n" + scoredNotes.map(sn => `--- Note: ${sn.note.title} ---\n${sn.note.body.substring(0, 2000)}`).join('\n\n');
        }
      }
    }

    // Obtener contexto de la libreta actual
    const activeNotebookId = useStore.getState().activeNotebookId;
    const activeNotebook = useStore.getState().notebooks.find(nb => nb.id === activeNotebookId);
    let notebookSystemPrompt = "";
    if (activeNotebook?.config) {
      try {
        const nbConfig = JSON.parse(activeNotebook.config);
        notebookSystemPrompt = nbConfig.systemPrompt || "";
      } catch { }
    }



    try {
      const resultText = await executeAiPrompt({
        instruction: userMsg.text,
        documentContext: content,
        notebookSystemPrompt,
        vaultContext,
      });

      if (resultText) {
        if (resultText.trim().startsWith('REPLY:') && resultText.includes('---DOC---')) {
          // EDIT_AND_EXPLAIN mode: both a chat reply AND a document update
          const parts = resultText.split('---DOC---');
          const replyPart = parts[0].replace(/^REPLY:\s*/i, '').trim();
          const docPart = parts[1]?.trim();
          if (docPart) onContentChange(docPart);
          const aiMsg: ChatMessage = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: replyPart + (docPart ? '\n\n✅ Documento actualizado.' : ''),
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, aiMsg]);
        } else if (resultText.trim().startsWith('REPLY:')) {
          const aiMsg: ChatMessage = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: resultText.replace(/^REPLY:\s*/i, '').trim(),
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          onContentChange(resultText);
          setUndoContent(content); // Capture content before AI overwrite for undo
          let aiResponseText = '✅ Documento actualizado correctamente.';
          if (retrievedNotes.length > 0) {
            aiResponseText += `\n\n🔍 Contexto del vault usado:\n${retrievedNotes.map(n => `- ${n.title}`).join('\n')}`;
          }
          const aiMsg: ChatMessage = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: aiResponseText,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, aiMsg]);
        }
      } else {
        const errMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'ai',
          text: `⚠️ AI returned an empty response. This can happen if the prompt is too short, the content is filtered, or the API key is incorrect. Try a more specific instruction. (Provider: ${activeAiProvider})`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      const errMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'ai',
        text: `❌ Error: ${errorMessage}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, activeAiProvider, content, ollamaUrl, ollamaModel, openAiKey, lmStudioUrl, githubToken, azureUrl, azureKey, geminiKey, geminiModel, geminiApiVersion, claudeKey, onContentChange]);

  const clearChat = () => {
    setMessages([]);
    if (activeNoteId) setAiChatHistory(activeNoteId, []);
  };

  const inputBg = isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-black/5 border-black/10 text-black placeholder-black/30';
  const hoverBg = isDark ? 'hover:bg-white/10' : 'hover:bg-black/10';

  return (
    <div
      className={`h-full flex flex-col border-l transition-all duration-300 ease-in-out ${themeStyle.editorBorder}`}
      style={{
        width: isOpen ? 360 : 0,
        minWidth: isOpen ? 360 : 0,
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${themeStyle.editorHeader} ${themeStyle.editorBorder}`}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-500" />
          <span className={`text-sm font-bold ${themeStyle.editorText}`}>AI Chat</span>
          {(() => {
            try {
              const currentNotebookId = useStore.getState().activeNotebookId;
              const nb = useStore.getState().notebooks.find(n => n.id === currentNotebookId);
              const hasContext = nb?.config && JSON.parse(nb.config).systemPrompt;
              return hasContext ? (
                <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 text-[9px] px-2 py-0.5 rounded-full font-black border border-purple-500/30 ml-2 animate-pulse">
                  <Brain size={8} /> CONTEXT ACTIVE
                </div>
              ) : null;
            } catch {
              return null;
            }
          })()}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className={`p-1.5 rounded-md opacity-50 ${hoverBg} hover:opacity-100 transition-all`}
            title="New chat"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md opacity-50 ${hoverBg} hover:opacity-100 transition-all`}
            title="Close panel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Note context */}
      {noteTitle && (
        <div className={`px-4 py-2 border-b text-xs flex items-center gap-2 ${themeStyle.editorBorder} opacity-60`}>
          <span>📎</span>
          <span className="truncate font-medium">{noteTitle}</span>
        </div>
      )}

      {/* Undo bar after AI content overwrite */}
      {undoContent !== null && (
        <div className={`px-4 py-2 border-b flex items-center justify-between ${themeStyle.editorBorder} bg-amber-500/10`}>
          <span className="text-[10px] font-bold text-amber-400">AI replaced document content</span>
          <button
            onClick={() => { onContentChange(undoContent); setUndoContent(null); }}
            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/20 px-2 py-1 rounded-md transition-colors"
          >
            ↩ UNDO
          </button>
        </div>
      )}

      {/* Chat messages */}
      <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 ${themeStyle.editorBg}`}>
        {messages.length === 0 && (
          <div className="flex flex-col gap-4 py-4">
            <AiQuickActions onPromptSelected={setPrompt} isDark={isDark} />
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : isDark
                    ? 'bg-white/10 text-white/90 rounded-bl-sm'
                    : 'bg-black/5 text-black/80 rounded-bl-sm'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/60'}`}>
              <Loader2 size={12} className="animate-spin" />
              Generating...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <AiProviderConfig />

      {/* Input area */}
      <div className={`px-3 py-3 border-t ${themeStyle.editorBorder} ${themeStyle.editorBg}`}>
        {activeAiProvider === 'webllm' && !isWebLlmLoaded ? (
          <p className="text-[10px] opacity-40 text-center">Open config above to download the AI model first.</p>
        ) : (
          <div 
            className="flex items-end gap-2 no-drag" 
            style={{ WebkitAppRegion: 'no-drag', cursor: 'text' } as any}
            onClick={() => inputRef.current?.focus()}
          >
            <textarea
              ref={inputRef}
              className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none resize-none border transition-colors focus:border-blue-500 pointer-events-auto select-text cursor-text ${inputBg}`}
              style={{ WebkitAppRegion: 'no-drag', userSelect: 'auto' } as any}
              placeholder="Escribe algo o elige una acción arriba... (Enter para enviar)"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleSend(); }}
              disabled={isLoading || !prompt.trim()}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChatPanel;
