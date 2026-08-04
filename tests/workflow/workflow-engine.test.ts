import { describe, expect, it } from "vitest";
import { getWorkflowAuthorization, runWorkflow } from "@/src/services/workflow-engine";

const run = (scenario: "clean" | "partial-write-recovery") => runWorkflow(scenario, getWorkflowAuthorization(scenario));

describe("source-to-reconciled-sandbox workflow", () => {
  it("runs the clean journey end to end", () => {
    const result = run("clean");
    expect(result.decision).toBe("RECONCILED");
    expect(result.receipts.map((receipt) => receipt.state)).toContain("MATCHED");
    expect(result.sourceRecords).toBe(8);
    expect(result.canonicalRecords).toBe(4);
  });

  it("does not coerce a partial write to success", () => {
    const result = run("partial-write-recovery");
    expect(result.receipts.map((receipt) => receipt.state)).toContain("ROLLBACK_REQUIRED");
    expect(result.appliedRecords).toBeLessThan(result.affectedRecords);
  });

  it("recovers through a distinct compensation receipt", () => {
    const result = run("partial-write-recovery");
    expect(result.decision).toBe("RECOVERED");
    expect(result.receipts.at(-2)?.state).toBe("RECOVERED");
  });

  it("suppresses the duplicate operation", () => {
    expect(run("clean").duplicateSuppressed).toBe(true);
  });

  it("produces identical normalized output on a second run", () => {
    const first = run("partial-write-recovery");
    const second = run("partial-write-recovery");
    expect(second.runDigest).toBe(first.runDigest);
    expect(second).toEqual(first);
  });

  it("keeps provider and commercial facts unknown", () => {
    const result = run("clean");
    expect(result.unknowns).toEqual(expect.arrayContaining(["buyer demand", "production reliability", "commercial outcomes"]));
    expect(result.humanAuthority.productionCapability).toBe("ABSENT");
  });

  it("derives state proof from source, mapping, ledger, and reconciliation state", () => {
    const result = run("clean");
    expect(result.stateProof.sourceSnapshotDigests).toHaveLength(2);
    expect(result.stateProof.uniqueMappedRecords).toBe(6);
    expect(result.stateProof.ambiguousRecordIds).toHaveLength(2);
    expect(result.stateProof.operationLedgerEntries).toBe(1);
    expect(result.stateProof.expectedTargetDigests).toEqual(result.stateProof.observedTargetDigests);
    expect(result.stateProof.reconciliation).toEqual({ missing: [], unexpected: [], mismatched: [] });
  });

  it("rejects authority that is not bound to the exact plan digest", () => {
    const authority = getWorkflowAuthorization("clean");
    expect(() => runWorkflow("clean", { ...authority, confirmationPhrase: "RUN SYNTHETIC WRONG" })).toThrow("HUMAN_AUTHORITY_MISMATCH");
  });
});
