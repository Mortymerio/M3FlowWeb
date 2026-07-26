import { useState, useEffect, useCallback } from 'react';
import { Settings2, ChevronDown, ChevronRight, Cpu, Send, Loader2, Lock, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { toastConfirm } from '../utils/toastConfirm';
import { THEMES } from '../themes';
import { initWebLlm } from '../lib/webllm';

export const AiProviderConfig = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const isDark = themeStyle.isDark !== false;
  
  const hoverBg = isDark ? 'hover:bg-white/10' : 'hover:bg-black/5';
  const fieldBg = isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-black/5 border-black/10 text-black placeholder-black/30';

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

  const isWebLlmLoaded = useStore(state => state.isWebLlmLoaded);
  const webLlmProgress = useStore(state => state.webLlmProgress);
  const webLlmStatusText = useStore(state => state.webLlmStatusText);

  // Vault state
  const vaultUnlocked = useStore(state => state.vaultUnlocked);
  const vaultExists = useStore(state => state.vaultExists);
  const setMasterPassword = useStore(state => state.setMasterPassword);
  const resetVault = useStore(state => state.resetVault);
  const checkVaultExists = useStore(state => state.checkVaultExists);
  const [vaultInput, setVaultInput] = useState('');
  const [vaultError, setVaultError] = useState(false);

  useEffect(() => {
    checkVaultExists();
  }, [checkVaultExists]);

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
      }
    } catch (e) {
      console.error("Fetch models failed:", e);
    } finally {
      setIsFetchingModels(false);
    }
  }, [geminiKey, geminiApiVersion]);

  return (
    <div className={`border-t ${themeStyle.editorBorder}`}>
      <button
        onClick={() => setConfigOpen(!configOpen)}
        className={`w-full px-4 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-60 hover:opacity-100 transition-all ${hoverBg}`}
      >
        {configOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Settings2 size={10} />
        <span>{activeAiProvider} - config</span>
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
          
          {/* Cloud providers require Vault */}
          {['openai', 'azure', 'github', 'gemini', 'claude'].includes(activeAiProvider) && !vaultUnlocked ? (
            <div className={`p-3 rounded-lg border ${themeStyle.editorBorder} bg-black/20 mt-2 space-y-3`}>
              <div className="flex items-center gap-2 text-yellow-500">
                <Lock size={14} />
                <span className="text-[11px] font-bold">API Vault</span>
              </div>
              <p className="text-[10px] opacity-70 leading-tight">
                {vaultExists 
                  ? "Ingresa tu contraseña para desencriptar tus claves." 
                  : "Crea una contraseña maestra para encriptar tus claves. Usamos AES-256-GCM (estándar de seguridad militar)."}
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Contraseña Maestra"
                  value={vaultInput}
                  onChange={(e) => { setVaultInput(e.target.value); setVaultError(false); }}
                  className={`text-[10px] p-2 rounded-lg flex-1 border ${vaultError ? 'border-red-500 bg-red-500/10' : fieldBg}`}
                />
                <button
                  onClick={async () => {
                    const success = await setMasterPassword(vaultInput);
                    if (!success) setVaultError(true);
                  }}
                  className="px-3 py-1 bg-yellow-600/80 hover:bg-yellow-500 text-white text-[10px] font-bold rounded-lg transition-colors"
                >
                  {vaultExists ? 'Unlock' : 'Create'}
                </button>
              </div>
              
              {vaultExists && (
                <button 
                  onClick={() => {
                    toastConfirm(
                      'Are you sure you want to delete the vault? You will lose all your encrypted keys permanently.',
                      () => resetVault()
                    );
                  }}
                  className="w-full flex items-center justify-center gap-1 mt-2 text-[9px] text-red-400 hover:text-red-300 transition-colors opacity-70"
                >
                  <Trash2 size={10} /> Delete vault and keys
                </button>
              )}
            </div>
          ) : (
            <>
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
              
              <div className="pt-2 border-t border-white/5 mt-4">
                <button 
                  onClick={() => {
                    toastConfirm(
                      'Are you sure you want to delete the vault? You will lose all your encrypted keys permanently.',
                      () => resetVault()
                    );
                  }}
                  className="w-full flex items-center justify-center gap-1 text-[9px] text-red-400 hover:text-red-300 transition-colors opacity-70"
                >
                  <Trash2 size={10} /> Delete vault and keys
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
