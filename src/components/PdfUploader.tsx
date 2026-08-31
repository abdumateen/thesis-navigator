import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/** Split text into overlapping chunks for better retrieval. */
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

/** Extract text from a PDF file using pdf.js. */
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

interface PdfUploaderProps {
  onUploadComplete?: () => void;
}

export function PdfUploader({ onUploadComplete }: PdfUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createDocument = useMutation(api.documents.create);

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
          const text = await extractPdfText(file);
          if (!text.trim()) {
            toast.warning(`Could not extract text from "${file.name}". The file may be image-based.`);
            continue;
          }

          const chunks = chunkText(text);
          const title = file.name.replace(/\.pdf$/i, "");

          await createDocument({
            title,
            filename: file.name,
            fullText: text,
            chunks,
          });

          toast.success(`Uploaded "${file.name}" (${chunks.length} chunks)`);
        }

        onUploadComplete?.();
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to process PDF. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [createDocument, onUploadComplete],
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
      onClick={() => fileInputRef.current?.click()}
      className={`group flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors ${
        dragOver
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
        <Loader2 className="size-8 text-muted-foreground animate-spin" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Upload className="size-4 text-muted-foreground" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">
          {isUploading ? "Processing PDFs..." : "Upload research papers"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drop PDF files here or click to browse
        </p>
      </div>
    </div>
  );
}

export function DocumentIcon({ className }: { className?: string }) {
  return <FileText className={className ?? "size-4"} />;
}
