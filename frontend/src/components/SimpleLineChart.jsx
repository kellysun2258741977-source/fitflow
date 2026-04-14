import React, { useMemo } from 'react';

function scaleLinear(domainMin, domainMax, rangeMin, rangeMax, v) {
  if (domainMax === domainMin) return (rangeMin + rangeMax) / 2;
  const t = (v - domainMin) / (domainMax - domainMin);
  return rangeMin + t * (rangeMax - rangeMin);
}

export default function SimpleLineChart({
  data,
  width = 880,
  height = 260,
  padding = 28,
  valueKey = 'deficit_kcal',
  label = '缺口(kcal)',
}) {
  const { points, minV, maxV } = useMemo(() => {
    const values = (data || []).map((d) => Number(d[valueKey] || 0));
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;
    const pad = Math.max(50, (max - min) * 0.1);
    const minV2 = min - pad;
    const maxV2 = max + pad;

    const pts = (data || []).map((d, idx) => {
      const x = scaleLinear(0, Math.max((data || []).length - 1, 1), padding, width - padding, idx);
      const y = scaleLinear(minV2, maxV2, height - padding, padding, Number(d[valueKey] || 0));
      return { x, y, date: d.date, v: Number(d[valueKey] || 0) };
    });

    return { points: pts, minV: minV2, maxV: maxV2 };
  }, [data, height, padding, valueKey, width]);

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const midY = scaleLinear(minV, maxV, height - padding, padding, 0);
  const areaPath = points.length
    ? `M ${points[0].x} ${height - padding} L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${height - padding} Z`
    : '';

  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}趋势</div>
          <div className="mt-1 text-xs text-slate-500">连续追踪你的摄入与消耗节奏，快速发现偏差日期。</div>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
          {data?.length ? `${data[0].date} ~ ${data[data.length - 1].date}` : '暂无数据'}
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <svg width={width} height={height} role="img" aria-label="trend chart">
          <defs>
            <linearGradient id="lineGradient" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.28)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={width} height={height} rx="18" fill="#ffffff" />
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <line key={ratio} x1={padding} y1={padding + (height - padding * 2) * ratio} x2={width - padding} y2={padding + (height - padding * 2) * ratio} stroke="#E2E8F0" strokeDasharray="4 6" strokeWidth="1" />
          ))}
          <line x1={padding} y1={midY} x2={width - padding} y2={midY} stroke="#CBD5E1" strokeWidth="1" />
          {areaPath ? <path d={areaPath} fill="url(#areaGradient)" /> : null}
          <polyline fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={polyline} />
          {points.map((p) => (
            <g key={p.date}>
              <circle cx={p.x} cy={p.y} r="8" fill="rgba(37,99,235,0.12)" />
              <circle cx={p.x} cy={p.y} r="3.5" fill="#2563EB" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
