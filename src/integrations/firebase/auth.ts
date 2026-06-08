import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./client";

export function waitForFirebaseUser(): Promise<User | null> {
  if (!isFirebaseConfigured()) return Promise.resolve(null);
  const auth = getFirebaseAuth();

  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = () => {};
    let timeout: number | undefined;
    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      if (timeout) window.clearTimeout(timeout);
      resolve(user);
    };
    unsubscribe = onAuthStateChanged(auth, (user) => {
      finish(user);
    });
    timeout = window.setTimeout(() => finish(auth.currentUser), 3000);
  });
}
