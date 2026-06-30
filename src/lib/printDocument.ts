type PrintHtmlOptions = {
  height?: string;
  width?: string;
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const waitForImages = async (root: ParentNode) => {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    }),
  );
};

const getPrintParts = (html: string) => {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const styles = Array.from(parsed.head.querySelectorAll("style, link[rel='stylesheet']"))
    .map((node) => node.outerHTML)
    .join("\n");
  return {
    body: parsed.body.innerHTML || html,
    styles,
    title: parsed.title || "معاينة الطباعة",
  };
};

export async function printHtml(html: string, _options: PrintHtmlOptions = {}) {
  if (!html.trim()) return;

  const previous = document.getElementById("print-preview-overlay");
  if (previous?.parentNode) previous.parentNode.removeChild(previous);

  const { body, styles, title } = getPrintParts(html);

  const printStyles = document.createElement("style");
  printStyles.id = "print-preview-styles";
  printStyles.textContent = `
    @media print {
      body > *:not(#print-preview-overlay) {
        display: none !important;
      }
      #print-preview-overlay {
        position: static !important;
        inset: auto !important;
        display: block !important;
        padding: 0 !important;
        background: #fff !important;
        z-index: auto !important;
      }
      #print-preview-toolbar {
        display: none !important;
      }
      #print-preview-scroll {
        overflow: visible !important;
        height: auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: #fff !important;
      }
      #print-preview-page {
        width: auto !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
    }
  `;

  const overlay = document.createElement("div");
  overlay.id = "print-preview-overlay";
  overlay.dir = "rtl";
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "background:rgba(15,23,42,.72)",
    "display:flex",
    "flex-direction:column",
    "padding:14px",
    "gap:10px",
  ].join(";");

  const toolbar = document.createElement("div");
  toolbar.id = "print-preview-toolbar";
  toolbar.style.cssText = [
    "display:flex",
    "align-items:center",
    "justify-content:space-between",
    "gap:10px",
    "background:#fff",
    "border-radius:14px",
    "padding:10px 12px",
    "box-shadow:0 16px 40px rgba(0,0,0,.24)",
    "font-family:Arial,sans-serif",
  ].join(";");

  const heading = document.createElement("div");
  heading.textContent = title || "معاينة الطباعة";
  heading.style.cssText = "font-size:14px;font-weight:800;color:#111827";

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";

  const printButton = document.createElement("button");
  printButton.type = "button";
  printButton.textContent = "طباعة / حفظ PDF";
  printButton.style.cssText = [
    "border:0",
    "border-radius:10px",
    "padding:10px 14px",
    "background:#047857",
    "color:#fff",
    "font-size:13px",
    "font-weight:800",
    "cursor:pointer",
  ].join(";");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "إغلاق";
  closeButton.style.cssText = [
    "border:1px solid #e5e7eb",
    "border-radius:10px",
    "padding:10px 14px",
    "background:#fff",
    "color:#374151",
    "font-size:13px",
    "font-weight:800",
    "cursor:pointer",
  ].join(";");

  actions.append(printButton, closeButton);
  toolbar.append(heading, actions);

  const scroll = document.createElement("div");
  scroll.id = "print-preview-scroll";
  scroll.style.cssText = [
    "flex:1",
    "min-height:0",
    "overflow:auto",
    "background:#f3f4f6",
    "border-radius:14px",
    "box-shadow:0 16px 40px rgba(0,0,0,.24)",
    "padding:18px",
  ].join(";");

  const page = document.createElement("div");
  page.id = "print-preview-page";
  page.dir = "rtl";
  page.style.cssText = [
    "background:#fff",
    "width:fit-content",
    "max-width:100%",
    "min-width:min(100%, 320px)",
    "margin:0 auto",
    "box-shadow:0 10px 28px rgba(0,0,0,.14)",
  ].join(";");
  page.innerHTML = `${styles}${body}`;

  scroll.appendChild(page);
  overlay.append(toolbar, scroll);
  document.head.appendChild(printStyles);
  document.body.appendChild(overlay);

  const close = () => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (printStyles.parentNode) printStyles.parentNode.removeChild(printStyles);
  };

  closeButton.addEventListener("click", close);
  printButton.addEventListener("click", () => {
    void (async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // Continue even if remote fonts are blocked.
      }
      await waitForImages(page);
      await wait(100);
      window.print();
    })();
  });

  await waitForImages(page);
  await wait(150);
}
