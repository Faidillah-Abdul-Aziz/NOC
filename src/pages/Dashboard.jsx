import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Select from 'react-select'; 

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('All'); 
  const [filterValue, setFilterValue] = useState('');
  
  // State Filter RCA
  const [rcaSla, setRcaSla] = useState('All');
  const [rcaCategory, setRcaCategory] = useState('All'); 
  const [rcaSite, setRcaSite] = useState([]); 
  const [rcaCluster, setRcaCluster] = useState('All');
  
  // State Filter Tabel Details
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
        // Pastikan data langsung dibalik di sini agar yang terbaru (paling bawah di Sheets) ada di atas
        setData(result.data.filter(item => item["TT No"] && item["TT No"].trim() !== "").reverse());
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const uniqueMonths = [...new Set(data.map(item => item["Month"]).filter(Boolean))];
  const uniqueWeeks = [...new Set(data.map(item => item["Week"]).filter(val => val && val.startsWith('W')))].sort((a,b)=>parseInt(a.replace(/\D/g,''))-parseInt(b.replace(/\D/g,'')));

  const filteredData = data.filter(item => {
    if (filterType === 'Month') return item["Month"] === filterValue;
    if (filterType === 'Week') return item["Week"] === filterValue;
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

  const rcaFilteredData = filteredData.filter(i => {
    if (rcaSla === 'In SLA' && !i["SLA Real"]?.toLowerCase().includes("in")) return false;
    if (rcaSla === 'Out SLA' && !i["SLA Real"]?.toLowerCase().includes("out")) return false;
    if (rcaCluster !== 'All' && i["Cluster"] !== rcaCluster) return false;
    if (rcaCategory !== 'All' && i["Category"] !== rcaCategory) return false;
    if (rcaSite.length > 0 && !rcaSite.some(opt => opt.value === i["Site"])) return false;
    return true;
  });

  const rootCauseCounts = rcaFilteredData.reduce((acc, i) => { acc[i["Root Cause"] || "Unspecified"] = (acc[i["Root Cause"] || "Unspecified"] || 0) + 1; return acc; }, {});
  const barData = Object.keys(rootCauseCounts).map(k => ({ name: k, Total: rootCauseCounts[k] })).sort((a,b)=>b.Total-a.Total);

  // Karena data utama sudah di-reverse di atas, kita cukup filter saja di sini (tanpa di-reverse lagi)
  let tableDataProcessed = [...filteredData].filter(i => {
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

  const metricCard = (border) => ({ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #f3f4f6', borderLeft: `6px solid ${border}`, flex: '1 1 250px' });
  const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' };

  return (
    <div style={{ padding: '20px', color: '#1f2937', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Analytics Overview</h2>
          <button onClick={fetchData} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>🔄 Refresh</button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select style={inputStyle} value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); }}>
            <option value="All">All Time</option><option value="Month">By Month</option><option value="Week">By Week</option>
          </select>
          {filterType === 'Month' && <select style={inputStyle} value={filterValue} onChange={e=>setFilterValue(e.target.value)}><option value="">-- Pilih Bulan --</option>{uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>}
          {filterType === 'Week' && <select style={inputStyle} value={filterValue} onChange={e=>setFilterValue(e.target.value)}><option value="">-- Pilih Minggu --</option>{uniqueWeeks.map(w => <option key={w} value={w}>{w}</option>)}</select>}
        </div>
      </div>
      
      {/* ROW 1: METRICS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '25px' }}>
        <div style={metricCard('#3b82f6')}><p style={{margin:0, fontSize:'0.85rem', color:'#6b7280', fontWeight:'bold'}}>TOTAL TICKETS</p><h3 style={{margin:'5px 0 0', fontSize:'2.2rem', color:'#111827'}}>{totalTT}</h3></div>
        <div style={metricCard('#f59e0b')}><p style={{margin:0, fontSize:'0.85rem', color:'#6b7280', fontWeight:'bold'}}>ACTIVE TICKETS (OPEN)</p><h3 style={{margin:'5px 0 0', fontSize:'2.2rem', color:'#111827'}}>{activeTT}</h3></div>
        <div style={metricCard('#ef4444')}><p style={{margin:0, fontSize:'0.85rem', color:'#6b7280', fontWeight:'bold'}}>OVERDUE MTTR (OUT SLA & OPEN)</p><h3 style={{margin:'5px 0 0', fontSize:'2.2rem', color:'#ef4444'}}>{overdueMTTR}</h3></div>
      </div>

      {/* ROW 2: PIE & SLA PERFORMANCE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px', alignItems: 'stretch' }}>
        
        {/* Left: Pie */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 10px', color: '#374151' }}>TT by Status</h4>
          <div style={{ flex: 1, minHeight: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {pieData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Middle: SLA Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '12px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{margin:0, fontSize:'0.85rem', color:'#166534', fontWeight:'bold'}}>COMPLETED TT</p>
            <h2 style={{margin:'5px 0 0', fontSize:'2rem', color:'#166534'}}>{completedTT}</h2>
          </div>
          <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '15px', borderRadius: '12px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{margin:0, fontSize:'0.8rem', color:'#059669', fontWeight:'bold'}}>IN SLA</p>
              <h3 style={{margin:'5px 0 0', fontSize:'1.5rem', color:'#059669'}}>{inSLA}</h3>
            </div>
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '12px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{margin:0, fontSize:'0.8rem', color:'#dc2626', fontWeight:'bold'}}>OUT SLA</p>
              <h3 style={{margin:'5px 0 0', fontSize:'1.5rem', color:'#dc2626'}}>{outSLA}</h3>
            </div>
          </div>
        </div>

        {/* Right: Bar */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ margin: '0 0 20px', color: '#374151' }}>SLA Performance by Category</h4>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}><span>Retail <span style={{color:'#10b981'}}>{retailPerc}% In SLA</span></span><span style={{color:'#6b7280'}}>Total: {retailData.length}</span></div>
            <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', background: '#e5e7eb' }}>
              <div style={{ width: `${(retailInSLA/retailData.length)*100 || 0}%`, background: '#10b981', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{retailInSLA||''}</div>
              <div style={{ width: `${(retailOutSLA/retailData.length)*100 || 0}%`, background: '#ef4444', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{retailOutSLA||''}</div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}><span>Enterprise <span style={{color:'#10b981'}}>{entPerc}% In SLA</span></span><span style={{color:'#6b7280'}}>Total: {enterpriseData.length}</span></div>
            <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden', background: '#e5e7eb' }}>
              <div style={{ width: `${(enterpriseInSLA/enterpriseData.length)*100 || 0}%`, background: '#10b981', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{enterpriseInSLA||''}</div>
              <div style={{ width: `${(enterpriseOutSLA/enterpriseData.length)*100 || 0}%`, background: '#ef4444', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{enterpriseOutSLA||''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: RCA CHART */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #f3f4f6', marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#374151' }}>Root Cause Analysis</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select value={rcaSla} onChange={e=>setRcaSla(e.target.value)} style={inputStyle}><option value="All">All SLA</option><option value="In SLA">In SLA</option><option value="Out SLA">Out SLA</option></select>
            <select value={rcaCategory} onChange={e=>setRcaCategory(e.target.value)} style={inputStyle}>
              <option value="All">All Category</option><option value="Retail">Retail</option><option value="Enterprise">Enterprise</option>
            </select>
            <div style={{ minWidth: '200px' }}><Select isMulti options={siteOptions} value={rcaSite} onChange={setRcaSite} placeholder="Search Sites..." styles={{ control: (b) => ({...b, minHeight:'34px', borderRadius:'6px', borderColor:'#d1d5db'}) }} menuPortalTarget={document.body} /></div>
            <select value={rcaCluster} onChange={e=>setRcaCluster(e.target.value)} style={inputStyle}><option value="All">All Clusters</option>{uniqueClusters.map(c=><option key={c} value={c}>{c}</option>)}</select>
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
                <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}><LabelList dataKey="Total" position="top" fill="#4b5563" fontSize={12} fontWeight="bold" /></Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : ( <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Data tidak ditemukan.</div> )}
        </div>
      </div>

      {/* ROW 4: DATA TABLE */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div><h3 style={{ margin: 0, display: 'inline-block', marginRight: '10px' }}>Ticket Details</h3><span style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '12px' }}>Showing {tableDataProcessed.length} entries</span></div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Cari ID/Nama (koma)..." value={searchCustomer} onChange={e=>setSearchCustomer(e.target.value)} style={inputStyle} />
            <select value={tableSla} onChange={e=>setTableSla(e.target.value)} style={inputStyle}><option value="All">All SLA</option><option value="In SLA">In SLA</option><option value="Out SLA">Out SLA</option></select>
            <select value={tableCategory} onChange={e=>setTableCategory(e.target.value)} style={inputStyle}>
              <option value="All">All Category</option><option value="Retail">Retail</option><option value="Enterprise">Enterprise</option>
            </select>
            <div style={{ minWidth: '150px' }}><Select isMulti options={siteOptions} value={tableSite} onChange={setTableSite} placeholder="Sites..." styles={{ control: (b) => ({...b, minHeight:'34px', borderRadius:'6px', borderColor:'#d1d5db'}) }} menuPortalTarget={document.body} /></div>
            <select value={tableCluster} onChange={e=>setTableCluster(e.target.value)} style={inputStyle}><option value="All">All Clusters</option>{uniqueClusters.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <select value={tableDetailFilter} onChange={e=>setTableDetailFilter(e.target.value)} style={{...inputStyle, fontWeight:'bold'}}><option value="All">All Tickets</option><option value="Active">Active Tickets</option><option value="Out SLA">Out SLA</option></select>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '320px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: '1000px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
              <tr>{['TT No', 'Customer', 'Cluster', 'Root Cause', 'Category', 'Deskripsi Awal', 'Progress Update', 'Aksi', 'SLA', 'Status'].map(h => (<th key={h} style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{h}</th>))}</tr>
            </thead>
            <tbody>
              {tableDataProcessed.map((r, i) => {
                const isOp = r["Status TT"]?.toLowerCase().includes("open");
                const isOutSla = r["SLA Real"]?.toLowerCase().includes("out");
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{r["TT No"]}</td><td style={{ padding: '12px 15px' }}>{r["ID dan Nama Customer"]}</td>
                    <td style={{ padding: '12px 15px' }}>{r["Cluster"]}</td><td style={{ padding: '12px 15px' }}>{r["Root Cause"]}</td><td style={{ padding: '12px 15px' }}>{r["Category"]}</td>
                    <td style={{ padding: '12px 15px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r["Deskripsi Awal"] || r["Deskripsi"] || "-"}</td>
                    <td style={{ padding: '12px 15px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r["Progress Update"] || "-"}</td>
                    <td style={{ padding: '12px 15px' }}><button onClick={() => setViewTicket(r)} style={{ padding: '5px 10px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Lihat</button></td>
                    <td style={{ padding: '12px 15px' }}><span style={{ color: isOutSla ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{isOutSla ? '● OUT SLA' : '● IN SLA'}</span></td>
                    <td style={{ padding: '12px 15px' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', background: isOp ? '#fef3c7' : '#d1fae5', color: isOp ? '#d97706' : '#059669' }}>{r["Status TT"]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL POP-UP */}
      {viewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', boxSizing: 'border-box' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '700px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}><h3 style={{ margin:0 }}>Detail Tiket</h3><button onClick={() => setViewTicket(null)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>&times;</button></div>
            <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {Object.entries(viewTicket).map(([k, v]) => (!k.trim() ? null : <div key={k} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><strong style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{k}</strong><div style={{ wordBreak: 'break-word', fontSize: '0.9rem' }}>{v || '-'}</div></div>))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;