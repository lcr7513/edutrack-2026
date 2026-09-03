import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SubjectsAndGoalsView } from './components/SubjectsAndGoalsView';
import { PlannerView } from './components/PlannerView';
import { FocusTimerView } from './components/FocusTimerView';
import { AIAdvisorView } from './components/AIAdvisorView';
import { AITutorView } from './components/AITutorView';
import { GoogleSheetsHubView } from './components/GoogleSheetsHubView';
import { StudentManagementView } from './components/StudentManagementView';
import { StudentSubmitModal } from './components/StudentSubmitModal';
import { 
  Subject, 
  AcademicGoal, 
  StudyTask, 
  ExamCountdown, 
  StudyLog, 
  TimetableSlot, 
  GoogleSheetsConfig,
  StudentProfile,
  TeacherAccount,
  CurrentUserSession
} from './types';
import { 
  initialSubjects, 
  initialGoals, 
  initialTasks, 
  initialExams, 
  initialStudyLogs, 
  initialTimetable,
  initialStudents,
  initialTeacher
} from './data/initialData';
import { pushDataToSpreadsheet, exportStudentsToCsv } from './services/googleSheets';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);

  // Core Data States with localStorage persistence
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('edutrack_subjects');
    return saved ? JSON.parse(saved) : initialSubjects;
  });

  const [goals, setGoals] = useState<AcademicGoal[]>(() => {
    const saved = localStorage.getItem('edutrack_goals');
    return saved ? JSON.parse(saved) : initialGoals;
  });

  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem('edutrack_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });

  const [exams, setExams] = useState<ExamCountdown[]>(() => {
    const saved = localStorage.getItem('edutrack_exams');
    return saved ? JSON.parse(saved) : initialExams;
  });

  const [studyLogs, setStudyLogs] = useState<StudyLog[]>(() => {
    const saved = localStorage.getItem('edutrack_studylogs');
    return saved ? JSON.parse(saved) : initialStudyLogs;
  });

  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem('edutrack_timetable');
    return saved ? JSON.parse(saved) : initialTimetable;
  });

  // Students & Teacher State
  const [students, setStudents] = useState<StudentProfile[]>(() => {
    const saved = localStorage.getItem('edutrack_students');
    if (!saved) return initialStudents;
    try {
      const parsed: StudentProfile[] = JSON.parse(saved);
      return parsed.map(s => s.school === '인천고등학교' ? { ...s, school: '' } : s);
    } catch {
      return initialStudents;
    }
  });

  const [teacherAccount, setTeacherAccount] = useState<TeacherAccount>(() => {
    const saved = localStorage.getItem('edutrack_teacher_account');
    if (!saved) return initialTeacher;
    try {
      const parsed: TeacherAccount = JSON.parse(saved);
      return { ...parsed, school: parsed.school === '인천고등학교' ? '' : parsed.school };
    } catch {
      return initialTeacher;
    }
  });

  const [userSession, setUserSession] = useState<CurrentUserSession>(() => {
    const saved = localStorage.getItem('edutrack_user_session');
    if (!saved) return { role: 'guest' };
    try {
      const parsed: CurrentUserSession = JSON.parse(saved);
      if (parsed.role === 'teacher' && parsed.teacher?.school === '인천고등학교') {
        parsed.teacher.school = '';
      }
      if (parsed.role === 'student' && parsed.student?.school === '인천고등학교') {
        parsed.student.school = '';
      }
      return parsed;
    } catch {
      return { role: 'guest' };
    }
  });

  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('edutrack_sheets_config');
    return saved ? JSON.parse(saved) : {
      isConnected: false,
      accessToken: null,
      tokenExpiresAt: null,
      spreadsheetId: null,
      spreadsheetUrl: null,
      spreadsheetTitle: 'EduTrack 학업계획 & 학습관리',
      lastSyncedAt: null,
      autoSync: true,
    };
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [timerPresetTask, setTimerPresetTask] = useState<{ subjectId: string; taskTitle: string } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('edutrack_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('edutrack_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('edutrack_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('edutrack_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('edutrack_studylogs', JSON.stringify(studyLogs));
  }, [studyLogs]);

  useEffect(() => {
    localStorage.setItem('edutrack_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('edutrack_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('edutrack_teacher_account', JSON.stringify(teacherAccount));
  }, [teacherAccount]);

  useEffect(() => {
    localStorage.setItem('edutrack_user_session', JSON.stringify(userSession));
  }, [userSession]);

  useEffect(() => {
    localStorage.setItem('edutrack_sheets_config', JSON.stringify(sheetsConfig));
  }, [sheetsConfig]);

  // Full Data bundle for syncing & exporting
  const fullData = {
    subjects,
    goals,
    tasks,
    exams,
    studyLogs,
    students,
  };

  // Quick Sync Handler
  const handleQuickSync = async () => {
    if (!sheetsConfig.accessToken || !sheetsConfig.spreadsheetId) {
      setCurrentTab('sheets');
      return;
    }

    setIsSyncing(true);
    try {
      await pushDataToSpreadsheet(sheetsConfig.accessToken, sheetsConfig.spreadsheetId, fullData);
      setSheetsConfig((prev) => ({
        ...prev,
        lastSyncedAt: new Date().toISOString(),
      }));
    } catch (err: any) {
      console.error('Quick sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Student Registration & Auth Handlers
  const handleRegisterStudent = (newStudentData: Omit<StudentProfile, 'id' | 'status' | 'registeredAt'>) => {
    const newStudent: StudentProfile = {
      ...newStudentData,
      id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      status: 'pending',
      registeredAt: new Date().toISOString(),
    };
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleApproveStudent = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'approved', approvedAt: new Date().toISOString() } : s))
    );
    // If approved student is currently logged in, update session
    if (userSession.role === 'student' && userSession.student?.id === id) {
      setUserSession((prev) => ({
        ...prev,
        student: prev.student ? { ...prev.student, status: 'approved', approvedAt: new Date().toISOString() } : undefined,
      }));
    }
  };

  const handleRejectStudent = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (userSession.role === 'student' && userSession.student?.id === id) {
      setUserSession({ role: 'guest' });
    }
  };

  const handleResetStudentPassword = (id: string, newPass: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, passwordHash: newPass } : s))
    );
  };

  const handleUpdateTeacherPassword = (newPass: string) => {
    setTeacherAccount((prev) => ({ ...prev, passwordHash: newPass }));
  };

  const handleLoginStudent = (studentNumberOrName: string, name: string, pass: string) => {
    const matched = students.find(
      (s) =>
        (s.studentNumber === studentNumberOrName || s.name === studentNumberOrName || s.name === name) &&
        s.passwordHash === pass
    );

    if (!matched) {
      return { success: false, message: '학번(또는 이름)과 비밀번호가 일치하지 않습니다.' };
    }

    setUserSession({
      role: 'student',
      student: matched,
    });

    return { 
      success: true, 
      message: `${matched.name} 학생으로 로그인되었습니다.`, 
      student: matched 
    };
  };

  const handleLoginTeacher = (pass: string) => {
    if (pass !== teacherAccount.passwordHash) {
      return { success: false, message: '교사 비밀번호가 일치하지 않습니다.' };
    }

    setUserSession({
      role: 'teacher',
      teacher: teacherAccount,
    });

    return { success: true, message: `${teacherAccount.name} 선생님으로 인증되었습니다.` };
  };

  const handleLogout = () => {
    setUserSession({ role: 'guest' });
  };

  const handleExportStudentListCsv = () => {
    exportStudentsToCsv(students);
  };

  // Subjects Handlers
  const handleAddSubject = (subject: Subject) => setSubjects((prev) => [...prev, subject]);
  const handleUpdateSubject = (subject: Subject) => setSubjects((prev) => prev.map((s) => s.id === subject.id ? subject : s));
  const handleDeleteSubject = (id: string) => setSubjects((prev) => prev.filter((s) => s.id !== id));

  // Goals Handlers
  const handleAddGoal = (goal: AcademicGoal) => setGoals((prev) => [...prev, goal]);
  const handleUpdateGoal = (goal: AcademicGoal) => setGoals((prev) => prev.map((g) => g.id === goal.id ? goal : g));
  const handleDeleteGoal = (id: string) => setGoals((prev) => prev.filter((g) => g.id !== id));
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.isCompleted).length;
        const progress = updatedMilestones.length ? Math.round((completedCount / updatedMilestones.length) * 100) : g.progress;
        return { ...g, milestones: updatedMilestones, progress };
      })
    );
  };

  // Tasks Handlers
  const handleAddTask = (task: StudyTask) => setTasks((prev) => [task, ...prev]);
  const handleUpdateTask = (task: StudyTask) => setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
  const handleDeleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newStatus = t.status === 'completed' ? 'todo' : 'completed';
        return { ...t, status: newStatus };
      })
    );
  };

  // Exams Handlers
  const handleAddExam = (exam: ExamCountdown) => setExams((prev) => [...prev, exam]);
  const handleDeleteExam = (id: string) => setExams((prev) => prev.filter((e) => e.id !== id));

  // Study Logs Handlers
  const handleAddStudyLog = (log: StudyLog) => {
    setStudyLogs((prev) => [log, ...prev]);
    // Auto-update task actual minutes if matched
    setTasks((prev) =>
      prev.map((t) => {
        if (t.title === log.taskTitle) {
          return { ...t, actualMinutes: (t.actualMinutes || 0) + log.durationMinutes };
        }
        return t;
      })
    );
  };
  const handleDeleteStudyLog = (id: string) => setStudyLogs((prev) => prev.filter((l) => l.id !== id));

  // Timetable Handlers
  const handleAddTimetableSlot = (slot: TimetableSlot) => setTimetable((prev) => [...prev, slot]);
  const handleDeleteTimetableSlot = (id: string) => setTimetable((prev) => prev.filter((s) => s.id !== id));

  // Full Restore Handler
  const handleRestoreData = (data: Partial<typeof fullData>) => {
    if (data.subjects) setSubjects(data.subjects);
    if (data.goals) setGoals(data.goals);
    if (data.tasks) setTasks(data.tasks);
    if (data.exams) setExams(data.exams);
    if (data.studyLogs) setStudyLogs(data.studyLogs);
    if (data.students) setStudents(data.students);
  };

  // Start Focus Timer shortcut from Planner or Dashboard
  const handleStartTimerWithTask = (taskId: string, subjectId: string, taskTitle: string) => {
    setTimerPresetTask({ subjectId, taskTitle });
    setCurrentTab('timer');
  };

  // Calculate earliest upcoming exam D-Day
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingExams = exams
    .map((e) => {
      const diff = Math.ceil((new Date(e.examDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    })
    .filter((d) => d >= 0)
    .sort((a, b) => a - b);
  const earliestDDay = upcomingExams.length > 0 ? upcomingExams[0] : undefined;

  const pendingStudentCount = students.filter((s) => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Persistent Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        sheetsConfig={sheetsConfig}
        onQuickSync={handleQuickSync}
        isSyncing={isSyncing}
        upcomingExamDays={earliestDDay}
        userSession={userSession}
        pendingStudentCount={pendingStudentCount}
      />

      {/* Main Content Area */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            subjects={subjects}
            goals={goals}
            tasks={tasks}
            exams={exams}
            studyLogs={studyLogs}
            sheetsConfig={sheetsConfig}
            userSession={userSession}
            students={students}
            onNavigateTab={setCurrentTab}
            onToggleTask={handleToggleTask}
            onQuickSync={handleQuickSync}
            isSyncing={isSyncing}
            onStartTimerWithTask={handleStartTimerWithTask}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        )}

        {currentTab === 'students' && (
          <StudentManagementView
            students={students}
            teacherAccount={teacherAccount}
            userSession={userSession}
            onRegisterStudent={handleRegisterStudent}
            onApproveStudent={handleApproveStudent}
            onRejectStudent={handleRejectStudent}
            onDeleteStudent={handleDeleteStudent}
            onResetStudentPassword={handleResetStudentPassword}
            onUpdateTeacherPassword={handleUpdateTeacherPassword}
            onLoginStudent={handleLoginStudent}
            onLoginTeacher={handleLoginTeacher}
            onLogout={handleLogout}
            onExportStudentListCsv={handleExportStudentListCsv}
          />
        )}

        {currentTab === 'goals' && (
          <SubjectsAndGoalsView
            subjects={subjects}
            goals={goals}
            exams={exams}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onToggleMilestone={handleToggleMilestone}
            onAddExam={handleAddExam}
            onDeleteExam={handleDeleteExam}
          />
        )}

        {currentTab === 'planner' && (
          <PlannerView
            subjects={subjects}
            tasks={tasks}
            timetable={timetable}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleTask}
            onAddTimetableSlot={handleAddTimetableSlot}
            onDeleteTimetableSlot={handleDeleteTimetableSlot}
            onStartTimerWithTask={handleStartTimerWithTask}
            onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
          />
        )}

        {currentTab === 'timer' && (
          <FocusTimerView
            subjects={subjects}
            studyLogs={studyLogs}
            onAddStudyLog={handleAddStudyLog}
            onDeleteStudyLog={handleDeleteStudyLog}
            initialSubjectId={timerPresetTask?.subjectId}
            initialTaskTitle={timerPresetTask?.taskTitle}
          />
        )}

        {currentTab === 'ai_tutor' && (
          <AITutorView
            subjects={subjects}
            goals={goals}
            exams={exams}
            userSession={userSession}
          />
        )}

        {currentTab === 'ai' && (
          <AIAdvisorView
            subjects={subjects}
            goals={goals}
            exams={exams}
          />
        )}

        {currentTab === 'sheets' && (
          <GoogleSheetsHubView
            sheetsConfig={sheetsConfig}
            onUpdateConfig={(newConf) => setSheetsConfig((prev) => ({ ...prev, ...newConf }))}
            fullData={fullData}
            onRestoreData={handleRestoreData}
          />
        )}
      </main>

      {/* Student Google Sheets Submit Modal */}
      <StudentSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        subjects={subjects}
        goals={goals}
        tasks={tasks}
        exams={exams}
        studyLogs={studyLogs}
        students={students}
        sheetsConfig={sheetsConfig}
        userSession={userSession}
        onUpdateSheetsConfig={(newConf) => setSheetsConfig((prev) => ({ ...prev, ...newConf }))}
        onSuccessSync={() => {
          setSheetsConfig((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toISOString(),
          }));
        }}
        onNavigateToSheets={() => setCurrentTab('sheets')}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <strong>EduTrack</strong> &copy; {new Date().getFullYear()} 학생 인적사항 관리 & 구글 시트 학업계획 플랫폼
          </div>
          <div className="flex items-center space-x-4">
            <span>Google Sheets API v4 6개 탭 동기화</span>
            <span>교사 승인 & 학생 인적관리</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

