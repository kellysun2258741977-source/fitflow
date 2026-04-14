import React, { useMemo, useRef, useState } from 'react';
import { recognizeFood, createMeal } from '../../services/apiClient';
import { calcMealCalories } from './utils';

export default function FoodRecognitionPanel({ selectedDate, onSaved, disabled }) {
  const fileInputRef = useRef(null);
  const [foodFile, setFoodFile] = useState(null);
  const [foodResult, setFoodResult] = useState(null);
  const [foodChoiceIndex, setFoodChoiceIndex] = useState(0);
  const [foodGrams, setFoodGrams] = useState('100');
  const [foodNameOverride, setFoodNameOverride] = useState('');
  const [foodCaloriesOverride, setFoodCaloriesOverride] = useState('');
  const [status, setStatus] = useState({ busy: false, error: '' });

  const chosenCandidate = useMemo(() => {
    const list = foodResult?.candidates || [];
    return list[foodChoiceIndex] || list[0] || null;
  }, [foodChoiceIndex, foodResult]);

  const computedCalories = useMemo(() => {
    if (!chosenCandidate) return 0;
    return calcMealCalories(chosenCandidate.calories_per_100g, foodGrams);
  }, [chosenCandidate, foodGrams]);

  async function preprocessImage(file) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      const maxSide = 1024;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (!w || !h) return file;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const tw = Math.max(1, Math.round(w * scale));
      const th = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, tw, th);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function runRecognition() {
    if (!foodFile) return;
    setStatus({ busy: true, error: '' });
    try {
      const prepared = await preprocessImage(foodFile);
      const res = await recognizeFood(prepared);
      setFoodResult(res);
      setFoodChoiceIndex(0);
      setFoodGrams('100');
      setFoodNameOverride('');
      setFoodCaloriesOverride('');
    } catch (e) {
      setStatus({ busy: false, error: e?.message || '识别失败' });
      return;
    }
    setStatus({ busy: false, error: '' });
  }

  async function saveRecognizedMeal() {
    const name = (foodNameOverride || chosenCandidate?.name || '').trim();
    const calories = foodCaloriesOverride ? Number(foodCaloriesOverride) : computedCalories;
    if (!name) {
      setStatus((s) => ({ ...s, error: '请填写食物名称' }));
      return;
    }
    if (!Number.isFinite(calories) || calories <= 0) {
      setStatus((s) => ({ ...s, error: '请填写有效热量' }));
      return;
    }
    setStatus((s) => ({ ...s, busy: true, error: '' }));
    try {
      await createMeal({
        name,
        calories,
        proteins: 0,
        carbohydrates: 0,
        fats: 0,
        image_url: foodResult?.image_url || null,
        activity_date: selectedDate,
      });
      onSaved?.();
    } catch (e) {
      setStatus((s) => ({ ...s, error: e?.message || '保存失败' }));
    } finally {
      setStatus((s) => ({ ...s, busy: false }));
    }
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
      {status.error ? (
        <div className="md:col-span-12 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{status.error}</div>
      ) : null}

      <div className="md:col-span-5">
        <label className="block text-xs font-medium text-gray-700">上传食物照片</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setFoodFile(e.target.files?.[0] || null)}
          className="hidden"
          disabled={disabled || status.busy}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || status.busy}
            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            选择图片
          </button>
          <div className="min-w-0 text-xs text-gray-500">
            {foodFile ? (
              <span className="truncate">{foodFile.name}</span>
            ) : (
              <span>未选择文件</span>
            )}
          </div>
        </div>
        <button
          onClick={runRecognition}
          disabled={!foodFile || disabled || status.busy}
          className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          开始识别
        </button>
        {foodResult?.image_url ? (
          <img src={foodResult.image_url} alt="food" className="mt-3 w-full rounded-lg border border-gray-200" />
        ) : null}
      </div>

      <div className="md:col-span-7">
        <div className="text-sm font-medium text-gray-900">识别结果与校正</div>
        <div className="mt-2 text-xs text-gray-600">百度识别输出为每 100g 热量，建议先填份量再保存</div>

        <div className="mt-3 space-y-2">
          {(foodResult?.candidates || []).map((c, idx) => (
            <button
              key={`${c.name}-${idx}`}
              onClick={() => setFoodChoiceIndex(idx)}
              disabled={disabled || status.busy}
              className={
                idx === foodChoiceIndex
                  ? 'flex w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left'
                  : 'flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50'
              }
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-600">{Math.round(c.calories_per_100g)} kcal / 100g</div>
              </div>
              <div className="text-xs text-gray-600">{c.confidence != null ? `${Math.round(c.confidence * 100)}%` : ''}</div>
            </button>
          ))}
          {foodResult?.candidates?.length ? null : <div className="text-sm text-gray-500">暂无候选项</div>}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700">食物名称（可改）</label>
            <input
              value={foodNameOverride}
              onChange={(e) => setFoodNameOverride(e.target.value)}
              placeholder={chosenCandidate?.name || ''}
              className="mt-2 h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
              disabled={disabled || status.busy}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">份量(g)</label>
            <input
              value={foodGrams}
              onChange={(e) => setFoodGrams(e.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
              inputMode="numeric"
              disabled={disabled || status.busy}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700">热量(kcal)（默认按 100g 换算，可手动改）</label>
            <div className="mt-2 flex gap-2">
              <input
                value={foodCaloriesOverride}
                onChange={(e) => setFoodCaloriesOverride(e.target.value)}
                placeholder={String(Math.round(computedCalories))}
                className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
                inputMode="numeric"
                disabled={disabled || status.busy}
              />
              <button
                onClick={saveRecognizedMeal}
                disabled={disabled || status.busy || !chosenCandidate}
                className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                保存饮食
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
