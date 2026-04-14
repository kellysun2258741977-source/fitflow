import React from 'react';

export default function KpiCard({ title, value, unit, hint, tone = 'neutral' }) {
  const toneClasses =
    tone === 'good'
      ? 'border-emerald-200/80 bg-[linear-gradient(180deg,#f0fdf4,#ecfdf5)]'
      : tone === 'bad'
        ? 'border-rose-200/80 bg-[linear-gradient(180deg,#fff1f2,#fff7f7)]'
        : 'border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)]';

  return (
    <div className={`rounded-[24px] border p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)] ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
            {unit ? <div className="text-sm text-slate-500">{unit}</div> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-[11px] font-medium text-slate-500 shadow-sm">
          Live
        </div>
      </div>
      {hint ? <div className="mt-3 text-xs leading-5 text-slate-600">{hint}</div> : null}
    </div>
  );
}
