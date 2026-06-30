import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  offices: defineTable({
    name: v.string(),
    description: v.string(),
    city: v.string(),
    phone: v.string(),
    email: v.string(),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    isVerified: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    userId: v.id("users"),
    logoStorageId: v.optional(v.id("_storage")),
    logoUrl: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    commercialRegister: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    commissionRate: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  packages: defineTable({
    officeId: v.id("offices"),
    title: v.string(),
    description: v.string(),
    duration: v.number(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    departureCity: v.string(),
    departureDate: v.string(),
    returnDate: v.string(),
    availableSeats: v.number(),
    totalSeats: v.number(),
    includes: v.array(v.string()),
    excludes: v.optional(v.array(v.string())),
    hotelMecca: v.string(),
    hotelMadinah: v.optional(v.string()),
    hotelStars: v.number(),
    packageType: v.string(),
    isActive: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    transportType: v.optional(v.string()),
    roomType: v.optional(v.string()),
  })
    .index("by_office", ["officeId"])
    .index("by_departure_city", ["departureCity"])
    .index("by_package_type", ["packageType"]),

  bookings: defineTable({
    packageId: v.id("packages"),
    officeId: v.id("offices"),
    userId: v.id("users"),
    status: v.string(),
    totalPrice: v.number(),
    adultsCount: v.number(),
    childrenCount: v.optional(v.number()),
    leadPassengerName: v.string(),
    leadPassengerPhone: v.string(),
    leadPassengerIdNumber: v.string(),
    notes: v.optional(v.string()),
    bookingReference: v.string(),
    permitNumber: v.optional(v.string()),
    tripId: v.optional(v.id("trips")),
    commissionRate: v.optional(v.number()),
    commissionAmount: v.optional(v.number()),
    netAmount: v.optional(v.number()),
    paymentMethod: v.optional(v.string()),
    // ── نظام الحضور ──
    attendanceStatus: v.optional(v.string()),   // present | absent
    attendanceAt:     v.optional(v.number()),   // timestamp
    attendanceBy:     v.optional(v.id("users")), // السائق الذي سجّل الحضور
  })
    .index("by_user", ["userId"])
    .index("by_package", ["packageId"])
    .index("by_office", ["officeId"])
    .index("by_status", ["status"])
    .index("by_trip", ["tripId"])
    .index("by_booking_reference", ["bookingReference"]),

  reviews: defineTable({
    packageId: v.id("packages"),
    officeId: v.id("offices"),
    userId: v.id("users"),
    rating: v.number(),
    comment: v.string(),
    bookingId: v.id("bookings"),
  })
    .index("by_package", ["packageId"])
    .index("by_office", ["officeId"])
    .index("by_booking", ["bookingId"]),

  buses: defineTable({
    officeId: v.id("offices"),
    plateNumber: v.string(),
    capacity: v.number(),
    busType: v.optional(v.string()),
    busColor: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    // بيانات السائق الكاملة
    driverName: v.string(),
    driverPhone: v.string(),
    driverIdNumber: v.optional(v.string()),
    driverNationality: v.optional(v.string()),
    driverLicenseNumber: v.optional(v.string()),
    driverLicenseExpiry: v.optional(v.string()),
    // بطاقة التشغيل
    operatingCardNumber: v.optional(v.string()),
    operatingCardExpiry: v.optional(v.string()),
    operatingCardIssuer: v.optional(v.string()),
    // رابط تطبيق السائق
    driverAppLink: v.optional(v.string()),
    driverAppToken: v.optional(v.string()),
  }).index("by_office", ["officeId"]),

  trips: defineTable({
    officeId: v.id("offices"),
    packageId: v.id("packages"),
    busId: v.optional(v.id("buses")),
    driverId: v.optional(v.id("drivers")),   // ← السائق المعيّن من جدول drivers
    supervisorId: v.optional(v.id("users")),
    status: v.string(),                       // scheduled | driver_assigned | driver_accepted | in_progress | completed | cancelled
    driverStatus: v.optional(v.string()),     // pending | accepted | rejected
    departureDate: v.string(),
    currentLat: v.optional(v.number()),
    currentLng: v.optional(v.number()),
    currentSpeed: v.optional(v.number()),
    currentHeading: v.optional(v.number()),   // اتجاه الحركة
    lastLocationUpdate: v.optional(v.number()),
    trackingStartedAt: v.optional(v.number()),
    driverShareLink: v.optional(v.string()),
    driverToken: v.optional(v.string()),
    shareToken: v.optional(v.string()),       // ← رمز مشاركة الرحلة للعائلة (بدون تسجيل دخول)
    notes: v.optional(v.string()),
    passengerCount: v.optional(v.number()),
  })
    .index("by_office", ["officeId"])
    .index("by_package", ["packageId"])
    .index("by_status", ["status"])
    .index("by_driver", ["driverId"])
    .index("by_driver_token", ["driverToken"])
    .index("by_share_token", ["shareToken"]),

  announcements: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.string(),
    isActive: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    priority: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  }),

  companions: defineTable({
    userId: v.id("users"),
    name: v.string(),
    idNumber: v.string(),
    relation: v.string(),
    phone: v.optional(v.string()),
    passportNumber: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    isRead: v.optional(v.boolean()),
    linkId: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  payments: defineTable({
    bookingId: v.id("bookings"),
    userId: v.id("users"),
    officeId: v.id("offices"),
    amount: v.number(),
    method: v.string(),
    status: v.string(),
    transactionId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    cardLast4: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
  })
    .index("by_booking", ["bookingId"])
    .index("by_user", ["userId"])
    .index("by_office", ["officeId"])
    .index("by_status", ["status"]),

  appSettings: defineTable({
    key: v.string(),
    value: v.string(),
    label: v.optional(v.string()),
    type: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  }).index("by_key", ["key"]),

  aiChats: defineTable({
    userId: v.id("users"),
    messages: v.array(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })),
    sessionId: v.string(),
  }).index("by_user", ["userId"]),

  aiSettings: defineTable({
    key: v.string(),
    value: v.string(),
    label: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
  }).index("by_key", ["key"]),

  passwordResetCodes: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
    used: v.optional(v.boolean()),
  }).index("by_email", ["email"]),

  otpCodes: defineTable({
    email:     v.string(),
    code:      v.string(),
    expiresAt: v.number(),
    userId:    v.id("users"),
    used:      v.optional(v.boolean()),
  }).index("by_email", ["email"]),

  whatsappLogs: defineTable({
    bookingId: v.id("bookings"),
    officeId: v.id("offices"),
    userId: v.id("users"),
    phone: v.string(),
    messageType: v.string(),
    messageText: v.string(),
    sentAt: v.number(),
    sentBy: v.id("users"),
  })
    .index("by_booking", ["bookingId"])
    .index("by_office", ["officeId"])
    .index("by_user", ["userId"]),

  // ── جدول سجلات SMS ──
  smsLogs: defineTable({
    bookingId:   v.optional(v.id("bookings")),
    officeId:    v.optional(v.id("offices")),
    userId:      v.optional(v.id("users")),
    phone:       v.string(),
    messageType: v.string(),
    messageText: v.string(),
    status:      v.string(),
    twilioSid:   v.optional(v.string()),
    error:       v.optional(v.string()),
    sentAt:      v.number(),
  })
    .index("by_booking", ["bookingId"])
    .index("by_user",    ["userId"])
    .index("by_status",  ["status"]),

  supportChats: defineTable({
    userId: v.id("users"),
    status: v.string(),
    lastMessageAt: v.optional(v.number()),
    lastMessage: v.optional(v.string()),
    unreadByAdmin: v.optional(v.number()),
    unreadByUser: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  supportMessages: defineTable({
    chatId: v.id("supportChats"),
    senderId: v.id("users"),
    senderName: v.string(),
    isAdmin: v.boolean(),
    text: v.string(),
    isRead: v.optional(v.boolean()),
    sentAt: v.number(),
  })
    .index("by_chat", ["chatId"])
    .index("by_sender", ["senderId"]),

  commissions: defineTable({
    bookingId: v.id("bookings"),
    officeId: v.id("offices"),
    bookingAmount: v.number(),
    commissionRate: v.number(),
    commissionAmount: v.number(),
    netAmount: v.number(),
    status: v.string(),
    settledAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_booking", ["bookingId"])
    .index("by_office", ["officeId"])
    .index("by_status", ["status"]),

  emailLogs: defineTable({
    recipientEmail: v.string(),
    emailType: v.string(),
    subject: v.optional(v.string()),
    status: v.string(),
    bookingId: v.optional(v.id("bookings")),
    userId: v.optional(v.id("users")),
    error: v.optional(v.string()),
    messageId: v.optional(v.string()),
  })
    .index("by_email", ["recipientEmail"])
    .index("by_type", ["emailType"])
    .index("by_status", ["status"])
    .index("by_booking", ["bookingId"]),

  // ── جدول السائقين ──
  drivers: defineTable({
    userId: v.id("users"),
    officeId: v.optional(v.id("offices")),   // المكتب التابع له
    name: v.string(),
    phone: v.string(),
    nationality: v.optional(v.string()),
    residenceType: v.optional(v.string()),   // "citizen" | "resident"
    idNumber: v.optional(v.string()),
    profileImageId: v.optional(v.id("_storage")),      // الصورة الشخصية للسائق
    licenseImageId: v.optional(v.id("_storage")),      // صورة رخصة القيادة (منفصلة عن الصورة الشخصية)
    licenseFileId: v.optional(v.id("_storage")),       // PDF بطاقة السائق
    operatingCardFileId: v.optional(v.id("_storage")), // PDF بطاقة التشغيل
    isActive: v.optional(v.boolean()),
    isApproved: v.optional(v.boolean()),
    adminNotes: v.optional(v.string()),
    // الحافلة المرتبطة
    busId: v.optional(v.id("buses")),
    // بيانات الحافلة المضافة من السائق
    plateNumber: v.optional(v.string()),
    busCapacity: v.optional(v.number()),
    busType: v.optional(v.string()),
    busColor: v.optional(v.string()),
    transportCompanyName: v.optional(v.string()),
    driverCode: v.optional(v.string()),          // كود التحقق الرسمي الفريد
    licenseExpiry: v.optional(v.string()),        // تاريخ انتهاء رخصة القيادة
    licenseStatus: v.optional(v.string()),        // "valid" | "expired" | "suspended"
    driverStatus: v.optional(v.string()),         // "active" | "suspended" | "inactive"
    lastDataUpdate: v.optional(v.number()),       // timestamp آخر تحديث للبيانات
  })
    .index("by_user", ["userId"])
    .index("by_office", ["officeId"])
    .index("by_driver_code", ["driverCode"]),

  // ── جدول معاملات المحفظة ──
  walletTransactions: defineTable({
    userId: v.id("users"),
    type: v.string(),        // "refund" | "withdrawal_request" | "withdrawal_done" | "used"
    amount: v.number(),
    bookingId: v.optional(v.id("bookings")),
    bookingRef: v.optional(v.string()),
    description: v.string(),
    paymentMethod: v.optional(v.string()), // طريقة الدفع الأصلية للاسترداد
    status: v.string(),      // "completed" | "pending" | "rejected"
    adminNote: v.optional(v.string()),
    processedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_booking", ["bookingId"]),
};

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
    isOfficeOwner: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    accountType: v.optional(v.string()),
    accountTypeSet: v.optional(v.boolean()),
    idNumber: v.optional(v.string()),
    passportNumber: v.optional(v.string()),
    city: v.optional(v.string()),
    walletBalance: v.optional(v.number()),
    emailVerified: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  ...applicationTables,
});
