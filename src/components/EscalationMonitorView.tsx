import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Zap,
  Building,
  FileWarning,
} from 'lucide-react';
import { useGrievance } from '../context/GrievanceContext';

interface EscalationMonitorViewProps {
  onNavigateToTrack: (trackingId: string) => void;
}

export const EscalationMonitorView: React.FC<EscalationMonitorViewProps> = ({
  onNavigateToTrack,
}) => {
  const { complaints, runSlaEngine, resolveComplaint } = useGrievance();

  const [slaRunning, setSlaRunning] = useState(false);
  const [slaMessage, setSlaMessage] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [executiveDirective, setExecutiveDirective] = useState('');

  const escalatedComplaints = complaints.filter((c) => c.status === 'Escalated');

  // Also complaints that are past deadline but not yet marked escalated
  const now = new Date();
  const breachedNotYetEscalated = complaints.filter(
    (c) =>
      c.status !== 'Resolved' &&
      c.status !== 'Escalated' &&
      c.status !== 'Rejected' &&
      new Date(c.deadline) < now
  );

  const handleRunWatchdog = async () => {
    setSlaRunning(true);
    try {
      const escalatedCount = await runSlaEngine();
      if (escalatedCount > 0) {
        setSlaMessage(`⚡ ${escalatedCount} overdue complaint(s) auto-escalated to Dean's Desk!`);
      } else {
        setSlaMessage('✅ SLA Engine Check Complete: All tickets accounted for.');
      }
      setTimeout(() => setSlaMessage(null), 4000);
    } finally {
      setSlaRunning(false);
    }
  };

  const handleExecutiveResolution = async (complaintId: string) => {
    if (!executiveDirective.trim()) return;
    await resolveComplaint(
      complaintId,
      `[EXECUTIVE DIRECTIVE - DEAN'S OFFICE]: ${executiveDirective.trim()}`
    );
    setResolvingId(null);
    setExecutiveDirective('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Executive Header */}
      <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Higher Authority Oversight
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Dean's Escalation & SLA Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Petitions that exceed target departmental resolution windows auto-escalate to the Dean of Student Affairs. Review bottlenecks and issue binding executive remediation orders.
          </p>
        </div>

        <button
          onClick={handleRunWatchdog}
          disabled={slaRunning}
          className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition disabled:opacity-50 shrink-0 self-start md:self-center"
        >
          <Zap className={`w-4 h-4 ${slaRunning ? 'animate-spin' : ''}`} />
          <span>{slaRunning ? 'Scanning Deadlines...' : 'Run SLA Watchdog'}</span>
        </button>
      </div>

      {slaMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-200 text-xs font-semibold">
          {slaMessage}
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Active Escalations</span>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{escalatedComplaints.length}</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Pending Overdue</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{breachedNotYetEscalated.length}</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Redressal Committee</span>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Provost & Dean Authority</div>
          </div>
        </div>
      </div>

      {/* Escalated Complaints List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Escalated Petitions Requiring Executive Action</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {escalatedComplaints.length} cases under review
          </span>
        </div>

        {escalatedComplaints.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-slate-500 dark:text-slate-400 text-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="font-bold text-slate-900 dark:text-white">No Active Escalations</p>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              All grievances are currently being handled within their target SLA resolution windows.
            </p>
          </div>
        ) : (
          escalatedComplaints.map((c) => (
            <div
              key={c.id || c.complaintId}
              className="bg-white dark:bg-[#0b1322] border border-rose-200 dark:border-rose-900/50 rounded-xl p-5 shadow-xs space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/50">
                    {c.trackingId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {c.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/50">
                    {c.priority} Priority
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  SLA Target was: {new Date(c.deadline).toLocaleDateString()}
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{c.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{c.description}</p>
              </div>

              {/* Escalation Cause */}
              <div className="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs">
                <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">Escalation Trigger:</span>
                <p className="text-slate-700 dark:text-slate-300">
                  {c.escalationReason || 'Resolution window elapsed without departmental closure report.'}
                </p>
              </div>

              {/* Action bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 dark:text-slate-400">
                  Assigned Officer: <strong className="text-slate-800 dark:text-slate-200">{c.assignedOfficialName || 'None assigned'}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToTrack(c.trackingId)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition border border-slate-200 dark:border-slate-700"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => setResolvingId(resolvingId === (c.id || c.complaintId) ? null : (c.id || c.complaintId || null))}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Issue Executive Resolution</span>
                  </button>
                </div>
              </div>

              {/* Executive Directive input drawer */}
              {resolvingId === (c.id || c.complaintId) && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-in fade-in duration-150">
                  <label className="text-xs font-bold text-slate-900 dark:text-white block">
                    Dean Executive Directive & Remediation Order
                  </label>
                  <textarea
                    rows={2}
                    value={executiveDirective}
                    onChange={(e) => setExecutiveDirective(e.target.value)}
                    placeholder="e.g. Authorized emergency departmental repair requisition; contractor dispatched to resolve immediately."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none bg-white dark:bg-slate-900"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setResolvingId(null)}
                      className="px-3 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!executiveDirective.trim()}
                      onClick={() => handleExecutiveResolution(c.id || c.complaintId || '')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-50"
                    >
                      Execute Resolution
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
