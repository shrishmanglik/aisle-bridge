# Evidence manifest

Status: local candidate pending independent review.

## Source and blueprint

| Claim | State | Evidence |
|---|---|---|
| Governed blueprint read completely | VERIFIED | 2,383 lines; SHA-256 `8D0238AD9178A6448929DAFA97B472ED52FE3C906814EEBD1157C477F2E2702F` |
| Blueprint build-ready | VERIFIED | Blueprint status: `BUILD-READY PROPOSAL - NOT BUILT OR COMMERCIALLY VALIDATED` |
| Employer/customer demand | UNKNOWN | No authenticated commercial evidence exists |

## Local truth

| Claim | State | Evidence |
|---|---|---|
| Clean starting state | VERIFIED | clone of `main@601e797c6a7069edd2294d809f27a8bdb7f96516`; only `README.md` tracked |
| Failing-before control | VERIFIED | initial `npm.cmd test`: missing `@/src/detectors`; 1 failed suite, exit 1 |
| Critical detector mutation | VERIFIED | `AISLEBRIDGE_DISABLED_DETECTOR=DET-AB-R8 npm.cmd run test:control`: 1 failed, expected `REJECT`, received `HELD`, exit 1 |
| Restored deterministic tests | VERIFIED | `npm.cmd test`: 64/64 passed in 9 files on each of two complete runs |
| Critical restored control | VERIFIED | `npm.cmd run test:control`: 1/1 passed on each of two consecutive runs |
| Acceptance fixtures | VERIFIED | 24/24 bad/good fixture checks passed |
| Mutation assertions | VERIFIED | 12/12 detector-disable assertions passed |
| Security checks | VERIFIED | 11/11 passed, including RLS coverage and API authority boundary |
| Accessibility source checks | VERIFIED | 5/5 passed; browser run separately proves keyboard activation and narrow viewport |
| Recovery checks | VERIFIED | 4/4 passed |
| Browser journey | VERIFIED | desktop + mobile, clean + recovery + keyboard activation: 6/6 passed; no console error or page overflow |
| Screenshot | VERIFIED | `docs/screenshots/aislebridge-workspace.png`, captured from production build |
| Dependency audit | VERIFIED | `npm.cmd audit --omit=dev`: 0 vulnerabilities after pinned transitive overrides |
| Typecheck, lint, build | VERIFIED | strict TypeScript, ESLint with zero warnings/errors, and Next.js 16.2.12 production build passed |

## GitHub truth

| Claim | State | Evidence |
|---|---|---|
| Repository is public | VERIFIED | GitHub API: `visibility=PUBLIC`, `isPrivate=false` |
| Default branch | VERIFIED | GitHub API: `main` at base SHA above |
| Task branch pushed | PENDING | `dev/aisle-bridge-initial-build` not yet pushed at this manifest revision |
| Pull request | PENDING | not yet opened at this manifest revision |
| Hosted CI | UNKNOWN | no PR run yet |

## Provider and commercial truth

| Claim | State | Evidence |
|---|---|---|
| Production deployment | NOT AUTHORIZED | no deploy requested or performed |
| Live Supabase schema/RLS | UNKNOWN | migration source exists; no provider action performed |
| Live auth/connectors | UNKNOWN | no identity provider or retailer connector configured |
| Instacart fit or endorsement | UNKNOWN | independent work sample; no affiliation or endorsement claimed |
| Customer demand, revenue, price, ROI, reliability | UNKNOWN | no customer/provider evidence |

## Path correction gap

The original dispatch named a retired authority root. Live filesystem and binding role canon proved the current Tier 1 root, so authority loading was re-run there. No mirror or frozen snapshot was used. Exact workstation paths are intentionally omitted from this public repository.
