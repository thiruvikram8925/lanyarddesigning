/**
 * Lightweight SVG charts (no extra dependencies). Used for dashboard analytics standards.
 */

const GREEN = '#28a745';
const RED = '#dc3545';
const BLUE = '#007bff';
const MUTED = '#6c757d';
const AXIS = '#94a3b8';

const toneColor = (tone) => {
  if (tone === 'ok') return GREEN;
  if (tone === 'action') return RED;
  if (tone === 'muted') return MUTED;
  return BLUE;
};

export function UploadTrendLineChart({ title, points, yAxisLabel, xAxisLabel, unit = 'uploads' }) {
  const w = 320;
  const h = 140;
  const padL = 40;
  const padR = 12;
  const padT = 20;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const pathD = points
    .map((p, i) => {
      const x = points.length === 1 ? padL + innerW / 2 : padL + i * step;
      const y = padT + innerH - (p / max) * innerH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <figure className="dashboard-chart-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="text-sm font-bold text-slate-800">{title}</figcaption>
      <p className="mt-1 text-[11px] text-slate-500">{yAxisLabel}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" role="img" aria-label={title}>
        <text x="8" y={padT + innerH / 2} fontSize="10" fill={AXIS}>
          {unit}
        </text>
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke={AXIS} strokeWidth="1" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={AXIS} strokeWidth="1" />
        <path d={pathD} fill="none" stroke={GREEN} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => {
          const x = points.length === 1 ? padL + innerW / 2 : padL + i * step;
          const y = padT + innerH - (p / max) * innerH;
          return <circle key={i} cx={x} cy={y} r="3" fill={GREEN} />;
        })}
        <text x={padL + innerW / 2} y={h - 8} textAnchor="middle" fontSize="10" fill={AXIS}>
          {xAxisLabel}
        </text>
      </svg>
      <ul className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-600">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: GREEN }} />
          Successful uploads (session history)
        </li>
      </ul>
    </figure>
  );
}

export function ElementUsageBarChart({ title, series, yAxisLabel, xAxisLabel }) {
  const w = 320;
  const h = 140;
  const padL = 40;
  const padR = 12;
  const padT = 20;
  const padB = 32;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(...series.map((s) => s.value), 1);
  const n = Math.max(series.length, 1);
  const slot = innerW / n;
  const barW = slot * 0.5;

  return (
    <figure className="dashboard-chart-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <figcaption className="text-sm font-bold text-slate-800">{title}</figcaption>
      <p className="mt-1 text-[11px] text-slate-500">{yAxisLabel}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 w-full" role="img" aria-label={title}>
        <text x="8" y={padT + innerH / 2} fontSize="10" fill={AXIS}>
          count
        </text>
        <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke={AXIS} strokeWidth="1" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={AXIS} strokeWidth="1" />
        {series.map((s, i) => {
          const bh = (s.value / max) * innerH;
          const x = padL + i * slot + (slot - barW) / 2;
          const y = padT + innerH - bh;
          const fill = toneColor(s.tone);
          return (
            <g key={s.key}>
              <rect x={x} y={y} width={barW} height={Math.max(bh, 0)} fill={fill} rx="2" />
              <text x={x + barW / 2} y={h - 14} textAnchor="middle" fontSize="9" fill={AXIS}>
                {s.label}
              </text>
            </g>
          );
        })}
        <text x={padL + innerW / 2} y={h - 4} textAnchor="middle" fontSize="10" fill={AXIS}>
          {xAxisLabel}
        </text>
      </svg>
      <ul className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-600">
        {series.map((s) => (
          <li key={`lg-${s.key}`} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-sm" style={{ backgroundColor: toneColor(s.tone) }} />
            {s.label}
          </li>
        ))}
      </ul>
    </figure>
  );
}
