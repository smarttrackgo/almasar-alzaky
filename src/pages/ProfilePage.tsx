import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { toast } from "sonner";
import {
  User, Phone, CreditCard, MapPin, Wallet,
  Edit3, Save, X, Plus, Trash2, Users,
  ChevronLeft, CalendarDays, Building2, TrendingUp,
  ShieldCheck, LifeBuoy, FileText, AlertTriangle, LockKeyhole,
} from "lucide-react";

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  pending:   { label: "قيد المراجعة",     cls: "bg-amber-100 text-amber-700",    dot: "bg-amber-400" },
  confirmed: { label: "مؤكد",             cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  permit:    { label: "تم إصدار التصريح", cls: "bg-blue-100 text-blue-700",      dot: "bg-blue-500" },
  departed:  { label: "تم الانطلاق",      cls: "bg-purple-100 text-purple-700",  dot: "bg-purple-500" },
  completed: { label: "مكتمل",            cls: "bg-gray-100 text-gray-600",      dot: "bg-gray-400" },
  cancelled: { label: "ملغي",             cls: "bg-red-100 text-red-600",        dot: "bg-red-400" },
};

type ProfileTab = "info" | "bookings" | "companions" | "wallet" | "security";

export default function ProfilePage({ navigate }: { navigate: (p: Page) => void }) {
  const { signOut } = useAuthActions();
  const user       = useQuery(api.auth.loggedInUser);
  const bookings   = useQuery(api.bookings.myBookings);
  const companions = useQuery(api.companions.getMyCompanions);
  const wallet     = useQuery(api.wallet.getMyWallet);
  const updateProfile   = useMutation(api.bookings.updateProfile);
  const addCompanion    = useMutation(api.companions.add);
  const removeCompanion = useMutation(api.companions.remove);
  const deleteMyAccount = useMutation(api.auth.deleteMyAccount);

  const [tab, setTab]         = useState<ProfileTab>("info");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", idNumber: "", passportNumber: "", city: "" });
  const [showAddComp, setShowAddComp] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [compForm, setCompForm] = useState({ name: "", idNumber: "", relation: "زوج/زوجة", phone: "", passportNumber: "" });

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const startEdit = () => {
    setForm({
      name: user?.name ?? "",
      phone: (user as any)?.phone ?? "",
      idNumber: (user as any)?.idNumber ?? "",
      passportNumber: (user as any)?.passportNumber ?? "",
      city: (user as any)?.city ?? "",
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: form.name || undefined,
        phone: form.phone || undefined,
        idNumber: form.idNumber || undefined,
        passportNumber: form.passportNumber || undefined,
        city: form.city || undefined,
      });
      toast.success("تم حفظ البيانات بنجاح ✓");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCompanion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCompanion({
        name: compForm.name,
        idNumber: compForm.idNumber,
        relation: compForm.relation,
        phone: compForm.phone || undefined,
        passportNumber: compForm.passportNumber || undefined,
      });
      toast.success("تم إضافة المرافق");
      setShowAddComp(false);
      setCompForm({ name: "", idNumber: "", relation: "زوج/زوجة", phone: "", passportNumber: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const handleRemoveCompanion = async (id: any) => {
    if (!confirm("هل تريد حذف هذا المرافق؟")) return;
    try {
      await removeCompanion({ companionId: id });
      toast.success("تم حذف المرافق");
    } catch { toast.error("حدث خطأ"); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim() !== "حذف حسابي") {
      toast.error("اكتب عبارة التأكيد: حذف حسابي");
      return;
    }
    if (!confirm("سيتم حذف حسابك وجميع بياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟")) return;

    setDeletingAccount(true);
    try {
      await deleteMyAccount({ confirmation: deleteConfirmation });
      toast.success("تم حذف الحساب نهائياً");
      await signOut().catch(() => {});
      navigate({ name: "home" });
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حذف الحساب");
    } finally {
      setDeletingAccount(false);
    }
  };

  const TABS: { key: ProfileTab; label: string; Icon: any }[] = [
    { key: "info",       label: "بياناتي",   Icon: User },
    { key: "bookings",   label: "حجوزاتي",   Icon: CalendarDays },
    { key: "companions", label: "المرافقون", Icon: Users },
    { key: "wallet",     label: "المحفظة",   Icon: Wallet },
    { key: "security",   label: "الأمان والتواصل", Icon: ShieldCheck },
  ];

  const activeBookings = bookings?.filter((b) => !["completed","cancelled"].includes(b.status)) ?? [];
  const pastBookings   = bookings?.filter((b) =>  ["completed","cancelled"].includes(b.status)) ?? [];

  const inp = "w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all";

  const walletBalance = wallet?.balance ?? 0;
  const recentTx = wallet?.transactions?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-900 to-emerald-800 text-white pt-10 pb-20 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-3xl font-black">
            {(user?.name ?? user?.email ?? "م").charAt(0).toUpperCase()}
            {false && tab === "security" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    الأمان والتواصل
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    هذه الخيارات مهمة للتطبيق: الدعم، السياسات، وإدارة الحساب.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => navigate({ name: "support" })}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-right hover:bg-emerald-100 transition-colors"
                  >
                    <LifeBuoy className="w-6 h-6 text-emerald-700 mb-3" />
                    <div className="font-bold text-gray-900">اتصل بنا</div>
                    <div className="text-xs text-gray-500 mt-1">محادثة مباشرة مع إدارة المنصة</div>
                  </button>
                  <button
                    onClick={() => navigate({ name: "privacy" })}
                    className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-right hover:bg-blue-100 transition-colors"
                  >
                    <LockKeyhole className="w-6 h-6 text-blue-700 mb-3" />
                    <div className="font-bold text-gray-900">سياسة الخصوصية</div>
                    <div className="text-xs text-gray-500 mt-1">البيانات والصلاحيات والتتبع</div>
                  </button>
                  <button
                    onClick={() => navigate({ name: "terms" })}
                    className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-right hover:bg-amber-100 transition-colors"
                  >
                    <FileText className="w-6 h-6 text-amber-700 mb-3" />
                    <div className="font-bold text-gray-900">الشروط والأحكام</div>
                    <div className="text-xs text-gray-500 mt-1">قواعد استخدام المنصة والحجوزات</div>
                  </button>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-red-800">حذف حسابي</h3>
                      <p className="text-sm text-red-700/80 leading-7 mt-1">
                        سيتم حذف الحساب وجميع البيانات المرتبطة به نهائياً، بما في ذلك الحجوزات، المرافقين، المحفظة، محادثات الدعم، وسجلات الدخول. لا يمكن التراجع بعد التنفيذ.
                      </p>
                      {(user as any)?.isAdmin ? (
                        <div className="mt-4 rounded-xl bg-white/80 border border-red-100 px-4 py-3 text-sm font-semibold text-red-700">
                          حساب المدير لا يتم حذفه من هنا. ألغِ صلاحيات الإدارة أولاً من لوحة الإدارة.
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <label className="block text-xs font-bold text-red-800">
                            للتأكيد اكتب: حذف حسابي
                          </label>
                          <input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full rounded-xl border-2 border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            placeholder="حذف حسابي"
                          />
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deletingAccount || deleteConfirmation.trim() !== "حذف حسابي"}
                            className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingAccount ? "جارٍ حذف الحساب..." : "حذف حسابي نهائياً"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black">{user?.name ?? "المعتمر"}</h1>
            <p className="text-emerald-200 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full">
                {bookings?.length ?? 0} حجز
              </span>
              {walletBalance > 0 && (
                <span className="bg-emerald-400/20 text-emerald-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  {walletBalance.toLocaleString("ar-SA")} ر.س
                </span>
              )}
              {(user as any)?.isAdmin && (
                <span className="bg-amber-400/20 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full">
                  مدير
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-4xl mx-auto px-4 -mt-10 pb-16">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="admin-tabs-scroll flex border-b border-gray-100 overflow-x-auto">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex min-w-[132px] items-center justify-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  tab === key
                    ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {key === "wallet" && walletBalance > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {walletBalance.toLocaleString("ar-SA")}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Info ── */}
            {tab === "info" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">البيانات الشخصية</h2>
                  {!editing ? (
                    <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors">
                      <Edit3 className="w-4 h-4" /> تعديل
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm">
                        <X className="w-4 h-4" /> إلغاء
                      </button>
                      <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
                        <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ"}
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "الاسم الكامل", key: "name",           Icon: User,       placeholder: "أدخل اسمك الكامل" },
                    { label: "رقم الجوال",   key: "phone",          Icon: Phone,      placeholder: "05xxxxxxxx" },
                    { label: "رقم الهوية",   key: "idNumber",       Icon: CreditCard, placeholder: "1xxxxxxxxx" },
                    { label: "رقم الجواز",   key: "passportNumber", Icon: CreditCard, placeholder: "اختياري" },
                    { label: "المدينة",      key: "city",           Icon: MapPin,     placeholder: "مدينتك" },
                  ].map(({ label, key, Icon, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </label>
                      {editing ? (
                        <input
                          value={(form as any)[key]}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className={inp}
                        />
                      ) : (
                        <div className="px-3 py-2.5 rounded-xl bg-gray-50 text-sm text-gray-700 font-medium">
                          {(user as any)?.[key] || <span className="text-gray-300">غير محدد</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-700 font-medium">
                    📧 البريد الإلكتروني: <span className="font-bold">{user?.email ?? "-"}</span>
                  </p>
                </div>
              </div>
            )}

            {/* ── Bookings ── */}
            {tab === "bookings" && (
              <div className="space-y-6">
                {activeBookings.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      الحجوزات النشطة ({activeBookings.length})
                    </h3>
                    <div className="space-y-3">
                      {activeBookings.map((b) => <BookingCard key={b._id} booking={b} navigate={navigate} />)}
                    </div>
                  </div>
                )}
                {pastBookings.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      الحجوزات السابقة ({pastBookings.length})
                    </h3>
                    <div className="space-y-3">
                      {pastBookings.map((b) => <BookingCard key={b._id} booking={b} navigate={navigate} />)}
                    </div>
                  </div>
                )}
                {(!bookings || bookings.length === 0) && (
                  <div className="text-center py-16">
                    <CalendarDays className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-500 mb-2">لا توجد حجوزات بعد</h3>
                    <button onClick={() => navigate({ name: "home" })} className="mt-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-l from-emerald-700 to-emerald-600 shadow-md">
                      استعرض البرامج
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Companions ── */}
            {tab === "companions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800">المرافقون ({companions?.length ?? 0})</h2>
                  <button onClick={() => setShowAddComp(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700">
                    <Plus className="w-4 h-4" /> إضافة مرافق
                  </button>
                </div>
                {showAddComp && (
                  <form onSubmit={handleAddCompanion} className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 space-y-3">
                    <h3 className="font-bold text-emerald-800 text-sm">إضافة مرافق جديد</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "الاسم *",       key: "name",          required: true },
                        { label: "رقم الهوية *",  key: "idNumber",      required: true },
                        { label: "رقم الجوال",    key: "phone",         required: false },
                        { label: "رقم الجواز",    key: "passportNumber",required: false },
                      ].map(({ label, key, required }) => (
                        <div key={key}>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">{label}</label>
                          <input value={(compForm as any)[key]} onChange={(e) => setCompForm((f) => ({ ...f, [key]: e.target.value }))} required={required} className={inp} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">صلة القرابة</label>
                      <select value={compForm.relation} onChange={(e) => setCompForm((f) => ({ ...f, relation: e.target.value }))} className={inp}>
                        {["زوج/زوجة","ابن/ابنة","أب/أم","أخ/أخت","آخر"].map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700">إضافة</button>
                      <button type="button" onClick={() => setShowAddComp(false)} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">إلغاء</button>
                    </div>
                  </form>
                )}
                {companions?.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">لا يوجد مرافقون مضافون</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {companions?.map((c) => (
                      <div key={c._id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">{c.name}</div>
                            <div className="text-xs text-gray-400">{c.relation} • {c.idNumber}</div>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveCompanion(c._id)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Wallet ── */}
            {tab === "wallet" && (
              <div className="space-y-5">
                {/* Balance */}
                <div className="bg-gradient-to-l from-emerald-700 to-emerald-900 rounded-2xl p-6 text-white">
                  <div className="text-emerald-200 text-sm mb-1">رصيد المحفظة</div>
                  <div className="text-4xl font-black">
                    {walletBalance.toLocaleString("ar-SA")}
                    <span className="text-xl font-semibold mr-1">ر.س</span>
                  </div>
                  <div className="mt-3 text-emerald-200 text-xs">
                    يمكن استخدام رصيد المحفظة في حجوزاتك القادمة أو استرداده
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate({ name: "wallet" })}
                      className="flex-1 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      عرض كل المعاملات
                    </button>
                    {walletBalance > 0 && (
                      <button
                        onClick={() => navigate({ name: "wallet" })}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 border border-white/20"
                      >
                        <Wallet className="w-4 h-4" />
                        استرداد الرصيد
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Transactions */}
                {recentTx.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3">آخر المعاملات</h3>
                    <div className="space-y-2">
                      {recentTx.map((tx) => {
                        const isRefund = tx.type === "refund";
                        return (
                          <div key={tx._id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isRefund ? "bg-emerald-100" : "bg-red-50"}`}>
                                {isRefund ? "💰" : "💳"}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-700">
                                  {isRefund ? "استرداد من إلغاء حجز" : "طلب استرداد"}
                                </div>
                                {tx.bookingRef && (
                                  <div className="text-[10px] text-gray-400">#{tx.bookingRef}</div>
                                )}
                              </div>
                            </div>
                            <div className={`text-sm font-black ${isRefund ? "text-emerald-600" : "text-red-500"}`}>
                              {isRefund ? "+" : "-"}{tx.amount.toLocaleString("ar-SA")} ر.س
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => navigate({ name: "wallet" })}
                      className="w-full mt-3 py-2.5 rounded-xl border-2 border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
                    >
                      عرض كل المعاملات <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <Wallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    لا توجد معاملات بعد — ستظهر هنا عند إلغاء أي حجز
                  </div>
                )}
              </div>
            )}

            {tab === "security" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    الأمان والتواصل
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    هذه الخيارات مهمة للتطبيق: الدعم، السياسات، وإدارة الحساب.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => navigate({ name: "support" })}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-right hover:bg-emerald-100 transition-colors"
                  >
                    <LifeBuoy className="w-6 h-6 text-emerald-700 mb-3" />
                    <div className="font-bold text-gray-900">اتصل بنا</div>
                    <div className="text-xs text-gray-500 mt-1">محادثة مباشرة مع إدارة المنصة</div>
                  </button>
                  <button
                    onClick={() => navigate({ name: "privacy" })}
                    className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-right hover:bg-blue-100 transition-colors"
                  >
                    <LockKeyhole className="w-6 h-6 text-blue-700 mb-3" />
                    <div className="font-bold text-gray-900">سياسة الخصوصية</div>
                    <div className="text-xs text-gray-500 mt-1">البيانات والصلاحيات والتتبع</div>
                  </button>
                  <button
                    onClick={() => navigate({ name: "terms" })}
                    className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-right hover:bg-amber-100 transition-colors"
                  >
                    <FileText className="w-6 h-6 text-amber-700 mb-3" />
                    <div className="font-bold text-gray-900">الشروط والأحكام</div>
                    <div className="text-xs text-gray-500 mt-1">قواعد استخدام المنصة والحجوزات</div>
                  </button>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-red-800">حذف حسابي</h3>
                      <p className="text-sm text-red-700/80 leading-7 mt-1">
                        سيتم حذف الحساب وجميع البيانات المرتبطة به نهائياً، بما في ذلك الحجوزات، المرافقين، المحفظة، محادثات الدعم، وسجلات الدخول. لا يمكن التراجع بعد التنفيذ.
                      </p>
                      {(user as any)?.isAdmin ? (
                        <div className="mt-4 rounded-xl bg-white/80 border border-red-100 px-4 py-3 text-sm font-semibold text-red-700">
                          حساب المدير لا يتم حذفه من هنا. ألغِ صلاحيات الإدارة أولاً من لوحة الإدارة.
                        </div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <label className="block text-xs font-bold text-red-800">
                            للتأكيد اكتب: حذف حسابي
                          </label>
                          <input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            className="w-full rounded-xl border-2 border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            placeholder="حذف حسابي"
                          />
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deletingAccount || deleteConfirmation.trim() !== "حذف حسابي"}
                            className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingAccount ? "جارٍ حذف الحساب..." : "حذف حسابي نهائياً"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, navigate }: { booking: any; navigate: (p: Page) => void }) {
  const st = STATUS[booking.status] ?? { label: booking.status, cls: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="bg-gradient-to-l from-emerald-800 to-emerald-900 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-sm">{booking.package?.title ?? "برنامج"}</div>
          <div className="text-emerald-200 text-xs flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3" />{booking.office?.name}
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${st.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 text-xs mb-3">
          <div>
            <div className="text-gray-400 mb-0.5">رقم الحجز</div>
            <div className="font-bold text-emerald-700">{booking.bookingReference}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-0.5">الانطلاق</div>
            <div className="font-semibold text-gray-700">
              {booking.package ? new Date(booking.package.departureDate).toLocaleDateString("ar-SA") : "-"}
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-0.5">الإجمالي</div>
            <div className="font-black text-emerald-700">{booking.totalPrice.toLocaleString("ar-SA")} ر.س</div>
          </div>
        </div>
        <button
          onClick={() => booking.packageId && navigate({ name: "package", id: booking.packageId })}
          className="w-full text-center text-emerald-600 hover:text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1"
        >
          عرض تفاصيل البرنامج <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
