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

export function emailIsConfiguredAdmin(email: string | null | undefined) {
  return !!email && getAdminEmails().includes(email.toLowerCase());
}

export function userIsConfiguredAdmin(user: Pick<User, "email"> | null) {
  return emailIsConfiguredAdmin(user?.email);
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
  const isAdmin = userIsConfiguredAdmin(user);
  const role = isAdmin ? "admin" : "operador";

  if (!snapshot.exists()) {
    await setDoc(profileRef, {
      nome: nome || user.displayName || user.email?.split("@")[0] || "Usuário",
      email: user.email ?? "",
      role,
      approved: isAdmin,
      created_at: serverTimestamp(),
    });
    return;
  }

  const data = snapshot.data();
  const updates: Record<string, unknown> = {};
  if (data.role !== role) updates.role = role;
  if (isAdmin && data.approved !== true) updates.approved = true;
  if (!isAdmin && data.approved == null) updates.approved = false;

  if (Object.keys(updates).length > 0) {
    await updateDoc(profileRef, updates);
  }
}

export async function getCurrentUserProfile() {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  await ensureUserProfile(user);
  const snapshot = await getDoc(doc(getFirebaseDb(), "profiles", user.uid));
  const profile = snapshot.data();

  return {
    id: user.uid,
    nome: profile?.nome ?? user.email ?? "Usuário",
    email: profile?.email ?? user.email ?? "",
    isAdmin: profile?.role === "admin" || userIsConfiguredAdmin(user),
    role: profile?.role ?? "operador",
    approved: profile?.approved === true || userIsConfiguredAdmin(user),
  };
}

export type UserProfile = {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "operador";
  approved: boolean;
  created_at: string;
};

export async function fetchUserProfiles(): Promise<UserProfile[]> {
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), "profiles"), orderBy("created_at", "desc")),
  );

  return snapshot.docs.map((profileDoc) => {
    const data = profileDoc.data();
    const email = data.email ?? "";

    return {
      id: profileDoc.id,
      nome: data.nome ?? email ?? "Usuário",
      email,
      role: emailIsConfiguredAdmin(email) ? "admin" : data.role ?? "operador",
      approved: data.approved === true || emailIsConfiguredAdmin(email),
      created_at: data.created_at?.toDate?.().toISOString?.() ?? data.created_at ?? "",
    };
  });
}

export async function approveUserProfile(id: string) {
  await updateDoc(doc(getFirebaseDb(), "profiles", id), {
    approved: true,
  });
}

export async function removeUserProfile(id: string) {
  await deleteDoc(doc(getFirebaseDb(), "profiles", id));
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
