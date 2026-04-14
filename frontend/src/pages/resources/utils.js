export function flattenResources(data) {
  const entries = [];
  Object.entries(data || {}).forEach(([key, section]) => {
    const items = section?.items || [];
    items.forEach((item) => {
      entries.push({
        sectionKey: key,
        sectionTitle: section?.title || key,
        icon: item.icon,
        title: item.title,
        desc: item.desc,
        url: item.url,
      });
    });
  });
  return entries;
}

export function filterResources(query, data) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const list = flattenResources(data);
  return list
    .filter((it) => {
      const hay = `${it.sectionTitle} ${it.title} ${it.desc}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 12);
}

export function formatDateTime(now) {
  const d = now instanceof Date ? now : new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[d.getDay()];
  return {
    dateText: `${month}月${day}日 ${weekday}`,
    timeText: `${hours}:${minutes}:${seconds}`,
  };
}

