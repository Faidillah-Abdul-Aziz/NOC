import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

const CustomerDataEntry = ({ isDarkMode, toggleDarkMode }) => {
  const [loading, setLoading] = useState(false);
  const [nextNo, setNextNo] = useState(1); 
  
  const [formData, setFormData] = useState({
    Cluster_Select: "",
    Cluster_Manual: "",
    Site_Desa: "",
    OLT_Select: "",
    OLT_Manual: ""
  });

  // List Cluster Default
  const clusterOptions = ["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Bali"];

  // List OLT Mentah
  const rawOltOptions = [
    "OLT Rowosari_1", "OLT Rowosari_2", "OLT Tasikrejo Module_1", "OLT Tasikrejo Module_2",
    "OLT Mojo", "OLT Kebojongan_1", "OLT Kebojongan_2", "OLT_Kebojongan_3", "OLT Pucungrejo",
    "OLT-CIPAKU 1", "OLT-CIPAKU 2", "OLT Pesantren 1", "OLT Pesantren 2", "OLT Pesantren 3",
    "Subang 1- Tanjung Siang", "Subang 2- Tanjung Siang", "Sindanglaya - OLT 1", "Sindanglaya - OLT 2",
    "Kedungpring - OLT 1", "Kedungpring - OLT 2", "OLT 1 Plangkapan-Banyumas", "OLT 2 Plangkapan-Banyumas",
    "OLT 1 Batang", "OLT 2 Batang", "OLT3 Batang", "OLT 1 Panican", "OLT 2 Panican",
    "OLT 1 Cipawon", "OLT 2 Cipawon", "OLT 1 Tegal", "OLT 2 Tegal"
  ];

  // Mengurutkan OLT berdasarkan Alphabet
  const sortedOltOptions = [...rawOltOptions].sort((a, b) => a.localeCompare(b));

  // Mengambil panjang baris dari sheet "Mikrotik & OLT Desa"
  const fetchCurrentRowLength = async () => {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      // Menggunakan customerData sesuai response dari Apps Script terbaru
      if (result.status === "success" && result.customerData) {
        setNextNo(result.customerData.length + 1);
      }
    } catch (error) {
      console.error("Gagal menarik data untuk sinkronisasi Nomor:", error);
    }
  };

  useEffect(() => {
    fetchCurrentRowLength();
  }, []);

  // Sinkronisasi Background dengan Global Dark Mode
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.backgroundColor = isDarkMode ? '#0f172a' : '#f1f5f9';
      mainContent.style.transition = 'background-color 0.3s ease';
    }
    return () => { if (mainContent) mainContent.style.backgroundColor = '#f1f5f9'; };
  }, [isDarkMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      "type": "customerData", // Parameter agar Apps Script tahu ini ditujukan ke sheet Customer
      "No": nextNo,
      "Cluster": formData.Cluster_Select === "Tulis sendiri" ? formData.Cluster_Manual : formData.Cluster_Select,
      "Site/Desa": formData.Site_Desa,
      "OLT": formData.OLT_Select === "Tulis sendiri" ? formData.OLT_Manual : formData.OLT_Select
    };

    try {
      await fetch(API_URL, { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "text/plain" }, 
        body: JSON.stringify(payload) 
      });
      
      alert("Data Customer berhasil disimpan ke Database!");
      
      setFormData({
        Cluster_Select: "", Cluster_Manual: "",
        Site_Desa: "",
        OLT_Select: "", OLT_Manual: ""
      });
      fetchCurrentRowLength();
    } catch (error) { 
      alert("Gagal koneksi ke server database."); 
    } finally { 
      setLoading(false); 
    }
  };

  const isClusterValid = formData.Cluster_Select === "Tulis sendiri" ? formData.Cluster_Manual.trim() !== "" : formData.Cluster_Select !== "";
  const isSiteValid = formData.Site_Desa.trim() !== "";
  const isOltValid = formData.OLT_Select === "Tulis sendiri" ? formData.OLT_Manual.trim() !== "" : formData.OLT_Select !== "";

  const filledFields = (isClusterValid ? 1 : 0) + (isSiteValid ? 1 : 0) + (isOltValid ? 1 : 0);
  const progressPercent = Math.round((filledFields / 3) * 100);

  const previewCluster = formData.Cluster_Select === "Tulis sendiri" ? formData.Cluster_Manual : formData.Cluster_Select;
  const previewOlt = formData.OLT_Select === "Tulis sendiri" ? formData.OLT_Manual : formData.OLT_Select;

  return (
    <div className={`entry-wrapper ${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        .entry-wrapper { 
          --bg-main: transparent; --bg-card: #ffffff; --bg-section: #f8fafc; --text-main: #0f172a; 
          --text-muted: #64748b; --border: #e2e8f0; --input-bg: #ffffff; --accent: #3b82f6; --accent-hover: #2563eb;
          --success: #10b981; --warning: #f59e0b; --danger: #ef4444;
          padding: 24px; color: var(--text-main); font-family: 'Inter', sans-serif; 
          min-height: 100vh; box-sizing: border-box; transition: color 0.3s;
        }
        .entry-wrapper.dark { 
          --bg-card: #1e293b; --bg-section: #0f172a; --text-main: #f8fafc; --text-muted: #94a3b8; 
          --border: #334155; --input-bg: #0f172a;
        }
        .header-area { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-left: 45px; }
        .header-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
        .btn-secondary { height: 38px; padding: 0 16px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; transition: 0.2s; }
        .btn-secondary:hover { background: var(--bg-section); }
        .progress-container { width: 100%; height: 6px; background: var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 24px; }
        .progress-fill { height: 100%; background: var(--success); transition: width 0.4s ease; }
        .main-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
        .form-card { background: var(--bg-card); padding: 32px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .form-section { padding: 24px; border-radius: 12px; margin-bottom: 24px; background: var(--bg-section); border: 1px solid var(--border); }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .noc-full { grid-column: 1 / -1; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .noc-label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .noc-label.required::after { content: ' *'; color: var(--danger); }
        .noc-input { 
          width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border); 
          font-size: 0.9rem; background: var(--input-bg); color: var(--text-main); 
          transition: all 0.2s; box-sizing: border-box; font-family: inherit; height: 42px;
        }
        .noc-input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        .submit-btn { 
          width: 100%; padding: 16px; background: var(--accent); color: white; border: none; 
          border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; 
          transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(59,130,246,0.3); text-transform: uppercase; letter-spacing: 1px;
        }
        .submit-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-2px); }
        .submit-btn:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; transform: none; box-shadow: none; }
        .preview-card { position: sticky; top: 24px; background: var(--bg-card); padding: 24px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .preview-header { font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin: 0 0 16px 0; color: var(--text-main); }
        .preview-item { display: flex; flex-direction: column; margin-bottom: 12px; }
        .preview-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
        .preview-val { font-size: 0.95rem; color: var(--text-main); font-weight: 500; word-break: break-word; }
        .preview-val.empty { color: var(--text-muted); font-style: italic; font-size: 0.85rem; }
        .no-badge { background: var(--accent); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; }
        @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } .preview-card { display: none; } }
        @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } .header-area { padding-left: 0; flex-direction: column; align-items: stretch; gap: 12px; margin-top: 40px; } }
      `}</style>

      <div className="header-area">
        <div>
          <h2 className="header-title">Data Customer Input</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Database akses.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={toggleDarkMode}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
        <span>Form Completion</span>
        <span style={{ color: progressPercent === 100 ? 'var(--success)' : 'inherit' }}>{progressPercent}%</span>
      </div>
      <div className="progress-container">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="main-grid">
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="grid-2">
                
                <div className="input-group noc-full">
                  <label className="noc-label required">Cluster</label>
                  <select className="noc-input" name="Cluster_Select" value={formData.Cluster_Select} onChange={handleChange} required>
                    <option value="">-- Pilih Cluster --</option>
                    {clusterOptions.map((cluster, idx) => (
                      <option key={idx} value={cluster}>{cluster}</option>
                    ))}
                    <option value="Tulis sendiri">Tulis sendiri...</option>
                  </select>
                </div>

                {formData.Cluster_Select === "Tulis sendiri" && (
                  <div className="input-group noc-full">
                    <label className="noc-label required">Ketik Cluster Manual</label>
                    <input type="text" className="noc-input" name="Cluster_Manual" value={formData.Cluster_Manual} onChange={handleChange} placeholder="Ketik wilayah cluster baru..." required />
                  </div>
                )}

                <div className="input-group noc-full">
                  <label className="noc-label required">Site / Desa</label>
                  <input type="text" className="noc-input" name="Site_Desa" value={formData.Site_Desa} onChange={handleChange} placeholder="Masukkan nama desa atau site..." required />
                </div>

                <div className="input-group noc-full">
                  <label className="noc-label required">OLT</label>
                  <select className="noc-input" name="OLT_Select" value={formData.OLT_Select} onChange={handleChange} required>
                    <option value="">-- Pilih OLT (A-Z) --</option>
                    {sortedOltOptions.map((olt, idx) => (
                      <option key={idx} value={olt}>{olt}</option>
                    ))}
                    <option value="Tulis sendiri">Tulis sendiri...</option>
                  </select>
                </div>

                {formData.OLT_Select === "Tulis sendiri" && (
                  <div className="input-group noc-full">
                    <label className="noc-label required">Ketik OLT Manual</label>
                    <input type="text" className="noc-input" name="OLT_Manual" value={formData.OLT_Manual} onChange={handleChange} placeholder="Ketik nama perangkat OLT baru..." required />
                  </div>
                )}

              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading || progressPercent < 100}>
              {loading ? "Processing..." : (progressPercent < 100 ? `Lengkapi Form (${progressPercent}%)` : "Simpan Data ke Sheets")}
            </button>
          </form>
        </div>

        <div className="preview-card">
          <h4 className="preview-header">Live Data Summary</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Status Antrean Terkini:</span>
            <span className="no-badge">No. Berjalan: {nextNo}</span>
          </div>

          <div className="preview-item">
            <span className="preview-label">Target Cluster</span>
            <span className={`preview-val ${!previewCluster ? 'empty' : ''}`}>
              {previewCluster || 'Belum dipilih...'}
            </span>
          </div>

          <div className="preview-item">
            <span className="preview-label">Site / Desa</span>
            <span className={`preview-val ${!formData.Site_Desa ? 'empty' : ''}`}>
              {formData.Site_Desa || 'Belum diisi...'}
            </span>
          </div>

          <div className="preview-item" style={{ borderTop: '1px dashed var(--border)', paddingTop: '15px' }}>
            <span className="preview-label">Perangkat OLT</span>
            <span className={`preview-val ${!previewOlt ? 'empty' : ''}`}>
              {previewOlt || 'Belum ditentukan...'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerDataEntry;