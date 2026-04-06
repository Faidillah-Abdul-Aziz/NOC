import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TicketEntry = () => {
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); 
  
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
    "Source": "Manual", "Status TT": "Open", "Network IDI": "Yes", "NOC": "", "Site": "", 
    "Category": "Retail", // Default diset ke Retail
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
    let finalValue = value;
    if (name === "ID dan Nama Customer") finalValue = value.toUpperCase();
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const formatDateForState = (dateObj) => {
    if (!dateObj) return "";
    const pad = (n) => n < 10 ? '0' + n : n;
    const yyyy = dateObj.getFullYear();
    const MM = pad(dateObj.getMonth() + 1);
    const dd = pad(dateObj.getDate());
    const HH = pad(dateObj.getHours());
    const mm = pad(dateObj.getMinutes());
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
  };

  const handleDateChange = (name, date) => {
    const formattedDate = formatDateForState(date);
    if (name === "Start Time") {
      setFormData(prev => ({ ...prev, "Start Time": formattedDate, "Response Time": formattedDate }));
    } else {
      setFormData(prev => ({ ...prev, [name]: formattedDate }));
    }
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
      // Kembalikan Category ke Retail saat di-reset
      setFormData({
        "Impact service": "", "Media Info": "Messenger", "Deskripsi": "", "ID dan Nama Customer": "", "ISP_Select": "IdeaNet", "ISP_Lainnya": "", "Cluster": "", "Type Cluster": "Non VIP", "Progress Update": "", "Start Time": "", "Response Time": "", "Resolved Time": "", "Start Stop Clock": "", "Finish Stop Clock": "", "Restoration Action": "", "Root_Cause_Cat": "", "Root_Cause_Sub": "", "Root_Cause_Manual": "", "Visit or No Visit": "", "Product": "Internet", "PIC_Select": "Ideanet", "PIC_Lainnya": "", "Source": "Manual", "Status TT": "Open", "Network IDI": "Yes", "NOC": "", "Site": "", 
        "Category": "Retail" 
      });
    } catch (error) { alert("Gagal koneksi."); } finally { setLoading(false); }
  };

  const mandatoryFields = ["ID dan Nama Customer", "Site", "Cluster", "Type Cluster", "Category", "Product", "NOC"];
  const filledFields = mandatoryFields.filter(f => formData[f].trim() !== "").length;
  const progressPercent = Math.round((filledFields / mandatoryFields.length) * 100);

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
        
        .btn-secondary { height: 38px; padding: 0 16px; background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; transition: 0.2s; }
        .btn-secondary:hover { background: var(--border); }

        .progress-container { width: 100%; height: 6px; background: var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 24px; }
        .progress-fill { height: 100%; background: var(--success); transition: width 0.4s ease; }

        .main-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
        .form-card { background: var(--bg-card); padding: 32px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        
        .form-section { padding: 24px; border-radius: 12px; margin-bottom: 24px; background: var(--bg-section); border: 1px solid var(--border); }
        .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
        .section-number { background: var(--accent); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: bold; font-size: 0.9rem; }
        .section-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
        
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
        .noc-input:disabled { background: var(--border); cursor: not-allowed; opacity: 0.7; }
        .flex-row { display: flex; gap: 10px; }
        
        /* REACT DATEPICKER CUSTOMIZATION */
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input { width: 100%; }
        .entry-wrapper.dark .react-datepicker { background-color: var(--bg-card); border-color: var(--border); color: var(--text-main); font-family: 'Inter', sans-serif; }
        .entry-wrapper.dark .react-datepicker__header { background-color: var(--bg-section); border-bottom-color: var(--border); }
        .entry-wrapper.dark .react-datepicker__current-month, .entry-wrapper.dark .react-datepicker-time__header, .entry-wrapper.dark .react-datepicker__day-name { color: var(--text-main); }
        .entry-wrapper.dark .react-datepicker__day { color: var(--text-main); }
        .entry-wrapper.dark .react-datepicker__day:hover { background-color: var(--border); }
        .entry-wrapper.dark .react-datepicker__time-container { border-left-color: var(--border); }
        .entry-wrapper.dark .react-datepicker__time { background-color: var(--bg-card); color: var(--text-main); }
        .entry-wrapper.dark .react-datepicker__time-list-item:hover { background-color: var(--border) !important; }
        .entry-wrapper.dark .react-datepicker__day--selected { background-color: var(--accent); color: white; }

        .submit-btn { 
          width: 100%; padding: 16px; background: var(--accent); color: white; border: none; 
          border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; 
          transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(59,130,246,0.3); text-transform: uppercase; letter-spacing: 1px;
        }
        .submit-btn:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-2px); }
        .submit-btn:disabled { background: var(--text-muted); cursor: not-allowed; transform: none; box-shadow: none; }

        .preview-card { position: sticky; top: 24px; background: var(--bg-card); padding: 24px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .preview-header { font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin: 0 0 16px 0; color: var(--text-main); }
        .preview-item { display: flex; flex-direction: column; margin-bottom: 12px; }
        .preview-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
        .preview-val { font-size: 0.95rem; color: var(--text-main); font-weight: 500; word-break: break-word; }
        .preview-val.empty { color: var(--text-muted); font-style: italic; font-size: 0.85rem; }
        
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .status-open { background: rgba(245, 158, 11, 0.15); color: #d97706; }
        .status-closed { background: rgba(16, 185, 129, 0.15); color: #059669; }

        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr; }
          .preview-card { display: none; }
        }
        @media (max-width: 768px) {
          .grid-2 { grid-template-columns: 1fr; }
          .header-area { padding-left: 0; flex-direction: column; align-items: stretch; gap: 12px; margin-top: 40px; }
        }
      `}</style>

      <div className="header-area">
        <div>
          <h2 className="header-title">Create New Ticket</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Input operasional NOC harian.</p>
        </div>
        <button className="btn-secondary" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
        <span>Form Completion (Mandatory)</span>
        <span style={{ color: progressPercent === 100 ? 'var(--success)' : 'inherit' }}>{progressPercent}%</span>
      </div>
      <div className="progress-container">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="main-grid">
        {/* KOLOM KIRI: FORM */}
        <div className="form-card">
          <form onSubmit={handleSubmit}>

            {/* SECTION 1: Identitas */}
            <div className="form-section">
              <div className="section-header"><div className="section-number">1</div><h3 className="section-title">Identitas Pelanggan</h3></div>
              <div className="grid-2">
                <div className="input-group noc-full">
                  <label className="noc-label required">ID dan Nama Customer</label>
                  <input type="text" className="noc-input" name="ID dan Nama Customer" value={formData["ID dan Nama Customer"]} onChange={handleChange} placeholder="Contoh: IDN-1234 PT BINTANG..." required />
                </div>
                <div className="input-group">
                  <label className="noc-label required">Site (Lokasi)</label>
                  <input type="text" className="noc-input" name="Site" list="site-list" value={formData["Site"]} onChange={handleChange} placeholder="Ketik/pilih site..." autoComplete="off" required />
                  <datalist id="site-list">{siteOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
                </div>
                <div className="input-group">
                  <label className="noc-label required">Cluster</label>
                  <select className="noc-input" name="Cluster" value={formData["Cluster"]} onChange={handleChange} required>
                    <option value="">-- Wilayah --</option><option value="Jawa Tengah">Jawa Tengah</option><option value="Jawa Barat">Jawa Barat</option><option value="Jawa Timur">Jawa Timur</option><option value="Jabodetabek">Jabodetabek</option><option value="Bali">Bali</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label required">Type Cluster</label>
                  <select className="noc-input" name="Type Cluster" value={formData["Type Cluster"]} onChange={handleChange} required>
                    <option value="Non VIP">Non VIP</option><option value="VIP">VIP</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label required">Category</label>
                  <select className="noc-input" name="Category" value={formData["Category"]} onChange={handleChange} required>
                    <option value="">-- Kategori --</option><option value="Retail">Retail</option><option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label required">Product</label>
                  <select className="noc-input" name="Product" value={formData["Product"]} onChange={handleChange} required>
                    <option value="Internet">Internet</option><option value="IPTV">IPTV</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label required">Provider ISP</label>
                  <select className="noc-input" name="ISP_Select" value={formData["ISP_Select"]} onChange={handleChange} required>
                    <option value="IdeaNet">IdeaNet</option><option value="Lainnya">Lainnya...</option>
                  </select>
                </div>
                {formData["ISP_Select"] === "Lainnya" && (
                  <div className="input-group">
                    <label className="noc-label required">Ketik Nama ISP</label>
                    <input type="text" className="noc-input" name="ISP_Lainnya" value={formData["ISP_Lainnya"]} onChange={handleChange} placeholder="Ketik ISP..." required />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Laporan */}
            <div className="form-section">
              <div className="section-header"><div className="section-number">2</div><h3 className="section-title">Detail Laporan & Gangguan</h3></div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="noc-label">Source Laporan</label>
                  <select className="noc-input" name="Source" value={formData["Source"]} onChange={handleChange} required>
                    <option value="Manual">Manual</option><option value="BOT">BOT</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label">Media Info</label>
                  <select className="noc-input" name="Media Info" value={formData["Media Info"]} onChange={handleChange} required>
                    <option value="Messenger">Messenger</option><option value="Alert">Alert</option><option value="Ticket">Ticket</option><option value="Email">Email</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label">Impact Service</label>
                  <select className="noc-input" name="Impact service" value={formData["Impact service"]} onChange={handleChange} required>
                    <option value="">- Impact? -</option><option value="Yes">Yes</option><option value="No">No</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label">Network IDI</label>
                  <select className="noc-input" name="Network IDI" value={formData["Network IDI"]} onChange={handleChange} required>
                    <option value="Yes">Yes</option><option value="No">No</option>
                  </select>
                </div>
                
                {/* INI KEMBALI MENGGUNAKAN INPUT AGAR BISA AUTOCOMPLETE DATALIST */}
                <div className="input-group noc-full">
                  <label className="noc-label required">Deskripsi / Kronologi Awal</label>
                  <input type="text" className="noc-input" name="Deskripsi" list="deskripsi-list" value={formData["Deskripsi"]} onChange={handleChange} placeholder="Ketik / pilih dari database..." autoComplete="off" required />
                  <datalist id="deskripsi-list">{deskripsiOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
                </div>
              </div>
            </div>

            {/* SECTION 3: Waktu (REACT-DATEPICKER 1 MENIT) */}
            <div className="form-section">
              <div className="section-header"><div className="section-number">3</div><h3 className="section-title">Manajemen Waktu</h3></div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="noc-label">Start Time</label>
                  <DatePicker
                    selected={formData["Start Time"] ? new Date(formData["Start Time"]) : null}
                    onChange={(date) => handleDateChange("Start Time", date)}
                    showTimeSelect timeFormat="HH:mm" timeIntervals={1} timeCaption="Jam" dateFormat="yyyy-MM-dd HH:mm"
                    className="noc-input" placeholderText="Pilih Tanggal & Jam" isClearable
                  />
                </div>
                <div className="input-group">
                  <label className="noc-label">Response Time</label>
                  <DatePicker
                    selected={formData["Response Time"] ? new Date(formData["Response Time"]) : null}
                    onChange={(date) => handleDateChange("Response Time", date)}
                    showTimeSelect timeFormat="HH:mm" timeIntervals={1} timeCaption="Jam" dateFormat="yyyy-MM-dd HH:mm"
                    className="noc-input" placeholderText="Pilih Tanggal & Jam" isClearable
                  />
                </div>
                <div className="input-group">
                  <label className="noc-label">Resolved Time</label>
                  <DatePicker
                    selected={formData["Resolved Time"] ? new Date(formData["Resolved Time"]) : null}
                    onChange={(date) => handleDateChange("Resolved Time", date)}
                    showTimeSelect timeFormat="HH:mm" timeIntervals={1} timeCaption="Jam" dateFormat="yyyy-MM-dd HH:mm"
                    className="noc-input" placeholderText="Pilih Tanggal & Jam" isClearable
                  />
                </div>
                <div className="input-group">
                  <label className="noc-label">Status Visit</label>
                  <select className="noc-input" name="Visit or No Visit" value={formData["Visit or No Visit"]} onChange={handleChange}>
                    <option value="">-- Status Visit --</option><option value="Visit">Visit</option><option value="No Visit">No Visit</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label">Start Stop Clock (Pause)</label>
                  <DatePicker
                    selected={formData["Start Stop Clock"] ? new Date(formData["Start Stop Clock"]) : null}
                    onChange={(date) => handleDateChange("Start Stop Clock", date)}
                    showTimeSelect timeFormat="HH:mm" timeIntervals={1} timeCaption="Jam" dateFormat="yyyy-MM-dd HH:mm"
                    className="noc-input" placeholderText="Pilih Tanggal & Jam" isClearable
                  />
                </div>
                <div className="input-group">
                  <label className="noc-label">Finish Stop Clock (Resume)</label>
                  <DatePicker
                    selected={formData["Finish Stop Clock"] ? new Date(formData["Finish Stop Clock"]) : null}
                    onChange={(date) => handleDateChange("Finish Stop Clock", date)}
                    showTimeSelect timeFormat="HH:mm" timeIntervals={1} timeCaption="Jam" dateFormat="yyyy-MM-dd HH:mm"
                    className="noc-input" placeholderText="Pilih Tanggal & Jam" isClearable
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Penanganan */}
            <div className="form-section">
              <div className="section-header"><div className="section-number">4</div><h3 className="section-title">Penanganan & RCA</h3></div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="noc-label required">NOC In Charge</label>
                  <select className="noc-input" name="NOC" value={formData["NOC"]} onChange={handleChange} required>
                    <option value="">-- Pilih NOC --</option><option value="Faidillah">Faidillah</option><option value="Yudi">Yudi</option><option value="Adit">Adit</option><option value="Miko">Miko</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="noc-label">PIC Eksternal</label>
                  <select className="noc-input" name="PIC_Select" value={formData["PIC_Select"]} onChange={handleChange}>
                    <option value="Ideanet">Ideanet</option><option value="BersamaNet">BersamaNet</option><option value="Moratel">Moratel</option><option value="Lainnya">Lainnya...</option>
                  </select>
                </div>
                
                {formData["PIC_Select"] === "Lainnya" && (
                  <div className="input-group noc-full">
                    <label className="noc-label">Ketik Nama PIC</label>
                    <input type="text" className="noc-input" name="PIC_Lainnya" value={formData["PIC_Lainnya"]} onChange={handleChange} placeholder="Ketik PIC..." />
                  </div>
                )}

                <div className="input-group">
                  <label className="noc-label">Kategori Root Cause</label>
                  <select className="noc-input" name="Root_Cause_Cat" value={formData["Root_Cause_Cat"]} onChange={handleChange}>
                    <option value="">-- Kategori --</option><option value="Configuration">Configuration</option><option value="FO">FO</option><option value="Equipment">Equipment</option><option value="Lainnya">Manual...</option>
                  </select>
                </div>
                
                {formData["Root_Cause_Cat"] !== "Lainnya" ? (
                  <div className="input-group">
                    <label className="noc-label">Detail Root Cause</label>
                    <select className="noc-input" name="Root_Cause_Sub" value={formData["Root_Cause_Sub"]} onChange={handleChange} disabled={!formData["Root_Cause_Cat"]}>
                      <option value="">-- Detail --</option>
                      {formData["Root_Cause_Cat"] === "Configuration" && (<><option value="Core">Core</option><option value="ONT">ONT</option><option value="Switch">Switch</option><option value="Lainnya">Lainnya...</option></>)}
                      {formData["Root_Cause_Cat"] === "FO" && (<><option value="Access">Access</option><option value="Backbone">Backbone</option><option value="OLT-FDT">OLT-FDT</option><option value="Lainnya">Lainnya...</option></>)}
                      {formData["Root_Cause_Cat"] === "Equipment" && (<><option value="ONT">ONT</option><option value="Switch">Switch</option><option value="Router">Router</option><option value="Lainnya">Lainnya...</option></>)}
                    </select>
                  </div>
                ) : (
                  <div className="input-group">
                    <label className="noc-label">Ketik Root Cause</label>
                    <input type="text" className="noc-input" name="Root_Cause_Manual" value={formData["Root_Cause_Manual"]} onChange={handleChange} placeholder="Ketik root cause..." />
                  </div>
                )}

                {formData["Root_Cause_Sub"] === "Lainnya" && formData["Root_Cause_Cat"] !== "Lainnya" && (
                  <div className="input-group noc-full">
                    <label className="noc-label">Ketik Spesifik Root Cause</label>
                    <input type="text" className="noc-input" name="Root_Cause_Manual" value={formData["Root_Cause_Manual"]} onChange={handleChange} placeholder={`Ketik detail ${formData["Root_Cause_Cat"]}...`} />
                  </div>
                )}

                <div className="input-group noc-full">
                  <label className="noc-label">Progress Update Saat Ini</label>
                  <input type="text" className="noc-input" name="Progress Update" list="progress-list" value={formData["Progress Update"]} onChange={handleChange} placeholder="Status progres..." autoComplete="off" />
                  <datalist id="progress-list">{progressOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
                </div>
                
                <div className="input-group noc-full">
                  <label className="noc-label">Restoration Action</label>
                  <input type="text" className="noc-input" name="Restoration Action" list="restoration-list" value={formData["Restoration Action"]} onChange={handleChange} placeholder="Tindakan pemulihan..." autoComplete="off" />
                  <datalist id="restoration-list">{restorationOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
                </div>

                <div className="input-group noc-full">
                  <label className="noc-label required">Status Ticket</label>
                  <select className="noc-input" name="Status TT" value={formData["Status TT"]} onChange={handleChange} required>
                    <option value="Open">Open</option><option value="Closed">Closed</option>
                  </select>
                </div>

              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading || progressPercent < 100}>
              {loading ? "Processing..." : (progressPercent < 100 ? `Lengkapi Form (${progressPercent}%)` : "Submit to Database")}
            </button>

          </form>
        </div>

        {/* KOLOM KANAN: LIVE PREVIEW */}
        <div className="preview-card">
          <h4 className="preview-header">Live Ticket Summary</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span className={`status-badge ${formData["Status TT"] === 'Open' ? 'status-open' : 'status-closed'}`}>
              ● {formData["Status TT"]} TICKET
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
              NOC: {formData["NOC"] || <span className="preview-val empty">Empty</span>}
            </span>
          </div>

          <div className="preview-item">
            <span className="preview-label">Customer ID & Name</span>
            <span className={`preview-val ${!formData["ID dan Nama Customer"] ? 'empty' : ''}`}>{formData["ID dan Nama Customer"] || 'Menunggu input...'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="preview-item">
              <span className="preview-label">Site Location</span>
              <span className={`preview-val ${!formData["Site"] ? 'empty' : ''}`}>{formData["Site"] || '-'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Cluster</span>
              <span className={`preview-val ${!formData["Cluster"] ? 'empty' : ''}`}>{formData["Cluster"] || '-'}</span>
            </div>
          </div>

          <div className="preview-item">
            <span className="preview-label">Issue Description</span>
            <span className={`preview-val ${!formData["Deskripsi"] ? 'empty' : ''}`} style={{ fontSize: '0.85rem' }}>{formData["Deskripsi"] || 'Belum ada kronologi...'}</span>
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', margin: '15px 0', paddingTop: '15px' }}>
            <div className="preview-item">
              <span className="preview-label">Progress Update</span>
              <span className={`preview-val ${!formData["Progress Update"] ? 'empty' : ''}`}>{formData["Progress Update"] || 'Standby'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Root Cause (RCA)</span>
              <span className={`preview-val ${!formData["Root_Cause_Cat"] ? 'empty' : ''}`}>
                {formData["Root_Cause_Cat"] === "Lainnya" ? formData["Root_Cause_Manual"] : 
                 formData["Root_Cause_Sub"] === "Lainnya" ? `${formData["Root_Cause_Cat"]} - ${formData["Root_Cause_Manual"]}` : 
                 formData["Root_Cause_Cat"] ? `${formData["Root_Cause_Cat"]} ${formData["Root_Cause_Sub"]}` : 'Investigating...'}
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Restoration Action</span>
              <span className={`preview-val ${!formData["Restoration Action"] ? 'empty' : ''}`}>{formData["Restoration Action"] || '-'}</span>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-section)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <div><strong style={{display:'block'}}>Start Time</strong> {formData["Start Time"] ? formData["Start Time"].replace('T', ' ') : '-'}</div>
            <div style={{textAlign:'right'}}><strong style={{display:'block'}}>Resolved Time</strong> {formData["Resolved Time"] ? formData["Resolved Time"].replace('T', ' ') : '-'}</div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TicketEntry;