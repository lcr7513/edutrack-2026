import React from 'react';
import { 
  GraduationCap, 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  Calendar, 
  Target, 
  Timer, 
  Sparkles, 
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  LogIn,
  Bot
} from 'lucide-react';
import { GoogleSheetsConfig, CurrentUserSession } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  sheetsConfig: GoogleSheetsConfig;
  onQuickSync: () => void;
  isSyncing: boolean;
  upcomingExamDays?: number;
  userSession?: CurrentUserSession;
  pendingStudentCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  sheetsConfig,
  onQuickSync,
  isSyncing,
  upcomingExamDays,
  userSession,
  pendingStudentCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard', label: '종합 대시보드', icon: LayoutDashboard },
    { id: 'students', label: '학생 인적사항 & 교사승인', icon: Users, badge: pendingStudentCount > 0 ? pendingStudentCount : undefined },
    { id: 'goals', label: '학업목표 & 과목', icon: Target },
    { id: 'planner', label: '학습 플래너', icon: Calendar },
    { id: 'timer', label: '집중 타이머', icon: Timer },
    { id: 'ai_tutor', label: 'AI 튜터 Q&A', icon: Bot },
    { id: 'ai', label: 'AI 학업 컨설턴트', icon: Sparkles },
    { id: 'sheets', label: '구글 시트 연동', icon: FileSpreadsheet },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner / Brand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-slate-900">EduTrack</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  학업계획 & 학습관리
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                체계적인 학업 계획 수립과 Google Sheets 실시간 연동
              </p>
            </div>
          </div>

          {/* Quick Actions & Sync Status */}
          <div className="flex items-center space-x-3">
            {/* User session status button */}
            {userSession && userSession.role === 'teacher' ? (
              <button
                onClick={() => setCurrentTab('students')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold transition-colors"
                title="교사 관리 센터"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">{userSession.teacher?.name} (교사)</span>
                {pendingStudentCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            ) : userSession && userSession.role === 'student' && userSession.student ? (
              <button
                onClick={() => setCurrentTab('students')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
                title="학생 정보 확인"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{userSession.student.name} ({userSession.student.studentNumber})</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentTab('students')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">학생 등록 / 로그인</span>
              </button>
            )}

            {upcomingExamDays !== undefined && (
              <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>주요 시험 D-{upcomingExamDays}</span>
              </div>
            )}

            {/* Google Sheets Status Pill */}
            {sheetsConfig.spreadsheetId ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onQuickSync}
                  disabled={isSyncing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition-colors"
                  title="구글 시트 즉시 동기화"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? '동기화 중...' : '시트 동기화'}</span>
                </button>
                {sheetsConfig.spreadsheetUrl && (
                  <a
                    href={sheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                    title="Google Sheets에서 열기"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden md:inline">시트 열기</span>
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('sheets')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-medium transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>구글 시트 연결</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                    {tab.badge}
                  </span>
                )}
                {tab.id === 'sheets' && sheetsConfig.spreadsheetId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

