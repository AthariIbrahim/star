import React from 'react';
import {
  LayoutDashboard,
  FileUp,
  BookOpenCheck,
  HelpCircle,
  BellRing,
  Target,
  Sparkles
} from 'lucide-react';

export type ViewType = 'dashboard' | 'content' | 'summaries' | 'quizzes' | 'tests' | 'study' | 'chat';

interface NavigationProps {
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  pendingTasksCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onSelectView,
  pendingTasksCount
}) => {
  const navItems = [
    { id: 'dashboard' as ViewType, label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'content' as ViewType, label: 'قسم المحتوى', icon: FileUp },
    { id: 'summaries' as ViewType, label: 'الملخصات', icon: BookOpenCheck },
    { id: 'quizzes' as ViewType, label: 'الكويزات', icon: HelpCircle },
    { id: 'tests' as ViewType, label: 'مواعيد الاختبارات', icon: BellRing },
    {
      id: 'study' as ViewType,
      label: 'المذاكرة',
      icon: Target,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined
    },
    { id: 'chat' as ViewType, label: 'المساعد الذكي', icon: Sparkles, highlight: true }
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 pointer-events-none">
      <div className="glass-panel pointer-events-auto rounded-3xl p-1.5 shadow-2xl shadow-indigo-900/10 border border-white/60 dark:border-slate-800 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-300 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-105'
                  : item.highlight
                  ? 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-black'
                  : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 stroke-[2] ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] font-medium leading-none hidden sm:inline">{item.label}</span>

              {/* Notification Badge */}
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
