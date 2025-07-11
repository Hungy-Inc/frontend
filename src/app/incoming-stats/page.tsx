'use client';

import { useEffect, useState } from 'react';
import styles from './IncomingStats.module.css';
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

const baseUnits = ['Kilograms (kg)', 'Pounds (lb)'];

type TableRow = {
  date: string;
  [key: string]: string | number;
};

type WeighingCategory = {
  id: number;
  category: string;
  kilogram_kg_: number;
  pound_lb_: number;
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
  const [selectedUnit, setSelectedUnit] = useState(baseUnits[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default to current year
  const [donors, setDonors] = useState<string[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [totals, setTotals] = useState<{ [key: string]: number }>({});
  const [rowTotals, setRowTotals] = useState<number[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weighingCategories, setWeighingCategories] = useState<WeighingCategory[]>([]);

  // Fetch weighing categories
  useEffect(() => {
    const fetchWeighingCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing-categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setWeighingCategories(data || []);
        }
      } catch (err) {
        console.error('Error fetching weighing categories:', err);
      }
    };
    
    fetchWeighingCategories();
  }, []);

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
        setDonors(data.donors || []);
        setTableData(data.tableData || []);
        setTotals(data.totals || {});
        setRowTotals(data.rowTotals || []);
        setGrandTotal(data.grandTotal || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  // Helper to convert weight based on selected unit
  const convertWeight = (weight: number) => {
    if (weight == null || isNaN(weight)) return '-';
    
    // Handle base units
    if (selectedUnit === 'Pounds (lb)') {
      return (weight * 2.20462).toFixed(2);
    }
    if (selectedUnit === 'Kilograms (kg)') {
      return weight.toFixed(2);
    }
    
    // Handle custom weighing categories
    const category = weighingCategories.find(c => c.category === selectedUnit);
    if (category && category.kilogram_kg_ > 0) {
      // Convert kg to custom unit (divide by kg per unit)
      return (weight / category.kilogram_kg_).toFixed(2);
    }
    
    return weight.toFixed(2);
  };

  // Helper to get unit label for display
  const getUnitLabel = () => {
    if (selectedUnit === 'Kilograms (kg)') return 'kg';
    if (selectedUnit === 'Pounds (lb)') return 'lbs';
    return selectedUnit;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'America/Halifax'
    });
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
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
      toast.success('Export completed successfully!');
    } catch (err) {
      toast.error('Export failed. Please try again.');
    }
  };

  // Helper to aggregate data by month if 'All Months' is selected
  const getDisplayData = () => {
    // Ensure required data exists
    if (!donors || donors.length === 0) {
      return { columns: ['Date', 'Total'], data: [], firstCol: 'Date' };
    }

    if (selectedMonth !== 0) {
      // Calculate row totals for each row
      const dataWithTotals = tableData.map((row, index) => {
        const rowTotal = rowTotals[index] || donors.reduce((sum, donor) => {
          const value = typeof row[donor] === 'number' ? Number(row[donor]) : 0;
          return sum + value;
        }, 0);
        return { ...row, Total: rowTotal };
      });
      return { columns: ['Date', ...donors, 'Total'], data: dataWithTotals, firstCol: 'Date' };
    }

    // Aggregate by month for 'All Months' view
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
    if (col === firstCol) return firstCol === 'Month' ? 'Yearly Total' : 'Monthly Total';
    if (col === 'Total') {
      return convertWeight(grandTotal);
    }
    return convertWeight(totals[col] || 0);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Check if there's no data for the selected period
  const hasNoData = !tableData || tableData.length === 0;

  // Combine base units with weighing categories for dropdown
  const allUnits = [...baseUnits, ...weighingCategories.map(c => c.category)];

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
            {allUnits.map(u => (
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
            No donations found for {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {displayColumns.map(col => (
                    <th key={col} className={col === 'Total' ? styles.totalCol : ''}>
                      {col} {col !== firstCol && col !== 'Total' ? `(${getUnitLabel()})` : ''}
                    </th>
                  ))}
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
                          : convertWeight(row[col] as number || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className={styles.monthlyTotalRow}>
                  {displayColumns.map((col) => (
                    <td key={col} className={col === 'Total' ? styles.totalCol : ''} style={{ fontWeight: 700 }}>
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