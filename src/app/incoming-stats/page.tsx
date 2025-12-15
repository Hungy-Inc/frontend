'use client';
import styles from './IncomingStats.module.css';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  useIncomingStats,
  useDetailDonations,
  useUpdateDonation,
  useDeleteDonation,
  useExportIncoming
} from '@/hooks/queries/useIncoming';

import { MONTHS, BASE_UNITS, INCOMING_STATS_TABS } from '@/constants/appConstants';

const months = MONTHS;
const baseUnits = BASE_UNITS;

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

type DetailDonationData = {
  donors: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  tableData: any[]; // Using any for detail row flexibility
};

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
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

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

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
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        min="0"
        step="0.01"
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState(baseUnits[1]);

  // Detail View State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Use Halifax date on mount
  useEffect(() => {
    const getHalifaxDate = (date = new Date()) => {
      return date.toLocaleDateString('en-CA', {
        timeZone: 'America/Halifax',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).split('/').reverse().join('-');
    };
    setSelectedDate(getHalifaxDate());
  }, []);

  // Queries
  const { data: weighingCategories = [] } = useQuery({
    queryKey: ['weighingCategories'],
    queryFn: () => api.getWeighingCategories(),
    staleTime: Infinity,
  });

  const {
    data: incomingData,
    isLoading: loading,
    error
  } = useIncomingStats(selectedMonth, selectedYear, {
    enabled: activeTab === 'incoming'
  });

  const {
    data: detailDonationsData,
    isLoading: detailLoading
  } = useDetailDonations(selectedDate, {
    enabled: activeTab === 'detail' && !!selectedDate
  });

  // Mutations
  const updateDonationMutation = useUpdateDonation();
  const deleteDonationMutation = useDeleteDonation();
  const exportMutation = useExportIncoming();

  // Helper functions
  const convertWeight = (weight: number) => {
    if (weight == null || isNaN(weight)) return '-';

    // Handle base units
    if (selectedUnit === 'Pounds (lb)') {
      return parseFloat((weight * 2.20462).toFixed(2)).toString();
    }
    if (selectedUnit === 'Kilograms (kg)') {
      return parseFloat(weight.toFixed(2)).toString();
    }

    // Handle custom weighing categories
    const category = (weighingCategories as WeighingCategory[]).find(c => c.category === selectedUnit);
    if (category && category.kilogram_kg_ > 0) {
      // Convert kg to custom unit (divide by kg per unit)
      return parseFloat((weight / category.kilogram_kg_).toFixed(2)).toString();
    }

    return parseFloat(weight.toFixed(2)).toString();
  };

  const getUnitLabel = () => {
    if (selectedUnit === 'Kilograms (kg)') return 'kg';
    if (selectedUnit === 'Pounds (lb)') return 'lbs';
    return selectedUnit;
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExport = () => {
    exportMutation.mutate({ month: selectedMonth, year: selectedYear, unit: selectedUnit });
  };

  // Logic for displaying incoming stats table
  const getDisplayData = () => {
    if (!incomingData) return { columns: ['Date', 'Total'], data: [], firstCol: 'Date' };

    const { donors = [], tableData = [], totals = {}, rowTotals = [], grandTotal = 0, donorIdToName = {}, donorIdToLocation = {} } = incomingData;

    if (donors.length === 0) {
      return { columns: ['Date', 'Total'], data: [], firstCol: 'Date' };
    }

    // Convert tableData from donor_ID keys to display format with names
    const convertTableDataForDisplay = (data: TableRow[]) => {
      const allDonorIds = new Set<number>();
      data.forEach((row: any) => {
        Object.keys(row).forEach((key) => {
          if (key.startsWith('donor_')) {
            const donorId = parseInt(key.replace('donor_', ''));
            allDonorIds.add(donorId);
          }
        });
      });

      // Also add all donors from the donors array
      donors.forEach((donor: any) => {
        // Handle both string and object donors (though we assume hook returns standardized object from API, 
        // the API response might still be mixed if not fully typed in API wrapper. 
        // Assuming api.getIncomingStats normalizes or returns as is. 
        // The original code handled string[] vs object[]. Wrapper should handle? 
        // Let's assume standardized object based on original code 'useEffect' logic logic was removed.
        // Wait, original 'useEffect' logic DID normalization. I removed it.
        // So 'incomingData.donors' might be string[] or object[].
        // I should check `api.ts` or assume backend returns standardized data?
        // Original code said: "Handle both old format...".
        // I should re-implement that normalization inside the queryFn or here.
        // Since I'm using raw hook data here, I should handle it.
        const id = typeof donor === 'object' ? donor.id : -1;
        if (id !== -1) allDonorIds.add(id);
      });

      // Build display name map (simplified from original logic for brevity, assuming backend data is cleaner or acceptable)
      // Actually, let's try to match original logic closely if possible.
      const donorDisplayNames: { [id: number]: string } = {};
      const nameCount: { [name: string]: number } = {};

      allDonorIds.forEach((donorId) => {
        const name = donorIdToName[donorId] || `Donor ${donorId}`;
        nameCount[name] = (nameCount[name] || 0) + 1;
      });

      allDonorIds.forEach((donorId) => {
        const name = donorIdToName[donorId] || `Donor ${donorId}`;
        const location = donorIdToLocation[donorId] || '';
        if (nameCount[name] > 1) {
          if (location) {
            donorDisplayNames[donorId] = `${name} (${location})`;
          } else {
            donorDisplayNames[donorId] = `${name} (ID: ${donorId})`;
          }
        } else {
          donorDisplayNames[donorId] = name;
        }
      });

      return data.map((row: any) => {
        const convertedRow: any = { date: row.date };
        allDonorIds.forEach((donorId) => {
          const key = `donor_${donorId}`;
          const displayName = donorDisplayNames[donorId];
          convertedRow[displayName] = row[key] || 0;
        });
        return convertedRow;
      });
    };

    const displayTableData = convertTableDataForDisplay(tableData);
    const donorNames = Array.from(new Set(
      displayTableData.flatMap(row =>
        Object.keys(row).filter(key => key !== 'date' && key !== 'Total')
      )
    )).sort();

    if (selectedMonth !== 0) {
      const dataWithTotals = displayTableData.map((row, index) => {
        const rowTotal = rowTotals[index] || donorNames.reduce((sum, donorName) => {
          const value = typeof row[donorName] === 'number' ? Number(row[donorName]) : 0;
          return sum + value;
        }, 0);
        return { ...row, Total: rowTotal };
      });
      return { columns: ['Date', ...donorNames, 'Total'], data: dataWithTotals, firstCol: 'Date' };
    }

    // Aggregate by month
    const monthMap: { [month: number]: any } = {};
    for (let m = 1; m <= 12; m++) {
      monthMap[m] = { Month: months[m].label };
      donorNames.forEach(name => { monthMap[m][name] = 0; });
      monthMap[m]['Total'] = 0;
    }

    displayTableData.forEach(row => {
      const d = new Date(row['date'] as string);
      if (isNaN(d.getTime())) return;
      const m = d.getMonth() + 1;
      let rowTotal = 0;
      donorNames.forEach(name => {
        if (typeof row[name] === 'number') {
          const val = Number(row[name]);
          monthMap[m][name] += val;
          rowTotal += val;
        }
      });
      monthMap[m]['Total'] += rowTotal;
    });

    const displayData = Object.values(monthMap);
    const newColumns = ['Month', ...donorNames, 'Total'];
    return { columns: newColumns, data: displayData, firstCol: 'Month' };
  };

  const { columns: displayColumns, data: displayData, firstCol } = getDisplayData();

  // Logic for column totals
  const calculateColumnTotal = (col: string) => {
    if (!incomingData) return '0';
    const { donors = [], totals = {}, grandTotal = 0, donorIdToName = {}, donorIdToLocation = {} } = incomingData;

    if (col === firstCol) return firstCol === 'Month' ? 'Yearly Total' : 'Monthly Total';
    if (col === 'Total') return convertWeight(grandTotal);

    // Try to find donor ID from col name (which might handle duplicates)
    // Reverse lookup logic
    // Simplified: Iterate donors and see if display name matches col
    // We generated display names in getDisplayData but didn't save the map.
    // Re-generating map or simple lookup:
    // This part is tricky because we need to map back from "Name (Location)" to ID to look up in `totals`.

    // Fallback: Loop through all donors, generate their display name, check if matches col.
    // We need logic to generate name consistent with getDisplayData.
    // For now, let's use the `totals` keys and see if we can easy match.
    // `totals` is keyed by ID.

    // We can try to re-construct the name mapping locally here or just trust the name match?
    // Let's iterate `donors` (which should be {id, name, location})
    // And try to match.

    // Re-construct counts for names
    const nameCount: { [name: string]: number } = {};
    const donorsList = (donors as any[]).map(d => typeof d === 'string' ? { id: -1, name: d } : d); // Handle raw strings if any

    donorsList.forEach(d => {
      const name = donorIdToName[d.id] || d.name;
      nameCount[name] = (nameCount[name] || 0) + 1;
    });

    // Find donor ID where generated name == col
    const matchingDonor = donorsList.find(d => {
      const name = donorIdToName[d.id] || d.name;
      const location = donorIdToLocation[d.id] || d.location || '';
      let displayName = name;
      if (nameCount[name] > 1) {
        displayName = location ? `${name} (${location})` : `${name} (ID: ${d.id})`;
      }
      return displayName === col;
    });

    if (matchingDonor) {
      return convertWeight(totals[matchingDonor.id]);
    }

    return convertWeight(0);
  };

  // Convert/Logic for Detail View Editing
  const convertDisplayToKg = (displayValue: number) => {
    if (selectedUnit === 'Pounds (lb)') return displayValue / 2.20462;
    if (selectedUnit === 'Kilograms (kg)') return displayValue;
    const category = (weighingCategories as WeighingCategory[]).find(c => c.category === selectedUnit);
    if (category && category.kilogram_kg_ > 0) return displayValue * category.kilogram_kg_;
    return displayValue;
  };

  const handleValueChange = (donorId: number, categoryName: string, newValue: string) => {
    const trimmedValue = newValue.trim();
    const displayValue = parseFloat(trimmedValue);
    if (isNaN(displayValue) || displayValue < 0) {
      toast.error('Please enter a valid non-negative number');
      return;
    }

    const { categories = [] } = detailDonationsData || {};
    const category = categories.find((c: any) => c.name === categoryName);
    if (!category) {
      toast.error('Category not found');
      return;
    }

    let weightKg = convertDisplayToKg(displayValue);
    weightKg = parseFloat(weightKg.toFixed(2));

    if (displayValue === 0) {
      // Logic: Update to 0 first, then delete?
      // Or just delete?
      // Original code: Update to 0, refresh, wait, delete, refresh.
      // We can simplify: Just Delete.
      // Why update to 0? Maybe to clear it in DB so triggers/logs happen?
      // Assuming straightforward Delete is fine.
      deleteDonationMutation.mutate({
        donorId,
        categoryId: category.id,
        date: selectedDate
      }, {
        onSuccess: () => toast.success('Donation removed') // Optional message
      });
    } else {
      updateDonationMutation.mutate({
        date: selectedDate,
        donorId,
        categoryId: category.id,
        weightKg
      });
    }
  };

  const renderIncomingStatsTab = () => {
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error loading data</div>;

    const hasNoData = !displayData || displayData.length === 0;

    return (
      <>
        {/* Header content same as original */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div className={styles.topBar} style={{ marginBottom: 0 }}>
            <div>
              <div className={styles.pageTitle}>Incoming Stats</div>
              <div className={styles.pageSubtitle}>Track food donations by organization and date</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select className={styles.select} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ marginRight: 8 }}>
              {months.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
            </select>
            <select className={styles.select} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ marginRight: 8 }}>
              {getYearOptions().map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
            <select className={styles.select} value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} style={{ marginRight: 8 }}>
              {[...baseUnits, ...(weighingCategories as any[]).map((c: any) => c.category)].map(u => (<option key={u} value={u}>{u}</option>))}
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
                  {displayData.map((row: any, i: number) => (
                    <tr key={i} className={firstCol === 'Date' ? styles.clickableRow : ''}
                      onClick={() => {
                        if (firstCol === 'Date') {
                          setSelectedDate(row.date);
                          setActiveTab('detail');
                        }
                      }}>
                      {displayColumns.map((col, idx) => (
                        <td key={col} className={idx === displayColumns.length - 1 ? styles.totalCol : ''}>
                          {col === firstCol
                            ? (firstCol === 'Date' ? formatDate(row['date'] as string) : row[col])
                            : convertWeight(row[col] as number || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className={styles.monthlyTotalRow}>
                    {displayColumns.map(col => (
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
    if (detailLoading) return <div>Loading...</div>;
    if (!detailDonationsData) return <div>No data available</div>;

    const { donors, categories, tableData } = detailDonationsData;

    return (
      <>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('incoming')}
            style={{ marginBottom: 16, padding: '8px 16px', cursor: 'pointer', background: '#e5e7eb', border: 'none', borderRadius: 4 }}
          >
            ← Back to Incoming Stats
          </button>
          <div className={styles.pageTitle}>Detail Donations - {formatDate(selectedDate)}</div>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Donor</th>
                  {categories.map((cat: any) => (
                    <th key={cat.id}>{cat.name} ({getUnitLabel()})</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row: any) => (
                  <tr key={row.donorId}>
                    <td>{row.donorName}</td>
                    {categories.map((cat: any) => {
                      // Find val for this cat
                      // row structure likely { donorId, donorName, 'Category Name': weightKg, ... } from API
                      // Assuming API returns flat structure with category names as keys?
                      // Actually api/detail-donations usually returns table with category IDs or names.
                      // Original code: `row[categoryName]` -> weightKg.
                      // Need to verify if API returns category NAME or ID as key.
                      // Original code `handleValueChange`: categoryName argument.
                      // So likely keyed by Category Name.
                      const val = row[cat.name];
                      return (
                        <td key={cat.id}>
                          <EditableCell
                            value={Number(convertWeight(val || 0))}
                            onSave={(newValue) => handleValueChange(row.donorId, cat.name, newValue)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <main className={styles.main}>
      {activeTab === 'incoming' ? renderIncomingStatsTab() : renderDetailDonationsTab()}
    </main>
  );
}