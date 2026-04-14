import React, { useEffect, useMemo, useState } from 'react';
import { resourcesData } from './resources/resourcesData';
import { filterResources, formatDateTime } from './resources/utils';

const tabs = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'nutrition', label: '营养', icon: '🥗' },
  { key: 'vision', label: '识别', icon: '📷' },
  { key: 'fitness', label: '运动', icon: '🏃' },
  { key: 'dev', label: '部署', icon: '⚙️' },
];

function openLink(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [query, setQuery] = useState('');
  const [clock, setClock] = useState(formatDateTime(new Date()));

  const results = useMemo(() => filterResources(query, resourcesData), [query]);
  const section = resourcesData[activeTab] || resourcesData.home;

  useEffect(() => {
    const id = setInterval(() => setClock(formatDateTime(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  function handleEnter(e) {
    if (e.key !== 'Enter') return;
    const q = String(query || '').trim();
    if (!q) return;
    openLink(`https://www.google.com/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">资源中心</div>
          <div className="mt-1 text-sm text-gray-600">按分类浏览，或直接搜索并回车 Google</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-600">{clock.dateText}</div>
            <div className="text-sm font-medium text-gray-900 tabular-nums">{clock.timeText}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-lg">🔎</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="搜索：营养数据库 / 菜品识别 / MET / 部署…"
              className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 sm:w-[420px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openLink('https://www.google.com')}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              打开 Google
            </button>
            <button
              onClick={() => openLink('https://platform.fatsecret.com/platform-api')}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              营养API文档
            </button>
          </div>
        </div>

        {results.length ? (
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="text-xs font-medium text-gray-600">搜索结果</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <button
                  key={`${r.sectionKey}-${r.title}`}
                  onClick={() => openLink(r.url)}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50"
                >
                  <div className="text-lg">{r.icon || '🔗'}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900">{r.title}</div>
                    <div className="truncate text-xs text-gray-600">{r.sectionTitle}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">{section.title}</div>
            <div className="mt-1 text-xs text-gray-600">{section.subtitle || ''}</div>
          </div>
          <div className="hidden text-xs text-gray-500 sm:block">底部 Dock 可切换分类</div>
        </div>

        {activeTab === 'home' ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tabs
              .filter((t) => t.key !== 'home')
              .map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-left hover:bg-gray-100"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.label}</div>
                    <div className="mt-1 text-xs text-gray-600">打开 {resourcesData[t.key]?.title || t.label}</div>
                  </div>
                  <div className="text-xl">{t.icon}</div>
                </button>
              ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(section.items || []).map((it) => (
              <button
                key={it.title}
                onClick={() => openLink(it.url)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-lg">{it.icon || '🔗'}</div>
                      <div className="truncate text-sm font-medium text-gray-900">{it.title}</div>
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs text-gray-600">{it.desc}</div>
                  </div>
                  <div className="text-xs text-gray-400">↗</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-10">
        <div className="mx-auto flex max-w-md items-center justify-between rounded-2xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={
                t.key === activeTab
                  ? 'flex flex-1 flex-col items-center gap-1 rounded-xl bg-blue-50 py-2 text-blue-700'
                  : 'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-gray-600 hover:bg-gray-50'
              }
            >
              <div className="text-base">{t.icon}</div>
              <div className="text-[11px] font-medium">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

