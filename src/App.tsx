import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import SplashScreen from "./components/SplashScreen";
import { usePushNotifications } from "./lib/usePushNotifications";
import HomePage from "./pages/HomePage";
import PackageDetailPage from "./pages/PackageDetailPage";
import BookingsPage from "./pages/BookingsPage";
import ProfilePage from "./pages/ProfilePage";
import OfficeDashboard from "./pages/OfficeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import QuranPage from "./pages/QuranPage";
import AdhkarPage from "./pages/AdhkarPage";
import UmrahMapPage from "./pages/UmrahMapPage";
import PaymentPage from "./pages/PaymentPage";
import AccountTypeSelectionPage from "./pages/AccountTypeSelectionPage";
import TripTrackingPage from "./pages/TripTrackingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PrayerTimesPage from "./pages/PrayerTimesPage";
import PilgrimGuidePage from "./pages/PilgrimGuidePage";
import BookingDetailPage from "./pages/BookingDetailPage";
import PassengerManifestPage from "./pages/PassengerManifestPage";
import SupportPage from "./pages/SupportPage";
import AboutPage from "./pages/AboutPage";
import TermsPage from "./pages/TermsPage";
import HaramainLivePage from "./pages/HaramainLivePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import WalletPage from "./pages/WalletPage";
import DriverPublicProfilePage from "./pages/DriverPublicProfilePage";
import DriverVerifyPage from "./pages/DriverVerifyPage";
import PublicTripTrackingPage from "./pages/PublicTripTrackingPage";
import NotificationBell from "./components/NotificationBell";
import FloatingQuranBtn from "./components/FloatingQuranBtn";
import FloatingSupportBtn from "./components/FloatingSupportBtn";
import AnnouncementBanner from "./components/AnnouncementBanner";
import AIAssistant from "./components/AIAssistant";
import PWAInstallBanner from "./components/PWAInstallBanner";
import PushNotificationPrompt from "./components/PushNotificationPrompt";
import { LanguageProvider, LanguageSelector, useI18n } from "./lib/i18n";
import { Menu, X, User, Headphones, Truck, ChevronRight, CheckCircle } from "lucide-react";

const LOGO = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

// ─── Hook: تطبيق ألوان الموقع الديناميكية كـ CSS variables ───────────────────
function useColorTheme() {
  const settings = useQuery(api.appSettings.getMap);

  const colors = useMemo(() => {
    if (!settings) return null;
    return {
      primary:   settings.color_primary ?? null,
      secondary: settings.color_secondary ?? null,
      accent:    settings.color_accent ?? null,
    };
  }, [settings]);

  useEffect(() => {
    if (!colors) return;
    const root = document.documentElement;
    if (colors.primary)   root.style.setProperty("--color-primary",   colors.primary);
    if (colors.secondary) root.style.setProperty("--color-secondary", colors.secondary);
    if (colors.accent)    root.style.setProperty("--color-accent",    colors.accent);
  }, [colors]);
}

export type Page =
  | { name: "home" }
  | { name: "package"; id: Id<"packages"> }
  | { name: "bookings" }
  | { name: "booking-detail"; bookingId: Id<"bookings"> }
  | { name: "profile" }
  | { name: "wallet" }
  | { name: "office-dashboard" }
  | { name: "driver-dashboard" }
  | { name: "admin" }
  | { name: "quran" }
  | { name: "pilgrim-guide" }
  | { name: "adhkar" }
  | { name: "umrah-map" }
  | { name: "prayer-times" }
  | { name: "signin" }
  | { name: "forgot-password" }
  | { name: "payment"; bookingId: Id<"bookings"> }
  | { name: "trip-tracking"; tripId?: string }
  | { name: "public-tracking"; shareToken: string }
  | { name: "support" }
  | { name: "about" }
  | { name: "terms" }
  | { name: "privacy" }
  | { name: "passenger-manifest"; packageId: Id<"packages"> }
  | { name: "haramain-live" }
  | { name: "driver-profile"; driverId: Id<"drivers"> }
  | { name: "driver-verify"; driverCode: string };

// ── Hook: مراقبة الإشعارات وإرسال Push عند تغيير حالة الحجز ──
function useTripPushWatcher(
  notify: (p: any) => void,
  isGranted: boolean,
  navigate: (p: Page) => void
) {
  const myTrip = useQuery(api.trips.myActiveTripFull);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!myTrip || !isGranted) return;
    const curr = myTrip.status;
    const prev = prevStatusRef.current;

    if (prev === null) { prevStatusRef.current = curr; return; }
    if (prev === curr)  return;
    prevStatusRef.current = curr;

    if (curr === "driver_assigned") {
      notify({ type: "driver_assigned", body: "تم تعيين سائق لرحلتك — اضغط لعرض التفاصيل", url: "/?page=trip-tracking", requireInteraction: true });
    } else if (curr === "driver_accepted") {
      notify({ type: "driver_accepted", body: "السائق قبل الرحلة وسينطلق في الموعد المحدد", url: "/?page=trip-tracking" });
    } else if (curr === "in_progress") {
      notify({ type: "trip_started", body: "رحلتك انطلقت! اضغط لمتابعة موقع الحافلة", url: "/?page=trip-tracking", requireInteraction: true });
    } else if (curr === "completed") {
      notify({ type: "trip_completed", body: "وصلتم بسلامة! تقبّل الله منكم صالح الأعمال", url: "/?page=bookings", requireInteraction: true });
    }
  }, [myTrip?.status, isGranted, notify]);
}

function AuthenticatedApp({ page, navigate, goBack, canGoBack, menuOpen, setMenuOpen }: {
  page: Page;
  navigate: (p: Page) => void;
  goBack: () => void;
  canGoBack: boolean;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  const user          = useQuery(api.auth.loggedInUser);
  const emailVerified = useQuery(api.otp.isEmailVerified);
  const { dir } = useI18n();
  const [skipVerification, setSkipVerification] = useState(false);

  const attendanceRef = new URLSearchParams(window.location.search).get("ref");
  const isAttendanceLink = new URLSearchParams(window.location.search).get("attendance") === "1" && attendanceRef;

  if (isAttendanceLink) {
    return <AttendanceLinkPage bookingReference={attendanceRef} navigate={navigate} />;
  }

  // ── مراقبة الرحلة وإرسال Push Notifications للمعتمرين ──
  const {
    notify: pushNotify,
    isGranted: pushGranted,
    showPrompt: showPushPrompt,
    requestPermission: requestPushPermission,
    promptForPermission,
    dismissPrompt: dismissPushPrompt,
  } = usePushNotifications();
  useTripPushWatcher(pushNotify, pushGranted, navigate);

  useEffect(() => {
    if ((user as any)?.accountType !== "pilgrim") return;
    const timer = window.setTimeout(() => promptForPermission(), 2500);
    return () => window.clearTimeout(timer);
  }, [(user as any)?.accountType, promptForPermission]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [page.name]);

  if (user === undefined || emailVerified === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-emerald-300 text-sm">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  if (user && !(user as any).isAdmin && user.email && emailVerified === false && !skipVerification) {
    return (
      <EmailVerificationPage
        onVerified={() => { window.location.reload(); }}
        onBack={() => {
          setSkipVerification(true);
          navigate({ name: "home" });
        }}
      />
    );
  }

  if (user && !(user as any).accountTypeSet) {
    return <AccountTypeSelectionPage onComplete={() => navigate(page)} />;
  }

  // ── السائق: لوحة تحكم مخصصة بدون navbar/footer ──
  if ((user as any)?.accountType === "driver" && !["support", "privacy", "terms"].includes(page.name)) {
    return (
      <>
        <DriverDashboard navigate={navigate} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" dir={dir}>
      {page.name !== "quran" && <AnnouncementBanner />}
      {page.name !== "quran" && <Navbar navigate={navigate} page={page} menuOpen={menuOpen} setMenuOpen={setMenuOpen} goBack={goBack} canGoBack={canGoBack} />}

      {skipVerification && user && !(user as any).isAdmin && user.email && emailVerified === false && (
        <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-semibold" dir="rtl">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>بريدك الإلكتروني غير مؤكد — بعض الميزات قد تكون محدودة</span>
          </div>
          <button
            onClick={() => setSkipVerification(false)}
            className="flex-shrink-0 bg-white text-amber-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors"
          >
            تأكيد الآن
          </button>
        </div>
      )}

      <main className="flex-1">
        {page.name === "home"             && <HomePage navigate={navigate} />}
        {page.name === "package"          && <PackageDetailPage packageId={page.id} navigate={navigate} />}
        {page.name === "quran"            && <QuranPage navigate={navigate} />}
        {page.name === "pilgrim-guide"    && <PilgrimGuidePage navigate={navigate} />}
        {page.name === "adhkar"           && <AdhkarPage navigate={navigate} />}
        {page.name === "umrah-map"        && <UmrahMapPage navigate={navigate} />}
        {page.name === "bookings"         && <BookingsPage navigate={navigate} />}
        {page.name === "booking-detail"      && <BookingDetailPage bookingId={page.bookingId} navigate={navigate} />}
        {page.name === "passenger-manifest"  && <PassengerManifestPage packageId={page.packageId} navigate={navigate} />}
        {page.name === "profile"          && <ProfilePage navigate={navigate} />}
        {page.name === "wallet"           && <WalletPage navigate={navigate} />}
        {page.name === "office-dashboard"  && <OfficeDashboard navigate={navigate} />}
        {page.name === "driver-dashboard" && <DriverDashboard navigate={navigate} />}
        {page.name === "admin"            && <AdminDashboard navigate={navigate} />}
        {page.name === "payment"          && <PaymentPage bookingId={page.bookingId} navigate={navigate} />}
        {page.name === "trip-tracking"    && <TripTrackingPage navigate={navigate} tripId={page.tripId} />}
        {page.name === "public-tracking"  && <PublicTripTrackingPage shareToken={page.shareToken} navigate={navigate} />}
        {page.name === "prayer-times"     && <PrayerTimesPage navigate={navigate} />}
        {page.name === "support"          && <SupportPage navigate={navigate} />}
        {page.name === "about"            && <AboutPage navigate={navigate} />}
        {page.name === "terms"            && <TermsPage navigate={navigate} />}
        {page.name === "privacy"          && <PrivacyPolicyPage navigate={navigate} />}
        {page.name === "haramain-live"    && <HaramainLivePage navigate={navigate} />}
        {page.name === "driver-profile"   && <DriverPublicProfilePage driverId={page.driverId} navigate={navigate} />}
        {page.name === "driver-verify"    && <DriverVerifyPage driverCode={page.driverCode} navigate={navigate} />}
        {page.name === "signin"           && <SignInPage navigate={navigate} />}
        {page.name === "forgot-password"  && <ForgotPasswordPage navigate={navigate} />}
      </main>
      {page.name !== "quran" && <Footer navigate={navigate} />}
      {page.name !== "quran" && <FloatingQuranBtn navigate={navigate} />}
      {(user as any)?.accountType === "pilgrim" && page.name !== "support" && page.name !== "admin" && page.name !== "office-dashboard" && (
        <FloatingSupportBtn navigate={navigate} />
      )}
      {(user as any)?.accountType === "pilgrim" && page.name !== "admin" && page.name !== "office-dashboard" && (
        <AIAssistant navigate={navigate} />
      )}
      <PWAInstallBanner />
      {showPushPrompt && (
        <PushNotificationPrompt
          onAllow={async () => {
            const granted = await requestPushPermission();
            if (granted) dismissPushPrompt();
          }}
          onDismiss={dismissPushPrompt}
        />
      )}
      <Toaster position="top-center" richColors />
    </div>
  );
}

function AuthRedirect({ page, navigate }: { page: Page; navigate: (p: Page) => void }) {
  useEffect(() => {
    const authOnlyPages = ["signin", "bookings", "profile", "wallet", "office-dashboard", "driver-dashboard", "admin", "payment", "booking-detail"];
    if (authOnlyPages.includes(page.name)) {
      navigate({ name: "home" });
    }
  }, []);
  return null;
}

// الصفحات الجذرية التي لا تحتاج زر رجوع
function AttendanceLinkPage({
  bookingReference,
  navigate,
}: {
  bookingReference: string;
  navigate: (p: Page) => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-teal-900 flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-emerald-700" />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">رمز حضور صحيح</h1>
        <p className="text-sm text-gray-500 mb-4">رقم الحجز المقروء من QR</p>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-3 font-mono text-2xl font-black text-emerald-700 tracking-widest mb-5">
          {bookingReference}
        </div>
        <p className="text-sm text-gray-600 leading-7 mb-5">
          لتسجيل الحضور، افتح حساب السائق واضغط مسح QR التذكرة. ماسح السائق سيقرأ هذا الرمز ويسجل حضور المعتمر تلقائيًا.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              window.history.replaceState({}, "", window.location.pathname);
              navigate({ name: "driver-dashboard" });
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-3 font-bold"
          >
            فتح لوحة السائق
          </button>
          <button
            onClick={() => {
              window.history.replaceState({}, "", window.location.pathname);
              navigate({ name: "home" });
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 font-bold"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}

const ROOT_PAGES = new Set(["home", "office-dashboard", "driver-dashboard", "admin"]);
const QUERY_PAGE_ROUTES: Partial<Record<string, Page>> = {
  home: { name: "home" },
  signin: { name: "signin" },
  bookings: { name: "bookings" },
  profile: { name: "profile" },
  wallet: { name: "wallet" },
  quran: { name: "quran" },
  "pilgrim-guide": { name: "pilgrim-guide" },
  adhkar: { name: "adhkar" },
  "umrah-map": { name: "umrah-map" },
  "prayer-times": { name: "prayer-times" },
  "haramain-live": { name: "haramain-live" },
  support: { name: "support" },
  about: { name: "about" },
  terms: { name: "terms" },
  privacy: { name: "privacy" },
  "trip-tracking": { name: "trip-tracking" },
  "office-dashboard": { name: "office-dashboard" },
  "driver-dashboard": { name: "driver-dashboard" },
  admin: { name: "admin" },
};

function AppShell() {
  const { dir } = useI18n();
  useColorTheme(); // ← تطبيق الألوان الديناميكية من لوحة الأدمن

  const [page, setPage] = useState<Page>(() => {
    const path   = window.location.pathname;
    const search = window.location.search;

    // /verify/{driverCode} — صفحة التحقق الرسمية (الرابط الذي يُولَّد في الـ QR)
    const verifyMatch = path.match(/^\/verify\/([A-Z0-9\-]+)$/i);
    if (verifyMatch) return { name: "driver-verify", driverCode: verifyMatch[1] };

    // /driver-profile?id={driverId} — صفحة الملف العام للسائق
    if (path.startsWith("/driver-profile")) {
      const params = new URLSearchParams(search);
      const id = params.get("id");
      if (id) return { name: "driver-profile", driverId: id as Id<"drivers"> };
    }

    // ?track={shareToken} — صفحة تتبع الرحلة العامة (للعائلة بدون تسجيل دخول)
    const params = new URLSearchParams(search);
    const trackToken = params.get("track");
    if (trackToken) return { name: "public-tracking", shareToken: trackToken };

    const pageParam = params.get("page");
    if (pageParam && QUERY_PAGE_ROUTES[pageParam]) return QUERY_PAGE_ROUTES[pageParam]!;

    return { name: "home" };
  });

  // ── تاريخ التنقل (stack) ──
  const [navHistory, setNavHistory] = useState<Page[]>([]);
  const canGoBack = navHistory.length > 0 && !ROOT_PAGES.has(page.name);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith("/verify/")) return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("attendance") === "1" && params.get("ref")) return false;
    const seen = sessionStorage.getItem("splashSeen");
    return !seen;
  });

  const handleSplashDone = useCallback(() => {
    sessionStorage.setItem("splashSeen", "1");
    setShowSplash(false);
  }, []);

  const navigate = useCallback((p: Page) => {
    setPage(prev => {
      if (prev.name !== p.name) {
        setNavHistory(h => [...h, prev]);
      }
      return p;
    });
    setMenuOpen(false);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const goBack = useCallback(() => {
    setNavHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPage(prev);
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      return h.slice(0, -1);
    });
    setMenuOpen(false);
  }, []);

  const attendanceRef = new URLSearchParams(window.location.search).get("ref");
  const isAttendanceLink = new URLSearchParams(window.location.search).get("attendance") === "1" && attendanceRef;

  if (isAttendanceLink) {
    return <AttendanceLinkPage bookingReference={attendanceRef} navigate={navigate} />;
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <Authenticated>
        <AuthRedirect page={page} navigate={navigate} />
        <AuthenticatedApp page={page} navigate={navigate} goBack={goBack} canGoBack={canGoBack} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen flex flex-col" dir={dir}>
          {page.name !== "quran" && <AnnouncementBanner />}
          {page.name !== "quran" && <Navbar navigate={navigate} page={page} menuOpen={menuOpen} setMenuOpen={setMenuOpen} goBack={goBack} canGoBack={canGoBack} />}
          <main className="flex-1">
            {page.name === "home"      && <HomePage navigate={navigate} />}
            {page.name === "package"   && <PackageDetailPage packageId={page.id} navigate={navigate} />}
            {page.name === "quran"     && <QuranPage navigate={navigate} />}
            {page.name === "pilgrim-guide" && <PilgrimGuidePage navigate={navigate} />}
            {page.name === "adhkar"    && <AdhkarPage navigate={navigate} />}
            {page.name === "umrah-map" && <UmrahMapPage navigate={navigate} />}
            {page.name === "prayer-times"  && <PrayerTimesPage navigate={navigate} />}
            {page.name === "about"         && <AboutPage navigate={navigate} />}
            {page.name === "haramain-live" && <HaramainLivePage navigate={navigate} />}
            {page.name === "support"       && <SupportPage navigate={navigate} />}
            {page.name === "terms"         && <TermsPage navigate={navigate} />}
            {page.name === "privacy"       && <PrivacyPolicyPage navigate={navigate} />}
            {page.name === "driver-profile"  && <DriverPublicProfilePage driverId={page.driverId} navigate={navigate} />}
            {page.name === "driver-verify"   && <DriverVerifyPage driverCode={page.driverCode} navigate={navigate} />}
            {page.name === "public-tracking" && <PublicTripTrackingPage shareToken={page.shareToken} navigate={navigate} />}
            {page.name === "signin"           && <SignInPage navigate={navigate} />}
            {page.name === "forgot-password"  && <ForgotPasswordPage navigate={navigate} />}
            {(page.name === "bookings" || page.name === "profile" || page.name === "wallet" ||
              page.name === "office-dashboard" || page.name === "driver-dashboard" || page.name === "admin" ||
              page.name === "payment" || page.name === "booking-detail") && <SignInPage navigate={navigate} />}
          </main>
          {page.name !== "quran" && <Footer navigate={navigate} />}
          {page.name !== "quran" && <FloatingQuranBtn navigate={navigate} />}
          <Toaster position="top-center" richColors />
        </div>
      </Unauthenticated>
    </>
  );
}

// خريطة أسماء الصفحات بالعربية
export default function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}

const PAGE_LABELS: Partial<Record<Page["name"], string>> = {
  home: "الرئيسية",
  package: "تفاصيل البرنامج",
  bookings: "حجوزاتي",
  "booking-detail": "تفاصيل الحجز",
  profile: "ملفي الشخصي",
  wallet: "محفظتي",
  "office-dashboard": "لوحة المكتب",
  "driver-dashboard": "لوحة السائق",
  admin: "لوحة الإدارة",
  quran: "المصحف الشريف",
  "pilgrim-guide": "دليل المعتمر",
  adhkar: "الأذكار والأدعية",
  "umrah-map": "خريطة العمرة",
  "prayer-times": "مواقيت الصلاة",
  signin: "تسجيل الدخول",
  "forgot-password": "استعادة كلمة المرور",
  payment: "الدفع",
  "trip-tracking": "تتبع الرحلة",
  "public-tracking": "تتبع الرحلة",
  support: "الدعم والمساعدة",
  about: "عن المنصة",
  terms: "الشروط والأحكام",
  privacy: "سياسة الخصوصية",
  "passenger-manifest": "كشف الركاب",
  "haramain-live": "بث الحرمين",
  "driver-profile": "بطاقة السائق",
  "driver-verify": "التحقق من السائق",
};

function Navbar({ navigate, page, menuOpen, setMenuOpen, goBack, canGoBack }: {
  navigate: (p: Page) => void;
  page: Page;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  goBack: () => void;
  canGoBack: boolean;
}) {
  const user = useQuery(api.auth.loggedInUser);
  const { t } = useI18n();
  const pageLabel = PAGE_LABELS[page.name] ?? t("nav.back");

  return (
    <header className={`smart-navbar sticky top-0 z-[1000] border-b backdrop-blur-xl transition-all duration-300 ${menuOpen ? "smart-navbar-open" : ""}`}>
      {menuOpen && (
        <div className="smart-menu-bus 2xl:hidden" aria-hidden="true">
          <div className="smart-menu-bus__body">
            <span />
            <span />
            <span />
            <img src={LOGO} alt="" className="smart-menu-bus__logo" aria-hidden="true" />
          </div>
          <div className="smart-menu-bus__wheels">
            <i />
            <i />
          </div>
        </div>
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">

        {/* ── زر الرجوع + الشعار ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canGoBack ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-white font-semibold text-sm shadow-lg shadow-emerald-950/10 transition-all hover:bg-white/15 group"
              title={t("nav.back")}
            >
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">{pageLabel || t("nav.back")}</span>
            </button>
          ) : (
            <button onClick={() => navigate({ name: "home" })} className="flex-shrink-0">
              <img src={LOGO} alt="المسار الذكي" className="h-10 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
            </button>
          )}
          {/* الشعار يظهر دائماً بجانب زر الرجوع على الشاشات الكبيرة */}
          {canGoBack && (
            <button onClick={() => navigate({ name: "home" })} className="hidden md:block flex-shrink-0">
              <img src={LOGO} alt="المسار الذكي" className="h-9 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
            </button>
          )}
        </div>

        <nav className="hidden 2xl:flex flex-1 min-w-0 items-center justify-center gap-0.5">
          <NavBtn active={page.name === "home"}      onClick={() => navigate({ name: "home" })}>{t("nav.home")}</NavBtn>
          <NavBtn active={page.name === "about"}     onClick={() => navigate({ name: "about" })}>{t("nav.about")}</NavBtn>
          <NavBtn active={page.name === "quran"}     onClick={() => navigate({ name: "quran" })}>{t("nav.quran")}</NavBtn>
          <NavBtn active={page.name === "pilgrim-guide"} onClick={() => navigate({ name: "pilgrim-guide" })}>{t("nav.guide")}</NavBtn>
          <NavBtn active={page.name === "adhkar"}    onClick={() => navigate({ name: "adhkar" })}>{t("nav.adhkar")}</NavBtn>
          <NavBtn active={page.name === "umrah-map"} onClick={() => navigate({ name: "umrah-map" })}>{t("nav.umrahMap")}</NavBtn>
          <NavBtn active={page.name === "prayer-times"} onClick={() => navigate({ name: "prayer-times" })}>{t("nav.prayerTimes")}</NavBtn>
          <NavBtn active={page.name === "haramain-live"} onClick={() => navigate({ name: "haramain-live" })}>{t("nav.haramainLive")}</NavBtn>
          <Authenticated>
            {(user as any)?.accountType === "pilgrim" && (
              <>
                <NavBtn active={page.name === "bookings"} onClick={() => navigate({ name: "bookings" })}>{t("nav.bookings")}</NavBtn>
                <SupportNavBtn active={page.name === "support"} onClick={() => navigate({ name: "support" })} />
              </>
            )}
            {(user?.accountType === "office" || (user as any)?.isOfficeOwner) && (
              <NavBtn active={page.name === "office-dashboard"} onClick={() => navigate({ name: "office-dashboard" })}>{t("nav.office")}</NavBtn>
            )}
            {(user as any)?.accountType === "driver" && (
              <NavBtn active={page.name === "driver-dashboard"} onClick={() => navigate({ name: "driver-dashboard" })}>
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />{t("nav.driver")}</span>
              </NavBtn>
            )}
            {(user as any)?.isAdmin && (
              <NavBtn active={page.name === "admin"} onClick={() => navigate({ name: "admin" })}>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{t("nav.admin")}
                </span>
              </NavBtn>
            )}
          </Authenticated>
        </nav>

        <div className="flex items-center gap-2">
          <Authenticated>
            <NotificationBell navigate={navigate} />
            <button
              onClick={() => navigate({ name: "profile" })}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                page.name === "profile" ? "border-white/30 bg-white text-emerald-900 shadow-sm" : "border-white/10 bg-white/5 text-white/75 hover:text-white hover:bg-white/10"
              }`}
            >
              <User className="w-4 h-4" /> {t("nav.profile")}
            </button>
            <SignOutButton />
          </Authenticated>
          <Unauthenticated>
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <button
              onClick={() => navigate({ name: "signin" })}
              className="hidden md:inline-flex px-5 py-2 rounded-xl border border-amber-200/40 bg-amber-300/90 text-emerald-950 font-bold text-sm shadow-lg shadow-amber-950/10 transition-all hover:bg-amber-200"
            >
              {t("nav.signin")}
            </button>
          </Unauthenticated>
          <button
            className="2xl:hidden p-2.5 rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg shadow-emerald-950/15 transition-all hover:bg-white/15"
            onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="smart-mobile-menu 2xl:hidden border-t border-white/10 bg-emerald-950/75 px-4 py-3 space-y-1 shadow-2xl shadow-emerald-950/20 backdrop-blur-2xl">
          <Unauthenticated>
            <div className="pb-2">
              <LanguageSelector compact />
            </div>
          </Unauthenticated>
          {[
            { label: t("nav.home"),         p: { name: "home" } as Page },
            { label: t("nav.about"),        p: { name: "about" } as Page },
            { label: t("nav.quran"),        p: { name: "quran" } as Page },
            { label: t("nav.guide"),        p: { name: "pilgrim-guide" } as Page },
            { label: t("nav.adhkar"),       p: { name: "adhkar" } as Page },
            { label: t("nav.umrahMap"),     p: { name: "umrah-map" } as Page },
            { label: t("nav.prayerTimes"),  p: { name: "prayer-times" } as Page },
            { label: t("nav.haramainLive"), p: { name: "haramain-live" } as Page },
          ].map((item) => (
            <MobileNavBtn key={item.label} onClick={() => navigate(item.p)}>{item.label}</MobileNavBtn>
          ))}
          <Authenticated>
            {(user as any)?.accountType === "pilgrim" && (
              <>
                <MobileNavBtn onClick={() => navigate({ name: "bookings" })}>{t("nav.bookings")}</MobileNavBtn>
                <MobileNavBtn onClick={() => navigate({ name: "support" })}>{t("nav.support")}</MobileNavBtn>
              </>
            )}
            <MobileNavBtn onClick={() => navigate({ name: "profile" })}>{t("nav.profile")}</MobileNavBtn>
            {(user?.accountType === "office" || (user as any)?.isOfficeOwner) && (
              <MobileNavBtn onClick={() => navigate({ name: "office-dashboard" })}>{t("nav.office")}</MobileNavBtn>
            )}
            {(user as any)?.accountType === "driver" && (
              <MobileNavBtn onClick={() => navigate({ name: "driver-dashboard" })}>🚌 {t("nav.driver")}</MobileNavBtn>
            )}
            {(user as any)?.isAdmin && (
              <MobileNavBtn onClick={() => navigate({ name: "admin" })}>{t("nav.admin")}</MobileNavBtn>
            )}
          </Authenticated>
          <Unauthenticated>
            <button
              onClick={() => navigate({ name: "signin" })}
              className="smart-mobile-menu-item w-full mt-2 py-3 rounded-xl border border-amber-200/40 bg-amber-300/90 text-emerald-950 font-bold text-sm shadow-lg shadow-amber-950/10"
            >
              {t("nav.signin")}
            </button>
          </Unauthenticated>
        </div>
      )}
    </header>
  );
}

function NavBtn({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`max-w-[9.5rem] whitespace-nowrap rounded-xl px-2.5 py-2 text-xs font-semibold leading-none transition-all 2xl:px-3 2xl:text-sm ${
        active ? "bg-white text-emerald-900 shadow-sm" : "text-white/72 hover:text-white hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="smart-mobile-menu-item w-full text-start px-4 py-3 rounded-xl text-white/85 font-medium transition-colors hover:bg-white/10 hover:text-white">
      {children}
    </button>
  );
}

function SupportNavBtn({ active, onClick }: { active: boolean; onClick: () => void }) {
  const chat = useQuery(api.support.getMyChat);
  const unread = chat?.unreadByUser ?? 0;
  const { t } = useI18n();

  return (
    <button
      onClick={onClick}
      className={`relative px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
        active ? "bg-white text-emerald-900 shadow-sm" : "text-white/72 hover:text-white hover:bg-white/10"
      }`}
      >
      <Headphones className="w-4 h-4" />
      {t("nav.support")}
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

function SignInPage({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen flex" dir="rtl">

      {/* ── الجانب الأيمن — صورة + معلومات (ديسكتوب فقط) ── */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://polished-pony-114.convex.cloud/api/storage/31b82038-e2ea-4132-926d-f1cd94bdc2e4"
          alt="مكة المكرمة"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/85 via-emerald-900/65 to-emerald-950/90" />

        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* الشعار — شفاف بلون الشعار */}
          <img
            src={LOGO}
            alt="المسار الذكي"
            className="h-14 w-auto drop-shadow-xl"
            style={{ mixBlendMode: "screen", filter: "brightness(1.1) saturate(1.2)" }}
          />

          {/* النص الرئيسي */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-0.5 bg-emerald-400 rounded-full" />
              <span className="text-emerald-300 text-xs font-semibold tracking-widest">المسار الذكي للعمرة</span>
            </div>
            <h2 className="text-4xl font-black text-white leading-snug mb-4">
              رحلتك إلى<br />
              <span className="text-emerald-300">بيت الله الحرام</span><br />
              تبدأ من هنا
            </h2>
            <p className="text-emerald-100/70 text-sm leading-relaxed max-w-xs">
              منصة متكاملة تربط المعتمرين بأفضل مكاتب السفر المعتمدة وتوفر تتبعاً مباشراً لرحلتك بكل سهولة وأمان.
            </p>

            {/* إحصائيات */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { num: "+500", label: "معتمر موثوق" },
                { num: "+50",  label: "مكتب معتمد" },
                { num: "24/7", label: "دعم متواصل" },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                  <p className="text-xl font-black text-emerald-300">{s.num}</p>
                  <p className="text-xs text-white/60 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* مميزات */}
            <div className="mt-6 space-y-2.5">
              {[
                "مقارنة أسعار الباقات بسهولة",
                "تتبع الحافلة مباشرة على الخريطة",
                "دفع آمن ومحفظة رقمية",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-emerald-100/80">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-emerald-500/50 text-xs">© 2025 المسار الذكي — جميع الحقوق محفوظة</p>
        </div>
      </div>

      {/* ── الجانب الأيسر — نموذج تسجيل الدخول ── */}
      <div className="w-full lg:w-1/2 relative flex flex-col min-h-screen">

        {/* خلفية الجوال */}
        <div className="lg:hidden absolute inset-0">
          <img
            src="https://polished-pony-114.convex.cloud/api/storage/31b82038-e2ea-4132-926d-f1cd94bdc2e4"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/90 via-emerald-900/85 to-emerald-950/95" />
        </div>

        {/* خلفية الديسكتوب */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950" />

        {/* شريط علوي للجوال */}
        <div className="lg:hidden relative z-10 flex items-center justify-between px-5 pt-6">
          <img src={LOGO} alt="المسار الذكي" className="h-10 w-auto drop-shadow-lg" style={{ mixBlendMode: "screen", filter: "brightness(1.15) saturate(1.3)" }} />
          <button
            onClick={() => navigate({ name: "home" })}
            className="text-xs text-emerald-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            الرئيسية
          </button>
        </div>

        {/* المحتوى المركزي */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-sm">

            {/* عنوان الجوال */}
            <div className="lg:hidden text-center mb-7">
              <h1 className="text-2xl font-black text-white">أهلاً بك في المسار الذكي</h1>
              <p className="text-emerald-300 text-sm mt-1">سجّل دخولك أو أنشئ حساباً جديداً</p>
            </div>

            {/* عنوان الديسكتوب */}
            <div className="hidden lg:block mb-7">
              <button
                onClick={() => navigate({ name: "home" })}
                className="flex items-center gap-1.5 text-xs text-emerald-100/60 hover:text-white transition-colors mb-5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة للرئيسية
              </button>
              <h1 className="text-2xl font-black text-gray-900 mb-1">أهلاً بك في المسار الذكي</h1>
              <p className="text-gray-500 text-sm">سجّل دخولك أو أنشئ حساباً جديداً للبدء</p>
            </div>

            {/* نموذج تسجيل الدخول */}
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-transparent shadow-2xl shadow-emerald-950/30">
              <SignInForm />
              <div className="space-y-2 border-t border-white/10 bg-white/8 px-6 pb-5 pt-3 backdrop-blur-xl">
                <button
                  onClick={() => navigate({ name: "forgot-password" })}
                  className="w-full flex items-center justify-center gap-2 text-sm text-emerald-50/80 hover:text-white font-semibold transition-colors py-1.5 rounded-lg hover:bg-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  نسيت كلمة المرور؟
                </button>
                <button
                  onClick={() => navigate({ name: "privacy" })}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-50/45 hover:text-emerald-50/75 transition-colors py-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  سياسة الخصوصية وحماية البيانات
                </button>
              </div>
            </div>

            {/* زر العودة للجوال */}
            <button
              onClick={() => navigate({ name: "home" })}
              className="lg:hidden mt-5 w-full text-center text-sm text-emerald-300 hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              العودة للرئيسية
            </button>

            <p className="text-center text-xs text-gray-400 lg:text-gray-400 text-emerald-500/50 mt-5">
              © 2025 المسار الذكي
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer({ navigate }: { navigate: (p: Page) => void }) {
  const settings = useQuery(api.appSettings.getMap);
  const { t } = useI18n();

  const phone     = settings?.contact_phone   ?? "920000000";
  const email     = settings?.contact_email   ?? "info@almasaraldaki.sa";
  const address   = settings?.contact_address ?? "المملكة العربية السعودية";
  const footer    = settings?.footer_text     ?? "منصة متخصصة في حجز برامج العمرة داخل المملكة العربية السعودية.";
  const twitter   = settings?.twitter   ?? "";
  const instagram = settings?.instagram ?? "";
  const facebook  = settings?.facebook  ?? "";
  const tiktok    = settings?.tiktok    ?? "";
  const whatsapp  = settings?.whatsapp  ?? "";

  const hasSocial = twitter || instagram || facebook || tiktok || whatsapp;

  return (
    <footer className="bg-emerald-950 text-white pt-14 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <button onClick={() => navigate({ name: "home" })} className="mb-4 block">
              <img src={LOGO} alt="المسار الذكي" className="h-14 w-auto object-contain" style={{ mixBlendMode: "screen" }} />
            </button>
            <p className="text-emerald-300 text-sm leading-relaxed mb-5">{footer}</p>

            {/* ── أيقونات السوشيال ميديا الرسمية ── */}
            {hasSocial && (
              <div className="flex flex-wrap gap-2.5">
                {facebook && (
                  <a href={facebook} target="_blank" rel="noopener noreferrer"
                    title="فيسبوك"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
                    style={{ background: "#1877F2" }}>
                    <FacebookIcon />
                  </a>
                )}
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer"
                    title="إنستغرام"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
                    style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                    <InstagramIcon />
                  </a>
                )}
                {twitter && (
                  <a href={twitter} target="_blank" rel="noopener noreferrer"
                    title="منصة X"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
                    style={{ background: "#000000" }}>
                    <XIcon />
                  </a>
                )}
                {tiktok && (
                  <a href={tiktok} target="_blank" rel="noopener noreferrer"
                    title="تيك توك"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
                    style={{ background: "#010101" }}>
                    <TikTokIcon />
                  </a>
                )}
                {whatsapp && (
                  <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    title="واتساب"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 hover:shadow-lg"
                    style={{ background: "#25D366" }}>
                    <WhatsAppIcon />
                  </a>
                )}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-amber-400 mb-4">{t("footer.booking")}</h4>
            <ul className="space-y-2 text-emerald-300 text-sm">
              <li><button onClick={() => navigate({ name: "home" })}             className="hover:text-white transition-colors">{t("footer.availablePrograms")}</button></li>
              <li><button onClick={() => navigate({ name: "about" })}            className="hover:text-white transition-colors">{t("nav.about")}</button></li>
              <li><button onClick={() => navigate({ name: "bookings" })}         className="hover:text-white transition-colors">{t("nav.bookings")}</button></li>
              <li><button onClick={() => navigate({ name: "profile" })}          className="hover:text-white transition-colors">{t("nav.profile")}</button></li>
              <li><button onClick={() => navigate({ name: "office-dashboard" })} className="hover:text-white transition-colors">{t("nav.office")}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-amber-400 mb-4">{t("footer.services")}</h4>
            <ul className="space-y-2 text-emerald-300 text-sm">
              <li><button onClick={() => navigate({ name: "quran" })}        className="hover:text-white transition-colors">{t("nav.quran")}</button></li>
              <li><button onClick={() => navigate({ name: "pilgrim-guide" })} className="hover:text-white transition-colors">{t("nav.guide")}</button></li>
              <li><button onClick={() => navigate({ name: "adhkar" })}       className="hover:text-white transition-colors">{t("nav.adhkar")}</button></li>
              <li><button onClick={() => navigate({ name: "umrah-map" })}    className="hover:text-white transition-colors">{t("nav.umrahMap")}</button></li>
              <li><button onClick={() => navigate({ name: "prayer-times" })} className="hover:text-white transition-colors">{t("nav.prayerTimes")}</button></li>
              <li><button onClick={() => navigate({ name: "haramain-live" })} className="hover:text-white transition-colors">{t("nav.haramainLive")}</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-amber-400 mb-4">{t("footer.contact")}</h4>
            <ul className="space-y-2 text-emerald-300 text-sm">
              <li className="flex items-center gap-2">📞 {phone}</li>
              <li className="flex items-center gap-2">📧 {email}</li>
              <li className="flex items-center gap-2">📍 {address}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-emerald-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-500 text-sm">
          <span>{t("footer.rights")}</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ name: "terms" })}
              className="hover:text-emerald-300 transition-colors"
            >
              {t("footer.terms")}
            </button>
            <span className="text-emerald-800">|</span>
            <button
              onClick={() => navigate({ name: "privacy" })}
              className="hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              🔒 {t("footer.privacy")}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── أيقونات السوشيال ميديا الرسمية (SVG) ──────────────────────────────────

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
