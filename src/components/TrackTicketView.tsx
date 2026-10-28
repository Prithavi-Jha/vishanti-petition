import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserCheck,
  EyeOff,
  Paperclip,
  FileText,
  Check,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';
import { useGrievance } from '../context/GrievanceContext';
import { Complaint, AuditEntry, Status } from '../types';
import { verifyAuditChain } from '../utils/crypto';

interface TrackTicketViewProps {
  initialTrackingId?: string;
  onNavigateToAuditLab?: (complaintId: string) => void;
}

export const TrackTicketView: React.FC<TrackTicketViewProps> = ({
  initialTrackingId = '',
}) => {
  const { complaints, getComplaintByTrackingId } = useGrievance();

  const [searchId, setSearchId] = useState(initialTrackingId || '');
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);

  useEffect(() => {
    if (initialTrackingId) {
      setSearchId(initialTrackingId);
      const found = getComplaintByTrackingId(initialTrackingId);
      if (found) {
        setSelectedTicket(found);
      }
    } else if (!selectedTicket && complaints.length > 0) {
      setSelectedTicket(complaints[0]);
      setSearchId(complaints[0].trackingId);
    }
  }, [initialTrackingId, complaints, getComplaintByTrackingId]);

  // Synchronize selected ticket
  useEffect(() => {
    if (selectedTicket) {
      const updated = complaints.find(
        (c) => c.trackingId === selectedTicket.trackingId || (c.id || c.complaintId) === (selectedTicket.id || selectedTicket.complaintId)
      );
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [complaints]);

  // Silent background verification of cryptographic chain
  useEffect(() => {
    async function checkChain() {
      if (selectedTicket?.auditTrail) {
        const result = await verifyAuditChain(selectedTicket.auditTrail);
        setIsChainValid(result.isValid);
      }
    }
    checkChain();
  }, [selectedTicket?.auditTrail]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = getComplaintByTrackingId(searchId);
    if (found) {
      setSelectedTicket(found);
    } else {
      setSelectedTicket(null);
    }
  };

  const lifecycleStages: Status[] = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

  const getStageIndex = (status: Status) => {
    if (status === 'Escalated') return 3;
    if (status === 'Rejected') return 1;
    return lifecycleStages.indexOf(status);
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
      {/* Search Header */}
      <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Real-Time Redressal Tracking
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            Track Petition Status
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your unique tracking ID to view assignment status, investigation notes, and SLA progress.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="e.g. VP-2026-H8912"
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-56"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-xs transition shrink-0"
          >
            Lookup
          </button>
        </form>
      </div>

      {!selectedTicket ? (
        <div className="text-center py-12 bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h4 className="text-base font-bold text-slate-900 dark:text-white">Petition Not Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            No grievance found with tracking ID "{searchId}". Please check the ID or search another record.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Ticket Banner */}
          <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                    {selectedTicket.trackingId}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      statusStyles[selectedTicket.status].bg
                    } ${statusStyles[selectedTicket.status].text} ${statusStyles[selectedTicket.status].border} dark:bg-opacity-20`}
                  >
                    {selectedTicket.status}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {selectedTicket.category}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                    {selectedTicket.priority} Priority
                  </span>
                  {selectedTicket.isPublic === false || selectedTicket.isAnonymous ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                      Confidential Submission
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Petitioner: {selectedTicket.petitionerName || 'Named Student'}
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedTicket.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* SLA & Officer Box */}
              <div className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shrink-0 lg:w-72 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Target SLA</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="text-xs">
                  {selectedTicket.status === 'Resolved' ? (
                    <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Resolved in Accordance with SLA</span>
                    </div>
                  ) : selectedTicket.status === 'Escalated' ? (
                    <div className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Overdue — Escalated to Dean</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Target Resolution:</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {new Date(selectedTicket.deadline).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Filed On:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned Official:</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400 truncate max-w-[130px]">
                      {selectedTicket.assignedOfficialName || 'Under Triaging'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Resolution Report if Resolved */}
            {selectedTicket.status === 'Resolved' && selectedTicket.resolutionNotes && (
              <div className="p-4 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Official Resolution Report (Closed by {selectedTicket.assignedOfficialName || 'Administration'})
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                  "{selectedTicket.resolutionNotes}"
                </p>
              </div>
            )}

            {/* Escalation Notice if Escalated */}
            {selectedTicket.status === 'Escalated' && (
              <div className="p-4 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Executive Escalation Notice</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                  {selectedTicket.escalationReason ||
                    'SLA resolution window elapsed without resolution report. Escalated to Dean of Student Affairs.'}
                </p>
              </div>
            )}

            {/* Evidence Attachments */}
            {selectedTicket.attachments.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  Supporting Evidence ({selectedTicket.attachments.length} files attached)
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.attachments.map((att) => (
                    <div
                      key={att.fileId || (att as any).id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="font-mono text-[11px]">{att.fileName || (att as any).name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lifecycle Progress Stepper */}
          <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Redressal Lifecycle Stages
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {lifecycleStages.map((stage, idx) => {
                const currentIdx = getStageIndex(selectedTicket.status);
                const isDone = currentIdx >= idx;
                const isCurrent = currentIdx === idx;

                return (
                  <div
                    key={stage}
                    className={`p-3 rounded-lg border text-left transition ${
                      isCurrent
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs'
                        : isDone
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                      </div>
                      <span className="font-bold text-xs">{stage}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Log & Audit Trail */}
          <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Activity Log & Audit Trail
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chronological record of official reviews, assignments, and status transitions
                </p>
              </div>

              {isChainValid && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Audit Trail Verified</span>
                </span>
              )}
            </div>

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
              {selectedTicket.auditTrail.map((block, idx) => (
                <div key={block.entryId || (block as any).id} className="relative pl-8">
                  <div className="absolute left-2.5 top-2 w-2.5 h-2.5 rounded-full -translate-x-1/2 bg-blue-600 border-2 border-white dark:border-slate-900 ring-2 ring-blue-100 dark:ring-blue-900/50" />
                  <div className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {block.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(block.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{block.details}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      Action by: <strong className="text-slate-700 dark:text-slate-300">{block.actorName}</strong> ({block.actorRole})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
