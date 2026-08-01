"use client";

import { create } from "zustand";
import type { WorkflowResult } from "@/src/domain/types";

type WorkflowStore = {
  result: WorkflowResult | null;
  status: "idle" | "running" | "success" | "error";
  error: string | null;
  setRunning: () => void;
  setResult: (result: WorkflowResult) => void;
  setError: (message: string) => void;
  reset: () => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  result: null,
  status: "idle",
  error: null,
  setRunning: () => set({ status: "running", error: null }),
  setResult: (result) => set({ result, status: "success", error: null }),
  setError: (error) => set({ status: "error", error }),
  reset: () => set({ result: null, status: "idle", error: null }),
}));
