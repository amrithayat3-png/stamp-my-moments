import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { BatchPhoto } from "./types";

interface BatchContextValue {
  photos: BatchPhoto[];
  addPhotos: (photos: BatchPhoto[]) => void;
  removePhoto: (id: string) => void;
  clearAll: () => void;
}

const BatchContext = createContext<BatchContextValue | null>(null);

export function BatchProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<BatchPhoto[]>([]);

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

  const value = useMemo(
    () => ({ photos, addPhotos, removePhoto, clearAll }),
    [photos, addPhotos, removePhoto, clearAll],
  );

  return <BatchContext.Provider value={value}>{children}</BatchContext.Provider>;
}

export function useBatch() {
  const ctx = useContext(BatchContext);
  if (!ctx) throw new Error("useBatch must be used inside BatchProvider");
  return ctx;
}
