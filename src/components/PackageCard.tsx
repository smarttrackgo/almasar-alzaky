import { Page } from "../App";
import { Id } from "../../convex/_generated/dataModel";
import { MapPin, Clock, Calendar, Hotel, Star, BadgeCheck } from "lucide-react";

type Pkg = {
  _id: Id<"packages">;
  title: string;
  description: string;
  duration: number;
  price: number;
  originalPrice?: number;
  departureCity: string;
  departureDate: string;
  availableSeats: number;
  totalSeats: number;
  includes: string[];
  hotelMecca: string;
  hotelStars: number;
  packageType: string;
  office?: { name: string; rating?: number; isVerified?: boolean } | null;
};

const TYPE_LABEL: Record<string, string> = {
  economy: "اقتصادي",
  luxury:  "فاخر",
  ramadan: "رمضان",
  family:  "عائلي",
};
const TYPE_CLS: Record<string, string> = {
  economy: "badge-economy",
  luxury:  "badge-luxury",
  ramadan: "badge-ramadan",
  family:  "badge-family",
};

export default function PackageCard({ pkg, navigate }: { pkg: Pkg; navigate: (p: Page) => void }) {
  const pct = Math.round(((pkg.totalSeats - pkg.availableSeats) / pkg.totalSeats) * 100);
  const almostFull = pkg.availableSeats <= 5;

  return (
    <article
      onClick={() => navigate({ name: "package", id: pkg._id })}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-lift cursor-pointer flex flex-col"
    >
      {/* ── Coloured header ── */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 p-5">
        <div className="flex items-start justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${TYPE_CLS[pkg.packageType] ?? "bg-gray-100 text-gray-700"}`}>
            {TYPE_LABEL[pkg.packageType] ?? pkg.packageType}
          </span>
          {pkg.originalPrice && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              خصم {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
            </span>
          )}
        </div>
        <h3 className="text-white font-bold text-base leading-snug line-clamp-2">{pkg.title}</h3>
        <div className="flex items-center gap-4 mt-2.5 text-emerald-200 text-xs">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />{pkg.departureCity}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />{pkg.duration} أيام
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(pkg.departureDate).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col flex-1">
        {/* Office */}
        {pkg.office && (
          <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm flex-shrink-0">
              {pkg.office.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-gray-800 truncate">{pkg.office.name}</span>
                {pkg.office.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
              </div>
              {pkg.office.rating ? (
                <div className="flex items-center gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.floor(pkg.office!.rating!) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}`} />
                  ))}
                  <span className="text-xs text-gray-400 mr-1">{pkg.office.rating}</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Hotel */}
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <Hotel className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="truncate">{pkg.hotelMecca}</span>
          <div className="flex mr-auto">
            {Array.from({ length: pkg.hotelStars }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        {/* Seats */}
        <div className="mb-4 mt-2">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">المقاعد المتاحة</span>
            <span className={`font-bold ${almostFull ? "text-red-500" : "text-emerald-600"}`}>
              {pkg.availableSeats} مقعد
            </span>
          </div>
          <div className="seats-track">
            <div className="seats-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <div className="text-2xl font-black text-emerald-800">
              {pkg.price.toLocaleString("ar-SA")}
              <span className="text-sm font-semibold text-gray-500 mr-1">ر.س</span>
            </div>
            {pkg.originalPrice && (
              <div className="text-xs text-gray-400 line-through">
                {pkg.originalPrice.toLocaleString("ar-SA")} ر.س
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate({ name: "package", id: pkg._id }); }}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: "linear-gradient(135deg,#1b4332,#2d6a4f)" }}
          >
            احجز الآن
          </button>
        </div>
      </div>
    </article>
  );
}
