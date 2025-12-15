"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FiDownload } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/stores/authStore';
import {
  useIncomingStats,
  useVolunteerSummary,
  useOutgoingStats,
  useFoodBoxSummary,
  useOutreachSummary,
  useInventoryStats,
  useWeighingCategories,
  useRecurringShifts
} from '@/hooks/queries/useDashboard';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, checkSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkSession();
      setIsLoading(false);
    };
    init();
  }, [checkSession]);

  // Auth check using centralized store
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, isLoading]);



  // Get current year and month
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[now.getMonth()];

  // Filter state (default to current month and year)
  const [period, setPeriod] = useState(currentMonthName);
  const [year, setYear] = useState(currentYear);
  const [unit, setUnit] = useState('Pounds (lb)');

  // Filter options
  const periodOptions = [
    'All Months', ...monthNames
  ];
  const yearOptions = ['2025', '2024', '2023', '2022', '2021', '2020'];

  // Map period to month number for API
  const getMonthNumber = (period: string) => {
    if (period === 'All Months') return 0;
    const idx = periodOptions.findIndex(p => p === period);
    if (idx >= 1) return idx; // Jan=1, Feb=2, ... (All Months is at index 0)
    return 0; // Default to all months
  };

  const monthNumber = getMonthNumber(period);

  // Queries
  const incomingStatsQuery = useIncomingStats(monthNumber, year);
  const volunteerSummaryQuery = useVolunteerSummary(monthNumber, year);
  const outgoingStatsQuery = useOutgoingStats(monthNumber, year);
  const foodBoxSummaryQuery = useFoodBoxSummary(monthNumber, year);
  const outreachSummaryQuery = useOutreachSummary(monthNumber, year);
  const inventoryStatsQuery = useInventoryStats(monthNumber, year);
  const weighingCategoriesQuery = useWeighingCategories();
  const recurringShiftsQuery = useRecurringShifts();

  // Derived Data
  // (Moved below to useMemo)
  const inventoryData = inventoryStatsQuery.data || [];
  const customUnits = weighingCategoriesQuery.data || [];

  // Filter states for Backpack and FoodBox
  const [backpackFilter, setBackpackFilter] = useState<'meals' | 'backpacks'>('meals');
  const [foodboxFilter, setFoodboxFilter] = useState<'meals' | 'foodboxes' | 'lbs' | 'kgs'>('meals');

  // Individual unit selections for different sections
  const [incomingUnit, setIncomingUnit] = useState<'kg' | 'lb' | string>('lb');
  const [inventoryUnit, setInventoryUnit] = useState<'kg' | 'lb' | string>('lb');

  const [activeIndex, setActiveIndex] = useState<number | null>(null);




  // Keep-alive ping to prevent cold starts (Keeping minimal logic here)
  useEffect(() => {
    const keepAlive = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/keepalive`);
      } catch (error) {
        // console.log('Keep-alive ping failed:', error);
      }
    };
    const interval = setInterval(keepAlive, 10 * 60 * 1000);
    keepAlive();
    return () => clearInterval(interval);
  }, []);


  // Helper functions for individual unit conversions
  const convertToIncomingUnit = useCallback((weightKg: number) => {
    if (incomingUnit === 'kg') return weightKg;
    if (incomingUnit === 'lb') return weightKg * 2.20462;
    const found = customUnits.find((u: any) => u.category === incomingUnit);
    return found && found.kilogram_kg_ ? weightKg / found.kilogram_kg_ : weightKg;
  }, [incomingUnit, customUnits]);

  const convertToInventoryUnit = useCallback((weightKg: number) => {
    if (inventoryUnit === 'kg') return weightKg;
    if (inventoryUnit === 'lb') return weightKg * 2.20462;
    const found = customUnits.find((u: any) => u.category === inventoryUnit);
    return found && found.kilogram_kg_ ? weightKg / found.kilogram_kg_ : weightKg;
  }, [inventoryUnit, customUnits]);

  const getIncomingUnitLabel = () => {
    if (incomingUnit === 'kg') return 'kg';
    if (incomingUnit === 'lb') return 'lb';
    return incomingUnit;
  };

  const getInventoryUnitLabel = () => {
    if (inventoryUnit === 'kg') return 'kg';
    if (inventoryUnit === 'lb') return 'lb';
    return inventoryUnit;
  };

  // Derived Data
  const { orgTotals, grandTotalWeight, grandTotalValue, incomingDollarValue, mealsValue } = React.useMemo(() => ({
    orgTotals: incomingStatsQuery.data?.donorTotals || {},
    grandTotalWeight: incomingStatsQuery.data?.grandTotalWeight || 0,
    grandTotalValue: incomingStatsQuery.data?.grandTotalValue || 0,
    incomingDollarValue: incomingStatsQuery.data?.incomingDollarValue || 0,
    mealsValue: incomingStatsQuery.data?.mealsValue || outgoingStatsQuery.data?.mealsValue || 10
  }), [incomingStatsQuery.data, outgoingStatsQuery.data]);

  const volunteers = volunteerSummaryQuery.data || [];

  // Volunteer summary
  const { totalVolunteerCount, totalHours, filteredVolunteers } = React.useMemo(() => {
    const filtered = volunteers.filter((u: any) => u.role === 'VOLUNTEER' && u.hours >= 1);
    return {
      filteredVolunteers: filtered,
      totalVolunteerCount: filtered.length,
      totalHours: Number(filtered.reduce((sum: number, u: any) => sum + u.hours, 0).toFixed(2))
    };
  }, [volunteers]);

  const {
    outTable, backpackMeals, totalBackpacks, foodboxMeals, totalFoodBoxes,
    totalFoodBoxWeightKg, totalFoodBoxWeightLb, outreachMeals, totalMealsServed, equivalentValue
  } = React.useMemo(() => ({
    outTable: outgoingStatsQuery.data?.data || [],
    backpackMeals: outgoingStatsQuery.data?.backpack?.totalMeals || 0,
    totalBackpacks: outgoingStatsQuery.data?.backpack?.totalBackpacks || 0,
    foodboxMeals: outgoingStatsQuery.data?.foodbox?.totalMeals || 0,
    totalFoodBoxes: outgoingStatsQuery.data?.foodbox?.totalFoodBoxes || 0,
    totalFoodBoxWeightKg: outgoingStatsQuery.data?.foodbox?.totalWeightKg || 0,
    totalFoodBoxWeightLb: outgoingStatsQuery.data?.foodbox?.totalWeightLb || 0,
    outreachMeals: outgoingStatsQuery.data?.outreach?.totalMeals || 0,
    totalMealsServed: outgoingStatsQuery.data?.totalMealsServed || 0,
    equivalentValue: outgoingStatsQuery.data?.equivalentValue || 0
  }), [outgoingStatsQuery.data]);

  // removed duplicate declarations of inventoryData and customUnits

  // Pie chart colors
  const getPieChartColors = (count: number) => {
    const baseColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
    ];
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };

  // Pie chart data
  const pieChartData = React.useMemo(() => inventoryData.map((item: any, index: number) => ({
    name: item.name,
    value: convertToInventoryUnit(item.weight),
    color: getPieChartColors(inventoryData.length)[index]
  })), [inventoryData, convertToInventoryUnit]);

  const onPieEnter = (_: any, index: number) => setActiveIndex(index);
  const onPieLeave = () => setActiveIndex(null);

  const renderCustomLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
        style={{ fontWeight: 600, fontSize: 14 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const downloadExcel = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, {
        items: 'include' as RequestCredentials // Fix type issues later if any, but standard fetch accepts 'include'
      } as any);

      // Actually, standard fetch options: { credentials: 'include' }
      // Re-doing the fetch call correctly below

      const res = await fetch(url, {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to export data');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
      toast.success('Export completed successfully!');
    } catch (err) {
      toast.error('Export failed. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-[#fff8f3]">
      <div className="dashboard-main" style={{ background: '#F7F7F9', minHeight: '100vh', padding: 24 }}>
        {/* Dashboard Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 28, color: '#222' }}>Dashboard</div>
            <div style={{ color: '#888', fontSize: 15, marginTop: 2 }}>Overview of all operations</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="export-btn"
              style={{
                color: '#fff',
                background: '#ff9800',
                border: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 14
              }}
              onClick={() => {
                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/export-consolidated?month=${monthNumber}&year=${year}&incomingUnit=${incomingUnit}&inventoryUnit=${inventoryUnit}`;
                downloadExcel(url, `consolidated-dashboard-${year}-${monthNumber}.xlsx`);
              }}
            >
              <FiDownload /> Export to Excel
            </button>
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 18px 8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#222', fontWeight: 500, fontSize: 15, marginRight: 2 }}>
              {periodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '8px 18px 8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#222', fontWeight: 500, fontSize: 15, marginRight: 2 }}>
              {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {/* Top Row */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {/* Incoming Stats */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Incoming Stats</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={incomingUnit}
                  onChange={e => setIncomingUnit(e.target.value as any)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#333', fontWeight: 500, fontSize: 14 }}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lb">Pounds (lb)</option>
                  {customUnits.map((u: any) => (
                    <option key={u.category} value={u.category}>{u.category}</option>
                  ))}
                </select>
                <button
                  className="export-btn"
                  style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  onClick={() => {
                    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/incoming-stats/export-dashboard?month=${monthNumber}&year=${year}&unit=${incomingUnit}`;
                    downloadExcel(url, `incoming-dashboard-${year}-${monthNumber}.xlsx`);
                  }}
                >
                  <FiDownload /> Export to Excel
                </button>
              </div>
            </div>
            {incomingStatsQuery.isLoading ? <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div> :
              incomingStatsQuery.error ? <div style={{ color: 'red', padding: 8 }}>Error loading data</div> : (
                <div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                      <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Weight</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{convertToIncomingUnit(grandTotalWeight).toLocaleString(undefined, { maximumFractionDigits: 2 })} {getIncomingUnitLabel()}</div>
                    </div>
                    <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                      <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Value</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>${(Number(grandTotalWeight.toFixed(2)) * Number(incomingDollarValue.toFixed(2))).toFixed(2)}</div>
                    </div>
                  </div>
                  <table style={{ width: '100%', fontSize: 15 }}>
                    <thead>
                      <tr style={{ color: '#888', fontWeight: 600, background: '#fafafa' }}>
                        <th style={{ textAlign: 'left', padding: '8px 8px 8px 0' }}>Donation Location</th>
                        <th style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>Weight ({getIncomingUnitLabel()})</th>
                        <th style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>Value ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries((orgTotals as any)).map(([id, totals]: [string, any]) => (
                        <tr key={id}>
                          <td style={{ padding: '8px 8px 8px 0' }}>{totals.name}</td>
                          <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>{convertToIncomingUnit(totals.weight).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>
                            ${(Number(totals.weight.toFixed(2)) * Number(incomingDollarValue.toFixed(2))).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* Volunteer Management */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Volunteer Management</div>
              <button
                className="export-btn"
                style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                onClick={() => {
                  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/volunteers/summary/export-dashboard?month=${monthNumber}&year=${year}`;
                  downloadExcel(url, `volunteers-${year}-${monthNumber}.xlsx`);
                }}
              >
                <FiDownload /> Export to Excel
              </button>
            </div>
            {volunteerSummaryQuery.isLoading ? <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div> :
              volunteerSummaryQuery.error ? <div style={{ color: 'red', padding: 8 }}>Error loading data</div> : (
                <div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                      <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Volunteers</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{totalVolunteerCount}</div>
                    </div>
                    <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                      <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Hours</div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>{totalHours}</div>
                    </div>
                  </div>
                  <table style={{ width: '100%', fontSize: 15 }}>
                    <thead>
                      <tr style={{ color: '#888', fontWeight: 600, background: '#fafafa' }}>
                        <th style={{ textAlign: 'left', padding: '8px 8px 8px 0' }}>Name</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Role</th>
                        <th style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVolunteers.slice(0, 8).map((v: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ padding: '8px 8px 8px 0' }}>{v.name}</td>
                          <td style={{ padding: '8px' }}>{v.role}</td>
                          <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>{v.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        </div>

        {/* Outgoing Stats */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Outgoing Stats</div>
            <button
              className="export-btn"
              style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => {
                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/export-dashboard?month=${monthNumber}&year=${year}&unit=kg`;
                downloadExcel(url, `outgoing-stats-${year}-${monthNumber}.xlsx`);
              }}
            >
              <FiDownload /> Export to Excel
            </button>
          </div>
          {outgoingStatsQuery.isLoading ? <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div> :
            outgoingStatsQuery.error ? <div style={{ color: 'red', padding: 8 }}>Error loading data</div> : (
              <>
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Meals Served</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{totalMealsServed.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Equivalent Value</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>${equivalentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                  {/* Backpack Box */}
                  <div style={{ flex: 1, background: '#f7f7f9', borderRadius: 10, padding: 16, minWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, color: '#f24503' }}>Backpack</div>
                      <select
                        value={backpackFilter}
                        onChange={(e) => setBackpackFilter(e.target.value as 'meals' | 'backpacks')}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#333', fontWeight: 500, fontSize: 12, cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="meals">Meals</option>
                        <option value="backpacks">Backpacks</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ background: '#FFF5ED', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 4, fontSize: 14 }}>
                          {backpackFilter === 'meals' ? 'Total Meals' : 'Total Backpacks'}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          {backpackFilter === 'meals'
                            ? backpackMeals.toLocaleString('en-US', { maximumFractionDigits: 0 })
                            : totalBackpacks.toLocaleString('en-US', { maximumFractionDigits: 0 })
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Food Box Box */}
                  <div style={{ flex: 1, background: '#f7f7f9', borderRadius: 10, padding: 16, minWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, color: '#f24503' }}>Food Box</div>
                      <select
                        value={foodboxFilter}
                        onChange={(e) => setFoodboxFilter(e.target.value as 'meals' | 'foodboxes' | 'lbs' | 'kgs')}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#333', fontWeight: 500, fontSize: 12, cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="meals">Meals</option>
                        <option value="foodboxes">Food Boxes</option>
                        <option value="lbs">Lbs</option>
                        <option value="kgs">Kgs</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ background: '#FFF5ED', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 4, fontSize: 14 }}>
                          {foodboxFilter === 'meals' ? 'Total Meals' :
                            foodboxFilter === 'foodboxes' ? 'Total Food Boxes' :
                              foodboxFilter === 'lbs' ? 'Total Weight (lbs)' :
                                'Total Weight (kgs)'}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          {foodboxFilter === 'meals'
                            ? foodboxMeals.toLocaleString('en-US', { maximumFractionDigits: 0 })
                            : foodboxFilter === 'foodboxes'
                              ? totalFoodBoxes.toLocaleString('en-US', { maximumFractionDigits: 0 })
                              : foodboxFilter === 'lbs'
                                ? totalFoodBoxWeightLb.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : totalFoodBoxWeightKg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Outreach Box */}
                  <div style={{ flex: 1, background: '#f7f7f9', borderRadius: 10, padding: 16, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, color: '#f24503', marginBottom: 12 }}>Outreach</div>
                    <div>
                      <div style={{ background: '#FFF5ED', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 4, fontSize: 14 }}>Total Meals</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{outreachMeals.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rows of categories */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                  {(() => {
                    if (!outTable || outTable.length === 0) return null;
                    const filteredTable = outTable.filter((cat: any) => cat.category.toLowerCase() !== 'collection');
                    if (filteredTable.length === 0) return null;
                    const half = Math.ceil(filteredTable.length / 2);
                    const firstRow = filteredTable.slice(0, half);
                    const secondRow = filteredTable.slice(half);
                    return [
                      <div key="row1" style={{ display: 'flex', gap: 24, width: '100%', marginBottom: 24 }}>
                        {firstRow.map((cat: any) => (
                          <div key={cat.category} style={{ flex: 1, background: '#f7f7f9', borderRadius: 10, padding: 16, minWidth: 220 }}>
                            <div style={{ fontWeight: 700, color: '#f24503', marginBottom: 8 }}>{cat.category}</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Shift</th>
                                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Meals Served</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.shifts.map((shift: any) => (
                                  <tr key={shift.shiftName}>
                                    <td style={{ padding: '6px 8px', textAlign: 'left' }}>{shift.shiftName}</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{shift.total}</td>
                                  </tr>
                                ))}
                                <tr style={{ fontWeight: 700, background: '#fafafa' }}>
                                  <td style={{ padding: '6px 8px', textAlign: 'left', color: '#222' }}>Total</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#222' }}>{cat.total}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>,
                      <div key="row2" style={{ display: 'flex', gap: 24, width: '100%' }}>
                        {secondRow.map((cat: any) => (
                          <div key={cat.category} style={{ flex: 1, background: '#f7f7f9', borderRadius: 10, padding: 16, minWidth: 220 }}>
                            <div style={{ fontWeight: 700, color: '#f24503', marginBottom: 8 }}>{cat.category}</div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Shift</th>
                                  <th style={{ textAlign: 'right', padding: '6px 8px' }}>Meals Served</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.shifts.map((shift: any) => (
                                  <tr key={shift.shiftName}>
                                    <td style={{ padding: '6px 8px', textAlign: 'left' }}>{shift.shiftName}</td>
                                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{shift.total}</td>
                                  </tr>
                                ))}
                                <tr style={{ fontWeight: 700, background: '#fafafa' }}>
                                  <td style={{ padding: '6px 8px', textAlign: 'left', color: '#222' }}>Total</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#222' }}>{cat.total}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    ];
                  })()}
                </div>
              </>
            )}
        </div>

        {/* Inventory Snapshot */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Inventory Snapshot</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={inventoryUnit}
                onChange={e => setInventoryUnit(e.target.value as any)}
                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#333', fontWeight: 500, fontSize: 14 }}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lb">Pounds (lb)</option>
                {customUnits.map((u: any) => (
                  <option key={u.category} value={u.category}>{u.category}</option>
                ))}
              </select>
              <button
                className="export-btn"
                style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                onClick={() => {
                  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/inventory-categories/export-dashboard?month=${monthNumber}&year=${year}&unit=${inventoryUnit}`;
                  downloadExcel(url, `inventory-${year}-${monthNumber}.xlsx`);
                }}
              >
                <FiDownload /> Export to Excel
              </button>
            </div>
          </div>
          {inventoryStatsQuery.isLoading ? <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div> :
            inventoryStatsQuery.error ? <div style={{ color: 'red', padding: 8 }}>Error loading data</div> : (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Pie Chart */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 24, minWidth: 0 }}>
                  <div style={{ width: '100%', maxWidth: 260, height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          onMouseEnter={onPieEnter}
                          onMouseLeave={onPieLeave}
                        >
                          {pieChartData.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                              stroke={activeIndex === index ? '#ffffff' : 'none'}
                              strokeWidth={activeIndex === index ? 3 : 0}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${getInventoryUnitLabel()}`, 'Quantity']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pieChartData.map((entry: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                          backgroundColor: activeIndex === index ? 'rgba(0,0,0,0.05)' : 'transparent'
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, background: entry.color }}></span>
                        <span style={{ fontSize: 15 }}>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Table */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <table style={{ width: '100%', fontSize: 15 }}>
                    <thead>
                      <tr style={{ color: '#888', fontWeight: 600, background: '#fafafa' }}>
                        <th style={{ textAlign: 'left', padding: '8px 8px 8px 0', width: '60%' }}>Category</th>
                        <th style={{ textAlign: 'right', padding: '8px 0 8px 8px', width: '40%' }}>Current Quantity ({getInventoryUnitLabel()})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.map((item: any, idx: number) => (
                        <tr
                          key={item.name}
                          style={{ backgroundColor: activeIndex === idx ? 'rgba(0,0,0,0.03)' : 'transparent', cursor: 'pointer' }}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onMouseLeave={() => setActiveIndex(null)}
                        >
                          <td style={{ padding: '8px 8px 8px 0' }}>{item.name}</td>
                          <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>{convertToInventoryUnit(item.weight).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}
