import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type Auth,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

function readFirebaseConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const missing = getMissingFirebaseConfig(config);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variable(s): ${missing.join(", ")}.`,
    );
  }

  return config;
}

export function getMissingFirebaseConfig(config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}) {
  return Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

export function isFirebaseConfigured() {
  return getMissingFirebaseConfig().length === 0;
}

function getFirebaseApp() {
  if (!app) app = initializeApp(readFirebaseConfig());
  return app;
}

export function getFirebaseAuth() {
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getFirebaseDb() {
  if (!dbInstance) dbInstance = getFirestore(getFirebaseApp());
  return dbInstance;
}

export function getAdminEmails() {
  return (import.meta.env.VITE_FIREBASE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function userIsConfiguredAdmin(user: Pick<User, "email"> | null) {
  return !!user?.email && getAdminEmails().includes(user.email.toLowerCase());
}

export async function signInAdmin(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function createAdminAccount(params: {
  email: string;
  password: string;
  nome: string;
}) {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    params.email,
    params.password,
  );
  await ensureUserProfile(credential.user, params.nome);
  return credential;
}

export async function ensureUserProfile(user: User, nome?: string) {
  const profileRef = doc(getFirebaseDb(), "profiles", user.uid);
  const snapshot = await getDoc(profileRef);
  const role = userIsConfiguredAdmin(user) ? "admin" : "operador";

  if (!snapshot.exists()) {
    await setDoc(profileRef, {
      nome: nome || user.displayName || user.email?.split("@")[0] || "Usuário",
      email: user.email ?? "",
      role,
      created_at: serverTimestamp(),
    });
    return;
  }

  if (snapshot.data().role !== role) {
    await updateDoc(profileRef, { role });
  }
}

export async function getCurrentUserProfile() {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  await ensureUserProfile(user);
  const snapshot = await getDoc(doc(getFirebaseDb(), "profiles", user.uid));
  const profile = snapshot.data();

  return {
    nome: profile?.nome ?? user.email ?? "Usuário",
    email: profile?.email ?? user.email ?? "",
    isAdmin: profile?.role === "admin" || userIsConfiguredAdmin(user),
  };
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email, {
    url: `${window.location.origin}/auth`,
  });
}

export async function updateCurrentUserPassword(password: string) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Faça login novamente para alterar a senha.");
  await updatePassword(user, password);
}

export async function logout() {
  await signOut(getFirebaseAuth());
}

export {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
};
