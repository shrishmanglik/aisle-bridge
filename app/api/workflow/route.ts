import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkflowAuthorization, runWorkflow } from "@/src/services/workflow-engine";

const scenarioSchema = z.enum(["clean", "partial-write-recovery"]);

const requestSchema = z.object({
  scenario: scenarioSchema,
  confirmation: z.string(),
  planDigest: z.string().regex(/^[a-f0-9]{64}$/),
});

export function GET(request: Request) {
  const scenario = scenarioSchema.safeParse(new URL(request.url).searchParams.get("scenario"));
  if (!scenario.success) return NextResponse.json({ code: "INVALID_SCENARIO", state: "HELD" }, { status: 400 });
  return NextResponse.json(getWorkflowAuthorization(scenario.data), {
    headers: { "Cache-Control": "no-store", "X-AisleBridge-Data-Class": "synthetic-only" },
  });
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "MALFORMED_WORKFLOW_REQUEST",
        state: "HELD",
        message: "Choose a synthetic scenario and provide the exact plan-bound confirmation.",
      },
      { status: 400 },
    );
  }

  const expected = getWorkflowAuthorization(parsed.data.scenario);
  if (parsed.data.planDigest !== expected.planDigest || parsed.data.confirmation !== expected.confirmationPhrase) {
    return NextResponse.json(
      { code: "HUMAN_AUTHORITY_MISMATCH", state: "HELD", message: "Confirmation does not authorize this exact plan digest." },
      { status: 409 },
    );
  }

  return NextResponse.json(runWorkflow(parsed.data.scenario, expected), {
    headers: { "Cache-Control": "no-store", "X-AisleBridge-Data-Class": "synthetic-only" },
  });
}
