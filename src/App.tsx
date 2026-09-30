import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Activity, ArrowUpRight, Copy, RotateCcw } from 'lucide-react'
import { CurrencyInput } from './components/controls/CurrencyInput'
import { RangeControl } from './components/controls/RangeControl'
import { KpiCard } from './components/kpi/KpiCard'
import { createScenarioUrl, useUrlSync } from './hooks/useUrlSync'
import { DEFAULT_INPUTS, useSimulatorStore } from '../store/useSimulatorStore'
import type { SimulationRequest, SimulationResponse } from '../types/simulator'

const SimulationChart = lazy(() =>
  import('./components/chart/SimulationChart').then(({ SimulationChart: Chart }) => ({
    default: Chart,
  })),
)

function App() {
  const hydrated = useUrlSync()
  const inputs = useSimulatorStore((state) => state.inputs)
  const result = useSimulatorStore((state) => state.result)
  const status = useSimulatorStore((state) => state.status)
  const error = useSimulatorStore((state) => state.error)
  const view = useSimulatorStore((state) => state.view)
  const setInput = useSimulatorStore((state) => state.setInput)
  const setInputs = useSimulatorStore((state) => state.setInputs)
  const setResult = useSimulatorStore((state) => state.setResult)
  const setStatus = useSimulatorStore((state) => state.setStatus)
  const setView = useSimulatorStore((state) => state.setView)
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const [notice, setNotice] = useState('')
  const isCalculating = status === 'calculating' || status === 'idle'

  useEffect(() => {
    const worker = new Worker(new URL('../workers/monteCarlo.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<SimulationResponse>) => {
      const response = event.data
      if (response.requestId !== requestIdRef.current) return

      if (response.type === 'complete' && response.summary) {
        setResult(response.summary)
      } else {
        setStatus('error', response.error ?? 'The simulation could not be completed.')
      }
    }

    worker.onerror = (event) => {
      setStatus('error', event.message || 'The simulation worker encountered an error.')
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [setResult, setStatus])

  useEffect(() => {
    if (!hydrated || !workerRef.current) return

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    const timeout = window.setTimeout(() => {
      const request: SimulationRequest = {
        type: 'simulate',
        requestId,
        inputs,
        runs: 1_000,
        months: 36,
      }
      workerRef.current?.postMessage(request)
    }, 50)

    return () => window.clearTimeout(timeout)
  }, [hydrated, inputs])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3_000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const handleShare = async () => {
    const shareUrl = createScenarioUrl(inputs)
    window.history.replaceState(window.history.state, '', shareUrl)

    try {
      await navigator.clipboard.writeText(shareUrl.toString())
      setNotice('Scenario link copied')
    } catch {
      setNotice('Scenario URL is ready in the address bar')
    }
  }

  const runwayValue = result
    ? result.medianRunwayMonths > 36
      ? '36+ mo'
      : `${Math.round(result.medianRunwayMonths)} mo`
    : 'Calculating'
  const alivePercent = result ? Math.round(result.defaultAliveProbability * 100) : 0

  return (
    <div className="app-shell text-zinc-100">
      <header className="topbar">
        <a aria-label="MonteSaaS home" className="brand" href="/">
          <span className="brand-mark"><Activity aria-hidden="true" size={17} strokeWidth={2.2} /></span>
          <span>Monte<span className="brand-accent">SaaS</span></span>
        </a>
        <div className="topbar-right">
          <span className="product-label">RUNWAY INTELLIGENCE</span>
          <button className="share-button" onClick={handleShare} type="button">
            <Copy aria-hidden="true" size={15} />
            <span>Copy share link</span>
          </button>
        </div>
      </header>

      <main>
        <section aria-labelledby="page-title" className="intro-row">
          <div>
            <div className="eyebrow intro-eyebrow"><span className="eyebrow-rule" />FOUNDER FINANCE / SIMULATOR 01</div>
            <h1 id="page-title">Know your runway.<br /><span>Before the market does.</span></h1>
            <p className="intro-copy">A probabilistic view of what comes next. Tune your assumptions and explore 1,000 possible futures.</p>
          </div>
          <div className="model-badge">
            <span aria-hidden="true" className="model-live-dot" />
            <div><strong>Monte Carlo Engine</strong><span>36-month horizon</span></div>
            <ArrowUpRight aria-hidden="true" size={16} />
          </div>
        </section>

        <section aria-label="Forecast Summary" className="kpi-grid">
          <KpiCard
            detail="Median time until cash reaches zero"
            icon="clock"
            label="Months of Runway"
            tone="mint"
            value={runwayValue}
          />
          <KpiCard
            detail="Probability of staying solvent through month 36"
            icon="pulse"
            label="Default Alive Probability"
            progress={result ? alivePercent : 0}
            tone="blue"
            value={result ? `${alivePercent}%` : 'Calculating'}
          />
        </section>

        <div className="workspace-grid">
          <div className="primary-column">
            <Suspense fallback={<section aria-label="Loading forecast chart" className="panel chart-panel chart-loading">Loading forecast chart</section>}>
              <SimulationChart
                isCalculating={isCalculating}
                onViewChange={setView}
                points={result?.points ?? []}
                view={view}
              />
            </Suspense>
            <section aria-label="Simulation methodology" className="method-note">
              <span className="method-icon"><Activity aria-hidden="true" size={15} /></span>
              <p><strong>Built for uncertainty.</strong> Growth and churn vary across each path; cash is clamped at zero once a company runs out of runway.</p>
            </section>
          </div>

          <aside aria-labelledby="assumptions-title" className="panel controls-panel border border-zinc-800 bg-zinc-900">
            <div className="controls-header">
              <div>
                <div className="eyebrow">SCENARIO INPUTS</div>
                <h2 id="assumptions-title">Your assumptions</h2>
              </div>
              <button
                aria-label="Reset scenario to defaults"
                className="icon-button"
                onClick={() => setInputs(DEFAULT_INPUTS)}
                title="Reset scenario"
                type="button"
              >
                <RotateCcw aria-hidden="true" size={15} />
              </button>
            </div>

            <div className="control-section-label"><span>Capital & revenue</span><span>USD</span></div>
            <div className="control-stack">
              <CurrencyInput
                description="Cash available to fund operations"
                id="cash"
                label="Cash in bank"
                max={100_000_000}
                onChange={(value) => setInput('cash', value)}
                step={1_000}
                value={inputs.cash}
              />
              <CurrencyInput
                description="Current monthly recurring revenue"
                id="mrr"
                label="Starting MRR"
                max={10_000_000}
                onChange={(value) => setInput('mrr', value)}
                step={100}
                value={inputs.mrr}
              />
              <CurrencyInput
                description="Monthly operating costs, excluding revenue"
                id="burn"
                label="Monthly burn"
                max={10_000_000}
                onChange={(value) => setInput('burn', value)}
                step={100}
                value={inputs.burn}
              />
              <CurrencyInput
                description="Average monthly revenue per customer"
                id="arpu"
                label="Average revenue per account"
                max={100_000}
                onChange={(value) => setInput('arpu', value)}
                step={1}
                value={inputs.arpu}
              />
            </div>

            <div className="control-section-label behavior-label"><span>Growth assumptions</span><span>MONTHLY</span></div>
            <div className="control-stack slider-stack">
              <RangeControl
                description="Expected customer growth before uncertainty"
                displayValue={`${inputs.growth.toFixed(1)}%`}
                id="growth"
                label="Customer growth"
                max={100}
                min={0}
                onChange={(value) => setInput('growth', value)}
                step={0.5}
                value={inputs.growth}
              />
              <RangeControl
                description="Expected monthly customer churn"
                displayValue={`${inputs.churn.toFixed(1)}%`}
                id="churn"
                label="Customer churn"
                max={100}
                min={0}
                onChange={(value) => setInput('churn', value)}
                step={0.5}
                value={inputs.churn}
              />
              <RangeControl
                description="Scales the spread of growth and churn outcomes"
                displayValue={`${inputs.volatility.toFixed(1)}x`}
                id="volatility"
                label="Market volatility"
                max={5}
                min={1}
                onChange={(value) => setInput('volatility', value)}
                step={0.1}
                value={inputs.volatility}
              />
            </div>

            <div className="controls-footer">
              <span className={`status-indicator${isCalculating ? ' is-calculating' : ''}`} />
              <span>{isCalculating ? 'Updating forecast' : 'Forecast is current'}</span>
              <span className="footer-separator">/</span>
              <span>1,000 paths</span>
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
          </aside>
        </div>
      </main>

      <footer className="page-footer">
        <span>MONTESAAS <span className="footer-year">/ 2026</span></span>
        <span>Forecasts are estimates, not financial advice.</span>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  )
}

export default App
