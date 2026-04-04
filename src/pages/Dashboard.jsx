import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Select from 'react-select'; 

const getCurrentWeekStr = () => {
  const today = new Date();
  const dateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  dateObj.setDate(dateObj.getDate() + 4 - (dateObj.getDay() || 7));
  const yearStart = new Date(dateObj.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((dateObj - yearStart) / 86400000) + 1) / 7);
  return `W${weekNo}`; 
};

const parseDateToYYYYMMDD = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes('/')) {
    const datePart = dateString.split(' ')[0]; 
    const parts = datePart.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`; 
    }
  }
  if (dateString.includes('-')) {
    return dateString.split('T')[0].split(' ')[0];
  }
  return "";
};

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter Global (Analytics Overview)
  const [filterType, setFilterType] = useState('Week'); 
  const [filterValue, setFilterValue] = useState(getCurrentWeekStr());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // --- STATE TOGGLE RCA (BARU) ---
  // Default: 'Global' (Analytics Overview). Opsi lain: 'Table' (Ticket Details)
  const [rcaDataSource, setRcaDataSource] = useState('Global'); 
  
  // State Filter Tabel Details
  const [tableStartDate, setTableStartDate] = useState(''); 
  const [tableEndDate, setTableEndDate] = useState('');     
  const [searchCustomer, setSearchCustomer] = useState(''); 
  const [tableSla, setTableSla] = useState('All');
  const [tableCategory, setTableCategory] = useState('All'); 
  const [tableSite, setTableSite] = useState([]); 
  const [tableCluster, setTableCluster] = useState('All');
  const [tableDetailFilter, setTableDetailFilter] = useState('All');
  
  const [viewTicket, setViewTicket] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === "success" && result.data) {
        setData(result.data.filter(item => item["TT No"] && item["TT No"].trim() !== "").reverse());
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const uniqueMonths = [...new Set(data.map(item => item["Month"]).filter(Boolean))];
  let uniqueWeeks = [...new Set(data.map(item => item["Week"]).filter(val => val && val.startsWith('W')))];
  if (!uniqueWeeks.includes(getCurrentWeekStr())) uniqueWeeks.push(getCurrentWeekStr());
  uniqueWeeks.sort((a,b)=>parseInt(a.replace(/\D/g,''))-parseInt(b.replace(/\D/g,'')));

  // 1. DATA GLOBAL (ANALYTICS OVERVIEW)
  const filteredData = data.filter(item => {
    if (filterType === 'Month') return item["Month"] === filterValue;
    if (filterType === 'Week') return item["Week"] === filterValue;
    if (filterType === 'Date Range') {
      const formattedItemDate = parseDateToYYYYMMDD(item["Start Time"] || item["Timestamp"]);
      if (!formattedItemDate) return false;
      if (startDate && formattedItemDate < startDate) return false;
      if (endDate && formattedItemDate > endDate) return false;
    }
    return true;
  });

  const totalTT = filteredData.length;
  const activeTT = filteredData.filter(i => i["Status TT"]?.toLowerCase().includes("open")).length;
  const completedTT = totalTT - activeTT;
  const overdueMTTR = filteredData.filter(i => i["Status TT"]?.toLowerCase().includes("open") && i["SLA Real"]?.toLowerCase().includes("out")).length;
  const inSLA = filteredData.filter(i => i["SLA Real"]?.toLowerCase().includes("in")).length;
  const outSLA = filteredData.filter(i => i["SLA Real"]?.toLowerCase().includes("out")).length;

  const retailData = filteredData.filter(i => i["Category"] === "Retail");
  const enterpriseData = filteredData.filter(i => i["Category"] === "Enterprise");
  const retailInSLA = retailData.filter(i => i["SLA Real"]?.toLowerCase().includes("in")).length;
  const retailOutSLA = retailData.filter(i => i["SLA Real"]?.toLowerCase().includes("out")).length;
  const enterpriseInSLA = enterpriseData.filter(i => i["SLA Real"]?.toLowerCase().includes("in")).length;
  const enterpriseOutSLA = enterpriseData.filter(i => i["SLA Real"]?.toLowerCase().includes("out")).length;
  const retailPerc = retailData.length > 0 ? ((retailInSLA / retailData.length) * 100).toFixed(1) : 0;
  const entPerc = enterpriseData.length > 0 ? ((enterpriseInSLA / enterpriseData.length) * 100).toFixed(1) : 0;

  const pieData = totalTT > 0 ? [{ name: 'Closed TT', value: completedTT }, { name: 'Open TT', value: activeTT }] : [{ name: 'No Data', value: 1 }];
  const PIE_COLORS = totalTT > 0 ? ['#10b981', '#f59e0b'] : ['#e5e7eb']; 

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, value, index }) => {
    if (value === 0 || totalTT === 0) return null; 
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 15; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (<text x={x} y={y} fill={PIE_COLORS[index % PIE_COLORS.length]} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontWeight="bold" fontSize="16">{value}</text>);
  };

  const siteOptions = [...new Set(filteredData.map(i => i["Site"]).filter(Boolean))].map(s => ({ value: s, label: s }));
  const uniqueClusters = [...new Set(filteredData.map(i => i["Cluster"]).filter(Boolean))];

  // 2. DATA TABEL (TICKET DETAILS)
  let baseTableData = (tableStartDate || tableEndDate) ? data : filteredData;
  let tableDataProcessed = [...baseTableData].filter(i => {
    if (tableStartDate || tableEndDate) {
      const formattedItemDate = parseDateToYYYYMMDD(i["Start Time"] || i["Timestamp"]);
      if (!formattedItemDate) return false;
      if (tableStartDate && formattedItemDate < tableStartDate) return false;
      if (tableEndDate && formattedItemDate > tableEndDate) return false;
    }

    if (tableDetailFilter === 'Active' && !i["Status TT"]?.toLowerCase().includes("open")) return false;
    if (tableDetailFilter === 'Out SLA' && !i["SLA Real"]?.toLowerCase().includes("out")) return false;
    if (tableDetailFilter === 'Overdue MTTR' && !(i["Status TT"]?.toLowerCase().includes("open") && i["SLA Real"]?.toLowerCase().includes("out"))) return false;
    if (tableSla === 'In SLA' && !i["SLA Real"]?.toLowerCase().includes("in")) return false;
    if (tableSla === 'Out SLA' && !i["SLA Real"]?.toLowerCase().includes("out")) return false;
    if (tableCluster !== 'All' && i["Cluster"] !== tableCluster) return false;
    if (tableCategory !== 'All' && i["Category"] !== tableCategory) return false;
    if (tableSite.length > 0 && !tableSite.some(opt => opt.value === i["Site"])) return false;

    if (searchCustomer.trim() !== '') {
      const terms = searchCustomer.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      if (terms.length > 0) {
        const customerInfo = (i["ID dan Nama Customer"] || "").toLowerCase();
        const ttNo = (i["TT No"] || "").toLowerCase();
        if (!terms.some(term => customerInfo.includes(term) || ttNo.includes(term))) return false;
      }
    }
    return true;
  });

  // 3. DATA RCA (MENGIKUTI TOGGLE YANG DIPILIH OLEH USER)
  const rcaFilteredData = rcaDataSource === 'Global' ? filteredData : tableDataProcessed;
  
  const rootCauseCounts = rcaFilteredData.reduce((acc, i) => { 
    acc[i["Root Cause"] || "Unspecified"] = (acc[i["Root Cause"] || "Unspecified"] || 0) + 1; 
    return acc; 
  }, {});
  const barData = Object.keys(rootCauseCounts).map(k => ({ name: k, Total: rootCauseCounts[k] })).sort((a,b)=>b.Total-a.Total);

  const exportToExcel = () => {
    if (tableDataProcessed.length === 0) {
      alert("Tidak ada data untuk didownload sesuai filter saat ini.");
      return;
    }
    const allHeaders = Object.keys(tableDataProcessed[0]);
    let tableHTML = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    tableHTML += '<head><meta charset="UTF-8"></head><body>';
    tableHTML += '<table border="1" style="font-family: Calibri, sans-serif; border-collapse: collapse;">';
    tableHTML += '<thead><tr>';
    allHeaders.forEach(h => { tableHTML += `<th style="background-color: #3b82f6; color: #ffffff; padding: 10px; font-weight: bold;">${h}</th>`; });
    tableHTML += '</tr></thead><tbody>';
    
    tableDataProcessed.forEach(row => {
      tableHTML += '<tr>';
      allHeaders.forEach(h => {
        let val = row[h];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'string') val = val.replace(/(\r\n|\n|\r)/gm, " "); 
        tableHTML += `<td style='padding: 5px; mso-number-format:"\\@";'>${val}</td>`;
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></body></html>';
    
    const blob = new Blob(['\uFEFF' + tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Report_NOC_Tickets_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dash-wrapper">
      <style>{`
        .dash-wrapper { padding: 20px; color: #1f2937; font-family: sans-serif; box-sizing: border-box; width: 100%; overflow-x: hidden; }
        .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        .dash-header-controls { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px; }
        .metric-card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #f3f4f6; display: flex; flex-direction: column; justify-content: center; }
        .middle-grid { display: grid; grid-template-columns: 1.2fr 1fr 1.5fr; gap: 20px; margin-bottom: 25px; align-items: stretch; }
        .middle-card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #f3f4f6; display: flex; flex-direction: column; }
        .sla-split { display: flex; gap: 20px; flex: 1; margin-top: 20px; }
        .filter-bar { display: flex; gap: 10px; flex-wrap: wrap; width: 100%; }
        .filter-input { padding: 8px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 0.85rem; flex: 1 1 150px; min-width: 120px; background: #fff; }
        .filter-select-container { flex: 1 1 200px; min-width: 150px; }
        
        .toggle-btn { padding: 6px 12px; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition: 0.2s; }
        .toggle-active-global { background: #fff; color: #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .toggle-active-table { background: #fff; color: #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .toggle-inactive { background: transparent; color: #64748b; }

        @media (max-width: 1024px) { .middle-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) {
          .dash-wrapper { padding: 10px; }
          .dash-header { flex-direction: column; align-items: stretch; }
          .dash-header-controls { justify-content: flex-start; }
          .dash-header-controls > select { flex: 1 1 100%; }
          .metrics-grid { grid-template-columns: 1fr; gap: 15px; } 
          .sla-split { flex-direction: column; gap: 15px; } 
          .filter-bar { flex-direction: column; align-items: stretch; }
          .filter-input, .filter-select-container { width: 100%; flex: 1 1 100%; }
        }
      `}</style>

      {/* HEADER & GLOBAL FILTER */}
      <div className="dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Analytics Overview</h2>
          <button onClick={fetchData} disabled={loading} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>🔄 Refresh</button>
        </div>
        <div className="dash-header-controls">
          <select className="filter-input" value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); setStartDate(''); setEndDate(''); }} style={{ maxWidth: '150px' }}>
            <option value="All">All Time</option><option value="Month">By Month</option><option value="Week">By Week</option><option value="Date Range">Date Range</option>
          </select>
          {filterType === 'Month' && <select className="filter-input" value={filterValue} onChange={e=>setFilterValue(e.target.value)} style={{ maxWidth: '150px' }}><option value="">-- Pilih Bulan --</option>{uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>}
          {filterType === 'Week' && <select className="filter-input" value={filterValue} onChange={e=>setFilterValue(e.target.value)} style={{ maxWidth: '150px' }}><option value="">-- Pilih Minggu --</option>{uniqueWeeks.map(w => <option key={w} value={w}>{w}</option>)}</select>}
          
          {filterType === 'Date Range' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input type="date" className="filter-input" value={startDate} onChange={e=>setStartDate(e.target.value)} />
              <span style={{ fontWeight: 'bold', color: '#6b7280' }}>to</span>
              <input type="date" className="filter-input" value={endDate} onChange={e=>setEndDate(e.target.value)} />
            </div>
          )}
        </div>
      </div>
      
      {/* ROW 1: METRICS */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '6px solid #3b82f6' }}><p style={{margin:0, fontSize:'0.85rem', color:'#6b7280', fontWeight:'bold'}}>TOTAL TICKETS</p><h3 style={{margin:'5px 0 0', fontSize:'2.2rem', color:'#111827'}}>{totalTT}</h3></div>
        <div className="metric-card" style={{ borderLeft: '6px solid #f59e0b' }}><p style={{margin:0, fontSize:'0.85rem', color:'#6b7280', fontWeight:'bold'}}>ACTIVE TICKETS (OPEN)</p><h3 style={{margin:'5px 0 0', fontSize:'2.2rem', color:'#111827'}}>{activeTT}</h3></div>
        <div className="metric-card" style={{ borderLeft: '6px solid #ef4444' }}><p style={{margin:0, fontSize:'0.85rem', color:'#6b7280', fontWeight:'bold'}}>OVERDUE MTTR (OUT SLA & OPEN)</p><h3 style={{margin:'5px 0 0', fontSize:'2.2rem', color:'#ef4444'}}>{overdueMTTR}</h3></div>
      </div>

      {/* ROW 2: PIE & SLA PERFORMANCE */}
      <div className="middle-grid">
        <div className="middle-card">
          <h4 style={{ margin: '0 0 10px', color: '#374151' }}>TT by Status</h4>
          <div style={{ flex: 1, minHeight: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" label={renderCustomLabel} labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '12px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{margin:0, fontSize:'0.85rem', color:'#166534', fontWeight:'bold'}}>COMPLETED TT</p>
            <h2 style={{margin:'5px 0 0', fontSize:'2.5rem', color:'#166534'}}>{completedTT}</h2>
          </div>
          <div className="sla-split">
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '15px', borderRadius: '12px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{margin:0, fontSize:'0.8rem', color:'#059669', fontWeight:'bold'}}>IN SLA</p>
              <h3 style={{margin:'5px 0 0', fontSize:'1.8rem', color:'#059669'}}>{inSLA}</h3>
            </div>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '12px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{margin:0, fontSize:'0.8rem', color:'#dc2626', fontWeight:'bold'}}>OUT SLA</p>
              <h3 style={{margin:'5px 0 0', fontSize:'1.8rem', color:'#dc2626'}}>{outSLA}</h3>
            </div>
          </div>
        </div>

        <div className="middle-card" style={{ justifyContent: 'center' }}>
          <h4 style={{ margin: '0 0 20px', color: '#374151' }}>SLA Performance by Category</h4>
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}><span>Retail <span style={{color:'#10b981'}}>{retailPerc}% In SLA</span></span><span style={{color:'#6b7280'}}>Total: {retailData.length}</span></div>
            <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', background: '#e5e7eb' }}>
              <div style={{ width: `${(retailInSLA/retailData.length)*100 || 0}%`, background: '#10b981', color: '#fff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{retailInSLA||''}</div>
              <div style={{ width: `${(retailOutSLA/retailData.length)*100 || 0}%`, background: '#ef4444', color: '#fff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{retailOutSLA||''}</div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}><span>Enterprise <span style={{color:'#10b981'}}>{entPerc}% In SLA</span></span><span style={{color:'#6b7280'}}>Total: {enterpriseData.length}</span></div>
            <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', background: '#e5e7eb' }}>
              <div style={{ width: `${(enterpriseInSLA/enterpriseData.length)*100 || 0}%`, background: '#10b981', color: '#fff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{enterpriseInSLA||''}</div>
              <div style={{ width: `${(enterpriseOutSLA/enterpriseData.length)*100 || 0}%`, background: '#ef4444', color: '#fff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{enterpriseOutSLA||''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: RCA CHART DENGAN TOGGLE */}
      <div className="middle-card" style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#374151' }}>Root Cause Analysis</h3>
          
          {/* SWITCH TOGGLE DATA SOURCE */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px', border: '1px solid #cbd5e1' }}>
            <button 
              onClick={() => setRcaDataSource('Global')} 
              className={`toggle-btn ${rcaDataSource === 'Global' ? 'toggle-active-global' : 'toggle-inactive'}`}
            >
              Analytics Overview
            </button>
            <button 
              onClick={() => setRcaDataSource('Table')} 
              className={`toggle-btn ${rcaDataSource === 'Table' ? 'toggle-active-table' : 'toggle-inactive'}`}
            >
              Ticket Details
            </button>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          {barData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="Total" fill={rcaDataSource === 'Global' ? "#3b82f6" : "#10b981"} radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="Total" position="top" fill="#4b5563" fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : ( <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Data tidak ditemukan sesuai filter.</div> )}
        </div>
      </div>

      {/* ROW 4: DATA TABLE */}
      <div className="middle-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ margin: 0, display: 'inline-block', marginRight: '10px' }}>Ticket Details</h3>
            <span style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '12px' }}>Showing {tableDataProcessed.length} entries</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>Filter Tanggal:</span>
              <input type="date" value={tableStartDate} onChange={e=>setTableStartDate(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>-</span>
              <input type="date" value={tableEndDate} onChange={e=>setTableEndDate(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
              {(tableStartDate || tableEndDate) && (
                <button onClick={() => { setTableStartDate(''); setTableEndDate(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', padding: '0 4px', fontSize: '1rem' }} title="Reset Filter Tanggal">✕</button>
              )}
            </div>
            <button onClick={exportToExcel} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}>
              📥 Download Excel (Full)
            </button>
          </div>
        </div>

        <div className="filter-bar" style={{ marginBottom: '15px' }}>
          <input type="text" placeholder="Cari ID/Nama/TT (koma)..." value={searchCustomer} onChange={e=>setSearchCustomer(e.target.value)} className="filter-input" />
          <select value={tableSla} onChange={e=>setTableSla(e.target.value)} className="filter-input"><option value="All">All SLA</option><option value="In SLA">In SLA</option><option value="Out SLA">Out SLA</option></select>
          <select value={tableCategory} onChange={e=>setTableCategory(e.target.value)} className="filter-input"><option value="All">All Category</option><option value="Retail">Retail</option><option value="Enterprise">Enterprise</option></select>
          <div className="filter-select-container"><Select isMulti options={siteOptions} value={tableSite} onChange={setTableSite} placeholder="Sites..." styles={{ control: (b) => ({...b, minHeight:'34px', borderRadius:'6px', borderColor:'#d1d5db'}) }} menuPortalTarget={document.body} /></div>
          <select value={tableCluster} onChange={e=>setTableCluster(e.target.value)} className="filter-input"><option value="All">All Clusters</option>{uniqueClusters.map(c=><option key={c} value={c}>{c}</option>)}</select>
          <select value={tableDetailFilter} onChange={e=>setTableDetailFilter(e.target.value)} className="filter-input" style={{fontWeight:'bold'}}><option value="All">All Tickets</option><option value="Active">Active Tickets</option><option value="Out SLA">Out SLA</option></select>
        </div>
        
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '320px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: '1000px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
              <tr>{['TT No', 'Customer', 'Cluster', 'Root Cause', 'Category', 'Deskripsi Awal', 'Progress Update', 'Aksi', 'SLA', 'Status'].map(h => (<th key={h} style={{ padding: '14px 16px', fontWeight: '700', color: '#475569', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>))}</tr>
            </thead>
            <tbody>
              {tableDataProcessed.map((r, i) => {
                const isOp = r["Status TT"]?.toLowerCase().includes("open");
                const isOutSla = r["SLA Real"]?.toLowerCase().includes("out");
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '600' }}>{r["TT No"]}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{r["ID dan Nama Customer"]}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{r["Cluster"]}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{r["Root Cause"]}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{r["Category"]}</td>
                    <td style={{ padding: '12px 16px', minWidth: '150px', maxWidth: '200px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r["Deskripsi Awal"] || r["Deskripsi"] || "-"}</td>
                    <td style={{ padding: '12px 16px', minWidth: '150px', maxWidth: '200px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r["Progress Update"] || "-"}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => setViewTicket(r)} style={{ padding: '6px 14px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>Lihat</button>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOutSla ? '#ef4444' : '#10b981', marginRight: '6px' }}></span>
                      <span style={{ color: isOutSla ? '#ef4444' : '#10b981', fontWeight: '700' }}>{r["SLA Real"] || '-'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', whiteSpace: 'nowrap', backgroundColor: isOp ? '#fef3c7' : '#d1fae5', color: isOp ? '#d97706' : '#059669' }}>
                        {r["Status TT"]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {tableDataProcessed.length === 0 && (<tr><td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data tiket sesuai filter.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL POP-UP */}
      {viewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '16px 16px 0 0' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Detail Tiket: <span style={{ color: '#3b82f6' }}>{viewTicket["TT No"]}</span></h2>
              <button onClick={() => setViewTicket(null)} style={{ background: 'none', border: 'none', fontSize: '1.75rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {Object.entries(viewTicket).map(([key, value]) => {
                  if (!key || key.trim() === '') return null; 
                  return (
                    <div key={key} style={{ backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{key}</span>
                      <span style={{ fontSize: '0.95rem', color: '#1e293b', wordBreak: 'break-word', fontWeight: '500' }}>{value || '-'}</span>
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

export default Dashboard;