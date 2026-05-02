import { useState, useEffect } from 'react';
import { X, Cloud, GitBranch, Loader2, Database, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { THEMES } from '../themes';

interface SyncSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SyncSettingsModal = ({ isOpen, onClose }: SyncSettingsModalProps) => {
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const isDark = themeStyle.isDark !== false;

  const githubSyncToken = useStore(state => state.githubSyncToken);
  const githubSyncRepo = useStore(state => state.githubSyncRepo);
  const githubSyncMarkdown = useStore(state => state.githubSyncMarkdown);
  const githubSyncDb = useStore(state => state.githubSyncDb);
  const setGithubSyncConfig = useStore(state => state.setGithubSyncConfig);
  const triggerManualSync = useStore(state => state.triggerManualSync);
  const syncStatus = useStore(state => state.syncStatus);
  const syncErrorMsg = useStore(state => state.syncErrorMsg);
  const lastSyncTime = useStore(state => state.lastSyncTime);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!isOpen) setTestResult(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!githubSyncToken) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const dbAPI = (window as any).dbAPI;
      const res = await dbAPI.githubTestConnection(githubSyncToken);
      if (res.success) {
        setTestResult({ success: true, msg: `Connected as @${res.username}` });
      } else {
        setTestResult({ success: false, msg: res.error });
      }
    } catch (e: any) {
      setTestResult({ success: false, msg: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleImport = async () => {
    if (!githubSyncToken || !githubSyncRepo) return;
    if (!confirm('WARNING: This will replace your local database with the one from GitHub. Unsynced local changes will be lost. Proceed?')) return;
    
    setIsImporting(true);
    try {
      const dbAPI = (window as any).dbAPI;
      const res = await dbAPI.githubImportDb({ token: githubSyncToken, repoName: githubSyncRepo });
      if (!res.success) {
        alert(`Import failed: ${res.error}`);
      }
    } catch (e: any) {
      alert(`Import failed: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const bgClass = themeStyle.sidebarBg || (isDark ? 'bg-[#15191e]' : 'bg-white');
  const textClass = themeStyle.sidebarText || (isDark ? 'text-slate-200' : 'text-gray-800');
  const borderClass = themeStyle.sidebarBorder || (isDark ? 'border-white/10' : 'border-gray-200');
  const inputBg = isDark ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-drag">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${bgClass} ${borderClass} ${textClass}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${borderClass} bg-black/10`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold">Cloud Sync & Backup</h2>
              <p className="text-[10px] opacity-60">Auto-sync your vault to GitHub when idle.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          {/* GitHub Connection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-60">
              <GitBranch size={14} /> GitHub Account
            </div>
            
            <div>
              <label className="text-[11px] font-semibold opacity-80 mb-1 block">Personal Access Token (Classic or Fine-grained)</label>
              <input 
                type="password" 
                value={githubSyncToken} 
                onChange={e => setGithubSyncConfig({ githubSyncToken: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxx..."
                className={`w-full px-3 py-2 rounded-lg border text-xs outline-none focus:border-blue-500 transition-colors ${inputBg} ${textClass}`}
              />
              <p className="text-[10px] opacity-50 mt-1">Needs `repo` scope to create and push to repositories.</p>
            </div>

            <div>
              <label className="text-[11px] font-semibold opacity-80 mb-1 block">Backup Repository Name</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={githubSyncRepo} 
                  onChange={e => setGithubSyncConfig({ githubSyncRepo: e.target.value })}
                  className={`flex-1 px-3 py-2 rounded-lg border text-xs outline-none focus:border-blue-500 transition-colors ${inputBg} ${textClass}`}
                />
                <button 
                  onClick={handleTest}
                  disabled={!githubSyncToken || isTesting}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isTesting ? <Loader2 size={14} className="animate-spin" /> : 'Test Connection'}
                </button>
              </div>
              {testResult && (
                <div className={`text-[10px] mt-2 flex items-center gap-1 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {testResult.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {testResult.msg}
                </div>
              )}
            </div>
          </div>

          <div className={`h-px w-full ${borderClass}`}></div>

          {/* Sync Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-60">
              <Database size={14} /> Backup Options
            </div>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors hover:bg-black/5 ${borderClass}`}>
              <input 
                type="checkbox" 
                checked={githubSyncMarkdown} 
                onChange={e => setGithubSyncConfig({ githubSyncMarkdown: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="text-xs font-bold flex items-center gap-1"><FileText size={12} /> Sync Markdown Notes</div>
                <div className="text-[10px] opacity-60">Uploads all your notes as readable .md files to GitHub. Great for mobile viewing.</div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors hover:bg-black/5 ${borderClass}`}>
              <input 
                type="checkbox" 
                checked={githubSyncDb} 
                onChange={e => setGithubSyncConfig({ githubSyncDb: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="text-xs font-bold flex items-center gap-1"><Database size={12} /> Sync SQLite Database</div>
                <div className="text-[10px] opacity-60">Uploads the raw m3flow.db file. Necessary if you want to restore the entire workspace later.</div>
              </div>
            </label>
          </div>

          {/* Manual Actions */}
          <div className={`p-4 rounded-xl border ${borderClass} bg-black/10 space-y-3`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold">Manual Actions</div>
                <div className="text-[10px] opacity-60">
                  {lastSyncTime ? `Last sync: ${new Date(lastSyncTime).toLocaleString()}` : 'Never synced'}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={triggerManualSync}
                disabled={!githubSyncToken || syncStatus === 'syncing'}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {syncStatus === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
                Push Backup Now
              </button>
              
              <button 
                onClick={handleImport}
                disabled={!githubSyncToken || !githubSyncRepo || isImporting}
                className="flex-1 py-2 bg-red-900/50 hover:bg-red-800/80 border border-red-500/30 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                Import DB from Cloud
              </button>
            </div>
            {syncErrorMsg && (
               <div className="text-[10px] text-red-400 mt-2 bg-red-900/20 p-2 rounded border border-red-900/50">
                 Error: {syncErrorMsg}
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SyncSettingsModal;
