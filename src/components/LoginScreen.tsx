import { useState } from 'react';
import { loginWithGithub, loginWithGoogle } from '../services/auth';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';

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
      toast.error('Login failed: ' + e.message);
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
      toast.error('Login failed: ' + e.message);
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
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
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
