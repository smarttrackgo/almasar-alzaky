import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, Flashlight, RefreshCw } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef  = useRef<Html5Qrcode | null>(null);
  const divIdRef    = useRef("qr-reader-" + Math.random().toString(36).slice(2, 8));
  const divId       = divIdRef.current;
  const [error, setError]     = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const scannedRef = useRef(false);

  const startScanner = useCallback(async () => {
    setError(null);
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setError("لم يتم العثور على كاميرا في الجهاز");
        return;
      }
      // نفضّل الكاميرا الخلفية
      const backCam = cameras.find((c) =>
        c.label.toLowerCase().includes("back") ||
        c.label.toLowerCase().includes("rear") ||
        c.label.toLowerCase().includes("environment")
      ) ?? cameras[cameras.length - 1];

      const scanner = new Html5Qrcode(divId);
      scannerRef.current = scanner;

      await scanner.start(
        backCam.id,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          // إيقاف الماسح بعد النجاح
          setStarted(false);
          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              scannerRef.current = null;
              onScan(decodedText);
            });
        },
        () => {} // خطأ مؤقت — تجاهل
      );
      setStarted(true);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes("Permission") || msg.includes("permission") || msg.includes("NotAllowed")) {
        setError("يرجى السماح بالوصول إلى الكاميرا من إعدادات المتصفح");
      } else {
        setError("تعذّر تشغيل الكاميرا: " + msg);
      }
    }
  }, [divId, onScan]);

  useEffect(() => {
    startScanner();
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      scanner?.stop().catch(() => {});
    };
  }, [startScanner]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/80">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-bold text-lg">مسح تذكرة المعتمر</h2>
        <div className="w-10" />
      </div>

      {/* منطقة الكاميرا */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {/* عنصر الكاميرا */}
        <div id={divId} className="w-full max-w-sm" />

        {/* إطار التوجيه */}
        {started && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* زوايا الإطار */}
              {[
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-10 h-10 border-emerald-400 ${cls}`} />
              ))}
              {/* خط المسح المتحرك */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-400/80 animate-[scan_2s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* رسالة الخطأ */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <Camera className="w-16 h-16 text-gray-500 mb-4" />
            <p className="text-white font-bold mb-2">تعذّر تشغيل الكاميرا</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => { scannedRef.current = false; startScanner(); }}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
          </div>
        )}
      </div>

      {/* تعليمات */}
      <div className="px-6 py-4 bg-black/80 text-center">
        <p className="text-emerald-400 font-bold text-sm mb-1">وجّه الكاميرا نحو QR التذكرة</p>
        <p className="text-gray-500 text-xs">سيتم التعرف على التذكرة تلقائياً عند المسح</p>
      </div>

      <style>{`
        @keyframes scan {
          0%   { top: 0%; }
          50%  { top: calc(100% - 2px); }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
