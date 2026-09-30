import { useState } from 'react'
import type { CurrencyInputProps } from '../../../types/simulator'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

function parseCurrency(value: string): number | null {
  const normalized = value.replace(/[$,\s]/g, '')
  if (normalized === '') return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function CurrencyInput({
  id,
  label,
  description,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
}: CurrencyInputProps) {
  const [draft, setDraft] = useState(formatCurrency(value))
  const [isFocused, setIsFocused] = useState(false)

  const handleBlur = () => {
    setIsFocused(false)
    const parsed = parseCurrency(draft)
    const nextValue = parsed === null ? value : Math.min(max, Math.max(min, parsed))
    onChange(nextValue)
    setDraft(formatCurrency(nextValue))
  }

  return (
    <div className="field-group">
      <div className="field-heading">
        <label className="field-label" htmlFor={id}>{label}</label>
        <span className="field-value">{formatCurrency(value)}</span>
      </div>
      <p className="field-description" id={`${id}-description`}>{description}</p>
      <div className="currency-input-wrap">
        <span aria-hidden="true" className="currency-prefix">$</span>
        <input
          aria-describedby={`${id}-description`}
          aria-label={label}
          autoComplete="off"
          className="currency-input"
          id={id}
          inputMode="decimal"
          onBlur={handleBlur}
          onChange={(event) => {
            const nextDraft = event.currentTarget.value.replace(/[^\d.,-]/g, '')
            setDraft(nextDraft)
            const parsed = parseCurrency(nextDraft)
            if (parsed !== null) onChange(parsed)
          }}
          onFocus={(event) => {
            setIsFocused(true)
            event.currentTarget.select()
          }}
          step={step}
          type="text"
          value={isFocused ? draft : formatCurrency(value)}
        />
      </div>
    </div>
  )
}
