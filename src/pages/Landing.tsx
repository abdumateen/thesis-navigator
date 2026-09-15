import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Search,
  MessageSquare,
  ArrowRight,
  Network,
  Table,
  Lightbulb,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const features = [
  {
    icon: MessageSquare,
    title: "Ask your library questions",
    description:
      "Pose complex questions across one paper or your entire collection. Every answer cites the exact passage it came from.",
  },
  {
    icon: Table,
    title: "Search tables and figures",
    description:
      "Pages are analyzed visually, so extracted tables and described figures are retrievable alongside regular text.",
  },
  {
    icon: Network,
    title: "Map the citation network",
    description:
      "References are resolved against OpenAlex and rendered as an interactive graph of your research lineage.",
  },
  {
    icon: Lightbulb,
    title: "Connect methods and datasets",
    description:
      "Methods, datasets, and metrics are extracted from each paper and linked across your whole library as a knowledge graph.",
  },
  {
    icon: Target,
    title: "Identify research gaps",
    description:
      "Cross-paper analysis surfaces what is missing, contested, or unresolved — with suggested research questions.",
  },
  {
    icon: Search,
    title: "Trace every claim",
    description:
      "Expand any citation to read the source passage in context, so you can verify before you write.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  }),
};

export default function Landing() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated } = useAuth();

  const primaryAction = () =>
    navigate(isAuthenticated ? "/dashboard" : "/auth");
  const browseAction = () => navigate(isAuthenticated ? "/gaps" : "/auth");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-xs focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <nav
        aria-label="Main navigation"
        className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <FileText className="size-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Thesis Navigator
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={primaryAction}
          >
            {isLoading
              ? "…"
              : isAuthenticated
                ? "Open workspace"
                : "Get started"}
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </nav>

      <main id="main">
        <section className="flex min-h-[92vh] items-center justify-center px-6 pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <h1 className="text-4xl font-light leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
                An AI research assistant for
                <br />
                <span className="font-semibold text-primary">
                  serious literature work.
                </span>
              </h1>
              <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground">
                Thesis Navigator turns a folder of PDFs into a queryable
                research workspace. Ask questions with citations, search tables
                and figures, trace citation networks, and find the gaps in your
                field.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="h-12 gap-2 px-7 text-sm"
                  onClick={primaryAction}
                >
                  {isAuthenticated ? "Open workspace" : "Get started"}
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 gap-2 px-7 text-sm"
                  onClick={browseAction}
                >
                  See what it does
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: 0.4,
                duration: 0.8,
                ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
              }}
              className="mt-24 h-px w-full origin-center bg-border"
            />
          </div>
        </section>

        <section className="px-6 pb-28" aria-labelledby="features-heading">
          <div className="mx-auto max-w-5xl">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-14 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
            >
              What you can do
            </motion.p>
            <h2 id="features-heading" className="sr-only">
              Features
            </h2>
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="text-center"
                >
                  <div className="mx-auto mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 sm:grid-cols-2 sm:items-center">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                  Evidence-backed answers
                </p>
                <h2 className="text-2xl font-light leading-snug tracking-tight sm:text-3xl">
                  Never lose track of
                  <br />
                  <span className="font-semibold">where an idea came from.</span>
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  Answers are assembled only from passages retrieved from your
                  uploaded papers. Each source card names the paper, the chunk,
                  and the page — expand it to read the excerpt in context before
                  you cite it.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
                aria-hidden="true"
              >
                <div className="space-y-3">
                  <div className="rounded-lg border border-primary/10 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
                    <span className="font-medium text-primary">[Source 1]</span>{" "}
                    The authors identify three key limitations in their
                    longitudinal study: small sample size (n=42), lack of
                    demographic diversity, and a follow-up period shorter than
                    two years.
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs text-muted-foreground">
                      Smith et al. — Longitudinal Analysis of Cognitive Decline
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      chunk 14
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs text-muted-foreground">
                      Jones — Meta-Review of Methodological Standards
                    </span>
                    <span className="ml-auto text-[10px] text-muted-foreground/60">
                      chunk 7
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-6 py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-xl text-center"
          >
            <h2 className="text-2xl font-light tracking-tight sm:text-3xl">
              Your literature review starts here.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Create an account to upload papers and build your private
              research workspace — your library, questions, and analysis are
              associated with your account and are not visible to other users.
            </p>
            <Button
              size="lg"
              className="mt-8 h-12 gap-2 px-7 text-sm"
              onClick={primaryAction}
            >
              {isAuthenticated ? "Go to workspace" : "Create your account"}
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded bg-primary">
              <FileText className="size-2.5 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium">Thesis Navigator</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Open source under the MIT license
          </p>
        </div>
      </footer>
    </div>
  );
}
