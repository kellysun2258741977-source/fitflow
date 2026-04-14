import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000');

const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/`, userData);
    return response.data;
  } catch (error) {
    // 提取后端返回的错误信息
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error('An unexpected error occurred during registration.');
    }
  }
};

const loginUser = async (credentials) => {
  try {
    const body = new URLSearchParams();
    body.set('username', credentials.email);
    body.set('password', credentials.password);

    const response = await axios.post(`${API_BASE_URL}/token`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // 登录成功后，将 Token 存储在本地存储中 (例如 localStorage)
    localStorage.setItem('accessToken', response.data.access_token);
    // 可以选择存储用户其他信息
    // localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    // 提取后端返回的错误信息
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
      const first = detail[0];
      if (first?.loc && first?.msg) {
        throw new Error(`${first.loc.join('.')}: ${first.msg}`);
      }
      throw new Error('登录失败：请求参数不正确');
    }
    if (typeof detail === 'string') {
      if (detail.toLowerCase().includes('incorrect')) {
        throw new Error('登录失败：邮箱或密码不正确');
      }
      throw new Error(detail);
    }
    if (error?.response?.status === 401) {
      throw new Error('登录失败：邮箱或密码不正确');
    }
    if (error.response && error.response.status === 422) {
      throw new Error('登录失败：请检查输入的邮箱和密码格式是否正确。');
    }
    throw new Error('登录失败：网络异常或服务不可用');
  }
};

const getCurrentUser = async (accessToken) => {
  const response = await axios.get(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data;
};

export default { registerUser, loginUser, getCurrentUser };
