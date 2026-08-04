import { describe, expect, it } from "vitest";
import { detectorRegistry } from "@/src/detectors";

describe("AisleBridge acceptance detector registry", () => {
  it("registers one fail-closed detector for each P0 requirement", () => {
    expect(Object.keys(detectorRegistry)).toEqual(
      Array.from({ length: 12 }, (_, index) => `AB-R${index + 1}`),
    );
    expect(Object.values(detectorRegistry).every((detector) => detector.failurePolicy === "FAIL_CLOSED")).toBe(true);
  });
});
