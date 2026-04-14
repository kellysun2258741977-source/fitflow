export function calcMealCalories(calPer100g, grams) {
  const c = Number(calPer100g || 0);
  const g = Number(grams || 0);
  if (!Number.isFinite(c) || !Number.isFinite(g) || g <= 0) return 0;
  return (c * g) / 100;
}

export function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
