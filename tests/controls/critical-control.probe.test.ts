import { describe, expect, it } from "vitest";
import { evaluateFixture } from "@/src/detectors";
import { fixturePairs } from "@/src/fixtures/acceptance";

describe("critical AB-R8 negative control", () => {
  it("rejects a duplicate partial write", () => {
    const fixture = fixturePairs["AB-R8"].bad;
    const result = evaluateFixture(fixture, process.env.AISLEBRIDGE_DISABLED_DETECTOR);
    expect(result.decision).toBe("REJECT");
    expect(result.issueCodes).toContain("AB_R8_REJECTED");
  });
});
