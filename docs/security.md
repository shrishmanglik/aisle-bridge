# Security, privacy, and trust boundary

## Data classification

The repository contains only synthetic retail-shaped fixtures and public source code. It contains no customer, employee, loyalty, payment, credential, or personal data.

## Threats and implemented controls

| Threat | Control |
|---|---|
| Cross-tenant access | `tenant_id` on every persisted table; matching JWT-claim RLS policy |
| Broad or production capability | runnable slice declares local sandbox only; production capability absent |
| Source poisoning | source authority, freshness, and exact digest detector |
| False product merge | exact identifiers first; conflict and abstention preserved |
| Silent zero/partial success | positive control, stage counts, complete expected set, target readback |
| Duplicate write | stable operation key and duplicate suppression |
| Unsupported model rule | evidence grounding and human authority detector; no model call exists |
| Customer-local leakage | de-identification plus two synthetic reproductions before review |
| Audit alteration | authenticated update/delete revoked for audit events |
| Secret exposure | `.env*` ignored; no secret values or provider SDK configured |

## RLS claim ceiling

The SQL source enables RLS and creates tenant policies on every table. Automated tests prove the source contract and fail if any table lacks `tenant_id`, RLS, or a policy. This does **not** prove a live Supabase project has applied the migration or enforces the policies.

## Human authority

The UI's typed confirmation authorizes only a synthetic local run. It is not a substitute for retailer business, data, security, change, or recovery approval. A future external adapter must bind a named human decision to the exact change-set and rollback digests.

## Reporting

Please open a private security advisory on GitHub for a suspected vulnerability. Do not include credentials, retailer data, or exploit payloads containing real customer information.
