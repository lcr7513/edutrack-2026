import React from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Play, 
  Plus, 
  Sparkles, 
  Target, 
  TrendingUp, 
  ArrowRight,
  FileSpreadsheet,
  AlertTriangle,
  Award,
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Send,
  Bot
} from 'lucide-react';
import { Subject, AcademicGoal, StudyTask, ExamCountdown, StudyLog, GoogleSheetsConfig, CurrentUserSession, StudentProfile } from '../types';

interface DashboardViewProps {
  subjects: Subject[];
  goals: AcademicGoal[];
  tasks: StudyTask[];
  exams: ExamCountdown[];
  studyLogs: StudyLog[];
  sheetsConfig: GoogleSheetsConfig;
  userSession?: CurrentUserSession;
  students?: StudentProfile[];
  onNavigateTab: (tab: string) => void;
  onToggleTask: (taskId: string) => void;
  onQuickSync: () => void;
  isSyncing: boolean;
  onStartTimerWithTask?: (taskId: string, subjectId: string, taskTitle: string) => void;
  onOpenSubmitModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  subjects,
  goals,
  tasks,
  exams,
  studyLogs,
  sheetsConfig,
  userSession,
  students = [],
  onNavigateTab,
  onToggleTask,
  onQuickSync,
  isSyncing,
  onStartTimerWithTask,
  onOpenSubmitModal,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === today);
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed');
  const todayTaskPercent = todayTasks.length ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 0;

  const pendingStudents = students.filter((s) => s.status === 'pending');

  // Study hours calculations
  const totalWeeklyTargetHours = subjects.reduce((sum, s) => sum + (s.weeklyTargetHours || 0), 0);
  const totalStudyMinutes = studyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);
  const weeklyStudyPercent = totalWeeklyTargetHours > 0 
    ? Math.min(100, Math.round(((totalStudyMinutes / 60) / totalWeeklyTargetHours) * 100))
    : 0;

  // Upcoming Exams sorted by closest date
  const sortedExams = [...exams].sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

  const calculateDDay = (targetDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const now = new Date(today).getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getSubject = (subId?: string) => subjects.find((s) => s.id === subId);

  return (
    <div className="space-y-6 pb-12">
      {/* Student/Teacher Welcome & Quick Registration Card */}
      {userSession?.role === 'teacher' ? (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-indigo-950">{userSession.teacher?.name} 선생님 모드</span>
                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">교사 관리자</span>
              </div>
              <p className="text-xs text-indigo-700 mt-0.5">
                {userSession.teacher?.school && userSession.teacher.school !== '인천고등학교' ? `${userSession.teacher.school} · ` : ''}등록 학생 {students.length}명 관리 중
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {pendingStudents.length > 0 && (
              <button
                onClick={() => onNavigateTab('students')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs animate-pulse flex items-center space-x-1"
              >
                <span>신규 학생 승인 대기 {pendingStudents.length}건</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onNavigateTab('students')}
              className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold rounded-xl transition-colors"
            >
              학생 명부 및 승인 관리
            </button>
          </div>
        </div>
      ) : userSession?.role === 'student' && userSession.student ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-emerald-950">
                  {userSession.student.name} 학생 ({userSession.student.school && userSession.student.school !== '인천고등학교' ? `${userSession.student.school} ` : ''}{userSession.student.grade || '1'}학년 {userSession.student.classNum || '1'}반 {userSession.student.studentNumber})
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  userSession.student.status === 'approved' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {userSession.student.status === 'approved' ? '승인 완료' : '승인 대기 중'}
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                {userSession.student.status === 'approved' 
                  ? '오늘의 학업 목표를 확인하고 플래너를 체계적으로 관리하세요.' 
                  : '선생님의 등록 승인을 기다리는 중입니다. 승인 후 플래너가 정상 동기화됩니다.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('students')}
            className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl transition-colors shrink-0"
          >
            내 인적사항 확인
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">학생 인적사항 등록 & 교사 승인 시스템</div>
              <p className="text-xs text-slate-500 mt-0.5">
                학교·학번·이름·비밀번호로 학생 정보를 등록하고, 교사 승인을 받아 학업을 관리해 보세요.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigateTab('students')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>학생 등록 / 로그인</span>
            </button>
            <button
              onClick={() => onNavigateTab('students')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              교사 로그인
            </button>
          </div>
        </div>
      )}

      {/* Top Banner / Welcome & Quick Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EduTrack Academic Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              오늘의 학업 계획과 학습 현황
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              목표를 향해 꾸준히 전진하세요. 오늘 등록된 할 일 <strong className="text-indigo-300">{todayTasks.length}개</strong> 중 <strong className="text-emerald-400">{completedTodayTasks.length}개 완료</strong>되었습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenSubmitModal && (
              <button
                onClick={onOpenSubmitModal}
                className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all transform active:scale-95"
                title="선생님 구글 시트로 작성한 플래너 및 학업 데이터 전송"
              >
                <Send className="w-4 h-4" />
                <span>구글 시트 제출</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('timer')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>집중 타이머 시작</span>
            </button>
            <button
              onClick={() => onNavigateTab('planner')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>할 일 추가</span>
            </button>
          </div>
        </div>

        {/* Stats Grid inside Hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>오늘 달성률</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{todayTaskPercent}%</div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${todayTaskPercent}%` }} 
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>주간 누적 학습</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {totalStudyHours} <span className="text-xs font-normal text-slate-300">/ {totalWeeklyTargetHours}시간</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${weeklyStudyPercent}%` }} 
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>등록 과목</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{subjects.length}개 과목</div>
            <p className="text-[11px] text-slate-400 mt-1">목표 학점 A+ 지향</p>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300">
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>구글 시트 연동</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1.5 flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${sheetsConfig.spreadsheetId ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="truncate">
                {sheetsConfig.spreadsheetId ? '연결됨 (실시간)' : '미연결'}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('sheets')}
              className="text-[11px] text-indigo-300 hover:text-indigo-200 underline mt-1 block text-left"
            >
              {sheetsConfig.spreadsheetId ? '시트 설정 보기' : '지금 연동하기'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: D-Day & Today's Planner & Subject Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today's Tasks & D-Day Timeline */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Exam & Assignment Countdown (D-Day) Cards */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-slate-900">주요 시험 & 평가 D-Day</h2>
              </div>
              <button
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>전체 일정</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {sortedExams.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm">
                등록된 시험 일정이 없습니다. 학업 목표 탭에서 일정을 추가해보세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {sortedExams.map((exam) => {
                  const dDay = calculateDDay(exam.examDate);
                  const sub = getSubject(exam.subjectId);
                  const isUrgent = dDay <= 7 && dDay >= 0;
                  const isPast = dDay < 0;

                  return (
                    <div
                      key={exam.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isUrgent 
                          ? 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-200' 
                          : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-white truncate max-w-[140px]"
                          style={{ backgroundColor: sub?.color || '#4F46E5' }}
                        >
                          {sub?.name || '과목'}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isPast 
                              ? 'bg-slate-200 text-slate-600'
                              : isUrgent 
                              ? 'bg-rose-600 text-white animate-pulse' 
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {isPast ? `종료 (${Math.abs(dDay)}일 전)` : dDay === 0 ? 'D-Day 오늘!' : `D-${dDay}`}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">{exam.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        일정: {exam.examDate} | 목표: <strong className="text-slate-700">{exam.targetScore}</strong>
                      </p>

                      {exam.keyTopics && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center space-x-1">
                          <span className="font-semibold text-slate-700 shrink-0">범위:</span>
                          <span className="truncate">{exam.keyTopics}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's Planner Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">오늘의 학습 플래너</h2>
                <span className="text-xs font-medium text-slate-500">({today})</span>
              </div>
              <button
                onClick={() => onNavigateTab('planner')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>플래너 상세</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 text-sm font-medium">오늘 예정된 학습 할 일이 없습니다.</p>
                <button
                  onClick={() => onNavigateTab('planner')}
                  className="mt-2 inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>오늘의 학습 계획 추가하기</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTasks.map((task) => {
                  const sub = getSubject(task.subjectId);
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-slate-50/80 border-slate-200 opacity-75'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sub?.color || '#6366F1' }}
                            />
                            <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">
                              {sub?.name || '과목'}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {task.type}
                            </span>
                            {task.priority === 'high' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-semibold border border-rose-200">
                                긴급
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-sm font-medium mt-0.5 truncate ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 ml-3">
                        <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.estimatedMinutes}분</span>
                        </span>
                        {!isCompleted && onStartTimerWithTask && (
                          <button
                            onClick={() => onStartTimerWithTask(task.id, task.subjectId, task.title)}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
                            title="이 작업으로 타이머 시작"
                          >
                            <Play className="w-3.5 h-3.5 fill-indigo-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Subjects, Goals & Google Sheet Sync Hub */}
        <div className="space-y-6">
          
          {/* Subjects & Weekly Target List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">과목별 목표 & 주간 시간</h2>
              </div>
              <button
                onClick={() => onNavigateTab('goals')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                관리
              </button>
            </div>

            <div className="space-y-3">
              {subjects.map((sub) => {
                // Calculate study logs for this subject
                const subLogs = studyLogs.filter((l) => l.subjectId === sub.id);
                const subMinutes = subLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
                const subHours = (subMinutes / 60).toFixed(1);
                const targetHours = sub.weeklyTargetHours || 5;
                const percent = Math.min(100, Math.round(((subMinutes / 60) / targetHours) * 100));

                return (
                  <div key={sub.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-md shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="font-semibold text-xs text-slate-800 truncate">{sub.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                        목표: {sub.targetGrade}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>학습 진행: {subHours}h / {targetHours}h</span>
                      <span className="font-semibold text-slate-700">{percent}%</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: sub.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Google Sheets Sync Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200 p-5 shadow-xs">
            <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Google Sheets 실시간 동기화</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1.5 leading-relaxed">
              모든 과목, 목표, 일일 플랜, 집중 타이머 로그가 사용자의 Google Spreadsheet에 완벽하게 백업 및 동기화됩니다.
            </p>

            <div className="mt-4 pt-3 border-t border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 block">
                  상태: <strong>{sheetsConfig.spreadsheetId ? '시트 연결 완료' : '미연결'}</strong>
                </span>
                {sheetsConfig.lastSyncedAt && (
                  <span className="text-[10px] text-emerald-600">
                    최근 동기화: {new Date(sheetsConfig.lastSyncedAt).toLocaleTimeString('ko-KR')}
                  </span>
                )}
              </div>

              {sheetsConfig.spreadsheetId ? (
                <button
                  onClick={onQuickSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {isSyncing ? '동기화 중...' : '지금 동기화'}
                </button>
              ) : (
                <button
                  onClick={() => onNavigateTab('sheets')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  시트 생성 및 연결
                </button>
              )}
            </div>
          </div>

          {/* AI Advisor Shortcut Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50/60 rounded-xl border border-indigo-200 p-5 shadow-xs">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold text-sm">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>EduTrack AI 컨설턴트</span>
            </div>
            <p className="text-xs text-indigo-700 mt-1.5 leading-relaxed">
              등록된 과목과 시험 일정에 맞춰 AI가 최적의 주간 시간 분배와 학습 전략을 추천해 드립니다.
            </p>
            <button
              onClick={() => onNavigateTab('ai')}
              className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 맞춤 학업 플랜 생성</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
