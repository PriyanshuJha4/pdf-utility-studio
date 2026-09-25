export type RenderedPage = {
  dataUrl: string;
  width: number;
  height: number;
};

export async function renderPdfPages(
  file: File,
  scale: number,
  format: "image/jpeg" | "image/png" = "image/jpeg",
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPage[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages: RenderedPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not supported in this browser");

    await page.render({ canvasContext: context, viewport }).promise;

    pages.push({
      dataUrl: canvas.toDataURL(format, 0.9),
      width: viewport.width,
      height: viewport.height,
    });

    canvas.width = 0;
    canvas.height = 0;

    onProgress?.(i, pdf.numPages);
  }

  return pages;
}