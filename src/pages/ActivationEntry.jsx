import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Select from 'react-select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';

const ActivationEntry = ({ isDarkMode, toggleDarkMode }) => {
  const [loading, setLoading] = useState(false);
  const [siteOptions, setSiteOptions] = useState([]);
  const [activationList, setActivationList] = useState([]);
  
  // Filter States
  const [filterTimeType, setFilterTimeType] = useState('All');
  const [filterTimeValue, setFilterTimeValue] = useState('');
  const [filterSite, setFilterSite] = useState([]);
  const [filterService, setFilterService] = useState('All');
  const [filterKerja, setFilterKerja] = useState('All');
  const [searchPelanggan, setSearchPelanggan] = useState('');
  const [viewData, setViewData] = useState(null);

  const [formData, setFormData] = useState({ 
    "No: FAB/FAT": "", "Tipe Service": "GPON", "Tipe Pekerjaan": "Aktivasi", "SN ONU / MAC Address": "", 
    "ISP_Select": "Ideanet", "ISP_Lainnya": "", "Site": "", "ID Pelanggan": "", "Nama Pelanggan": "", 
    "BW_Select": "20Mbps", "BW_Lainnya": "", "PIC": "" 
  });

  const fetchActivationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === "success" && result.activationData) {
        const validAct = result.activationData.filter(item => item["No: FAB/FAT"] && item["No: FAB/FAT"].trim() !== "");
        setActivationList(validAct.reverse());
        const counts = {}; 
        validAct.forEach(i => { if(i.Site) counts[i.Site] = (counts[i.Site]||0)+1; });
        setSiteOptions(Object.keys(counts).sort((a,b)=>counts[b]-counts[a]));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchActivationData(); }, []);

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.backgroundColor = isDarkMode ? '#0f172a' : '#f1f5f9';
    }
    return () => { if (mainContent) mainContent.style.backgroundColor = '#f1f5f9'; };
  }, [isDarkMode]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    const date = new Date(); 
    const todayStr = ('0'+date.getDate()).slice(-2)+'/'+('0'+(date.getMonth()+1)).slice(-2)+'/'+date.getFullYear();
    const payload = { ...formData, type: "activation", "Tanggal RFS": todayStr, "Paket": "Broadband", "Status FAB/FAT": "Ok", "Tanggal Eksekusi": todayStr, "Status Eksekusi": "Ok" };
    payload["Nama ISP"] = payload["ISP_Select"] === "Lainnya" ? payload["ISP_Lainnya"] : payload["ISP_Select"];
    payload["Bandwidth"] = payload["BW_Select"] === "Lainnya" ? payload["BW_Lainnya"] : payload["BW_Select"];
    
    try {
      await fetch(API_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) });
      alert("Aktivasi disimpan!");
      setFormData({ "No: FAB/FAT": "", "Tipe Service": "GPON", "Tipe Pekerjaan": "Aktivasi", "SN ONU / MAC Address": "", "ISP_Select": "Ideanet", "ISP_Lainnya": "", "Site": "", "ID Pelanggan": "", "Nama Pelanggan": "", "BW_Select": "20Mbps", "BW_Lainnya": "", "PIC": "" });
      fetchActivationData();
    } catch (error) { alert("Gagal!"); } finally { setLoading(false); }
  };

  const enrichedData = activationList.map(item => {
    const dStr = item["Tanggal RFS"]; let yr="", mo="", wk="";
    if (dStr && dStr.split('/').length===3) {
      const [d,m,y] = dStr.split('/').map(Number); 
      yr=`${y}`; mo=`${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][m-1]} ${y}`;
      const dObj = new Date(y,m-1,d); dObj.setUTCDate(dObj.getUTCDate()+4-(dObj.getUTCDay()||7));
      wk=`W${Math.ceil((((dObj-new Date(Date.UTC(y,0,1)))/86400000)+1)/7)} - ${y}`;
    }
    return { ...item, _year: yr, _month: mo, _week: wk };
  });

  const uniqueYears = [...new Set(enrichedData.map(i => i._year).filter(Boolean))].sort((a,b) => b - a);
  const uniqueMonths = [...new Set(enrichedData.map(i => i._month).filter(Boolean))];
  const uniqueWeeks = [...new Set(enrichedData.map(i => i._week).filter(Boolean))];

  const filteredData = enrichedData.filter(item => {
    if (filterTimeType === 'Year' && filterTimeValue && item._year !== filterTimeValue) return false;
    if (filterTimeType === 'Month' && filterTimeValue && item._month !== filterTimeValue) return false;
    if (filterTimeType === 'Week' && filterTimeValue && item._week !== filterTimeValue) return false;
    if (filterService !== 'All' && item["Tipe Service"] !== filterService) return false;
    if (filterKerja !== 'All' && item["Tipe Pekerjaan"] !== filterKerja) return false;
    if (filterSite.length > 0 && !filterSite.some(option => option.value === item["Site"])) return false;
    if (searchPelanggan.trim() !== '') {
      const terms = searchPelanggan.toLowerCase().split(',').map(t=>t.trim()).filter(Boolean);
      if (terms.length > 0) {
        const customerInfo = (item["Nama Pelanggan"]||"").toLowerCase();
        const customerId = (item["ID Pelanggan"]||"").toLowerCase();
        if (!terms.some(term => customerInfo.includes(term) || customerId.includes(term))) return false;
      }
    }
    return true;
  });

  const siteCounts = filteredData.reduce((acc, i) => { acc[i.Site||"Unknown"] = (acc[i.Site||"Unknown"]||0)+1; return acc; }, {});
  const chartData = Object.keys(siteCounts).map(k => ({ name: k, Total: siteCounts[k] })).sort((a,b)=>b.Total-a.Total).slice(0,10);

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
        .filter-select-container { flex: 1 1 200px; min-width: 150px; }
        
        .btn-primary { height: 38px; padding: 0 16px; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-sizing: border-box; transition: 0.2s; font-size: 0.9rem; }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-secondary { height: 38px; padding: 0 16px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; box-sizing: border-box; transition: 0.2s; font-size: 0.9rem; }
        .btn-secondary:hover { background: var(--border); }
        .btn-action-view { padding: 6px 14px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.75rem; transition: 0.2s; }
        .btn-action-view:hover { background: var(--table-hover); }

        .table-container { overflow-x: auto; overflow-y: auto; max-height: 400px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; min-width: 1000px; }
        thead th { position: sticky; top: 0; background-color: var(--input-bg); color: var(--text-muted); padding: 14px 16px; border-bottom: 2px solid var(--border); font-weight: 600; z-index: 1; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
        tbody tr:hover { background-color: var(--table-hover); }
        tbody td { padding: 12px 16px; color: var(--text-main); }
        
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; white-space: nowrap; }
        .status-gpon { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .status-pppoe { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        
        .job-act { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .job-upg { background: rgba(245, 158, 11, 0.15); color: #d97706; }
        .job-ter { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

        /* SUMMARY BOXES */
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: var(--gap); }
        .summary-box { padding: 20px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; }
        .summary-title { margin: 0 0 5px 0; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; font-weight: bold; }
        .summary-value { margin: 0; font-size: 2.2rem; font-weight: bold; }

        /* FORM INPUT ACTIVATION STYLES */
        .update-form-container { background: var(--bg-card); border-radius: var(--border-radius); padding: 32px; border: 1px solid var(--accent); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 5px solid var(--accent); margin-bottom: var(--gap); }
        .update-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .update-input-group { margin-bottom: 16px; }
        .update-input-group:last-child { margin-bottom: 0; }
        .update-label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.85rem; color: var(--text-muted); }
        .update-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-main); font-size: 0.9rem; box-sizing: border-box; transition: 0.2s; font-family: inherit; height: 42px; }
        .update-input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .act-flex-row { display: flex; gap: 10px; }
        .act-flex-1 { flex: 1; }

        @media (max-width: 768px) {
          .dash-header { padding-left: 0; flex-direction: column; align-items: stretch; margin-top: 40px; }
          .dash-header-controls { justify-content: flex-start; }
          .filter-bar { flex-direction: column; align-items: stretch; }
          .filter-input, .filter-select-container { width: 100%; flex: 1 1 100%; }
          .update-grid { grid-template-columns: 1fr; }
          .act-flex-row { flex-direction: column; }
        }
      `}</style>

      {/* HEADER */}
      <div className="dash-header">
        <div>
          <h2 className="header-title">Input Activation</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Entry aktivasi, terminasi, dan manajemen layanan pelanggan NOC.</p>
        </div>
        <div className="dash-header-controls">
          <button className="btn-secondary" onClick={fetchActivationData} disabled={loading}>🔄 Refresh</button>
          <button className="btn-secondary" onClick={toggleDarkMode}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* ================= FORM INPUT ACTIVATION ================= */}
      <div className="update-form-container">
        <h2 style={{ margin: '0 0 25px 0', color: 'var(--text-main)', fontSize: '1.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
          Form Pengajuan Pelanggan
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="update-grid">
            
            {/* KOLOM KIRI */}
            <div>
              <div className="update-input-group">
                <label className="update-label">No: FAB/FAT</label>
                <input type="text" className="update-input" name="No: FAB/FAT" value={formData["No: FAB/FAT"]} onChange={handleChange} placeholder="Contoh: FAB/IDI/2026/..." required />
              </div>
              <div className="update-input-group">
                <label className="update-label">SN ONU / MAC Address</label>
                <input type="text" className="update-input" name="SN ONU / MAC Address" value={formData["SN ONU / MAC Address"]} onChange={handleChange} placeholder="Masukkan Serial Number..." required />
              </div>
              <div className="update-input-group">
                <label className="update-label">Tipe Service</label>
                <select className="update-input" name="Tipe Service" value={formData["Tipe Service"]} onChange={handleChange} required>
                  <option value="GPON">GPON</option><option value="PPPoE">PPPoE</option>
                </select>
              </div>
              <div className="update-input-group">
                <label className="update-label">Tipe Pekerjaan</label>
                <select className="update-input" name="Tipe Pekerjaan" value={formData["Tipe Pekerjaan"]} onChange={handleChange} required>
                  <option value="Aktivasi">Aktivasi</option><option value="Terminasi">Terminasi</option><option value="Upgrade">Upgrade</option><option value="Pergantian">Pergantian</option>
                </select>
              </div>
              <div className="update-input-group">
                <label className="update-label">Nama ISP</label>
                <div className="act-flex-row">
                  <select className="update-input act-flex-1" name="ISP_Select" value={formData["ISP_Select"]} onChange={handleChange} required>
                    <option value="Ideanet">Ideanet</option><option value="Lainnya">Lainnya...</option>
                  </select>
                  {formData["ISP_Select"] === "Lainnya" && (
                    <input type="text" className="update-input act-flex-1" name="ISP_Lainnya" value={formData["ISP_Lainnya"]} onChange={handleChange} placeholder="Tulis ISP..." required />
                  )}
                </div>
              </div>
              <div className="update-input-group">
                <label className="update-label">Site (Lokasi)</label>
                <input type="text" className="update-input" list="site-act-list" name="Site" value={formData["Site"]} onChange={handleChange} placeholder="Ketik / pilih site..." autoComplete="off" required />
                <datalist id="site-act-list">{siteOptions.map(s=><option key={s} value={s}/>)}</datalist>
              </div>
            </div>

            {/* KOLOM KANAN */}
            <div>
              <div className="update-input-group">
                <label className="update-label">ID Pelanggan</label>
                <input type="text" className="update-input" name="ID Pelanggan" value={formData["ID Pelanggan"]} onChange={handleChange} placeholder="Misal: 1631322211" required />
              </div>
              <div className="update-input-group">
                <label className="update-label">Nama Pelanggan</label>
                <input type="text" className="update-input" name="Nama Pelanggan" value={formData["Nama Pelanggan"]} onChange={handleChange} placeholder="Nama Lengkap..." required />
              </div>
              <div className="update-input-group">
                <label className="update-label">Bandwidth</label>
                <div className="act-flex-row">
                  <select className="update-input act-flex-1" name="BW_Select" value={formData["BW_Select"]} onChange={handleChange} required>
                    <option value="10Mbps">10 Mbps</option>
                    <option value="20Mbps">20 Mbps</option>
                    <option value="30Mbps">30 Mbps</option>
                    <option value="50Mbps">50 Mbps</option>
                    <option value="75Mbps">75 Mbps</option>
                    <option value="100Mbps">100 Mbps</option>
                    <option value="150Mbps">150 Mbps</option>
                    <option value="200Mbps">200 Mbps</option>
                    <option value="Lainnya">Lainnya...</option>
                  </select>
                  {formData["BW_Select"] === "Lainnya" && (
                    <input type="text" className="update-input act-flex-1" name="BW_Lainnya" value={formData["BW_Lainnya"]} onChange={handleChange} placeholder="Misal: 500Mbps" required />
                  )}
                </div>
              </div>
              <div className="update-input-group">
                <label className="update-label">PIC In Charge (NOC)</label>
                <select className="update-input" name="PIC" value={formData["PIC"]} onChange={handleChange} required>
                  <option value="">-- Pilih NOC --</option>
                  <option value="Faidillah">Faidillah</option>
                  <option value="Yudi">Yudi</option>
                  <option value="Adit">Adit</option>
                  <option value="Miko">Miko</option>
                </select>
              </div>
            </div>

          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '16px', marginTop: '24px', fontSize: '1.1rem', justifyContent: 'center' }}>
            {loading ? 'MENYIMPAN...' : 'SIMPAN DATA AKTIVASI'}
          </button>
        </form>
      </div>

      {/* ================= DASHBOARD SUMMARY ================= */}
      <div className="summary-grid">
        <div className="summary-box" style={{ background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff', borderLeft: '5px solid #3b82f6' }}>
          <h4 className="summary-title">Total Filtered</h4>
          <h2 className="summary-value" style={{ color: '#3b82f6' }}>{filteredData.length}</h2>
        </div>
        <div className="summary-box" style={{ background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4', borderLeft: '5px solid #10b981' }}>
          <h4 className="summary-title">Aktivasi & Upgrade</h4>
          <h2 className="summary-value" style={{ color: '#10b981' }}>{filteredData.filter(i=>i["Tipe Pekerjaan"]!=="Terminasi").length}</h2>
        </div>
        <div className="summary-box" style={{ background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', borderLeft: '5px solid #ef4444' }}>
          <h4 className="summary-title">Terminasi</h4>
          <h2 className="summary-value" style={{ color: '#ef4444' }}>{filteredData.filter(i=>i["Tipe Pekerjaan"]==="Terminasi").length}</h2>
        </div>
      </div>

      {/* ================= CHART SECTION ================= */}
      <div className="middle-card">
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>Top 10 Site (Aktivasi, Upgrade & Terminasi)</h3>
        <div style={{ width: '100%', height: 300 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#6b7280', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: isDarkMode ? '#334155' : '#f3f4f6'}} contentStyle={{backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#475569' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#1f2937', borderRadius: '8px'}} />
                <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="Total" position="top" fill={isDarkMode ? '#f8fafc' : '#4b5563'} fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Tidak ada data pada rentang waktu/site ini.</div>
          )}
        </div>
      </div>

      {/* ================= DATA TABLE ================= */}
      <div className="middle-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>Riwayat Pekerjaan</h3>
            <span style={{ fontSize: '0.8rem', background: 'var(--table-hover)', padding: '6px 12px', borderRadius: '20px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Showing {filteredData.length} entries</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--table-hover)', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--border)', height: '38px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', paddingLeft: '8px' }}>Waktu:</span>
            <select className="filter-input" value={filterTimeType} onChange={e=>{setFilterTimeType(e.target.value); setFilterTimeValue('');}} style={{ height: '28px', border: 'none', borderRadius: '4px' }}>
              <option value="All">All Time</option><option value="Month">By Month</option><option value="Year">By Year</option>
            </select>
            {filterTimeType === 'Month' && <select className="filter-input" value={filterTimeValue} onChange={e=>setFilterTimeValue(e.target.value)} style={{ height: '28px', border: 'none', borderRadius: '4px' }}><option value="">Pilih Bulan</option>{uniqueMonths.map(m=><option key={m} value={m}>{m}</option>)}</select>}
            {filterTimeType === 'Year' && <select className="filter-input" value={filterTimeValue} onChange={e=>setFilterTimeValue(e.target.value)} style={{ height: '28px', border: 'none', borderRadius: '4px' }}><option value="">Pilih Tahun</option>{uniqueYears.map(m=><option key={m} value={m}>{m}</option>)}</select>}
          </div>
        </div>

        <div className="filter-bar">
          <input type="text" className="filter-input" placeholder="Cari ID/Nama (Pakai koma)..." value={searchPelanggan} onChange={e=>setSearchPelanggan(e.target.value)} />
          <select className="filter-input" value={filterService} onChange={e=>setFilterService(e.target.value)}>
            <option value="All">All Service</option><option value="GPON">GPON</option><option value="PPPoE">PPPoE</option>
          </select>
          <select className="filter-input" value={filterKerja} onChange={e=>setFilterKerja(e.target.value)}>
            <option value="All">All Tipe</option><option value="Aktivasi">Aktivasi</option><option value="Terminasi">Terminasi</option><option value="Upgrade">Upgrade</option>
          </select>
          <div className="filter-select-container">
            <Select 
              isMulti options={siteOptions.map(s => ({value: s, label: s}))} value={filterSite} onChange={setFilterSite} placeholder="Filter Sites..." 
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
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>{['No FAB/FAT', 'ID Pelanggan', 'Pelanggan', 'Site', 'ISP', 'Service', 'Pekerjaan', 'Bandwidth', 'Tanggal', 'Aksi'].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filteredData.map((r, i) => {
                const serviceClass = r["Tipe Service"] === "GPON" ? "status-gpon" : "status-pppoe";
                const jobClass = r["Tipe Pekerjaan"] === "Aktivasi" ? "job-act" : r["Tipe Pekerjaan"] === "Upgrade" ? "job-upg" : "job-ter";
                
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: '600' }}>{r["No: FAB/FAT"]}</td>
                    <td>{r["ID Pelanggan"]}</td>
                    <td>{r["Nama Pelanggan"]}</td>
                    <td>{r["Site"]}</td>
                    <td>{r["Nama ISP"]}</td>
                    <td><span className={`status-badge ${serviceClass}`}>{r["Tipe Service"]}</span></td>
                    <td><span className={`status-badge ${jobClass}`}>{r["Tipe Pekerjaan"]}</span></td>
                    <td>{r["Bandwidth"]}</td>
                    <td>{r["Tanggal RFS"]}</td>
                    <td><button onClick={()=>setViewData(r)} className="btn-action-view">Lihat</button></td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (<tr><td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada riwayat.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL POP-UP DETAILS ================= */}
      {viewData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', boxSizing: 'border-box', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '1200px', height: '85vh', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-main)', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>Detail: <span style={{ color: 'var(--accent)' }}>{viewData["No: FAB/FAT"]}</span></h2>
              <button onClick={() => setViewData(null)} style={{ background: 'none', border: 'none', fontSize: '2rem', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1, transition: '0.2s' }}>&times;</button>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '0 0 16px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {Object.entries(viewData).map(([key, value]) => {
                  if (key.startsWith('_') || !key.trim()) return null; 
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

export default ActivationEntry;