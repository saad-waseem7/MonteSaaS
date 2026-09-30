import * as Slider from '@radix-ui/react-slider'
import type { RangeControlProps } from '../../../types/simulator'

export function RangeControl({
  id,
  label,
  description,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: RangeControlProps) {
  return (
    <div className="field-group range-field">
      <div className="field-heading">
        <label className="field-label" htmlFor={id}>{label}</label>
        <output className="field-value" htmlFor={id}>{displayValue}</output>
      </div>
      <p className="field-description" id={`${id}-description`}>{description}</p>
      <Slider.Root
        aria-describedby={`${id}-description`}
        className="slider-root"
        max={max}
        min={min}
        onValueChange={(values) => {
          const nextValue = values[0]
          if (nextValue !== undefined) onChange(nextValue)
        }}
        step={step}
        value={[value]}
      >
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb aria-label={label} className="slider-thumb" id={id} />
      </Slider.Root>
      <div aria-hidden="true" className="range-bounds">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
