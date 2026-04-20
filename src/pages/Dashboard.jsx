import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_URL } from '../config';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import Select from 'react-select'; 
import html2canvas from 'html2canvas'; // IMPORT BARU

const getCurrentWeekStr = () => {
  const today = new Date();
  const current = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const jan1 = new Date(Date.UTC(today.getFullYear(), 0, 1));
  const dayOfJan1 = jan1.getUTCDay();
  const daysToFirstWed = (3 - dayOfJan1 + 7) % 7;
  const firstWed = new Date(Date.UTC(today.getFullYear(), 0, 1 + daysToFirstWed));
  return `W${current < firstWed ? 1 : Math.floor(Math.round((current - firstWed) / 86400000) / 7) + 2}`; 
};

const parseDateToYYYYMMDD = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes('/')) {
    const parts = dateString.split(' ')[0].split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  if (dateString.includes('-')) return dateString.split('T')[0].split(' ')[0];
  return "";
};

const checkIsVIP = (item) => {
  const typeCluster = item["Type Cluster"] || "";
  if (typeCluster.toUpperCase().includes("VIP") && !typeCluster.toUpperCase().includes("NON")) return true;
  return Object.values(item).some(val => typeof val === 'string' && val.trim().toUpperCase() === 'VIP');
};

const Dashboard = ({ isDarkMode, toggleDarkMode }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isKioskMode, setIsKioskMode] = useState(false); 
  
  const [filterType, setFilterType] = useState('Week'); 
  const [filterValue, setFilterValue] = useState(getCurrentWeekStr());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [rcaDataSource, setRcaDataSource] = useState('Global'); 
  
  const [tableStartDate, setTableStartDate] = useState(''); 
  const [tableEndDate, setTableEndDate] = useState('');     
  const [searchCustomer, setSearchCustomer] = useState(''); 
  const [tableSla, setTableSla] = useState('All');
  const [tableCategory, setTableCategory] = useState('All'); 
  const [tableVipFilter, setTableVipFilter] = useState('All'); 
  const [tableSite, setTableSite] = useState([]); 
  const [tableCluster, setTableCluster] = useState('All');
  const [tableDetailFilter, setTableDetailFilter] = useState('All');
  
  const [viewTicket, setViewTicket] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [listModalData, setListModalData] = useState(null);

  // REF BARU UNTUK AREA MTTR YANG AKAN DI-SCREENSHOT
  const mttrSectionRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const result = await response.json();
      if (result.status === "success" && result.data) {
        setData(result.data.filter(item => item["TT No"] && item["TT No"].trim() !== "").reverse());
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let interval;
    if (isKioskMode) interval = setInterval(() => { fetchData(); }, 300000); 
    return () => clearInterval(interval);
  }, [isKioskMode]);

  useEffect(() => {
    const handleFullscreenChange = () => { setIsKioskMode(!!document.fullscreenElement); };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.backgroundColor = isDarkMode ? '#0f172a' : '#f1f5f9';
    }
    return () => { if (mainContent) mainContent.style.backgroundColor = '#f1f5f9'; };
  }, [isDarkMode]);

  const toggleKioskMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
    } else {
      if (document.exitFullscreen) document.exitFullscreen(); 
    }
  };

  const uniqueMonths = useMemo(() => [...new Set(data.map(item => item["Month"]).filter(Boolean))], [data]);
  
  const uniqueWeeks = useMemo(() => {
    let weeks = [...new Set(data.map(item => item["Week"]).filter(val => val && val.startsWith('W')))];
    if (!weeks.includes(getCurrentWeekStr())) weeks.push(getCurrentWeekStr());
    return weeks.sort((a,b)=>parseInt(a.replace(/\D/g,''))-parseInt(b.replace(/\D/g,'')));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterType === 'Month') return item["Month"] === filterValue;
      if (filterType === 'Week') return item["Week"] === filterValue;
      if (filterType === 'Date Range') {
        const formattedItemDate = parseDateToYYYYMMDD(item["Start Time"] || item["Timestamp"]);
        if (!formattedItemDate) return false;
        if (startDate && formattedItemDate < startDate) return false;
        if (endDate && formattedItemDate > endDate) return false;
      }
      return true;
    });
  }, [data, filterType, filterValue, startDate, endDate]);

  const metrics = useMemo(() => {
    const totalTT = filteredData.length;
    const activeTTList = filteredData.filter(i => i["Status TT"]?.toLowerCase().includes("open"));
    const activeTT = activeTTList.length;
    
    const completedTTList = filteredData.filter(i => !i["Status TT"]?.toLowerCase().includes("open"));
    const completedTT = completedTTList.length;
    
    const overdueMTTRList = filteredData.filter(i => i["Status TT"]?.toLowerCase().includes("open") && i["SLA Real"]?.toLowerCase().includes("out"));
    const overdueMTTR = overdueMTTRList.length;
    
    const inSLAList = filteredData.filter(i => i["SLA Real"]?.toLowerCase().includes("in"));
    const inSLA = inSLAList.length;
    
    const outSLAList = filteredData.filter(i => i["SLA Real"]?.toLowerCase().includes("out"));
    const outSLA = outSLAList.length;

    const retailData = filteredData.filter(i => i["Category"] === "Retail");
    const enterpriseData = filteredData.filter(i => i["Category"] === "Enterprise");
    const retailInSLA = retailData.filter(i => i["SLA Real"]?.toLowerCase().includes("in")).length;
    const retailOutSLA = retailData.filter(i => i["SLA Real"]?.toLowerCase().includes("out")).length;
    const enterpriseInSLA = enterpriseData.filter(i => i["SLA Real"]?.toLowerCase().includes("in")).length;
    const enterpriseOutSLA = enterpriseData.filter(i => i["SLA Real"]?.toLowerCase().includes("out")).length;
    const retailPerc = retailData.length > 0 ? ((retailInSLA / retailData.length) * 100).toFixed(1) : 0;
    const entPerc = enterpriseData.length > 0 ? ((enterpriseInSLA / enterpriseData.length) * 100).toFixed(1) : 0;
    
    const pieData = totalTT > 0 ? [{ name: 'Closed TT', value: completedTT }, { name: 'Open TT', value: activeTT }] : [{ name: 'No Data', value: 1 }];

    return { 
      totalTT, activeTT, activeTTList, completedTT, completedTTList, overdueMTTR, overdueMTTRList, 
      inSLA, inSLAList, outSLA, outSLAList, 
      retailData, enterpriseData, retailInSLA, retailOutSLA, enterpriseInSLA, enterpriseOutSLA, 
      retailPerc, entPerc, pieData 
    };
  }, [filteredData]);

  const siteOptions = useMemo(() => [...new Set(filteredData.map(i => i["Site"]).filter(Boolean))].map(s => ({ value: s, label: s })), [filteredData]);
  const uniqueClusters = useMemo(() => [...new Set(filteredData.map(i => i["Cluster"]).filter(Boolean))], [filteredData]);

  const tableDataProcessed = useMemo(() => {
    let baseTableData = (tableStartDate || tableEndDate) ? data : filteredData;
    return baseTableData.filter(i => {
      if (tableStartDate || tableEndDate) {
        const formattedItemDate = parseDateToYYYYMMDD(i["Start Time"] || i["Timestamp"]);
        if (!formattedItemDate) return false;
        if (tableStartDate && formattedItemDate < tableStartDate) return false;
        if (tableEndDate && formattedItemDate > tableEndDate) return false;
      }
      if (tableDetailFilter === 'Active' && !i["Status TT"]?.toLowerCase().includes("open")) return false;
      if (tableDetailFilter === 'Out SLA' && !i["SLA Real"]?.toLowerCase().includes("out")) return false;
      if (tableDetailFilter === 'Overdue MTTR' && !(i["Status TT"]?.toLowerCase().includes("open") && i["SLA Real"]?.toLowerCase().includes("out"))) return false;
      if (tableSla === 'In SLA' && !i["SLA Real"]?.toLowerCase().includes("in")) return false;
      if (tableSla === 'Out SLA' && !i["SLA Real"]?.toLowerCase().includes("out")) return false;
      if (tableCluster !== 'All' && i["Cluster"] !== tableCluster) return false;
      if (tableCategory !== 'All' && i["Category"] !== tableCategory) return false;
      
      if (tableVipFilter === 'VIP' && !checkIsVIP(i)) return false;
      if (tableVipFilter === 'Non VIP' && checkIsVIP(i)) return false;

      const hasSiteFilter = tableSite.length > 0;
      const searchTerms = searchCustomer.trim().toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      const hasSearchFilter = searchTerms.length > 0;

      if (hasSiteFilter || hasSearchFilter) {
        let matchSite = false; if (hasSiteFilter) matchSite = tableSite.some(opt => opt.value === i["Site"]);
        let matchSearch = false;
        if (hasSearchFilter) {
          const customerInfo = (i["ID dan Nama Customer"] || "").toLowerCase(); const ttNo = (i["TT No"] || "").toLowerCase();
          matchSearch = searchTerms.some(term => customerInfo.includes(term) || ttNo.includes(term));
        }
        if (hasSiteFilter && hasSearchFilter) { if (!matchSite && !matchSearch) return false; } 
        else if (hasSiteFilter && !matchSite) return false;
        else if (hasSearchFilter && !matchSearch) return false;
      }
      return true;
    });
  }, [data, filteredData, tableStartDate, tableEndDate, tableDetailFilter, tableSla, tableCluster, tableCategory, tableVipFilter, tableSite, searchCustomer]);

  const barData = useMemo(() => {
    let baseRcaData = rcaDataSource === 'Global' ? filteredData : tableDataProcessed;
    const rootCauseCounts = baseRcaData.reduce((acc, i) => { acc[i["Root Cause"] || "Unspecified"] = (acc[i["Root Cause"] || "Unspecified"] || 0) + 1; return acc; }, {});
    return Object.keys(rootCauseCounts).map(k => ({ name: k, Total: rootCauseCounts[k] })).sort((a,b)=>b.Total-a.Total);
  }, [filteredData, tableDataProcessed, rcaDataSource]);

  const mttrDataAnalysis = useMemo(() => {
    let cumulativeMttr = 0;
    return uniqueWeeks.map((wk, idx) => {
      const wkData = data.filter(d => d.Week === wk);
      const vipData = wkData.filter(d => checkIsVIP(d));
      const nonVipData = wkData.filter(d => !checkIsVIP(d));

      const calcSla = (arr) => arr.length === 0 ? 0 : (arr.filter(d => String(d["SLA Real"]).toLowerCase().includes("in")).length / arr.length) * 100;
      const vipAchieve = calcSla(vipData);
      const nonVipAchieve = calcSla(nonVipData);
      const mttr = (vipData.length === 0 && nonVipData.length === 0) ? 0 : (vipAchieve + nonVipAchieve) / 2;

      cumulativeMttr += mttr;
      return { name: wk, "VIP SLA": vipAchieve, "Non-VIP SLA": nonVipAchieve, "MTTR": mttr, "MTTR YTD": cumulativeMttr / (idx + 1), "Target": 99 };
    });
  }, [data, uniqueWeeks]);

  const openModalDataList = (title, dataList) => {
    setListModalData({ title, data: dataList });
  };

  const openSlaDetail = (category, slaStatus) => {
    let list = category === 'Retail' ? metrics.retailData : metrics.enterpriseData;
    const specificData = list.filter(i => slaStatus === 'In SLA' ? i["SLA Real"]?.toLowerCase().includes("in") : i["SLA Real"]?.toLowerCase().includes("out"));
    openModalDataList(`Data SLA ${category} (${slaStatus})`, specificData);
  };

  const handlePieClick = (entry) => {
    if (entry.name === 'Closed TT') openModalDataList('Detail: Closed TT', metrics.completedTTList);
    else if (entry.name === 'Open TT') openModalDataList('Detail: Open TT', metrics.activeTTList);
  };

  const openTicketDetail = (ticket) => {
    setViewTicket(ticket);
    setEditFormData(ticket);
    setIsEditing(false);
  };

  const handleInputChange = (key, value) => {
    setEditFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveTicket = async () => {
    const updatedData = data.map(item => item["TT No"] === editFormData["TT No"] ? editFormData : item);
    setData(updatedData);

    try {
      console.log("Mock API Update Success:", editFormData);
    } catch(error) {
      console.error("Gagal menyimpan:", error);
      alert("Gagal menyimpan data ke server.");
    }

    setViewTicket(editFormData);
    setIsEditing(false);
    
    if (listModalData) {
      setListModalData(prev => ({
        ...prev,
        data: prev.data.map(item => item["TT No"] === editFormData["TT No"] ? editFormData : item)
      }));
    }
  };

  const exportToExcel = () => {
    if (tableDataProcessed.length === 0) { alert("Tidak ada data untuk didownload sesuai filter saat ini."); return; }
    const allHeaders = Object.keys(tableDataProcessed[0]);
    let tableHTML = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table border="1" style="font-family: Calibri, sans-serif; border-collapse: collapse;"><thead><tr>';
    allHeaders.forEach(h => { tableHTML += `<th style="background-color: #3b82f6; color: #ffffff; padding: 10px; font-weight: bold;">${h}</th>`; });
    tableHTML += '</tr></thead><tbody>';
    tableDataProcessed.forEach(row => {
      tableHTML += '<tr>';
      allHeaders.forEach(h => {
        let val = row[h] === undefined || row[h] === null ? '' : row[h];
        if (typeof val === 'string') val = val.replace(/(\r\n|\n|\r)/gm, " "); 
        tableHTML += `<td style='padding: 5px; mso-number-format:"\\@";'>${val}</td>`;
      });
      tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table></body></html>';
    const blob = new Blob(['\uFEFF' + tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `Report_NOC_Tickets_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // --- FUNGSI DOWNLOAD GAMBAR AREA MTTR ---
 // --- FUNGSI DOWNLOAD GAMBAR AREA MTTR ---
  const handleDownloadMttrImage = async () => {
    const element = mttrSectionRef.current;
    if (!element) return;

    try {
      const tableScrollArea = element.querySelector('.mttr-table-scroll');
      const chartBox = element.querySelector('.mttr-chart-box'); // Ambil elemen chart
      
      // 1. Simpan gaya asli
      const originalContainerWidth = element.style.width;
      const originalPadding = element.style.padding;
      const originalTableOverflow = tableScrollArea ? tableScrollArea.style.overflow : '';
      const originalChartWidth = chartBox ? chartBox.style.width : '';

      // 2. Hitung lebar asli konten tabel yang tersembunyi
      const fullWidth = tableScrollArea ? tableScrollArea.scrollWidth : element.offsetWidth;

      // 3. Paksa kontainer utama dan chart memanjang ke kanan sesuai ukuran asli tabel
      element.style.width = `${fullWidth + 40}px`; // +40px untuk margin/padding
      element.style.padding = '20px';
      
      if (tableScrollArea) {
        tableScrollArea.style.overflow = 'visible';
      }
      if (chartBox) {
        // Paksa lebar kotak grafik mengikuti lebar tabel agar garisnya ikut memanjang
        chartBox.style.width = `${fullWidth}px`; 
      }

      // 4. Beri jeda 500ms agar Recharts selesai merender animasi perubahaan ukurannya
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Proses Capture Gambar
      const canvas = await html2canvas(element, {
        scale: 2, 
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
        useCORS: true,
        windowWidth: fullWidth + 100 // Trik agar tidak terpotong viewport layar monitor Anda
      });

      // 6. Kembalikan gaya DOM ke kondisi semula agar tampilan dashboard normal kembali
      element.style.width = originalContainerWidth;
      element.style.padding = originalPadding; 
      
      if (tableScrollArea) {
        tableScrollArea.style.overflow = originalTableOverflow;
      }
      if (chartBox) {
        chartBox.style.width = originalChartWidth;
      }

      // 7. Download hasilnya
      const imageURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imageURL;
      link.download = `MTTR_SLA_Analysis_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Gagal men-download gambar:", error);
      alert("Terjadi kesalahan saat memproses gambar.");
    }
  };

  const PIE_COLORS = metrics.totalTT > 0 ? ['#10b981', '#f59e0b'] : [isDarkMode ? '#334155' : '#e5e7eb']; 

  const renderCustomPieLabel = ({ cx, cy, midAngle, outerRadius, value, index }) => {
    if (value === 0 || metrics.totalTT === 0) return null; 
    const RADIAN = Math.PI / 180; const radius = outerRadius + 15; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN); const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (<text x={x} y={y} fill={PIE_COLORS[index % PIE_COLORS.length]} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontWeight="bold" fontSize="16" style={{cursor: 'pointer'}}>{value}</text>);
  };

  const renderCustomBarLabel = (props) => {
    const { x, y, width, height, value, index } = props;
    if (!barData[index]) return null;
    const name = barData[index].name;
    const isShort = height < 80; 
    return (
      <g>
        <text x={x + width / 2} y={isShort ? y - 10 : y - 10} fill={isDarkMode ? '#f8fafc' : '#334155'} fontSize={12} fontWeight="bold" textAnchor="middle">
          {value}
        </text>
        <text 
          x={x + width / 2} 
          y={isShort ? y - 30 : y + height - 15} 
          fill={isShort ? (isDarkMode ? '#94a3b8' : '#64748b') : '#ffffff'} 
          fontSize={11} 
          fontWeight={isShort ? "normal" : "bold"} 
          textAnchor="start" 
          transform={`rotate(-90, ${x + width / 2}, ${isShort ? y - 30 : y + height - 15})`}
        >
          {name}
        </text>
      </g>
    );
  };

  const tableHeaders = ['TT No', 'Customer', 'Cluster', 'Root Cause', 'Category', 'Deskripsi Awal', 'Progress Update', 'NOC'];
  if (!isKioskMode) tableHeaders.push('Aksi');
  tableHeaders.push('SLA', 'Status');

  return (
    <div className={`dash-wrapper ${isDarkMode ? 'dark' : ''}`}>
      
      {isKioskMode && (
        <style>{`
          .sidebar { display: none !important; }
          .toggle-menu-btn { display: none !important; }
          .dash-header { padding-left: 0 !important; }
        `}</style>
      )}

      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

        .dash-wrapper { 
          --bg-main: transparent; 
          --bg-card: #ffffff; --text-main: #0f172a; --text-muted: #64748b; 
          --border: #e2e8f0; --input-bg: #ffffff; --table-hover: #f8fafc; --accent: #3b82f6;
          --gap: 24px; --card-padding: 24px; --border-radius: 12px;
          padding: 16px var(--gap) var(--gap) var(--gap); 
          color: var(--text-main); font-family: 'Inter', sans-serif; 
          min-height: 100vh; transition: color 0.3s; width: 100%; box-sizing: border-box;
        }
        .dash-wrapper.dark { 
          --bg-card: #1e293b; --text-main: #f8fafc; --text-muted: #94a3b8; 
          --border: #334155; --input-bg: #0f172a; --table-hover: #334155; --accent: #60a5fa;
        }

        .dash-header { 
          display: flex; justify-content: space-between; align-items: center; 
          margin-bottom: 20px; flex-wrap: wrap; gap: 16px; 
          padding-left: 45px; 
          min-height: 40px;
        }
        .dash-header-controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; }
        
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--gap); margin-bottom: var(--gap); }
        .metric-card { background: var(--bg-card); border-radius: var(--border-radius); padding: var(--card-padding); border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s; }
        
        .middle-grid { display: grid; grid-template-columns: 1.2fr 1fr 1.5fr; gap: var(--gap); margin-bottom: var(--gap); align-items: stretch; }
        .middle-card { background: var(--bg-card); padding: var(--card-padding); border-radius: var(--border-radius); border: 1px solid var(--border); display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: var(--gap); }
        .sla-split { display: flex; gap: 16px; flex: 1; margin-top: 16px; }
        
        .clickable-box { cursor: pointer; transition: filter 0.2s, transform 0.1s; }
        .clickable-box:hover { filter: brightness(0.95); transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        
        .sla-bar-segment { display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: bold; color: #fff; cursor: pointer; transition: filter 0.2s; }
        .sla-bar-segment:hover { filter: brightness(0.85); }

        .filter-bar { display: flex; gap: 10px; flex-wrap: wrap; width: 100%; margin-bottom: 16px; align-items: center; }
        .filter-input { height: 34px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--border); font-size: 0.85rem; flex: 1 1 150px; min-width: 120px; background: var(--input-bg); color: var(--text-main); box-sizing: border-box; outline: none; }
        .filter-input[type="date"]::-webkit-calendar-picker-indicator { filter: ${isDarkMode ? 'invert(1)' : 'none'}; cursor: pointer; }
        .filter-select-container { flex: 1 1 200px; min-width: 150px; }
        
        .btn-primary { height: 34px; padding: 0 14px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-sizing: border-box; transition: 0.2s; font-size: 0.85rem; }
        .btn-primary:hover { background: #059669; }
        .btn-secondary { height: 34px; padding: 0 14px; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-main); border-radius: 6px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; box-sizing: border-box; transition: 0.2s; font-size: 0.85rem; }
        .btn-secondary:hover { background: var(--table-hover); }

        .toggle-container { display: inline-flex; background: var(--input-bg); border-radius: 8px; padding: 3px; border: 1px solid var(--border); height: 34px; box-sizing: border-box; }
        .toggle-btn { padding: 0 14px; height: 100%; border: none; border-radius: 6px; font-size: 0.8rem; font-weight: bold; cursor: pointer; transition: 0.2s; display: flex; align-items: center; }
        .toggle-active-global { background: var(--bg-card); color: #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border); }
        .toggle-active-table { background: var(--bg-card); color: #10b981; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border); }
        .toggle-inactive { background: transparent; color: var(--text-muted); }
        
        .table-container { overflow-x: auto; overflow-y: auto; max-height: ${isKioskMode ? '600px' : '400px'}; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; min-width: 1000px; }
        thead th { position: sticky; top: 0; background-color: var(--input-bg); color: var(--text-muted); padding: 12px 14px; border-bottom: 2px solid var(--border); font-weight: 600; z-index: 1; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid var(--border); transition: background 0.15s; }
        tbody tr:hover { background-color: var(--table-hover); }
        tbody td { padding: 10px 14px; color: var(--text-main); }

        .mttr-container { display: flex; flex-direction: column; gap: var(--gap); border-radius: 8px; }
        .mttr-chart-box { height: 350px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card); padding: 16px; box-sizing: border-box; }
        .mttr-table-scroll { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card); }
        .matrix-table { width: 100%; min-width: max-content; }
        .matrix-table th { background-color: var(--input-bg); border-bottom: 1px solid var(--border); text-align: center; padding: 12px 8px; }
        .matrix-table td { text-align: center; font-weight: 600; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 10px 8px; white-space: nowrap; }
        .matrix-table tbody tr:last-child td { border-bottom: none; }
        .sticky-col { position: sticky; left: 0; background-color: var(--input-bg); z-index: 2; border-right: 2px solid var(--border) !important; text-align: left !important; padding-left: 14px !important; }

        .edit-input { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text-main); font-family: 'Inter', sans-serif; font-size: 0.95rem; box-sizing: border-box; }
        .edit-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }

        @media (max-width: 768px) {
          .dash-wrapper { padding: 12px; --gap: 16px; --card-padding: 16px; }
          .dash-header { padding-left: 0; flex-direction: column; align-items: stretch; margin-top: 40px; }
          .dash-header-controls { justify-content: flex-start; }
          .metrics-grid { grid-template-columns: 1fr; } 
          .middle-grid { grid-template-columns: 1fr; }
          .sla-split { flex-direction: column; gap: 12px; } 
          .filter-bar { flex-direction: column; align-items: stretch; }
          .filter-input, .filter-select-container { width: 100%; flex: 1 1 100%; }
        }
      `}</style>

      {/* HEADER & GLOBAL FILTER */}
      <div className="dash-header">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Dashboard NOC</h2>
        
        {!isKioskMode && (
          <div className="dash-header-controls">
            <button className="btn-secondary" onClick={fetchData} disabled={loading}>Refresh</button>
            <button className="btn-secondary" onClick={toggleDarkMode}>
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
            <button className="btn-primary" onClick={toggleKioskMode} style={{ background: '#8b5cf6' }}>
              TV Mode
            </button>
            
            <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }}></div>

            <select className="filter-input" value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); setStartDate(''); setEndDate(''); }} style={{ maxWidth: '130px' }}>
              <option value="All">All Time</option><option value="Month">By Month</option><option value="Week">By Week</option><option value="Date Range">Date Range</option>
            </select>
            {filterType === 'Month' && <select className="filter-input" value={filterValue} onChange={e=>setFilterValue(e.target.value)} style={{ maxWidth: '130px' }}><option value="">-- Pilih Bulan --</option>{uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}</select>}
            {filterType === 'Week' && <select className="filter-input" value={filterValue} onChange={e=>setFilterValue(e.target.value)} style={{ maxWidth: '130px' }}><option value="">-- Pilih Minggu --</option>{uniqueWeeks.map(w => <option key={w} value={w}>{w}</option>)}</select>}
            {filterType === 'Date Range' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <input type="date" className="filter-input" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{ maxWidth: '120px' }} />
                <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>-</span>
                <input type="date" className="filter-input" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{ maxWidth: '120px' }} />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* ROW 1: METRICS */}
      <div className="metrics-grid">
        <div className="metric-card clickable-box" onClick={() => openModalDataList('Total Tickets', filteredData)} style={{ borderLeft: '6px solid #3b82f6' }}><p style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:'bold', textTransform:'uppercase'}}>Total Tickets</p><h3 style={{margin:'8px 0 0', fontSize:'2.2rem', color:'var(--text-main)'}}>{metrics.totalTT}</h3></div>
        <div className="metric-card clickable-box" onClick={() => openModalDataList('Active Tickets (Open)', metrics.activeTTList)} style={{ borderLeft: '6px solid #f59e0b' }}><p style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:'bold', textTransform:'uppercase'}}>Active Tickets (Open)</p><h3 style={{margin:'8px 0 0', fontSize:'2.2rem', color:'var(--text-main)'}}>{metrics.activeTT}</h3></div>
        <div className="metric-card clickable-box" onClick={() => openModalDataList('Overdue MTTR Tickets', metrics.overdueMTTRList)} style={{ borderLeft: '6px solid #ef4444' }}><p style={{margin:0, fontSize:'0.85rem', color:'var(--text-muted)', fontWeight:'bold', textTransform:'uppercase'}}>Overdue MTTR</p><h3 style={{margin:'8px 0 0', fontSize:'2.2rem', color:'#ef4444'}}>{metrics.overdueMTTR}</h3></div>
      </div>

      {/* ROW 2: PIE & SLA PERFORMANCE */}
      <div className="middle-grid">
        <div className="middle-card" style={{ marginBottom: 0 }}>
          <h4 style={{ margin: '0 0 16px', color: 'var(--text-main)' }}>TT by Status</h4>
          <div style={{ flex: 1, minHeight: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={metrics.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" label={renderCustomPieLabel} labelLine={false} onClick={handlePieClick} style={{cursor: 'pointer'}}>
                  {metrics.pieData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: '0.85rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="clickable-box" onClick={() => openModalDataList('Completed TT', metrics.completedTTList)} style={{ backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4', border: `1px solid ${isDarkMode ? '#065f46' : '#bbf7d0'}`, padding: 'var(--card-padding)', borderRadius: 'var(--border-radius)', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{margin:0, fontSize:'0.85rem', color:'#10b981', fontWeight:'bold'}}>COMPLETED TT</p>
            <h2 style={{margin:'8px 0 0', fontSize:'2.5rem', color:'#10b981'}}>{metrics.completedTT}</h2>
          </div>
          <div className="sla-split">
            <div className="clickable-box" onClick={() => openModalDataList('All Tickets - IN SLA', metrics.inSLAList)} style={{ backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.1)' : '#ecfdf5', border: `1px solid ${isDarkMode ? '#064e3b' : '#a7f3d0'}`, padding: '16px', borderRadius: 'var(--border-radius)', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{margin:0, fontSize:'0.8rem', color:'#059669', fontWeight:'bold'}}>IN SLA</p>
              <h3 style={{margin:'8px 0 0', fontSize:'1.8rem', color:'#059669'}}>{metrics.inSLA}</h3>
            </div>
            <div className="clickable-box" onClick={() => openModalDataList('All Tickets - OUT SLA', metrics.outSLAList)} style={{ backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', border: `1px solid ${isDarkMode ? '#7f1d1d' : '#fecaca'}`, padding: '16px', borderRadius: 'var(--border-radius)', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{margin:0, fontSize:'0.8rem', color:'#ef4444', fontWeight:'bold'}}>OUT SLA</p>
              <h3 style={{margin:'8px 0 0', fontSize:'1.8rem', color:'#ef4444'}}>{metrics.outSLA}</h3>
            </div>
          </div>
        </div>

        <div className="middle-card" style={{ justifyContent: 'center', marginBottom: 0 }}>
          <h4 style={{ margin: '0 0 20px', color: 'var(--text-main)' }}>SLA Performance by Category</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px' }}><span style={{color:'var(--text-main)'}}>Retail <span style={{color:'#10b981'}}>{metrics.retailPerc}% In SLA</span></span><span style={{color:'var(--text-muted)'}}>Total: {metrics.retailData.length}</span></div>
            <div style={{ display: 'flex', height: '30px', borderRadius: '8px', overflow: 'hidden', background: isDarkMode ? '#334155' : '#e2e8f0' }}>
              <div className="sla-bar-segment" onClick={() => openSlaDetail('Retail', 'In SLA')} style={{ width: `${(metrics.retailInSLA/metrics.retailData.length)*100 || 0}%`, background: '#10b981' }}>{metrics.retailInSLA||''}</div>
              <div className="sla-bar-segment" onClick={() => openSlaDetail('Retail', 'Out SLA')} style={{ width: `${(metrics.retailOutSLA/metrics.retailData.length)*100 || 0}%`, background: '#ef4444' }}>{metrics.retailOutSLA||''}</div>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px' }}><span style={{color:'var(--text-main)'}}>Enterprise <span style={{color:'#10b981'}}>{metrics.entPerc}% In SLA</span></span><span style={{color:'var(--text-muted)'}}>Total: {metrics.enterpriseData.length}</span></div>
            <div style={{ display: 'flex', height: '30px', borderRadius: '8px', overflow: 'hidden', background: isDarkMode ? '#334155' : '#e2e8f0' }}>
              <div className="sla-bar-segment" onClick={() => openSlaDetail('Enterprise', 'In SLA')} style={{ width: `${(metrics.enterpriseInSLA/metrics.enterpriseData.length)*100 || 0}%`, background: '#10b981' }}>{metrics.enterpriseInSLA||''}</div>
              <div className="sla-bar-segment" onClick={() => openSlaDetail('Enterprise', 'Out SLA')} style={{ width: `${(metrics.enterpriseOutSLA/metrics.enterpriseData.length)*100 || 0}%`, background: '#ef4444' }}>{metrics.enterpriseOutSLA||''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: RCA CHART */}
      <div className="middle-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Root Cause Analysis</h3>
          
          {!isKioskMode && (
            <div className="toggle-container">
              <button onClick={() => setRcaDataSource('Global')} className={`toggle-btn ${rcaDataSource === 'Global' ? 'toggle-active-global' : 'toggle-inactive'}`}>Analytics</button>
              <button onClick={() => setRcaDataSource('Table')} className={`toggle-btn ${rcaDataSource === 'Table' ? 'toggle-active-table' : 'toggle-inactive'}`}>Table</button>
            </div>
          )}
        </div>
        <div style={{ width: '100%', height: 360 }}> 
          {barData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 90, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: isDarkMode ? '#334155' : '#f1f5f9'}} contentStyle={{backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#475569' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a', borderRadius: '8px'}} />
                <Bar dataKey="Total" fill={rcaDataSource === 'Global' ? "#3b82f6" : "#10b981"} radius={[4, 4, 0, 0]} barSize={45} label={renderCustomBarLabel} />
              </BarChart>
            </ResponsiveContainer>
          ) : ( <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Data tidak ditemukan.</div> )}
        </div>
      </div>

      {/* ROW 4: DATA TABLE TICKET DETAILS */}
      <div className="middle-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Ticket Details</h3>
            <span style={{ fontSize: '0.8rem', background: 'var(--table-hover)', padding: '6px 12px', borderRadius: '20px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{tableDataProcessed.length} entries</span>
          </div>
          
          {!isKioskMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--table-hover)', padding: '0 8px', borderRadius: '8px', border: '1px solid var(--border)', height: '34px', boxSizing: 'border-box' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', paddingLeft: '8px' }}>Filter:</span>
                <input type="date" value={tableStartDate} onChange={e=>setTableStartDate(e.target.value)} style={{ padding: '0 8px', height: '24px', border: 'none', borderRadius: '4px', fontSize: '0.8rem', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>-</span>
                <input type="date" value={tableEndDate} onChange={e=>setTableEndDate(e.target.value)} style={{ padding: '0 8px', height: '24px', border: 'none', borderRadius: '4px', fontSize: '0.8rem', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }} />
                {(tableStartDate || tableEndDate) && <button onClick={() => { setTableStartDate(''); setTableEndDate(''); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', padding: '0 8px', fontSize: '1rem' }}>✕</button>}
              </div>
              <button className="btn-primary" onClick={exportToExcel}>Download Excel</button>
            </div>
          )}
        </div>

        {!isKioskMode && (
          <div className="filter-bar">
            <input type="text" placeholder="Cari ID/Nama/TT (koma)..." value={searchCustomer} onChange={e=>setSearchCustomer(e.target.value)} className="filter-input" />
            
            <select value={tableVipFilter} onChange={e=>setTableVipFilter(e.target.value)} className="filter-input">
              <option value="All">All Type (VIP/Non)</option>
              <option value="VIP">VIP</option>
              <option value="Non VIP">Non VIP</option>
            </select>
            
            <select value={tableSla} onChange={e=>setTableSla(e.target.value)} className="filter-input"><option value="All">All SLA</option><option value="In SLA">In SLA</option><option value="Out SLA">Out SLA</option></select>
            <select value={tableCategory} onChange={e=>setTableCategory(e.target.value)} className="filter-input"><option value="All">All Category</option><option value="Retail">Retail</option><option value="Enterprise">Enterprise</option></select>
            <div className="filter-select-container">
              <Select 
                isMulti options={siteOptions} value={tableSite} onChange={setTableSite} placeholder="Sites..." 
                styles={{ 
                  control: (b) => ({...b, minHeight:'34px', height:'34px', borderRadius:'6px', borderColor: isDarkMode ? '#334155' : '#e2e8f0', backgroundColor: isDarkMode ? '#0f172a' : '#fff'}),
                  menu: (b) => ({...b, backgroundColor: isDarkMode ? '#1e293b' : '#fff', zIndex: 10}),
                  option: (b, { isFocused }) => ({...b, backgroundColor: isFocused ? (isDarkMode ? '#334155' : '#f1f5f9') : 'transparent', color: isDarkMode ? '#f8fafc' : '#1f2937'}),
                  multiValue: (b) => ({...b, backgroundColor: isDarkMode ? '#334155' : '#e2e8f0'}),
                  multiValueLabel: (b) => ({...b, color: isDarkMode ? '#f8fafc' : '#1f2937'})
                }} 
                menuPortalTarget={document.body} 
              />
            </div>
            <select value={tableCluster} onChange={e=>setTableCluster(e.target.value)} className="filter-input"><option value="All">All Clusters</option>{uniqueClusters.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <select value={tableDetailFilter} onChange={e=>setTableDetailFilter(e.target.value)} className="filter-input" style={{fontWeight:'bold'}}><option value="All">All Tickets</option><option value="Active">Active Tickets</option><option value="Out SLA">Out SLA</option></select>
          </div>
        )}
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {tableHeaders.map(h => (<th key={h}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {tableDataProcessed.map((r, i) => {
                const isOp = r["Status TT"]?.toLowerCase().includes("open"); const isOutSla = r["SLA Real"]?.toLowerCase().includes("out");
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{r["TT No"]}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r["ID dan Nama Customer"]}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r["Cluster"]}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r["Root Cause"]}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r["Category"]}</td>
                    <td style={{ minWidth: '150px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{r["Deskripsi Awal"] || r["Deskripsi"] || "-"}</td>
                    <td style={{ minWidth: '150px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{r["Progress Update"] || "-"}</td>
                    <td style={{ fontWeight: '600', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>{r["NOC"] || "-"}</td>
                    
                    {!isKioskMode && (
                      <td><button onClick={() => openTicketDetail(r)} style={{ padding: '6px 14px', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', color: 'var(--text-main)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>Lihat / Edit</button></td>
                    )}
                    
                    <td style={{ whiteSpace: 'nowrap' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOutSla ? '#ef4444' : '#10b981', marginRight: '6px' }}></span><span style={{ color: isOutSla ? '#ef4444' : '#10b981', fontWeight: '700' }}>{r["SLA Real"] || '-'}</span></td>
                    <td><span style={{ padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', whiteSpace: 'nowrap', backgroundColor: isOp ? 'rgba(217, 119, 6, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: isOp ? '#d97706' : '#10b981' }}>{r["Status TT"]}</span></td>
                  </tr>
                );
              })}
              {tableDataProcessed.length === 0 && (<tr><td colSpan={isKioskMode ? "10" : "11"} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data tiket sesuai filter.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 5: MTTR YTD TRACKING (DENGAN TOMBOL DOWNLOAD SCREENSHOT) */}
      <div className="middle-card" style={{ marginBottom: 0 }}>
        
        {/* Header MTTR dengan tombol download */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>MTTR & SLA Weekly Analysis YTD</h3>
          {!isKioskMode && (
            <button onClick={handleDownloadMttrImage} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#3b82f6', color: '#3b82f6' }}>
              📸 Download Gambar
            </button>
          )}
        </div>
        
        {/* AREA INI YANG AKAN DI SCREENSHOT */}
        <div className="mttr-container" ref={mttrSectionRef} style={{ backgroundColor: 'var(--bg-card)', padding: '10px' }}>
          
          
            <div className="mttr-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mttrDataAnalysis} margin={{ top: 35, right: 20, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 100]} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderColor: isDarkMode ? '#475569' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a', borderRadius: '8px'}} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.85rem' }} />
                
                {/* PENAMBAHAN: isAnimationActive={false} untuk mematikan animasi */}
                <Line type="monotone" dataKey="MTTR YTD" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, strokeWidth: 2, fill: isDarkMode ? '#1e293b' : '#fff' }} activeDot={{ r: 8 }} isAnimationActive={false}>
                  <LabelList dataKey="MTTR YTD" position="top" offset={12} formatter={(val) => `${val.toFixed(1)}%`} fill={isDarkMode ? '#f8fafc' : '#334155'} fontSize={11} fontWeight="bold" />
                </Line>
                
                {/* PENAMBAHAN: isAnimationActive={false} untuk garis target */}
                <Line type="monotone" dataKey="Target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mttr-table-scroll">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="sticky-col">Metrics</th>
                  {mttrDataAnalysis.map(d => <th key={d.name}>{d.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sticky-col" style={{ color: 'var(--text-muted)' }}>VIP [Achieve in SLA]</td>
                  {mttrDataAnalysis.map(d => <td key={d.name} style={{ color: d["VIP SLA"] >= 99.5 ? '#10b981' : '#ef4444' }}>{d["VIP SLA"].toFixed(1)}%</td>)}
                </tr>
                <tr>
                  <td className="sticky-col" style={{ color: 'var(--text-muted)' }}>Non VIP [Achieve in SLA]</td>
                  {mttrDataAnalysis.map(d => <td key={d.name} style={{ color: d["Non-VIP SLA"] >= 99.0 ? '#10b981' : '#ef4444' }}>{d["Non-VIP SLA"].toFixed(1)}%</td>)}
                </tr>
                <tr style={{ backgroundColor: 'var(--table-hover)' }}>
                  <td className="sticky-col" style={{ color: 'var(--text-main)' }}>MTTR Average</td>
                  {mttrDataAnalysis.map(d => <td key={d.name} style={{ color: '#3b82f6' }}>{d["MTTR"].toFixed(1)}%</td>)}
                </tr>
                <tr style={{ backgroundColor: 'var(--table-hover)' }}>
                  <td className="sticky-col" style={{ color: 'var(--text-main)' }}>MTTR YTD</td>
                  {mttrDataAnalysis.map(d => <td key={d.name} style={{ color: '#8b5cf6' }}>{d["MTTR YTD"].toFixed(1)}%</td>)}
                </tr>
                <tr>
                  <td className="sticky-col" style={{ color: 'var(--text-muted)' }}>Target (Threshold)</td>
                  {mttrDataAnalysis.map(d => <td key={d.name} style={{ color: '#f59e0b' }}>99%</td>)}
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ----------------- MODAL POPUP UNIVERSAL (LIST DATA) ----------------- */}
      {listModalData && !isKioskMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', boxSizing: 'border-box', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '1400px', height: '85vh', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-main)', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>{listModalData.title} <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>({listModalData.data.length} entries)</span></h2>
              <button onClick={() => setListModalData(null)} style={{ background: 'none', border: 'none', fontSize: '2rem', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1, transition: '0.2s' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '0 0 16px 16px' }}>
              <div className="table-container" style={{maxHeight: 'none', height: '100%'}}>
                <table>
                  <thead>
                    <tr>
                      {tableHeaders.map(h => (<th key={h}>{h}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {listModalData.data.map((r, i) => {
                      const isOp = r["Status TT"]?.toLowerCase().includes("open"); const isOutSla = r["SLA Real"]?.toLowerCase().includes("out");
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{r["TT No"]}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{r["ID dan Nama Customer"]}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{r["Cluster"]}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{r["Root Cause"]}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{r["Category"]}</td>
                          <td style={{ minWidth: '150px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{r["Deskripsi Awal"] || r["Deskripsi"] || "-"}</td>
                          <td style={{ minWidth: '150px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{r["Progress Update"] || "-"}</td>
                          <td style={{ fontWeight: '600', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>{r["NOC"] || "-"}</td>
                          
                          <td><button onClick={() => openTicketDetail(r)} style={{ padding: '6px 14px', backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', color: 'var(--text-main)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>Lihat / Edit</button></td>
                          
                          <td style={{ whiteSpace: 'nowrap' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isOutSla ? '#ef4444' : '#10b981', marginRight: '6px' }}></span><span style={{ color: isOutSla ? '#ef4444' : '#10b981', fontWeight: '700' }}>{r["SLA Real"] || '-'}</span></td>
                          <td><span style={{ padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.7rem', textTransform: 'uppercase', whiteSpace: 'nowrap', backgroundColor: isOp ? 'rgba(217, 119, 6, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: isOp ? '#d97706' : '#10b981' }}>{r["Status TT"]}</span></td>
                        </tr>
                      );
                    })}
                    {listModalData.data.length === 0 && (<tr><td colSpan="11" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data tiket pada kategori ini.</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL POP-UP DETAIL SPESIFIK & EDIT TIKET ----------------- */}
      {viewTicket && !isKioskMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px', boxSizing: 'border-box', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '1200px', height: '85vh', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-main)', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)' }}>Detail Tiket: <span style={{ color: '#3b82f6' }}>{viewTicket["TT No"]}</span></h2>
                {isEditing ? (
                  <span style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>Mode Edit Aktif</span>
                ) : null}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>✏️ Edit Data</button>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary" style={{ color: '#ef4444' }}>Batal</button>
                    <button onClick={handleSaveTicket} className="btn-primary" style={{ backgroundColor: '#3b82f6' }}>💾 Simpan Perubahan</button>
                  </>
                )}
                
                <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 4px' }}></div>
                <button onClick={() => setViewTicket(null)} style={{ background: 'none', border: 'none', fontSize: '2rem', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1, transition: '0.2s' }}>&times;</button>
              </div>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '0 0 16px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {Object.entries(viewTicket).map(([key, value]) => {
                  if (!key || key.trim() === '') return null; 
                  
                  const isReadOnly = key === 'TT No'; 

                  return (
                    <div key={key} style={{ backgroundColor: isEditing && !isReadOnly ? 'var(--bg-card)' : 'var(--bg-main)', padding: '16px 20px', borderRadius: '10px', border: `1px solid ${isEditing && !isReadOnly ? '#3b82f6' : 'var(--border)'}`, transition: '0.2s' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{key}</span>
                      
                      {isEditing && !isReadOnly ? (
                        <input 
                          type="text" 
                          className="edit-input" 
                          value={editFormData[key] || ''} 
                          onChange={(e) => handleInputChange(key, e.target.value)} 
                        />
                      ) : (
                        <span style={{ fontSize: '1rem', color: 'var(--text-main)', wordBreak: 'break-word', fontWeight: '500', lineHeight: '1.5' }}>{value || '-'}</span>
                      )}
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

export default Dashboard;