import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

const TicketEntry = () => {
  const [loading, setLoading] = useState(false);
  
  // State untuk menyimpan opsi saran dari Database (Sudah diurutkan berdasarkan frekuensi)
  const [deskripsiOptions, setDeskripsiOptions] = useState([]);
  const [progressOptions, setProgressOptions] = useState([]);
  const [restorationOptions, setRestorationOptions] = useState([]);
  
  // STATE DEFAULT 
  const [formData, setFormData] = useState({
    "Impact service": "",
    "Media Info": "Messenger", 
    "Deskripsi": "",
    "ID dan Nama Customer": "",
    "ISP_Select": "IdeaNet", 
    "ISP_Lainnya": "", 
    "Cluster": "",
    "Type Cluster": "Non VIP", 
    "Progress Update": "",
    "Start Time": "",
    "Response Time": "",
    "Resolved Time": "",
    "Start Stop Clock": "",
    "Finish Stop Clock": "",
    "Restoration Action": "",
    "Root_Cause_Cat": "",
    "Root_Cause_Sub": "",
    "Root_Cause_Manual": "", 
    "Visit or No Visit": "",
    "Product": "Internet", 
    "PIC_Select": "Ideanet", 
    "PIC_Lainnya": "", 
    "Source": "Manual", 
    "Status TT": "Open", 
    "Network IDI": "Yes", 
    "NOC": "",
    "Site": "",
    "Category": "",
  });

  // --- FUNGSI MENGHITUNG FREKUENSI & MENGURUTKAN DATA ---
  const getSortedByFrequency = (dataArray, key1, key2) => {
    const counts = {};
    dataArray.forEach(item => {
      const val = item[key1] || (key2 ? item[key2] : null);
      if (val && typeof val === 'string' && val.trim() !== '') {
        const trimmedVal = val.trim();
        counts[trimmedVal] = (counts[trimmedVal] || 0) + 1;
      }
    });
    // Urutkan berdasarkan value (jumlah terbanyak) ke terkecil
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  };

  // --- TARIK DATA DARI DATABASE SAAT HALAMAN DIBUKA ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (result.status === "success" && result.data) {
          const data = result.data;
          
          // Menggunakan fungsi frekuensi untuk mendapatkan array yang terurut
          const sortedDeskripsi = getSortedByFrequency(data, "Deskripsi", "Deskripsi Awal");
          const sortedProgress = getSortedByFrequency(data, "Progress Update");
          const sortedRestoration = getSortedByFrequency(data, "Restoration Action");
          
          setDeskripsiOptions(sortedDeskripsi);
          setProgressOptions(sortedProgress);
          setRestorationOptions(sortedRestoration);
        }
      } catch (error) {
        console.error("Gagal menarik data untuk auto-suggest:", error);
      }
    };

    fetchSuggestions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    
    // Logika ISP
    payload["ISP"] = payload["ISP_Select"] === "Lainnya" ? payload["ISP_Lainnya"] : payload["ISP_Select"];
    delete payload["ISP_Select"];
    delete payload["ISP_Lainnya"];

    // Logika PIC
    payload["PIC"] = payload["PIC_Select"] === "Lainnya" ? payload["PIC_Lainnya"] : payload["PIC_Select"];
    delete payload["PIC_Select"];
    delete payload["PIC_Lainnya"];

    // Logika Root Cause
    let finalRootCause = "";
    if (payload["Root_Cause_Cat"] === "Lainnya") {
      finalRootCause = payload["Root_Cause_Manual"];
    } else if (payload["Root_Cause_Sub"] === "Lainnya") {
      finalRootCause = payload["Root_Cause_Cat"] + " " + payload["Root_Cause_Manual"];
    } else if (payload["Root_Cause_Cat"] && payload["Root_Cause_Sub"]) {
      finalRootCause = payload["Root_Cause_Cat"] + " " + payload["Root_Cause_Sub"];
    } else {
      finalRootCause = payload["Root_Cause_Cat"] || "";
    }
    
    payload["Root Cause"] = finalRootCause.trim();
    
    delete payload["Root_Cause_Cat"];
    delete payload["Root_Cause_Sub"];
    delete payload["Root_Cause_Manual"];

    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });

      alert("Tiket berhasil disimpan ke Database NOC!");
      
      // Reset state ke default
      setFormData({
        "Impact service": "", "Media Info": "Messenger", "Deskripsi": "", "ID dan Nama Customer": "",
        "ISP_Select": "IdeaNet", "ISP_Lainnya": "", "Cluster": "", "Type Cluster": "Non VIP", "Progress Update": "",
        "Start Time": "", "Response Time": "", "Resolved Time": "", "Start Stop Clock": "",
        "Finish Stop Clock": "", "Restoration Action": "", "Root_Cause_Cat": "", "Root_Cause_Sub": "", "Root_Cause_Manual": "", 
        "Visit or No Visit": "", "Product": "Internet", "PIC_Select": "Ideanet", "PIC_Lainnya": "", "Source": "Manual", "Status TT": "Open",
        "Network IDI": "Yes", "NOC": "", "Site": "", "Category": ""
      });
      
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal koneksi. Cek internet atau URL API Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', color: '#1f2937' }}>Form Entry Trouble Ticket</h2>
      <form onSubmit={handleSubmit}>

        {/* --- 1. IDENTITAS PELANGGAN --- */}
        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#166534' }}>1. Identitas Pelanggan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            
            <div className="form-group">
              <label>ID dan Nama Customer</label>
              <input type="text" className="form-control" name="ID dan Nama Customer" value={formData["ID dan Nama Customer"]} onChange={handleChange} placeholder="Tulis ID dan Nama..." required />
            </div>

            <div className="form-group">
              <label>Site</label>
              <input type="text" className="form-control" name="Site" value={formData["Site"]} onChange={handleChange} placeholder="Lokasi site..." required />
            </div>

            <div className="form-group">
              <label>ISP</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select className="form-control" name="ISP_Select" value={formData["ISP_Select"]} onChange={handleChange} required>
                  <option value="">-- Pilih ISP --</option>
                  <option value="IdeaNet">IdeaNet</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
                {formData["ISP_Select"] === "Lainnya" && (
                  <input type="text" className="form-control" name="ISP_Lainnya" value={formData["ISP_Lainnya"]} onChange={handleChange} placeholder="Ketik ISP lain..." required />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Cluster</label>
                <select className="form-control" name="Cluster" value={formData["Cluster"]} onChange={handleChange} required>
                  <option value="">-- Pilih Cluster --</option>
                  <option value="Jawa Tengah">Jawa Tengah</option>
                  <option value="Jawa Barat">Jawa Barat</option>
                  <option value="Jawa Timur">Jawa Timur</option>
                  <option value="Jabodetabek">Jabodetabek</option>
                  <option value="Bali">Bali</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Type Cluster</label>
                <select className="form-control" name="Type Cluster" value={formData["Type Cluster"]} onChange={handleChange} required>
                  <option value="">-- Type --</option>
                  <option value="VIP">VIP</option>
                  <option value="Non VIP">Non VIP</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select className="form-control" name="Category" value={formData["Category"]} onChange={handleChange} required>
                <option value="">-- Pilih Kategori --</option>
                <option value="Retail">Retail</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div className="form-group">
              <label>Product</label>
              <select className="form-control" name="Product" value={formData["Product"]} onChange={handleChange} required>
                <option value="">-- Pilih Produk --</option>
                <option value="Internet">Internet</option>
                <option value="IPTV">IPTV</option>
              </select>
            </div>

          </div>
        </div>

        {/* --- 2. DETAIL GANGGUAN & LAPORAN --- */}
        <div style={{ padding: '20px', backgroundColor: '#fdf2f2', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#991b1b' }}>2. Detail Gangguan & Laporan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            
            <div className="form-group">
              <label>Source Laporan</label>
              <select className="form-control" name="Source" value={formData["Source"]} onChange={handleChange} required>
                <option value="">-- Pilih Source --</option>
                <option value="Manual">Manual</option>
                <option value="BOT">BOT</option>
              </select>
            </div>

            <div className="form-group">
              <label>Media Info</label>
              <select className="form-control" name="Media Info" value={formData["Media Info"]} onChange={handleChange} required>
                <option value="">-- Pilih Media --</option>
                <option value="Messenger">Messenger</option>
                <option value="Alert">Alert</option>
                <option value="Ticket">Ticket</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div className="form-group">
              <label>Impact Service</label>
              <select className="form-control" name="Impact service" value={formData["Impact service"]} onChange={handleChange} required>
                <option value="">-- Impact? --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label>Network IDI</label>
              <select className="form-control" name="Network IDI" value={formData["Network IDI"]} onChange={handleChange} required>
                <option value="">-- Network IDI? --</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* --- DESKRIPSI (DYNAMIC SUGGESTION) --- */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Deskripsi (Kronologi)</label>
              <input 
                type="text" 
                className="form-control" 
                name="Deskripsi" 
                list="deskripsi-list"
                value={formData["Deskripsi"]} 
                onChange={handleChange} 
                placeholder="Ketik atau pilih deskripsi dari database..." 
                autoComplete="off"
                required 
              />
              <datalist id="deskripsi-list">
                {deskripsiOptions.map((saran, idx) => <option key={idx} value={saran} />)}
              </datalist>
            </div>

          </div>
        </div>

        {/* --- 3. WAKTU PENGERJAAN --- */}
        <div style={{ padding: '20px', backgroundColor: '#fff7ed', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#9a3412' }}>3. Manajemen Waktu</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            
            <div className="form-group">
              <label>Start Time</label>
              <input type="datetime-local" className="form-control" name="Start Time" value={formData["Start Time"]} onChange={handleChange} />
            </div>
            
            <div className="form-group">
              <label>Response Time</label>
              <input type="datetime-local" className="form-control" name="Response Time" value={formData["Response Time"]} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Resolved Time</label>
              <input type="datetime-local" className="form-control" name="Resolved Time" value={formData["Resolved Time"]} onChange={handleChange} />
            </div>

            <div className="form-group"></div>

            <div className="form-group">
              <label>Start Stop Clock (Pause)</label>
              <input type="datetime-local" className="form-control" name="Start Stop Clock" value={formData["Start Stop Clock"]} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Finish Stop Clock (Resume)</label>
              <input type="datetime-local" className="form-control" name="Finish Stop Clock" value={formData["Finish Stop Clock"]} onChange={handleChange} />
            </div>

          </div>
        </div>

        {/* --- 4. DETAIL PENANGANAN NOC --- */}
        <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '10px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#1e3a8a' }}>4. Detail Penanganan NOC</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

            <div className="form-group">
              <label>NOC In Charge</label>
              <select className="form-control" name="NOC" value={formData["NOC"]} onChange={handleChange} required>
                <option value="">-- Pilih NOC --</option>
                <option value="Faidillah">Faidillah</option>
                <option value="Yudi">Yudi</option>
                <option value="Adit">Adit</option>
                <option value="Miko">Miko</option>
              </select>
            </div>

            <div className="form-group">
              <label>PIC Eksternal</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <select className="form-control" name="PIC_Select" value={formData["PIC_Select"]} onChange={handleChange}>
                  <option value="">-- Pilih PIC --</option>
                  <option value="Ideanet">Ideanet</option>
                  <option value="BersamaNet">BersamaNet</option>
                  <option value="FMI">FMI</option>
                  <option value="Moratel">Moratel</option>
                  <option value="Hiber">Hiber</option>
                  <option value="BLiP">BLiP</option>
                  <option value="FirstMedia">FirstMedia</option>
                  <option value="IOH">IOH</option>
                  <option value="TIS">TIS</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
                {formData["PIC_Select"] === "Lainnya" && (
                  <input type="text" className="form-control" name="PIC_Lainnya" value={formData["PIC_Lainnya"]} onChange={handleChange} placeholder="Ketik PIC lain..." />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', gridColumn: 'span 2' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Kategori Root Cause</label>
                <select className="form-control" name="Root_Cause_Cat" value={formData["Root_Cause_Cat"]} onChange={handleChange}>
                  <option value="">-- Pilih Kategori --</option>
                  <option value="Configuration">Configuration</option>
                  <option value="FO">FO</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Lainnya">Lainnya (Tulis Manual)</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Detail Root Cause</label>
                {formData["Root_Cause_Cat"] === "Lainnya" ? (
                  <input type="text" className="form-control" name="Root_Cause_Manual" value={formData["Root_Cause_Manual"]} onChange={handleChange} placeholder="Ketik kategori & detail manual..." />
                ) : (
                  <select className="form-control" name="Root_Cause_Sub" value={formData["Root_Cause_Sub"]} onChange={handleChange} disabled={!formData["Root_Cause_Cat"]}>
                    <option value="">-- Pilih Detail --</option>
                    {formData["Root_Cause_Cat"] === "Configuration" && (
                      <><option value="Core">Core</option><option value="ONT">ONT</option><option value="Switch">Switch</option><option value="Lainnya">Lainnya...</option></>
                    )}
                    {formData["Root_Cause_Cat"] === "FO" && (
                      <><option value="Access">Access</option><option value="Backbone">Backbone</option><option value="OLT-FDT">OLT-FDT</option><option value="Lainnya">Lainnya...</option></>
                    )}
                    {formData["Root_Cause_Cat"] === "Equipment" && (
                      <><option value="ONT">ONT</option><option value="Switch">Switch</option><option value="Router">Router</option><option value="Lainnya">Lainnya...</option></>
                    )}
                  </select>
                )}
              </div>
            </div>

            {formData["Root_Cause_Sub"] === "Lainnya" && formData["Root_Cause_Cat"] !== "Lainnya" && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Tulis Detail Manual untuk {formData["Root_Cause_Cat"]}</label>
                <input type="text" className="form-control" name="Root_Cause_Manual" value={formData["Root_Cause_Manual"]} onChange={handleChange} placeholder="Ketik detail spesifik..." />
              </div>
            )}

            <div className="form-group">
              <label>Visit or No Visit</label>
              <select className="form-control" name="Visit or No Visit" value={formData["Visit or No Visit"]} onChange={handleChange}>
                <option value="">-- Status Visit --</option>
                <option value="Visit">Visit</option>
                <option value="No Visit">No Visit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status TT</label>
              <select className="form-control" name="Status TT" value={formData["Status TT"]} onChange={handleChange} required>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* --- PROGRESS UPDATE (DYNAMIC SUGGESTION) --- */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Progress Update</label>
              <input 
                type="text" 
                className="form-control" 
                name="Progress Update" 
                list="progress-list"
                value={formData["Progress Update"]} 
                onChange={handleChange} 
                placeholder="Ketik atau pilih dari database..." 
                autoComplete="off"
              />
              <datalist id="progress-list">
                {progressOptions.map((saran, idx) => <option key={idx} value={saran} />)}
              </datalist>
            </div>

            {/* --- RESTORATION ACTION (DYNAMIC SUGGESTION) --- */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Restoration Action</label>
              <input 
                type="text" 
                className="form-control" 
                name="Restoration Action" 
                list="restoration-list"
                value={formData["Restoration Action"]} 
                onChange={handleChange} 
                placeholder="Ketik atau pilih dari database..." 
                autoComplete="off"
              />
              <datalist id="restoration-list">
                {restorationOptions.map((saran, idx) => <option key={idx} value={saran} />)}
              </datalist>
            </div>

          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading} style={{ padding: '15px', fontSize: '1.1rem' }}>
          {loading ? "Menyimpan ke Database..." : "SUBMIT TICKET"}
        </button>

      </form>
    </div>
  );
};

export default TicketEntry;