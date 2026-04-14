import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ isAuthenticated, onLogout, user }) => {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold text-gray-900">fit flow</Link>
          {isAuthenticated ? (
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <Link to="/" className="text-gray-700 hover:text-gray-900">今日概览</Link>
              <Link to="/log" className="text-gray-700 hover:text-gray-900">记录</Link>
              <Link to="/reports" className="text-gray-700 hover:text-gray-900">报表</Link>
              <Link to="/resources" className="text-gray-700 hover:text-gray-900">资源</Link>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden text-xs text-gray-600 sm:block">{user?.email || ''}</div>
              <button onClick={onLogout} className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">退出</button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">登录</Link>
              <Link to="/register" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">注册</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
