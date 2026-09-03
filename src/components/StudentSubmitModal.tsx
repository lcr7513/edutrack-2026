import React, { useState } from 'react';
import { 
  Send, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2, 
  User, 
  Calendar, 
  BookOpen, 
  Clock, 
  CheckSquare, 
  ExternalLink, 
  Sparkles, 
  LogIn,
  KeyRound,
  Download,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Subject, 
  AcademicGoal, 
  StudyTask, 
  ExamCountdown, 
  StudyLog, 
  StudentProfile, 
  GoogleSheetsConfig, 
  CurrentUserSession 
} from '../types';
import { 
  pushDataToSpreadsheet, 
  appendStudentSubmissionToSpreadsheet, 
  createEduTrackSpreadsheet, 
  exportToJsonBackup 
} from '../services/googleSheets';
import { requestFreshToken, setCachedAccessToken } from '../services/googleAuth';

interface StudentSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  goals: AcademicGoal[];
  tasks: StudyTask[];
  exams: ExamCountdown[];
  studyLogs: StudyLog[];
  students: StudentProfile[];
  sheetsConfig: GoogleSheetsConfig;
  userSession?: CurrentUserSession;
  onUpdateSheetsConfig?: (newConfig: Partial<GoogleSheetsConfig>) => void;
  onSuccessSync?: () => void;
  onNavigateToSheets?: () => void;
}

export const StudentSubmitModal: React.FC<StudentSubmitModalProps> = ({
  isOpen,
  onClose,
  subjects,
  goals,
  tasks,
  exams,
  studyLogs,
  students,
  sheetsConfig,
  userSession,
  onUpdateSheetsConfig,
  onSuccessSync,
  onNavigateToSheets,
}) => {
  if (!isOpen) return null;

  const [studentName, setStudentName] = useState<string>(
    userSession?.student?.name || (students[0]?.name ?? '')
  );
  const [studentNumber, setStudentNumber] = useState<string>(
    userSession?.student?.studentNumber || (students[0]?.studentNumber ?? '')
  );
  const [submissionMemo, setSubmissionMemo] = useState<string>('오늘의 학업 계획 및 학습 기록 제출합니다.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isAuthError, setIsAuthError] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    submittedAt?: string;
  } | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === today);
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed');
  const totalStudyMinutes = studyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  // Execute submission with given token and spreadsheetId
  const executeSubmission = async (token: string, sheetId: string) => {
    // Find or attach student profile notes if memo provided
    const updatedStudents = students.map((s) => {
      if (s.studentNumber === studentNumber || s.name === studentName) {
        return {
          ...s,
          notes: submissionMemo ? `[제출메모 ${new Date().toLocaleDateString('ko-KR')}] ${submissionMemo}` : s.notes,
        };
      }
      return s;
    });

    const fullData = {
      subjects,
      goals,
      tasks,
      exams,
      studyLogs,
      students: updatedStudents,
    };

    // 1. First, append this student's submission to the master cumulative sheet ('0_전체학생_제출누적대장')
    await appendStudentSubmissionToSpreadsheet(token, sheetId, {
      studentName: studentName || '익명 학생',
      studentNumber: studentNumber || '미지정',
      school: userSession?.student?.school || 'EduTrack',
      memo: submissionMemo,
      data: fullData,
    });

    // 2. Update the detailed tabs
    await pushDataToSpreadsheet(token, sheetId, fullData);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {}

    setSubmitResult({
      success: true,
      message: '작성하신 학업 플랜 및 학습 데이터가 [0_전체학생_제출누적대장]에 새 행으로 안전하게 누적 기록 및 제출되었습니다!',
      submittedAt: new Date().toLocaleString('ko-KR'),
    });
    setIsAuthError(false);

    if (onSuccessSync) onSuccessSync();
  };

  // Google Login and immediate submission
  const handleAuthAndSubmit = async () => {
    setIsAuthLoading(true);
    setIsAuthError(false);
    setSubmitResult(null);

    try {
      const authRes = await requestFreshToken();
      if (!authRes?.accessToken) {
        throw new Error('Google 로그인 인증 토큰을 획득하지 못했습니다.');
      }

      const freshToken = authRes.accessToken;
      setCachedAccessToken(freshToken);

      let targetSheetId = sheetsConfig.spreadsheetId;
      let targetSheetUrl = sheetsConfig.spreadsheetUrl;

      // If no sheet created yet, create one automatically
      if (!targetSheetId) {
        const newSheet = await createEduTrackSpreadsheet(
          freshToken,
          `EduTrack 학생 학업관리 시트 (${new Date().toLocaleDateString('ko-KR')})`
        );
        targetSheetId = newSheet.spreadsheetId;
        targetSheetUrl = newSheet.spreadsheetUrl;
      }

      if (onUpdateSheetsConfig) {
        onUpdateSheetsConfig({
          isConnected: true,
          accessToken: freshToken,
          spreadsheetId: targetSheetId,
          spreadsheetUrl: targetSheetUrl,
          tokenExpiresAt: Date.now() + 3600 * 1000,
        });
      }

      await executeSubmission(freshToken, targetSheetId);
    } catch (err: any) {
      console.error('Auth and submission error:', err);
      setIsAuthError(true);
      setSubmitResult({
        success: false,
        message: err.message || '구글 로그인 또는 시트 제출 중 오류가 발생했습니다. 권한을 확인해 주세요.',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Normal submit button handler
  const handleSubmit = async () => {
    // If no access token, trigger Google login flow directly
    if (!sheetsConfig.accessToken) {
      await handleAuthAndSubmit();
      return;
    }

    if (!sheetsConfig.spreadsheetId) {
      // If token exists but no sheet, create sheet and submit
      await handleAuthAndSubmit();
      return;
    }

    setIsSubmitting(true);
    setIsAuthError(false);
    setSubmitResult(null);

    try {
      await executeSubmission(sheetsConfig.accessToken, sheetsConfig.spreadsheetId);
    } catch (err: any) {
      console.error('Submission failed:', err);
      const errMsg = err.message || '';
      
      // If auth credential error, mark as auth error so user sees 1-click reauth button
      if (
        errMsg.includes('authentication credentials') ||
        errMsg.includes('OAuth 2 access token') ||
        errMsg.includes('401') ||
        errMsg.includes('UNAUTHENTICATED')
      ) {
        setIsAuthError(true);
        setSubmitResult({
          success: false,
          message: 'Google 보안 인증 토큰이 만료되었거나 갱신이 필요합니다. 아래 [Google 계정 로그인 후 즉시 전송] 버튼을 눌러주세요.',
        });
      } else {
        setSubmitResult({
          success: false,
          message: errMsg || '데이터 전송 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download local backup JSON
  const handleDownloadBackup = () => {
    exportToJsonBackup({
      subjects,
      goals,
      tasks,
      exams,
      studyLogs,
      students,
    });
  };

  const hasValidToken = Boolean(sheetsConfig.accessToken && (!sheetsConfig.tokenExpiresAt || sheetsConfig.tokenExpiresAt > Date.now()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>학생 학업자료 구글 시트 전송 & 제출</span>
              </h2>
              <p className="text-xs text-slate-500">
                작성한 플래너, 과목별 목표, 학습 로그를 구글 스프레드시트로 제출합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4">
          {/* Submission Data Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
            <div className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="flex items-center space-x-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>현재 전송될 학업 데이터 요약</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">기준: 오늘 ({today})</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div className="flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>등록 과목: <strong>{subjects.length}개</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>오늘 할일: <strong>{todayTasks.length}건</strong> (완료 {completedTodayTasks.length}건)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>누적 집중학습: <strong>{Math.floor(totalStudyMinutes / 60)}시간 {totalStudyMinutes % 60}분</strong></span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>학업 목표: <strong>{goals.length}개</strong> / D-Day {exams.length}건</span>
              </div>
            </div>
          </div>

          {/* Student Info Inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  제출 학생 이름
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="이름 (예: 김민준)"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학번 / 번호
                </label>
                <input
                  type="text"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="학번 (예: 10315)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                선생님께 남길 제출 메모 / 질문
              </label>
              <textarea
                rows={2}
                value={submissionMemo}
                onChange={(e) => setSubmissionMemo(e.target.value)}
                placeholder="오늘 학습 중 어려웠던 점이나 코멘트를 작성하세요."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
              />
            </div>
          </div>

          {/* Connection / Auth Guidance Card */}
          {(!hasValidToken || isAuthError) ? (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs space-y-2.5">
              <div className="flex items-start space-x-2 text-indigo-950">
                <KeyRound className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-xs">Google 계정 인증이 필요합니다</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                    구글 보안 정책상 구글 시트에 직접 데이터를 기록하기 위해 계정 인증(OAuth)이 필요합니다. 아래 버튼을 클릭하여 로그인하면 <strong>즉시 시트가 생성/연결되어 자동 제출</strong>됩니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAuthAndSubmit}
                disabled={isAuthLoading || isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Google 로그인 및 시트 전송 중...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Google 계정 로그인 후 즉시 전송</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold truncate max-w-[240px]">
                  {sheetsConfig.spreadsheetTitle || '구글 시트 연동 활성화됨'}
                </span>
              </div>
              {sheetsConfig.spreadsheetUrl && (
                <a
                  href={sheetsConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-700 hover:underline flex items-center space-x-1 shrink-0 font-medium"
                >
                  <span>시트 보기</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* Feedback Result Alert */}
          {submitResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                submitResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {submitResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">{submitResult.success ? '제출 완료!' : '전송 실패 안내'}</p>
                <p className="text-[11.5px] mt-0.5 leading-relaxed">{submitResult.message}</p>
                {submitResult.submittedAt && (
                  <p className="text-[10.5px] text-emerald-700 mt-1 font-semibold">
                    제출 완료 일시: {submitResult.submittedAt}
                  </p>
                )}
                {isAuthError && (
                  <div className="mt-2.5 pt-2 border-t border-rose-200 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAuthAndSubmit}
                      disabled={isAuthLoading}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-2xs flex items-center space-x-1.5"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Google 계정 다시 로그인하고 전송하기</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium rounded-xl flex items-center space-x-1.5 transition-colors"
            title="인터넷이 불안정할 때 오프라인 백업 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">오프라인 백업</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              닫기
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isAuthLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all"
            >
              {isSubmitting || isAuthLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>시트로 전송 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>구글 시트로 자료 제출</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
