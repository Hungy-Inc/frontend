'use client';

import { useEffect, useState } from 'react';
import styles from './IncomingStats.module.css';

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

const units = ['Kilograms (kg)', 'Pounds (lb)'];

type TableRow = {
  date: string;
  [key: string]: string | number;
};

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  // Show a range of years, e.g., 2020 to currentYear+1
  const years = [];
  for (let y = currentYear + 1; y >= 2020; y--) {
    years.push(y);
  }
  return years;
};

export default function IncomingStatsPage() {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(units[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default to current year
  const [donors, setDonors] = useState<string[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [totals, setTotals] = useState<{ [key: string]: number }>({});
  const [rowTotals, setRowTotals] = useState<number[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/incoming-stats?month=${selectedMonth}&year=${selectedYear}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setDonors(data.donors);
        setTableData(data.tableData);
        setTotals(data.totals);
        setRowTotals(data.rowTotals);
        setGrandTotal(data.grandTotal);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  const convertWeight = (weight: number) => {
    if (weight == null || isNaN(weight)) return '-';
    if (selectedUnit === 'Pounds (lb)') {
      return (weight * 2.20462).toFixed(2);
    }
    return weight.toFixed(2);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found');
        return;
      }
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
        unit: selectedUnit
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incoming-stats/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incoming-stats-${selectedYear}-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  // Helper to aggregate data by month if 'All Months' is selected
  const getDisplayData = () => {
    if (selectedMonth !== 0) {
      // Calculate row totals for each row
      const dataWithTotals = tableData.map(row => {
        const rowTotal = donors.reduce((sum, donor) => {
          const value = typeof row[donor] === 'number' ? Number(row[donor]) : 0;
          return sum + value;
        }, 0);
        return { ...row, Total: rowTotal };
      });
      return { columns: ['Date', ...donors, 'Total'], data: dataWithTotals, firstCol: 'Date' };
    }
    // Aggregate by month
    const monthMap: { [month: number]: any } = {};
    // Initialize all months
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { Month: months[m].label };
      donors.forEach(donor => {
        monthMap[m][donor] = 0;
      });
      monthMap[m]['Total'] = 0;
    }
    tableData.forEach(row => {
      const d = new Date(row['date'] as string);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      let rowTotal = 0;
      donors.forEach(donor => {
        if (typeof row[donor] === 'number') {
          const value = Number(row[donor]);
          monthMap[m][donor] += value;
          rowTotal += value;
        }
      });
      monthMap[m]['Total'] += rowTotal;
    });
    // Build display data for all months
    const displayData = Object.values(monthMap);
    const newColumns = ['Month', ...donors, 'Total'];
    return { columns: newColumns, data: displayData, firstCol: 'Month' };
  };
  const { columns: displayColumns, data: displayData, firstCol } = getDisplayData();

  // Calculate column totals
  const calculateColumnTotal = (col: string) => {
    if (col === firstCol) return '';
    return convertWeight(displayData.reduce((sum, row) => {
      const value = typeof row[col] === 'number' ? Number(row[col]) : 0;
      return sum + value;
    }, 0));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Check if there's no data for the selected month
  const hasNoData = selectedMonth !== 0 && tableData.length === 0;

  return (
    <main className={styles.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className={styles.topBar} style={{ marginBottom: 0 }}>
          <div>
            <div className={styles.pageTitle}>Incoming Stats</div>
            <div className={styles.pageSubtitle}>Track food donations by organization and date</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select 
            className={styles.select}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{ marginRight: 8 }}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select 
            className={styles.select}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ marginRight: 8 }}
          >
            {getYearOptions().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select 
            className={styles.select}
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            style={{ marginRight: 8 }}
          >
            {units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <button className={styles.exportBtn} onClick={handleExport} style={{ marginRight: 8 }}>Export to Excel</button>
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <div className={styles.tableTitle}>
          Incoming Food Donations – <span className={styles.month}>
            {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </span>
        </div>
        {hasNoData ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No donations found for {months[selectedMonth].label} {selectedYear}
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {displayColumns.map(col => <th key={col} className={col === 'Total' ? styles.totalCol : ''}>{col}</th>)}
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
                          ? (firstCol === 'Date' ? formatDate(row['date'] as string) : row[col])
                          : convertWeight(row[col] as number)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className={styles.monthlyTotalRow}>
                  <td style={{ fontWeight: 700 }}>{firstCol === 'Month' ? 'Yearly Total' : 'Monthly Total'}</td>
                  {displayColumns.slice(1).map((col) => (
                    <td key={col} className={col === 'Total' ? styles.totalCol : ''}>
                      {calculateColumnTotal(col)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
} 