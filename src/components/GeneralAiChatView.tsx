import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatAttachment, ContentItem } from '../types';
import {
  Sparkles,
  Send,
  Volume2,
  Copy,
  Check,
  Trash2,
  MessageSquare,
  Image as ImageIcon,
  Mic,
  Square,
  Paperclip,
  X,
  FileAudio,
  BookOpen
} from 'lucide-react';

interface GeneralAiChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, attachment?: ChatAttachment) => Promise<void>;
  onClearHistory: () => void;
  contentItems?: ContentItem[];
}

export const GeneralAiChatView: React.FC<GeneralAiChatViewProps> = ({
  messages,
  onSendMessage,
  onClearHistory,
  contentItems = []
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Attachment & Voice state
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptChips = [
    'اشرح لي هذه الصورة المرفقة واستخرج المفاهيم الرئيسية',
    'حل المسألة الظاهرة في الصورة خطوة بخطوة',
    'قم بتفريغ الملاحظات الصوتية وتلخيص نقاطها الأساسية',
    'ما أفضل استراتيجية لمراجعة مادة الكيمياء قبل الاختبارات؟'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Handle File Selection (Image, Audio, Document, PDF)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileTypeHint?: 'image' | 'audio' | 'document') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const fileNameLower = file.name.toLowerCase();
      const mime = (file.type || '').toLowerCase();

      let detectedType: 'image' | 'audio' | 'document' = fileTypeHint || 'document';
      if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some(ext => fileNameLower.endsWith(ext))) {
        detectedType = 'image';
      } else if (mime.startsWith('audio/') || ['.mp3', '.m4a', '.wav', '.aac', '.ogg'].some(ext => fileNameLower.endsWith(ext))) {
        detectedType = 'audio';
      } else {
        detectedType = 'document';
      }

      const isText = mime.startsWith('text/') || ['.txt', '.md', '.csv', '.json', '.js', '.ts', '.py', '.html'].some(ext => fileNameLower.endsWith(ext));

      if (isText) {
        const textReader = new FileReader();
        textReader.onload = () => {
          const textContent = (textReader.result as string) || '';
          const base64 = btoa(unescape(encodeURIComponent(textContent)));
          setAttachment({
            type: 'document',
            url: '',
            name: file.name,
            mimeType: 'text/plain',
            base64
          });
        };
        textReader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.includes(',') ? result.split(',')[1] : result;

          setAttachment({
            type: detectedType,
            url: (detectedType === 'image' || detectedType === 'audio') ? url : '',
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Live Audio Recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];

          setAttachment({
            type: 'audio',
            url: audioUrl,
            name: `تسجيل صوتي (${recordingSeconds} ثانية)`,
            mimeType: 'audio/webm',
            base64
          });
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone permission denied or error:', error);
      alert('تعذر الوصول إلى الميكروفون. يرجى التاكد من إعطاء إذن التسجيل في المتصفح.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if ((!text.trim() && !attachment) || isSending) return;

    const currentAttachment = attachment;
    setInputText('');
    setAttachment(null);
    setIsSending(true);

    try {
      await onSendMessage(text, currentAttachment || undefined);
    } catch (error) {
      console.error('Failed to send chat message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Text-To-Speech
  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('ميزة القراءة الصوتية غير مدعومة في متصفحك الحالي');
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>المساعد الذكي (استقبال الصوت والصورة والنص)</span>
          </h2>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-300 mt-1">
            مساعدك الأكاديمي الشامل: يمكنك الكتابة، إرفاق صور المسائل والملاحظات، أو تسجيل واستبدال مقاطع صوتية
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearHistory}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-rose-500 transition-colors"
            title="مسح سجل المحادثة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preset Prompt Chips */}
      <div className="space-y-2">
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          أسئلة واقتراحات سريعة:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {promptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={isSending}
              className="px-3.5 py-2 rounded-2xl glass-panel text-xs font-bold text-indigo-800 dark:text-indigo-300 hover:bg-indigo-500/10 transition-all border border-indigo-200 dark:border-indigo-800 shrink-0 text-right"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="glass-panel p-6 rounded-3xl min-h-[420px] max-h-[550px] overflow-y-auto space-y-4 border border-slate-200 dark:border-slate-800 shadow-md">
        
        {messages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              أهلاً بك! كيف يمكنني مساعدتك في دراستك اليوم؟
            </h3>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              يمكنك كتابة أي سؤال، إرفاق صورة كتاب أو مسألة رياضية، أو استخدام ميكروفون التسجيل الصوتي لتحليل المحتوى بالذكاء الاصطناعي.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isAssistant = msg.sender === 'assistant';

            return (
              <div
                key={msg.id ? `${msg.id}_${idx}` : `msg_${idx}`}
                className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} space-y-1.5`}
              >
                <div
                  className={`p-4 rounded-3xl max-w-2xl text-xs leading-relaxed space-y-2 shadow-sm ${
                    isAssistant
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tr-none font-medium'
                      : 'bg-indigo-600 text-white rounded-tl-none font-bold'
                  }`}
                >
                  {/* Render Message Attachment if exists */}
                  {msg.attachment && (
                    <div className="mb-2">
                      {msg.attachment.type === 'image' ? (
                        <div className="rounded-2xl overflow-hidden border border-white/20 max-w-sm">
                          <img
                            src={msg.attachment.url}
                            alt="مرفق بصري"
                            className="w-full max-h-60 object-contain bg-black/20"
                          />
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-black/20 border border-white/20 flex items-center gap-3">
                          <FileAudio className="w-6 h-6 text-amber-300 shrink-0" />
                          <div className="flex-1 overflow-hidden">
                            <span className="text-[11px] font-bold block truncate">
                              {msg.attachment.name || 'تسجيل صوتي'}
                            </span>
                            <audio src={msg.attachment.url} controls className="w-full h-8 mt-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Assistant Actions */}
                  {isAssistant && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="استماع للنص"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>استماع</span>
                      </button>

                      <span>•</span>

                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="نسخ الإجابة"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold px-1">
                  {msg.timestamp}
                </span>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold w-fit">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>يقوم المساعد بتكثيف وتحليل الصورة / الصوت / النص...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Bar & Attachments Panel */}
      <div className="glass-panel p-3 rounded-3xl space-y-2 border border-slate-200 dark:border-slate-800 shadow-xl">
        
        {/* Selected Attachment Preview Banner */}
        {attachment && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-slate-900 dark:text-white">
            <div className="flex items-center gap-2 truncate">
              {attachment.type === 'image' ? (
                <>
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <img src={attachment.url} alt="معاينة" className="w-8 h-8 rounded-lg object-cover" />
                  <span className="truncate">{attachment.name || 'صورة مرفقة'}</span>
                </>
              ) : (
                <>
                  <FileAudio className="w-4 h-4 text-amber-600" />
                  <span className="truncate">{attachment.name || 'ملف/تسجيل صوتي'}</span>
                </>
              )}
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-rose-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live Audio Recording Status Banner */}
        {isRecording && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-extrabold animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span>جاري تسجيل الصوت ({recordingSeconds} ثانية)...</span>
            </div>
            <button
              onClick={stopRecording}
              className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>إنهاء التسجيل</span>
            </button>
          </div>
        )}

        {/* Action Controls & Main Input */}
        <div className="flex items-center gap-2">
          
          {/* Document Upload Button */}
          <label
            htmlFor="chat-doc-input"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shrink-0"
            title="إرفاق مستند pdf أو نص أو ملخص"
          >
            <Paperclip className="w-4 h-4" />
            <input
              id="chat-doc-input"
              type="file"
              accept=".pdf,.txt,.doc,.docx,.csv,.json,.md"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'document')}
            />
          </label>

          {/* Image Upload Button */}
          <label
            htmlFor="chat-image-input"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shrink-0"
            title="إرفاق صورة مسألة أو صفحة كتاب"
          >
            <ImageIcon className="w-4 h-4" />
            <input
              id="chat-image-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'image')}
            />
          </label>

          {/* Audio File Upload Button */}
          <label
            htmlFor="chat-audio-input"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shrink-0"
            title="رفع ملف صوتي mp3/wav"
          >
            <FileAudio className="w-4 h-4" />
            <input
              id="chat-audio-input"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'audio')}
            />
          </label>

          {/* Microphone Recording Toggle Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2.5 rounded-2xl transition-all border shrink-0 ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-600 animate-bounce'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title={isRecording ? 'إيقاف التسجيل' : 'تسجيل ملاحظة صوتية الآن'}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              attachment
                ? 'اكتب سؤالك بخصوص الملف المرفق أو اضغط إرسال مباشرة...'
                : 'اكتب سؤالك، ارفع صورة، أو سجل صوتاً هنا...'
            }
            className="flex-1 px-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={(!inputText.trim() && !attachment) || isSending}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 transition-all disabled:opacity-40 flex items-center gap-2 shadow-md shrink-0"
          >
            <Send className="w-4 h-4 rotate-180" />
            <span>إرسال</span>
          </button>
        </div>

      </div>

    </div>
  );
};
