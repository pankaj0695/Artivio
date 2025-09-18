import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const signUpWithEmail = async (email, password, userData) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Create user profile in Firestore
    await setDoc(doc(db, "users", result.user.uid), {
      name: userData.name,
      email: userData.email,
      role: userData.role || 'customer',
      addresses: [],  // Initialize with empty addresses
      createdAt: new Date(),
    });

    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const uid = result.user.uid;
    const userDoc = await getDoc(doc(db, "users", uid));
    const isNewUser = !userDoc.exists();
    // Do not create the profile here; caller will prompt for role and save.
    return { user: result.user, isNewUser, error: null };
  } catch (error) {
    return { user: null, isNewUser: false, error: error.message };
  }
};

export const createOrUpdateUserProfile = async (uid, data) => {
  try {
    await setDoc(
      doc(db, "users", uid),
      { ...data, updatedAt: new Date() },
      { merge: true }
    );
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};
