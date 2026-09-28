"use client";

import { useRef, useState } from "react";
import type { ImageFormat, PdfFile, ToolType } from "@/types/pdf";
import { validatePdfFile } from "@/lib/pdf/validatePdf";
import { mergePdfs } from "@/lib/pdf/mergePdf";
import { convertPdfToImages } from "@/lib/pdf/pdfToImages";
import { imagesToPdf } from "@/lib/pdf/imagesToPdf";
import { pdfToPpt } from "@/lib/ppt/pdfToPpt";
import { compressPdf } from "@/lib/pdf/compressPdf";
import { createImageZip } from "@/lib/zip/createZip";
import { downloadBlob } from "@/lib/downloads";

export default function Home() {
  const [tool, setTool] = useState<ToolType>("merge");
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [imageFormat, setImageFormat] = useState<ImageFormat>("jpeg");
  const [compressQuality, setCompressQuality] = useState<number>(0.65);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const getAcceptType = () => {
    if (tool === "images-to-pdf") return "image/png,image/jpeg,image/jpg";
    return "application/pdf";
  };

  function addFiles(fileList: FileList | File[]) {
    setError("");
    const incoming = Array.from(fileList);
    const valid: PdfFile[] = [];

    for (const file of incoming) {
      if (tool !== "images-to-pdf") {
        const problem = validatePdfFile(file);
        if (problem) {
          setError(problem);
          continue;
        }
      }
      valid.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
      });
    }

    setFiles((prev) => [...prev, ...valid]);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function moveFile(id: string, direction: -1 | 1) {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  }

  function reset() {
    setFiles([]);
    setError("");
    setProgress({ current: 0, total: 0, label: "" });
  }

  async function process() {
    if (files.length === 0) {
      setError("Please select files first.");
      return;
    }

    setError("");
    setIsProcessing(true);
    setProgress({ current: 0, total: 1, label: "Processing..." });

    try {
      if (tool === "merge") {
        setProgress({ current: 0, total: files.length, label: "Merging PDFs..." });
        const bytes = await mergePdfs(files.map((f) => f.file));
        const pdfBytes = new Uint8Array(bytes);
        downloadBlob(new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" }), "merged.pdf");
      }

      if (tool === "images") {
        const allImages: { name: string; dataUrl: string }[] = [];

        for (const pdfFile of files) {
          const baseName = pdfFile.name.replace(/\.pdf$/i, "");
          const pages = await convertPdfToImages(
            pdfFile.file,
            2,
            imageFormat === "jpeg" ? "image/jpeg" : "image/png",
            (current, total) =>
              setProgress({ current, total, label: `Rendering ${pdfFile.name}: page ${current} of ${total}` })
          );

          pages.forEach((dataUrl, i) => {
            const num = String(i + 1).padStart(3, "0");
            const ext = imageFormat === "jpeg" ? "jpg" : "png";
            allImages.push({ name: `${baseName}-page-${num}.${ext}`, dataUrl });
          });
        }

        setProgress({ current: 0, total: 1, label: "Creating ZIP..." });
        const zipBlob = await createImageZip(allImages);
        downloadBlob(zipBlob, "pdf-images.zip");
      }

      if (tool === "ppt") {
        setProgress({ current: 0, total: 1, label: "Merging all PDFs for presentation..." });
        const mergedBytes = await mergePdfs(files.map((f) => f.file));
        const mergedBlob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const mergedFile = new File([mergedBlob], "merged-presentation.pdf", { type: "application/pdf" });

        setProgress({ current: 0, total: 1, label: "Creating slides from merged PDF..." });
        const blob = await pdfToPpt(mergedFile, (current, total) =>
          setProgress({ current, total, label: `Creating slide ${current} of ${total}` })
        );
        downloadBlob(blob, "merged-presentation.pptx");
      }

      if (tool === "images-to-pdf") {
        setProgress({ current: 0, total: files.length, label: "Converting images to PDF..." });
        const pdfBlob = await imagesToPdf(
          files.map((f) => f.file),
          (current, total) => setProgress({ current, total, label: `Adding image ${current} of ${total}` })
        );
        downloadBlob(pdfBlob, "images-combined.pdf");
      }

      if (tool === "compress") {
        for (let i = 0; i < files.length; i++) {
          const pdfFile = files[i];
          const baseName = pdfFile.name.replace(/\.pdf$/i, "");
          const compressedBlob = await compressPdf(
            pdfFile.file,
            compressQuality,
            (current, total) =>
              setProgress({
                current,
                total,
                label: `Compressing ${pdfFile.name}: page ${current} of ${total}`,
              })
          );
          downloadBlob(compressedBlob, `${baseName}-compressed.pdf`);
        }
      }
    } catch (err) {
      setError("Failed to process files. Please verify the files and try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  const progressPercent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="container">
      <h1>PDF Utility Studio</h1>
      <p className="privacy-note">Your files stay in this browser. Files are processed locally.</p>

      <div className="tool-row" style={{ flexWrap: "wrap" }}>
        <button className={`tool-btn ${tool === "merge" ? "active" : ""}`} onClick={() => { setTool("merge"); reset(); }}>
          Merge PDFs
        </button>
        <button className={`tool-btn ${tool === "images" ? "active" : ""}`} onClick={() => { setTool("images"); reset(); }}>
          PDF → Images
        </button>
        <button className={`tool-btn ${tool === "ppt" ? "active" : ""}`} onClick={() => { setTool("ppt"); reset(); }}>
          PDF → PPT
        </button>
        <button className={`tool-btn ${tool === "images-to-pdf" ? "active" : ""}`} onClick={() => { setTool("images-to-pdf"); reset(); }}>
          Images → PDF
        </button>
        <button className={`tool-btn ${tool === "compress" ? "active" : ""}`} onClick={() => { setTool("compress"); reset(); }}>
          Compress PDF
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        className={`upload-zone ${isDragging ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        <p>
          {tool === "images-to-pdf"
            ? "Drop Images (JPG, PNG) here, or click to choose"
            : tool === "compress"
            ? "Drop PDF files here to compress, or click to choose"
            : "Drop PDF files here, or click to choose"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptType()}
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {tool === "images" && (
        <div className="card">
          <label>
            Format:{" "}
            <select value={imageFormat} onChange={(e) => setImageFormat(e.target.value as ImageFormat)}>
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </label>
        </div>
      )}

      {tool === "compress" && (
        <div className="card">
          <label>
            Compression Level:{" "}
            <select
              value={compressQuality}
              onChange={(e) => setCompressQuality(parseFloat(e.target.value))}
            >
              <option value={0.8}>Low Compression (High Quality)</option>
              <option value={0.65}>Recommended (Balanced)</option>
              <option value={0.4}>High Compression (Small Size)</option>
            </select>
          </label>
        </div>
      )}

      {tool === "ppt" && files.length > 1 && (
        <div className="box" style={{ fontSize: 14, color: "var(--muted)" }}>
          All selected PDFs will be merged into one presentation. Each page is added as an image.
        </div>
      )}

      {files.length > 0 && (
        <div className="card">
          <h3>Selected Files</h3>
          {files.map((f, i) => (
            <div className="file-row" key={f.id}>
              <span className="file-name">
                {i + 1}. {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              <span className="file-actions">
                <button onClick={() => moveFile(f.id, -1)} disabled={i === 0}>↑</button>
                <button onClick={() => moveFile(f.id, 1)} disabled={i === files.length - 1}>↓</button>
                <button onClick={() => removeFile(f.id)}>✕</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {isProcessing && (
        <div className="card">
          <p>{progress.label}</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button className="primary-btn" onClick={process} disabled={isProcessing || files.length === 0}>
          {isProcessing ? "Processing..." : "Process Files"}
        </button>
        <button className="tool-btn" onClick={reset} disabled={isProcessing}>
          Clear All
        </button>
      </div>
    </div>
  );
}