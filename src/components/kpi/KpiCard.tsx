import { Activity, Clock3 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { KpiCardProps } from '../../../types/simulator'

export function KpiCard({ label, value, detail, icon, tone, progress }: KpiCardProps) {
  const Icon = icon === 'clock' ? Clock3 : Activity

  return (
    <article className={`kpi-card kpi-${tone}`}>
      <div className="kpi-topline">
        <span className="kpi-icon"><Icon aria-hidden="true" size={16} strokeWidth={1.8} /></span>
        <span className="kpi-label">{label}</span>
        <span aria-hidden="true" className="kpi-mark">↗</span>
      </div>
      <div aria-live="polite" className="kpi-value">{value}</div>
      <p className="kpi-detail">{detail}</p>
      {progress !== undefined && (
        <div aria-label={`${label}: ${Math.round(progress)} percent`} className="kpi-progress" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <motion.span animate={{ width: `${progress}%` }} initial={false} transition={{ duration: 0.55, ease: 'easeOut' }} />
        </div>
      )}
    </article>
  )
}
