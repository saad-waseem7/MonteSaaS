import { create } from 'zustand'
import type {
  InputKey,
  SimulatorInputs,
  SimulatorState,
} from '../types/simulator'

export const DEFAULT_INPUTS: SimulatorInputs = {
  cash: 850_000,
  mrr: 72_000,
  burn: 128_000,
  growth: 8,
  churn: 3,
  arpu: 120,
  volatility: 2.6,
}

const INPUT_LIMITS: Record<InputKey, { min: number; max: number }> = {
  cash: { min: 0, max: 100_000_000 },
  mrr: { min: 0, max: 10_000_000 },
  burn: { min: 0, max: 10_000_000 },
  growth: { min: 0, max: 100 },
  churn: { min: 0, max: 100 },
  arpu: { min: 0, max: 100_000 },
  volatility: { min: 1, max: 5 },
}

function normalizeInputs(inputs: SimulatorInputs): SimulatorInputs {
  return Object.fromEntries(
    (Object.keys(INPUT_LIMITS) as InputKey[]).map((key) => {
      const value = inputs[key]
      const { min, max } = INPUT_LIMITS[key]
      return [key, Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : DEFAULT_INPUTS[key]]
    }),
  ) as unknown as SimulatorInputs
}

export const useSimulatorStore = create<SimulatorState>((set) => ({
  inputs: DEFAULT_INPUTS,
  result: null,
  status: 'idle',
  error: null,
  view: 'cash',
  setInput: (key, value) =>
    set((state) => ({
      inputs: normalizeInputs({ ...state.inputs, [key]: value }),
      status: 'calculating',
      error: null,
    })),
  setInputs: (inputs) =>
    set((state) => ({
      inputs: normalizeInputs({ ...state.inputs, ...inputs }),
      status: 'calculating',
      error: null,
    })),
  setResult: (result) => set({ result, status: 'ready', error: null }),
  setStatus: (status, error = null) => set({ status, error }),
  setView: (view) => set({ view }),
}))
