import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";

const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail.tsx"));
const GraphExplorer = lazy(() => import("./pages/GraphExplorer.tsx"));
const GapAnalysis = lazy(() => import("./pages/GapAnalysis.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown runtime error" };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="mt-2 break-words text-xs text-muted-foreground">
              {this.state.message}
            </p>
            <button
              type="button"
              className="mt-4 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-sm text-muted-foreground">Loading…</div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/dashboard" />}
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/document/:documentId"
                element={
                  <RequireAuth>
                    <DocumentDetail />
                  </RequireAuth>
                }
              />
              <Route
                path="/graph"
                element={
                  <RequireAuth>
                    <GraphExplorer />
                  </RequireAuth>
                }
              />
              <Route
                path="/gaps"
                element={
                  <RequireAuth>
                    <GapAnalysis />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
