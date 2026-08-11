import React, { useState } from 'react';
import { SummaryItem, Flashcard, ContentItem, SummarySection, AttachmentFile } from '../types';
import { cleanGarbageText } from '../lib/dbService';
import {
  BookOpenCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Printer,
  RotateCw,
  Plus,
  BookOpen,
  CheckCircle2,
  List,
  Layers,
  SlidersHorizontal,
  Copy,
  Check,
  FileText,
  Volume2,
  Edit3,
  Trash2,
  Paperclip,
  Upload,
  Image as ImageIcon,
  X,
  Download
} from 'lucide-react';

// Helper component for rich Arabic Markdown rendering (headings, bold text, lists, callouts)
const FormattedMarkdown: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  if (!content) return null;
  const safeContent = cleanGarbageText(content);
  if (!safeContent) return null;

  const renderInlineFormatting = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <strong
            key={i}
            className="font-extrabold text-slate-900 dark:text-white bg-amber-500/15 dark:bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-950 dark:text-amber-200 border border-amber-500/30"
          >
            {boldText}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const codeText = part.slice(1, -1);
        return (
          <code
            key={i}
            className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700/80 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold"
          >
            {codeText}
          </code>
        );
      }
      return part;
    });
  };

  const lines = safeContent.split('\n');

  return (
    <div className={`space-y-2 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-medium ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4
              key={idx}
              className="text-xs sm:text-sm font-black text-cyan-900 dark:text-cyan-200 mt-3 mb-1.5 border-r-4 border-cyan-500 pr-2.5 py-0.5"
            >
              {headingText}
            </h4>
          );
        }

        if (trimmed.startsWith('>') || trimmed.startsWith('ملاحظة:') || trimmed.startsWith('تنبيه:')) {
          const calloutText = trimmed.replace(/^>\s*/, '');
          return (
            <div
              key={idx}
              className="my-2 p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border-r-4 border-indigo-500 text-xs text-indigo-900 dark:text-indigo-200 font-semibold shadow-2xs"
            >
              <span className="block">{renderInlineFormatting(calloutText)}</span>
            </div>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^[\-\*•]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pr-2 my-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0 mt-2" />
              <div className="flex-1 leading-relaxed">{renderInlineFormatting(bulletText)}</div>
            </div>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s*(.*)/);
        if (numberedMatch) {
          const num = numberedMatch[1];
          const itemText = numberedMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2 pr-2 my-1">
              <span className="w-5 h-5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/30">
                {num}
              </span>
              <div className="flex-1 leading-relaxed">{renderInlineFormatting(itemText)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="mb-1 leading-relaxed">
            {renderInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
};

interface SummariesViewProps {
  summaries: SummaryItem[];
  onAddSummary: (newSummary: SummaryItem) => void;
  onUpdateSummary?: (updatedSummary: SummaryItem) => void;
  onDeleteSummary?: (summaryId: string) => void;
  contentItems?: ContentItem[];
}

export const SummariesView: React.FC<SummariesViewProps> = ({
  summaries,
  onAddSummary,
  onUpdateSummary,
  onDeleteSummary,
  contentItems = []
}) => {
  const [selectedSummary, setSelectedSummary] = useState<SummaryItem | null>(
    summaries[0] || null
  );

  // Auto-select latest summary when summaries array updates
  React.useEffect(() => {
    if (summaries.length > 0 && (!selectedSummary || !summaries.some(s => s.id === selectedSummary.id))) {
      setSelectedSummary(summaries[0]);
    }
  }, [summaries]);

  // Read More and Full Reader states
  const [isExecutiveTextExpanded, setIsExecutiveTextExpanded] = useState(false);
  const [expandedSectionsMap, setExpandedSectionsMap] = useState<Record<number, boolean>>({});
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);

  React.useEffect(() => {
    setIsExecutiveTextExpanded(false);
    setExpandedSectionsMap({});
  }, [selectedSummary?.id]);

  // Flashcards carousel state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Generator modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [notesText, setNotesText] = useState('');
  const [modalAttachments, setModalAttachments] = useState<AttachmentFile[]>([]);
  const [detailLevel, setDetailLevel] = useState<'deep' | 'standard' | 'bullet'>('deep');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [copied, setCopied] = useState(false);

  // Edit Summary Modal state
  const [editingSummary, setEditingSummary] = useState<SummaryItem | null>(null);
  const [editSumTitle, setEditSumTitle] = useState('');
  const [editSumSubject, setEditSumSubject] = useState('');
  const [editSumChapter, setEditSumChapter] = useState('');
  const [editSumText, setEditSumText] = useState('');
  const [editKeyPointsText, setEditKeyPointsText] = useState('');

  const handleModalFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesList: File[] = Array.from(e.target.files);
    const newPending: AttachmentFile[] = [];

    for (const file of filesList) {
      let type: AttachmentFile['type'] = 'text';
      let previewUrl: string | undefined;
      let base64: string | undefined;
      let text: string | undefined;

      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.includes('pdf') || file.type.startsWith('text/')) type = 'text';

      if (type === 'image' || type === 'audio' || type === 'video') {
        previewUrl = URL.createObjectURL(file);
      }

      base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.readAsDataURL(file);
      });

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

      newPending.push({
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type,
        mimeType: file.type || 'application/octet-stream',
        previewUrl,
        base64,
        text
      });
    }

    setModalAttachments((prev) => [...prev, ...newPending]);
    e.target.value = '';
  };

  const handleRemoveModalAttachment = (id: string) => {
    setModalAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleOpenEditSummary = (sum: SummaryItem) => {
    setEditingSummary(sum);
    setEditSumTitle(sum.title);
    setEditSumSubject(sum.subject);
    setEditSumChapter(sum.chapter || '');
    setEditSumText(sum.summaryText);
    setEditKeyPointsText((sum.keyPoints || []).join('\n'));
  };

  const handleSaveEditSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSummary || !editSumTitle.trim()) return;
    const updated: SummaryItem = {
      ...editingSummary,
      title: editSumTitle,
      subject: editSumSubject || 'عام',
      chapter: editSumChapter || undefined,
      summaryText: editSumText,
      keyPoints: editKeyPointsText.split('\n').filter((k) => k.trim())
    };
    if (onUpdateSummary) {
      onUpdateSummary(updated);
    }
    if (selectedSummary?.id === updated.id) {
      setSelectedSummary(updated);
    }
    setEditingSummary(null);
  };

  const handleDeleteCurrentSummary = (id: string) => {
    if (onDeleteSummary) {
      onDeleteSummary(id);
    }
    if (selectedSummary?.id === id) {
      const remaining = summaries.filter((s) => s.id !== id);
      setSelectedSummary(remaining[0] || null);
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
      setNotesText(found.extractedText || found.summary || '');
    }
  };

  const activeCards: Flashcard[] = selectedSummary?.flashcards || [];
  const currentCard = activeCards[currentCardIndex];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % activeCards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
  };

  // Copy Summary to clipboard
  const handleCopySummary = () => {
    if (!selectedSummary) return;
    const fullText = `[${selectedSummary.title} - ${selectedSummary.subject}]\n\n` +
      `خلاصة الدرس:\n${selectedSummary.summaryText || ''}\n\n` +
      (selectedSummary.sections && selectedSummary.sections.length > 0
        ? `المحاور الشاملة:\n` + selectedSummary.sections.map(s => `--- ${s.heading} ---\n${s.content}`).join('\n\n') + '\n\n'
        : '') +
      `النقاط الرئيسية:\n` + (selectedSummary.keyPoints || []).map(k => `• ${k}`).join('\n');

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Formatted Summary File (.md)
  const handleDownloadSummaryFile = (sum?: SummaryItem | null) => {
    const summary = sum || selectedSummary;
    if (!summary) return;

    let markdownContent = `# ${summary.title}\n`;
    markdownContent += `**المادة**: ${summary.subject} | **تاريخ التلخيص**: ${summary.createdAt || new Date().toISOString().split('T')[0]}`;
    if (summary.chapter) {
      markdownContent += ` | **الفصل/الشابتر**: ${summary.chapter}`;
    }
    markdownContent += `\n\n---\n\n`;

    markdownContent += `## 1. الخلاصة والملخص التنفيذي\n\n${summary.summaryText}\n\n`;

    if (summary.keyPoints && summary.keyPoints.length > 0) {
      markdownContent += `## 2. النقاط الجوهرية ونواتج التعلم\n\n`;
      summary.keyPoints.forEach((point) => {
        markdownContent += `* ${point}\n`;
      });
      markdownContent += `\n`;
    }

    if (summary.sections && summary.sections.length > 0) {
      markdownContent += `## 3. المحاور الرئيسية والشروحات التفصيلية\n\n`;
      summary.sections.forEach((sec, idx) => {
        markdownContent += `### ${idx + 1}. ${sec.heading}\n\n${sec.content}\n\n`;
      });
    }

    if (summary.cheatSheet && summary.cheatSheet.length > 0) {
      markdownContent += `## 4. روشتة المراجعة القوانين والمعادلات السريعة\n\n`;
      summary.cheatSheet.forEach((rule) => {
        markdownContent += `* \`${rule}\`\n`;
      });
      markdownContent += `\n`;
    }

    if (summary.flashcards && summary.flashcards.length > 0) {
      markdownContent += `## 5. بطاقات الاستذكار السريعة (${summary.flashcards.length})\n\n`;
      summary.flashcards.forEach((fc, idx) => {
        markdownContent += `**سؤال ${idx + 1}**: ${fc.question}\n\n**الإجابة**: ${fc.answer}\n\n---\n\n`;
      });
    }

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = summary.title.replace(/[^\u0600-\u06FFa-zA-Z0-9_\- ]/g, '_').trim();
    link.download = `${safeTitle || 'ملخص_دراسي'}_نجم.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Summary to PDF / Formatted Print View
  const handleExportPDF = (sum?: SummaryItem | null) => {
    const summary = sum || selectedSummary;
    if (!summary) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = summary.title || 'ملخص دراسي';

    const formatMD = (text: string) => {
      if (!text) return '';
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^>\s?(.*)$/gm, '<blockquote style="border-right:4px solid #0284c7; padding:8px 12px; color:#0369a1; background:#f0f9ff; border-radius:6px; margin:10px 0;">$1</blockquote>')
        .replace(/^\*\s?(.*)$/gm, '• $1<br/>')
        .replace(/\n/g, '<br/>');
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${title} - ملخص نجْم الأكاديمي</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 30px 40px;
            line-height: 1.8;
            direction: rtl;
          }
          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }
          .header {
            border-bottom: 3px solid #0284c7;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .title-area h1 {
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 6px;
          }
          .badge-row {
            display: flex;
            gap: 12px;
            font-size: 13px;
            color: #0284c7;
            font-weight: 700;
          }
          .badge-row span {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 2px 10px;
            border-radius: 6px;
          }
          .meta-box {
            text-align: left;
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
          .section-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 18px 22px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 16px;
            font-weight: 800;
            color: #0369a1;
            border-right: 4px solid #0284c7;
            padding-right: 10px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .key-point {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 8px;
            font-size: 13.5px;
            color: #334155;
            line-height: 1.7;
          }
          .cheat-badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
            padding: 6px 12px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 13px;
            margin: 4px;
          }
          .flashcard-box {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 12px;
            background: #ffffff;
            page-break-inside: avoid;
          }
          .flashcard-q {
            font-weight: 800;
            color: #0f172a;
            font-size: 13.5px;
            margin-bottom: 6px;
          }
          .flashcard-a {
            color: #334155;
            font-size: 13px;
            background: #f1f5f9;
            padding: 8px 12px;
            border-radius: 6px;
            border-right: 3px solid #0284c7;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          strong { color: #0284c7; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-area">
            <h1>${summary.title}</h1>
            <div class="badge-row">
              <span>📚 المادة: ${summary.subject}</span>
              ${summary.chapter ? `<span>🔖 الفصل/الشابتر: ${summary.chapter}</span>` : ''}
            </div>
          </div>
          <div class="meta-box">
            <div style="font-weight:800; color:#0284c7; font-size:13px;">منصة نجْم التعليمية الذكية</div>
            <div>تاريخ التصدير: ${summary.createdAt || new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-title">📌 الخلاصة والملخص التنفيذي</div>
          <div style="font-size:14px; color:#334155;">
            ${formatMD(summary.summaryText)}
          </div>
        </div>

        ${summary.keyPoints && summary.keyPoints.length > 0 ? `
          <div class="section-card">
            <div class="section-title">💡 النقاط المحورية ونواتج التعلم</div>
            ${summary.keyPoints.map(point => `<div class="key-point">${formatMD(point)}</div>`).join('')}
          </div>
        ` : ''}

        ${summary.sections && summary.sections.length > 0 ? summary.sections.map((sec, idx) => `
          <div class="section-card">
            <div class="section-title">${idx + 1}. ${sec.heading}</div>
            <div style="font-size:13.5px; color:#334155;">${formatMD(sec.content)}</div>
          </div>
        `).join('') : ''}

        ${summary.cheatSheet && summary.cheatSheet.length > 0 ? `
          <div class="section-card">
            <div class="section-title">⚡ روشتة المراجعة السريعة والقوانين</div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              ${summary.cheatSheet.map(rule => `<span class="cheat-badge">${rule}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        ${summary.flashcards && summary.flashcards.length > 0 ? `
          <div class="section-card">
            <div class="section-title">🗂️ بطاقات الاستذكار السريعة (${summary.flashcards.length})</div>
            ${summary.flashcards.map((fc, idx) => `
              <div class="flashcard-box">
                <div class="flashcard-q">س ${idx + 1}: ${fc.question}</div>
                <div class="flashcard-a">ج: ${fc.answer}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="footer">
          تم إنتاج هذا الملف المنظم للتصدير والطباعة عبر منصة نجْم الأكاديمية الذكية
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Generate new Summary with Gemini AI
  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    setIsGenerating(true);

    try {
      let summaryResult: any = null;

      const matchedContent = contentItems.find(c => c.id === selectedContentId);

      // Build clean comprehensive text combining content items and notes
      const cleanParts: string[] = [];
      if (matchedContent) {
        if (matchedContent.extractedText) cleanParts.push(matchedContent.extractedText);
        if (matchedContent.summary && matchedContent.summary !== matchedContent.extractedText) {
          cleanParts.push(matchedContent.summary);
        }
        if (matchedContent.rawContent && matchedContent.rawContent !== matchedContent.extractedText) {
          cleanParts.push(matchedContent.rawContent);
        }
        if (matchedContent.keyTakeaways && matchedContent.keyTakeaways.length > 0) {
          cleanParts.push(matchedContent.keyTakeaways.join('\n'));
        }
      }

      if (notesText.trim()) {
        cleanParts.push(notesText.trim());
      }

      const effectiveText = cleanParts.filter(Boolean).join('\n\n') || (topic ? `موضوع الدرس: ${topic}` : '');

      // Combine attachments from primary content item and modal attachments
      const contentItemAttachments = (matchedContent?.attachments || []).map(a => ({
        name: a.name,
        mimeType: a.mimeType,
        base64: a.base64,
        text: a.text || a.extractedText
      }));

      const extraModalAttachments = modalAttachments.map(a => ({
        name: a.name,
        mimeType: a.mimeType,
        base64: a.base64,
        text: a.text
      }));

      const combinedAttachments = [...contentItemAttachments, ...extraModalAttachments];

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const response = await fetch('/api/summaries/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            topic,
            subject: subject || (matchedContent ? matchedContent.topic : 'عام'),
            text: effectiveText,
            detailLevel,
            customInstructions,
            attachments: combinedAttachments
          })
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          try {
            const text = await response.text();
            const data = JSON.parse(text);
            if (data.success && data.summary) {
              summaryResult = data.summary;
            }
          } catch (e) {
            console.error('Failed to parse summary response JSON:', e);
          }
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          console.warn('Summary generation API timed out, seamlessly using local extraction engine.');
        } else {
          console.warn('Notice generating summary via API:', error);
        }
      }

      if (!summaryResult) {
        // Filter out any metadata labels, bracketed titles, or system headers
        const rawLines = effectiveText
          .split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 8 && !l.startsWith('[') && !l.startsWith('---') && !l.includes('المادة المرفقة') && !l.includes('النص المستخرج') && !l.includes('محتوى محفوظ'));

        const realTakeaways = matchedContent?.keyTakeaways && matchedContent.keyTakeaways.length > 0
          ? matchedContent.keyTakeaways
          : rawLines.length > 0
          ? rawLines
          : [
              `**الأهمية الأكاديمية**: استيعاب الشروط والمفاهيم الكلية المتعلقة بـ ${topic}.`,
              `**التطبيق العملي**: تحليل وتدقيق القوانين والتطبيقات المباشرة لمادة ${subject || 'عام'}.`
            ];

        const formattedKeyPoints = realTakeaways.map(pt => {
          if (pt.startsWith('**') || pt.includes(':')) return pt;
          return `**المفهوم الأكاديمي**: ${pt}`;
        });

        const mainText = matchedContent?.summary || (rawLines.slice(0, 3).join('\n\n') || `ملخص أكاديمي مفصل ومستخرج لموضوع ${topic} في مادة ${subject || 'عام'}.`);

        summaryResult = {
          title: `ملخص: ${topic}`,
          summaryText: mainText,
          sections: [
            {
              heading: `1. المحور الرئيسي والتعاريف الجوهرية في ${topic}`,
              content: rawLines[0] || `يغطي هذا المحور التعاريف الشاملة والمبادئ الأساسية لدرس ${topic}.`
            },
            {
              heading: `2. التطبيقات والأمثلة الأكاديمية الشاملة`,
              content: rawLines[1] || `يتناول هذا الجزء الشرح المباشر والتطبيقات الرياضية أو النظرية في ${topic}.`
            }
          ],
          keyPoints: formattedKeyPoints.slice(0, 6),
          flashcards: realTakeaways.slice(0, 4).map((pt, idx) => ({
            id: `fc_${Date.now()}_${idx}`,
            question: `ما هي الفكرة الأكاديمية المفتاحية رقم ${idx + 1} في ${topic}؟`,
            answer: pt.replace(/\*\*/g, ''),
            category: subject || 'عام'
          })),
          cheatSheet: realTakeaways.slice(0, 4).map(pt => pt.replace(/\*\*/g, ''))
        };
      }

      const hasImages = modalAttachments.some(a => a.type === 'image' || a.mimeType?.startsWith('image/'));

      const newSum: SummaryItem = {
        id: `sum_${Date.now()}`,
        title: summaryResult.title || `ملخص ${topic}`,
        subject: subject || 'عام',
        chapter: chapter || undefined,
        contentId: selectedContentId || undefined,
        summaryText: summaryResult.summaryText || 'ملخص مستخرج بالذكاء الاصطناعي',
        sections: summaryResult.sections || [],
        keyPoints: summaryResult.keyPoints || [],
        flashcards: (summaryResult.flashcards || []).map((fc: any, idx: number) => ({
          id: fc.id || `fc_${Date.now()}_${idx}`,
          question: fc.question || `سؤال ${idx + 1}`,
          answer: fc.answer || 'إجابة نموذجية',
          category: fc.category || subject || 'عام'
        })),
        cheatSheet: summaryResult.cheatSheet || [],
        attachments: modalAttachments.length > 0 ? modalAttachments : undefined,
        hasImageAnalysis: hasImages,
        createdAt: new Date().toISOString().split('T')[0]
      };

      onAddSummary(newSum);
      setSelectedSummary(newSum);
      setIsModalOpen(false);
      setTopic('');
      setSubject('');
      setChapter('');
      setNotesText('');
      setModalAttachments([]);
      setSelectedContentId('');
      setCustomInstructions('');
    } catch (globalError) {
      console.error('Fatal error generating summary:', globalError);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            قسم الملخصات والبطاقات الذكية
          </h2>
          <p className="text-xs text-slate-800 dark:text-slate-300 font-semibold mt-1">
            ملخصات المواد الدراسية، محاور وشروحات تفصيلية، بطاقات استذكار 3D، وروشتة المراجعة السريعة
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>توليد وتخصيص ملخص جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Summary Selector & Detailed View */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Summaries Pills List */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {summaries.map((sum) => (
              <div
                key={sum.id}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all border ${
                  selectedSummary?.id === sum.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
                    : 'glass-panel text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSummary(sum);
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="whitespace-nowrap text-right focus:outline-none"
                  title={sum.title}
                >
                  {sum.title}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCurrentSummary(sum.id);
                  }}
                  className={`p-1 rounded-lg transition-colors ${
                    selectedSummary?.id === sum.id
                      ? 'hover:bg-rose-500/30 text-rose-300 dark:text-rose-600'
                      : 'hover:bg-rose-500/20 text-rose-500 opacity-75 hover:opacity-100'
                  }`}
                  title="حذف هذا الملخص"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {selectedSummary ? (
            <div className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                      {selectedSummary.subject}
                    </span>
                    {selectedSummary.chapter && (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        {selectedSummary.chapter}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-relaxed tracking-normal break-words w-full">
                    {selectedSummary.title}
                  </h3>
                </div>

                <div className="flex flex-wrap sm:flex-col gap-1.5 shrink-0 self-stretch sm:self-start bg-slate-100/70 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                  <button
                    onClick={() => handleExportPDF(selectedSummary)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all flex items-center justify-start gap-2 border border-blue-500/20 w-full"
                    title="تصدير الملخص كملف PDF للطباعة والحفظ"
                  >
                    <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">تصدير PDF</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSummaryFile(selectedSummary)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center justify-start gap-2 border border-emerald-500/20 w-full"
                    title="تحميل الملخص كملف منسق Markdown"
                  >
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">تحميل</span>
                  </button>

                  <button
                    onClick={() => setIsReaderModalOpen(true)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition-all flex items-center justify-start gap-2 border border-cyan-500/20 w-full"
                    title="وضع القراءة الشاملة"
                  >
                    <Maximize2 className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">قراءة كاملة</span>
                  </button>

                  <button
                    onClick={handleCopySummary}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold transition-all flex items-center justify-start gap-2 border border-slate-300/60 dark:border-slate-600 w-full"
                    title="نسخ نص الملخص"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                    <span className="hidden sm:inline whitespace-nowrap">{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditSummary(selectedSummary)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all flex items-center justify-start gap-2 border border-indigo-500/20 w-full"
                    title="تعديل الملخص"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">تعديل</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCurrentSummary(selectedSummary.id)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center justify-start gap-2 border border-rose-500/20 w-full"
                    title="حذف الملخص"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">حذف</span>
                  </button>
                </div>
              </div>

              {/* Summary Executive Overview */}
              <div className="p-4 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    العنوان والملخص التنفيذي للموضوع:
                  </span>
                  {selectedSummary.hasImageAnalysis && (
                    <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-amber-500" /> تحليل بصري (Gemini Vision)
                    </span>
                  )}
                </div>
                
                <FormattedMarkdown
                  content={
                    (selectedSummary.summaryText || '').length > 300 && !isExecutiveTextExpanded
                      ? `${(selectedSummary.summaryText || '').slice(0, 300)}...`
                      : (selectedSummary.summaryText || '')
                  }
                />

                {(selectedSummary.summaryText || '').length > 300 && (
                  <button
                    type="button"
                    onClick={() => setIsExecutiveTextExpanded(!isExecutiveTextExpanded)}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>{isExecutiveTextExpanded ? 'طّي النص (عرض أقل)' : 'اقرأ المزيد (إظهار النص كاملاً)'}</span>
                    {isExecutiveTextExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Structured Sections (Sub-topics / Chapters) */}
              {selectedSummary.sections && selectedSummary.sections.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-600" />
                    المحاور التفصيلية والعناوين الفرعية:
                  </h4>
                  <div className="space-y-3">
                    {selectedSummary.sections.map((sec, idx) => {
                      const isSecExpanded = !!expandedSectionsMap[idx];
                      const isLongContent = (sec.content || '').length > 350;
                      const displayContent = isLongContent && !isSecExpanded
                        ? `${(sec.content || '').slice(0, 350)}...`
                        : (sec.content || '');

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2"
                        >
                          <h5 className="text-xs font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                            <span>{sec.heading}</span>
                          </h5>

                          <FormattedMarkdown content={displayContent} />

                          {isLongContent && (
                            <button
                              type="button"
                              onClick={() => setExpandedSectionsMap(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 pr-4 pt-1"
                            >
                              <span>{isSecExpanded ? 'طّي المحور' : 'اقرأ المزيد عن هذا المحور'}</span>
                              {isSecExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Key Points */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <List className="w-4 h-4 text-cyan-600" />
                  النقاط الجوهرية الهامة للمراجعة:
                </h4>
                <div className="space-y-2">
                  {(selectedSummary.keyPoints || []).map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                      <FormattedMarkdown content={point} className="flex-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cheat Sheet Laws / Rules */}
              {selectedSummary.cheatSheet && selectedSummary.cheatSheet.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    روشتة القوانين والمعادلات السريعة:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedSummary.cheatSheet.map((rule, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-900 dark:text-indigo-200 font-mono text-center"
                      >
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-3xl">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا يوجد ملخص محدد حالياً
              </p>
            </div>
          )}

        </div>

        {/* Right Column: 3D Interactive Flip Flashcards Deck */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-200/80 dark:border-slate-800">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-cyan-600" />
                بطاقات الاستذكار 3D
              </h3>
              {activeCards.length > 0 && (
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {currentCardIndex + 1} من {activeCards.length}
                </span>
              )}
            </div>

            {activeCards.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  لا توجد بطاقات استذكار متوفرة لهذا الملخص.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 3D Flip Card Element */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="perspective-1000 w-full h-64 cursor-pointer group"
                >
                  <div
                    className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* Front Face: Question */}
                    <div className="absolute inset-0 w-full h-full rounded-3xl p-6 glass-panel bg-gradient-to-br from-indigo-500/10 via-cyan-500/5 to-slate-100 dark:to-slate-800 border-2 border-indigo-500/30 flex flex-col justify-between backface-hidden shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2.5 py-0.5 rounded-full">
                          السؤال / المفهوم
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          اضغط للقلب والاطلاع على الإجابة
                        </span>
                      </div>

                      <div className="my-auto text-center">
                        <p className="text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">
                          {currentCard?.question}
                        </p>
                      </div>

                      <div className="text-center text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center gap-1">
                        <RotateCw className="w-3 h-3" />
                        <span>انقر كرت الاستذكار للقلب</span>
                      </div>
                    </div>

                    {/* Back Face: Answer */}
                    <div className="absolute inset-0 w-full h-full rounded-3xl p-6 glass-panel bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-slate-100 dark:to-slate-800 border-2 border-emerald-500/30 flex flex-col justify-between backface-hidden rotate-y-180 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
                          الإجابة والتوضيح
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          اضغط للعودة للسؤال
                        </span>
                      </div>

                      <div className="my-auto text-center">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                          {currentCard?.answer}
                        </p>
                      </div>

                      <div className="text-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ممتاز! هل حفظت هذه المعلومة؟
                      </div>
                    </div>

                  </div>
                </div>

                {/* Card Controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePrevCard}
                    className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-xs flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>البطاقة السابقة</span>
                  </button>

                  <button
                    onClick={handleNextCard}
                    className="p-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all font-bold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <span>البطاقة التالية</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* Generate Summary Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl space-y-4 relative animate-fadeIn border border-cyan-500/30 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-600" />
                توليد وتخصيص ملخص دراسي ذكي
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleGenerateSummary} className="space-y-4">
              {contentItems.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1.5">
                  <label className="block text-xs font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    اختيار مادة من مكتبتك المرفوعة (اختياري)
                  </label>
                  <select
                    value={selectedContentId}
                    onChange={(e) => handleSelectContentItem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- أدخل موضوع حر أو حدد من مكتبتك --</option>
                    {contentItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.topic} {item.chapter ? `- ${item.chapter}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  موضوع الملخص المراد إنشاؤه
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="مثال: تفاعلات الأكسدة والاختزال"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المادة الدراسية
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: الكيمياء"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الشابتر / الفصل
                  </label>
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="مثال: الشابتر 2"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Detail Level selector */}
              <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>عمق ونمط التلخيص المطلوب:</span>
                </label>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'deep', label: 'شامل ومحاور' },
                    { id: 'standard', label: 'قياسي متوازن' },
                    { id: 'bullet', label: 'موجز امتحاني' }
                  ].map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setDetailLevel(level.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                        detailLevel === level.id
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Instructions Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
                  توجيهات أو شروط خاصة للذكاء الاصطناعي (اختياري)
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="مثال: ركز على القوانين والتطبيقات الرياضية"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Image & Document Attachment Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-cyan-600" />
                    إرفاق صور الدرس أو صفحات الكتاب أو المستندات (Gemini Vision)
                  </span>
                  {modalAttachments.length > 0 && (
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-extrabold bg-cyan-500/10 px-2 py-0.5 rounded-full">
                      {modalAttachments.length} مرفق
                    </span>
                  )}
                </label>

                <div className="border-2 border-dashed border-cyan-500/30 dark:border-cyan-500/20 rounded-2xl p-4 text-center hover:border-cyan-500 transition-all bg-cyan-500/5 cursor-pointer relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt"
                    onChange={handleModalFilesSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <ImageIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    اسحب وأسقط صور الكتاب/الدفتر أو اضغط للرفع
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    يستخدم نموذج Gemini 3.1 Pro للتحليل البصري الدقيق واستخراج المعلومات
                  </p>
                </div>

                {modalAttachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1 max-h-36 overflow-y-auto">
                    {modalAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {att.previewUrl ? (
                            <img src={att.previewUrl} alt={att.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-cyan-600 shrink-0" />
                          )}
                          <span className="truncate text-[11px] font-semibold text-slate-800 dark:text-slate-200">{att.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveModalAttachment(att.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'جاري توليد الملخص والبطاقات...' : 'توليد الملخص الآن'}</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Edit Summary Modal */}
      {editingSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl space-y-5 relative animate-fadeIn border border-indigo-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                تعديل محتوى الملخص
              </h3>
              <button
                onClick={() => setEditingSummary(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveEditSummary} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان الملخص
                </label>
                <input
                  type="text"
                  value={editSumTitle}
                  onChange={(e) => setEditSumTitle(e.target.value)}
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
                    value={editSumSubject}
                    onChange={(e) => setEditSumSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الفصل / الشابتر
                  </label>
                  <input
                    type="text"
                    value={editSumChapter}
                    onChange={(e) => setEditSumChapter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نص الملخص الرئيسي
                </label>
                <textarea
                  rows={4}
                  value={editSumText}
                  onChange={(e) => setEditSumText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  النقاط الرئيسية (نقطة واحدة بكل سطر)
                </label>
                <textarea
                  rows={3}
                  value={editKeyPointsText}
                  onChange={(e) => setEditKeyPointsText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSummary(null)}
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

      {/* Full Reader Mode Modal */}
      {isReaderModalOpen && selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl p-6 sm:p-8 rounded-3xl space-y-6 relative border border-slate-200 dark:border-slate-800 my-8 shadow-2xl">
            
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      {selectedSummary.subject}
                    </span>
                    {selectedSummary.chapter && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {selectedSummary.chapter}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedSummary.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSummaryFile(selectedSummary)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="تحميل كملف منسق"
                >
                  <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">تحميل كملف منسق</span>
                </button>

                <button
                  onClick={() => handleExportPDF(selectedSummary)}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="تصدير الملخص كملف PDF منظم للطباعة والحفظ"
                >
                  <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">تصدير PDF / طباعة</span>
                </button>

                <button
                  onClick={() => setIsReaderModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
              
              {/* Main Executive Summary */}
              <div className="p-5 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/20 space-y-2">
                <h3 className="text-sm font-extrabold text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  الملخص التنفيذي والعنوان الشامل
                </h3>
                <FormattedMarkdown content={selectedSummary.summaryText} />
              </div>

              {/* Sections Breakdown */}
              {selectedSummary.sections && selectedSummary.sections.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-600" />
                    المحاور التفصيلية والعناوين الفرعية
                  </h3>
                  <div className="space-y-4">
                    {selectedSummary.sections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <h4 className="text-sm font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-cyan-500 shrink-0" />
                          <span>{sec.heading}</span>
                        </h4>
                        <FormattedMarkdown content={sec.content} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways / Points */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-cyan-600" />
                  النقاط الجوهرية ونواتج التعلم
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedSummary.keyPoints || []).map((point, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cheat Sheet */}
              {selectedSummary.cheatSheet && selectedSummary.cheatSheet.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    روشتة القوانين والمعادلات السريعة
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedSummary.cheatSheet.map((rule, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200 font-mono text-center"
                      >
                        {rule}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsReaderModalOpen(false)}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-all"
              >
                إغلاق وضع القراءة
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
