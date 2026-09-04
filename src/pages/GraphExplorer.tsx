/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  Network,
  Lightbulb,
  Loader2,
  RefreshCw,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Network as VisNetwork } from "vis-network/standalone";
import { DataSet as VisDataSet } from "vis-data";

type GraphView = "citation" | "knowledge";

const ENTITY_COLORS: Record<string, { bg: string; border: string }> = {
  method: { bg: "#4f46e5", border: "#3730a3" },
  dataset: { bg: "#059669", border: "#047857" },
  metric: { bg: "#d97706", border: "#b45309" },
  concept: { bg: "#7c3aed", border: "#6d28d9" },
};

export default function GraphExplorer() {
  const navigate = useNavigate();
  const [view, setView] = useState<GraphView>("citation");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingDoc, setProcessingDoc] = useState("");

  const graphRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<VisNetwork | null>(null);

  const documents = useQuery(api.documents.list);
  const papers = useQuery(api.citationGraph.getPapers);
  const links = useQuery(api.citationGraph.getLinks);
  const entities = useQuery(api.citationGraph.getEntities);
  const deletePaper = useMutation(api.citationGraph.deletePaper);

  const processReferences = useAction(
    api.extractReferences.processDocumentReferences,
  );
  const extractEntitiesAction = useAction(api.extractEntities.extractEntities);
  const savePaper = useMutation(api.citationGraph.savePaper);
  const saveLink = useMutation(api.citationGraph.saveLink);
  const saveEntities = useMutation(api.citationGraph.saveEntities);

  const docs = documents ?? [];
  const allPapers = papers ?? [];
  const allLinks = links ?? [];
  const allEntities = entities ?? [];

  const handleProcessDocument = useCallback(
    async (docId: string, fullText: string, title: string) => {
      setIsProcessing(true);
      setProcessingDoc(title);

      try {
        const sourcePaperId = await savePaper({
          title,
          sourceDocumentId: docId as any,
        });

        setProcessingDoc(`Extracting concepts from "${title}"...`);
        const ents: { methods: string[]; datasets: string[]; metrics: string[]; concepts: string[] } = await extractEntitiesAction({ fullText });
        const entityList = [
          ...ents.methods.map((m: string) => ({ name: m, type: "method" as const })),
          ...ents.datasets.map((d: string) => ({ name: d, type: "dataset" as const })),
          ...ents.metrics.map((m: string) => ({ name: m, type: "metric" as const })),
          ...ents.concepts.map((c: string) => ({ name: c, type: "concept" as const })),
        ];

        if (entityList.length > 0) {
          await saveEntities({
            documentId: docId as any,
            entities: entityList,
          });
        }

        setProcessingDoc(`Finding cited papers for "${title}"...`);
        const result = await processReferences({
          documentId: docId as any,
          fullText,
        });

        let linkCount = 0;
        for (const paper of result.papers) {
          const targetPaperId = await savePaper({
            title: paper.title,
            authors: paper.authors,
            year: paper.year ?? undefined,
            citationCount: paper.citationCount,
            abstract: paper.abstract || undefined,
            openAlexId: paper.openAlexId,
            doi: paper.doi ?? undefined,
          });

          await saveLink({
            sourcePaperId: sourcePaperId as any,
            targetPaperId: targetPaperId as any,
            relationship: "cites",
          });
          linkCount++;
        }

        const summary = [
          entityList.length > 0 ? `${entityList.length} concepts` : "",
          linkCount > 0 ? `${linkCount} citations` : "",
        ]
          .filter(Boolean)
          .join(", ");

        toast.success(
          `Processed "${title}"${summary ? ` — ${summary}` : ""}`,
        );
      } catch (err) {
        console.error("Processing failed:", err);
        toast.error(`Failed to process "${title}"`);
      } finally {
        setIsProcessing(false);
        setProcessingDoc("");
      }
    },
    [savePaper, extractEntitiesAction, saveEntities, processReferences, saveLink],
  );

  const handleProcessAll = useCallback(async () => {
    const processedDocIds = new Set(
      allPapers.filter((p) => p.sourceDocumentId).map((p) => p.sourceDocumentId),
    );
    const unprocessed = docs.filter((d) => !processedDocIds.has(d._id));

    if (unprocessed.length === 0) {
      toast.info("All documents have been processed.");
      return;
    }

    for (const doc of unprocessed) {
      await handleProcessDocument(doc._id, doc.fullText, doc.title);
    }
  }, [docs, allPapers, handleProcessDocument]);

  const handleDeletePaper = useCallback(
    async (paperId: string) => {
      try {
        await deletePaper({ paperId: paperId as any });
        toast.success("Paper removed from graph");
      } catch {
        toast.error("Failed to remove paper");
      }
    },
    [deletePaper],
  );

  useEffect(() => {
    if (!graphRef.current) return;

    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    const nodes = new VisDataSet<any>([]);
    const edges = new VisDataSet<any>([]);

    if (view === "citation") {
      const sourceDocs = new Set(
        allPapers.filter((p) => p.sourceDocumentId).map((p) => p._id),
      );

      for (const paper of allPapers) {
        const isSource = sourceDocs.has(paper._id);
        nodes.add({
          id: paper._id,
          label: (paper.title?.slice(0, 40) ?? "Untitled") + (paper.title && paper.title.length > 40 ? "..." : ""),
          title: `${paper.title}\n${paper.authors ? paper.authors + "\n" : ""}${paper.year ? paper.year + " · " : ""}${paper.citationCount ?? 0} citations`,
          shape: isSource ? "dot" : "diamond",
          size: isSource ? 25 : 12 + Math.min((paper.citationCount ?? 0) / 100, 15),
          color: {
            background: isSource ? "#4f46e5" : "#6366f1",
            border: isSource ? "#3730a3" : "#4f46e5",
            highlight: { background: "#6366f1", border: "#4f46e5" },
          },
          font: {
            color: "#374151",
            size: isSource ? 13 : 10,
            face: "Inter, system-ui, sans-serif",
          },
          borderWidth: isSource ? 3 : 1,
        });
      }

      for (const link of allLinks) {
        if (link.relationship === "cites") {
          edges.add({
            from: link.sourcePaperId,
            to: link.targetPaperId,
            color: { color: "#c7d2fe", highlight: "#4f46e5" },
            width: 1.5,
            arrows: { to: { enabled: true, scaleFactor: 0.5 } },
            smooth: { type: "curvedCW", roundness: 0.2 },
          });
        }
      }
    } else {
      const entityNodes = new Map<string, any>();
      const conceptEdges = new Map<string, Set<string>>();

      for (const entity of allEntities) {
        const colors = ENTITY_COLORS[entity.type] || ENTITY_COLORS.concept;
        entityNodes.set(entity.name, {
          id: `entity-${entity.name}`,
          label: entity.name,
          title: `${entity.type}: ${entity.name}\nUsed in ${entity.documentIds.length} paper(s)`,
          shape: "dot",
          size: 8 + entity.documentIds.length * 4,
          color: {
            background: colors.bg,
            border: colors.border,
            highlight: { background: colors.border, border: colors.bg },
          },
          font: { color: "#374151", size: 10, face: "Inter, system-ui, sans-serif" },
        });

        const docIds = entity.documentIds;
        for (let i = 0; i < docIds.length; i++) {
          for (let j = i + 1; j < docIds.length; j++) {
            const key = [docIds[i], docIds[j]].sort().join("-");
            if (!conceptEdges.has(key)) conceptEdges.set(key, new Set());
            conceptEdges.get(key)!.add(entity.name);
          }
        }
      }

      const papersWithEntities = new Set<string>();
      for (const entity of allEntities) {
        for (const docId of entity.documentIds) papersWithEntities.add(docId);
      }

      for (const doc of docs) {
        if (papersWithEntities.has(doc._id)) {
          nodes.add({
            id: `doc-${doc._id}`,
            label: doc.title.slice(0, 35) + "...",
            title: doc.title,
            shape: "dot",
            size: 18,
            color: {
              background: "#1e293b",
              border: "#0f172a",
              highlight: { background: "#334155", border: "#1e293b" },
            },
            font: { color: "#374151", size: 11, face: "Inter, system-ui, sans-serif" },
          });
        }
      }

      for (const [, nodeData] of entityNodes) nodes.add(nodeData);

      for (const [key, sharedConcepts] of conceptEdges) {
        const [id1, id2] = key.split("-");
        edges.add({
          from: `doc-${id1}`,
          to: `doc-${id2}`,
          label: sharedConcepts.size > 1 ? `${sharedConcepts.size} shared` : "",
          title: `Shared: ${Array.from(sharedConcepts).join(", ")}`,
          color: { color: "#e2e8f0", highlight: "#4f46e5" },
          width: Math.min(sharedConcepts.size, 4),
          smooth: { type: "continuous" },
        });
      }

      for (const entity of allEntities) {
        for (const docId of entity.documentIds) {
          if (papersWithEntities.has(docId)) {
            const colors = ENTITY_COLORS[entity.type] || ENTITY_COLORS.concept;
            edges.add({
              from: `doc-${docId}`,
              to: `entity-${entity.name}`,
              color: { color: colors.bg + "40", highlight: colors.bg },
              width: 0.8,
              dashes: true,
              smooth: { type: "continuous" },
            });
          }
        }
      }
    }

    const network = new VisNetwork(
      graphRef.current,
      { nodes, edges },
      {
        physics: {
          enabled: true,
          solver: "forceAtlas2Based",
          forceAtlas2Based: {
            gravitationalConstant: -40,
            centralGravity: 0.005,
            springLength: 150,
            springConstant: 0.06,
            damping: 0.4,
          },
          stabilization: { iterations: 200, fit: true },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          navigationButtons: true,
          keyboard: { enabled: true },
        },
        layout: { improvedLayout: true },
      },
    );

    networkRef.current = network;

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [view, allPapers, allLinks, allEntities, docs]);

  const processedDocIds = new Set(
    allPapers.filter((p) => p.sourceDocumentId).map((p) => p.sourceDocumentId),
  );
  const unprocessedCount = docs.filter((d) => !processedDocIds.has(d._id)).length;

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
          <div className="flex items-center gap-2 flex-1">
            <Network className="size-4 text-primary" />
            <span className="text-sm font-semibold">Research Graph</span>
          </div>
        </div>

        <div className="flex gap-1 px-3 pt-3">
          <Button
            variant={view === "citation" ? "default" : "ghost"}
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => setView("citation")}
          >
            <Network className="size-3.5" />
            Citations
          </Button>
          <Button
            variant={view === "knowledge" ? "default" : "ghost"}
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => setView("knowledge")}
          >
            <Lightbulb className="size-3.5" />
            Concepts
          </Button>
        </div>

        <div className="px-3 pt-3">
          {unprocessedCount > 0 ? (
            <Button
              variant="outline"
              className="w-full h-9 text-xs gap-2 border-border/60"
              onClick={handleProcessAll}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {isProcessing
                ? processingDoc || "Processing..."
                : `Process ${unprocessedCount} new paper${unprocessedCount !== 1 ? "s" : ""}`}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Sparkles className="size-3 text-primary" />
              All papers processed
            </div>
          )}
        </div>

        <Separator className="my-3" />

        <div className="grid grid-cols-3 gap-2 px-3">
          <div className="rounded-lg border border-border bg-muted/30 px-2 py-2 text-center">
            <p className="text-lg font-semibold text-foreground">{allPapers.length}</p>
            <p className="text-[9px] text-muted-foreground">Papers</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-2 py-2 text-center">
            <p className="text-lg font-semibold text-foreground">{allLinks.length}</p>
            <p className="text-[9px] text-muted-foreground">Links</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-2 py-2 text-center">
            <p className="text-lg font-semibold text-foreground">{allEntities.length}</p>
            <p className="text-[9px] text-muted-foreground">Concepts</p>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex-1 overflow-hidden flex flex-col px-3 pb-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-1">
            Papers in graph
          </p>
          <ScrollArea className="flex-1">
            <div className="space-y-0.5">
              {allPapers.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic py-2">
                  No papers in graph yet. Process your documents above.
                </p>
              ) : (
                allPapers.map((paper) => (
                  <div
                    key={paper._id}
                    className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-foreground/[0.03] transition-colors"
                  >
                    <FileText className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-foreground/80">
                        {paper.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {paper.year ? `${paper.year} · ` : ""}
                        {paper.citationCount ?? 0} citations
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePaper(paper._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border px-6 py-2.5 bg-card/50">
          <h1 className="text-sm font-medium text-foreground">
            {view === "citation" ? "Citation Network" : "Knowledge Graph"}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {allPapers.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => networkRef.current?.fit({ animation: true })}
              >
                <RefreshCw className="size-3" />
                Fit view
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 relative">
          {allPapers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Network className="size-6 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                No papers in the graph yet
              </h3>
              <p className="mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
                Go to your Library, process some documents, and their citations
                and concepts will appear here as an interactive network.
              </p>
              <Button
                variant="outline"
                className="mt-6 h-9 text-xs gap-2"
                onClick={() => navigate("/dashboard")}
              >
                <FileText className="size-3.5" />
                Go to Library
              </Button>
            </div>
          ) : (
            <div ref={graphRef} className="absolute inset-0 bg-background" />
          )}
        </div>
      </main>
    </div>
  );
}
