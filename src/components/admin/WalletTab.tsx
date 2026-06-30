import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Wallet, CheckCircle2, XCircle, Clock, Loader2,
  User, CreditCard, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, MessageSquare, Banknote,
  TrendingUp, ArrowDownCircle, Filter,
} from "lucide-react";

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
  mada:       { label: "مدى",        color: "bg-[#0a2240] text-[#00b4d8]" },
  stc_pay:    { label: "STC Pay",    color: "bg-[#7b2d8b] text-white" },
  apple_pay:  { label: "Apple Pay",  color: "bg-black text-white" },
  google_pay: { label: "Google Pay", color: "bg-white text-gray-700 border border-gray-300" },
  wallet:     { label: "المحفظة",    color: "bg-emerald-100 text-emerald-700" },
};

const STATUS_MAP: Record<string, { label: string; cls: string; Icon: any }> = {
  pending:   { label: "معلق",    cls: "bg-amber-100 text-amber-700",   Icon: Clock },
  completed: { label: "مكتمل",  cls: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  rejected:  { label: "مرفوض",  cls: "bg-red-100 text-red-600",        Icon: XCircle },
};

export default function WalletTab() {
  const requests       = useQuery(api.wallet.getAllWithdrawalRequests);
  const processAction  = useMutation(api.wallet.processWithdrawal);

  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [adminNote, setAdminNote]     = useState<Record<string, string>>({});
  const [processing, setProcessing]   = useState<string | null>(null);
  const [filter, setFilter]           = useState<"all" | "pending" | "completed" | "rejected">("pending");

  const handleProcess = async (id: Id<"walletTransactions">, action: "approve" | "reject") => {
    setProcessing(id);
    try {
      await processAction({
        transactionId: id,
        action,
        adminNote: adminNote[id] || undefined,
      });
      toast.success(action === "approve" ? "✅ تم الموافقة على الطلب وإشعار المستخدم" : "❌ تم رفض الطلب وإعادة المبلغ للمحفظة");
      setExpandedId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشلت العملية");
    } finally {
      setProcessing(null);
    }
  };

  if (requests === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // إحصائيات سريعة
  const totalPending   = requests.filter((r: any) => r.status === "pending").length;
  const totalPendingAmt = requests
    .filter((r: any) => r.status === "pending")
    .reduce((s: number, r: any) => s + r.amount, 0);

  const filtered = filter === "all" ? requests : requests.filter((r: any) => r.status === filter);

  return (
    <div className="space-y-6">

      {/* إحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white">
          <Clock className="w-6 h-6 text-white/60 mb-3" strokeWidth={1.5} />
          <div className="text-2xl font-black">{totalPending}</div>
          <div className="text-white/80 text-xs mt-0.5">طلبات معلقة</div>
          <div className="text-white/50 text-xs mt-0.5">تحتاج مراجعة</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white">
          <Banknote className="w-6 h-6 text-white/60 mb-3" strokeWidth={1.5} />
          <div className="text-2xl font-black">{totalPendingAmt.toLocaleString("ar-SA")}</div>
          <div className="text-white/80 text-xs mt-0.5">ر.س مطلوب استرداده</div>
          <div className="text-white/50 text-xs mt-0.5">إجمالي الطلبات المعلقة</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 text-white">
          <TrendingUp className="w-6 h-6 text-white/60 mb-3" strokeWidth={1.5} />
          <div className="text-2xl font-black">{requests.length}</div>
          <div className="text-white/80 text-xs mt-0.5">إجمالي الطلبات</div>
          <div className="text-white/50 text-xs mt-0.5">كل الحالات</div>
        </div>
      </div>

      {/* فلتر */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-600 ml-1">تصفية:</span>
          {(["pending", "all", "completed", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "الكل" : f === "pending" ? "معلق" : f === "completed" ? "مكتمل" : "مرفوض"}
              {f === "pending" && totalPending > 0 && (
                <span className="mr-1.5 bg-white/30 text-white rounded-full px-1.5 py-0.5 text-xs">
                  {totalPending}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* قائمة الطلبات */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">طلبات استرداد المحفظة</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filtered.length} طلب</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold">لا توجد طلبات</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === "pending" ? "لا توجد طلبات معلقة حالياً" : "لا توجد طلبات بهذه الحالة"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((req: any) => {
              const isExpanded = expandedId === req._id;
              const status     = STATUS_MAP[req.status] ?? STATUS_MAP.pending;
              const method     = METHOD_LABELS[req.paymentMethod] ?? { label: req.paymentMethod, color: "bg-gray-100 text-gray-700" };

              return (
                <div key={req._id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  {/* رأس الطلب */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* أيقونة المستخدم */}
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-800 text-sm">{req.userName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{req.userEmail}</p>

                        {/* المبلغ وطريقة الدفع */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-lg font-black text-emerald-700">
                            {req.amount.toLocaleString("ar-SA")} ر.س
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${method.color}`}>
                            {method.label}
                          </span>
                        </div>

                        {/* الوصف */}
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                          {req.description}
                        </p>

                        {/* التاريخ */}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(req._creationTime).toLocaleDateString("ar-SA", {
                            year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>

                        {/* ملاحظة الأدمن إن وجدت */}
                        {req.adminNote && (
                          <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <p className="text-xs text-blue-700 font-semibold">ملاحظة الأدمن:</p>
                            <p className="text-xs text-blue-600 mt-0.5">{req.adminNote}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* زر التوسيع */}
                    {req.status === "pending" && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : req._id)}
                        className="flex-shrink-0 w-9 h-9 bg-gray-100 hover:bg-emerald-100 rounded-xl flex items-center justify-center transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* لوحة الإجراءات (للطلبات المعلقة فقط) */}
                  {isExpanded && req.status === "pending" && (
                    <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        ملاحظة للمستخدم (اختياري)
                      </div>
                      <textarea
                        value={adminNote[req._id] ?? ""}
                        onChange={(e) => setAdminNote((prev) => ({ ...prev, [req._id]: e.target.value }))}
                        placeholder="أضف ملاحظة توضيحية للمستخدم..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                      />

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleProcess(req._id, "approve")}
                          disabled={processing === req._id}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {processing === req._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          موافقة — تم التحويل
                        </button>
                        <button
                          onClick={() => handleProcess(req._id, "reject")}
                          disabled={processing === req._id}
                          className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {processing === req._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          رفض — إعادة للمحفظة
                        </button>
                      </div>

                      <p className="text-xs text-gray-400 text-center">
                        عند الموافقة: يُشعَر المستخدم بالتحويل ✅ | عند الرفض: يُعاد المبلغ لمحفظته تلقائياً 🔄
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
