import { getStreamToken } from "./api";

type Role = "viewer" | "host";

export interface StreamJoinInfo {
  token: string;
  roomId: string;
  role: Role;
  userId: string;
}

/**
 * Fetch a 100ms-compatible app token from the backend.
 * The actual SDK join should use this token with HMS SDK on the client.
 */
export async function fetchStreamToken(
  roomId: string,
  role: Role,
  displayName?: string
): Promise<StreamJoinInfo> {
  return getStreamToken({ roomId, role, displayName });
}

/**
 * Attempt to join a 100ms room with the fetched token.
 * This uses a dynamic import so the app still builds if the SDK is not installed.
 */
export async function joinHmsRoom(token: string, userName: string) {
  try {
    const mod: any = await import("@100mslive/hms-video");
    const HMSClient = mod.HMSClient || mod.HMSWebrtc || mod.default;
    if (!HMSClient) throw new Error("HMS SDK missing HMSClient export");
    const client = new HMSClient();
    await client.join({
      authToken: token,
      userName,
      settings: {
        isAudioMuted: false,
        isVideoMuted: false,
      },
    });
    return client;
  } catch (err) {
    console.warn("joinHmsRoom failed (install @100mslive/hms-video?)", err);
    throw err;
  }
}

/**
 * Simple local stream helper for host preview (camera/mic).
 * Replace with HMS/Agora publishing when SDK is wired.
 */
export async function startLocalPreview(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}
