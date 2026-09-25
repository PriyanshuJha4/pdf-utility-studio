export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export function validatePdfFile(file: File): string | null {
  const isPdfType = file.type === "application/pdf";
  const isPdfExt = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfType && !isPdfExt) {
    return `${file.name}: Only PDF files are allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: File is too large (max 100 MB).`;
  }
  return null;
}