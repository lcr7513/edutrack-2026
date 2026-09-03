import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
// Force account selection dialog so user can switch between accounts smoothly
provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the access token in memory (do NOT store in localStorage)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google OAuth 액세스 토큰을 가져오지 못했습니다.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const requestFreshToken = async (): Promise<{ user?: User; accessToken: string }> => {
  try {
    const res = await googleSignIn();
    return { user: res.user, accessToken: res.accessToken };
  } catch (fbErr: any) {
    console.warn('Firebase signInWithPopup fallback to GSI token client:', fbErr);
    
    // GSI Fallback
    const oauthConfig = getOAuthConfig();
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2 && oauthConfig.clientId) {
      return new Promise((resolve, reject) => {
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: oauthConfig.clientId,
            scope: SCOPES.join(' '),
            callback: (response: any) => {
              if (response.error) {
                reject(new Error(`Google 인증 오류: ${response.error}`));
                return;
              }
              if (response.access_token) {
                setCachedAccessToken(response.access_token);
                resolve({ accessToken: response.access_token });
              } else {
                reject(new Error('Google 액세스 토큰을 받지 못했습니다.'));
              }
            },
          });
          client.requestAccessToken({ prompt: 'select_account' });
        } catch (gsiErr) {
          reject(gsiErr);
        }
      });
    }
    throw fbErr;
  }
};

export const setCachedAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut error:', e);
  }
  cachedAccessToken = null;
  cachedUser = null;
};

export const getOAuthConfig = () => {
  return {
    clientId: firebaseConfig.oAuthClientId,
    projectId: firebaseConfig.projectId,
  };
};
