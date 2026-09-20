/**
 * Gallery permission helpers.
 *
 * On the web there is no permission model — the file picker itself is the grant.
 * Inside the Capacitor shell we talk to the Camera plugin through the global
 * bridge so the web build never needs the native package installed.
 */

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  Plugins?: Record<string, any>;
}

function bridge(): CapacitorBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as any).Capacitor as CapacitorBridge | undefined;
}

export function isNativeShell(): boolean {
  return Boolean(bridge()?.isNativePlatform?.());
}

export async function checkGalleryPermission(): Promise<PermissionState> {
  const camera = bridge()?.Plugins?.Camera;
  if (!camera?.checkPermissions) return "unsupported";
  try {
    const result = await camera.checkPermissions();
    return (result?.photos ?? "prompt") as PermissionState;
  } catch {
    return "prompt";
  }
}

export async function requestGalleryPermission(): Promise<PermissionState> {
  const camera = bridge()?.Plugins?.Camera;
  if (!camera?.requestPermissions) return "unsupported";
  try {
    const result = await camera.requestPermissions({ permissions: ["photos"] });
    return (result?.photos ?? "denied") as PermissionState;
  } catch {
    return "denied";
  }
}
