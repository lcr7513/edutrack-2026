import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Lightbulb, 
  RotateCcw, 
  Loader2, 
  HelpCircle, 
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  Flame,
  ArrowRight,
  School
} from 'lucide-react';
import { Subject, AcademicGoal, ExamCountdown, CurrentUserSession } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
  subject?: string;
  recommendations?: string[];
}

interface AITutorViewProps {
  subjects: Subject[];
  goals: AcademicGoal[];
  exams: ExamCountdown[];
  userSession?: CurrentUserSession;
}

export const AITutorView: React.FC<AITutorViewProps> = ({
  subjects,
  goals,
  exams,
  userSession,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.name || '전체 과목');
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      sender: 'tutor',
      text: `안녕하세요! 🎓 **EduTrack 전담 AI 튜터**입니다.\n\n수학, 과학, 영어, 국어 등 과목별 어려운 문제 풀이, 핵심 개념 설명, 암기 비법, 오답 분석, 시험 대비 공부 전략까지 무엇이든 질문해 주세요!\n\n학생의 현재 등록된 과목 및 시험 일정 데이터를 바탕으로 가장 친절하고 명쾌하게 1:1 맞춤형 과외를 진행해 드립니다.`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      recommendations: [
        '미적분 치환적분과 부분적분 구분법',
        '영어 빈칸추론 문제 접근 전략',
        '국어 비문학 지문 독해 시간 단축법',
        '시험 2주 전 오답노트 작성 비법'
      ]
    }
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendQuestion = async (customText?: string) => {
    const questionText = customText || inputQuestion;
    if (!questionText.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: questionText.trim(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      subject: selectedSubject,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputQuestion('');
    setIsLoading(true);

    try {
      // Find upcoming exam context
      const upcomingExam = exams[0]?.name ? `${exams[0].name} (D-Day 대비)` : '내신 및 수능 대비';
      
      const response = await fetch('/api/ai/study-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          question: questionText,
          currentProgress: `${userSession?.student?.name ? `${userSession.student.name} 학생, ` : ''}${upcomingExam}, 등록 과목: ${subjects.map(s => s.name).join(', ')}`,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI 튜터 응답 생성에 실패했습니다.');
      }

      const tutorMsg: Message = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        subject: selectedSubject,
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'tutor',
        text: `죄송합니다. AI 튜터 연결 중 일시적인 오류가 발생했습니다: ${err.message || '서버 응답 오류'}\n잠시 후 다시 질문해 주세요.`,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (confirm('AI 튜터와의 대화 내용을 초기화하시겠습니까?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'tutor',
          text: `새로운 대화 세션이 시작되었습니다. 궁금한 학습 내용이나 고민을 편하게 질문해 주세요!`,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          recommendations: [
            '수학 킬러 문항 문제풀이 발상법',
            '영어 지문 요약 및 주제문 찾기',
            '탐구 과목 핵심 개념 백지복습법'
          ]
        }
      ]);
    }
  };

  const quickQuestionsBySubject: Record<string, string[]> = {
    '수학': [
      '미적분 극값 판정 및 그래프 개형 추론 요령',
      '수열의 귀납적 정의 점화식 빠르게 푸는 법',
      '확률과 통계 조건부확률 실수 줄이는 팁'
    ],
    '영어': [
      '수능/내신 순서 배열 및 문장 삽입 오답 제거 공식',
      '관계대명사와 관계부사 실전 구별법',
      '어휘 암기 효율을 2배로 올리는 어원 학습법'
    ],
    '국어': [
      '문학 고전시가 필수 어휘 및 해석 공식',
      '독서(비문학) 정보량이 많은 과학/기술 지문 처리법',
      '화법과 작문 시간 단축 전략'
    ],
    '과학/탐구': [
      '생명과학 유전 가계도 분석 기본 알고리즘',
      '화학 양적 관계 계산 단계별 공식',
      '물리 역학적 에너지 보존 법칙 풀이법'
    ]
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <span>1:1 맞춤형 AI 학습 튜터</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  Gemini Flash AI
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                모르는 문제 풀이, 필수 개념 정리, 공부법 질문을 실시간으로 튜터에게 묻고 명쾌한 답변을 받으세요.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {userSession?.student && (
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>{userSession.student.name} 학생 전담 코칭</span>
            </div>
          )}
          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="대화 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[650px]">
        {/* Chat Header Subject Selector & Prompt Helpers */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-700 flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>질문 과목 선택:</span>
            </span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            >
              <option value="전체 과목">전체 과목 / 종합 학습법</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} (목표: {s.targetGrade})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500 hidden md:flex items-center space-x-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>개념 설명, 문제 풀이 단계, 오답 분석을 구체적으로 질문할수록 더 정확합니다.</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                    isUser
                      ? 'bg-indigo-600'
                      : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                  }`}
                >
                  {isUser ? (
                    <span>나</span>
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-2xl space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center space-x-2 text-[11px] text-slate-400 ${isUser ? 'justify-end' : ''}`}>
                    <span className="font-semibold text-slate-600">{isUser ? '학생' : 'AI 학습 튜터'}</span>
                    {msg.subject && (
                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded text-[10px]">
                        {msg.subject}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-2xs relative group whitespace-pre-line ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                    }`}
                  >
                    {msg.text}

                    {/* Copy button for tutor messages */}
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
                        title="답변 복사"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Recommendation Chips if available */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] text-slate-500 block mb-1.5 font-semibold flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>추천 질문 바로 물어보기:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.recommendations.map((rec, rIdx) => (
                          <button
                            key={rIdx}
                            onClick={() => handleSendQuestion(rec)}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] transition-colors shadow-2xs text-left"
                          >
                            &bull; {rec}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-2xs max-w-sm">
                <div className="flex items-center space-x-2 text-xs text-indigo-600 font-semibold">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI 튜터가 맞춤 풀이와 해설을 작성하고 있습니다...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center space-x-1">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>인기 질문:</span>
          </span>
          {(quickQuestionsBySubject[selectedSubject] || quickQuestionsBySubject['수학']).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuestion(q)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] whitespace-nowrap transition-colors shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuestion();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={`[${selectedSubject}] 관련 질문이나 풀이 요청을 입력하세요... (예: 오답노트 정리 비법 알려줘)`}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>전송</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
