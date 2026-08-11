import React, { useState, useEffect } from 'react';
import { ViewType, Navigation } from './components/Navigation';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ContentHubView } from './components/ContentHubView';
import { SummariesView } from './components/SummariesView';
import { QuizzesView } from './components/QuizzesView';
import { CustomTestsView } from './components/CustomTestsView';
import { StudyPlannerView } from './components/StudyPlannerView';
import { GeneralAiChatView } from './components/GeneralAiChatView';
import { GoogleAuthModal } from './components/GoogleAuthModal';

import {
  initialUserProfile,
  initialContentItems,
  initialSummaryItems,
  initialQuizItems,
  initialCustomTests,
  initialStudyTasks
} from './data/initialData';

import {
  UserProfile,
  ContentItem,
  SummaryItem,
  QuizItem,
  CustomTest,
  StudyTask,
  ChatMessage,
  ChatAttachment,
  QuizQuestion,
  Flashcard
} from './types';

import {
  seedInitialDataIfEmpty,
  subscribeContentItems,
  subscribeSummaries,
  subscribeQuizzes,
  subscribeTasks,
  subscribeCustomTests,
  subscribeAllUsers,
  registerWithEmailPassword,
  loginWithEmailPassword,
  loginWithGooglePopup,
  saveContentItem,
  deleteContentItemDoc,
  saveSummaryItem,
  deleteSummaryItemDoc,
  saveQuizItem,
  deleteQuizItemDoc,
  saveTaskItem,
  deleteTaskItemDoc,
  saveCustomTestItem,
  deleteCustomTestItemDoc,
  saveUserProfile,
  deleteUserProfile,
  subscribeUserProfile,
  logoutUserAuth
} from './lib/dbService';

export default function App() {
  // Theme state: White / Black (Dark) theme toggle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('taleb_theme') === 'dark';
  });

  // Active view tab state
  const [activeView, setActiveView] = useState<ViewType>('dashboard');

  // Search query filter
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [user, setUser] = useState<UserProfile>(initialUserProfile);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>(initialContentItems);
  const [summaries, setSummaries] = useState<SummaryItem[]>(initialSummaryItems);
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizItems);
  const [customTests, setCustomTests] = useState<CustomTest[]>(initialCustomTests);
  const [tasks, setTasks] = useState<StudyTask[]>(initialStudyTasks);

  // Initialize and subscribe to Firestore
  useEffect(() => {
    // Seed initial data if Firestore database is empty
    seedInitialDataIfEmpty();

    const unsubContent = subscribeContentItems((items) => {
      setContentItems(items);
    });
    const unsubSummaries = subscribeSummaries((items) => {
      setSummaries(items);
    });
    const unsubQuizzes = subscribeQuizzes((items) => {
      setQuizzes(items);
    });
    const unsubTasks = subscribeTasks((items) => {
      setTasks(items);
    });
    const unsubTests = subscribeCustomTests((items) => {
      setCustomTests(items);
    });
    const unsubUsers = subscribeAllUsers((usersList) => {
      if (usersList.length > 0) setAllUsers(usersList);
    });

    return () => {
      unsubContent();
      unsubSummaries();
      unsubQuizzes();
      unsubTasks();
      unsubTests();
      unsubUsers();
    };
  }, []);

  // Chat messages history
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: 'أهلاً بك في منصة نجم! أنا مساعدك التعليمي بالذكاء الاصطناعي. كيف يمكنني مساعدتك في دراستك واستيعاب المواد اليوم؟',
      timestamp: 'الآن'
    }
  ]);

  // Auth modal toggle
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Apply dark mode class to root html element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('taleb_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('taleb_theme', 'light');
    }
  }, [isDarkMode]);

  // Toggle Theme
  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Google Popup Handler
  const handleGooglePopupAuth = async (): Promise<UserProfile | null> => {
    const googleUser = await loginWithGooglePopup();
    if (googleUser) {
      setUser(googleUser);
      return googleUser;
    }
    return null;
  };

  // Google Login Handler
  const handleLoginWithGoogle = async (name: string, email: string) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name || 'طالب متميز',
      email: email || 'student@gmail.com',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email || 'student')}`,
      provider: 'google',
      gradeLevel: 'المرحلة الثانوية',
      targetExam: 'اختبار القدرات والتحصيلي',
      streakDays: 7,
      points: 1250,
      level: 'طالب متميز',
      joinedDate: new Date().toISOString().split('T')[0],
      isLoggedIn: true
    };
    setUser(newUser);
    await saveUserProfile(newUser);
  };

  // Email Login Handler
  const handleLoginWithEmail = async (email: string, pass: string) => {
    const userProfile = await loginWithEmailPassword(email, pass);
    setUser(userProfile);
  };

  // Register New User Handler
  const handleRegisterNewUser = async (
    name: string,
    email: string,
    pass: string,
    gradeLevel?: string,
    targetExam?: string
  ) => {
    const userProfile = await registerWithEmailPassword(name, email, pass, gradeLevel, targetExam);
    setUser(userProfile);
  };

  // Switch Active User Handler
  const handleSwitchUser = async (selectedUser: UserProfile) => {
    const activeUser: UserProfile = { ...selectedUser, isLoggedIn: true };
    setUser(activeUser);
    await saveUserProfile(activeUser);
  };

  // Delete Registered User Handler
  const handleDeleteUser = async (emailToDelete: string) => {
    await deleteUserProfile(emailToDelete);
    setAllUsers((prev) => prev.filter((u) => u.email !== emailToDelete));
  };

  // Logout Handler
  const handleLogout = async () => {
    const loggedOutUser = {
      ...user,
      isLoggedIn: false
    };
    setUser(loggedOutUser);
    await logoutUserAuth();
    await saveUserProfile(loggedOutUser);
  };

  // Task Toggle
  const handleToggleTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated = { ...target, completed: !target.completed };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    await saveTaskItem(updated);
  };

  // Add Content
  const handleAddContent = async (newItem: ContentItem) => {
    setContentItems((prev) => [newItem, ...prev]);
    await saveContentItem(newItem);
  };

  // Update Content
  const handleUpdateContent = async (updatedItem: ContentItem) => {
    setContentItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
    await saveContentItem(updatedItem);
  };

  // Delete Content
  const handleDeleteContent = async (id: string) => {
    setContentItems((prev) => prev.filter((item) => item.id !== id));
    await deleteContentItemDoc(id);
  };

  // Update Summary
  const handleUpdateSummary = async (updatedSummary: SummaryItem) => {
    setSummaries((prev) => prev.map((s) => (s.id === updatedSummary.id ? updatedSummary : s)));
    await saveSummaryItem(updatedSummary);
  };

  // Delete Summary
  const handleDeleteSummary = async (id: string) => {
    setSummaries((prev) => prev.filter((s) => s.id !== id));
    await deleteSummaryItemDoc(id);
  };

  // Update Quiz
  const handleUpdateQuiz = async (updatedQuiz: QuizItem) => {
    setQuizzes((prev) => prev.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q)));
    await saveQuizItem(updatedQuiz);
  };

  // Delete Quiz
  const handleDeleteQuiz = async (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    await deleteQuizItemDoc(id);
  };

  // Update Custom Test
  const handleUpdateCustomTest = async (updatedTest: CustomTest) => {
    setCustomTests((prev) => prev.map((t) => (t.id === updatedTest.id ? updatedTest : t)));
    await saveCustomTestItem(updatedTest);
  };

  // Delete Custom Test
  const handleDeleteCustomTest = async (id: string) => {
    setCustomTests((prev) => prev.filter((t) => t.id !== id));
    await deleteCustomTestItemDoc(id);
  };

  // Update Study Task
  const handleUpdateTask = async (updatedTask: StudyTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    await saveTaskItem(updatedTask);
  };

  // Generate Quiz From Content
  const handleGenerateQuizFromContent = async (content: ContentItem, extractedData?: any, navigate: boolean = true) => {
    let quizQuestions: QuizQuestion[] = [];

    // 1. Try extractedData.suggestedQuizQuestions if valid
    if (extractedData?.suggestedQuizQuestions && Array.isArray(extractedData.suggestedQuizQuestions) && extractedData.suggestedQuizQuestions.length > 0) {
      const validSuggested = extractedData.suggestedQuizQuestions.filter((q: any) =>
        q &&
        typeof q.question === 'string' && q.question.trim() &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        !q.options.some((opt: string) => typeof opt !== 'string' || !opt.trim() || opt.includes('خيار غير صحيح'))
      );

      if (validSuggested.length > 0) {
        quizQuestions = validSuggested.map((q: any, idx: number) => ({
          id: `q_${Date.now()}_${idx}`,
          question: q.question,
          options: q.options,
          correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length ? q.correctAnswerIndex : 0,
          explanation: q.explanation || content.summary
        }));
      }
    }

    // 2. Try generating via API if no valid suggested questions
    if (quizQuestions.length === 0) {
      try {
        const response = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: content.title,
            subject: content.topic,
            sourceText: content.extractedText || content.summary,
            questionCount: 5
          })
        });
        let data: any = null;
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (err) {
          console.error('Failed to parse quiz generate response JSON:', err);
        }
        if (data && data.success && data.quiz && Array.isArray(data.quiz.questions) && data.quiz.questions.length > 0) {
          const validApiQuestions = data.quiz.questions.filter((q: any) =>
            q &&
            typeof q.question === 'string' && q.question.trim() &&
            Array.isArray(q.options) &&
            q.options.length >= 2 &&
            !q.options.some((opt: string) => typeof opt !== 'string' || !opt.trim() || opt.includes('خيار غير صحيح'))
          );

          if (validApiQuestions.length > 0) {
            quizQuestions = validApiQuestions.map((q: any, idx: number) => ({
              id: `q_${Date.now()}_${idx}`,
              question: q.question,
              options: q.options,
              correctAnswerIndex: typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length ? q.correctAnswerIndex : 0,
              explanation: q.explanation || content.summary
            }));
          }
        }
      } catch (err) {
        console.warn('API quiz generation fallback activated:', err);
      }
    }

    // 3. Fallback question pool generator without dummy placeholder text
    if (quizQuestions.length === 0) {
      const rawTakeaways = content.keyTakeaways && content.keyTakeaways.length > 0
        ? content.keyTakeaways
        : (content.summary ? content.summary.split('.').filter(s => s.trim().length > 10) : [`المفهوم الأساسي لمادة ${content.topic}`]);

      const pool = rawTakeaways.length > 0 ? rawTakeaways : [content.summary];

      const questionTemplates = [
        (t: string) => `ما هي الفكرة العلمية المحورية التي يُركّز عليها موضوع (${t})؟`,
        (t: string) => `أيٌّ من الخيارات التالية يُوضّح التطبيق أو الاستنتاج الأكاديمي الدقيق لـ (${t})؟`,
        (t: string) => `عند دراسة (${t}) في مادة ${content.topic}، ما القاعدة العلمية الأساسية المثبتة؟`,
        (t: string) => `ما هو التفسير العلمي الصحيح المعتمد في موضوع (${t})؟`,
        (t: string) => `أيّ القواعد والخاصيات التالية تُعدّ صحيحة ومباشرة بالنسبة لـ (${t})؟`
      ];

      quizQuestions = pool.map((targetPtRaw, idx) => {
        const targetPt = targetPtRaw.replace(/\*\*/g, '').trim();
        const otherPts = pool.filter((_, pIdx) => pIdx !== idx).map(p => p.replace(/\*\*/g, '').trim());

        let distractors: string[] = [];
        if (otherPts.length >= 3) {
          distractors = [otherPts[0], otherPts[1], otherPts[2]];
        } else if (otherPts.length === 2) {
          distractors = [otherPts[0], otherPts[1], `تأثير عكسي يتناقض مع مفاهيم ${content.topic}`];
        } else if (otherPts.length === 1) {
          distractors = [
            otherPts[0],
            `فرضية استثنائية تختلف عن معطيات ${content.title}`,
            `استنتاج خاطئ يتعارض مع القوانين الأساسية في ${content.topic}`
          ];
        } else {
          distractors = [
            `حالة استثنائية خارج نطاق ${content.title}`,
            `فرضية غير مثبتة في مادة ${content.topic}`,
            `استنتاج متضارب مع معطيات الدرس`
          ];
        }

        const allOptions = [targetPt, ...distractors];
        const correctIndex = idx % 4;
        const temp = allOptions[0];
        allOptions[0] = allOptions[correctIndex];
        allOptions[correctIndex] = temp;

        const questionFn = questionTemplates[idx % questionTemplates.length];
        const questionText = questionFn(content.title);

        return {
          id: `q_${Date.now()}_${idx}`,
          question: questionText,
          options: allOptions,
          correctAnswerIndex: correctIndex,
          explanation: `الإجابة الصحيحة تعتمد على الفكرة الجوهرية: "${targetPt}" في موضوع ${content.title}.`
        };
      });
    }

    const newQuiz: QuizItem = {
      id: `qz_${Date.now()}`,
      title: `كويز: ${content.title}`,
      subject: content.topic,
      chapter: content.chapter || '',
      contentId: content.id,
      timeLimitMinutes: quizQuestions.length >= 5 ? 10 : 5,
      questions: quizQuestions,
      attempts: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    setQuizzes((prev) => [newQuiz, ...prev]);
    await saveQuizItem(newQuiz);
    if (navigate) {
      setActiveView('quizzes');
    }
  };

  // Generate Summary From Content
  const handleGenerateSummaryFromContent = async (content: ContentItem, extractedData?: any, navigate: boolean = true) => {
    let flashcards: Flashcard[] = [];
    let sections: { heading: string; content: string }[] = [];
    let cheatSheet: string[] = [];

    if (extractedData) {
      if (Array.isArray(extractedData.sections) && extractedData.sections.length > 0) {
        sections = extractedData.sections;
      }
      if (Array.isArray(extractedData.cheatSheet) && extractedData.cheatSheet.length > 0) {
        cheatSheet = extractedData.cheatSheet;
      }
      if (Array.isArray(extractedData.suggestedFlashcards) && extractedData.suggestedFlashcards.length > 0) {
        flashcards = extractedData.suggestedFlashcards.map((fc: any, idx: number) => ({
          id: `fc_${Date.now()}_${idx}`,
          question: fc.question || `ما هو المفهوم الرئيسي في ${content.title}؟`,
          answer: fc.answer || content.summary,
          category: content.topic
        }));
      }
    }

    // Try calling summary API if no sections or flashcards extracted
    if (sections.length === 0 || flashcards.length === 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const response = await fetch('/api/summaries/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            topic: content.title,
            subject: content.topic,
            text: content.extractedText || content.summary,
            detailLevel: 'deep'
          })
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.summary) {
            if (Array.isArray(data.summary.sections) && data.summary.sections.length > 0) {
              sections = data.summary.sections;
            }
            if (Array.isArray(data.summary.cheatSheet) && data.summary.cheatSheet.length > 0) {
              cheatSheet = data.summary.cheatSheet;
            }
            if (Array.isArray(data.summary.flashcards) && data.summary.flashcards.length > 0) {
              flashcards = data.summary.flashcards.map((fc: any, idx: number) => ({
                id: `fc_${Date.now()}_${idx}`,
                question: fc.question,
                answer: fc.answer,
                category: fc.category || content.topic
              }));
            }
          }
        }
      } catch (err) {
        console.warn('API summary generation fallback activated:', err);
      }
    }

    // Fallbacks
    if (sections.length === 0) {
      sections = [
        {
          heading: `المحور الأول: المفاهيم والأسس الجوهرية في ${content.title}`,
          content: content.summary || 'ملخص شامل ومباشر لجميع المفاهيم الأكاديمية المطلوبة.'
        },
        {
          heading: 'المحور الثاني: النقاط المستفادة والتطبيقات الميدانية',
          content: (content.keyTakeaways || []).map(k => `• ${k}`).join('\n') || `تطبيقات واختبارات لتقييم استيعاب ${content.title}.`
        }
      ];
    }

    if (flashcards.length === 0) {
      flashcards = (content.keyTakeaways || []).map((point, idx) => ({
        id: `fc_${Date.now()}_${idx}`,
        question: `النقطة الأساسية ${idx + 1} في ${content.title}:`,
        answer: point,
        category: content.topic
      }));

      if (flashcards.length === 0) {
        flashcards = [
          {
            id: `fc_${Date.now()}`,
            question: `ما هي الخلاصة التنفيذية لـ ${content.title}؟`,
            answer: content.summary,
            category: content.topic
          }
        ];
      }
    }

    if (cheatSheet.length === 0) {
      cheatSheet = content.keyTakeaways && content.keyTakeaways.length > 0
        ? content.keyTakeaways
        : [`القاعدة الذهبية في ${content.title}`];
    }

    const newSummary: SummaryItem = {
      id: `sum_${Date.now()}`,
      title: `ملخص: ${content.title}`,
      subject: content.topic,
      chapter: content.chapter || '',
      contentId: content.id,
      summaryText: content.summary,
      sections,
      keyPoints: content.keyTakeaways && content.keyTakeaways.length > 0 ? content.keyTakeaways : [content.summary],
      flashcards,
      cheatSheet,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setSummaries((prev) => [newSummary, ...prev]);
    await saveSummaryItem(newSummary);
    if (navigate) {
      setActiveView('summaries');
    }
  };

  // Quiz Score Update
  const handleUpdateQuizAttempt = async (quizId: string, score: number, total: number, timeSpent: number) => {
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    if (targetQuiz) {
      const newAttempt = {
        id: `att_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        score,
        totalQuestions: total,
        timeSpentSeconds: timeSpent,
        percentage: Math.round((score / total) * 100)
      };
      const updatedQuiz = { ...targetQuiz, attempts: [...targetQuiz.attempts, newAttempt] };
      setQuizzes((prev) => prev.map((q) => (q.id === quizId ? updatedQuiz : q)));
      await saveQuizItem(updatedQuiz);
    }

    // Award points
    const newPoints = user.points + score * 50;
    const updatedUser = { ...user, points: newPoints };
    setUser(updatedUser);
    await saveUserProfile(updatedUser);
  };

  // Test Attempt Update
  const handleUpdateTestAttempt = async (testId: string, score: number, total: number, passed: boolean) => {
    const targetTest = customTests.find((t) => t.id === testId);
    if (targetTest) {
      const newAttempt = {
        id: `tat_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        score,
        total,
        passed
      };
      const updatedTest = { ...targetTest, attempts: [...(targetTest as any).attempts || [], newAttempt] };
      setCustomTests((prev) => prev.map((t) => (t.id === testId ? updatedTest : t)));
      await saveCustomTestItem(updatedTest);
    }

    const newPoints = user.points + (passed ? 100 : 30);
    const updatedUser = { ...user, points: newPoints };
    setUser(updatedUser);
    await saveUserProfile(updatedUser);
  };

  // General AI Chat Message Send
  const handleSendChatMessage = async (text: string, attachment?: ChatAttachment) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: text || (attachment?.type === 'audio' ? 'تسجيل صوتي مرفق' : 'صورة مرفقة'),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      attachment
    };

    setChatMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          history: chatMessages,
          studyContext: contentItems,
          fileData: attachment?.base64 && attachment?.mimeType ? {
            base64: attachment.base64,
            mimeType: attachment.mimeType,
            type: attachment.type
          } : null
        })
      });

      let data: any = null;
      try {
        const text = await response.text();
        data = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse chat ask response JSON:', err);
      }
      const replyText = data && data.success && data.answer ? data.answer : 'عذراً، لم أتمكن من إجابة استفسارك حالياً.';

      const assistantMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: 'تعذر الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من الاتصال بالإنترنت والتحقق من المفتاح.',
        timestamp: 'الآن'
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    }
  };

  // View title translation
  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'لوحة التحكم والمتابعة الرئيسية';
      case 'content':
        return 'قسم المحتوى والمستخلص الذكي';
      case 'summaries':
        return 'قسم الملخصات والبطاقات التفاعلية';
      case 'quizzes':
        return 'قسم الكويزات التفاعلية المولدة';
      case 'tests':
        return 'قسم الاختبارات المخصصة للطالب';
      case 'study':
        return 'جدول المذاكرة ومؤقت التركيز';
      case 'chat':
        return 'المساعد الأكاديمي الذكي Gemini';
      default:
        return 'منصة نجم';
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Background Soft Glowing Gradient Blobs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full glow-blob-1 pointer-events-none -z-10 blur-3xl opacity-70" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] rounded-full glow-blob-2 pointer-events-none -z-10 blur-3xl opacity-60" />

      {/* Main Sticky Header */}
      <Header
        user={user}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeViewTitle={getViewTitle()}
      />

      {/* Main Body Container */}
      <main className="max-w-7xl mx-auto px-4 pt-4">
        {activeView === 'dashboard' && (
          <DashboardView
            user={user}
            tasks={tasks}
            contentItems={contentItems}
            quizzes={quizzes}
            summaries={summaries}
            customTests={customTests}
            onNavigate={(v) => setActiveView(v)}
            onToggleTask={handleToggleTask}
          />
        )}

        {activeView === 'content' && (
          <ContentHubView
            items={contentItems}
            onAddContent={handleAddContent}
            onUpdateContent={handleUpdateContent}
            onDeleteContent={handleDeleteContent}
            onGenerateQuizFromContent={handleGenerateQuizFromContent}
            onGenerateSummaryFromContent={handleGenerateSummaryFromContent}
            onNavigateView={(v) => setActiveView(v)}
          />
        )}

        {activeView === 'summaries' && (
          <SummariesView
            summaries={summaries}
            contentItems={contentItems}
            onAddSummary={async (s) => {
              setSummaries((prev) => [s, ...prev]);
              await saveSummaryItem(s);
            }}
            onUpdateSummary={handleUpdateSummary}
            onDeleteSummary={handleDeleteSummary}
          />
        )}

        {activeView === 'quizzes' && (
          <QuizzesView
            quizzes={quizzes}
            contentItems={contentItems}
            onAddQuiz={async (q) => {
              setQuizzes((prev) => [q, ...prev]);
              await saveQuizItem(q);
            }}
            onUpdateQuiz={handleUpdateQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onUpdateQuizAttempt={handleUpdateQuizAttempt}
          />
        )}

        {activeView === 'tests' && (
          <CustomTestsView
            customTests={customTests}
            onAddCustomTest={async (t) => {
              setCustomTests((prev) => [t, ...prev]);
              await saveCustomTestItem(t);
            }}
            onUpdateCustomTest={handleUpdateCustomTest}
            onDeleteTest={handleDeleteCustomTest}
            onUpdateTestAttempt={handleUpdateTestAttempt}
          />
        )}

        {activeView === 'study' && (
          <StudyPlannerView
            tasks={tasks}
            onAddTask={async (t) => {
              setTasks((prev) => [t, ...prev]);
              await saveTaskItem(t);
            }}
            onToggleTask={handleToggleTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={async (id) => {
              setTasks((prev) => prev.filter((t) => t.id !== id));
              await deleteTaskItemDoc(id);
            }}
          />
        )}

        {activeView === 'chat' && (
          <GeneralAiChatView
            messages={chatMessages}
            contentItems={contentItems}
            onSendMessage={handleSendChatMessage}
            onClearHistory={() => setChatMessages([])}
          />
        )}
      </main>

      {/* iOS Dynamic Bottom Navigation Island */}
      <Navigation
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        pendingTasksCount={tasks.filter((t) => !t.completed).length}
      />

      {/* Google Auth & User Profile Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        allUsers={allUsers}
        onLoginWithGoogle={handleLoginWithGoogle}
        onGooglePopupAuth={handleGooglePopupAuth}
        onLoginWithEmail={handleLoginWithEmail}
        onRegisterNewUser={handleRegisterNewUser}
        onSwitchUser={handleSwitchUser}
        onDeleteUser={handleDeleteUser}
        onLogout={handleLogout}
      />

    </div>
  );
}
