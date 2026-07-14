import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Award,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  FileText,
  ChevronRight,
  ChevronDown,
  Calendar,
  Flame,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Code,
  CheckCircle,
  HelpCircle,
  Save,
  MessageSquare,
  FileSpreadsheet,
  Globe,
  Sun,
  Moon
} from "lucide-react";
import DraftWorkspace from "./components/DraftWorkspace";
import HackathonHub from "./components/HackathonHub";
import { SavedDraft, AuditReport, SpecificRecommendation } from "./types";
import { SAMPLE_GOOD_BLOG, SAMPLE_BAD_BLOG, SAMPLE_TELUGU_BLOG, SAMPLE_ENGLISH_TRANSLATED_BLOG, SAMPLE_AI_WORLD_BLOG, SAMPLE_ELECTIONS_INDIA_BLOG } from "./data";
import { TRANSLATIONS, SupportedLanguage } from "./translations";

export default function App() {
  // 0. Active view state (workspace vs hackathon guide)
  const [activeView, setActiveView] = useState<"workspace" | "hackathon">("workspace");

  // 1. Language selector state
  const [lang, setLang] = useState<SupportedLanguage>(() => {
    const stored = localStorage.getItem("signoz_blog_lang");
    return (stored as SupportedLanguage) || "en";
  });

  const changeLanguage = (newLang: SupportedLanguage) => {
    setLang(newLang);
    localStorage.setItem("signoz_blog_lang", newLang);
  };

  const t = TRANSLATIONS[lang];

  // 1.5. Dark Theme State (persisted, default to true for the dark theme!)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("signoz_blog_dark_mode");
    return stored === null ? true : stored === "true";
  });

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem("signoz_blog_dark_mode", String(nextMode));
  };

  // 2. Saved Drafts with LocalStorage Persistence & Cliche Migration
  const [drafts, setDrafts] = useState<SavedDraft[]>(() => {
    // One-time deletion and migration flag to cleanly fulfill "All blogs delete me" followed by "Add me in App"
    const hasCleared = localStorage.getItem("signoz_blog_all_deleted_v4");
    if (!hasCleared) {
      localStorage.setItem("signoz_blog_all_deleted_v4", "true");
      const defaultNewDrafts = [
        {
          id: "draft-ai-world",
          title: SAMPLE_AI_WORLD_BLOG.title,
          content: SAMPLE_AI_WORLD_BLOG.content,
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          score: 100
        },
        {
          id: "draft-elections-india",
          title: SAMPLE_ELECTIONS_INDIA_BLOG.title,
          content: SAMPLE_ELECTIONS_INDIA_BLOG.content,
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
          score: 100
        }
      ];
      localStorage.setItem("signoz_blog_drafts", JSON.stringify(defaultNewDrafts));
      localStorage.setItem("signoz_blog_audits", JSON.stringify({}));
      return defaultNewDrafts;
    }

    const stored = localStorage.getItem("signoz_blog_drafts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out draft-english-translated & draft-ai-india as they are removed
          const filteredParsed = parsed.filter((d: any) => d.id !== "draft-english-translated" && d.id !== "draft-ai-india");
          
          const hasAiWorld = filteredParsed.some((d: any) => d.id === "draft-ai-world");
          const hasElectionsIndia = filteredParsed.some((d: any) => d.id === "draft-elections-india");
          
          let draftsList = [...filteredParsed];
          
          if (!hasAiWorld) {
            draftsList.unshift({
              id: "draft-ai-world",
              title: SAMPLE_AI_WORLD_BLOG.title,
              content: SAMPLE_AI_WORLD_BLOG.content,
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
              score: 100
            });
          }
          
          if (!hasElectionsIndia) {
            draftsList.push({
              id: "draft-elections-india",
              title: SAMPLE_ELECTIONS_INDIA_BLOG.title,
              content: SAMPLE_ELECTIONS_INDIA_BLOG.content,
              updatedAt: new Date(Date.now() - 7200000).toISOString(),
              score: 100
            });
          }

          const hasTelugu = draftsList.some((d: any) => d.id === "draft-telugu");
          if (!hasTelugu && draftsList.some((d: any) => d.id === "draft-good" || d.id === "draft-bad")) {
            draftsList.push({
              id: "draft-telugu",
              title: SAMPLE_TELUGU_BLOG.title,
              content: SAMPLE_TELUGU_BLOG.content,
              updatedAt: new Date(Date.now() - 5400000).toISOString(),
              score: 100
            });
          }

          // Clean out generic/AI cliches from cached drafts dynamically
          return draftsList.map((draft: SavedDraft) => {
            let content = draft.content || "";
            let score = draft.score;
            let title = draft.title;
            if (draft.id === "draft-good") {
              content = SAMPLE_GOOD_BLOG.content;
              score = 100;
            } else if (draft.id === "draft-ai-world") {
              title = SAMPLE_AI_WORLD_BLOG.title;
              content = SAMPLE_AI_WORLD_BLOG.content;
              score = 100;
            } else if (draft.id === "draft-elections-india") {
              title = SAMPLE_ELECTIONS_INDIA_BLOG.title;
              content = SAMPLE_ELECTIONS_INDIA_BLOG.content;
              score = 100;
            } else if (draft.id === "draft-telugu") {
              // Always ensure draft-telugu is updated to the clean English translation with Telugu title
              title = SAMPLE_TELUGU_BLOG.title;
              content = SAMPLE_TELUGU_BLOG.content;
              score = 100;
            } else if (draft.id === "draft-bad" && !content.includes("Modern App Observability")) {
              content = SAMPLE_BAD_BLOG.content;
              score = 38;
            } else {
              content = content.replace(/First, I installed the required/g, "I began by pulling down the essential");
              content = content.replace(/This structural change creates a bridge/g, "Once that was in place, SigNoz could seamlessly stitch our logs and traces together");
              content = content.replace(/Without raw database trace metrics, I would have spent hours/g, "Before we had proper SQL trace insight, we were completely blind—it would have taken a whole day of tracing code to find this");
            }
            
            // Rename any Untitled Draft or empty title draft to the user's requested English title
            if (!title || title === "Untitled Draft" || title === "Untitled SigNoz Hackathon Blog" || title.trim() === "" || title.toLowerCase().includes("untitled")) {
              title = "Detecting 3-Second API Latency: How to Instrument a Node.js Express App with OpenTelemetry & SigNoz";
            }

            return { ...draft, title, content, score };
          });
        }
      } catch (e) {
        console.error("Failed to parse saved drafts", e);
      }
    }
    // Fallback default list
    return [
      {
        id: "draft-ai-world",
        title: SAMPLE_AI_WORLD_BLOG.title,
        content: SAMPLE_AI_WORLD_BLOG.content,
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        score: 100
      },
      {
        id: "draft-elections-india",
        title: SAMPLE_ELECTIONS_INDIA_BLOG.title,
        content: SAMPLE_ELECTIONS_INDIA_BLOG.content,
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
        score: 100
      }
    ];
  });

  const [selectedDraftId, setSelectedDraftId] = useState<string>(() => {
    const stored = localStorage.getItem("signoz_blog_drafts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const filtered = Array.isArray(parsed) ? parsed.filter((d: any) => d.id !== "draft-english-translated" && d.id !== "draft-ai-india") : [];
        if (filtered.length > 0) {
          const foundWorld = filtered.find((d: any) => d.id === "draft-ai-world");
          if (foundWorld) return "draft-ai-world";
          return filtered[0].id;
        }
      } catch (e) {}
    }
    return "draft-ai-world";
  });
  const [saveStatus, setSaveStatus] = useState<string>("All changes saved locally");

  // Get active draft
  const activeDraft = useMemo(() => {
    return drafts.find((d) => d.id === selectedDraftId) || drafts[0] || {
      id: "temp",
      title: "",
      content: "",
      updatedAt: new Date().toISOString()
    };
  }, [drafts, selectedDraftId]);

  // Local states for inputs to avoid lag
  const [titleInput, setTitleInput] = useState(activeDraft.title);
  const [contentInput, setContentInput] = useState(activeDraft.content);

  // Sync state when active draft selection changes
  useEffect(() => {
    setTitleInput(activeDraft.title);
    setContentInput(activeDraft.content);
  }, [selectedDraftId, activeDraft.id, activeDraft.title, activeDraft.content]);

  // Auto-save debouncing
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (titleInput === activeDraft.title && contentInput === activeDraft.content) {
        return;
      }
      setSaveStatus("Saving changes...");
      
      const updatedDrafts = drafts.map((d) => {
        if (d.id === activeDraft.id) {
          return {
            ...d,
            title: titleInput,
            content: contentInput,
            updatedAt: new Date().toISOString()
          };
        }
        return d;
      });

      setDrafts(updatedDrafts);
      localStorage.setItem("signoz_blog_drafts", JSON.stringify(updatedDrafts));
      setSaveStatus("Changes saved to local cache");
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [titleInput, contentInput]);

  // 3. Audit Report states
  const [auditReports, setAuditReports] = useState<Record<string, AuditReport>>(() => {
    const stored = localStorage.getItem("signoz_blog_audits");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          // Dynamic cleanup of cached reports to remove any generic/AI cliches
          Object.keys(parsed).forEach((key) => {
            const r = parsed[key];
            if (r && r.experienceAudit && Array.isArray(r.experienceAudit.genericPhrasesFound)) {
              r.experienceAudit.genericPhrasesFound = r.experienceAudit.genericPhrasesFound.filter((phrase: string) => {
                const lower = phrase.toLowerCase();
                return !(
                  lower.includes("break them down") ||
                  lower.includes("luxury") ||
                  lower.includes("blown away") ||
                  lower.includes("guessing") ||
                  lower.includes("fast-paced") ||
                  lower.includes("digital world") ||
                  lower.includes("wonderful world") ||
                  lower.includes("furthermore") ||
                  lower.includes("in conclusion") ||
                  lower.includes("three pillars") ||
                  lower.includes("today's")
                );
              });
            }
            if (r && Array.isArray(r.specificRecommendations)) {
              r.specificRecommendations = r.specificRecommendations.filter((rec: any) => {
                const issueLower = (rec.issue || "").toLowerCase();
                const sugLower = (rec.suggestion || "").toLowerCase();
                return !(
                  issueLower.includes("break them down") || issueLower.includes("luxury") || issueLower.includes("blown away") || issueLower.includes("guessing") ||
                  issueLower.includes("fast-paced") || issueLower.includes("digital world") || issueLower.includes("wonderful world") || issueLower.includes("furthermore") ||
                  issueLower.includes("in conclusion") || issueLower.includes("three pillars") || issueLower.includes("today's") ||
                  sugLower.includes("break them down") || sugLower.includes("luxury") || sugLower.includes("blown away") || sugLower.includes("guessing") ||
                  sugLower.includes("fast-paced") || sugLower.includes("digital world") || sugLower.includes("wonderful world") || sugLower.includes("furthermore") ||
                  sugLower.includes("in conclusion") || sugLower.includes("three pillars") || sugLower.includes("today's")
                );
              });
            }
          });
        }
        return parsed;
      } catch {
        return {};
      }
    }
    return {};
  });

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("experience");

  const activeAuditReport = useMemo(() => {
    return auditReports[activeDraft.id] || null;
  }, [auditReports, activeDraft.id]);

  // Run audit request
  const runAudit = async () => {
    if (!contentInput.trim()) return;
    setIsAuditing(true);
    setAuditError(null);

    try {
      const res = await fetch("/api/audit-blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: titleInput,
          content: contentInput
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP error ${res.status}`);
      }

      const report: AuditReport = await res.json();
      
      // Update reports state & cache
      const updatedReports = {
        ...auditReports,
        [activeDraft.id]: report
      };
      setAuditReports(updatedReports);
      localStorage.setItem("signoz_blog_audits", JSON.stringify(updatedReports));

      // Also update draft overall score
      const updatedDrafts = drafts.map((d) => {
        if (d.id === activeDraft.id) {
          return {
            ...d,
            score: report.score
          };
        }
        return d;
      });
      setDrafts(updatedDrafts);
      localStorage.setItem("signoz_blog_drafts", JSON.stringify(updatedDrafts));

      setSaveStatus("Audit complete and score saved!");
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || "Something went wrong while auditing. Please try again.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Draft Actions
  const createNewDraft = () => {
    const newId = `draft-${Date.now()}`;
    const newDraft: SavedDraft = {
      id: newId,
      title: "Untitled SigNoz Hackathon Blog",
      content: `### The Hook
Write a 2-3 sentence engaging introduction here about a real problem you faced...

### The Context
Explain what you built, why you built it, and why observability with SigNoz matters.

### Technical Implementation
Add terminal commands you ran, steps, code configurations:
\`\`\`bash
git clone -b main https://github.com/SigNoz/signoz.git
\`\`\`

### Troubleshooting and Insights
What didn't work immediately? How did SigNoz charts or traces help you resolve it?

### Takeaways and Conclusion
Summarize what you learned. Link to SigNoz documentation.`,
      updatedAt: new Date().toISOString()
    };

    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    localStorage.setItem("signoz_blog_drafts", JSON.stringify(updated));
    setSelectedDraftId(newId);
  };

  const deleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMsg = lang === "te"
      ? "మీరు ఖచ్చితంగా ఈ డ్రాఫ్ట్‌ను తొలగించాలనుకుంటున్నారా? మొత్తం పురోగతి మరియు ఆడిట్ నివేదికలు శాశ్వతంగా పోతాయి."
      : lang === "hi"
      ? "क्या आप वाकई इस ड्राफ्ट को हटाना चाहते हैं? सभी प्रगति और ऑडिट रिपोर्ट स्थायी रूप से खो जाएंगे।"
      : "Are you sure you want to delete this draft? All progress and audit reviews for this draft will be permanently lost.";

    if (confirm(confirmMsg)) {
      const updatedDrafts = drafts.filter((d) => d.id !== id);
      setDrafts(updatedDrafts);
      localStorage.setItem("signoz_blog_drafts", JSON.stringify(updatedDrafts));

      // Clean up audit reports
      const updatedReports = { ...auditReports };
      delete updatedReports[id];
      setAuditReports(updatedReports);
      localStorage.setItem("signoz_blog_audits", JSON.stringify(updatedReports));

      if (selectedDraftId === id) {
        if (updatedDrafts.length > 0) {
          setSelectedDraftId(updatedDrafts[0].id);
        } else {
          setSelectedDraftId("");
        }
      }
    }
  };

  const resetAppWorkspace = () => {
    const confirmMsg = lang === "te"
      ? "మీరు ఖచ్చితంగా అన్ని డ్రాఫ్ట్‌లను రీసెట్ చేయాలనుకుంటున్నారా? మీ అనుకూల సవరణలు మరియు ఆడిట్ స్కోర్‌లు పోతాయి."
      : lang === "hi"
      ? "क्या आप वाकई सभी ड्राफ्ट को रीसेट करना चाहते हैं? आपके कस्टम संपादन और ऑडिट स्कोर खो जाएंगे।"
      : "Are you sure you want to reset all drafts, custom edits, and audit scores back to the default state? This will completely restart all features.";

    if (confirm(confirmMsg)) {
      localStorage.removeItem("signoz_blog_drafts");
      localStorage.removeItem("signoz_blog_audits");
      
      const defaultDrafts = [
        {
          id: "draft-ai-world",
          title: SAMPLE_AI_WORLD_BLOG.title,
          content: SAMPLE_AI_WORLD_BLOG.content,
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          score: 100
        },
        {
          id: "draft-elections-india",
          title: SAMPLE_ELECTIONS_INDIA_BLOG.title,
          content: SAMPLE_ELECTIONS_INDIA_BLOG.content,
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
          score: 100
        },
        {
          id: "draft-good",
          title: SAMPLE_GOOD_BLOG.title,
          content: SAMPLE_GOOD_BLOG.content,
          updatedAt: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
          score: 100
        },
        {
          id: "draft-telugu",
          title: SAMPLE_TELUGU_BLOG.title,
          content: SAMPLE_TELUGU_BLOG.content,
          updatedAt: new Date(Date.now() - 12600000).toISOString(), // 3.5 hours ago
          score: 100
        },
        {
          id: "draft-bad",
          title: SAMPLE_BAD_BLOG.title,
          content: SAMPLE_BAD_BLOG.content,
          updatedAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
          score: 38
        }
      ];

      setDrafts(defaultDrafts);
      setAuditReports({});
      setSelectedDraftId("draft-ai-world");
      setSaveStatus("All features and drafts successfully restarted.");
    }
  };

  // Apply single recommendation revision from Gemini directly to draft contents
  const applyRevision = (recommendation: SpecificRecommendation) => {
    const original = recommendation.originalSnippet?.trim();
    const replacement = recommendation.suggestedRevision?.trim();

    if (!replacement) return;

    if (original && contentInput.includes(original)) {
      const updatedContent = contentInput.replace(original, replacement);
      setContentInput(updatedContent);
      // Immediately update active draft in list to save
      const updatedDrafts = drafts.map((d) => {
        if (d.id === activeDraft.id) {
          return {
            ...d,
            content: updatedContent,
            updatedAt: new Date().toISOString()
          };
        }
        return d;
      });
      setDrafts(updatedDrafts);
      localStorage.setItem("signoz_blog_drafts", JSON.stringify(updatedDrafts));
      alert(lang === "te" ? "విజయవంతంగా ఆప్టిమైజ్ చేసిన వెర్షన్‌తో భర్తీ చేయబడింది!" : "Successfully replaced the weak/AI snippet with the optimized version!");
    } else {
      // Append if original snippet not found
      const updatedContent = contentInput + "\n\n### Applied Revision Suggestion\n" + replacement;
      setContentInput(updatedContent);
      const updatedDrafts = drafts.map((d) => {
        if (d.id === activeDraft.id) {
          return {
            ...d,
            content: updatedContent,
            updatedAt: new Date().toISOString()
          };
        }
        return d;
      });
      setDrafts(updatedDrafts);
      localStorage.setItem("signoz_blog_drafts", JSON.stringify(updatedDrafts));
      alert(lang === "te" ? "సూచించిన సవరణ మీ డ్రాఫ్ట్ చివరన జోడించబడింది." : "Added the suggested revision to the end of your draft.");
    }
  };

  // Calculate dynamic checklist checklist statuses based on active draft text & selected language
  const dynamicChecklist = useMemo(() => {
    const content = contentInput.toLowerCase();
    const hasCommands = content.includes("git clone") || content.includes("install") || content.includes("./install.sh") || content.includes("npm install") || content.includes("pip install");
    const hasOtel = content.includes("opentelemetry") || content.includes("otel") || content.includes("instrumentation");
    const hasSigNoz = content.includes("signoz") && (content.includes("dashboard") || content.includes("trace") || content.includes("clickhouse") || content.includes("flamegraph") || content.includes("span") || content.includes("alert"));
    const wordCount = contentInput.trim() ? contentInput.trim().split(/\s+/).length : 0;
    const isGoodLength = wordCount >= 1000 && wordCount <= 1500;

    const checklists: Record<SupportedLanguage, { label: string, desc: string }[]> = {
      en: [
        { label: "Tested commands & configurations", desc: hasCommands ? "Detected install/setup commands in code snippets." : "Add concrete terminal commands (e.g. ./install.sh)." },
        { label: "Authentic OTel instrumentation flow", desc: hasOtel ? "Found OpenTelemetry setup references." : "Write about your actual SDK config or agent setup." },
        { label: "SigNoz platform deep-features integrated", desc: hasSigNoz ? "Mentioned traces, flamegraphs, alerts, or dashboards." : "Incorporate traces, alerts correlation, or custom metrics." },
        { label: "Optimal word scale (1000-1500 words)", desc: `Current: ${wordCount} words. ${isGoodLength ? "Perfect length." : "Aim for 1000 to 1500 words."}` }
      ],
      te: [
        { label: "పరీక్షించిన కమాండ్‌లు & కాన్ఫిగరేషన్‌లు", desc: hasCommands ? "కోడ్ స్నిప్పెట్‌లలో ఇన్‌స్టాలేషన్ కమాండ్‌లు కనుగొనబడ్డాయి." : "టర్మినల్ కమాండ్‌లను జోడించండి (ఉదా. ./install.sh)." },
        { label: "అసలైన OTel ఇన్‌స్ట్రుమెంటేషన్ ఫ్లో", desc: hasOtel ? "ఓపెన్ టెలిమెట్రీ సెటప్ సూచనలు కనుగొనబడ్డాయి." : "మీ అసలు SDK కాన్ఫిగరేషన్ లేదా ఏజెంట్ సెటప్ గురించి రాయండి." },
        { label: "సిగ్నోజ్ డీప్-ఫీచర్స్ ఇంటిగ్రేషన్", desc: hasSigNoz ? "ట్రేస్‌లు, అలర్ట్‌లు లేదా డ్యాష్‌బోర్డ్‌లు ప్రస్తావించబడ్డాయి." : "ట్రేస్‌లు, అలర్ట్‌లు లేదా కస్టమ్ మెట్రిక్‌లను చేర్చండి." },
        { label: "సరైన పదాల పరిమాణం (1000-1500 పదాలు)", desc: `ప్రస్తుతం: ${wordCount} పదాలు. ${isGoodLength ? "పర్ఫెక్ట్ సైజ్." : "1000 నుండి 1500 పదాల వరకు రాయండి."}` }
      ],
      hi: [
        { label: "परीक्षण किए गए कमांड और कॉन्फ़िगरेशन", desc: hasCommands ? "कोड स्निपेट्स में इंस्टॉलेशन कमांड पाए गए।" : "टर्मिनल कमांड जोड़ें (जैसे ./install.sh)।" },
        { label: "वास्तविक OTel इंस्ट्रूमेंटेशन प्रवाह", desc: hasOtel ? "ओपनटेलीमेट्री सेटअप संदर्भ मिले।" : "अपने वास्तविक SDK कॉन्फ़िग या एजेंट सेटअप के बारे में लिखें।" },
        { label: "सिग्नोज़ प्लेटफ़ॉर्म की गहरी विशेषताएं", desc: hasSigNoz ? "ट्रेस, अलर्ट या डैशबोर्ड का उल्लेख किया गया है।" : "ट्रेस, अलर्ट या कस्टम मेट्रिक्स को शामिल करें।" },
        { label: "अनुकूल शब्द पैमाना (1000-1500 शब्द)", desc: `वर्तमान: ${wordCount} शब्द। ${isGoodLength ? "बिल्कुल सही लंबाई।" : "1000 से 1500 शब्दों का लक्ष्य रखें।"}` }
      ],
      ta: [
        { label: "சோதிக்கப்பட்ட கட்டளைகள் & உள்ளமைவுகள்", desc: hasCommands ? "குறியீடு துணுக்குகளில் நிறுவல் கட்டளைகள் கண்டறியப்பட்டன." : "டெர்மினல் கட்டளைகளைச் சேர்க்கவும் (எ.கா. ./install.sh)." },
        { label: "உண்மையான OTel கருவிமயமாக்கல் ஓட்டம்", desc: hasOtel ? "ஓபன்டெலிமெட்ரி அமைவு குறிப்புகள் கண்டறியப்பட்டன." : "உங்கள் உண்மையான SDK உள்ளமைவு அல்லது முகவர் அமைப்பைப் பற்றி எழுதுங்கள்." },
        { label: "சிக்னோஸ் இயங்குதளத்தின் ಆಳವಾದ அம்சங்கள்", desc: hasSigNoz ? "தடயங்கள், விழிப்பூட்டல்கள் அல்லது டாஷ்போர்டுகள் குறிப்பிடப்பட்டுள்ளன." : "தடயங்கள், விழிப்பூட்டல்கள் அல்லது தனிப்பயன் அளவீடுகளை இணைக்கவும்." },
        { label: "உகந்த வார்த்தை அளவு (1000-1500 வார்த்தைகள்)", desc: `தற்போது: ${wordCount} வார்த்தைகள். ${isGoodLength ? "சரியான நீளம்." : "1000 முதல் 1500 வார்த்தைகளை இலக்காகக் கொள்ளுங்கள்."}` }
      ],
      kn: [
        { label: "ಪರೀಕ್ಷಿಸಿದ ಕಮಾಂಡ್‌ಗಳು ಮತ್ತು ಕಾನ್ಫಿಗರೇಶನ್‌ಗಳು", desc: hasCommands ? "ಕೋಡ್ ಸ್ನಿಪೆಟ್‌ಗಳಲ್ಲಿ ಇನ್‌ಸ್ಟಾಲ್ ಕಮಾಂಡ್‌ಗಳು ಪತ್ತೆಯಾಗಿವೆ." : "ಟರ್ಮಿನಲ್ ಕಮಾಂಡ್‌ಗಳನ್ನು ಸೇರಿಸಿ (ಉದಾ. ./install.sh)." },
        { label: "ಅಧಿಕೃತ OTel ಇನ್ಸ್ಟ್ರುಮೆಂಟೇಶನ್ ಹರಿವು", desc: hasOtel ? "ಓಪನ್ ಟೆಲಿಮೆಟ್ರಿ ಸೆಟಪ್ ಉಲ್ಲೇಖಗಳು ಪತ್ತೆಯಾಗಿವೆ." : "ನಿಮ್ಮ ನೈಜ SDK ಕಾನ್ಫಿಗರೇಶನ್ ಅಥವಾ ಏಜೆಂಟ್ ಸೆಟಪ್ ಬಗ್ಗೆ ಬರೆಯಿರಿ." },
        { label: "ಸಿಗ್ನೋಸ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಳವಾದ ವೈಶಿಷ್ಟ್ಯಗಳು", desc: hasSigNoz ? "ಟ್ರೇಸ್‌ಗಳು, ಅಲರ್ಟ್‌ಗಳು ಅಥವಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗಳನ್ನು ಉಲ್ಲೇಖಿಸಲಾಗಿದೆ." : "ಟ್ರೇಸ್‌ಗಳು, ಅಲರ್ಟ್‌ಗಳು ಅಥವಾ ಕಸ್ಟಮ್ ಮೆಟ್ರಿಕ್ಸ್‌ಗಳನ್ನು ಸೇರಿಸಿ." },
        { label: "ಅತ್ಯುತ್ತಮ ಪದ ಪ್ರಮಾಣ (1000-1500 ಪದಗಳು)", desc: `ಪ್ರಸ್ತುತ: ${wordCount} ಪದಗಳು. ${isGoodLength ? "ಪರಿಪೂರ್ಣ ಉದ್ದ." : "1000 ರಿಂದ 1500 ಪದಗಳ ಗುರಿ ಇಟ್ಟುಕೊಳ್ಳಿ."}` }
      ],
      bn: [
        { label: "পরীক্ষিত কমান্ড ও কনফিগারেশন", desc: hasCommands ? "কোড স্নীপেটে ইনস্টলেশন কমান্ড সনাক্ত করা গেছে।" : "টার্মিনাল কমান্ড যোগ করুন (যেমন: ./install.sh)।" },
        { label: "আসল OTel ইন্সট্রুমেন্টেশন ফ্লো", desc: hasOtel ? "ওপেনটেলিমোন্ট্রি সেটআপের উল্লেখ পাওয়া গেছে।" : "আপনার আসল SDK কনফিগারেশন বা এজেন্ট সেটআপ সম্পর্কে লিখুন।" },
        { label: "SigNoz প্ল্যাটফর্মের গভীর বৈশিষ্ট্য", desc: hasSigNoz ? "ট্রেস, অ্যালার্ট বা ড্যাশবোর্ডের উল্লেখ পাওয়া গেছে।" : "ট্রেস, অ্যালার্ট বা কাস্টম মেট্রিক্স অন্তর্ভুক্ত করুন।" },
        { label: "উপযুক্ত শব্দ সংখ্যা (১০০০-১৫০০ শব্দ)", desc: `বর্তমান: ${wordCount} শব্দ। ${isGoodLength ? "নিখুঁত দৈর্ঘ্য।" : "১০০০ থেকে ১৫০০ শব্দের লক্ষ্য রাখুন।"}` }
      ],
      mr: [
        { label: "चाचणी केलेले कमांड्स आणि कॉन्फिगरेशन", desc: hasCommands ? "कोड स्निपेट्समध्ये इन्स्टॉलेशन कमांड्स सापडले." : "टर्मिनल कमांड्स जोडा (उदा. ./install.sh)." },
        { label: "खरे OTel इंस्ट्रुमेंटेशन प्रवाह", desc: hasOtel ? "ओपनटेलीमेट्री सेटअप संदर्भ सापडले." : "तुमच्या खऱ्या SDK कॉन्फिगरेशन किंवा एजंट सेटअपबद्दल लिहा." },
        { label: "SigNoz प्लॅटफॉर्मची सखोल वैशिष्ट्ये", desc: hasSigNoz ? "ट्रेस, अलर्ट किंवा डॅशबोर्डचा उल्लेख सापडला." : "ट्रेस, अलर्ट किंवा सानुकूल मेट्रिक्स समाविष्ट करा." },
        { label: "योग्य शब्द प्रमाण (१०००-१५०० शब्द)", desc: `सध्या: ${wordCount} शब्द. ${isGoodLength ? "उत्कृष्ट लांबी." : "१००० ते १५०० शब्दांचे लक्ष्य ठेवा."}` }
      ]
    };

    return checklists[lang].map((item, index) => ({
      ...item,
      status: index === 0 ? (hasCommands ? "met" : "missing")
            : index === 1 ? (hasOtel ? "met" : "missing")
            : index === 2 ? (hasSigNoz ? "met" : "partial")
            : (isGoodLength ? "met" : (wordCount > 1500 || (wordCount > 500 && wordCount < 1000)) ? "partial" : "missing")
    }));
  }, [contentInput, lang]);

  return (
    <div className={`min-h-screen font-sans flex flex-col overflow-x-hidden antialiased transition-colors duration-300 ${
      isDarkMode
        ? "bg-slate-950 text-slate-300"
        : "bg-gradient-to-tr from-pink-50 via-amber-50/40 via-emerald-50/20 to-indigo-100/50 text-slate-700"
    }`}>
      
      {/* Dynamic top high-vibrancy rainbow border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 via-amber-400 via-emerald-400 via-blue-500 to-indigo-600"></div>

      {/* 1. Top Navigation Bar */}
      <nav className={`h-16 flex items-center justify-between px-8 border-b shrink-0 z-10 transition-all duration-300 ${
        isDarkMode
          ? "bg-slate-900/90 backdrop-blur-md border-slate-800 text-slate-100 shadow-lg shadow-slate-950/20"
          : "bg-white border-slate-200 text-slate-700 shadow-sm"
      }`}>
        <div className="flex items-center space-x-3">
          {/* Logo with premium gradient background */}
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 via-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center rounded-xl shadow-md transform hover:rotate-6 transition-transform">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <div>
            <span className="text-slate-900 font-black tracking-widest text-lg bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">WEMAKEDEVS</span>
            <span className={`text-[10px] uppercase font-mono block tracking-wider leading-none mt-0.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Studio Suite</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className={`hidden md:flex items-center gap-1 p-1.5 rounded-2xl border transition-all duration-300 ${
          isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            onClick={() => setActiveView("workspace")}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all duration-300 ${
              activeView === "workspace"
                ? isDarkMode
                  ? "bg-slate-800 text-indigo-300 shadow-lg shadow-slate-950/40"
                  : "bg-white text-indigo-700 shadow-md"
                : "text-slate-400 hover:text-slate-200 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {lang === "te" ? "డ్రాఫ్ట్ ఎడిటర్" : "Draft Editor"}
          </button>
          <button
            onClick={() => setActiveView("hackathon")}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all duration-300 ${
              activeView === "hackathon"
                ? isDarkMode
                  ? "bg-slate-800 text-indigo-300 shadow-lg shadow-slate-950/40"
                  : "bg-white text-indigo-700 shadow-md"
                : "text-slate-400 hover:text-slate-200 dark:hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            {lang === "te" ? "సిగ్నోజ్ హ్యాకథాన్ హబ్" : "SigNoz Hackathon Hub"}
          </button>
        </div>

        {/* Localized Language Switcher dropdown & User Info */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isDarkMode
                ? "bg-slate-800 border-slate-700 hover:bg-slate-750 text-amber-400 hover:scale-105"
                : "bg-slate-100 border-slate-200 hover:bg-slate-250 text-indigo-600 hover:scale-105"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Indian Language Selector */}
          <div className={`flex items-center space-x-2 p-1.5 rounded-xl border ${
            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-slate-100 border-slate-200 text-slate-700"
          }`}>
            <Globe className={`w-4 h-4 ml-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
              className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="en" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>English (US) 🇬🇧</option>
              <option value="te" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>తెలుగు (Telugu) 🇮🇳</option>
              <option value="hi" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>हिन्दी (Hindi) 🇮🇳</option>
              <option value="ta" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>தமிழ் (Tamil) 🇮🇳</option>
              <option value="kn" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>ಕನ್ನಡ (Kannada) 🇮🇳</option>
              <option value="bn" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>বাংলা (Bengali) 🇮🇳</option>
              <option value="mr" className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}>मराठी (Marathi) 🇮🇳</option>
            </select>
          </div>

          <div className="hidden md:flex flex-col text-right">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Agent Workspace</span>
            <span className="text-xs text-indigo-400 font-mono font-semibold">sriskms786@gmail.com</span>
          </div>
          <span className={`hidden sm:inline-block text-xs font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
            Phase: 04
          </span>
          <div className={`px-3.5 py-1.5 rounded-lg text-[10px] tracking-widest font-extrabold uppercase shadow-sm ${
            isDarkMode ? "bg-indigo-950/40 border border-indigo-900/60 text-indigo-300" : "bg-indigo-50 border border-indigo-100 text-indigo-700"
          }`}>
            AGENTS OF SIGNOZ
          </div>
        </div>
      </nav>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left Column: Guidance, Rules & Saved Drafts (Combined 3 cols) */}
        <aside className={`col-span-12 xl:col-span-3 border-b xl:border-b-0 xl:border-r p-6 flex flex-col space-y-6 overflow-y-auto ${
          isDarkMode
            ? "bg-slate-950 border-slate-800 text-slate-300"
            : "bg-gradient-to-b from-rose-50/50 via-indigo-50/30 to-white/70 text-slate-700 border-slate-200"
        }`}>
          
          {/* Header Title styled with gorgeous color accents */}
          <header className={`border-b pb-4 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <h1 className={`text-3xl font-black leading-none tracking-tighter mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              {t.title.split(" ")[0]} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 underline decoration-indigo-400 decoration-wavy decoration-2 underline-offset-4">
                {t.title.split(" ").slice(1).join(" ")}
              </span>
            </h1>
            <p className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              {t.subtitle}
            </p>
          </header>

          {/* Quick Core Directive Card */}
          <div className={`p-4.5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-gradient-to-br from-slate-900 to-indigo-950/40 border-indigo-900/40 text-indigo-300"
              : "bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 border-indigo-200/60 text-slate-700 shadow-sm hover:shadow-md"
          }`}>
            <h2 className="text-[10px] font-extrabold text-pink-600 uppercase tracking-[0.25em] mb-2 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-pink-500 animate-pulse" /> {t.coreDirectiveTitle}
            </h2>
            <p className={`text-xs font-medium italic leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              {t.coreDirectiveText}
            </p>
            <button
              onClick={() => setActiveView(activeView === "workspace" ? "hackathon" : "workspace")}
              className="mt-4 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10"
            >
              {activeView === "workspace" ? (
                <>
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> View Official Rules & Tracks
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" /> Back to Editor Workspace
                </>
              )}
            </button>
          </div>

          {/* Saved Drafts List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-900"}`}>
                {t.savedDraftsTitle}
              </h3>
              <button
                onClick={createNewDraft}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer shadow-sm shadow-indigo-100"
              >
                <Plus className="w-3.5 h-3.5" /> {t.newDraftBtn}
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {drafts.map((draft) => {
                const isActive = draft.id === selectedDraftId;
                const hasScore = draft.score !== undefined;
                return (
                  <div
                    key={draft.id}
                    onClick={() => setSelectedDraftId(draft.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? isDarkMode
                          ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-2 ring-indigo-500/20"
                          : "bg-white border-indigo-500 shadow-md shadow-indigo-100/60 ring-2 ring-indigo-500/10"
                        : isDarkMode
                        ? "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-bold line-clamp-1 flex-1 ${isActive ? (isDarkMode ? "text-white" : "text-slate-900") : (isDarkMode ? "text-slate-300" : "text-slate-750")}`}>
                        {draft.title || "Untitled Draft"}
                      </span>
                      <button
                        onClick={(e) => deleteDraft(draft.id, e)}
                        className={`p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${isDarkMode ? "text-slate-500 hover:text-rose-400 hover:bg-slate-800" : "text-slate-450 hover:text-rose-500 hover:bg-slate-100"}`}
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 text-[10px] text-slate-500">
                      <span className={`font-medium ${isDarkMode ? "text-slate-400" : "text-slate-550"}`}>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                      {hasScore ? (
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            draft.score! >= 80
                              ? isDarkMode
                                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : draft.score! >= 50
                              ? isDarkMode
                                ? "bg-amber-950/40 text-amber-400 border border-amber-900/30"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                              : isDarkMode
                              ? "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          Audit: {draft.score}/100
                        </span>
                      ) : (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${isDarkMode ? "text-slate-450 bg-slate-900 border border-slate-800" : "text-slate-400 bg-slate-100"}`}>No Audit Run</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset App Workspace Button */}
          <div className="pt-1">
            <button
              onClick={resetAppWorkspace}
              className={`w-full py-2 px-3 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-dashed ${
                isDarkMode
                  ? "bg-slate-900/40 hover:bg-rose-950/25 text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-900/50"
                  : "bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200 hover:border-rose-300 shadow-xs"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restart All App Features
            </button>
          </div>

          {/* Live Checklist Indicator (Linked dynamically to editor contents!) */}
          <div className={`space-y-3 pt-4 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-300" : "text-slate-850"}`}>
                {t.checklistTitle}
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isDarkMode ? "bg-slate-900 text-slate-400 border border-slate-800" : "bg-slate-100 text-slate-600"}`}>
                {dynamicChecklist.filter((c) => c.status === "met").length}/4 Met
              </span>
            </div>
            <div className="space-y-3">
              {dynamicChecklist.map((item, index) => (
                <div key={index} className={`flex items-start space-x-3 text-xs leading-relaxed p-2.5 rounded-xl border transition-colors duration-200 ${
                  isDarkMode ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-white border-slate-200/60 shadow-xs text-slate-700"
                }`}>
                  <div className="mt-0.5 shrink-0">
                    {item.status === "met" ? (
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        isDarkMode ? "bg-emerald-950/60 border border-emerald-850 text-emerald-400" : "bg-emerald-50 border border-emerald-200 text-emerald-600"
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : item.status === "partial" ? (
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        isDarkMode ? "bg-amber-950/60 border border-amber-850 text-amber-400" : "bg-amber-50 border border-amber-200 text-amber-600"
                      }`}>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-600" : "bg-slate-50 border border-slate-200 text-slate-300"
                      }`}></div>
                    )}
                  </div>
                  <div>
                    <p className={`font-bold transition-colors ${item.status === "met" ? (isDarkMode ? "text-slate-200" : "text-slate-800") : "text-slate-500"}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {activeView === "workspace" ? (
          <>
            {/* Center Column: Blog Workspace Editor & Preview (Combined 5 cols) */}
            <section className={`col-span-12 xl:col-span-5 p-6 border-b xl:border-b-0 xl:border-r flex flex-col overflow-hidden transition-colors duration-300 ${
              isDarkMode
                ? "bg-slate-950 border-slate-800 text-slate-300"
                : "bg-gradient-to-b from-amber-50/40 via-white/80 to-indigo-50/20 text-slate-700 border-slate-200"
            }`}>
              <div className="flex-1 flex flex-col h-full">
                {drafts.length === 0 ? (
                  <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl ${
                    isDarkMode ? "border-slate-800 bg-slate-900/20" : "border-slate-200 bg-slate-50/50"
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      isDarkMode ? "bg-indigo-950/40 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                    }`}>
                      <Plus className="w-8 h-8 animate-pulse" />
                    </div>
                    <h3 className={`text-sm font-black uppercase tracking-wider mb-2 ${isDarkMode ? "text-slate-200" : "text-slate-850"}`}>
                      {lang === "te" ? "డ్రాఫ్ట్‌లు లేవు" : lang === "hi" ? "कोई ड्राफ्ट नहीं है" : "No Drafts Found"}
                    </h3>
                    <p className={`text-xs max-w-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {lang === "te"
                        ? "మీరు బ్లాగ్ రాయడం ప్రారంభించడానికి కొత్త డ్రాఫ్ట్‌ను సృష్టించండి."
                        : lang === "hi"
                        ? "ब्लॉग लिखना शुरू करने के लिए एक नया ड्राफ्ट बनाएं।"
                        : "Your workspace is currently clear. Create a fresh draft to start writing your SigNoz technical blog post!"}
                    </p>
                    <button
                      onClick={createNewDraft}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> {lang === "te" ? "కొత్త డ్రాఫ్ట్" : lang === "hi" ? "नया ड्राफ्ट" : "Create New Draft"}
                    </button>
                  </div>
                ) : (
                  <DraftWorkspace
                    title={titleInput}
                    setTitle={setTitleInput}
                    content={contentInput}
                    setContent={setContentInput}
                    onAudit={runAudit}
                    isAuditing={isAuditing}
                    saveStatus={saveStatus}
                    lang={lang}
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>
            </section>



        {/* Right Column: Submission & Reward Info + Interactive AI Audit Results (Combined 4 cols) */}
        <section className={`col-span-12 xl:col-span-4 p-6 flex flex-col space-y-6 overflow-y-auto transition-colors duration-300 ${
          isDarkMode
            ? "bg-slate-950 text-slate-300"
            : "bg-gradient-to-b from-emerald-50/30 via-indigo-50/30 to-pink-50/20 text-slate-700"
        }`}>
          
          {/* AirPods Pro 3 Reward Card */}
          <div className={`p-5 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-xl ${
            isDarkMode
              ? "bg-gradient-to-r from-purple-950 via-indigo-950 via-slate-900 to-indigo-950 border border-indigo-900/50 shadow-slate-950/50 text-slate-100"
              : "bg-gradient-to-r from-pink-500 via-rose-500 via-amber-500 to-indigo-600 text-white shadow-rose-100"
          }`}>
            {/* Visual gradient orb */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-125 transition-all duration-500"></div>
            <div className="flex justify-between items-start mb-3">
              <span className={`font-mono text-[9px] font-bold tracking-tighter uppercase border px-1.5 py-0.5 rounded bg-white/10 italic ${isDarkMode ? "border-indigo-500 text-indigo-300" : "border-white/40"}`}>
                {t.rewardTier}
              </span>
              <span className={`text-[10px] font-extrabold font-mono ${isDarkMode ? "text-slate-400" : "text-white/80"}`}>{t.rewardQty}</span>
            </div>
            <h3 className="text-xl font-black uppercase leading-tight mb-1 tracking-tight">
              {t.rewardTitle} <br />
              <span className="text-xs font-semibold text-white/80">
                {t.rewardSub}
              </span>
            </h3>
            <p className="text-[10px] mt-2 opacity-90 italic leading-snug font-medium text-indigo-50">
              {t.rewardDesc}
            </p>
          </div>

          {/* Submission Timeline & Accuracy Verification Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400 block mb-0.5">
                {t.deadlineTitle}
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4 text-indigo-500" /> JULY 19, 2026
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400 block mb-0.5">
                {t.wordCountTitle}
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-1">
                <FileText className="w-4 h-4 text-indigo-500" /> 1000 - 1500
              </span>
            </div>
          </div>

          {/* AI Audit Report Area */}
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {t.geminiReportTitle}
              </h3>
              {activeAuditReport && (
                <span className="text-[10px] font-mono text-slate-400">
                  Last ran: Just now
                </span>
              )}
            </div>

            {/* Error state */}
            {auditError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t.alertFailed}</p>
                  <p className="opacity-90 mt-0.5">{auditError}</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isAuditing && (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{t.auditingTitle}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5 max-w-[240px] leading-relaxed">
                    {t.auditingDesc}
                  </p>
                </div>
              </div>
            )}

            {/* No Audit run yet placeholder */}
            {!activeAuditReport && !isAuditing && (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3.5 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t.noAuditTitle}</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed max-w-[260px] mx-auto">
                    {t.noAuditDesc}
                  </p>
                </div>
              </div>
            )}

            {/* Rich Audit Report Render */}
            {activeAuditReport && !isAuditing && (
              <div className="space-y-4">
                
                {/* Score Gauge and AI Likelihood Overview */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Score */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                      {t.draftScoreTitle}
                    </span>
                    <div className="text-3xl font-black font-mono text-slate-900 leading-none">
                      {activeAuditReport.score}
                      <span className="text-xs text-slate-400 font-normal">/100</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3 max-w-[100px] mx-auto">
                      <div
                        className={`h-full ${
                          activeAuditReport.score >= 80
                            ? "bg-emerald-500"
                            : activeAuditReport.score >= 50
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${activeAuditReport.score}%` }}
                      ></div>
                    </div>
                    <span className={`text-[9px] font-bold mt-1.5 block ${
                      activeAuditReport.score >= 80 ? "text-emerald-600" : activeAuditReport.score >= 50 ? "text-amber-600" : "text-rose-600"
                    }`}>
                      {activeAuditReport.score >= 80 ? "Winning Potential!" : activeAuditReport.score >= 50 ? "Needs Polish" : "Weak Draft"}
                    </span>
                  </div>

                  {/* AI Detector */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                        {t.aiFillerTitle}
                      </span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          activeAuditReport.experienceAudit.aiLikelihood === "Low"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : activeAuditReport.experienceAudit.aiLikelihood === "Medium"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {activeAuditReport.experienceAudit.aiLikelihood}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-snug mt-2">
                      {t.aiDetectorDesc}
                    </p>
                  </div>
                </div>

                {/* Generic phrases found warning */}
                {activeAuditReport.experienceAudit.genericPhrasesFound && activeAuditReport.experienceAudit.genericPhrasesFound.length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-slate-700 shadow-sm">
                    <p className="font-bold text-rose-600 flex items-center gap-1 text-[11px] mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> {t.clichesTitle}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {activeAuditReport.experienceAudit.genericPhrasesFound.map((phrase, i) => (
                        <span key={i} className="bg-rose-100/60 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-mono">
                          "{phrase}"
                        </span>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1.5">
                      {t.clichesDesc}
                    </p>
                  </div>
                )}

                {/* Tabbed Audits Details */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  {/* Experience Section */}
                  <div className="border-b border-slate-100">
                    <button
                      onClick={() => setExpandedSection(expandedSection === "experience" ? null : "experience")}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-indigo-500" /> {t.tabExperience}
                      </span>
                      <span className="text-slate-400">
                        {expandedSection === "experience" ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                    {expandedSection === "experience" && (
                      <div className="px-4 pb-4 pt-1 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/30">
                        <p>{activeAuditReport.experienceAudit.feedback}</p>
                      </div>
                    )}
                  </div>

                  {/* Structure Section */}
                  <div className="border-b border-slate-100">
                    <button
                      onClick={() => setExpandedSection(expandedSection === "structure" ? null : "structure")}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" /> {t.tabStructure}
                      </span>
                      <span className="text-slate-400">
                        {expandedSection === "structure" ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                    {expandedSection === "structure" && (
                      <div className="px-4 pb-4 pt-1 text-[11px] text-slate-600 space-y-2.5 border-t border-slate-100 bg-slate-50/30 leading-relaxed">
                        <div>
                          <strong className="text-slate-800">The Hook:</strong> {activeAuditReport.structureAudit.hookEvaluation}
                        </div>
                        <div>
                          <strong className="text-slate-800">Context:</strong> {activeAuditReport.structureAudit.contextEvaluation}
                        </div>
                        <div>
                          <strong className="text-slate-800">Main Body:</strong> {activeAuditReport.structureAudit.bodyEvaluation}
                        </div>
                        <div>
                          <strong className="text-slate-800">Takeaways:</strong> {activeAuditReport.structureAudit.takeawaysEvaluation}
                        </div>
                        <div>
                          <strong className="text-slate-800">Conclusion:</strong> {activeAuditReport.structureAudit.conclusionEvaluation}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Technical Accuracy Section */}
                  <div>
                    <button
                      onClick={() => setExpandedSection(expandedSection === "technical" ? null : "technical")}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-indigo-500" /> {t.tabTechnical}
                      </span>
                      <span className="text-slate-400">
                        {expandedSection === "technical" ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                    {expandedSection === "technical" && (
                      <div className="px-4 pb-4 pt-1 text-[11px] text-slate-600 space-y-3.5 border-t border-slate-100 bg-slate-50/30 leading-relaxed">
                        <div>
                          <p className="font-bold text-slate-800 mb-1">General Feedback:</p>
                          <p>{activeAuditReport.technicalAudit.feedback}</p>
                        </div>
                        {activeAuditReport.technicalAudit.codeAccuracyFeedback && (
                          <div>
                            <p className="font-bold text-slate-800 mb-1">Code & Command Review:</p>
                            <p>{activeAuditReport.technicalAudit.codeAccuracyFeedback}</p>
                          </div>
                        )}
                        {activeAuditReport.technicalAudit.suggestedFeatures && activeAuditReport.technicalAudit.suggestedFeatures.length > 0 && (
                          <div>
                            <p className="font-bold text-slate-800 mb-1.5">Recommended SigNoz Features to Add:</p>
                            <div className="flex flex-wrap gap-1">
                              {activeAuditReport.technicalAudit.suggestedFeatures.map((f, i) => (
                                <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Specific Recommendations */}
                {activeAuditReport.specificRecommendations && activeAuditReport.specificRecommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {t.recommendationsTitle}
                    </h4>
                    <div className="space-y-3">
                      {activeAuditReport.specificRecommendations.map((rec, i) => (
                        <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                {rec.type}
                              </span>
                              <h5 className="text-xs font-bold text-slate-800 mt-1">{rec.issue}</h5>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed">{rec.suggestion}</p>

                          {rec.suggestedRevision && (
                            <div className="space-y-2 mt-2">
                              {rec.originalSnippet && (
                                <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] font-mono text-rose-700">
                                  <div className="text-[9px] uppercase font-bold text-rose-500 mb-1 opacity-70">Weak/Generic draft:</div>
                                  <div className="line-clamp-2 italic">"{rec.originalSnippet}"</div>
                                </div>
                              )}
                              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-mono text-emerald-700">
                                <div className="text-[9px] uppercase font-bold text-emerald-500 mb-1 opacity-70 font-sans flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Suggested Revision:
                                </div>
                                <div className="whitespace-pre-wrap">{rec.suggestedRevision}</div>
                              </div>
                              <button
                                onClick={() => applyRevision(rec)}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
                              >
                                <Check className="w-3.5 h-3.5" /> {t.applyRevisionBtn}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </section>
          </>
        ) : (
          <section className={`col-span-12 xl:col-span-9 p-8 overflow-y-auto transition-colors duration-300 ${
            isDarkMode ? "bg-slate-950" : "bg-gradient-to-br from-indigo-50/10 via-white to-pink-50/10"
          }`}>
            <HackathonHub isDarkMode={isDarkMode} lang={lang} />
          </section>
        )}

      </div>

      {/* 3. Footer Bar */}
      <footer className="h-12 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] font-mono text-slate-400 shrink-0 uppercase tracking-widest bg-white z-10">
        <div>© 2026 WeMakeDevs — {t.footerLine}</div>
        <div className="flex space-x-6">
          <span>Discord: //Operational-HQ</span>
          <span className="text-indigo-600 font-bold">v2.1.0-VIBRANT-LIGHT</span>
        </div>
      </footer>

    </div>
  );
}
