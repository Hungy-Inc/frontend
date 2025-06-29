"use client";

import { useState, useEffect } from 'react';
import { FaFileExport, FaUsers, FaChartBar, FaArrowUp, FaArrowDown, FaCog, FaUserCircle } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
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
  const [unit, setUnit] = useState('Kilograms (kg)');

  // Incoming stats state
  const [orgTotals, setOrgTotals] = useState<{ [org: string]: { weight: number, value: number } }>({});
  const [grandTotalWeight, setGrandTotalWeight] = useState<number>(0);
  const [grandTotalValue, setGrandTotalValue] = useState<number>(0);
  const [incomingDollarValue, setIncomingDollarValue] = useState<number>(0);
  const [loadingIncoming, setLoadingIncoming] = useState(true);
  const [errorIncoming, setErrorIncoming] = useState<string | null>(null);

  // Volunteer Management state
  const [volunteers, setVolunteers] = useState<{ name: string; role: string; hours: number }[]>([]);
  const [volLoading, setVolLoading] = useState(true);
  const [volError, setVolError] = useState<string | null>(null);

  // Outgoing stats state
  const [outColumns, setOutColumns] = useState<string[]>([]);
  const [outTable, setOutTable] = useState<any[]>([]);
  const [outLoading, setOutLoading] = useState(true);
  const [outError, setOutError] = useState<string | null>(null);

  // Inventory state
  const [inventoryData, setInventoryData] = useState<{ name: string; weight: number }[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<string | null>(null);

  // Filter options
  const periodOptions = [
    'Monthly', 'Weekly', 'All Months', ...monthNames
  ];
  const yearOptions = ['2025', '2024', '2023', '2022', '2021', '2020'];
  const unitOptions = ['Kilograms (kg)', 'Pounds (lb)'];

  // Map period to month number for API
  const getMonthNumber = (period: string) => {
    if (period === 'All Months') return 0;
    const idx = periodOptions.findIndex(p => p === period);
    if (idx >= 3) return idx - 2; // Jan=1, Feb=2, ...
    return 0; // Monthly/Weekly default to 0 (all months)
  };

  const router = useRouter();

  // User/org info for header
  const [orgName, setOrgName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // Fetch recurring shifts for mapping shift times to names
  const [recurringShifts, setRecurringShifts] = useState<any[]>([]);
  useEffect(() => {
    const fetchRecurringShifts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch recurring shifts');
        const data = await res.json();
        setRecurringShifts(data);
      } catch {
        setRecurringShifts([]);
      }
    };
    fetchRecurringShifts();
  }, []);

  useEffect(() => {
    // Get user from localStorage
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        let displayName = '';
        if (user.lastName) displayName = user.lastName;
        else displayName = 'User';
        setUserName(displayName);
        // Fetch org name if not cached
        if (user.organizationId) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organization/${user.organizationId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
            .then(res => res.json())
            .then(data => setOrgName(data.name || ''))
            .catch(() => setOrgName(''));
        }
      } catch {
        setUserName('User');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  useEffect(() => {
    const fetchIncomingStats = async () => {
      setLoadingIncoming(true);
      setErrorIncoming(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const month = getMonthNumber(period);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incoming-stats?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch incoming stats');
        const data = await response.json();
        setOrgTotals(data.donorTotals || {});
        setGrandTotalWeight(data.grandTotalWeight || 0);
        setGrandTotalValue(data.grandTotalValue || 0);
        setIncomingDollarValue(data.incomingDollarValue || 0);
      } catch (err) {
        setErrorIncoming(err instanceof Error ? err.message : 'An error occurred');
        setOrgTotals({});
        setGrandTotalWeight(0);
        setGrandTotalValue(0);
        setIncomingDollarValue(0);
      } finally {
        setLoadingIncoming(false);
      }
    };
    fetchIncomingStats();
  }, [period, year]);

  useEffect(() => {
    const fetchVolunteers = async () => {
      setVolLoading(true);
      setVolError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const month = getMonthNumber(period);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/volunteers/summary?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch volunteer summary');
        const data = await response.json();
        setVolunteers(data || []);
      } catch (err) {
        setVolError(err instanceof Error ? err.message : 'An error occurred');
        setVolunteers([]);
      } finally {
        setVolLoading(false);
      }
    };
    fetchVolunteers();
  }, [period, year]);

  useEffect(() => {
    const fetchOutgoingStats = async () => {
      setOutLoading(true);
      setOutError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const month = getMonthNumber(period);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch outgoing stats');
        const data = await response.json();
        setOutTable(data.data || []);
      } catch (err) {
        setOutError(err instanceof Error ? err.message : 'An error occurred');
        setOutTable([]);
      } finally {
        setOutLoading(false);
      }
    };
    fetchOutgoingStats();
  }, [period, year]);

  useEffect(() => {
    const fetchInventoryData = async () => {
      setInvLoading(true);
      setInvError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const month = getMonthNumber(period); // 0 for all months, 1-12 for Jan-Dec
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/inventory-categories/filtered?month=${month}&year=${year}`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch inventory data');
        const data = await response.json();
        setInventoryData(data || []);
      } catch (err) {
        setInvError(err instanceof Error ? err.message : 'An error occurred');
        setInventoryData([]);
      } finally {
        setInvLoading(false);
      }
    };
    fetchInventoryData();
  }, [period, year, unit]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (!token || !user) {
        router.push('/login');
      }
    }
  }, []);

  // Unit conversion
  const convertWeight = (weight: number) => {
    if (unit === 'Pounds (lb)') return (weight * 2.20462).toFixed(2);
    return weight.toFixed(2);
  };

  // Volunteer summary
  const totalVolunteers = volunteers.length;
  const totalHours = Number(volunteers.reduce((sum, v) => sum + v.hours, 0).toFixed(2));

  // Custom units state (move these above helpers)
  const [customUnits, setCustomUnits] = useState<{ category: string; kilogram_kg_: number; pound_lb_: number; noofmeals: number }[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'lb' | string>('kg');

  // Fetch custom units on mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing-categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setCustomUnits(data || []);
      } catch {}
    };
    fetchUnits();
  }, []);

  // Helper to get conversion rate for selected unit
  const getConversionRate = () => {
    if (selectedUnit === 'kg') return 1;
    if (selectedUnit === 'lb') return 2.20462;
    const found = customUnits.find(u => u.category === selectedUnit);
    return found ? found.kilogram_kg_ : 1;
  };

  // Helper to get display unit label
  const getUnitLabel = () => {
    if (selectedUnit === 'kg') return 'kg';
    if (selectedUnit === 'lb') return 'lb';
    return selectedUnit;
  };

  // Helper to convert weight to selected unit
  const convertToSelectedUnit = (weightKg: number) => {
    if (selectedUnit === 'kg') return weightKg;
    if (selectedUnit === 'lb') return weightKg * 2.20462;
    const found = customUnits.find(u => u.category === selectedUnit);
    return found && found.kilogram_kg_ ? weightKg / found.kilogram_kg_ : weightKg;
  };

  // Helper to convert weight based on selected weighing category
  const convertWeightForCategory = (rawWeight: number) => {
    if (selectedUnit === 'kg') return rawWeight;
    if (selectedUnit === 'lb') return rawWeight * 2.20462;
    const found = customUnits.find(u => u.category === selectedUnit);
    if (found && found.kilogram_kg_ > 0) {
      // Convert kg to custom unit (divide by kg per unit)
      return rawWeight / found.kilogram_kg_;
    }
    return rawWeight;
  };

  // Outgoing stats summary calculations (category totals and grand total)
  const categoryTotals: Record<string, number> = {};
  const categoryTotalsRaw: Record<string, number> = {};
  if (outTable && outTable.length > 0) {
    outTable.forEach((cat: any) => {
      categoryTotalsRaw[cat.category] = cat.total; // Keep raw values in kg
      categoryTotals[cat.category] = convertWeightForCategory(cat.total); // Converted values for display
    });
  }
  const totalDistributed = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  // Calculate equivalent value based on actual weight (in kg)
  const totalWeightKg = Object.values(outTable || []).reduce((sum, cat: any) => sum + (cat.total || 0), 0);
  const equivalentValue = totalWeightKg * 10; // $10 per kg equivalent

  // Pie chart data (use selected unit)
  const pieData = {
    labels: inventoryData.map(item => item.name),
    datasets: [
      {
        data: inventoryData.map(item => convertToSelectedUnit(item.weight)),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        ],
      },
    ],
  };

  // Helper to download Excel files
  const downloadExcel = async (url: string, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to export data');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  // Debug: Log outgoing stats data
  console.log('outTable:', outTable);
  console.log('selectedUnit:', selectedUnit);
  console.log('customUnits:', customUnits);
  console.log('categoryTotalsRaw:', categoryTotalsRaw);
  console.log('categoryTotals (converted):', categoryTotals);
  console.log('totalDistributed:', totalDistributed);

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
            {/* Period Filter */}
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 18px 8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#222', fontWeight: 500, fontSize: 15, marginRight: 2 }}>
              {periodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {/* Year Filter */}
            <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '8px 18px 8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#222', fontWeight: 500, fontSize: 15, marginRight: 2 }}>
              {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {/* Unit Filter (kg/lb/custom) */}
            <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value as any)} style={{ padding: '8px 18px 8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#222', fontWeight: 500, fontSize: 15, marginRight: 2 }}>
              <option value="kg">Kilograms (kg)</option>
              <option value="lb">Pounds (lb)</option>
              {customUnits.map(u => (
                <option key={u.category} value={u.category}>{u.category}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Top Row */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {/* Incoming Stats - left half */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Incoming Stats</div>
              <button
                className="export-btn"
                style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                onClick={() => {
                  const month = getMonthNumber(period);
                  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/incoming-stats/export-dashboard?month=${month}&year=${year}&unit=${selectedUnit}`;
                  downloadExcel(url, `incoming-dashboard-${year}-${month}.xlsx`);
                }}
              >
                <FiDownload /> Export to Excel
              </button>
            </div>
            {loadingIncoming ? (
              <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div>
            ) : errorIncoming ? (
              <div style={{ color: 'red', padding: 8 }}>{errorIncoming}</div>
            ) : (
              <div>
                {/* Summary Cards */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Weight</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{convertToSelectedUnit(grandTotalWeight).toLocaleString(undefined, { maximumFractionDigits: 2 })} {getUnitLabel()}</div>
                  </div>
                  <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Value</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>${grandTotalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
                {/* Donor breakdown table */}
                <table style={{ width: '100%', fontSize: 15 }}>
                  <thead>
                    <tr style={{ color: '#888', fontWeight: 600, background: '#fafafa' }}>
                      <th style={{ textAlign: 'left', padding: '8px 8px 8px 0' }}>Donor</th>
                      <th style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>Weight ({getUnitLabel()})</th>
                      <th style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>Value ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(orgTotals).map(([donor, totals]) => (
                      <tr key={donor}>
                        <td style={{ padding: '8px 8px 8px 0' }}>{donor}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>{convertToSelectedUnit(totals.weight).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>${totals.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Volunteer Management - right half */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Volunteer Management</div>
              <button
                className="export-btn"
                style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                onClick={() => {
                  const month = getMonthNumber(period);
                  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/volunteers/summary/export-dashboard?month=${month}&year=${year}`;
                  downloadExcel(url, `volunteers-${year}-${month}.xlsx`);
                }}
              >
                <FiDownload /> Export to Excel
              </button>
            </div>
            {volLoading ? (
              <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div>
            ) : volError ? (
              <div style={{ color: 'red', padding: 8 }}>{volError}</div>
            ) : (
              <div>
                {/* Summary Cards */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Volunteers</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{totalVolunteers}</div>
                  </div>
                  <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Hours</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{totalHours}</div>
                  </div>
                </div>
                {/* Volunteer table */}
                <table style={{ width: '100%', fontSize: 15 }}>
                  <thead>
                    <tr style={{ color: '#888', fontWeight: 600, background: '#fafafa' }}>
                      <th style={{ textAlign: 'left', padding: '8px 8px 8px 0' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Role</th>
                      <th style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.slice(0, 8).map((v, idx) => (
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
        {/* Outgoing Stats Section */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              Outgoing Stats
              {selectedUnit !== 'kg' && selectedUnit !== 'lb' && (
                <span style={{ fontSize: 14, fontWeight: 400, color: '#666', marginLeft: 8 }}>
                  (Converted to {selectedUnit} weight units)
                </span>
              )}
            </div>
            <button
              className="export-btn"
              style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => {
                const month = getMonthNumber(period);
                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/export-dashboard?month=${month}&year=${year}&unit=${selectedUnit}`;
                downloadExcel(url, `outgoing-stats-${year}-${month}.xlsx`);
              }}
            >
              <FiDownload /> Export to Excel
            </button>
          </div>
          {outError ? (
            <div style={{ color: 'red', padding: 8 }}>{outError}</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {(() => {
                if (!outTable || outTable.length === 0) return null;
                const half = Math.ceil(outTable.length / 2);
                const firstRow = outTable.slice(0, half);
                const secondRow = outTable.slice(half);
                return [
                  <div key="row1" style={{ display: 'flex', gap: 24, width: '100%', marginBottom: 24 }}>
                    {firstRow.map((cat: any) => (
                      <div key={cat.category} style={{ flex: 1, background: '#f7f7f9', borderRadius: 10, padding: 16, minWidth: 220 }}>
                        <div style={{ fontWeight: 700, color: '#f24503', marginBottom: 8 }}>{cat.category}</div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Shift</th>
                              <th style={{ textAlign: 'right', padding: '6px 8px' }}>
                                Weight ({getUnitLabel()})
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.shifts.map((shift: any) => (
                              <tr key={shift.shiftName}>
                                <td style={{ padding: '6px 8px', textAlign: 'left' }}>{shift.shiftName}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Math.round(convertWeightForCategory(shift.total) * 100) / 100}</td>
                              </tr>
                            ))}
                            <tr style={{ fontWeight: 700, background: '#fafafa' }}>
                              <td style={{ padding: '6px 8px', textAlign: 'left', color: '#222' }}>Total</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#222' }}>{Math.round(convertWeightForCategory(cat.total) * 100) / 100}</td>
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
                              <th style={{ textAlign: 'right', padding: '6px 8px' }}>
                                Weight ({getUnitLabel()})
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.shifts.map((shift: any) => (
                              <tr key={shift.shiftName}>
                                <td style={{ padding: '6px 8px', textAlign: 'left' }}>{shift.shiftName}</td>
                                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Math.round(convertWeightForCategory(shift.total) * 100) / 100}</td>
                              </tr>
                            ))}
                            <tr style={{ fontWeight: 700, background: '#fafafa' }}>
                              <td style={{ padding: '6px 8px', textAlign: 'left', color: '#222' }}>Total</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#222' }}>{Math.round(convertWeightForCategory(cat.total) * 100) / 100}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ];
              })()}
            </div>
          )}
        </div>
        {/* Outgoing Stats & Summary */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Summary</div>
            <button
              className="export-btn"
              style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => {
                const month = getMonthNumber(period);
                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/export-dashboard?month=${month}&year=${year}&unit=${selectedUnit}`;
                downloadExcel(url, `outgoing-stats-${year}-${month}.xlsx`);
              }}
            >
              <FiDownload /> Export to Excel
            </button>
          </div>
          {outError ? (
            <div style={{ color: 'red', padding: 8 }}>{outError}</div>
          ) : (
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            {/* Dynamic Program Cards */}
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>{category}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ wordBreak: 'break-word', lineHeight: '1.4', flex: '1 1 auto', maxWidth: '70%' }}>
                    Total Weight ({getUnitLabel()})
                  </span>
                  <span style={{ fontWeight: 700, flex: '0 0 auto' }}>{Math.round(total * 100) / 100}</span>
                </div>
              </div>
            ))}
          </div>
          )}
          {/* Summary Row */}
          <div style={{ display: 'flex', background: '#FFF5ED', borderRadius: 10, padding: 16, alignItems: 'center', gap: 24, fontWeight: 700, fontSize: 16, color: '#f24503', marginBottom: 8 }}>
            <div style={{ color: '#f24503', fontSize: 22 }}>
              Total Distributed {totalDistributed.toFixed(2)} {getUnitLabel()}
            </div>
            <div style={{ color: '#f24503', fontSize: 18, marginLeft: 'auto' }}>Equivalent Value ${equivalentValue.toLocaleString()}</div>
          </div>
        </div>
        {/* Inventory Snapshot */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Inventory Snapshot</div>
            <button
              className="export-btn"
              style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => {
                const month = getMonthNumber(period);
                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/inventory-categories/export-dashboard?month=${month}&year=${year}&unit=${selectedUnit}`;
                downloadExcel(url, `inventory-${year}-${month}.xlsx`);
              }}
            >
              <FiDownload /> Export to Excel
            </button>
          </div>
          {invError ? (
            <div style={{ color: 'red', padding: 8 }}>{invError}</div>
          ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Pie Chart and Legend - left half */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 24, minWidth: 0 }}>
              <div style={{ width: '100%', maxWidth: 260, height: 260 }}>
                <Pie data={pieData} options={{ plugins: { legend: { display: false } } }} />
              </div>
              {/* Custom Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieData.labels.map((label, idx) => (
                  <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, background: pieData.datasets[0].backgroundColor[idx] as string }}></span>
                    <span style={{ fontSize: 15 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Inventory Table - right half */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <table style={{ width: '100%', fontSize: 15 }}>
                <thead>
                  <tr style={{ color: '#888', fontWeight: 600, background: '#fafafa' }}>
                    <th style={{ textAlign: 'left', padding: '8px 8px 8px 0', width: '60%' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '8px 0 8px 8px', width: '40%' }}>Current Quantity ({getUnitLabel()})</th>
                  </tr>
                </thead>
                <tbody>
                  {invLoading ? (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: 16 }}>Loading...</td></tr>
                  ) : (
                    inventoryData.map(item => (
                      <tr key={item.name}>
                        <td style={{ padding: '8px 8px 8px 0' }}>{item.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>{convertToSelectedUnit(item.weight).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
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