import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import { useRef, useState } from "react";
import {
  BarChart3Icon,
  CopyIcon,
  Gamepad2Icon,
  HistoryIcon,
  ListTodoIcon,
  ServerIcon,
  SparklesIcon,
  SquarePenIcon,
  UserRoundIcon,
} from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { StudioPromptBox } from "@/components/studio-prompt-box";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/features/ai/components/model-selector";
import { useSelectedModel } from "@/features/ai/hooks/use-selected-model";

import {
  useConversation,
  useConversations,
  useCreateConversation,
  useMessages,
} from "../hooks/use-conversation";

import { Id } from "../../../../convex/_generated/dataModel";
import { DEFAULT_CONVERSATION_TITLE } from "../../../../convex/constants";
import { PastConversationsDialog } from "./past-conversations-dialog";

// Starter ideas shown on an empty conversation, like AI Studio's model cards
const STARTERS = [
  {
    title: "Landing page",
    description: "Hero, features and pricing sections.",
    prompt: "Build a modern landing page with a hero, a features grid and a pricing table using Vite + React.",
    icon: SparklesIcon,
    tint: "bg-amber-500/15 text-amber-500",
  },
  {
    title: "Dashboard",
    description: "Charts and KPI cards.",
    prompt: "Build an analytics dashboard with KPI cards and a line chart using Vite + React.",
    icon: BarChart3Icon,
    tint: "bg-blue-500/15 text-blue-500",
  },
  {
    title: "Game",
    description: "A playable Snake game.",
    prompt: "Build a playable Snake game with score and restart using Vite + React and a canvas.",
    icon: Gamepad2Icon,
    tint: "bg-rose-500/15 text-rose-500",
  },
  {
    title: "Todo app",
    description: "Filters and local storage.",
    prompt: "Build a todo app with filters (all, active, done) that saves to local storage, using Vite + React.",
    icon: ListTodoIcon,
    tint: "bg-emerald-500/15 text-emerald-500",
  },
  {
    title: "Portfolio",
    description: "Projects and a contact form.",
    prompt: "Build a personal portfolio with a projects grid and a contact form using Vite + React.",
    icon: UserRoundIcon,
    tint: "bg-violet-500/15 text-violet-500",
  },
  {
    title: "REST API",
    description: "Express with in-memory data.",
    prompt: "Build a REST API with Express that has CRUD endpoints for notes stored in memory.",
    icon: ServerIcon,
    tint: "bg-cyan-500/15 text-cyan-500",
  },
];

const ConversationEmpty = ({ onPick }: { onPick: (prompt: string) => void }) => {
  return (
    <div className="flex flex-col gap-5 py-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-normal tracking-tight">What do you want to build?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick an idea or describe your own app below.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {STARTERS.map((starter) => (
          <button
            key={starter.title}
            type="button"
            onClick={() => onPick(starter.prompt)}
            className="flex flex-col gap-2.5 rounded-xl border bg-card p-3.5 text-left transition-colors hover:bg-surface-hover"
          >
            <span className="flex items-center gap-2.5">
              <span className={cn("size-7 rounded-md flex items-center justify-center", starter.tint)}>
                <starter.icon className="size-4" />
              </span>
              <span className="text-sm font-medium">{starter.title}</span>
            </span>
            <span className="text-xs text-muted-foreground leading-snug">
              {starter.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface ConversationSidebarProps {
  projectId: Id<"projects">;
};

export const ConversationSidebar = ({
  projectId,
}: ConversationSidebarProps) => {
  const [input, setInput] = useState("");
  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<Id<"conversations"> | null>(null);
  const [
    pastConversationsOpen,
    setPastConversationsOpen
  ] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [modelId, setModelId] = useSelectedModel();

  const createConversation = useCreateConversation();
  const conversations = useConversations(projectId);

  const activeConversationId =
    selectedConversationId ?? conversations?.[0]?._id ?? null;

  const activeConversation = useConversation(activeConversationId);
  const conversationMessages = useMessages(activeConversationId);

  // Check if any message is currently processing
  const isProcessing = conversationMessages?.some(
    (msg) => msg.status === "processing"
  );

  const handleCancel = async () => {
    try {
      await ky.post("/api/messages/cancel", {
        json: { projectId },
      });
    } catch {
      toast.error("Unable to cancel request");
    }
  };

  const handleCreateConversation = async () => {
    try {
      const newConversationId = await createConversation({
        projectId,
        title: DEFAULT_CONVERSATION_TITLE,
      });
      setSelectedConversationId(newConversationId);
      return newConversationId;
    } catch {
      toast.error("Unable to create new conversation");
      return null;
    }
  };

  const handleSubmit = async (text: string) => {
    let conversationId = activeConversationId;

    if (!conversationId) {
      conversationId = await handleCreateConversation();
      if (!conversationId) {
        return;
      }
    }

    // Trigger Inngest function via API
    try {
      await ky.post("/api/messages", {
        json: {
          conversationId,
          message: text,
          model: modelId,
        },
      });
    } catch (error) {
      // Show the server's reason (e.g. Inngest not running) when there is one
      const body = error instanceof HTTPError
        ? await error.response.json<{ error?: string }>().catch(() => null)
        : null;
      toast.error(body?.error ?? "Message failed to send");
    }

    setInput("");
  }

  const isEmpty = conversationMessages !== undefined && conversationMessages.length === 0;

  return (
    <>
      <PastConversationsDialog
        projectId={projectId}
        open={pastConversationsOpen}
        onOpenChange={setPastConversationsOpen}
        onSelect={setSelectedConversationId}
      />
      <div className="flex flex-col h-full bg-background">
        <div className="h-12 shrink-0 flex items-center justify-between gap-2 border-b pl-4 pr-2">
          <div className="text-sm font-medium truncate">
            {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setPastConversationsOpen(true)}
              className="size-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              title="History"
            >
              <HistoryIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleCreateConversation}
              className="size-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              title="New chat"
            >
              <SquarePenIcon className="size-4" />
            </button>
          </div>
        </div>
        <Conversation className="flex-1">
          <ConversationContent className="px-4">
            {isEmpty && (
              <ConversationEmpty
                onPick={(prompt) => {
                  setInput(prompt);
                  textareaRef.current?.focus();
                }}
              />
            )}
            {conversationMessages?.map((message, messageIndex) => (
              <Message
                key={message._id}
                from={message.role}
              >
                <MessageContent>
                  {message.status === "processing" ? (
                    <Shimmer className="text-sm">Thinking...</Shimmer>
                  ) : message.status === "cancelled" ? (
                    <span className="text-muted-foreground italic">
                      Request cancelled
                    </span>
                  ) : (
                    <MessageResponse>{message.content}</MessageResponse>
                  )}
                </MessageContent>
                {message.role === "assistant" &&
                  message.status === "completed" &&
                  message.model && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <SparklesIcon className="size-3" />
                      {message.model}
                    </span>
                  )}
                {message.role === "assistant" &&
                  message.status === "completed" &&
                  messageIndex === (conversationMessages?.length ?? 0) - 1 && (
                    <MessageActions>
                      <MessageAction
                        onClick={() => {
                          navigator.clipboard.writeText(message.content)
                        }}
                        label="Copy"
                      >
                        <CopyIcon className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  )
                }
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="p-3 pt-1">
          <StudioPromptBox
            textareaRef={textareaRef}
            value={input}
            onValueChange={setInput}
            onSubmit={handleSubmit}
            onStop={handleCancel}
            isProcessing={isProcessing}
            disabled={isProcessing}
            placeholder={isEmpty ? "Describe the app you want to build" : "Ask for changes or new features"}
            toolbar={<ModelSelector value={modelId} onChange={setModelId} />}
          />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            AI can make mistakes, so review the code before you ship it.
          </p>
        </div>
      </div>
    </>
  );
};
