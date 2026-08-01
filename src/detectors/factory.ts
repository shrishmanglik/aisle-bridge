import { sha256 } from "@/src/domain/digest";
import type { AcceptanceFixture, Detector, EvidenceFacts, RequirementId } from "@/src/domain/types";

export function createDetector(
  requirementId: RequirementId,
  requiredFacts: (keyof EvidenceFacts)[],
): Detector {
  const detectorId = `DET-${requirementId}` as const;
  const issueCode = `${requirementId.replace("-", "_")}_REJECTED`;
  return {
    detectorId,
    requirementId,
    issueCode,
    failurePolicy: "FAIL_CLOSED",
    evaluate(fixture: AcceptanceFixture) {
      if (fixture.requirementId !== requirementId || fixture.detectorId !== detectorId) {
        const evidence = ["fixture-detector-binding-mismatch"];
        return {
          schemaVersion: "DetectorResult.v1",
          detectorId,
          requirementId,
          decision: "REJECT",
          issueCodes: [issueCode],
          evidence,
          normalizedDigest: sha256({ detectorId, decision: "REJECT", evidence }),
        };
      }
      const failedFacts = requiredFacts.filter((fact) => !fixture.facts[fact]);
      const decision = failedFacts.length === 0 ? "PASS" : "REJECT";
      const evidence = requiredFacts.map((fact) => `${fact}:${fixture.facts[fact] ? "verified" : "failed"}`);
      return {
        schemaVersion: "DetectorResult.v1",
        detectorId,
        requirementId,
        decision,
        issueCodes: decision === "REJECT" ? [issueCode] : [],
        evidence,
        normalizedDigest: sha256({ detectorId, requirementId, decision, evidence }),
      };
    },
  };
}
