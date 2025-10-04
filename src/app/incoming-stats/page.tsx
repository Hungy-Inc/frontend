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

type DetailDonationRow = {
  donorId: number;
  donorName: string;
  [key: string]: string | number;
};

type DetailDonationData = {
  donors: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  tableData: DetailDonationRow[];
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

// EditableCell component for inline editing
const EditableCell = ({ value, onSave }: { value: number; onSave: (value: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value.toString());
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          width: '100%',
          padding: '4px',
          border: '1px solid #ff9800',
          borderRadius: '4px',
          fontSize: 'inherit'
        }}
      />
    );
  }

  return (
    <div onDoubleClick={handleDoubleClick} style={{ cursor: 'pointer' }}>
      {value}
    </div>
  );
};

export default function IncomingStatsPage() {
  const [activeTab, setActiveTab] = useState<'incoming' | 'detail'>('incoming');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState(baseUnits[1]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Default to current year
  const [donors, setDonors] = useState<string[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [totals, setTotals] = useState<{ [key: string]: number }>({});
  const [rowTotals, setRowTotals] = useState<number[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weighingCategories, setWeighingCategories] = useState<WeighingCategory[]>([]);

  // Detail Donations state
  const [detailDonationsData, setDetailDonationsData] = useState<DetailDonationData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Helper function to get Halifax date in YYYY-MM-DD format
  const getHalifaxDate = (date = new Date()) => {
    return date.toLocaleDateString('en-CA', { 
      timeZone: 'America/Halifax',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-');
  };

  // Initialize with Halifax date
  useEffect(() => {
    setSelectedDate(getHalifaxDate());
  }, []);

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
    if (activeTab === 'incoming') {
      fetchIncomingStats();
    } else {
      fetchDetailDonations();
    }
  }, [activeTab, selectedMonth, selectedYear, selectedDate]);

  const fetchIncomingStats = async () => {
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

  const fetchDetailDonations = async () => {
    try {
      setDetailLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/detail-donations?date=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch edit donations data');
      }

      const data = await response.json();
      setDetailDonationsData(data);
    } catch (err) {
      console.error('Error fetching edit donations:', err);
      toast.error('Failed to fetch edit donations data');
    } finally {
      setDetailLoading(false);
    }
  };

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
    // The dateStr is already in Halifax timezone format (e.g., "2025-08-15")
    // We need to parse it correctly to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create date in Halifax timezone by using the components directly
    // This avoids the timezone conversion issue
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
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

  const renderIncomingStatsTab = () => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    // Check if there's no data for the selected period
    const hasNoData = !tableData || tableData.length === 0;

    return (
      <>
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
              {[...baseUnits, ...weighingCategories.map(c => c.category)].map(u => (
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
            <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <table className={styles.table} style={{ minWidth: '800px' }}>
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
      </>
    );
  };

  const renderDetailDonationsTab = () => {
    if (detailLoading) {
      return <div>Loading...</div>;
    }

    if (!detailDonationsData) {
      return <div>No data available</div>;
    }

    const { donors, categories, tableData } = detailDonationsData;

    // Unit conversion functions for detail donations
    const convertWeightForDetail = (weightKg: number) => {
      if (weightKg == null || isNaN(weightKg)) return 0;
      
      // Handle base units
      if (selectedUnit === 'Pounds (lb)') {
        return (weightKg * 2.20462).toFixed(2);
      }
      if (selectedUnit === 'Kilograms (kg)') {
        return weightKg.toFixed(2);
      }
      
      // Handle custom weighing categories
      const category = weighingCategories.find(c => c.category === selectedUnit);
      if (category && category.kilogram_kg_ > 0) {
        // Convert kg to custom unit (divide by kg per unit)
        return (weightKg / category.kilogram_kg_).toFixed(2);
      }
      
      return weightKg.toFixed(2);
    };

    const convertDisplayToKg = (displayValue: number) => {
      // Handle base units
      if (selectedUnit === 'Pounds (lb)') {
        return displayValue / 2.20462;
      }
      if (selectedUnit === 'Kilograms (kg)') {
        return displayValue;
      }
      
      // Handle custom weighing categories
      const category = weighingCategories.find(c => c.category === selectedUnit);
      if (category && category.kilogram_kg_ > 0) {
        // Convert custom unit to kg (multiply by kg per unit)
        return displayValue * category.kilogram_kg_;
      }
      
      return displayValue;
    };

    const handleValueChange = async (donorId: number, categoryName: string, newValue: string) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('No authentication token found');
          return;
        }

        const displayValue = parseFloat(newValue);
        if (isNaN(displayValue) || displayValue < 0) {
          toast.error('Please enter a valid positive number');
          return;
        }

        // Convert from display unit to KG for database storage
        const weightKg = convertDisplayToKg(displayValue);

        const category = categories.find(c => c.name === categoryName);
        if (!category) {
          toast.error('Category not found');
          return;
        }

        if (weightKg === 0) {
          // Delete the donation item
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/detail-donations/${donorId}/${category.id}?date=${selectedDate}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to delete donation');
          }
        } else {
          // Create or update the donation item
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/detail-donations`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                date: selectedDate,
                donorId,
                categoryId: category.id,
                weightKg
              })
            }
          );

          if (!response.ok) {
            throw new Error('Failed to update donation');
          }
        }

        // Refresh the data
        fetchDetailDonations();
        toast.success('Donation updated successfully');
      } catch (err) {
        console.error('Error updating donation:', err);
        toast.error('Failed to update donation');
      }
    };

    const setDateToToday = () => {
      setSelectedDate(getHalifaxDate());
    };

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div className={styles.topBar} style={{ marginBottom: 0 }}>
            <div>
              <div className={styles.pageTitle}>Edit Donations</div>
              <div className={styles.pageSubtitle}>View and manage donations by donor and category</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className={styles.dateButton}
              onClick={setDateToToday}
              style={{ 
                backgroundColor: selectedDate === getHalifaxDate() ? '#ff9800' : '#f0f0f0',
                color: selectedDate === getHalifaxDate() ? '#fff' : '#333'
              }}
            >
              Today
            </button>
            <input
              type="date"
              className={styles.select}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <select 
              className={styles.select}
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              style={{ marginRight: 8 }}
            >
              {[...baseUnits, ...weighingCategories.map(c => c.category)].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <button 
              className={styles.exportBtn} 
              onClick={() => toast.info('Export functionality coming soon!')}
              style={{ marginRight: 8 }}
            >
              Export to Excel
            </button>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <div className={styles.tableTitle}>
            Edit Donations – <span className={styles.month}>{formatDate(selectedDate)}</span>
          </div>
          
          {/* Instructions */}
          <div style={{ 
            background: '#fff5ed', 
            border: '1px solid #ff9800', 
            borderRadius: '8px', 
            padding: '1rem', 
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            <strong>💡 How to use:</strong>
            <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
              <li>Double-click on any value in the table to edit it</li>
              <li>Enter a new weight value and press Enter to save</li>
              <li>Enter 0 to remove a donation item</li>
              {/* <li>Use Today/Yesterday buttons for quick date navigation</li>
              <li>All changes are saved automatically</li> */}
            </ul>
            
            {/* Debug info - remove this after testing */}
            {/* <div style={{ 
              marginTop: '1rem', 
              padding: '0.5rem', 
              background: '#f0f0f0', 
              borderRadius: '4px',
              fontSize: '0.8rem'
            }}>
              <strong>🔍 Debug Info:</strong><br/>
              Selected Date: {selectedDate}<br/>
              Halifax Today: {getHalifaxDate()}<br/>
              Halifax Yesterday: {getHalifaxDateYesterday()}<br/>
              UTC Today: {new Date().toISOString().split('T')[0]}
            </div> */}
          </div>

          <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
            <table className={styles.table} style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Donation Location</th>
                  {categories.map(category => (
                    <th key={category.id}>{category.name} ({getUnitLabel()})</th>
                  ))}
                  <th className={styles.totalCol}>Total ({getUnitLabel()})</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, textAlign: 'left' }}>{row.donorName}</td>
                    {categories.map(category => (
                      <td key={category.id}>
                        <EditableCell
                          value={Number(convertWeightForDetail(Number(row[category.name]) || 0))}
                          onSave={(newValue) => handleValueChange(row.donorId, category.name, newValue)}
                        />
                      </td>
                    ))}
                    <td className={styles.totalCol} style={{ fontWeight: 700 }}>
                      {convertWeightForDetail(categories.reduce((sum, category) => sum + (Number(row[category.name]) || 0), 0))}
                    </td>
                  </tr>
                ))}
                <tr className={styles.monthlyTotalRow}>
                  <td style={{ fontWeight: 700 }}>Category Totals</td>
                  {categories.map(category => (
                    <td key={category.id} style={{ fontWeight: 700 }}>
                      {convertWeightForDetail(tableData.reduce((sum, row) => sum + (Number(row[category.name]) || 0), 0))}
                    </td>
                  ))}
                  <td className={styles.totalCol} style={{ fontWeight: 700 }}>
                    {convertWeightForDetail(tableData.reduce((sum, row) => 
                      sum + categories.reduce((catSum, category) => catSum + (Number(row[category.name]) || 0), 0), 0
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // Combine base units with weighing categories for dropdown
  const allUnits = [...baseUnits, ...weighingCategories.map(c => c.category)];

  return (
    <main className={styles.main}>
      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'incoming' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming Stats
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'detail' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('detail')}
        >
          Edit Donations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'incoming' ? renderIncomingStatsTab() : renderDetailDonationsTab()}
    </main>
  );
} 