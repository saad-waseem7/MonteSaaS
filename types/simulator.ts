import type { TooltipContentProps } from 'recharts'

export interface SimulatorInputs {
  cash: number
  mrr: number
  burn: number
  growth: number
  churn: number
  arpu: number
  volatility: number
}

export type InputKey = keyof SimulatorInputs
export type MetricView = 'cash' | 'mrr'
export type SimulationStatus = 'idle' | 'calculating' | 'ready' | 'error'

export interface SimulationPoint {
  month: number
  p10Cash: number
  p50Cash: number
  p90Cash: number
  p10Mrr: number
  p50Mrr: number
  p90Mrr: number
  aliveProbability: number
}

export interface SimulationSummary {
  points: SimulationPoint[]
  medianRunwayMonths: number
  defaultAliveProbability: number
  runs: number
  months: number
}

export interface SimulationRequest {
  type: 'simulate'
  requestId: number
  inputs: SimulatorInputs
  runs: number
  months: number
}

export interface SimulationResponse {
  type: 'complete' | 'error'
  requestId: number
  summary?: SimulationSummary
  error?: string
}

export interface SimulationRunResult {
  points: SimulationPoint[]
  medianRunwayMonths: number
  defaultAliveProbability: number
}

export type ChartTooltipProps = TooltipContentProps & {
  view: MetricView
}

export interface SimulationChartProps {
  points: SimulationPoint[]
  view: MetricView
  isCalculating: boolean
  onViewChange: (view: MetricView) => void
}

export interface CurrencyInputProps {
  id: string
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export interface RangeControlProps {
  id: string
  label: string
  description: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onChange: (value: number) => void
}

export interface KpiCardProps {
  label: string
  value: string
  detail: string
  icon: 'clock' | 'pulse'
  tone: 'mint' | 'blue'
  progress?: number
}

export interface SimulatorState {
  inputs: SimulatorInputs
  result: SimulationSummary | null
  status: SimulationStatus
  error: string | null
  view: MetricView
  setInput: (key: InputKey, value: number) => void
  setInputs: (inputs: Partial<SimulatorInputs>) => void
  setResult: (result: SimulationSummary) => void
  setStatus: (status: SimulationStatus, error?: string | null) => void
  setView: (view: MetricView) => void
}
