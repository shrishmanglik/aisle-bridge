import { describe, expect, it } from "vitest";
import { runWorkflow } from "@/src/services/workflow-engine";

describe("source-to-reconciled-sandbox workflow", () => {
  it("runs the clean journey end to end", () => {
    const result = runWorkflow("clean");
    expect(result.decision).toBe("RECONCILED");
    expect(result.receipts.map((receipt) => receipt.state)).toContain("MATCHED");
    expect(result.sourceRecords).toBe(8);
    expect(result.canonicalRecords).toBe(4);
  });

  it("does not coerce a partial write to success", () => {
    const result = runWorkflow("partial-write-recovery");
    expect(result.receipts.map((receipt) => receipt.state)).toContain("ROLLBACK_REQUIRED");
    expect(result.appliedRecords).toBeLessThan(result.affectedRecords);
  });

  it("recovers through a distinct compensation receipt", () => {
    const result = runWorkflow("partial-write-recovery");
    expect(result.decision).toBe("RECOVERED");
    expect(result.receipts.at(-2)?.state).toBe("RECOVERED");
  });

  it("suppresses the duplicate operation", () => {
    expect(runWorkflow("clean").duplicateSuppressed).toBe(true);
  });

  it("produces identical normalized output on a second run", () => {
    const first = runWorkflow("partial-write-recovery");
    const second = runWorkflow("partial-write-recovery");
    expect(second.runDigest).toBe(first.runDigest);
    expect(second).toEqual(first);
  });

  it("keeps provider and commercial facts unknown", () => {
    const result = runWorkflow("clean");
    expect(result.unknowns).toEqual(expect.arrayContaining(["buyer demand", "production reliability", "commercial outcomes"]));
    expect(result.humanAuthority.productionCapability).toBe("ABSENT");
  });
});
