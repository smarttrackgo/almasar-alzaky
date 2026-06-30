import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Megaphone, X, ChevronLeft, ChevronRight } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  info:    "from-blue-600 to-blue-500",
  warning: "from-amber-500 to-orange-500",
  success: "from-emerald-600 to-teal-500",
  promo:   "from-purple-600 to-pink-500",
};

export default function AnnouncementBanner() {
  const announcements = useQuery(api.announcements.getActive);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !announcements || announcements.length === 0) return null;

  const ann = announcements[current];
  const gradient = TYPE_COLORS[ann.type] ?? TYPE_COLORS.info;
  const total = announcements.length;

  return (
    <div className={`bg-gradient-to-l ${gradient} text-white py-2.5 px-4 relative`}>
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <Megaphone className="w-4 h-4 flex-shrink-0 opacity-90" />

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="font-bold text-sm flex-shrink-0">{ann.title}</span>
          <span className="text-white/80 text-xs hidden sm:block">—</span>
          <span className="text-white/90 text-xs truncate hidden sm:block">{ann.content}</span>
        </div>

        {ann.linkUrl && (
          <a
            href={ann.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full transition-colors"
          >
            اعرف أكثر
          </a>
        )}

        {total > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setCurrent((c) => (c - 1 + total) % total)}
              className="p-0.5 rounded hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs opacity-75">{current + 1}/{total}</span>
            <button
              onClick={() => setCurrent((c) => (c + 1) % total)}
              className="p-0.5 rounded hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors opacity-75 hover:opacity-100"
          aria-label="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
