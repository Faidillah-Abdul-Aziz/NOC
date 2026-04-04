import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TicketEntry from './pages/TicketEntry'; 
import Dashboard from './pages/Dashboard'; 
import UpdateTicket from './pages/UpdateTicket'; 
import ActivationEntry from './pages/ActivationEntry'; // <-- IMPORT INI

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
            <Link to="/update" className="nav-item">⚙️ Update Ticket</Link>
            <Link to="/activation" className="nav-item">🚀 Input Activation</Link> {/* <-- MENU BARU */}
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<TicketEntry />} />
            <Route path="/analytics" element={<Dashboard />} /> 
            <Route path="/update" element={<UpdateTicket />} />
            <Route path="/activation" element={<ActivationEntry />} /> {/* <-- ROUTE BARU */}
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;