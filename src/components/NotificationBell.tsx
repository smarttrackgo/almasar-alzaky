import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bell, CheckCheck, CalendarCheck, Info, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Page } from "../App";
import { Id } from "../../convex/_generated/dataModel";

const TYPE_ICON: Record<string, React.ElementType> = {
  booking:           CalendarCheck,
  booking_confirmed: CalendarCheck,
  booking_created:   CalendarCheck,
  quran:             BookOpen,
  info:              Info,
};

export default function NotificationBell({ navigate }: { navigate: (p: Page) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const notifications = useQuery(api.notifications.getMyNotifications);
  const unreadCount   = useQuery(api.notifications.getUnreadCount);
  const markAllRead   = useMutation(api.notifications.markAllRead);
  const markRead      = useMutation(api.notifications.markRead);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAll = async () => {
    try { await markAllRead(); } catch { toast.error("حدث خطأ"); }
  };

  const handleMarkOne = async (id: any) => {
    try { await markRead({ notificationId: id }); } catch { /* silent */ }
  };

  const handleNotificationClick = async (n: {
    _id: any;
    type: string;
    linkId?: string;
    isRead?: boolean;
  }) => {
    // علّم كمقروء أولاً
    if (!n.isRead) await handleMarkOne(n._id);
    setOpen(false);

    // انتقل إلى صفحة التذكرة إذا كان الإشعار مرتبطاً بحجز
    if (
      n.linkId &&
      (n.type === "booking" ||
        n.type === "booking_confirmed" ||
        n.type === "booking_created" ||
        n.type.includes("booking"))
    ) {
      navigate({ name: "booking-detail", bookingId: n.linkId as Id<"bookings"> });
    }
  };

  const count = unreadCount ?? 0;

  return (
    <div className="relative z-[1100]" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 transition-colors"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute start-0 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-l from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-gray-800 text-sm">الإشعارات</span>
              {count > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{count} جديد</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-semibold px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> قراءة الكل
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                return (
                  <button
                    key={n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-right flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      !n.isRead ? "bg-emerald-50/50" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      !n.isRead ? "bg-emerald-100" : "bg-gray-100"
                    }`}>
                      <Icon className={`w-4 h-4 ${!n.isRead ? "text-emerald-600" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${!n.isRead ? "text-gray-800" : "text-gray-500"}`}>
                        {n.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</div>
                      <div className="text-[10px] text-gray-300 mt-1">
                        {new Date(n._creationTime).toLocaleDateString("ar-SA", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    </div>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
