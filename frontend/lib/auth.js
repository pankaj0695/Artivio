import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { getAdditionalUserInfo } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const googleProvider = new GoogleAuthProvider();

const hasPasswordProvider = (user) =>
  Array.isArray(user?.providerData) &&
  user.providerData.some((p) => p.providerId === "password");

const providerIds = (user) =>
  (user?.providerData || []).map((p) => p.providerId);

/**
 * Ensure a Firestore user document exists
 */
export async function ensureUserDocument(user, extra = {}) {
  if (!user?.uid) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const providers = Array.from(
    new Set([...(user.providerData || []).map(p => p.providerId)])
  );

  const base = {
    uid: user.uid,
    email: user.email ?? extra.email ?? null,
    displayName: user.displayName ?? extra.displayName ?? "",
    photoURL: user.photoURL ?? extra.photoURL ?? null,
    providers,
    needsPassword: !!(user && !providers.includes("password")),
    updatedAt: serverTimestamp(),
  };

  const payload = snap.exists()
    ? base
    : { ...base, createdAt: serverTimestamp() };

  await setDoc(ref, payload, { merge: true });
}


/**
 * Email/password signup
 */
export const signUpWithEmail = async (email, password, userData) => {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);

    if (methods.length > 0) {
      return {
        user: null,
        error: "This email is already in use. Please sign in instead.",
      };
    }

    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await ensureUserDocument(cred.user, userData);
    return { user: cred.user, error: null };
  } catch (e) {
    return { user: null, error: e.message || "Sign-up failed" };
  }
};
/**
 * Email/password sign-in
 */
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// /**
//  * Google sign-in
//  * - Works if user already exists with email/password
//  * - Only asks to set password if truly new Google user
//  */
// /**
//  * Google sign-in safely
//  * - Works if user already exists with email/password
//  * - Only asks to set password if truly new Google user
//  */
// export const signInWithGoogle = async () => {
//   const provider = new GoogleAuthProvider();
//   provider.setCustomParameters({ prompt: "select_account" });

//   try {
//     const res = await signInWithPopup(auth, provider);
//     const email = res.user.email?.toLowerCase();

//     const methods = await fetchSignInMethodsForEmail(auth, email);

//     // If email exists with any method, prevent creating a new account
//     if (methods.length > 0 && !methods.includes("google.com")) {
//       return { user: null, error: "This email is already in use. Please sign in instead." };
//     }

//     await ensureUserDocument(res.user);

//     const info = getAdditionalUserInfo(res);
//     const isNewUser = !!info?.isNewUser;

//     return { user: res.user, isNewUser, needsPassword: isNewUser };
//   } catch (err) {
//     if (err.code === "auth/account-exists-with-different-credential") {
//       return { user: null, error: "This email is already in use with another sign-in method." };
//     }
//     return { user: null, error: err.message };
//   }
// };
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const res = await signInWithPopup(auth, provider);
    const email = res.user.email?.toLowerCase();
    const methods = await fetchSignInMethodsForEmail(auth, email);

    // Case 1: Email exists with password but not Google → link Google
    if (methods.includes("password") && !methods.includes("google.com")) {
      await linkWithCredential(
        auth.currentUser || (await signInWithEmailPrompt(email)),
        GoogleAuthProvider.credentialFromResult(res)
      );
    }

    // Case 2: Email exists with Google already → do nothing
    // Case 3: Truly new user → create user doc
    await ensureUserDocument(res.user);

    // Get updated provider list
    const updatedUser = auth.currentUser || res.user;
    const isNewUser = methods.length === 0;

    return { user: updatedUser, isNewUser, needsPassword: false };
  } catch (err) {
    if (err.code === "auth/account-exists-with-different-credential") {
      return { user: null, error: "This email is already in use with another sign-in method." };
    }
    return { user: null, error: err.message };
  }
};

// Helper: prompt user for password to link
const signInWithEmailPrompt = async (email) => {
  const password = prompt("Enter your password to link Google account:");
  const result = await signInWithEmail(email, password);
  if (!result.user) throw new Error("Incorrect password, cannot link account");
  return result.user;
};



/**
 * Link password to existing Google account
 */
export const linkPasswordToCurrentUser = async (password) => {
  const user = auth.currentUser;
  if (!user) throw new Error("NOT_AUTHENTICATED");
  if (!user.email) throw new Error("NO_EMAIL_ON_ACCOUNT");

  const credential = EmailAuthProvider.credential(user.email, password);
  const res = await linkWithCredential(user, credential);
  await ensureUserDocument(res.user);
  return { user: res.user };
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

/**
 * Get Firestore user profile
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

/**
 * Create or update user profile in Firestore
 */
export const createOrUpdateUserProfile = async (uid, data) => {
  try {
    if (!uid) throw new Error("Missing UID");
    const ref = doc(db, "users", uid);

    await setDoc(
      ref,
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );

    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};
