
export interface SyncStatus {
  isSyncing: boolean;
  progress: number;
  lastSync: string | null;
  status: string;
  hasConflict?: boolean;
  conflictDetails?: {
    fileName: string;
    localDate: string;
    cloudDate: string;
  };
}

export const simulateDriveSync = async (
  onProgress: (status: SyncStatus) => void,
  shouldFailWithConflict: boolean = false
) => {
  const steps = [
    { progress: 5, status: 'Checking connection...' },
    { progress: 15, status: 'Authenticating with Google Drive API...' },
    { progress: 25, status: 'Listing files in "ZenDiary_Vault"...' },
    { progress: 40, status: 'Scanning 14 local memory files...' },
    { progress: 55, status: 'Comparing local and cloud versions...' },
  ];

  let currentSyncStatus: SyncStatus = {
    isSyncing: true,
    progress: 0,
    lastSync: localStorage.getItem('zendiary_last_sync'),
    status: 'Initializing...'
  };

  for (const step of steps) {
    currentSyncStatus = { ...currentSyncStatus, ...step };
    onProgress(currentSyncStatus);
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
  }

  if (shouldFailWithConflict) {
    onProgress({
      ...currentSyncStatus,
      isSyncing: false,
      status: 'Conflict Detected',
      hasConflict: true,
      conflictDetails: {
        fileName: 'Journal_2024_05_20.json',
        localDate: new Date().toLocaleString(),
        cloudDate: new Date(Date.now() - 3600000).toLocaleString()
      }
    });
    return;
  }

  // File-by-file upload simulation
  const totalFiles = 8;
  for (let i = 1; i <= totalFiles; i++) {
    const fileProgress = 55 + (i / totalFiles) * 45;
    onProgress({
      ...currentSyncStatus,
      progress: fileProgress,
      status: `Uploading memory ${i} of ${totalFiles}...`
    });
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  const timestamp = new Date().toLocaleString();
  localStorage.setItem('zendiary_last_sync', timestamp);
  
  onProgress({
    isSyncing: false,
    progress: 100,
    lastSync: timestamp,
    status: 'Cloud Synchronized',
    hasConflict: false
  });
};
