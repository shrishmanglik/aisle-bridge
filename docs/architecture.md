# Architecture and contracts

## Scope

AisleBridge v0.1 implements the blueprint's first complete vertical slice with synthetic data. It proves control-plane behavior; it does not connect to an employer, retailer, Supabase project, identity provider, or production target.

## Dependency rule

The system moves in one direction:

1. Immutable source evidence.
2. Canonical semantic contract.
3. Deterministic identity and invariant decisions.
4. Bounded proposal with evidence and unknowns.
5. Human authority over an exact digest.
6. Production-shaped local dry run.
7. Idempotent sandbox execution.
8. Target readback, complete reconciliation, and compensation when required.
9. Append-only evidence receipt.

No downstream status can rewrite source truth or silently authorize the next stage.

## Core boundaries

| Boundary | Input | Output | Failure state |
|---|---|---|---|
| `POST /api/workflow` | scenario + exact typed confirmation | `AisleBridgeWorkflowResult.v1` | HTTP 400 + `HELD` |
| Detector registry | versioned fixture + typed facts | `DetectorResult.v1` | `HELD / DETECTOR_UNAVAILABLE` |
| Workflow engine | clean or recovery scenario | stable evidence receipts | throws `CONTROL_PLANE_NOT_READY` if a clean P0 control fails |
| Supabase source contract | tenant-bound records | RLS-protected rows | deny without matching JWT tenant claim |

## Data model

The implemented persistence source defines seven tables:

- `engagements`
- `source_systems`
- `source_snapshots`
- `mapping_contracts`
- `change_sets`
- `evidence_receipts`
- `audit_events`

Every table carries `tenant_id`, enables RLS, and declares a tenant-isolation policy. The migration is a source artifact only; live application and policy state are UNKNOWN until a provider applies and verifies it.

## Receipt integrity

All workflow and detector receipts use canonical key ordering and SHA-256. Repeated runs over the same input return byte-equivalent normalized objects and the same digest. Runtime timestamps are intentionally excluded from the synthetic receipt body so repeatability can be tested exactly.

## Failure attribution

1. Product defect: connector, source, or target may be stale, partial, unavailable, or semantically inconsistent.
2. Usage pattern: the selected scope may be wrong or a required owner may be absent.
3. Missing guardrail: every failure must have a detector, a fail-closed state, and a receipt. The first two layers never excuse a missing third.

## Deliberate exclusions

- No provider credentials or `.env` dependency.
- No live Supabase connection.
- No production write adapter.
- No customer data.
- No AI API call.
- No deployment configuration.

These are authority boundaries, not hidden TODOs.
