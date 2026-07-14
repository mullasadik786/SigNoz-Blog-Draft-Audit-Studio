import React, { useState, useMemo } from "react";
import { Edit3, Eye, Code, Copy, Check, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { INSTRUMENTATION_TEMPLATES, SAMPLE_BAD_BLOG, SAMPLE_GOOD_BLOG } from "../data";
import { TRANSLATIONS, SupportedLanguage } from "../translations";

interface DraftWorkspaceProps {
  title: string;
  setTitle: (t: string) => void;
  content: string;
  setContent: (c: string) => void;
  onAudit: () => void;
  isAuditing: boolean;
  saveStatus: string;
  lang: SupportedLanguage;
  isDarkMode?: boolean;
}

export default function DraftWorkspace({
  title,
  setTitle,
  content,
  setContent,
  onAudit,
  isAuditing,
  saveStatus,
  lang,
  isDarkMode = false,
}: DraftWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview" | "code">("write");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);

  const t = TRANSLATIONS[lang];

  // Calculate stats
  const wordCount = useMemo(() => {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).length;
  }, [content]);

  // Guidelines helper
  const wordCountFeedback = useMemo(() => {
    if (wordCount === 0) {
      return { text: t.wordCountFeedback_empty, color: "text-slate-400", barColor: "bg-slate-200" };
    }
    if (wordCount < 500) {
      return { text: t.wordCountFeedback_short, color: "text-amber-600", barColor: "bg-amber-500" };
    }
    if (wordCount >= 500 && wordCount < 1000) {
      return { text: t.wordCountFeedback_medium, color: "text-indigo-600", barColor: "bg-indigo-500" };
    }
    if (wordCount >= 1000 && wordCount <= 1500) {
      return { text: t.wordCountFeedback_perfect, color: "text-emerald-600", barColor: "bg-emerald-500" };
    }
    return { text: t.wordCountFeedback_long, color: "text-slate-500", barColor: "bg-slate-400" };
  }, [wordCount, t, lang]);

  const loadExample = (type: "good" | "bad") => {
    const confirmMsg = lang === "te" 
      ? `మీరు ఖచ్చితంగా ${type === "good" ? "మంచి" : "సాధారణ"} నమూనాను లోడ్ చేయాలనుకుంటున్నారా? ఇది మీ ప్రస్తుత డ్రాఫ్ట్‌ను భర్తీ చేస్తుంది.`
      : lang === "hi"
      ? `क्या आप वाकई ${type === "good" ? "अच्छा" : "कमजोर"} नमूना लोड करना चाहते हैं? यह आपके वर्तमान ड्राफ्ट को अधिलेखित कर देगा।`
      : `Are you sure you want to load the ${type} sample? This will overwrite your current draft.`;

    if (confirm(confirmMsg)) {
      if (type === "good") {
        setTitle(SAMPLE_GOOD_BLOG.title);
        setContent(SAMPLE_GOOD_BLOG.content);
      } else {
        setTitle(SAMPLE_BAD_BLOG.title);
        setContent(SAMPLE_BAD_BLOG.content);
      }
      setActiveTab("write");
    }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Safe and clean custom Markdown Parser matching Elegant Light and Dark
  const parsedMarkdownElements = useMemo(() => {
    if (!content.trim()) return [<p key="empty" className={`text-sm italic ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>No content written yet.</p>];
 
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let codeBlockBuffer: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
 
    const flushCodeBlock = (key: number) => {
      if (codeBlockBuffer.length > 0) {
        elements.push(
          <div key={`code-${key}`} className={`relative group my-4 rounded-lg overflow-hidden border font-mono text-xs shadow-inner transition-colors duration-200 ${isDarkMode ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
            <div className={`flex items-center justify-between px-4 py-2 border-b text-[10px] uppercase font-bold tracking-wider transition-colors duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
              <span>{codeLanguage || "code"}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(codeBlockBuffer.join("\n"));
                  alert("Code block copied!");
                }}
                className={`transition-colors flex items-center gap-1 cursor-pointer ${isDarkMode ? "text-slate-500 hover:text-indigo-400" : "text-slate-500 hover:text-indigo-600"}`}
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className={`p-4 overflow-x-auto whitespace-pre leading-relaxed font-mono transition-colors duration-200 ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
              <code>{codeBlockBuffer.join("\n")}</code>
            </pre>
          </div>
        );
        codeBlockBuffer = [];
      }
    };
 
    lines.forEach((line, index) => {
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          flushCodeBlock(index);
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
        }
        return;
      }
 
      if (inCodeBlock) {
        codeBlockBuffer.push(line);
        return;
      }
 
      const inlineParse = (text: string) => {
        let formatted = text;
        // Bold
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        // Italics
        formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
        // Inline code
        formatted = formatted.replace(/`(.*?)`/g, `<code class="px-1.5 py-0.5 rounded border font-mono text-xs ${isDarkMode ? 'bg-slate-950 border-slate-800 text-indigo-400' : 'bg-slate-100 border-slate-200 text-indigo-600'}">$1</code>`);
        return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
      };
 
      const imageMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
        const alt = imageMatch[1];
        const url = imageMatch[2];
        elements.push(
          <div key={index} className={`my-6 rounded-2xl overflow-hidden border shadow-sm p-1 transition-colors duration-200 ${isDarkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-100/50"}`}>
            <img src={url} alt={alt} className="w-full h-auto rounded-xl object-cover max-h-[440px]" referrerPolicy="no-referrer" />
            {alt && <div className={`px-4 py-2 text-xs text-center italic font-medium transition-colors duration-200 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{alt}</div>}
          </div>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h4 key={index} className={`text-sm font-bold mt-5 mb-2 leading-tight flex items-center gap-2 transition-colors duration-200 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
            {inlineParse(line.slice(4))}
          </h4>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h3 key={index} className={`text-base font-bold mt-6 mb-3 border-b pb-1.5 leading-tight transition-colors duration-200 ${isDarkMode ? "text-slate-100 border-slate-800" : "text-slate-900 border-slate-100"}`}>
            {inlineParse(line.slice(3))}
          </h3>
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <h2 key={index} className={`text-lg font-bold mt-8 mb-4 border-b pb-2 leading-tight transition-colors duration-200 ${isDarkMode ? "text-indigo-400 border-slate-800" : "text-indigo-600 border-indigo-50"}`}>
            {inlineParse(line.slice(2))}
          </h2>
        );
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={index} className={`text-sm ml-5 list-disc leading-relaxed mb-1.5 transition-colors duration-200 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            {inlineParse(line.slice(2))}
          </li>
        );
      } else if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={index} className={`border-l-4 border-indigo-500 px-4 py-2.5 my-3 rounded-r text-sm italic leading-relaxed transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-300" : "bg-indigo-50/50 text-slate-700"}`}>
            {inlineParse(line.slice(2))}
          </blockquote>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={index} className="h-2" />);
      } else {
        elements.push(
          <p key={index} className={`text-sm leading-relaxed mb-3.5 transition-colors duration-200 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            {inlineParse(line)}
          </p>
        );
      }
    });
 
    if (inCodeBlock) {
      flushCodeBlock(lines.length);
    }
 
    return elements;
  }, [content, isDarkMode]);

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-xl flex flex-col h-[740px] transition-all duration-300 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
      
      {/* Editor Header / Tabs */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b transition-colors ${isDarkMode ? "border-slate-800 bg-slate-900/90 text-slate-300" : "border-slate-100 bg-slate-50/80"}`}>
        <div className={`flex items-center gap-1 p-1 rounded-xl transition-colors ${isDarkMode ? "bg-slate-950/60" : "bg-slate-200/60"}`}>
          <button
            onClick={() => setActiveTab("write")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "write"
                ? (isDarkMode ? "bg-slate-800 text-indigo-400 shadow-sm shadow-slate-950/50" : "bg-white text-indigo-600 shadow-sm")
                : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-800")
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> {t.writeTab}
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "preview"
                ? (isDarkMode ? "bg-slate-800 text-indigo-400 shadow-sm shadow-slate-950/50" : "bg-white text-indigo-600 shadow-sm")
                : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-800")
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> {t.previewTab}
          </button>
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "code"
                ? (isDarkMode ? "bg-slate-800 text-indigo-400 shadow-sm shadow-slate-950/50" : "bg-white text-indigo-600 shadow-sm")
                : (isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-800")
            }`}
          >
            <Code className="w-3.5 h-3.5" /> {t.codeTab}
          </button>
        </div>
 
        {/* Load samples buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadExample("good")}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase border rounded-lg transition-all cursor-pointer shadow-sm ${
              isDarkMode 
                ? "bg-slate-850 border-slate-800 hover:border-indigo-850 text-indigo-400 hover:bg-slate-800" 
                : "bg-white border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.loadGoodBtn}
          </button>
          <button
            onClick={() => loadExample("bad")}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase border rounded-lg transition-all cursor-pointer shadow-sm ${
              isDarkMode 
                ? "bg-slate-850 border-slate-800 hover:border-rose-850 text-rose-400 hover:bg-slate-800" 
                : "bg-white border-slate-200 hover:border-rose-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.loadBadBtn}
          </button>
        </div>
      </div>
 
      {/* Editor Body */}
      <div className={`flex-1 overflow-y-auto p-5 transition-colors ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
        {activeTab === "write" && (
          <div className="flex flex-col h-full space-y-4">
            <div>
              <input
                type="text"
                placeholder={lang === "te" ? "బ్లాగ్ శీర్షిక రాయండి..." : "Blog Title (e.g. How I Instrumented My Node App with OpenTelemetry...)"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 transition-all shadow-inner ${
                  isDarkMode 
                    ? "bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600 focus:ring-indigo-500/10 focus:border-indigo-750" 
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
            </div>
            <div className="flex-1 flex flex-col min-h-[350px]">
              <textarea
                placeholder={lang === "te" ? "మీ అనుభవాలు మరియు కోడ్ ఇక్కడ రాయండి..." : "Write your blog post in Markdown here... Use headings (##), code blocks (```), list items (-), and make it personal! Avoid ChatGPT phrases."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full flex-1 border rounded-xl p-4 text-xs font-mono focus:outline-none focus:ring-2 transition-all resize-none leading-relaxed shadow-inner ${
                  isDarkMode 
                    ? "bg-slate-950 border-slate-800 text-slate-300 placeholder-slate-600 focus:ring-indigo-500/10 focus:border-indigo-750" 
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
            </div>
          </div>
        )}
 
        {activeTab === "preview" && (
          <div className={`max-w-none h-full prose ${isDarkMode ? "prose-invert" : "prose-slate"}`}>
            <div className={`border-b pb-3 mb-5 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <h2 className={`text-lg font-black tracking-tight uppercase ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                {title || <span className="text-slate-400 italic">Untitled Blog Post</span>}
              </h2>
              <div className="flex gap-4 mt-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                <span>By Operational Unit</span>
                <span>•</span>
                <span>{wordCount} words</span>
              </div>
            </div>
            <div className="space-y-1 font-sans">
              {parsedMarkdownElements}
            </div>
          </div>
        )}
 
        {activeTab === "code" && (
          <div className="space-y-4 h-full">
            <div className={`p-4 border rounded-xl ${isDarkMode ? "bg-indigo-950/20 border-indigo-900/35 text-indigo-300" : "bg-indigo-50 border-indigo-100 text-indigo-700"}`}>
              <h3 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Pre-Verified OpenTelemetry Blocks
              </h3>
              <p className={`text-[11px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Ground your blog in real, runnable code snippets to earn extra experience points. Copy these SDK configurations and write about your setup.
              </p>
            </div>
 
            <div className={`flex flex-wrap gap-1 border-b pb-2 ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              {INSTRUMENTATION_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTemplateIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    selectedTemplateIndex === idx
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isDarkMode
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
 
            <div className="space-y-2">
              <div>
                <h4 className={`text-xs font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{INSTRUMENTATION_TEMPLATES[selectedTemplateIndex].name}</h4>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {INSTRUMENTATION_TEMPLATES[selectedTemplateIndex].description}
                </p>
              </div>
 
              <div className={`relative group rounded-xl overflow-hidden border font-mono text-xs shadow-inner transition-colors ${isDarkMode ? "border-slate-850 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
                <div className={`flex items-center justify-between px-4 py-2 border-b text-[10px] uppercase font-bold tracking-wider transition-colors ${isDarkMode ? "bg-slate-900 border-slate-850 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                  <span>{INSTRUMENTATION_TEMPLATES[selectedTemplateIndex].language}</span>
                  <button
                    onClick={() => copyCode(INSTRUMENTATION_TEMPLATES[selectedTemplateIndex].code, selectedTemplateIndex)}
                    className={`transition-colors flex items-center gap-1 cursor-pointer font-mono ${isDarkMode ? "text-slate-500 hover:text-indigo-450" : "text-slate-500 hover:text-indigo-600"}`}
                  >
                    {copiedIndex === selectedTemplateIndex ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Snippet
                      </>
                    )}
                  </button>
                </div>
                <pre className={`p-4 overflow-x-auto whitespace-pre max-h-[250px] leading-relaxed font-mono transition-colors ${isDarkMode ? "text-slate-300" : "text-slate-800"}`}>
                  <code>{INSTRUMENTATION_TEMPLATES[selectedTemplateIndex].code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
 
      {/* Editor Footer / Stats & Audit Action */}
      <div className={`px-5 py-3.5 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${isDarkMode ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-slate-50/80"}`}>
        {/* Statistics and word count guidance */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className={`${wordCountFeedback.color} flex items-center gap-1 font-mono uppercase tracking-wider`}>
              {wordCountFeedback.text}
            </span>
            <span className={`font-mono ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              <strong>{wordCount}</strong> / 1500 words
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden shadow-inner transition-colors ${isDarkMode ? "bg-slate-950" : "bg-slate-200"}`}>
            <div
              className={`h-full transition-all duration-500 ${wordCountFeedback.barColor}`}
              style={{ width: `${Math.min(100, (wordCount / 1500) * 100)}%` }}
            ></div>
          </div>
        </div>
 
        {/* Audit Call to Action */}
        <div>
          <button
            onClick={onAudit}
            disabled={isAuditing || !content.trim()}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] bg-gradient-to-r from-pink-500 via-rose-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode ? "shadow-slate-950/40 hover:shadow-slate-950/85" : "shadow-pink-100 hover:shadow-pink-200"
            }`}
          >
            {isAuditing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t.auditingBtn}
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> {t.runAuditBtn}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
