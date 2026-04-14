import React from 'react';
import KpiCard from '../../components/KpiCard';

export default function DayRecordsPanel({ summary, meals, activities, loading, busy, onDeleteMeal, onDeleteActivity }) {
  const deficitTone = summary?.deficit_delta_kcal >= 0 ? 'good' : 'bad';
  const totalRecords = (meals?.length || 0) + (activities?.length || 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <KpiCard title="摄入" value={loading ? '--' : Math.round(summary?.intake_kcal || 0)} unit="kcal" />
        <KpiCard title="运动消耗" value={loading ? '--' : Math.round(summary?.activity_burn_kcal || 0)} unit="kcal" />
        <KpiCard title="基础代谢(BMR)" value={loading ? '--' : Math.round(summary?.bmr_kcal || 0)} unit="kcal" />
        <KpiCard
          title="热量缺口"
          value={loading ? '--' : Math.round(summary?.deficit_kcal || 0)}
          unit="kcal"
          hint={loading ? '' : `目标缺口 ${summary?.target_deficit_kcal || 500} kcal`}
          tone={loading ? 'neutral' : deficitTone}
        />
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">当日记录</div>
            <div className="mt-1 text-xs text-slate-500">所有饮食与运动都会实时汇入这里，方便你快速回顾当天决策。</div>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            {totalRecords} 条记录
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">饮食</div>
          <div className="mt-2 space-y-2">
            {(meals || []).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{m.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{Math.round(m.calories)} kcal · P {Math.round(m.proteins || 0)} / C {Math.round(m.carbohydrates || 0)} / F {Math.round(m.fats || 0)}</div>
                </div>
                <button
                  onClick={() => onDeleteMeal?.(m.id)}
                  disabled={busy}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            ))}
            {meals?.length ? null : <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">暂无饮食记录</div>}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">运动</div>
          <div className="mt-2 space-y-2">
            {(activities || []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{a.activity_type}</div>
                  <div className="mt-1 text-xs text-slate-500">{a.duration_minutes} min · {Math.round(a.calories_burned)} kcal · {a.intensity}</div>
                </div>
                <button
                  onClick={() => onDeleteActivity?.(a.id)}
                  disabled={busy}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            ))}
            {activities?.length ? null : <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">暂无运动记录</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
