// Server-only: hands a message to the agent through Inngest
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// Locally it's almost always a stopped Inngest dev server; in production the
// visitor can't fix anything, so just ask them to retry
const isDev = process.env.NODE_ENV === "development";

export const INNGEST_UNAVAILABLE_ERROR = isDev
  ? "Background jobs aren't running. Start the Inngest dev server and try again."
  : "Background jobs are unavailable right now. Please try again in a moment.";

const UNAVAILABLE_REPLY = isDev
  ? "I couldn't start working on this because background jobs (Inngest) aren't running. Start the Inngest dev server and send your message again."
  : "I couldn't start working on this because background jobs are unavailable right now. Please send your message again in a moment.";

interface StartAgentOptions {
  internalKey: string;
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
  model?: string;
}

// If Inngest can't be reached, the assistant placeholder explains why
// instead of staying on "Thinking..." forever
export const startAgent = async ({ internalKey, ...data }: StartAgentOptions) => {
  try {
    const event = await inngest.send({ name: "message/sent", data });
    return { ok: true as const, eventId: event.ids[0] };
  } catch (error) {
    console.error("Unable to reach Inngest", error);

    await convex.mutation(api.system.updateMessageContent, {
      internalKey,
      messageId: data.messageId,
      content: UNAVAILABLE_REPLY,
    });

    return { ok: false as const };
  }
};
