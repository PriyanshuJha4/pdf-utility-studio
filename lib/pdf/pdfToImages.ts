import { renderPdfPages } from "./renderPdf";

export async function convertPdfToImages(
  file: File,
  scale = 1.5,
  format: "image/jpeg" | "image/png" = "image/png",
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const pages = await renderPdfPages(file, scale, format, onProgress);
  return pages.map((page) => page.dataUrl);
}