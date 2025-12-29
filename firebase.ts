
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHjF6dE0Gaa0x3rGlqYB9MFGdEvO9-dkI",
  authDomain: "matellicongelados.firebaseapp.com",
  projectId: "matellicongelados",
  storageBucket: "matellicongelados.firebasestorage.app",
  messagingSenderId: "699548334518",
  appId: "1:699548334518:web:3925e0b2b76221e459e917",
  measurementId: "G-KTXSLES7W6"
};

// Singleton para evitar múltiplas inicializações em ambiente de desenvolvimento
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
