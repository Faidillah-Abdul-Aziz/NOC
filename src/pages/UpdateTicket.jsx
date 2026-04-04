import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Select from 'react-select';

const UpdateTicket = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [tableSla, setTableSla] = useState('All');
  const [tableCategory, setTableCategory] = useState('All'); 
  const [tableSite, setTableSite] = useState([]); 
  const [tableStatus, setTableStatus] = useState('Active'); 
  const [searchCustomer, setSearchCustomer] = useState(''); 
  const [searchTicket, setSearchTicket] = useState(''); 

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ resolvedTime: '', finishStopClock: '', rootCause: '', statusTT: '', progressUpdate: '', restorationAction: '' });
  const [viewTicket, setViewTicket] = useState(null);

  const fetchTickets = async () => {
    try { setLoading(true); const response = await fetch(API_URL); const result = await response.json();
      if (result.status === "success" && result.data) { 
        // Reverse diaplikasikan di sini langsung setelah fetch
        setData(result.data.filter(item => item["TT No"] && item["TT No"].trim() !== "").reverse()); 
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, []);

  const siteOptions = [...new Set(data.map(item => item["Site"]).filter(Boolean))].map(site => ({ value: site, label: site }));

  // Tanpa reverse lagi di sini agar datanya tidak berbalik ke bentuk lama
  const filteredData = data.filter(item => {
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
    setFormData({ resolvedTime: ticket["Resolved Time"] || '', finishStopClock: ticket["Finish Stop Clock"] || '', rootCause: ticket["Root Cause"] || '', statusTT: ticket["Status TT"] || 'OPEN', progressUpdate: ticket["Progress Update"] || '', restorationAction: ticket["Restoration Action"] || '' });
    setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }, 100);
  };

  const handleFormChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      setIsSubmitting(true);
      await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'update', ttNo: selectedTicket["TT No"], ...formData }) });
      alert(`Tiket ${selectedTicket["TT No"]} berhasil diupdate!`);
      setSelectedTicket(null); fetchTickets(); 
    } catch (error) { alert("Gagal mengupdate."); } finally { setIsSubmitting(false); }
  };

  const renderDetailWaktu = (row) => {
    if ((row["Start Stop Clock"] || "-") === "-" && (row["Finish Stop Clock"] || "-") === "-") return "-";
    return (<div style={{ fontSize: '0.8rem' }}><span style={{ color: '#059669', fontWeight: 'bold' }}>Start:</span> {row["Start Stop Clock"]}<br/><span style={{ color: '#dc2626', fontWeight: 'bold' }}>Finish:</span> {row["Finish Stop Clock"]}</div>);
  };

  const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' };

  return (
    <div style={{ color: '#1f2937', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Update Trouble Ticket</h2>
        <button onClick={fetchTickets} disabled={loading} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>🔄 Refresh</button>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #f3f4f6', marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <div><h3 style={{ margin: 0, display: 'inline-block', marginRight: '10px' }}>Daftar Tiket</h3><span style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '4px 8px', borderRadius: '12px' }}>Showing {filteredData.length} entries</span></div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Cari No Tiket..." value={searchTicket} onChange={(e) => setSearchTicket(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Nama Customer..." value={searchCustomer} onChange={(e) => setSearchCustomer(e.target.value)} style={inputStyle} />
            <select value={tableSla} onChange={e => setTableSla(e.target.value)} style={inputStyle}><option value="All">All SLA</option><option value="In SLA">In SLA</option><option value="Out SLA">Out SLA</option></select>
            <select value={tableCategory} onChange={e => setTableCategory(e.target.value)} style={inputStyle}>
              <option value="All">All Category</option><option value="Retail">Retail</option><option value="Enterprise">Enterprise</option>
            </select>
            <div style={{ minWidth: '150px' }}><Select isMulti options={siteOptions} value={tableSite} onChange={setTableSite} placeholder="Sites..." styles={{ control: (b) => ({...b, minHeight:'34px', borderRadius:'6px', borderColor:'#d1d5db'}) }} menuPortalTarget={document.body} /></div>
            <select value={tableStatus} onChange={e => setTableStatus(e.target.value)} style={{...inputStyle, fontWeight:'bold'}}><option value="Active">Hanya OPEN</option><option value="Closed">Hanya CLOSED</option><option value="All">SEMUA STATUS</option></select>
          </div>
        </div>

        {/* Kontainer Tabel dengan batas tinggi max 320px (sekitar 5 baris) */}
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '320px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: '1000px' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
              <tr>{['TT No', 'Customer', 'Category', 'Detail Waktu', 'Status', 'Deskripsi Awal', 'Progress Update', 'Action'].map(h => (<th key={h} style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{h}</th>))}</tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => {
                const isOpen = row["Status TT"]?.toLowerCase().includes("open");
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: selectedTicket && selectedTicket["TT No"] === row["TT No"] ? '#eff6ff' : 'transparent' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{row["TT No"]}</td>
                    <td style={{ padding: '12px 15px' }}>{row["ID dan Nama Customer"]}</td>
                    <td style={{ padding: '12px 15px' }}>{row["Category"]}</td>
                    <td style={{ padding: '12px 15px', whiteSpace: 'nowrap' }}>{renderDetailWaktu(row)}</td>
                    <td style={{ padding: '12px 15px' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold', background: isOpen ? '#fef3c7' : '#d1fae5', color: isOpen ? '#d97706' : '#059669' }}>{row["Status TT"]}</span></td>
                    <td style={{ padding: '12px 15px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row["Deskripsi Awal"] || row["Deskripsi"]}</td>
                    <td style={{ padding: '12px 15px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row["Progress Update"]}</td>
                    <td style={{ padding: '12px 15px', display: 'flex', gap: '5px' }}>
                      <button onClick={() => setViewTicket(row)} style={{ padding: '5px 10px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Lihat</button>
                      <button onClick={() => handleSelectTicket(row)} style={{ padding: '5px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Update</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM UPDATE */}
      {selectedTicket && (
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '25px', borderTop: '5px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Update: <span style={{ color: '#3b82f6' }}>{selectedTicket["TT No"]}</span></h3>
            <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>✕ Batal</button>
          </div>
          <form onSubmit={handleSubmitUpdate}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: '1 1 calc(50% - 20px)', minWidth: '280px' }}>
                <h4 style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '8px' }}>Manajemen Waktu</h4>
                <div style={{ marginBottom: '15px' }}><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.85rem'}}>Resolved Time</label><input type="datetime-local" style={{width:'100%', padding:'10px', boxSizing:'border-box', border:'1px solid #d1d5db', borderRadius:'6px'}} name="resolvedTime" value={formData.resolvedTime} onChange={handleFormChange} /></div>
                <div style={{ marginBottom: '15px' }}><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.85rem'}}>Finish Stop Clock</label><input type="datetime-local" style={{width:'100%', padding:'10px', boxSizing:'border-box', border:'1px solid #d1d5db', borderRadius:'6px'}} name="finishStopClock" value={formData.finishStopClock} onChange={handleFormChange} /></div>
              </div>
              <div style={{ flex: '1 1 calc(50% - 20px)', minWidth: '280px' }}>
                <h4 style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '8px' }}>Detail Penanganan</h4>
                <div style={{ marginBottom: '15px' }}><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.85rem'}}>Status TT</label><select style={{width:'100%', padding:'10px', boxSizing:'border-box', border:'1px solid #d1d5db', borderRadius:'6px'}} name="statusTT" value={formData.statusTT} onChange={handleFormChange}><option value="OPEN">OPEN</option><option value="PENDING">PENDING</option><option value="CLOSED">CLOSED</option></select></div>
                <div style={{ marginBottom: '15px' }}><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.85rem'}}>Root Cause</label><input type="text" style={{width:'100%', padding:'10px', boxSizing:'border-box', border:'1px solid #d1d5db', borderRadius:'6px'}} name="rootCause" value={formData.rootCause} onChange={handleFormChange} /></div>
                <div style={{ marginBottom: '15px' }}><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.85rem'}}>Progress Update</label><textarea style={{width:'100%', padding:'10px', boxSizing:'border-box', border:'1px solid #d1d5db', borderRadius:'6px'}} name="progressUpdate" value={formData.progressUpdate} onChange={handleFormChange}></textarea></div>
                <div style={{ marginBottom: '15px' }}><label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.85rem'}}>Restoration Action</label><textarea style={{width:'100%', padding:'10px', boxSizing:'border-box', border:'1px solid #d1d5db', borderRadius:'6px'}} name="restorationAction" value={formData.restorationAction} onChange={handleFormChange}></textarea></div>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '15px', background: '#10b981', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '8px', marginTop: '15px', cursor: 'pointer', fontSize: '1.05rem' }}>{isSubmitting ? 'Menyimpan...' : 'Simpan Update'}</button>
          </form>
        </div>
      )}

      {viewTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', boxSizing: 'border-box' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '700px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}><h3 style={{ margin:0 }}>Detail Tiket</h3><button onClick={() => setViewTicket(null)} style={{ background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer' }}>&times;</button></div>
            <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {Object.entries(viewTicket).map(([k, v]) => (!k.trim() ? null : <div key={k} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}><strong style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{k}</strong><div style={{ wordBreak: 'break-word', fontSize: '0.9rem' }}>{v || '-'}</div></div>))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UpdateTicket;