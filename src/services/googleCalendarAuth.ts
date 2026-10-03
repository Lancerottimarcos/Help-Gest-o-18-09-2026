import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Scopes required for Google Calendar synchronization
export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

// Create fresh GoogleAuthProvider with requested Workspace scopes
export const createGoogleCalendarProvider = () => {
  const p = new GoogleAuthProvider();
  CALENDAR_SCOPES.forEach((scope) => p.addScope(scope));
  p.setCustomParameters({
    prompt: 'select_account',
  });
  return p;
};

// Flag to indicate if we are in the middle of a sign-in flow
let isSigningIn = false;

// IN-MEMORY ONLY CACHE for the access token as mandated by security guidelines
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

type AuthCallback = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthCallback>();

function notifyListeners() {
  listeners.forEach((callback) => {
    try {
      callback(cachedUser, cachedAccessToken);
    } catch (err) {
      console.error('Error in Google Calendar Auth listener:', err);
    }
  });
}

/**
 * Initialize Google Calendar Auth state listener.
 */
export const initGoogleCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        notifyListeners();
      } else if (!isSigningIn) {
        // Token not in memory; trigger failure or need re-auth for API calls
        if (onAuthFailure) onAuthFailure();
        notifyListeners();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
      notifyListeners();
    }
  });
};

/**
 * Subscribe to authentication changes
 */
export const subscribeGoogleCalendarAuth = (callback: AuthCallback) => {
  listeners.add(callback);
  // Initial immediate call with current in-memory state
  callback(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(callback);
  };
};

/**
 * Initiates the Google Sign-in flow with Calendar permissions.
 * Must be called from a user interaction (e.g. button click).
 */
export const signInWithGoogleCalendar = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const provider = createGoogleCalendarProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google Calendar.');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    notifyListeners();

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      // User closed the popup before finishing sign-in or switched tabs; graceful cancellation
      return null;
    }
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Google sign-in popup was blocked by browser.');
      throw new Error('A janela popup de login do Google foi bloqueada pelo navegador. Permita popups para autenticar.');
    }
    console.warn('Google Calendar Sign In non-fatal warning:', error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Returns the currently cached access token in memory.
 */
export const getGoogleCalendarAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Sets or updates the access token in memory (for refreshed tokens)
 */
export const setGoogleCalendarAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  notifyListeners();
};

/**
 * Returns current authenticated Google user
 */
export const getGoogleCalendarUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

/**
 * Checks if the user is currently authenticated with a valid access token in memory
 */
export const isGoogleCalendarConnected = (): boolean => {
  return Boolean(cachedAccessToken && (cachedUser || auth.currentUser));
};

/**
 * Disconnect / Logout from Google Calendar and clear in-memory tokens
 */
export const signOutGoogleCalendar = async (): Promise<void> => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
    cachedUser = null;
    notifyListeners();
  }
};
