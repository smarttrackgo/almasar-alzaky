import { useState, useRef, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Bot, X, Send, Sparkles, ChevronDown,
  Loader2, TrendingDown, Lightbulb, Star,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function AIAssistant({ navigate }: { navigate: (p: any) => void }) {
  const [open, setOpen]           = useState(false);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "tips">("chat");

  // جلب الإعدادات الديناميكية من قاعدة البيانات
  const quickQuestions  = useQuery(api.aiSettings.getQuickQuestions);
  const recommendations = useQuery(api.aiSettings.getRecommendations);
  const aiConfig        = useQuery(api.aiSettings.getAll);
  const packages        = useQuery(api.packages.list, {});
  const announcements   = useQuery(api.announcements.getActive);
  const chatAction      = useAction(api.aiAssistant.chat);
  const bottomRef       = useRef<HTMLDivElement>(null);

  const welcomeMsg = aiConfig?.welcome_message
    ?? "مرحباً! أنا مساعدك الذكي في المسار الذكي 🕌\n\nيمكنني مساعدتك في:\n• اختيار أفضل برنامج عمرة\n• معرفة أرخص أوقات السفر\n• الإجابة على أسئلتك عن المناسك\n\nكيف يمكنني مساعدتك؟";

  const [messages, setMessages] = useState<Message[]>([]);

  // تحديث رسالة الترحيب عند تغيير الإعدادات
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: welcomeMsg, timestamp: Date.now() }]);
    }
  }, [welcomeMsg]);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  const buildPackagesContext = () => {
    if (!packages?.length) return undefined;
    return packages
      .slice(0, 12)
      .map((p) =>
        `- ${p.title}: ${p.price.toLocaleString("ar-SA")} ر.س، ${p.duration} أيام، من ${p.departureCity}، نوع: ${p.packageType}، فنادق: ${p.hotelStars} نجوم`
      )
      .join("\n");
  };

  const buildAppContext = () => {
    const parts: string[] = [];
    if (announcements?.length) {
      parts.push(`الإعلانات الحالية:\n${announcements.slice(0, 3).map((a: any) => `- ${a.title}: ${a.content}`).join("\n")}`);
    }
    parts.push(`ميزات التطبيق المتاحة:
- حجز برامج العمرة مباشرة
- تتبع الرحلة المباشر (GPS)
- مصحف شريف كامل
- أذكار وأدعية
- مواقيت الصلاة
- الدعم والتواصل المباشر مع الإدارة
- إدارة الحجوزات والمرافقين`);
    return parts.join("\n\n");
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await chatAction({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        packagesContext: buildPackagesContext(),
        appContext: buildAppContext(),
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply, timestamp: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "عذراً، حدث خطأ. حاول مرة أخرى.", timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const defaultQuestions = [
    "ما أرخص وقت للعمرة؟",
    "ما الفرق بين البرامج الاقتصادية والفاخرة؟",
    "كم يستغرق أداء مناسك العمرة؟",
    "ما أفضل برنامج للعائلات؟",
  ];
  const displayQuestions    = quickQuestions ?? defaultQuestions;
  const displayRecommendations = recommendations ?? [];

  return (
    <>
      {/* ── Floating Button ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-2xl shadow-purple-500/40 flex items-center justify-center hover:scale-110 transition-all duration-300 group"
        >
          <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-amber-900" />
          </span>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            مساعد AI
          </span>
        </button>
      )}

      {/* ── Chat Window ── */}
      {open && (
        <div
          className={`fixed bottom-6 left-6 z-50 w-[370px] max-w-[calc(100vw-20px)] bg-white rounded-3xl shadow-2xl shadow-black/20 border border-gray-100 flex flex-col transition-all duration-300 ${
            minimized ? "h-16" : "h-[560px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-violet-700 to-purple-600 rounded-t-3xl flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">مساعد العمرة الذكي</div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-purple-200 text-xs">متاح الآن</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${minimized ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Tabs */}
              <div className="flex border-b border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "chat"
                      ? "text-purple-700 border-b-2 border-purple-600 bg-purple-50/50"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  المحادثة
                </button>
                <button
                  onClick={() => setActiveTab("tips")}
                  className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "tips"
                      ? "text-amber-700 border-b-2 border-amber-500 bg-amber-50/50"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  توصيات ذكية
                </button>
              </div>

              {/* ── تبويب المحادثة ── */}
              {activeTab === "chat" && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 ml-2 mt-1">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                            msg.role === "user"
                              ? "bg-gray-100 text-gray-800 rounded-tr-sm"
                              : "bg-gradient-to-br from-violet-50 to-purple-50 text-gray-800 border border-purple-100 rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-end">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ml-2">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Quick Questions - ديناميكية */}
                  {messages.length <= 1 && displayQuestions.length > 0 && (
                    <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                      {displayQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(q)}
                          className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors font-medium"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Best Time Banner */}
                  {messages.length <= 1 && (
                    <div className="mx-4 mb-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 flex-shrink-0">
                      <TrendingDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-amber-800">أرخص وقت للعمرة</div>
                        <div className="text-xs text-amber-600">شهر محرم وصفر — أسعار أقل بـ 40%</div>
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-3 border-t border-gray-100 flex-shrink-0">
                    <div className="flex gap-2 items-end">
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                        placeholder="اسألني عن العمرة..."
                        className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                        disabled={loading}
                      />
                      <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 hover:shadow-lg hover:shadow-purple-300 transition-all flex-shrink-0"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── تبويب التوصيات الذكية ── */}
              {activeTab === "tips" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-amber-800 text-sm">توصيات مخصصة</span>
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      اختر ما يناسبك وسيساعدك المساعد في إيجاد أفضل برنامج
                    </p>
                  </div>

                  {displayRecommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">لا توجد توصيات حالياً</p>
                    </div>
                  ) : (
                    displayRecommendations.map((rec: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveTab("chat");
                          sendMessage(`أريد ${rec.title}: ${rec.text}`);
                        }}
                        className="w-full text-right bg-white border border-gray-100 rounded-2xl p-4 hover:border-purple-200 hover:bg-purple-50/30 transition-all shadow-sm group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center flex-shrink-0 group-hover:from-purple-200 group-hover:to-violet-200 transition-colors">
                            <Star className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 text-sm mb-1">{rec.title}</div>
                            <div className="text-xs text-gray-500 leading-relaxed">{rec.text}</div>
                          </div>
                          <Send className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                        </div>
                      </button>
                    ))
                  )}

                  {/* زر للانتقال للمحادثة */}
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="w-full py-3 rounded-2xl bg-gradient-to-l from-violet-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    ابدأ محادثة مع المساعد
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
