import { describe, expect, it } from "vitest";
import { runWorkflow } from "@/src/services/workflow-engine";

describe("partial-write recovery", () => {
  const result = runWorkflow("partial-write-recovery");

  it("freezes closure at the mismatch", () => {
    expect(result.receipts.find((item) => item.state === "ROLLBACK_REQUIRED")?.outputCount).toBe(1);
  });

  it("preserves the unknown target acknowledgement", () => {
    expect(result.receipts.flatMap((item) => item.unknowns)).toContain("target-acknowledgement-missing");
  });

  it("records a terminal recovery receipt", () => {
    const recovered = result.receipts.find((item) => item.state === "RECOVERED");
    expect(recovered?.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(recovered?.inputCount).toBe(recovered?.outputCount);
  });

  it("retains production capability as absent", () => {
    expect(result.humanAuthority.productionCapability).toBe("ABSENT");
  });
});
