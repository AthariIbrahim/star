import React, { useState } from 'react';
import { CustomTest, ExamReminder } from '../types';
import {
  BellRing,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Target,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Trash2,
  Sparkles,
  Tag,
  FileText,
  Edit3
} from 'lucide-react';

interface CustomTestsViewProps {
  customTests: CustomTest[];
  onAddCustomTest: (newTest: CustomTest) => void;
  onUpdateCustomTest?: (updatedTest: CustomTest) => void;
  onUpdateTestAttempt?: (testId: string, score: number, total: number, passed: boolean) => void;
  onTogglePrepared?: (testId: string) => void;
  onDeleteTest?: (testId: string) => void;
}

export const CustomTestsView: React.FC<CustomTestsViewProps> = ({
  customTests,
  onAddCustomTest,
  onUpdateCustomTest,
  onTogglePrepared,
  onDeleteTest
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('الكيمياء');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('09:00 ص');
  const [location, setLocation] = useState('');
  const [targetScore, setTargetScore] = useState(90);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [topicsInput, setTopicsInput] = useState('');
  const [notes, setNotes] = useState('');

  // Edit Test Modal state
  const [editingTest, setEditingTest] = useState<CustomTest | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('الكيمياء');
  const [editExamDate, setEditExamDate] = useState('');
  const [editExamTime, setEditExamTime] = useState('09:00 ص');
  const [editLocation, setEditLocation] = useState('');
  const [editTargetScore, setEditTargetScore] = useState(90);
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [editTopicsInput, setEditTopicsInput] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleOpenEditTest = (test: CustomTest) => {
    setEditingTest(test);
    setEditTitle(test.title);
    setEditSubject(test.subject);
    setEditExamDate(test.examDate || '');
    setEditExamTime(test.examTime || '09:00 ص');
    setEditLocation(test.location || '');
    setEditTargetScore(test.targetScore || 90);
    setEditPriority(test.priority || 'high');
    setEditTopicsInput((test.topics || []).join(', '));
    setEditNotes(test.notes || '');
  };

  const handleSaveEditTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest || !editTitle.trim()) return;
    const updated: CustomTest = {
      ...editingTest,
      title: editTitle,
      subject: editSubject,
      examDate: editExamDate,
      examTime: editExamTime,
      location: editLocation,
      targetScore: Number(editTargetScore),
      priority: editPriority,
      topics: editTopicsInput.split(',').map((t) => t.trim()).filter(Boolean),
      notes: editNotes
    };
    if (onUpdateCustomTest) {
      onUpdateCustomTest(updated);
    }
    setEditingTest(null);
  };

  // Local state for toggling prepared if parent handler isn't passed
  const [localTests, setLocalTests] = useState<ExamReminder[]>(customTests);

  // Sync if prop updates
  React.useEffect(() => {
    setLocalTests(customTests);
  }, [customTests]);

  // Calculate days remaining helper
  const getDaysRemaining = (dateString: string) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examD = new Date(dateString);
    examD.setHours(0, 0, 0, 0);
    const diffTime = examD.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Toggle prepared status
  const handleToggleLocalPrepared = (id: string) => {
    if (onTogglePrepared) {
      onTogglePrepared(id);
    } else {
      setLocalTests((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isPrepared: !item.isPrepared } : item))
      );
    }
  };

  // Delete test reminder
  const handleDeleteLocalTest = (id: string) => {
    if (onDeleteTest) {
      onDeleteTest(id);
    } else {
      setLocalTests((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Save Exam Reminder
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !examDate) return;

    const topicsArray = topicsInput
      ? topicsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const newReminder: ExamReminder = {
      id: `test_${Date.now()}`,
      title,
      subject,
      examDate,
      examTime: examTime || '09:00 ص',
      location: location || 'قاعة الاختبار العامة',
      targetScore: Number(targetScore) || 90,
      priority,
      notes: notes || 'مراجعة الملاحظات والملخصات قبل موعد الاختبار بنصف ساعة.',
      topics: topicsArray,
      isPrepared: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddCustomTest(newReminder);
    setIsModalOpen(false);

    // Reset form
    setTitle('');
    setExamDate('');
    setLocation('');
    setTopicsInput('');
    setNotes('');
  };

  // Stats
  const totalExams = localTests.length;
  const highPriorityCount = localTests.filter((t) => t.priority === 'high').length;
  const preparedCount = localTests.filter((t) => t.isPrepared).length;

  // Closest exam
  const sortedExams = [...localTests].sort((a, b) => {
    return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
  });
  const closestExam = sortedExams.find((e) => getDaysRemaining(e.examDate) !== null && getDaysRemaining(e.examDate)! >= 0);
  const closestDays = closestExam ? getDaysRemaining(closestExam.examDate) : null;

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
            <BellRing className="w-7 h-7 text-amber-600 dark:text-amber-400 animate-bounce" />
            <span>جدول وتذكيرات مواعيد الاختبارات</span>
          </h2>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-300 mt-1">
            سجّل مواعيد اختباراتك القادمة، وحدد الدرجة المستهدفة، وتتبع الاستعداد والعد التنازلي لكل مادة
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-600/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إضافة تذكير بموعد اختبار</span>
        </button>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs font-bold">إجمالي الاختبارات المجدولة</span>
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalExams}</p>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">مواعيد مسجلة في جدولك</span>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs font-bold">الأقرب موعداً</span>
            <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {closestDays !== null ? (
              closestDays === 0 ? 'اليوم!' : `باقي ${closestDays} أيام`
            ) : (
              'لا يوجد'
            )}
          </p>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate block">
            {closestExam ? closestExam.title : 'لا توجد اختبارات قريبة'}
          </span>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs font-bold">اختبارات عالية الأهمية</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{highPriorityCount}</p>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">تتطلب تركيزاً مكثفاً</span>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span className="text-xs font-bold">اكتمل الاستعداد لها</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{preparedCount}</p>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">جاهز لأداء الاختبار</span>
        </div>
      </div>

      {/* Reminders List */}
      {localTests.length === 0 ? (
        <div className="glass-panel p-10 rounded-3xl text-center space-y-3">
          <BellRing className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            لا توجد تذكيرات بمواعيد الاختبارات حالياً
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            اضغط على زر "إضافة تذكير بموعد اختبار" لجدولة مواعيد اختباراتك القادمة ومتابعة استعدادك
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {localTests.map((item) => {
            const daysLeft = getDaysRemaining(item.examDate);
            const isPast = daysLeft !== null && daysLeft < 0;
            const isToday = daysLeft === 0;

            return (
              <div
                key={item.id}
                className={`glass-card p-6 rounded-3xl space-y-4 border transition-all relative flex flex-col justify-between ${
                  item.isPrepared
                    ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : isToday
                    ? 'border-rose-500/60 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
                }`}
              >
                {/* Header & Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold text-[11px] border border-amber-500/20">
                      {item.subject}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.priority === 'high'
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                          : item.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                      }`}
                    >
                      {item.priority === 'high' ? 'عالية الأهمية' : item.priority === 'medium' ? 'متوسطة' : 'عادية'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>

                  {/* Countdown Banner */}
                  <div
                    className={`p-3 rounded-2xl flex items-center justify-between text-xs font-extrabold ${
                      item.isPrepared
                        ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                        : isToday
                        ? 'bg-rose-500 text-white animate-pulse'
                        : isPast
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        : daysLeft !== null && daysLeft <= 3
                        ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>
                        {item.isPrepared
                          ? 'اكتمل الاستعداد للمادة'
                          : isToday
                          ? 'موعد الاختبار اليوم!'
                          : isPast
                          ? 'انتهى موعد الاختبار'
                          : `متبقي على الاختبار: ${daysLeft} أيام`}
                      </span>
                    </span>
                    {item.targetScore && (
                      <span className="flex items-center gap-1 text-[11px] font-black bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-lg text-slate-900 dark:text-white">
                        <Target className="w-3 h-3 text-amber-600" />
                        {item.targetScore}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Date, Time, Location Details */}
                <div className="space-y-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>تاريخ الاختبار: {item.examDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>وقت الاختبار: {item.examTime}</span>
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>المقر / القاعة: {item.location}</span>
                    </div>
                  )}
                </div>

                {/* Topics covered */}
                {item.topics && item.topics.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      المواضيع المغطاة:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.topics.map((tp, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        >
                          #{tp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-slate-800 dark:text-slate-200 space-y-1">
                    <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 block">
                      ملاحظات المذاكرة:
                    </span>
                    <p className="leading-relaxed">{item.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => handleToggleLocalPrepared(item.id)}
                    className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      item.isPrepared
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{item.isPrepared ? 'تم الاستعداد بالكامل' : 'تحديد كـ "تم الاستعداد"'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditTest(item)}
                    className="p-2.5 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all"
                    title="تعديل الاختبار"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteLocalTest(item.id)}
                    className="p-2.5 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                    title="حذف التذكير"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Exam Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl p-6 rounded-3xl space-y-5 relative max-h-[90vh] overflow-y-auto animate-fadeIn border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-600" />
                <span>إضافة موعد وتذكير لاختبار جديد</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  اسم الاختبار / المادة *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: اختبار الفاينل - الكيمياء العضوية"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    المادة الدراسية
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: الكيمياء، الفيزياء..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    تاريخ الاختبار *
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    الوقت
                  </label>
                  <input
                    type="text"
                    value={examTime}
                    onChange={(e) => setExamTime(e.target.value)}
                    placeholder="مثال: 09:00 ص"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    القاعة / المكان
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="قاعة 102 أو أونلاين"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    الدرجة المستهدفة (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    درجة الأهمية
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="high">عالية الأهمية (نهائي / نصف الفصل)</option>
                    <option value="medium">متوسطة الأهمية (اختبار دوري)</option>
                    <option value="low">عادية (كويز سريع)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    المواضيع المطلوبة (مفصولة بفاصلة)
                  </label>
                  <input
                    type="text"
                    value={topicsInput}
                    onChange={(e) => setTopicsInput(e.target.value)}
                    placeholder="مثال: تفاعلات التعادل, الهيدروكربونات, pH"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  تعليمات وملاحظات المذاكرة
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: مراجعة ملخص الوحدة الثالثة، والتركيز على مسائل القانون الثاني لنيوتن."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <BellRing className="w-4 h-4" />
                <span>حفظ وجدولة التذكير</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Reminder Modal */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl p-6 rounded-3xl space-y-5 relative max-h-[90vh] overflow-y-auto animate-fadeIn border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                تعديل تذكير موعد الاختبار
              </h3>
              <button
                onClick={() => setEditingTest(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveEditTest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  عنوان الاختبار / اسم المادة
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    المادة / التخصص
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    تاريخ الاختبار
                  </label>
                  <input
                    type="date"
                    value={editExamDate}
                    onChange={(e) => setEditExamDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    وقت الاختبار
                  </label>
                  <input
                    type="text"
                    value={editExamTime}
                    onChange={(e) => setEditExamTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    المقر / القاعة
                  </label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    الدرجة المستهدفة (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editTargetScore}
                    onChange={(e) => setEditTargetScore(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  المواضيع والشباشتر المغطاة (تفصل بينهم بفاصلة)
                </label>
                <input
                  type="text"
                  value={editTopicsInput}
                  onChange={(e) => setEditTopicsInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  ملاحظات المذاكرة
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
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
