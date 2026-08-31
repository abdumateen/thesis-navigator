import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { FileText, Search, MessageSquare, ArrowRight, Sparkles, Network } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const features = [
  {
    icon: FileText,
    title: "Upload your papers",
    description:
      "Drop in PDFs from your research library. We extract text, tables, and figures — indexing every passage for instant retrieval.",
  },
  {
    icon: Search,
    title: "Ask complex questions",
    description:
      "Pose nuanced questions across your entire collection. Our retrieval pipeline surfaces the most relevant passages from your papers.",
  },
  {
    icon: MessageSquare,
    title: "Get cited answers",
    description:
      "Every answer links back to its source. Expand citations to verify claims, explore context, and trace ideas to their origin.",
  },
  {
    icon: Network,
    title: "Explore the research landscape",
    description:
      "Visualize citation networks and knowledge graphs. See how your papers connect, discover shared concepts, and find research gaps.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  }),
};

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
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
            className="h-8 text-xs gap-1.5"
            onClick={() =>
              navigate(isAuthenticated ? "/dashboard" : "/auth")
            }
          >
            {isAuthenticated ? "Open workspace" : "Get started"}
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen items-center justify-center px-6 pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                Academic research assistant
              </span>
            </div>
            <h1 className="text-4xl font-light tracking-tight sm:text-5xl md:text-6xl leading-[1.08]">
              Stop drowning in PDFs.
              <br />
              <span className="font-semibold text-primary">
                Start finding answers.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground">
              Thesis Navigator reads through your research papers, understands
              their content, and lets you ask questions that surface connections,
              limitations, and gaps — always with precise source citations.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-12 px-7 gap-2 text-sm"
                onClick={() =>
                  navigate(isAuthenticated ? "/dashboard" : "/auth")
                }
              >
                Start reading smarter
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>

          {/* Decorative line */}
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

      {/* Features */}
      <section className="px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-14 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
          >
            How it works
          </motion.p>
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Detail: what makes it different */}
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
                Beyond simple Q&A
              </p>
              <h2 className="text-2xl font-light tracking-tight leading-snug sm:text-3xl">
                Understand the full
                <br />
                <span className="font-semibold">research landscape.</span>
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Thesis Navigator doesn&apos;t just answer questions. It extracts
                tables and figures, maps citation networks, identifies shared
                methods and datasets across papers, and visualizes the intellectual
                structure of your research library.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="space-y-3">
                <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3 text-sm leading-relaxed">
                  <span className="text-primary font-medium">[Source 1]</span>{" "}
                  The authors identify three key limitations in their
                  longitudinal study: small sample size (n=42), lack of
                  demographic diversity, and a follow-up period shorter than
                  two years.
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                  <FileText className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    Smith et al. — Longitudinal Analysis of Cognitive
                    Decline
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground/60">
                    chunk 14
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
                  <FileText className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
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

      {/* CTA */}
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
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Upload your papers, ask your questions, and let Thesis Navigator
            surface the connections you&apos;ve been looking for.
          </p>
          <Button
            size="lg"
            className="mt-8 h-12 px-7 gap-2 text-sm"
            onClick={() =>
              navigate(isAuthenticated ? "/dashboard" : "/auth")
            }
          >
            {isAuthenticated ? "Go to workspace" : "Create your account"}
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded bg-primary">
              <FileText className="size-2.5 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium">Thesis Navigator</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Thesis Navigator
          </p>
        </div>
      </footer>
    </div>
  );
}
