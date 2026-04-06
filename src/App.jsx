import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TicketEntry from './pages/TicketEntry'; 
import Dashboard from './pages/Dashboard'; 
import UpdateTicket from './pages/UpdateTicket'; 
import ActivationEntry from './pages/ActivationEntry';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // 1. STATE DARK MODE (Membaca dari memori browser agar tidak hilang saat di-refresh)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // 2. FUNGSI TOGGLE TEMA (Menyimpan pilihan ke memori browser)
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  // 3. MENGATUR BACKGROUND UTAMA DARI SINI
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.backgroundColor = isDarkMode ? '#0f172a' : '#f1f5f9';
      mainContent.style.transition = 'background-color 0.3s ease';
    }
  }, [isDarkMode]);

  return (
    <Router>
      <style>{`
        .dashboard-container {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }
        .sidebar {
          width: ${isSidebarOpen ? '260px' : '0px'};
          transition: width 0.3s ease;
          overflow: hidden;
          white-space: nowrap;
          background-color: #1e293b; 
          color: white;
          flex-shrink: 0;
        }
        .sidebar-content {
          padding: ${isSidebarOpen ? '20px' : '20px 0'};
          opacity: ${isSidebarOpen ? 1 : 0};
          transition: opacity 0.2s ease;
        }
        .main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          transition: background-color 0.3s ease;
          background-color: #f1f5f9;
          position: relative; 
        }
        .toggle-menu-btn {
          position: absolute; 
          top: 16px;
          left: 20px;
          z-index: 50;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 1.1rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: background 0.2s;
        }
        .toggle-menu-btn:hover {
          background-color: #2563eb;
        }
        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }
        .nav-item {
          color: #cbd5e1;
          text-decoration: none;
          padding: 10px 15px;
          border-radius: 6px;
          transition: 0.2s;
        }
        .nav-item:hover {
          background-color: #334155;
          color: white;
        }
      `}</style>

      <div className="dashboard-container">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="sidebar">
          <div className="sidebar-content">
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem' }}>Ideanet NOC System</h2>
            <div className="nav-menu">
              <Link to="/" className="nav-item">Entry Ticket</Link>
              <Link to="/analytics" className="nav-item">Dashboard</Link>
              <Link to="/update" className="nav-item">Update Ticket</Link>
              <Link to="/activation" className="nav-item">Input Activation</Link>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="main-content">
          <button onClick={toggleSidebar} className="toggle-menu-btn" title="Buka/Tutup Menu">
            {isSidebarOpen ? '◀' : '☰'}
          </button>

          <Routes>
            {/* 4. MENGIRIMKAN STATE & FUNGSI TEMA KE SEMUA HALAMAN */}
            <Route path="/" element={<TicketEntry isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route path="/analytics" element={<Dashboard isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} /> 
            <Route path="/update" element={<UpdateTicket isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route path="/activation" element={<ActivationEntry isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App; 