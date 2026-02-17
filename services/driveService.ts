
export interface SyncStatus {
  isSyncing: boolean;
  progress: number;
  lastSync: string | null;
  status: string;
}

export const simulateDriveSync = async (onProgress: (status: SyncStatus) => void) => {
  const steps = [
    { progress: 10, status: 'Authenticating with Google...' },
    { progress: 30, status: 'Connecting to ZenDiary Vault...' },
    { progress: 50, status: 'Scanning local memories...' },
    { progress: 80, status: 'Encrypting and uploading media...' },
    { progress: 100, status: 'Sync Complete' }
  ];

  for (const step of steps) {
    onProgress({
      isSyncing: true,
      progress: step.progress,
      lastSync: null,
      status: step.status
    });
    // Artificial delay for realism
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));
  }

  const timestamp = new Date().toLocaleString();
  localStorage.setItem('zendiary_last_sync', timestamp);
  
  onProgress({
    isSyncing: false,
    progress: 100,
    lastSync: timestamp,
    status: 'Cloud Synchronized'
  });
};
