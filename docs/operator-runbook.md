# Operator runbook

## Primary journey

1. Start the app and confirm the `Synthetic sandbox` banner.
2. Select `Clean execution`.
3. Type `RUN SYNTHETIC` and run the workflow.
4. Verify terminal state `RECONCILED`, 12 P0 controls, 8 source rows, 4 canonical records, and 0 duplicate writes.
5. Select `Partial write + recovery` and run again.
6. Verify the sequence includes `ROLLBACK REQUIRED` and then `RECOVERED`.

## State model

`REGISTERED → PROPOSED → DRY_RUN_PASSED → APPLIED → MATCHED`

Failure branch:

`APPLIED → ROLLBACK_REQUIRED → RECOVERED`

`HELD` is non-success. It names a missing fact or authority and requires correction, not blind retry.

## Retry policy

- Malformed input, authority denial, stale version, or proof mismatch: terminal for the same request.
- Network or provider timeout: retryable only if no durable receipt exists.
- Unknown execution result: reconcile before any retry.
- Same logical operation key: suppress duplicate execution.
- Maximum provider retry policy for a future adapter: three attempts, exponential jitter, 30-second overall deadline, then `HELD`.

## Recovery drill

The included recovery scenario injects a target that acknowledges one of two expected records.

Expected behavior:

1. Applied count remains 1; expected count remains 2.
2. Reconciliation records `target-acknowledgement-missing`.
3. Further writes remain frozen.
4. The distinct compensating change restores the complete sandbox state.
5. A terminal `RECOVERED` receipt commits with matching input/output count.

If any step reports success without the required receipt, stop the run and treat it as a control-plane defect.

## Rollback

This repository mutates no external system. Code rollback is `git revert <commit>` on a non-default branch followed by the full local gate. Database rollback is not supplied because the migration has not been applied; any future provider migration requires a separately reviewed forward-and-rollback pair.

## Operational unknowns

Live deployment, provider auth, database policy state, retailer acceptance, support route, incident response ownership, RPO/RTO, and observed reliability remain UNKNOWN.
