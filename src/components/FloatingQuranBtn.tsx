import { BookOpen } from "lucide-react";
import { Page } from "../App";

export default function FloatingQuranBtn({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <button
      onClick={() => navigate({ name: "quran" })}
      title="القرآن الكريم"
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl hover:shadow-emerald-300/50 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group"
    >
      <BookOpen className="w-6 h-6 group-hover:rotate-6 transition-transform" />
      <span className="absolute -top-10 right-1/2 translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        القرآن الكريم
      </span>
    </button>
  );
}
