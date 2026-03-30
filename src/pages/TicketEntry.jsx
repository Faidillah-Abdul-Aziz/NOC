import React, { useState } from 'react';
import { API_URL } from '../config';

const TicketEntry = () => {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    "Impact service": "",
    "Media Info": "",
    "Deskripsi": "",
    "ID dan Nama Customer": "",
    "ISP_Select": "", 
    "ISP_Lainnya": "", 
    "Cluster": "",
    "Type Cluster": "", // Tambahan kolom baru
    "Progress Update": "",
    "Start Time": "",
    "Response Time": "",
    "Resolved Time": "",
    "Start Stop Clock": "",
    "Finish Stop Clock": "",
    "Restoration Action": "",
    "Root Cause": "",
    "Visit or No Visit": "",
    "Product": "",
    "PIC_Select": "", 
    "PIC_Lainnya": "", 
    "Source": "",
    "Status TT": "Open", 
    "Network IDI": "",
    "NOC": "",
    "Site": "",
    "Category": "",
    "Risk Severity": "",
    "Priority": ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    
    // Logika penggabungan ISP
    payload["ISP"] = payload["ISP_Select"] === "Lainnya" ? payload["ISP_Lainnya"] : payload["ISP_Select"];
    delete payload["ISP_Select"];
    delete payload["ISP_Lainnya"];

    // Logika penggabungan PIC
    payload["PIC"] = payload["PIC_Select"] === "Lainnya" ? payload["PIC_Lainnya"] : payload["PIC_Select"];
    delete payload["PIC_Select"];
    delete payload["PIC_Lainnya"];

    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });

      alert("Tiket berhasil disimpan ke Database NOC!");
      
      setFormData({
        "Impact service": "", "Media Info": "", "Deskripsi": "", "ID dan Nama Customer": "",
        "ISP_Select": "", "ISP_Lainnya": "", "Cluster": "", "Type Cluster": "", "Progress Update": "",
        "Start Time": "", "Response Time": "", "Resolved Time": "", "Start Stop Clock": "",
        "Finish Stop Clock": "", "Restoration Action": "", "Root Cause": "", "Visit or No Visit": "",
        "Product": "", "PIC_Select": "", "PIC_Lainnya": "", "Source": "", "Status TT": "Open",
        "Network IDI": "", "NOC": "", "Site": "", "Category": "", "Risk Severity": "", "Priority": ""
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

            {/* --- BAGIAN CLUSTER YANG DIBAGI DUA (HALF & HALF) --- */}
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

            <div className="form-group">
              <label>Risk Severity</label>
              <select className="form-control" name="Risk Severity" value={formData["Risk Severity"]} onChange={handleChange} required>
                <option value="">-- Pilih Severity --</option>
                <option value="Very Low">Very Low</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" name="Priority" value={formData["Priority"]} onChange={handleChange} required>
                <option value="">-- Pilih Prioritas --</option>
                <option value="Very Low">Very Low</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Very High">Very High</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Deskripsi (Kronologi)</label>
              <textarea className="form-control" name="Deskripsi" rows="2" value={formData["Deskripsi"]} onChange={handleChange} placeholder="Tulis deskripsi awal..." required></textarea>
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

            <div className="form-group">
              <label>Root Cause</label>
              <select className="form-control" name="Root Cause" value={formData["Root Cause"]} onChange={handleChange}>
                <option value="">-- Pilih Root Cause --</option>
                <option value="Configuration">Configuration</option>
                <option value="FO Access">FO Access</option>
                <option value="FO Backbone">FO Backbone</option>
                <option value="Equipment">Equipment</option>
                <option value="No Issue">No Issue</option>
              </select>
            </div>

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

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Progress Update</label>
              <textarea className="form-control" name="Progress Update" rows="2" value={formData["Progress Update"]} onChange={handleChange} placeholder="Tulis update terbaru..."></textarea>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Restoration Action</label>
              <textarea className="form-control" name="Restoration Action" rows="2" value={formData["Restoration Action"]} onChange={handleChange} placeholder="Tindakan yang sudah dilakukan..."></textarea>
            </div>

          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading} style={{ padding: '15px', fontSize: '1.1rem' }}>
          {loading ? "Menyimpan ke Excel..." : "SUBMIT TICKET"}
        </button>

      </form>
    </div>
  );
};

export default TicketEntry;