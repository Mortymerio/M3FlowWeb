import { useState } from 'react';
import { loginWithGithub, loginWithGoogle } from '../services/auth';
import { Github, Mail } from 'lucide-react';

export default function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [loading, setLoading] = useState(false);

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      const user = await loginWithGithub();
      if (user) {
        onLogin(user);
      }
    } catch (e: any) {
      console.error(e);
      alert('Login failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const user = await loginWithGoogle();
      if (user) {
        onLogin(user);
      }
    } catch (e: any) {
      console.error(e);
      alert('Login failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#15191e]">
      <div className="text-center p-10 bg-[#1e2329] rounded-2xl shadow-xl border border-[#252b33] max-w-sm w-full">
        <h1 className="text-3xl font-bold mb-2 text-[#c9d1d9] tracking-wide">M3Flow</h1>
        <p className="text-[#8892b0] mb-8 text-sm">The High-Performance Vault</p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#2b303b] text-[#58a6ff] font-semibold rounded-lg hover:bg-[#343a45] transition-colors border border-[#252b33] disabled:opacity-50"
          >
            <Github size={20} />
            {loading ? 'Authenticating...' : 'Sign in with GitHub'}
          </button>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#2b303b] text-[#c9d1d9] font-semibold rounded-lg hover:bg-[#343a45] transition-colors border border-[#252b33] disabled:opacity-50"
          >
            <Mail size={20} />
            {loading ? 'Authenticating...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
