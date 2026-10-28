import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  EyeOff,
  Filter,
  ArrowRight,
  Search,
  Building,
  GraduationCap,
  Wrench,
  AlertCircle,
  CreditCard,
  BookOpen,
  PieChart as PieIcon,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useGrievance } from '../context/GrievanceContext';
import { Category, Priority, Status } from '../types';

interface DashboardViewProps {
  onNavigateToTrack: (trackingId: string) => void;
  onNavigateToSubmit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTrack,
  onNavigateToSubmit,
}) => {
  const { complaints } = useGrievance();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculations
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const escalated = complaints.filter((c) => c.status === 'Escalated').length;
  const inProgress = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Under Review'
  ).length;
  const submitted = complaints.filter((c) => c.status === 'Submitted').length;
  const confidentialCount = complaints.filter((c) => c.isPublic === false || c.isAnonymous).length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const confidentialRate = total > 0 ? Math.round((confidentialCount / total) * 100) : 0;

  // Average resolution turnaround
  const resolvedWithDates = complaints.filter((c) => c.status === 'Resolved' && c.resolvedAt);
  let avgDays = 2.9;
  if (resolvedWithDates.length > 0) {
    const totalMs = resolvedWithDates.reduce((acc, c) => {
      const diff = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
      return acc + (diff > 0 ? diff : 0);
    }, 0);
    avgDays = Number((totalMs / resolvedWithDates.length / (24 * 3600 * 1000)).toFixed(1));
  }

  // Categories
  const categories: Category[] = [
    'Hostel & Mess',
    'Academic',
    'Infrastructure',
    'Financial & Fees',
    'Harassment & Safety',
    'Administration & Library',
  ];

  // Data for Recharts Bar Chart
  const categoryChartData = categories.map((cat) => {
    const count = complaints.filter((c) => c.category === cat).length;
    const catResolved = complaints.filter((c) => c.category === cat && c.status === 'Resolved').length;
    const catPending = count - catResolved;
    return {
      name: cat.split(' ')[0], // short label
      fullName: cat,
      Total: count,
      Resolved: catResolved,
      Pending: catPending,
    };
  });

  // Data for Recharts Status Pie Chart
  const statusPieData = [
    { name: 'Resolved', value: resolved, color: '#10b981' },
    { name: 'In Progress', value: inProgress, color: '#3b82f6' },
    { name: 'Submitted (New)', value: submitted, color: '#f59e0b' },
    { name: 'Escalated', value: escalated, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Filtered complaints list
  const filteredComplaints = complaints.filter((c) => {
    const matchCat = selectedCategoryFilter === 'All' || c.category === selectedCategoryFilter;
    const matchSearch =
      searchQuery === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const statusStyles: Record<Status, { bg: string; text: string; border: string }> = {
    Submitted: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    'Under Review': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    Assigned: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    'In Progress': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    Escalated: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    Rejected: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  };

  const priorityStyles: Record<Priority, string> = {
    Urgent: 'bg-rose-50 text-rose-700 border-rose-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Campus Transparency & Redressal Ledger
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Institutional Grievance Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Public statistics on grievance resolution times, common categories, and SLA compliance.
            Individual confidential details are protected in accordance with institutional policy.
          </p>
        </div>

        <button
          onClick={onNavigateToSubmit}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2 self-start md:self-center shrink-0"
        >
          <span>Lodge a Petition</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Grievances</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{total}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Recorded on university registry</p>
        </div>

        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{resolutionRate}%</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {resolved} of {total} closed with resolution notes
          </p>
        </div>

        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg. Turnaround</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {avgDays} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">days</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target institutional SLA maintained</p>
        </div>

        <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Escalated Cases</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">{escalated}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Under Dean / Provost review</p>
        </div>
      </div>

      {/* Visual Analytics with RECHARTS (Clean Institutional Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recharts Bar Chart: Volume by Category */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                Grievance Volume by Department
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of total, resolved, and active petitions across campus categories
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Recharts Visualization</span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryChartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Resolved Cases
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" /> Active / Pending
            </span>
          </div>
        </div>

        {/* Recharts Donut / Pie Chart: Status Breakdown */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4 flex flex-col justify-between transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Lifecycle Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Distribution across stages</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#091322',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#ffffff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Public Grievance Records Table */}
      <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Campus Grievance Registry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any petition to inspect its progress timeline and assigned official
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All" className="dark:bg-slate-900">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="dark:bg-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Ticket ID</th>
                <th className="pb-3">Subject</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Assigned To</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No petitions match your chosen criteria.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  const style = statusStyles[c.status];
                  const isConfidential = c.isPublic === false || c.isAnonymous;

                  return (
                    <tr
                      key={c.id || c.complaintId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition cursor-pointer group"
                      onClick={() => onNavigateToTrack(c.trackingId)}
                    >
                      <td className="py-3.5 pl-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {c.trackingId}
                      </td>
                      <td className="py-3.5 pr-4 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {c.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {isConfidential ? (
                            <span className="text-purple-600 dark:text-purple-400 font-medium">Confidential</span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-400">Public Record</span>
                          )}
                          <span>•</span>
                          <span>Filed {new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {c.category}
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityStyles[c.priority]}`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {c.assignedOfficialName || 'Under Triaging'}
                      </td>
                      <td className="py-3.5 pr-2 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToTrack(c.trackingId);
                          }}
                          className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition border border-slate-200 dark:border-slate-700"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
