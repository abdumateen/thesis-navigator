import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  User,
  Bot,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Table,
  Image,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface Message {
  _id: Id<"messages">;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    documentId: Id<"documents">;
    documentTitle: string;
    chunkText: string;
    chunkIndex: number;
    chunkType?: string;
    pageNumber?: number;
  }>;
  createdAt: number;
}

function SourceCard({
  source,
}: {
  source: NonNullable<Message["sources"]>[number];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-border/60 bg-muted/30 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      >
        {source.chunkType === "table" ? (
          <Table className="size-3 shrink-0 text-primary" />
        ) : source.chunkType === "figure" ? (
          <Image className="size-3 shrink-0 text-primary" />
        ) : (
          <FileText className="size-3 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate font-medium text-foreground/80">
          {source.documentTitle}
        </span>
        {source.chunkType && source.chunkType !== "text" && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium uppercase text-primary">
            {source.chunkType}
          </span>
        )}
        <span className="text-muted-foreground">#{source.chunkIndex + 1}</span>
        {expanded ? (
          <ChevronUp className="size-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border/40 px-3 py-2 text-muted-foreground leading-relaxed">
          {source.chunkText}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted mt-1">
          <Bot className="size-3.5 text-muted-foreground" />
        </div>
      )}
      <div
        className={`max-w-[80%] space-y-3 ${
          isUser ? "text-right" : ""
        }`}
      >
        <div
          className={`inline-block rounded-lg px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-foreground text-background"
              : "bg-muted/50 text-foreground"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Sources
            </p>
            <div className="space-y-1">
              {message.sources.map((source, i) => (
                <SourceCard key={i} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground/10 mt-1">
          <User className="size-3.5 text-foreground/60" />
        </div>
      )}
    </div>
  );
}

interface ChatInterfaceProps {
  conversationId: Id<"conversations"> | null;
  selectedDocumentIds: Id<"documents">[];
  onConversationCreated?: (id: Id<"conversations">) => void;
}

export function ChatInterface({
  conversationId,
  selectedDocumentIds,
  onConversationCreated,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createConversation = useMutation(api.conversations.create);
  const addMessage = useMutation(api.conversations.addMessage);
  const askQuestion = useAction(api.askQuestion.ask);

  const messages: Message[] | undefined = useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId } : "skip",
  ) as Message[] | undefined;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isAsking) return;
      if (selectedDocumentIds.length === 0) {
        toast.error("Please select at least one document to ask about.");
        return;
      }

      const question = input.trim();
      setInput("");
      setIsAsking(true);

      try {
        // Create conversation if needed
        let convId = conversationId;
        if (!convId) {
          convId = await createConversation({
            title: question.slice(0, 60),
          });
          onConversationCreated?.(convId);
        }

        // Add user message
        await addMessage({
          conversationId: convId,
          role: "user",
          content: question,
        });

        // Ask the AI
        const result = await askQuestion({
          question,
          documentIds: selectedDocumentIds,
        });

        // Add assistant message with sources
        await addMessage({
          conversationId: convId,
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        });
      } catch (error) {
        console.error("Ask error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to get answer. Please try again.",
        );
      } finally {
        setIsAsking(false);
      }
    },
    [
      input,
      isAsking,
      selectedDocumentIds,
      conversationId,
      createConversation,
      addMessage,
      askQuestion,
      onConversationCreated,
    ],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {(!messages || messages.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
                <MessageSquare className="size-5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground">
                Ask anything about your papers
              </h3>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                Upload research papers in the sidebar, then ask questions like
                "What are the limitations mentioned in these studies?" or "Find
                connections between these papers."
              </p>
            </div>
          )}
          <div className="space-y-6">
            {messages?.map((msg) => (
              <MessageBubble key={msg._id} message={msg} />
            ))}
          </div>
          {isAsking && (
            <div className="flex gap-3 mt-6">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <Bot className="size-3.5 text-muted-foreground animate-pulse" />
              </div>
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">Analyzing</span>
                  <span className="animate-pulse [animation-delay:0.2s]">.</span>
                  <span className="animate-pulse [animation-delay:0.4s]">.</span>
                  <span className="animate-pulse [animation-delay:0.6s]">.</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-3"
        >
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedDocumentIds.length === 0
                  ? "Upload papers first, then ask a question..."
                  : "Ask a question about your papers..."
              }
              className="min-h-[44px] max-h-32 resize-none border-border/60 bg-muted/30 pr-12 focus-visible:ring-1 focus-visible:ring-ring text-sm"
              rows={1}
              disabled={isAsking}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isAsking || selectedDocumentIds.length === 0}
            className="shrink-0 h-[44px] w-[44px] rounded-lg"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
