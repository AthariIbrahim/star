import React, { useState, useEffect } from 'react';
import { StudyTask } from '../types';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  RotateCw,
  Sparkles,
  Flame,
  Check,
  Play,
  Pause,
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react';

interface StudyPlannerViewProps {
  tasks: StudyTask[];
  onAddTask: (newTask: StudyTask) => void;
  onUpdateTask?: (updatedTask: StudyTask) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const StudyPlannerView: React.FC<StudyPlannerViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('الفيزياء');
  const [dueDate, setDueDate] = useState('اليوم');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskSubject, setEditTaskSubject] = useState('الفيزياء');
  const [editTaskDueDate, setEditTaskDueDate] = useState('اليوم');
  const [editTaskPriority, setEditTaskPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [editTaskMinutes, setEditTaskMinutes] = useState(45);

  const handleOpenEditTask = (task: StudyTask) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskSubject(task.subject);
    setEditTaskDueDate(task.dueDate || 'اليوم');
    setEditTaskPriority(task.priority || 'high');
    setEditTaskMinutes(task.estimatedMinutes || 45);
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTaskTitle.trim()) return;
    const updated: StudyTask = {
      ...editingTask,
      title: editTaskTitle,
      subject: editTaskSubject,
      dueDate: editTaskDueDate,
      priority: editTaskPriority,
      estimatedMinutes: Number(editTaskMinutes)
    };
    if (onUpdateTask) {
      onUpdateTask(updated);
    }
    setEditingTask(null);
  };

  // Dynamic encouragement phrase state
  const [encouragement, setEncouragement] = useState('بداية موفقة! خطوة بخطوة تصل إلى قمة الإتقان والتميز الأكاديمي.');
  const [isFetchingEncouragement, setIsFetchingEncouragement] = useState(false);

  // Focus Pomodoro Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Pomodoro timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      alert('انتهت جلسة المذاكرة البالغة 25 دقيقة! خذ استراحة قصيرة.');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Fetch encouragement phrase from server when completion percentage updates
  const refreshEncouragement = async () => {
    setIsFetchingEncouragement(true);
    try {
      const response = await fetch('/api/tasks/encourage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionRate: completionPercentage,
          totalTasks,
          completedTasks: completedTasks.length
        })
      });
      let data: any = null;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (err) {
        console.error('Error parsing encouragement response JSON:', err);
      }
      if (data && data.success && data.phrase) {
        setEncouragement(data.phrase);
      }
    } catch (error) {
      console.error('Error refreshing encouragement:', error);
    } finally {
      setIsFetchingEncouragement(false);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newTask: StudyTask = {
      id: `tsk_${Date.now()}`,
      title,
      subject,
      dueDate,
      completed: false,
      priority,
      estimatedMinutes
    };

    onAddTask(newTask);
    setTitle('');
    setIsFormOpen(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            قسم المذاكرة ومتابعة الخطة
          </h2>
          <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold mt-1">
            حدد ما يحتاج المذاكرة وما أكتمل مع بار إنجاز تفاعلي وعبارات تشجيعية متجددة ومؤقت التركيز
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 rounded-2xl bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:opacity-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مهمة مذاكرة جديدة</span>
        </button>
      </div>

      {/* Dynamic Progress Gauge & Encouraging Phrase Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-100 dark:to-slate-800 border border-amber-500/20">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                شريط متابعة المذاكرة
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                تم إنجاز {completedTasks.length} من أصل {totalTasks} مهام
              </span>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-900 dark:text-white">نسبة إتمام الجدول الدراسية</span>
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">{completionPercentage}%</span>
              </div>
              <div className="w-full h-4 rounded-full bg-slate-200/80 dark:bg-slate-700/80 p-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Encouraging Phrase Banner */}
            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                      عبارة تشجيعية ديناميكية
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {encouragement}
                    </p>
                  </div>
                </div>

                <button
                  onClick={refreshEncouragement}
                  disabled={isFetchingEncouragement}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all shrink-0"
                  title="تحديث العبارة التشجيعية"
                >
                  <RotateCw className={`w-4 h-4 ${isFetchingEncouragement ? 'animate-spin text-amber-600' : ''}`} />
                </button>
              </div>
            </div>

          </div>

          {/* Pomodoro Focus Clock Widget */}
          <div className="glass-panel p-5 rounded-3xl bg-white/90 dark:bg-slate-800/90 shrink-0 w-full md:w-64 text-center space-y-3">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              مؤقت جلسة التركيز (25 دقيقة)
            </span>

            <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {formatTime(timerSeconds)}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                  isTimerRunning
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                    : 'bg-amber-600 text-white shadow-md'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isTimerRunning ? 'إيقاف مؤقت' : 'بدء الجلسة'}</span>
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                title="إعادة تعيين المؤقت"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Add Task Form (collapsible) */}
      {isFormOpen && (
        <form onSubmit={handleCreateTask} className="glass-panel p-6 rounded-3xl space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            إضافة موضوع أو مهمة جديدة للمذاكرة
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان موضوع المذاكرة
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: مراجعة قوانين الديناميكا الحرارية"
                required
                className="w-full px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                المادة الدراسية
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="الفيزياء">الفيزياء</option>
                <option value="الكيمياء">الكيمياء</option>
                <option value="الأحياء">الأحياء</option>
                <option value="الرياضيات">الرياضيات</option>
                <option value="علوم الحاسب">علوم الحاسب</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الأولوية
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الوقت المتوقع (دقيقة)
              </label>
              <input
                type="number"
                min={10}
                max={180}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="py-2.5 px-6 rounded-2xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all shadow-md"
          >
            حفظ المهمة في الجدول
          </button>
        </form>
      )}

      {/* Tasks Breakdown Grid: "ما يحتاج المذاكرة" vs "ما أكتمل" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pending Tasks: "ما يحتاج المذاكرة" */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ما يحتاج المذاكرة ({pendingTasks.length})
              </h3>
            </div>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                لا توجد مهام معلقة! جميع مواضيع المذاكرة مكتملة.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 hover:border-amber-400 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="w-6 h-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center hover:border-emerald-500 transition-colors"
                      title="تعليم كمكتمل"
                    >
                      <Check className="w-4 h-4 text-transparent hover:text-emerald-500" />
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                          {task.subject}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimatedMinutes} دقيقة
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditTask(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                      title="تعديل المهمة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks: "ما أكتمل" */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ما أكتمل ({completedTasks.length})
              </h3>
            </div>
          </div>

          {completedTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                قائمة الإنجاز فارغة حالياً. قم بإنهاء دروسك لتشاهد السجل يمتلئ بالإنجازات.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="w-6 h-6 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm"
                      title="إعادة للمستقبل"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 line-through">
                        {task.title}
                      </h4>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        تمت المذاكرة بنجاح
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-1 rounded-lg">
                      مكتملة
                    </span>
                    <button
                      onClick={() => handleOpenEditTask(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                      title="تعديل المهمة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl space-y-5 relative animate-fadeIn border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                تعديل مهمة المذاكرة
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الموضوع أو المهمة
                </label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المادة الدراسية
                  </label>
                  <input
                    type="text"
                    value={editTaskSubject}
                    onChange={(e) => setEditTaskSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    موعد الإنجاز
                  </label>
                  <input
                    type="text"
                    value={editTaskDueDate}
                    onChange={(e) => setEditTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الأولوية
                  </label>
                  <select
                    value={editTaskPriority}
                    onChange={(e) => setEditTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="high">عالية الأهمية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">عادية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الوقت المقدر (بالدقائق)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={editTaskMinutes}
                    onChange={(e) => setEditTaskMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
