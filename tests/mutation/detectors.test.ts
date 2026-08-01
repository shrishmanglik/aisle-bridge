import { describe, expect, it } from "vitest";
import { evaluateFixture } from "@/src/detectors";
import { fixturePairs } from "@/src/fixtures/acceptance";
import { requirementIds } from "@/src/domain/types";

describe("detector mutation probes", () => {
  it.each(requirementIds)("fails closed when DET-%s is disabled", (requirementId) => {
    const fixture = fixturePairs[requirementId].bad;
    const result = evaluateFixture(fixture, fixture.detectorId);
    expect(result.decision).toBe("HELD");
    expect(result.issueCodes).toContain("DETECTOR_UNAVAILABLE");
  });
});
