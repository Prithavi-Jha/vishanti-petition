import React, { useState } from 'react';
import {
  ClipboardList,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  UserPlus,
  X,
  Building2,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useGrievance } from '../context/GrievanceContext';
import { Complaint, Official, Status, Priority, Category } from '../types';

interface OfficerWorkbenchProps {
  onNavigateToTrack: (trackingId: string) => void;
}

export const OfficerWorkbench: React.FC<OfficerWorkbenchProps> = ({ onNavigateToTrack }) => {
  const {
    complaints,
    officials,
    updateStatus,
    assignOfficial,
    resolveComplaint,
    escalateComplaint,
  } = useGrievance();

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Selected complaint for action modal
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [actionType, setActionType] = useState<'assign' | 'status' | 'resolve' | 'escalate' | null>(null);

  // Form states
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<Status>('In Progress');
  const [actionRemarks, setActionRemarks] = useState('');
  const [resolutionReport, setResolutionReport] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const catMatch = filterCategory === 'All' || c.category === filterCategory;
    const statusMatch = filterStatus === 'All' || c.status === filterStatus;
    const searchMatch =
      search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.trackingId.toLowerCase().includes(search.toLowerCase());
    return catMatch && statusMatch && searchMatch;
  });

  const handleOpenAction = (complaint: Complaint, type: 'assign' | 'status' | 'resolve' | 'escalate') => {
    setActiveComplaint(complaint);
    setActionType(type);
    setActionRemarks('');
    setResolutionReport('');
    setEscalationReason('');
    setSelectedOfficialId(officials[0]?.officialId || (officials[0] as any)?.id || '');
    setTargetStatus(complaint.status === 'Submitted' ? 'Under Review' : 'In Progress');
  };

  const handleExecuteAction = async () => {
    if (!activeComplaint) return;
    setIsProcessing(true);
    try {
      const complaintId = activeComplaint.id || activeComplaint.complaintId || '';
      if (actionType === 'assign') {
        await assignOfficial(complaintId, selectedOfficialId, actionRemarks);
      } else if (actionType === 'status') {
        await updateStatus(complaintId, targetStatus, actionRemarks);
      } else if (actionType === 'resolve') {
        await resolveComplaint(complaintId, resolutionReport || 'Resolved in accordance with institutional guidelines.');
      } else if (actionType === 'escalate') {
        await escalateComplaint(complaintId, escalationReason || 'Manual escalation initiated by Grievance Officer.');
      }
      setActionType(null);
      setActiveComplaint(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const statusStyles: Record<Status, { bg: string; text: string; border: string }> = {
    Submitted: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    'Under Review': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Assigned: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    'In Progress': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Escalated: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    Rejected: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Workbench Header */}
      <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Official Administration Desk
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Grievance Triage & Resolution Workbench
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review petitions, assign investigating officers, update lifecycle status, and record verified resolutions.
          </p>
        </div>

        {/* Triage Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold">
            {complaints.filter((c) => c.status === 'Submitted' || c.status === 'Under Review').length} Awaiting Action
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 font-semibold">
            {complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length} In Progress
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold">
            {complaints.filter((c) => c.status === 'Resolved').length} Resolved
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by title or ticket ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
            />
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900">
            <span className="text-slate-500 dark:text-slate-400">Department:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="All" className="dark:bg-slate-900">All Departments</option>
              <option value="Hostel & Mess" className="dark:bg-slate-900">Hostel & Mess</option>
              <option value="Academic" className="dark:bg-slate-900">Academic</option>
              <option value="Infrastructure" className="dark:bg-slate-900">Infrastructure</option>
              <option value="Harassment & Safety" className="dark:bg-slate-900">Harassment & Safety</option>
              <option value="Financial & Fees" className="dark:bg-slate-900">Financial & Fees</option>
              <option value="Administration & Library" className="dark:bg-slate-900">Administration & Library</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="All" className="dark:bg-slate-900">All Statuses</option>
              <option value="Submitted" className="dark:bg-slate-900">Submitted</option>
              <option value="Under Review" className="dark:bg-slate-900">Under Review</option>
              <option value="Assigned" className="dark:bg-slate-900">Assigned</option>
              <option value="In Progress" className="dark:bg-slate-900">In Progress</option>
              <option value="Resolved" className="dark:bg-slate-900">Resolved</option>
              <option value="Escalated" className="dark:bg-slate-900">Escalated</option>
            </select>
          </div>
        </div>

        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
          Showing {filtered.length} of {complaints.length} petitions
        </span>
      </div>

      {/* Complaints List Cards */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs shadow-xs">
            No petitions match the chosen filters.
          </div>
        ) : (
          filtered.map((c) => {
            const isOverdue =
              c.status !== 'Resolved' &&
              c.status !== 'Rejected' &&
              new Date(c.deadline) < new Date();
            const statusStyle = statusStyles[c.status];
            const isConfidential = c.isPublic === false || c.isAnonymous;

            return (
              <div
                key={c.id || c.complaintId}
                className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">
                      {c.trackingId}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {c.category}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold border ${
                        c.priority === 'Urgent'
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                          : c.priority === 'High'
                          ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                      }`}
                    >
                      {c.priority} Priority
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} dark:bg-opacity-20`}
                    >
                      {c.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isConfidential ? (
                        <span className="text-purple-700 dark:text-purple-300 font-medium bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900/50">
                          Confidential to Public
                        </span>
                      ) : (
                        <span>Student: {c.petitionerName || 'Named'}</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/50 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> SLA Overdue
                      </span>
                    )}
                    <span className="text-slate-500 dark:text-slate-400">
                      Due: {new Date(c.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{c.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>
                      Officer: <strong className="text-slate-800 dark:text-slate-200">{c.assignedOfficialName || 'Unassigned'}</strong>
                    </span>
                    <span>•</span>
                    <span>{c.auditTrail.length} action records</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenAction(c, 'assign')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition border border-slate-200 dark:border-slate-700"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Assign</span>
                    </button>

                    <button
                      onClick={() => handleOpenAction(c, 'status')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition border border-slate-200 dark:border-slate-700"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Update Status</span>
                    </button>

                    {c.status !== 'Resolved' && (
                      <button
                        onClick={() => handleOpenAction(c, 'resolve')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition border border-emerald-200 dark:border-emerald-800/60"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Resolve</span>
                      </button>
                    )}

                    {c.status !== 'Escalated' && (
                      <button
                        onClick={() => handleOpenAction(c, 'escalate')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-1 transition border border-rose-200 dark:border-rose-800/60"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Escalate</span>
                      </button>
                    )}

                    <button
                      onClick={() => onNavigateToTrack(c.trackingId)}
                      className="px-2.5 py-1.5 rounded text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Execution Modal */}
      {actionType && activeComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setActionType(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/50">
                {activeComplaint.trackingId}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {actionType === 'assign' && 'Assign Department Official'}
                {actionType === 'status' && 'Update Complaint Progress Status'}
                {actionType === 'resolve' && 'Close & Record Resolution Report'}
                {actionType === 'escalate' && 'Escalate Grievance to Dean Office'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {activeComplaint.title}
              </p>
            </div>

            {/* Action Content Fields */}
            {actionType === 'assign' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Select Official</label>
                  <select
                    value={selectedOfficialId}
                    onChange={(e) => setSelectedOfficialId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {officials.map((o) => (
                      <option key={o.officialId || (o as any).id} value={o.officialId || (o as any).id} className="dark:bg-slate-900">
                        {o.name} — {o.role} ({o.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Investigation Directive / Note</label>
                  <textarea
                    rows={2}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="e.g. Conduct immediate on-site inspection and submit report within 24h."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}

            {actionType === 'status' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Target Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as Status)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Under Review" className="dark:bg-slate-900">Under Review (Triaging)</option>
                    <option value="In Progress" className="dark:bg-slate-900">In Progress (Active remediation)</option>
                    <option value="Rejected" className="dark:bg-slate-900">Rejected (Out of university scope)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Progress Remarks for Student</label>
                  <textarea
                    rows={2}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="e.g. Facilities vendor contacted, replacement scheduled for tomorrow morning."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}

            {actionType === 'resolve' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                  <span className="font-semibold block">Official Resolution Notice:</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    This will mark the petition resolved on the student portal and campus registry.
                  </p>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Resolution Findings & Remedial Action <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={resolutionReport}
                    onChange={(e) => setResolutionReport(e.target.value)}
                    placeholder="Detail the remedial actions taken, repairs completed, or policy clarifications provided..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}

            {actionType === 'escalate' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300">
                  <span className="font-semibold block">Manual Escalation to Dean:</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    This will elevate the grievance to the Dean of Student Affairs / Redressal Committee.
                  </p>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Reason for Escalation <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Describe administrative bottlenecks or policy requirements needing executive intervention..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Action will be permanently recorded in audit history
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecuteAction}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition"
                >
                  {isProcessing ? 'Recording...' : 'Confirm & Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
