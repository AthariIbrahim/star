import React, { useState, useEffect } from 'react';
import { QuizItem, QuizQuestion, ContentItem } from '../types';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RotateCw,
  Plus,
  Play,
  Check,
  Layers,
  Timer,
  AlertTriangle,
  Edit3,
  Trash2,
  Eye,
  Settings,
  Filter,
  CheckSquare,
  FileQuestion,
  Info,
  Bookmark,
  BookmarkCheck,
  Search,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface QuizzesViewProps {
  quizzes: QuizItem[];
  onAddQuiz: (newQuiz: QuizItem) => void;
  onUpdateQuiz?: (updatedQuiz: QuizItem) => void;
  onDeleteQuiz?: (quizId: string) => void;
  onUpdateQuizAttempt: (quizId: string, score: number, total: number, timeSpent: number) => void;
  contentItems?: ContentItem[];
}

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  quizzes,
  onAddQuiz,
  onUpdateQuiz,
  onDeleteQuiz,
  onUpdateQuizAttempt,
  contentItems = []
}) => {
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);

  // Active quiz attempt state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [feedbackMode, setFeedbackMode] = useState<'instant' | 'exam'>('instant');
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  // Search & Subject Filter for Quizzes List
  const [searchFilter, setSearchFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Timer state for active quiz
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [timeOutTriggered, setTimeOutTriggered] = useState(false);

  // Completed quiz review filter
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong'>('all');

  // Quiz Modal (AI vs Manual) state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ai' | 'manual'>('ai');

  // AI Quiz Generator form state
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'choice' | 'tf' | 'mixed'>('choice');
  const [hasTimer, setHasTimer] = useState<boolean>(true);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Creation state
  const [manualTitle, setManualTitle] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualChapter, setManualChapter] = useState('');
  const [manualHasTimer, setManualHasTimer] = useState(true);
  const [manualTimeLimit, setManualTimeLimit] = useState(5);
  const [manualQuestions, setManualQuestions] = useState<
    Array<{
      question: string;
      options: string[];
      correctAnswerIndex: number;
      explanation: string;
    }>
  >([
    {
      question: 'أكتب هنا نص السؤال الأول',
      options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
      correctAnswerIndex: 0,
      explanation: 'شرح بسيط يوضح سبب صحة الخيار'
    }
  ]);

  // Edit Quiz Modal state
  const [editingQuiz, setEditingQuiz] = useState<QuizItem | null>(null);
  const [editQTitle, setEditQTitle] = useState('');
  const [editQSubject, setEditQSubject] = useState('');
  const [editQChapter, setEditQChapter] = useState('');
  const [editQTimeLimit, setEditQTimeLimit] = useState<number>(5);
  const [editQQuestions, setEditQQuestions] = useState<QuizQuestion[]>([]);

  const handleOpenEditQuiz = (q: QuizItem) => {
    setEditingQuiz(q);
    setEditQTitle(q.title);
    setEditQSubject(q.subject);
    setEditQChapter(q.chapter || '');
    setEditQTimeLimit(q.timeLimitMinutes || 5);
    setEditQQuestions(JSON.parse(JSON.stringify(q.questions || [])));
  };

  const handleSaveEditQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz || !editQTitle.trim()) return;

    // Validate that questions have at least 2 options
    const sanitizedQuestions = editQQuestions.map((q, idx) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${idx}`,
      question: q.question.trim() || `سؤال ${idx + 1}`,
      options: (q.options && q.options.length >= 2) ? q.options : ['صح', 'خطأ'],
      correctAnswerIndex: (q.correctAnswerIndex >= 0 && q.correctAnswerIndex < (q.options?.length || 2)) ? q.correctAnswerIndex : 0,
      explanation: q.explanation || 'لا يوجد شرح مضاف'
    }));

    const updated: QuizItem = {
      ...editingQuiz,
      title: editQTitle.trim(),
      subject: editQSubject.trim() || 'عام',
      chapter: editQChapter.trim() || undefined,
      timeLimitMinutes: Number(editQTimeLimit) || 0,
      questions: sanitizedQuestions
    };

    if (onUpdateQuiz) {
      onUpdateQuiz(updated);
    }
    setEditingQuiz(null);
  };

  const handleDeleteQuizItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onDeleteQuiz) {
      onDeleteQuiz(id);
    }
  };

  // When selecting an uploaded content item / chapter
  const handleSelectContentItem = (contentId: string) => {
    setSelectedContentId(contentId);
    if (!contentId) return;
    const found = contentItems.find((c) => c.id === contentId);
    if (found) {
      setTopic(found.title);
      setSubject(found.topic);
      setChapter(found.chapter || '');
      setSourceText(found.extractedText || found.summary || '');
    }
  };

  // Start a Quiz
  const handleStartQuiz = (quiz: QuizItem, overrideTimeLimit?: number) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setFlaggedQuestions({});
    setIsCompleted(false);
    setTimeSpent(0);
    setTimeOutTriggered(false);

    const minutes = overrideTimeLimit !== undefined ? overrideTimeLimit : (quiz.timeLimitMinutes || 0);
    if (minutes > 0) {
      setRemainingSeconds(minutes * 60);
    } else {
      setRemainingSeconds(null);
    }
  };

  // Toggle Flag Question for Review
  const handleToggleFlag = (questionIdx: number) => {
    setFlaggedQuestions((prev) => ({ ...prev, [questionIdx]: !prev[questionIdx] }));
  };

  // Retake Only Wrong Questions
  const handleRetakeWrongQuestionsOnly = () => {
    if (!activeQuiz) return;
    const questions = activeQuiz.questions || [];
    const wrongQuestions = questions.filter((_, idx) => selectedAnswers[idx] !== questions[idx]?.correctAnswerIndex);
    if (wrongQuestions.length === 0) return;

    const focusedQuiz: QuizItem = {
      ...activeQuiz,
      id: `qz_wrong_${Date.now()}`,
      title: `مراجعة الأسئلة الخاطئة: ${activeQuiz.title}`,
      questions: wrongQuestions,
      timeLimitMinutes: Math.max(2, Math.ceil(wrongQuestions.length * 1.5))
    };

    handleStartQuiz(focusedQuiz);
  };

  // Countdown Timer Effect
  useEffect(() => {
    if (!activeQuiz || isCompleted || remainingSeconds === null) return;

    if (remainingSeconds <= 0) {
      setTimeOutTriggered(true);
      handleFinishQuiz();
      return;
    }

    const timerId = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeQuiz, isCompleted, remainingSeconds]);

  // Answer selection
  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (selectedAnswers[questionIdx] !== undefined) return; // already answered
    setSelectedAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
    if (feedbackMode === 'instant') {
      setShowExplanation((prev) => ({ ...prev, [questionIdx]: true }));
    }
  };

  // Submit & finish Quiz
  const handleFinishQuiz = () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    const questions = activeQuiz.questions || [];
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    setIsCompleted(true);
    onUpdateQuizAttempt(activeQuiz.id, correctCount, questions.length, timeSpent || 60);
  };

  // Generate new AI Quiz
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);

    try {
      let quizResult: any = null;

      const matchedContent = contentItems.find(c => c.id === selectedContentId);
      const effectiveSourceText = sourceText.trim()
        ? sourceText
        : matchedContent
        ? (matchedContent.extractedText || matchedContent.summary || (matchedContent.keyTakeaways || []).join('\n'))
        : (chapter ? `الشابتر / الفصل: ${chapter}` : '');

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const response = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            topic,
            subject: subject || (matchedContent ? matchedContent.topic : 'عام'),
            sourceText: effectiveSourceText,
            questionCount,
            difficulty,
            questionType
          })
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          try {
            const text = await response.text();
            const data = JSON.parse(text);
            if (data.success && data.quiz) {
              quizResult = data.quiz;
            }
          } catch (e) {
            console.error('Failed to parse quiz response JSON:', e);
          }
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          console.warn('Quiz generation API timed out, seamlessly using local question generator.');
        } else {
          console.warn('Notice generating quiz via API:', error);
        }
      }

      const finalQuestions: QuizQuestion[] = [];

      if (quizResult && Array.isArray(quizResult.questions) && quizResult.questions.length > 0) {
        quizResult.questions.forEach((q: any, idx: number) => {
          finalQuestions.push({
            id: `q_${Date.now()}_${idx}`,
            question: q.question || `سؤال ${idx + 1} حول ${topic}`,
            options: (Array.isArray(q.options) && q.options.length >= 2) ? q.options : ['صح', 'خطأ'],
            correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
            explanation: q.explanation || `الشرح والعلة الأكاديمية لإجابة سؤال ${topic}.`
          });
        });
      } else {
        // Fallback questions generator using effectiveSourceText or topic
        const sentences = effectiveSourceText
          ? effectiveSourceText.replace(/(?:Matrix|Balance|Density|Structure|Context|Formulation|Architecture|System|Baseline|Standard|Dynamics|Scale|Value|Metric|Operations|Scope|Interface|Process|Dynamic|Vector|Analysis|Unit|Strategy|Framework|Engine|Pattern|Specification|Implementation|Target|Design|Control|Specifications|Core|Base|Platform|Execution|Systems){3,}/gi, '').split(/[\n.]+/).filter(s => s.trim().length > 10)
          : [];

        const questionTemplates = [
          (t: string, idx: number) => `سؤال ${idx + 1}: ما هو المفهوم العلمي/الأكاديمي الأبرز المتعلق بـ (${t})؟`,
          (t: string, idx: number) => `سؤال ${idx + 1}: أيٌّ من الخيارات التالية يُمثّل الاستنتاج الصحيح في درس (${t})؟`,
          (t: string, idx: number) => `سؤال ${idx + 1}: عند التحليل في موضوع (${t})، أي القواعد العلمية التالية تُعتبر دقيقة؟`,
          (t: string, idx: number) => `سؤال ${idx + 1}: ما الفكرة المحورية التي ترتكز عليها دراسة (${t})؟`,
          (t: string, idx: number) => `سؤال ${idx + 1}: أيٌّ من العبارات الآتية تُوضّح بوضوح القاعدة الأساسية لـ (${t})؟`
        ];

        const count = Math.min(Math.max(questionCount || 5, 2), 10);
        for (let i = 0; i < count; i++) {
          const rawSentence = sentences[i % sentences.length] || `المفهوم الجوهري والتطبيقات الأكاديمية لموضوع ${topic}`;
          const currentSentence = rawSentence.replace(/\*\*/g, '').trim();

          if (questionType === 'tf' || (questionType === 'mixed' && i % 2 === 1)) {
            finalQuestions.push({
              id: `q_${Date.now()}_${i}`,
              question: `سؤال ${i + 1} (صح أم خطأ): وفقاً لمادة ${subject || topic}، فإن: "${currentSentence}" تعتبر عبارة علمية صحيحة.`,
              options: ['صح', 'خطأ'],
              correctAnswerIndex: 0,
              explanation: `عبارة صحيحة تماماً وتمثل حقيقة علمية مثبتة في درس ${topic}.`
            });
          } else {
            const rawOther1 = sentences[(i + 1) % sentences.length] || `مبادئ التحليل والاستنتاج في ${subject || topic}`;
            const rawOther2 = sentences[(i + 2) % sentences.length] || `التطبيقات الحسابية والتجارب الخاصة بـ ${topic}`;

            const otherSentence1 = rawOther1.replace(/\*\*/g, '').trim();
            const otherSentence2 = rawOther2.replace(/\*\*/g, '').trim();

            const allOpts = [
              currentSentence,
              otherSentence1 !== currentSentence ? otherSentence1 : `افتراض خاطئ يخالف قوانين ${subject || topic}`,
              otherSentence2 !== currentSentence && otherSentence2 !== otherSentence1 ? otherSentence2 : `حالة استثنائية غير تنطبق على ${topic}`,
              `استنتاج متناقض مع معطيات وقوانين ${subject || topic}`
            ];

            const cIdx = i % 4;
            const temp = allOpts[0];
            allOpts[0] = allOpts[cIdx];
            allOpts[cIdx] = temp;

            const qFn = questionTemplates[i % questionTemplates.length];

            finalQuestions.push({
              id: `q_${Date.now()}_${i}`,
              question: qFn(topic, i),
              options: allOpts,
              correctAnswerIndex: cIdx,
              explanation: `الإجابة الصحيحة تعتمد على الفكرة الجوهرية: "${currentSentence}" في مادة ${subject || topic}.`
            });
          }
        }
      }

      const finalTimeLimit = hasTimer ? (timeLimitMinutes || 5) : 0;
      const newQuiz: QuizItem = {
        id: `qz_${Date.now()}`,
        title: quizResult?.title || `كويز ${topic}`,
        subject: subject || 'عام',
        chapter: chapter || undefined,
        contentId: selectedContentId || undefined,
        timeLimitMinutes: finalTimeLimit,
        questions: finalQuestions,
        attempts: [],
        createdAt: new Date().toISOString().split('T')[0]
      };

      onAddQuiz(newQuiz);
      setIsModalOpen(false);
      setTopic('');
      setSubject('');
      setChapter('');
      setSourceText('');
      setSelectedContentId('');
      handleStartQuiz(newQuiz);
    } catch (globalErr) {
      console.error('Fatal error generating quiz:', globalErr);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Manual Quiz
  const handleSaveManualQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const formattedQuestions: QuizQuestion[] = manualQuestions.map((q, idx) => ({
      id: `q_man_${Date.now()}_${idx}`,
      question: q.question.trim() || `سؤال مخصص ${idx + 1}`,
      options: q.options.map((opt, oIdx) => opt.trim() || `خيار ${oIdx + 1}`),
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation.trim() || 'إجابة مخصصة من إعداد الطالب'
    }));

    const newQuiz: QuizItem = {
      id: `qz_man_${Date.now()}`,
      title: manualTitle.trim(),
      subject: manualSubject.trim() || 'عام',
      chapter: manualChapter.trim() || undefined,
      timeLimitMinutes: manualHasTimer ? (manualTimeLimit || 5) : 0,
      questions: formattedQuestions,
      attempts: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddQuiz(newQuiz);
    setIsModalOpen(false);

    // Reset Manual Form
    setManualTitle('');
    setManualSubject('');
    setManualChapter('');
    setManualQuestions([
      {
        question: 'أكتب هنا نص السؤال الأول',
        options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
        correctAnswerIndex: 0,
        explanation: 'شرح بسيط يوضح سبب صحة الخيار'
      }
    ]);

    handleStartQuiz(newQuiz);
  };

  // Helper to format remaining time MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-24">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            قسم الكويزات والاختبارات التفاعلية
          </h2>
          <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold mt-1">
            أنشئ وخصص اختباراتك بالذكاء الاصطناعي أو يدوياً مع إظهار الإجابات والحلول الشارحة ومراجعة النتائج
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-violet-500/20 hover:opacity-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إنشاء وتخصيص كويز جديد</span>
        </button>
      </div>

      {activeQuiz ? (
        /* Active Quiz Attempt Mode */
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 max-w-3xl mx-auto border border-violet-500/20 shadow-xl">

          {/* Quiz Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                  {activeQuiz.subject}
                </span>
                {activeQuiz.chapter && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {activeQuiz.chapter}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {activeQuiz.title}
              </h3>
            </div>

            {/* Timer Status / Exit button */}
            <div className="flex items-center gap-3">
              {remainingSeconds !== null ? (
                <div className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 text-xs font-black transition-all ${
                  remainingSeconds < 60 
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 animate-pulse' 
                    : 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300'
                }`}>
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>الوقت المتبقي: {formatTime(remainingSeconds)}</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-slate-400" />
                  <span>اختبار بدون وقت</span>
                </div>
              )}

              <button
                onClick={() => setActiveQuiz(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
              >
                خروج
              </button>
            </div>
          </div>

          {!isCompleted ? (
            /* Questions step */
            <div className="space-y-6">

              {/* Mode Switch & Stepper Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100/80 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFeedbackMode('instant')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      feedbackMode === 'instant'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>تغذية راجعة مباشرة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFeedbackMode('exam')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      feedbackMode === 'exam'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>مود محاكاة الاختبار</span>
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="bg-white dark:bg-slate-700 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-600">
                    السؤال {currentQuestionIndex + 1} من {(activeQuiz.questions || []).length}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    تمت إجابة {Object.keys(selectedAnswers).length} من {(activeQuiz.questions || []).length}
                  </span>
                </div>
              </div>

              {/* Interactive Question Numbers Grid Navigation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>التنقل السريع بين الأسئلة:</span>
                  {Object.keys(flaggedQuestions).filter(k => flaggedQuestions[Number(k)]).length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {Object.keys(flaggedQuestions).filter(k => flaggedQuestions[Number(k)]).length} معلّم للمراجعة
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(activeQuiz.questions || []).map((_, qIdx) => {
                    const isCurrent = qIdx === currentQuestionIndex;
                    const isAnswered = selectedAnswers[qIdx] !== undefined;
                    const isFlagged = flaggedQuestions[qIdx];
                    const isCorrectInInstant = feedbackMode === 'instant' && isAnswered && selectedAnswers[qIdx] === activeQuiz.questions?.[qIdx]?.correctAnswerIndex;
                    const isWrongInInstant = feedbackMode === 'instant' && isAnswered && selectedAnswers[qIdx] !== activeQuiz.questions?.[qIdx]?.correctAnswerIndex;

                    let btnBg = "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                    if (isCurrent) {
                      btnBg = "bg-violet-600 text-white font-black ring-2 ring-violet-500/50 shadow-md border-violet-600";
                    } else if (isCorrectInInstant) {
                      btnBg = "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 font-bold";
                    } else if (isWrongInInstant) {
                      btnBg = "bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-500/40 font-bold";
                    } else if (isAnswered) {
                      btnBg = "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30 font-bold";
                    }

                    return (
                      <button
                        key={qIdx}
                        onClick={() => setCurrentQuestionIndex(qIdx)}
                        className={`w-9 h-9 rounded-xl border text-xs flex items-center justify-center shrink-0 transition-all relative ${btnBg}`}
                        title={`الانتقال إلى السؤال ${qIdx + 1}`}
                      >
                        <span>{qIdx + 1}</span>
                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border border-white dark:border-slate-900" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / Math.max(1, (activeQuiz.questions || []).length)) * 100}%`
                  }}
                />
              </div>

              {/* Current Question Container */}
              {activeQuiz.questions[currentQuestionIndex] && (
                <div className="space-y-5 bg-slate-50/50 dark:bg-slate-900/40 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800">

                  {/* Question Title & Bookmark Toggle */}
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black tracking-wider text-violet-600 dark:text-violet-400 uppercase block">
                        السؤال {currentQuestionIndex + 1}:
                      </span>
                      <h4 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white leading-relaxed">
                        {activeQuiz.questions[currentQuestionIndex].question}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFlag(currentQuestionIndex)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        flaggedQuestions[currentQuestionIndex]
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-600'
                      }`}
                      title="تعليم السؤال للمراجعة لاحقاً"
                    >
                      {flaggedQuestions[currentQuestionIndex] ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span className="hidden sm:inline">معلّم للمراجعة</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" />
                          <span className="hidden sm:inline">تعليم</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Options List */}
                  <div className="space-y-3 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      الخيارات المتاحة للإجابة:
                    </span>

                    {(activeQuiz.questions[currentQuestionIndex].options || []).map((option, optIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                      const isCorrect = activeQuiz.questions[currentQuestionIndex].correctAnswerIndex === optIdx;
                      const hasAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

                      let containerStyle = "bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-slate-800";
                      let badgeStyle = "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600";

                      if (hasAnswered) {
                        if (feedbackMode === 'instant') {
                          if (isCorrect) {
                            containerStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold shadow-sm";
                            badgeStyle = "bg-emerald-500 text-white border-emerald-500";
                          } else if (isSelected) {
                            containerStyle = "bg-rose-500/10 border-rose-500 text-rose-950 dark:text-rose-200 font-bold shadow-sm";
                            badgeStyle = "bg-rose-500 text-white border-rose-500";
                          } else {
                            containerStyle = "bg-white/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60";
                          }
                        } else {
                          // Exam Mode: reveal selection only
                          if (isSelected) {
                            containerStyle = "bg-violet-500/15 border-violet-500 text-violet-950 dark:text-violet-200 font-bold shadow-sm";
                            badgeStyle = "bg-violet-600 text-white border-violet-600";
                          } else {
                            containerStyle = "bg-white/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60";
                          }
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(currentQuestionIndex, optIdx)}
                          className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 shadow-xs ${containerStyle}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 border transition-all ${badgeStyle}`}>
                              {OPTION_LETTERS[optIdx] || optIdx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                              {option}
                            </span>
                          </div>

                          {hasAnswered && feedbackMode === 'instant' && (
                            isCorrect ? (
                              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-black shrink-0 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>إجابة صحيحة</span>
                              </div>
                            ) : isSelected ? (
                              <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-black shrink-0 bg-rose-500/10 px-2.5 py-1 rounded-xl">
                                <XCircle className="w-4 h-4" />
                                <span>إجابة خاطئة</span>
                              </div>
                            ) : null
                          )}

                          {hasAnswered && feedbackMode === 'exam' && isSelected && (
                            <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs font-bold shrink-0 bg-violet-500/10 px-2.5 py-1 rounded-xl">
                              <Check className="w-4 h-4" />
                              <span>تم الاختيار</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Toggle Reveal Answer Button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShowExplanation((prev) => ({
                          ...prev,
                          [currentQuestionIndex]: !prev[currentQuestionIndex]
                        }))
                      }
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                    >
                      <Info className="w-4 h-4" />
                      <span>
                        {showExplanation[currentQuestionIndex]
                          ? 'إخفاء الإجابة والشرح الشارح'
                          : 'إظهار الإجابة النموذجية والشرح التعليمي'}
                      </span>
                    </button>
                  </div>

                  {/* Academic Explanation Box */}
                  {showExplanation[currentQuestionIndex] && (
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5 animate-fadeIn">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-black">
                        <Sparkles className="w-4 h-4" />
                        <span>
                          الإجابة الصحيحة: (
                          {OPTION_LETTERS[activeQuiz.questions[currentQuestionIndex].correctAnswerIndex] ||
                            activeQuiz.questions[currentQuestionIndex].correctAnswerIndex + 1}
                          ) -{' '}
                          {
                            activeQuiz.questions[currentQuestionIndex].options[
                              activeQuiz.questions[currentQuestionIndex].correctAnswerIndex
                            ]
                          }
                        </span>
                      </div>
                      <p className="leading-relaxed font-medium pr-1 pt-1 border-t border-indigo-500/20">
                        {activeQuiz.questions[currentQuestionIndex].explanation}
                      </p>
                    </div>
                  )}

                  {/* Navigation Stepper Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold disabled:opacity-30 transition-all flex items-center gap-1"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>السؤال السابق</span>
                    </button>

                    {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-md hover:bg-violet-700 transition-all flex items-center gap-1"
                      >
                        <span>السؤال التالي</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishQuiz}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>تسليم الكويز وحساب النتيجة</span>
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>
          ) : (
            /* Completed Score Card & Detailed Review */
            <div className="p-4 sm:p-6 text-center space-y-6 animate-fadeIn">

              {timeOutTriggered && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 max-w-md mx-auto">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>انتهى الوقت المحدد للاختبار! تم إرسال الإجابات وحساب نتيجتك تلقائياً.</span>
                </div>
              )}

              <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-inner">
                <Award className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  أكتمل الكويز بنجاح!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  تم تسجيل إجاباتك وحفظ النتيجة في سجل تقدمك الدراسي. استعرض الإجابات النموذجية بالأسفل.
                </p>
              </div>

              {/* Score Display */}
              <div className="p-6 rounded-3xl bg-slate-100/90 dark:bg-slate-800/90 max-w-xs mx-auto space-y-1.5 border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider block">
                  درجتك النهائية
                </span>
                <span className="text-4xl font-black text-violet-600 dark:text-violet-400">
                  {Object.keys(selectedAnswers).filter(
                    (idx) => selectedAnswers[Number(idx)] === activeQuiz.questions?.[Number(idx)]?.correctAnswerIndex
                  ).length} / {(activeQuiz.questions || []).length}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  النسبة المئوية: {Math.round(
                    (Object.keys(selectedAnswers).filter(
                      (idx) => selectedAnswers[Number(idx)] === activeQuiz.questions?.[Number(idx)]?.correctAnswerIndex
                    ).length / Math.max(1, (activeQuiz.questions || []).length)) * 100
                  )}%
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleStartQuiz(activeQuiz)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>إعادة المحاولة كاملة</span>
                </button>

                {(activeQuiz.questions || []).filter((_, idx) => selectedAnswers[idx] !== activeQuiz.questions?.[idx]?.correctAnswerIndex).length > 0 && (
                  <button
                    onClick={handleRetakeWrongQuestionsOnly}
                    className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>إعادة الأسئلة الخاطئة فقط ({(activeQuiz.questions || []).filter((_, idx) => selectedAnswers[idx] !== activeQuiz.questions?.[idx]?.correctAnswerIndex).length})</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all"
                >
                  العودة لقائمة الكويزات
                </button>
              </div>

              {/* Detailed Answers Review Section */}
              <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-right space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FileQuestion className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>مراجعة الأسئلة والحلول الشارحة بالتفصيل:</span>
                  </h4>

                  {/* Review Filter */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setReviewFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        reviewFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      الكل ({(activeQuiz.questions || []).length})
                    </button>
                    <button
                      onClick={() => setReviewFilter('correct')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        reviewFilter === 'correct'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      الصحيحة
                    </button>
                    <button
                      onClick={() => setReviewFilter('wrong')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        reviewFilter === 'wrong'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      الخاطئة
                    </button>
                  </div>
                </div>

                {/* Review Question Cards List */}
                <div className="space-y-4">
                  {(activeQuiz.questions || [])
                    .map((q, qIdx) => {
                      const userChoice = selectedAnswers[qIdx];
                      const isUserCorrect = userChoice === q.correctAnswerIndex;

                      if (reviewFilter === 'correct' && !isUserCorrect) return null;
                      if (reviewFilter === 'wrong' && isUserCorrect) return null;

                      return (
                        <div
                          key={q.id || qIdx}
                          className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                              السؤال {qIdx + 1}: {q.question}
                            </h5>
                            {userChoice === undefined ? (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                                لم يتم الإجابة
                              </span>
                            ) : isUserCorrect ? (
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                إجابة صحيحة
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" />
                                إجابة خاطئة
                              </span>
                            )}
                          </div>

                          {/* Options Review List */}
                          <div className="space-y-2 pt-1">
                            {(q.options || []).map((opt, oIdx) => {
                              const isCorrectOption = q.correctAnswerIndex === oIdx;
                              const isUserSelected = userChoice === oIdx;

                              let optBg = "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300";
                              if (isCorrectOption) {
                                optBg = "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-bold";
                              } else if (isUserSelected && !isCorrectOption) {
                                optBg = "bg-rose-500/10 border-rose-500/40 text-rose-950 dark:text-rose-200 font-bold";
                              }

                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${optBg}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px]">
                                      {OPTION_LETTERS[oIdx] || oIdx + 1}
                                    </span>
                                    <span>{opt}</span>
                                  </div>

                                  <div className="flex items-center gap-1 text-[10px] font-bold">
                                    {isCorrectOption && (
                                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                        الإجابة النموذجية الصحيحة
                                      </span>
                                    )}
                                    {isUserSelected && (
                                      <span className={`px-2 py-0.5 rounded-md ${isCorrectOption ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                        اختيارك
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Academic Explanation */}
                          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300 block">
                              التفسير العلمي للشرح:
                            </span>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        /* Quizzes List Cards */
        <div className="space-y-4">
          {/* Search & Subject Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="البحث في عناوين الكويزات أو المواد..."
                className="w-full pr-10 pl-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold"
              >
                <option value="all">كل المواد ({quizzes.length})</option>
                {Array.from(new Set(quizzes.map((q) => q.subject).filter(Boolean))).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes
              .filter((quiz) => {
                const matchesSearch =
                  !searchFilter ||
                  quiz.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  quiz.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  (quiz.chapter && quiz.chapter.toLowerCase().includes(searchFilter.toLowerCase()));
                const matchesSubject = subjectFilter === 'all' || quiz.subject === subjectFilter;
                return matchesSearch && matchesSubject;
              })
              .map((quiz) => (
                <div
                  key={quiz.id}
                  className="glass-panel p-6 rounded-3xl space-y-4 hover:border-violet-500/40 transition-all relative flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md"
                >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold border border-violet-500/20">
                      {quiz.subject}
                    </span>
                    {quiz.chapter && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                        {quiz.chapter}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {(quiz.questions || []).length} أسئلة
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEditQuiz(quiz); }}
                      className="p-1.5 rounded-lg hover:bg-violet-500/10 text-slate-400 hover:text-violet-500 transition-colors"
                      title="تعديل الكويز والأسئلة"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteQuizItem(quiz.id, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                      title="حذف الكويز"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {quiz.title}
                </h3>

                {/* Timer info tag */}
                <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span>
                    {quiz.timeLimitMinutes && quiz.timeLimitMinutes > 0
                      ? `مؤقت: ${quiz.timeLimitMinutes} دقائق`
                      : 'بدون وقت (غير محدد بمؤقت)'}
                  </span>
                </div>
              </div>

              {/* History attempt pill */}
              {(quiz.attempts || []).length > 0 ? (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-bold">
                  <span>أعلى محاولة:</span>
                  <span>{quiz.attempts![quiz.attempts!.length - 1].score} / {quiz.attempts![quiz.attempts!.length - 1].totalQuestions} ({quiz.attempts![quiz.attempts!.length - 1].percentage}%)</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 text-[11px] text-slate-500 text-center font-medium">
                  لم تبدأ هذا الكويز بعد
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  className="w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>بدء الكويز الآن</span>
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Quiz Customization / Creator Modal (AI Generator vs Manual Creation) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-3xl space-y-5 relative animate-fadeIn border border-violet-500/30 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span>إنشاء وتخصيص كويز اختبار جديد</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                إغلاق
              </button>
            </div>

            {/* Creation Mode Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setModalMode('ai')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  modalMode === 'ai'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>توليد بالذكاء الاصطناعي</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode('manual')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  modalMode === 'manual'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>صياغة وتخصيص يدوية</span>
              </button>
            </div>

            {modalMode === 'ai' ? (
              /* AI Generator Form */
              <form onSubmit={handleGenerateQuiz} className="space-y-4">
                
                {/* Content Picker */}
                {contentItems.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-1.5">
                    <label className="block text-xs font-bold text-violet-900 dark:text-violet-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      اختيار مادة من المكتبة المرفوعة (اختياري)
                    </label>
                    <select
                      value={selectedContentId}
                      onChange={(e) => handleSelectContentItem(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">-- موضوع حر أو اختر مستنداً من مكتبتك --</option>
                      {contentItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title} ({item.topic} {item.chapter ? `- ${item.chapter}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Topic input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان أو موضوع الكويز
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثال: قوانين الحركة في الفيزياء والكم الميكانيكي"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Subject & Chapter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      المادة الدراسية
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: الفيزياء"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الفصل / الشابتر
                    </label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="مثال: الفصل الثاني"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                {/* Question Type selector */}
                <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    نوع ونمط الأسئلة:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'choice', label: 'اختيار من متعدد (4 خيارات)' },
                      { id: 'tf', label: 'صح أم خطأ' },
                      { id: 'mixed', label: 'متنوع (خيار وصح/خطأ)' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setQuestionType(type.id as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          questionType === type.id
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty level */}
                <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    درجة صعوبة الأسئلة:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'easy', label: 'سهل (أساسي)' },
                      { id: 'medium', label: 'متوسط (قياسي)' },
                      { id: 'hard', label: 'صعب (تحدي متقدم)' }
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setDifficulty(lvl.id as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          difficulty === lvl.id
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count selector */}
                <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>عدد الأسئلة المطلوبة:</span>
                    <span className="text-violet-600 dark:text-violet-400 font-extrabold">{questionCount} أسئلة</span>
                  </label>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[3, 5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          questionCount === num
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        {num} أسئلة
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timer Configuration Toggle */}
                <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-violet-500" />
                      تحديد وقت ومؤقت للاختبار؟
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => setHasTimer(!hasTimer)}
                      className={`px-3 py-1 rounded-xl text-xs font-black transition-all border ${
                        hasTimer
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 border-slate-300 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {hasTimer ? 'مفعل (بمؤقت)' : 'غير مفعل (بدون وقت)'}
                    </button>
                  </div>

                  {hasTimer && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                        اختر مدة الاختبار بالدقائق:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[1, 3, 5, 10, 15, 20, 30].map((min) => (
                          <button
                            key={min}
                            type="button"
                            onClick={() => setTimeLimitMinutes(min)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                              timeLimitMinutes === min
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                            }`}
                          >
                            {min} دقائق
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'جاري توليد الأسئلة والشروحات...' : 'توليد وبدء الكويز الآن'}</span>
                </button>
              </form>
            ) : (
              /* Manual Creator Form */
              <form onSubmit={handleSaveManualQuiz} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الكويز
                  </label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="مثال: كويز مخصص في الكيمياء العضوية"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      المادة
                    </label>
                    <input
                      type="text"
                      value={manualSubject}
                      onChange={(e) => setManualSubject(e.target.value)}
                      placeholder="الكيمياء"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الشابتر / الفصل
                    </label>
                    <input
                      type="text"
                      value={manualChapter}
                      onChange={(e) => setManualChapter(e.target.value)}
                      placeholder="الفصل الأول"
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Timer setup */}
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    مؤقت الاختبار (بالدقائق):
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={manualTimeLimit}
                    onChange={(e) => setManualTimeLimit(Number(e.target.value))}
                    className="w-20 px-3 py-1 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 text-xs font-bold text-center"
                  />
                </div>

                {/* Questions Builder */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      قائمة الأسئلة المخصصة ({manualQuestions.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setManualQuestions((prev) => [
                          ...prev,
                          {
                            question: `السؤال ${prev.length + 1}`,
                            options: ['الخيار 1', 'الخيار 2', 'الخيار 3', 'الخيار 4'],
                            correctAnswerIndex: 0,
                            explanation: ''
                          }
                        ])
                      }
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      إضافة سؤال جديد
                    </button>
                  </div>

                  {manualQuestions.map((mq, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                          السؤال {qIdx + 1}:
                        </span>
                        {manualQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setManualQuestions((prev) => prev.filter((_, i) => i !== qIdx))
                            }
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                          >
                            حذف السؤال
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={mq.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualQuestions((prev) =>
                            prev.map((item, i) => (i === qIdx ? { ...item, question: val } : item))
                          );
                        }}
                        placeholder="نص السؤال..."
                        required
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                      />

                      {/* Options */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                          الخيارات (اختر الدائرة للإجابة الصحيحة):
                        </span>
                        {mq.options.map((optVal, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={mq.correctAnswerIndex === oIdx}
                              onChange={() =>
                                setManualQuestions((prev) =>
                                  prev.map((item, i) =>
                                    i === qIdx ? { ...item, correctAnswerIndex: oIdx } : item
                                  )
                                )
                              }
                              className="accent-indigo-600 w-4 h-4 cursor-pointer"
                              title="تحديد كإجابة صحيحة"
                            />
                            <span className="text-xs font-bold text-slate-500 w-4">
                              {OPTION_LETTERS[oIdx] || oIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={optVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualQuestions((prev) =>
                                  prev.map((item, i) => {
                                    if (i !== qIdx) return item;
                                    const newOpts = [...item.options];
                                    newOpts[oIdx] = val;
                                    return { ...item, options: newOpts };
                                  })
                                );
                              }}
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={mq.explanation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualQuestions((prev) =>
                            prev.map((item, i) => (i === qIdx ? { ...item, explanation: val } : item))
                          );
                        }}
                        placeholder="تفسير أو شرح صحة الإجابة..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ وبدء الكويز المخصص</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-3xl space-y-5 relative animate-fadeIn border border-indigo-500/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                تعديل وتخصيص بيانات وأسئلة الكويز
              </h3>
              <button
                onClick={() => setEditingQuiz(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveEditQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الكويز
                </label>
                <input
                  type="text"
                  value={editQTitle}
                  onChange={(e) => setEditQTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المادة
                  </label>
                  <input
                    type="text"
                    value={editQSubject}
                    onChange={(e) => setEditQSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الفصل / الشابتر
                  </label>
                  <input
                    type="text"
                    value={editQChapter}
                    onChange={(e) => setEditQChapter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المؤقت (بالدقائق)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={editQTimeLimit}
                    onChange={(e) => setEditQTimeLimit(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Questions & Options Editor */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                    أسئلة وإجابات الكويز ({editQQuestions.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditQQuestions((prev) => [
                        ...prev,
                        {
                          id: `q_edit_${Date.now()}`,
                          question: `سؤال جديد ${prev.length + 1}`,
                          options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'],
                          correctAnswerIndex: 0,
                          explanation: 'شرح وتفسير الإجابة الصحيحة'
                        }
                      ])
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة سؤال
                  </button>
                </div>

                {editQQuestions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        السؤال {qIdx + 1}:
                      </span>
                      {editQQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEditQQuestions((prev) => prev.filter((_, i) => i !== qIdx))}
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                        >
                          حذف السؤال
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditQQuestions((prev) =>
                          prev.map((item, i) => (i === qIdx ? { ...item, question: val } : item))
                        );
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                    />

                    {/* Options list editor */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                        الخيارات (اختر الدائرة للإجابة الصحيحة):
                      </span>
                      {(q.options || []).map((optVal, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`edit_correct_${qIdx}`}
                            checked={q.correctAnswerIndex === oIdx}
                            onChange={() =>
                              setEditQQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIdx ? { ...item, correctAnswerIndex: oIdx } : item
                                )
                              )
                            }
                            className="accent-indigo-600 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-500 w-4">
                            {OPTION_LETTERS[oIdx] || oIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={optVal}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditQQuestions((prev) =>
                                prev.map((item, i) => {
                                  if (i !== qIdx) return item;
                                  const newOpts = [...(item.options || [])];
                                  newOpts[oIdx] = val;
                                  return { ...item, options: newOpts };
                                })
                              );
                            }}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditQQuestions((prev) =>
                          prev.map((item, i) => (i === qIdx ? { ...item, explanation: val } : item))
                        );
                      }}
                      placeholder="الشرح والتفسير..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-md"
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
