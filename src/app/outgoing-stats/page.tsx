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

type OutgoingTab = 'consolidated' | 'shift-categories' | 'foodbox' | 'backpack' | 'outreach' | 'outreach-locations';

type OutgoingRow = {
  [key: string]: string | number;
};

type ConsolidatedRow = {
  date: string;
  totalMealsServed: number;
  foodBoxesDistributed: number;
  mealsFromFoodBoxes: number;
  backpacksDistributed: number;
  mealsFromBackpacks: number;
  outreachCount: number;
  totalImpact: number;
};

type FoodBoxRow = {
  date: string;
  foodBoxCount: number;
  weightKg: number;
  mealsPerLb: number;
  totalMeals: number;
  distributedBy: string;
};

type BackpackRow = {
  date: string;
  backpackCount: number;
  mealsPerBackpack: number;
  totalMeals: number;
  distributedBy: string;
};

type OutreachRow = {
  date: string;
  [locationName: string]: string | number;
};

type OutreachLocation = {
  id: number;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
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
  const [backpackData, setBackpackData] = useState<BackpackRow[]>([]);
  const [outreachData, setOutreachData] = useState<OutreachRow[]>([]);
  const [outreachColumns, setOutreachColumns] = useState<string[]>([]);
  const [outreachLocations, setOutreachLocations] = useState<OutreachLocation[]>([]);

  // Filter states for FoodBox and Backpack tabs
  const [foodboxFilter, setFoodboxFilter] = useState<'meals' | 'foodboxes' | 'lbs' | 'kgs'>('meals');
  const [backpackFilter, setBackpackFilter] = useState<'meals' | 'backpacks'>('meals');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<OutreachLocation | null>(null);
  const [formData, setFormData] = useState({ name: '', address: '' });

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
          case 'backpack':
            await fetchBackpackData(token);
            break;
          case 'outreach':
            await fetchOutreachData(token);
            break;
          case 'outreach-locations':
            await fetchOutreachLocations(token);
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

  const fetchBackpackData = async (token: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/backpack?month=${selectedMonth}&year=${selectedYear}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch backpack data');
    const data = await response.json();
    setBackpackData(data);
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

  const fetchOutreachLocations = async (token: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/outreach-locations`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch outreach locations');
    const data = await response.json();
    setOutreachLocations(data);
  };

  const formatDate = (dateStr: string) => {
    // Parse date string components directly to avoid timezone conversion issues
    // When backend sends "2025-11-08", we need to parse it as a local date, not UTC
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
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
        : activeTab === 'outreach-locations'
        ? null // No export for outreach-locations
        : activeTab;
      
      if (!endpoint) {
        toast.error('Export not available for this tab');
        return;
      }
      
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

  // Outreach Location CRUD handlers
  const handleCreate = () => {
    setEditingLocation(null);
    setFormData({ name: '', address: '' });
    setShowModal(true);
  };

  const handleEdit = (location: OutreachLocation) => {
    setEditingLocation(location);
    setFormData({ name: location.name, address: location.address || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = editingLocation
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/outreach-locations/${editingLocation.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/outreach-locations`;
      
      const method = editingLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      setShowModal(false);
      toast.success(editingLocation ? 'Location updated successfully!' : 'Location created successfully!');
      
      // Refresh the list
      await fetchOutreachLocations(token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this outreach location?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/outreach-locations/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }

      toast.success('Location deleted successfully!');
      
      // Refresh the list
      await fetchOutreachLocations(token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
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
      case 'backpack':
        return renderBackpackTab();
      case 'outreach':
        return renderOutreachTab();
      case 'outreach-locations':
        return renderOutreachLocationsTab();
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
          mealsFromBackpacks: 0,
          outreachCount: 0,
          totalImpact: 0
        };
      }

      // Aggregate data by month
      consolidatedData.forEach(row => {
        // Parse date string directly to avoid timezone conversion issues
        // When backend sends "2025-01-15", parse it as a local date, not UTC
        const dateStr = typeof row.date === 'string' ? row.date : row.date.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return;
        const m = month; // month is already 1-12 from the parsed string
        monthMap[m].totalMealsServed += row.totalMealsServed;
        monthMap[m].mealsFromFoodBoxes += row.mealsFromFoodBoxes || 0;
        monthMap[m].mealsFromBackpacks += row.mealsFromBackpacks || 0;
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
                <th>Meals from Backpack</th>
                <th>Outreach Count</th>
                <th className={styles.totalCol}>Total Impact</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i}>
                  <td>{firstColumn === 'Date' ? formatDate(row.date) : (row as any).Month}</td>
                  <td>{row.totalMealsServed}</td>
                  <td>{Number(row.mealsFromFoodBoxes || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{Number(row.mealsFromBackpacks || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{row.outreachCount}</td>
                  <td className={styles.totalCol}>{Number(row.totalImpact || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className={styles.monthlyTotalRow}>
                <td className={styles.totalCol}>Total</td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.totalMealsServed || 0), 0)}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.mealsFromFoodBoxes || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.mealsFromBackpacks || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.outreachCount || 0), 0)}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum, row) => sum + (row.totalImpact || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      // Parse date string directly to avoid timezone conversion issues
      // When backend sends "2025-01-15", parse it as a local date, not UTC
      const dateStr = row['Date'] as string;
      const [year, month, day] = dateStr.split('-').map(Number);
      if (!year || !month || !day) return;
      const m = month; // month is already 1-12 from the parsed string
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

  const renderBackpackTab = () => {
    if (backpackData.length === 0) {
      return (
        <div className={styles.tableWrapper}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No backpack data available for {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </div>
        </div>
      );
    }

    let displayData = backpackData;
    let firstColumn = 'Date';

    // If individual month is selected, sum up multiple entries from same date
    if (selectedMonth !== 0) {
      const dateMap: { [date: string]: any } = {};
      
      backpackData.forEach(row => {
        const date = row.date;
        if (!dateMap[date]) {
          dateMap[date] = {
            date: date,
            totalMeals: 0
          };
        }
        dateMap[date].totalMeals += row.totalMeals || 0;
      });

      displayData = Object.values(dateMap).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // If "All Months" is selected, aggregate by month
    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};
      
      // Initialize all months
      for (let m = 1; m <= 12; m++) {
        monthMap[m] = { 
          Month: months[m].label,
          totalMeals: 0
        };
      }

      // Aggregate data by month
      backpackData.forEach(row => {
        // Parse date string directly to avoid timezone conversion issues
        // When backend sends "2025-01-15", parse it as a local date, not UTC
        const dateStr = typeof row.date === 'string' ? row.date : row.date.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return;
        const m = month; // month is already 1-12 from the parsed string
        monthMap[m].totalMeals += row.totalMeals || 0;
      });

      // Convert to array - show all 12 months
      displayData = Object.values(monthMap);
      firstColumn = 'Month';
    }

    // Calculate totals for display
    const totalMeals = displayData.reduce((sum, row) => sum + (row.totalMeals || 0), 0);
    const totalBackpacks = backpackData.reduce((sum, row) => sum + (row.backpackCount || 0), 0);

    return (
      <div className={styles.tableWrapper}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className={styles.tableTitle}>
            Backpack Distribution – <span className={styles.month}>
              {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
            </span>
          </div>
          <select
            value={backpackFilter}
            onChange={(e) => setBackpackFilter(e.target.value as 'meals' | 'backpacks')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#fff',
              color: '#333',
              fontWeight: 500,
              fontSize: 14,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="meals">Meals</option>
            <option value="backpacks">Backpacks</option>
          </select>
        </div>
        <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className={styles.table} style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>{firstColumn}</th>
                <th className={styles.totalCol}>
                  {backpackFilter === 'meals' ? 'Total Meals' : 'Total Backpacks'}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i}>
                  <td>{firstColumn === 'Date' ? formatDate(row.date) : (row as any).Month}</td>
                  <td className={styles.totalCol}>
                    {backpackFilter === 'meals' 
                      ? Number(row.totalMeals || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : (() => {
                          // For backpacks, we need to calculate from total meals
                          // Find the meals per backpack from the original data
                          const mealsPerBackpack = backpackData.length > 0 ? (backpackData[0].mealsPerBackpack || 10) : 10;
                          const backpacks = (row.totalMeals || 0) / mealsPerBackpack;
                          return backpacks.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()
                    }
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className={styles.monthlyTotalRow}>
                <td className={styles.totalCol}>Total</td>
                <td className={styles.totalCol}>
                  {backpackFilter === 'meals' 
                    ? totalMeals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : (() => {
                        const mealsPerBackpack = backpackData.length > 0 ? (backpackData[0].mealsPerBackpack || 10) : 10;
                        const totalBackpacksCalc = totalMeals / mealsPerBackpack;
                        return totalBackpacksCalc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()
                  }
                </td>
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

    // When individual month is selected, group by date and sum up meals
    // Each row already has totalMeals calculated as: count * weightKg * 2.20462 * mealsPerLb
    // We sum those totalMeals for all rows on the same date
    if (selectedMonth !== 0) {
      const dateMap: { [date: string]: any } = {};
      
      foodBoxData.forEach(row => {
        const date = row.date;
        if (!dateMap[date]) {
          dateMap[date] = {
            date: date,
            foodBoxCount: 0,
            weightKg: 0,
            totalMeals: 0,
            mealsPerLb: row.mealsPerLb || 0
          };
        }
        // Sum up individual counts and weights for display purposes
        dateMap[date].foodBoxCount += row.foodBoxCount || 0;
        dateMap[date].weightKg += row.weightKg || 0;
        // Sum up already-calculated totalMeals (this is the key - don't recalculate!)
        dateMap[date].totalMeals += row.totalMeals || 0;
      });

      displayData = Object.values(dateMap).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // If "All Months" is selected, aggregate by month
    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};
      
      // Initialize all months
      for (let m = 1; m <= 12; m++) {
        monthMap[m] = { 
          Month: months[m].label,
          foodBoxCount: 0,
          weightKg: 0,
          totalMeals: 0,
          mealsPerLb: 0
        };
      }

      // Aggregate data by month - sum already-calculated totalMeals
      foodBoxData.forEach(row => {
        // Parse date string directly to avoid timezone conversion issues
        // When backend sends "2025-01-15", parse it as a local date, not UTC
        const dateStr = typeof row.date === 'string' ? row.date : row.date.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return;
        const m = month; // month is already 1-12 from the parsed string
        monthMap[m].foodBoxCount += row.foodBoxCount || 0;
        monthMap[m].weightKg += row.weightKg || 0;
        // Sum up already-calculated totalMeals (don't recalculate!)
        monthMap[m].totalMeals += row.totalMeals || 0;
        monthMap[m].mealsPerLb = row.mealsPerLb || 0; // Should be same for all
      });

      // Convert to array - show all 12 months
      displayData = Object.values(monthMap);
      firstColumn = 'Month';
    }

    // Calculate totals for display
    const totalFoodBoxes = displayData.reduce((sum, row) => sum + (row.foodBoxCount || 0), 0);
    const totalWeightKg = displayData.reduce((sum, row) => sum + (row.weightKg || 0), 0);
    const totalWeightLb = totalWeightKg * 2.20462;
    const totalMeals = displayData.reduce((sum, row) => sum + (row.totalMeals || 0), 0);

    return (
      <div className={styles.tableWrapper}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className={styles.tableTitle}>
            Food Box Distribution – <span className={styles.month}>
              {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
            </span>
          </div>
          <select
            value={foodboxFilter}
            onChange={(e) => setFoodboxFilter(e.target.value as 'meals' | 'foodboxes' | 'lbs' | 'kgs')}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#fff',
              color: '#333',
              fontWeight: 500,
              fontSize: 14,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="meals">Meals</option>
            <option value="foodboxes">Food Boxes</option>
            <option value="lbs">Lbs</option>
            <option value="kgs">Kgs</option>
          </select>
        </div>
        <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className={styles.table} style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>{firstColumn}</th>
                <th className={styles.totalCol}>
                  {foodboxFilter === 'meals' ? 'Total Meals' :
                   foodboxFilter === 'foodboxes' ? 'Total Food Boxes' :
                   foodboxFilter === 'lbs' ? 'Total Weight (lbs)' :
                   'Total Weight (kgs)'}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i}>
                  <td>{firstColumn === 'Date' ? formatDate(row.date) : (row as any).Month}</td>
                  <td className={styles.totalCol}>
                    {foodboxFilter === 'meals' 
                      ? Number(row.totalMeals || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : foodboxFilter === 'foodboxes'
                      ? (row.foodBoxCount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : foodboxFilter === 'lbs'
                      ? Number((row.weightKg || 0) * 2.20462).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : Number(row.weightKg || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className={styles.monthlyTotalRow}>
                <td className={styles.totalCol}>Total</td>
                <td className={styles.totalCol}>
                  {foodboxFilter === 'meals' 
                    ? totalMeals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : foodboxFilter === 'foodboxes'
                    ? totalFoodBoxes.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : foodboxFilter === 'lbs'
                    ? totalWeightLb.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : totalWeightKg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }
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
        // Parse date string directly to avoid timezone conversion issues
        // When backend sends "2025-01-15", parse it as a local date, not UTC
        const dateStr = row['Date'] as string;
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return;
        const m = month; // month is already 1-12 from the parsed string
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

  const renderOutreachLocationsTab = () => {
    return (
      <div className={styles.tableWrapper}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className={styles.tableTitle}>Outreach Locations</div>
          <button 
            onClick={handleCreate}
            style={{
              backgroundColor: '#EF5C11',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            + Add Location
          </button>
        </div>
        <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table className={styles.table} style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {outreachLocations.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No outreach locations found. Click "Add Location" to create one.
                  </td>
                </tr>
              ) : (
                outreachLocations.map((location) => (
                  <tr key={location.id}>
                    <td>{location.name}</td>
                    <td>{location.address || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(location)}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '8px',
                          fontSize: '14px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%'
            }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
                {editingLocation ? 'Edit Outreach Location' : 'Add Outreach Location'}
              </h2>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter location name"
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                  placeholder="Enter address (optional)"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name.trim()}
                  style={{
                    backgroundColor: formData.name.trim() ? '#2563eb' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '4px',
                    cursor: formData.name.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: 500
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
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
          className={`${styles.tabButton} ${activeTab === 'backpack' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('backpack')}
        >
          Backpack Stats
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'outreach' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('outreach')}
        >
          Outreach Stats
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'outreach-locations' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('outreach-locations')}
        >
          Outreach Locations
        </button>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </main>
  );
} 