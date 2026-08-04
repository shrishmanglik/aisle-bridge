export type SyntheticSourceRecord = {
  sourceSystemId: "north-feed" | "south-feed";
  sourceRecordId: string;
  sourceSku: string;
  sourceVersion: "2026-08-01.v1";
  name: string;
  gtin: string;
  unit: "EACH" | "KG";
  packSize: number;
  locationId: "yyz-01";
  available: boolean;
  quantity: number;
  freshness: "FRESH";
};

export type SandboxRecord = {
  targetId: string;
  identityKey: string;
  available: boolean;
  quantity: number;
  version: number;
};

export const syntheticSourceRecords: SyntheticSourceRecord[] = [
  { sourceSystemId: "north-feed", sourceRecordId: "north-1", sourceSku: "MILK-1", sourceVersion: "2026-08-01.v1", name: "Whole milk", gtin: "000000000001", unit: "EACH", packSize: 1, locationId: "yyz-01", available: true, quantity: 12, freshness: "FRESH" },
  { sourceSystemId: "north-feed", sourceRecordId: "north-2", sourceSku: "APPLE-1", sourceVersion: "2026-08-01.v1", name: "Gala apples", gtin: "000000000002", unit: "KG", packSize: 1, locationId: "yyz-01", available: false, quantity: 0, freshness: "FRESH" },
  { sourceSystemId: "north-feed", sourceRecordId: "north-3", sourceSku: "COFFEE-10", sourceVersion: "2026-08-01.v1", name: "Coffee pods", gtin: "000000000003", unit: "EACH", packSize: 10, locationId: "yyz-01", available: true, quantity: 8, freshness: "FRESH" },
  { sourceSystemId: "north-feed", sourceRecordId: "north-3-replay", sourceSku: "COFFEE-10", sourceVersion: "2026-08-01.v1", name: "Coffee pods", gtin: "000000000003", unit: "EACH", packSize: 10, locationId: "yyz-01", available: true, quantity: 8, freshness: "FRESH" },
  { sourceSystemId: "south-feed", sourceRecordId: "south-1", sourceSku: "DAIRY-1", sourceVersion: "2026-08-01.v1", name: "Whole milk 1L", gtin: "000000000001", unit: "EACH", packSize: 1, locationId: "yyz-01", available: true, quantity: 12, freshness: "FRESH" },
  { sourceSystemId: "south-feed", sourceRecordId: "south-2", sourceSku: "PRODUCE-9", sourceVersion: "2026-08-01.v1", name: "Apples Gala", gtin: "000000000002", unit: "KG", packSize: 1, locationId: "yyz-01", available: false, quantity: 0, freshness: "FRESH" },
  { sourceSystemId: "south-feed", sourceRecordId: "south-3", sourceSku: "PODS-12", sourceVersion: "2026-08-01.v1", name: "Coffee pods value pack", gtin: "000000000003", unit: "EACH", packSize: 12, locationId: "yyz-01", available: true, quantity: 5, freshness: "FRESH" },
  { sourceSystemId: "south-feed", sourceRecordId: "south-3-replay", sourceSku: "PODS-12", sourceVersion: "2026-08-01.v1", name: "Coffee pods value pack", gtin: "000000000003", unit: "EACH", packSize: 12, locationId: "yyz-01", available: true, quantity: 5, freshness: "FRESH" },
];

export const sandboxBaseline: SandboxRecord[] = [
  { targetId: "sandbox-milk", identityKey: "000000000001|EACH|1|yyz-01", available: false, quantity: 0, version: 1 },
  { targetId: "sandbox-apples", identityKey: "000000000002|KG|1|yyz-01", available: true, quantity: 4, version: 1 },
];
