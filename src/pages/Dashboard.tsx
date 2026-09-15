import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { PdfUploader } from "@/components/PdfUploader";
import { ChatInterface } from "@/components/ChatInterface";
import { LibraryGrid } from "@/components/LibraryGrid";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LogOut,
  Trash2,
  Check,
  FileText,
  MessageSquare,
  Plus,
  BookOpen,
  Network,
  Search,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type Tab = "library" | "chat";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("library");
  const [selectedDocs, setSelectedDocs] = useState<Set<Id<"documents">>>(
    new Set(),
  );
  const [activeConversation, setActiveConversation] =
    useState<Id<"conversations"> | null>(null);

  const documents = useQuery(api.documents.list);
  const conversations = useQuery(api.conversations.list);
  const deleteDocument = useMutation(api.documents.remove);
  const deleteConversation = useMutation(api.conversations.remove);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const toggleDocSelection = useCallback((docId: Id<"documents">) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  }, []);

  const selectAllDocs = useCallback(() => {
    if (!documents) return;
    setSelectedDocs(new Set(documents.map((d) => d._id)));
  }, [documents]);

  const deselectAllDocs = useCallback(() => {
    setSelectedDocs(new Set());
  }, []);

  const handleDeleteDocument = useCallback(
    async (docId: Id<"documents">) => {
      try {
        await deleteDocument({ documentId: docId });
        setSelectedDocs((prev) => {
          const next = new Set(prev);
          next.delete(docId);
          return next;
        });
        toast.success("Document removed");
      } catch {
        toast.error("Failed to remove document");
      }
    },
    [deleteDocument],
  );

  const handleDeleteConversation = useCallback(
    async (convId: Id<"conversations">) => {
      try {
        await deleteConversation({ conversationId: convId });
        if (activeConversation === convId) {
          setActiveConversation(null);
        }
        toast.success("Conversation deleted");
      } catch {
        toast.error("Failed to delete conversation");
      }
    },
    [deleteConversation, activeConversation],
  );

  const startNewChat = useCallback(() => {
    setActiveConversation(null);
    setTab("chat");
  }, []);

  const docs = documents ?? [];
  const convs = conversations ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="flex w-72 flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <FileText className="size-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Thesis Navigator
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </Button>
        </div>

        <div className="flex gap-1 px-3 pt-3">
          <Button
            variant={tab === "library" ? "default" : "ghost"}
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => setTab("library")}
          >
            <BookOpen className="size-3.5" />
            Library
          </Button>
          <Button
            variant={tab === "chat" ? "default" : "ghost"}
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => setTab("chat")}
          >
            <MessageSquare className="size-3.5" />
            Chat
          </Button>
        </div>

        {tab === "chat" && (
          <>
            <div className="px-3 pt-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm font-normal h-9 border-border/60"
                onClick={startNewChat}
              >
                <Plus className="size-3.5" />
                New conversation
              </Button>
            </div>

            <div className="mt-2 px-1">
              <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Conversations
              </p>
              <ScrollArea className="max-h-48">
                {convs.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-muted-foreground/60 italic">
                    No conversations yet
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {convs.map((conv) => (
                      <div
                        key={conv._id}
                        className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer transition-colors ${
                          activeConversation === conv._id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                        }`}
                        onClick={() => {
                          setActiveConversation(conv._id);
                          setTab("chat");
                        }}
                      >
                        <MessageSquare className="size-3 shrink-0" />
                        <span className="flex-1 truncate">{conv.title}</span>
                      <button
                        type="button"
                        aria-label={`Delete conversation "${conv.title}"`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv._id);
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-foreground"
                      >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <Separator className="my-2" />
          </>
        )}

        {tab === "chat" && (
          <div className="flex-1 overflow-hidden flex flex-col px-3 pb-3">
            <div className="flex items-center justify-between py-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Select papers ({docs.length})
              </p>
              {docs.length > 0 && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={selectAllDocs}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    All
                  </button>
                  <span className="text-muted-foreground/40">·</span>
                  <button
                    type="button"
                    onClick={deselectAllDocs}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    None
                  </button>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 -mx-1">
              <div className="space-y-1 px-1">
                {docs.map((doc) => {
                  const isSelected = selectedDocs.has(doc._id);
                  return (
                    <div
                      key={doc._id}
                      className={`group flex items-center gap-2 rounded-md px-2 py-2 text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/5 text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                      }`}
                      onClick={() => toggleDocSelection(doc._id)}
                    >
                      <div
                        className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {isSelected && <Check className="size-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{doc.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {doc.chunkCount} chunks
                        </p>
                      </div>                      <button
                        type="button"
                        aria-label={`Delete document "${doc.title}"`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc._id);
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="mt-3">
              <PdfUploader />
            </div>
          </div>
        )}

        {tab === "library" && (
          <div className="flex-1 overflow-hidden flex flex-col px-3 pb-3 pt-2">
            <ScrollArea className="flex-1 -mx-1 mb-3">
              <div className="space-y-1 px-1">
                {docs.map((doc) => (                    <div
                      key={doc._id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/document/${doc._id}`);
                        }
                      }}
                      className="group flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.03] hover:text-foreground focus-visible:outline focus-visible:outline-ring"
                      onClick={() => navigate(`/document/${doc._id}`)}
                    >
                    <FileText className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate font-medium">{doc.title}</span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {doc.chunkCount}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-1.5 mt-2">
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs gap-1.5 border-border/60"
                onClick={() => navigate("/graph")}
              >
                <Network className="size-3.5" />
                Graph
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-9 text-xs gap-1.5 border-border/60"
                onClick={() => navigate("/gaps")}
                disabled={docs.length < 2}
              >
                <Search className="size-3.5" />
                Gaps
              </Button>
            </div>
            <PdfUploader onUploadComplete={() => {}} />
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-border px-6 py-2.5 bg-card/50">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-medium text-foreground">
              {tab === "library"
                ? "Library"
                : activeConversation
                  ? convs.find((c) => c._id === activeConversation)?.title ?? "Chat"
                  : "New conversation"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {tab === "chat" && selectedDocs.size > 0 && (
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-medium">
                {selectedDocs.size} paper{selectedDocs.size !== 1 ? "s" : ""} selected
              </span>
            )}
            {user?.name && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium">
                {user.name}
              </span>
            )}
          </div>
        </header>

        {tab === "library" ? (
          <LibraryGrid />
        ) : (
          <ChatInterface
            conversationId={activeConversation}
            selectedDocumentIds={Array.from(selectedDocs)}
            onConversationCreated={setActiveConversation}
          />
        )}
      </main>
    </div>
  );
}
