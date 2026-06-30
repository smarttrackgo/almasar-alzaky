import { Headphones } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";

export default function FloatingSupportBtn({ navigate }: { navigate: (p: Page) => void }) {
  const chat = useQuery(api.support.getMyChat);
  const unread = chat?.unreadByUser ?? 0;

  return (
    <button
      onClick={() => navigate({ name: "support" })}
      title="تواصل مع الإدارة"
      className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl hover:shadow-blue-300/50 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group"
    >
      <Headphones className="w-6 h-6 group-hover:scale-110 transition-transform" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-bounce">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
      <span className="absolute -top-10 right-1/2 translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        تواصل مع الإدارة
      </span>
    </button>
  );
}
