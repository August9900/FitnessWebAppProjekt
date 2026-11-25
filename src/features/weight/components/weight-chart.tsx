import { WEIGHT_TEXTS, chartPoints, formatShortDate, formatWeight, type WeightEntry, type WeightRange } from '../weight.rules'

const BOX = { width: 320, height: 160, padding: 20 }

/**
 * The curve of one range (AC-7): a plain line with points, labelled only with the smallest and the
 * largest value and the first and the last day. No targets, no trend arrows, no judging colours, no
 * animation. Hidden from screen readers — the list below is its text version (AC-9). With fewer than
 * two entries in the range there is no curve, only a short note (AC-8).
 */
export function WeightChart({ entries, range, today }: { entries: WeightEntry[]; range: WeightRange; today: string }) {
  const chart = chartPoints(entries, range, today, BOX)
  if (!chart) return <p className="rounded-lg border bg-card p-6 text-muted-foreground">{WEIGHT_TEXTS.tooFew}</p>

  const line = chart.points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const top = Math.min(...chart.points.map((point) => point.y))
  const bottom = Math.max(...chart.points.map((point) => point.y))

  return (
    <figure className="rounded-lg border bg-card p-4">
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="h-auto w-full text-primary"
        aria-hidden="true"
        focusable="false"
        data-testid="weight-chart"
      >
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {chart.points.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r={3} fill="currentColor" />
        ))}
        <text x={2} y={Math.max(top - 6, 10)} className="fill-muted-foreground text-[10px]">
          {formatWeight(chart.maxKg)}
        </text>
        {chart.maxKg !== chart.minKg && (
          <text x={2} y={Math.min(bottom + 14, BOX.height - 14)} className="fill-muted-foreground text-[10px]">
            {formatWeight(chart.minKg)}
          </text>
        )}
        <text x={BOX.padding} y={BOX.height - 2} className="fill-muted-foreground text-[10px]">
          {formatShortDate(chart.firstDate)}
        </text>
        <text x={BOX.width - BOX.padding} y={BOX.height - 2} textAnchor="end" className="fill-muted-foreground text-[10px]">
          {formatShortDate(chart.lastDate)}
        </text>
      </svg>
    </figure>
  )
}
