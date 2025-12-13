
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAllData, importData } from './storageService';

const FIREBASE_CONFIG_KEY = 'factory_flow_firebase_config';

// --- Configuration Management ---

export const getSyncConfig = (): string => {
  return localStorage.getItem(FIREBASE_CONFIG_KEY) || '';
};

export const saveSyncConfig = (configJson: string) => {
  localStorage.setItem(FIREBASE_CONFIG_KEY, configJson.trim());
};

export const isSyncEnabled = (): boolean => {
  return !!getSyncConfig();
};

// --- Firebase Initialization Helper ---

const getDb = () => {
  const configStr = getSyncConfig();
  if (!configStr) throw new Error("Firebase config not found");

  let config;
  try {
    // Try to parse the config. If user pasted "const firebaseConfig = { ... }", we clean it up.
    const cleanStr = configStr.replace(/const\s+\w+\s*=\s*/, '').replace(/;$/, '');
    config = JSON.parse(cleanStr);
  } catch (e) {
    console.error("Invalid JSON config", e);
    throw new Error("Invalid Firebase Configuration Format");
  }

  // Avoid initializing multiple times
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  return getFirestore(app);
};

// --- Cloud Sync Functions ---

// 1. PUSH: Send local data to Firebase Firestore
export const syncUp = async (): Promise<boolean> => {
  if (!isSyncEnabled()) return false;

  try {
    const db = getDb();
    const data = getAllData();
    
    // We store everything in a single document 'factory/backup' for simplicity
    // Ideally, we would split collections, but this keeps the 'dump/restore' logic intact
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
  if (!isSyncEnabled()) return false;

  try {
    const db = getDb();
    const docRef = doc(db, "factory", "backup");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const cloudData = docSnap.data();
      console.log("Sync DOWN: Data received from Firebase");
      importData(cloudData);
      return true;
    } else {
      console.log("No backup found on cloud yet.");
      return true; // Connection worked, just no data
    }
  } catch (error) {
    console.error("Sync DOWN Failed", error);
    return false;
  }
};
