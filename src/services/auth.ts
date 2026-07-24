import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GithubAuthProvider, 
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import type { User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "***REMOVED***",
  authDomain: "***REMOVED_PROJECT***.firebaseapp.com",
  projectId: "***REMOVED_PROJECT***",
  storageBucket: "***REMOVED_PROJECT***.firebasestorage.app",
  messagingSenderId: "***REMOVED***",
  appId: "1:***REMOVED***:web:eef36482675f8775404c1d"
};

// Initialize Firebase only if the user has replaced the config
let app;
export let auth: ReturnType<typeof getAuth> | null = null;
export let githubProvider: GithubAuthProvider | null = null;
export let googleProvider: GoogleAuthProvider | null = null;
export let db: ReturnType<typeof getFirestore> | null = null;

try {
  if (firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    githubProvider = new GithubAuthProvider();
    googleProvider = new GoogleAuthProvider();
    db = initializeFirestore(app, {
      localCache: persistentLocalCache()
    });
  }
} catch (e) {
  console.warn("Firebase config is missing or invalid.");
}

export const loginWithGithub = async () => {
  if (!auth || !githubProvider) {
    alert("Firebase not configured. Please add your credentials in src/services/auth.ts");
    return { uid: 'demo-user', displayName: 'Demo User' } as unknown as User;
  }
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
};

export const loginWithGoogle = async () => {
  if (!auth || !googleProvider) {
    alert("Firebase not configured. Please add your credentials in src/services/auth.ts");
    return { uid: 'demo-user', displayName: 'Demo User' } as unknown as User;
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    // Demo bypass
    setTimeout(() => callback(null), 100);
    return () => {};
  }
};
