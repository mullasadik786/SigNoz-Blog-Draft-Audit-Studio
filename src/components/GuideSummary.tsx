import { Trophy, Award, CheckCircle, ExternalLink, HelpCircle } from "lucide-react";

export default function GuideSummary() {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-3">
            <Trophy className="w-3 h-3" /> WeMakeDevs Hackathon
          </span>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">SigNoz Blog Challenge</h2>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">
            Write a technical blog post from real experience using SigNoz features.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Grand Prize</div>
          <div className="text-sm font-semibold text-amber-400">AirPods Pro 3 / Beats</div>
          <div className="text-xs text-slate-500 mt-0.5">Deadline: July 19, 2026</div>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-800/80 pt-5 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">The Golden Rule</h3>
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              "Write From Real Experience"
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Ground your writing in something you actually did, ran, or hit. No generic summaries of documentation or AI filler.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Required Structure</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-950/20 border border-slate-800/40 rounded-lg">
              <span className="font-semibold text-violet-400 block mb-0.5">1. Hook</span>
              <span className="text-slate-400">First 2-3 sentences. Engaging problem or question.</span>
            </div>
            <div className="p-2 bg-slate-950/20 border border-slate-800/40 rounded-lg">
              <span className="font-semibold text-violet-400 block mb-0.5">2. Context</span>
              <span className="text-slate-400">Brief explanation of what & why it matters.</span>
            </div>
            <div className="p-2 bg-slate-950/20 border border-slate-800/40 rounded-lg">
              <span className="font-semibold text-violet-400 block mb-0.5">3. Main Body</span>
              <span className="text-slate-400">Step-by-step, code, config, real console commands.</span>
            </div>
            <div className="p-2 bg-slate-950/20 border border-slate-800/40 rounded-lg">
              <span className="font-semibold text-violet-400 block mb-0.5">4. Lessons</span>
              <span className="text-slate-400">What worked, didn't, or advice to your past self.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-2">
          <div>
            <h4 className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <span className="text-emerald-400 font-mono">✓</span> Good Signs
            </h4>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Includes screenshots & traces</li>
              <li>Terminal commands you ran</li>
              <li>Details only someone who did it knows</li>
              <li>Between 1000 and 1500 words</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <span className="text-rose-400 font-mono">✗</span> Avoid
            </h4>
            <ul className="space-y-1 text-slate-400 list-disc list-inside">
              <li>Document copy-pasting</li>
              <li>AI-generated placeholder tone</li>
              <li>Ad/Sales-pitch voice</li>
              <li>Generic: "Observability is key"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
