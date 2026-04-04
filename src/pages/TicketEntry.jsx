import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

const TicketEntry = () => {
  const [loading, setLoading] = useState(false);
  
  const [deskripsiOptions, setDeskripsiOptions] = useState([]);
  const [progressOptions, setProgressOptions] = useState([]);
  const [restorationOptions, setRestorationOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]); 
  
  const [formData, setFormData] = useState({
    "Impact service": "", "Media Info": "Messenger", "Deskripsi": "", "ID dan Nama Customer": "",
    "ISP_Select": "IdeaNet", "ISP_Lainnya": "", "Cluster": "", "Type Cluster": "Non VIP", "Progress Update": "",
    "Start Time": "", "Response Time": "", "Resolved Time": "", "Start Stop Clock": "", "Finish Stop Clock": "",
    "Restoration Action": "", "Root_Cause_Cat": "", "Root_Cause_Sub": "", "Root_Cause_Manual": "", 
    "Visit or No Visit": "", "Product": "Internet", "PIC_Select": "Ideanet", "PIC_Lainnya": "", 
    "Source": "Manual", "Status TT": "Open", "Network IDI": "Yes", "NOC": "", "Site": "", "Category": "",
  });

  const getSortedByFrequency = (dataArray, key1, key2) => {
    const counts = {};
    dataArray.forEach(item => {
      const val = item[key1] || (key2 ? item[key2] : null);
      if (val && typeof val === 'string' && val.trim() !== '') {
        const trimmedVal = val.trim();
        counts[trimmedVal] = (counts[trimmedVal] || 0) + 1;
      }
    });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(API_URL);
        const result = await response.json();
        if (result.status === "success" && result.data) {
          const data = result.data;
          setDeskripsiOptions(getSortedByFrequency(data, "Deskripsi", "Deskripsi Awal"));
          setProgressOptions(getSortedByFrequency(data, "Progress Update"));
          setRestorationOptions(getSortedByFrequency(data, "Restoration Action"));
          setSiteOptions(getSortedByFrequency(data, "Site")); 
        }
      } catch (error) { console.error("Gagal menarik data:", error); }
    };
    fetchSuggestions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "Start Time") setFormData(prev => ({ ...prev, "Start Time": value, "Response Time": value }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    payload["ISP"] = payload["ISP_Select"] === "Lainnya" ? payload["ISP_Lainnya"] : payload["ISP_Select"];
    delete payload["ISP_Select"]; delete payload["ISP_Lainnya"];
    payload["PIC"] = payload["PIC_Select"] === "Lainnya" ? payload["PIC_Lainnya"] : payload["PIC_Select"];
    delete payload["PIC_Select"]; delete payload["PIC_Lainnya"];

    let finalRootCause = "";
    if (payload["Root_Cause_Cat"] === "Lainnya") finalRootCause = payload["Root_Cause_Manual"];
    else if (payload["Root_Cause_Sub"] === "Lainnya") finalRootCause = payload["Root_Cause_Cat"] + " " + payload["Root_Cause_Manual"];
    else if (payload["Root_Cause_Cat"] && payload["Root_Cause_Sub"]) finalRootCause = payload["Root_Cause_Cat"] + " " + payload["Root_Cause_Sub"];
    else finalRootCause = payload["Root_Cause_Cat"] || "";
    
    payload["Root Cause"] = finalRootCause.trim();
    delete payload["Root_Cause_Cat"]; delete payload["Root_Cause_Sub"]; delete payload["Root_Cause_Manual"];

    try {
      await fetch(API_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) });
      alert("Tiket berhasil disimpan ke Database NOC!");
      setFormData({
        "Impact service": "", "Media Info": "Messenger", "Deskripsi": "", "ID dan Nama Customer": "", "ISP_Select": "IdeaNet", "ISP_Lainnya": "", "Cluster": "", "Type Cluster": "Non VIP", "Progress Update": "", "Start Time": "", "Response Time": "", "Resolved Time": "", "Start Stop Clock": "", "Finish Stop Clock": "", "Restoration Action": "", "Root_Cause_Cat": "", "Root_Cause_Sub": "", "Root_Cause_Manual": "", "Visit or No Visit": "", "Product": "Internet", "PIC_Select": "Ideanet", "PIC_Lainnya": "", "Source": "Manual", "Status TT": "Open", "Network IDI": "Yes", "NOC": "", "Site": "", "Category": ""
      });
    } catch (error) { alert("Gagal koneksi."); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '20px', color: '#1f2937' }}>
      {/* CSS Injeksi Khusus untuk Layout Rapi & Responsif */}
      <style>{`
        .form-section { padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e5e7eb; }
        .section-title { margin-top: 0; margin-bottom: 20px; font-size: 1.15rem; font-weight: 700; border-bottom: 2px solid rgba(0,0,0,0.05); padding-bottom: 10px; }
        .noc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .noc-full { grid-column: span 2; }
        .noc-input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 0.9rem; box-sizing: border-box; transition: all 0.2s; background: #fff; }
        .noc-input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .noc-label { display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 600; color: #4b5563; }
        .noc-flex-row { display: flex; gap: 10px; }
        .noc-flex-1 { flex: 1; }
        
        @media (max-width: 768px) {
          .noc-grid { grid-template-columns: 1fr; gap: 15px; }
          .noc-full { grid-column: span 1; }
          .noc-flex-row { flex-direction: column; }
        }
      `}</style>

      <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <h2 style={{ margin: '0 0 25px 0', color: '#111827', fontSize: '1.75rem' }}>Entry Trouble Ticket</h2>
        
        <form onSubmit={handleSubmit}>

          {/* SECTION 1 */}
          <div className="form-section" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <h3 className="section-title" style={{ color: '#166534' }}>1. Identitas Pelanggan</h3>
            <div className="noc-grid">
              <div>
                <label className="noc-label">ID dan Nama Customer</label>
                <input type="text" className="noc-input" name="ID dan Nama Customer" value={formData["ID dan Nama Customer"]} onChange={handleChange} placeholder="Tulis ID dan Nama..." required />
              </div>
              <div>
                <label className="noc-label">Site (History Database)</label>
                <input type="text" className="noc-input" name="Site" list="site-list" value={formData["Site"]} onChange={handleChange} placeholder="Ketik/pilih lokasi site..." autoComplete="off" required />
                <datalist id="site-list">{siteOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
              </div>
              <div>
                <label className="noc-label">ISP</label>
                <div className="noc-flex-row">
                  <select className="noc-input noc-flex-1" name="ISP_Select" value={formData["ISP_Select"]} onChange={handleChange} required>
                    <option value="">-- ISP --</option><option value="IdeaNet">IdeaNet</option><option value="Lainnya">Lainnya...</option>
                  </select>
                  {formData["ISP_Select"] === "Lainnya" && (
                    <input type="text" className="noc-input noc-flex-1" name="ISP_Lainnya" value={formData["ISP_Lainnya"]} onChange={handleChange} placeholder="Ketik ISP..." required />
                  )}
                </div>
              </div>
              <div>
                <label className="noc-label">Cluster</label>
                <select className="noc-input" name="Cluster" value={formData["Cluster"]} onChange={handleChange} required>
                  <option value="">-- Cluster --</option><option value="Jawa Tengah">Jawa Tengah</option><option value="Jawa Barat">Jawa Barat</option><option value="Jawa Timur">Jawa Timur</option><option value="Jabodetabek">Jabodetabek</option><option value="Bali">Bali</option>
                </select>
              </div>
              <div>
                <label className="noc-label">Type Cluster</label>
                <select className="noc-input" name="Type Cluster" value={formData["Type Cluster"]} onChange={handleChange} required>
                  <option value="">-- Type --</option><option value="VIP">VIP</option><option value="Non VIP">Non VIP</option>
                </select>
              </div>
              <div>
                <label className="noc-label">Category</label>
                <select className="noc-input" name="Category" value={formData["Category"]} onChange={handleChange} required>
                  <option value="">-- Kategori --</option><option value="Retail">Retail</option><option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="noc-label">Product</label>
                <select className="noc-input" name="Product" value={formData["Product"]} onChange={handleChange} required>
                  <option value="">-- Produk --</option><option value="Internet">Internet</option><option value="IPTV">IPTV</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="form-section" style={{ backgroundColor: '#fdf2f2', borderColor: '#fecaca' }}>
            <h3 className="section-title" style={{ color: '#991b1b' }}>2. Detail Gangguan & Laporan</h3>
            <div className="noc-grid">
              <div>
                <label className="noc-label">Source Laporan</label>
                <select className="noc-input" name="Source" value={formData["Source"]} onChange={handleChange} required>
                  <option value="">-- Source --</option><option value="Manual">Manual</option><option value="BOT">BOT</option>
                </select>
              </div>
              <div>
                <label className="noc-label">Media Info</label>
                <select className="noc-input" name="Media Info" value={formData["Media Info"]} onChange={handleChange} required>
                  <option value="">-- Media --</option><option value="Messenger">Messenger</option><option value="Alert">Alert</option><option value="Ticket">Ticket</option><option value="Email">Email</option>
                </select>
              </div>
              <div>
                <label className="noc-label">Impact Service</label>
                <select className="noc-input" name="Impact service" value={formData["Impact service"]} onChange={handleChange} required>
                  <option value="">-- Impact? --</option><option value="Yes">Yes</option><option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="noc-label">Network IDI</label>
                <select className="noc-input" name="Network IDI" value={formData["Network IDI"]} onChange={handleChange} required>
                  <option value="">-- Network IDI? --</option><option value="Yes">Yes</option><option value="No">No</option>
                </select>
              </div>
              <div className="noc-full">
                <label className="noc-label">Deskripsi (Kronologi)</label>
                <input type="text" className="noc-input" name="Deskripsi" list="deskripsi-list" value={formData["Deskripsi"]} onChange={handleChange} placeholder="Ketik kronologi / pilih dari database..." autoComplete="off" required />
                <datalist id="deskripsi-list">{deskripsiOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
              </div>
            </div>
          </div>

          {/* SECTION 3 */}
          <div className="form-section" style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }}>
            <h3 className="section-title" style={{ color: '#9a3412' }}>3. Manajemen Waktu</h3>
            <div className="noc-grid">
              <div>
                <label className="noc-label">Start Time</label>
                <input type="datetime-local" className="noc-input" name="Start Time" value={formData["Start Time"]} onChange={handleChange} />
              </div>
              <div>
                <label className="noc-label">Response Time <span style={{fontWeight:'normal', color:'#9ca3af'}}>(Auto-sync)</span></label>
                <input type="datetime-local" className="noc-input" name="Response Time" value={formData["Response Time"]} onChange={handleChange} />
              </div>
              <div>
                <label className="noc-label">Resolved Time</label>
                <input type="datetime-local" className="noc-input" name="Resolved Time" value={formData["Resolved Time"]} onChange={handleChange} />
              </div>
              <div className="hidden-mobile"></div>
              <div>
                <label className="noc-label">Start Stop Clock (Pause)</label>
                <input type="datetime-local" className="noc-input" name="Start Stop Clock" value={formData["Start Stop Clock"]} onChange={handleChange} />
              </div>
              <div>
                <label className="noc-label">Finish Stop Clock (Resume)</label>
                <input type="datetime-local" className="noc-input" name="Finish Stop Clock" value={formData["Finish Stop Clock"]} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SECTION 4 */}
          <div className="form-section" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
            <h3 className="section-title" style={{ color: '#1e3a8a' }}>4. Detail Penanganan NOC</h3>
            <div className="noc-grid">
              <div>
                <label className="noc-label">NOC In Charge</label>
                <select className="noc-input" name="NOC" value={formData["NOC"]} onChange={handleChange} required>
                  <option value="">-- Pilih NOC --</option><option value="Faidillah">Faidillah</option><option value="Yudi">Yudi</option><option value="Adit">Adit</option><option value="Miko">Miko</option>
                </select>
              </div>
              <div>
                <label className="noc-label">PIC Eksternal</label>
                <div className="noc-flex-row">
                  <select className="noc-input noc-flex-1" name="PIC_Select" value={formData["PIC_Select"]} onChange={handleChange}>
                    <option value="">-- PIC --</option><option value="Ideanet">Ideanet</option><option value="BersamaNet">BersamaNet</option><option value="Moratel">Moratel</option><option value="Lainnya">Lainnya...</option>
                  </select>
                  {formData["PIC_Select"] === "Lainnya" && (
                    <input type="text" className="noc-input noc-flex-1" name="PIC_Lainnya" value={formData["PIC_Lainnya"]} onChange={handleChange} placeholder="Ketik PIC..." />
                  )}
                </div>
              </div>

              <div>
                <label className="noc-label">Kategori Root Cause</label>
                <select className="noc-input" name="Root_Cause_Cat" value={formData["Root_Cause_Cat"]} onChange={handleChange}>
                  <option value="">-- Kategori --</option><option value="Configuration">Configuration</option><option value="FO">FO</option><option value="Equipment">Equipment</option><option value="Lainnya">Lainnya (Manual)</option>
                </select>
              </div>
              <div>
                <label className="noc-label">Detail Root Cause</label>
                {formData["Root_Cause_Cat"] === "Lainnya" ? (
                  <input type="text" className="noc-input" name="Root_Cause_Manual" value={formData["Root_Cause_Manual"]} onChange={handleChange} placeholder="Ketik root cause..." />
                ) : (
                  <select className="noc-input" name="Root_Cause_Sub" value={formData["Root_Cause_Sub"]} onChange={handleChange} disabled={!formData["Root_Cause_Cat"]}>
                    <option value="">-- Detail --</option>
                    {formData["Root_Cause_Cat"] === "Configuration" && (<><option value="Core">Core</option><option value="ONT">ONT</option><option value="Switch">Switch</option><option value="Lainnya">Lainnya...</option></>)}
                    {formData["Root_Cause_Cat"] === "FO" && (<><option value="Access">Access</option><option value="Backbone">Backbone</option><option value="OLT-FDT">OLT-FDT</option><option value="Lainnya">Lainnya...</option></>)}
                    {formData["Root_Cause_Cat"] === "Equipment" && (<><option value="ONT">ONT</option><option value="Switch">Switch</option><option value="Router">Router</option><option value="Lainnya">Lainnya...</option></>)}
                  </select>
                )}
              </div>

              {formData["Root_Cause_Sub"] === "Lainnya" && formData["Root_Cause_Cat"] !== "Lainnya" && (
                <div className="noc-full">
                  <label className="noc-label">Tulis Manual Root Cause {formData["Root_Cause_Cat"]}</label>
                  <input type="text" className="noc-input" name="Root_Cause_Manual" value={formData["Root_Cause_Manual"]} onChange={handleChange} placeholder="Ketik detail spesifik..." />
                </div>
              )}

              <div>
                <label className="noc-label">Visit / No Visit</label>
                <select className="noc-input" name="Visit or No Visit" value={formData["Visit or No Visit"]} onChange={handleChange}>
                  <option value="">-- Status Visit --</option><option value="Visit">Visit</option><option value="No Visit">No Visit</option>
                </select>
              </div>
              <div>
                <label className="noc-label">Status TT</label>
                <select className="noc-input" name="Status TT" value={formData["Status TT"]} onChange={handleChange} required>
                  <option value="Open">Open</option><option value="Closed">Closed</option>
                </select>
              </div>

              <div className="noc-full">
                <label className="noc-label">Progress Update</label>
                <input type="text" className="noc-input" name="Progress Update" list="progress-list" value={formData["Progress Update"]} onChange={handleChange} placeholder="Ketik / pilih dari riwayat..." autoComplete="off" />
                <datalist id="progress-list">{progressOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
              </div>
              <div className="noc-full">
                <label className="noc-label">Restoration Action</label>
                <input type="text" className="noc-input" name="Restoration Action" list="restoration-list" value={formData["Restoration Action"]} onChange={handleChange} placeholder="Ketik / pilih dari riwayat..." autoComplete="off" />
                <datalist id="restoration-list">{restorationOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', backgroundColor: loading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.15rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.3s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
            {loading ? "Menyimpan ke Database..." : "SUBMIT TICKET"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default TicketEntry;