import React, { useState } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Search,
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Fingerprint,
  Bell,
  Clock,
  ChevronDown,
  CheckCheck,
  CheckCircle2,
  LogOut,
  Building2,
  GraduationCap,
  EyeOff,
  UserCheck,
  Lock,
  Database,
  Sun,
  Moon,
} from 'lucide-react';
import { useGrievance } from '../context/GrievanceContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import logo from '../assets/logo.png';

interface NavbarProps {
  portalType: 'main' | 'staff';
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTeamInfo: () => void;
  onSelectComplaintForTracking?: (trackingId: string) => void;
  onLogout: () => void;
  isAuthenticated?: boolean;
  onOpenLogin?: (type?: 'main' | 'staff') => void;
  currentUser?: { name: string; roll?: string; email: string; role: UserRole } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  portalType,
  activeTab,
  setActiveTab,
  onOpenTeamInfo,
  onSelectComplaintForTracking,
  onLogout,
  isAuthenticated = false,
  onOpenLogin,
  currentUser = null,
}) => {
  const {
    currentRole,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    runSlaEngine,
    complaints,
  } = useGrievance();
  const { isDark, toggleTheme } = useTheme();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [slaRunning, setSlaRunning] = useState(false);
  const [slaResultMsg, setSlaResultMsg] = useState<string | null>(null);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  // Check overdue complaints
  const now = new Date();
  const overdueCount = complaints.filter(
    (c) =>
      c.status !== 'Resolved' &&
      c.status !== 'Rejected' &&
      new Date(c.deadline) < now
  ).length;

  const handleRunSla = async () => {
    setSlaRunning(true);
    setSlaResultMsg(null);
    try {
      const escalatedCount = await runSlaEngine();
      if (escalatedCount > 0) {
        setSlaResultMsg(`⚡ ${escalatedCount} overdue ticket(s) escalated to Dean!`);
      } else {
        setSlaResultMsg(`✅ All active grievances within SLA parameters.`);
      }
      setTimeout(() => setSlaResultMsg(null), 4000);
    } finally {
      setSlaRunning(false);
    }
  };

  // Main portal tabs vs Staff portal tabs
  const mainNavItems = [
    {
      id: 'submit',
      label: 'Lodge Grievance',
      icon: PlusCircle,
      badge: !isAuthenticated ? 'Login Req.' : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'track',
      label: 'Track Petition',
      icon: Search,
      badge: null,
    },
    {
      id: 'dashboard',
      label: 'Public Transparency',
      icon: LayoutDashboard,
      badge: null,
    },
  ];

  const staffNavItems = [
    {
      id: 'workbench',
      label: 'Officer Workbench',
      icon: ClipboardList,
      badge: complaints.filter((c) => c.status === 'Submitted' || c.status === 'Under Review').length || null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'escalations',
      label: 'Dean Escalations',
      icon: AlertTriangle,
      badge: complaints.filter((c) => c.status === 'Escalated').length || null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'dashboard',
      label: 'Transparency Hub',
      icon: LayoutDashboard,
      badge: null,
    },
  ];

  const navItems = portalType === 'staff' ? staffNavItems : mainNavItems;

  const roleLabels: Record<UserRole | 'anonymous', { title: string; subtitle: string; icon: string }> = {
    student: {
      title: currentUser?.name || 'Student Petitioner',
      subtitle: currentUser?.roll ? `Roll: ${currentUser.roll}` : 'Petitioner Account',
      icon: '🎓',
    },
    anonymous: {
      title: 'Student Petitioner',
      subtitle: 'Confidential Mode',
      icon: '🎓',
    },
    official: {
      title: currentUser?.name || 'Grievance Officer',
      subtitle: 'Official Authority',
      icon: '🏛️',
    },
    authority: {
      title: currentUser?.name || 'Dean of Student Affairs',
      subtitle: 'Higher Redressal Committee',
      icon: '⚖️',
    },
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === 'submit' && !isAuthenticated) {
      if (onOpenLogin) {
        onOpenLogin('main');
        return;
      }
    }
    setActiveTab(tabId);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#091322] border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Banner */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Institutional Grievance Platform • Verifiable Audit Trail Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          {slaResultMsg && (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded animate-in fade-in duration-200">
              {slaResultMsg}
            </span>
          )}

          {portalType === 'staff' && isAuthenticated && (
            <button
              onClick={handleRunSla}
              disabled={slaRunning}
              title="Scan all complaints and automatically escalate overdue tickets past SLA target"
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all hover:shadow-sm"
            >
              <Clock className={`w-3 h-3 ${slaRunning ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
              {slaRunning ? 'Evaluating SLA...' : 'Run SLA Watchdog'}
              {overdueCount > 0 && (
                <span className="bg-rose-500 text-white font-bold text-[9px] px-1 py-0.2 rounded-full">
                  {overdueCount} overdue
                </span>
              )}
            </button>
          )}

          {/* Portal Type Pill */}
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
              portalType === 'staff'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700/60'
                : 'bg-blue-950 text-blue-300 border-blue-700/60'
            }`}
          >
            {portalType === 'staff' ? 'Staff Portal' : 'Main Portal'}
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(portalType === 'staff' ? 'workbench' : 'dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <img
              src={logo}
              alt="The Vishanti Petition"
              className="h-11 w-auto object-contain"
            />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? portalType === 'staff'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : item.badgeColor || 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Persona / Guest, Notifications & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            /* User Persona Pill */
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-sm">{roleLabels[currentRole]?.icon || '👤'}</span>
              <div className="text-left hidden sm:block">
                <span className="font-semibold text-slate-200 block text-[11px] leading-tight">
                  {roleLabels[currentRole]?.title || 'Authenticated User'}
                </span>
                <span className="text-[9px] text-slate-400 block leading-none">
                  {roleLabels[currentRole]?.subtitle || 'Campus Account'}
                </span>
              </div>
            </div>
          ) : (
            /* Guest / Public Viewer Indicator */
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-sm">👁️</span>
              <div className="text-left hidden sm:block">
                <span className="font-semibold text-slate-300 block text-[11px] leading-tight">
                  Guest Viewer
                </span>
                <span className="text-[9px] text-slate-500 block leading-none">
                  Public Read-Only
                </span>
              </div>
            </div>
          )}

          {/* Quick Login button if not authenticated */}
          {!isAuthenticated && onOpenLogin && (
            <button
              onClick={() => onOpenLogin(portalType === 'staff' ? 'staff' : 'main')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}

          {/* Notifications Bell (Only when authenticated) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">System Notifications</span>
                      {unreadNotifs.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded font-semibold border border-rose-500/30">
                          {unreadNotifs.length} new
                        </span>
                      )}
                    </div>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id || notif.notificationId}
                          onClick={() => {
                            markNotificationAsRead(notif.id || notif.notificationId || '');
                            if (onSelectComplaintForTracking) {
                              onSelectComplaintForTracking(notif.trackingId);
                              setActiveTab('track');
                              setIsNotifOpen(false);
                            }
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-800/60 transition-colors ${
                            !notif.isRead ? 'bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-200 leading-snug">
                              {notif.title}
                            </p>
                            <span className="text-[9px] text-slate-500 font-mono shrink-0">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                              {notif.trackingId}
                            </span>
                            <span className="text-[10px] text-slate-500 hover:text-slate-300 underline">
                              Click to inspect
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Night Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition"
            title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            aria-label="Toggle Night Mode"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px]">Day</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden sm:inline text-[11px]">Night</span>
              </>
            )}
          </button>

          {/* Log Out / Exit to Home Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition"
            title={isAuthenticated ? 'Log out of portal' : 'Return to Landing Page'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAuthenticated ? 'Log Out' : 'Exit to Home'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="lg:hidden flex items-center justify-around overflow-x-auto px-2 py-2 border-t border-slate-800 bg-slate-950/80 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? portalType === 'staff' ? 'text-indigo-400' : 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive
                    ? portalType === 'staff'
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
