import React from 'react';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="p-8 bg-white shadow-md rounded-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to your Dashboard!</h1>
        <p className="text-gray-600">This is a protected page. You are logged in.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
