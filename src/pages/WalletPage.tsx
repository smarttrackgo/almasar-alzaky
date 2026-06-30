import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { toast } from "sonner";
import {
  Wallet, ArrowRight, TrendingDown, TrendingUp,
  Clock, CheckCircle2, XCircle, ChevronLeft,
  CreditCard, Smartphone, AlertCircle, RefreshCw,
} from "lucide-react";

const METHOD_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  mada:       { label: "مدى",       icon: "💳", color: "bg-[#0a2240] text-white" },
  stc_pay:    { label: "STC Pay",   icon: "📱", color: "bg-[#7b2d8b] text-white" },
  apple_pay:  { label: "Apple Pay", icon: "🍎", color: "bg-black text-white" },
  google_pay: { label: "Google Pay",icon: "🔵", color: "bg-white text-gray-800 border border-gray-200" },
};

const TX_TYPES: Record<string, { label: string; icon: string; color: string; sign: "+" | "-" }> = {
  refund:             { label: "استرداد من إلغاء حجز", icon: "💰", color: "text-emerald-600", sign: "+" },
  withdrawal_request: { label: "طلب استرداد",          icon: "⏳", color: "text-amber-600",   sign: "-" },
  withdrawal_done:    { label: "تم التحويل",            icon: "✅", color: "text-blue-600",    sign: "-" },
  withdrawal_rejected:{ label: "طلب مرفوض",            icon: "❌", color: "text-red-600",     sign: "+" },
  used:               { label: "استخدام في حجز",       icon: "🎫", color: "text-gray-600",    sign: "-" },
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  completed: { label: "مكتمل",  cls: "bg-emerald-100 text-emerald-700" },
  pending:   { label: "قيد المعالجة", cls: "bg-amber-100 text-amber-700" },
  rejected:  { label: "مرفوض", cls: "bg-red-100 text-red-600" },
};

export default function WalletPage({ navigate }: { navigate: (p: Page) => void }) {
  const wallet = useQuery(api.wallet.getMyWallet);
  const requestWithdrawal = useMutation(api.wallet.requestWithdrawal);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("mada");
  const [accountDetails, setAccountDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const balance = wallet?.balance ?? 0;
  const transactions = wallet?.transactions ?? [];

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) { toast.error("أدخل مبلغاً صحيحاً"); return; }
    if (!accountDetails.trim()) { toast.error("أدخل تفاصيل الحساب"); return; }
    setLoading(true);
    try {
      await requestWithdrawal({ amount, paymentMethod: withdrawMethod, accountDetails: accountDetails.trim() });
      toast.success("✅ تم إرسال طلب الاسترداد بنجاح! سيتم التحويل خلال 3-5 أيام عمل.");
      setShowWithdraw(false);
      setWithdrawAmount("");
      setAccountDetails("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const accountPlaceholder: Record<string, string> = {
    mada:       "رقم الآيبان (SA...)",
    stc_pay:    "رقم الجوال المرتبط بـ STC Pay",
    apple_pay:  "رقم الجوال المرتبط بـ Apple Pay",
    google_pay: "البريد الإلكتروني المرتبط بـ Google Pay",
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-900 to-emerald-800 text-white pt-10 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate({ name: "profile" })}
            className="flex items-center gap-2 text-emerald-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowRight className="w-4 h-4" /> العودة للملف الشخصي
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black">محفظتي الرقمية</h1>
              <p className="text-emerald-200 text-sm">أموالك محفوظة وآمنة</p>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
            <div className="text-emerald-200 text-sm mb-1">الرصيد المتاح</div>
            <div className="text-5xl font-black mb-1">
              {balance.toLocaleString("ar-SA")}
              <span className="text-2xl font-semibold mr-2">ر.س</span>
            </div>
            <div className="text-emerald-300 text-xs mt-2">
              يمكن استخدامه في حجوزاتك القادمة أو استرداده
            </div>
            {balance > 0 && (
              <button
                onClick={() => setShowWithdraw(true)}
                className="mt-4 w-full py-3 rounded-2xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <TrendingDown className="w-4 h-4" />
                استرداد الرصيد
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-14 pb-16 space-y-4">

        {/* Withdrawal Form */}
        {showWithdraw && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-600" />
                طلب استرداد الرصيد
              </h2>
              <button onClick={() => setShowWithdraw(false)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                <XCircle className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              {/* المبلغ */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">المبلغ المراد استرداده (ر.س)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    min="10"
                    max={balance}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-lg font-bold text-gray-800"
                    dir="ltr"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">ر.س</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 250, 500].filter(v => v <= balance).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setWithdrawAmount(String(v))}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      {v} ر.س
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(balance))}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    الكل
                  </button>
                </div>
              </div>

              {/* طريقة الاسترداد */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">طريقة الاسترداد</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(METHOD_LABELS).map(([key, m]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setWithdrawMethod(key)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        withdrawMethod === key
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* تفاصيل الحساب */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">
                  {withdrawMethod === "mada" ? "رقم الآيبان" : "تفاصيل الحساب"}
                </label>
                <input
                  type="text"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder={accountPlaceholder[withdrawMethod]}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none text-sm"
                  dir="ltr"
                />
              </div>

              {/* تنبيه */}
              <div className="bg-amber-50 rounded-xl p-3 flex items-start gap-2 border border-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  سيتم مراجعة طلبك وتحويل المبلغ خلال <strong>3-5 أيام عمل</strong>. الحد الأدنى للاسترداد 10 ر.س.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-bold text-sm hover:from-emerald-800 hover:to-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
                {loading ? "جارٍ الإرسال..." : "إرسال طلب الاسترداد"}
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "إجمالي المستردّ",
              value: transactions.filter(t => t.type === "refund").reduce((s, t) => s + t.amount, 0),
              icon: TrendingUp,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "طلبات معلقة",
              value: transactions.filter(t => t.status === "pending").length,
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
              isCount: true,
            },
            {
              label: "تم التحويل",
              value: transactions.filter(t => t.type === "withdrawal_done").reduce((s, t) => s + t.amount, 0),
              icon: CheckCircle2,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className={`text-lg font-black ${s.color}`}>
                {s.isCount ? s.value : `${s.value.toLocaleString("ar-SA")}`}
                {!s.isCount && <span className="text-xs font-semibold mr-0.5">ر.س</span>}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-black text-gray-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              سجل المعاملات
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {transactions.length} معاملة
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <h3 className="text-base font-bold text-gray-400 mb-1">لا توجد معاملات بعد</h3>
              <p className="text-sm text-gray-300">ستظهر هنا عند إلغاء أي حجز</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((tx) => {
                const txInfo = TX_TYPES[tx.type] ?? { label: tx.type, icon: "💼", color: "text-gray-600", sign: "+" as const };
                const statusInfo = (tx.status && STATUS_BADGE[tx.status]) ? STATUS_BADGE[tx.status] : { label: tx.status ?? "—", cls: "bg-gray-100 text-gray-600" };
                const isPositive = txInfo.sign === "+";

                return (
                  <div key={tx._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                          isPositive ? "bg-emerald-50" : "bg-red-50"
                        }`}>
                          {txInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 text-sm">{txInfo.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate">{tx.description}</div>
                          {tx.bookingRef && (
                            <div className="text-xs text-emerald-600 font-semibold mt-0.5">
                              #{tx.bookingRef}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                              {statusInfo.label}
                            </span>
                            {tx.paymentMethod && METHOD_LABELS[tx.paymentMethod] && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                {METHOD_LABELS[tx.paymentMethod].icon} {METHOD_LABELS[tx.paymentMethod].label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-left flex-shrink-0">
                        <div className={`text-base font-black ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                          {txInfo.sign}{tx.amount.toLocaleString("ar-SA")}
                          <span className="text-xs font-semibold mr-0.5">ر.س</span>
                        </div>
                        <div className="text-[10px] text-gray-300 mt-0.5 text-left">
                          {tx.processedAt
                            ? new Date(tx.processedAt).toLocaleDateString("ar-SA")
                            : new Date(tx._creationTime).toLocaleDateString("ar-SA")}
                        </div>
                      </div>
                    </div>
                    {tx.adminNote && (
                      <div className="mt-2 mr-13 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
                        ملاحظة: {tx.adminNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <h3 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            كيف تعمل المحفظة؟
          </h3>
          <ul className="space-y-1.5 text-xs text-emerald-700">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              عند إلغاء أي حجز مدفوع، يُضاف المبلغ تلقائياً لمحفظتك
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              يمكنك استخدام رصيد المحفظة في حجوزاتك القادمة
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              يمكنك استرداد الرصيد بنفس طريقة الدفع الأصلية خلال 3-5 أيام عمل
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              الحد الأدنى للاسترداد هو 10 ريال سعودي
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
