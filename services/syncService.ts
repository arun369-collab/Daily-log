
import { getAllData, importData } from './storageService';

const SYNC_URL_KEY = 'factory_flow_sync_url';

export const getSyncUrl = (): string => {
  return localStorage.getItem(SYNC_URL_KEY) || '';
};

export const saveSyncUrl = (url: string) => {
  localStorage.setItem(SYNC_URL_KEY, url.trim());
};

// --- Cloud Sync Functions ---

// 1. PUSH: Send local data to the cloud (Google Sheet)
export const syncUp = async (): Promise<boolean> => {
  const url = getSyncUrl();
  if (!url) return false;

  const data = getAllData();

  try {
    // We use no-cors for simple fire-and-forget posting to GAS
    // Note: To make this robust, your GAS doPost should return JSON
    // and you might need CORS headers. For now, text/plain payload is safest.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain', // Simple request avoids preflight complexity in some envs
      },
      body: JSON.stringify(data),
    });
    console.log("Sync UP: Data sent to cloud");
    return true;
  } catch (error) {
    console.error("Sync UP Failed", error);
    return false;
  }
};

// 2. PULL: Fetch data from the cloud
export const syncDown = async (): Promise<boolean> => {
  const url = getSyncUrl();
  if (!url) return false;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const cloudData = await response.json();
    
    if (cloudData && (cloudData.records || cloudData.orders)) {
      console.log("Sync DOWN: Data received from cloud", cloudData);
      importData(cloudData);
      return true;
    }
  } catch (error) {
    console.error("Sync DOWN Failed", error);
  }
  return false;
};
