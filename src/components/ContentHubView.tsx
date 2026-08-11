import React, { useState } from 'react';
import { ContentItem, ContentType, AttachmentFile } from '../types';
import { ViewType } from './Navigation';
import {
  FileUp,
  FileText,
  Volume2,
  Video,
  Image as ImageIcon,
  Sparkles,
  Upload,
  CheckCircle2,
  Trash2,
  Plus,
  BookOpen,
  HelpCircle,
  Clock,
  Layers,
  Paperclip,
  X,
  Eye,
  File,
  Download,
  ArrowRight,
  Edit3
} from 'lucide-react';

interface ContentHubViewProps {
  items: ContentItem[];
  onAddContent: (newItem: ContentItem) => void;
  onUpdateContent?: (updatedItem: ContentItem) => void;
  onDeleteContent: (id: string) => void;
  onGenerateQuizFromContent: (content: ContentItem) => void;
  onGenerateSummaryFromContent: (content: ContentItem) => void;
  onNavigateView?: (view: ViewType) => void;
}

interface PendingAttachment {
  id: string;
  file: File;
  name: string;
  size: string;
  type: ContentType;
  mimeType: string;
  previewUrl?: string;
  base64?: string;
  text?: string;
}

export const ContentHubView: React.FC<ContentHubViewProps> = ({
  items,
  onAddContent,
  onUpdateContent,
  onDeleteContent,
  onGenerateQuizFromContent,
  onGenerateSummaryFromContent,
  onNavigateView
}) => {
  const [selectedType, setSelectedType] = useState<ContentType>('text');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [chapter, setChapter] = useState('');
  const [rawText, setRawText] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Multi-attachment state
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');

  // Preview Modal for saved content item details
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editChapter, setEditChapter] = useState('');
  const [editSummary, setEditSummary] = useState('');

  const handleOpenEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditTopic(item.topic);
    setEditChapter(item.chapter || '');
    setEditSummary(item.summary || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editTitle.trim()) return;
    const updated: ContentItem = {
      ...editingItem,
      title: editTitle,
      topic: editTopic || 'عام',
      chapter: editChapter || undefined,
      summary: editSummary
    };
    if (onUpdateContent) {
      onUpdateContent(updated);
    }
    setEditingItem(null);
  };

  // Helper to get ContentType from File
  const getFileType = (file: File): ContentType => {
    const mime = (file.type || '').toLowerCase();
    const name = file.name.toLowerCase();
    if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.gif'].some(ext => name.endsWith(ext))) {
      return 'image';
    }
    if (mime.startsWith('audio/') || ['.mp3', '.m4a', '.wav', '.aac', '.ogg'].some(ext => name.endsWith(ext))) {
      return 'audio';
    }
    if (mime.startsWith('video/') || ['.mp4', '.webm', '.mov', '.avi'].some(ext => name.endsWith(ext))) {
      return 'video';
    }
    return 'text';
  };

  // Helper to format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file upload selection (multiple allowed)
  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files) as File[];
    
    // Auto fill title from first file if empty
    if (!title.trim() && selectedFiles[0]) {
      setTitle(selectedFiles[0].name.replace(/\.[^/.]+$/, ""));
    }

    const newPendingAttachments: PendingAttachment[] = [];

    for (const file of selectedFiles) {
      const type = getFileType(file);
      const size = formatSize(file.size);
      let previewUrl: string | undefined = undefined;
      let base64: string | undefined = undefined;
      let text: string | undefined = undefined;

      if (type === 'image' || type === 'audio' || type === 'video') {
        previewUrl = URL.createObjectURL(file);
      }

      // Read base64
      base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.readAsDataURL(file);
      });

      // If text/doc file, also try reading plain text
      if (type === 'text' || file.type.startsWith('text/')) {
        try {
          text = await new Promise<string>((resolve) => {
            const textReader = new FileReader();
            textReader.onload = () => resolve(typeof textReader.result === 'string' ? textReader.result : '');
            textReader.readAsText(file);
          });
        } catch (err) {
          text = '';
        }
      }

      newPendingAttachments.push({
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        file,
        name: file.name,
        size,
        type,
        mimeType: file.type || 'application/octet-stream',
        previewUrl,
        base64,
        text
      });
    }

    setAttachments((prev) => [...prev, ...newPendingAttachments]);
    // Reset file input value
    e.target.value = '';
  };

  // Remove individual attachment before submitting
  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Helper to create and save a content item
  const createAndSaveItem = (
    finalTitle: string,
    savedAttachments: AttachmentFile[],
    summaryText?: string,
    extractedContent?: string,
    keyTakeaways?: string[]
  ) => {
    const newItem: ContentItem = {
      id: `cnt_${Date.now()}`,
      title: finalTitle,
      type: selectedType,
      sourceName: attachments.length > 0 ? `${attachments.length} مرفقات (${attachments.map(a => a.name).join(', ')})` : videoUrl || 'ملاحظات نصية',
      durationOrSize: attachments.length > 0 ? `${attachments.length} ملفات` : 'مستند نصي',
      topic: topic.trim() || 'مادة دراسية',
      chapter: chapter.trim() || '',
      attachments: savedAttachments,
      extractedText: extractedContent || rawText || 'محتوى محفوظ في مكتبتك الرقمية',
      summary: summaryText || rawText || 'ملخص المرفقات المضافة في المكتبة',
      keyTakeaways: keyTakeaways || [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddContent(newItem);
    return newItem;
  };

  // Direct save without AI extraction
  const handleSaveDirectly = () => {
    const finalTitle = title.trim() || (attachments.length > 0 ? attachments[0].name.replace(/\.[^/.]+$/, "") : 'محتوى دراسي جديد');
    if (attachments.length === 0 && !rawText.trim() && !videoUrl.trim()) {
      alert('يرجى كتابة نص، أو إضافة رابط فيديو، أو إرفاق ملفات/مستندات قبل الحفظ.');
      return;
    }

    const savedAttachments: AttachmentFile[] = attachments.map((att) => ({
      id: att.id,
      name: att.name,
      size: att.size,
      type: att.type,
      mimeType: att.mimeType,
      fileUrl: att.previewUrl || (att.base64 && att.base64.length < 150000 ? `data:${att.mimeType};base64,${att.base64}` : undefined),
      base64: att.base64 && att.base64.length < 150000 ? att.base64 : undefined,
      extractedText: att.text
    }));

    createAndSaveItem(finalTitle, savedAttachments);

    // Reset input form
    setTitle('');
    setTopic('');
    setChapter('');
    setRawText('');
    setVideoUrl('');
    setAttachments([]);

    setRedirectNotice('تم حفظ المرفقات والمحتوى في مكتبتك بنجاح دون مغادرة الصفحة!');
  };

  // Extract content with Gemini API
  const handleExtractContent = async () => {
    const finalTitle = title.trim() || (attachments.length > 0 ? attachments[0].name.replace(/\.[^/.]+$/, "") : 'محتوى دراسي جديد');
    if (!title.trim()) {
      setTitle(finalTitle);
    }

    if (attachments.length === 0 && !rawText.trim() && !videoUrl.trim()) {
      alert('يرجى كتابة نص، أو إضافة رابط فيديو، أو إرفاق ملفات/مستندات لاستخراج المحتوى.');
      return;
    }

    setIsProcessing(true);
    setExtractedData(null);

    const savedAttachments: AttachmentFile[] = attachments.map((att) => ({
      id: att.id,
      name: att.name,
      size: att.size,
      type: att.type,
      mimeType: att.mimeType,
      fileUrl: att.previewUrl || (att.base64 && att.base64.length < 150000 ? `data:${att.mimeType};base64,${att.base64}` : undefined),
      base64: att.base64 && att.base64.length < 150000 ? att.base64 : undefined,
      extractedText: att.text
    }));

    try {
      // Build attachments payload
      const attachmentsPayload = attachments.map((att) => ({
        name: att.name,
        type: att.type,
        mimeType: att.mimeType,
        size: att.size,
        base64: att.base64,
        text: att.text
      }));

      const response = await fetch('/api/content/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: finalTitle,
          topic: topic || 'عام',
          chapter,
          content: rawText || (videoUrl ? `رابط الفيديو: ${videoUrl}` : `مرفقات متعددة (${attachments.length})`),
          attachments: attachmentsPayload
        })
      });

      let result: any = null;
      try {
        const text = await response.text();
        result = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse extraction response JSON:', err);
      }

      if (result && result.success && result.data) {
        setExtractedData(result.data);

        const newItem = createAndSaveItem(
          finalTitle,
          savedAttachments,
          result.data.summary,
          result.data.extractedText,
          result.data.keyTakeaways
        );

        // Auto-generate summary item and quiz item
        onGenerateSummaryFromContent(newItem, result.data, false);
        onGenerateQuizFromContent(newItem, result.data, false);

        // Clear input form
        setTitle('');
        setTopic('');
        setChapter('');
        setRawText('');
        setVideoUrl('');
        setAttachments([]);

        // Show notice WITHOUT auto-switching pages!
        setRedirectNotice('تمت معالجة المستندات وحفظ المرفقات في سجل مكتبتك بنجاح!');
      } else {
        // Fallback: save item directly to library even if AI fails
        createAndSaveItem(finalTitle, savedAttachments);
        setTitle('');
        setTopic('');
        setChapter('');
        setRawText('');
        setVideoUrl('');
        setAttachments([]);
        setRedirectNotice('تم حفظ المرفقات في مكتبتك بنجاح! (تعذر استخراج البيانات بالذكاء الاصطناعي في الوقت الحالي).');
      }
    } catch (error) {
      console.error('Error extracting content:', error);
      // Fallback: save item directly to library even on error
      createAndSaveItem(finalTitle, savedAttachments);
      setTitle('');
      setTopic('');
      setChapter('');
      setRawText('');
      setVideoUrl('');
      setAttachments([]);
      setRedirectNotice('تم حفظ المرفقات في مكتبتك بنجاح! (حدث خطأ في الاتصال بالسيرفر لكن جميع ملفاتك محفوظة).');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
            <FileUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            مكتبة المحتوى والمرفقات المتقدمة
          </h2>
          <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold mt-1">
            أضف عدة مرفقات وصور ومستندات وتسجيلات دفعة واحدة لحفظها واستخراج ملخصاتها بالذكاء الاصطناعي
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/40 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm font-black'
                : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            إضافة مرفقات واستخراج
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'library'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm font-black'
                : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            المكتبة والمرفقات المحفوظة ({items.length})
          </button>
        </div>
      </div>

      {/* Notification Notice */}
      {redirectNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{redirectNotice}</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => {
                setActiveTab('library');
                setRedirectNotice(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-black text-xs hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>استعراض في المكتبة ({items.length})</span>
            </button>
            {onNavigateView && (
              <button
                onClick={() => onNavigateView('summaries')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-black text-xs hover:bg-slate-900 transition-all flex items-center gap-1"
              >
                <span>الذهاب للملخصات</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
            <button
              onClick={() => setRedirectNotice(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'upload' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Column */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl space-y-5 border border-slate-200/80 dark:border-slate-800">
            
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              تحديد تفاصيل المادة والمرفقات
            </h3>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان المحتوى المضاف
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: ميكانيكا الكم والنظرية النسبية"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المادة أو التخصص
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثال: الفيزياء"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
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
                    placeholder="مثال: الفصل 2"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Text area for optional notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات أو نص المحاضرة (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="يمكنك كتابة أية ملاحظات نصية إضافية توضح المحتوى..."
                  className="w-full p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none resize-none"
                />
              </div>

              {/* Multi-Attachment Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-indigo-500" />
                    المرفقات والملفات الدراسية (يمكن رفع عدة ملفات)
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    {attachments.length} مرفق مضاف
                  </span>
                </label>

                <div className="border-2 border-dashed border-indigo-500/30 dark:border-indigo-500/20 rounded-2xl p-5 text-center hover:border-indigo-500 transition-all bg-indigo-500/5 cursor-pointer relative group">
                  <input
                    type="file"
                    multiple
                    onChange={handleFilesSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    اضغط هنا أو اسحب وأسقط الملفات (صور، PDF، صوت، فيديو، مستندات)
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    يدعم رفع ملفات متعددة معاً وحفظها لإعادة الاستخدام والرجوع إليها دائماً
                  </p>
                </div>

                {/* Attachments Preview List */}
                {attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      الملفات والمرفقات المحددة للرفع:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {att.type === 'image' && att.previewUrl ? (
                              <img src={att.previewUrl} alt={att.name} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200" />
                            ) : att.type === 'audio' ? (
                              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                <Volume2 className="w-4 h-4" />
                              </div>
                            ) : att.type === 'video' ? (
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                                <Video className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                                {att.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {att.size}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
                            title="إزالة المرفق"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExtractContent}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white font-black text-xs shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'جاري تحليل المرفقات...' : 'تحليل واستخراج بالذكاء الاصطناعي'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDirectly}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ المرفقات مباشرة بالمكتبة</span>
                </button>
              </div>

            </div>

          </div>

          {/* Extraction Result Column */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>نتائج الاستخراج والتحليل</span>
              {extractedData && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> تم التحليل المزدوج
                </span>
              )}
            </h3>

            {!extractedData && !isProcessing && (
              <div className="p-12 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700">
                <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  في انتظار إضافة المرفقات
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  قم بإرفاق ملفاتك واضغط زر التحليل لتوليد الملخص، الشرح المفرغ، والكويزات التفاعلية تلقائياً.
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="p-12 text-center rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 space-y-3">
                <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
                <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  يقوم الذكاء الاصطناعي بتحليل كافّة المرفقات المرفوعة...
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  ربط المفاهيم واستخلاص النقاط الجوهرية وتوليد الاختبارات
                </p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-4 animate-fadeIn">
                
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h5 className="text-xs font-black">تم حفظ المرفقات وتوليد الملخص!</h5>
                    <p className="text-[11px] opacity-90">
                      أصبحت المرفقات محفوظة في مكتبتك ومتاحة لإعادة الاستخدام في الكويزات والملخصات.
                    </p>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    الملخص التنفيذي للمرفقات
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {extractedData.summary}
                  </p>
                </div>

                {/* Key Takeaways */}
                {extractedData.keyTakeaways && extractedData.keyTakeaways.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      النقاط الجوهرية المستفادة:
                    </span>
                    <ul className="space-y-1.5">
                      {extractedData.keyTakeaways.map((point: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Extracted Text */}
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                    النص الشامل المفرغ من كافة المرفقات:
                  </span>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto leading-relaxed border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                    {extractedData.extractedText}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('library')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>تصفح المواد والمرفقات في المكتبة ({items.length})</span>
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>
      ) : (
        /* Library Tab */
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                مكتبتك الدراسية فارغة حالياً
              </p>
              <p className="text-xs text-slate-400 mt-1">
                قم بإضافة محتوى جديد ومرفقات ليتم حفظها والرجوع إليها دائماً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel p-5 rounded-3xl space-y-3 relative flex flex-col justify-between border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                          {item.topic}
                        </span>
                        {item.chapter && (
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold border border-violet-500/20">
                            {item.chapter}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 transition-colors"
                          title="تعديل المادة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteContent(item.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                          title="حذف المادة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {item.summary}
                      </p>
                    </div>

                    {/* Saved Attachments Badge */}
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          المرفقات المحفوظة ({item.attachments.length}):
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.attachments.map((att, idx) => (
                            <span key={idx} className="text-[10px] bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 truncate max-w-[120px]">
                              {att.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.createdAt}
                      </span>
                      <span>{item.durationOrSize}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <button
                      onClick={() => setViewingItem(item)}
                      className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                      <span>عرض وتصفح المرفقات والتفاصيل</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onGenerateQuizFromContent(item)}
                        className="py-1.5 px-2 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>إنشاء كويز</span>
                      </button>

                      <button
                        onClick={() => onGenerateSummaryFromContent(item)}
                        className="py-1.5 px-2 rounded-xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>توليد بطاقات</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Item Details & Attachments Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-3xl space-y-5 relative animate-fadeIn border border-indigo-500/30 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  {viewingItem.topic} {viewingItem.chapter ? `- ${viewingItem.chapter}` : ''}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {viewingItem.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                إغلاق
              </button>
            </div>

            {/* Saved Attachments Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-indigo-500" />
                المرفقات والملفات المحفوظة لهذه المادة ({viewingItem.attachments?.length || 0})
              </h4>

              {viewingItem.attachments && viewingItem.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewingItem.attachments.map((att) => (
                    <div key={att.id} className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {att.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {att.size}
                        </span>
                      </div>

                      {att.fileUrl && att.type === 'image' && (
                        <div className="rounded-xl overflow-hidden max-h-36 border border-slate-200 dark:border-slate-700">
                          <img src={att.fileUrl} alt={att.name} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {att.fileUrl && att.type === 'audio' && (
                        <audio controls src={att.fileUrl} className="w-full h-8" />
                      )}

                      {att.fileUrl && att.type === 'video' && (
                        <video controls src={att.fileUrl} className="w-full rounded-xl max-h-36 object-cover" />
                      )}

                      {att.fileUrl && (
                        <a
                          href={att.fileUrl}
                          download={att.name}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تحميل الملف المرفق</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">لا توجد ملفات مرفقة مباشرة محددة لهذه المادة.</p>
              )}
            </div>

            {/* Executive Summary */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                الملخص المستخرج
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                {viewingItem.summary}
              </p>
            </div>

            {/* Extracted Text */}
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                النص المستخرج الكامل:
              </span>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto leading-relaxed border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                {viewingItem.extractedText}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl space-y-5 relative animate-fadeIn border border-indigo-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                تعديل بيانات المادة الدراسية
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان المادة / الدرس
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
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
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الشابتر / الفصل
                  </label>
                  <input
                    type="text"
                    value={editChapter}
                    onChange={(e) => setEditChapter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الملخص والتفاصيل
                </label>
                <textarea
                  rows={4}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
