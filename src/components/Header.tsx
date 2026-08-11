import React from 'react';
import { UserProfile } from '../types';
import {
  Star,
  Sun,
  Moon,
  Flame,
  LogIn,
  Search,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenAuthModal: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeViewTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDarkMode,
  onToggleTheme,
  onOpenAuthModal,
  searchQuery,
  onSearchChange,
  activeViewTitle
}) => {
  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-3 pb-2 transition-colors duration-300">
      <div className="max-w-7xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between gap-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500 shrink-0" />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              نجـم
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
              منصة التعلم الذكية
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold hidden sm:block">
            {activeViewTitle}
          </p>
        </div>

        {/* Global Search Input */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث في الدروس والملخصات والكويزات..."
              className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
            />
          </div>
        </div>

        {/* Right Action Controls: Streak, Theme Toggle & User Auth */}
        <div className="flex items-center gap-2.5">
          
          {/* Streak pill - Direct icon without circular frame */}
          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>سلسلة {user.streakDays} أيام</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="تغيير المظهر"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700"
            title={isDarkMode ? "التبديل إلى المظهر الفاتح" : "التبديل إلى المظهر الداكن"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* User Auth Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all text-xs font-bold shadow-xs"
          >
            {user.isLoggedIn ? (
              <>
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-5 h-5 rounded-md object-cover"
                />
                <span className="hidden md:inline max-w-[120px] truncate">مرحباً، {user.name}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
