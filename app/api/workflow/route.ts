import { NextResponse } from "next/server";
import { z } from "zod";
import { runWorkflow } from "@/src/services/workflow-engine";

const requestSchema = z.object({
  scenario: z.enum(["clean", "partial-write-recovery"]),
  confirmation: z.literal("RUN SYNTHETIC"),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "MALFORMED_WORKFLOW_REQUEST",
        state: "HELD",
        message: "Choose a synthetic scenario and type RUN SYNTHETIC.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(runWorkflow(parsed.data.scenario), {
    headers: {
      "Cache-Control": "no-store",
      "X-AisleBridge-Data-Class": "synthetic-only",
    },
  });
}
