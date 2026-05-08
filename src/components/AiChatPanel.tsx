/**
 * AiChatPanel — Side panel for AI chat in M3Flow.
 * Replaces the old dropdown-based AI interaction with a persistent chat panel.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Settings2, X, Send, Loader2, Cpu, ChevronDown, ChevronRight, Trash2, Brain } from 'lucide-react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { initWebLlm, getEngine } from '../lib/webllm';

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

  // AI Provider config from store
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
  const webLlmModelUrl = useStore(state => state.webLlmModelUrl);
  const setAiConfig = useStore(state => state.setAiConfig);
  const setActiveAiProvider = useStore(state => state.setActiveAiProvider);
  const notes = useStore(state => state.notes);

  const isWebLlmLoaded = useStore(state => state.isWebLlmLoaded);
  const webLlmProgress = useStore(state => state.webLlmProgress);
  const webLlmStatusText = useStore(state => state.webLlmStatusText);

  // Local chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Gemini model discovery
  const [availableGeminiModels, setAvailableGeminiModels] = useState<{ name: string, displayName: string }[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const fetchGeminiModels = useCallback(async () => {
    if (!geminiKey) return;
    setIsFetchingModels(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${geminiApiVersion || 'v1'}/models?key=${geminiKey}`);
      const data = await res.json();
      if (data.models) {
        const models = data.models
          .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
          .map((m: any) => ({
            name: m.name.replace('models/', ''),
            displayName: m.displayName
          }));
        setAvailableGeminiModels(models);
      } else if (data.error) {
        console.error("Gemini ListModels Error:", data.error);
      }
    } catch (e) {
      console.error("Fetch models failed:", e);
    } finally {
      setIsFetchingModels(false);
    }
  }, [geminiKey, geminiApiVersion]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

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

    const baseSystemMessage = `You are a helpful AI writing assistant for M3Flow. ${notebookSystemPrompt ? `Context for this notebook: ${notebookSystemPrompt}` : ''}
Analyze the user's instruction:
- If the user wants to chat, ask a question, or greet you, start your response with 'REPLY: ' followed by your answer.
- If the user wants to edit, rewrite, or transform the current note, output ONLY the new markdown content for the entire note, without any prefix.
- Never output both a reply and markdown unless specifically asked.`;

    let resultText = '';

    try {
      if (activeAiProvider === 'webllm') {
        const engine = getEngine();
        if (!engine) throw new Error("WebLLM Engine is not loaded.");
        const reply = await engine.chat.completions.create({
          messages: [
            { role: "system", content: baseSystemMessage },
            { role: "user", content: `Instruction: ${userMsg.text}\n\nDocument:\n${content}${vaultContext}\n\nOutput only the resulting markdown.` }
          ]
        });
        resultText = reply.choices[0]?.message.content || '';
      } else if (activeAiProvider === 'ollama') {
        const res = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel || "llama3",
            prompt: `Instruction: ${userMsg.text}\n\nNote Document:\n${content}${vaultContext}\n\nOutput only the resulting markdown content without conversational fill.`,
            stream: false
          })
        });
        const data = await res.json();
        resultText = data.response;
      } else if (activeAiProvider === 'openai' || activeAiProvider === 'lmstudio' || activeAiProvider === 'github' || activeAiProvider === 'azure') {
        const isLocal = activeAiProvider === 'lmstudio';
        const isGithub = activeAiProvider === 'github';
        const isAzure = activeAiProvider === 'azure';

        let url = 'https://api.openai.com/v1/chat/completions';
        if (isLocal) url = `${lmStudioUrl}/v1/chat/completions`;
        if (isGithub) url = 'https://models.inference.ai.azure.com/chat/completions';
        if (isAzure) url = azureUrl;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (isAzure) {
          headers['api-key'] = azureKey;
        } else {
          let token = openAiKey;
          if (isLocal) token = 'lm-studio';
          if (isGithub) token = githubToken;
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: isLocal ? "local-model" : "gpt-4o",
            messages: [
              { role: "system", content: baseSystemMessage },
              { role: "user", content: `Instruction: ${userMsg.text}\n\nDocument:\n${content}${vaultContext}` }
            ]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || 'API Error');
        resultText = data.choices?.[0]?.message?.content;
      } else if (activeAiProvider === 'gemini') {
        const isBeta = geminiApiVersion === 'v1beta';
        const payload: any = {
          contents: [{
            parts: [{
              text: isBeta
                ? `Instruction: ${userMsg.text}\n\nDocument:\n${content}${vaultContext}`
                : `System: ${baseSystemMessage}\n\nInstruction: ${userMsg.text}\n\nDocument:\n${content}${vaultContext}`
            }]
          }]
        };

        if (isBeta) {
          payload.system_instruction = { parts: [{ text: baseSystemMessage }] };
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/${geminiApiVersion || 'v1'}/models/${geminiModel || 'gemini-3.1-pro'}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || 'Gemini API Error');

        if (data.candidates && data.candidates.length > 0) {
          const cand = data.candidates[0];
          if (cand.content?.parts?.[0]?.text) {
            resultText = cand.content.parts[0].text;
          } else if (cand.finishReason && cand.finishReason !== 'STOP') {
            throw new Error(`Gemini blocked response. Reason: ${cand.finishReason}`);
          }
        }
      } else if (activeAiProvider === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: baseSystemMessage,
            messages: [
              { role: 'user', content: `Instruction: ${userMsg.text}\n\nDocument:\n${content}${vaultContext}` }
            ]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || 'Claude API Error');
        resultText = data.content?.[0]?.text;
      }

      if (resultText) {
        if (resultText.trim().startsWith('REPLY:')) {
          const aiMsg: ChatMessage = {
            id: `a-${Date.now()}`,
            role: 'ai',
            text: resultText.replace(/^REPLY:\s*/i, '').trim(),
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, aiMsg]);
        } else {
          onContentChange(resultText);
          let aiResponseText = '✅ Document updated successfully.';
          if (retrievedNotes.length > 0) {
            aiResponseText += `\n\n🔍 Searched vault context:\n${retrievedNotes.map(n => `- ${n.title}`).join('\n')}`;
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

  const clearChat = () => setMessages([]);

  const inputBg = isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-black/5 border-black/10 text-black placeholder-black/30';
  const fieldBg = isDark ? 'bg-black/20 border-white/5 text-white' : 'bg-black/5 border-black/10 text-black';
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
            const activeNotebookId = useStore.getState().activeNotebookId;
            const nb = useStore.getState().notebooks.find(n => n.id === activeNotebookId);
            const hasContext = nb?.config && JSON.parse(nb.config).systemPrompt;
            return hasContext ? (
              <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 text-[9px] px-2 py-0.5 rounded-full font-black border border-purple-500/30 ml-2 animate-pulse">
                <Brain size={8} /> CONTEXT ACTIVE
              </div>
            ) : null;
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

      {/* Chat messages */}
      <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 ${themeStyle.editorBg}`}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center px-4 gap-3">
            <Sparkles size={32} />
            <p className="text-xs">Ask AI to edit, translate, summarize or transform your note.</p>
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

      {/* Config section (collapsible) */}
      <div className={`border-t ${themeStyle.editorBorder}`}>
        <button
          onClick={() => setConfigOpen(!configOpen)}
          className={`w-full px-4 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-60 hover:opacity-100 transition-all ${hoverBg}`}
        >
          {configOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          <Settings2 size={10} />
          <span>{activeAiProvider} — config</span>
        </button>

        {configOpen && (
          <div className={`px-4 pb-3 space-y-2 ${themeStyle.editorBg}`}>
            <select
              value={activeAiProvider}
              onChange={(e) => setActiveAiProvider(e.target.value as typeof activeAiProvider)}
              className={`w-full rounded-lg p-2 text-[11px] outline-none border ${fieldBg}`}
            >
              <option value="webllm">M3Flow Embedded Beta</option>
              <option value="ollama">Ollama (Local)</option>
              <option value="lmstudio">LM Studio (Local)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="azure">MS Copilot (Azure OpenAI)</option>
              <option value="github">GitHub Copilot Models</option>
              <option value="gemini">Google Gemini</option>
              <option value="claude">Anthropic Claude</option>
            </select>

            {activeAiProvider === 'webllm' && !isWebLlmLoaded && (
              <div className="space-y-2">
                <p className="text-[10px] opacity-60">Download Qwen2.5 (400MB) to browser cache. Runs offline after first load.</p>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] opacity-40 font-bold uppercase">Model Mirror URL (optional)</span>
                  <input type="text" placeholder="https://..." value={webLlmModelUrl} onChange={(e) => setAiConfig('webLlmModelUrl', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
                </div>
                {webLlmStatusText ? (
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-[9px] text-blue-400 font-bold">{webLlmProgress}%</span>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden border ${isDark ? 'bg-black/40 border-white/5' : 'bg-black/10 border-black/5'}`}>
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${webLlmProgress}%` }} />
                    </div>
                    <span className="text-[8px] opacity-50">{webLlmStatusText}</span>
                  </div>
                ) : (
                  <button onClick={() => initWebLlm()} className="w-full py-2 rounded-lg bg-indigo-600/80 text-white text-[10px] font-bold hover:bg-indigo-500 transition-colors shadow-lg flex justify-center items-center gap-2">
                    <Cpu size={12} /> DOWNLOAD MODEL
                  </button>
                )}
              </div>
            )}

            {activeAiProvider === 'ollama' && (
              <div className="space-y-1.5">
                <input type="text" placeholder="URL (ej: http://localhost:11434)" value={ollamaUrl} onChange={(e) => setAiConfig('ollamaUrl', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
                <input type="text" placeholder="Model (ej: llama3, gemma)" value={ollamaModel} onChange={(e) => setAiConfig('ollamaModel', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
              </div>
            )}
            {activeAiProvider === 'lmstudio' && (
              <input type="text" placeholder="LM Studio URL" value={lmStudioUrl} onChange={(e) => setAiConfig('lmStudioUrl', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
            )}
            {activeAiProvider === 'openai' && (
              <input type="password" placeholder="sk-..." value={openAiKey} onChange={(e) => setAiConfig('openAiKey', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
            )}
            {activeAiProvider === 'azure' && (
              <div className="space-y-1.5">
                <input type="text" placeholder="Azure URL" value={azureUrl} onChange={(e) => setAiConfig('azureUrl', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
                <input type="password" placeholder="Azure API Key" value={azureKey} onChange={(e) => setAiConfig('azureKey', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
              </div>
            )}
            {activeAiProvider === 'github' && (
              <input type="password" placeholder="GitHub Token (ghp_...)" value={githubToken} onChange={(e) => setAiConfig('githubToken', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
            )}
            {activeAiProvider === 'gemini' && (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <select value={geminiApiVersion} onChange={(e) => setAiConfig('geminiApiVersion', e.target.value)} className={`text-[10px] p-2 rounded-lg w-24 border ${fieldBg}`}>
                    <option value="v1">v1 (Stable)</option>
                    <option value="v1beta">v1beta</option>
                  </select>
                  <div className="flex-1 flex gap-1 items-center">
                    {availableGeminiModels.length > 0 ? (
                      <select
                        value={geminiModel}
                        onChange={(e) => setAiConfig('geminiModel', e.target.value)}
                        className={`text-[10px] p-2 rounded-lg flex-1 border ${fieldBg}`}
                      >
                        {availableGeminiModels.map(m => (
                          <option key={m.name} value={m.name}>{m.displayName}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" placeholder="Model (ej: gemini-3.1-pro)" value={geminiModel} onChange={(e) => setAiConfig('geminiModel', e.target.value)} className={`text-[10px] p-2 rounded-lg flex-1 border ${fieldBg}`} />
                    )}
                    <button
                      onClick={fetchGeminiModels}
                      disabled={isFetchingModels || !geminiKey}
                      className={`p-2 rounded-lg border ${fieldBg} ${hoverBg} transition-colors disabled:opacity-30`}
                      title="Refresh models from API"
                    >
                      {isFetchingModels ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} className="rotate-90" />}
                    </button>
                  </div>
                </div>
                <input type="password" placeholder="Gemini API Key" value={geminiKey} onChange={(e) => setAiConfig('geminiKey', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
              </div>
            )}
            {activeAiProvider === 'claude' && (
              <input type="password" placeholder="sk-ant-..." value={claudeKey} onChange={(e) => setAiConfig('claudeKey', e.target.value)} className={`text-[10px] p-2 rounded-lg w-full border ${fieldBg}`} />
            )}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className={`px-3 py-3 border-t ${themeStyle.editorBorder} ${themeStyle.editorBg}`}>
        {activeAiProvider === 'webllm' && !isWebLlmLoaded ? (
          <p className="text-[10px] opacity-40 text-center">Open config above to download the AI model first.</p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none resize-none border transition-colors focus:border-blue-500 ${inputBg}`}
              placeholder="Ask AI to edit your note..."
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
              onClick={handleSend}
              disabled={isLoading || !prompt.trim()}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
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
