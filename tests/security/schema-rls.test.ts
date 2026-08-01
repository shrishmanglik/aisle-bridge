import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const sql = readFileSync(path.join(process.cwd(), "supabase/migrations/0001_aislebridge_core.sql"), "utf8");
const tables = ["engagements", "source_systems", "source_snapshots", "mapping_contracts", "change_sets", "evidence_receipts", "audit_events"];

describe("Supabase persistence contract", () => {
  it.each(tables)("enables and policies %s", (table) => {
    expect(sql).toMatch(new RegExp(`alter table public\\.${table} enable row level security`, "i"));
    expect(sql).toMatch(new RegExp(`create policy [\\s\\S]+? on public\\.${table}`, "i"));
  });

  it("contains no permissive using true policy", () => {
    expect(sql).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });

  it("keeps tenant identity on every persisted table", () => {
    for (const table of tables) {
      const createBlock = sql.match(new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\);`, "i"))?.[1];
      expect(createBlock, table).toMatch(/tenant_id\s+uuid\s+not null/i);
    }
  });
});
