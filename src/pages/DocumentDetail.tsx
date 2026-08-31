import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  Trash2,
  MessageSquare,
  BookOpen,
  Table,
  Image,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export default function DocumentDetail() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [showChunks, setShowChunks] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<Id<"conversations"> | null>(null);

  const doc = useQuery(
    api.documents.getChunks,
    documentId ? { documentIds: [documentId as Id<"documents">] } : "skip",
  );
  const deleteDocument = useMutation(api.documents.remove);

  const docData = doc?.[0];

  const handleDelete = async () => {
    if (!documentId) return;
    try {
      await deleteDocument({ documentId: documentId as Id<"documents"> });
      toast.success("Document removed");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to remove document");
    }
  };

  if (!documentId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Document not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar: Document info */}
      <aside className="flex w-80 flex-col border-r border-border bg-card">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground truncate flex-1">
            Back to library
          </span>
        </div>

        {/* Document info */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold truncate">
                {docData?.documentTitle ?? "Loading..."}
              </h2>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {docData?.documentFilename}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Chunks
              </p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">
                {docData?.chunks.length ?? 0}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </p>
              <p className="mt-0.5 text-lg font-semibold text-primary">
                Ready
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 h-9 text-xs gap-2 border-border/60"
            onClick={() => setShowChunks(!showChunks)}
          >
            <BookOpen className="size-3.5" />
            {showChunks ? "Hide extracted text" : "View extracted text"}
          </Button>

          <Button
            variant="ghost"
            className="w-full mt-2 h-9 text-xs gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" />
            Remove document
          </Button>
        </div>

        <Separator />

        {/* Chunks viewer */}
        {showChunks && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Extracted text
              </p>
            </div>
            <ScrollArea className="flex-1 px-5 pb-5">
              <div className="space-y-2">
                {docData?.chunks.map((chunk, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/50 bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {chunk.chunkType === "table" ? (
                        <Table className="size-3 text-primary" />
                      ) : chunk.chunkType === "figure" ? (
                        <Image className="size-3 text-primary" />
                      ) : (
                        <FileText className="size-3 text-muted-foreground" />
                      )}
                      <p className="text-[10px] font-medium text-muted-foreground">
                        Chunk {i + 1}
                      </p>
                      {chunk.chunkType && chunk.chunkType !== "text" && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase text-primary">
                          {chunk.chunkType}
                        </span>
                      )}
                      {chunk.pageNumber && (
                        <span className="text-[9px] text-muted-foreground/60">
                          p.{chunk.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/70 whitespace-pre-wrap">
                      {chunk.text}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {!showChunks && (
          <div className="flex-1 px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Ask about this paper
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use the chat to ask questions about this specific document. All
              answers will be grounded in this paper&apos;s content.
            </p>
          </div>
        )}
      </aside>

      {/* Main: Chat about this document */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 border-b border-border px-6 py-2.5 bg-card/50">
          <MessageSquare className="size-4 text-primary" />
          <h1 className="text-sm font-medium text-foreground">
            Chat with this paper
          </h1>
        </header>
        <ChatInterface
          conversationId={activeConversation}
          selectedDocumentIds={[documentId as Id<"documents">]}
          onConversationCreated={setActiveConversation}
        />
      </main>
    </div>
  );
}
