import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createMeal } from '../../services/apiClient';
import { parseGeminiNutrition } from './manualParser';

export default function ManualMealPanel({ selectedDate, onSaved, disabled }) {
  const fileRef = useRef(null);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbohydrates, setCarbohydrates] = useState('');
  const [fats, setFats] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [status, setStatus] = useState({ busy: false, error: '' });

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const macroSummary = useMemo(() => {
    const p = Number(proteins) || 0;
    const c = Number(carbohydrates) || 0;
    const f = Number(fats) || 0;
    const total = p + c + f;
    if (!total) return [];
    return [
      { label: '蛋白质', value: p, ratio: Math.round((p / total) * 100), tone: 'from-cyan-500 to-blue-500' },
      { label: '碳水', value: c, ratio: Math.round((c / total) * 100), tone: 'from-violet-500 to-fuchsia-500' },
      { label: '脂肪', value: f, ratio: Math.round((f / total) * 100), tone: 'from-amber-400 to-orange-500' },
    ];
  }, [proteins, carbohydrates, fats]);

  function handleLocalImage(file) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setPreviewUrl('');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  function applyGeminiResult() {
    const parsed = parseGeminiNutrition(analysisText);
    if (parsed.name && !name.trim()) setName(parsed.name);
    if (parsed.calories != null) setCalories(String(parsed.calories));
    if (parsed.proteins != null) setProteins(String(parsed.proteins));
    if (parsed.carbohydrates != null) setCarbohydrates(String(parsed.carbohydrates));
    if (parsed.fats != null) setFats(String(parsed.fats));

    const foundAny =
      parsed.name ||
      parsed.calories != null ||
      parsed.proteins != null ||
      parsed.carbohydrates != null ||
      parsed.fats != null;

    if (!foundAny) {
      setStatus((s) => ({ ...s, error: '暂未识别出结构化营养字段，请检查 Gemini 返回格式' }));
      return;
    }
    setStatus((s) => ({ ...s, error: '' }));
  }

  async function save() {
    const n = name.trim();
    const c = Number(calories);
    const p = Number(proteins || 0);
    const carb = Number(carbohydrates || 0);
    const fat = Number(fats || 0);
    if (!n) {
      setStatus((s) => ({ ...s, error: '请填写食物名称' }));
      return;
    }
    if (!Number.isFinite(c) || c <= 0) {
      setStatus((s) => ({ ...s, error: '请填写有效热量' }));
      return;
    }
    setStatus({ busy: true, error: '' });
    try {
      await createMeal({
        name: n,
        calories: c,
        proteins: Number.isFinite(p) ? p : 0,
        carbohydrates: Number.isFinite(carb) ? carb : 0,
        fats: Number.isFinite(fat) ? fat : 0,
        image_url: null,
        activity_date: selectedDate,
      });
      setName('');
      setCalories('');
      setProteins('');
      setCarbohydrates('');
      setFats('');
      setAnalysisText('');
      handleLocalImage(null);
      onSaved?.();
      setStatus({ busy: false, error: '' });
    } catch (e) {
      setStatus({ busy: false, error: e?.message || '保存失败' });
    }
  }

  return (
    <div className="mt-5 space-y-5">
      {status.error ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{status.error}</div>
      ) : null}

      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)]">
        <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.12),_transparent_30%),linear-gradient(180deg,#ffffff,#f8fafc)] px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Gemini 备用方案
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">拍照给 Gemini，结果一键回填</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                先用手机或 Gemini 分析食物图片，复制返回的热量与三大营养素，再粘贴到这里自动提取。这个流程更稳定，也便于你做最后校对。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
              <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm">
                <div className="font-medium text-slate-800">01</div>
                <div className="mt-1">拍照给 Gemini</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm">
                <div className="font-medium text-slate-800">02</div>
                <div className="mt-1">粘贴分析文本</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 px-3 py-3 shadow-sm">
                <div className="font-medium text-slate-800">03</div>
                <div className="mt-1">核对后保存</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[0.95fr_1.25fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.7)]">
              <div className="text-sm font-medium text-white/90">照片工作区</div>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                这里不直接做 AI 识别，只提供本地预览，方便你把同一张图发给 Gemini 后再回填营养数据。
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled || status.busy}
                onChange={(e) => handleLocalImage(e.target.files?.[0] || null)}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={disabled || status.busy}
                className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-slate-100 disabled:opacity-50"
              >
                选择参考图片
              </button>

              <div className="mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-white/5">
                {previewUrl ? (
                  <img src={previewUrl} alt="food preview" className="h-72 w-full object-cover" />
                ) : (
                  <div className="flex h-72 flex-col items-center justify-center gap-3 px-6 text-center text-slate-300">
                    <div className="rounded-full border border-white/15 bg-white/5 p-4">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14" />
                        <path d="M6 19h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
                        <circle cx="9" cy="9" r="1.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">上传参考照片</div>
                      <div className="mt-1 text-xs text-slate-400">支持手机拍照、截图或 Gemini 分析过的原图</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">推荐给 Gemini 的提示词</div>
                  <div className="mt-1 text-xs text-slate-500">复制这段提示词，能让 Gemini 返回更适合自动解析的结构。</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const prompt = '请根据这张食物图片返回：食物名称、热量(kcal)、蛋白质(g)、碳水化合物(g)、脂肪(g)。请使用如下格式：\n食物名称：\n热量：\n蛋白质：\n碳水化合物：\n脂肪：';
                    await navigator.clipboard.writeText(prompt);
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  复制提示词
                </button>
              </div>
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-white p-4 text-xs leading-6 text-slate-600 shadow-inner">
                {`请根据这张食物图片返回：食物名称、热量(kcal)、蛋白质(g)、碳水化合物(g)、脂肪(g)。
请使用如下格式：
食物名称：
热量：
蛋白质：
碳水化合物：
脂肪：`}
              </pre>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">粘贴 Gemini 分析文本</div>
                  <div className="mt-1 text-xs text-slate-500">支持中英文格式；系统会自动识别热量与三大营养素。</div>
                </div>
                <button
                  type="button"
                  onClick={applyGeminiResult}
                  disabled={disabled || status.busy}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  自动提取字段
                </button>
              </div>
              <textarea
                value={analysisText}
                onChange={(e) => setAnalysisText(e.target.value)}
                placeholder="把 Gemini 返回的整段分析粘贴到这里，例如：食物名称：苹果 / 热量：95 kcal / 蛋白质：0.5 g ..."
                className="mt-4 min-h-40 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                disabled={disabled || status.busy}
              />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">结构化营养录入</div>
                  <div className="mt-1 text-xs text-slate-500">自动提取后仍建议你目检一次，确保与 Gemini 输出一致。</div>
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Source · Gemini Manual
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">食物名称</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    disabled={disabled || status.busy}
                    placeholder="例如：红富士苹果 / 鸡胸肉饭 / 希腊酸奶碗"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">热量 kcal</label>
                  <input
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    inputMode="decimal"
                    disabled={disabled || status.busy}
                    placeholder="95"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">记录日期</label>
                  <div className="mt-2 flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                    {selectedDate}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">蛋白质 g</label>
                  <input
                    value={proteins}
                    onChange={(e) => setProteins(e.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    inputMode="decimal"
                    disabled={disabled || status.busy}
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">碳水 g</label>
                  <input
                    value={carbohydrates}
                    onChange={(e) => setCarbohydrates(e.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    inputMode="decimal"
                    disabled={disabled || status.busy}
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">脂肪 g</label>
                  <input
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    inputMode="decimal"
                    disabled={disabled || status.busy}
                    placeholder="0.3"
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">营养结构预览</div>
                  <div className="mt-1 text-xs text-slate-500">基于你当前录入的蛋白质 / 碳水 / 脂肪自动计算占比。</div>
                  <div className="mt-4 space-y-3">
                    {macroSummary.length ? macroSummary.map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                          <span>{item.label}</span>
                          <span>{item.value} g · {item.ratio}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div className={`h-full rounded-full bg-gradient-to-r ${item.tone}`} style={{ width: `${item.ratio}%` }} />
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                        填写蛋白质、碳水和脂肪后，这里会自动生成营养结构分析。
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-slate-950 p-4 text-white">
                  <div className="text-sm font-semibold">快速校验</div>
                  <div className="mt-3 space-y-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span>名称已填写</span>
                      <span className={name.trim() ? 'text-emerald-300' : 'text-slate-500'}>{name.trim() ? '已完成' : '待填写'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span>热量已填写</span>
                      <span className={Number(calories) > 0 ? 'text-emerald-300' : 'text-slate-500'}>{Number(calories) > 0 ? '已完成' : '待填写'}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                      <span>营养结构</span>
                      <span className={macroSummary.length ? 'text-emerald-300' : 'text-slate-500'}>{macroSummary.length ? '已生成' : '可选'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs leading-5 text-slate-500">
                  录入结果会保存到今日饮食记录，并参与热量缺口、报表和营养结构统计。
                </div>
                <button
                  onClick={save}
                  disabled={disabled || status.busy}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 text-sm font-medium text-white shadow-[0_20px_50px_-20px_rgba(79,70,229,0.7)] transition hover:scale-[1.01] hover:shadow-[0_22px_60px_-20px_rgba(79,70,229,0.8)] disabled:opacity-50"
                >
                  {status.busy ? '保存中...' : '保存 Gemini 录入结果'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
