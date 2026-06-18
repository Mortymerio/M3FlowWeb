import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { CheckCircle2, Circle, FileText, Loader2 } from 'lucide-react';

interface ParsedTask {
  noteId: string;
  noteTitle: string;
  lineNumber: number;
  taskIndex: number;
  checked: boolean;
  text: string;
}

const TasksDashboard = () => {
  const [tasks, setTasks] = useState<ParsedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const themeName = useStore(state => state.theme);
  const themeStyle = THEMES[themeName] || THEMES['midnight-indigo'];
  const openTab = useStore(state => state.openTab);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const scannedTasks = await (window as any).dbAPI.scanTasks();
      setTasks(scannedTasks);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggle = async (task: ParsedTask) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => 
      t.noteId === task.noteId && t.lineNumber === task.lineNumber 
        ? { ...t, checked: !t.checked } 
        : t
    ));

    try {
      await (window as any).dbAPI.toggleTask({
        noteId: task.noteId,
        lineNumber: task.lineNumber,
        checked: !task.checked
      });

      // Fetch fresh notes from sqlite and update zustand store
      // so if this note is open in another tab, its content updates.
      const freshNotes = await (window as any).dbAPI.getNotes();
      useStore.setState({ notes: freshNotes });
    } catch (e) {
      console.error('Failed to toggle task:', e);
      // Revert on failure
      loadTasks();
    }
  };

  const pendingTasks = tasks.filter(t => !t.checked);
  const completedTasks = tasks.filter(t => t.checked);

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center h-full ${themeStyle.editorBg} ${themeStyle.editorText}`}>
        <Loader2 className="animate-spin opacity-50" size={32} />
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto p-8 ${themeStyle.editorBg} ${themeStyle.editorText}`}>
      <div className="max-w-4xl mx-auto w-full">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Tasks Dashboard</h1>
            <p className="opacity-60 text-sm mt-1">Aggregated tasks from all your notes</p>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
            Pending Tasks <span className="px-1.5 py-0.5 rounded-full bg-black/20">{pendingTasks.length}</span>
          </h2>
          {pendingTasks.length === 0 ? (
            <div className="py-8 text-center opacity-40 text-sm border rounded-xl border-dashed">
              All caught up! No pending tasks found.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingTasks.map(task => (
                <TaskItem 
                  key={`${task.noteId}-${task.lineNumber}`} 
                  task={task} 
                  onToggle={() => handleToggle(task)}
                  onOpenNote={() => openTab({ type: 'note', noteId: task.noteId, title: task.noteTitle })}
                  themeStyle={themeStyle}
                />
              ))}
            </div>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
              Completed Tasks <span className="px-1.5 py-0.5 rounded-full bg-black/20">{completedTasks.length}</span>
            </h2>
            <div className="flex flex-col gap-2 opacity-60">
              {completedTasks.map(task => (
                <TaskItem 
                  key={`${task.noteId}-${task.lineNumber}`} 
                  task={task} 
                  onToggle={() => handleToggle(task)}
                  onOpenNote={() => openTab({ type: 'note', noteId: task.noteId, title: task.noteTitle })}
                  themeStyle={themeStyle}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskItem = ({ task, onToggle, onOpenNote, themeStyle }: any) => {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg border transition-all hover:shadow-md group ${themeStyle.editorBorder} hover:bg-black/5`}>
      <button 
        onClick={onToggle}
        className={`flex-shrink-0 transition-colors ${task.checked ? 'text-emerald-500' : 'text-gray-400 hover:text-emerald-400'}`}
      >
        {task.checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
      
      <span className={`flex-1 text-[14px] ${task.checked ? 'line-through opacity-70' : ''}`}>
        {task.text}
      </span>
      
      <button 
        onClick={onOpenNote}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-all hover:bg-black/10 flex-shrink-0 max-w-[150px]"
        title="Open Note"
      >
        <FileText size={12} className="opacity-50" />
        <span className="truncate">{task.noteTitle}</span>
      </button>
    </div>
  );
};

export default TasksDashboard;
