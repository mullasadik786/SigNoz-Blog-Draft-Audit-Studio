import React, { useState } from "react";
import {
  Trophy,
  Award,
  Sparkles,
  Code,
  Cpu,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Github,
  MessageSquare,
  Layers,
  Activity,
  CheckCircle,
  Server,
  Plug,
  Info,
  Flame,
  ArrowRight
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS } from "../translations";

interface HackathonHubProps {
  isDarkMode: boolean;
  lang: SupportedLanguage;
}

export default function HackathonHub({ isDarkMode, lang }: HackathonHubProps) {
  const [activeTrack, setActiveTrack] = useState<"all" | "track1" | "track2" | "track3">("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const t = TRANSLATIONS[lang];

  const tracks = [
    {
      id: "track1",
      number: "Track 01",
      title: lang === "te" ? "AI & ఏజెంట్ అబ్సర్వబిలిటీ" : "AI & Agent Observability",
      subtitle: lang === "te" ? "AI-నేటివ్ సిస్టమ్‌లను ట్రేస్, మానిటర్ మరియు డీబగ్ చేయండి" : "Trace, monitor, and debug AI-native systems",
      desc: lang === "te"
        ? "AI ఏజెంట్లు మరియు LLMల పనితీరును సిగ్నోజ్ ద్వారా ట్రాక్ చేయండి. ఖర్చులు, లేటెన్సీ మరియు హాలూసినేషన్స్ నివారించండి."
        : "Trace every step of your AI agent: tool calls, LLM requests, retrieval hops, and decision chains in one view.",
      builds: [
        { name: "AI agents with E2E observability on SigNoz", desc: "Build autonomous agents and trace their recursive LLM execution chains." },
        { name: "Self-hosted inference observability (vLLM)", desc: "Track model inference latency, token counts, and GPU memory usage." },
        { name: "SRE Sidekick with SigNoz MCP", desc: "Integrate Model Context Protocol with SigNoz data to build a debugging companion." },
        { name: "n8n workflows with E2E observability", desc: "Map complex agent workflows with open telemetry tracing spikes." },
        { name: "Self-healing infra with SigNoz metrics", desc: "Create an autonomous feedback loop correcting servers on metric triggers." }
      ]
    },
    {
      id: "track2",
      number: "Track 02",
      title: lang === "te" ? "సిగ్నల్స్ & డ్యాష్‌బోర్డ్స్" : "Signals & Dashboards",
      subtitle: lang === "te" ? "ఓపెన్ టెలిమెట్రీ ఇన్‌స్ట్రుమెంటేషన్ & క్వెరీ బిల్డర్ ప్రావీణ్యం" : "OpenTelemetry instrumentation & Query Builder mastery",
      desc: lang === "te"
        ? "ట్రేస్‌లు, మెట్రిక్‌లు మరియు లాగ్‌లను ఒకే ప్లాట్‌ఫారమ్‌లో అనుసంధానించండి. కస్టమ్ ఓటెల్ లైబ్రరీలను రూపొందించండి."
        : "Master the correlation of traces, metrics, and logs. Build multi-signal dashboards or push custom OTel instrumentation limits.",
      builds: [
        { name: "Custom OTel auto-instrumentation library", desc: "Write a lightweight wrapper simplifying instrumentation for your favorite framework." },
        { name: "Cross-signal panel for one service", desc: "Correlate backend HTTP latencies side-by-side with database queries and host OS RAM logs." },
        { name: "Query Builder vs PromQL/LogQL", desc: "Demonstrate complex queries using ClickHouse columnar metrics storage." },
        { name: "Multi-cluster telemetry on one SigNoz", desc: "Aggregate distributed microservices onto a single central dashboard." },
        { name: "SLO/error-budget dashboard pack", desc: "Configure high-fidelity error-budget alerts that prevent operational alert fatigue." }
      ]
    },
    {
      id: "track3",
      number: "Track 03",
      title: lang === "te" ? "మీ స్వంత ఆలోచనను నిర్మించండి" : "Build Your Own",
      subtitle: lang === "te" ? "సిగ్నోజ్‌తో ఏదైనా అబ్సర్వ్ చేయండి" : "Observe anything with SigNoz",
      desc: lang === "te"
        ? "పరిమితులు లేవు! సిగ్నోజ్‌ని ఉపయోగించి మీ స్వంత అద్భుతమైన ఐడియాని నిర్మించండి మరియు ప్రదర్శించండి."
        : "Zero boundaries. Observe anything weird, build ecosystem plugins, or bridge untraditional telemetry sources.",
      builds: [
        { name: "Observability for a Slack/Telegram bot or IoT fleet", desc: "Track message delivery latency or temperature spikes in smart home fleets." },
        { name: "Monitor a trading bot or data pipeline", desc: "Observe trade processing lags or Apache Kafka partition throughput." },
        { name: "Bridge an unsupported data source into SigNoz", desc: "Write custom collectors to ingest logs from legacy systems." },
        { name: "Monitor anything weird with a live dashboard", desc: "Show how creative dashboards track bizarre live stats." },
        { name: "Ecosystem plugin: Backstage, Terraform, or Helm", desc: "Build deep developer portal modules or auto-deploy alerts pipelines." }
      ]
    }
  ];

  const criteria = [
    {
      num: "01",
      title: lang === "te" ? "సంభావ్య ప్రభావం (Potential Impact)" : "Potential Impact",
      desc: lang === "te"
        ? "అబ్సర్వబిలిటీ ద్వారా ప్రాజెక్ట్ ఎంతవరకు అర్థవంతమైన సమస్యను పరిష్కరిస్తుంది?"
        : "How effectively does the project address a meaningful problem or unlock a valuable use case with observability?"
    },
    {
      num: "02",
      title: lang === "te" ? "సృజనాత్మకత & ఆవిష్కరణ (Creativity)" : "Creativity & Innovation",
      desc: lang === "te"
        ? "ఆలోచన ఎంత వినూత్నంగా ఉంది? సిస్టమ్ అంతరంగాన్ని చూడటంలో ఎంత కొత్తదనాన్ని చూపించారు?"
        : "How unique is the idea? Does it push the boundaries of what's possible when you can see inside your systems?"
    },
    {
      num: "03",
      title: lang === "te" ? "సాంకేతిక నైపుణ్యం (Technical Excellence)" : "Technical Excellence",
      desc: lang === "te"
        ? "ప్రాజెక్ట్ ఎంత బాగా అమలు చేయబడింది? కోడ్ నాణ్యత మరియు ఆర్కిటెక్చర్ ఎంత పక్కాగా ఉన్నాయి?"
        : "How well is the project implemented? Does it demonstrate strong engineering practices and clean, maintainable code?"
    },
    {
      num: "04",
      title: lang === "te" ? "సిగ్నోజ్ ఉత్తమ వినియోగం (Best Use of SigNoz)" : "Best Use of SigNoz",
      desc: lang === "te"
        ? "ట్రేస్‌లు, మెట్రిక్‌లు, లాగ్‌లు, మరియు అలర్ట్‌లను ప్రాజెక్ట్‌లో ఎంతవరకు సమర్థవంతంగా ఉపయోగించారు?"
        : "How deeply and effectively does the project lean on SigNoz, traces, metrics, logs, dashboards, and alerts?"
    },
    {
      num: "05",
      title: lang === "te" ? "వినియోగదారు అనుభవం (User Experience)" : "User Experience",
      desc: lang === "te"
        ? "ప్రాజెక్ట్ ఉపయోగించడం సులభంగా ఉందా? ఇంటర్‌ఫేస్ మరియు డెమో ఎంతవరకు ఆకట్టుకున్నాయి?"
        : "Is the project intuitive to use? Does it provide a polished experience that users would actually want to adopt?"
    },
    {
      num: "06",
      title: lang === "te" ? "ప్రెజెంటేషన్ నాణ్యత (Presentation Quality)" : "Presentation Quality",
      desc: lang === "te"
        ? "ప్రాజెక్ట్ వివరణ ఎంత స్పష్టంగా ఉంది? మీ బ్లాగ్ పోస్ట్ మరియు డెమో ఎంత బాగా కమ్యూనికేట్ చేశాయి?"
        : "How clearly is the project presented? Do the demo, README, and submission communicate the problem, solution, and impact?"
    }
  ];

  const faqs = [
    {
      q: lang === "te" ? "ఈ హ్యాకథాన్‌కు అర్హత ప్రమాణాలు ఏమిటి?" : "What are the eligibility criteria for this hackathon?",
      a: lang === "te"
        ? "AI, సాఫ్ట్‌వేర్ డెవలప్‌మెంట్, డెవ్‌ఆప్స్, ఎస్ఆర్‌ఈ లేదా అబ్సర్వబిలిటీ పై ఆసక్తి ఉన్న ఎవరైనా ఇందులో చేరవచ్చు! ఎలాంటి భౌగోళిక పరిమితులు లేవు."
        : "Anyone interested in AI, software development, DevOps, SRE, or observability can join! No location boundaries. Team size up to 4 or solo hackers."
    },
    {
      q: lang === "te" ? "నాకు సిగ్నోజ్ (SigNoz) లో మునుపటి అనుభవం అవసరమా?" : "Do I need prior experience with SigNoz?",
      a: lang === "te"
        ? "అవసరం లేదు! సిగ్నోజ్ అనేది ఓపెన్ టెలిమెట్రీ నేటివ్ ప్లాట్‌ఫారమ్. దీని సెటప్ చాలా సులభం. మా కమ్యూనిటీ స్లాక్ మరియు డాక్యుమెంటేషన్ మీకు ఎల్లప్పుడూ సహాయపడతాయి."
        : "No! SigNoz is OpenTelemetry-native, and setting it up is extremely easy. The standard SDKs are well-documented and our active community Slack is here to guide you."
    },
    {
      q: lang === "te" ? "థీమ్ నిజంగా ఓపెన్-ఎండెడ్ గానే ఉంటుందా?" : "Is the theme really open-ended?",
      a: lang === "te"
        ? "అవును, మీ ప్రాజెక్ట్ సిగ్నోజ్ లేదా ఓపెన్ టెలిమెట్రీని ఉపయోగించినంత కాలం అది ఏదైనా కావచ్చు! ప్రేరణ కోసం మూడు ట్రాక్‌లను చూడండి."
        : "Yes, as long as it integrates with or uses SigNoz! Check out the three tracks for concrete inspiration—AI Agent Tracing, custom Dashboards, or Build Your Own."
    },
    {
      q: lang === "te" ? "నేను సోలోగా రిజిస్టర్ అయ్యాను. జట్టుగా మారవచ్చా?" : "I registered solo. Can I switch to a team?",
      a: lang === "te"
        ? "అవును! మీరు గరిష్టంగా నలుగురు సభ్యులతో కొత్త బృందాన్ని ఏర్పాటు చేసుకోవచ్చు లేదా సోలోగా హ్యాక్ చేయవచ్చు."
        : "Yes, you can form teams of up to 4 members or hack solo. Team registration can be adjusted directly upon submission."
    },
    {
      q: lang === "te" ? "నేను ఇప్పటికే ఉన్న ప్రాజెక్ట్‌లను ఉపయోగించవచ్చా?" : "Can I use existing projects or prior work?",
      a: lang === "te"
        ? "అవును, కానీ సిగ్నోజ్ లేదా ఓటెల్ తో చేసే ఇంటిగ్రేషన్ సరికొత్తదై ఉండాలి మరియు హ్యాకథాన్ సమయంలోనే నిర్మించబడాలి."
        : "Yes, but the integration with SigNoz and OpenTelemetry telemetry must be new and built during the hackathon period."
    },
    {
      q: lang === "te" ? "నేను సిగ్నోజ్‌ను ఎలా సెటప్ చేయాలి?" : "How do I set up SigNoz?",
      a: lang === "te"
        ? "మీరు డాకర్ లేదా కుబెర్నెటిస్ ఉపయోగించి మీ స్వంత సిస్టమ్‌లో సెల్ఫ్-హోస్ట్ చేయవచ్చు లేదా కేవలం 2 నిమిషాల్లో సిగ్నోజ్ క్లౌడ్ ద్వారా ప్రారంభించవచ్చు."
        : "You can self-host SigNoz using Docker/Kubernetes on your machine/VM, or sign up for a SigNoz Cloud free trial account and start ingesting metrics in minutes."
    },
    {
      q: lang === "te" ? "ChatGPT లేదా కోపైలట్ వంటి AI అసిస్టెంట్‌ల వాడకం అనుమతించబడుతుందా?" : "Are AI assistants like ChatGPT or Copilot permitted?",
      a: lang === "te"
        ? "అవును, కోడ్ రాయడానికి అవి అనుమతించబడతాయి, కానీ మీ చివరకు సమర్పించే బ్లాగ్ పోస్ట్ మాత్రం స్వంత అనుభవంతో కూడినదై ఉండాలి. AI స్లాప్ వ్యాసాలు తిరస్కరించబడతాయి."
        : "Yes, AI tools are permitted for coding support, but your final blog write-up must be human-authored, sharing your real experience, challenges, and learnings. Rushed AI-generated blogs will not win."
    },
    {
      q: lang === "te" ? "నేను నా ప్రాజెక్ట్‌ను ఎలా సమర్పించాలి?" : "How do I submit my project?",
      a: lang === "te"
        ? "అధికారిక సబ్మిషన్ ఫారమ్ ద్వారా సమర్పించండి. అందులో మీ బ్లాగ్ లింక్, గిట్‌హబ్ రెపో మరియు ఒక చిన్న డెమో వీడియో లింక్ జోడించాలి."
        : "Submit through the official submission form with your public blog post URL (Medium, Dev.to, or Substack), GitHub repository link, and a short video demo showing SigNoz dashboards."
    }
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero banner with Cosmic theme */}
      <div className={`relative p-8 rounded-3xl overflow-hidden border transition-all ${
        isDarkMode
          ? "bg-slate-900/60 border-slate-800 text-slate-100 shadow-2xl shadow-indigo-950/25"
          : "bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white shadow-xl"
      }`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-pink-500/20 text-pink-400 border border-pink-500/30 uppercase tracking-widest mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> Agents of SigNoz Hackathon
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">
            Your AI Agents <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 underline decoration-indigo-400 decoration-wavy decoration-2 underline-offset-8">
              Are a Black Box
            </span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl font-medium mt-6 leading-relaxed">
            AI is eating software, and nobody can see inside it. We're here to fix that.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-800/60">
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold uppercase text-pink-400 tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-pink-500" /> Flying Blind
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                AI agents are chaining LLM calls, invoking tools, hitting vector DBs, and making decisions autonomously. But when latency spikes, costs explode, or an agent hallucinates in production, you're flying blind. You can't debug what you can't see.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" /> Total Visibility
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                SigNoz gives you full visibility into every AI workflow. Trace each agent step, monitor token costs, and correlate LLM responses with downstream failures. OpenTelemetry-native, so your instrumentation works everywhere. One platform. Every AI signal.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3.5 mt-8">
            <a
              href="https://github.com/SigNoz/signoz"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" /> Star SigNoz on GitHub
            </a>
            <a
              href="https://signoz.io/slack"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" /> Join SigNoz Slack
            </a>
          </div>
        </div>
      </div>

      {/* 2. One Platform, Every Signal Bento Grid */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className={`text-2xl font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            📡 One Platform, Every Signal
          </h2>
          <p className="text-slate-400 text-xs uppercase font-mono tracking-widest mt-1">
            One Stop Observability Platform. Total Recall.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 mb-4">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className={`text-sm font-bold mb-2 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>AI Agent Tracing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trace every step of your AI agent: tool calls, LLM requests, retrieval hops, and decision chains in one view.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className={`text-sm font-bold mb-2 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>One-Stop Observability</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Traces, metrics, and logs in a single platform. Correlate signals across your entire stack without switching tools.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
              <Server className="w-4 h-4" />
            </div>
            <h3 className={`text-sm font-bold mb-2 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>Flexible Deployment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Self-host SigNoz on your own infrastructure for full control, or use SigNoz Cloud to get started in minutes.
            </p>
          </div>

          <div className={`p-5 rounded-2xl border transition-all ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"}`}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Plug className="w-4 h-4" />
            </div>
            <h3 className={`text-sm font-bold mb-2 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>OpenTelemetry Native</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built on OpenTelemetry from day one. Instrument any language, any framework. Your telemetry data stays yours forever.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Pick Your Mission: Dynamic Tracks Switcher */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className={`text-2xl font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            ⬢ Three Tracks: Choose Your Mission
          </h2>
          <p className="text-slate-400 text-xs uppercase font-mono tracking-widest mt-1">
            Pick a track, build something exceptional, and integrate SigNoz.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setActiveTrack("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTrack === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                : isDarkMode
                ? "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-950 shadow-xs"
            }`}
          >
            All Tracks
          </button>
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTrack === track.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : isDarkMode
                  ? "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-950 shadow-xs"
              }`}
            >
              {track.number}: {track.title.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Tracks Content Grid */}
        <div className="space-y-6">
          {tracks
            .filter((t) => activeTrack === "all" || activeTrack === t.id)
            .map((track) => (
              <div
                key={track.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isDarkMode
                    ? "bg-slate-900/30 border-slate-800/80 hover:border-slate-700/80"
                    : "bg-white border-slate-200/80 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b pb-4 mb-5 border-slate-800/10 dark:border-slate-800/60">
                  <div>
                    <span className="text-[10px] font-black tracking-widest font-mono uppercase text-pink-500 bg-pink-500/10 dark:bg-pink-500/20 px-2 py-0.5 rounded">
                      {track.number}
                    </span>
                    <h3 className={`text-xl font-extrabold mt-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{track.title}</h3>
                    <p className={`text-xs font-medium mt-1 uppercase font-mono tracking-wider ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>
                      {track.subtitle}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm md:text-right leading-relaxed">{track.desc}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-indigo-500" /> Example Builds & Ideas:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {track.builds.map((b, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isDarkMode
                            ? "bg-slate-950/40 border-slate-850 hover:bg-slate-950/80"
                            : "bg-slate-50 border-slate-100 hover:bg-slate-100/40"
                        }`}
                      >
                        <span className={`text-xs font-bold block ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{b.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-1 leading-snug">{b.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Submission Note */}
        <div className={`p-5 rounded-2xl border text-xs leading-relaxed transition-all ${
          isDarkMode ? "bg-indigo-950/20 border-indigo-900/30 text-slate-300" : "bg-indigo-50 border-indigo-100 text-slate-700"
        }`}>
          <div className="flex gap-2.5">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 text-[10px]">A kind note on the write-up:</p>
              <p>
                Publish your blog on a proper blogging platform. **Medium, Dev.to, or Substack** are all great choices. A LinkedIn social post is not a blog, so please don't submit one. Put genuine effort into it. AI slop and rushed, low-effort blogs will not win any prizes. We want to hear about your real experience, what you built, what broke, and what you learned along the way.
              </p>
              <a
                href="https://signoz.io"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] hover:underline cursor-pointer"
              >
                Go to Project Submission Form <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4. How You're Judged */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className={`text-2xl font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            ⚖️ How You're Judged
          </h2>
          <p className="text-slate-400 text-xs uppercase font-mono tracking-widest mt-1">
            Official Judging Criteria
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {criteria.map((c, i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200/80 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-extrabold font-mono text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 px-2 py-0.5 rounded">
                  {c.num}
                </span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className={`text-sm font-bold mb-1.5 ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{c.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Frequently Asked Questions Accordion */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className={`text-2xl font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            ❓ Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-xs uppercase font-mono tracking-widest mt-1">
            Everything you need to know to get started
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isDarkMode
                    ? "bg-slate-900/20 border-slate-800 hover:border-slate-750"
                    : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-xs cursor-pointer focus:outline-none"
                >
                  <span className={isDarkMode ? "text-slate-200" : "text-slate-800"}>{faq.q}</span>
                  <span className="shrink-0 text-slate-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className={`px-5 pb-4 pt-1.5 text-xs leading-relaxed border-t ${
                    isDarkMode ? "border-slate-850 text-slate-400 bg-slate-900/10" : "border-slate-100 text-slate-600 bg-slate-50/20"
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Self Host Info Footer */}
      <div className={`p-8 rounded-3xl border text-center relative overflow-hidden transition-all ${
        isDarkMode
          ? "bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/20 border-slate-800"
          : "bg-gradient-to-tr from-indigo-50 via-white to-pink-50/40 border-slate-200/80 shadow-md"
      }`}>
        <h3 className={`text-xl font-black uppercase mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
          🚀 Ready to Instrument Your Code?
        </h3>
        <p className="text-slate-400 text-xs max-w-lg mx-auto leading-relaxed mb-6">
          Self-host SigNoz using Docker or Kubernetes and start ingesting metrics, traces, and logs in minutes. Read the self-host guide to deploy your local agent stack.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://signoz.io/docs/install/docker/"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
          >
            <Server className="w-4 h-4" /> Docker Install Guide <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://signoz.io/docs/install/kubernetes/"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" /> Kubernetes Guide <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
