import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function recognizeFood(file) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await api.post('/recognize-food/', formData);
    return res.data;
  } catch (error) {
    const detail = error?.response?.data?.detail;
    if (detail) {
      throw new Error(typeof detail === 'string' ? detail : '识别失败：请求参数不正确');
    }
    throw error;
  }
}

export async function getSummary(summaryDate) {
  const res = await api.get('/me/summary', {
    params: { summary_date: summaryDate },
  });
  return res.data;
}

export async function listMeals(mealDate) {
  const res = await api.get('/me/meals', { params: { meal_date: mealDate } });
  return res.data;
}

export async function createMeal(payload) {
  const res = await api.post('/me/meals', payload);
  return res.data;
}

export async function updateMeal(mealId, patch) {
  const res = await api.put(`/me/meals/${mealId}`, patch);
  return res.data;
}

export async function deleteMeal(mealId) {
  const res = await api.delete(`/me/meals/${mealId}`);
  return res.data;
}

export async function listActivities(activityDate) {
  const res = await api.get('/me/activities', { params: { activity_date: activityDate } });
  return res.data;
}

export async function createActivity(payload) {
  const res = await api.post('/me/activities', payload);
  return res.data;
}

export async function estimateActivity(payload) {
  const res = await api.post('/me/activities/estimate', null, { params: payload });
  return res.data;
}

export async function updateActivity(activityId, patch) {
  const res = await api.put(`/me/activities/${activityId}`, patch);
  return res.data;
}

export async function deleteActivity(activityId) {
  const res = await api.delete(`/me/activities/${activityId}`);
  return res.data;
}

export async function upsertTarget(payload) {
  const res = await api.put('/me/target', payload);
  return res.data;
}

export async function getReports(fromDate, toDate) {
  const res = await api.get('/me/reports', { params: { from_date: fromDate, to_date: toDate } });
  return res.data;
}

export async function downloadReportsCsv(fromDate, toDate) {
  const res = await api.get('/me/reports.csv', {
    params: { from_date: fromDate, to_date: toDate },
    responseType: 'blob',
  });
  return res;
}
