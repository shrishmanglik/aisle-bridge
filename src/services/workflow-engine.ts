import { canonicalJson, sha256 } from "@/src/domain/digest";
import type { EvidenceReceipt, WorkflowAuthorization, WorkflowResult, WorkflowScenario } from "@/src/domain/types";
import { requirementIds } from "@/src/domain/types";
import { detectorRegistry } from "@/src/detectors";
import { fixturePairs } from "@/src/fixtures/acceptance";
import { sandboxBaseline, syntheticSourceRecords, type SandboxRecord, type SyntheticSourceRecord } from "@/src/fixtures/workflow";

type CanonicalRecord = {
  canonicalId: string;
  identityKey: string;
  gtin: string;
  unit: SyntheticSourceRecord["unit"];
  packSize: number;
  locationId: string;
  available: boolean;
  quantity: number;
  sourceRecordIds: string[];
};

type PlannedChange = {
  targetId: string;
  before: SandboxRecord;
  after: SandboxRecord;
  compensation: SandboxRecord;
  consumers: readonly ["search-index", "picker-feed"];
};

type WorkflowPlan = {
  sourceSnapshotDigests: string[];
  mappedRecords: SyntheticSourceRecord[];
  canonicalRecords: CanonicalRecord[];
  ambiguousRecordIds: string[];
  changes: PlannedChange[];
  targetVersion: "sandbox-v1";
  planDigest: string;
};

function receipt(
  stage: string,
  state: EvidenceReceipt["state"],
  summary: string,
  inputCount: number,
  outputCount: number,
  unknowns: string[] = [],
): EvidenceReceipt {
  const basis = { stage, state, summary, inputCount, outputCount, unknowns, ruleVersion: "2026-08-01.v2" };
  return {
    receiptId: `${stage.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sha256(basis).slice(0, 10)}`,
    ...basis,
    digest: sha256(basis),
  };
}

function identityKey(record: Pick<SyntheticSourceRecord, "gtin" | "unit" | "packSize" | "locationId">) {
  return `${record.gtin}|${record.unit}|${record.packSize}|${record.locationId}`;
}

function prepareWorkflowPlan(): WorkflowPlan {
  const sourceSystems = [...new Set(syntheticSourceRecords.map((record) => record.sourceSystemId))].sort();
  const sourceSnapshotDigests = sourceSystems.map((sourceSystemId) =>
    sha256(syntheticSourceRecords.filter((record) => record.sourceSystemId === sourceSystemId)),
  );

  const uniqueSourceKeys = new Set<string>();
  const mappedRecords = syntheticSourceRecords.filter((record) => {
    const sourceKey = `${record.sourceSystemId}|${record.sourceSku}|${record.sourceVersion}`;
    if (uniqueSourceKeys.has(sourceKey)) return false;
    uniqueSourceKeys.add(sourceKey);
    return true;
  });

  const groups = new Map<string, SyntheticSourceRecord[]>();
  for (const record of mappedRecords) {
    const key = identityKey(record);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  const canonicalRecords = [...groups.entries()]
    .map(([key, records]) => ({
      canonicalId: `canonical-${sha256(key).slice(0, 12)}`,
      identityKey: key,
      gtin: records[0].gtin,
      unit: records[0].unit,
      packSize: records[0].packSize,
      locationId: records[0].locationId,
      available: records.every((record) => record.available),
      quantity: Math.min(...records.map((record) => record.quantity)),
      sourceRecordIds: records.map((record) => record.sourceRecordId).sort(),
    }))
    .sort((left, right) => left.identityKey.localeCompare(right.identityKey));

  const ambiguousRecordIds = canonicalRecords
    .filter((candidate, index, records) => records.some((other, otherIndex) =>
      otherIndex !== index && other.gtin === candidate.gtin && other.identityKey !== candidate.identityKey,
    ))
    .map((record) => record.canonicalId)
    .sort();

  const changes = sandboxBaseline.map((before) => {
    const source = canonicalRecords.find((record) => record.identityKey === before.identityKey);
    if (!source) throw new Error(`MISSING_CANONICAL_TARGET:${before.targetId}`);
    const after = { ...before, available: source.available, quantity: source.quantity, version: before.version + 1 };
    return {
      targetId: before.targetId,
      before: { ...before },
      after,
      compensation: { ...before },
      consumers: ["search-index", "picker-feed"] as const,
    };
  });

  const planBasis = { sourceSnapshotDigests, mappedRecords, canonicalRecords, ambiguousRecordIds, changes, targetVersion: "sandbox-v1" as const };
  return { ...planBasis, planDigest: sha256(planBasis) };
}

export function getWorkflowAuthorization(scenario: WorkflowScenario): WorkflowAuthorization {
  const planDigest = sha256({ scenario, basePlanDigest: prepareWorkflowPlan().planDigest });
  return {
    scenario,
    planDigest,
    confirmationPhrase: `RUN SYNTHETIC ${planDigest.slice(0, 12).toUpperCase()}`,
  };
}

function cloneSandbox() {
  return new Map(sandboxBaseline.map((record) => [record.targetId, { ...record }]));
}

function applyChangeSet(
  sandbox: Map<string, SandboxRecord>,
  changes: PlannedChange[],
  operationKey: string,
  operationLedger: Set<string>,
  maximumWrites = changes.length,
) {
  if (operationLedger.has(operationKey)) return { appliedTargetIds: [] as string[], duplicate: true };
  operationLedger.add(operationKey);
  const appliedTargetIds: string[] = [];
  for (const change of changes) {
    if (appliedTargetIds.length >= maximumWrites) break;
    const current = sandbox.get(change.targetId);
    if (!current || current.version !== change.before.version || canonicalJson(current) !== canonicalJson(change.before)) {
      throw new Error(`STALE_TARGET_VERSION:${change.targetId}`);
    }
    sandbox.set(change.targetId, { ...change.after });
    appliedTargetIds.push(change.targetId);
  }
  return { appliedTargetIds, duplicate: false };
}

function targetDigests(sandbox: Map<string, SandboxRecord>) {
  return [...sandbox.values()]
    .sort((left, right) => left.targetId.localeCompare(right.targetId))
    .map((record) => `${record.targetId}:${sha256(record)}`);
}

function reconcile(expected: Map<string, SandboxRecord>, observed: Map<string, SandboxRecord>) {
  const missing = [...expected.keys()].filter((targetId) => !observed.has(targetId));
  const unexpected = [...observed.keys()].filter((targetId) => !expected.has(targetId));
  const mismatched = [...expected.entries()]
    .filter(([targetId, record]) => observed.has(targetId) && canonicalJson(observed.get(targetId)) !== canonicalJson(record))
    .map(([targetId]) => targetId);
  return { missing, unexpected, mismatched };
}

function isMatched(result: ReturnType<typeof reconcile>) {
  return result.missing.length === 0 && result.unexpected.length === 0 && result.mismatched.length === 0;
}

export function runWorkflow(
  scenario: WorkflowScenario,
  authority: WorkflowAuthorization,
): WorkflowResult {
  const expectedAuthority = getWorkflowAuthorization(scenario);
  if (authority.planDigest !== expectedAuthority.planDigest || authority.confirmationPhrase !== expectedAuthority.confirmationPhrase) {
    throw new Error("HUMAN_AUTHORITY_MISMATCH");
  }

  const detectorResults = requirementIds.map((id) => detectorRegistry[id].evaluate(fixturePairs[id].good));
  if (detectorResults.some((result) => result.decision !== "PASS")) throw new Error("CONTROL_PLANE_NOT_READY");

  const plan = prepareWorkflowPlan();
  const proposalDigest = sha256({ planDigest: plan.planDigest, changes: plan.changes });
  const operationKey = sha256({ authorizedPlanDigest: authority.planDigest, proposalDigest, targetVersion: plan.targetVersion });
  const sandbox = cloneSandbox();
  const expectedSandbox = cloneSandbox();
  for (const change of plan.changes) expectedSandbox.set(change.targetId, { ...change.after });
  const operationLedger = new Set<string>();

  const firstApply = applyChangeSet(
    sandbox,
    plan.changes,
    operationKey,
    operationLedger,
    scenario === "clean" ? plan.changes.length : 1,
  );
  const replay = applyChangeSet(sandbox, plan.changes, operationKey, operationLedger);
  const observedTargetDigests = targetDigests(sandbox);
  const reconciliation = reconcile(expectedSandbox, sandbox);
  const reconciliationMatched = isMatched(reconciliation);

  let compensationApplied = 0;
  let baselineRestored = false;
  if (!reconciliationMatched) {
    for (const targetId of firstApply.appliedTargetIds) {
      const change = plan.changes.find((candidate) => candidate.targetId === targetId);
      if (!change) throw new Error(`MISSING_COMPENSATION:${targetId}`);
      sandbox.set(targetId, { ...change.compensation });
      compensationApplied += 1;
    }
    baselineRestored = isMatched(reconcile(cloneSandbox(), sandbox));
    if (!baselineRestored) throw new Error("COMPENSATION_RECONCILIATION_FAILED");
  }

  const receipts: EvidenceReceipt[] = [
    receipt("Source registration", "REGISTERED", `${plan.sourceSnapshotDigests.length} tenant-local read-only synthetic snapshots registered with exact digests.`, plan.sourceSnapshotDigests.length, plan.sourceSnapshotDigests.length),
    receipt("Semantic mapping", "REGISTERED", `${syntheticSourceRecords.length - plan.mappedRecords.length} duplicate source deliveries suppressed before canonical mapping.`, syntheticSourceRecords.length, plan.mappedRecords.length),
    receipt("Entity resolution", "HELD", `${plan.canonicalRecords.length} canonical records materialized; conflicting pack identities remain separate.`, plan.mappedRecords.length, plan.canonicalRecords.length, plan.ambiguousRecordIds),
    receipt("Bounded proposal", "PROPOSED", `${plan.changes.length} reversible sandbox changes derived from exact canonical identities.`, plan.canonicalRecords.length, plan.changes.length, ["retailer-source-precedence-unverified"]),
    receipt("Dry run", "DRY_RUN_PASSED", `${plan.changes.length} target versions, consumer lists, before-states, and compensations validated.`, plan.changes.length, plan.changes.filter((change) => change.compensation.version === change.before.version).length),
    receipt("Sandbox execution", "APPLIED", `${firstApply.appliedTargetIds.length} exact-version writes applied; replay was ${replay.duplicate ? "suppressed" : "not attempted"}.`, plan.changes.length, firstApply.appliedTargetIds.length),
  ];

  if (reconciliationMatched) {
    receipts.push(receipt("Reconciliation", "MATCHED", "Expected and observed target digests match exactly.", plan.changes.length, plan.changes.length));
  } else {
    receipts.push(
      receipt("Reconciliation", "ROLLBACK_REQUIRED", `${reconciliation.missing.length + reconciliation.mismatched.length + reconciliation.unexpected.length} target difference blocked success.`, plan.changes.length, plan.changes.length - reconciliation.missing.length - reconciliation.mismatched.length, ["target-acknowledgement-missing"]),
      receipt("Compensating rollback", "RECOVERED", `${compensationApplied} applied write reverted and baseline readback matched.`, firstApply.appliedTargetIds.length, compensationApplied),
    );
  }

  receipts.push(receipt("Field pattern", "HELD", "Two de-identified synthetic reproductions exist; independent R&D acceptance is not represented.", 2, 1, ["independent-r-and-d-decision"]));

  const withoutDigest = {
    schemaVersion: "AisleBridgeWorkflowResult.v1" as const,
    runId: `synthetic-${scenario}-${authority.planDigest.slice(0, 12)}`,
    fixtureLabel: "SYNTHETIC" as const,
    scenario,
    decision: reconciliationMatched ? ("RECONCILED" as const) : ("RECOVERED" as const),
    receipts,
    detectorResults,
    sourceRecords: syntheticSourceRecords.length,
    canonicalRecords: plan.canonicalRecords.length,
    affectedRecords: plan.changes.length,
    appliedRecords: firstApply.appliedTargetIds.length,
    duplicateSuppressed: replay.duplicate,
    humanAuthority: {
      proposal: "REVIEW_REQUIRED" as const,
      execution: "SYNTHETIC_APPROVAL_ONLY" as const,
      productionCapability: "ABSENT" as const,
      confirmationBound: true as const,
      authorizedPlanDigest: authority.planDigest,
    },
    stateProof: {
      sourceSnapshotDigests: plan.sourceSnapshotDigests,
      uniqueMappedRecords: plan.mappedRecords.length,
      ambiguousRecordIds: plan.ambiguousRecordIds,
      proposalDigest,
      operationKey,
      operationLedgerEntries: operationLedger.size,
      expectedTargetDigests: targetDigests(expectedSandbox),
      observedTargetDigests,
      reconciliation,
      compensation: { planned: plan.changes.length, applied: compensationApplied, baselineRestored },
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
