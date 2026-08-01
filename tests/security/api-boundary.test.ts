import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/workflow/route";

describe("workflow API authority boundary", () => {
  it("rejects missing typed confirmation", async () => {
    const response = await POST(new Request("http://local/api/workflow", { method: "POST", body: JSON.stringify({ scenario: "clean" }) }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ state: "HELD", code: "MALFORMED_WORKFLOW_REQUEST" });
  });

  it("labels successful output synthetic-only", async () => {
    const response = await POST(new Request("http://local/api/workflow", { method: "POST", body: JSON.stringify({ scenario: "clean", confirmation: "RUN SYNTHETIC" }) }));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-AisleBridge-Data-Class")).toBe("synthetic-only");
  });
});
