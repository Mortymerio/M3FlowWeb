import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { THEMES } from '../themes';
import { CheckCircle2, Circle, FileText, Loader2, LayoutList, Calendar, Columns3, X, Clock } from 'lucide-react';
import TasksCalendarView from './TasksCalendarView';
import TasksKanbanView from './TasksKanbanView';

interface ParsedTask {
  noteId: string;
  noteTitle: string;
  noteStatus: string;
  lineNumber: number;
  taskIndex: number;
  checked: boolean;
  text: string;
  dueDate: number | null;
  priority: string;
}

type ViewMode = 'list' | 'calendar' | 'kanban';

const TasksDashboard = () => {
  const [tasks, setTasks] = useState<ParsedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [datePickerTask, setDatePickerTask] = useState<ParsedTask | null>(null);
  const [datePickerValue, setDatePickerValue] = useState('');
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

  const handleOpenNote = (task: ParsedTask) => {
    openTab({ type: 'note', noteId: task.noteId, title: task.noteTitle });
  };

  const handleSetDueDate = async (task: ParsedTask, date: number | null) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.noteId === task.noteId && t.lineNumber === task.lineNumber
        ? { ...t, dueDate: date }
        : t
    ));

    try {
      await (window as any).dbAPI.setTaskDueDate({
        noteId: task.noteId,
        lineNumber: task.lineNumber,
        dueDate: date,
      });
    } catch (e) {
      console.error('Failed to set due date:', e);
      loadTasks();
    }
  };

  const handleDatePickerSubmit = () => {
    if (datePickerTask && datePickerValue) {
      const dt = new Date(datePickerValue);
      if (!isNaN(dt.getTime())) {
        handleSetDueDate(datePickerTask, dt.getTime());
      }
    }
    setDatePickerTask(null);
    setDatePickerValue('');
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
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${themeStyle.editorBg} ${themeStyle.editorText}`}>
      {/* Header + View Selector */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Tasks Dashboard</h1>
              <p className="opacity-60 text-sm mt-1">
                {pendingTasks.length} pending · {completedTasks.length} completed · {tasks.length} total
              </p>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className={`flex items-center p-1 rounded-xl border ${themeStyle.editorBorder} bg-black/10`}>
            {([
              { id: 'list' as ViewMode, icon: LayoutList, label: 'List' },
              { id: 'calendar' as ViewMode, icon: Calendar, label: 'Calendar' },
              { id: 'kanban' as ViewMode, icon: Columns3, label: 'Kanban' },
            ]).map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all
                  ${viewMode === mode.id
                    ? 'bg-blue-500/20 text-blue-400 shadow-sm border border-blue-500/20'
                    : 'opacity-50 hover:opacity-100 hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <mode.icon size={14} />
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="max-w-4xl mx-auto w-full">
            {/* Pending Tasks */}
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
                      onOpenNote={() => handleOpenNote(task)}
                      onSetDate={() => { setDatePickerTask(task); setDatePickerValue(''); }}
                      onClearDate={() => handleSetDueDate(task, null)}
                      themeStyle={themeStyle}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Tasks */}
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
                      onOpenNote={() => handleOpenNote(task)}
                      onSetDate={() => { setDatePickerTask(task); setDatePickerValue(''); }}
                      onClearDate={() => handleSetDueDate(task, null)}
                      themeStyle={themeStyle}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <TasksCalendarView
          tasks={tasks}
          themeStyle={themeStyle}
          onToggle={handleToggle}
          onOpenNote={handleOpenNote}
          onSetDueDate={handleSetDueDate}
        />
      )}

      {viewMode === 'kanban' && (
        <TasksKanbanView
          tasks={tasks}
          onToggle={handleToggle}
          onOpenNote={handleOpenNote}
        />
      )}

      {/* Date Picker Modal */}
      {datePickerTask && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDatePickerTask(null)}>
          <div
            className={`w-80 rounded-2xl border shadow-2xl p-6 ${themeStyle.editorBg} ${themeStyle.editorBorder} ${themeStyle.editorText}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-400" />
                <span className="text-[12px] font-black uppercase tracking-widest">Set Due Date</span>
              </div>
              <button onClick={() => setDatePickerTask(null)} className="p-1 rounded hover:bg-white/10 transition-colors">
                <X size={14} className="opacity-50" />
              </button>
            </div>

            <p className="text-[12px] opacity-60 mb-4 line-clamp-2">"{datePickerTask.text}"</p>

            <input
              type="date"
              autoFocus
              value={datePickerValue}
              onChange={(e) => setDatePickerValue(e.target.value)}
              className={`w-full bg-black/20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 mb-4 ${themeStyle.editorBorder}`}
            />

            <div className="flex gap-2">
              <button
                onClick={handleDatePickerSubmit}
                disabled={!datePickerValue}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg py-2 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                Save
              </button>
              {datePickerTask.dueDate && (
                <button
                  onClick={() => { handleSetDueDate(datePickerTask, null); setDatePickerTask(null); }}
                  className="px-4 bg-red-500/20 text-red-400 rounded-lg py-2 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-red-500/30 active:scale-95"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick date options */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {[
                { label: 'Today', days: 0 },
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 days', days: 3 },
                { label: 'Next week', days: 7 },
                { label: 'In 2 weeks', days: 14 },
              ].map(opt => {
                const d = new Date();
                d.setDate(d.getDate() + opt.days);
                const val = d.toISOString().split('T')[0];
                return (
                  <button
                    key={opt.label}
                    onClick={() => setDatePickerValue(val)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all
                      ${datePickerValue === val
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-white/5 opacity-50 hover:opacity-100 border-white/5 hover:border-white/10'}
                    `}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskItem = ({ task, onToggle, onOpenNote, onSetDate, onClearDate, themeStyle }: any) => {
  const formatDueDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isOverdue = d < now && d.toDateString() !== now.toDateString();
    const isToday = d.toDateString() === now.toDateString();
    const label = isToday ? 'Today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return { label, isOverdue, isToday };
  };

  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

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

      {/* Due date badge */}
      {due ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer transition-all hover:scale-105
              ${due.isOverdue ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                due.isToday ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
                'bg-white/5 text-white/40 border-white/5'}
            `}
            onClick={onSetDate}
            title="Change due date"
          >
            <Clock size={10} />
            {due.label}
          </span>
          <button
            onClick={onClearDate}
            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-400 transition-all p-0.5"
            title="Remove due date"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={onSetDate}
          className="flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-all hover:text-blue-400 px-2 py-0.5 rounded-md border border-transparent hover:border-blue-500/20 flex-shrink-0"
          title="Set due date"
        >
          <Calendar size={10} />
          <span>Set date</span>
        </button>
      )}
      
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
