import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { PdfUploader } from "@/components/PdfUploader";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Search,
  Trash2,
  Clock,
  Eye,
  Network,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LibraryGrid() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const documents = useQuery(api.documents.list);
  const deleteDocument = useMutation(api.documents.remove);

  const docs = useMemo(() => documents ?? [], [documents]);

  const filtered = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.filename.toLowerCase().includes(q),
    );
  }, [docs, search]);

  const handleDelete = async (e: React.MouseEvent, docId: Id<"documents">) => {
    e.stopPropagation();
    try {
      await deleteDocument({ documentId: docId });
      toast.success("Document removed");
    } catch {
      toast.error("Failed to remove document");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-3 bg-card/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search papers..."
            className="h-9 w-full rounded-lg border border-border/60 bg-muted/30 pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {docs.length} paper{docs.length !== 1 ? "s" : ""}
        </span>
        {docs.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/graph")}
            >
              <Network className="size-3.5" />
              Graph
            </Button>
            {docs.length >= 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/gaps")}
              >
                <Search className="size-3.5" />
                Gaps
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <FileText className="size-5 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-foreground">
              Your library is empty
            </h3>
            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
              Upload your first research paper to get started. PDF files are
              processed locally — your data never leaves your browser until you
              ask a question.
            </p>
            <div className="mt-6 w-full max-w-sm">
              <PdfUploader />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">
              No papers match &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => (
              <div
                key={doc._id}
                onClick={() => navigate(`/document/${doc._id}`)}
                className="group relative cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="size-4 text-primary" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/document/${doc._id}`);
                      }}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, doc._id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <h3 className="mt-3 text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {doc.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {doc.filename}
                </p>
                <div className="mt-4 flex items-center gap-3 text-[10px] text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <FileText className="size-2.5" />
                    {doc.chunkCount} chunks
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-2.5" />
                    {formatDate(doc.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
