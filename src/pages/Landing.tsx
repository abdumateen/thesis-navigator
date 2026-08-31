import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { FileText, Search, MessageSquare, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const features = [
  {
    icon: FileText,
    title: "Upload & Extract",
    description:
      "Drop in your PDFs. We extract text, chunk it intelligently, and index it for instant retrieval.",
  },
  {
    icon: Search,
    title: "Ask Anything",
    description:
      "Pose complex questions across your entire library. Our RAG pipeline finds the most relevant passages.",
  },
  {
    icon: MessageSquare,
    title: "Cited Answers",
    description:
      "Every answer links back to its source with expandable citations so you can verify and explore further.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
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
            <div className="flex size-7 items-center justify-center rounded-md bg-foreground">
              <FileText className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Thesis Navigator
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-border/60 text-xs"
            onClick={() =>
              navigate(isAuthenticated ? "/dashboard" : "/auth")
            }
          >
            {isAuthenticated ? "Dashboard" : "Get started"}
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen items-center justify-center px-6 pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
          >
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Academic Research Assistant
            </p>
            <h1 className="text-4xl font-light tracking-tight sm:text-5xl md:text-6xl leading-[1.1]">
              Read less.
              <br />
              <span className="font-semibold">Understand more.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Upload your research papers and ask complex questions. Thesis
              Navigator finds the connections, limitations, and gaps across your
              entire library — with precise source citations.
            </p>
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                size="lg"
                className="h-11 px-6 gap-2 text-sm"
                onClick={() =>
                  navigate(isAuthenticated ? "/dashboard" : "/auth")
                }
              >
                Start reading smarter
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </motion.div>

          {/* Minimal decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }}
            className="mt-20 h-px w-full origin-center bg-border"
          />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
          >
            How it works
          </motion.p>
          <div className="grid gap-16 sm:grid-cols-3">
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
                <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full border border-border">
                  <feature.icon className="size-4 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-24">
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
            Built for graduate students who need to find patterns, gaps, and
            connections across hundreds of papers — without the manual overhead.
          </p>
          <Button
            size="lg"
            className="mt-8 h-11 px-6 gap-2 text-sm"
            onClick={() =>
              navigate(isAuthenticated ? "/dashboard" : "/auth")
            }
          >
            {isAuthenticated ? "Go to dashboard" : "Create free account"}
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded bg-foreground">
              <FileText className="size-2.5 text-background" />
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
