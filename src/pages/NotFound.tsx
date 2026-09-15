import { motion } from "framer-motion";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground"
    >
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-2xl font-light tracking-tight sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Button asChild className="mt-8 h-10 px-6 gap-2 text-sm">
        <Link to="/">Back to home</Link>
      </Button>
    </motion.div>
  );
}
