import { PDFDocument } from "pdf-lib";

export async function imagesToPdf(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = await file.arrayBuffer();
    let img;

    if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
      img = await pdfDoc.embedPng(buffer);
    } else {
      img = await pdfDoc.embedJpg(buffer);
    }

    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    });

    if (onProgress) onProgress(i + 1, files.length);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}