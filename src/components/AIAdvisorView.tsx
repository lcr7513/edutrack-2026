import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  BrainCircuit, 
  Clock, 
  Target, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  HelpCircle,
  Plus
} from 'lucide-react';
import { Subject, AcademicGoal, ExamCountdown, AIPlanRecommendation, StudyTask } from '../types';

interface AIAdvisorViewProps {
  subjects: Subject[];
  goals: AcademicGoal[];
  exams: ExamCountdown[];
  onApplyAIPlanToSubjects?: (distribution: { subject: string; recommendedHours: number }[]) => void;
  onAddGeneratedTasks?: (tasks: StudyTask[]) => void;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({
  subjects,
  goals,
  exams,
  onApplyAIPlanToSubjects,
  onAddGeneratedTasks,
}) => {
  const [activeTab, setActiveTab] = useState<'plan_optimizer' | 'qa_coach'>('plan_optimizer');

  // Plan Optimizer Form
  const [weeklyHours, setWeeklyHours] = useState<number>(25);
  const [targetExam, setTargetExam] = useState<string>(exams[0]?.name || '중간고사');
  const [weakAreas, setWeakAreas] = useState<string>('심화 문제풀이 및 취약 개념 복습');
  const [userCustomPrompt, setUserCustomPrompt] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [planResult, setPlanResult] = useState<AIPlanRecommendation | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  // Q&A Coach Form
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.name || '전체');
  const [coachQuestion, setCoachQuestion] = useState<string>('');
  const [isAskingCoach, setIsAskingCoach] = useState<boolean>(false);
  const [coachAnswer, setCoachAnswer] = useState<string | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Generate AI Plan
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingPlan(true);
    setPlanError(null);

    try {
      const response = await fetch('/api/ai/optimize-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: subjects.map((s) => ({ name: s.name, targetGrade: s.targetGrade, currentGrade: s.currentGrade })),
          goals: goals.map((g) => g.title).join(', '),
          weeklyHours,
          targetExam,
          weakAreas,
          userPrompt: userCustomPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI 학업 계획 생성에 실패했습니다.');
      }

      setPlanResult(data.data);
    } catch (err: any) {
      setPlanError(err.message || 'AI 서비스 연결 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Ask AI Coach
  const handleAskCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachQuestion.trim()) return;

    setIsAskingCoach(true);
    setCoachError(null);

    try {
      const response = await fetch('/api/ai/study-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          question: coachQuestion,
          currentProgress: '중간고사 대비 집중 학습 중',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI 코칭 생성 실패');
      }

      setCoachAnswer(data.text);
    } catch (err: any) {
      setCoachError(err.message || 'AI 질문 응답 중 오류가 발생했습니다.');
    } finally {
      setIsAskingCoach(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>EduTrack AI 학업 컨설턴트</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            학생의 등록 과목, 시험 일정, 학습 취약점을 종합 분석하여 최적의 학업 플랜과 코칭을 제공합니다.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('plan_optimizer')}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'plan_optimizer' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>학업 플랜 최적화</span>
          </button>
          <button
            onClick={() => setActiveTab('qa_coach')}
            className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'qa_coach' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>1:1 학습 멘토 Q&A</span>
          </button>
        </div>
      </div>

      {/* 1. Academic Plan Optimizer Tab */}
      {activeTab === 'plan_optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs h-fit">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center space-x-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>학업 프로필 & 조건 설정</span>
            </h3>

            <form onSubmit={handleGeneratePlan} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">주당 가용 학습 시간</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="2"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <span className="font-bold text-indigo-600 w-12 text-right shrink-0">{weeklyHours}시간</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">목표 시험/평가</label>
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="예: 1학기 중간고사"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">취약/집중 영역</label>
                <input
                  type="text"
                  value={weakAreas}
                  onChange={(e) => setWeakAreas(e.target.value)}
                  placeholder="예: 미적분 정적분 활용, 영어 빈칸추론"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">추가 요청사항</label>
                <textarea
                  rows={2}
                  value={userCustomPrompt}
                  onChange={(e) => setUserCustomPrompt(e.target.value)}
                  placeholder="예: 평일 저녁 3시간, 주말 집중형 플랜으로 구성해주세요."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingPlan}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-xs flex items-center justify-center space-x-2 transition-all mt-2"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI 컨설팅 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>맞춤 학업 계획 생성하기</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {planError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{planError}</span>
              </div>
            )}

            {!planResult && !isGeneratingPlan && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">맞춤형 학업 계획을 생성해보세요.</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  왼쪽 조건에서 학습 가능 시간과 취약 영역을 설정한 후 '맞춤 학업 계획 생성하기'를 누르면, AI가 과목별 최적 시간 배분 및 마일스톤을 제안합니다.
                </p>
              </div>
            )}

            {isGeneratingPlan && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">EduTrack AI가 학업 로드맵을 구성하는 중입니다...</h4>
                <p className="text-xs text-slate-500">
                  과목별 목표와 시험 일정을 바탕으로 성적 향상을 위한 균형 분배를 계산하고 있습니다.
                </p>
              </div>
            )}

            {planResult && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Summary */}
                <div>
                  <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>AI 컨설팅 총평</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{planResult.summary}</h3>
                </div>

                {/* Strategies */}
                {planResult.strategies?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 mb-2">핵심 학업 실행 전략</h4>
                    <div className="space-y-1.5">
                      {planResult.strategies.map((st, i) => (
                        <div key={i} className="flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Distribution Table */}
                {planResult.weeklyDistribution?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 mb-2">과목별 추천 주간 학습 시간 & 공부법</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {planResult.weeklyDistribution.map((item, idx) => (
                        <div key={idx} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <strong className="text-slate-900 font-bold">{item.subject}</strong>
                            <span className="font-bold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-2xs">
                              주당 {item.recommendedHours}시간
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-1">
                            <span className="font-semibold text-slate-700">집중 주제:</span> {item.focusTopic}
                          </p>
                          <p className="text-indigo-700 text-[11px] mt-0.5">
                            <span className="font-semibold">추천 학습법:</span> {item.method}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {planResult.milestones?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 mb-2">단계별 마일스톤 로드맵</h4>
                    <div className="space-y-2">
                      {planResult.milestones.map((m, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded text-[10px]">
                              {m.timeframe}
                            </span>
                            <strong className="text-slate-800">{m.goal}</strong>
                          </div>
                          <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 mt-1.5 ml-1">
                            {m.actionItems.map((act, aIdx) => (
                              <li key={aIdx}>{act}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Advice */}
                {planResult.customAdvice && (
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold block mb-1">💡 멘토의 동기부여 & 슬럼프 극복 팁</span>
                    <p className="leading-relaxed">{planResult.customAdvice}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 1:1 Study Coach Q&A Tab */}
      {activeTab === 'qa_coach' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <span>EduTrack 1:1 학습 멘토 Q&A</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              공부 도중 막히는 개념, 문제 풀이 발상, 시간 관리 고민을 무엇이든 질문해보세요.
            </p>
          </div>

          <form onSubmit={handleAskCoach} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:w-48 shrink-0">
                <label className="text-xs font-semibold text-slate-700 block mb-1">관련 과목</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="전체/일반">전체/일반 학습법</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grow">
                <label className="text-xs font-semibold text-slate-700 block mb-1">질문 / 고민 내용</label>
                <input
                  type="text"
                  required
                  placeholder="예: 미적분에서 치환적분과 부분적분 판단 기준을 쉽게 외우는 법을 알려주세요."
                  value={coachQuestion}
                  onChange={(e) => setCoachQuestion(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAskingCoach || !coachQuestion.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                {isAskingCoach ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>답변 작성 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>멘토에게 질문하기</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Answer Display */}
          {coachError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {coachError}
            </div>
          )}

          {coachAnswer && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold">
                <Bot className="w-4 h-4" />
                <span>EduTrack 멘토의 조언:</span>
              </div>
              <div className="text-slate-800 leading-relaxed whitespace-pre-line text-xs font-normal">
                {coachAnswer}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
