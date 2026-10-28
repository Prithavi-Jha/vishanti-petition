import React, { useState } from 'react';
import { GrievanceProvider, useGrievance } from './context/GrievanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { HomePageView } from './components/HomePageView';
import { LoginModal } from './components/LoginModal';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SubmitComplaintView } from './components/SubmitComplaintView';
import { TrackTicketView } from './components/TrackTicketView';
import { OfficerWorkbench } from './components/OfficerWorkbench';
import { EscalationMonitorView } from './components/EscalationMonitorView';
import { TeamInfoModal } from './components/TeamInfoModal';
import { ShieldCheck, Users, LogOut, ArrowLeft, Building2, GraduationCap } from 'lucide-react';
import { UserRole } from './types';

function AppContent() {
  // Session State: 'home' | 'authenticated'
  const [sessionState, setSessionState] = useState<'home' | 'authenticated'>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    roll?: string;
    role: UserRole;
  } | null>(null);

  const [portalType, setPortalType] = useState<'main' | 'staff'>('main');

  // Authenticated tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedTrackingId, setSelectedTrackingId] = useState<string>('');

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalTab, setLoginModalTab] = useState<'main' | 'staff'>('main');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);

  const { isLoading, setCurrentRole } = useGrievance();

  const handleOpenLogin = (defaultTab: 'main' | 'staff' = 'main') => {
    setLoginModalTab(defaultTab);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (
    type: 'main' | 'staff',
    role: UserRole,
    userDetails?: { name: string; email: string; roll?: string }
  ) => {
    setIsAuthenticated(true);
    setCurrentUser({
      name: userDetails?.name || (type === 'staff' ? 'Authorized Official' : 'Student Petitioner'),
      email: userDetails?.email || '',
      roll: userDetails?.roll,
      role,
    });
    setPortalType(type);
    setCurrentRole(role);
    setSessionState('authenticated');

    if (type === 'staff') {
      setActiveTab('workbench');
    } else {
      setActiveTab('submit');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSessionState('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToTrack = (trackingId: string) => {
    setSelectedTrackingId(trackingId);
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guest viewers browsing public dashboard
  const handlePublicDashboardClick = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPortalType('main');
    setSessionState('authenticated');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Guest viewers searching a ticket directly
  const handleHomeTrackClick = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPortalType('main');
    setSessionState('authenticated');
    setActiveTab('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#091322] flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white animate-bounce shadow-xl shadow-blue-500/30">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="mt-4 text-xs font-mono font-semibold tracking-wider text-slate-400">
          INITIALIZING THE VISHANTI PETITION LEDGER...
        </p>
      </div>
    );
  }

  // 1. Home Page
  if (sessionState === 'home') {
    return (
      <>
        <HomePageView
          onOpenLogin={handleOpenLogin}
          onOpenPublicDashboard={handlePublicDashboardClick}
          onOpenTrackTicket={handleHomeTrackClick}
          onOpenTeamInfo={() => setIsTeamModalOpen(true)}
        />

        {/* Login Modal (Main Login & Staff Login) */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          defaultTab={loginModalTab}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Team Modal */}
        <TeamInfoModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
        />
      </>
    );
  }

  // 2. Portal Layout (Clean Institutional Theme)
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070e18] text-slate-800 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Portal Navbar */}
      <Navbar
        portalType={portalType}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTeamInfo={() => setIsTeamModalOpen(true)}
        onSelectComplaintForTracking={handleNavigateToTrack}
        onLogout={handleLogout}
        isAuthenticated={isAuthenticated}
        onOpenLogin={handleOpenLogin}
        currentUser={currentUser}
      />

      {/* Portal Header Indicator */}
      <div className="bg-white dark:bg-[#0b1322] border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-slate-900 dark:text-white font-bold">
              {portalType === 'staff'
                ? '🏛️ Staff Administration Desk'
                : isAuthenticated
                ? '🎓 Student Grievance Portal'
                : '👁️ Public Transparency Registry (Guest)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <button
                onClick={() => handleOpenLogin('main')}
                className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Log In to Lodge Petitions →</span>
              </button>
            ) : portalType === 'main' ? (
              <button
                onClick={() => handleOpenLogin('staff')}
                className="text-[11px] text-indigo-600 hover:underline font-semibold"
              >
                Switch to Staff Login →
              </button>
            ) : (
              <button
                onClick={() => handleOpenLogin('main')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Switch to Main Login →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Guard for Staff portal when not authenticated */}
        {portalType === 'staff' && !isAuthenticated ? (
          <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4 bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Staff Login Required</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              The Officer Workbench and Dean Escalation Desk require authorized university official
              credentials. Please log in to proceed.
            </p>
            <button
              onClick={() => handleOpenLogin('staff')}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-xs transition"
            >
              Log In to Staff Portal
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigateToTrack={handleNavigateToTrack}
                onNavigateToSubmit={() => {
                  if (!isAuthenticated) {
                    handleOpenLogin('main');
                  } else {
                    setActiveTab('submit');
                  }
                }}
              />
            )}

            {activeTab === 'submit' && (
              <SubmitComplaintView
                onTicketCreated={handleNavigateToTrack}
                onNavigateToTrack={handleNavigateToTrack}
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
                onRequireLogin={() => handleOpenLogin('main')}
              />
            )}

            {activeTab === 'track' && (
              <TrackTicketView
                initialTrackingId={selectedTrackingId}
              />
            )}

            {activeTab === 'workbench' && (
              <OfficerWorkbench onNavigateToTrack={handleNavigateToTrack} />
            )}

            {activeTab === 'escalations' && (
              <EscalationMonitorView onNavigateToTrack={handleNavigateToTrack} />
            )}
          </>
        )}
      </main>

      {/* Portal Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 tracking-tight">The Vishanti Petition</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500">
              {portalType === 'staff'
                ? 'Staff Authority Workspace'
                : isAuthenticated
                ? 'Student Grievance Portal'
                : 'Public Registry Viewer'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1.5 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>About Platform</span>
            </button>
            <span className="text-slate-200 dark:text-slate-700">•</span>
            <button
              onClick={handleLogout}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 font-semibold"
            >
              <LogOut className="w-3 h-3" />
              <span>{isAuthenticated ? 'Log Out' : 'Back to Home'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        defaultTab={loginModalTab}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Team Modal */}
      <TeamInfoModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GrievanceProvider>
        <AppContent />
      </GrievanceProvider>
    </ThemeProvider>
  );
}
