export interface Subject {
  id: string;
  name: string;
  code?: string;
  targetGrade: string; // e.g. "A+", "1등급", "95점"
  currentGrade?: string;
  weeklyTargetHours: number;
  color: string;
  teacher?: string;
  semester?: string;
  notes?: string;
}

export interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

export interface AcademicGoal {
  id: string;
  title: string;
  category: 'exam' | 'gpa' | 'certification' | 'assignment' | 'habit';
  subjectId?: string;
  targetDate: string;
  progress: number; // 0 to 100
  priority: 'high' | 'medium' | 'low';
  milestones: Milestone[];
  notes?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskType = 'lecture' | 'review' | 'problem_solving' | 'assignment' | 'reading' | 'other';

export interface StudyTask {
  id: string;
  title: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  estimatedMinutes: number;
  actualMinutes: number;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  type: TaskType;
  notes?: string;
}

export interface ExamCountdown {
  id: string;
  name: string;
  subjectId: string;
  examDate: string; // YYYY-MM-DD or ISO
  targetScore: string;
  weightPercentage?: number;
  keyTopics: string;
}

export interface StudyLog {
  id: string;
  subjectId: string;
  timestamp: string; // ISO
  durationMinutes: number;
  taskTitle: string;
  focusScore: number; // 1 to 5
  reflection: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat) or 1 (Mon) to 5 (Fri)
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  subjectId: string;
  location?: string;
  memo?: string;
}

export interface StudentProfile {
  id: string;
  school: string; // e.g. "인천고등학교"
  studentNumber: string; // 학번 e.g. "10315" or "1학년 3반 15번"
  name: string; // 이름 e.g. "김민준"
  passwordHash: string; // 비밀번호
  status: 'pending' | 'approved' | 'rejected'; // 교사 승인 상태
  registeredAt: string; // ISO Date
  approvedAt?: string;
  notes?: string; // 교사 코멘트
  grade?: string; // 학년
  classNum?: string; // 반
}

export interface TeacherAccount {
  teacherId: string;
  name: string;
  school: string;
  passwordHash: string;
  email?: string;
}

export interface CurrentUserSession {
  role: 'guest' | 'student' | 'teacher';
  student?: StudentProfile;
  teacher?: TeacherAccount;
}

export interface GoogleSheetsConfig {
  isConnected: boolean;
  accessToken: string | null;
  tokenExpiresAt: number | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  userEmail?: string;
}

export interface AIPlanRecommendation {
  summary: string;
  strategies: string[];
  weeklyDistribution: {
    subject: string;
    recommendedHours: number;
    focusTopic: string;
    method: string;
  }[];
  milestones: {
    timeframe: string;
    goal: string;
    actionItems: string[];
  }[];
  customAdvice: string;
}
