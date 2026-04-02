import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import Select from 'react-select';

const UpdateTicket = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk Filter Tabel Atas
  const [tableSla, setTableSla] = useState('All');
  const [tableSite, setTableSite] = useState([]); 
  const [tableCluster, setTableCluster] = useState('All');

  // State untuk Form Update
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    resolvedTime: '',
    finishStopClock: '',
    rootCause: '',
    statusTT: '',
    progressUpdate: '',
    restorationAction: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === "success" && result.data) {
        const activeTickets = result.data.filter(item => 
          item["TT No"] && 
          item["TT No"].trim() !== "" && 
          item["Status TT"] && 
          item["Status TT"].toLowerCase().includes("open")
        );
        setData(activeTickets.reverse());
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING LOGIC ---
  const uniqueSites = [...new Set(data.map(item => item["Site"]).filter(Boolean))];
  const uniqueClusters = [...new Set(data.map(item => item["Cluster"]).filter(Boolean))];
  const siteOptions = uniqueSites.map(site => ({ value: site, label: site }));

  const filteredData = data.filter(item => {
    if (tableSla === 'In SLA' && !(item["SLA Real"] && item["SLA Real"].toLowerCase().includes("in"))) return false;
    if (tableSla === 'Out SLA' && !(item["SLA Real"] && item["SLA Real"].toLowerCase().includes("out"))) return false;
    if (tableCluster !== 'All' && item["Cluster"] !== tableCluster) return false;
    if (tableSite.length > 0 && !tableSite.some(option => option.value === item["Site"])) return false;
    return true;
  });

  // --- HANDLERS ---
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      resolvedTime: ticket["Resolved Time"] || '', // Handle format waktu jika perlu disesuaikan dengan input datetime-local
      finishStopClock: ticket["Finish Stop Clock"] || '',
      rootCause: ticket["Root Cause"] || '',
      statusTT: ticket["Status TT"] || 'OPEN',
      progressUpdate: ticket["Progress Update"] || '',
      restorationAction: ticket["Restoration Action"] || ''
    });
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const payload = {
      action: 'update',
      ttNo: selectedTicket["TT No"],
      resolvedTime: formData.resolvedTime,
      finishStopClock: formData.finishStopClock,
      rootCause: formData.rootCause,
      statusTT: formData.statusTT,
      progressUpdate: formData.progressUpdate,
      restorationAction: formData.restorationAction
    };

    try {
      setIsSubmitting(true);
      
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      alert(`Tiket ${selectedTicket["TT No"]} berhasil diupdate!`);
      setSelectedTicket(null); 
      fetchTickets(); 
      
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Gagal mengupdate tiket. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STYLES ---
  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', marginBottom: '25px' };
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4b5563', fontSize: '0.85rem' };

  const customSelectStyles = {
    control: (base) => ({ ...base, minHeight: '34px', borderRadius: '6px', borderColor: '#d1d5db', fontSize: '0.85rem' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  };

  if (loading && data.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><h2>Memuat Data Tiket... ⏳</h2></div>;
  }

  return (
    <div style={{ color: '#1f2937', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Update Trouble Ticket</h2>
      </div>

      {/* TABEL TIKET OPEN */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Daftar Tiket Aktif</h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Menampilkan tiket dengan status OPEN/PENDING</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select value={tableSla} onChange={e => setTableSla(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
              <option value="All">All SLA</option>
              <option value="In SLA">In SLA</option>
              <option value="Out SLA">Out SLA</option>
            </select>
            
            <div style={{ width: '220px' }}>
              <Select
                isMulti
                options={siteOptions}
                value={tableSite}
                onChange={setTableSite}
                placeholder="Search Sites..."
                styles={customSelectStyles}
                menuPortalTarget={document.body}
              />
            </div>

            <select value={tableCluster} onChange={e => setTableCluster(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}>
              <option value="All">All Clusters</option>
              {uniqueClusters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '400px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1 }}>
              <tr>
                {['TT No', 'Customer', 'Cluster', 'Root Cause', 'Category', 'Detail Waktu', 'Status', 'Deskripsi Awal', 'Progress Update', 'Restoration Action', 'Action'].map(head => (
                  <th key={head} style={{ padding: '12px 15px', fontWeight: '600', color: '#4b5563', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: selectedTicket && selectedTicket["TT No"] === row["TT No"] ? '#eff6ff' : 'transparent' }}>
                  <td style={{ padding: '10px 15px', fontWeight: '500' }}>{row["TT No"]}</td>
                  <td style={{ padding: '10px 15px' }}>{row["ID dan Nama Customer"]}</td>
                  <td style={{ padding: '10px 15px' }}>{row["Cluster"]}</td>
                  <td style={{ padding: '10px 15px' }}>{row["Root Cause"] || '-'}</td>
                  <td style={{ padding: '10px 15px' }}>{row["Category"]}</td>
                  <td style={{ padding: '10px 15px' }}>{row["Waktu"] || row["Tanggal"] || '-'}</td>
                  <td style={{ padding: '10px 15px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '20px', fontWeight: '600', fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#d97706' }}>
                      {row["Status TT"]}
                    </span>
                  </td>
                  <td style={{ padding: '10px 15px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row["Deskripsi Awal"] || row["Deskripsi"] || '-'}</td>
                  <td style={{ padding: '10px 15px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row["Progress Update"] || '-'}</td>
                  <td style={{ padding: '10px 15px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row["Restoration Action"] || '-'}</td>
                  <td style={{ padding: '10px 15px' }}>
                    <button 
                      onClick={() => handleSelectTicket(row)}
                      style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (<tr><td colSpan="11" style={{ padding: '20px', textAlign: 'center' }}>Tidak ada tiket aktif yang perlu diupdate.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM UPDATE TIKET */}
      {selectedTicket && (
        <div style={{ ...cardStyle, borderTop: '5px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Form Update: <span style={{ color: '#3b82f6' }}>{selectedTicket["TT No"]}</span></h3>
            <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕ Batal</button>
          </div>

          <form onSubmit={handleSubmitUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              
              {/* Kolom Kiri: Manajemen Waktu */}
              <div>
                <h4 style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '5px', color: '#374151', marginBottom: '15px' }}>Manajemen Waktu</h4>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Resolved Time</label>
                  <input type="datetime-local" name="resolvedTime" value={formData.resolvedTime} onChange={handleFormChange} style={inputStyle} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Finish Stop Clock</label>
                  <input type="datetime-local" name="finishStopClock" value={formData.finishStopClock} onChange={handleFormChange} style={inputStyle} />
                </div>
              </div>

              {/* Kolom Kanan: Detail Penanganan */}
              <div>
                <h4 style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '5px', color: '#374151', marginBottom: '15px' }}>Detail Penanganan</h4>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Status TT Saat Ini</label>
                  <select name="statusTT" value={formData.statusTT} onChange={handleFormChange} style={inputStyle}>
                    <option value="OPEN">OPEN</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Root Cause</label>
                  <input type="text" name="rootCause" value={formData.rootCause} onChange={handleFormChange} placeholder="Contoh: FO Cut, Power Down..." style={inputStyle} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Progress Update</label>
                  <textarea name="progressUpdate" value={formData.progressUpdate} onChange={handleFormChange} rows="3" placeholder="Tuliskan progress pengerjaan..." style={{ ...inputStyle, resize: 'vertical' }}></textarea>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={labelStyle}>Restoration Action</label>
                  <textarea name="restorationAction" value={formData.restorationAction} onChange={handleFormChange} rows="3" placeholder="Tindakan restorasi yang dilakukan..." style={{ ...inputStyle, resize: 'vertical' }}></textarea>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <button type="submit" disabled={isSubmitting} style={{ padding: '10px 24px', backgroundColor: isSubmitting ? '#9ca3af' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Update'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UpdateTicket;