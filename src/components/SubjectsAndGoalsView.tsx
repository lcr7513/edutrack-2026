import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Target, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  Square, 
  Award, 
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Subject, AcademicGoal, ExamCountdown } from '../types';

interface SubjectsAndGoalsViewProps {
  subjects: Subject[];
  goals: AcademicGoal[];
  exams: ExamCountdown[];
  onAddSubject: (subject: Subject) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onAddGoal: (goal: AcademicGoal) => void;
  onUpdateGoal: (goal: AcademicGoal) => void;
  onDeleteGoal: (id: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onAddExam: (exam: ExamCountdown) => void;
  onDeleteExam: (id: string) => void;
}

export const SubjectsAndGoalsView: React.FC<SubjectsAndGoalsViewProps> = ({
  subjects,
  goals,
  exams,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onToggleMilestone,
  onAddExam,
  onDeleteExam,
}) => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'goals' | 'exams'>('subjects');

  // Modal States
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({
    name: '',
    code: '',
    targetGrade: 'A+ (95점)',
    currentGrade: '',
    weeklyTargetHours: 5,
    color: '#3B82F6',
    teacher: '',
    semester: '2026-1학기',
    notes: '',
  });

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState<Partial<AcademicGoal>>({
    title: '',
    category: 'gpa',
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    progress: 0,
    notes: '',
  });
  const [milestonesInput, setMilestonesInput] = useState<string>('');

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examForm, setExamForm] = useState<Partial<ExamCountdown>>({
    name: '',
    subjectId: subjects[0]?.id || '',
    examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetScore: '100점',
    weightPercentage: 30,
    keyTopics: '',
  });

  const colorPresets = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', 
    '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#14B8A6'
  ];

  // Open Subject Modal for Add/Edit
  const handleOpenSubjectModal = (subj?: Subject) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjectForm({ ...subj });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        name: '',
        code: '',
        targetGrade: 'A+ (95점)',
        currentGrade: '',
        weeklyTargetHours: 5,
        color: colorPresets[Math.floor(Math.random() * colorPresets.length)],
        teacher: '',
        semester: '2026-1학기',
        notes: '',
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name) return;

    if (editingSubject) {
      onUpdateSubject({
        ...editingSubject,
        ...(subjectForm as Subject),
      });
    } else {
      const newSubject: Subject = {
        id: `sub-${Date.now()}`,
        name: subjectForm.name || '',
        code: subjectForm.code || '',
        targetGrade: subjectForm.targetGrade || 'A',
        currentGrade: subjectForm.currentGrade || '',
        weeklyTargetHours: Number(subjectForm.weeklyTargetHours) || 5,
        color: subjectForm.color || '#3B82F6',
        teacher: subjectForm.teacher || '',
        semester: subjectForm.semester || '2026-1학기',
        notes: subjectForm.notes || '',
      };
      onAddSubject(newSubject);
    }
    setIsSubjectModalOpen(false);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.title) return;

    const milestonesList = milestonesInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((title, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        title,
        isCompleted: false,
      }));

    const newGoal: AcademicGoal = {
      id: `goal-${Date.now()}`,
      title: goalForm.title || '',
      category: goalForm.category || 'gpa',
      subjectId: goalForm.subjectId || undefined,
      targetDate: goalForm.targetDate || new Date().toISOString().split('T')[0],
      progress: Number(goalForm.progress) || 0,
      priority: goalForm.priority || 'medium',
      milestones: milestonesList.length > 0 ? milestonesList : [
        { id: `m-${Date.now()}-1`, title: '1단계 기본 계획 수립', isCompleted: false },
        { id: `m-${Date.now()}-2`, title: '2단계 집중 실행 및 점검', isCompleted: false },
      ],
      notes: goalForm.notes || '',
    };

    onAddGoal(newGoal);
    setIsGoalModalOpen(false);
    setMilestonesInput('');
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name) return;

    const newExam: ExamCountdown = {
      id: `exam-${Date.now()}`,
      name: examForm.name || '',
      subjectId: examForm.subjectId || subjects[0]?.id || '',
      examDate: examForm.examDate || new Date().toISOString().split('T')[0],
      targetScore: examForm.targetScore || '100점',
      weightPercentage: Number(examForm.weightPercentage) || 30,
      keyTopics: examForm.keyTopics || '',
    };

    onAddExam(newExam);
    setIsExamModalOpen(false);
  };

  const getSubject = (subId?: string) => subjects.find((s) => s.id === subId);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <span>학업 목표 & 과목 로드맵</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            등록된 과목별 목표 학점, 세부 마일스톤, 시험 일정을 체계적으로 수립하고 관리합니다.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'subjects' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            과목 관리 ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'goals' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            학업 목표 로드맵 ({goals.length})
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'exams' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            시험 & D-Day ({exams.length})
          </button>
        </div>
      </div>

      {/* 1. Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">등록된 수강/학습 과목 목록</h2>
            <button
              onClick={() => handleOpenSubjectModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>새 과목 등록</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-4 h-4 rounded-md shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{sub.name}</h3>
                        {sub.code && <span className="text-[11px] text-slate-500 font-mono">{sub.code}</span>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenSubjectModal(sub)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSubject(sub.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Target vs Current Grade */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">목표 등급/점수</span>
                      <strong className="text-indigo-600 font-bold text-sm mt-0.5 block">{sub.targetGrade}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">현재 등급</span>
                      <strong className="text-slate-700 font-semibold text-sm mt-0.5 block">
                        {sub.currentGrade || '평가 전'}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-500">주당 목표 학습:</span>
                      <span className="font-semibold text-slate-800">{sub.weeklyTargetHours}시간</span>
                    </div>
                    {sub.teacher && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">담당 교수/교사:</span>
                        <span className="font-medium text-slate-700">{sub.teacher}</span>
                      </div>
                    )}
                    {sub.semester && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">개설 학기:</span>
                        <span className="font-medium text-slate-700">{sub.semester}</span>
                      </div>
                    )}
                  </div>

                  {sub.notes && (
                    <p className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 italic line-clamp-2">
                      "{sub.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Academic Goals Roadmap Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">학업 로드맵 & 핵심 마일스톤</h2>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>새 학업 목표 추가</span>
            </button>
          </div>

          <div className="space-y-4">
            {goals.map((goal) => {
              const sub = getSubject(goal.subjectId);
              const completedMilestones = goal.milestones.filter((m) => m.isCompleted).length;
              const calculatedPercent = goal.milestones.length 
                ? Math.round((completedMilestones / goal.milestones.length) * 100) 
                : goal.progress;

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Award className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-base">{goal.title}</h3>
                          {sub && (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.name}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            goal.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {goal.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          목표 기한: {goal.targetDate} | 카테고리: {goal.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-600">{calculatedPercent}% 달성</span>
                        <span className="text-[11px] text-slate-400 block">
                          ({completedMilestones}/{goal.milestones.length} 완료)
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="목표 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${calculatedPercent}%` }}
                    />
                  </div>

                  {/* Milestones Checklist */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 mb-2 block">세부 마일스톤 체크리스트</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {goal.milestones.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => onToggleMilestone(goal.id, m.id)}
                          className={`flex items-start space-x-2.5 p-2.5 rounded-lg border text-left text-xs transition-all ${
                            m.isCompleted
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {m.isCompleted ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <span className={`leading-tight ${m.isCompleted ? 'line-through text-emerald-700' : ''}`}>
                            {m.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Exams & D-Day Tab */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">시험, 평가 및 과제 D-Day 일정</h2>
            <button
              onClick={() => setIsExamModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>새 시험/과제 일정 추가</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => {
              const sub = getSubject(exam.subjectId);
              const target = new Date(exam.examDate).getTime();
              const now = new Date().getTime();
              const dDay = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span
                        className="px-2.5 py-1 rounded text-xs font-semibold text-white truncate max-w-[150px]"
                        style={{ backgroundColor: sub?.color || '#4F46E5' }}
                      >
                        {sub?.name || '과목'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                          {dDay === 0 ? 'D-Day 오늘!' : dDay > 0 ? `D-${dDay}` : `종료`}
                        </span>
                        <button
                          onClick={() => onDeleteExam(exam.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mt-3">{exam.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">시험/제출 일자: {exam.examDate}</p>

                    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">목표 점수/등급:</span>
                        <span className="font-bold text-indigo-600">{exam.targetScore}</span>
                      </div>
                      {exam.weightPercentage && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">성적 반영 비율:</span>
                          <span className="font-semibold text-slate-700">{exam.weightPercentage}%</span>
                        </div>
                      )}
                    </div>

                    {exam.keyTopics && (
                      <div className="mt-3 text-xs text-slate-600">
                        <span className="font-semibold text-slate-700 block mb-1">핵심 시험 범위 / 키워드:</span>
                        <p className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                          {exam.keyTopics}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Subject Modal --- */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingSubject ? '과목 정보 수정' : '새 과목 등록'}
            </h3>
            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">과목명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 심화 미적분, 전공 데이터베이스"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">목표 등급/점수 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: A+, 1등급, 95점"
                    value={subjectForm.targetGrade}
                    onChange={(e) => setSubjectForm({ ...subjectForm, targetGrade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">현재 등급 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: B+, 2등급"
                    value={subjectForm.currentGrade}
                    onChange={(e) => setSubjectForm({ ...subjectForm, currentGrade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">주간 목표 학습(시간) *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={subjectForm.weeklyTargetHours}
                    onChange={(e) => setSubjectForm({ ...subjectForm, weeklyTargetHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">과목 코드</label>
                  <input
                    type="text"
                    placeholder="예: MATH-201"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">테마 색상</label>
                <div className="flex items-center space-x-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, color: c })}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        subjectForm.color === c ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">담당 교수 / 교사</label>
                <input
                  type="text"
                  placeholder="예: 김교수님"
                  value={subjectForm.teacher}
                  onChange={(e) => setSubjectForm({ ...subjectForm, teacher: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">학습 비고 및 전략</label>
                <textarea
                  rows={2}
                  placeholder="예: 기출 3회독 필수, 오답노트 철저히 관리"
                  value={subjectForm.notes}
                  onChange={(e) => setSubjectForm({ ...subjectForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Goal Modal --- */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">새 학업 목표 추가</h3>
            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">목표명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 1학기 평점 4.3 달성 & 전액 장학금"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">카테고리</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="gpa">학점/성적 (GPA)</option>
                    <option value="exam">시험 정복 (Exam)</option>
                    <option value="certification">자격증/대회 (Cert)</option>
                    <option value="assignment">과제/프로젝트 (Project)</option>
                    <option value="habit">학습 습관 (Habit)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">연관 과목 (선택)</label>
                  <select
                    value={goalForm.subjectId || ''}
                    onChange={(e) => setGoalForm({ ...goalForm, subjectId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">전체 / 과목 무관</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">목표 달성 기한 *</label>
                  <input
                    type="date"
                    required
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">우선순위</label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="high">최우선 (High)</option>
                    <option value="medium">보통 (Medium)</option>
                    <option value="low">낮음 (Low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  세부 마일스톤 단계 (줄바꿈으로 구분)
                </label>
                <textarea
                  rows={3}
                  placeholder="예:&#10;중간고사 전과목 A 확보&#10;기출 3개년 2회독 완성&#10;기말고사 핵심 오답 총정리"
                  value={milestonesInput}
                  onChange={(e) => setMilestonesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  목표 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Exam Modal --- */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">새 시험 & 평가 일정 등록</h3>
            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">시험/평가명 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 1학기 중간고사, 알고리즘 실기평가"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">해당 과목 *</label>
                  <select
                    required
                    value={examForm.subjectId}
                    onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">시험 일자 *</label>
                  <input
                    type="date"
                    required
                    value={examForm.examDate}
                    onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">목표 점수/등급 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 100점 만점, A+"
                    value={examForm.targetScore}
                    onChange={(e) => setExamForm({ ...examForm, targetScore: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">반영 비율 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={examForm.weightPercentage}
                    onChange={(e) => setExamForm({ ...examForm, weightPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">핵심 시험 범위 및 요점</label>
                <textarea
                  rows={2}
                  placeholder="예: 미분계수, 여러 가지 적분법, 점화식 및 모의고사 변형"
                  value={examForm.keyTopics}
                  onChange={(e) => setExamForm({ ...examForm, keyTopics: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  일정 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
