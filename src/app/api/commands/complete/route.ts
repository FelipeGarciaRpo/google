import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { convex } from "@/lib/convex-client";
import { inngest } from "@/inngest/client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const MAX_OUTPUT_LENGTH = 20_000;

const requestSchema = z.object({
  commandId: z.string(),
  output: z.string(),
  exitCode: z.number().int().optional(),
  timedOut: z.boolean().default(false),
});

// The browser reports the result of a command the agent asked it to run
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const internalKey = process.env.CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { commandId, output, exitCode, timedOut } = requestSchema.parse(body);

  // Ownership is checked inside the mutation
  const accepted = await convex.mutation(api.system.completeCommand, {
    internalKey,
    commandId: commandId as Id<"commands">,
    ownerId: userId,
    // Keep the end of long outputs, that's where errors usually are
    output: output.slice(-MAX_OUTPUT_LENGTH),
    exitCode,
    timedOut,
  });

  if (accepted) {
    await inngest.send({
      name: "command/completed",
      data: { commandId },
    });
  }

  return NextResponse.json({ success: true, accepted });
};
