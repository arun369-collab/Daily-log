
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAllData, importData } from './storageService';

// Firebase Configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyAsCS81wTTrCu7HSkcx_vGf-L6GpIqrlMQ",
  authDomain: "factoryflow-db497.firebaseapp.com",
  projectId: "factoryflow-db497",
  storageBucket: "factoryflow-db497.firebasestorage.app",
  messagingSenderId: "669334174974",
  appId: "1:669334174974:web:e26bbcec6cb0181073b9af",
  measurementId: "G-L0F8ZSKX3E"
};

// Initialize Firebase
// We check getApps() to avoid double initialization during hot-reloads
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to expose project ID to Settings UI
export const getProjectId = () => firebaseConfig.projectId;

export const isSyncEnabled = (): boolean => {
  return true;
};

// --- Cloud Sync Functions ---

// 1. PUSH: Send local data to Firebase Firestore
export const syncUp = async (): Promise<boolean> => {
  try {
    const data = getAllData();
    
    // We store everything in a single document 'factory/backup' for simplicity
    await setDoc(doc(db, "factory", "backup"), data);
    
    console.log("Sync UP: Data sent to Firebase");
    return true;
  } catch (error) {
    console.error("Sync UP Failed", error);
    return false;
  }
};

// 2. PULL: Fetch data from Firebase Firestore
export const syncDown = async (): Promise<boolean> => {
  try {
    const docRef = doc(db, "factory", "backup");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const cloudData = docSnap.data();
      console.log("Sync DOWN: Data received from Firebase");
      importData(cloudData);
      return true;
    } else {
      console.log("No backup found on cloud yet.");
      // It's a successful connection, just empty data
      return true;
    }
  } catch (error) {
    console.error("Sync DOWN Failed", error);
    return false;
  }
};
