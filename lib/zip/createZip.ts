import JSZip from "jszip";

export async function createImageZip(
  images: { name: string; dataUrl: string }[]
): Promise<Blob> {
  const zip = new JSZip();

  for (const img of images) {
    const base64 = img.dataUrl.split(",")[1];
    zip.file(img.name, base64, { base64: true });
  }

  return zip.generateAsync({ type: "blob" });
}