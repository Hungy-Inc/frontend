'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const months = [
  { value: 0, label: 'All Months' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

type VolunteerRow = {
  [key: string]: string | number;
};

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 2020; y--) {
    years.push(y);
  }
  return years;
};

export default function VolunteersPage() {
  const [columns, setColumns] = useState<string[]>([]);
  const [tableData, setTableData] = useState<VolunteerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteer-hours?month=${selectedMonth}&year=${selectedYear}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch volunteer hours');
        const data = await response.json();
        setColumns(data.columns);
        setTableData(data.tableData);
      } catch (err) {
        setColumns([]);
        setTableData([]);
        setError('Failed to load volunteer hours.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Halifax'
    });
  };

  // Export to Excel handler
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteer-hours/export?month=${selectedMonth}&year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to export Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `volunteer-hours-${selectedYear}-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed successfully!');
    } catch (err) {
      toast.error('Failed to export Excel.');
    }
  };

  // Helper to aggregate data by month if 'All Months' is selected
  const getDisplayData = () => {
    if (selectedMonth !== 0) return { columns, data: tableData, firstCol: 'Date' };
    // Aggregate by month
    const monthMap: { [month: number]: any } = {};
    // Initialize all months
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { Month: months[m].label };
      columns.forEach(col => {
        if (col !== 'Date') monthMap[m][col] = 0;
      });
    }
    tableData.forEach(row => {
      const d = new Date(row['Date'] as string || row['date'] as string);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      columns.forEach(col => {
        if (col !== 'Date' && typeof row[col] === 'number') {
          monthMap[m][col] += Number(row[col]);
        }
      });
    });
    // Build display data for all months
    const displayData = Object.values(monthMap);
    const newColumns = ['Month', ...columns.filter(col => col !== 'Date')];
    return { columns: newColumns, data: displayData, firstCol: 'Month' };
  };
  const { columns: displayColumns, data: displayData, firstCol } = getDisplayData();

  return (
    <main className={styles.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div className={styles.pageTitle}>Volunteer Hours Breakdown</div>
          <div className={styles.pageSubtitle}>Track volunteer hours by date and category</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            className={styles.select}
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{ minWidth: 130 }}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className={styles.select}
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ minWidth: 100 }}
          >
            {getYearOptions().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className={styles.exportBtn} onClick={handleExport} type="button">
            Export to Excel
          </button>
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>{error}</div>
          ) : tableData.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>No volunteer data found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  {displayColumns.map(col => <th key={col}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {displayData.map((row, i) => (
                  <tr key={i}>
                    {displayColumns.map((col, idx) => (
                      <td
                        key={col}
                        className={idx === displayColumns.length - 1 ? styles.totalCol : ''}
                      >
                        {col === firstCol
                          ? (firstCol === 'Month' ? row[col] : formatDate(row[col] as string))
                          : row[col] !== undefined ? row[col] : ''}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total hours row */}
                <tr className={styles.monthlyTotalRow} style={{ fontWeight: 700 }}>
                  {displayColumns.map((col, idx) => {
                    if (col === firstCol) return <td key={col} className={styles.totalCol}>Total Hours</td>;
                    const total = displayData.reduce((sum, row) => sum + (typeof row[col] === 'number' ? Number(row[col]) : 0), 0);
                    return <td key={col} className={idx === displayColumns.length - 1 ? styles.totalCol : ''}>{total.toFixed(2)}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
} 