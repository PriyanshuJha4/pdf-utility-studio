export type RenderedPage = {
  dataUrl: string;
  width: number;
  height: number;
};

export async function renderPdfPages(
  file: File,
  scale: number,
  format: "image/jpeg" | "image/png" = "image/jpeg",
  onProgress?: (current: number, total: number) => void,
  quality: number = 0.92
): Promise<RenderedPage[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const bytes = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pages: RenderedPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    // 1. सब-पिक्सेल गैप खत्म करने के लिए पूर्णांक (Math.floor) में सेट करें
    const width = Math.floor(viewport.width);
    const height = Math.floor(viewport.height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: false }); // ट्रांसपेरेंसी बंद करें
    if (!context) throw new Error("Canvas is not supported in this browser");

    // 2. पूरे कैनवस पर पहले सॉलिड वाइट बैकग्राउंड भरें
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;

    // 3. कैनवस के राउंडेड साइज़ के साथ सटीक रेंडर कराएं
    await page.render({
      canvasContext: context,
      viewport: page.getViewport({
        scale: scale * (width / viewport.width),
      }),
    }).promise;

    pages.push({
      dataUrl: canvas.toDataURL(format, quality),
      width: width / scale,   // ओरिजिनल PDF साइज़
      height: height / scale, // ओरिजिनल PDF साइज़
    });

    // मेमोरी साफ़ करें
    canvas.width = 0;
    canvas.height = 0;

    onProgress?.(i, pdf.numPages);
  }

  return pages;
}