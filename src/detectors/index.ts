import { abR1Detector } from "./ab-r1.detector";
import { abR2Detector } from "./ab-r2.detector";
import { abR3Detector } from "./ab-r3.detector";
import { abR4Detector } from "./ab-r4.detector";
import { abR5Detector } from "./ab-r5.detector";
import { abR6Detector } from "./ab-r6.detector";
import { abR7Detector } from "./ab-r7.detector";
import { abR8Detector } from "./ab-r8.detector";
import { abR9Detector } from "./ab-r9.detector";
import { abR10Detector } from "./ab-r10.detector";
import { abR11Detector } from "./ab-r11.detector";
import { abR12Detector } from "./ab-r12.detector";
import type { Detector, RequirementId } from "@/src/domain/types";
import { requirementIds } from "@/src/domain/types";
import { fixturePairs } from "@/src/fixtures/acceptance";

export const detectorRegistry: Record<RequirementId, Detector> = {
  "AB-R1": abR1Detector,
  "AB-R2": abR2Detector,
  "AB-R3": abR3Detector,
  "AB-R4": abR4Detector,
  "AB-R5": abR5Detector,
  "AB-R6": abR6Detector,
  "AB-R7": abR7Detector,
  "AB-R8": abR8Detector,
  "AB-R9": abR9Detector,
  "AB-R10": abR10Detector,
  "AB-R11": abR11Detector,
  "AB-R12": abR12Detector,
};

export function evaluateFixture(fixture: Parameters<Detector["evaluate"]>[0], disabledDetector?: string) {
  const detector = detectorRegistry[fixture.requirementId];
  if (!detector || detector.detectorId === disabledDetector) {
    return {
      schemaVersion: "DetectorResult.v1" as const,
      detectorId: fixture.detectorId,
      requirementId: fixture.requirementId,
      decision: "HELD" as const,
      issueCodes: ["DETECTOR_UNAVAILABLE"],
      evidence: ["fail-closed:detector-unavailable"],
      normalizedDigest: "detector-unavailable",
    };
  }
  return detector.evaluate(fixture);
}

export function assertAcceptanceSuite(disabledDetector?: string) {
  const regressions = requirementIds.flatMap((requirementId) => {
    const fixtures = [fixturePairs[requirementId].bad, fixturePairs[requirementId].good];
    return fixtures.flatMap((fixture) => {
      const actual = evaluateFixture(fixture, disabledDetector).decision;
      return actual === fixture.expectedDecision ? [] : [`${fixture.id}:expected-${fixture.expectedDecision}:received-${actual}`];
    });
  });
  if (regressions.length > 0) throw new Error(`ACCEPTANCE_REGRESSION:${regressions.join(",")}`);
}
