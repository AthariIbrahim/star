# 🌟 NAAJM - Your Smart Academic Guide | نجم: مرشدك الدراسي الذكي

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini AI](https://img.shields.io/badge/Powered_by-Gemini_AI-8E75FF?style=for-the-badge)

**NAAJM (نجم)** هو منصة ومرشد دراسي ذكي يعتمد على الذكاء الاصطناعي لمساعدة الطلاب في تنظيم حياتهم الأكاديمية. يقدم المنصة خططاً دراسية متكاملة ومخصصة لكل طالب، بالإضافة إلى توليد ملخصات سريعة للمناهج والمذكرات بأسلوب عصري وتفاعلي.

---

## 📌 المميزات الرئيسية (Features)

* 📅 **خطط مذاكرة متكاملة:** يسمح بإنشاء خطط  دراسية مخصصة تناسب مستوى الطالب وأهدافه.
* 📝 **توليد ملخصات ذكية:** استخراج وتلخيص أهم النقاط من المناهج الدراسية وملفات PDF بسرعة ودقة.
* 📄 **معالجة المستندات:** رفع قراءة المذكرات والكتب المنهجية وتحليلها بواسطة الذكاء الاصطناعي.
* ⚡ **واجهة تفاعلية وسريعة:** تصميم مدروس ومريح للعين يضمن تجربة مستخدم سلسة أثناء الاستذكار.
* ☁️ **مزامنة وحفظ سحابي:** حفظ الخطط، الملخصات، والملاحظات فورياً وبأمان عبر Firebase.

---

## 🛠️ التكنولوجيا المستخدمة (Tech Stack)

### 1. لغات البرمجة والواجهة (Core Languages)
* **TypeScript (TSX / TS):** لبناء المكونات، المنطق البرمجي، والربط مع Gemini API بمرونة وأمان عالي.
* **HTML5 & CSS3:** مع إطار **Tailwind CSS** لتنسيق الواجهات والاستجابة لجميع الشاشات.
* **JSON:** لملفات الإعدادات والتهيئات (`package.json`, Firestore Rules).

### 2. أطر العمل والمكتبات (Frameworks & Libraries)
* **React 18:** إطار العمل الرئيسي لبناء واجهات المستخدم التفاعلية.
* **Vite:** أداة البناء والتطوير السريعة.
* **Lucide React:** لمجموعة أيقونات حديثة وتفاعلية.
* **PDF.js / PDFExtract:** لقراءة وتحليل ملفات الـ PDF والكتب الدراسية.
* **Firebase (Firestore & Auth):** لإدارة حسابات الطلاب وحفظ الخطط والبيانات السحابية بالمزامنة الفورية.

---




# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio:

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
