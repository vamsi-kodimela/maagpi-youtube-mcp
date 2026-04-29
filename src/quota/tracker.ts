import { config } from "../config.js";
import type { QuotaSummary } from "../errors/types.js";

interface HistoryEntry {
  method: string;
  cost: number;
  ts: number;
}

interface QuotaState {
  dailyUsed: number;
  resetAtMs: number;
  history: HistoryEntry[];
}

const HISTORY_MAX = 100;

function nextPacificMidnightMs(): number {
  const now = new Date();
  // Pacific Standard Time is UTC-8; PDT is UTC-7. Use a simple heuristic: UTC-8.
  const pacificOffset = -8 * 60;
  const offsetMs = pacificOffset * 60 * 1000;
  const pacificNow = new Date(now.getTime() + offsetMs);
  const midnight = new Date(pacificNow);
  midnight.setUTCHours(24, 0, 0, 0);
  return midnight.getTime() - offsetMs;
}

const state: QuotaState = {
  dailyUsed: 0,
  resetAtMs: nextPacificMidnightMs(),
  history: [],
};

function checkReset(): void {
  if (Date.now() >= state.resetAtMs) {
    state.dailyUsed = 0;
    state.resetAtMs = nextPacificMidnightMs();
    state.history = [];
  }
}

export function trackQuota(method: string, cost?: number): void {
  checkReset();
  const actualCost = cost ?? 1;
  state.dailyUsed += actualCost;

  state.history.push({ method, cost: actualCost, ts: Date.now() });
  if (state.history.length > HISTORY_MAX) {
    state.history.shift();
  }
}

export function getQuotaSummary(costOfThisCall: number): QuotaSummary {
  checkReset();
  const budget = config.quotaLimit;
  const used = state.dailyUsed;
  const remaining = Math.max(0, budget - used);
  const pct = used / budget;

  let warningLevel: "ok" | "warn" | "critical" = "ok";
  if (pct >= 0.95) warningLevel = "critical";
  else if (pct >= 0.8) warningLevel = "warn";

  return {
    used,
    budget,
    remaining,
    resetAt: new Date(state.resetAtMs).toISOString(),
    warningLevel,
    costOfThisCall,
  };
}

export function getQuotaHistory(): HistoryEntry[] {
  return [...state.history];
}

export function resetQuotaForTesting(): void {
  state.dailyUsed = 0;
  state.resetAtMs = nextPacificMidnightMs();
  state.history = [];
}
