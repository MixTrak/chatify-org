import { initializeApp, FirebaseError } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB8-XAwRNDRkHaOEYo1I8DEwe2iFa2keDU",
  authDomain: "next-message-817a2.firebaseapp.com",
  projectId: "next-message-817a2",
  storageBucket: "next-message-817a2.firebasestorage.app",
  messagingSenderId: "732339656382",
  appId: "1:732339656382:web:2cdf50cef1438e8dd270ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Ensure auth state persists across reloads/tabs using localStorage
// This mirrors Firebase's default in most browsers but we set it explicitly
// to satisfy the requirement and to be robust across environments.
setPersistence(auth, browserLocalPersistence).catch(() => {
  // no-op: if persistence fails, Firebase will fallback to in-memory
});

type AuthResult = { user: User | null; error: string | null };

defineErrorMapper();
function defineErrorMapper() {
  // placeholder to make TS happy for function hoisting in ESM
}

function mapFirebaseAuthError(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as FirebaseError).code;
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/email-already-in-use':
        return 'This email is already in use. Try signing in instead.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is disabled for this project.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'The popup was closed before completing sign in.';
      case 'auth/cancelled-popup-request':
        return 'Cancelled previous popup request.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by the browser. Please allow popups.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

// Authentication functions


export const signInWithGoogle = async (): Promise<AuthResult> => {
  try {
    // Force the popup to open in the current window context
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    console.error('Google sign-in error:', error);
    return { user: null, error: mapFirebaseAuthError(error) };
  }
};

export const signOutUser = async (): Promise<{ error: string | null }> => {
  try {
    await signOut(auth);
    // Clear any locally stored auth-related data
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('authUser');
        window.localStorage.removeItem('userProfile');
      } catch {
        // ignore storage errors
      }
    }
    return { error: null };
  } catch (error: unknown) {
    return { error: mapFirebaseAuthError(error) };
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
