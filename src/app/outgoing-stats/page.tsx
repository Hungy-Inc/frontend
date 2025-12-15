'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useConsolidatedOutgoing,
  useShiftCategoriesOutgoing,
  useFoodBoxOutgoing,
  useBackpackOutgoing,
  useOutreachOutgoing,
  useOutreachLocations,
  useOutreachLocationMutations,
  useExportOutgoing,
  useExportConsolidatedOutgoing
} from '@/hooks/queries/useOutgoing';
import { OutreachLocationForm } from '@/components/features/outgoing/OutreachLocationForm';
import { OutreachLocationFormData } from '@/lib/schemas';

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

  // Filter states for FoodBox and Backpack tabs
  const [foodboxFilter, setFoodboxFilter] = useState<'meals' | 'foodboxes' | 'lbs' | 'kgs'>('meals');
  const [backpackFilter, setBackpackFilter] = useState<'meals' | 'backpacks'>('meals');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<OutreachLocation | null>(null);

  // Hook Calls
  const { data: consolidatedData = [], isLoading: loadingConsolidated, error: errorConsolidated } = useConsolidatedOutgoing(
    selectedMonth,
    selectedYear,
    { enabled: activeTab === 'consolidated' }
  );

  const { data: shiftCategoriesDataCombined, isLoading: loadingShift, error: errorShift } = useShiftCategoriesOutgoing(
    selectedMonth,
    selectedYear,
    { enabled: activeTab === 'shift-categories' }
  );
  const shiftCategoriesData = shiftCategoriesDataCombined?.tableData || [];
  const shiftCategoriesColumns = shiftCategoriesDataCombined?.columns || [];

  const { data: foodBoxData = [], isLoading: loadingFoodBox, error: errorFoodBox } = useFoodBoxOutgoing(
    selectedMonth,
    selectedYear,
    { enabled: activeTab === 'foodbox' }
  );

  const { data: backpackData = [], isLoading: loadingBackpack, error: errorBackpack } = useBackpackOutgoing(
    selectedMonth,
    selectedYear,
    { enabled: activeTab === 'backpack' }
  );

  const { data: outreachDataCombined, isLoading: loadingOutreach, error: errorOutreach } = useOutreachOutgoing(
    selectedMonth,
    selectedYear,
    { enabled: activeTab === 'outreach' }
  );
  const outreachData = outreachDataCombined?.tableData || [];
  const outreachColumns = outreachDataCombined?.columns || [];

  const { data: outreachLocations = [], isLoading: loadingLocations, error: errorLocations } = useOutreachLocations({
    enabled: activeTab === 'outreach-locations'
  });

  // Mutations
  const { addLocation, updateLocation, deleteLocation } = useOutreachLocationMutations();
  const exportMutation = useExportOutgoing();
  const exportConsolidatedMutation = useExportConsolidatedOutgoing();

  // Helper Functions
  const formatDate = (dateStr: string) => {
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

  const handleExport = () => {
    const endpoint = activeTab === 'shift-categories'
      ? 'filtered'
      : activeTab === 'outreach-locations'
        ? null
        : activeTab;

    if (!endpoint) {
      toast.error('Export not available for this tab');
      return;
    }

    exportMutation.mutate({ endpoint, month: selectedMonth, year: selectedYear });
  };

  const handleConsolidatedExport = () => {
    exportConsolidatedMutation.mutate({ month: selectedMonth, year: selectedYear });
  };

  // Outreach Location Handlers
  const handleCreate = () => {
    setEditingLocation(null);
    setShowModal(true);
  };

  const handleEdit = (location: OutreachLocation) => {
    setEditingLocation(location);
    setShowModal(true);
  };

  const handleSave = (data: OutreachLocationFormData) => {
    if (editingLocation) {
      updateLocation.mutate({ id: editingLocation.id, data }, {
        onSuccess: () => setShowModal(false)
      });
    } else {
      addLocation.mutate(data, {
        onSuccess: () => setShowModal(false)
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this outreach location?')) {
      deleteLocation.mutate(id);
    }
  };

  // Render Functions
  const renderConsolidatedTab = () => {
    if (loadingConsolidated) return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
    if (errorConsolidated) return <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Error loading data</div>;

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
      consolidatedData.forEach((row: ConsolidatedRow) => {
        const d = new Date(row.date);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
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
              {displayData.map((row: any, i: number) => (
                <tr key={i}>
                  <td>{firstColumn === 'Date' ? formatDate(row.date) : row.Month}</td>
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
                  {displayData.reduce((sum: number, row: any) => sum + (row.totalMealsServed || 0), 0)}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum: number, row: any) => sum + (row.mealsFromFoodBoxes || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum: number, row: any) => sum + (row.mealsFromBackpacks || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum: number, row: any) => sum + (row.outreachCount || 0), 0)}
                </td>
                <td className={styles.totalCol}>
                  {displayData.reduce((sum: number, row: any) => sum + (row.totalImpact || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderShiftCategoriesTab = () => {
    if (loadingShift) return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
    if (errorShift) return <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Error loading data</div>;

    if (shiftCategoriesData.length === 0) {
      return (
        <div className={styles.tableWrapper}>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No shift categories data available for {selectedMonth === 0 ? 'All Time' : months[selectedMonth].label} {selectedYear}
          </div>
        </div>
      );
    }

    const filteredColumns = shiftCategoriesColumns.filter((col: string) => col !== 'Collection');
    let displayData = shiftCategoriesData.map((row: any) => {
      const newRow = { ...row };
      delete newRow['Collection'];
      return newRow;
    });

    displayData = displayData.filter((row: any) => {
      const dataColumns = filteredColumns.filter((col: string) => col !== 'Date');
      return dataColumns.some((col: string) => {
        const value = row[col];
        return value && value !== 0 && value !== '';
      });
    });

    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};

      for (let m = 1; m <= 12; m++) {
        monthMap[m] = { Month: months[m].label };
        filteredColumns.forEach((col: string) => {
          if (col !== 'Date') monthMap[m][col] = 0;
        });
      }

      displayData.forEach((row: any) => {
        const d = new Date(row['Date'] as string);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
        filteredColumns.forEach((col: string) => {
          if (col !== 'Date' && typeof row[col] === 'number') {
            monthMap[m][col] += Number(row[col]);
          }
        });
      });

      const monthlyData = Object.values(monthMap);
      displayData = monthlyData;
      filteredColumns[0] = 'Month';
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
                {filteredColumns.map((col: string) => (
                  <th key={col} className={col === 'Total' ? styles.totalCol : ''}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row: any, i: number) => (
                <tr key={i}>
                  {filteredColumns.map((col: string, idx: number) => (
                    <td key={col} className={idx === filteredColumns.length - 1 ? styles.totalCol : ''}>
                      {col === 'Date' ? formatDate(row[col] as string) :
                        col === 'Month' ? row[col] :
                          row[col] || 0}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className={styles.monthlyTotalRow}>
                {filteredColumns.map((col: string) => {
                  if (col === 'Date' || col === 'Month') {
                    return <td key={col} className={styles.totalCol}>Total</td>;
                  }
                  const total = displayData.reduce((sum: number, row: any) => {
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
    if (loadingBackpack) return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
    if (errorBackpack) return <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Error loading data</div>;

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

    if (selectedMonth !== 0) {
      const dateMap: { [date: string]: any } = {};

      backpackData.forEach((row: BackpackRow) => {
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

    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};
      for (let m = 1; m <= 12; m++) {
        monthMap[m] = {
          Month: months[m].label,
          totalMeals: 0
        };
      }
      backpackData.forEach((row: BackpackRow) => {
        const d = new Date(row.date);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
        monthMap[m].totalMeals += row.totalMeals || 0;
      });
      displayData = Object.values(monthMap);
      firstColumn = 'Month';
    }

    const totalMeals = displayData.reduce((sum: number, row: any) => sum + (row.totalMeals || 0), 0);
    // const totalBackpacks = backpackData.reduce((sum, row) => sum + (row.backpackCount || 0), 0);

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
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}
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
              {displayData.map((row: any, i: number) => (
                <tr key={i}>
                  <td>{firstColumn === 'Date' ? formatDate(row.date) : row.Month}</td>
                  <td className={styles.totalCol}>
                    {backpackFilter === 'meals'
                      ? Number(row.totalMeals || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : (() => {
                        const mealsPerBackpack = backpackData.length > 0 ? (backpackData[0].mealsPerBackpack || 10) : 10;
                        const backpacks = (row.totalMeals || 0) / mealsPerBackpack;
                        return backpacks.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()
                    }
                  </td>
                </tr>
              ))}
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
    if (loadingFoodBox) return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
    if (errorFoodBox) return <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Error loading data</div>;

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

    if (selectedMonth !== 0) {
      const dateMap: { [date: string]: any } = {};

      foodBoxData.forEach((row: FoodBoxRow) => {
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
        dateMap[date].foodBoxCount += row.foodBoxCount || 0;
        dateMap[date].weightKg += row.weightKg || 0;
        dateMap[date].totalMeals += row.totalMeals || 0;
      });

      displayData = Object.values(dateMap).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};
      for (let m = 1; m <= 12; m++) {
        monthMap[m] = {
          Month: months[m].label,
          foodBoxCount: 0,
          weightKg: 0,
          totalMeals: 0,
          mealsPerLb: 0
        };
      }
      foodBoxData.forEach((row: FoodBoxRow) => {
        const d = new Date(row.date);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
        monthMap[m].foodBoxCount += row.foodBoxCount || 0;
        monthMap[m].weightKg += row.weightKg || 0;
        monthMap[m].totalMeals += row.totalMeals || 0;
        monthMap[m].mealsPerLb = row.mealsPerLb || 0;
      });
      displayData = Object.values(monthMap);
      firstColumn = 'Month';
    }

    const totalFoodBoxes = displayData.reduce((sum: number, row: any) => sum + (row.foodBoxCount || 0), 0);
    const totalWeightKg = displayData.reduce((sum: number, row: any) => sum + (row.weightKg || 0), 0);
    const totalWeightLb = totalWeightKg * 2.20462;
    const totalMeals = displayData.reduce((sum: number, row: any) => sum + (row.totalMeals || 0), 0);

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
            onChange={(e) => setFoodboxFilter(e.target.value as any)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}
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
              {displayData.map((row: any, i: number) => (
                <tr key={i}>
                  <td>{firstColumn === 'Date' ? formatDate(row.date) : row.Month}</td>
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
    if (loadingOutreach) return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
    if (errorOutreach) return <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Error loading data</div>;

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

    if (selectedMonth === 0) {
      const monthMap: { [month: number]: any } = {};

      for (let m = 1; m <= 12; m++) {
        monthMap[m] = { Month: months[m].label };
        outreachColumns.forEach((col: string) => {
          if (col !== 'Date') monthMap[m][col] = 0;
        });
      }

      outreachData.forEach((row: any) => {
        const d = new Date(row['Date'] as string);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
        outreachColumns.forEach((col: string) => {
          if (col !== 'Date' && typeof row[col] === 'number') {
            monthMap[m][col] += Number(row[col]);
          }
        });
      });

      const monthlyData = Object.values(monthMap);
      displayData = monthlyData;
      displayColumns = ['Month', ...outreachColumns.filter((col: string) => col !== 'Date')];
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
                {displayColumns.map((col: string) => (
                  <th key={col} className={col === 'Total' ? styles.totalCol : ''}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayData.map((row: any, i: number) => (
                <tr key={i}>
                  {displayColumns.map((col: string, idx: number) => (
                    <td key={col} className={col === 'Total' ? styles.totalCol : ''}>
                      {col === 'Date' ? formatDate(row[col] as string) :
                        col === 'Month' ? row[col] :
                          row[col] || 0}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className={styles.monthlyTotalRow}>
                {displayColumns.map((col: string, idx: number) => {
                  if (col === 'Date' || col === 'Month') {
                    return <td key={col} className={styles.totalCol}>Total</td>;
                  }
                  const total = displayData.reduce((sum: number, row: any) => {
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
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
          >
            + Add Location
          </button>
        </div>
        <div className={styles.tableContainer} style={{ overflowX: 'auto', maxWidth: '100%' }}>
          {loadingLocations ? <div>Loading...</div> : (
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
                  outreachLocations.map((location: OutreachLocation) => (
                    <tr key={location.id}>
                      <td>{location.name}</td>
                      <td>{location.address || '-'}</td>
                      <td>
                        <button onClick={() => handleEdit(location)} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontSize: '14px' }}>Edit</button>
                        <button onClick={() => handleDelete(location.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>{editingLocation ? 'Edit Outreach Location' : 'Add Outreach Location'}</h2>
              <OutreachLocationForm
                defaultValues={editingLocation ? { name: editingLocation.name, location: editingLocation.address || '' } : undefined}
                onSubmit={handleSave}
                onCancel={() => setShowModal(false)}
                isLoading={editingLocation ? updateLocation.isPending : addLocation.isPending}
                submitLabel={editingLocation ? 'Save Changes' : 'Create Location'}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'consolidated': return renderConsolidatedTab();
      case 'shift-categories': return renderShiftCategoriesTab();
      case 'foodbox': return renderFoodBoxTab();
      case 'backpack': return renderBackpackTab();
      case 'outreach': return renderOutreachTab();
      case 'outreach-locations': return renderOutreachLocationsTab();
      default: return null;
    }
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
          <select className={styles.select} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ minWidth: 130 }}>
            {months.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
          </select>
          <select className={styles.select} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ minWidth: 100 }}>
            {getYearOptions().map(y => (<option key={y} value={y}>{y}</option>))}
          </select>
          <button className={styles.exportBtn} onClick={handleExport} type="button">Export to Excel</button>
          <button className={styles.exportBtn} onClick={handleConsolidatedExport} type="button" style={{ marginLeft: '8px' }}>Consolidated Excel Export</button>
        </div>
      </div>

      <div className={styles.tabContainer}>
        {['consolidated', 'shift-categories', 'foodbox', 'backpack', 'outreach', 'outreach-locations'].map(tab => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab as OutgoingTab)}
          >
            {tab === 'consolidated' ? 'Consolidated Overview' :
              tab === 'shift-categories' ? 'Regular Meals' :
                tab === 'foodbox' ? 'Food Box Stats' :
                  tab === 'backpack' ? 'Backpack Stats' :
                    tab === 'outreach' ? 'Outreach Stats' : 'Outreach Locations'}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </main>
  );
}