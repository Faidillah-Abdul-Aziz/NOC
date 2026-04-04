import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Select from 'react-select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

const ActivationEntry = () => {
  const [loading, setLoading] = useState(false);
  const [siteOptions, setSiteOptions] = useState([]);
  const [activationList, setActivationList] = useState([]);
  
  const [filterTimeType, setFilterTimeType] = useState('All');
  const [filterTimeValue, setFilterTimeValue] = useState('');
  const [filterSite, setFilterSite] = useState([]);
  const [filterService, setFilterService] = useState('All');
  const [filterKerja, setFilterKerja] = useState('All');
  const [searchPelanggan, setSearchPelanggan] = useState('');
  const [viewData, setViewData] = useState(null);

  const [formData, setFormData] = useState({ "No: FAB/FAT": "", "Tipe Service": "GPON", "Tipe Pekerjaan": "Aktivasi", "SN ONU / MAC Address": "", "ISP_Select": "Ideanet", "ISP_Lainnya": "", "Site": "", "ID Pelanggan": "", "Nama Pelanggan": "", "BW_Select": "20Mbps", "BW_Lainnya": "", "PIC": "" });

  const getSortedByFrequency = (dataArray, key) => {
    const counts = {};
    dataArray.forEach(item => {
      const val = item[key];
      if (val && typeof val === 'string' && val.trim() !== '') {
        const trimmedVal = val.trim();
        counts[trimmedVal] = (counts[trimmedVal] || 0) + 1;
      }
    });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  };

  const fetchActivationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === "success" && result.activationData) {
        const validAct = result.activationData.filter(item => item["No: FAB/FAT"] && item["No: FAB/FAT"].trim() !== "");
        setActivationList(validAct.reverse());
        const counts = {}; validAct.forEach(i => { if(i.Site) counts[i.Site] = (counts[i.Site]||0)+1; });
        setSiteOptions(Object.keys(counts).sort((a,b)=>counts[b]-counts[a]));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchActivationData(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const date = new Date(); const todayStr = ('0'+date.getDate()).slice(-2)+'/'+('0'+(date.getMonth()+1)).slice(-2)+'/'+date.getFullYear();
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
      const [d,m,y] = dStr.split('/').map(Number); yr=`${y}`; mo=`${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"][m-1]} ${y}`;
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
      const terms = searchPelanggan.toLowerCase().split(',').map(t=>t.trim());
      if (!terms.some(t => (item["Nama Pelanggan"]||"").toLowerCase().includes(t) || (item["ID Pelanggan"]||"").toLowerCase().includes(t))) return false;
    }
    return true;
  });

  const siteCounts = filteredData.reduce((acc, i) => { acc[i.Site||"Unknown"] = (acc[i.Site||"Unknown"]||0)+1; return acc; }, {});
  const chartData = Object.keys(siteCounts).map(k => ({ name: k, Total: siteCounts[k] })).sort((a,b)=>b.Total-a.Total).slice(0,10);

  const customSelectStyles = { control: (base) => ({ ...base, minHeight: '38px', borderRadius: '8px', borderColor: '#d1d5db', fontSize: '0.9rem' }), menuPortal: (base) => ({ ...base, zIndex: 9999 }) };

  return (
    <div style={{ color: '#1f2937', padding: '20px' }}>
      {/* CSS Injeksi */}
      <style>{`
        .act-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .act-full { grid-column: span 2; }
        .act-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 0.9rem; box-sizing: border-box; background: #fff; transition: 0.2s; }
        .act-input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .act-label { display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 600; color: #4b5563; }
        .act-flex-row { display: flex; gap: 10px; }
        .act-flex-1 { flex: 1; }
        
        @media (max-width: 768px) {
          .act-grid { grid-template-columns: 1fr; gap: 15px; }
          .act-full { grid-column: span 1; }
          .act-flex-row { flex-direction: column; }
        }
      `}</style>

      {/* ================= FORM INPUT ACTIVATION ================= */}
      <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 25px 0', color: '#111827', fontSize: '1.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '15px' }}>🚀 Form Input Activation</h2>
        <form onSubmit={handleSubmit}>
          <div className="act-grid">
            
            <div>
              <label className="act-label">No: FAB/FAT</label>
              <input type="text" className="act-input" name="No: FAB/FAT" value={formData["No: FAB/FAT"]} onChange={handleChange} placeholder="Contoh: FAB/IDI/2026/..." required />
            </div>
            <div>
              <label className="act-label">SN ONU / MAC Address</label>
              <input type="text" className="act-input" name="SN ONU / MAC Address" value={formData["SN ONU / MAC Address"]} onChange={handleChange} placeholder="Masukkan Serial Number..." required />
            </div>

            <div>
              <label className="act-label">Tipe Service</label>
              <select className="act-input" name="Tipe Service" value={formData["Tipe Service"]} onChange={handleChange} required>
                <option value="GPON">GPON</option><option value="PPPoE">PPPoE</option>
              </select>
            </div>
            <div>
              <label className="act-label">Tipe Pekerjaan</label>
              <select className="act-input" name="Tipe Pekerjaan" value={formData["Tipe Pekerjaan"]} onChange={handleChange} required>
                <option value="Aktivasi">Aktivasi</option><option value="Terminasi">Terminasi</option><option value="Upgrade">Upgrade</option>
              </select>
            </div>

            <div>
              <label className="act-label">Nama ISP</label>
              <div className="act-flex-row">
                <select className="act-input act-flex-1" name="ISP_Select" value={formData["ISP_Select"]} onChange={handleChange} required>
                  <option value="Ideanet">Ideanet</option><option value="Lainnya">Lainnya...</option>
                </select>
                {formData["ISP_Select"] === "Lainnya" && (
                  <input type="text" className="act-input act-flex-1" name="ISP_Lainnya" value={formData["ISP_Lainnya"]} onChange={handleChange} placeholder="Tulis ISP..." required />
                )}
              </div>
            </div>
            <div>
              <label className="act-label">Site (History Database)</label>
              <input type="text" className="act-input" list="site-act-list" name="Site" value={formData["Site"]} onChange={handleChange} placeholder="Ketik / pilih site..." autoComplete="off" required />
              <datalist id="site-act-list">{siteOptions.map(s=><option key={s} value={s}/>)}</datalist>
            </div>

            <div>
              <label className="act-label">ID Pelanggan</label>
              <input type="text" className="act-input" name="ID Pelanggan" value={formData["ID Pelanggan"]} onChange={handleChange} placeholder="Misal: 1631322211" required />
            </div>
            <div>
              <label className="act-label">Nama Pelanggan</label>
              <input type="text" className="act-input" name="Nama Pelanggan" value={formData["Nama Pelanggan"]} onChange={handleChange} placeholder="Nama Lengkap..." required />
            </div>

            <div>
              <label className="act-label">Bandwidth</label>
              <div className="act-flex-row">
                <select className="act-input act-flex-1" name="BW_Select" value={formData["BW_Select"]} onChange={handleChange} required>
                  <option value="10Mbps">10 Mbps</option><option value="20Mbps">20 Mbps</option><option value="50Mbps">50 Mbps</option><option value="100Mbps">100 Mbps</option><option value="Lainnya">Lainnya...</option>
                </select>
                {formData["BW_Select"] === "Lainnya" && (
                  <input type="text" className="act-input act-flex-1" name="BW_Lainnya" value={formData["BW_Lainnya"]} onChange={handleChange} placeholder="Misal: 500Mbps" required />
                )}
              </div>
            </div>
            <div>
              <label className="act-label">PIC In Charge (NOC)</label>
              <select className="act-input" name="PIC" value={formData["PIC"]} onChange={handleChange} required>
                <option value="">-- Pilih NOC --</option><option value="Faidillah">Faidillah</option><option value="Yudi">Yudi</option><option value="Adit">Adit</option>
              </select>
            </div>

          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', marginTop:'25px', fontWeight:'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
            SUBMIT ACTIVATION
          </button>
        </form>
      </div>

      {/* ================= DASHBOARD ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Dashboard Aktivasi</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={fetchActivationData} style={{ padding: '8px 12px', background: '#e5e7eb', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '25px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
        <input type="text" className="act-input" placeholder="Cari ID/Nama (Pakai koma)..." value={searchPelanggan} onChange={e=>setSearchPelanggan(e.target.value)} style={{ flex: '1 1 200px' }} />
        <select className="act-input" value={filterService} onChange={e=>setFilterService(e.target.value)} style={{ flex: '1 1 150px' }}><option value="All">All Service</option><option value="GPON">GPON</option><option value="PPPoE">PPPoE</option></select>
        <select className="act-input" value={filterKerja} onChange={e=>setFilterKerja(e.target.value)} style={{ flex: '1 1 150px' }}><option value="All">All Tipe</option><option value="Aktivasi">Aktivasi</option><option value="Terminasi">Terminasi</option><option value="Upgrade">Upgrade</option></select>
        <div style={{ flex: '1 1 200px', minWidth: '200px' }}><Select isMulti options={siteOptions.map(s => ({value: s, label: s}))} value={filterSite} onChange={setFilterSite} placeholder="Filter Sites..." styles={customSelectStyles} menuPortalTarget={document.body} /></div>
        <select className="act-input" value={filterTimeType} onChange={e=>{setFilterTimeType(e.target.value); setFilterTimeValue('');}} style={{ flex: '1 1 120px' }}><option value="All">All Time</option><option value="Month">By Month</option><option value="Year">By Year</option></select>
        {filterTimeType === 'Month' && <select className="act-input" value={filterTimeValue} onChange={e=>setFilterTimeValue(e.target.value)} style={{ flex: '1 1 120px' }}><option value="">Pilih Bulan</option>{uniqueMonths.map(m=><option key={m} value={m}>{m}</option>)}</select>}
        {filterTimeType === 'Year' && <select className="act-input" value={filterTimeValue} onChange={e=>setFilterTimeValue(e.target.value)} style={{ flex: '1 1 120px' }}><option value="">Pilih Tahun</option>{uniqueYears.map(m=><option key={m} value={m}>{m}</option>)}</select>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #3b82f6' }}><h4 style={{ margin: '0 0 5px 0', color: '#6b7280' }}>Total Filtered</h4><h2 style={{ margin: 0, fontSize: '2rem' }}>{filteredData.length}</h2></div>
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #10b981' }}><h4 style={{ margin: '0 0 5px 0', color: '#6b7280' }}>Aktivasi & Upgrade</h4><h2 style={{ margin: 0, fontSize: '2rem' }}>{filteredData.filter(i=>i["Tipe Pekerjaan"]!=="Terminasi").length}</h2></div>
        <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #ef4444' }}><h4 style={{ margin: '0 0 5px 0', color: '#6b7280' }}>Terminasi</h4><h2 style={{ margin: 0, fontSize: '2rem' }}>{filteredData.filter(i=>i["Tipe Pekerjaan"]==="Terminasi").length}</h2></div>
      </div>

      {/* Chart Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #f3f4f6', marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', color: '#374151' }}>Top 10 Site (Aktivasi, Upgrade & Terminasi)</h3>
        <div style={{ width: '100%', height: 300 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="Total" position="top" fill="#4b5563" fontSize={12} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : ( <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Tidak ada data pada rentang waktu/site ini.</div> )}
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6', overflowX: 'auto' }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Riwayat Pekerjaan</h3>
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px', fontSize: '0.85rem' }}>
            <thead style={{ background: '#f9fafb' }}><tr>{['No FAB/FAT', 'ID Pelanggan', 'Pelanggan', 'Site', 'ISP', 'Service', 'Pekerjaan', 'Bandwidth', 'Tanggal', 'Aksi'].map(h=><th key={h} style={{padding:'12px 15px', color: '#4b5563'}}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredData.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{padding:'10px 15px', fontWeight: '600'}}>{r["No: FAB/FAT"]}</td>
                  <td style={{padding:'10px 15px'}}>{r["ID Pelanggan"]}</td>
                  <td style={{padding:'10px 15px'}}>{r["Nama Pelanggan"]}</td>
                  <td style={{padding:'10px 15px'}}>{r["Site"]}</td>
                  <td style={{padding:'10px 15px'}}>{r["Nama ISP"]}</td>
                  <td style={{padding:'10px 15px'}}>{r["Tipe Service"]}</td>
                  <td style={{padding:'10px 15px'}}><span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: r["Tipe Pekerjaan"] === "Aktivasi" ? '#d1fae5' : r["Tipe Pekerjaan"] === "Upgrade" ? '#fef3c7' : '#fee2e2', color: r["Tipe Pekerjaan"] === "Aktivasi" ? '#059669' : r["Tipe Pekerjaan"] === "Upgrade" ? '#d97706' : '#dc2626' }}>{r["Tipe Pekerjaan"]}</span></td>
                  <td style={{padding:'10px 15px'}}>{r["Bandwidth"]}</td>
                  <td style={{padding:'10px 15px'}}>{r["Tanggal RFS"]}</td>
                  <td style={{padding:'10px 15px'}}><button onClick={()=>setViewData(r)} style={{padding:'6px 12px', background: '#e5e7eb', borderRadius: '6px', border: '1px solid #d1d5db', cursor:'pointer', fontWeight: 'bold', fontSize: '0.75rem'}}>Lihat</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', boxSizing: 'border-box' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '700px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', background: '#f9fafb', borderRadius: '12px 12px 0 0' }}><h3 style={{ margin:0 }}>Detail: <span style={{color: '#3b82f6'}}>{viewData["No: FAB/FAT"]}</span></h3><button onClick={()=>setViewData(null)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>&times;</button></div>
            <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {Object.entries(viewData).map(([k, v]) => (!k.startsWith('_') && k.trim() ? <div key={k} style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px' }}><span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{k}</span><div style={{ wordBreak: 'break-word', fontSize: '0.95rem', color: '#1f2937' }}>{v || '-'}</div></div> : null))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ActivationEntry;