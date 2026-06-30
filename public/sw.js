/* ============================================================
   Service Worker — المسار الذكي لحجز العمرة
   v2.0 — يدعم الإشعارات المنبثقة الكاملة
   ============================================================ */

const CACHE_NAME    = "almasar-v2";
const STATIC_CACHE  = "almasar-static-v2";
const API_CACHE     = "almasar-api-v2";
const APP_ICON      = "https://polished-pony-114.convex.cloud/api/storage/bdcd34f5-1db8-4d00-ac98-2ea9329effad";

/* الأصول التي تُخزَّن فور تثبيت الـ SW */
const PRECACHE_URLS = ["/", "/index.html"];

/* ── Install ── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: حذف الكاشات القديمة ── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: استراتيجية ذكية ── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    url.protocol === "chrome-extension:" ||
    url.hostname.includes("convex.cloud") ||
    url.hostname.includes("convex.site") ||
    request.method !== "GET"
  ) return;

  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/");
        })
    );
    return;
  }
});

/* ══════════════════════════════════════════════════════════════
   🔔 نظام الإشعارات المنبثقة الكامل
   ══════════════════════════════════════════════════════════════ */

/* خريطة أنواع الإشعارات مع أيقوناتها وألوانها */
const NOTIFICATION_TYPES = {
  driver_assigned: {
    title: "🚌 تم تعيين سائقك!",
    icon: APP_ICON,
    badge: APP_ICON,
    vibrate: [200, 100, 200],
    tag: "trip-driver",
  },
  driver_accepted: {
    title: "✅ السائق قبل الرحلة!",
    icon: APP_ICON,
    badge: APP_ICON,
    vibrate: [200, 100, 200],
    tag: "trip-driver",
  },
  trip_started: {
    title: "🚀 انطلقت رحلتك!",
    icon: APP_ICON,
    badge: APP_ICON,
    vibrate: [300, 100, 300, 100, 300],
    tag: "trip-status",
  },
  location_update: {
    title: "📍 تحديث موقع الحافلة",
    icon: APP_ICON,
    badge: APP_ICON,
    vibrate: [100],
    tag: "trip-location",
    silent: false,
  },
  trip_completed: {
    title: "🏁 وصلتم بسلامة!",
    icon: APP_ICON,
    badge: APP_ICON,
    vibrate: [200, 100, 200, 100, 400],
    tag: "trip-status",
  },
  booking_confirmed: {
    title: "✅ تم تأكيد حجزك!",
    icon: APP_ICON,
    badge: APP_ICON,
    vibrate: [200, 100, 200],
    tag: "booking",
  },
  general: {
    title: "🔔 المسار الذكي",
    icon: APP_ICON,
    badge: APP_ICON,
    vibrate: [150],
    tag: "general",
  },
};

/* ── استقبال رسائل من الصفحة الرئيسية ── */
self.addEventListener("message", (event) => {
  if (!event.data) return;
  const { type, payload } = event.data;

  if (type === "SHOW_NOTIFICATION") {
    const notifType = NOTIFICATION_TYPES[payload.type] || NOTIFICATION_TYPES.general;
    const options = {
      body:    payload.body    || "",
      icon:    notifType.icon,
      badge:   notifType.badge,
      vibrate: notifType.vibrate,
      tag:     payload.tag    || notifType.tag,
      dir:     "rtl",
      lang:    "ar",
      silent:  payload.silent ?? false,
      requireInteraction: payload.requireInteraction ?? false,
      data: {
        url:  payload.url  || "/",
        type: payload.type || "general",
      },
      actions: payload.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(
        payload.title || notifType.title,
        options
      )
    );
  }

  /* إلغاء إشعار بـ tag معين */
  if (type === "CLOSE_NOTIFICATION") {
    event.waitUntil(
      self.registration.getNotifications({ tag: payload.tag })
        .then((notifs) => notifs.forEach((n) => n.close()))
    );
  }
});

/* ── Push من الخادم (للمستقبل مع VAPID) ── */
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: "المسار الذكي", body: event.data.text() }; }

  const notifType = NOTIFICATION_TYPES[data.type] || NOTIFICATION_TYPES.general;
  event.waitUntil(
    self.registration.showNotification(data.title || notifType.title, {
      body:    data.body    || "",
      icon:    notifType.icon,
      badge:   notifType.badge,
      vibrate: notifType.vibrate,
      tag:     data.tag    || notifType.tag,
      dir:     "rtl",
      lang:    "ar",
      data:    { url: data.url || "/" },
    })
  );
});

/* ── النقر على الإشعار ── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        /* إذا كان التطبيق مفتوحاً — ركّز عليه وانتقل للصفحة */
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.postMessage({ type: "NAVIGATE", url: targetUrl });
            return;
          }
        }
        /* إذا كان مغلقاً — افتح نافذة جديدة */
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

/* ── إغلاق الإشعار ── */
self.addEventListener("notificationclose", (event) => {
  /* يمكن تتبع الإشعارات المُغلقة هنا مستقبلاً */
});
