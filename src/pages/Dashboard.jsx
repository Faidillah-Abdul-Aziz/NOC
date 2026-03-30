import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('All'); 
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const result = await response.json();
        if (result.status === "success" && result.data) {
          const validData = result.data.filter(item => item["TT No"] && item["TT No"].trim() !== "");
          setData(validData);
        }
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Dropdown Options
  // Filter Dropdown Options
  const uniqueMonths = [...new Set(data.map(item => item["Month"]).filter(Boolean))];
  
  // Mengambil unik week, membuang error #VALUE!, dan mengurutkan berdasarkan angka
  const uniqueWeeks = [...new Set(data.map(item => item["Week"])
    .filter(val => val && val.startsWith('W')) // Hanya ambil yang berawalan "W"
  )].sort((a, b) => {
    // Ekstrak angka di belakang huruf "W" untuk diurutkan secara matematis
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB; // Urutan naik (Ascending)
  });

  // Apply Filters
  const filteredData = data.filter(item => {
    if (filterType === 'All') return true;
    if (filterType === 'Month') return item["Month"] === filterValue;
    if (filterType === 'Week') return item["Week"] === filterValue;
    return true;
  });

  // --- CALCULATIONS ---
  const totalTT = filteredData.length;
  const activeTT = filteredData.filter(item => item["Status TT"] && item["Status TT"].toLowerCase().includes("open")).length;
  const completedTT = totalTT - activeTT;
  
  const overdueMTTR = filteredData.filter(item => 
    (item["Status TT"] && item["Status TT"].toLowerCase().includes("open")) && 
    (item["SLA Real"] && item["SLA Real"].toLowerCase().includes("out"))
  ).length;

  const inSLA = filteredData.filter(item => item["SLA Real"] && item["SLA Real"].toLowerCase().includes("in")).length;
  const outSLA = filteredData.filter(item => item["SLA Real"] && item["SLA Real"].toLowerCase().includes("out")).length;

  const retailData = filteredData.filter(item => item["Category"] === "Retail");
  const enterpriseData = filteredData.filter(item => item["Category"] === "Enterprise");

  const retailInSLA = retailData.filter(item => item["SLA Real"] && item["SLA Real"].toLowerCase().includes("in")).length;
  const retailOutSLA = retailData.filter(item => item["SLA Real"] && item["SLA Real"].toLowerCase().includes("out")).length;
  const enterpriseInSLA = enterpriseData.filter(item => item["SLA Real"] && item["SLA Real"].toLowerCase().includes("in")).length;
  const enterpriseOutSLA = enterpriseData.filter(item => item["SLA Real"] && item["SLA Real"].toLowerCase().includes("out")).length;

  // --- CHART DATA (With Fallback for Empty State) ---
  const pieData = totalTT > 0 ? [
    { name: 'Closed TT', value: completedTT },
    { name: 'Open TT', value: activeTT }
  ] : [{ name: 'No Data', value: 1 }];
  const PIE_COLORS = totalTT > 0 ? ['#10b981', '#f59e0b'] : ['#e5e7eb']; // Green & Orange

  const rootCauseCounts = filteredData.reduce((acc, item) => {
    const rc = item["Root Cause"] || "Unspecified";
    acc[rc] = (acc[rc] || 0) + 1;
    return acc;
  }, {});
  
  const barData = Object.keys(rootCauseCounts).map(key => ({
    name: key, Total: rootCauseCounts[key]
  }));

  // --- COMMON STYLES ---
  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f3f4f6'
  };

  const miniCardStyle = (bgColor, textColor) => ({
    backgroundColor: bgColor,
    color: textColor,
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    flex: 1
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <h2 style={{ color: '#6b7280' }}>Memuat Dashboard NOC... ⏳</h2>
      </div>
    );
  }

  return (
    <div style={{ color: '#1f2937' }}>
      {/* HEADER & FILTER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>Analytics Overview</h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="form-control" 
            style={{ width: 'auto', padding: '8px 15px', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer' }}
            value={filterType} 
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterValue(''); 
            }}
          >
            <option value="All">All Time</option>
            <option value="Month">By Month</option>
            <option value="Week">By Week</option>
          </select>

          {filterType === 'Month' && (
            <select className="form-control" style={{ width: 'auto', padding: '8px 15px', borderRadius: '8px', border: '1px solid #d1d5db' }} value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
              <option value="">-- Select Month --</option>
              {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}

          {filterType === 'Week' && (
            <select className="form-control" style={{ width: 'auto', padding: '8px 15px', borderRadius: '8px', border: '1px solid #d1d5db' }} value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
              <option value="">-- Select Week --</option>
              {uniqueWeeks.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          )}
        </div>
      </div>
      
      {/* --- ROW 1: TOP METRICS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
        <div style={{ ...cardStyle, borderLeft: '5px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Total Tickets</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '2.5rem', color: '#111827' }}>{totalTT}</h3>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#eff6ff', borderRadius: '50%', color: '#3b82f6', fontSize: '1.5rem' }}>📊</div>
        </div>
        
        <div style={{ ...cardStyle, borderLeft: '5px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Active Tickets</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '2.5rem', color: '#111827' }}>{activeTT}</h3>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fffbeb', borderRadius: '50%', color: '#f59e0b', fontSize: '1.5rem' }}>🔥</div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '5px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' }}>Overdue MTTR</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '2.5rem', color: '#111827' }}>{overdueMTTR}</h3>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '50%', color: '#ef4444', fontSize: '1.5rem' }}>⚠️</div>
        </div>
      </div>

      {/* --- ROW 2: MAIN DASHBOARD GRID --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: '20px', marginBottom: '25px' }}>
        
        {/* Left: Pie Chart */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#374151', alignSelf: 'flex-start' }}>TT by Status</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                {totalTT > 0 && <Tooltip />}
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle: SLA Mini Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={miniCardStyle('#f0fdf4', '#166534')}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Completed TT</p>
            <h2 style={{ margin: '5px 0 0 0', fontSize: '2rem' }}>{completedTT}</h2>
          </div>
          <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
            <div style={miniCardStyle('#ecfdf5', '#059669')}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>IN SLA</p>
              <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem' }}>{inSLA}</h3>
            </div>
            <div style={miniCardStyle('#fef2f2', '#dc2626')}>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>OUT SLA</p>
              <h3 style={{ margin: '5px 0 0 0', fontSize: '1.5rem' }}>{outSLA}</h3>
            </div>
          </div>
        </div>

        {/* Right: Retail vs Enterprise */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#374151' }}>SLA Performance by Category</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontWeight: 'bold', color: '#4b5563' }}>Retail</span>
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total: {retailData.length}</span>
            </div>
            <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '25px', backgroundColor: '#e5e7eb' }}>
              <div style={{ width: retailData.length > 0 ? `${(retailInSLA/retailData.length)*100}%` : '0%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>{retailInSLA > 0 ? retailInSLA : ''}</div>
              <div style={{ width: retailData.length > 0 ? `${(retailOutSLA/retailData.length)*100}%` : '0%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>{retailOutSLA > 0 ? retailOutSLA : ''}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '5px' }}>
              <span style={{ color: '#10b981', fontWeight: '600' }}>In SLA</span>
              <span style={{ color: '#ef4444', fontWeight: '600' }}>Out SLA</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontWeight: 'bold', color: '#4b5563' }}>Enterprise</span>
              <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total: {enterpriseData.length}</span>
            </div>
            <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '25px', backgroundColor: '#e5e7eb' }}>
              <div style={{ width: enterpriseData.length > 0 ? `${(enterpriseInSLA/enterpriseData.length)*100}%` : '0%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>{enterpriseInSLA > 0 ? enterpriseInSLA : ''}</div>
              <div style={{ width: enterpriseData.length > 0 ? `${(enterpriseOutSLA/enterpriseData.length)*100}%` : '0%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>{enterpriseOutSLA > 0 ? enterpriseOutSLA : ''}</div>
            </div>
          </div>

        </div>
      </div>

      {/* --- ROW 3: BAR CHART --- */}
      <div style={{ ...cardStyle, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#374151' }}>Root Cause Analysis</h3>
        <div style={{ width: '100%', height: 300 }}>
          {totalTT > 0 ? (
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Belum ada data Root Cause.</div>
          )}
        </div>
      </div>

      {/* --- ROW 4: DATA TABLE --- */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#374151' }}>Ticket Details</h3>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '5px 10px', borderRadius: '20px' }}>
            {filterType !== 'All' ? `Filtered by ${filterValue}` : 'Showing All Data'}
          </span>
        </div>
        
        <div style={{ overflowX: 'auto', maxHeight: '400px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1 }}>
              <tr>
                {['TT No', 'Customer', 'Cluster', 'Root Cause', 'Category', 'SLA Real', 'Status'].map(head => (
                  <th key={head} style={{ padding: '12px 15px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => {
                const isOp = row["Status TT"] && row["Status TT"].toLowerCase().includes("open");
                const isOutSla = row["SLA Real"] && row["SLA Real"].toLowerCase().includes("out");
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '12px 15px', color: '#111827', fontWeight: '500' }}>{row["TT No"]}</td>
                    <td style={{ padding: '12px 15px' }}>{row["ID dan Nama Customer"]}</td>
                    <td style={{ padding: '12px 15px' }}>{row["Cluster"]}</td>
                    <td style={{ padding: '12px 15px' }}>{row["Root Cause"]}</td>
                    <td style={{ padding: '12px 15px' }}>{row["Category"]}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOutSla ? '#ef4444' : '#10b981', marginRight: '6px' }}></span>
                      <span style={{ color: isOutSla ? '#ef4444' : '#10b981', fontWeight: '600' }}>{row["SLA Real"]}</span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase',
                        backgroundColor: isOp ? '#fef3c7' : '#d1fae5',
                        color: isOp ? '#d97706' : '#059669'
                      }}>
                        {row["Status TT"]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>Tidak ada data pada periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;