import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TicketEntry from './pages/TicketEntry'; 
import Dashboard from './pages/Dashboard'; // <-- INI YANG MEMANGGIL GRAFIK ANDA

function App() {
  return (
    <Router>
      <div className="dashboard-container">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="sidebar">
          <h2>Ideanet NOC System</h2>
          <div className="nav-menu">
            <Link to="/" className="nav-item">📝 Entry Ticket</Link>
            <Link to="/analytics" className="nav-item">📊 Dashboard Analytics</Link>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<TicketEntry />} />
            {/* INI MENAMPILKAN DASHBOARD YANG ASLI */}
            <Route path="/analytics" element={<Dashboard />} /> 
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;