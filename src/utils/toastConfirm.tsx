import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

export const toastConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
  toast((t) => (
    <div className="flex flex-col gap-3 min-w-[200px]">
      <div className="flex items-start gap-2 text-sm font-medium">
        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
        <span className="leading-tight">{message}</span>
      </div>
      <div className="flex justify-end gap-2 mt-1">
        <button
          onClick={() => {
            toast.dismiss(t.id);
            if (onCancel) onCancel();
          }}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-white/5 hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="px-3 py-1.5 text-xs font-bold rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  ), {
    duration: 10000,
    position: 'top-center',
    style: {
      background: '#1e2329',
      color: '#e2e8f0',
      border: '1px solid #334155',
      padding: '16px',
    }
  });
};
