import { useEffect, useLayoutEffect, useSyncExternalStore } from 'react'
import { DEFAULT_INPUTS, useSimulatorStore } from '../../store/useSimulatorStore'
import type { InputKey, SimulatorInputs } from '../../types/simulator'

const QUERY_KEYS: Record<InputKey, string> = {
  cash: 'c',
  mrr: 'm',
  burn: 'b',
  growth: 'g',
  churn: 'n',
  arpu: 'a',
  volatility: 'v',
}

const INPUT_KEYS = Object.keys(QUERY_KEYS) as InputKey[]
let urlHasHydrated = false
const hydrationListeners = new Set<() => void>()

function subscribeToHydration(listener: () => void): () => void {
  hydrationListeners.add(listener)
  return () => hydrationListeners.delete(listener)
}

function getHydrationSnapshot(): boolean {
  return urlHasHydrated
}

function getServerHydrationSnapshot(): boolean {
  return false
}

function readInputsFromUrl(): SimulatorInputs {
  const params = new URLSearchParams(window.location.search)
  const inputs = { ...DEFAULT_INPUTS }

  for (const key of INPUT_KEYS) {
    const rawValue = params.get(QUERY_KEYS[key])
    if (rawValue === null || rawValue.trim() === '') continue

    const parsedValue = Number(rawValue)
    if (Number.isFinite(parsedValue)) inputs[key] = parsedValue
  }

  return inputs
}

export function createScenarioUrl(inputs: SimulatorInputs): URL {
  const url = new URL(window.location.href)
  for (const key of INPUT_KEYS) {
    url.searchParams.set(QUERY_KEYS[key], String(inputs[key]))
  }

  return url
}

function writeInputsToUrl(inputs: SimulatorInputs): void {
  window.history.replaceState(window.history.state, '', createScenarioUrl(inputs))
}

export function useUrlSync(): boolean {
  const inputs = useSimulatorStore((state) => state.inputs)
  const setInputs = useSimulatorStore((state) => state.setInputs)
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot,
  )

  useLayoutEffect(() => {
    setInputs(readInputsFromUrl())
    if (!urlHasHydrated) {
      urlHasHydrated = true
      hydrationListeners.forEach((listener) => listener())
    }

    const handlePopState = () => setInputs(readInputsFromUrl())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [setInputs])

  useEffect(() => {
    if (hydrated) writeInputsToUrl(inputs)
  }, [hydrated, inputs])

  return hydrated
}
