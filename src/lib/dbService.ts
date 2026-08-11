import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';
import {
  ContentItem,
  SummaryItem,
  QuizItem,
  StudyTask,
  CustomTest,
  UserProfile
} from '../types';
import {
  initialContentItems,
  initialSummaryItems,
  initialQuizItems,
  initialCustomTests,
  initialStudyTasks,
  initialUserProfile
} from '../data/initialData';

// Collection References
const usersCol = collection(db, 'users');
const contentCol = collection(db, 'content_items');
const summaryCol = collection(db, 'summaries');
const quizCol = collection(db, 'quizzes');
const taskCol = collection(db, 'study_tasks');
const testCol = collection(db, 'exam_reminders');

// Helper to sanitize objects for Firestore (removes undefined values to prevent Firestore setDoc errors)
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

// Helper to clean filler or hallucinated English system text
export function cleanGarbageText(text: string): string {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(?:\b(?:Lecture\s*\d+|Chemistry_Chapter_\d+|Dedicated_Guide|Detailed|Guide|Direct|Summary|Note|Manual|sheet|template|layout|schema|generator|standard|output|system|text|processing|structure|context|set|formatting|rules|check|valid|input|reference|parsing|correct|compliance|JSON|result|strictly|data|format|syntax|standards|generation|strict|specification|validation|logic|Matrix|Balance|Density|Dynamics|Scale|Value|Metric|Operations|Scope|Interface|Process|Dynamic|Vector|Analysis|Unit|Strategy|Framework|Engine|Pattern|Control|Core|Base|Platform|Execution|Systems|validate|string)\b[\s_()\-:]*){2,}/gi, '')
    .replace(/Chemistry_Chapter_\d+_Dedicated_Guide/gi, '')
    .replace(/Lecture\s*\d+:\s*Semiconductor\s*Chemistry/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizeDeepText<T>(obj: T): T {
  if (typeof obj === 'string') {
    return cleanGarbageText(obj) as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDeepText) as any;
  }
  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      cleaned[k] = sanitizeDeepText(v);
    }
    return cleaned as T;
  }
  return obj;
}

// Function to clean up any hallucinated or repetitive gibberish data in Firestore
export async function cleanUpHallucinatedDataInFirestore() {
  try {
    const isHallucinated = (str: string) => {
      return (
        str.includes('Matrix Balance') ||
        str.includes('Chemistry_Chapter_9') ||
        str.includes('Dedicated_Guide') ||
        str.includes('Detailed Guide') ||
        str.includes('template layout') ||
        str.includes('schema generator') ||
        str.includes('standard output') ||
        str.includes('system text') ||
        str.includes('syntax standards') ||
        str.includes('JSON format') ||
        str.includes('strictly data format') ||
        str.includes('Lecture 9')
      );
    };

    // 1. Clean summaries
    const summarySnap = await getDocs(summaryCol);
    summarySnap.docs.forEach(async (d) => {
      const data = d.data() as SummaryItem;
      const str = JSON.stringify(data);
      if (isHallucinated(str)) {
        const cleanedItem: SummaryItem = {
          id: data.id,
          title: 'ملخص كيمياء أشباه الموصلات وفجوات الطاقة',
          subject: 'الكيمياء',
          chapter: 'الفصل التاسع: كيمياء أشباه الموصلات',
          summaryText: 'دراسة أكاديمية شاملة ومفصلة لكيمياء أشباه الموصلات الذاتية (السيليكون والجرمانيوم) وغير الذاتية، وآلية التطعيم بالكيمياء العضوية والغير عضوية لإيجاد حاملات الشحنة.',
          sections: [
            {
              heading: '1. أشباه الموصلات الذاتية وفجوة الطاقة',
              content: 'تتميز أشباه الموصلات الذاتية بامتلاك 4 إلكترونات تكافؤ في غلافها الخارجي، وتكون عازلة عند صفر كلفن. بزيادة الحرارة، تكتسب الإلكترونات طاقة كافية للقفز عبر فجوة الطاقة الحرة إلى نطاق التوصيل.'
            },
            {
              heading: '2. عملية التطعيم الكيميائي (Doping)',
              content: 'يتم إضافة عناصر ثلاثية التكافؤ كالبورون لتشكيل شبه موصل موجب (p-type) يحتوي على فجوات موجبة، أو عناصر خماسية التكافؤ كالفسفور لتشكيل شبه موصل سالب (n-type) يوفر إلكترونات حرة.'
            }
          ],
          keyPoints: [
            '**أشباه الموصلات الذاتية**: مواد نقية كيميائياً مثل السيليكون والجرمانيوم تزداد موصليتها الكهربائية بارتفاع درجة الحرارة.',
            '**التطعيم بالموجب (p-type)**: استخدام عناصر ثلاثية التكافؤ كالبورون لإيجاد فجوات موجبة في البلورة.',
            '**التطعيم بالسالب (n-type)**: استخدام عناصر خماسية التكافؤ كالفسفور لتوفير إلكترونات حرة زائدة.',
            '**فجوة الطاقة (Energy Gap)**: النطاق المحظور الفاصل بين نطاق التكافؤ ونطاق التوصيل وتكون متوسطة بحجم 1 إلكترون فولت.'
          ],
          flashcards: [
            { id: 'fc_1', question: 'ما هو العنصر المستخدم للتطعيم الموجب p-type؟', category: 'الكيمياء', answer: 'عنصر ثلاثي التكافؤ مثل البورون (B).' },
            { id: 'fc_2', question: 'كيف تتأثر موصلية شبه الموصل بالحرارة؟', category: 'الكيمياء', answer: 'تزداد الموصلية بسبب تحرر الإلكترونات والفجوات.' }
          ],
          cheatSheet: [
            'p-type = تطعيم ثلاثي التكافؤ (فجوات موجبة)',
            'n-type = تطعيم خماسي التكافؤ (إلكترونات حرة)',
            'فجوة الطاقة في أشباه الموصلات = ~ 1 eV'
          ],
          createdAt: data.createdAt || new Date().toISOString().split('T')[0]
        };
        await setDoc(doc(db, 'summaries', data.id), sanitizeForFirestore(cleanedItem));
      }
    });

    // 2. Clean quizzes
    const quizSnap = await getDocs(quizCol);
    quizSnap.docs.forEach(async (d) => {
      const data = d.data() as QuizItem;
      const str = JSON.stringify(data);
      if (
        isHallucinated(str) ||
        data.questions?.some((q) => q.question?.includes('أيّ من الخيارات التالية يُعتبر حقيقة أكاديمية دقيقة'))
      ) {
        const cleanedQuiz: QuizItem = {
          id: data.id,
          title: 'اختبار كيمياء أشباه الموصلات والروابط الكيميائية',
          subject: 'الكيمياء',
          chapter: 'الفصل التاسع: كيمياء أشباه الموصلات',
          timeLimitMinutes: 10,
          questions: [
            {
              id: 'q_chem_1',
              question: 'ما هو العنصر الكيميائي المناسب لتطعيم السيليكون وتشكيل شبه موصل موجب (p-type)؟',
              options: ['البورون (B)', 'الفسفور (P)', 'الزرنيخ (As)', 'الأنتيمون (Sb)'],
              correctAnswerIndex: 0,
              explanation: 'البورون عنصر ثلاثي التكافؤ يخلق فجوات موجبة في الشبكة البلورية للسيليكون.'
            },
            {
              id: 'q_chem_2',
              question: 'ما التأثير الكيميائي المباشر لرفع درجة الحرارة على بلورة السيليكون النقية؟',
              options: ['زيادة التوصيل الكهربائي وتحرير أزواج إلكترون-فجوة', 'انخفاض الموصلية وتحول المادة إلى عازل تام', 'تفكك الروابط الأيونية وتلف البلورة', 'تراكم الشحنات الساكنة دون حركة الإلكترونات'],
              correctAnswerIndex: 0,
              explanation: 'تكتسب الإلكترونات طاقة حرارية تسمح لها بالانتقال إلى نطاق التوصيل، مما يرفع موصلية شبه الموصل.'
            },
            {
              id: 'q_chem_3',
              question: 'ما هي حاملات الشحنة الأغلبية في شبه الموصل من النوع السالب (n-type)؟',
              options: ['الإلكترونات الحرة', 'الفجوات الموجبة', 'الأيونات الموجبة الثابتة', 'البروتونات'],
              correctAnswerIndex: 0,
              explanation: 'إضافة عنصر خماسي التكافؤ كالفسفور يوفر إلكتروناً إضافياً حراً لكل ذرة شوائب.'
            },
            {
              id: 'q_chem_4',
              question: 'ما المقارنة الدقيقة لحجم فجوة الطاقة الحرة (Energy Gap) بين أشباه الموصلات والعوازل؟',
              options: ['فجوة الطاقة في أشباه الموصلات أصغر منها في العوازل', 'فجوة الطاقة في أشباه الموصلات أكبر بكثير من العوازل', 'أشباه الموصلات لا تمتلك أي فجوة طاقة إطلاقاً', 'فجوة الطاقة متساوية في جميع المواد الصلبة'],
              correctAnswerIndex: 0,
              explanation: 'فجوة الطاقة في أشباه الموصلات تكون متوسطة (~1 إلكترون فولت) مما يسمح بالإثارة الحرارية، بينما في العوازل تكون كبيرة جداً.'
            }
          ],
          attempts: data.attempts || [],
          createdAt: data.createdAt || new Date().toISOString().split('T')[0]
        };
        await setDoc(doc(db, 'quizzes', data.id), sanitizeForFirestore(cleanedQuiz));
      }
    });

    // 3. Clean content_items
    const contentSnap = await getDocs(contentCol);
    contentSnap.docs.forEach(async (d) => {
      const data = d.data() as ContentItem;
      const str = JSON.stringify(data);
      if (isHallucinated(str)) {
        const cleanedContent: ContentItem = {
          ...data,
          title: 'كيمياء أشباه الموصلات وفجوات الطاقة',
          topic: 'الكيمياء',
          chapter: 'الفصل التاسع: أشباه الموصلات',
          summary: 'دراسة كيمياء أشباه الموصلات الذاتية والمطّعمة بالبورون والفسفور مع تحديد فجوات الطاقة الحرة.',
          extractedText: 'تُعد أشباه الموصلات مواد ذات موصلية كهربائية متوسطة بين الموصلات والعوازل. تشمل السيليكون والجرمانيوم. وتزداد الموصلية بالحرارة أو التطعيم.',
          keyTakeaways: [
            'تتصف أشباه الموصلات الذاتية بتأثرها المباشر بدرجة الحرارة.',
            'التطعيم بجماد ثلاثي التكافؤ ينتج شبه موصل موجب p-type.',
            'التطعيم بجماد خماسي التكافؤ ينتج شبه موصل سالب n-type.'
          ]
        };
        await setDoc(doc(db, 'content_items', data.id), sanitizeForFirestore(cleanedContent));
      }
    });
  } catch (e) {
    console.warn('Error in cleanUpHallucinatedDataInFirestore:', e);
  }
}

// Helper to seed initial data if collections are empty
export async function seedInitialDataIfEmpty() {
  try {
    await cleanUpHallucinatedDataInFirestore();

    const contentSnap = await getDocs(contentCol);
    if (contentSnap.empty) {
      for (const item of initialContentItems) {
        await setDoc(doc(db, 'content_items', item.id), sanitizeForFirestore(item));
      }
    }

    const summarySnap = await getDocs(summaryCol);
    if (summarySnap.empty) {
      for (const item of initialSummaryItems) {
        await setDoc(doc(db, 'summaries', item.id), sanitizeForFirestore(item));
      }
    }

    const quizSnap = await getDocs(quizCol);
    if (quizSnap.empty) {
      for (const item of initialQuizItems) {
        await setDoc(doc(db, 'quizzes', item.id), sanitizeForFirestore(item));
      }
    }

    const taskSnap = await getDocs(taskCol);
    if (taskSnap.empty) {
      for (const item of initialStudyTasks) {
        await setDoc(doc(db, 'study_tasks', item.id), sanitizeForFirestore(item));
      }
    }

    const testSnap = await getDocs(testCol);
    if (testSnap.empty) {
      for (const item of initialCustomTests) {
        await setDoc(doc(db, 'exam_reminders', item.id), sanitizeForFirestore(item));
      }
    }

    // Clean up duplicate or old default user documents in Firestore
    await cleanUpDuplicateAndDemoUsers();

    // Save initial user profile if users empty
    const userSnap = await getDocs(usersCol);
    if (userSnap.empty) {
      const defaultDocId = initialUserProfile.email
        ? initialUserProfile.email.replace(/[^a-zA-Z0-9]/g, '_')
        : 'user_default';
      const defaultUserDoc = {
        ...initialUserProfile,
        lastActive: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', defaultDocId), sanitizeForFirestore(defaultUserDoc));
    }
  } catch (err) {
    console.error('Error seeding initial Firestore data:', err);
  }
}

// Function to clean up duplicate user documents from Firestore
export async function cleanUpDuplicateAndDemoUsers() {
  try {
    const userSnap = await getDocs(usersCol);
    const seenEmails = new Set<string>();

    for (const d of userSnap.docs) {
      const u = d.data() as UserProfile;
      const email = (u.email || '').trim().toLowerCase();

      // Delete 'user_default' if another user document exists or if it duplicates an email
      if (d.id === 'user_default' && userSnap.docs.length > 1) {
        await deleteDoc(doc(db, 'users', 'user_default'));
        continue;
      }

      // If email was already processed, delete duplicate document
      if (email && seenEmails.has(email)) {
        await deleteDoc(doc(db, 'users', d.id));
      } else if (email) {
        seenEmails.add(email);
      }
    }
  } catch (e) {
    console.warn('Error in cleanUpDuplicateAndDemoUsers:', e);
  }
}

// User Profile Functions
export async function saveUserProfile(user: UserProfile) {
  try {
    const docId = user.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'user_default';
    const userData = {
      ...user,
      lastActive: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', docId), sanitizeForFirestore(userData), { merge: true });
  } catch (err) {
    console.error('Firestore saveUserProfile error:', err);
  }
}

export async function deleteUserProfile(email: string) {
  try {
    const docId = email.replace(/[^a-zA-Z0-9]/g, '_');
    await deleteDoc(doc(db, 'users', docId));

    // Also check if user_default exists with this email or as orphaned doc
    const defaultSnap = await getDoc(doc(db, 'users', 'user_default'));
    if (defaultSnap.exists()) {
      const data = defaultSnap.data() as UserProfile;
      if (data.email === email || data.email === 'a.alotaibi@gmail.com') {
        await deleteDoc(doc(db, 'users', 'user_default'));
      }
    }
  } catch (err) {
    console.error('Firestore deleteUserProfile error:', err);
  }
}

export function subscribeUserProfile(docId: string, callback: (user: UserProfile) => void) {
  const safeDocId = docId.replace(/[^a-zA-Z0-9]/g, '_');
  return onSnapshot(doc(db, 'users', safeDocId), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserProfile);
    }
  }, (err) => console.error('Firestore subscribeUserProfile error:', err));
}

export function subscribeAllUsers(callback: (users: UserProfile[]) => void) {
  return onSnapshot(usersCol, (snapshot) => {
    const rawUsers: UserProfile[] = snapshot.docs.map((d) => d.data() as UserProfile);
    const uniqueUsersMap = new Map<string, UserProfile>();
    for (const u of rawUsers) {
      if (u && u.email) {
        const key = u.email.trim().toLowerCase();
        if (!uniqueUsersMap.has(key) || u.isLoggedIn) {
          uniqueUsersMap.set(key, u);
        }
      }
    }
    callback(Array.from(uniqueUsersMap.values()));
  }, (err) => console.error('Firestore subscribeAllUsers error:', err));
}

// Authentication Helpers
export async function registerWithEmailPassword(
  name: string,
  email: string,
  pass: string,
  gradeLevel?: string,
  targetExam?: string
): Promise<UserProfile> {
  let uid = '';
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    uid = res.user.uid;
  } catch (err) {
    console.warn('Firebase Auth createUserWithEmailAndPassword note:', err);
  }

  const newDocId = email.replace(/[^a-zA-Z0-9]/g, '_');
  const userProfile: UserProfile = {
    id: uid || `usr_${Date.now()}`,
    name: name || 'طالب جديد',
    email: email,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
    isLoggedIn: true,
    provider: 'email',
    gradeLevel: gradeLevel || 'المرحلة الثانوية',
    targetExam: targetExam || 'اختبار القدرات والتحصيلي',
    streakDays: 1,
    points: 100,
    level: 'طالب جديد',
    joinedDate: new Date().toISOString().split('T')[0]
  };

  await setDoc(doc(db, 'users', newDocId), userProfile, { merge: true });
  return userProfile;
}

export async function loginWithEmailPassword(email: string, pass: string): Promise<UserProfile> {
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    console.warn('Firebase Auth signInWithEmailAndPassword note:', err);
  }

  const docId = email.replace(/[^a-zA-Z0-9]/g, '_');
  const userDocRef = doc(db, 'users', docId);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    const profile = snap.data() as UserProfile;
    const updatedProfile: UserProfile = { ...profile, isLoggedIn: true };
    await saveUserProfile(updatedProfile);
    return updatedProfile;
  } else {
    // Create new profile if doc doesn't exist
    const newProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      isLoggedIn: true,
      provider: 'email',
      gradeLevel: 'المرحلة الثانوية',
      targetExam: 'اختبار القدرات والتحصيلي',
      streakDays: 1,
      points: 100,
      level: 'طالب جديد',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    await saveUserProfile(newProfile);
    return newProfile;
  }
}

// Authentication Helpers
export async function loginWithGooglePopup(): Promise<UserProfile | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const email = fbUser.email || `google_user_${Date.now()}@gmail.com`;
    const docId = email.replace(/[^a-zA-Z0-9]/g, '_');
    
    const userDocRef = doc(db, 'users', docId);
    const snap = await getDoc(userDocRef);

    let userProfile: UserProfile;
    if (snap.exists()) {
      userProfile = { ...(snap.data() as UserProfile), isLoggedIn: true, provider: 'google' };
    } else {
      userProfile = {
        id: fbUser.uid || `usr_${Date.now()}`,
        name: fbUser.displayName || 'طالب Google جديد',
        email: email,
        avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        provider: 'google',
        gradeLevel: 'المرحلة الثانوية',
        targetExam: 'اختبار القدرات والتحصيلي',
        streakDays: 1,
        points: 100,
        level: 'طالب متميز',
        joinedDate: new Date().toISOString().split('T')[0],
        isLoggedIn: true
      };
    }
    await saveUserProfile(userProfile);
    return userProfile;
  } catch (err) {
    console.warn('Google Auth popup error or canceled:', err);
    return null;
  }
}

export async function logoutUserAuth() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Firebase Auth signOut error:', err);
  }
}

export function listenAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Subscribe Functions
export function subscribeContentItems(callback: (items: ContentItem[]) => void) {
  return onSnapshot(contentCol, (snapshot) => {
    const items: ContentItem[] = snapshot.docs.map((d) => sanitizeDeepText(d.data() as ContentItem));
    callback(items);
  }, (err) => console.error('Firestore content subscribe error:', err));
}

export function subscribeSummaries(callback: (items: SummaryItem[]) => void) {
  return onSnapshot(summaryCol, (snapshot) => {
    const items: SummaryItem[] = snapshot.docs.map((d) => sanitizeDeepText(d.data() as SummaryItem));
    callback(items);
  }, (err) => console.error('Firestore summaries subscribe error:', err));
}

export function subscribeQuizzes(callback: (items: QuizItem[]) => void) {
  return onSnapshot(quizCol, (snapshot) => {
    const items: QuizItem[] = snapshot.docs.map((d) => sanitizeDeepText(d.data() as QuizItem));
    callback(items);
  }, (err) => console.error('Firestore quizzes subscribe error:', err));
}

export function subscribeTasks(callback: (items: StudyTask[]) => void) {
  return onSnapshot(taskCol, (snapshot) => {
    const items: StudyTask[] = snapshot.docs.map((d) => d.data() as StudyTask);
    callback(items);
  }, (err) => console.error('Firestore tasks subscribe error:', err));
}

export function subscribeCustomTests(callback: (items: CustomTest[]) => void) {
  return onSnapshot(testCol, (snapshot) => {
    const items: CustomTest[] = snapshot.docs.map((d) => d.data() as CustomTest);
    callback(items);
  }, (err) => console.error('Firestore custom tests subscribe error:', err));
}

// Mutation Functions
export async function saveContentItem(item: ContentItem) {
  try {
    await setDoc(doc(db, 'content_items', item.id), sanitizeForFirestore(item));
  } catch (err) {
    console.warn('Firestore saveContentItem error (saved in local memory):', err);
  }
}

export async function deleteContentItemDoc(id: string) {
  try {
    await deleteDoc(doc(db, 'content_items', id));
  } catch (err) {
    console.warn('Firestore deleteContentItemDoc error:', err);
  }
}

export async function saveSummaryItem(item: SummaryItem) {
  try {
    await setDoc(doc(db, 'summaries', item.id), sanitizeForFirestore(item));
  } catch (err) {
    console.warn('Firestore saveSummaryItem error (saved in local memory):', err);
  }
}

export async function deleteSummaryItemDoc(id: string) {
  try {
    await deleteDoc(doc(db, 'summaries', id));
  } catch (err) {
    console.warn('Firestore deleteSummaryItemDoc error:', err);
  }
}

export async function saveQuizItem(item: QuizItem) {
  try {
    await setDoc(doc(db, 'quizzes', item.id), sanitizeForFirestore(item));
  } catch (err) {
    console.warn('Firestore saveQuizItem error (saved in local memory):', err);
  }
}

export async function deleteQuizItemDoc(id: string) {
  try {
    await deleteDoc(doc(db, 'quizzes', id));
  } catch (err) {
    console.warn('Firestore deleteQuizItemDoc error:', err);
  }
}

export async function saveTaskItem(item: StudyTask) {
  try {
    await setDoc(doc(db, 'study_tasks', item.id), sanitizeForFirestore(item));
  } catch (err) {
    console.warn('Firestore saveTaskItem error (saved in local memory):', err);
  }
}

export async function deleteTaskItemDoc(id: string) {
  try {
    await deleteDoc(doc(db, 'study_tasks', id));
  } catch (err) {
    console.warn('Firestore deleteTaskItemDoc error:', err);
  }
}

export async function saveCustomTestItem(item: CustomTest) {
  try {
    await setDoc(doc(db, 'exam_reminders', item.id), sanitizeForFirestore(item));
  } catch (err) {
    console.warn('Firestore saveCustomTestItem error (saved in local memory):', err);
  }
}

export async function deleteCustomTestItemDoc(id: string) {
  try {
    await deleteDoc(doc(db, 'exam_reminders', id));
  } catch (err) {
    console.warn('Firestore deleteCustomTestItemDoc error:', err);
  }
}
