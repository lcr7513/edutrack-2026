import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Database,
  Link,
  PlusCircle,
  ShieldCheck,
  LogOut,
  Key,
  Info,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleSheetsConfig } from '../types';
import { 
  EduTrackFullData, 
  createEduTrackSpreadsheet, 
  pushDataToSpreadsheet, 
  pullDataFromSpreadsheet, 
  exportToJsonBackup, 
  exportToCsv,
  REQUIRED_SHEETS
} from '../services/googleSheets';
import { 
  googleSignIn, 
  initAuth, 
  logoutGoogle, 
  getOAuthConfig,
  setCachedAccessToken
} from '../services/googleAuth';

interface GoogleSheetsHubViewProps {
  sheetsConfig: GoogleSheetsConfig;
  onUpdateConfig: (newConfig: Partial<GoogleSheetsConfig>) => void;
  fullData: EduTrackFullData;
  onRestoreData: (data: Partial<EduTrackFullData>) => void;
}

export const GoogleSheetsHubView: React.FC<GoogleSheetsHubViewProps> = ({
  sheetsConfig,
  onUpdateConfig,
  fullData,
  onRestoreData,
}) => {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; details?: string } | null>(null);

  const [existingSheetInput, setExistingSheetInput] = useState('');
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showManualAuth, setShowManualAuth] = useState(false);
  const [authUserName, setAuthUserName] = useState<string | null>(null);
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setAuthUserName(user.displayName || user.email || '인증된 사용자');
        setAuthUserEmail(user.email || null);
        if (token) {
          onUpdateConfig({
            isConnected: true,
            accessToken: token,
          });
        }
      },
      () => {
        setAuthUserName(null);
        setAuthUserEmail(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsAuthorizing(true);
    setStatusMessage(null);

    try {
      // 1. Try Firebase Auth popup with Google Provider
      const result = await googleSignIn();
      if (result?.accessToken) {
        setAuthUserName(result.user.displayName || result.user.email || '사용자');
        setAuthUserEmail(result.user.email || null);
        onUpdateConfig({
          isConnected: true,
          accessToken: result.accessToken,
          tokenExpiresAt: Date.now() + 3600 * 1000,
        });

        setStatusMessage({ 
          type: 'success', 
          text: `Google 계정(${result.user.email || '인증 완료'}) 연결 성공! 이제 새 구글 시트를 생성하거나 동기화를 진행하세요.` 
        });

        try {
          confetti({ particleCount: 60, spread: 60 });
        } catch {}
        return;
      }
    } catch (fbErr: any) {
      console.warn('Firebase signInWithPopup failed:', fbErr);

      // Check if this was a 403 access_denied / unapproved test user error
      const errMsg = fbErr.message || '';
      if (errMsg.includes('access_denied') || errMsg.includes('403') || fbErr.code === 'auth/popup-closed-by-user') {
        setStatusMessage({
          type: 'error',
          text: 'Google 로그인 인증에 실패했습니다.',
          details: 'Google 클라우드 보안 정책상, 현재 테스트 등록된 기본 계정(lcr7513@icedu.kr)으로 로그인해주셔야 승인됩니다. 다른 계정(예: 개인 Gmail)을 사용하려면 Google Drive에서 해당 계정의 시트를 lcr7513@icedu.kr 계정에 [편집자]로 공유 후 시트 ID/URL을 입력해주세요.',
        });
        setIsAuthorizing(false);
        return;
      }

      // 2. Fallback to Google Identity Services with provisioned client ID
      const oauthConfig = getOAuthConfig();
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2 && oauthConfig.clientId) {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: oauthConfig.clientId,
            scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
            callback: (response: any) => {
              setIsAuthorizing(false);
              if (response.error) {
                setStatusMessage({ 
                  type: 'error', 
                  text: `Google 인증 오류: ${response.error}`,
                  details: '승인된 기본 계정(lcr7513@icedu.kr)을 선택해 주세요.'
                });
                return;
              }
              if (response.access_token) {
                const expiresIn = Number(response.expires_in) || 3600;
                setCachedAccessToken(response.access_token);
                onUpdateConfig({
                  isConnected: true,
                  accessToken: response.access_token,
                  tokenExpiresAt: Date.now() + expiresIn * 1000,
                });

                setStatusMessage({ 
                  type: 'success', 
                  text: 'Google 계정 인증이 성공적으로 완료되었습니다! 이제 구글 시트를 연동할 수 있습니다.' 
                });

                try {
                  confetti({ particleCount: 50, spread: 60 });
                } catch {}
              }
            },
          });
          client.requestAccessToken({ prompt: 'select_account' });
          return;
        } catch (gsiErr: any) {
          console.error('GSI client error:', gsiErr);
        }
      }

      setStatusMessage({
        type: 'error',
        text: `인증 오류: ${fbErr.message || '로그인 창이 닫혔거나 허용되지 않았습니다.'}`,
        details: '승인된 기본 계정(lcr7513@icedu.kr)으로 로그인하시거나, 팝업 차단 여부를 확인해 주세요.',
      });
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Manual Access Token Apply
  const handleApplyManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    const token = manualTokenInput.trim();
    setCachedAccessToken(token);
    onUpdateConfig({
      isConnected: true,
      accessToken: token,
      tokenExpiresAt: Date.now() + 3600 * 1000,
    });
    setManualTokenInput('');
    setStatusMessage({ type: 'success', text: '액세스 토큰이 수동 적용되었습니다. 이제 동기화를 실행해보세요.' });
  };

  // Logout Google
  const handleLogout = async () => {
    await logoutGoogle();
    onUpdateConfig({
      isConnected: false,
      accessToken: null,
      tokenExpiresAt: null,
    });
    setAuthUserName(null);
    setAuthUserEmail(null);
    setStatusMessage({ type: 'info', text: 'Google 계정 연결이 해제되었습니다. 다른 계정으로 다시 연결할 수 있습니다.' });
  };

  // Create New Dedicated Google Spreadsheet
  const handleCreateNewSheet = async () => {
    if (!sheetsConfig.accessToken) {
      setStatusMessage({ type: 'error', text: '먼저 상단의 [Google 계정으로 연동하기] 버튼을 눌러 로그인을 완료해주세요.' });
      return;
    }

    setIsCreatingSheet(true);
    setStatusMessage({ type: 'info', text: 'EduTrack 전용 Google Spreadsheet를 생성하고 5개 탭을 구성하는 중입니다...' });

    try {
      const { spreadsheetId, spreadsheetUrl } = await createEduTrackSpreadsheet(
        sheetsConfig.accessToken,
        `EduTrack 학업계획 & 학습관리 (${new Date().toLocaleDateString('ko-KR')})`
      );

      // Immediately push full data into the new sheet
      await pushDataToSpreadsheet(sheetsConfig.accessToken, spreadsheetId, fullData);

      onUpdateConfig({
        spreadsheetId,
        spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
      });

      setStatusMessage({
        type: 'success',
        text: '새 Google Sheet가 완벽히 생성되었고, 학업 요약 및 일일 플래너 데이터가 모두 성공적으로 기록되었습니다!',
      });

      try {
        confetti({ particleCount: 70, spread: 70 });
      } catch {}
    } catch (err: any) {
      setStatusMessage({ 
        type: 'error', 
        text: err.message || '구글 시트 생성 중 오류가 발생했습니다.',
        details: '액세스 토큰이 만료되었을 수 있으므로 [계정 재인증]을 눌러 다시 로그인해 보세요.'
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Push Data (Sync to Google Sheets)
  const handlePushData = async () => {
    if (!sheetsConfig.accessToken || !sheetsConfig.spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Google 계정 연결 및 스프레드시트 설정이 필요합니다.' });
      return;
    }

    setIsPushing(true);
    setStatusMessage(null);

    try {
      await pushDataToSpreadsheet(sheetsConfig.accessToken, sheetsConfig.spreadsheetId, fullData);
      onUpdateConfig({ lastSyncedAt: new Date().toISOString() });
      setStatusMessage({
        type: 'success',
        text: '현재 앱의 5개 영역(학업 요약, 과목 목표, 일일 플래너, 시험 D-Day, 집중 기록 로그)이 구글 시트에 100% 정상 수합되었습니다!',
      });
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {}
    } catch (err: any) {
      console.error('Push data error:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.message || '데이터 전송에 실패했습니다.',
        details: '시트 ID가 올바른지, 해당 시트에 대한 쓰기 권한이 현재 로그인된 계정에 있는지 확인해주세요.'
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Pull Data (Import from Google Sheets)
  const handlePullData = async () => {
    if (!sheetsConfig.accessToken || !sheetsConfig.spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Google 계정 연결 및 스프레드시트 설정이 필요합니다.' });
      return;
    }

    setIsPulling(true);
    setStatusMessage(null);

    try {
      const importedData = await pullDataFromSpreadsheet(sheetsConfig.accessToken, sheetsConfig.spreadsheetId);
      onRestoreData(importedData);
      onUpdateConfig({ lastSyncedAt: new Date().toISOString() });
      setStatusMessage({
        type: 'success',
        text: '구글 시트로부터 최신 과목 및 플래너 데이터를 성공적으로 불러왔습니다!',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || '데이터 가져오기에 실패했습니다.' });
    } finally {
      setIsPulling(false);
    }
  };

  // Link Existing Sheet by ID or URL
  const handleConnectExistingSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingSheetInput.trim()) return;

    let sheetId = existingSheetInput.trim();
    const match = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    onUpdateConfig({
      spreadsheetId: sheetId,
      spreadsheetUrl: sheetUrl,
      lastSyncedAt: new Date().toISOString(),
    });

    setExistingSheetInput('');
    setStatusMessage({
      type: 'success',
      text: `스프레드시트 (${sheetId})가 연결되었습니다. 아래 [전체 데이터 동기화] 버튼을 눌러 시트에 데이터를 수합하세요!`,
    });
  };

  // Handle JSON File Restore
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onRestoreData(parsed);
        setStatusMessage({ type: 'success', text: '백업 파일로부터 데이터가 성공적으로 복원되었습니다!' });
      } catch {
        setStatusMessage({ type: 'error', text: '올바르지 않은 JSON 백업 파일 형식입니다.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Google Sheets 실시간 연동 센터</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            학업 계획, 과목별 목표, 일일 플래너, 집중 타이머 로그를 구글 시트와 양방향으로 동기화합니다.
          </p>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                sheetsConfig.accessToken ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span className="font-semibold text-slate-700">
              {sheetsConfig.accessToken ? (sheetsConfig.spreadsheetId ? '시트 연동 완료' : '계정 인증됨') : '계정 미연결'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs space-y-1.5 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-semibold">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 ml-2"
            >
              ✕
            </button>
          </div>
          {statusMessage.details && (
            <p className="text-[11px] opacity-90 pl-6 leading-relaxed">
              {statusMessage.details}
            </p>
          )}
        </div>
      )}

      {/* Step 1: Google Account Authentication */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Google 계정 권한 연결</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Google Sheets 및 Google Drive 파일 접근 권한을 안전하게 승인합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {sheetsConfig.accessToken && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                title="연결 해제"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>계정 로그아웃</span>
              </button>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isAuthorizing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-colors shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAuthorizing ? '인증 창 여는 중...' : sheetsConfig.accessToken ? '계정 재인증 / 다른 계정 선택' : 'Google 계정으로 연동하기'}</span>
            </button>
          </div>
        </div>

        {sheetsConfig.accessToken ? (
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Google 인증 토큰이 활성화되어 있습니다. {authUserEmail ? `(${authUserEmail})` : authUserName ? `(${authUserName})` : ''}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Sheets & Drive API 권한 정상</span>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={() => setShowManualAuth(!showManualAuth)}
              className="text-[11px] text-slate-500 hover:text-indigo-600 underline"
            >
              {showManualAuth ? '토큰 직접 입력 닫기' : '기관 계정 토큰 직접 입력하기'}
            </button>
          </div>
        )}

        {showManualAuth && !sheetsConfig.accessToken && (
          <form onSubmit={handleApplyManualToken} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
              <Key className="w-3.5 h-3.5" />
              <span>OAuth 2.0 Access Token 직접 입력 (학교/기관 계정용)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                placeholder="ya29.a0..."
                className="grow px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs"
              >
                적용
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Step 2: Spreadsheet Setup (Create New or Connect Existing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Create New Sheet Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs mb-1">
              <PlusCircle className="w-4 h-4" />
              <span>추천 방식</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">새 EduTrack 구글 시트 만들기</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              사용자의 Google Drive에 5개 탭(학업 대시보드, 과목 목표, 학습 플래너, 시험 D-Day, 집중 기록 로그)으로 구성된 전용 스프레드시트를 즉시 자동 생성하고 모든 내용을 수합합니다.
            </p>
          </div>

          <button
            onClick={handleCreateNewSheet}
            disabled={isCreatingSheet}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isCreatingSheet ? '구글 시트 생성 및 데이터 수합 중...' : '새 구글 시트 원클릭 생성 & 자동 수합'}</span>
          </button>
        </div>

        {/* Connect Existing Sheet Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-600 font-bold text-xs mb-1">
              <Link className="w-4 h-4" />
              <span>기존 시트 연결</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">기존 구글 시트 ID / URL 연동</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              이미 생성된 Google Sheets 주소 또는 시트 ID를 입력하여 바로 연동합니다. (필요한 5개 탭이 자동으로 구성됩니다)
            </p>
          </div>

          <form onSubmit={handleConnectExistingSheet} className="space-y-2">
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/... 또는 시트 ID"
              value={existingSheetInput}
              onChange={(e) => setExistingSheetInput(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              기존 시트 연결하기
            </button>
          </form>
        </div>
      </div>

      {/* Step 3: Active Sheet Controls & 2-Way Sync */}
      {sheetsConfig.spreadsheetId && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>연결된 Google Spreadsheet</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg">
                EduTrack 학업계획 & 학습관리 시트
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                ID: {sheetsConfig.spreadsheetId}
              </p>
            </div>

            {sheetsConfig.spreadsheetUrl && (
              <a
                href={sheetsConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Google Drive에서 시트 열기</span>
              </a>
            )}
          </div>

          {/* Sync Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handlePushData}
              disabled={isPushing}
              className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-indigo-900 flex items-center space-x-1.5">
                  <RefreshCw className={`w-4 h-4 text-indigo-600 ${isPushing ? 'animate-spin' : ''}`} />
                  <span>[앱 ➡️ 구글 시트] 전체 데이터 수합 & 동기화</span>
                </span>
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded">내보내기</span>
              </div>
              <p className="text-[11px] text-indigo-700 mt-1">
                현재 등록된 과목, 학업 목표, 일일 플래너, 시험 일정, 집중 학습 로그 등 5개 탭의 모든 내용을 구글 시트에 덮어쓰고 수합합니다.
              </p>
            </button>

            <button
              onClick={handlePullData}
              disabled={isPulling}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-left transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>[구글 시트 ➡️ 앱] 데이터 불러오기</span>
                </span>
                <span className="text-[10px] bg-slate-700 text-white font-bold px-2 py-0.5 rounded">가져오기</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Google Sheets에서 수정한 과목명, 등급, 할 일 목록을 읽어와 앱에 반영합니다.
              </p>
            </button>
          </div>

          {sheetsConfig.lastSyncedAt && (
            <div className="text-center text-[11px] text-slate-400">
              마지막 동기화 일시: {new Date(sheetsConfig.lastSyncedAt).toLocaleString('ko-KR')}
            </div>
          )}
        </div>
      )}

      {/* Sheets Structure Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Google Sheets 7개 전용 탭 구조 안내 (학생별 누적 수합 지원)</span>
        </h3>
        <p className="text-xs text-slate-500">
          EduTrack 스프레드시트는 아래와 같이 학생별 누적 수합 대장 및 학업 관리에 최적화된 7개 탭으로 구성되어 가독성과 데이터 보존성을 극대화합니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {REQUIRED_SHEETS.map((tab, idx) => (
            <div key={tab} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <strong className="text-slate-800 block mb-1">{tab}</strong>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {idx === 0 && '학생이 제출할 때마다 행(Row)으로 계속 쌓이는 실시간 전체 제출 누적 대장'}
                {idx === 1 && '총 과목 수, 주간 학습시간, 달성률, 과목별 현황 요약 리포트'}
                {idx === 2 && '과목명, 목표 등급, 현재 등급, 주당 목표시간, 학업 로드맵'}
                {idx === 3 && '일자별 학습 과제, 소요 시간, 우선순위, 완료 여부 체크'}
                {idx === 4 && '시험/평가 일정, D-Day 카운트다운, 목표 점수, 핵심 범위'}
                {idx === 5 && '뽀모도로/스톱워치 집중 시간, 집중도(1~5점), 성찰 메모'}
                {idx === 6 && '학교, 학번, 이름, 승인상태 및 교사 참고사항 명부'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Local Backup & Export Fallback */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
          <Database className="w-5 h-5 text-slate-700" />
          <span>로컬 데이터 백업 및 오프라인 내보내기</span>
        </h3>
        <p className="text-xs text-slate-500">
          Google 계정 연동 외에도 내 PC에 JSON 또는 CSV 파일로 언제든지 안전하게 백업 및 복원할 수 있습니다.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => exportToJsonBackup(fullData)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>JSON 전체 백업 다운로드</span>
          </button>

          <button
            onClick={() => exportToCsv(fullData)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>CSV 플래너 내보내기</span>
          </button>

          <label className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>JSON 백업 파일 복원</span>
            <input
              type="file"
              accept=".json"
              onChange={handleJsonUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

    </div>
  );
};
