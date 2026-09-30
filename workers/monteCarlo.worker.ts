import { boxMullerTransform, percentile } from '../lib/math'
import type {
  SimulationPoint,
  SimulationRequest,
  SimulationResponse,
  SimulationRunResult,
  SimulatorInputs,
} from '../types/simulator'

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value))

function runSimulation(
  inputs: SimulatorInputs,
  runs: number,
  months: number,
): SimulationRunResult {
  const cashByMonth = Array.from({ length: months + 1 }, () => new Array<number>(runs))
  const mrrByMonth = Array.from({ length: months + 1 }, () => new Array<number>(runs))
  const aliveByMonth = new Array<number>(months + 1).fill(0)
  const runwayByRun = new Array<number>(runs).fill(months + 1)
  const volatilitySigma = inputs.volatility * 0.025

  for (let run = 0; run < runs; run += 1) {
    let cash = inputs.cash
    let customers = inputs.arpu > 0 ? inputs.mrr / inputs.arpu : 0
    let currentMrr = customers * inputs.arpu
    let insolvent = cash === 0

    if (insolvent) runwayByRun[run] = 0
    cashByMonth[0]![run] = cash
    mrrByMonth[0]![run] = currentMrr
    if (!insolvent) aliveByMonth[0] += 1

    for (let month = 1; month <= months; month += 1) {
      const growthShock = boxMullerTransform(0, volatilitySigma)
      const churnShock = boxMullerTransform(0, volatilitySigma * 0.35)
      const monthlyGrowth = Math.max(-0.95, inputs.growth / 100 + growthShock)
      const monthlyChurn = clamp(inputs.churn / 100 + churnShock, 0, 0.95)

      customers = Math.max(0, customers * (1 + monthlyGrowth) * (1 - monthlyChurn))
      currentMrr = customers * inputs.arpu

      if (!insolvent) {
        cash = Math.max(0, cash + currentMrr - inputs.burn)
        if (cash === 0) {
          insolvent = true
          runwayByRun[run] = month
        }
      }

      cashByMonth[month]![run] = cash
      mrrByMonth[month]![run] = currentMrr
      if (!insolvent) aliveByMonth[month] += 1
    }
  }

  const points: SimulationPoint[] = []

  for (let month = 0; month <= months; month += 1) {
    const cashValues = cashByMonth[month]!
    const mrrValues = mrrByMonth[month]!
    cashValues.sort((left, right) => left - right)
    mrrValues.sort((left, right) => left - right)

    points.push({
      month,
      p10Cash: percentile(cashValues, 0.1),
      p50Cash: percentile(cashValues, 0.5),
      p90Cash: percentile(cashValues, 0.9),
      p10Mrr: percentile(mrrValues, 0.1),
      p50Mrr: percentile(mrrValues, 0.5),
      p90Mrr: percentile(mrrValues, 0.9),
      aliveProbability: aliveByMonth[month]! / runs,
    })
  }

  runwayByRun.sort((left, right) => left - right)

  return {
    points,
    medianRunwayMonths: percentile(runwayByRun, 0.5),
    defaultAliveProbability: aliveByMonth[months]! / runs,
  }
}

self.onmessage = (event: MessageEvent<SimulationRequest>) => {
  const { requestId, inputs, runs, months } = event.data

  try {
    if (!Number.isSafeInteger(runs) || runs < 1 || runs > 10_000) {
      throw new Error('Simulation run count is outside the supported range.')
    }
    if (!Number.isSafeInteger(months) || months < 1 || months > 120) {
      throw new Error('Simulation horizon is outside the supported range.')
    }
    if (Object.values(inputs).some((value) => !Number.isFinite(value))) {
      throw new Error('Simulation inputs must all be finite numbers.')
    }

    const result = runSimulation(inputs, runs, months)
    const response: SimulationResponse = {
      type: 'complete',
      requestId,
      summary: { ...result, runs, months },
    }

    self.postMessage(response)
  } catch (error) {
    const response: SimulationResponse = {
      type: 'error',
      requestId,
      error: error instanceof Error ? error.message : 'Simulation failed.',
    }
    self.postMessage(response)
  }
}
