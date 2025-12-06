import { ProductionRecord } from '../types';

const SYNC_URL_KEY = 'factory_flow_sync_url';

export const getSyncUrl = (): string => {
  return localStorage.getItem(SYNC_URL_KEY) || '';
};

export const saveSyncUrl = (url: string) => {
  localStorage.setItem(SYNC_URL_KEY, url.trim());
};

export const syncToGoogleSheet = async (record: ProductionRecord) => {
  const url = getSyncUrl();
  if (!url) return;

  try {
    // We use no-cors mode because Google Apps Script Web Apps don't return standard CORS headers
    // for simple POST requests in this context. 
    // This means we won't get a readable response, but the data will arrive.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    console.log("Sync request sent to Google Sheet");
  } catch (error) {
    console.error("Failed to sync to Google Sheet", error);
  }
};