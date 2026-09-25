import PptxGenJS from "pptxgenjs";
import { renderPdfPages } from "../pdf/renderPdf";

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

export async function pdfToPpt(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pages = await renderPdfPages(file, 2, "image/jpeg", onProgress);

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "WIDE";

  for (const p of pages) {
    const slide = pptx.addSlide();
    const pageRatio = p.width / p.height;
    const slideRatio = SLIDE_W / SLIDE_H;

    let w: number;
    let h: number;

    if (pageRatio > slideRatio) {
      w = SLIDE_W;
      h = w / pageRatio;
    } else {
      h = SLIDE_H;
      w = h * pageRatio;
    }

    const x = (SLIDE_W - w) / 2;
    const y = (SLIDE_H - h) / 2;

    slide.addImage({ data: p.dataUrl, x, y, w, h });
  }

  return (await pptx.write({ outputType: "blob" })) as Blob;
}