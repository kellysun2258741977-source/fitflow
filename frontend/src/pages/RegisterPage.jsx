import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevelFactor, setActivityLevelFactor] = useState('1.2');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { register } = useAuth();

  const activityLevels = [
    { value: '1.2', label: '久坐（几乎不运动）' },
    { value: '1.375', label: '轻度（每周 1-3 次）' },
    { value: '1.55', label: '中度（每周 3-5 次）' },
    { value: '1.725', label: '高强度（每周 6-7 次）' },
    { value: '1.9', label: '非常高（体力劳动/双倍训练）' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await register({
        email,
        password,
        height: parseFloat(height),
        weight: parseFloat(weight),
        age: parseInt(age, 10),
        gender,
        activity_level_factor: parseFloat(activityLevelFactor),
      });
      setSuccess('注册成功！正在跳转登录页...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || '注册失败，请稍后再试。');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white selection:bg-blue-500/30 px-4 py-10 sm:px-6 lg:px-8">
      {/* Background blobs */}
      <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/3 rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen will-change-transform transform-gpu animate-[blob_8s_infinite_alternate]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[500px] w-[500px] translate-y-1/3 -translate-x-1/4 rounded-full bg-purple-600/10 blur-[150px] mix-blend-screen will-change-transform transform-gpu animate-[blob_10s_infinite_alternate_reverse]" />

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)]" />

      {/* Navbar simulation */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between">
        <Link to="/login" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">H</div>
          <span className="text-xl font-bold tracking-wide">fit flow</span>
        </Link>
        <Link to="/login" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">
          返回登录
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-center justify-center px-6 py-14">
        <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-white/20 hover:bg-white/[0.03] sm:p-10">
          <div className="absolute -top-[1px] left-1/2 h-[1px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <h2 className="text-2xl font-bold text-white">创建账户</h2>
          <p className="mt-2 text-sm text-gray-400">完善身体数据以精准计算 BMR 与 TDEE</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-md">{error}</div>}
            {success && <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 backdrop-blur-md">{success}</div>}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="email-address" className="text-xs font-medium text-gray-400 pl-1">邮箱</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="password" className="text-xs font-medium text-gray-400 pl-1">密码</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="设置密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="height" className="text-xs font-medium text-gray-400 pl-1">身高 (cm)</label>
                <input
                  id="height"
                  name="height"
                  type="number"
                  step="0.1"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例如 170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="weight" className="text-xs font-medium text-gray-400 pl-1">体重 (kg)</label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例如 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="age" className="text-xs font-medium text-gray-400 pl-1">年龄</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="例如 25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="gender" className="text-xs font-medium text-gray-400 pl-1">性别</label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="activity-level-factor" className="text-xs font-medium text-gray-400 pl-1">活动水平</label>
                <select
                  id="activity-level-factor"
                  name="activity-level-factor"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={activityLevelFactor}
                  onChange={(e) => setActivityLevelFactor(e.target.value)}
                >
                  {activityLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition-all duration-300 hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
            >
              注册账号
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
