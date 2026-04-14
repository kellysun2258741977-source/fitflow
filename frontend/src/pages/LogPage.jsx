import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { deleteActivity, deleteMeal, getSummary, listActivities, listMeals } from '../services/apiClient';
import FoodRecognitionPanel from './log/FoodRecognitionPanel';
import ManualMealPanel from './log/ManualMealPanel';
import WorkoutPanel from './log/WorkoutPanel';
import DayRecordsPanel from './log/DayRecordsPanel';
import { isoDate } from './log/utils';

export default function LogPage() {
  const [params] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(params.get('date') || isoDate(new Date()));
  const [tab, setTab] = useState(params.get('tab') || 'food');

  const [meals, setMeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: '', busy: false });

  async function refresh(dateStr) {
    setStatus((s) => ({ ...s, loading: true, error: '' }));
    try {
      const [m, a, s] = await Promise.all([listMeals(dateStr), listActivities(dateStr), getSummary(dateStr)]);
      setMeals(m);
      setActivities(a);
      setSummary(s);
      setStatus((st) => ({ ...st, loading: false }));
    } catch (e) {
      setStatus((st) => ({ ...st, loading: false, error: e?.message || '加载失败' }));
    }
  }

  useEffect(() => {
    refresh(selectedDate);
  }, [selectedDate]);

  async function removeMeal(id) {
    setStatus((s) => ({ ...s, busy: true, error: '' }));
    try {
      await deleteMeal(id);
      await refresh(selectedDate);
    } catch (e) {
      setStatus((s) => ({ ...s, error: e?.message || '删除失败' }));
    } finally {
      setStatus((s) => ({ ...s, busy: false }));
    }
  }

  async function removeActivity(id) {
    setStatus((s) => ({ ...s, busy: true, error: '' }));
    try {
      await deleteActivity(id);
      await refresh(selectedDate);
    } catch (e) {
      setStatus((s) => ({ ...s, error: e?.message || '删除失败' }));
    } finally {
      setStatus((s) => ({ ...s, busy: false }));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.12),_transparent_24%),linear-gradient(180deg,#ffffff,#f8fafc)] p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Nutrition Command Center
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">高端饮食热量记录工作台</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              采用 Gemini 备用方案完成食物热量估算，再把结果快速回填到系统中。你可以在同一工作区完成照片管理、结构化录入、运动记录与当日汇总校验。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                'Gemini 手动识别回填',
                '实时热量缺口',
                '结构化营养分析',
                '响应式专业界面',
              ].map((item) => (
                <span key={item} className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">记录日期</div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {status.error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{status.error}</div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <div className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">录入中心</div>
                <div className="mt-1 text-xs text-slate-500">在这里切换食物识别、Gemini 手动回填与运动记录三种核心工作流。</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={tab === 'food'
                    ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm'
                    : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50'}
                  onClick={() => setTab('food')}
                >
                  拍照识别
                </button>
                <button
                  className={tab === 'manual'
                    ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm'
                    : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50'}
                  onClick={() => setTab('manual')}
                >
                  Gemini 手动录入
                </button>
                <button
                  className={tab === 'workout'
                    ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm'
                    : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50'}
                  onClick={() => setTab('workout')}
                >
                  运动记录
                </button>
              </div>
            </div>

            {tab === 'food' ? (
              <FoodRecognitionPanel selectedDate={selectedDate} onSaved={() => refresh(selectedDate)} disabled={status.busy} />
            ) : null}

            {tab === 'manual' ? (
              <ManualMealPanel selectedDate={selectedDate} onSaved={() => refresh(selectedDate)} disabled={status.busy} />
            ) : null}

            {tab === 'workout' ? (
              <div className="mt-5">
                <WorkoutPanel selectedDate={selectedDate} onSaved={() => refresh(selectedDate)} disabled={status.busy} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-4">
          <DayRecordsPanel
            summary={summary}
            meals={meals}
            activities={activities}
            loading={status.loading}
            busy={status.busy}
            onDeleteMeal={removeMeal}
            onDeleteActivity={removeActivity}
          />
        </div>
      </div>
    </div>
  );
}
