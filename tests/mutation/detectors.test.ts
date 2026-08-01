import { describe, expect, it } from "vitest";
import { assertAcceptanceSuite } from "@/src/detectors";
import { requirementIds } from "@/src/domain/types";

describe("detector mutation probes", () => {
  it("passes the complete acceptance suite with every detector present", () => {
    expect(() => assertAcceptanceSuite()).not.toThrow();
  });

  it.each(requirementIds)("makes the acceptance suite fail when DET-%s is disabled", (requirementId) => {
    expect(() => assertAcceptanceSuite(`DET-${requirementId}`)).toThrow(new RegExp(`ACCEPTANCE_REGRESSION:${requirementId}-(BAD|GOOD)`));
  });
});
