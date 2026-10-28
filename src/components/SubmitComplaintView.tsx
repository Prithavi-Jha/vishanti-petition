import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusCircle,
  ShieldCheck,
  EyeOff,
  Eye,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Clock,
  Sparkles,
  Paperclip,
  X,
  Lock,
  GraduationCap,
  Send,
} from 'lucide-react';
import { useGrievance } from '../context/GrievanceContext';
import { Category, Priority, Attachment, Complaint } from '../types';
import { detectDuplicates } from '../utils/duplicateDetector';

interface SubmitComplaintViewProps {
  onTicketCreated: (trackingId: string) => void;
  onNavigateToTrack: (trackingId: string) => void;
  isAuthenticated?: boolean;
  currentUser?: { name: string; roll?: string; email: string } | null;
  onRequireLogin?: () => void;
}

export const SubmitComplaintView: React.FC<SubmitComplaintViewProps> = ({
  onTicketCreated,
  onNavigateToTrack,
  isAuthenticated = false,
  currentUser = null,
  onRequireLogin,
}) => {
  const { complaints, submitComplaint } = useGrievance();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Hostel & Mess');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [petitionerName, setPetitionerName] = useState(currentUser?.name || '');
  const [petitionerRoll, setPetitionerRoll] = useState(currentUser?.roll || '');
  const [petitionerEmail, setPetitionerEmail] = useState(currentUser?.email || '');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync user credentials whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setPetitionerName(currentUser.name);
      if (currentUser.roll) setPetitionerRoll(currentUser.roll);
      setPetitionerEmail(currentUser.email);
    }
  }, [currentUser]);

  // Live duplicate detection
  const duplicateMatches = useMemo(() => {
    if (title.trim().length < 5) return [];
    return detectDuplicates(title, description, category, complaints, 0.28);
  }, [title, description, category, complaints]);

  // STRICT AUTHENTICATION GUARD
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
              Access Restricted
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Authentication Required to Lodge a Petition
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              In accordance with campus governance rules, grievances must be filed by authenticated
              community members. This ensures accountability, prevents duplicate spam, and enables
              investigating officers to take verifiable action.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Petitioner Privacy & Confidentiality</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Once logged in, you can choose whether your petition is visible on the public registry or kept
              strictly confidential between you and the investigating officials.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onRequireLogin && (
              <button
                onClick={onRequireLogin}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Log In to Student Account</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToTrack('VP-2026-H8912')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition border border-slate-200 dark:border-slate-700"
            >
              Track Existing Petition by ID
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categories: { label: Category; desc: string }[] = [
    { label: 'Hostel & Mess', desc: 'Living conditions, water, electricity, dining hall' },
    { label: 'Academic', desc: 'Course syllabus, grading, examination clashes, faculty' },
    { label: 'Infrastructure', desc: 'Labs, Wi-Fi, classroom projectors, sports facilities' },
    { label: 'Harassment & Safety', desc: 'Anti-ragging, safety, ICC confidential complaints' },
    { label: 'Financial & Fees', desc: 'Fee receipts, scholarship approvals, dues clearance' },
    { label: 'Administration & Library', desc: 'ID cards, transcripts, library books, hostel gate' },
  ];

  const priorityMeta: Record<Priority, { label: string; sla: string; badge: string; desc: string }> = {
    Urgent: {
      label: 'Urgent',
      sla: '24 Hours SLA',
      badge: 'border-rose-400 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300',
      desc: 'Critical health/safety, zero water/power, or same-day exam clashes.',
    },
    High: {
      label: 'High',
      sla: '48 Hours SLA',
      badge: 'border-orange-400 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300',
      desc: 'Significant disruptions affecting multiple students or upcoming deadlines.',
    },
    Medium: {
      label: 'Medium',
      sla: '96 Hours (4 Days)',
      badge: 'border-amber-400 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300',
      desc: 'Standard maintenance or recurring service concerns.',
    },
    Low: {
      label: 'Low',
      sla: '7 Days',
      badge: 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300',
      desc: 'General suggestions or non-time-sensitive issues.',
    },
  };

  const removeAttachment = (fileId: string) => {
    setAttachments((prev) => prev.filter((a) => (a.fileId || (a as any).id) !== fileId));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const newAtt: Attachment = {
      fileId: `att-${Date.now()}`,
      fileName: file.name,
      fileUrl: '',
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    };
    setAttachments((prev) => [...prev, newAtt]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    if (!isAuthenticated) return;

    setIsSubmitting(true);
    try {
      const created = await submitComplaint({
        title,
        category,
        priority,
        description,
        isAnonymous,
        petitionerName,
        petitionerRoll,
        petitionerEmail,
        attachments,
      });

      setCreatedTicket(created);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Success Confirmation Screen
  if (createdTicket) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              Petition Successfully Lodged
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Unique Tracking ID Generated
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Your petition has been registered in the system. Use this tracking ID to follow its progress.
            </p>
          </div>

          {/* Tracking ID Copy Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                Your Tracking ID
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-blue-700 dark:text-blue-400 tracking-wider">
                {createdTicket.trackingId}
              </span>
            </div>
            <button
              onClick={() => handleCopyTrackingId(createdTicket.trackingId)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => onNavigateToTrack(createdTicket.trackingId)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-xs flex items-center justify-center gap-2"
            >
              <span>Track This Petition Now</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setCreatedTicket(null);
                setTitle('');
                setDescription('');
                setAttachments([]);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition border border-slate-200 dark:border-slate-700"
            >
              Lodge Another Petition
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 space-y-6 animate-in fade-in duration-200">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Official Petition Lodgement
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
          Submit an Institutional Grievance
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Submit your concerns to campus authorities. Every petition is monitored by institutional SLA resolution deadlines.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>1. Select Grievance Department</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-normal">Routes to Responsible Authority</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = category === cat.label;
              return (
                <button
                  type="button"
                  key={cat.label}
                  onClick={() => setCategory(cat.label)}
                  className={`text-left p-3.5 rounded-lg border transition ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 dark:border-blue-500 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{cat.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Matrix & SLA */}
        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-between">
            <span>2. Severity & Urgency Level</span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-normal flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Departmental SLA Window
            </span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['Urgent', 'High', 'Medium', 'Low'] as Priority[]).map((p) => {
              const meta = priorityMeta[p];
              const isSelected = priority === p;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`p-3 rounded-lg border text-left transition ${
                    isSelected
                      ? `${meta.badge} ring-1 ring-blue-500`
                      : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{meta.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {meta.sla.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{meta.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grievance Details & Live Duplicate Detection */}
        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
            3. Grievance Details
          </label>

          {/* Title */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Subject Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Disrupted water supply in Hostel Block C 3rd floor"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Duplicate Detection Alert */}
          {duplicateMatches.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Similar Petition Found ({duplicateMatches[0].similarity}% match)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                A similar petition is already active in this department. Reviewing existing cases prevents duplicate work:
              </p>
              <div className="space-y-1.5">
                {duplicateMatches.slice(0, 2).map((match) => (
                  <div
                    key={match.complaint.id || match.complaint.complaintId}
                    className="p-2 rounded bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-[11px] mr-2">
                        {match.complaint.trackingId}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold line-clamp-1 inline">
                        {match.complaint.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateToTrack(match.complaint.trackingId)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold shrink-0"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact location, time when issue started, affected students, previous attempts to resolve..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-y"
            />
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                Supporting Evidence / Attachments (Optional)
              </label>
              <span className="text-[11px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
            </div>

            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/40 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400"
              >
                <Upload className="w-5 h-5 text-slate-400 mb-0.5" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload document or image</span>
                <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {attachments.map((att) => (
                  <div
                    key={att.fileId || (att as any).id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="font-mono text-[11px] truncate max-w-xs">{att.fileName || (att as any).name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.fileId || (att as any).id)}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Public vs Confidential Visibility Toggle */}
        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg border mt-0.5 ${
                isAnonymous
                  ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-300'
                  : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300'
              }`}>
                {isAnonymous ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isAnonymous ? 'Confidential Submission (Restricted to Officials)' : 'Public Record (Visible on Registry)'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Choose whether your petition subject is visible on the student public registry or kept confidential to investigating officers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs shrink-0">
              <button
                type="button"
                onClick={() => setIsAnonymous(false)}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  !isAnonymous
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setIsAnonymous(true)}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  isAnonymous
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Confidential
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            {isAnonymous ? (
              <p className="text-[11px] leading-relaxed">
                <strong className="text-purple-700 dark:text-purple-400">Confidential Mode:</strong> Your name and roll ID are hidden from public student views (displayed as Anonymous Petitioner). Only authorized investigating officials and the Dean will have access to your identity for verification.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed">
                <strong className="text-blue-700 dark:text-blue-400">Public Record Mode:</strong> Your petition is listed on the public transparency registry so other students can track progress and avoid duplicate reports.
              </p>
            )}
          </div>

          {/* Petitioner Details (Pre-filled from session) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block mb-1">Petitioner Name</label>
              <input
                type="text"
                value={petitionerName}
                onChange={(e) => setPetitionerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block mb-1">Roll / Student ID</label>
              <input
                type="text"
                value={petitionerRoll}
                onChange={(e) => setPetitionerRoll(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block mb-1">Campus Email</label>
              <input
                type="email"
                value={petitionerEmail}
                onChange={(e) => setPetitionerEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Submission will be routed to the appropriate department head
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Registering Petition...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Grievance</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
