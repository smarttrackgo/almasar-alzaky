/* ══════════════════════════════════════════════════════════════════
   usePushNotifications — Hook مخصص للإشعارات المنبثقة
   يعمل على الجوال والكمبيوتر حتى لو الشاشة مغلقة
   ══════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from "react";

export type PushNotifType =
  | "driver_assigned"
  | "driver_accepted"
  | "trip_started"
  | "location_update"
  | "trip_completed"
  | "booking_confirmed"
  | "general";

export interface PushNotifPayload {
  type:                PushNotifType;
  title?:              string;
  body:                string;
  url?:                string;
  tag?:                string;
  silent?:             boolean;
  requireInteraction?: boolean;
}

// ── نصوص الإشعارات الافتراضية ──
const DEFAULT_TITLES: Record<PushNotifType, string> = {
  driver_assigned:   "🚌 تم تعيين سائقك!",
  driver_accepted:   "✅ السائق قبل الرحلة!",
  trip_started:      "🚀 انطلقت رحلتك!",
  location_update:   "📍 تحديث موقع الحافلة",
  trip_completed:    "🏁 وصلتم بسلامة!",
  booking_confirmed: "✅ تم تأكيد حجزك!",
  general:           "🔔 المسار الذكي",
};

const APP_ICON = "https://polished-pony-114.convex.cloud/api/storage/bdcd34f5-1db8-4d00-ac98-2ea9329effad";

// ── إرسال إشعار عبر Service Worker (يعمل حتى لو الشاشة مغلقة) ──
async function sendToSW(payload: PushNotifPayload & { title: string }): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg?.active) {
      reg.active.postMessage({ type: "SHOW_NOTIFICATION", payload });
    }
  } catch { /* نتجاهل */ }
}

// ── إشعار مباشر (Notification API) — fallback ──
function showDirectNotification(payload: PushNotifPayload): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title = payload.title || DEFAULT_TITLES[payload.type] || "المسار الذكي";
  const notif = new Notification(title, {
    body:               payload.body,
    icon:               APP_ICON,
    badge:              APP_ICON,
    tag:                payload.tag || payload.type,
    dir:                "rtl",
    lang:               "ar",
    silent:             payload.silent ?? false,
    requireInteraction: payload.requireInteraction ?? false,
  });
  notif.onclick = () => {
    window.focus();
    if (payload.url) window.location.href = payload.url;
    notif.close();
  };
}

// ── Hook الرئيسي ──
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!("Notification" in window)) return "denied";
    return Notification.permission;
  });
  const [swReady, setSwReady] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const promptShownRef = useRef(false);

  // ── تسجيل Service Worker ──
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then(() => setSwReady(true))
      .catch(() => {});

    // استقبال رسائل NAVIGATE من SW
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE" && event.data.url) {
        window.location.href = event.data.url;
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  // ── طلب الإذن ──
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") { setPermission("granted"); return true; }
    if (Notification.permission === "denied")  { setPermission("denied");  return false; }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  // ── إرسال إشعار ──
  const notify = useCallback(async (payload: PushNotifPayload): Promise<void> => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const fullPayload = { ...payload, title: payload.title || DEFAULT_TITLES[payload.type] };

    if (swReady) {
      await sendToSW(fullPayload);
    } else {
      showDirectNotification(payload);
    }
  }, [swReady]);

  // ── عرض نافذة طلب الإذن ──
  const promptForPermission = useCallback(() => {
    if (promptShownRef.current) return;
    if (Notification.permission !== "default") return;
    const dismissed = localStorage.getItem("push-prompt-dismissed");
    if (dismissed) return;
    promptShownRef.current = true;
    setShowPrompt(true);
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    try { localStorage.setItem("push-prompt-dismissed", "1"); } catch {}
  }, []);

  return {
    permission,
    swReady,
    showPrompt,
    notify,
    requestPermission,
    promptForPermission,
    dismissPrompt,
    isGranted: permission === "granted",
    isDenied:  permission === "denied",
    isDefault: permission === "default",
  };
}
