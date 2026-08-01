-- AisleBridge persistence contract. Not applied to any provider by this repository.
-- All tables are tenant-bound and fail closed under RLS.

create extension if not exists pgcrypto;

create table public.engagements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  business_decision text not null,
  estate_scope jsonb not null,
  state text not null check (state in ('PROPOSED','AUTHORIZED','ACTIVE','ACCEPTED','STOPPED')),
  digest text not null,
  created_at timestamptz not null default now()
);

create table public.source_systems (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  engagement_id uuid not null references public.engagements(id),
  environment text not null check (environment in ('SANDBOX','PRODUCTION_GATED')),
  capability_digest text not null,
  state text not null check (state in ('DISCOVERED','APPROVED_READ_ONLY','QUARANTINED','EXPIRED')),
  created_at timestamptz not null default now()
);

create table public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  source_system_id uuid not null references public.source_systems(id),
  sha256 text not null,
  expected_record_count integer not null check (expected_record_count >= 0),
  captured_at timestamptz not null,
  expires_at timestamptz not null,
  state text not null check (state in ('REGISTERED','PROFILED','SUPERSEDED','QUARANTINED'))
);

create table public.mapping_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  source_snapshot_id uuid not null references public.source_snapshots(id),
  version integer not null check (version > 0),
  rules jsonb not null,
  held_fields jsonb not null default '[]'::jsonb,
  digest text not null,
  state text not null check (state in ('DRAFT','VALIDATED','APPROVED','SUPERSEDED')),
  unique (tenant_id, id, version)
);

create table public.change_sets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  mapping_contract_id uuid not null references public.mapping_contracts(id),
  target_environment text not null check (target_environment = 'SANDBOX'),
  target_version text not null,
  operation_key text not null,
  impact_digest text not null,
  compensation_change_set_id uuid references public.change_sets(id),
  state text not null check (state in ('DRAFT','DRY_RUN_PASSED','APPROVED','EXECUTED','RECONCILED','ROLLED_BACK')),
  unique (tenant_id, operation_key)
);

create table public.evidence_receipts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  change_set_id uuid references public.change_sets(id),
  receipt_type text not null,
  expected_count integer not null check (expected_count >= 0),
  observed_count integer not null check (observed_count >= 0),
  evidence jsonb not null,
  digest text not null,
  state text not null,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  actor_id uuid not null,
  record_type text not null,
  record_id uuid not null,
  action text not null,
  capability_digest text not null,
  before_digest text,
  after_digest text not null,
  occurred_at timestamptz not null default now()
);

alter table public.engagements enable row level security;
alter table public.source_systems enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.mapping_contracts enable row level security;
alter table public.change_sets enable row level security;
alter table public.evidence_receipts enable row level security;
alter table public.audit_events enable row level security;

create policy engagements_tenant_isolation on public.engagements for all using (tenant_id::text = (auth.jwt() ->> 'tenant_id')) with check (tenant_id::text = (auth.jwt() ->> 'tenant_id'));
create policy source_systems_tenant_isolation on public.source_systems for all using (tenant_id::text = (auth.jwt() ->> 'tenant_id')) with check (tenant_id::text = (auth.jwt() ->> 'tenant_id'));
create policy source_snapshots_tenant_isolation on public.source_snapshots for all using (tenant_id::text = (auth.jwt() ->> 'tenant_id')) with check (tenant_id::text = (auth.jwt() ->> 'tenant_id'));
create policy mapping_contracts_tenant_isolation on public.mapping_contracts for all using (tenant_id::text = (auth.jwt() ->> 'tenant_id')) with check (tenant_id::text = (auth.jwt() ->> 'tenant_id'));
create policy change_sets_tenant_isolation on public.change_sets for all using (tenant_id::text = (auth.jwt() ->> 'tenant_id')) with check (tenant_id::text = (auth.jwt() ->> 'tenant_id'));
create policy evidence_receipts_tenant_isolation on public.evidence_receipts for all using (tenant_id::text = (auth.jwt() ->> 'tenant_id')) with check (tenant_id::text = (auth.jwt() ->> 'tenant_id'));
create policy audit_events_tenant_isolation on public.audit_events for all using (tenant_id::text = (auth.jwt() ->> 'tenant_id')) with check (tenant_id::text = (auth.jwt() ->> 'tenant_id'));

revoke update, delete on public.audit_events from authenticated;
