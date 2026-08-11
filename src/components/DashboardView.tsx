import React, { useState } from 'react';
import { UserProfile, StudyTask, ContentItem, QuizItem, SummaryItem, CustomTest } from '../types';
import { ViewType } from './Navigation';
import {
  Sparkles,
  FileUp,
  BookOpenCheck,
  HelpCircle,
  ClipboardCheck,
  BellRing,
  Target,
  Flame,
  Award,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RotateCw,
  TrendingUp,
  Check
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  tasks: StudyTask[];
  contentItems: ContentItem[];
  quizzes: QuizItem[];
  summaries: SummaryItem[];
  customTests: CustomTest[];
  onNavigate: (view: ViewType) => void;
  onToggleTask: (taskId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  tasks,
  contentItems,
  quizzes,
  summaries,
  customTests,
  onNavigate,
  onToggleTask
}) => {
  const [encouragementMessage, setEncouragementMessage] = useState<string>(
    'إنجاز ممتاز اليوم! قطعت شوطاً كبيراً في خطتك الدراسية، واصل الاستمرار لتحقيق التميز الأكاديمي.'
  );
  const [isLoadingEncouragement, setIsLoadingEncouragement] = useState(false);

  // Calculate statistics
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  // Fetch new encouraging phrase from Gemini API
  const fetchNewEncouragement = async () => {
    setIsLoadingEncouragement(true);
    try {
      const response = await fetch('/api/tasks/encourage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionRate: completionPercentage,
          totalTasks: totalTasksCount,
          completedTasks: completedTasksCount
        })
      });
      let data: any = null;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse encouragement response JSON:', err);
      }
      if (data && data.success && data.phrase) {
        setEncouragementMessage(data.phrase);
      }
    } catch (error) {
      console.error('Failed to fetch encouragement:', error);
    } finally {
      setIsLoadingEncouragement(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Top Banner & Encouragement iOS Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 bg-gradient-to-br from-indigo-900/10 via-slate-900/5 to-cyan-900/10 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-cyan-950/40 border border-slate-300 dark:border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 text-xs font-black border border-indigo-300 dark:border-indigo-800">
                مرحباً بعودتك، {user.name}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                سلسلة {user.streakDays} أيام
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white leading-tight">
              جاهز لمواصلة رحلة التفوق والتعلم؟
            </h2>

            {/* Encouraging Phrase Container */}
            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-800/90 border border-indigo-200 dark:border-slate-700 flex items-start justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-1" />
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-indigo-800 dark:text-indigo-300 uppercase block mb-0.5">
                      عبارة تشجيعية اليوم
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {encouragementMessage}
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchNewEncouragement}
                  disabled={isLoadingEncouragement}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-all shrink-0"
                  title="تحديث العبارة التشجيعية"
                >
                  <RotateCw className={`w-4 h-4 ${isLoadingEncouragement ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* iOS Dynamic Progress Ring Widget */}
          <div className="flex items-center gap-5 glass-panel p-5 rounded-3xl bg-white/95 dark:bg-slate-800/95 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-slate-300 dark:stroke-slate-700 fill-none stroke-[7]"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-indigo-600 dark:stroke-indigo-400 fill-none stroke-[7] transition-all duration-1000 ease-out"
                  strokeDasharray="213"
                  strokeDashoffset={213 - (213 * completionPercentage) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-base font-black text-slate-950 dark:text-white">
                {completionPercentage}%
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                نسبة إنجاز المذاكرة
              </div>
              <div className="text-lg font-black text-slate-950 dark:text-white">
                {completedTasksCount} / {totalTasksCount} مهام مكتملة
              </div>
              <button
                onClick={() => onNavigate('study')}
                className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                <span>استكمال الجدول</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Feature Grid Shortcut Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Content Hub Card */}
        <div
          onClick={() => onNavigate('content')}
          className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                قسم المحتوى المتقدم
              </h3>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
              {contentItems.length} مواد
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            استخرج ولخص المعلومات من الصوت، الفيديو، النصوص، والصور بالذكاء الاصطناعي Gemini.
          </p>
        </div>

        {/* Summaries Card */}
        <div
          onClick={() => onNavigate('summaries')}
          className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                الملخصات والبطاقات
              </h3>
            </div>
            <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-200 dark:border-cyan-800">
              {summaries.length} ملخص
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            استعرض الملخصات الجاهزة وتفاعل مع بطاقات الاستذكار للمراجعة السريعة.
          </p>
        </div>

        {/* AI Quizzes Card */}
        <div
          onClick={() => onNavigate('quizzes')}
          className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                الكويزات التفاعلية
              </h3>
            </div>
            <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2.5 py-1 rounded-md border border-violet-200 dark:border-violet-800">
              {quizzes.length} كويز
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            اختبر معلوماتك بكويزات تفاعلية تلقائية التقييم مع شروحات فورية للإجابات.
          </p>
        </div>

        {/* Student Exam Reminders Card */}
        <div
          onClick={() => onNavigate('tests')}
          className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                مواعيد الاختبارات
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
              {customTests.length} اختبارات
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            جدولة مواعيد الاختبارات، والعد التنازلي، والدرجات المستهدفة لتتبع استعدادك.
          </p>
        </div>

        {/* Study Tracker Card */}
        <div
          onClick={() => onNavigate('study')}
          className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                جدول المذاكرة
              </h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              {pendingTasks.length} مهام
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            حدد ما يحتاج المذاكرة وما اكتمل مع شريط إنجاز ومؤقت التركيز.
          </p>
        </div>

        {/* General AI Chat Card */}
        <div
          onClick={() => onNavigate('chat')}
          className="group cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all duration-200 shadow-xs"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                المساعد الذكي (نجم AI)
              </h3>
            </div>
            <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
              Gemini AI
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            اطرح أي سؤال دراسي أو علمي واحصل على إجابة واضحة وشاملة فوراً.
          </p>
        </div>

      </div>

      {/* Quick Study Tasks Split List ("ما يحتاج المذاكرة" vs "ما أكتمل") */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Pending Study Tasks */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                ما يحتاج المذاكرة ({pendingTasks.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('study')}
              className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline"
            >
              إدارة الكل
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-100/80 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-300">
                ممتاز! لقد أكملت جميع المهام المحددة للمذاكرة اليوم.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="w-5 h-5 rounded-lg border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center hover:border-indigo-600 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-transparent hover:text-slate-400" />
                    </button>
                    <div>
                      <h4 className="text-xs font-black text-slate-950 dark:text-white">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {task.subject}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.estimatedMinutes} دقيقة
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    task.priority === 'high'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                  }`}>
                    {task.priority === 'high' ? 'أولوية عالية' : 'متوسطة'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="text-base font-black text-slate-950 dark:text-white">
                ما أكتمل ({completedTasks.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              مهام تم إنجازها
            </span>
          </div>

          {completedTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-100/80 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                لم تقم بإكمال أي مهمة بعد. ابدأ بمذاكرة مهمتك الأولى لتشاهد التقدم هنا!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {completedTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-through">
                        {task.title}
                      </h4>
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">
                        {task.subject}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-md">
                    مكتملة
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
