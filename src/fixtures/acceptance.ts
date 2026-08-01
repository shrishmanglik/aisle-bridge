import type { AcceptanceFixture, EvidenceFacts, RequirementId } from "@/src/domain/types";
import { requirementIds } from "@/src/domain/types";

const cleanFacts: EvidenceFacts = {
  tenantBound: true,
  authorityPresent: true,
  sandboxOnly: true,
  readOnly: true,
  digestMatches: true,
  fresh: true,
  semanticsComplete: true,
  reversible: true,
  exactIdentity: true,
  ambiguityPreserved: true,
  denominatorComplete: true,
  capabilityLeastPrivilege: true,
  evidenceGrounded: true,
  humanApprovalRequired: true,
  impactBounded: true,
  consumersMapped: true,
  idempotent: true,
  reconciled: true,
  positiveControlObserved: true,
  stageCountsComplete: true,
  deidentified: true,
  reproducedTwice: true,
  baselineDeclared: true,
  costsComplete: true,
  prohibitedDataAbsent: true,
  retentionBounded: true,
};

const badOverrides: Record<RequirementId, Partial<EvidenceFacts>> = {
  "AB-R1": { authorityPresent: false, readOnly: false, sandboxOnly: false, digestMatches: false },
  "AB-R2": { semanticsComplete: false, reversible: false },
  "AB-R3": { exactIdentity: false, ambiguityPreserved: false },
  "AB-R4": { denominatorComplete: false, fresh: false },
  "AB-R5": { tenantBound: false, sandboxOnly: false, capabilityLeastPrivilege: false },
  "AB-R6": { evidenceGrounded: false, humanApprovalRequired: false },
  "AB-R7": { impactBounded: false, consumersMapped: false, reversible: false },
  "AB-R8": { idempotent: false, reconciled: false },
  "AB-R9": { positiveControlObserved: false, stageCountsComplete: false },
  "AB-R10": { deidentified: false, reproducedTwice: false },
  "AB-R11": { baselineDeclared: false, denominatorComplete: false, costsComplete: false },
  "AB-R12": { tenantBound: false, prohibitedDataAbsent: false, retentionBounded: false },
};

const scenarios: Record<RequirementId, { bad: string; good: string }> = {
  "AB-R1": { bad: "Digest-mismatched production-capable export with no tenant authority.", good: "Authorized read-only sandbox export with exact digest and expiry." },
  "AB-R2": { bad: "Weighted item loses unit, store scope, and timezone semantics.", good: "Versioned reversible mapping preserves unit, scope, currency, and time." },
  "AB-R3": { bad: "Text similarity attempts to merge conflicting GTIN and pack size.", good: "Exact GTIN, unit, pack, and location scope agree." },
  "AB-R4": { bad: "Missing stores and stale inventory are excluded from health denominator.", good: "Complete expected set is fresh or explicitly unavailable." },
  "AB-R5": { bad: "Shared production admin capability crosses tenants.", good: "Short-lived read capability is tenant, connector, dataset, and expiry bound." },
  "AB-R6": { bad: "Proposal invents tax and null-inventory rules without evidence.", good: "Proposal cites evidence, preserves an unknown, and requires approval." },
  "AB-R7": { bad: "Estate-wide irreversible transform omits affected consumers.", good: "Bounded change lists entities, consumers, before-state, and compensation." },
  "AB-R8": { bad: "Timeout retries a partial write without reconciliation.", good: "Exact-version change applies once and reconciles the expected set." },
  "AB-R9": { bad: "Auth failure produces zero input and false green output.", good: "Positive canary, known negative, stage counts, and action receipt all exist." },
  "AB-R10": { bad: "Raw one-off customer exception is promoted as platform truth.", good: "De-identified pattern reproduces in two synthetic fixtures." },
  "AB-R11": { bad: "Selected cohort hides unresolved records and delivery cost.", good: "Baseline, cohort, denominator, guardrails, and cost are predeclared." },
  "AB-R12": { bad: "Cross-tenant credentials and loyalty IDs enter a retained model prompt.", good: "Tenant-local tokenized schema sample uses bounded retention." },
};

export const fixturePairs = Object.fromEntries(
  requirementIds.map((requirementId) => {
    const detectorId = `DET-${requirementId}` as const;
    const good: AcceptanceFixture = {
      id: `${requirementId}-GOOD`,
      schemaVersion: "v1",
      requirementId,
      detectorId,
      controlKind: "POSITIVE",
      scenario: scenarios[requirementId].good,
      expectedDecision: "PASS",
      facts: { ...cleanFacts },
    };
    const bad: AcceptanceFixture = {
      id: `${requirementId}-BAD`,
      schemaVersion: "v1",
      requirementId,
      detectorId,
      controlKind: "NEGATIVE",
      scenario: scenarios[requirementId].bad,
      expectedDecision: "REJECT",
      facts: { ...cleanFacts, ...badOverrides[requirementId] },
    };
    return [requirementId, { bad, good }];
  }),
) as Record<RequirementId, { bad: AcceptanceFixture; good: AcceptanceFixture }>;

export const allAcceptanceFixtures = requirementIds.flatMap((id) => [fixturePairs[id].bad, fixturePairs[id].good]);
