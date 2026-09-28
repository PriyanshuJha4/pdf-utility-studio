import { PDFDocument } from "pdf-lib";
import { renderPdfPages } from "./renderPdf";

export async function compressPdf(
  file: File,
  quality: number = 0.65,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  // स्केल 1.5 - 2.0 साफ रेंडरिंग देता है
  const pages = await renderPdfPages(file, 1.5, "image/jpeg", onProgress);
  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    const base64Data = page.dataUrl.split(",")[1];
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const embeddedImg = await pdfDoc.embedJpg(imageBytes);

    // सटीक पूर्णांक (Math.round) साइज़ ताकि 1px सब-पिक्सेल लाइन न बने
    const pageWidth = Math.round(page.width);
    const pageHeight = Math.round(page.height);

    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

    // x, y को 0 पर सेट करके पूरे पेज पर स्ट्रेच-फिट करें
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
}