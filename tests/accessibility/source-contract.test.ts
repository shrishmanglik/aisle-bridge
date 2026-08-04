import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(path.join(process.cwd(), "src/components/workspace.tsx"), "utf8");
const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

describe("accessible interaction source contract", () => {
  it("provides landmarks and labelled workflow regions", () => {
    expect(source).toContain("<main>");
    expect(source).toContain('aria-label="Primary navigation"');
    expect(source).toContain('aria-labelledby="workspace-title"');
  });

  it("announces asynchronous and error state", () => {
    expect(source).toContain('aria-live="polite"');
  });

  it("binds form help and errors to the confirmation input", () => {
    expect(source).toContain("aria-describedby");
    expect(source).toContain('id="confirmation-error"');
  });

  it("does not rely on colour alone for receipt state", () => {
    expect(source).toContain("receipt.state.replaceAll");
    expect(source).toContain("stateClass[receipt.state]");
  });

  it("includes reduced-motion and narrow viewport behavior", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@media (max-width: 560px)");
  });
});
