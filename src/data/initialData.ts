import { Subject, AcademicGoal, StudyTask, ExamCountdown, StudyLog, TimetableSlot } from '../types';

export const initialSubjects: Subject[] = [
  {
    id: 'sub-1',
    name: '심화 수학 (미적분)',
    code: 'MATH-201',
    targetGrade: 'A+ (95점 이상)',
    currentGrade: 'A (89점)',
    weeklyTargetHours: 8,
    color: '#3B82F6', // Blue
    teacher: '김수학 교수님',
    semester: '2026-1학기',
    notes: '킬러 문항 대비 및 기출 3회독 필수',
  },
  {
    id: 'sub-2',
    name: '수능/토플 영어독해',
    code: 'ENG-102',
    targetGrade: '1등급 (100점)',
    currentGrade: '2등급',
    weeklyTargetHours: 6,
    color: '#10B981', // Emerald
    teacher: '이영문 강사',
    semester: '2026-1학기',
    notes: '매일 아침 어휘 50개 암기 및 빈칸추론 집중',
  },
  {
    id: 'sub-3',
    name: '컴퓨터 알고리즘 & 자료구조',
    code: 'CS-301',
    targetGrade: 'A+',
    currentGrade: 'A-',
    weeklyTargetHours: 7,
    color: '#8B5CF6', // Purple
    teacher: '박컴공 교수님',
    semester: '2026-1학기',
    notes: '그래프 알고리즘과 DP 심화 문제 풀이',
  },
  {
    id: 'sub-4',
    name: '물리학 및 실험 II',
    code: 'PHYS-102',
    targetGrade: 'A',
    currentGrade: 'B+',
    weeklyTargetHours: 5,
    color: '#F59E0B', // Amber
    teacher: '최물리 교수님',
    semester: '2026-1학기',
    notes: '전자기학 공식 유도 및 실험 보고서 작성',
  },
];

export const initialGoals: AcademicGoal[] = [
  {
    id: 'goal-1',
    title: '1학기 학점 4.2 이상 달성 & 장학금 획득',
    category: 'gpa',
    targetDate: '2026-06-30',
    progress: 75,
    priority: 'high',
    milestones: [
      { id: 'm-1', title: '중간고사 전 과목 A 이상 확보', isCompleted: true, dueDate: '2026-04-25' },
      { id: 'm-2', title: '알고리즘 과제 100점 만점 제출', isCompleted: true, dueDate: '2026-05-10' },
      { id: 'm-3', title: '기말고사 4주 전부터 과목별 2회독 완성', isCompleted: false, dueDate: '2026-06-15' },
      { id: 'm-4', title: '최종 평점 확인 및 학업 피드백 정리', isCompleted: false, dueDate: '2026-06-30' },
    ],
    notes: '주간 학습 시간 26시간 달성을 목표로 관리',
  },
  {
    id: 'goal-2',
    title: '수학 기출문제 5개년 3회독 마스터',
    category: 'exam',
    subjectId: 'sub-1',
    targetDate: '2026-04-20',
    progress: 60,
    priority: 'high',
    milestones: [
      { id: 'm-5', title: '2022~2024 기출 1회독 완료', isCompleted: true, dueDate: '2026-03-20' },
      { id: 'm-6', title: '틀린 문제 오답노트 작성 및 유형 분류', isCompleted: true, dueDate: '2026-04-05' },
      { id: 'm-7', title: '킬러 문항 변형문제 50제 풀기', isCompleted: false, dueDate: '2026-04-18' },
    ],
    notes: '미적분 극값 및 정적분 활용 파트 집중',
  },
  {
    id: 'goal-3',
    title: '알고리즘 코딩테스트 골드 달성 및 대회 입상',
    category: 'certification',
    subjectId: 'sub-3',
    targetDate: '2026-05-30',
    progress: 40,
    priority: 'medium',
    milestones: [
      { id: 'm-8', title: 'BFS/DFS & 백트래킹 30제 해결', isCompleted: true, dueDate: '2026-03-15' },
      { id: 'm-9', title: '다익스트라 & 최단경로 알고리즘 정복', isCompleted: false, dueDate: '2026-04-15' },
      { id: 'm-10', title: '모의 코딩테스트 5회 응시', isCompleted: false, dueDate: '2026-05-20' },
    ],
  },
];

const today = new Date().toISOString().split('T')[0];

export const initialTasks: StudyTask[] = [
  {
    id: 'task-1',
    title: '미적분 4장 정적분의 활용 문제풀이 (p.120~145)',
    subjectId: 'sub-1',
    date: today,
    estimatedMinutes: 90,
    actualMinutes: 90,
    status: 'completed',
    priority: 'high',
    type: 'problem_solving',
    notes: '오답 문항 3개 오답노트에 정리 완료',
  },
  {
    id: 'task-2',
    title: '영어 지문 15~18번 구문 분석 및 단어 정리',
    subjectId: 'sub-2',
    date: today,
    estimatedMinutes: 45,
    actualMinutes: 50,
    status: 'completed',
    priority: 'medium',
    type: 'review',
  },
  {
    id: 'task-3',
    title: '자료구조 트리 & 이진 탐색 트리 구현 과제',
    subjectId: 'sub-3',
    date: today,
    estimatedMinutes: 120,
    actualMinutes: 45,
    status: 'in_progress',
    priority: 'high',
    type: 'assignment',
    notes: 'AVL 트리 회전 알고리즘 디버깅 중',
  },
  {
    id: 'task-4',
    title: '물리학 전자기유도 파트 인강 3강 수강',
    subjectId: 'sub-4',
    date: today,
    estimatedMinutes: 60,
    actualMinutes: 0,
    status: 'todo',
    priority: 'medium',
    type: 'lecture',
  },
  {
    id: 'task-5',
    title: '이번 주 취약 개념 복습 및 플래너 점검',
    subjectId: 'sub-1',
    date: today,
    estimatedMinutes: 30,
    actualMinutes: 0,
    status: 'todo',
    priority: 'low',
    type: 'review',
  },
];

export const initialExams: ExamCountdown[] = [
  {
    id: 'exam-1',
    name: '1학기 중간고사 (미적분 & 알고리즘)',
    subjectId: 'sub-1',
    examDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetScore: '100점 만점',
    weightPercentage: 35,
    keyTopics: '미분계수, 역함수 미분, 여러 가지 적분법, 점화식',
  },
  {
    id: 'exam-2',
    name: '자료구조 & 알고리즘 실기 시험',
    subjectId: 'sub-3',
    examDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetScore: '95점 이상',
    weightPercentage: 30,
    keyTopics: '스택, 큐, 힙, BST, 그래프 순회, 정렬 알고리즘',
  },
  {
    id: 'exam-3',
    name: '물리학 1차 정기 평가',
    subjectId: 'sub-4',
    examDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetScore: 'A (90점)',
    weightPercentage: 25,
    keyTopics: '쿨롱 법칙, 전기장, 가우스 법칙, 전위',
  },
];

export const initialStudyLogs: StudyLog[] = [
  {
    id: 'log-1',
    subjectId: 'sub-1',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 50,
    taskTitle: '미적분 고난도 문항 분석',
    focusScore: 5,
    reflection: '치환적분과 부분적분 연계 문항의 발상 패턴을 완벽히 정리함.',
  },
  {
    id: 'log-2',
    subjectId: 'sub-2',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 40,
    taskTitle: '영어 모의고사 빈칸추론 4문항',
    focusScore: 4,
    reflection: '문맥 전환 연결사(However, Nonetheless) 위치 파악 훈련 효과적이었음.',
  },
  {
    id: 'log-3',
    subjectId: 'sub-3',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    durationMinutes: 45,
    taskTitle: '이진 탐색 트리 삽입/삭제 구현',
    focusScore: 5,
    reflection: '노드 삭제 시 3가지 케이스(자식 0, 1, 2개) 처리 로직 검증 완료.',
  },
];

export const initialStudents: import('../types').StudentProfile[] = [
  {
    id: 'stu-1',
    school: '',
    studentNumber: '10315',
    name: '김민준',
    passwordHash: '1234',
    status: 'approved',
    registeredAt: '2026-03-01T09:00:00.000Z',
    approvedAt: '2026-03-01T10:30:00.000Z',
    grade: '1',
    classNum: '3',
    notes: '성실하고 수학/컴퓨터 과목에 집중도 높음',
  },
  {
    id: 'stu-2',
    school: '',
    studentNumber: '10316',
    name: '이서연',
    passwordHash: '1234',
    status: 'approved',
    registeredAt: '2026-03-01T09:15:00.000Z',
    approvedAt: '2026-03-01T10:30:00.000Z',
    grade: '1',
    classNum: '3',
    notes: '영어 독해 플래너 및 단어 암기 매일 성실히 수행',
  },
  {
    id: 'stu-3',
    school: '',
    studentNumber: '10317',
    name: '박도현',
    passwordHash: '1234',
    status: 'pending',
    registeredAt: '2026-03-02T08:20:00.000Z',
    grade: '1',
    classNum: '3',
    notes: '신규 등록 신청 (승인 대기 중)',
  },
  {
    id: 'stu-4',
    school: '',
    studentNumber: '10408',
    name: '최유나',
    passwordHash: '1234',
    status: 'pending',
    registeredAt: '2026-03-02T08:45:00.000Z',
    grade: '1',
    classNum: '4',
    notes: '신규 등록 신청 (승인 대기 중)',
  },
];

export const initialTeacher: import('../types').TeacherAccount = {
  teacherId: 'teacher-1',
  name: '이창렬 교사',
  school: '',
  passwordHash: 'teacher1234',
  email: 'lcr7513@icedu.kr',
};

export const initialTimetable: TimetableSlot[] = [
  { id: 'tt-1', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', subjectId: 'sub-1', location: '공학관 301호', memo: '강의 & 퀴즈' },
  { id: 'tt-2', dayOfWeek: 1, startTime: '13:00', endTime: '15:00', subjectId: 'sub-3', location: 'IT센터 405호', memo: '알고리즘 실습' },
  { id: 'tt-3', dayOfWeek: 2, startTime: '10:00', endTime: '12:00', subjectId: 'sub-2', location: '어학원 204호', memo: '독해 세미나' },
  { id: 'tt-4', dayOfWeek: 3, startTime: '09:00', endTime: '10:30', subjectId: 'sub-1', location: '공학관 301호', memo: '문제풀이 세션' },
  { id: 'tt-5', dayOfWeek: 3, startTime: '14:00', endTime: '16:00', subjectId: 'sub-4', location: '자연과학관 102호', memo: '물리 실험' },
  { id: 'tt-6', dayOfWeek: 4, startTime: '13:00', endTime: '15:00', subjectId: 'sub-3', location: 'IT센터 405호', memo: '자료구조 이론' },
  { id: 'tt-7', dayOfWeek: 5, startTime: '10:00', endTime: '12:00', subjectId: 'sub-2', location: '어학원 204호', memo: '작문 및 어휘' },
];




