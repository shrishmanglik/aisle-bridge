"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDot,
  Database,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  RefreshCcw,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import type { EvidenceReceipt, WorkflowResult } from "@/src/domain/types";
import { useWorkflowStore } from "@/src/stores/workflow-store";

const formSchema = z.object({
  scenario: z.enum(["clean", "partial-write-recovery"]),
  confirmation: z.literal("RUN SYNTHETIC", { error: "Type RUN SYNTHETIC to authorize this local simulation." }),
});
type FormValues = z.infer<typeof formSchema>;

const workflowSteps = [
  { label: "Source", icon: Database },
  { label: "Map", icon: Fingerprint },
  { label: "Review", icon: ScanSearch },
  { label: "Dry run", icon: FileCheck2 },
  { label: "Execute", icon: CircleDot },
  { label: "Reconcile", icon: ShieldCheck },
];

const stateClass: Record<EvidenceReceipt["state"], string> = {
  REGISTERED: "text-cyan-200 bg-cyan-300/10 border-cyan-300/20",
  HELD: "text-amber-200 bg-amber-300/10 border-amber-300/20",
  PROPOSED: "text-violet-200 bg-violet-300/10 border-violet-300/20",
  DRY_RUN_PASSED: "text-blue-200 bg-blue-300/10 border-blue-300/20",
  APPLIED: "text-sky-200 bg-sky-300/10 border-sky-300/20",
  MATCHED: "text-emerald-200 bg-emerald-300/10 border-emerald-300/20",
  ROLLBACK_REQUIRED: "text-rose-200 bg-rose-300/10 border-rose-300/20",
  RECOVERED: "text-emerald-200 bg-emerald-300/10 border-emerald-300/20",
};

function ReceiptCard({ receipt }: { receipt: EvidenceReceipt }) {
  return (
    <li className="receipt-row">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-100">{receipt.stage}</h3>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${stateClass[receipt.state]}`}>
            {receipt.state.replaceAll("_", " ")}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-400">{receipt.summary}</p>
        {receipt.unknowns.length > 0 && (
          <p className="mt-2 text-xs text-amber-200/80">Held: {receipt.unknowns.join(", ")}</p>
        )}
      </div>
      <div className="receipt-metrics" aria-label={`${receipt.inputCount} inputs and ${receipt.outputCount} outputs`}>
        <span>{receipt.inputCount} in</span>
        <ArrowRight aria-hidden="true" size={13} />
        <span>{receipt.outputCount} out</span>
      </div>
    </li>
  );
}

function ResultPanel({ result }: { result: WorkflowResult }) {
  return (
    <section id="proof" aria-labelledby="proof-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Evidence trail</p>
          <h2 id="proof-title" className="section-title">The action exists, not just the status.</h2>
        </div>
        <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-200">{result.decision}</Badge>
      </div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-white/8" aria-label="Workflow evidence receipts">
          {result.receipts.map((receipt) => <ReceiptCard key={receipt.receiptId} receipt={receipt} />)}
        </ul>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Source rows" value={result.sourceRecords} detail="two synthetic sources" />
        <Metric label="Canonical records" value={result.canonicalRecords} detail="meaning preserved" />
        <Metric label="P0 controls" value={result.detectorResults.length} detail="all deterministic" />
        <Metric label="Duplicate writes" value="0" detail="operation key suppressed" />
      </div>
      <Card className="p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={18} aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-slate-100">Evidence boundary</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              This run proves local synthetic behavior only. Buyer demand, retailer acceptance, Instacart fit, production reliability, and commercial outcomes remain UNKNOWN.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </Card>
  );
}

export function Workspace() {
  const { result, status, error, setRunning, setResult, setError, reset } = useWorkflowStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { scenario: "clean", confirmation: "RUN SYNTHETIC" },
  });

  async function onSubmit(values: FormValues) {
    setRunning();
    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("The workflow was held. Check confirmation and retry.");
      setResult((await response.json()) as WorkflowResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unexpected local workflow error.");
    }
  }

  return (
    <main>
      <header className="nav-shell">
        <a href="#top" className="brand" aria-label="AisleBridge home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>AisleBridge</span>
        </a>
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
          <a href="#workspace">Workspace</a>
          <a href="#controls">Controls</a>
          <a href="#proof">Proof</a>
          <a href="https://github.com/shrishmanglik/aisle-bridge">Repository</a>
        </nav>
        <Badge>Synthetic sandbox</Badge>
      </header>

      <div id="top" className="page-shell">
        <section className="hero-grid" aria-labelledby="hero-title">
          <div className="max-w-3xl">
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge className="border-cyan-300/25 bg-cyan-300/10 text-cyan-200">Deterministic first</Badge>
              <Badge>Human-approved changes</Badge>
              <Badge>No production connector</Badge>
            </div>
            <h1 id="hero-title" className="hero-title">
              Messy retail data in.<br /><span>Reconciled evidence out.</span>
            </h1>
            <p className="hero-copy">
              A governed workbench for mapping conflicting catalog and availability sources, proving a bounded remediation in a sandbox, and preserving the receipt for every decision.
            </p>
          </div>
          <Card className="hero-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Authority posture</span>
              <LockKeyhole size={16} className="text-emerald-300" aria-hidden="true" />
            </div>
            <dl className="mt-5 space-y-4 text-sm">
              <AuthorityRow term="Source" value="Synthetic + signed" />
              <AuthorityRow term="AI" value="Proposal only" />
              <AuthorityRow term="Write target" value="Local sandbox" />
              <AuthorityRow term="Production" value="Structurally absent" />
            </dl>
          </Card>
        </section>

        <section id="workspace" aria-labelledby="workspace-title" className="section-space">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Primary workflow</p>
              <h2 id="workspace-title" className="section-title">One bounded decision. Six explicit gates.</h2>
            </div>
            {result && <Button variant="secondary" onClick={reset}><RefreshCcw size={15} aria-hidden="true" />Reset run</Button>}
          </div>

          <ol className="workflow-rail" aria-label="Workflow stages">
            {workflowSteps.map(({ label, icon: Icon }, index) => (
              <li key={label} className="workflow-step">
                <span className="step-icon"><Icon size={17} aria-hidden="true" /></span>
                <span><strong>{String(index + 1).padStart(2, "0")}</strong>{label}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 grid gap-5 lg:grid-cols-[0.86fr_1.14fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Run control</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Synthetic market basket</h3>
                </div>
                <Sparkles className="text-cyan-300" aria-hidden="true" />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Two conflicting retailer-shaped exports. Four canonical products. One ambiguous match. No customer or employer data.
              </p>
              <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
                <fieldset>
                  <legend className="form-label">Failure injection</legend>
                  <div className="mt-2 grid gap-2">
                    <label className="radio-card">
                      <input type="radio" value="clean" {...register("scenario")} />
                      <span><strong>Clean execution</strong><small>Apply once and reconcile the full expected set.</small></span>
                    </label>
                    <label className="radio-card">
                      <input type="radio" value="partial-write-recovery" {...register("scenario")} />
                      <span><strong>Partial write + recovery</strong><small>Block false success and execute compensation.</small></span>
                    </label>
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="confirmation" className="form-label">Typed confirmation</label>
                  <input id="confirmation" className="text-input" spellCheck={false} autoComplete="off" {...register("confirmation")} aria-describedby={errors.confirmation ? "confirmation-error" : "confirmation-help"} />
                  {errors.confirmation ? <p id="confirmation-error" className="form-error">{errors.confirmation.message}</p> : <p id="confirmation-help" className="form-help">Confirms a local synthetic action only.</p>}
                </div>
                <Button type="submit" className="w-full" disabled={status === "running"}>
                  {status === "running" ? <><RefreshCcw className="animate-spin" size={16} />Running controls…</> : <>Run governed workflow <ArrowRight size={16} /></>}
                </Button>
                <div aria-live="polite" aria-atomic="true">
                  {error && <p className="form-error rounded-xl border border-rose-300/20 bg-rose-300/10 p-3">{error}</p>}
                </div>
              </form>
            </Card>

            <Card id="controls" className="overflow-hidden">
              <div className="border-b border-white/8 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Control plane</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">12 P0 checks, before authority.</h3>
                  </div>
                  <ShieldCheck size={24} className="text-emerald-300" aria-hidden="true" />
                </div>
              </div>
              <ul className="control-grid" aria-label="P0 control summary">
                {[
                  "Source authority", "Semantic loss", "False merge", "Complete denominator",
                  "Least privilege", "Grounded proposal", "Bounded impact", "Idempotent write",
                  "Silent success", "De-identification", "Claim integrity", "Tenant privacy",
                ].map((label, index) => (
                  <li key={label}>
                    <span className="check-mark"><Check size={13} aria-hidden="true" /></span>
                    <span><strong>R{index + 1}</strong>{label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {result ? <ResultPanel result={result} /> : (
          <section id="proof" aria-labelledby="empty-proof-title" className="empty-proof">
            <RotateCcw aria-hidden="true" />
            <div>
              <h2 id="empty-proof-title">No run receipt yet.</h2>
              <p>Run the synthetic workflow to materialize stage counts, decisions, digests, unknowns, and recovery evidence.</p>
            </div>
          </section>
        )}

        <footer className="footer">
          <p>AisleBridge is an independent work sample. It is not affiliated with or endorsed by Instacart or any retailer.</p>
          <p>Implemented capability ≠ customer demand, provider readiness, or commercial proof.</p>
        </footer>
      </div>
    </main>
  );
}

function AuthorityRow({ term, value }: { term: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-3 last:border-0 last:pb-0"><dt className="text-slate-500">{term}</dt><dd className="font-medium text-slate-200">{value}</dd></div>;
}
