import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const DEFAULT_LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";
const DEFAULT_VIDEO = "https://videos.pexels.com/video-files/19820804/19820804-hd_1280_720_60fps.mp4";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const settings = useQuery(api.appSettings.getMap);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 800);
    const t2 = setTimeout(() => setPhase("out"), 2400);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  // قيم ديناميكية مع fallback
  const logoUrl    = settings?.splash_logo_url  || DEFAULT_LOGO;
  const videoUrl   = settings?.splash_video_url || DEFAULT_VIDEO;
  const titleText  = settings?.splash_title     || "رحلتك للعمرة…";
  const subText    = settings?.splash_subtitle  || "منظمة وآمنة خطوة بخطوة";

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.6s ease" : "none",
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* ── فيديو الخلفية ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.45)" }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* ── طبقة تدرج داكنة فوق الفيديو ── */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, rgba(2,44,34,0.75) 0%, rgba(6,78,59,0.60) 40%, rgba(6,95,70,0.65) 70%, rgba(2,44,34,0.80) 100%)",
        }}
      />

      {/* ── نمط هندسي إسلامي فوق الفيديو ── */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M50 50v-6h-3v6h-6v3h6v6h3v-6h6v-3h-6zm0-44V0h-3v6h-6v3h6v6h3V9h6V6h-6zM6 50v-6H3v6H-3v3h6v6h3v-6h6v-3H6zM6 6V0H3v6H-3v3h6v6h3V9h6V6H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* ── دوائر زخرفية ── */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full border border-white/5"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full border border-white/5"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      />
      <div
        className="absolute w-[200px] h-[200px] rounded-full border border-white/8"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      />

      {/* ── بريق ذهبي في الأعلى ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 opacity-25"
        style={{
          background: "radial-gradient(ellipse at center top, #f0d080 0%, transparent 70%)",
        }}
      />

      {/* ── المحتوى الرئيسي ── */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-8"
        style={{
          animation: "splashLogoIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        }}
      >
        {/* الشعار */}
        <div
          style={{
            animation: "splashLogoFloat 3s ease-in-out infinite",
            filter: "drop-shadow(0 0 40px rgba(240, 208, 128, 0.35))",
          }}
        >
          <img
            src={logoUrl}
            alt="المسار الذكي"
            className="h-28 w-auto object-contain"
            style={{ mixBlendMode: "screen" }}
          />
        </div>

        {/* خط فاصل ذهبي */}
        <div
          className="mt-8 mb-6"
          style={{
            animation: "splashLineIn 0.8s ease 0.6s both",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-px w-16"
              style={{ background: "linear-gradient(to left, #f0d080, transparent)" }}
            />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            <div className="text-amber-300/60 text-lg">✦</div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            <div
              className="h-px w-16"
              style={{ background: "linear-gradient(to right, #f0d080, transparent)" }}
            />
          </div>
        </div>

        {/* النص الترحيبي */}
        <p
          className="text-white/90 text-lg font-medium leading-relaxed tracking-wide"
          style={{
            animation: "splashTextIn 0.9s ease 0.8s both",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}
        >
          {titleText}
          <span className="block text-amber-300 font-bold text-xl mt-1">
            {subText}
          </span>
        </p>
      </div>

      {/* ── شريط التحميل في الأسفل ── */}
      <div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        style={{ animation: "splashTextIn 0.8s ease 1s both" }}
      >
        <div className="w-48 h-0.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(to left, #f0d080, #10b981)",
              animation: "splashProgress 2.2s ease 0.3s forwards",
              width: "0%",
            }}
          />
        </div>
        <p className="text-emerald-400/70 text-xs tracking-widest">
          جارٍ التحميل...
        </p>
      </div>

      {/* ── نجوم متلألئة ── */}
      {[
        { top: "15%", left: "12%", size: 3, delay: "0.2s" },
        { top: "22%", left: "85%", size: 2, delay: "0.5s" },
        { top: "70%", left: "8%",  size: 2, delay: "0.8s" },
        { top: "75%", left: "88%", size: 3, delay: "0.3s" },
        { top: "40%", left: "5%",  size: 2, delay: "1.0s" },
        { top: "35%", left: "92%", size: 2, delay: "0.6s" },
      ].map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-amber-300"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animation: `splashStar 2s ease ${star.delay} infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
