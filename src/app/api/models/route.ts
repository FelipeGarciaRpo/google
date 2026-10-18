import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getAvailableModels } from "@/features/ai/server";

// Lists the agent models and whether their provider has an API key configured
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ models: getAvailableModels() });
};
