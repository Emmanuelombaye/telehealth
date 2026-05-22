/**
 * Peak Health branded PDF exports — logo, header, footer, tables.
 */
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const PEAK_BRAND = {
  name: "Peak Health",
  tagline: "Clinical care, online",
  site: "www.peak-health.io",
  logoPaths: ["/PeakHealthLogo.png", "/originallogo.png"],
  primary: "#0A2E1F",
  accent: "#059669",
} as const;

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 10;

let logoDataUrlCache: string | null | undefined;

/** Load logo as data URL for jsPDF (cached). */
export async function getBrandLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlCache !== undefined) return logoDataUrlCache;
  for (const path of PEAK_BRAND.logoPaths) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const blob = await res.blob();
      const dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(typeof reader.result === "string" ? reader.result : null);
        reader.readAsDataURL(blob);
      });
      if (dataUrl) {
        logoDataUrlCache = dataUrl;
        return dataUrl;
      }
    } catch {
      /* try next */
    }
  }
  logoDataUrlCache = null;
  return null;
}

export type BrandedReportSection =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "kv"; rows: [string, string][] }
  | { kind: "table"; headers: string[]; rows: string[][] };

export type BrandedReportOptions = {
  filename: string;
  title: string;
  subtitle?: string;
  sections: BrandedReportSection[];
};

function stamp(): string {
  return new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function drawFooters(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${PEAK_BRAND.name} · ${PEAK_BRAND.tagline} · ${PEAK_BRAND.site} · Confidential`,
      MARGIN,
      FOOTER_Y,
    );
    doc.text(`Page ${p} of ${total}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
  }
}

function drawFirstPageHeader(
  doc: jsPDF,
  logo: string | null,
  title: string,
  subtitle?: string,
): number {
  let y = MARGIN;
  if (logo) {
    try {
      doc.addImage(logo, "PNG", MARGIN, y, 48, 16);
      y += 20;
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(10, 46, 31);
      doc.text(PEAK_BRAND.name, MARGIN, y + 6);
      y += 12;
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(10, 46, 31);
    doc.text(PEAK_BRAND.name, MARGIN, y + 6);
    y += 12;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(10, 46, 31);
  doc.text(title, MARGIN, y);
  y += 7;

  const sub = subtitle || `Generated ${stamp()}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(sub, MARGIN, y);
  y += 5;

  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.35);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  return y + 8;
}

function ensureSpace(doc: jsPDF, y: number, need: number): number {
  if (y + need > PAGE_H - 18) {
    doc.addPage();
    return MARGIN + 4;
  }
  return y;
}

function colWidths(headers: string[], rows: string[][]): number[] {
  const n = headers.length;
  const maxLens = headers.map((h, i) => {
    const cellLens = [h.length, ...rows.map((r) => (r[i] || "").length)];
    return Math.max(...cellLens, 4);
  });
  const sum = maxLens.reduce((a, b) => a + b, 0);
  return maxLens.map((l) => (l / sum) * CONTENT_W);
}

function drawTable(
  doc: jsPDF,
  y: number,
  headers: string[],
  rows: string[][],
): number {
  const widths = colWidths(headers, rows);
  const rowH = 7;
  const headerH = 8;

  y = ensureSpace(doc, y, headerH + rowH);

  let x = MARGIN;
  doc.setFillColor(10, 46, 31);
  doc.rect(MARGIN, y - 5, CONTENT_W, headerH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y, { maxWidth: widths[i] - 4 });
    x += widths[i];
  });
  y += headerH;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  rows.forEach((row, ri) => {
    y = ensureSpace(doc, y, rowH);
    if (ri % 2 === 0) {
      doc.setFillColor(240, 253, 244);
      doc.rect(MARGIN, y - 5, CONTENT_W, rowH, "F");
    }
    doc.setTextColor(30, 41, 59);
    x = MARGIN;
    row.forEach((cell, i) => {
      doc.text(String(cell ?? ""), x + 2, y, { maxWidth: widths[i] - 4 });
      x += widths[i];
    });
    y += rowH;
  });
  return y + 4;
}

/** Download a structured branded PDF report (tables, KPIs, sections). */
export async function downloadBrandedReportPdf(opts: BrandedReportOptions): Promise<void> {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const logo = await getBrandLogoDataUrl();
  let y = drawFirstPageHeader(doc, logo, opts.title, opts.subtitle);

  for (const section of opts.sections) {
    if (section.kind === "heading") {
      y = ensureSpace(doc, y, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(10, 46, 31);
      doc.text(section.text, MARGIN, y);
      y += 9;
    } else if (section.kind === "paragraph") {
      y = ensureSpace(doc, y, 14);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(section.text, CONTENT_W);
      doc.text(lines, MARGIN, y);
      y += lines.length * 4.2 + 4;
    } else if (section.kind === "kv") {
      for (const [label, value] of section.rows) {
        y = ensureSpace(doc, y, 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(label, MARGIN, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(10, 46, 31);
        doc.text(value, MARGIN + 52, y, { maxWidth: CONTENT_W - 52 });
        y += 6;
      }
      y += 3;
    } else if (section.kind === "table") {
      y = drawTable(doc, y, section.headers, section.rows);
    }
  }

  drawFooters(doc);
  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`);
}

/** Capture a DOM region as branded PDF (dashboard exports). */
export async function downloadBrandedScreenshotPdf(
  element: HTMLElement,
  opts: { filename: string; title: string; subtitle?: string },
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });
  const imgData = canvas.toDataURL("image/png");
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const logo = await getBrandLogoDataUrl();
  let y = drawFirstPageHeader(doc, logo, opts.title, opts.subtitle);

  const maxImgH = PAGE_H - y - 18;
  let imgW = CONTENT_W;
  let imgH = (canvas.height * imgW) / canvas.width;
  if (imgH > maxImgH) {
    imgH = maxImgH;
    imgW = (canvas.width * imgH) / canvas.height;
  }

  doc.addImage(imgData, "PNG", MARGIN, y, imgW, imgH);
  drawFooters(doc);
  doc.save(opts.filename.endsWith(".pdf") ? opts.filename : `${opts.filename}.pdf`);
}

/** Branded HTML for browser print → Save as PDF. */
export function buildBrandedPrintHtml(opts: {
  documentTitle: string;
  bodyHtml: string;
}): string {
  const generated = stamp();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${opts.documentTitle}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 720px; margin: 32px auto; color: #0A2E1F; padding: 0 24px 48px; }
  .brand-bar { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 24px; }
  .brand-bar img { height: 48px; width: auto; object-fit: contain; }
  .brand-bar h1 { font-size: 1.1rem; margin: 0; letter-spacing: 0.04em; text-transform: uppercase; }
  .brand-bar p { margin: 4px 0 0; font-size: 0.75rem; color: #64748b; }
  footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #d1fae5; font-size: 0.7rem; color: #94a3b8; }
  @media print { body { margin: 16px; } }
</style></head><body>
  <header class="brand-bar">
    <img src="${PEAK_BRAND.logoPaths[0]}" alt="${PEAK_BRAND.name}" onerror="this.src='${PEAK_BRAND.logoPaths[1]}'"/>
    <div>
      <h1>${PEAK_BRAND.name}</h1>
      <p>${PEAK_BRAND.tagline} · ${generated}</p>
    </div>
  </header>
  ${opts.bodyHtml}
  <footer>${PEAK_BRAND.name} · ${PEAK_BRAND.site} · Confidential patient record. For official use only.</footer>
  <script>window.onload = () => { window.print(); };</script>
</body></html>`;
}

export function openBrandedPrintDocument(opts: {
  documentTitle: string;
  bodyHtml: string;
}): boolean {
  const html = buildBrandedPrintHtml(opts);
  const w = window.open("", "_blank", "noopener,noreferrer,width=760,height=920");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
