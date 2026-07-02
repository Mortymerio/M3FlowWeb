import { useMemo } from 'react';
import { CheckCircle2, Circle, FileText, Calendar, GripVertical } from 'lucide-react';

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

interface TasksKanbanViewProps {
  tasks: ParsedTask[];
  onToggle: (task: ParsedTask) => void;
  onOpenNote: (task: ParsedTask) => void;
}

interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  dotColor: string;
  bgColor: string;
  borderColor: string;
  headerBg: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'none',
    label: 'No Status',
    color: 'text-white/60',
    dotColor: 'bg-white/40',
    bgColor: 'bg-white/[0.02]',
    borderColor: 'border-white/5',
    headerBg: 'bg-white/5',
  },
  {
    id: 'active',
    label: 'Active',
    color: 'text-blue-400',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-500/[0.03]',
    borderColor: 'border-blue-500/10',
    headerBg: 'bg-blue-500/10',
  },
  {
    id: 'on-hold',
    label: 'On Hold',
    color: 'text-amber-400',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-500/[0.03]',
    borderColor: 'border-amber-500/10',
    headerBg: 'bg-amber-500/10',
  },
  {
    id: 'completed',
    label: 'Completed',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/[0.03]',
    borderColor: 'border-emerald-500/10',
    headerBg: 'bg-emerald-500/10',
  },
  {
    id: 'dropped',
    label: 'Dropped',
    color: 'text-red-400',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-500/[0.03]',
    borderColor: 'border-red-500/10',
    headerBg: 'bg-red-500/10',
  },
];

const TasksKanbanView = ({ tasks, onToggle, onOpenNote }: TasksKanbanViewProps) => {
  // Group tasks by noteStatus
  const columns = useMemo(() => {
    const grouped = new Map<string, ParsedTask[]>();
    for (const col of COLUMNS) {
      grouped.set(col.id, []);
    }
    for (const task of tasks) {
      const status = task.noteStatus || 'none';
      const bucket = grouped.get(status);
      if (bucket) {
        bucket.push(task);
      } else {
        // Fallback to 'none' if unknown status
        grouped.get('none')!.push(task);
      }
    }
    return grouped;
  }, [tasks]);

  const formatDueDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isOverdue = d < now && d.toDateString() !== now.toDateString();
    const isToday = d.toDateString() === now.toDateString();
    const label = isToday ? 'Today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return { label, isOverdue, isToday };
  };

  return (
    <div className="flex-1 flex overflow-hidden gap-3 px-6 py-4">
      {COLUMNS.map(col => {
        const colTasks = columns.get(col.id) || [];
        const pendingCount = colTasks.filter(t => !t.checked).length;
        const completedCount = colTasks.filter(t => t.checked).length;

        return (
          <div
            key={col.id}
            className={`flex flex-col flex-1 min-w-0 rounded-2xl border overflow-hidden ${col.borderColor} ${col.bgColor}`}
          >
            {/* Column Header */}
            <div className={`px-4 py-3 flex items-center justify-between ${col.headerBg}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor} shadow-sm`} />
                <span className={`text-[12px] font-black uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {pendingCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${col.headerBg} ${col.color} border ${col.borderColor}`}>
                    {pendingCount}
                  </span>
                )}
                {completedCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/5 text-white/30 border border-white/5">
                    ✓{completedCount}
                  </span>
                )}
              </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
              {colTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="text-center">
                    <GripVertical size={24} className="mx-auto opacity-10 mb-2" />
                    <p className="text-[11px] opacity-20 font-medium">No tasks here</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Pending tasks first */}
                  {colTasks.filter(t => !t.checked).map(task => (
                    <TaskCard
                      key={`${task.noteId}-${task.lineNumber}`}
                      task={task}
                      col={col}
                      onToggle={onToggle}
                      onOpenNote={onOpenNote}
                      formatDueDate={formatDueDate}
                    />
                  ))}

                  {/* Completed tasks (dimmed) */}
                  {colTasks.filter(t => t.checked).length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mt-2 mb-1 px-2">
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-20">Done</span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      {colTasks.filter(t => t.checked).map(task => (
                        <TaskCard
                          key={`${task.noteId}-${task.lineNumber}`}
                          task={task}
                          col={col}
                          onToggle={onToggle}
                          onOpenNote={onOpenNote}
                          formatDueDate={formatDueDate}
                          isDone
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TaskCard = ({ task, col, onToggle, onOpenNote, formatDueDate, isDone }: {
  task: ParsedTask;
  col: KanbanColumn;
  onToggle: (task: ParsedTask) => void;
  onOpenNote: (task: ParsedTask) => void;
  formatDueDate: (ts: number) => { label: string; isOverdue: boolean; isToday: boolean };
  isDone?: boolean;
}) => {
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <div
      className={`group rounded-xl border p-3 transition-all hover:shadow-lg cursor-default
        ${isDone ? 'opacity-40 hover:opacity-60' : 'hover:scale-[1.01]'}
        ${col.borderColor} bg-black/10 hover:bg-black/20
      `}
    >
      {/* Top row: checkbox + text */}
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => onToggle(task)}
          className={`flex-shrink-0 mt-0.5 transition-colors ${task.checked ? 'text-emerald-500' : `${col.color} hover:text-emerald-400`}`}
        >
          {task.checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        </button>
        <span className={`flex-1 text-[12px] font-medium leading-snug ${task.checked ? 'line-through opacity-60' : ''}`}>
          {task.text}
        </span>
      </div>

      {/* Bottom row: metadata */}
      <div className="flex items-center gap-2 mt-2 pl-[26px]">
        {/* Note origin */}
        <button
          onClick={() => onOpenNote(task)}
          className="flex items-center gap-1 text-[9px] font-medium opacity-40 hover:opacity-100 transition-opacity hover:text-blue-400 truncate max-w-[120px]"
          title={`Open: ${task.noteTitle}`}
        >
          <FileText size={9} className="flex-shrink-0" />
          <span className="truncate">{task.noteTitle}</span>
        </button>

        <div className="flex-1" />

        {/* Due date badge */}
        {due && (
          <div
            className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border
              ${due.isOverdue ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                due.isToday ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' :
                'bg-white/5 text-white/40 border-white/5'}
            `}
          >
            <Calendar size={8} />
            {due.label}
          </div>
        )}

        {/* Priority indicator */}
        {task.priority && task.priority !== 'none' && (
          <div className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border
            ${task.priority === 'high' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
              task.priority === 'medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
              'bg-blue-500/10 text-blue-400 border-blue-500/15'}
          `}>
            {task.priority}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksKanbanView;
