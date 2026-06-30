import { printHtml } from "./printDocument";

const LOGO_URL = "https://polished-pony-114.convex.cloud/api/storage/f11fbc0b-c796-4263-b5e4-16628550211b";

type TaxInvoiceParty = {
  name: string;
  taxNumber?: string | null;
  commercialRegister?: string | null;
  city?: string | null;
};

type TaxInvoiceInput = {
  invoiceNo: string;
  title: string;
  seller: TaxInvoiceParty;
  buyer: TaxInvoiceParty;
  bookingRef: string;
  passengerName: string;
  passengerCount?: number;
  packageTitle: string;
  invoiceDate: number;
  description: string;
  grossAmount: number;
  taxableAmount: number;
  vatAmount: number;
  vatRate: number;
  notes?: string;
};

const money = (value: number) => `${Math.round(value).toLocaleString("ar-SA")} ر.س`;
const safe = (value: unknown) => String(value ?? "—");

export function buildTaxInvoiceHtml(input: TaxInvoiceInput) {
  const printDate = new Date().toLocaleString("ar-SA");
  const invoiceDate = new Date(input.invoiceDate).toLocaleDateString("ar-SA");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${safe(input.title)} - ${safe(input.invoiceNo)}</title>
<style>
  @page{size:A4;margin:10mm}
  *{box-sizing:border-box}
  body{margin:0;background:#f3f4f6;font-family:Tajawal,Arial,sans-serif;color:#111827}
  .wrap{width:190mm;margin:0 auto;background:#fff;border:1px solid #d1d5db;min-height:277mm}
  .hdr{background:#064e3b;color:#fff;padding:18px 22px;display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
  .brand{display:flex;align-items:center;gap:12px}
  .logo{height:46px;width:46px;object-fit:contain;border-radius:12px;background:#ffffff1a;padding:4px}
  .brand-title{font-size:18px;font-weight:900}
  .brand-sub{font-size:11px;color:#a7f3d0;margin-top:3px}
  .doc-title{text-align:left;font-size:18px;font-weight:900}
  .doc-no{text-align:left;font-size:11px;color:#d1fae5;margin-top:4px;font-family:monospace}
  .body{padding:20px 22px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
  .box{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#f9fafb}
  .box h3{margin:0 0 8px;font-size:12px;color:#065f46}
  .line{display:flex;justify-content:space-between;gap:12px;font-size:11px;padding:4px 0;border-bottom:1px dashed #e5e7eb}
  .line:last-child{border-bottom:none}
  .lbl{color:#6b7280;font-weight:700}
  .val{font-weight:800;text-align:left}
  table{width:100%;border-collapse:collapse;margin-top:12px;border:1px solid #e5e7eb}
  th{background:#065f46;color:#fff;padding:10px;font-size:11px;text-align:right}
  td{padding:10px;font-size:11px;border-bottom:1px solid #e5e7eb;vertical-align:top}
  .num{text-align:center;font-weight:900;white-space:nowrap}
  .totals{width:82mm;margin-right:auto;margin-top:14px;border:1px solid #d1fae5;border-radius:12px;overflow:hidden}
  .total-row{display:flex;justify-content:space-between;padding:9px 12px;font-size:12px;border-bottom:1px solid #d1fae5}
  .total-row:last-child{border-bottom:none;background:#ecfdf5;font-weight:900;color:#065f46;font-size:14px}
  .note{margin-top:18px;border:1px dashed #d1d5db;border-radius:12px;padding:12px;font-size:10px;color:#6b7280;line-height:1.8}
  .footer{margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;color:#9ca3af;font-size:9px}
  @media print{body{background:#fff}.wrap{border:none}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div class="brand">
      <img src="${LOGO_URL}" class="logo" />
      <div>
        <div class="brand-title">المسار الذكي</div>
        <div class="brand-sub">منصة حجز العمرة الذكية</div>
      </div>
    </div>
    <div>
      <div class="doc-title">${safe(input.title)}</div>
      <div class="doc-no">${safe(input.invoiceNo)}</div>
    </div>
  </div>
  <div class="body">
    <div class="grid">
      <div class="box">
        <h3>بيانات المورد</h3>
        <div class="line"><span class="lbl">الاسم</span><span class="val">${safe(input.seller.name)}</span></div>
        <div class="line"><span class="lbl">الرقم الضريبي</span><span class="val">${safe(input.seller.taxNumber)}</span></div>
        <div class="line"><span class="lbl">السجل التجاري</span><span class="val">${safe(input.seller.commercialRegister)}</span></div>
        <div class="line"><span class="lbl">المدينة</span><span class="val">${safe(input.seller.city)}</span></div>
      </div>
      <div class="box">
        <h3>بيانات العميل</h3>
        <div class="line"><span class="lbl">الاسم</span><span class="val">${safe(input.buyer.name)}</span></div>
        <div class="line"><span class="lbl">الرقم الضريبي</span><span class="val">${safe(input.buyer.taxNumber)}</span></div>
        <div class="line"><span class="lbl">السجل التجاري</span><span class="val">${safe(input.buyer.commercialRegister)}</span></div>
        <div class="line"><span class="lbl">المدينة</span><span class="val">${safe(input.buyer.city)}</span></div>
      </div>
    </div>
    <div class="grid">
      <div class="box">
        <h3>بيانات الحجز</h3>
        <div class="line"><span class="lbl">رقم الحجز</span><span class="val">${safe(input.bookingRef)}</span></div>
        <div class="line"><span class="lbl">المعتمر</span><span class="val">${safe(input.passengerName)}</span></div>
        <div class="line"><span class="lbl">عدد الركاب داخل الحجز</span><span class="val">${safe(input.passengerCount ?? "—")}</span></div>
        <div class="line"><span class="lbl">البرنامج</span><span class="val">${safe(input.packageTitle)}</span></div>
      </div>
      <div class="box">
        <h3>بيانات الفاتورة</h3>
        <div class="line"><span class="lbl">تاريخ الفاتورة</span><span class="val">${invoiceDate}</span></div>
        <div class="line"><span class="lbl">نسبة الضريبة</span><span class="val">${input.vatRate}%</span></div>
        <div class="line"><span class="lbl">العملة</span><span class="val">ريال سعودي</span></div>
      </div>
    </div>
    <table>
      <thead><tr><th>الوصف</th><th class="num">المبلغ قبل الضريبة</th><th class="num">ضريبة القيمة المضافة</th><th class="num">الإجمالي شامل الضريبة</th></tr></thead>
      <tbody>
        <tr>
          <td>${safe(input.description)}</td>
          <td class="num">${money(input.taxableAmount)}</td>
          <td class="num">${money(input.vatAmount)}</td>
          <td class="num">${money(input.grossAmount)}</td>
        </tr>
      </tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>الإجمالي قبل الضريبة</span><span>${money(input.taxableAmount)}</span></div>
      <div class="total-row"><span>ضريبة القيمة المضافة ${input.vatRate}%</span><span>${money(input.vatAmount)}</span></div>
      <div class="total-row"><span>الإجمالي شامل الضريبة</span><span>${money(input.grossAmount)}</span></div>
    </div>
    <div class="note">${safe(input.notes ?? "هذه فاتورة ضريبية مرتبطة بالحجز وكشف الحساب، والمبالغ بالريال السعودي.")}</div>
    <div class="footer">
      <span>تاريخ الطباعة: ${printDate}</span>
      <span>فاتورة مرتبطة بكشف الحساب</span>
      <span>المسار الذكي</span>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function printTaxInvoice(input: TaxInvoiceInput) {
  return printHtml(buildTaxInvoiceHtml(input), { width: "210mm", height: "297mm" });
}
