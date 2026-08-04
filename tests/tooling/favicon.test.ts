import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("production favicon", () => {
  const iconPath = path.join(process.cwd(), "app", "icon.svg");

  it("ships a self-contained App Router icon", () => {
    expect(existsSync(iconPath)).toBe(true);

    const icon = readFileSync(iconPath, "utf8");
    expect(icon).toContain('viewBox="0 0 32 32"');
    expect(icon).not.toMatch(/<script|(?:href|src)=["']https?:\/\//i);
  });
});
