"use client";

import { useEffect } from "react";

export function usePushNotifications() {
  useEffect(() => {
    if (!(window as any).Capacitor) return;

    let cancelled = false;

    async function register() {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Request permission
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") return;

        await PushNotifications.register();

        // Handle token received
        const tokenListener = await PushNotifications.addListener("registration", async (token) => {
          if (cancelled) return;
          try {
            await fetch("/api/push/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: token.value }),
            });
          } catch (e) {
            console.error("[push] register token failed:", e);
          }
        });

        // Handle notification tap while app is in background/killed
        const actionListener = await PushNotifications.addListener("pushNotificationActionPerformed", () => {
          if (cancelled) return;
          window.location.href = "/dashboard";
        });

        return () => {
          cancelled = true;
          tokenListener.remove();
          actionListener.remove();
        };
      } catch (e) {
        console.error("[push] init failed:", e);
      }
    }

    const cleanupPromise = register();
    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
