import { Page } from "../App";
import { Tv, Radio, ChevronRight } from "lucide-react";

export default function HaramainLivePage({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-emerald-900" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <button
          onClick={() => navigate({ name: "home" })}
          className="flex items-center gap-2 text-emerald-300 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          العودة للرئيسية
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-emerald-700/50 rounded-2xl flex items-center justify-center border border-emerald-600/40">
            <Tv className="w-7 h-7 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">بث الحرمين المباشر</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-emerald-300 text-sm">بث مباشر الآن</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <Radio className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-bold text-lg">قناة مكة المكرمة</h2>
            <span className="ms-auto flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="p-4">
            <div style={{position:"relative",width:"100%",paddingBottom:"56.25%",height:0,overflow:"hidden",borderRadius:"12px"}}>
              <iframe style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:0}} src="https://www.youtube.com/embed/live_stream?channel=UCos52azQNBgW63_9uDJoPDA" title="بث مباشر — الحرم المكي" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen></iframe>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <Radio className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-bold text-lg">قناة المدينة المنورة</h2>
            <span className="ms-auto flex items-center gap-1.5 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "0 0 12px 12px" }}>
            <iframe
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
              src="https://www.youtube.com/embed/live_stream?channel=UCROKYPep-UuODNwyipe6JMw"
              title="بث مباشر — المدينة المنورة"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
          <p className="text-amber-300 text-sm">
            🕌 البث المباشر من قناة القرآن الكريم الرسمية — التلفزيون السعودي
          </p>
          <p className="text-amber-400/60 text-xs mt-1">
            قد يتطلب البث اتصالاً جيداً بالإنترنت
          </p>
        </div>
      </div>
    </div>
  );
}
