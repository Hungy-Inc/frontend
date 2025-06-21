'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useEffect, useState } from 'react';

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

type OutgoingRow = {
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

export default function OutgoingStatsPage() {
  const [columns, setColumns] = useState<string[]>([]);
  const [tableData, setTableData] = useState<OutgoingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/filtered?month=${selectedMonth}&year=${selectedYear}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (!response.ok) throw new Error('Failed to fetch outgoing stats');
        const data = await response.json();
        setColumns(data.columns);
        setTableData(data.tableData);
      } catch (err) {
        setColumns([]);
        setTableData([]);
        setError('Failed to load outgoing stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Export to Excel handler
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/filtered/export?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to export Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outgoing-stats-${selectedYear}-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export Excel.');
    }
  };

  // Helper to convert weight based on selected unit
  const convertWeight = (value: number | string) => {
    if (typeof value !== 'number') return value;
    return weightUnit === 'lbs' ? (value * 2.20462).toFixed(2) : value.toFixed(2);
  };

  // Helper to convert weight for calculations (returns number)
  const convertWeightForCalculation = (value: number | string) => {
    if (typeof value !== 'number') return 0;
    return weightUnit === 'lbs' ? (value * 2.20462) : value;
  };

  // Modify getDisplayData to handle weight conversion
  const getDisplayData = () => {
    // Remove 'Collections' column from columns
    const filteredColumns = columns.filter(col => col !== 'Collections');
    if (selectedMonth !== 0) return { 
      columns: filteredColumns, 
      data: tableData.map(row => {
        const newRow = { ...row };
        delete newRow['Collections'];
        // Convert weight columns
        Object.keys(newRow).forEach(key => {
          if (key !== 'Date' && typeof newRow[key] === 'number') {
            newRow[key] = convertWeight(newRow[key]);
          }
        });
        return newRow;
      }), 
      firstCol: 'Date' 
    };

    // Aggregate by month
    const monthMap: { [month: number]: any } = {};
    // Initialize all months
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { Month: months[m].label };
      filteredColumns.forEach(col => {
        if (col !== 'Date') monthMap[m][col] = 0;
      });
    }
    tableData.forEach(row => {
      const d = new Date(row['Date'] as string);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      filteredColumns.forEach(col => {
        if (col !== 'Date' && typeof row[col] === 'number') {
          monthMap[m][col] += Number(row[col]);
        }
      });
    });
    // Build display data for all months and convert weights
    const displayData = Object.values(monthMap).map(monthData => {
      const convertedData = { ...monthData };
      Object.keys(convertedData).forEach(key => {
        if (key !== 'Month' && typeof convertedData[key] === 'number') {
          convertedData[key] = convertWeight(convertedData[key]);
        }
      });
      return convertedData;
    });
    const newColumns = ['Month', ...filteredColumns.filter(col => col !== 'Date')];
    return { columns: newColumns, data: displayData, firstCol: 'Month' };
  };
  const { columns: displayColumns, data: displayData, firstCol } = getDisplayData();

  // Calculate totals from original data (before conversion to strings)
  const calculateTotals = () => {
    if (selectedMonth !== 0) {
      // For monthly view, sum the original tableData
      const totals: { [key: string]: number } = {};
      displayColumns.forEach(col => {
        if (col !== firstCol) {
          totals[col] = tableData.reduce((sum, row) => {
            const value = row[col];
            if (typeof value === 'number') {
              return sum + convertWeightForCalculation(value);
            }
            return sum;
          }, 0);
        }
      });
      return totals;
    } else {
      // For yearly view, sum the monthly aggregated data before conversion
      const totals: { [key: string]: number } = {};
      displayColumns.forEach(col => {
        if (col !== firstCol) {
          totals[col] = 0;
          // Recalculate from original tableData
          tableData.forEach(row => {
            const d = new Date(row['Date'] as string);
            if (!isNaN(d.getTime()) && typeof row[col] === 'number') {
              totals[col] += convertWeightForCalculation(row[col]);
            }
          });
        }
      });
      return totals;
    }
  };

  const totals = calculateTotals();

  return (
    <main className={styles.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className={styles.topBar} style={{ marginBottom: 0 }}>
          <div>
            <div className={styles.pageTitle}>Outgoing Meal & Outreach Counts</div>
            <div className={styles.pageSubtitle}>Track meals and outreach by date and category</div>
          </div>
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
          <select
            className={styles.select}
            value={weightUnit}
            onChange={e => setWeightUnit(e.target.value as 'kg' | 'lbs')}
            style={{ minWidth: 100 }}
          >
            <option value="kg">Kilograms</option>
            <option value="lbs">Pounds</option>
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
            <div style={{ padding: 32, textAlign: 'center' }}>No meals served in this month.</div>
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
                {/* Total row */}
                <tr className={styles.monthlyTotalRow} style={{ fontWeight: 700 }}>
                  {displayColumns.map((col, idx) => {
                    if (col === firstCol) return <td key={col} className={styles.totalCol}>{firstCol === 'Month' ? 'Yearly Total' : 'Monthly Total'}</td>;
                    const total = totals[col] || 0;
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