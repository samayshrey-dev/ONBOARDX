import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import GridScan from '../components/GridScan';

const MainLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="min-vh-100 d-flex flex-column position-relative">
      <GridScan />
      <Navbar onToggleMobile={toggleMobileSidebar} />
      <div className="d-flex flex-grow-1 position-relative" style={{ zIndex: 1 }}>



        <Sidebar isOpen={isMobileOpen} onClose={closeMobileSidebar} />
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto">
          <div className="container-fluid max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};


export default MainLayout;
