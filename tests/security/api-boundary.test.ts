import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/workflow/route";
import { getWorkflowAuthorization } from "@/src/services/workflow-engine";

describe("workflow API authority boundary", () => {
  it("rejects missing typed confirmation", async () => {
    const response = await POST(new Request("http://local/api/workflow", { method: "POST", body: JSON.stringify({ scenario: "clean" }) }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ state: "HELD", code: "MALFORMED_WORKFLOW_REQUEST" });
  });

  it("labels successful output synthetic-only", async () => {
    const authority = getWorkflowAuthorization("clean");
    const response = await POST(new Request("http://local/api/workflow", { method: "POST", body: JSON.stringify({ scenario: "clean", confirmation: authority.confirmationPhrase, planDigest: authority.planDigest }) }));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-AisleBridge-Data-Class")).toBe("synthetic-only");
  });

  it("serves an exact digest-bound challenge without granting execution", async () => {
    const response = GET(new Request("http://local/api/workflow?scenario=clean"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ scenario: "clean", confirmationPhrase: expect.stringMatching(/^RUN SYNTHETIC [A-F0-9]{12}$/) });
  });

  it("holds a confirmation copied from a different plan", async () => {
    const clean = getWorkflowAuthorization("clean");
    const recovery = getWorkflowAuthorization("partial-write-recovery");
    const response = await POST(new Request("http://local/api/workflow", { method: "POST", body: JSON.stringify({ scenario: "clean", confirmation: recovery.confirmationPhrase, planDigest: clean.planDigest }) }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ state: "HELD", code: "HUMAN_AUTHORITY_MISMATCH" });
  });
});
