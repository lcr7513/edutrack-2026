import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ListTodo,
  Grid,
  Sparkles,
  Check,
  Send,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subject, StudyTask, TaskType, TaskStatus, TimetableSlot } from '../types';

interface PlannerViewProps {
  subjects: Subject[];
  tasks: StudyTask[];
  timetable: TimetableSlot[];
  onAddTask: (task: StudyTask) => void;
  onUpdateTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onAddTimetableSlot: (slot: TimetableSlot) => void;
  onDeleteTimetableSlot: (id: string) => void;
  onStartTimerWithTask?: (taskId: string, subjectId: string, taskTitle: string) => void;
  onOpenSubmitModal?: () => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  subjects,
  tasks,
  timetable,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
  onAddTimetableSlot,
  onDeleteTimetableSlot,
  onStartTimerWithTask,
  onOpenSubmitModal,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly_table'>('daily');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [taskForm, setTaskForm] = useState<Partial<StudyTask>>({
    title: '',
    subjectId: subjects[0]?.id || '',
    date: selectedDate,
    estimatedMinutes: 45,
    status: 'todo',
    priority: 'medium',
    type: 'review',
    notes: '',
  });

  // Timetable Slot Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotForm, setSlotForm] = useState<Partial<TimetableSlot>>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:30',
    subjectId: subjects[0]?.id || '',
    location: '',
    memo: '',
  });

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const setDateToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getSubject = (subId?: string) => subjects.find((s) => s.id === subId);

  // Filtered tasks for the selected date
  const dateTasks = tasks.filter((t) => {
    if (t.date !== selectedDate) return false;
    if (filterSubject !== 'all' && t.subjectId !== filterSubject) return false;
    if (filterType !== 'all' && t.type !== filterType) return false;
    return true;
  });

  const completedCount = dateTasks.filter((t) => t.status === 'completed').length;
  const totalEstimatedMins = dateTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const totalActualMins = dateTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);

  const handleOpenTaskModal = (taskToEdit?: StudyTask) => {
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setTaskForm({ ...taskToEdit });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        subjectId: subjects[0]?.id || '',
        date: selectedDate,
        estimatedMinutes: 45,
        status: 'todo',
        priority: 'medium',
        type: 'review',
        notes: '',
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        ...(taskForm as StudyTask),
      });
    } else {
      const newTask: StudyTask = {
        id: `task-${Date.now()}`,
        title: taskForm.title || '',
        subjectId: taskForm.subjectId || subjects[0]?.id || 'sub-1',
        date: taskForm.date || selectedDate,
        estimatedMinutes: Number(taskForm.estimatedMinutes) || 45,
        actualMinutes: 0,
        status: taskForm.status || 'todo',
        priority: taskForm.priority || 'medium',
        type: taskForm.type || 'review',
        notes: taskForm.notes || '',
      };
      onAddTask(newTask);
    }
    setIsTaskModalOpen(false);
  };

  const handleTaskToggle = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== 'completed') {
      // Fire confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // Safe fallback
      }
    }
    onToggleTask(taskId);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSlot: TimetableSlot = {
      id: `tt-${Date.now()}`,
      dayOfWeek: Number(slotForm.dayOfWeek) || 1,
      startTime: slotForm.startTime || '09:00',
      endTime: slotForm.endTime || '10:30',
      subjectId: slotForm.subjectId || subjects[0]?.id || '',
      location: slotForm.location || '',
      memo: slotForm.memo || '',
    };
    onAddTimetableSlot(newSlot);
    setIsSlotModalOpen(false);
  };

  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const shortDays = ['월', '화', '수', '목', '금'];

  const typeLabels: Record<TaskType, string> = {
    problem_solving: '문제풀이',
    review: '개념복습',
    lecture: '강의수강',
    assignment: '과제제출',
    reading: '독서/교재',
    other: '기타',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <span>학습 플래너 & 시간표</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            일자별 할 일 관리와 주간 시간표로 학습 효율을 극대화합니다.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('daily')}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'daily' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>일일 플래너</span>
            </button>
            <button
              onClick={() => setActiveSubTab('weekly_table')}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'weekly_table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>주간 시간표</span>
            </button>
          </div>

          {onOpenSubmitModal && (
            <button
              onClick={onOpenSubmitModal}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all transform active:scale-95"
              title="선생님 구글 시트로 작성한 플래너 및 학업 자료 제출"
            >
              <Send className="w-3.5 h-3.5" />
              <span>구글 시트 제출</span>
            </button>
          )}

          {activeSubTab === 'daily' ? (
            <button
              onClick={() => handleOpenTaskModal()}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>할 일 추가</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSlotModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>시간표 등록</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Daily Planner Tab */}
      {activeSubTab === 'daily' && (
        <div className="space-y-4">
          {/* Date Picker Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="이전 날짜"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-bold text-slate-800 text-sm px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={setDateToToday}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  오늘
                </button>
              </div>
              <button
                onClick={() => changeDate(1)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="다음 날짜"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick summary metrics */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>완료: <strong>{completedCount}/{dateTasks.length}</strong></span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>예상: <strong>{totalEstimatedMins}분</strong> | 완료: <strong>{totalActualMins}분</strong></span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="all">모든 과목</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="all">모든 유형</option>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Task List */}
          {dateTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <ListTodo className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">선택한 날짜에 등록된 학습 계획이 없습니다.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                새로운 학습 할 일을 추가하여 오늘의 계획을 체계적으로 수립해보세요.
              </p>
              <button
                onClick={() => handleOpenTaskModal()}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                + 학습 할 일 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dateTasks.map((task) => {
                const sub = getSubject(task.subjectId);
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-xl border p-4 shadow-xs transition-all flex items-center justify-between ${
                      isCompleted 
                        ? 'border-slate-200 bg-slate-50/70 opacity-80' 
                        : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <button
                        onClick={() => handleTaskToggle(task.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <Circle className="w-6 h-6 text-slate-300 hover:text-indigo-600" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-white truncate max-w-[120px]"
                            style={{ backgroundColor: sub?.color || '#4F46E5' }}
                          >
                            {sub?.name || '과목'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {typeLabels[task.type] || task.type}
                          </span>
                          {task.priority === 'high' && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-semibold border border-rose-200">
                              최우선
                            </span>
                          )}
                        </div>

                        <h4
                          className={`font-semibold text-sm mt-1 truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>

                        {task.notes && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                            메모: {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 ml-3">
                      <div className="text-right text-xs">
                        <span className="font-semibold text-slate-700">{task.estimatedMinutes}분</span>
                        {task.actualMinutes > 0 && (
                          <span className="text-slate-400 text-[10px] block">
                            (실제 {task.actualMinutes}분)
                          </span>
                        )}
                      </div>

                      {!isCompleted && onStartTimerWithTask && (
                        <button
                          onClick={() => onStartTimerWithTask(task.id, task.subjectId, task.title)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors"
                          title="이 작업으로 집중 타이머 시작"
                        >
                          <Play className="w-3.5 h-3.5 fill-indigo-600" />
                          <span className="hidden sm:inline">공부 시작</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenTaskModal(task)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Weekly Timetable Tab */}
      {activeSubTab === 'weekly_table' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base">주간 정규 강의 & 자습 시간표</h3>
              <p className="text-xs text-slate-500 mt-0.5">요일별 고정 강의 및 자습 시간을 확인하고 관리합니다.</p>
            </div>
            <button
              onClick={() => setIsSlotModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              + 시간표 추가
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((dayNum, idx) => {
              const daySlots = timetable
                .filter((s) => s.dayOfWeek === dayNum)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div key={dayNum} className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <div className="font-bold text-xs text-slate-700 pb-2 border-b border-slate-200 text-center">
                    {shortDays[idx]}요일
                  </div>

                  <div className="mt-3 space-y-2.5 min-h-[160px]">
                    {daySlots.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-slate-400">일정 없음</div>
                    ) : (
                      daySlots.map((slot) => {
                        const sub = getSubject(slot.subjectId);
                        return (
                          <div
                            key={slot.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs relative group"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white truncate max-w-[80px]"
                                style={{ backgroundColor: sub?.color || '#6366F1' }}
                              >
                                {sub?.name || '과목'}
                              </span>
                              <button
                                onClick={() => onDeleteTimetableSlot(slot.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="font-semibold text-xs text-slate-800 mt-1">
                              {slot.startTime} ~ {slot.endTime}
                            </div>
                            {slot.location && (
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate">{slot.location}</div>
                            )}
                            {slot.memo && (
                              <div className="text-[10px] text-indigo-600 mt-0.5 truncate">{slot.memo}</div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Task Add/Edit Modal --- */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingTask ? '학습 할 일 수정' : '새 학습 할 일 추가'}
            </h3>
            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">학습 내용 / 할 일 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 미적분 4장 문제풀이 (p.120~145)"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">과목 *</label>
                  <select
                    required
                    value={taskForm.subjectId}
                    onChange={(e) => setTaskForm({ ...taskForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">날짜 *</label>
                  <input
                    type="date"
                    required
                    value={taskForm.date}
                    onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">학습 유형</label>
                  <select
                    value={taskForm.type}
                    onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value as TaskType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">예상 소요 시간 (분)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={taskForm.estimatedMinutes}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">우선순위</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="high">최우선 (High)</option>
                    <option value="medium">보통 (Medium)</option>
                    <option value="low">낮음 (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">진행 상태</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="todo">대기 중 (To-do)</option>
                    <option value="in_progress">진행 중 (In-Progress)</option>
                    <option value="completed">완료됨 (Done)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">메모 / 특이사항</label>
                <textarea
                  rows={2}
                  placeholder="예: 틀린 문항 오답노트 작성하기"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
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

      {/* --- Timetable Slot Modal --- */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">시간표 강의/자습 슬롯 등록</h3>
            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">요일 *</label>
                  <select
                    value={slotForm.dayOfWeek}
                    onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>월요일</option>
                    <option value={2}>화요일</option>
                    <option value={3}>수요일</option>
                    <option value={4}>목요일</option>
                    <option value={5}>금요일</option>
                    <option value={6}>토요일</option>
                    <option value={0}>일요일</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">과목 *</label>
                  <select
                    value={slotForm.subjectId}
                    onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">시작 시간</label>
                  <input
                    type="time"
                    required
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">종료 시간</label>
                  <input
                    type="time"
                    required
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">강의실 / 장소</label>
                <input
                  type="text"
                  placeholder="예: 공학관 301호, 독서실"
                  value={slotForm.location}
                  onChange={(e) => setSlotForm({ ...slotForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">메모</label>
                <input
                  type="text"
                  placeholder="예: 실습 및 질의응답 세션"
                  value={slotForm.memo}
                  onChange={(e) => setSlotForm({ ...slotForm, memo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  슬롯 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
