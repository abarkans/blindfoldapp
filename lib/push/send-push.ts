import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let app: App;

function getFirebaseApp(): App {
  if (app) return app;
  const existing = getApps().find((a) => a.name === "blindfold-push");
  if (existing) { app = existing; return app; }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var missing");

  const serviceAccount = JSON.parse(raw);
  app = initializeApp({ credential: cert(serviceAccount) }, "blindfold-push");
  return app;
}

export async function sendPushNotification({
  token,
  title,
  body,
  data,
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<"sent" | "invalid_token" | "failed"> {
  try {
    const messaging = getMessaging(getFirebaseApp());
    await messaging.send({
      token,
      notification: { title, body },
      android: {
        priority: "high",
        notification: { sound: "default", channelId: "dates" },
      },
      data,
    });
    return "sent";
  } catch (err: unknown) {
    const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code ?? "";
    if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
      return "invalid_token";
    }
    console.error("[push] send failed:", err);
    return "failed";
  }
}
