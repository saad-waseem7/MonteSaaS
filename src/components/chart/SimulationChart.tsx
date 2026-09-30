import { AnimatePresence, motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  ChartTooltipProps,
  SimulationChartProps,
  SimulationPoint,
} from '../../../types/simulator'

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const exactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function ChartTooltip({ active, payload, label, view }: ChartTooltipProps) {
  const point = payload?.[0]?.payload as SimulationPoint | undefined
  if (!active || !point) return null

  const values = view === 'cash'
    ? [point.p10Cash, point.p50Cash, point.p90Cash]
    : [point.p10Mrr, point.p50Mrr, point.p90Mrr]

  return (
    <div className="chart-tooltip">
      <p className="tooltip-month">Month {label}</p>
      <div className="tooltip-row">
        <span><i className="legend-dot rose" />P10</span>
        <strong>{exactCurrency.format(values[0])}</strong>
      </div>
      <div className="tooltip-row">
        <span><i className="legend-dot blue" />P50</span>
        <strong>{exactCurrency.format(values[1])}</strong>
      </div>
      <div className="tooltip-row">
        <span><i className="legend-dot mint" />P90</span>
        <strong>{exactCurrency.format(values[2])}</strong>
      </div>
    </div>
  )
}

export function SimulationChart({ points, view, isCalculating, onViewChange }: SimulationChartProps) {
  const keys = view === 'cash'
    ? { p10: 'p10Cash', p50: 'p50Cash', p90: 'p90Cash' }
    : { p10: 'p10Mrr', p50: 'p50Mrr', p90: 'p90Mrr' }

  return (
    <section aria-labelledby="chart-title" className="panel chart-panel border border-zinc-800 bg-zinc-900">
      <div className="panel-heading chart-heading">
        <div>
          <div className="eyebrow">36-month forecast</div>
          <h2 id="chart-title">{view === 'cash' ? 'Cash Balance' : 'Monthly Recurring Revenue'}</h2>
        </div>
        <div className="chart-heading-actions">
          <div aria-label="Chart metric" className="view-toggle" role="group">
            <button aria-pressed={view === 'cash'} onClick={() => onViewChange('cash')} type="button">Cash</button>
            <button aria-pressed={view === 'mrr'} onClick={() => onViewChange('mrr')} type="button">MRR</button>
          </div>
          <div aria-live="polite" className="chart-status">
            <span className={`status-indicator${isCalculating ? ' is-calculating' : ''}`} />
            {isCalculating ? 'Recalculating' : '1,000 simulations'}
          </div>
        </div>
      </div>

      <div className="chart-legend" aria-label="Chart percentiles">
        <span><i className="legend-line rose" />P10 downside</span>
        <span><i className="legend-line blue" />P50 median</span>
        <span><i className="legend-line mint" />P90 upside</span>
      </div>

      <div className="chart-canvas">
        {points.length === 0 && (
          <div className="chart-empty-state" role="status">Preparing forecast paths</div>
        )}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="chart-motion-layer"
            exit={{ opacity: 0, y: -4 }}
            initial={{ opacity: 0, y: 4 }}
            key={view}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="month"
                  interval={5}
                    tick={{ fill: '#a1a1aa', fontSize: 13 }}
                  tickLine={false}
                  tickMargin={12}
                  tickFormatter={(month: number) => month === 0 || month % 6 === 0 ? `M${month}` : ''}
                />
                <YAxis
                  axisLine={false}
                  domain={[0, 'auto']}
                    tick={{ fill: '#a1a1aa', fontSize: 13 }}
                  tickFormatter={(value: number) => compactCurrency.format(value)}
                  tickLine={false}
                  tickMargin={10}
                  width={64}
                />
                <Tooltip
                  content={(props) => <ChartTooltip {...props} view={view} />}
                  cursor={{ stroke: '#52525b', strokeDasharray: '4 4' }}
                />
                {view === 'cash' && <ReferenceLine y={0} stroke="#52525b" strokeDasharray="4 4" />}
                <Area
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  dataKey={keys.p90}
                  fill="transparent"
                  isAnimationActive={false}
                  name="P90"
                  stroke="#4adea8"
                  strokeWidth={1.7}
                  type="monotone"
                />
                <Area
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  dataKey={keys.p50}
                  fill="transparent"
                  isAnimationActive={false}
                  name="P50"
                  stroke="#60a5fa"
                  strokeWidth={2.4}
                  type="monotone"
                />
                <Area
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  dataKey={keys.p10}
                  fill="transparent"
                  isAnimationActive={false}
                  name="P10"
                  stroke="#fb7185"
                  strokeWidth={1.7}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="chart-footnote">
        <span>Percentile outcomes across 1,000 independent paths</span>
        <span>Month 0–36</span>
      </div>
    </section>
  )
}
