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

export async function createBlobZip(
  files: { name: string; blob: Blob }[]
): Promise<Blob> {
  const zip = new JSZip();

  for (const f of files) {
    zip.file(f.name, f.blob);
  }

  return zip.generateAsync({ type: "blob" });
}