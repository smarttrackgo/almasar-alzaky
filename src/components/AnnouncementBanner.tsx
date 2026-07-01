import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Megaphone, X, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from "lucide-react";

type AnnouncementPlacement = "top" | "home" | "all";
type AnnouncementVariant = "bar" | "cards";

type AnnouncementBannerProps = {
  placement?: AnnouncementPlacement;
  variant?: AnnouncementVariant;
  className?: string;
  limit?: number;
};

const TYPE_STYLES: Record<string, { bar: string; card: string; badge: string; label: string }> = {
  info: {
    bar: "from-blue-700 to-blue-500",
    card: "from-blue-50 to-white border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    label: "معلومة",
  },
  warning: {
    bar: "from-amber-500 to-orange-500",
    card: "from-amber-50 to-white border-amber-100",
    badge: "bg-amber-100 text-amber-700",
    label: "تنبيه",
  },
  success: {
    bar: "from-emerald-700 to-teal-500",
    card: "from-emerald-50 to-white border-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    label: "تحديث",
  },
  promo: {
    bar: "from-purple-700 to-pink-500",
    card: "from-purple-50 to-white border-purple-100",
    badge: "bg-purple-100 text-purple-700",
    label: "عرض",
  },
};

const styleFor = (type?: string) => TYPE_STYLES[type || "info"] ?? TYPE_STYLES.info;

export default function AnnouncementBanner({
  placement = "top",
  variant = placement === "top" ? "bar" : "cards",
  className = "",
  limit,
}: AnnouncementBannerProps) {
  const announcements = useQuery(api.announcements.getActive);
  const user = useQuery(api.auth.loggedInUser);
  const [current, setCurrent] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  const visible = useMemo(() => {
    const audience = !user
      ? "public"
      : (user as any).isAdmin
        ? "admins"
        : (user as any).accountType === "office" || (user as any).isOfficeOwner
          ? "offices"
          : (user as any).accountType === "driver"
            ? "drivers"
            : "pilgrims";
    const active = (announcements ?? []).filter((ann: any) => {
      const annPlacement = ann.placement ?? "top";
      const annAudience = ann.targetAudience ?? "all";
      const placementMatches = annPlacement === "all" || annPlacement === placement;
      const audienceMatches = annAudience === "all" || annAudience === audience || (annAudience === "pilgrims" && audience === "public");
      return !dismissedIds.has(String(ann._id)) && placementMatches && audienceMatches;
    });
    return typeof limit === "number" ? active.slice(0, limit) : active;
  }, [announcements, dismissedIds, limit, placement, user]);

  if (!announcements || visible.length === 0) return null;

  if (variant === "cards") {
    return (
      <section className={`px-4 sm:px-6 lg:px-8 ${className}`} dir="rtl" aria-label="إعلانات المنصة">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((ann: any) => {
            const styles = styleFor(ann.type);
            return (
              <article
                key={ann._id}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${styles.card}`}
              >
                <button
                  type="button"
                  onClick={() => setDismissedIds((old) => new Set(old).add(String(ann._id)))}
                  className="absolute left-3 top-3 rounded-full bg-white/80 p-1.5 text-gray-500 shadow-sm transition hover:bg-white hover:text-gray-800"
                  aria-label="إخفاء الإعلان"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex gap-4">
                  {ann.imageUrl ? (
                    <img
                      src={ann.imageUrl}
                      alt=""
                      className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover shadow-sm"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-900 text-amber-300 shadow-sm">
                      <Megaphone className="h-9 w-9" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${styles.badge}`}>
                        {styles.label}
                      </span>
                      {(ann.priority ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">
                          <Sparkles className="h-3 w-3" />
                          مهم
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black leading-6 text-gray-900">{ann.title}</h3>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-gray-600">{ann.content}</p>
                    {ann.linkUrl && (
                      <a
                        href={ann.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-emerald-900"
                      >
                        {ann.ctaLabel || "اعرف أكثر"}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  const ann: any = visible[Math.min(current, visible.length - 1)];
  const styles = styleFor(ann.type);
  const total = visible.length;

  return (
    <div className={`relative bg-gradient-to-l ${styles.bar} px-3 py-2.5 text-white ${className}`} dir="rtl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3">
        <Megaphone className="h-4 w-4 flex-shrink-0 opacity-90" />

        <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-2">
          <span className="block truncate text-sm font-black">{ann.title}</span>
          <span className="hidden text-xs text-white/70 sm:block">-</span>
          <span className="block truncate text-xs text-white/90 sm:max-w-[55vw]">{ann.content}</span>
        </div>

        {ann.linkUrl && (
          <a
            href={ann.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden flex-shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/30 sm:inline-flex"
          >
            {ann.ctaLabel || "اعرف أكثر"}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {total > 1 && (
          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrent((c) => (c - 1 + total) % total)}
              className="rounded p-0.5 transition hover:bg-white/20"
              aria-label="الإعلان السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="text-xs tabular-nums opacity-80">{current + 1}/{total}</span>
            <button
              type="button"
              onClick={() => setCurrent((c) => (c + 1) % total)}
              className="rounded p-0.5 transition hover:bg-white/20"
              aria-label="الإعلان التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setDismissedIds((old) => new Set(old).add(String(ann._id)))}
          className="flex-shrink-0 rounded-full p-1 opacity-80 transition hover:bg-white/20 hover:opacity-100"
          aria-label="إغلاق الإعلان"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
