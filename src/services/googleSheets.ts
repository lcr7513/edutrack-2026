import { Subject, AcademicGoal, StudyTask, ExamCountdown, StudyLog, StudentProfile } from '../types';

export interface EduTrackFullData {
  subjects: Subject[];
  goals: AcademicGoal[];
  tasks: StudyTask[];
  exams: ExamCountdown[];
  studyLogs: StudyLog[];
  students?: StudentProfile[];
}

// Google Sheets API V4 Endpoints
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export const REQUIRED_SHEETS = [
  '0_전체학생_제출누적대장',
  '1_학업요약_대시보드',
  '2_과목_및_목표',
  '3_학습_플래너',
  '4_시험_및_과제_DDay',
  '5_집중학습_기록로그',
  '6_학생_인적사항_및_승인명부',
];

/**
 * Ensures all 5 required sheets exist in the spreadsheet.
 * If any are missing, dynamically creates them.
 */
export async function ensureEduTrackSheetsExist(
  accessToken: string,
  spreadsheetId: string
): Promise<Map<string, number>> {
  // 1. Fetch current sheets metadata
  const metaRes = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets(properties(sheetId,title))`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `스프레드시트 정보 조회 실패 (${metaRes.status})`);
  }

  const metaData = await metaRes.json();
  const existingSheets: { sheetId: number; title: string }[] = 
    metaData.sheets?.map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
    })) || [];

  const existingSheetMap = new Map<string, number>();
  existingSheets.forEach((s) => existingSheetMap.set(s.title, s.sheetId));

  // Determine missing sheets
  const missingSheets = REQUIRED_SHEETS.filter((title) => !existingSheetMap.has(title));

  if (missingSheets.length > 0) {
    const requests = missingSheets.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    }));

    const updateRes = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      console.warn('Could not auto-create missing sheets:', err);
    } else {
      const updateData = await updateRes.json();
      updateData.replies?.forEach((reply: any) => {
        if (reply.addSheet?.properties) {
          existingSheetMap.set(
            reply.addSheet.properties.title,
            reply.addSheet.properties.sheetId
          );
        }
      });
    }
  }

  return existingSheetMap;
}

/**
 * Creates a formatted EduTrack Google Sheet with 5 comprehensive tabs
 */
export async function createEduTrackSpreadsheet(
  accessToken: string,
  title: string = `EduTrack 학업계획 & 학습관리 (${new Date().toLocaleDateString('ko-KR')})`
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const requestBody = {
    properties: {
      title: title,
    },
    sheets: REQUIRED_SHEETS.map((sheetTitle) => ({
      properties: {
        title: sheetTitle,
        gridProperties: { frozenRowCount: 1 },
      },
    })),
  };

  const response = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `구글 시트 생성 실패 (상태코드: ${response.status})`);
  }

  const result = await response.json();
  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit`,
  };
}

/**
 * Pushes all EduTrack data into the 5 sheets of the Google Spreadsheet
 */
export async function pushDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: EduTrackFullData
): Promise<boolean> {
  // Step 1: Ensure all 5 tabs exist in target spreadsheet
  await ensureEduTrackSheetsExist(accessToken, spreadsheetId);

  const getSubjectName = (subId?: string) => {
    if (!subId) return '-';
    return data.subjects.find((s) => s.id === subId)?.name || subId;
  };

  // 1. Dashboard Sheet Data
  const totalWeeklyTarget = data.subjects.reduce((sum, s) => sum + (s.weeklyTargetHours || 0), 0);
  const totalStudyMinutes = data.studyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  const completedTasks = data.tasks.filter((t) => t.status === 'completed').length;
  const taskCompletionRate = data.tasks.length ? Math.round((completedTasks / data.tasks.length) * 100) : 0;

  const dashboardValues = [
    ['[EduTrack 학업 종합 요약 리포트]', '', '', ''],
    ['동기화 일시', new Date().toLocaleString('ko-KR'), '', ''],
    ['총 등록 과목 수', `${data.subjects.length}개 과목`, '', ''],
    ['주간 총 목표 학습시간', `${totalWeeklyTarget} 시간`, '', ''],
    ['누적 집중 학습시간', `${Math.floor(totalStudyMinutes / 60)}시간 ${totalStudyMinutes % 60}분`, '', ''],
    ['플래너 할 일 달성률', `${taskCompletionRate}% (${completedTasks}/${data.tasks.length})`, '', ''],
    ['진행 중인 목표 수', `${data.goals.length}개`, '', ''],
    ['등록된 시험/과제 수', `${data.exams.length}개`, '', ''],
    ['', '', '', ''],
    ['[과목별 현황 요약]', '', '', ''],
    ['과목명', '목표 등급', '현재 등급', '주간 목표(시간)'],
    ...data.subjects.map((s) => [s.name, s.targetGrade || '-', s.currentGrade || '-', `${s.weeklyTargetHours}시간`]),
  ];

  // 2. Subjects & Goals Sheet Data
  const subjectsValues = [
    ['과목 ID', '과목명', '과목코드', '목표 등급/점수', '현재 등급', '주당 목표(시간)', '담당자/교수', '학기', '학습 비고'],
    ...data.subjects.map((s) => [
      s.id,
      s.name,
      s.code || '',
      s.targetGrade,
      s.currentGrade || '',
      s.weeklyTargetHours,
      s.teacher || '',
      s.semester || '',
      s.notes || '',
    ]),
    ['', '', '', '', '', '', '', '', ''],
    ['[학업 목표 로드맵]', '', '', '', '', '', '', '', ''],
    ['목표 ID', '목표명', '카테고리', '연관 과목', '목표 기한', '달성률(%)', '우선순위', '세부 마일스톤', '비고'],
    ...data.goals.map((g) => [
      g.id,
      g.title,
      g.category,
      getSubjectName(g.subjectId),
      g.targetDate,
      `${g.progress}%`,
      g.priority,
      g.milestones.map((m) => `[${m.isCompleted ? '완료' : '미완'}] ${m.title}`).join(' | '),
      g.notes || '',
    ]),
  ];

  // 3. Study Planner Sheet Data
  const plannerValues = [
    ['할일 ID', '날짜', '과목명', '학습 내용', '학습 유형', '우선순위', '예상 시간(분)', '실제 소요(분)', '상태', '메모'],
    ...data.tasks.map((t) => [
      t.id,
      t.date,
      getSubjectName(t.subjectId),
      t.title,
      t.type,
      t.priority,
      t.estimatedMinutes,
      t.actualMinutes || 0,
      t.status === 'completed' ? '완료' : t.status === 'in_progress' ? '진행중' : '대기',
      t.notes || '',
    ]),
  ];

  // 4. Exams & Assignments Sheet Data
  const examValues = [
    ['시험/과제 ID', '평가명', '해당 과목', '시험/제출 일자', '목표 점수/등급', '반영 비율(%)', '핵심 출제 범위 및 키워드'],
    ...data.exams.map((e) => [
      e.id,
      e.name,
      getSubjectName(e.subjectId),
      e.examDate,
      e.targetScore,
      e.weightPercentage ? `${e.weightPercentage}%` : '-',
      e.keyTopics,
    ]),
  ];

  // 5. Study Logs Sheet Data
  const logsValues = [
    ['로그 ID', '학습 일시', '과목명', '학습 주제/할일', '집중 시간(분)', '집중도 (1~5점)', '학습 성찰 및 피드백'],
    ...data.studyLogs.map((l) => [
      l.id,
      new Date(l.timestamp).toLocaleString('ko-KR'),
      getSubjectName(l.subjectId),
      l.taskTitle,
      l.durationMinutes,
      `${'★'.repeat(l.focusScore || 5)}${'☆'.repeat(5 - (l.focusScore || 5))} (${l.focusScore || 5}/5)`,
      l.reflection || '',
    ]),
  ];

  // 6. Student Registry Sheet Data
  const studentList = data.students || [];
  const studentsValues = [
    ['학생 ID', '학교명', '학번', '이름', '학년', '반', '등록일시', '승인여부', '승인일시', '교사메모/참고사항'],
    ...studentList.map((s) => [
      s.id,
      s.school,
      s.studentNumber,
      s.name,
      s.grade || '1',
      s.classNum || '1',
      new Date(s.registeredAt).toLocaleString('ko-KR'),
      s.status === 'approved' ? '승인완료' : s.status === 'pending' ? '승인대기' : '반려',
      s.approvedAt ? new Date(s.approvedAt).toLocaleString('ko-KR') : '-',
      s.notes || '',
    ]),
  ];

  // Step 2: Clear old ranges first to avoid stale trailing rows
  try {
    const clearUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchClear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: [
          `'1_학업요약_대시보드'!A1:Z500`,
          `'2_과목_및_목표'!A1:Z500`,
          `'3_학습_플래너'!A1:Z1000`,
          `'4_시험_및_과제_DDay'!A1:Z500`,
          `'5_집중학습_기록로그'!A1:Z1000`,
          `'6_학생_인적사항_및_승인명부'!A1:Z1000`,
        ],
      }),
    });
  } catch (clearErr) {
    console.warn('Batch clear notice:', clearErr);
  }

  // Step 3: Write data using explicitly quoted sheet names
  const valueRanges = [
    { range: `'1_학업요약_대시보드'!A1`, values: dashboardValues },
    { range: `'2_과목_및_목표'!A1`, values: subjectsValues },
    { range: `'3_학습_플래너'!A1`, values: plannerValues },
    { range: `'4_시험_및_과제_DDay'!A1`, values: examValues },
    { range: `'5_집중학습_기록로그'!A1`, values: logsValues },
    { range: `'6_학생_인적사항_및_승인명부'!A1`, values: studentsValues },
  ];

  const updateUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`;
  const response = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueRanges,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `구글 시트 데이터 전송 실패 (${response.status})`);
  }

  return true;
}

/**
 * Appends a student's submission as a permanent new row into '0_전체학생_제출누적대장'
 * without overwriting previous submissions.
 */
export async function appendStudentSubmissionToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  submission: {
    studentName: string;
    studentNumber: string;
    school?: string;
    memo?: string;
    data: EduTrackFullData;
  }
): Promise<boolean> {
  // Ensure required sheets exist
  await ensureEduTrackSheetsExist(accessToken, spreadsheetId);

  const { studentName, studentNumber, school, memo, data } = submission;
  const nowStr = new Date().toLocaleString('ko-KR');
  const today = new Date().toISOString().split('T')[0];
  
  const todayTasks = data.tasks.filter((t) => t.date === today);
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed');
  const totalStudyMinutes = data.studyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  const totalWeeklyTarget = data.subjects.reduce((sum, s) => sum + (s.weeklyTargetHours || 0), 0);
  const taskCompletionRate = todayTasks.length ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 100;
  
  // Format summaries
  const subjectsSummary = data.subjects.map((s) => `${s.name}(목표:${s.targetGrade || 'A'})`).join(', ') || '없음';
  const todayTaskSummary = todayTasks.length > 0 
    ? todayTasks.map((t) => `[${t.status === 'completed' ? '완료' : '진행'}] ${t.title}`).join(' | ')
    : '오늘 플랜 없음';
  const upcomingExams = data.exams.map((e) => `${e.name}(${e.examDate})`).join(', ') || '없음';

  // 1. Check if Header row exists in '0_전체학생_제출누적대장'
  try {
    const checkHeaderUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/'0_전체학생_제출누적대장'!A1:M1`;
    const headerRes = await fetch(checkHeaderUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const headerJson = await headerRes.json().catch(() => ({}));
    if (!headerJson.values || headerJson.values.length === 0 || !headerJson.values[0] || headerJson.values[0].length === 0) {
      // Write Header
      const headerRow = [
        '제출 일시',
        '학번',
        '성명',
        '학교',
        '등록 과목 수',
        '과목 목록',
        '오늘 플래너 달성률',
        '오늘 할일 내역',
        '누적 학습시간(분)',
        '주간 목표(시간)',
        '다가오는 시험/일정',
        '학생 제출 메모 / 성찰',
        '상세 플랜 개수(개)',
      ];
      await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values/'0_전체학생_제출누적대장'!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [headerRow] }),
      });
    }
  } catch (hdrErr) {
    console.warn('Header setup note:', hdrErr);
  }

  // 2. Append the new submission row
  const rowData = [
    nowStr,
    studentNumber || '미지정',
    studentName || '익명 학생',
    school || 'EduTrack',
    data.subjects.length,
    subjectsSummary,
    `${taskCompletionRate}% (${completedTodayTasks.length}/${todayTasks.length})`,
    todayTaskSummary,
    `${Math.floor(totalStudyMinutes / 60)}시간 ${totalStudyMinutes % 60}분 (${totalStudyMinutes}분)`,
    `${totalWeeklyTarget}시간`,
    upcomingExams,
    memo || '학업 자료 제출',
    data.tasks.length,
  ];

  const appendUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values/'0_전체학생_제출누적대장'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [rowData] }),
  });

  if (!appendRes.ok) {
    const err = await appendRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `누적 대장 행 추가 실패 (${appendRes.status})`);
  }

  return true;
}

/**
 * Fetches data from Google Sheets and imports it back into EduTrack
 */
export async function pullDataFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Partial<EduTrackFullData>> {
  const ranges = [
    `'2_과목_및_목표'!A2:I100`,
    `'3_학습_플래너'!A2:J500`,
    `'4_시험_및_과제_DDay'!A2:G100`,
    `'5_집중학습_기록로그'!A2:G500`,
  ];

  const queryUrl = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchGet?ranges=${ranges.map((r) => encodeURIComponent(r)).join('&ranges=')}`;
  const response = await fetch(queryUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || '구글 시트 데이터 가져오기 실패');
  }

  const data = await response.json();
  const valueRanges = data.valueRanges || [];

  // Parse Subjects
  const importedSubjects: Subject[] = [];
  if (valueRanges[0]?.values) {
    for (const row of valueRanges[0].values) {
      if (row[0] && row[1] && !row[0].startsWith('[') && row[0] !== '과목 ID') {
        importedSubjects.push({
          id: row[0] || `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: row[1] || '과목',
          code: row[2] || '',
          targetGrade: row[3] || 'A',
          currentGrade: row[4] || '',
          weeklyTargetHours: Number(row[5]) || 5,
          color: '#3B82F6',
          teacher: row[6] || '',
          semester: row[7] || '',
          notes: row[8] || '',
        });
      }
    }
  }

  // Parse Planner Tasks
  const importedTasks: StudyTask[] = [];
  if (valueRanges[1]?.values) {
    for (const row of valueRanges[1].values) {
      if (row[0] && row[1] && row[0] !== '할일 ID') {
        const subMatch = importedSubjects.find((s) => s.name === row[2]) || importedSubjects[0];
        const statusMap: Record<string, 'todo' | 'in_progress' | 'completed'> = {
          '완료': 'completed',
          '진행중': 'in_progress',
          '대기': 'todo',
        };
        importedTasks.push({
          id: row[0] || `task-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          date: row[1] || new Date().toISOString().split('T')[0],
          subjectId: subMatch ? subMatch.id : 'sub-1',
          title: row[3] || '학습 항목',
          type: (row[4] as any) || 'review',
          priority: (row[5] as any) || 'medium',
          estimatedMinutes: Number(row[6]) || 30,
          actualMinutes: Number(row[7]) || 0,
          status: statusMap[row[8]] || 'todo',
          notes: row[9] || '',
        });
      }
    }
  }

  return {
    subjects: importedSubjects.length > 0 ? importedSubjects : undefined,
    tasks: importedTasks.length > 0 ? importedTasks : undefined,
  };
}

/**
 * Downloads full EduTrack data as a JSON backup file
 */
export function exportToJsonBackup(data: EduTrackFullData) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `EduTrack_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Exports planner and study logs to CSV
 */
export function exportToCsv(data: EduTrackFullData) {
  const rows = [
    ['날짜', '과목', '학습내용', '유형', '예상시간(분)', '실제소요(분)', '상태', '메모'],
    ...data.tasks.map((t) => [
      t.date,
      data.subjects.find((s) => s.id === t.subjectId)?.name || t.subjectId,
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      t.estimatedMinutes,
      t.actualMinutes,
      t.status,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]),
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `EduTrack_Planner_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Exports students roster to CSV
 */
export function exportStudentsToCsv(students: StudentProfile[]) {
  const rows = [
    ['학교명', '학번', '성명', '학년', '반', '등록일시', '승인상태', '승인일시', '비고'],
    ...students.map((s) => [
      s.school,
      s.studentNumber,
      `"${s.name.replace(/"/g, '""')}"`,
      s.grade || '1',
      s.classNum || '1',
      new Date(s.registeredAt).toLocaleString('ko-KR'),
      s.status === 'approved' ? '승인완료' : s.status === 'pending' ? '승인대기' : '반려',
      s.approvedAt ? new Date(s.approvedAt).toLocaleString('ko-KR') : '-',
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]),
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `EduTrack_Student_Roster_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}


