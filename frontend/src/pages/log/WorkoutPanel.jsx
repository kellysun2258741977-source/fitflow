import React, { useEffect, useMemo, useState } from 'react';
import { createActivity, estimateActivity } from '../../services/apiClient';

export default function WorkoutPanel({ selectedDate, onSaved, disabled }) {
  const [activityType, setActivityType] = useState('running');
  const [durationMin, setDurationMin] = useState('30');
  const [intensity, setIntensity] = useState('medium');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [estimated, setEstimated] = useState(null);
  const [status, setStatus] = useState({ busy: false, error: '' });

  const durationNum = useMemo(() => Number(durationMin), [durationMin]);

  useEffect(() => {
    let active = true;
    async function run() {
      if (!Number.isFinite(durationNum) || durationNum <= 0) {
        setEstimated(null);
        return;
      }
      try {
        const res = await estimateActivity({ activity_type: activityType, duration_minutes: durationNum, intensity });
        if (!active) return;
        setEstimated(res?.calories_burned ?? null);
        if (!caloriesBurned) {
          setCaloriesBurned(String(Math.round(res?.calories_burned ?? 0)));
        }
      } catch {
        if (!active) return;
        setEstimated(null);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [activityType, caloriesBurned, durationNum, intensity]);

  async function save() {
    const t = (activityType || '').trim();
    const dur = Number(durationMin);
    const cal = Number(caloriesBurned);
    if (!t) {
      setStatus((s) => ({ ...s, error: '请填写运动类型' }));
      return;
    }
    if (!Number.isFinite(dur) || dur <= 0) {
      setStatus((s) => ({ ...s, error: '请填写有效时长' }));
      return;
    }
    if (!Number.isFinite(cal) || cal <= 0) {
      setStatus((s) => ({ ...s, error: '请填写有效消耗热量' }));
      return;
    }
    setStatus({ busy: true, error: '' });
    try {
      await createActivity({
        activity_type: t,
        duration_minutes: dur,
        intensity,
        calories_burned: cal,
        activity_date: selectedDate,
      });
      setCaloriesBurned('');
      onSaved?.();
      setStatus({ busy: false, error: '' });
    } catch (e) {
      setStatus({ busy: false, error: e?.message || '保存失败' });
    }
  }

  return (
    <div className="mt-4">
      {status.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{status.error}</div>
      ) : null}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700">运动类型</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
            disabled={disabled || status.busy}
          >
            <option value="running">跑步</option>
            <option value="walking">走路</option>
            <option value="cycling">骑行</option>
            <option value="swimming">游泳</option>
            <option value="strength">力量训练</option>
            <option value="hiit">HIIT</option>
            <option value="yoga">瑜伽</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">时长(min)</label>
          <input
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
            inputMode="numeric"
            disabled={disabled || status.busy}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">强度</label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
            disabled={disabled || status.busy}
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">消耗热量(kcal)</label>
          <input
            value={caloriesBurned}
            onChange={(e) => setCaloriesBurned(e.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
            inputMode="numeric"
            disabled={disabled || status.busy}
          />
          <div className="mt-1 text-xs text-gray-600">{estimated != null ? `系统估算约 ${Math.round(estimated)} kcal` : '填写时长后自动估算'}</div>
        </div>
        <div className="sm:col-span-2">
          <button
            onClick={save}
            disabled={disabled || status.busy}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            保存运动
          </button>
        </div>
      </div>
    </div>
  );
}
