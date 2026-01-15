"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaChartLine, 
  FaUsers, 
  FaClock, 
  FaChartBar, 
  FaChartPie,
  FaUser,
  FaArrowLeft,
  FaDownload,
  FaFilter,
  FaCalendarAlt,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'react-toastify';

const HALIFAX_TIMEZONE = 'America/Halifax';

/**
 * Get today's date in Halifax timezone as YYYY-MM-DD string
 * This ensures the date matches the user's local timezone (Halifax)
 */
const getHalifaxToday = (): string => {
  const now = new Date();
  // Use Intl.DateTimeFormat to get date in Halifax timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: HALIFAX_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // en-CA format returns YYYY-MM-DD directly
  return formatter.format(now);
};

/**
 * Get a date in Halifax timezone as YYYY-MM-DD string
 * @param date - Date object (defaults to now)
 */
const getHalifaxDateString = (date: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: HALIFAX_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
};

/**
 * Add or subtract days from a Halifax date string (YYYY-MM-DD)
 * Returns a new Halifax date string
 * Uses UTC date arithmetic to avoid timezone issues, then formats back to Halifax
 * @param dateStr - Date string in YYYY-MM-DD format (Halifax timezone)
 * @param days - Number of days to add (positive) or subtract (negative)
 */
const addDaysToHalifaxDate = (dateStr: string, days: number): string => {
  // Parse the date string
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create a UTC date at noon to avoid DST edge cases
  // We use noon because it's safely in the middle of the day
  const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  // Add/subtract days using UTC methods
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  
  // Format back using Halifax timezone
  // This will correctly show the date in Halifax, accounting for any timezone differences
  return getHalifaxDateString(utcDate);
};

interface Activity {
  type: string;
  timestamp: string;
  userId: number;
  userName: string;
  userEmail: string;
  shiftId: number | null;
  metadata: any;
}

interface UserSummary {
  userId: number;
  name: string;
  email: string;
  role: string;
  checkIns: number;
  checkOuts: number;
  mealCounts: number;
  foodBoxCounts: number;
  backpackCounts: number;
  outreachLogs: number;
  donations: number;
  donationsKitchen: number;
  donationsTransport: number;
  totalActivities: number;
  lastActivity: string | null;
}

interface FeatureUsage {
  name: string;
  usage: number;
  [key: string]: string | number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function MobileAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'user'>('overview');
  
  // Date range state - default to today in Halifax timezone
  const [startDate, setStartDate] = useState(() => {
    return getHalifaxToday();
  });
  const [endDate, setEndDate] = useState(() => {
    return getHalifaxToday();
  });
  
  // Quick filter buttons - auto-fetch on click
  const setToday = () => {
    const today = getHalifaxToday();
    setStartDate(today);
    setEndDate(today);
    // Data will auto-fetch via useEffect
  };
  
  const setLast7Days = () => {
    const today = getHalifaxToday();
    const start = addDaysToHalifaxDate(today, -6); // Last 7 days including today
    setStartDate(start);
    setEndDate(today);
  };
  
  const setLast30Days = () => {
    const today = getHalifaxToday();
    const start = addDaysToHalifaxDate(today, -29); // Last 30 days including today
    setStartDate(start);
    setEndDate(today);
  };
  
  const setThisWeek = () => {
    const today = getHalifaxToday();
    // Get day of week in Halifax timezone
    const [year, month, day] = today.split('-').map(Number);
    // Create a UTC date representing this day
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    // Get what day of week this is in Halifax
    const dayOfWeekStr = utcDate.toLocaleDateString('en-US', {
      timeZone: HALIFAX_TIMEZONE,
      weekday: 'short'
    });
    // Map day names to numbers (0 = Sunday)
    const dayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    const dayOfWeek = dayMap[dayOfWeekStr] ?? 0;
    const start = addDaysToHalifaxDate(today, -dayOfWeek); // Start of week (Sunday)
    setStartDate(start);
    setEndDate(today);
  };
  
  const setThisMonth = () => {
    const today = getHalifaxToday();
    // Get first day of current month in Halifax
    const [year, month] = today.split('-').map(Number);
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    setStartDate(firstDay);
    setEndDate(today);
  };

  // Data state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userSummary, setUserSummary] = useState<UserSummary[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [peakHoursWithUsers, setPeakHoursWithUsers] = useState<any[]>([]);
  const [dailyPatterns, setDailyPatterns] = useState<any[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedUser ? { userId: selectedUser.toString() } : {})
      });

      // Fetch all analytics data in parallel
      const [timelineRes, summaryRes, featuresRes, hoursRes, dailyRes] = await Promise.all([
        fetch(`${baseUrl}/api/analytics/activity-timeline?${params}`, { headers }),
        fetch(`${baseUrl}/api/analytics/user-summary?${params}`, { headers }),
        fetch(`${baseUrl}/api/analytics/feature-usage?${params}`, { headers }),
        fetch(`${baseUrl}/api/analytics/peak-hours?${params}`, { headers }),
        fetch(`${baseUrl}/api/analytics/daily-patterns?${params}`, { headers })
      ]);

      if (!timelineRes.ok || !summaryRes.ok || !featuresRes.ok || !hoursRes.ok || !dailyRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [timelineData, summaryData, featuresData, hoursData, dailyData] = await Promise.all([
        timelineRes.json(),
        summaryRes.json(),
        featuresRes.json(),
        hoursRes.json(),
        dailyRes.json()
      ]);

      setActivities(timelineData.activities || []);
      setUserSummary(summaryData.summary || []);
      setFeatureUsage(featuresData.features || []);
      setPeakHours(hoursData.hourlyData || []);
      setPeakHoursWithUsers(hoursData.hourlyDataWithUsers || []);
      setDailyPatterns(dailyData.dailyData || []);

      // If viewing individual user, fetch their detailed analytics
      if (selectedUser && viewMode === 'user') {
        const userRes = await fetch(`${baseUrl}/api/analytics/user/${selectedUser}?${params}`, { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserAnalytics(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedUser, viewMode]);

  const handleUserClick = (userId: number) => {
    setSelectedUser(userId);
    setViewMode('user');
    fetchData();
  };

  const handleBackToOverview = () => {
    setSelectedUser(null);
    setViewMode('overview');
  };

  // Helper function to determine which filter is active
  const getActiveFilter = () => {
    const today = getHalifaxToday();
    
    // Check if Today
    if (startDate === endDate && startDate === today) {
      return 'today';
    }
    
    // Check if This Week
    const [year, month, day] = today.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeekStr = utcDate.toLocaleDateString('en-US', {
      timeZone: HALIFAX_TIMEZONE,
      weekday: 'short'
    });
    const dayMap: { [key: string]: number } = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    const dayOfWeek = dayMap[dayOfWeekStr] ?? 0;
    const weekStart = addDaysToHalifaxDate(today, -dayOfWeek);
    if (startDate === weekStart && endDate === today) {
      return 'thisWeek';
    }
    
    // Check if This Month
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    if (startDate === monthStart && endDate === today) {
      return 'thisMonth';
    }
    
    // Check if Last 7 Days
    const last7Start = addDaysToHalifaxDate(today, -6);
    if (startDate === last7Start && endDate === today) {
      return 'last7Days';
    }
    
    // Check if Last 30 Days
    const last30Start = addDaysToHalifaxDate(today, -29);
    if (startDate === last30Start && endDate === today) {
      return 'last30Days';
    }
    
    return 'custom';
  };

  const activeFilter = getActiveFilter();

  // Process peak hours data for heatmap with user details
  const processPeakHours = () => {
    interface HourData {
      [key: string]: number | any[];
      users: any[];
    }
    const hoursMap: { [key: number]: HourData } = {};
    
    for (let i = 0; i < 24; i++) {
      hoursMap[i] = { users: [] };
    }

    // Process aggregated data
    peakHours.forEach((item: any) => {
      const hour = item.hour;
      const type = item.activity_type;
      const count = item.count;
      if (!hoursMap[hour]) hoursMap[hour] = { users: [] };
      hoursMap[hour][type] = count;
    });

    // Add user details
    peakHoursWithUsers.forEach((item: any) => {
      const hour = item.hour;
      if (!hoursMap[hour]) hoursMap[hour] = { users: [] };
      if (!hoursMap[hour].users) hoursMap[hour].users = [];
      
      // Check if user already exists for this hour
      const existingUser = hoursMap[hour].users.find((u: any) => u.userId === item.userId);
      if (existingUser) {
        existingUser.count += item.count;
        if (!existingUser.activities) existingUser.activities = {};
        existingUser.activities[item.activity_type] = (existingUser.activities[item.activity_type] || 0) + item.count;
      } else {
        hoursMap[hour].users.push({
          userId: item.userId,
          userName: item.userName,
          count: item.count,
          activities: { [item.activity_type]: item.count }
        });
      }
    });

    return Object.entries(hoursMap).map(([hour, data]) => {
      const { users, ...activityData } = data;
      return {
        hour: parseInt(hour),
        hourLabel: `${hour}:00`,
        ...activityData,
        total: Object.entries(activityData)
          .filter(([key]) => key !== 'users')
          .reduce((sum: number, [_, val]: [string, any]) => sum + (typeof val === 'number' ? val : 0), 0),
        users: users || []
      };
    });
  };

  // Process daily patterns for chart
  const processDailyPatterns = () => {
    const dayMap: { [key: string]: { [key: string]: number } } = {};
    
    dailyPatterns.forEach((item: any) => {
      const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const type = item.activity_type;
      const count = item.count;
      
      if (!dayMap[date]) dayMap[date] = {};
      dayMap[date][type] = count;
    });

    return Object.entries(dayMap)
      .map(([date, data]) => ({
        date,
        ...data,
        total: Object.values(data).reduce((sum: number, val: number) => sum + val, 0)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Calculate statistics
  const totalActivities = activities.length;
  const uniqueUsers = new Set(activities.map(a => a.userId)).size;
  const avgActivitiesPerUser = uniqueUsers > 0 ? (totalActivities / uniqueUsers).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'user' && userAnalytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <button
              onClick={handleBackToOverview}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Overview
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{userAnalytics.user.name}</h1>
                <p className="text-gray-600 mt-1">{userAnalytics.user.email} • {userAnalytics.user.role}</p>
              </div>
            </div>
          </div>

          {/* User Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title="Check-ins" value={userAnalytics.summary.checkIns} icon={FaClock} color="blue" />
            <StatCard title="Check-outs" value={userAnalytics.summary.checkOuts} icon={FaClock} color="green" />
            <StatCard title="Donations (Kitchen)" value={userAnalytics.summary.donationsKitchen || 0} icon={FaChartPie} color="orange" />
            <StatCard title="Donations (Transport)" value={userAnalytics.summary.donationsTransport || 0} icon={FaChartPie} color="yellow" subtitle={`Total: ${userAnalytics.summary.donationsTotal || 0}`} />
            <StatCard title="Meal Counts" value={userAnalytics.summary.mealCounts} icon={FaChartBar} color="purple" />
            <StatCard title="Food Boxes" value={userAnalytics.summary.foodBoxCounts} icon={FaChartPie} color="orange" />
            <StatCard title="Backpacks" value={userAnalytics.summary.backpackCounts} icon={FaChartPie} color="pink" />
            <StatCard title="Outreach" value={userAnalytics.summary.outreachLogs} icon={FaUsers} color="teal" />
          </div>

          {/* Hourly Activity Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hourly Activity Pattern</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userAnalytics.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <FaChartLine className="mr-3 text-blue-600" />
                Mobile App Analytics
              </h1>
              <p className="text-gray-600 mt-2">Track and analyze mobile app usage by kitchen staff</p>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 mt-4 mb-4 flex-wrap">
            <button
              onClick={setToday}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={setThisWeek}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'thisWeek'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              This Week
            </button>
            <button
              onClick={setThisMonth}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'thisMonth'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              This Month
            </button>
            <button
              onClick={setLast7Days}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'last7Days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={setLast30Days}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'last30Days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-500" />
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaFilter />
              Apply
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard 
            title="Total Activities" 
            value={totalActivities.toLocaleString()} 
            icon={FaChartLine} 
            color="blue"
            subtitle={`${avgActivitiesPerUser} per user`}
          />
          <StatCard 
            title="Active Users" 
            value={uniqueUsers.toString()} 
            icon={FaUsers} 
            color="green"
            subtitle={`${userSummary.length} total users`}
          />
          <StatCard 
            title="Top Feature" 
            value={featureUsage[0]?.name || 'N/A'} 
            icon={FaChartBar} 
            color="purple"
            subtitle={`${featureUsage[0]?.usage || 0} uses`}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Feature Usage */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FaChartPie className="mr-2 text-blue-600" />
              Feature Usage
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={featureUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="usage"
                >
                  {featureUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Activity Trends - Swapped with Peak Hours */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FaChartLine className="mr-2 text-purple-600" />
              Daily Activity Trends
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={processDailyPatterns()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={3} name="Total Activities" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Heatmap - Swapped with Daily Patterns */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <FaClock className="mr-2 text-green-600" />
            Peak Usage Hours
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processPeakHours()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hourLabel" />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-gray-900 mb-2">
                          {data.hourLabel}
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Total Activities: <span className="font-bold text-blue-600">{data.total}</span>
                        </p>
                        {data.users && data.users.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Active Users:</p>
                            <div className="max-h-48 overflow-y-auto">
                              {data.users.map((user: any, idx: number) => (
                                <div key={idx} className="mb-2 text-xs">
                                  <div className="font-medium text-gray-900">{user.userName}</div>
                                  <div className="text-gray-600 ml-2">
                                    {Object.entries(user.activities || {}).map(([activity, count]: [string, any]) => (
                                      <span key={activity} className="mr-2">
                                        {activity.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}: {count}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="total" fill="#00C49F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Activity Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaUsers className="mr-2 text-orange-600" />
              User Activity Summary
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery('')}
                  className="text-gray-500 hover:text-gray-700 px-2"
                  title="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Check-ins</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Meal Counts</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Food Boxes</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Backpacks</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Outreach</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Donations (Kitchen)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Donations (Transport)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Activity</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userSummary
                  .filter((user) => {
                    if (!userSearchQuery) return true;
                    const query = userSearchQuery.toLowerCase();
                    return (
                      user.name.toLowerCase().includes(query) ||
                      user.email.toLowerCase().includes(query)
                    );
                  })
                  .map((user) => (
                  <tr 
                    key={user.userId} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {user.checkIns}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {user.mealCounts}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        {user.foodBoxCounts}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                        {user.backpackCounts}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                        {user.outreachLogs}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        {user.donationsKitchen || 0}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        {user.donationsTransport || 0}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {user.totalActivities}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4 text-sm text-gray-600">
                      {user.lastActivity 
                        ? new Date(user.lastActivity).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="text-center py-4 px-4">
                      <button
                        onClick={() => handleUserClick(user.userId)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <FaUser />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  color: string;
  subtitle?: string;
}) {
  const colorClasses: { [key: string]: string } = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${colorClasses[color]} p-4 rounded-xl`}>
          <Icon className="text-white text-2xl" />
        </div>
      </div>
    </div>
  );
}

