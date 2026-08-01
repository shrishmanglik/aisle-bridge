import { describe, expect, it } from "vitest";
import { evaluateFixture } from "@/src/detectors";
import { allAcceptanceFixtures } from "@/src/fixtures/acceptance";

describe("24 parseable acceptance controls", () => {
  it.each(allAcceptanceFixtures)("$id returns $expectedDecision", (fixture) => {
    const result = evaluateFixture(fixture);
    expect(result.detectorId).toBe(fixture.detectorId);
    expect(result.decision).toBe(fixture.expectedDecision);
    expect(result.normalizedDigest).toMatch(/^[a-f0-9]{64}$/);
    if (fixture.controlKind === "NEGATIVE") expect(result.issueCodes).toEqual([`${fixture.requirementId.replace("-", "_")}_REJECTED`]);
    if (fixture.controlKind === "POSITIVE") expect(result.issueCodes).toEqual([]);
  });
});
