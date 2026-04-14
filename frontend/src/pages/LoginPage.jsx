import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginGuest, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during login.');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Spline-inspired glowing background blobs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/30 blur-[120px] mix-blend-screen will-change-transform transform-gpu animate-[blob_8s_infinite_alternate]" />
      <div className="pointer-events-none absolute top-3/4 right-1/4 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[100px] mix-blend-screen will-change-transform transform-gpu animate-[blob_12s_infinite_alternate_reverse]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[150px] mix-blend-screen will-change-transform transform-gpu animate-[blob_10s_infinite_alternate]" />

      {/* Grid overlay for tech/modern feel */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Navbar simulation */}
      <div className="relative z-10 flex w-full items-center justify-between px-8 py-6 sm:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">H</div>
          <span className="text-xl font-bold tracking-wide">fit flow</span>
        </div>
        <Link to="/register" className="text-sm font-medium text-gray-300 transition-colors hover:text-white">
          注册账号
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col items-center justify-center px-6 py-16 lg:flex-row lg:items-start lg:justify-between lg:gap-16">

        {/* Left side: Hero Text */}
        <div className="flex flex-1 flex-col items-center justify-center text-center lg:items-start lg:text-left lg:mt-10">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-300 backdrop-blur-md">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            全新智能热量管理
          </div>
          <h1 className="mt-8 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            拍照记饮食<br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">实时算缺口</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
            集智能图像识别与精准 MET 消耗估算于一体。<br className="hidden sm:block" />
            让“摄入 - 消耗 = 净摄入”的管理变得前所未有的简单。
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <button
              type="button"
              onClick={async () => {
                setError('');
                try { await loginGuest(); } catch (e) { setError(e?.message || '试用失败'); }
              }}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 py-3.5 text-base font-medium text-white transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
              disabled={loading}
            >
              <span>一键体验</span>
              <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            <a href="#login-form" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 lg:hidden">
              登录
            </a>
          </div>
        </div>

        {/* Right side: Login Form Card */}
        <div id="login-form" className="mt-16 w-full max-w-md lg:mt-0 lg:w-[420px] shrink-0">
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04]">

            {/* Top glowing edge effect */}
            <div className="absolute -top-[1px] left-1/2 h-[1px] w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <h2 className="text-2xl font-bold text-white">登录账户</h2>
            <p className="mt-2 text-sm text-gray-400">输入您的邮箱与密码进入系统</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-md">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="email-address" className="text-xs font-medium text-gray-400 pl-1">
                  邮箱
                </label>
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

              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-medium text-gray-400 pl-1">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-gray-500 transition-all focus:border-blue-500 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition-all duration-300 hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </button>

              <div className="mt-6 text-center text-sm text-gray-500">
                还没有账户？
                <Link to="/register" className="ml-1 font-medium text-white transition-colors hover:text-blue-400 hover:underline underline-offset-4">
                  立即注册
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
