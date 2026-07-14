'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  clearOfflineProgress,
  exportOfflineProgress,
  getOfflineStorageMode,
  listCompletedCheckpointIds,
  saveCheckpointProgress,
  type OfflineProgressExport,
  type OfflineStorageMode,
} from '@/src/lib/offline-progress';

type CurriculumProgressContextValue = {
  completedCheckpointIds: ReadonlySet<string>;
  isReady: boolean;
  profileId: string;
  storageMode: OfflineStorageMode;
  isCheckpointComplete: (checkpointId: string) => boolean;
  setCheckpointComplete: (checkpointId: string, completed: boolean) => Promise<void>;
  exportProgress: () => Promise<OfflineProgressExport>;
  clearProgress: () => Promise<void>;
};

const CurriculumProgressContext = createContext<CurriculumProgressContextValue | null>(null);
const DEVICE_PROFILE_KEY = 'sectrilha-device-profile-id';

function createDeviceProfileId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `device:${crypto.randomUUID()}`;
  return `device:${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getDeviceProfileId() {
  try {
    const existing = window.localStorage.getItem(DEVICE_PROFILE_KEY);
    if (existing) return existing;
    const created = createDeviceProfileId();
    window.localStorage.setItem(DEVICE_PROFILE_KEY, created);
    return created;
  } catch {
    return createDeviceProfileId();
  }
}

/**
 * Progress is intentionally local-only. No sign-in, remote profile, analytics
 * call, or background synchronization is performed by the learning interface.
 */
export function ProgressProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [profileId, setProfileId] = useState('device:loading');
  const [completedCheckpointIds, setCompletedCheckpointIds] = useState<Set<string>>(() => new Set());
  const [storageMode, setStorageMode] = useState<OfflineStorageMode>('memory');
  const [isReady, setIsReady] = useState(false);
  const currentProfileRef = useRef(profileId);
  const pendingCheckpointChangesRef = useRef(new Map<string, boolean>());
  currentProfileRef.current = profileId;

  useEffect(() => {
    const deviceProfileId = getDeviceProfileId();
    setProfileId(deviceProfileId);
    currentProfileRef.current = deviceProfileId;

    // Never make the checklist wait on the service worker. IndexedDB normally
    // resolves immediately; this short guard also keeps the UI usable in a
    // browser where storage is blocked or slow.
    const readinessTimeout = window.setTimeout(() => setIsReady(true), 650);

    void Promise.all([
      getOfflineStorageMode(),
      listCompletedCheckpointIds(deviceProfileId),
    ]).then(([mode, completed]) => {
      setStorageMode(mode);
      setCompletedCheckpointIds((current) => {
        const next = new Set(completed);
        for (const [checkpointId, isComplete] of pendingCheckpointChangesRef.current) {
          if (isComplete) next.add(checkpointId);
          else next.delete(checkpointId);
        }
        return next;
      });
      setIsReady(true);
    }).catch(() => setIsReady(true));

    return () => window.clearTimeout(readinessTimeout);
  }, []);

  const setCheckpointComplete = useCallback(async (checkpointId: string, completed: boolean) => {
    const activeProfileId = currentProfileRef.current;
    if (!activeProfileId || activeProfileId === 'device:loading') return;

    pendingCheckpointChangesRef.current.set(checkpointId, completed);
    setCompletedCheckpointIds((previous) => {
      const next = new Set(previous);
      if (completed) next.add(checkpointId);
      else next.delete(checkpointId);
      return next;
    });

    await saveCheckpointProgress({ profileId: activeProfileId, checkpointId, completed });
  }, []);

  const exportProgress = useCallback(() => exportOfflineProgress(currentProfileRef.current), []);

  const clearProgress = useCallback(async () => {
    await clearOfflineProgress(currentProfileRef.current);
    pendingCheckpointChangesRef.current.clear();
    setCompletedCheckpointIds(new Set());
  }, []);

  const value = useMemo<CurriculumProgressContextValue>(() => ({
    completedCheckpointIds,
    isReady,
    profileId,
    storageMode,
    isCheckpointComplete: (checkpointId) => completedCheckpointIds.has(checkpointId),
    setCheckpointComplete,
    exportProgress,
    clearProgress,
  }), [clearProgress, completedCheckpointIds, exportProgress, isReady, profileId, setCheckpointComplete, storageMode]);

  return <CurriculumProgressContext.Provider value={value}>{children}</CurriculumProgressContext.Provider>;
}

export function useCurriculumProgress() {
  const context = useContext(CurriculumProgressContext);
  if (!context) throw new Error('useCurriculumProgress must be used within ProgressProvider.');
  return context;
}
