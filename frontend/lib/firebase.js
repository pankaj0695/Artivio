import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAsBdcvNqgzMgc1p__2Vmyds4wfAy2T6X8",
  authDomain: "artivio-47c0e.firebaseapp.com",
  projectId: "artivio-47c0e",
  storageBucket: "artivio-47c0e.firebasestorage.app",
  messagingSenderId: "704320528954",
  appId: "1:704320528954:web:f1675d26675ef022fb8b03",
  measurementId: "G-XRWTX05GQ5",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
