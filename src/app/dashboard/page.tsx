"use client";

import { useState, useEffect } from 'react';
import { FaFileExport, FaUsers, FaChartBar, FaArrowUp, FaArrowDown, FaCog, FaUserCircle } from 'react-icons/fa';
import { FiDownload } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';

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
  const [unit, setUnit] = useState('Pounds (lb)');

  // Incoming stats state
  const [orgTotals, setOrgTotals] = useState<{ [org: string]: { weight: number, value: number } }>({});
  const [grandTotalWeight, setGrandTotalWeight] = useState<number>(0);
  const [grandTotalValue, setGrandTotalValue] = useState<number>(0);
  const [incomingDollarValue, setIncomingDollarValue] = useState<number>(0);
  const [mealsValue, setMealsValue] = useState<number>(10);
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

  // Food Box state
  const [foodBoxData, setFoodBoxData] = useState<{ totalFoodBoxes: number, totalMealsFromFoodBoxes: number, mealsPerBox: number }>({ totalFoodBoxes: 0, totalMealsFromFoodBoxes: 0, mealsPerBox: 10 });
  const [foodBoxLoading, setFoodBoxLoading] = useState(true);
  const [foodBoxError, setFoodBoxError] = useState<string | null>(null);

  // Outreach state
  const [outreachData, setOutreachData] = useState<{ locationData: { locationName: string, mealsCount: number }[], totalOutreachMeals: number }>({ locationData: [], totalOutreachMeals: 0 });
  const [outreachLoading, setOutreachLoading] = useState(true);
  const [outreachError, setOutreachError] = useState<string | null>(null);

  // Inventory state
  const [inventoryData, setInventoryData] = useState<{ name: string; weight: number }[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Filter options
  const periodOptions = [
    'All Months', ...monthNames
  ];
  const yearOptions = ['2025', '2024', '2023', '2022', '2021', '2020'];
  const unitOptions = ['Kilograms (kg)', 'Pounds (lb)'];

  // Map period to month number for API
  const getMonthNumber = (period: string) => {
    if (period === 'All Months') return 0;
    const idx = periodOptions.findIndex(p => p === period);
    if (idx >= 1) return idx; // Jan=1, Feb=2, ... (All Months is at index 0)
    return 0; // Default to all months
  };

  const router = useRouter();

  // Retry function for failed API calls
  const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  };

  // User/org info for header
  const [orgName, setOrgName] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [initialLoading, setInitialLoading] = useState(true);

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

  // Keep-alive ping to prevent cold starts
  useEffect(() => {
    const keepAlive = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/keepalive`);
      } catch (error) {
        console.log('Keep-alive ping failed:', error);
      }
    };

    // Ping every 10 minutes to keep server warm
    const interval = setInterval(keepAlive, 10 * 60 * 1000);
    
    // Initial ping
    keepAlive();

    return () => clearInterval(interval);
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
        // Don't fetch org name here as Header component already does it
      } catch {
        setUserName('User');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
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
        
        const apiCall = async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
          
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/incoming-stats?month=${month}&year=${year}`, {
              headers: { 'Authorization': `Bearer ${token}` },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              if (response.status === 408) throw new Error('Request timeout - server is starting up');
              if (response.status === 503) throw new Error('Service temporarily unavailable');
              throw new Error(`Failed to fetch incoming stats: ${response.status}`);
            }
            return await response.json();
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        };
        
        const data = await retryApiCall(apiCall);
        setOrgTotals(data.donorTotals || {});
        setGrandTotalWeight(data.grandTotalWeight || 0);
        setGrandTotalValue(data.grandTotalValue || 0);
        setIncomingDollarValue(data.incomingDollarValue || 0);
        setMealsValue(data.mealsValue || 10);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setErrorIncoming(errorMessage);
        console.error('Incoming stats error:', err);
        setOrgTotals({});
        setGrandTotalWeight(0);
        setGrandTotalValue(0);
        setIncomingDollarValue(0);
        setMealsValue(10);
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
    const fetchFoodBoxSummary = async () => {
      setFoodBoxLoading(true);
      setFoodBoxError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const month = getMonthNumber(period);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/foodbox-summary?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch food box summary');
        const data = await response.json();
        setFoodBoxData(data);
      } catch (err) {
        setFoodBoxError(err instanceof Error ? err.message : 'An error occurred');
        setFoodBoxData({ totalFoodBoxes: 0, totalMealsFromFoodBoxes: 0, mealsPerBox: 10 });
      } finally {
        setFoodBoxLoading(false);
      }
    };
    fetchFoodBoxSummary();
  }, [period, year]);

  useEffect(() => {
    const fetchOutreachSummary = async () => {
      setOutreachLoading(true);
      setOutreachError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const month = getMonthNumber(period);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/outreach-summary?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch outreach summary');
        const data = await response.json();
        setOutreachData(data);
      } catch (err) {
        setOutreachError(err instanceof Error ? err.message : 'An error occurred');
        setOutreachData({ locationData: [], totalOutreachMeals: 0 });
      } finally {
        setOutreachLoading(false);
      }
    };
    fetchOutreachSummary();
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
    // Auto-login check and redirect to login if not authenticated
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      if (!token || !user) {
        router.push('/login');
        return;
      }
      
      // Check if token is still valid by trying to decode it
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // If token is expired, clear storage and redirect to login
        if (decodedToken.exp < currentTime) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberMe');
          router.push('/login');
          return;
        }
        
        // Token is valid, show success message for auto-login
        if (rememberMe) {
          toast.success('Welcome back! You were automatically logged in.');
        }
      } catch (error) {
        // Invalid token format, clear storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        router.push('/login');
        return;
      }
      
      // Set initial loading to false after auth check
      setInitialLoading(false);
    }
  }, [router]);

  // Unit conversion
  const convertWeight = (weight: number) => {
    if (unit === 'Pounds (lb)') return (weight * 2.20462).toFixed(2);
    return weight.toFixed(2);
  };

  // Volunteer summary
  const filteredVolunteers = volunteers.filter(u => u.role === 'VOLUNTEER');
  const totalVolunteers = filteredVolunteers.length;
  const totalHours = Number(filteredVolunteers.reduce((sum, u) => sum + u.hours, 0).toFixed(2));

  // Custom units state (move these above helpers)
  const [customUnits, setCustomUnits] = useState<{ category: string; kilogram_kg_: number; pound_lb_: number }[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'lb' | string>('lb');
  
  // Individual unit selections for different sections
  const [incomingUnit, setIncomingUnit] = useState<'kg' | 'lb' | string>('lb');
  const [inventoryUnit, setInventoryUnit] = useState<'kg' | 'lb' | string>('lb');

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

  // Helper functions for individual unit conversions
  const convertToIncomingUnit = (weightKg: number) => {
    if (incomingUnit === 'kg') return weightKg;
    if (incomingUnit === 'lb') return weightKg * 2.20462;
    const found = customUnits.find(u => u.category === incomingUnit);
    return found && found.kilogram_kg_ ? weightKg / found.kilogram_kg_ : weightKg;
  };

  const convertToInventoryUnit = (weightKg: number) => {
    if (inventoryUnit === 'kg') return weightKg;
    if (inventoryUnit === 'lb') return weightKg * 2.20462;
    const found = customUnits.find(u => u.category === inventoryUnit);
    return found && found.kilogram_kg_ ? weightKg / found.kilogram_kg_ : weightKg;
  };

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

  // Outgoing stats summary calculations (category totals and grand total)
  const categoryTotals: Record<string, number> = {};
  const categoryTotalsRaw: Record<string, number> = {};
  if (outTable && outTable.length > 0) {
    // Filter out "Collection" category as it's not for meals distribution
    const filteredTable = outTable.filter((cat: any) => cat.category.toLowerCase() !== 'collection');
    filteredTable.forEach((cat: any) => {
      categoryTotalsRaw[cat.category] = cat.total; // Keep raw meal counts
      categoryTotals[cat.category] = cat.total; // Meals are just numbers, no conversion needed
    });
  }
  const totalDistributed = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  // Calculate equivalent value based on meals served (excluding Collection category)
  const filteredTable = outTable ? outTable.filter((cat: any) => cat.category.toLowerCase() !== 'collection') : [];
  const regularMealsServed = filteredTable.reduce((sum, cat: any) => sum + (cat.total || 0), 0);
  
  // Include food box and outreach meals in total
  const totalMealsServed = regularMealsServed + foodBoxData.totalMealsFromFoodBoxes + outreachData.totalOutreachMeals;
  const equivalentValue = totalMealsServed * mealsValue; // Use organization's meals value

  // Extended color palette for pie chart (supports many items)
  const getPieChartColors = (count: number) => {
    const baseColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
      '#F1948A', '#85C1E9', '#D7BDE2', '#A9DFBF', '#F9E79F', '#FADBD8',
      '#D5DBDB', '#AED6F1', '#D5A6BD', '#A3E4D7', '#FCF3CF', '#E8DAEF',
      '#D1F2EB', '#D6EAF8', '#FADBD8', '#D5DBDB', '#E8F8F5', '#FEF9E7',
      '#EBF5FB', '#F4F6F7', '#E8F6F3', '#FDF2E9', '#FCF3CF', '#EBDEF0',
      '#D1F2EB', '#D6EAF8', '#FADBD8', '#D5DBDB', '#E8F8F5', '#FEF9E7',
      '#EBF5FB', '#F4F6F7', '#E8F6F3', '#FDF2E9', '#FCF3CF', '#EBDEF0'
    ];
    
    // If we need more colors than available, cycle through them
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  };

  // Pie chart data for Recharts (use inventory unit)
  const pieChartData = inventoryData.map((item, index) => ({
    name: item.name,
    value: convertToInventoryUnit(item.weight),
    color: getPieChartColors(inventoryData.length)[index]
  }));

  // Handlers for interactive pie chart
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

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
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontWeight: 600, fontSize: 14 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
      toast.success('Export completed successfully!');
    } catch (err) {
      toast.error('Export failed. Please try again.');
    }
  };

  // Show loading screen during initial authentication check
  if (initialLoading) {
    return (
      <main className="min-h-screen bg-[#fff8f3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
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
            {/* Consolidated Export Button */}
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
                const month = getMonthNumber(period);
                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/export-consolidated?month=${month}&year=${year}&incomingUnit=${incomingUnit}&inventoryUnit=${inventoryUnit}`;
                downloadExcel(url, `consolidated-dashboard-${year}-${month}.xlsx`);
              }}
            >
              <FiDownload /> Export to Excel
            </button>
            {/* Period Filter */}
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 18px 8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#222', fontWeight: 500, fontSize: 15, marginRight: 2 }}>
              {periodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {/* Year Filter */}
            <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '8px 18px 8px 12px', borderRadius: 8, border: '1px solid #eee', background: '#fff', color: '#222', fontWeight: 500, fontSize: 15, marginRight: 2 }}>
              {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        {/* Top Row */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {/* Incoming Stats - left half */}
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Incoming Stats</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select 
                  value={incomingUnit} 
                  onChange={e => setIncomingUnit(e.target.value as any)} 
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: 6, 
                    border: '1px solid #ddd', 
                    background: '#fff', 
                    color: '#333', 
                    fontWeight: 500, 
                    fontSize: 14 
                  }}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lb">Pounds (lb)</option>
                  {customUnits.map(u => (
                    <option key={u.category} value={u.category}>{u.category}</option>
                  ))}
                </select>
                <button
                  className="export-btn"
                  style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  onClick={() => {
                    const month = getMonthNumber(period);
                    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/incoming-stats/export-dashboard?month=${month}&year=${year}&unit=${incomingUnit}`;
                    downloadExcel(url, `incoming-dashboard-${year}-${month}.xlsx`);
                  }}
                >
                  <FiDownload /> Export to Excel
                </button>
              </div>
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
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{convertToIncomingUnit(grandTotalWeight).toLocaleString(undefined, { maximumFractionDigits: 2 })} {getIncomingUnitLabel()}</div>
                  </div>
                  <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Value</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>${(Number(grandTotalWeight.toFixed(2)) * Number(incomingDollarValue.toFixed(2))).toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    </div>
                  </div>
                </div>
                {/* Donation Location breakdown table */}
                <table style={{ width: '100%', fontSize: 15 }}>
                <thead>
                  <tr style={{ color: '#888', fontWeight: 600, background: '#fafafa' }}>
                      <th style={{ textAlign: 'left', padding: '8px 8px 8px 0' }}>Donation Location</th>
                      <th style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>Weight ({getIncomingUnitLabel()})</th>
                      <th style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>Value ($)</th>
                  </tr>
                </thead>
                <tbody>
                    {Object.entries(orgTotals).map(([donor, totals]) => (
                      <tr key={donor}>
                        <td style={{ padding: '8px 8px 8px 0' }}>{donor}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>{convertToIncomingUnit(totals.weight).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>
                          ${(Number(totals.weight.toFixed(2)) * Number(incomingDollarValue.toFixed(2))).toFixed(2)}
                          <div style={{ fontSize: 11, color: '#666' }}>
                          </div>
                        </td>
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
            </div>
            <button
              className="export-btn"
              style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => {
                const month = getMonthNumber(period);
                const url = `${process.env.NEXT_PUBLIC_API_URL}/api/outgoing-stats/export-dashboard?month=${month}&year=${year}&unit=kg`;
                downloadExcel(url, `outgoing-stats-${year}-${month}.xlsx`);
              }}
            >
              <FiDownload /> Export to Excel
            </button>
          </div>
          {outError ? (
            <div style={{ color: 'red', padding: 8 }}>{outError}</div>
          ) : (
            <>
              {/* Total Meals and Equivalent Value Boxes */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Total Meals Served</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f24503' }}>{totalMealsServed.toFixed(0)}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    Regular: {regularMealsServed} | Food Box: {foodBoxData.totalMealsFromFoodBoxes} | Outreach: {outreachData.totalOutreachMeals}
                  </div>
                </div>
                <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 8 }}>Equivalent Value</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f24503' }}>${equivalentValue.toLocaleString()}</div>
                </div>
              </div>

              {/* Food Box and Outreach Summary Boxes */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                {/* Food Box Box */}
                <div style={{ flex: 1, background: '#f7f7f9', borderRadius: 10, padding: 16, minWidth: 300 }}>
                  <div style={{ fontWeight: 700, color: '#f24503', marginBottom: 12 }}>Food Box Distribution</div>
                  {foodBoxLoading ? (
                    <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div>
                  ) : foodBoxError ? (
                    <div style={{ color: 'red', padding: 8 }}>{foodBoxError}</div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 4, fontSize: 14 }}>Total Food Boxes</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#f24503' }}>{foodBoxData.totalFoodBoxes}</div>
                        </div>
                        <div style={{ flex: 1, background: '#FFF5ED', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 4, fontSize: 14 }}>Total Meals</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#f24503' }}>{foodBoxData.totalMealsFromFoodBoxes}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                        {foodBoxData.mealsPerBox} meals per box
                      </div>
                    </div>
                  )}
                </div>

                {/* Outreach Box */}
                <div style={{ flex: 1, background: '#f7f7f9', borderRadius: 10, padding: 16, minWidth: 300 }}>
                  <div style={{ fontWeight: 700, color: '#f24503', marginBottom: 12 }}>Outreach Activities</div>
                  {outreachLoading ? (
                    <div style={{ textAlign: 'center', padding: 16 }}>Loading...</div>
                  ) : outreachError ? (
                    <div style={{ color: 'red', padding: 8 }}>{outreachError}</div>
                  ) : (
                    <div>
                      <div style={{ background: '#FFF5ED', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, color: '#f24503', marginBottom: 4, fontSize: 14 }}>Total Outreach Meals</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#f24503' }}>{outreachData.totalOutreachMeals}</div>
                      </div>
                      {outreachData.locationData.length > 0 && (
                        <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                          <table style={{ width: '100%', fontSize: 13 }}>
                            <thead>
                              <tr style={{ color: '#888', fontWeight: 600 }}>
                                <th style={{ textAlign: 'left', padding: '4px 0' }}>Location</th>
                                <th style={{ textAlign: 'right', padding: '4px 0' }}>Meals</th>
                              </tr>
                            </thead>
                            <tbody>
                              {outreachData.locationData.map((location, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: '4px 0' }}>{location.locationName}</td>
                                  <td style={{ textAlign: 'right', padding: '4px 0' }}>{location.mealsCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              {(() => {
                if (!outTable || outTable.length === 0) return null;
                // Filter out "Collection" category as it's not for meals distribution
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
                              <th style={{ textAlign: 'right', padding: '6px 8px' }}>
                                Meals Served
                              </th>
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
                              <th style={{ textAlign: 'right', padding: '6px 8px' }}>
                                Meals Served
                              </th>
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
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: 6, 
                  border: '1px solid #ddd', 
                  background: '#fff', 
                  color: '#333', 
                  fontWeight: 500, 
                  fontSize: 14 
                }}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lb">Pounds (lb)</option>
                {customUnits.map(u => (
                  <option key={u.category} value={u.category}>{u.category}</option>
                ))}
              </select>
              <button
                className="export-btn"
                style={{ color: '#ff9800', background: 'none', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                onClick={() => {
                  const month = getMonthNumber(period);
                  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/inventory-categories/export-dashboard?month=${month}&year=${year}&unit=${inventoryUnit}`;
                  downloadExcel(url, `inventory-${year}-${month}.xlsx`);
                }}
              >
                <FiDownload /> Export to Excel
              </button>
            </div>
          </div>
          {invError ? (
            <div style={{ color: 'red', padding: 8 }}>{invError}</div>
          ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Pie Chart and Legend - left half */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 24, minWidth: 0 }}>
              {/* Interactive Pie Chart */}
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
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                          stroke={activeIndex === index ? '#ffffff' : 'none'}
                          strokeWidth={activeIndex === index ? 3 : 0}
                          style={{
                            filter: activeIndex === index ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                      formatter={(value: any) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${getInventoryUnitLabel()}`, 'Quantity']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Interactive Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieChartData.map((entry, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 6,
                      backgroundColor: activeIndex === index ? 'rgba(0,0,0,0.05)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    <span 
                      style={{ 
                        display: 'inline-block', 
                        width: 18, 
                        height: 18, 
                        borderRadius: 4, 
                        background: entry.color,
                        transform: activeIndex === index ? 'scale(1.15)' : 'scale(1)',
                        boxShadow: activeIndex === index ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    ></span>
                    <span style={{ fontSize: 15 }}>{entry.name}</span>
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
                    <th style={{ textAlign: 'right', padding: '8px 0 8px 8px', width: '40%' }}>Current Quantity ({getInventoryUnitLabel()})</th>
                  </tr>
                </thead>
                <tbody>
                  {invLoading ? (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: 16 }}>Loading...</td></tr>
                  ) : (
                    inventoryData.map((item, idx) => (
                      <tr 
                        key={item.name}
                        style={{
                          backgroundColor: activeIndex === idx ? 'rgba(0,0,0,0.03)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseLeave={() => setActiveIndex(null)}
                      >
                        <td style={{ padding: '8px 8px 8px 0' }}>{item.name}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0 8px 8px' }}>{convertToInventoryUnit(item.weight).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
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