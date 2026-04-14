import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SimpleLineChart from '../components/SimpleLineChart';
import { downloadReportsCsv, getReports } from '../services/apiClient';
import { isoDate } from './log/utils';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

export default function ReportsPage() {
  const [params] = useSearchParams();
  const [fromDate, setFromDate] = useState(params.get('from') || daysAgo(6));
  const [toDate, setToDate] = useState(params.get('to') || isoDate(new Date()));
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '', busy: false });

  const summary = useMemo(() => {
    const rows = data || [];
    const totalIntake = rows.reduce((s, r) => s + Number(r.intake_kcal || 0), 0);
    const totalBurn = rows.reduce((s, r) => s + Number(r.total_burn_kcal || 0), 0);
    const avgDeficit = rows.length ? rows.reduce((s, r) => s + Number(r.deficit_kcal || 0), 0) / rows.length : 0;
    const goodDays = rows.filter((r) => Number(r.deficit_kcal || 0) >= Number(r.target_deficit_kcal || 500)).length;
    const badDays = rows.length - goodDays;
    return {
      totalIntake,
      totalBurn,
      avgDeficit,
      goodDays,
      badDays,
    };
  }, [data]);

  const load = useCallback(async () => {
    setStatus((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await getReports(fromDate, toDate);
      setData(res.series || []);
      setStatus((s) => ({ ...s, loading: false }));
    } catch (e) {
      setStatus((s) => ({ ...s, loading: false, error: e?.message || '加载失败' }));
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  async function exportCsv() {
    setStatus((s) => ({ ...s, busy: true, error: '' }));
    try {
      const res = await downloadReportsCsv(fromDate, toDate);
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calorie-report_${fromDate}_${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus((s) => ({ ...s, busy: false }));
    } catch (e) {
      setStatus((s) => ({ ...s, busy: false, error: e?.message || '导出失败' }));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(168,85,247,0.12),_transparent_24%),linear-gradient(180deg,#ffffff,#f8fafc)] p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Reports Studio
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">热量缺口报表与趋势洞察</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              通过高可读性的图表与汇总模块查看一段时间内的摄入、总消耗和目标达成情况，并可一键导出 CSV 做进一步分析。
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={() => {
                setFromDate(daysAgo(6));
                setToDate(isoDate(new Date()));
              }}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              最近7天
            </button>
            <button
              onClick={() => {
                setFromDate(daysAgo(29));
                setToDate(isoDate(new Date()));
              }}
              className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              最近30天
            </button>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
              <div className="text-sm text-slate-500">至</div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>
            <button
              onClick={exportCsv}
              disabled={status.busy}
              className="h-11 rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              导出 CSV
            </button>
          </div>
        </div>
      </div>

      {status.error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{status.error}</div>
      ) : null}

      <div className="mt-6">
        <SimpleLineChart data={data} valueKey="deficit_kcal" label="热量缺口(kcal)" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">总摄入</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{status.loading ? '--' : Math.round(summary.totalIntake)}</div>
          <div className="mt-2 text-xs text-slate-500">kcal</div>
        </div>
        <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">总消耗</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{status.loading ? '--' : Math.round(summary.totalBurn)}</div>
          <div className="mt-2 text-xs text-slate-500">kcal</div>
        </div>
        <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">平均缺口</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{status.loading ? '--' : Math.round(summary.avgDeficit)}</div>
          <div className="mt-2 text-xs text-slate-500">kcal / 天</div>
        </div>
        <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">达标 / 未达标</div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{status.loading ? '--' : `${summary.goodDays}/${summary.badDays}`}</div>
          <div className="mt-2 text-xs text-slate-500">天</div>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
        <div>
          <div className="text-sm font-semibold text-slate-900">明细</div>
          <div className="mt-1 text-xs text-slate-500">按天查看摄入、BMR、总消耗和缺口的完整数据，适合进一步导出或复盘。</div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 pr-3">日期</th>
                <th className="py-2 pr-3">摄入</th>
                <th className="py-2 pr-3">运动消耗</th>
                <th className="py-2 pr-3">BMR</th>
                <th className="py-2 pr-3">总消耗</th>
                <th className="py-2 pr-3">净值</th>
                <th className="py-2 pr-3">缺口</th>
                <th className="py-2 pr-3">目标缺口</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((r) => (
                <tr key={r.date} className="border-b border-slate-100">
                  <td className="py-3 pr-3 font-medium text-slate-900">{r.date}</td>
                  <td className="py-2 pr-3">{Math.round(r.intake_kcal)}</td>
                  <td className="py-2 pr-3">{Math.round(r.activity_burn_kcal)}</td>
                  <td className="py-2 pr-3">{Math.round(r.bmr_kcal)}</td>
                  <td className="py-2 pr-3">{Math.round(r.total_burn_kcal)}</td>
                  <td className="py-2 pr-3">{Math.round(r.net_kcal)}</td>
                  <td className="py-2 pr-3 font-semibold text-slate-900">{Math.round(r.deficit_kcal)}</td>
                  <td className="py-2 pr-3">{r.target_deficit_kcal}</td>
                </tr>
              ))}
              {data?.length ? null : (
                <tr>
                  <td className="py-6 text-center text-slate-500" colSpan={8}>
                    暂无数据，先去记录页添加第一条记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
