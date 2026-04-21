import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const parseDateToYYYYMMDD = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes('/')) {
    const parts = dateString.split(' ')[0].split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  if (dateString.includes('-')) return dateString.split('T')[0].split(' ')[0];
  return "";
};

// PASTIKAN BARIS INI MENERIMA PROPS DARI App.js
const UpdateTicket = ({ isDarkMode, toggleDarkMode }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [tableStartDate, setTableStartDate] = useState(''); 
  const [tableEndDate, setTableEndDate] = useState(''); 
  const [tableSla, setTableSla] = useState('All');
  const [tableCategory, setTableCategory] = useState('All'); 
  const [tableSite, setTableSite] = useState([]); 
  const [tableStatus, setTableStatus] = useState('Active'); 
  const [searchCustomer, setSearchCustomer] = useState(''); 
  const [searchTicket, setSearchTicket] = useState(''); 

  // Action States
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewTicket, setViewTicket] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ 
    resolvedTime: '', finishStopClock: '', rootCause: '', statusTT: '', progressUpdate: '', restorationAction: '' 
  });

  const fetchTickets = async () => {
    try { 
      setLoading(true); 
      const response = await fetch(API_URL); 
      const result = await response.json();
      if (result.status === "success" && result.data) { 
        setData(result.data.filter(item => item["TT No"] && item["TT No"].trim() !== "").reverse()); 
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  // Ubah Background Utama
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.backgroundColor = isDarkMode ? '#0f172a' : '#f1f5f9';
      mainContent.style.transition = 'background-color 0.3s ease';
    }
    return () => { if (mainContent) mainContent.style.backgroundColor = '#f1f5f9'; };
  }, [isDarkMode]);

  const siteOptions = [...new Set(data.map(item => item["Site"]).filter(Boolean))].map(site => ({ value: site, label: site }));

  const filteredData = data.filter(item => {
    if (tableStartDate || tableEndDate) {
      const formattedItemDate = parseDateToYYYYMMDD(item["Start Time"] || item["Timestamp"]);
      if (!formattedItemDate) return false;
      if (tableStartDate && formattedItemDate < tableStartDate) return false;
      if (tableEndDate && formattedItemDate > tableEndDate) return false;
    }
    if (tableSla === 'In SLA' && !(item["SLA Real"] && item["SLA Real"].toLowerCase().includes("in"))) return false;
    if (tableSla === 'Out SLA' && !(item["SLA Real"] && item["SLA Real"].toLowerCase().includes("out"))) return false;
    if (tableSite.length > 0 && !tableSite.some(option => option.value === item["Site"])) return false;
    if (tableCategory !== 'All' && item["Category"] !== tableCategory) return false; 
    
    const isTicketOpen = item["Status TT"] && item["Status TT"].toLowerCase().includes("open");
    if (tableStatus === 'Active' && !isTicketOpen) return false;
    if (tableStatus === 'Closed' && isTicketOpen) return false;

    if (searchCustomer.trim() !== '') {
      const terms = searchCustomer.toLowerCase().split(',').map(t=>t.trim()).filter(Boolean);
      if (terms.length > 0) {
         const customerInfo = (item["ID dan Nama Customer"] || "").toLowerCase();
         if (!terms.some(term => customerInfo.includes(term))) return false;
      }
    }
    
    if (searchTicket.trim() !== '') {
      const ttNo = (item["TT No"] || "").toLowerCase();
      if (!ttNo.includes(searchTicket.toLowerCase())) return false;
    }
    return true;
  });

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setFormData({ 
      resolvedTime: ticket["Resolved Time"] || '', 
      finishStopClock: ticket["Finish Stop Clock"] || '', 
      rootCause: ticket["Root Cause"] || '', 
      statusTT: ticket["Status TT"] || 'Open', 
      progressUpdate: ticket["Progress Update"] || '', 
      restorationAction: ticket["Restoration Action"] || '' 
    });
    setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 100);
  };

  const handleFormChange = (e) => { 
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); 
  };

  const formatDateForState = (dateObj) => {
    if (!dateObj) return "";
    const pad = (n) => n < 10 ? '0' + n : n;
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  };

  const handleDateChange = (name, date) => {
    const formattedDate = formatDateForState(date);
    setFormData(prev => ({ ...prev, [name]: formattedDate }));
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      await fetch(API_URL, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({ action: 'update', ttNo: selectedTicket["TT No"], ...formData }) 
      });
      alert(`Tiket ${selectedTicket["TT No"]} berhasil diupdate!`);
      setSelectedTicket(null); 
      fetchTickets(); 
    } catch (error) { 
      alert("Gagal mengupdate."); console.error(error); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const renderDetailWaktu = (row) => {
    if ((row["Start Stop Clock"] || "-") === "-" && (row["Finish Stop Clock"] || "-") === "-") return "-";
    return (
      <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
        <span style={{ color: '#10b981', fontWeight: 'bold' }}>Start:</span> {row["Start Stop Clock"]}<br/>
        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Finish:</span> {row["Finish Stop Clock"]}
      </div>
    );
  };

  return (
    <div className={`dash-wrapper ${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

        .dash-wrapper { 
          --bg-main: transparent; 
          --bg-card: #ffffff; --bg-section: #f8fafc; --text-main: #0f172a; --text-muted: #64748b; 
          --border: #e2e8f0; --input-bg: #ffffff; --table-hover: #f8fafc; --accent: #3b82f6; --accent-hover: #2563eb;
          --success: #10b981; --warning: #f59e0b; --danger: #ef4444;
          --gap: 24px; --card-padding: 24px; --border-radius: 12px;
          padding: 16px var(--gap) var(--gap) var(--gap); 
          color: var(--text-main); font-family: 'Inter', sans-serif; 
          min-height: 100vh; transition: color 0.3s; width: 100%; box-sizing: border-box;
        }
        .dash-wrapper.dark { 
          --bg-card: #1e293b; --bg-section: #0f172a; --text-main: #f8fafc; --text-muted: #94a3b8; 
          --border: #334155; --input-bg: #0f172a; --table-hover: #334155; --accent: #60a5fa;
        }

        .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-left: 45px; min-height: 40px; flex-wrap: wrap; gap: 16px; }
        .header-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
        .dash-header-controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; }

        .middle-card { background: var(--bg-card); padding: var(--card-padding); border-radius: var(--border-radius); border: 1px solid var(--border); display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: var(--gap); }
        
        .filter-bar { display: flex; gap: 12px; flex-wrap: wrap; width: 100%; margin-bottom: 16px; align-items: center; }
        .filter-input { height: 38px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem; flex: 1 1 150px; min-width: 120px; background: var(--input-bg); color: var(--text-main); box-sizing: border-box; outline: none; }
        .filter-input[type="date"]::-webkit-calendar-picker-indicator { filter: ${isDarkMode ? 'invert(1)' : 'none'}; cursor: pointer; }
        .filter-select-container { flex: 1 1 200px; min-width: 150px; }
        
        .btn-primary { height: 38px; padding: 0 16px; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-sizing: border-box; transition: 0.2s; font-size: 0.9rem; }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-secondary { height: 38px; padding: 0 16px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; box-sizing: border-box; transition: 0.2s; font-size: 0.9rem; }
        .btn-secondary:hover { background: var(--table-hover); }
        .btn-action-view { padding: 6px 14px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.75rem; transition: 0.2s; }
        .btn-action-view:hover { background: var(--table-hover); }
        .btn-action-update { padding: 6px 14px; background: var(--accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.75rem; transition: 0.2s; }
        .btn-action-update:hover { background: var(--accent-hover); }

        .table-container { overflow-x: auto; overflow-y: auto; max-height: 400px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; min-width: 1000px; }
        thead th { position: sticky; top: 0; background-color: var(--input-bg); color: var(--text-muted); padding: 14px 16px; border-bottom: 2px solid var(--border); font-weight: 600; z-index: 1; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
        tbody tr:hover { background-color: var(--table-hover); }
        tbody td { padding: 12px 16px; color: var(--text-main); }
        
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; white-space: nowrap; }
        .status-open { background: rgba(245, 158, 11, 0.15); color: #d97706; }
        .status-closed { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        /* FORM UPDATE STYLES */
        .update-form-container { background: var(--bg-card); border-radius: var(--border-radius); padding: 32px; border: 1px solid var(--accent); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 5px solid var(--accent); margin-bottom: var(--gap); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .update-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .update-section { background: var(--bg-section); padding: 20px; border-radius: 12px; border: 1px solid var(--border); }
        .update-section-title { margin: 0 0 16px 0; border-bottom: 2px solid var(--border); padding-bottom: 8px; font-size: 1.1rem; color: var(--text-main); }
        .update-input-group { margin-bottom: 16px; }
        .update-input-group:last-child { margin-bottom: 0; }
        .update-label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.85rem; color: var(--text-muted); }
        .update-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-main); font-size: 0.9rem; box-sizing: border-box; transition: 0.2s; font-family: inherit; }
        .update-input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        textarea.update-input { min-height: 80px; resize: vertical; }

        /* REACT DATEPICKER CUSTOMIZATION */
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input { width: 100%; }
        .dash-wrapper.dark .react-datepicker { background-color: var(--bg-card); border-color: var(--border); color: var(--text-main); font-family: 'Inter', sans-serif; }
        .dash-wrapper.dark .react-datepicker__header { background-color: var(--bg-section); border-bottom-color: var(--border); }
        .dash-wrapper.dark .react-datepicker__current-month, .dash-wrapper.dark .react-datepicker-time__header, .dash-wrapper.dark .react-datepicker__day-name { color: var(--text-main); }
        .dash-wrapper.dark .react-datepicker__day { color: var(--text-main); }
        .dash-wrapper.dark .react-datepicker__day:hover { background-color: var(--border); }
        .dash-wrapper.dark .react-datepicker__time-container { border-left-color: var(--border); }
        .dash-wrapper.dark .react-datepicker__time { background-color: var(--bg-card); color: var(--text-main); }
        .dash-wrapper.dark .react-datepicker__time-list-item:hover { background-color: var(--border) !important; }
        .dash-wrapper.dark .react-datepicker__day--selected { background-color: var(--accent); color: white; }

        @media (max-width: 768px) {
          .dash-header { padding-left: 0; flex-direction: column; align-items: stretch; margin-top: 40px; }
          .dash-header-controls { justify-content: flex-start; }
          .filter-bar { flex-direction: column; align-items: stretch; }
          .filter-input, .filter-select-container { width: 100%; flex: 1 1 100%; }
          .update-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HEADER */}
      <div className="dash-header">
        <div>
          <h2 className="header-title">Update Trouble Ticket</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Resolusi dan pembaruan progres tiket NOC.</p>
        </div>
        <div className="dash-header-controls">
          <button className="btn-secondary" onClick={fetchTickets} disabled={loading}>🔄 Refresh</button>
          <button className="btn-secondary" onClick={toggleDarkMode}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* DAFTAR TIKET */}
      <div className="middle-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Daftar Tiket</h3>
            <span style={{ fontSize: '0.8rem', background: 'var(--table-hover)', padding: '6px 12px', borderRadius: '20px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Showing {filteredData.length} entries</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--table-hover)', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--border)', height: '38px', boxSizing: 'border-box' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', paddingLeft: '8px' }}>Filter:</span>
              <input type="date" value={tableStartDate} onChange={e=>setTableStartDate(e.target.value)} style={{ padding: '0 8px', height: '28px', border: 'none', borderRadius: '4px', fontSize: '0.8rem', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>-</span>
              <input type="date" value={tableEndDate} onChange={e=>setTableEndDate(e.target.value)} style={{ padding: '0 8px', height: '28px', border: 'none', borderRadius: '4px', fontSize: '0.8rem', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }} />
              {(tableStartDate || tableEndDate) && <button onClick={() => { setTableStartDate(''); setTableEndDate(''); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 'bold', cursor: 'pointer', padding: '0 8px', fontSize: '1rem' }}>✕</button>}
            </div>
          </div>
        </div>

        <div className="filter-bar">
          <input type="text" placeholder="Cari TT No..." value={searchTicket} onChange={(e) => setSearchTicket(e.target.value)} className="filter-input" />
          <input type="text" placeholder="Cari Customer (koma)..." value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)} className="filter-input" />
          <select value={tableSla} onChange={e => setTableSla(e.target.value)} className="filter-input"><option value="All">All SLA</option><option value="In SLA">In SLA</option><option value="Out SLA">Out SLA</option></select>
          <select value={tableCategory} onChange={e => setTableCategory(e.target.value)} className="filter-input"><option value="All">All Category</option><option value="Retail">Retail</option><option value="Enterprise">Enterprise</option></select>
          <div className="filter-select-container">
            <Select 
              isMulti options={siteOptions} value={tableSite} onChange={setTableSite} placeholder="Sites..." 
              styles={{ 
                control: (b) => ({...b, minHeight:'38px', height:'38px', borderRadius:'6px', borderColor: isDarkMode ? '#334155' : '#e2e8f0', backgroundColor: isDarkMode ? '#0f172a' : '#fff'}),
                menu: (b) => ({...b, backgroundColor: isDarkMode ? '#1e293b' : '#fff', zIndex: 10}),
                option: (b, { isFocused }) => ({...b, backgroundColor: isFocused ? (isDarkMode ? '#334155' : '#f1f5f9') : 'transparent', color: isDarkMode ? '#f8fafc' : '#1f2937'}),
                multiValue: (b) => ({...b, backgroundColor: isDarkMode ? '#334155' : '#e2e8f0'}),
                multiValueLabel: (b) => ({...b, color: isDarkMode ? '#f8fafc' : '#1f2937'})
              }} 
              menuPortalTarget={document.body} 
            />
          </div>
          <select value={tableStatus} onChange={e => setTableStatus(e.target.value)} className="filter-input" style={{fontWeight:'bold'}}><option value="Active">Hanya OPEN</option><option value="Closed">Hanya CLOSED</option><option value="All">SEMUA STATUS</option></select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>{['TT No', 'Customer', 'Category', 'Detail Waktu', 'Status', 'Deskripsi Awal', 'Progress Update', 'NOC', 'Action'].map(h => (<th key={h}>{h}</th>))}</tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => {
                const isOpen = row["Status TT"]?.toLowerCase().includes("open");
                const isSelected = selectedTicket && selectedTicket["TT No"] === row["TT No"];
                return (
                  <tr key={idx} style={{ backgroundColor: isSelected ? (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff') : 'transparent' }}>
                    <td style={{ fontWeight: 'bold' }}>{row["TT No"]}</td>
                    <td>{row["ID dan Nama Customer"]}</td>
                    <td>{row["Category"]}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{renderDetailWaktu(row)}</td>
                    <td><span className={`status-badge ${isOpen ? 'status-open' : 'status-closed'}`}>{row["Status TT"]}</span></td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{row["Deskripsi Awal"] || row["Deskripsi"]}</td>
                    <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{row["Progress Update"]}</td>
                    <td style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{row["NOC"] || "-"}</td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setViewTicket(row)} className="btn-action-view">Lihat</button>
                      <button onClick={() => handleSelectTicket(row)} className="btn-action-update">Update</button>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (<tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data tiket sesuai filter.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM UPDATE */}
      {selectedTicket && (
        <div className="update-form-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>Update: <span style={{ color: 'var(--accent)' }}>{selectedTicket["TT No"]}</span></h3>
            <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', padding: '8px 16px', borderRadius: '6px', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor=isDarkMode?'rgba(239, 68, 68, 0.2)':'rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.backgroundColor='transparent'}>✕ Batal Update</button>
          </div>
          
          <form onSubmit={handleSubmitUpdate}>
            <div className="update-grid">
              
              {/* KOLOM KIRI: WAKTU */}
              <div className="update-section">
                <h4 className="update-section-title">Manajemen Waktu</h4>
                <div className="update-input-group">
                  <label className="update-label">Resolved Time</label>
                  <DatePicker
                    selected={formData.resolvedTime ? new Date(formData.resolvedTime) : null}
                    onChange={(date) => handleDateChange("resolvedTime", date)}
                    showTimeSelect timeFormat="HH:mm" timeIntervals={1} timeCaption="Jam" dateFormat="yyyy-MM-dd HH:mm"
                    className="update-input" placeholderText="Pilih Tanggal & Jam" isClearable
                  />
                </div>
                <div className="update-input-group">
                  <label className="update-label">Finish Stop Clock (Resume)</label>
                  <DatePicker
                    selected={formData.finishStopClock ? new Date(formData.finishStopClock) : null}
                    onChange={(date) => handleDateChange("finishStopClock", date)}
                    showTimeSelect timeFormat="HH:mm" timeIntervals={1} timeCaption="Jam" dateFormat="yyyy-MM-dd HH:mm"
                    className="update-input" placeholderText="Pilih Tanggal & Jam" isClearable
                  />
                </div>
              </div>

              {/* KOLOM KANAN: PENANGANAN */}
              <div className="update-section">
                <h4 className="update-section-title">Detail Penanganan</h4>
                <div className="update-input-group">
                  <label className="update-label">Status TT</label>
                  <select className="update-input" name="statusTT" value={formData.statusTT} onChange={handleFormChange} style={{ fontWeight: 'bold', color: formData.statusTT === 'Open' ? 'var(--warning)' : 'var(--success)' }}>
                    <option value="Open">OPEN</option><option value="Pending">PENDING</option><option value="Closed">CLOSED</option>
                  </select>
                </div>
                <div className="update-input-group">
                  <label className="update-label">Root Cause (RCA)</label>
                  <input type="text" className="update-input" name="rootCause" value={formData.rootCause} onChange={handleFormChange} placeholder="Ketikan penyebab masalah..." />
                </div>
                <div className="update-input-group">
                  <label className="update-label">Progress Update</label>
                  <textarea className="update-input" name="progressUpdate" value={formData.progressUpdate} onChange={handleFormChange} placeholder="Tulis update progres pekerjaan saat ini..."></textarea>
                </div>
                <div className="update-input-group">
                  <label className="update-label">Restoration Action</label>
                  <textarea className="update-input" name="restorationAction" value={formData.restorationAction} onChange={handleFormChange} placeholder="Tindakan pemulihan yang dilakukan..."></textarea>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', padding: '16px', marginTop: '24px', fontSize: '1.1rem', justifyContent: 'center' }}>
              {isSubmitting ? 'MENGIRIM DATA...' : 'SIMPAN UPDATE TIKET'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL POP-UP DETAILS */}
      {viewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', boxSizing: 'border-box', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '1200px', height: '85vh', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-main)', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>Detail Tiket: <span style={{ color: 'var(--accent)' }}>{viewTicket["TT No"]}</span></h2>
              <button onClick={() => setViewTicket(null)} style={{ background: 'none', border: 'none', fontSize: '2rem', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1, transition: '0.2s' }}>&times;</button>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '0 0 16px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {Object.entries(viewTicket).map(([key, value]) => {
                  if (!key || key.trim() === '') return null; 
                  return (
                    <div key={key} style={{ backgroundColor: 'var(--bg-main)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{key}</span>
                      <span style={{ fontSize: '1rem', color: 'var(--text-main)', wordBreak: 'break-word', fontWeight: '500', lineHeight: '1.5' }}>{value || '-'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateTicket;