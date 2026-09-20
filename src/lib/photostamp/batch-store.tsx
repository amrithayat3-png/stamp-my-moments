import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_STAMP, type BatchPhoto, type StampSettings } from "./types";

interface BatchContextValue {
  photos: BatchPhoto[];
  settings: StampSettings;
  addPhotos: (photos: BatchPhoto[]) => void;
  removePhoto: (id: string) => void;
  clearAll: () => void;
  setCaptureDate: (id: string, value: string) => void;
  updateSettings: (patch: Partial<StampSettings>) => void;
  setOverride: (id: string, patch: Partial<StampSettings> | null) => void;
  /** Batch settings merged with any per-photo override. */
  settingsFor: (photo: BatchPhoto) => StampSettings;
  missingDateCount: number;
}

const BatchContext = createContext<BatchContextValue | null>(null);

export function BatchProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<BatchPhoto[]>([]);
  const [settings, setSettings] = useState<StampSettings>(DEFAULT_STAMP);

  const addPhotos = useCallback((incoming: BatchPhoto[]) => {
    if (incoming.length === 0) return;
    setPhotos((current) => [...current, ...incoming]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((current) => {
      const target = current.find((p) => p.id === id);
      if (target?.url.startsWith("blob:")) URL.revokeObjectURL(target.url);
      return current.filter((p) => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setPhotos((current) => {
      current.forEach((p) => {
        if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
      });
      return [];
    });
  }, []);

  const setCaptureDate = useCallback((id: string, value: string) => {
    setPhotos((current) =>
      current.map((p) =>
        p.id === id
          ? { ...p, captureDate: value, dateSource: "manual" as const, status: "ready" as const }
          : p,
      ),
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<StampSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const setOverride = useCallback((id: string, patch: Partial<StampSettings> | null) => {
    setPhotos((current) =>
      current.map((p) =>
        p.id === id
          ? { ...p, override: patch === null ? null : { ...(p.override ?? {}), ...patch } }
          : p,
      ),
    );
  }, []);

  const settingsFor = useCallback(
    (photo: BatchPhoto): StampSettings => ({ ...settings, ...(photo.override ?? {}) }),
    [settings],
  );

  const missingDateCount = photos.filter((p) => !p.captureDate).length;

  const value = useMemo(
    () => ({
      photos,
      settings,
      addPhotos,
      removePhoto,
      clearAll,
      setCaptureDate,
      updateSettings,
      setOverride,
      settingsFor,
      missingDateCount,
    }),
    [
      photos,
      settings,
      addPhotos,
      removePhoto,
      clearAll,
      setCaptureDate,
      updateSettings,
      setOverride,
      settingsFor,
      missingDateCount,
    ],
  );

  return <BatchContext.Provider value={value}>{children}</BatchContext.Provider>;
}

export function useBatch() {
  const ctx = useContext(BatchContext);
  if (!ctx) throw new Error("useBatch must be used inside BatchProvider");
  return ctx;
}
