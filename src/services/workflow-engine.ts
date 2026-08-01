import { sha256 } from "@/src/domain/digest";
import type { EvidenceReceipt, WorkflowResult } from "@/src/domain/types";
import { requirementIds } from "@/src/domain/types";
import { detectorRegistry } from "@/src/detectors";
import { fixturePairs } from "@/src/fixtures/acceptance";

type Scenario = WorkflowResult["scenario"];

function receipt(
  stage: string,
  state: EvidenceReceipt["state"],
  summary: string,
  inputCount: number,
  outputCount: number,
  unknowns: string[] = [],
): EvidenceReceipt {
  const basis = { stage, state, summary, inputCount, outputCount, unknowns, ruleVersion: "2026-08-01.v1" };
  return {
    receiptId: `${stage.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sha256(basis).slice(0, 10)}`,
    ...basis,
    digest: sha256(basis),
  };
}

export function runWorkflow(scenario: Scenario): WorkflowResult {
  const detectorResults = requirementIds.map((id) => detectorRegistry[id].evaluate(fixturePairs[id].good));
  if (detectorResults.some((result) => result.decision !== "PASS")) {
    throw new Error("CONTROL_PLANE_NOT_READY");
  }

  const receipts: EvidenceReceipt[] = [
    receipt("Source registration", "REGISTERED", "Two tenant-local read-only synthetic exports registered with exact digests.", 2, 2),
    receipt("Semantic mapping", "REGISTERED", "Eight source rows normalized into four canonical products without dropping pack, unit, location, or freshness meaning.", 8, 4),
    receipt("Entity resolution", "HELD", "Two exact matches accepted; one ambiguous pair remains separate for human review.", 4, 2, ["ambiguous-product-pair"]),
    receipt("Bounded proposal", "PROPOSED", "Reversible availability transform drafted from approved synthetic evidence; execution authority remains absent.", 2, 1, ["retailer-source-precedence-unverified"]),
    receipt("Dry run", "DRY_RUN_PASSED", "Two affected sandbox records, two downstream consumers, and a distinct compensating change set were proven.", 2, 2),
    receipt("Sandbox execution", "APPLIED", "Exact-version change applied once; duplicate operation key was suppressed.", 2, scenario === "clean" ? 2 : 1),
  ];

  if (scenario === "partial-write-recovery") {
    receipts.push(
      receipt("Reconciliation", "ROLLBACK_REQUIRED", "One missing target acknowledgement blocked success and froze further writes.", 2, 1, ["target-acknowledgement-missing"]),
      receipt("Compensating rollback", "RECOVERED", "Precomputed compensation restored the complete expected sandbox state.", 2, 2),
    );
  } else {
    receipts.push(receipt("Reconciliation", "MATCHED", "Complete expected set equals observed target state with no missing, unexpected, or mismatched records.", 2, 2));
  }

  receipts.push(receipt("Field pattern", "HELD", "De-identified synthetic reproduction packet is ready; independent R&D acceptance is not represented.", 2, 1, ["independent-r-and-d-decision"]));

  const withoutDigest = {
    schemaVersion: "AisleBridgeWorkflowResult.v1" as const,
    runId: `synthetic-${scenario}-v1`,
    fixtureLabel: "SYNTHETIC" as const,
    scenario,
    decision: scenario === "clean" ? ("RECONCILED" as const) : ("RECOVERED" as const),
    receipts,
    detectorResults,
    sourceRecords: 8,
    canonicalRecords: 4,
    affectedRecords: 2,
    appliedRecords: scenario === "clean" ? 2 : 1,
    duplicateSuppressed: true,
    humanAuthority: {
      proposal: "REVIEW_REQUIRED" as const,
      execution: "SYNTHETIC_APPROVAL_ONLY" as const,
      productionCapability: "ABSENT" as const,
    },
    unknowns: [
      "buyer demand",
      "Instacart architecture fit",
      "retailer security acceptance",
      "production reliability",
      "commercial outcomes",
    ],
  };

  return { ...withoutDigest, runDigest: sha256(withoutDigest) };
}
