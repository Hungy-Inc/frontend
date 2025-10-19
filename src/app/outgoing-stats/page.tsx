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

type OutgoingTab = 'consolidated' | 'shift-categories' | 'foodbox' | 'outreach';

type OutgoingRow = {
  [key: string]: string | number;
};

type ConsolidatedRow = {
  date: string;
  totalMealsServed: number;
  foodBoxesDistributed: number;
  mealsFromFoodBoxes: number;
  outreachCount: number;
  totalImpact: number;
};

type FoodBoxRow = {
  date: string;
  foodBoxCount: number;
  mealsPerBox: number;
  totalMeals: number;
  distributedBy: string;
};

type OutreachRow = {
  date: string;
  [locationName: string]: string | number;
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
  // Tab state
  const [activeTab, setActiveTab] = useState<OutgoingTab>('consolidated');
  
  // Common state
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab-specific state
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedRow[]>([]);
  const [shiftCategoriesData, setShiftCategoriesData] = useState<OutgoingRow[]>([]);
  const [shiftCategoriesColumns, setShiftCategoriesColumns] = useState<string[]>([]);
  const [foodBoxData, setFoodBoxData] = useState<FoodBoxRow[]>([]);
  const [outreachData, setOutreachData] = useState<OutreachRow[]>([]);
  const [outreachColumns, setOutreachColumns] = useState<string[]>([]);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        switch (activeTab) {
          case 'consolidated':
            await fetchConsolidatedData(token);
            break;
          case 'shift-categories':
            await fetchShiftCategoriesData(token);
            break;
          case 'foodbox':
            await fetchFoodBoxData(token);
            break;
          case 'outreach':
            await fetchOutreachData(token);
            break;
        }
      } catch (err) {
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, selectedMonth, selectedYear]);

  const fetchConsolidatedData = async (token: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/consolidated?month=${selectedMonth}&year=${selectedYear}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch consolidated data');
    const data = await response.json();
    setConsolidatedData(data);
  };

  const fetchShiftCategoriesData = async (token: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/filtered?month=${selectedMonth}&year=${selectedYear}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch shift categories data');
    const data = await response.json();
    setShiftCategoriesColumns(data.columns);
    setShiftCategoriesData(data.tableData);
  };

  const fetchFoodBoxData = async (token: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/foodbox?month=${selectedMonth}&year=${selectedYear}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch food box data');
    const data = await response.json();
    setFoodBoxData(data);
  };

  const fetchOutreachData = async (token: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/outreach?month=${selectedMonth}&year=${selectedYear}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch outreach data');
    const data = await response.json();
    setOutreachColumns(data.columns);
    setOutreachData(data.tableData);
  };

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
      if (!token) {
        throw new Error('No authentication token found');
      }
      const endpoint = activeTab === 'shift-categories' 
        ? 'filtered' 
        : activeTab;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/${endpoint}/export?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to export Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outgoing-stats-${activeTab}-${selectedYear}-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed successfully!');
    } catch (err) {
      toast.error('Failed to export Excel.');
    }
  };

  // Export consolidated Excel handler
  const handleConsolidatedExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/consolidated-excel/export?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (!response.ok) throw new Error('Failed to export consolidated Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outgoing-stats-consolidated-${selectedYear}-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Consolidated export completed successfully!');
    } catch (err) {
      toast.error('Failed to export consolidated Excel.');
    }
  };

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
    }
    
    if (error) {
      return <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>{error}</div>;
    }

    switch (activeTab) {
      case 'consolidated':
        return renderConsolidatedTab();
      case 'shift-categories':
        return renderShiftCategoriesTab();
      case 'foodbox':
        return renderFoodBoxTab();
      case 'outreach':
        return renderOutreachTab();
      default:
        return null;
    }
  };

  const renderConsolidatedTab = () => {
    if (consolidatedData.length === 0) {
      return (
        <div className={styles.tableWrapper}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No consolidated data available for {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </div>
        </div>
      );
    }

    let displayData = consolidatedData;
    let firstColumn = 'Date';

    // If "All Months" is selected, aggregate by month
    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};
      
      // Initialize all months
      for (let m = 1; m <= 12; m++) {
        monthMap[m] = { 
          Month: months[m].label,
          totalMealsServed: 0,
          mealsFromFoodBoxes: 0,
          outreachCount: 0,
          totalImpact: 0
        };
      }

      // Aggregate data by month
      consolidatedData.forEach(row => {
        const d = new Date(row.date);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
        monthMap[m].totalMealsServed += row.totalMealsServed;
        monthMap[m].mealsFromFoodBoxes += row.mealsFromFoodBoxes;
        monthMap[m].outreachCount += row.outreachCount;
        monthMap[m].totalImpact += row.totalImpact;
      });

      // Convert to array - show all 12 months
      displayData = Object.values(monthMap);
      firstColumn = 'Month';
    }

    return (
      <div className={styles.tableWrapper}>
        <div className={styles.tableTitle}>
          Consolidated Outgoing Overview – <span className={styles.month}>
            {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </span>
        </div>
        <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className={styles.table} style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>{firstColumn}</th>
                <th>Total Meals Served</th>
                <th>Meals from Food Boxes</th>
                <th>Outreach Count</th>
                <th className={styles.totalCol}>Total Impact</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i}>
                  <td>{firstColumn === 'Date' ? formatDate(row.date) : row.Month}</td>
                  <td>{row.totalMealsServed}</td>
                  <td>{row.mealsFromFoodBoxes}</td>
                  <td>{row.outreachCount}</td>
                  <td className={styles.totalCol}>{row.totalImpact}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className={styles.monthlyTotalRow}>
                <td className={styles.totalCol}>Total</td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.totalMealsServed || 0), 0)}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.mealsFromFoodBoxes || 0), 0)}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.outreachCount || 0), 0)}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.totalImpact || 0), 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderShiftCategoriesTab = () => {
    if (shiftCategoriesData.length === 0) {
      return (
        <div className={styles.tableWrapper}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No shift categories data available for {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </div>
        </div>
      );
    }

    // Use existing logic for shift categories
    const filteredColumns = shiftCategoriesColumns.filter(col => col !== 'Collection');
    let displayData = shiftCategoriesData.map(row => {
        const newRow = { ...row };
        delete newRow['Collection'];
        return newRow;
    });

    // Filter out rows with no data (all values are 0 or empty)
    displayData = displayData.filter(row => {
      const dataColumns = filteredColumns.filter(col => col !== 'Date');
      return dataColumns.some(col => {
        const value = row[col];
        return value && value !== 0 && value !== '';
      });
    });

    // If "All Months" is selected, aggregate by month
    if (selectedMonth === 0) {
    const monthMap: { [month: number]: any } = {};
      
    // Initialize all months
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { Month: months[m].label };
      filteredColumns.forEach(col => {
        if (col !== 'Date') monthMap[m][col] = 0;
      });
    }

      // Aggregate data by month
      displayData.forEach(row => {
      const d = new Date(row['Date'] as string);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      filteredColumns.forEach(col => {
        if (col !== 'Date' && typeof row[col] === 'number') {
          monthMap[m][col] += Number(row[col]);
        }
      });
    });

      // Convert to array - show all 12 months
      const monthlyData = Object.values(monthMap);

      displayData = monthlyData;
      filteredColumns[0] = 'Month'; // Replace Date with Month
    }

    return (
      <div className={styles.tableWrapper}>
        <div className={styles.tableTitle}>
          Regular Meals – <span className={styles.month}>
            {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </span>
        </div>
        <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className={styles.table} style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                {filteredColumns.map(col => (
                  <th key={col} className={col === 'Total' ? styles.totalCol : ''}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i}>
                  {filteredColumns.map((col, idx) => (
                    <td key={col} className={idx === filteredColumns.length - 1 ? styles.totalCol : ''}>
                      {col === 'Date' ? formatDate(row[col] as string) : 
                       col === 'Month' ? row[col] : 
                       row[col] || 0}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Total row */}
              <tr className={styles.monthlyTotalRow}>
                {filteredColumns.map((col, idx) => {
                  if (col === 'Date' || col === 'Month') {
                    return <td key={col} className={styles.totalCol}>Total</td>;
                  }
                  const total = displayData.reduce((sum, row) => {
                    const value = row[col];
                    return sum + (typeof value === 'number' ? value : 0);
                  }, 0);
                  return (
                    <td key={col} className={styles.totalCol}>
                      {total}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFoodBoxTab = () => {
    if (foodBoxData.length === 0) {
      return (
        <div className={styles.tableWrapper}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No food box data available for {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </div>
        </div>
      );
    }

    let displayData = foodBoxData;
    let firstColumn = 'Date';

    // If "All Months" is selected, aggregate by month
    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};
      
      // Initialize all months
      for (let m = 1; m <= 12; m++) {
        monthMap[m] = { 
          Month: months[m].label,
          foodBoxCount: 0,
          mealsPerBox: 0,
          totalMeals: 0
        };
      }

      // Aggregate data by month
      foodBoxData.forEach(row => {
        const d = new Date(row.date);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
        monthMap[m].foodBoxCount += row.foodBoxCount;
        monthMap[m].mealsPerBox = row.mealsPerBox; // Should be same for all
        monthMap[m].totalMeals += row.totalMeals;
      });

      // Convert to array - show all 12 months
      displayData = Object.values(monthMap);
      firstColumn = 'Month';
    }

    return (
      <div className={styles.tableWrapper}>
        <div className={styles.tableTitle}>
          Food Box Distribution – <span className={styles.month}>
            {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </span>
        </div>
        <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className={styles.table} style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>{firstColumn}</th>
                <th className={styles.totalCol}>Total Food Boxes</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i}>
                  <td>{firstColumn === 'Date' ? formatDate(row.date) : row.Month}</td>
                  <td className={styles.totalCol}>{row.foodBoxCount}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className={styles.monthlyTotalRow}>
                <td className={styles.totalCol}>Total</td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.foodBoxCount || 0), 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOutreachTab = () => {
    if (outreachData.length === 0) {
      return (
        <div className={styles.tableWrapper}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No outreach data available for {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </div>
        </div>
      );
    }

    let displayData = outreachData;
    let displayColumns = outreachColumns;
    let firstColumn = 'Date';

    // If "All Months" is selected, aggregate by month
    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};
      
      // Initialize all months
      for (let m = 1; m <= 12; m++) {
        monthMap[m] = { Month: months[m].label };
        outreachColumns.forEach(col => {
          if (col !== 'Date') monthMap[m][col] = 0;
        });
      }

      // Aggregate data by month
      outreachData.forEach(row => {
            const d = new Date(row['Date'] as string);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
        outreachColumns.forEach(col => {
          if (col !== 'Date' && typeof row[col] === 'number') {
            monthMap[m][col] += Number(row[col]);
          }
        });
      });

      // Convert to array - show all 12 months
      const monthlyData = Object.values(monthMap);

      displayData = monthlyData;
      displayColumns = ['Month', ...outreachColumns.filter(col => col !== 'Date')];
      firstColumn = 'Month';
    }

    return (
      <div className={styles.tableWrapper}>
        <div className={styles.tableTitle}>
          Outreach Activities – <span className={styles.month}>
            {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </span>
        </div>
        <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className={styles.table} style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                {displayColumns.map(col => (
                  <th key={col} className={col === 'Total' ? styles.totalCol : ''}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i}>
                  {displayColumns.map((col, idx) => (
                    <td key={col} className={col === 'Total' ? styles.totalCol : ''}>
                      {col === 'Date' ? formatDate(row[col] as string) : 
                       col === 'Month' ? row[col] : 
                       row[col] || 0}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Total row */}
              <tr className={styles.monthlyTotalRow}>
                {displayColumns.map((col, idx) => {
                  if (col === 'Date' || col === 'Month') {
                    return <td key={col} className={styles.totalCol}>Total</td>;
                  }
                  const total = displayData.reduce((sum, row) => {
                    const value = row[col];
                    return sum + (typeof value === 'number' ? value : 0);
                  }, 0);
                  return (
                    <td key={col} className={styles.totalCol}>
                      {total}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
          <button className={styles.exportBtn} onClick={handleExport} type="button">
            Export to Excel
          </button>
          <button className={styles.exportBtn} onClick={handleConsolidatedExport} type="button" style={{ marginLeft: '8px' }}>
            Consolidated Excel Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'consolidated' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('consolidated')}
        >
          Consolidated Overview
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'shift-categories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('shift-categories')}
        >
          Regular Meals
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'foodbox' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('foodbox')}
        >
          Food Box Stats
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'outreach' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('outreach')}
        >
          Outreach Stats
        </button>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </main>
  );
} 