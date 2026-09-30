export function boxMullerTransform(mean = 0, standardDeviation = 1): number {
  const firstUniform = Math.max(Number.MIN_VALUE, Math.random())
  const secondUniform = Math.random()
  const standardNormal =
    Math.sqrt(-2 * Math.log(firstUniform)) * Math.cos(2 * Math.PI * secondUniform)

  return mean + standardDeviation * standardNormal
}

export function percentile(sortedValues: number[], fraction: number): number {
  if (sortedValues.length === 0) return 0

  const safeFraction = Math.min(1, Math.max(0, fraction))
  const position = (sortedValues.length - 1) * safeFraction
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)
  const lowerValue = sortedValues[lowerIndex] ?? 0
  const upperValue = sortedValues[upperIndex] ?? lowerValue
  const interpolation = position - lowerIndex

  return lowerValue + (upperValue - lowerValue) * interpolation
}
