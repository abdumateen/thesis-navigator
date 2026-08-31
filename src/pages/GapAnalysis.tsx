import { useState, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Search,
  Lightbulb,
  AlertTriangle,
  Wrench,
  Rocket,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface GapResult {
  landscape: string;
  gaps: Array<{
    topic: string;
    description: string;
    evidence: string;
    potentialImpact: string;
    suggestedQuestions: string[];
  }>;
  contestedAreas: Array<{
    topic: string;
    description: string;
    papers: string[];
  }>;
  methodologyGaps: Array<{
    gap: string;
    description: string;
  }>;
  futureDirections: Array<{
    direction: string;
    rationale: string;
    prerequisites: string[];
  }>;
}

const IMPACT_COLORS: Record<string, string> = {
  high: "bg-primary/10 text-primary",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-muted text-muted-foreground",
};

export default function GapAnalysis() {
  const navigate = useNavigate();
  const [result, setResult] = useState<GapResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const documents = useQuery(api.documents.list);
  const analyzeGaps = useAction(api.researchAnalysis.analyzeGaps);

  const docs = documents ?? [];

  const handleAnalyze = useCallback(async () => {
    if (docs.length < 2) {
      toast.error("Upload at least 2 papers to analyze research gaps.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const papers = docs.map((doc) => ({
        title: doc.title,
        fullText: doc.fullText,
      }));

      const analysis = await analyzeGaps({ papers });
      setResult(analysis);
    } catch (err) {
      console.error("Gap analysis failed:", err);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [docs, analyzeGaps]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
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
            <Search className="size-4 text-primary" />
            <span className="text-sm font-semibold">Gap Analysis</span>
          </div>
        </div>

        <div className="px-4 py-4">
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            Analyze your research library to discover gaps, contested areas,
            methodological weaknesses, and promising future directions.
          </p>

          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 mb-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Papers in library
            </p>
            <p className="mt-0.5 text-lg font-semibold text-foreground">
              {docs.length}
            </p>
          </div>

          <Button
            className="w-full h-10 gap-2 text-sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing || docs.length < 2}
          >
            {isAnalyzing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            {isAnalyzing ? "Analyzing gaps..." : "Analyze research gaps"}
          </Button>

          {docs.length < 2 && (
            <p className="mt-2 text-[10px] text-muted-foreground text-center">
              Upload at least 2 papers to enable gap analysis
            </p>
          )}
        </div>

        <Separator />

        {/* Paper list */}
        <div className="flex-1 overflow-hidden flex flex-col px-3 pb-3 pt-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground py-1 px-1">
            Included papers
          </p>
          <ScrollArea className="flex-1">
            <div className="space-y-0.5">
              {docs.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs"
                >
                  <FileText className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-foreground/80">
                      {doc.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {doc.chunkCount} chunks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border px-6 py-2.5 bg-card/50">
          <h1 className="text-sm font-medium text-foreground">
            {result ? "Research Gap Analysis" : "Discover What's Missing"}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Search className="size-6 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                Analyze your research landscape
              </h3>
              <p className="mt-2 max-w-md text-xs text-muted-foreground leading-relaxed">
                Thesis Navigator will examine all your uploaded papers to
                identify what&apos;s missing, what&apos;s contested, and where
                the most promising research opportunities lie.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 max-w-lg">
                <div className="rounded-lg border border-border bg-card p-4 text-left">
                  <Target className="size-4 text-primary mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    Research gaps
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Topics and questions that are understudied in your collection
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-left">
                  <AlertTriangle className="size-4 text-amber-500 mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    Contested areas
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Points of disagreement or conflicting findings
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-left">
                  <Wrench className="size-4 text-primary mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    Methodology gaps
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Methodological improvements needed in the field
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 text-left">
                  <Rocket className="size-4 text-primary mb-2" />
                  <p className="text-xs font-medium text-foreground">
                    Future directions
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Promising research avenues with high potential impact
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
              {/* Landscape overview */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  Research Landscape
                </h3>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {result.landscape}
                </p>
              </div>

              {/* Research Gaps */}
              {result.gaps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Research Gaps
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      {result.gaps.length} identified
                    </span>
                  </div>
                  <div className="space-y-4">
                    {result.gaps.map((gap, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-5"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-sm font-medium text-foreground">
                            {gap.topic}
                          </h4>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize ${IMPACT_COLORS[gap.potentialImpact] || IMPACT_COLORS.low}`}
                          >
                            {gap.potentialImpact} impact
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                          {gap.description}
                        </p>
                        {gap.evidence && (
                          <p className="text-[11px] text-muted-foreground/70 italic mb-3">
                            Evidence: {gap.evidence}
                          </p>
                        )}
                        {gap.suggestedQuestions.length > 0 && (
                          <div className="mt-3 rounded-lg bg-primary/5 border border-primary/10 p-3">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-primary mb-2">
                              Suggested research questions
                            </p>
                            <ul className="space-y-1.5">
                              {gap.suggestedQuestions.map((q, qi) => (
                                <li
                                  key={qi}
                                  className="text-xs text-foreground/80 leading-relaxed flex gap-2"
                                >
                                  <span className="text-primary mt-0.5 shrink-0">→</span>
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Contested Areas */}
              {result.contestedAreas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Contested Areas
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {result.contestedAreas.map((area, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-5"
                      >
                        <h4 className="text-sm font-medium text-foreground mb-2">
                          {area.topic}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          {area.description}
                        </p>
                        {area.papers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {area.papers.map((paper, pi) => (
                              <span
                                key={pi}
                                className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] text-muted-foreground"
                              >
                                {paper}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Methodology Gaps */}
              {result.methodologyGaps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Wrench className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Methodology Gaps
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {result.methodologyGaps.map((mg, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-5"
                      >
                        <h4 className="text-sm font-medium text-foreground mb-1.5">
                          {mg.gap}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {mg.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Future Directions */}
              {result.futureDirections.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Rocket className="size-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Future Directions
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {result.futureDirections.map((fd, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-5"
                      >
                        <h4 className="text-sm font-medium text-foreground mb-1.5">
                          {fd.direction}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                          {fd.rationale}
                        </p>
                        {fd.prerequisites.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                              Prerequisites
                            </p>
                            <ul className="space-y-1">
                              {fd.prerequisites.map((p, pi) => (
                                <li
                                  key={pi}
                                  className="text-[11px] text-muted-foreground flex gap-1.5"
                                >
                                  <span className="text-muted-foreground/50">•</span>
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Re-analyze */}
              <div className="pt-4 pb-12">
                <Button
                  variant="outline"
                  className="h-9 text-xs gap-2"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Search className="size-3.5" />
                  )}
                  Re-analyze
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
