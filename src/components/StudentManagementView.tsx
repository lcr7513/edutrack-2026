import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Lock, 
  KeyRound, 
  School, 
  GraduationCap, 
  Search, 
  Filter, 
  CheckSquare, 
  Clock, 
  UserCheck, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Sparkles,
  LogIn,
  LogOut,
  Edit3,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentProfile, TeacherAccount, CurrentUserSession } from '../types';

interface StudentManagementViewProps {
  students: StudentProfile[];
  teacherAccount: TeacherAccount;
  userSession: CurrentUserSession;
  onRegisterStudent: (student: Omit<StudentProfile, 'id' | 'status' | 'registeredAt'>) => void;
  onApproveStudent: (id: string) => void;
  onRejectStudent: (id: string) => void;
  onDeleteStudent: (id: string) => void;
  onResetStudentPassword: (id: string, newPass: string) => void;
  onUpdateTeacherPassword: (newPass: string) => void;
  onLoginStudent: (studentNumber: string, name: string, pass: string) => { success: boolean; message: string; student?: StudentProfile };
  onLoginTeacher: (pass: string) => { success: boolean; message: string };
  onLogout: () => void;
  onExportStudentListCsv: () => void;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  students,
  teacherAccount,
  userSession,
  onRegisterStudent,
  onApproveStudent,
  onRejectStudent,
  onDeleteStudent,
  onResetStudentPassword,
  onUpdateTeacherPassword,
  onLoginStudent,
  onLoginTeacher,
  onLogout,
  onExportStudentListCsv,
}) => {
  // Navigation inside this view: 'register' | 'student_login' | 'teacher_portal'
  const [subTab, setSubTab] = useState<'register' | 'student_login' | 'teacher_portal'>(
    userSession.role === 'teacher' ? 'teacher_portal' : userSession.role === 'student' ? 'student_login' : 'register'
  );

  // Student Registration Form State
  const [regSchool, setRegSchool] = useState('');
  const [regGrade, setRegGrade] = useState('1');
  const [regClassNum, setRegClassNum] = useState('3');
  const [regNumberInClass, setRegNumberInClass] = useState('');
  const [regStudentNumber, setRegStudentNumber] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regNotes, setRegNotes] = useState('');

  // Student Login Form State
  const [loginStudentNum, setLoginStudentNum] = useState('');
  const [loginStudentName, setLoginStudentName] = useState('');
  const [loginStudentPass, setLoginStudentPass] = useState('');
  const [showLoginStudentPass, setShowLoginStudentPass] = useState(false);

  // Teacher Login Form State
  const [teacherPassInput, setTeacherPassInput] = useState('');
  const [showTeacherPass, setShowTeacherPass] = useState(false);

  // Teacher Change Password State
  const [showChangeTeacherPassModal, setShowChangeTeacherPassModal] = useState(false);
  const [currentTeacherPass, setCurrentTeacherPass] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const [newTeacherPassConfirm, setNewTeacherPassConfirm] = useState('');

  // Teacher Portal Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Reset Student Password Modal State
  const [selectedStudentForReset, setSelectedStudentForReset] = useState<StudentProfile | null>(null);
  const [resetNewPass, setResetNewPass] = useState('1234');

  // Status & Feedback message
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Auto-compose Student Number when grade, class, and num change
  const handleGradeClassNumChange = (g: string, c: string, num: string) => {
    setRegGrade(g);
    setRegClassNum(c);
    setRegNumberInClass(num);
    if (g && c && num) {
      const paddedClass = c.padStart(2, '0');
      const paddedNum = num.padStart(2, '0');
      setRegStudentNumber(`${g}${paddedClass}${paddedNum}`);
    }
  };

  // Handle Student Registration
  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    if (!regSchool.trim() || !regName.trim() || !regStudentNumber.trim() || !regPassword.trim()) {
      setAlertMsg({ type: 'error', text: '학교, 학번, 이름, 비밀번호를 모두 입력해 주세요.' });
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setAlertMsg({ type: 'error', text: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    if (regPassword.length < 4) {
      setAlertMsg({ type: 'error', text: '비밀번호는 최소 4자리 이상 설정해 주세요.' });
      return;
    }

    // Check duplicate student number
    const exists = students.some((s) => s.studentNumber === regStudentNumber.trim() && s.school === regSchool.trim());
    if (exists) {
      setAlertMsg({ type: 'error', text: `해당 학교(${regSchool})에 이미 등록된 학번(${regStudentNumber})이 존재합니다.` });
      return;
    }

    onRegisterStudent({
      school: regSchool.trim(),
      grade: regGrade,
      classNum: regClassNum,
      studentNumber: regStudentNumber.trim(),
      name: regName.trim(),
      passwordHash: regPassword,
      notes: regNotes.trim() || undefined,
    });

    setAlertMsg({ 
      type: 'success', 
      text: `[${regName}] 학생의 인적 사항이 성공적으로 등록되었습니다! 담당 교사의 승인 후 정식 이용이 가능합니다.` 
    });

    // Reset inputs
    setRegName('');
    setRegStudentNumber('');
    setRegNumberInClass('');
    setRegPassword('');
    setRegPasswordConfirm('');
    setRegNotes('');

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}
  };

  // Handle Student Login Submit
  const handleStudentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    if (!loginStudentNum.trim() || !loginStudentPass.trim()) {
      setAlertMsg({ type: 'error', text: '학번(또는 이름)과 비밀번호를 입력해 주세요.' });
      return;
    }

    const res = onLoginStudent(loginStudentNum.trim(), loginStudentName.trim(), loginStudentPass.trim());
    if (res.success) {
      setAlertMsg({ type: 'success', text: res.message });
      setLoginStudentPass('');
      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch {}
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
  };

  // Handle Teacher Login Submit
  const handleTeacherLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    if (!teacherPassInput.trim()) {
      setAlertMsg({ type: 'error', text: '교사 관리자 비밀번호를 입력해 주세요.' });
      return;
    }

    const res = onLoginTeacher(teacherPassInput.trim());
    if (res.success) {
      setAlertMsg({ type: 'success', text: res.message });
      setTeacherPassInput('');
      setSubTab('teacher_portal');
      try {
        confetti({ particleCount: 60, spread: 70 });
      } catch {}
    } else {
      setAlertMsg({ type: 'error', text: res.message });
    }
  };

  // Handle Change Teacher Password
  const handleChangeTeacherPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTeacherPass !== teacherAccount.passwordHash) {
      setAlertMsg({ type: 'error', text: '현재 교사 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (newTeacherPass.length < 4) {
      setAlertMsg({ type: 'error', text: '새 비밀번호는 4자리 이상 입력해 주세요.' });
      return;
    }
    if (newTeacherPass !== newTeacherPassConfirm) {
      setAlertMsg({ type: 'error', text: '새 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    onUpdateTeacherPassword(newTeacherPass);
    setShowChangeTeacherPassModal(false);
    setCurrentTeacherPass('');
    setNewTeacherPass('');
    setNewTeacherPassConfirm('');
    setAlertMsg({ type: 'success', text: '교사 관리자 비밀번호가 성공적으로 변경되었습니다.' });
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentNumber.includes(searchQuery) ||
      s.school.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;

    return matchSearch && matchStatus && matchGrade;
  });

  const pendingCount = students.filter((s) => s.status === 'pending').length;
  const approvedCount = students.filter((s) => s.status === 'approved').length;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Banner / Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">학생 인적사항 & 교사 승인 관리</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                학생은 학교·학번·이름과 비밀번호로 직접 등록하고, 교사는 이를 검토하여 승인 및 관리합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Current Auth Status Pill */}
        <div className="flex items-center space-x-2">
          {userSession.role === 'teacher' ? (
            <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-indigo-900">
                {teacherAccount.name} ({teacherAccount.school})
              </span>
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">교사 모드</span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : userSession.role === 'student' && userSession.student ? (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-900">
                {userSession.student.name} ({userSession.student.studentNumber})
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  userSession.student.status === 'approved'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {userSession.student.status === 'approved' ? '승인 완료' : '승인 대기중'}
              </span>
              <button
                onClick={onLogout}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="로그아웃"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium">
              게스트 모드 (로그인 미완료)
            </div>
          )}
        </div>
      </div>

      {/* Alert Notice Banner */}
      {alertMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : alertMsg.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alertMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{alertMsg.text}</span>
          </div>
          <button
            onClick={() => setAlertMsg(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-Navigation Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs">
        <button
          onClick={() => setSubTab('register')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
            subTab === 'register'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>학생 인적사항 등록 (학생 가입)</span>
        </button>

        <button
          onClick={() => setSubTab('student_login')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
            subTab === 'student_login'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>학생 로그인</span>
        </button>

        <button
          onClick={() => setSubTab('teacher_portal')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
            subTab === 'teacher_portal'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>교사 관리 포털 (승인·삭제)</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Student Registration Form */}
      {subTab === 'register' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs mb-1">
              <GraduationCap className="w-4 h-4" />
              <span>EduTrack 학생 등록</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">학생 인적사항 신규 등록</h2>
            <p className="text-xs text-slate-500 mt-1">
              본인의 학교, 학년, 반, 번호(학번), 이름과 로그인에 사용할 비밀번호를 등록하세요.
            </p>
          </div>

          <form onSubmit={handleSubmitRegistration} className="space-y-4 max-w-2xl">
            {/* School Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1">
                <School className="w-3.5 h-3.5 text-indigo-600" />
                <span>학교명 *</span>
              </label>
              <input
                type="text"
                required
                value={regSchool}
                onChange={(e) => setRegSchool(e.target.value)}
                placeholder="학교명 입력 (예: 고등학교)"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Grade, Class, Number helper */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">학년</label>
                <select
                  value={regGrade}
                  onChange={(e) => handleGradeClassNumChange(e.target.value, regClassNum, regNumberInClass)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                >
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">반</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={regClassNum}
                  onChange={(e) => handleGradeClassNumChange(regGrade, e.target.value, regNumberInClass)}
                  placeholder="예: 3"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">번호</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={regNumberInClass}
                  onChange={(e) => handleGradeClassNumChange(regGrade, regClassNum, e.target.value)}
                  placeholder="예: 15"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Student ID & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>학번 (5자리 고유번호) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">자동생성 또는 직접수정</span>
                </label>
                <input
                  type="text"
                  required
                  value={regStudentNumber}
                  onChange={(e) => setRegStudentNumber(e.target.value)}
                  placeholder="예: 10315"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  이름 (성명) *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="예: 김민준"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Password and Password Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>비밀번호 설정 *</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center space-x-1"
                  >
                    {showRegPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showRegPassword ? '숨기기' : '보기'}</span>
                  </button>
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="4자리 이상 입력 (예: 1234)"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  비밀번호 확인 *
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Notes / Message to teacher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                선생님께 남길 메모 (희망 진로, 집중 과목 등 선택사항)
              </label>
              <textarea
                rows={2}
                value={regNotes}
                onChange={(e) => setRegNotes(e.target.value)}
                placeholder="예: 컴퓨터공학 전공 희망, 수학 미적분 집중 관리 희망합니다."
                className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden resize-none"
              />
            </div>

            {/* Notice */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
              💡 <strong>안내:</strong> 학생 등록을 완료하면 즉시 <strong>[승인 대기]</strong> 상태로 저장됩니다. 담임 또는 교과 선생님께서 승인한 후 정식으로 개인 플래너와 연동됩니다.
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>학생 인적사항 등록 신청하기</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: Student Login */}
      {subTab === 'student_login' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-lg mx-auto space-y-6">
          <div className="text-center border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">학생 로그인</h2>
            <p className="text-xs text-slate-500 mt-1">
              등록 시 설정한 학번과 비밀번호를 입력해 주세요.
            </p>
          </div>

          {userSession.role === 'student' && userSession.student ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>현재 로그인된 학생</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                  <div><strong>이름:</strong> {userSession.student.name}</div>
                  <div><strong>학번:</strong> {userSession.student.studentNumber}</div>
                  <div><strong>학교:</strong> {userSession.student.school}</div>
                  <div>
                    <strong>상태:</strong>{' '}
                    <span className={userSession.student.status === 'approved' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'}>
                      {userSession.student.status === 'approved' ? '승인 완료' : '승인 대기 중'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>학생 로그아웃</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleStudentLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학번 (또는 이름) *
                </label>
                <input
                  type="text"
                  required
                  value={loginStudentNum}
                  onChange={(e) => setLoginStudentNum(e.target.value)}
                  placeholder="예: 10315 또는 김민준"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>비밀번호 *</span>
                  <button
                    type="button"
                    onClick={() => setShowLoginStudentPass(!showLoginStudentPass)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center space-x-1"
                  >
                    {showLoginStudentPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showLoginStudentPass ? '숨기기' : '보기'}</span>
                  </button>
                </label>
                <input
                  type={showLoginStudentPass ? 'text' : 'password'}
                  required
                  value={loginStudentPass}
                  onChange={(e) => setLoginStudentPass(e.target.value)}
                  placeholder="비밀번호 입력 (기본 샘플: 1234)"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="text-[11px] text-slate-400">
                * 처음 접속하는 학생은 먼저 <strong>[학생 인적사항 등록]</strong> 탭에서 정보를 등록해 주세요.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>학생 계정으로 로그인</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: Teacher Management Portal */}
      {subTab === 'teacher_portal' && (
        <div className="space-y-6">
          {userSession.role !== 'teacher' ? (
            /* Teacher Login Card if not authenticated */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-md mx-auto space-y-6">
              <div className="text-center border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">교사 관리자 로그인</h2>
                <p className="text-xs text-slate-500 mt-1">
                  학생 등록 승인 및 명부 관리를 위해 교사 비밀번호를 입력해 주세요.
                </p>
              </div>

              <form onSubmit={handleTeacherLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>교사 비밀번호 *</span>
                    <button
                      type="button"
                      onClick={() => setShowTeacherPass(!showTeacherPass)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center space-x-1"
                    >
                      {showTeacherPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showTeacherPass ? '숨기기' : '보기'}</span>
                    </button>
                  </label>
                  <input
                    type={showTeacherPass ? 'text' : 'password'}
                    required
                    value={teacherPassInput}
                    onChange={(e) => setTeacherPassInput(e.target.value)}
                    placeholder="교사 비밀번호 입력"
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                  <span>기본 초기 비밀번호: <code className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">teacher1234</code></span>
                  <span className="text-[10px] text-slate-400">(로그인 후 변경 가능)</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>교사 관리자로 인증하기</span>
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Teacher Dashboard */
            <div className="space-y-6">
              {/* Teacher Summary & Action Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {teacherAccount.name} 선생님의 학생 관리 센터
                    </h2>
                    {teacherAccount.school && teacherAccount.school !== '인천고등학교' && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-semibold">
                        {teacherAccount.school}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    전체 학생 {students.length}명 (승인 완료 {approvedCount}명, 대기 {pendingCount}명)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowChangeTeacherPassModal(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                    <span>교사 비밀번호 변경</span>
                  </button>

                  <button
                    onClick={onExportStudentListCsv}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>학생 명부 CSV 다운로드</span>
                  </button>
                </div>
              </div>

              {/* Pending Approvals Section if any */}
              {pendingCount > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>신규 등록 승인 대기 목록 ({pendingCount}건)</span>
                    </div>
                    <span className="text-[11px] text-amber-700 font-medium">검토 후 [승인]을 눌러주세요</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {students
                      .filter((s) => s.status === 'pending')
                      .map((stu) => (
                        <div
                          key={stu.id}
                          className="p-4 bg-white rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm">{stu.name}</span>
                              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                학번 {stu.studentNumber}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                              <div>{stu.school} &middot; {stu.grade || '1'}학년 {stu.classNum || '1'}반</div>
                              <div className="text-[11px] text-slate-400">
                                신청일시: {new Date(stu.registeredAt).toLocaleString('ko-KR')}
                              </div>
                              {stu.notes && (
                                <div className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-md mt-1">
                                  "{stu.notes}"
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => {
                                onApproveStudent(stu.id);
                                setAlertMsg({ type: 'success', text: `[${stu.name}] 학생의 등록이 승인되었습니다.` });
                              }}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>승인</span>
                            </button>
                            <button
                              onClick={() => {
                                onRejectStudent(stu.id);
                                setAlertMsg({ type: 'info', text: `[${stu.name}] 학생의 등록 신청을 반려했습니다.` });
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              반려
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`정말 [${stu.name}] 학생의 등록 정보를 삭제하시겠습니까?`)) {
                                  onDeleteStudent(stu.id);
                                }
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* All Students Table / Management */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="이름, 학번, 학교명 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                    >
                      <option value="all">전체 상태</option>
                      <option value="approved">승인 완료만</option>
                      <option value="pending">승인 대기만</option>
                      <option value="rejected">반려됨만</option>
                    </select>

                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                    >
                      <option value="all">전체 학년</option>
                      <option value="1">1학년</option>
                      <option value="2">2학년</option>
                      <option value="3">3학년</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="py-3 px-4">학번</th>
                        <th className="py-3 px-4">이름</th>
                        <th className="py-3 px-4">학교 / 학년·반</th>
                        <th className="py-3 px-4">등록 일시</th>
                        <th className="py-3 px-4 text-center">승인 상태</th>
                        <th className="py-3 px-4 text-right">관리 작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            검색 조건에 일치하는 학생이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((stu) => (
                          <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {stu.studentNumber}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {stu.name}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <span>{stu.school}</span>
                              <span className="text-slate-400 ml-1.5">
                                ({stu.grade || '1'}학년 {stu.classNum || '1'}반)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-400">
                              {new Date(stu.registeredAt).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {stu.status === 'approved' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>승인 완료</span>
                                </span>
                              ) : stu.status === 'pending' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>승인 대기</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>반려됨</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {stu.status !== 'approved' && (
                                  <button
                                    onClick={() => onApproveStudent(stu.id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                                  >
                                    승인
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setSelectedStudentForReset(stu);
                                    setResetNewPass('1234');
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                                  title="비밀번호 초기화"
                                >
                                  PW 초기화
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm(`정말 [${stu.name}] (${stu.studentNumber}) 학생 정보를 삭제하시겠습니까?`)) {
                                      onDeleteStudent(stu.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Change Teacher Password */}
      {showChangeTeacherPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>교사 관리자 비밀번호 변경</span>
              </div>
              <button
                onClick={() => setShowChangeTeacherPassModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangeTeacherPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">현재 비밀번호</label>
                <input
                  type="password"
                  required
                  value={currentTeacherPass}
                  onChange={(e) => setCurrentTeacherPass(e.target.value)}
                  placeholder="현재 비밀번호 입력"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">새 비밀번호 (4자리 이상)</label>
                <input
                  type="password"
                  required
                  value={newTeacherPass}
                  onChange={(e) => setNewTeacherPass(e.target.value)}
                  placeholder="새 비밀번호 입력"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  required
                  value={newTeacherPassConfirm}
                  onChange={(e) => setNewTeacherPassConfirm(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeTeacherPassModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  변경 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Student Password (by Teacher) */}
      {selectedStudentForReset && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>학생 비밀번호 초기화</span>
              </div>
              <button
                onClick={() => setSelectedStudentForReset(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600">
              <strong>{selectedStudentForReset.name}</strong> 학생({selectedStudentForReset.studentNumber})의 비밀번호를 새로운 값으로 재설정합니다.
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">새 임시 비밀번호</label>
              <input
                type="text"
                value={resetNewPass}
                onChange={(e) => setResetNewPass(e.target.value)}
                placeholder="예: 1234"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setSelectedStudentForReset(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!resetNewPass.trim()) return;
                  onResetStudentPassword(selectedStudentForReset.id, resetNewPass.trim());
                  setSelectedStudentForReset(null);
                  setAlertMsg({ type: 'success', text: `[${selectedStudentForReset.name}] 학생의 비밀번호가 [${resetNewPass}]로 초기화되었습니다.` });
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
              >
                초기화 적용
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
