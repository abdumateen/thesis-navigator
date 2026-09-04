import { useCallback, useRef, useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, FileText, Loader2, Image } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function chunkText(text: string, chunkSize = 1200, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start + overlap >= text.length) break;
  }
  return chunks.filter((c) => c.length > 50);
}

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

async function renderPageToBase64(
  file: File,
  pageNumber: number,
  scale = 1.5,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.render({ canvasContext: ctx as any, canvas, viewport } as any).promise;

  return canvas.toDataURL("image/png").split(",")[1] || "";
}

interface PdfUploaderProps {
  onUploadComplete?: () => void;
}

export function PdfUploader({ onUploadComplete }: PdfUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createDocument = useMutation(api.documents.create);
  const processDocument = useAction(api.processDocument.extractVisualContent);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const pdfFiles = fileArray.filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
      );

      if (pdfFiles.length === 0) {
        toast.error("Please upload PDF files only.");
        return;
      }

      setIsUploading(true);

      try {
        for (const file of pdfFiles) {
          const title = file.name.replace(/\.pdf$/i, "");
          setProgress(`Extracting text from "${title}"...`);

          const text = await extractPdfText(file);
          if (!text.trim()) {
            toast.warning(
              `Could not extract text from "${file.name}". The file may be image-based.`,
            );
            continue;
          }

          const textChunks = chunkText(text);

          setProgress(`Analyzing pages in "${title}"...`);
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer })
            .promise;
          const pageImages: Array<{ pageNumber: number; base64: string }> = [];

          for (let i = 1; i <= pdf.numPages; i++) {
            setProgress(
              `Rendering page ${i}/${pdf.numPages} of "${title}"...`,
            );
            const base64 = await renderPageToBase64(file, i, 1.5);
            pageImages.push({ pageNumber: i, base64 });
          }

          let visualChunks: Array<{
            pageNumber: number;
            chunkType: "table" | "figure";
            text: string;
            imageUrl: string;
          }> = [];

          if (pageImages.length > 0) {
            setProgress(
              `Identifying tables and figures in "${title}"...`,
            );
            try {
              visualChunks = await processDocument({
                pageImages,
              });
            } catch (err) {
              console.error("Visual extraction failed:", err);
              toast.warning(
                `Visual extraction failed for "${file.name}". Text-only mode used.`,
              );
            }
          }

          setProgress(`Saving "${title}"...`);

          const allChunks: Array<{
            text: string;
            chunkType?: "text" | "table" | "figure";
            pageNumber?: number;
            imageUrl?: string;
          }> = [
            ...textChunks.map((t) => ({
              text: t,
              chunkType: "text" as const,
            })),
            ...visualChunks.map((vc) => ({
              text: vc.text,
              chunkType: vc.chunkType,
              pageNumber: vc.pageNumber,
              imageUrl: vc.imageUrl,
            })),
          ];

          await createDocument({
            title,
            filename: file.name,
            fullText: text,
            chunks: allChunks,
          });

          const tableCount = visualChunks.filter(
            (c) => c.chunkType === "table",
          ).length;
          const figureCount = visualChunks.filter(
            (c) => c.chunkType === "figure",
          ).length;
          const parts = [
            `${textChunks.length} text chunks`,
            tableCount > 0
              ? `${tableCount} table${tableCount > 1 ? "s" : ""}`
              : "",
            figureCount > 0
              ? `${figureCount} figure${figureCount > 1 ? "s" : ""}`
              : "",
          ].filter(Boolean);

          toast.success(`Uploaded "${file.name}" — ${parts.join(", ")}`);
        }

        onUploadComplete?.();
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to process PDF. Please try again.");
      } finally {
        setIsUploading(false);
        setProgress("");
      }
    },
    [createDocument, processDocument, onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      className={`group flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors ${
        isUploading
          ? "pointer-events-none border-primary/30 bg-primary/5"
          : dragOver
            ? "border-foreground/40 bg-foreground/5"
            : "border-border hover:border-foreground/30 hover:bg-foreground/[0.02]"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleUpload(e.target.files);
          e.target.value = "";
        }}
      />
      {isUploading ? (
        <Loader2 className="size-8 text-primary animate-spin" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Upload className="size-4 text-primary" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">
          {isUploading ? "Processing..." : "Upload research papers"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {progress ||
            "Drop PDF files here — text, tables, and figures are all indexed"}
        </p>
      </div>
      {isUploading && progress && (
        <div className="flex items-center gap-1.5 text-[10px] text-primary/70">
          <Image className="size-3" />
          <span>Multi-modal extraction active</span>
        </div>
      )}
    </div>
  );
}

export function DocumentIcon({ className }: { className?: string }) {
  return <FileText className={className ?? "size-4"} />;
}
