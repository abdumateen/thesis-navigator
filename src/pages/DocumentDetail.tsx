import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useAction } from "convex/react";
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
  Sparkles,
  Loader2,
  Target,
  HelpCircle,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type DetailTab = "chat" | "novelty";

interface NoveltyResult {
  summary: string;
  novelContributions: Array<{
    contribution: string;
    significance: string;
    noveltyLevel: string;
  }>;
  methodology: {
    approach: string;
    strengths: string[];
    limitations: string[];
  };
  positionInField: {
    buildsOn: string[];
    differentiatesFrom: string[];
    openQuestions: string[];
  };
}

const NOVELTY_COLORS: Record<string, string> = {
  high: "bg-primary/10 text-primary",
  moderate: "bg-amber-500/10 text-amber-600",
  incremental: "bg-muted text-muted-foreground",
};

function NoveltyPanel({ documentId }: { documentId: string }) {
  const [result, setResult] = useState<NoveltyResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const doc = useQuery(
    api.documents.getChunks,
    documentId ? { documentIds: [documentId as Id<"documents">] } : "skip",
  );

  const analyzeNovelty = useAction(
    api.researchAnalysis.analyzeNovelty,
  );

  const docData = doc?.[0];

  const handleAnalyze = useCallback(async () => {
    if (!docData) return;
    setIsAnalyzing(true);
    try {
      const fullText = docData.chunks.map((c) => c.text).join("\n\n");
      const analysis = await analyzeNovelty({
        fullText,
        title: docData.documentTitle,
      });
      setResult(analysis);
    } catch (err) {
      console.error("Novelty analysis failed:", err);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [docData, analyzeNovelty]);

  if (!docData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mb-4">
          <Sparkles className="size-6 text-primary" />
        </div>
        <h3 className="text-sm font-medium text-foreground">
          Novelty Assessment
        </h3>
        <p className="mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
          Analyze this paper to identify its novel contributions, methodological
          strengths and limitations, and how it positions itself within the
          broader research landscape.
        </p>
        <Button
          className="mt-6 h-10 px-6 gap-2 text-sm"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isAnalyzing ? "Analyzing..." : "Analyze novelty"}
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Summary
          </h3>
          <p className="text-sm leading-relaxed text-foreground/80">
            {result.summary}
          </p>
        </div>

        <Separator />

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Novel Contributions
          </h3>
          <div className="space-y-3">
            {result.novelContributions.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {c.contribution}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      {c.significance}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${NOVELTY_COLORS[c.noveltyLevel] || NOVELTY_COLORS.incremental}`}
                  >
                    {c.noveltyLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Methodology
          </h3>
          <p className="text-sm text-foreground/80 mb-3">
            {result.methodology.approach}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="size-3.5 text-primary" />
                <p className="text-xs font-medium text-foreground">Strengths</p>
              </div>
              <ul className="space-y-1.5">
                {result.methodology.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground leading-relaxed flex gap-2"
                  >
                    <span className="text-primary mt-0.5">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="size-3.5 text-amber-500" />
                <p className="text-xs font-medium text-foreground">Limitations</p>
              </div>
              <ul className="space-y-1.5">
                {result.methodology.limitations.map((l, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground leading-relaxed flex gap-2"
                  >
                    <span className="text-amber-500 mt-0.5">−</span>
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Position in Field
          </h3>
          <div className="space-y-4">
            {result.positionInField.buildsOn.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">
                  Builds on
                </p>
                <ul className="space-y-1">
                  {result.positionInField.buildsOn.map((b, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/30"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.positionInField.differentiatesFrom.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">
                  Differentiates from
                </p>
                <ul className="space-y-1">
                  {result.positionInField.differentiatesFrom.map((d, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-border"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.positionInField.openQuestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">
                  Open questions
                </p>
                <ul className="space-y-1">
                  {result.positionInField.openQuestions.map((q, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-amber-500/30"
                    >
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 pb-8">
          <Button
            variant="outline"
            className="h-9 text-xs gap-2"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Re-analyze
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

export default function DocumentDetail() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [showChunks, setShowChunks] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>("chat");
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
      <aside className="flex w-80 flex-col border-r border-border bg-card">
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

        {showChunks ? (
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
        ) : (
          <div className="flex-1 px-5 py-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Quick actions
            </p>
            <div className="space-y-1.5">
              <Button
                variant={detailTab === "chat" ? "default" : "ghost"}
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={() => setDetailTab("chat")}
              >
                <MessageSquare className="size-3.5" />
                Chat with this paper
              </Button>
              <Button
                variant={detailTab === "novelty" ? "default" : "ghost"}
                className="w-full justify-start gap-2 h-8 text-xs"
                onClick={() => setDetailTab("novelty")}
              >
                <Sparkles className="size-3.5" />
                Novelty assessment
              </Button>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 border-b border-border px-6 py-2.5 bg-card/50">
          {detailTab === "chat" ? (
            <MessageSquare className="size-4 text-primary" />
          ) : (
            <Sparkles className="size-4 text-primary" />
          )}
          <h1 className="text-sm font-medium text-foreground">
            {detailTab === "chat"
              ? "Chat with this paper"
              : "Novelty Assessment"}
          </h1>
          <div className="flex-1" />
          <div className="flex gap-1">
            <Button
              variant={detailTab === "chat" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setDetailTab("chat")}
            >
              <MessageSquare className="size-3" />
              Chat
            </Button>
            <Button
              variant={detailTab === "novelty" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setDetailTab("novelty")}
            >
              <Sparkles className="size-3" />
              Novelty
            </Button>
          </div>
        </header>

        {detailTab === "chat" ? (
          <ChatInterface
            conversationId={activeConversation}
            selectedDocumentIds={[documentId as Id<"documents">]}
            onConversationCreated={setActiveConversation}
          />
        ) : (
          <NoveltyPanel documentId={documentId} />
        )}
      </main>
    </div>
  );
}
