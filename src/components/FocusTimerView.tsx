import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  Star, 
  Clock, 
  BookOpen, 
  Trash2,
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, StudyLog } from '../types';

interface FocusTimerViewProps {
  subjects: Subject[];
  studyLogs: StudyLog[];
  onAddStudyLog: (log: StudyLog) => void;
  onDeleteStudyLog: (id: string) => void;
  initialSubjectId?: string;
  initialTaskTitle?: string;
}

export const FocusTimerView: React.FC<FocusTimerViewProps> = ({
  subjects,
  studyLogs,
  onAddStudyLog,
  onDeleteStudyLog,
  initialSubjectId,
  initialTaskTitle,
}) => {
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ''
  );
  const [taskTitle, setTaskTitle] = useState<string>(initialTaskTitle || '');
  
  // Pomodoro timer durations in minutes
  const [pomodoroDuration, setPomodoroDuration] = useState<number>(25);
  const [breakDuration, setBreakDuration] = useState<number>(5);
  const [isBreak, setIsBreak] = useState<boolean>(false);

  // Timer Core State (seconds)
  const [timeLeft, setTimeLeft] = useState<number>(pomodoroDuration * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Session Completion Modal
  const [isFinishModalOpen, setIsFinishModalOpen] = useState<boolean>(false);
  const [completedMinutes, setCompletedMinutes] = useState<number>(25);
  const [focusScore, setFocusScore] = useState<number>(5);
  const [reflection, setReflection] = useState<string>('');

  const timerRef = useRef<any>(null);

  // Sync if initial params change
  useEffect(() => {
    if (initialSubjectId) setSelectedSubjectId(initialSubjectId);
    if (initialTaskTitle) setTaskTitle(initialTaskTitle);
  }, [initialSubjectId, initialTaskTitle]);

  // Handle Mode or Duration changes
  useEffect(() => {
    if (timerMode === 'pomodoro') {
      setTimeLeft(isBreak ? breakDuration * 60 : pomodoroDuration * 60);
    }
  }, [pomodoroDuration, breakDuration, isBreak, timerMode]);

  // Main Timer Interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (timerMode === 'pomodoro') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsRunning(false);
              handlePomodoroComplete();
              return 0;
            }
            return prev - 1;
          });
        } else {
          setStopwatchSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode, isBreak, pomodoroDuration]);

  const handlePomodoroComplete = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    if (!isBreak) {
      setCompletedMinutes(pomodoroDuration);
      setIsFinishModalOpen(true);
    } else {
      setIsBreak(false);
      setTimeLeft(pomodoroDuration * 60);
    }
  };

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerMode === 'pomodoro') {
      setTimeLeft(isBreak ? breakDuration * 60 : pomodoroDuration * 60);
    } else {
      setStopwatchSeconds(0);
    }
  };

  const handleManualFinish = () => {
    setIsRunning(false);
    const elapsedMins = timerMode === 'pomodoro'
      ? Math.max(1, Math.round((pomodoroDuration * 60 - timeLeft) / 60))
      : Math.max(1, Math.round(stopwatchSeconds / 60));

    setCompletedMinutes(elapsedMins);
    setIsFinishModalOpen(true);
  };

  const handleSaveStudySession = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: StudyLog = {
      id: `log-${Date.now()}`,
      subjectId: selectedSubjectId || subjects[0]?.id || 'sub-1',
      timestamp: new Date().toISOString(),
      durationMinutes: completedMinutes,
      taskTitle: taskTitle || '집중 자습 세션',
      focusScore,
      reflection: reflection || '오늘 목표 분량을 집중하여 완수함.',
    };

    onAddStudyLog(newLog);
    setIsFinishModalOpen(false);
    setReflection('');
    handleReset();

    try {
      confetti({ particleCount: 60, spread: 60 });
    } catch {}
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getSubject = (subId?: string) => subjects.find((s) => s.id === subId);
  const currentSubject = getSubject(selectedSubjectId);

  // Calculate Progress Percent for Pomodoro
  const totalTargetSec = isBreak ? breakDuration * 60 : pomodoroDuration * 60;
  const progressPercent = totalTargetSec > 0 ? ((totalTargetSec - timeLeft) / totalTargetSec) * 100 : 0;

  // Total Study Time Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = studyLogs.filter((l) => l.timestamp.startsWith(todayStr));
  const todayStudyMinutes = todayLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>EduTrack 몰입 집중 타이머</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            뽀모도로 및 스톱워치 기법으로 깊은 몰입감을 유지하고 학습 기록을 누적합니다.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setIsRunning(false);
              setTimerMode('pomodoro');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timerMode === 'pomodoro' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            뽀모도로 (Pomodoro)
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setTimerMode('stopwatch');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              timerMode === 'stopwatch' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            스톱워치 (자유 누적)
          </button>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center relative overflow-hidden">
        {/* Subject & Task Selection Bar */}
        <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">학습 과목 선택</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">학습 목표 / 할 일</label>
            <input
              type="text"
              placeholder="예: 미적분 4장 문제풀이"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Timer Duration Preset Buttons (For Pomodoro) */}
        {timerMode === 'pomodoro' && (
          <div className="flex justify-center items-center space-x-2 mb-6">
            {[15, 25, 30, 50].map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (!isRunning) {
                    setPomodoroDuration(m);
                    setIsBreak(false);
                    setTimeLeft(m * 60);
                  }
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  pomodoroDuration === m && !isBreak
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m}분 집중
              </button>
            ))}
            <button
              onClick={() => {
                if (!isRunning) {
                  setIsBreak(true);
                  setTimeLeft(breakDuration * 60);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isBreak
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              5분 휴식
            </button>
          </div>
        )}

        {/* Big Digital Clock Display */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative inline-flex items-center justify-center">
            {/* Pulsing visual aura when running */}
            {isRunning && (
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping pointer-events-none scale-110" />
            )}

            <div className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-slate-900 select-none">
              {timerMode === 'pomodoro' ? formatTime(timeLeft) : formatTime(stopwatchSeconds)}
            </div>
          </div>

          <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500">
            {currentSubject && (
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: currentSubject.color }}
              />
            )}
            <span className="font-semibold text-slate-700">
              {currentSubject?.name || '과목 미선택'}
            </span>
            <span>•</span>
            <span>{taskTitle || '자유 학습 진행 중'}</span>
          </div>

          {/* Progress Bar for Pomodoro */}
          {timerMode === 'pomodoro' && (
            <div className="w-64 bg-slate-100 rounded-full h-2 mt-4 overflow-hidden mx-auto">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isBreak ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <button
            onClick={handleReset}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="초기화"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`px-8 py-3.5 rounded-2xl text-white font-bold text-base shadow-md flex items-center space-x-2 transition-all transform active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>일시 정지</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>집중 시작</span>
              </>
            )}
          </button>

          <button
            onClick={handleManualFinish}
            disabled={!isRunning && (timerMode === 'pomodoro' ? timeLeft === pomodoroDuration * 60 : stopwatchSeconds === 0)}
            className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs transition-colors flex items-center space-x-1.5"
            title="현재 세션 학습 기록으로 저장"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>세션 완료 및 기록</span>
          </button>
        </div>

        {/* Today's total focus summary banner */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-600">
          <div>
            오늘 총 집중 시간: <strong className="text-indigo-600 text-sm">{Math.floor(todayStudyMinutes / 60)}시간 {todayStudyMinutes % 60}분</strong>
          </div>
          <div>
            오늘 완료한 집중 세션: <strong className="text-slate-900 text-sm">{todayLogs.length}회</strong>
          </div>
        </div>
      </div>

      {/* Study Logs History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">최근 집중 학습 기록 (Logs)</h3>
          </div>
          <span className="text-xs text-slate-500">총 {studyLogs.length}개의 기록</span>
        </div>

        {studyLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            아직 기록된 집중 학습 세션이 없습니다. 타이머를 실행하고 기록해보세요!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-semibold">일시</th>
                  <th className="pb-3 font-semibold">과목</th>
                  <th className="pb-3 font-semibold">학습 주제</th>
                  <th className="pb-3 font-semibold">시간</th>
                  <th className="pb-3 font-semibold">집중도</th>
                  <th className="pb-3 font-semibold">학습 성찰 메모</th>
                  <th className="pb-3 font-semibold text-right">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studyLogs.map((log) => {
                  const sub = getSubject(log.subjectId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-white truncate inline-block max-w-[100px]"
                          style={{ backgroundColor: sub?.color || '#4F46E5' }}
                        >
                          {sub?.name || '과목'}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-800">{log.taskTitle}</td>
                      <td className="py-3 font-bold text-indigo-600 whitespace-nowrap">
                        {log.durationMinutes}분
                      </td>
                      <td className="py-3 whitespace-nowrap text-amber-500">
                        {'★'.repeat(log.focusScore)}
                        <span className="text-slate-300">{'☆'.repeat(5 - log.focusScore)}</span>
                      </td>
                      <td className="py-3 text-slate-600 max-w-xs truncate">{log.reflection}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onDeleteStudyLog(log.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Finish Session Modal --- */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-2 text-indigo-600 mb-2">
              <Award className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">학습 세션 완료 기록</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              수고하셨습니다! 방금 진행한 학습 성취와 몰입도를 기록하고 구글 시트에 동기화하세요.
            </p>

            <form onSubmit={handleSaveStudySession} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">학습 과목</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">학습 내용 / 주제</label>
                <input
                  type="text"
                  required
                  placeholder="예: 미적분 4장 정적분 심화 문제 풀이"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">집중 시간 (분)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={completedMinutes}
                    onChange={(e) => setCompletedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">몰입/집중도 평가</label>
                  <div className="flex items-center space-x-1 py-1.5">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setFocusScore(score)}
                        className={`text-lg transition-transform hover:scale-125 ${
                          focusScore >= score ? 'text-amber-500' : 'text-slate-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">학습 성찰 및 피드백 메모</label>
                <textarea
                  rows={2}
                  placeholder="예: 치환적분 공식을 복습하니 문제풀이 속도가 훨씬 빨라짐."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFinishModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  기록 저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
