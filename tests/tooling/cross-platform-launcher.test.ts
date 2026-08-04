import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("cross-platform browser-test launcher", () => {
  it("uses the package-manager command available on both Linux and Windows", () => {
    const config = readFileSync(path.join(process.cwd(), "playwright.config.ts"), "utf8");

    expect(config).toContain('command: "npm run start');
    expect(config).not.toContain("npm.cmd");
  });
});
