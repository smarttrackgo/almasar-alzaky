import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";
import { toast } from "sonner";
import {
  MessageCircle, Send, ArrowRight, CheckCheck, Check,
  Clock, Headphones, Shield, Zap, ChevronDown,
  Mail, LogIn, FileText,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

export default function SupportPage({ navigate }: { navigate: (p: Page) => void }) {
  const user = useQuery(api.auth.loggedInUser);
  const myChat = useQuery(api.support.getMyChat);
  const getOrCreate = useMutation(api.support.getOrCreateChat);
  const sendMsg = useMutation(api.support.sendMessage);
  const markRead = useMutation(api.support.markAsRead);

  const [chatId, setChatId] = useState<Id<"supportChats"> | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.support.getMessages,
    chatId ? { chatId } : "skip"
  );

  // تعيين chatId من المحادثة الموجودة
  useEffect(() => {
    if (myChat) {
      setChatId(myChat._id);
      setStarted(true);
    }
  }, [myChat]);

  // تمرير للأسفل عند وصول رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // تعليم كمقروء عند فتح المحادثة
  useEffect(() => {
    if (chatId) {
      markRead({ chatId }).catch(() => {});
    }
  }, [chatId, messages?.length]);

  const handleStart = async () => {
    try {
      const id = await getOrCreate({});
      setChatId(id);
      setStarted(true);
    } catch (e) {
      toast.error("حدث خطأ، حاول مجدداً");
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !chatId) return;
    setSending(true);
    try {
      await sendMsg({ chatId, text });
      setText("");
    } catch (e: any) {
      toast.error(e.message ?? "فشل الإرسال");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "اليوم";
    if (d.toDateString() === yesterday.toDateString()) return "أمس";
    return d.toLocaleDateString("ar-SA", { day: "numeric", month: "long" });
  };

  // تجميع الرسائل حسب اليوم
  const groupedMessages = () => {
    if (!messages) return [];
    const groups: { date: string; msgs: typeof messages }[] = [];
    let currentDate = "";
    messages.forEach((msg) => {
      const d = formatDate(msg.sentAt);
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, msgs: [] });
      }
      groups[groups.length - 1].msgs.push(msg);
    });
    return groups;
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-emerald-400/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="bg-gradient-to-l from-emerald-950 to-emerald-800 text-white px-4 py-8 shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <button onClick={() => navigate({ name: "home" })} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-black text-xl">اتصل بنا</h1>
              <p className="text-emerald-200 text-sm mt-1">فريق المسار الذكي جاهز لمساعدتك</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-gray-900">الدعم داخل التطبيق</h2>
            <p className="text-sm text-gray-500 leading-7 mt-2">
              لفتح محادثة مباشرة ومتابعة طلبك، سجل الدخول أولاً ثم افتح صفحة الدعم.
            </p>
            <button
              onClick={() => navigate({ name: "signin" })}
              className="mt-5 w-full rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول للتواصل
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="mailto:support@almasaralzaky.com" className="rounded-2xl bg-white border border-gray-100 p-4 hover:border-emerald-200 transition-colors">
              <Mail className="w-6 h-6 text-emerald-700 mb-3" />
              <div className="font-bold text-gray-900">البريد الإلكتروني</div>
              <div className="text-sm text-gray-500 mt-1" dir="ltr">support@almasaralzaky.com</div>
            </a>
            <button onClick={() => navigate({ name: "privacy" })} className="rounded-2xl bg-white border border-gray-100 p-4 text-right hover:border-emerald-200 transition-colors">
              <FileText className="w-6 h-6 text-emerald-700 mb-3" />
              <div className="font-bold text-gray-900">الخصوصية والحذف</div>
              <div className="text-sm text-gray-500 mt-1">تعرف على حقوقك وطريقة حذف الحساب</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-950 to-emerald-800 text-white px-4 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate({ name: "home" })}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base">المسار الذكي - الدعم</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-xs">متاح الآن</span>
              </div>
            </div>
          </div>
          {myChat?.status === "closed" && (
            <span className="text-xs bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full border border-red-500/30">
              مغلقة
            </span>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col">
        {!started ? (
          /* شاشة الترحيب */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl mb-6">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">تواصل مع الإدارة</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
              هل لديك استفسار أو مشكلة؟ فريق الدعم في المسار الذكي جاهز لمساعدتك على مدار الساعة
            </p>

            {/* مميزات */}
            <div className="grid grid-cols-3 gap-4 mb-10 w-full max-w-sm">
              {[
                { Icon: Zap, label: "رد سريع", color: "text-amber-500", bg: "bg-amber-50" },
                { Icon: Shield, label: "آمن وخاص", color: "text-blue-500", bg: "bg-blue-50" },
                { Icon: Clock, label: "24/7", color: "text-emerald-500", bg: "bg-emerald-50" },
              ].map(({ Icon, label, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col items-center gap-2`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                  <span className="text-xs font-semibold text-gray-600">{label}</span>
                </div>
              ))}
            </div>

            {/* أسئلة شائعة */}
            <div className="w-full max-w-sm space-y-2 mb-8">
              <p className="text-xs text-gray-400 font-semibold mb-3">أسئلة شائعة - اضغط للإرسال</p>
              {[
                "كيف يمكنني إلغاء حجزي؟",
                "متى يتم تأكيد الحجز؟",
                "هل يمكن تعديل بيانات الحجز؟",
                "كيف أتواصل مع مكتب السفر؟",
              ].map((q) => (
                <button
                  key={q}
                  onClick={async () => {
                    const id = await getOrCreate({});
                    setChatId(id);
                    setStarted(true);
                    setTimeout(async () => {
                      await sendMsg({ chatId: id, text: q });
                    }, 300);
                  }}
                  className="w-full text-right px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 transition-all flex items-center justify-between group"
                >
                  <span>{q}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 -rotate-90 transition-transform" />
                </button>
              ))}
            </div>

            <button
              onClick={handleStart}
              className="w-full max-w-sm py-4 rounded-2xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              ابدأ المحادثة
            </button>
          </div>
        ) : (
          /* واجهة المحادثة */
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ minHeight: 0, maxHeight: "calc(100vh - 200px)" }}>
              {/* رسالة ترحيب */}
              <div className="flex justify-start mb-4">
                <div className="flex items-end gap-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      مرحباً {user?.name ?? ""}! 👋<br />
                      أنا هنا لمساعدتك. كيف يمكنني خدمتك اليوم؟
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">الإدارة</span>
                  </div>
                </div>
              </div>

              {/* الرسائل */}
              {groupedMessages().map(({ date, msgs }) => (
                <div key={date}>
                  {/* فاصل التاريخ */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{date}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {msgs.map((msg) => {
                    const isMe = !msg.isAdmin;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}
                      >
                        <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? "flex-row-reverse" : ""}`}>
                          {/* أفاتار */}
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center flex-shrink-0 mb-1">
                              <Headphones className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}

                          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div
                              className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                                isMe
                                  ? "bg-gradient-to-l from-emerald-700 to-emerald-600 text-white rounded-br-sm"
                                  : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                              }`}
                            >
                              {msg.text}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row-reverse" : ""}`}>
                              <span className="text-xs text-gray-400">{formatTime(msg.sentAt)}</span>
                              {isMe && (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {messages?.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  ابدأ المحادثة بإرسال رسالتك الأولى 💬
                </div>
              )}

              {myChat?.status === "closed" && (
                <div className="text-center py-4">
                  <span className="text-xs bg-gray-100 text-gray-500 px-4 py-2 rounded-full">
                    تم إغلاق هذه المحادثة من قِبل الإدارة
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* حقل الإدخال */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
              {myChat?.status === "closed" ? (
                <div className="text-center text-sm text-gray-500 py-2">
                  المحادثة مغلقة - لا يمكن إرسال رسائل جديدة
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك هنا..."
                    rows={1}
                    className="flex-1 resize-none px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                    style={{ maxHeight: "120px" }}
                    onInput={(e) => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = "auto";
                      t.style.height = Math.min(t.scrollHeight, 120) + "px";
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-l from-emerald-700 to-emerald-600 text-white flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
