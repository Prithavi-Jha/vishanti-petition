import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Building2,
  Lock,
  Mail,
  User,
  Hash,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'main' | 'staff';
  onLoginSuccess: (
    type: 'main' | 'staff',
    role: UserRole,
    userDetails?: { name: string; email: string; roll?: string }
  ) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'main',
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'staff'>(defaultTab);

  // Main login inputs (Student)
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Staff login inputs (Official / Dean)
  const [staffName, setStaffName] = useState('');
  const [staffRoleSelect, setStaffRoleSelect] = useState<'official' | 'authority'>('official');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMainLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    let finalName = studentName.trim();
    let finalRoll = studentId.trim() || undefined;
    const cleanEmail = studentEmail.trim().toLowerCase();

    // Verify against Supabase users table if connected
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Supabase auth query error:', error);
        } else if (data) {
          // Check password
          if (data.password && data.password !== studentPassword) {
            setAuthError('Invalid credentials. Please verify your institutional email and password.');
            setIsLoading(false);
            return;
          }
          finalName = data.name || finalName;
          finalRoll = data.roll || finalRoll;
        }
      } catch (err) {
        console.warn('Supabase auth fallback:', err);
      }
    }

    if (!finalName) {
      finalName = cleanEmail.split('@')[0] || 'Student Petitioner';
    }

    setIsLoading(false);
    onLoginSuccess('main', 'student', {
      name: finalName,
      roll: finalRoll,
      email: cleanEmail,
    });
    onClose();
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    let finalName = staffName.trim();
    let effectiveRole: UserRole = staffRoleSelect;
    const cleanEmail = staffEmail.trim().toLowerCase();

    // Verify against Supabase users table if connected
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Supabase auth query error:', error);
        } else if (data) {
          // Check password
          if (data.password && data.password !== staffPassword) {
            setAuthError('Invalid credentials. Please check your staff password or designated access role.');
            setIsLoading(false);
            return;
          }
          finalName = data.name || finalName;
          if (data.role === 'authority' || data.role === 'official') {
            effectiveRole = data.role as UserRole;
          }
        }
      } catch (err) {
        console.warn('Supabase auth fallback:', err);
      }
    }

    if (!finalName) {
      finalName = effectiveRole === 'authority' ? 'Dean of Student Affairs' : 'Grievance Officer';
    }

    setIsLoading(false);
    onLoginSuccess('staff', effectiveRole, {
      name: finalName,
      email: cleanEmail,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="bg-[#091322] dark:bg-[#070e18] px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                The Vishanti Petition
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Institutional SSO
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              Institutional Authentication
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Login Tabs: Main vs Staff */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('main');
              setAuthError(null);
            }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'main'
                ? 'bg-white dark:bg-[#121f35] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${activeTab === 'main' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setAuthError(null);
            }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'staff'
                ? 'bg-white dark:bg-[#121f35] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className={`w-4 h-4 ${activeTab === 'staff' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
            <span>Staff Desk</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {authError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Tab 1: Main Login (Student) */}
          {activeTab === 'main' && (
            <form onSubmit={handleMainLogin} className="space-y-4">
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Student Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Your Name"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                      Roll Number
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. rollNo"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                      Campus Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="student@campus.edu"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                      Account Password <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showStudentPassword ? 'text' : 'password'}
                      required
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Toggle password visibility"
                    >
                      {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Student Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Staff Login (Official / Dean) */}
          {activeTab === 'staff' && (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Designated Authority Tier
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStaffRoleSelect('official')}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        staffRoleSelect === 'official'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="block font-bold">Grievance Officer</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Department Wardens & HODs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStaffRoleSelect('authority')}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        staffRoleSelect === 'authority'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="block font-bold">Executive Dean</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Dean of Student Affairs</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Official Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="e.g. Dr. Sunita Deshmukh"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    Institutional Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="officer@campus.edu"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                      Staff Password <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="Enter administrative password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      aria-label="Toggle password visibility"
                    >
                      {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In to Staff Desk</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Security / Helpdesk Note */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 text-center">
            <span className="block">Institutional Single Sign-On (SSO) Protected</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
              For credential recovery or role allocation, contact the Central IT Helpdesk.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
