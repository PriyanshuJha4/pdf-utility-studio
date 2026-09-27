
export type PdfFile = {
  id: string;
  file: File;
  name: string;
  size: number;
};

export type ToolType = "merge" | "images" | "ppt" | "images-to-pdf";
export type ImageFormat = "jpeg" | "png";