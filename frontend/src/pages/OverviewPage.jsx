import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import KpiCard from '../components/KpiCard';
import { getSummary, listMeals, listActivities, upsertTarget } from '../services/apiClient';

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

export default function OverviewPage() {
  const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [targetDeficit, setTargetDeficit] = useState('500');
  const [status, setStatus] = useState({ loading: true, error: '' });

  const tone = useMemo(() => {
    if (!summary) return 'neutral';
    return summary.deficit_delta_kcal >= 0 ? 'good' : 'bad';
  }, [summary]);

  const macroSummary = useMemo(() => {
    const totals = (meals || []).reduce(
      (acc, meal) => {
        acc.proteins += Number(meal.proteins || 0);
        acc.carbohydrates += Number(meal.carbohydrates || 0);
        acc.fats += Number(meal.fats || 0);
        return acc;
      },
      { proteins: 0, carbohydrates: 0, fats: 0 }
    );
    const total = totals.proteins + totals.carbohydrates + totals.fats;
    return [
      { key: 'proteins', label: '蛋白质', unit: 'g', value: totals.proteins, ratio: total ? (totals.proteins / total) * 100 : 0, tone: 'from-cyan-500 to-blue-500' },
      { key: 'carbohydrates', label: '碳水', unit: 'g', value: totals.carbohydrates, ratio: total ? (totals.carbohydrates / total) * 100 : 0, tone: 'from-violet-500 to-fuchsia-500' },
      { key: 'fats', label: '脂肪', unit: 'g', value: totals.fats, ratio: total ? (totals.fats / total) * 100 : 0, tone: 'from-amber-400 to-orange-500' },
    ];
  }, [meals]);

  async function refresh(dateStr) {
    setStatus({ loading: true, error: '' });
    try {
      const [s, m, a] = await Promise.all([
        getSummary(dateStr),
        listMeals(dateStr),
        listActivities(dateStr),
      ]);
      setSummary(s);
      setMeals(m);
      setActivities(a);
      setTargetDeficit(String(s.target_deficit_kcal ?? 500));
      setStatus({ loading: false, error: '' });
    } catch (e) {
      setStatus({ loading: false, error: e?.message || '加载失败' });
    }
  }

  useEffect(() => {
    refresh(selectedDate);
  }, [selectedDate]);

  async function saveTarget() {
    const v = Number(targetDeficit);
    if (!Number.isFinite(v) || v < 0 || v > 2000) {
      setStatus((s) => ({ ...s, error: '目标缺口需在 0~2000 之间' }));
      return;
    }
    try {
      await upsertTarget({ target_date: selectedDate, target_deficit_kcal: Math.round(v) });
      await refresh(selectedDate);
    } catch (e) {
      setStatus((s) => ({ ...s, error: e?.message || '保存失败' }));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.12),_transparent_24%),linear-gradient(180deg,#ffffff,#f8fafc)] p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Daily Intelligence
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">今日热量概览与营养结构</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              以专业仪表盘形式追踪当日摄入、运动消耗、基础代谢和目标缺口，同时汇总蛋白质、碳水、脂肪结构，帮助你快速判断饮食质量。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              onClick={() => setSelectedDate(isoDate(new Date()))}
            >
              今天
            </button>
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setSelectedDate(isoDate(d));
              }}
            >
              昨天
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>
      </div>

      {status.error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{status.error}</div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="摄入" value={status.loading ? '--' : Math.round(summary?.intake_kcal || 0)} unit="kcal" />
        <KpiCard title="运动消耗" value={status.loading ? '--' : Math.round(summary?.activity_burn_kcal || 0)} unit="kcal" />
        <KpiCard title="基础代谢(BMR)" value={status.loading ? '--' : Math.round(summary?.bmr_kcal || 0)} unit="kcal" />
        <KpiCard
          title="热量缺口"
          value={status.loading ? '--' : Math.round(summary?.deficit_kcal || 0)}
          unit="kcal"
          hint={status.loading ? '' : `目标缺口 ${summary?.target_deficit_kcal || 500} kcal，差值 ${Math.round(summary?.deficit_delta_kcal || 0)} kcal`}
          tone={tone}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">最近记录</div>
                <div className="mt-1 text-xs text-slate-500">当天的饮食与运动会在这里形成完整时间切片，方便你快速复盘。</div>
              </div>
              <Link to={`/reports?from=${selectedDate}&to=${selectedDate}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-slate-50 hover:text-blue-700">
                查看报表
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">饮食</div>
                <div className="mt-3 space-y-3">
                  {(meals || []).slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">{m.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{m.activity_date}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{Math.round(m.calories)} kcal</div>
                    </div>
                  ))}
                  {meals?.length ? null : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">暂无饮食记录</div>}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">运动</div>
                <div className="mt-3 space-y-3">
                  {(activities || []).slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">{a.activity_type}</div>
                        <div className="mt-1 text-xs text-slate-500">{a.duration_minutes} min · {a.intensity}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{Math.round(a.calories_burned)} kcal</div>
                    </div>
                  ))}
                  {activities?.length ? null : <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">暂无运动记录</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">营养结构分析</div>
                <div className="mt-1 text-xs text-slate-500">根据当日饮食记录自动聚合蛋白质、碳水和脂肪，帮助你判断饮食是否均衡。</div>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                {(meals || []).length} 份饮食
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {macroSummary.map((item) => (
                <div key={item.key} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <div className="text-3xl font-semibold tracking-tight text-slate-950">{Math.round(item.value * 10) / 10}</div>
                    <div className="text-sm text-slate-500">{item.unit}</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full bg-gradient-to-r ${item.tone}`} style={{ width: `${Math.max(item.ratio, item.value > 0 ? 8 : 0)}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">占比 {Math.round(item.ratio)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-4">
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="text-sm font-semibold text-slate-900">目标设置</div>
            <div className="mt-1 text-xs text-slate-500">设置每日热量缺口目标，用于判断当前饮食和运动策略是否达标。</div>
            <div className="mt-5">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">每日缺口目标 (kcal)</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={targetDeficit}
                  onChange={(e) => setTargetDeficit(e.target.value)}
                  onBlur={saveTarget}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  inputMode="numeric"
                />
                <button
                  onClick={saveTarget}
                  className="h-12 rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  保存
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#0f172a,#111827)] p-5 text-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.8)]">
            <div className="text-sm font-semibold">快捷操作</div>
            <div className="mt-1 text-xs text-slate-300">快速进入最常用的记录场景，保持日常操作流畅。</div>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <Link
                to={`/log?date=${selectedDate}&tab=food`}
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                拍照记饮食
              </Link>
              <Link
                to={`/log?date=${selectedDate}&tab=manual`}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm text-white transition hover:bg-white/10"
              >
                Gemini 手动记饮食
              </Link>
              <Link
                to={`/log?date=${selectedDate}&tab=workout`}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm text-white transition hover:bg-white/10"
              >
                记录运动
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
