import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  LogIn,
  LogOut,
  Flame,
  Award,
  CheckCircle2,
  X,
  GraduationCap,
  Star,
  UserPlus,
  Users,
  Lock,
  Mail,
  User,
  BookOpen,
  Target,
  ArrowRight,
  Trash2
} from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  allUsers?: UserProfile[];
  onLoginWithGoogle: (name: string, email: string) => Promise<void>;
  onGooglePopupAuth?: () => Promise<UserProfile | null>;
  onLoginWithEmail?: (email: string, pass: string) => Promise<void>;
  onRegisterNewUser?: (name: string, email: string, pass: string, gradeLevel?: string, targetExam?: string) => Promise<void>;
  onSwitchUser?: (user: UserProfile) => void;
  onDeleteUser?: (email: string) => Promise<void>;
  onLogout: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  user,
  allUsers = [],
  onLoginWithGoogle,
  onGooglePopupAuth,
  onLoginWithEmail,
  onRegisterNewUser,
  onSwitchUser,
  onDeleteUser,
  onLogout
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'users'>(user.isLoggedIn ? 'users' : 'signin');

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPass, setSignInPass] = useState('');

  // Sign up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPass, setSignUpPass] = useState('');
  const [gradeLevel, setGradeLevel] = useState('المرحلة الثانوية');
  const [targetExam, setTargetExam] = useState('اختبار القدرات والتحصيلي');

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني');
      return;
    }
    setIsAuthenticating(true);
    setErrorMsg('');
    try {
      if (onLoginWithEmail) {
        await onLoginWithEmail(signInEmail, signInPass);
      } else {
        await onLoginWithGoogle(signInEmail.split('@')[0], signInEmail);
      }
      setSuccessMsg('تم تسجيل الدخول بنجاح!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول، يرجى المحاولة مرة أخرى');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setIsAuthenticating(true);
    setErrorMsg('');
    try {
      if (onRegisterNewUser) {
        await onRegisterNewUser(signUpName, signUpEmail, signUpPass || '123456', gradeLevel, targetExam);
      } else {
        await onLoginWithGoogle(signUpName, signUpEmail);
      }
      setSuccessMsg('تم إنشاء الحساب بنجاح وتم تسجيل دخولك!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل إنشاء الحساب، حاول مرة أخرى');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleQuickGoogle = async () => {
    setIsAuthenticating(true);
    setErrorMsg('');
    try {
      if (onGooglePopupAuth) {
        const profile = await onGooglePopupAuth();
        if (profile) {
          setSuccessMsg('تم التسجيل وحفظ الحساب بـ Google بنجاح!');
          setTimeout(() => {
            setSuccessMsg('');
            onClose();
          }, 600);
          return;
        }
      }
      await onLoginWithGoogle('طالب Google جديد', 'student.google@gmail.com');
      setSuccessMsg('تم إنشاء الحساب وتسجيل الدخول بـ Google');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg('فشل تسجيل الدخول عبر Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg p-6 rounded-3xl space-y-5 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500 shrink-0" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              حساب المستخدم - منصة نجم
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تسجيل الدخول، إنشاء حساب جديد، ومزامنة بياناتك
            </p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
          <button
            onClick={() => { setTab('signin'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signin'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            onClick={() => { setTab('signup'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signup'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>حساب جديد</span>
          </button>

          {allUsers.length > 0 && (
            <button
              onClick={() => { setTab('users'); setErrorMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                tab === 'users'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>المستخدمون ({allUsers.length})</span>
            </button>
          )}
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: SIGN IN */}
        {tab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pr-9 pl-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={signInPass}
                    onChange={(e) => setSignInPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-9 pl-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isAuthenticating ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}</span>
              </button>
            </div>

            <div className="relative text-center my-2">
              <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 relative z-10">
                أو الدخول السريع
              </span>
              <div className="absolute inset-0 top-1/2 border-t border-slate-200 dark:border-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleQuickGoogle}
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>دخول سريع بـ Google</span>
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP / REGISTER NEW USER */}
        {tab === 'signup' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleQuickGoogle}
              disabled={isAuthenticating}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>إنشاء حساب جديد عبر Google</span>
            </button>

            <div className="relative text-center my-1">
              <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 relative z-10">
                أو إنشاء حساب بالبريد الإلكتروني
              </span>
              <div className="absolute inset-0 top-1/2 border-t border-slate-200 dark:border-slate-800" />
            </div>

            <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم الطالب / المستخدم الكامل
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full pr-9 pl-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full pr-9 pl-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={signUpPass}
                  onChange={(e) => setSignUpPass(e.target.value)}
                  placeholder="اختر كلمة مرور"
                  className="w-full pr-9 pl-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المرحلة الدراسية
                </label>
                <div className="relative">
                  <BookOpen className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full pr-8 pl-2 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                    <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                    <option value="المرحلة الجامعية">المرحلة الجامعية</option>
                    <option value="دراسات حرة">دراسات حرة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاختبار المستهدف
                </label>
                <div className="relative">
                  <Target className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full pr-8 pl-2 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="اختبار القدرات والتحصيلي">القدرات والتحصيلي</option>
                    <option value="الاختبارات النهائية">الاختبارات النهائية</option>
                    <option value="تطوير المهارات">تطوير المهارات</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold text-xs hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAuthenticating ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد وتفعيل'}</span>
            </button>
          </form>
          </div>
        )}

        {/* TAB 3: USERS LIST & SWITCH PROFILE */}
        {tab === 'users' && (
          <div className="space-y-4">
            
            {/* Active Current User Profile Card */}
            {user.isLoggedIn && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    الحساب الحالي النشط
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> متصل الآن
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      {user.gradeLevel || 'طالب متميز'} • {user.targetExam || 'القدرات'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1 border-t border-indigo-500/10">
                  <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{user.streakDays} أيام</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1">
                    <Award className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{user.points} نقطة</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    setTab('signin');
                  }}
                  className="w-full py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              </div>
            )}

            {/* List of Other Registered Users in Firestore */}
            {(() => {
              const uniqueUsers = Array.from(
                new Map(
                  (allUsers || [])
                    .filter((u) => u && u.email)
                    .map((u) => [u.email.trim().toLowerCase(), u])
                ).values()
              );

              return (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    حسابات الطلاب المسجلين ({uniqueUsers.length}):
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {uniqueUsers.map((u, idx) => {
                      const isCurrent = user.isLoggedIn && user.email === u.email;
                      return (
                        <div
                          key={u.id ? `${u.id}_${idx}` : u.email ? `${u.email}_${idx}` : `usr_${idx}`}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isCurrent
                              ? 'bg-slate-100 dark:bg-slate-800/90 border-indigo-500/50 ring-1 ring-indigo-500/30'
                              : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                              alt={u.name}
                              className="w-8 h-8 rounded-xl object-cover shrink-0"
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {u.name}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {u.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isCurrent && onSwitchUser && (
                              <button
                                onClick={() => {
                                  onSwitchUser(u);
                                  onClose();
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-all flex items-center gap-1"
                              >
                                <span>دخول</span>
                                <ArrowRight className="w-3 h-3 rotate-180" />
                              </button>
                            )}

                            {!isCurrent && onDeleteUser && (
                              <button
                                onClick={() => onDeleteUser(u.email)}
                                title="حذف الحساب من القائمة"
                                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setTab('signup')}
              className="w-full py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة حساب مستخدم جديد</span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

