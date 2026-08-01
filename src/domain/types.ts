export const requirementIds = [
  "AB-R1",
  "AB-R2",
  "AB-R3",
  "AB-R4",
  "AB-R5",
  "AB-R6",
  "AB-R7",
  "AB-R8",
  "AB-R9",
  "AB-R10",
  "AB-R11",
  "AB-R12",
] as const;

export type RequirementId = (typeof requirementIds)[number];
export type Decision = "PASS" | "REJECT" | "HELD";

export type EvidenceFacts = {
  tenantBound: boolean;
  authorityPresent: boolean;
  sandboxOnly: boolean;
  readOnly: boolean;
  digestMatches: boolean;
  fresh: boolean;
  semanticsComplete: boolean;
  reversible: boolean;
  exactIdentity: boolean;
  ambiguityPreserved: boolean;
  denominatorComplete: boolean;
  capabilityLeastPrivilege: boolean;
  evidenceGrounded: boolean;
  humanApprovalRequired: boolean;
  impactBounded: boolean;
  consumersMapped: boolean;
  idempotent: boolean;
  reconciled: boolean;
  positiveControlObserved: boolean;
  stageCountsComplete: boolean;
  deidentified: boolean;
  reproducedTwice: boolean;
  baselineDeclared: boolean;
  costsComplete: boolean;
  prohibitedDataAbsent: boolean;
  retentionBounded: boolean;
};

export type AcceptanceFixture = {
  id: `${RequirementId}-${"BAD" | "GOOD"}`;
  schemaVersion: "v1";
  requirementId: RequirementId;
  detectorId: `DET-${RequirementId}`;
  controlKind: "NEGATIVE" | "POSITIVE";
  scenario: string;
  expectedDecision: "REJECT" | "PASS";
  facts: EvidenceFacts;
};

export type DetectorResult = {
  schemaVersion: "DetectorResult.v1";
  detectorId: `DET-${RequirementId}`;
  requirementId: RequirementId;
  decision: Decision;
  issueCodes: string[];
  evidence: string[];
  normalizedDigest: string;
};

export type Detector = {
  detectorId: `DET-${RequirementId}`;
  requirementId: RequirementId;
  issueCode: string;
  failurePolicy: "FAIL_CLOSED";
  evaluate: (fixture: AcceptanceFixture) => DetectorResult;
};

export type ReceiptState =
  | "REGISTERED"
  | "HELD"
  | "PROPOSED"
  | "DRY_RUN_PASSED"
  | "APPLIED"
  | "MATCHED"
  | "ROLLBACK_REQUIRED"
  | "RECOVERED";

export type EvidenceReceipt = {
  receiptId: string;
  stage: string;
  state: ReceiptState;
  summary: string;
  inputCount: number;
  outputCount: number;
  unknowns: string[];
  digest: string;
  ruleVersion: string;
};

export type WorkflowResult = {
  schemaVersion: "AisleBridgeWorkflowResult.v1";
  runId: string;
  fixtureLabel: "SYNTHETIC";
  scenario: "clean" | "partial-write-recovery";
  decision: "RECONCILED" | "RECOVERED";
  receipts: EvidenceReceipt[];
  detectorResults: DetectorResult[];
  sourceRecords: number;
  canonicalRecords: number;
  affectedRecords: number;
  appliedRecords: number;
  duplicateSuppressed: boolean;
  humanAuthority: {
    proposal: "REVIEW_REQUIRED";
    execution: "SYNTHETIC_APPROVAL_ONLY";
    productionCapability: "ABSENT";
  };
  unknowns: string[];
  runDigest: string;
};
