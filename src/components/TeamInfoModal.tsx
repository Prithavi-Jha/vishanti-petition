import React from 'react';
import {
  ShieldAlert,
  Users,
  Award,
  Lock,
  GitBranch,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  FileCheck2,
} from 'lucide-react';

interface TeamInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamInfoModal: React.FC<TeamInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                WEBSTER 2026
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                TEAM ID: 226
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">
              TEAM: THREE EYES
            </h2>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Team Members (Webster 2026)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
              <p className="text-sm font-semibold text-white">prithavi narayan jha</p>
              <p className="text-xs text-indigo-400 font-mono mt-0.5">ID: 20263554 • CSE</p>
              <p className="text-[11px] text-slate-500 font-mono">@always_don</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
              <p className="text-sm font-semibold text-white">yashika agrawal</p>
              <p className="text-xs text-indigo-400 font-mono mt-0.5">ID: 20263579 • CSE</p>
              <p className="text-[11px] text-slate-500 font-mono">@yashika_lnl1350</p>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
              <p className="text-sm font-semibold text-white">ashish singh</p>
              <p className="text-xs text-indigo-400 font-mono mt-0.5">ID: 20263061 • CSE</p>
              <p className="text-[11px] text-slate-500 font-mono">@ashish0.28_67208</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-900/40">
            <h4 className="text-sm font-bold text-indigo-200 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Platform Mission: The Vishanti Petition
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Institutional grievance handling often suffers from lack of transparency, lost accountability,
              and silent inaction. The Vishanti Petition creates a trustless, transparent ecosystem where every
              grievance is tracked via an immutable cryptographic audit trail, overdue issues auto-escalate to
              deans, and recurrence is flagged before it multiplies.
            </p>
          </div>

          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Engineered Core Features Implemented
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex gap-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">SHA-256 Hash Chaining</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Every status shift or assignment is cryptographically linked to the prior block's hash.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Automatic SLA Escalation</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Overdue tickets breach SLA boundaries and auto-escalate to the Dean's Desk.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <FileCheck2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Duplicate Detection Engine</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Live semantic token comparison prevents duplicate filing and highlights campus trends.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <GitBranch className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Anonymous Grievance Routing</span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Identity is concealed while generating verifiable, publicly trackable unique ticket IDs.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 font-mono">
            Original Specification: ThreeEyes_1stYear_Webster_2026.pdf
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow"
          >
            Explore Platform
          </button>
        </div>
      </div>
    </div>
  );
};
