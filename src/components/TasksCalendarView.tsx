import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, FileText, X, Clock } from 'lucide-react';

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

interface TasksCalendarViewProps {
  tasks: ParsedTask[];
  themeStyle: any;
  onToggle: (task: ParsedTask) => void;
  onOpenNote: (task: ParsedTask) => void;
  onSetDueDate: (task: ParsedTask, date: number | null) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-500' };
    case 'on-hold': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-500' };
    case 'completed': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' };
    case 'dropped': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500' };
    default: return { bg: 'bg-white/5', text: 'text-white/60', border: 'border-white/10', dot: 'bg-white/40' };
  }
};

const TasksCalendarView = ({ tasks, themeStyle, onToggle, onOpenNote, onSetDueDate }: TasksCalendarViewProps) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [assignPopover, setAssignPopover] = useState<{ day: number } | null>(null);

  // Tasks grouped by day of the current month
  const tasksByDay = useMemo(() => {
    const map = new Map<number, ParsedTask[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(task);
      }
    }
    return map;
  }, [tasks, currentMonth, currentYear]);

  // Tasks without a due date (for assignment)
  const unscheduledTasks = useMemo(() => tasks.filter(t => !t.dueDate && !t.checked), [tasks]);

  // Calendar grid computation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Convert Sunday=0 to Monday-based (Monday=0)
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const goToPrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleAssignDate = (task: ParsedTask, day: number) => {
    const date = new Date(currentYear, currentMonth, day, 12, 0, 0);
    onSetDueDate(task, date.getTime());
    setAssignPopover(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black tracking-tight">
            {MONTHS[currentMonth]} <span className="opacity-40">{currentYear}</span>
          </h2>
          <button
            onClick={goToToday}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Unscheduled tasks count */}
      {unscheduledTasks.length > 0 && (
        <div className="px-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-bold opacity-50">
            <Clock size={12} />
            <span>{unscheduledTasks.length} tasks without a due date — click a day to assign</span>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest opacity-30 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden border border-white/5">
          {/* Empty cells for offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] bg-white/[0.02] p-2" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayTasks = tasksByDay.get(day) || [];
            const isSelected = selectedDay === day;
            const isTodayCell = isToday(day);
            const maxVisible = 3;
            const overflow = dayTasks.length - maxVisible;

            return (
              <div
                key={day}
                onClick={() => {
                  setSelectedDay(isSelected ? null : day);
                  if (unscheduledTasks.length > 0 && !isSelected) {
                    setAssignPopover({ day });
                  } else {
                    setAssignPopover(null);
                  }
                }}
                className={`min-h-[100px] p-2 transition-all cursor-pointer relative group
                  ${isTodayCell ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/30' : 'bg-white/[0.02] hover:bg-white/[0.05]'}
                  ${isSelected ? 'bg-white/[0.08] ring-1 ring-inset ring-blue-400/40' : ''}
                `}
              >
                {/* Day number */}
                <div className={`text-[13px] font-bold mb-1 flex items-center gap-1.5
                  ${isTodayCell ? 'text-blue-400' : 'opacity-50'}
                `}>
                  {isTodayCell && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                  {day}
                </div>

                {/* Tasks */}
                <div className="flex flex-col gap-0.5">
                  {dayTasks.slice(0, maxVisible).map(task => {
                    const sc = statusColor(task.noteStatus);
                    return (
                      <div
                        key={`${task.noteId}-${task.lineNumber}`}
                        onClick={(e) => { e.stopPropagation(); onOpenNote(task); }}
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border transition-all hover:scale-[1.02]
                          ${task.checked ? 'line-through opacity-40' : ''}
                          ${sc.bg} ${sc.text} ${sc.border}
                        `}
                        title={`${task.text} — ${task.noteTitle}`}
                      >
                        {task.text}
                      </div>
                    );
                  })}
                  {overflow > 0 && (
                    <div className="text-[9px] font-bold text-blue-400/60 pl-1">+{overflow} more</div>
                  )}
                </div>

                {/* Assign popover */}
                {assignPopover?.day === day && unscheduledTasks.length > 0 && (
                  <div
                    className={`absolute top-full left-0 z-50 mt-1 w-64 max-h-48 overflow-y-auto rounded-xl shadow-2xl border p-2 ${themeStyle.dropdownBg || 'bg-[#1e1e2e]'} ${themeStyle.editorBorder}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Assign to {MONTHS[currentMonth]} {day}</span>
                      <button onClick={(e) => { e.stopPropagation(); setAssignPopover(null); }} className="p-0.5 rounded hover:bg-white/10">
                        <X size={12} className="opacity-50" />
                      </button>
                    </div>
                    {unscheduledTasks.map(task => (
                      <div
                        key={`${task.noteId}-${task.lineNumber}`}
                        onClick={() => handleAssignDate(task, day)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                      >
                        <Calendar size={10} className="opacity-40 flex-shrink-0" />
                        <span className="text-[11px] font-medium truncate flex-1">{task.text}</span>
                        <span className="text-[9px] opacity-30 flex-shrink-0">{task.noteTitle}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDay && (tasksByDay.get(selectedDay) || []).length > 0 && (
        <div className={`flex-shrink-0 border-t px-6 py-4 max-h-[200px] overflow-y-auto ${themeStyle.editorBorder}`}>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3">
            {MONTHS[currentMonth]} {selectedDay} — {tasksByDay.get(selectedDay)?.length} tasks
          </div>
          <div className="flex flex-col gap-1.5">
            {(tasksByDay.get(selectedDay) || []).map(task => {
              const sc = statusColor(task.noteStatus);
              return (
                <div
                  key={`detail-${task.noteId}-${task.lineNumber}`}
                  className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${themeStyle.editorBorder} hover:bg-white/5 group`}
                >
                  <button
                    onClick={() => onToggle(task)}
                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                      ${task.checked ? `${sc.dot} border-transparent` : `border-current ${sc.text}`}
                    `}
                  >
                    {task.checked && <span className="text-white text-[8px] font-black">✓</span>}
                  </button>
                  <span className={`flex-1 text-[12px] font-medium ${task.checked ? 'line-through opacity-40' : ''}`}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => onOpenNote(task)}
                    className="flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity hover:text-blue-400"
                  >
                    <FileText size={10} />
                    <span className="truncate max-w-[100px]">{task.noteTitle}</span>
                  </button>
                  <button
                    onClick={() => onSetDueDate(task, null)}
                    className="text-[9px] opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-400 transition-all px-1"
                    title="Remove due date"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksCalendarView;
