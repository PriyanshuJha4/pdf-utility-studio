export type ToolType = "merge" | "images" | "ppt" | "images-to-pdf" | "compress";
export type ImageFormat = "jpeg" | "png";

export type PdfFile = {
  id: string;
  file: File;
  name: string;
  size: number;
};