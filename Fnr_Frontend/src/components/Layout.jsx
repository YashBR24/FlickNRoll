import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="h-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10">
      <Navbar />
      <main className="w-full mx-auto py-20">
        <div className="">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;