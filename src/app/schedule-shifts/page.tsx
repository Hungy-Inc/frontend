"use client";
// SHIFT_DISABLED_START
import { redirect } from 'next/navigation';
// SHIFT_DISABLED_END
import React, { useEffect, useState, useRef } from "react";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { MultiSelect } from "react-multi-select-component";
import { toast } from 'react-toastify';
import type { ToastContainerProps } from 'react-toastify';
import { getRecurringShiftWallClockHoursMinutes } from '@/utils/timezoneUtils';


export default function ScheduleShiftsPage() {
  // SHIFT_DISABLED_START
  (redirect as unknown as (url: string) => void)('/dashboard');
  // SHIFT_DISABLED_END
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<number>(0);
  const [bookedUserIds, setBookedUserIds] = useState<number[]>([]);

  // Add modal state
  const [addData, setAddData] = useState<{
    shiftCategoryId: string;
    shiftName: string;
    shiftTiming: string;
    userIds: number[];
    location?: string;
  }>({
    shiftCategoryId: '',
    shiftName: '',
    shiftTiming: '',
    userIds: []
  });
  const [users, setUsers] = useState<any[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);

  // Edit modal state
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({ userId: null, shiftId: null });
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  const [recurringShifts, setRecurringShifts] = useState<any[]>([]);
  const [addDayOfWeek, setAddDayOfWeek] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [addDate, setAddDate] = useState<string>("");

  // State to track correct counts for each recurring shift (considering absences)
  const [shiftCounts, setShiftCounts] = useState<{ [key: number]: { totalFilledSlots: number, presentDefaultUsers: number, pendingSlots: number } }>({});
  
  // State to cache absences for shifts (to avoid refetching on every render)
  const [shiftAbsencesCache, setShiftAbsencesCache] = useState<{ [key: number]: number[] }>({});

  // Add state for editing signup
  const [editSignupId, setEditSignupId] = useState<number | null>(null);
  const [editSignupUserId, setEditSignupUserId] = useState<number | null>(null);

  // Add state to track which shift row is being edited and the edited userIds
  const [editShiftId, setEditShiftId] = useState<number | null>(null);
  const [editSignupUserIds, setEditSignupUserIds] = useState<{ [signupId: string]: number }>({});

  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [showRecurringWarning, setShowRecurringWarning] = useState(false);

  // Add state for date filter
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>('');

  // Add state for shift type filter
  const [shiftTypeFilter, setShiftTypeFilter] = useState<'all' | 'recurring' | 'one-time'>('all');

  // Add a new state for the card tabs' selected category
  const [selectedCardCategory, setSelectedCardCategory] = useState<string>("");

  // Add a ref for the custom date input
  const customDateRef = useRef<HTMLInputElement>(null);

  // Add state for selected card and selected users for the card
  const [selectedRecurringId, setSelectedRecurringId] = useState<number | null>(null);
  const [selectedRecurringUsers, setSelectedRecurringUsers] = useState<any[]>([]);

  const [scheduling, setScheduling] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Add new state for employee selection popup
  const [showEmployeePopup, setShowEmployeePopup] = useState(false);
  const [selectedShiftForPopup, setSelectedShiftForPopup] = useState<any>(null);
  const [scheduledEmployees, setScheduledEmployees] = useState<{ [shiftId: string]: any[] }>({});
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  // Add state for manage modal search
  const [scheduledSearchTerm, setScheduledSearchTerm] = useState('');
  const [unscheduledSearchTerm, setUnscheduledSearchTerm] = useState('');

  // Add state for copy link feedback
  const [lastCopiedUrl, setLastCopiedUrl] = useState<string>('');
  const [showUrlDisplay, setShowUrlDisplay] = useState(false);

  // Add state for open employee dropdowns
  const [openEmployeeDropdown, setOpenEmployeeDropdown] = useState<{ [shiftId: number]: boolean }>({});

  // Add state for which shift's dropdown is open
  const [openUserDropdownShiftId, setOpenUserDropdownShiftId] = useState<number | null>(null);
  const [dropdownSelectedEmployees, setDropdownSelectedEmployees] = useState<any[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // Add state for dropdown selected user IDs
  const [dropdownSelectedUserIds, setDropdownSelectedUserIds] = useState<number[]>([]);

  // Compute today's date string for disabling past dates in custom date picker
  const todayStr = new Date().toISOString().split('T')[0];

  // --- Manage Employees Modal State ---
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageModalData, setManageModalData] = useState<{ scheduled: any[]; unscheduled: any[]; slots: number; booked: number; defaultUsers?: number; absentDefaultUsers?: number; availableSlots?: number } | null>(null);
  const [manageModalShift, setManageModalShift] = useState<any>(null);
  const [manageModalLoading, setManageModalLoading] = useState(false);
  const [addSlotsInput, setAddSlotsInput] = useState<string>('');
  const [reduceSlotsInput, setReduceSlotsInput] = useState<string>('');
  const [updatingSlots, setUpdatingSlots] = useState(false);

  // Default Users Management State
  const [defaultUsers, setDefaultUsers] = useState<any[]>([]);
  const [shiftAbsences, setShiftAbsences] = useState<any[]>([]);
  const [loadingDefaultUsers, setLoadingDefaultUsers] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedUserForAbsence, setSelectedUserForAbsence] = useState<any>(null);
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceType, setAbsenceType] = useState('UNAVAILABLE');

  // Improved absence management state
  const [selectedUsersForAbsence, setSelectedUsersForAbsence] = useState<number[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Add state for shift name filter
  const [selectedShiftName, setSelectedShiftName] = useState<string>("");

  // Detect Safari browser
  const isSafari = () => {
    const userAgent = navigator.userAgent;
    return /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  };

  // Clipboard utility function with fallbacks
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Method 1: Modern Clipboard API (most reliable)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (clipboardErr) {
          console.log('Modern clipboard API failed, trying fallback...');
          // Continue to fallback method
        }
      }

      // Method 2: Fallback for older browsers, non-secure contexts, or Safari issues
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.style.zIndex = '-1';
      textArea.style.fontSize = '12pt'; // Required for iOS Safari

      document.body.appendChild(textArea);

      // Focus and select - important for Safari
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        console.error('execCommand copy failed:', err);
        return false;
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      return false;
    }
  };

  const handleToggleEmployeeDropdown = (shiftId: number) => {
    setOpenEmployeeDropdown(prev => ({
      ...prev,
      [shiftId]: !prev[shiftId]
    }));
  };

  // OPTIMIZED: Single combined fetch for all page data
  const fetchAllPageData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule-shifts-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch schedule data");
      const data = await res.json();
      
      // Set all data at once
      setShifts(data.shifts || []);
      setRecurringShifts(data.recurringShifts || []);
      setUsers(data.users || []);
      
      // Update absences cache from combined response
      const absencesByShiftId = data.absencesByShiftId || {};
      const newAbsencesCache: { [key: number]: number[] } = {};
      for (const shiftId in absencesByShiftId) {
        newAbsencesCache[Number(shiftId)] = absencesByShiftId[shiftId].map((a: any) => a.userId);
      }
      setShiftAbsencesCache(newAbsencesCache);
      
      // Pre-calculate shift counts using the absences data from the response
      if (data.recurringShifts && data.shifts) {
        calculateShiftCountsWithAbsences(data.recurringShifts, data.shifts, absencesByShiftId);
      }
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      setError("Failed to load schedule data.");
      // Fallback to individual fetches if combined endpoint fails
      fetchShifts();
      fetchUsers();
      fetchRecurringShifts();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // OPTIMIZED: Single API call for all data
    fetchAllPageData();

    // Clear URL display on page refresh
    setShowUrlDisplay(false);
    setLastCopiedUrl('');

    // Smart refresh - check for changes every 30 seconds (reduced frequency, uses combined endpoint)
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/last-updated`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.lastUpdated > lastUpdateTime) {
            // Use combined fetch for efficiency
            fetchAllPageData();
            setLastUpdateTime(data.lastUpdated);
          }
        }
      } catch (err) {
        // Silently fail - don't interrupt user experience
        // Fallback: refresh every 60 seconds if endpoint doesn't exist
        if (Date.now() - lastUpdateTime > 60000) {
          fetchAllPageData();
          setLastUpdateTime(Date.now());
        }
      }
    }, 30000); // Increased from 10s to 30s to reduce server load

    // Listen for shift signup events
    const handleShiftSignup = () => {
      fetchAllPageData();
      setLastUpdateTime(Date.now());
    };

    window.addEventListener('shiftSignupCompleted', handleShiftSignup);

    return () => {
      clearInterval(interval);
      window.removeEventListener('shiftSignupCompleted', handleShiftSignup);
    };
  }, [lastUpdateTime]);

  // Note: fetchUsers is already called in the main useEffect above, no need for duplicate call

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Ensure we have the correct user data structure
      const formattedUsers = data.map((user: any) => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`.trim()
      }));
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    }
  };

  // Fetch categories on page load (needed for displaying category names in cards)
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Also fetch categories when add modal opens (to ensure fresh data)
  useEffect(() => {
    if (showAdd) fetchCategories();
  }, [showAdd]);
  
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Filter out "Collection" category as it's only for backend use
      const filteredCategories = data.filter((category: any) =>
        category.name.toLowerCase() !== 'collection'
      );
      setCategoryOptions(filteredCategories);
    } catch {
      setCategoryOptions([]);
    }
  };

  const fetchShifts = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch shifts");
      const data = await res.json();
      setShifts(data);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError("Failed to load shifts.");
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh so shift cards show live count after Manage modal changes (add/remove/absence).
  // Uses same endpoint as initial load so card and modal stay in sync.
  const refreshShiftsForCard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedule-shifts-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setShifts(data.shifts || []);
      const newAbsencesCache: { [key: number]: number[] } = {};
      for (const shiftId in (data.absencesByShiftId || {})) {
        newAbsencesCache[Number(shiftId)] = (data.absencesByShiftId[shiftId] || []).map((a: any) => a.userId);
      }
      setShiftAbsencesCache(newAbsencesCache);
      if (data.recurringShifts && data.shifts) {
        calculateShiftCountsWithAbsences(data.recurringShifts, data.shifts, data.absencesByShiftId || {});
      }
    } catch (err) {
      console.error('Background refresh for card failed', err);
    }
  };

  // Fetch recurring shifts for add modal
  useEffect(() => {
    if (showAdd) fetchRecurringShifts();
  }, [showAdd]);
  const fetchRecurringShifts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecurringShifts(data);
      // Calculate correct counts after fetching recurring shifts
      calculateShiftCounts(data);
    } catch {
      setRecurringShifts([]);
    }
  };

  // OPTIMIZED: Calculate counts using pre-fetched absences (no additional API calls)
  const calculateShiftCountsWithAbsences = (
    recurringShiftsData: any[], 
    shiftsData: any[], 
    absencesByShiftId: { [key: number]: any[] }
  ) => {
    const newCounts: { [key: number]: { totalFilledSlots: number, presentDefaultUsers: number, pendingSlots: number } } = {};
    const today = new Date();
    const todayStr = today.toDateString();
    const todayDayOfWeek = today.getDay();

    for (const rec of recurringShiftsData) {
      const todaysShifts = shiftsData.filter(shift =>
        shift.recurringShiftId === rec.id &&
        new Date(shift.startTime).toDateString() === todayStr
      );

      // Get day config for today
      const dayConfig = rec.RecurringShiftDayConfig?.find(
        (conf: any) => conf.dayOfWeek === todayDayOfWeek
      );

      const totalSlots = (dayConfig && dayConfig.slots !== null && dayConfig.slots !== undefined)
        ? dayConfig.slots
        : (rec.slots || 0);

      // Exclude test user so capacity matches backend (/api/shift-employees)
      const daySpecificUsers = rec.DefaultShiftUser ? rec.DefaultShiftUser.filter(
        (du: any) => du.dayOfWeek !== null && du.dayOfWeek === todayDayOfWeek && du.User?.email !== 'test@gmail.com'
      ) : [];
      const defaultUsersForToday = daySpecificUsers.length > 0 
        ? daySpecificUsers
        : (rec.DefaultShiftUser ? rec.DefaultShiftUser.filter((du: any) => du.dayOfWeek === null && du.User?.email !== 'test@gmail.com') : []);
      const totalDefaultUsers = defaultUsersForToday.length;
      const defaultUserIds = defaultUsersForToday.map((du: any) => du.userId);

      // Collect all absent user IDs across today's shifts
      const allAbsentUserIds = new Set<number>();
      let absentDefaultUsers = 0;
      for (const shift of todaysShifts) {
        const shiftAbsences = absencesByShiftId[shift.id] || [];
        const absentUserIds = shiftAbsences.map((a: any) => a.userId);
        absentUserIds.forEach((id: number) => allAbsentUserIds.add(id));
        absentDefaultUsers += absentUserIds.filter((id: number) => defaultUserIds.includes(id)).length;
      }

      const presentDefaultUsers = Math.max(0, totalDefaultUsers - absentDefaultUsers);
      
      // Count non-default signups EXCLUDING absent users
      const todaysSignups = todaysShifts.reduce((sum, shift) => {
        if (!shift.ShiftSignup) return sum;
        const nonDefaultNonAbsentSignups = shift.ShiftSignup.filter((signup: any) => 
          !defaultUserIds.includes(signup.userId) && !allAbsentUserIds.has(signup.userId)
        );
        return sum + nonDefaultNonAbsentSignups.length;
      }, 0);

      const totalFilledSlots = todaysSignups + presentDefaultUsers;
      const pendingSlots = Math.max(0, totalSlots - totalFilledSlots);

      newCounts[rec.id] = { totalFilledSlots, presentDefaultUsers, pendingSlots };
    }

    setShiftCounts(newCounts);
  };

  // Legacy function for fallback - uses API call
  const calculateShiftCounts = async (recurringShiftsData: any[]) => {
    const today = new Date();
    const todayStr = today.toDateString();

    // Collect all TODAY's shift IDs across all recurring shifts
    const allTodaysShiftIds: number[] = [];
    for (const rec of recurringShiftsData) {
      const todaysShifts = shifts.filter(shift =>
        shift.recurringShiftId === rec.id &&
        new Date(shift.startTime).toDateString() === todayStr
      );
      allTodaysShiftIds.push(...todaysShifts.map(s => s.id));
    }

    // BATCH: Fetch all absences for all today's shifts in ONE API call
    let absencesByShiftId: { [key: number]: any[] } = {};
    if (allTodaysShiftIds.length > 0) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/batch-absences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ shiftIds: allTodaysShiftIds })
        });
        if (res.ok) {
          const data = await res.json();
          absencesByShiftId = data.absencesByShiftId || {};
        }
      } catch (err) {
        console.error('Error fetching batch absences:', err);
      }
    }

    // Use the optimized function with fetched absences
    calculateShiftCountsWithAbsences(recurringShiftsData, shifts, absencesByShiftId);
  };

  // Original calculateShiftCounts logic for the useEffect (called when shifts/recurringShifts change independently)
  const calculateShiftCountsLegacy = async (recurringShiftsData: any[]) => {
    const newCounts: { [key: number]: { totalFilledSlots: number, presentDefaultUsers: number, pendingSlots: number } } = {};
    const today = new Date();
    const todayStr = today.toDateString();
    const todayDayOfWeek = today.getDay();

    const allTodaysShiftIds: number[] = [];
    const todaysShiftsByRecurring: { [key: number]: any[] } = {};

    for (const rec of recurringShiftsData) {
      const todaysShifts = shifts.filter(shift =>
        shift.recurringShiftId === rec.id &&
        new Date(shift.startTime).toDateString() === todayStr
      );
      todaysShiftsByRecurring[rec.id] = todaysShifts;
      allTodaysShiftIds.push(...todaysShifts.map(s => s.id));
    }

    let absencesByShiftId: { [key: number]: any[] } = {};
    if (allTodaysShiftIds.length > 0) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/batch-absences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ shiftIds: allTodaysShiftIds })
        });
        if (res.ok) {
          const data = await res.json();
          absencesByShiftId = data.absencesByShiftId || {};
        }
      } catch (err) {
        console.error('Error fetching batch absences:', err);
      }
    }

    for (const rec of recurringShiftsData) {
      const todaysShifts = todaysShiftsByRecurring[rec.id] || [];

      // Get day config for today
      const dayConfig = rec.RecurringShiftDayConfig?.find(
        (conf: any) => conf.dayOfWeek === todayDayOfWeek
      );

      // Use day config slots if available, otherwise use global slots
      const totalSlots = (dayConfig && dayConfig.slots !== null && dayConfig.slots !== undefined)
        ? dayConfig.slots
        : (rec.slots || 0);

      // Priority: Use day-specific default users if they exist, otherwise use global default users. Exclude test user.
      const daySpecificUsers = rec.DefaultShiftUser ? rec.DefaultShiftUser.filter(
        (du: any) => du.dayOfWeek !== null && du.dayOfWeek === todayDayOfWeek && du.User?.email !== 'test@gmail.com'
      ) : [];
      const defaultUsersForToday = daySpecificUsers.length > 0 
        ? daySpecificUsers
        : (rec.DefaultShiftUser ? rec.DefaultShiftUser.filter((du: any) => du.dayOfWeek === null && du.User?.email !== 'test@gmail.com') : []);
      const totalDefaultUsers = defaultUsersForToday.length;
      const defaultUserIds = defaultUsersForToday.map((du: any) => du.userId);

      // Collect all absent user IDs and count absent default users
      const allAbsentUserIds = new Set<number>();
      let absentDefaultUsers = 0;
      for (const shift of todaysShifts) {
        const shiftAbsences = absencesByShiftId[shift.id] || [];
        const absentUserIds = shiftAbsences.map((a: any) => a.userId);
        absentUserIds.forEach((id: number) => allAbsentUserIds.add(id));
        absentDefaultUsers += absentUserIds.filter((id: number) => defaultUserIds.includes(id)).length;
      }

      // Calculate present default users for today
      const presentDefaultUsers = Math.max(0, totalDefaultUsers - absentDefaultUsers);

      // Calculate today's signups (excluding default users AND absent users)
      const todaysSignups = todaysShifts.reduce((sum, shift) => {
        if (!shift.ShiftSignup) return sum;
        const nonDefaultNonAbsentSignups = shift.ShiftSignup.filter((signup: any) => 
          !defaultUserIds.includes(signup.userId) && !allAbsentUserIds.has(signup.userId)
        );
        return sum + nonDefaultNonAbsentSignups.length;
      }, 0);

      // Total filled = non-default non-absent signups + present default users (matches backend)
      const totalFilledSlots = todaysSignups + presentDefaultUsers;
      const pendingSlots = Math.max(0, totalSlots - totalFilledSlots);

      newCounts[rec.id] = {
        totalFilledSlots,
        presentDefaultUsers,
        pendingSlots
      };
    }

    setShiftCounts(newCounts);
  };

  // NOTE: fetchRecurringShifts is already called in main useEffect, no need for duplicate call
  // Categories are fetched on-demand when Add modal opens (see useEffect for showAdd)

  // NOTE: Recalculation of counts is now done in fetchAllPageData using pre-fetched absences
  // The useEffect below is kept as a fallback for when shifts/recurringShifts change independently
  // (e.g., from other sources or after individual operations)
  
  // Removed: The N+1 useEffect that fetched absences for each shift individually
  // Absences are now fetched in the combined endpoint and passed to calculateShiftCountsWithAbsences

  // Find all recurring shifts for selected category and day
  const matchingSlots = recurringShifts.filter(
    (r) =>
    // String(r.shiftCategoryId) === addData.shiftCategoryId &&
    // String(r.dayOfWeek) === addDayOfWeek
    {
      const daysOfWeek = r.newDaysOfWeek && r.newDaysOfWeek.length > 0 ? r.newDaysOfWeek : [r.dayOfWeek];
      return String(r.shiftCategoryId) === addData.shiftCategoryId &&
        daysOfWeek.includes(Number(addDayOfWeek));
    }
  );

  // When selectedSlotId changes, set start/end, location, and slots from that slot
  useEffect(() => {
    if (selectedSlotId) {
      const slot = matchingSlots.find(s => String(s.id) === selectedSlotId);
      if (slot) {
        setAddData((d: any) => ({
          ...d,
          startTime: slot.startTime.slice(0, 16),
          endTime: slot.endTime.slice(0, 16),
          location: slot.location,
          slots: slot.slots
        }));
      }
    }
  }, [selectedSlotId]);

  // Reset selectedSlotId if category or day changes
  useEffect(() => {
    setSelectedSlotId("");
  }, [addData.shiftCategoryId, addDayOfWeek]);

  // Update available slots when category or recurring shift is selected
  useEffect(() => {
    if (addData.shiftCategoryId && addData.shiftName) {
      const rec = recurringShifts.find(r => r.name === addData.shiftName && String(r.shiftCategoryId) === addData.shiftCategoryId);
      if (rec) {
        // Calculate next occurrence date
        const today = new Date();
        const todayDay = today.getDay();
        const daysOfWeek = rec.newDaysOfWeek && rec.newDaysOfWeek.length > 0 ? rec.newDaysOfWeek : [rec.dayOfWeek];

        // Find the closest upcoming day
        let minDaysDiff = 7;
        for (const day of daysOfWeek) {
          let dayDiff = day - todayDay;
          if (dayDiff < 0) dayDiff += 7;
          if (dayDiff < minDaysDiff) {
            minDaysDiff = dayDiff;
          }
        }
        const dayDiff = minDaysDiff || 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + dayDiff);
        const startWall = getRecurringShiftWallClockHoursMinutes(rec.startTime);
        const endWall = getRecurringShiftWallClockHoursMinutes(rec.endTime);
        const start = new Date(nextDate);
        start.setHours(startWall.hours, startWall.minutes, 0, 0);
        const end = new Date(nextDate);
        end.setHours(endWall.hours, endWall.minutes, 0, 0);

        // Find all existing shifts for this category and recurring shift pattern
        const existingShifts = shifts.filter(shift => {
          const shiftStart = new Date(shift.startTime);
          const shiftEnd = new Date(shift.endTime);
          return (
            String(shift.shiftCategoryId) === String(addData.shiftCategoryId) &&
            shiftStart.getTime() === start.getTime() &&
            shiftEnd.getTime() === end.getTime() &&
            shift.location === rec.location
          );
        });

        // Get all booked user IDs from existing shifts
        const bookedIds = existingShifts.flatMap(shift =>
          (shift.ShiftSignup || []).map((signup: any) => signup.userId)
        );

        // Remove duplicates
        const uniqueBookedIds = [...new Set(bookedIds)];
        setBookedUserIds(uniqueBookedIds);

        // Calculate available slots
        const totalBookedSlots = uniqueBookedIds.length;
        const remainingSlots = Math.max(0, rec.slots - totalBookedSlots);
        setAvailableSlots(remainingSlots);
      }
    }
  }, [addData.shiftCategoryId, addData.shiftName]);

  // Filter out already booked users and limit selection based on available slots
  const availableUsers = users.filter(user => !bookedUserIds.includes(user.id));

  // Edit handlers
  const handleEdit = (shift: any) => {
    setEditId(shift.id);
    setEditData({
      userId: shift.ShiftSignup?.[0]?.userId || null,
      shiftId: shift.id
    });
    setEditError("");
  };

  // Update handleEditSave to use editSignupUserIds
  const handleEditSave = async (signupId: number) => {
    setEditing(true);
    try {
      const token = localStorage.getItem("token");
      const userId = editSignupUserIds[signupId];
      const signupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      if (!signupRes.ok) {
        const errorData = await signupRes.json();
        throw new Error(errorData.error || 'Failed to update shift signup');
      }
      setEditShiftId(null);
      setEditSignupUserIds({});
      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update shift signup');
    } finally {
      setEditing(false);
    }
  };

  // Delete handler
  const handleDelete = async (shift: any) => {
    if (!window.confirm(`Delete shift "${shift.name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem("token");

      // Get the shiftsignup ID from the shift data
      const signupId = shift.ShiftSignup?.[0]?.id;
      if (!signupId) {
        throw new Error('Shift signup not found');
      }

      // Delete from shiftsignup table first
      const signupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!signupRes.ok) {
        const errorData = await signupRes.json();
        throw new Error(errorData.error || 'Failed to delete shift signup');
      }

      // Then delete from shift table
      const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${shift.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!shiftRes.ok) {
        const errorData = await shiftRes.json();
        throw new Error(errorData.error || 'Failed to delete shift');
      }

      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete shift');
    }
  };

  const options = users.map(u => ({
    label: u.name,
    value: u.id
  }));

  // Update the Schedule Shift button click handler
  const handleScheduleShift = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const rec = recurringShifts.find(r => r.name === addData.shiftName && String(r.shiftCategoryId) === addData.shiftCategoryId);
      if (!rec) {
        throw new Error('Recurring shift not found');
      }

      // Calculate next occurrence date
      const today = new Date();
      const todayDay = today.getDay();
      const daysOfWeek = rec.newDaysOfWeek && rec.newDaysOfWeek.length > 0 ? rec.newDaysOfWeek : [rec.dayOfWeek];

      // Find the closest upcoming day
      let minDaysDiff = 7;
      for (const day of daysOfWeek) {
        let dayDiff = day - todayDay;
        if (dayDiff < 0) dayDiff += 7;
        if (dayDiff < minDaysDiff) {
          minDaysDiff = dayDiff;
        }
      }
      const dayDiff = minDaysDiff || 7;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + dayDiff);
      const startWall = getRecurringShiftWallClockHoursMinutes(rec.startTime);
      const endWall = getRecurringShiftWallClockHoursMinutes(rec.endTime);
      const start = new Date(nextDate);
      start.setHours(startWall.hours, startWall.minutes, 0, 0);
      const end = new Date(nextDate);
      end.setHours(endWall.hours, endWall.minutes, 0, 0);

      // Verify no duplicate shifts exist for these users
      const existingShifts = shifts.filter(shift =>
        shift.shiftCategoryId === rec.shiftCategoryId &&
        new Date(shift.startTime).getTime() === start.getTime() &&
        new Date(shift.endTime).getTime() === end.getTime() &&
        shift.location === rec.location
      );

      const existingUserIds = existingShifts.flatMap(shift =>
        (shift.ShiftSignup || []).map((signup: any) => signup.userId)
      );

      // Check for duplicate users
      const duplicateUsers = addData.userIds.filter((userId: number) => existingUserIds.includes(userId));
      if (duplicateUsers.length > 0) {
        const duplicateUserNames = duplicateUsers.map((userId: number) => {
          const user = users.find(u => u.id === userId);
          return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
        });
        throw new Error(`The following users are already booked for this shift: ${duplicateUserNames.join(', ')}`);
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each user individually
      for (const userId of addData.userIds) {
        try {
          // 1. Create the shift for this user
          const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              name: rec.name,
              shiftCategoryId: rec.shiftCategoryId,
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              location: rec.location,
              slots: rec.slots,
              userId: userId
            })
          });

          if (!shiftRes.ok) {
            const errorData = await shiftRes.json();
            throw new Error(errorData.error || 'Failed to create shift');
          }

          const shiftData = await shiftRes.json();

          // 2. Create the shift signup for this user
          const signupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              userId: userId,
              shiftId: shiftData.id,
              checkIn: start.toISOString(),
              checkOut: end.toISOString(),
              mealsServed: 0
            })
          });

          if (!signupRes.ok) {
            const errorData = await signupRes.json();
            throw new Error(errorData.error || 'Failed to create shift signup');
          }

          successCount++;
          const userName = users.find(u => u.id === userId);
          toast.success(`Successfully scheduled shift for ${userName ? `${userName.firstName} ${userName.lastName}` : 'user'}`);
        } catch (err: any) {
          errorCount++;
          const userName = users.find(u => u.id === userId);
          toast.error(`Failed to schedule shift for ${userName ? `${userName.firstName} ${userName.lastName}` : 'user'}: ${err.message}`);
        }
      }

      if (successCount > 0) {
        // Reset form and refresh data
        setAddData({ userIds: [], shiftCategoryId: '', shiftName: '', shiftTiming: '' });
        await fetchShifts();
      }

      if (errorCount > 0) {
        toast.warning(`${errorCount} out of ${addData.userIds.length} shifts failed to schedule`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to schedule shift');
      toast.error(err.message || 'Failed to schedule shift');
    } finally {
      setLoading(false);
    }
  };

  // Save all user assignments for a shift row
  const handleEditSaveAll = async (shift: any) => {
    setEditing(true);
    try {
      const token = localStorage.getItem("token");
      const updates = Object.entries(editSignupUserIds).map(async ([signupId, userId]) => {
        const signup = shift.ShiftSignup.find((s: any) => s.id === Number(signupId));
        if (signup && signup.userId !== userId) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signupId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to update shift signup');
          }
        }
      });
      await Promise.all(updates);
      setEditShiftId(null);
      setEditSignupUserIds({});
      fetchShifts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update shift signups');
    } finally {
      setEditing(false);
    }
  };

  // Cancel editing for a row
  const handleEditCancel = () => {
    setEditShiftId(null);
    setEditSignupUserIds({});
  };

  // For shift name dropdown, get unique names for the selected category
  const uniqueShiftNames = Array.from(new Set(
    recurringShifts
      .filter(r => String(r.shiftCategoryId) === String(addData.shiftCategoryId))
      .map(r => r.name)
  ));
  // For shift timing dropdown, get unique timings for the selected shift name and category
  const uniqueShiftTimings = Array.from(new Set(
    recurringShifts
      .filter(r => r.name === addData.shiftName && String(r.shiftCategoryId) === String(addData.shiftCategoryId))
      .map(opt => {
        const today = new Date();
        const todayDay = today.getDay();
        const daysOfWeek = opt.newDaysOfWeek && opt.newDaysOfWeek.length > 0 ? opt.newDaysOfWeek : [opt.dayOfWeek];

        // Find the closest upcoming day
        let minDaysDiff = 7;
        for (const day of daysOfWeek) {
          let dayDiff = day - todayDay;
          if (dayDiff < 0) dayDiff += 7;
          if (dayDiff < minDaysDiff) {
            minDaysDiff = dayDiff;
          }
        }
        const dayDiff = minDaysDiff || 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + dayDiff);
        const startWall = getRecurringShiftWallClockHoursMinutes(opt.startTime);
        const endWall = getRecurringShiftWallClockHoursMinutes(opt.endTime);
        const start = new Date(nextDate);
        start.setHours(startWall.hours, startWall.minutes, 0, 0);
        const end = new Date(nextDate);
        end.setHours(endWall.hours, endWall.minutes, 0, 0);
        return `${start.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Halifax' })} - ${end.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Halifax' })}`;
      })
  ));

  // Helper for date filtering
  const isSameDay = (d1: Date, d2: Date) => {
    // Convert both dates to the same timezone (local) and compare
    const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return date1.getTime() === date2.getTime();
  };
  const isSameWeek = (d1: Date, d2: Date) => {
    const startOfWeek = (date: Date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const endOfWeek = (date: Date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay() + 6);
      d.setHours(23, 59, 59, 999);
      return d;
    };
    return d1 >= startOfWeek(d2) && d1 <= endOfWeek(d2);
  };

  // Helper to get next occurrence date for a recurring shift
  const getNextOccurrence = (rec: any) => {
    if (!rec.isRecurring) {
      // For one-time shifts, return the actual start time
      return new Date(rec.startTime);
    }

    // For recurring shifts, calculate the next occurrence
    const today = new Date();
    const todayDay = today.getDay();
    const daysOfWeek = rec.newDaysOfWeek && rec.newDaysOfWeek.length > 0 ? rec.newDaysOfWeek : [rec.dayOfWeek];

    // Find the closest upcoming day (including today)
    let closestDay = null;
    let minDaysDiff = 7;

    for (const day of daysOfWeek) {
      let dayDiff = day - todayDay;
      if (dayDiff < 0) dayDiff += 7; // Wrap to next week
      if (dayDiff < minDaysDiff) {
        minDaysDiff = dayDiff;
        closestDay = day;
      }
    }

    // If no valid day found, use the first day
    if (closestDay === null) {
      closestDay = daysOfWeek[0] || 0;
      minDaysDiff = (closestDay - todayDay + 7) % 7;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + minDaysDiff);
    
    // Check for day config for the closest day (use wall-clock time so DST never changes shift time)
    const dayConfig = rec.RecurringShiftDayConfig?.find((conf: any) => conf.dayOfWeek === closestDay);
    const startWall = (dayConfig?.startTime ? getRecurringShiftWallClockHoursMinutes(dayConfig.startTime) : getRecurringShiftWallClockHoursMinutes(rec.startTime));
    nextDate.setHours(startWall.hours, startWall.minutes, 0, 0);

    console.log('🔍 SCHEDULE-SHIFTS DATE DEBUGGING:', {
      '=== INPUT ===': {
        rec: rec,
        // recDayOfWeek: rec.dayOfWeek,
        recDayOfWeek: rec.newDaysOfWeek && rec.newDaysOfWeek.length > 0 ? rec.newDaysOfWeek : [rec.dayOfWeek],
        recStartTime: rec.startTime
      },
      '=== CALCULATION ===': {
        today: today,
        todayDay: todayDay,
        minDaysDiff: minDaysDiff
      },
      '=== RESULT ===': {
        nextDate: nextDate,
        nextDateString: nextDate.toDateString(),
        nextDateISO: nextDate.toISOString(),
        nextDateLocal: nextDate.toLocaleDateString(),
        nextDateComponents: {
          year: nextDate.getFullYear(),
          month: nextDate.getMonth() + 1,
          day: nextDate.getDate()
        }
      }
    });

    return nextDate;
  };

  // Filtered shifts for cards
  const now = new Date();
  const todayDay = now.getDay();
  let filteredShifts = shifts.filter((shift: any) => {
    const endTime = new Date(shift.endTime);
    return endTime >= now;
  });
  if (selectedCardCategory) {
    filteredShifts = filteredShifts.filter((shift: any) => String(shift.shiftCategoryId) === selectedCardCategory);
  }
  if (dateFilter === 'today') {
    filteredShifts = filteredShifts.filter((shift: any) => isSameDay(new Date(shift.startTime), now));
  } else if (dateFilter === 'week') {
    filteredShifts = filteredShifts.filter((shift: any) => isSameWeek(new Date(shift.startTime), now));
  } else if (dateFilter === 'custom' && customDate) {
    const custom = new Date(customDate);
    filteredShifts = filteredShifts.filter((shift: any) => isSameDay(new Date(shift.startTime), custom));
  }

  // Expand recurring shifts into individual occurrences for proper filtering
  const expandRecurringShifts = (recurringShifts: any[]) => {
    const expandedShifts: any[] = [];

    for (const rec of recurringShifts) {
      if (rec.isRecurring) {
        const daysOfWeek = rec.newDaysOfWeek && rec.newDaysOfWeek.length > 0 ? rec.newDaysOfWeek : [rec.dayOfWeek];

        // Create separate occurrence for each day of the week
        for (const dayOfWeek of daysOfWeek) {
          expandedShifts.push({
            ...rec,
            _occurrenceDay: dayOfWeek, // Track which day this occurrence is for
            _isExpanded: true // Mark as expanded occurrence
          });
        }
      } else {
        // One-time shifts don't need expansion
        expandedShifts.push(rec);
      }
    }

    return expandedShifts;
  };

  // Filter recurringShifts for the cards
  const filteredRecurring = expandRecurringShifts(recurringShifts).filter((rec: any) => {
    // Exclude Meals Counting and Collection categories
    const categoryName = rec.ShiftCategory?.name || categoryOptions.find(cat => cat.id === rec.shiftCategoryId)?.name;
    if (categoryName && (categoryName === 'Meals Counting' || categoryName === 'Collection')) return false;

    // Category filter
    if (selectedCardCategory && String(rec.shiftCategoryId) !== String(selectedCardCategory)) return false;

    // Shift type filter
    if (shiftTypeFilter === 'recurring' && !rec.isRecurring) return false;
    if (shiftTypeFilter === 'one-time' && rec.isRecurring) return false;

    // Shift name filter - show all shifts with the same name regardless of timing
    if (selectedShiftName && rec.name !== selectedShiftName) return false;

    // Date filter - handle both recurring and one-time shifts
    if (dateFilter === 'today') {
      if (rec.isRecurring) {
        // // For recurring shifts, check day of week
        // if (rec.dayOfWeek !== todayDay) return false;

        // For expanded recurring shifts, check the specific occurrence day
        const occurrenceDay = rec._isExpanded ? rec._occurrenceDay : rec.dayOfWeek;
        if (occurrenceDay !== todayDay) return false;
      } else {
        // For one-time shifts, check if the shift is today
        const shiftDate = new Date(rec.startTime);
        if (!isSameDay(shiftDate, new Date())) return false;
      }
    } else if (dateFilter === 'week') {
      if (rec.isRecurring) {
        // For expanded recurring shifts, all occurrences are valid for the current week
        // (since we're only showing current week, any day 0-6 will be in the week)
        return true;
      } else {
        // For one-time shifts, check if the shift is in this week
        const shiftDate = new Date(rec.startTime);
        if (!isSameWeek(shiftDate, new Date())) return false;
      }
    } else if (dateFilter === 'custom' && customDate) {
      if (rec.isRecurring) {
        // For expanded recurring shifts, check if the occurrence day matches custom date
        const customDay = new Date(customDate + 'T00:00:00').getDay();
        const occurrenceDay = rec._isExpanded ? rec._occurrenceDay : rec.dayOfWeek;
        if (occurrenceDay !== customDay) return false;
      } else {
        // For one-time shifts, check if the shift is on the custom date
        const shiftDate = new Date(rec.startTime);
        const custom = new Date(customDate + 'T00:00:00');
        if (!isSameDay(shiftDate, custom)) return false;
      }
    } else if (selectedDay && selectedDay !== 'all') {
      // Day filter (if not using dateFilter)
      // if (rec.isRecurring && rec.dayOfWeek !== Number(selectedDay)) return false;
      if (rec.isRecurring) {
        const occurrenceDay = rec._isExpanded ? rec._occurrenceDay : rec.dayOfWeek;
        if (occurrenceDay !== Number(selectedDay)) return false;
      }
    }
    return true;
  });

  // Get unique shift names for the dropdown - only filter by category, not timing, and remove case-insensitive duplicates
  const shiftNameOptions = Array.from(
    recurringShifts
      .filter(rec => {
        // Exclude Meals Counting and Collection categories
        const categoryName = rec.ShiftCategory?.name || categoryOptions.find(cat => cat.id === rec.shiftCategoryId)?.name;
        if (categoryName && (categoryName === 'Meals Counting' || categoryName === 'Collection')) return false;

        return !selectedCardCategory || String(rec.shiftCategoryId) === String(selectedCardCategory);
      })
      .reduce((map, rec) => {
        const normalized = rec.name.trim().toLowerCase();
        if (!map.has(normalized)) {
          map.set(normalized, rec.name.trim());
        }
        return map;
      }, new Map<string, string>())
      .values()
  ) as string[];
  shiftNameOptions.sort();

  // Find the selected recurring shift for slot limiting
  const selectedRecurring = filteredRecurring.find((rec: any) => rec.id === selectedRecurringId);
  const maxSlots = selectedRecurring ? selectedRecurring.slots ?? 0 : 0;

  // Add function to fetch scheduled employees for a shift
  type FetchScheduledEmployeesType = (shiftId: number) => Promise<void>;

  const fetchScheduledEmployees: FetchScheduledEmployeesType = async (shiftId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups?shiftId=${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch scheduled employees");
      const data = await res.json();
      setScheduledEmployees(prev => ({
        ...prev,
        [shiftId]: data
      }));
    } catch (err) {
      console.error('Error fetching scheduled employees:', err);
      toast.error("Failed to load scheduled employees");
    }
  };

  // Add function to handle employee selection
  const handleEmployeeSelection = async (shift: any) => {
    try {
      // Fetch existing scheduled employees for this shift
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups?shiftId=${shift.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch scheduled employees");
      const existingSignups = await res.json();
      // Set the existing employees as selected
      const existingEmployees = existingSignups.map((signup: any) => ({
        label: signup.User?.name || 'Unknown',
        value: signup.userId
      }));
      setSelectedEmployees(existingEmployees);
      setSelectedShiftForPopup(shift);
      setShowEmployeePopup(true);
    } catch (err) {
      console.error('Error fetching scheduled employees:', err);
      toast.error("Failed to load scheduled employees");
    }
  };

  // Add function to save employee selections
  const handleSaveEmployeeSelection = async () => {
    if (!selectedShiftForPopup) return;
    try {
      setScheduling(true);
      const token = localStorage.getItem("token");
      // Get existing signups
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups?shiftId=${selectedShiftForPopup.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch existing signups");
      const existingSignups = await res.json();
      // Find employees to add and remove
      const existingUserIds = existingSignups.map((signup: any) => signup.userId);
      const selectedUserIds = selectedEmployees.map(emp => emp.value);
      const toAdd = selectedUserIds.filter((id: number) => !existingUserIds.includes(id));
      const toRemove = existingUserIds.filter((id: number) => !selectedUserIds.includes(id));
      // Remove deselected employees
      for (const userId of toRemove) {
        const signup = existingSignups.find((s: any) => s.userId === userId);
        if (signup) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signup.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      // Add newly selected employees: for each, create shift then shiftsignup
      for (const userId of toAdd) {
        const start = new Date(selectedShiftForPopup.startTime);
        const end = new Date(selectedShiftForPopup.endTime);
        // 1. Create shift
        const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: selectedShiftForPopup.name,
            shiftCategoryId: selectedShiftForPopup.shiftCategoryId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            location: selectedShiftForPopup.location,
            slots: selectedShiftForPopup.slots,
            userId: userId
          })
        });
        if (!shiftRes.ok) throw new Error('Failed to create shift');
        const newShift = await shiftRes.json();
        // 2. Create shiftsignup for the new shift
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: userId,
            shiftId: newShift.id,
            checkIn: start.toISOString(),
            checkOut: end.toISOString(),
            mealsServed: 0
          })
        });
      }
      // Refresh the scheduled employees list
      await fetchScheduledEmployees(selectedShiftForPopup.id);
      toast.success("Successfully updated shift employees");
      setShowEmployeePopup(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update shift employees");
    } finally {
      setScheduling(false);
    }
  };

  // Modify the shift card rendering to include scheduled employees and the new button
  const renderShiftCard = (rec: any) => {
    // Calculate the occurrence date based on the current filter
    let nextDate: Date;

    if (dateFilter === 'custom' && customDate) {
      // For custom date, calculate the occurrence for that specific date
      if (rec.isRecurring) {
        // For recurring shifts, check if the custom date matches the day of week
        const customDay = new Date(customDate + 'T00:00:00').getDay();
        // if (rec.dayOfWeek === customDay) {
        const daysOfWeek = rec.newDaysOfWeek && rec.newDaysOfWeek.length > 0 ? rec.newDaysOfWeek : [rec.dayOfWeek];
        if (daysOfWeek.includes(customDay)) {
          // Create the date for the custom date
          nextDate = new Date(customDate + 'T00:00:00');
          
          // Check for day config for this day (use wall-clock time so DST never changes shift time)
          const dayConfig = rec.RecurringShiftDayConfig?.find((conf: any) => conf.dayOfWeek === customDay);
          const startWall = (dayConfig?.startTime ? getRecurringShiftWallClockHoursMinutes(dayConfig.startTime) : getRecurringShiftWallClockHoursMinutes(rec.startTime));
          nextDate.setHours(startWall.hours, startWall.minutes, 0, 0);
        } else {
          // This recurring shift doesn't occur on the custom date, so skip it
          return null;
        }
      } else {
        // For one-time shifts, check if the shift is on the custom date
        const shiftDate = new Date(rec.startTime);
        const custom = new Date(customDate + 'T00:00:00');
        if (isSameDay(shiftDate, custom)) {
          nextDate = shiftDate;
        } else {
          // This one-time shift is not on the custom date, so skip it
          return null;
        }
      }
    } else {
      // For expanded occurrences, calculate the specific occurrence date
      if (rec._isExpanded && rec.isRecurring) {
        const today = new Date();
        const todayDay = today.getDay();
        const occurrenceDay = rec._occurrenceDay;

        // Calculate days difference to the occurrence day
        let dayDiff = occurrenceDay - todayDay;
        if (dayDiff < 0) dayDiff += 7; // Wrap to next week if needed

        nextDate = new Date(today);
        nextDate.setDate(today.getDate() + dayDiff);

        // Check for day config for this occurrence day (use wall-clock time so DST never changes shift time)
        const dayConfig = rec.RecurringShiftDayConfig?.find((conf: any) => conf.dayOfWeek === occurrenceDay);
        const startWall = (dayConfig?.startTime ? getRecurringShiftWallClockHoursMinutes(dayConfig.startTime) : getRecurringShiftWallClockHoursMinutes(rec.startTime));
        nextDate.setHours(startWall.hours, startWall.minutes, 0, 0);
      } else {
        // Use the existing getNextOccurrence logic for non-expanded shifts
        nextDate = getNextOccurrence(rec);
      }
    }

    // Match by shiftCategoryId, location, isSameDay, AND recurringShiftId
    // CRITICAL: Must match recurringShiftId to prevent slots and default users from being shared across different recurring shifts
    const matchingShifts = shifts.filter(shift => {
      const shiftStart = new Date(shift.startTime);
      const categoryMatch = String(shift.shiftCategoryId) === String(rec.shiftCategoryId);
      const locationMatch = shift.location === rec.location;
      const dateMatch = isSameDay(shiftStart, nextDate);
      
      // CRITICAL FIX: Match by recurringShiftId to ensure correct shift is matched
      // This prevents slots and default users from being shared across different recurring shifts
      const recurringMatch = shift.recurringShiftId 
        ? shift.recurringShiftId === rec.id 
        : true; // If shift doesn't have recurringShiftId, allow match (for one-time shifts or legacy data)
      
      return categoryMatch && locationMatch && dateMatch && recurringMatch;
    });
    
    // CRITICAL: Validate that matched shift belongs to this recurring shift
    // This prevents using wrong shift if matching somehow fails or data is inconsistent
    let shiftForModal = matchingShifts.find(shift => 
      shift.recurringShiftId === rec.id
    ) || matchingShifts[0];
    
    // Additional safety check: if shift exists but recurringShiftId doesn't match, don't use it
    // This handles edge cases where shifts might not have recurringShiftId set correctly
    if (shiftForModal && shiftForModal.recurringShiftId && shiftForModal.recurringShiftId !== rec.id) {
      console.warn(`[Shift Matching] Shift ${shiftForModal.id} has recurringShiftId ${shiftForModal.recurringShiftId} but expected ${rec.id}. Ignoring this shift.`);
      shiftForModal = null; // Don't use wrong shift
    }

    // CHECK FOR DAY SPECIFIC CONFIGURATION
    // Priority: Use day config if it exists, otherwise use global config
    const dayOfWeek = nextDate.getDay();
    const dayConfig = rec.RecurringShiftDayConfig?.find((conf: any) => conf.dayOfWeek === dayOfWeek);
    
    let currentStartTime: Date;
    let currentEndTime: Date;
    let currentSlots: number;
    let isDayActive: boolean;

    if (dayConfig) {
      // Use day config values (ONLY day config, not global)
      isDayActive = dayConfig.isActive !== false; // Default to true if not explicitly false
      
      // Use day config times if provided (wall-clock so DST never changes), otherwise use global
      const startWall = (dayConfig.startTime && dayConfig.endTime)
        ? { start: getRecurringShiftWallClockHoursMinutes(dayConfig.startTime), end: getRecurringShiftWallClockHoursMinutes(dayConfig.endTime) }
        : { start: getRecurringShiftWallClockHoursMinutes(rec.startTime), end: getRecurringShiftWallClockHoursMinutes(rec.endTime) };
      currentStartTime = new Date(nextDate);
      currentStartTime.setHours(startWall.start.hours, startWall.start.minutes, 0, 0);
      currentEndTime = new Date(nextDate);
      currentEndTime.setHours(startWall.end.hours, startWall.end.minutes, 0, 0);
      nextDate.setHours(startWall.start.hours, startWall.start.minutes, 0, 0);

      // Use day config slots if provided, otherwise use global
      if (dayConfig.slots !== null && dayConfig.slots !== undefined) {
        currentSlots = dayConfig.slots;
      } else {
        currentSlots = rec.slots || 0;
      }
    } else {
      // No day config - use global config (wall-clock so DST never changes shift time)
      isDayActive = true;
      const startWall = getRecurringShiftWallClockHoursMinutes(rec.startTime);
      const endWall = getRecurringShiftWallClockHoursMinutes(rec.endTime);
      currentStartTime = new Date(nextDate);
      currentStartTime.setHours(startWall.hours, startWall.minutes, 0, 0);
      currentEndTime = new Date(nextDate);
      currentEndTime.setHours(endWall.hours, endWall.minutes, 0, 0);
      currentSlots = rec.slots || 0;
      nextDate.setHours(startWall.hours, startWall.minutes, 0, 0);
    }

    // If day is not active, do not render this shift
    if (!isDayActive) {
      return null;
    }

    // Helper to create a shift for this occurrence if it doesn't exist
    const handleManageEmployeesClick = async () => {
      // CRITICAL: Double-check that shiftForModal belongs to this recurring shift
      // This prevents wrong shift from being passed to manage modal
      let shiftToUse = shiftForModal;
      if (shiftToUse && shiftToUse.recurringShiftId && shiftToUse.recurringShiftId !== rec.id) {
        console.error(`[BUG DETECTED] Shift ${shiftToUse.id} has recurringShiftId ${shiftToUse.recurringShiftId} but expected ${rec.id}. Creating new shift instead.`);
        shiftToUse = null; // Don't use wrong shift, create new one instead
      }
      
      if (!shiftToUse) {
        // Create the shift for this occurrence using the proper endpoint
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/from-recurring/${rec.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              date: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}` // Send date in YYYY-MM-DD format (local timezone)
            })
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to create shift');
          }
          const result = await res.json();
          shiftToUse = result.shift; // The endpoint returns { shift, assignedUsers, absentUsers }

          // Refresh shifts list to get the newly created shift with correct slots
          // This ensures the shift card will show the same slots as the manage employees modal
          await fetchShifts();

          // Show success message with assignment details
          if (result.assignedUsers && result.assignedUsers.length > 0) {
            toast.success(`Shift created! ${result.assignedUsers.length} default user(s) auto-assigned.`);
          } else {
            toast.success('Shift created successfully!');
          }
        } catch (err: any) {
          toast.error(`Failed to create shift for this occurrence: ${err.message || 'Unknown error'}`);
          return;
        }
      }
      openManageModal(shiftToUse);
    };

    // Priority: Use actual shift's slots if shift exists, otherwise use day config or global slots
    // This ensures consistency with manage employees modal which uses shift.slots from DB
    const totalSlots = shiftForModal ? (shiftForModal.slots) : currentSlots;

    let totalFilledSlots, presentDefaultUsers, pendingSlots;

    // If shift exists, use EXACT same calculation as backend API (/api/shift-employees)
    if (shiftForModal) {
      // Get absences from cache
      const absentUserIds = new Set(shiftForModal.id && shiftAbsencesCache[shiftForModal.id] 
        ? shiftAbsencesCache[shiftForModal.id] 
        : []);
      
      // Get signed up user IDs
      const signedUpUserIds = new Set(shiftForModal.ShiftSignup ? shiftForModal.ShiftSignup.map((su: any) => su.userId) : []);
      
      // Count signups EXCLUDING absent users (this is what backend does)
      const nonAbsentSignups = shiftForModal.ShiftSignup 
        ? shiftForModal.ShiftSignup.filter((su: any) => !absentUserIds.has(su.userId)).length 
        : 0;
      
      // Get default users for this day (exclude test user to match backend)
      const shiftDate = new Date(shiftForModal.startTime);
      const shiftDayOfWeek = shiftDate.getDay();
      const daySpecificUsers = rec.DefaultShiftUser ? rec.DefaultShiftUser.filter(
        (du: any) => du.dayOfWeek !== null && du.dayOfWeek === shiftDayOfWeek && du.User?.email !== 'test@gmail.com'
      ) : [];
      const defaultUsersForShift = daySpecificUsers.length > 0 
        ? daySpecificUsers
        : (rec.DefaultShiftUser ? rec.DefaultShiftUser.filter((du: any) => du.dayOfWeek === null && du.User?.email !== 'test@gmail.com') : []);
      
      // Present default users = NOT absent AND NOT already signed up
      const presentDefaultUsersCount = defaultUsersForShift.filter((du: any) =>
        !absentUserIds.has(du.userId) && !signedUpUserIds.has(du.userId)
      ).length;
      
      // Total filled = non-absent signups + present default users (not signed up)
      totalFilledSlots = nonAbsentSignups + presentDefaultUsersCount;
      presentDefaultUsers = presentDefaultUsersCount;
      
      pendingSlots = Math.max(0, totalSlots - totalFilledSlots);
    } else {
      // Shift doesn't exist yet - use recurring shift config
      // IMPORTANT: Only use shiftCounts for TODAY's shifts, because it's calculated only for today
      // For other days (custom date, expanded occurrences), we need to calculate on the fly
      const isToday = isSameDay(nextDate, new Date());
      const correctCounts = isToday ? shiftCounts[rec.id] : null;

      if (correctCounts && isToday) {
        // Use the correct counts that consider absences (only for today)
        // But ensure we're using the correct slot count (day config or global)
        totalFilledSlots = correctCounts.totalFilledSlots;
        presentDefaultUsers = correctCounts.presentDefaultUsers;
        // Recalculate pending slots with correct totalSlots (day config or global)
        pendingSlots = Math.max(0, totalSlots - totalFilledSlots);
      } else {
        // Shift doesn't exist yet (future/virtual shift) - calculate based on recurring shift config
        // Priority: Use day-specific default users if they exist, otherwise use global default users. Exclude test user.
        // IMPORTANT: dayOfWeek NULL = global default user (used when no day-specific users exist for that day)
        const daySpecificUsers = rec.DefaultShiftUser ? rec.DefaultShiftUser.filter(
          (du: any) => du.dayOfWeek !== null && du.dayOfWeek === dayOfWeek && du.User?.email !== 'test@gmail.com'
        ) : [];
        const defaultUsersForDay = daySpecificUsers.length > 0 
          ? daySpecificUsers
          : (rec.DefaultShiftUser ? rec.DefaultShiftUser.filter((du: any) => du.dayOfWeek === null && du.User?.email !== 'test@gmail.com') : []);
        const defaultUserIds = defaultUsersForDay.map((du: any) => du.userId);
        
        // For existing shifts: total filled = (all non-absent signups) + (default users NOT signed up, NOT absent)
        // For virtual shifts: total filled = default users (they will be auto-assigned)
        if (matchingShifts.length > 0) {
          const shiftId = matchingShifts[0].id;
          const absentUserIds = new Set(shiftAbsencesCache[shiftId] || []);
          const signedUpUserIds = new Set(
            matchingShifts.flatMap((s: any) => (s.ShiftSignup || []).map((su: any) => su.userId))
          );
          
          // Non-absent signups count (all signups excluding absent)
          const nonAbsentSignups = matchingShifts.reduce((sum, shift) => {
            if (!shift.ShiftSignup) return sum;
            return sum + shift.ShiftSignup.filter((su: any) => !absentUserIds.has(su.userId)).length;
          }, 0);
          
          // Default users who are NOT signed up and NOT absent (they fill a slot by default)
          presentDefaultUsers = defaultUsersForDay.filter((du: any) =>
            !absentUserIds.has(du.userId) && !signedUpUserIds.has(du.userId)
          ).length;
          
          totalFilledSlots = nonAbsentSignups + presentDefaultUsers;
        } else {
          // Shift doesn't exist yet (virtual shift) - count ALL default users (they will be auto-assigned)
          // No absences for future shifts (shift doesn't exist yet)
          presentDefaultUsers = defaultUsersForDay.length;
          
          // No signups yet (shift doesn't exist)
          const bookedSlots = 0;
          
          // Total filled slots = default users (they will fill slots when shift is created)
          totalFilledSlots = presentDefaultUsers;
        }
        
        pendingSlots = Math.max(0, totalSlots - totalFilledSlots);
      }
    }

    // Create unique key for multiple occurrences of the same shift
    const uniqueKey = rec._isExpanded ? `${rec.id}-${rec._occurrenceDay}` : rec.id;

    return (
      <div key={uniqueKey} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: '20px 24px', marginBottom: 12, border: '1px solid #f0f0f0', position: 'relative', transition: 'box-shadow 0.2s' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span role="img" aria-label="meal">🍲</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 2, fontFamily: 'Poppins,Inter,sans-serif', color: '#222' }}>{rec.name || 'Supper Shift'}</div>
              <div style={{ color: '#666', fontWeight: 500, fontSize: 12, marginBottom: 4 }}>
                📋 {rec.ShiftCategory?.name || categoryOptions.find(cat => cat.id === rec.shiftCategoryId)?.name || 'Unknown Category'}
              </div>
              <div style={{ color: '#ff9800', fontWeight: 600, fontSize: 13, background: '#fff3e0', padding: '2px 8px', borderRadius: 8, display: 'inline-block' }}>
                📅 {nextDate.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Halifax' })}
              </div>
            </div>
          </div>

          {/* Capacity Badge */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: pendingSlots > 0 ? '#e8f5e8' : '#ffe8e8', color: pendingSlots > 0 ? '#2e7d32' : '#d32f2f', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
              {pendingSlots > 0 ? `${pendingSlots} spots available` : 'Fully booked'}
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>
              {totalFilledSlots}/{totalSlots} filled
              {presentDefaultUsers > 0 && (
                <span style={{ color: '#ff9800', marginLeft: 4 }}>
                  ({presentDefaultUsers} default)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14, padding: '12px 16px', background: '#f9f9f9', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#ff9800', fontSize: 16 }}>🕒</span>
            <div>
              <div style={{ color: '#333', fontWeight: 600, fontSize: 14 }}>
                {currentStartTime.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Halifax' })} - {currentEndTime.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Halifax' })}
              </div>
              <div style={{ color: '#666', fontSize: 11 }}>Shift Time</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#ff9800', fontSize: 16 }}>📍</span>
            <div>
              <div style={{ color: '#333', fontWeight: 600, fontSize: 14 }}>{rec.location}</div>
              <div style={{ color: '#666', fontSize: 11 }}>Location</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleManageEmployeesClick}
            style={{
              background: 'linear-gradient(90deg, #ff9800 60%, #ffa726 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              boxShadow: '0 1px 4px rgba(255,152,0,0.15)',
              letterSpacing: 0.2,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(255,152,0,0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(255,152,0,0.15)';
            }}
          >
            👥 Manage
          </button>
          <button
            onClick={async () => {
              const categoryName = rec.ShiftCategory?.name || categoryOptions.find(cat => cat.id === rec.shiftCategoryId)?.name || 'Unknown';
              // Use the nextDate directly for consistent date calculation
              const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
              const signupUrl = `${window.location.origin}/shift-signup/${encodeURIComponent(categoryName)}/${encodeURIComponent(rec.name)}?date=${dateStr}`;

              try {
                const token = localStorage.getItem("token");

                // Check if shift already exists by querying the backend directly
                const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                if (checkRes.ok) {
                  const allShifts = await checkRes.json();
                  const existingShift = allShifts.find((shift: any) => {
                    const shiftStart = new Date(shift.startTime);
                    return (
                      String(shift.shiftCategoryId) === String(rec.shiftCategoryId) &&
                      shift.location === rec.location &&
                      isSameDay(shiftStart, nextDate)
                    );
                  });

                  if (existingShift) {
                    const copySuccess = await copyToClipboard(signupUrl);
                    if (copySuccess) {
                      toast.success('Signup link copied to clipboard!');
                    } else {
                      // Show URL display for manual copying
                      setLastCopiedUrl(signupUrl);
                      setShowUrlDisplay(true);
                      toast.error('Failed to copy link. URL displayed below for manual copying.');
                    }
                    return;
                  }
                }

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/from-recurring/${rec.id}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({
                    date: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
                  })
                });

                if (res.ok) {
                  // Refresh shifts list to include the newly created shift
                  await fetchShifts();
                  toast.success('Shift created and signup link copied to clipboard!');
                } else {
                  throw new Error('Failed to create shift');
                }

                // Copy to clipboard
                const copySuccess = await copyToClipboard(signupUrl);
                if (!copySuccess) {
                  // Show URL display for manual copying
                  setLastCopiedUrl(signupUrl);
                  setShowUrlDisplay(true);
                  toast.error('Failed to copy link. URL displayed below for manual copying.');
                }
              } catch (err) {
                console.error('Error in copy link:', err);
                toast.error('Failed to create shift for this date');
              }
            }}
            style={{
              background: 'linear-gradient(90deg, #4caf50 60%, #66bb6a 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              boxShadow: '0 1px 4px rgba(76,175,80,0.15)',
              letterSpacing: 0.2,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(76,175,80,0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(76,175,80,0.15)';
            }}
          >
            📋 Copy Link
          </button>
        </div>
      </div>
    );
  };

  // Initialize filtered users when users change
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  const renderEmployeePopup = () => {
    if (!showEmployeePopup || !selectedShiftForPopup) return null;

    const existingCount = selectedEmployees.length;
    const remainingSlots = selectedShiftForPopup.slots - existingCount;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '60%',
          minWidth: 600,
          maxWidth: 1000,
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid #eee'
          }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#333',
              margin: 0
            }}>
              Manage Employees for {selectedShiftForPopup.name}
            </h2>
            <button
              onClick={() => setShowEmployeePopup(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                color: '#666',
                cursor: 'pointer',
                padding: 4
              }}
            >
              ×
            </button>
          </div>

          <div style={{
            background: '#f8f8f8',
            padding: 20,
            borderRadius: 12,
            marginBottom: 24
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <div>
                <p style={{
                  color: '#666',
                  fontSize: 16,
                  margin: '0 0 8px 0'
                }}>
                  {existingCount} employees currently scheduled
                </p>
                <p style={{
                  color: '#666',
                  fontSize: 16,
                  margin: 0
                }}>
                  {remainingSlots} slots remaining
                </p>
              </div>
              <span style={{
                background: '#ff9800',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600
              }}>
                {selectedEmployees.length}/{selectedShiftForPopup.slots} Selected
              </span>
            </div>

            {/* Search input */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search employees..."
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  const filtered = users.filter(user =>
                    user.name.toLowerCase().includes(searchTerm)
                  );
                  setFilteredUsers(filtered);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  fontSize: 16,
                  outline: 'none'
                }}
              />
            </div>

            {/* Employee list */}
            <div style={{
              background: '#fff',
              borderRadius: 8,
              border: '1px solid #eee',
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {filteredUsers.map((user) => {
                const isSelected = selectedEmployees.some(emp => emp.value === user.id);
                const wasScheduled = existingCount > 0 && isSelected;
                return (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      background: isSelected ? '#fff8f3' : '#fff',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedEmployees(prev => prev.filter(emp => emp.value !== user.id));
                      } else {
                        if (selectedEmployees.length < selectedShiftForPopup.slots) {
                          setSelectedEmployees(prev => [...prev, { label: user.name, value: user.id }]);
                        } else {
                          toast.error(`Cannot select more than ${selectedShiftForPopup.slots} employees`);
                        }
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      style={{ marginRight: 12, width: 20, height: 20 }}
                    />
                    <span style={{
                      fontSize: 16,
                      color: '#333',
                      fontWeight: isSelected ? 600 : 400
                    }}>
                      {user.name}
                    </span>
                    {wasScheduled && (
                      <span style={{
                        position: 'absolute',
                        right: 16,
                        fontSize: 12,
                        color: '#ff9800',
                        background: '#fff8f3',
                        padding: '2px 8px',
                        borderRadius: 12,
                        border: '1px solid #ff9800'
                      }}>
                        Currently Scheduled
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 16,
            marginTop: 24,
            paddingTop: 24,
            borderTop: '1px solid #eee'
          }}>
            <button
              onClick={() => setShowEmployeePopup(false)}
              style={{
                padding: '12px 24px',
                background: '#f5f5f5',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                color: '#666',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEmployeeSelection}
              disabled={scheduling}
              style={{
                padding: '12px 32px',
                background: scheduling ? '#ccc' : '#ff9800',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: scheduling ? 'not-allowed' : 'pointer',
                fontSize: 16,
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: scheduling ? 'none' : '0 2px 8px rgba(255, 152, 0, 0.3)'
              }}
            >
              {scheduling ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add useEffect to fetch scheduled employees when a shift is selected
  useEffect(() => {
    if (selectedRecurringId) {
      fetchScheduledEmployees(selectedRecurringId);
    }
  }, [selectedRecurringId]);

  const handleOpenUserDropdown = async (rec: any) => {
    const nextDate = getNextOccurrence(rec);
    const shiftsForDay = shifts.filter(shift => isSameDay(new Date(shift.startTime), nextDate));
    const matchingShifts = shiftsForDay.filter(shift => {
      return (
        String(shift.shiftCategoryId) === String(rec.shiftCategoryId) &&
        shift.location === rec.location
      );
    });
    const alreadyScheduledUserIds = Array.from(new Set(
      matchingShifts.flatMap(shift => (shift.ShiftSignup || []).map((signup: any) => signup.userId))
    ));
    setDropdownSelectedUserIds(alreadyScheduledUserIds);
    setOpenUserDropdownShiftId(rec.id);
  };

  const handleCloseUserDropdown = () => {
    setOpenUserDropdownShiftId(null);
    setDropdownSelectedEmployees([]);
  };

  const handleSaveUserDropdown = async (shift: any, selectedUserIds: number[]) => {
    setDropdownLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Get existing signups
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups?shiftId=${shift.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch existing signups");
      const existingSignups = await res.json();
      const existingUserIds = existingSignups.map((signup: any) => Number(signup.userId));
      const toAdd = selectedUserIds.filter((id: number) => !existingUserIds.includes(id));
      const toRemove = existingUserIds.filter((id: number) => !selectedUserIds.includes(id));
      // Remove deselected employees
      for (const userId of toRemove) {
        const signup = existingSignups.find((s: any) => Number(s.userId) === userId);
        if (signup) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signup.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      // Add newly selected employees: for each, create shift then shiftsignup
      for (const userId of toAdd) {
        const start = new Date(shift.startTime);
        const end = new Date(shift.endTime);
        // 1. Create shift
        const shiftRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: shift.name,
            shiftCategoryId: shift.shiftCategoryId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            location: shift.location,
            slots: shift.slots,
            userId: userId
          })
        });
        if (!shiftRes.ok) throw new Error('Failed to create shift');
        const newShift = await shiftRes.json();
        // 2. Create shiftsignup for the new shift
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: userId,
            shiftId: newShift.id,
            checkIn: start.toISOString(),
            checkOut: end.toISOString(),
            mealsServed: 0
          })
        });
      }
      await fetchScheduledEmployees(shift.id); // Always refresh after save
      await fetchAllPageData(); // Refresh all data including absences
      toast.success("Successfully updated shift employees");
      handleCloseUserDropdown();
    } catch (err: any) {
      toast.error(err.message || "Failed to update shift employees");
    } finally {
      setDropdownLoading(false);
    }
  };

  const renderUserDropdown = (rec: any) => {
    if (openUserDropdownShiftId !== rec.id) return null;
    // Use dropdownSelectedUserIds and setDropdownSelectedUserIds from main state
    const handleCheckboxChange = (userId: number) => {
      setDropdownSelectedUserIds(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : prev.length < rec.slots ? [...prev, userId] : prev
      );
    };
    const slotsFull = dropdownSelectedUserIds.length >= rec.slots;
    return (
      <div style={{
        position: 'absolute',
        top: 60,
        right: 0,
        zIndex: 2000,
        background: '#fff',
        border: '1.5px solid #ff9800',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        padding: 24,
        minWidth: 320,
        maxWidth: 400
      }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Select Employees</div>
        <div style={{ marginBottom: 12, color: '#888', fontSize: 15 }}>
          {dropdownSelectedUserIds.length}/{rec.slots} selected
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
          {users.map(user => {
            const isSelected = dropdownSelectedUserIds.includes(user.id);
            const disableCheckbox = !isSelected && slotsFull;
            return (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 0',
                  cursor: disableCheckbox ? 'not-allowed' : 'pointer',
                  background: isSelected ? '#fff8f3' : '#fff',
                  borderRadius: 6,
                  opacity: disableCheckbox ? 0.5 : 1
                }}
                onClick={() => !disableCheckbox && handleCheckboxChange(user.id)}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disableCheckbox}
                  onChange={() => handleCheckboxChange(user.id)}
                  style={{ marginRight: 10, width: 18, height: 18 }}
                />
                <span style={{ fontSize: 16, color: '#333', fontWeight: isSelected ? 600 : 400 }}>{user.name}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={handleCloseUserDropdown}
            style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15 }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleSaveUserDropdown(rec, dropdownSelectedUserIds)}
            style={{ background: '#ff9800', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15 }}
          >
            Save
          </button>
        </div>
      </div>
    );
  };

  // Open modal and fetch data
  const openManageModal = async (shift: any) => {
    setManageModalLoading(true);
    setManageModalOpen(true);
    setManageModalShift(shift);
    // Clear search terms and add-slots input when opening modal
    setScheduledSearchTerm('');
    setUnscheduledSearchTerm('');
    setAddSlotsInput('');
    setReduceSlotsInput('');
    try {
      const token = localStorage.getItem("token");

      // Fetch shift employees
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-employees?shiftId=${shift.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch shift employees");
      const data = await res.json();
      setManageModalData(data);

      // Fetch default users and absences if this is a recurring shift
      if (shift.recurringShiftId) {
        await fetchDefaultUsersAndAbsences(shift);
      }
    } catch (err) {
      setManageModalData(null);
      toast.error("Failed to load shift employees");
    } finally {
      setManageModalLoading(false);
    }
  };

  const fetchDefaultUsersAndAbsences = async (shift: any) => {
    setLoadingDefaultUsers(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch default users for the recurring shift
      const defaultUsersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recurring-shifts/${shift.recurringShiftId}/default-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch absences for this specific shift
      const absencesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${shift.id}/absences`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (defaultUsersRes.ok) {
        const defaultUsersData = await defaultUsersRes.json();
        
        // Priority: Use day-specific default users if they exist, otherwise use global default users
        const shiftDate = new Date(shift.startTime);
        const shiftDayOfWeek = shiftDate.getDay();
        const allDefaultUsers = defaultUsersData.defaultUsers || [];
        
        // Filter day-specific users for this day
        // IMPORTANT: dayOfWeek NULL = global default user (used when no day-specific users exist for that day)
        const daySpecificUsers = allDefaultUsers.filter(
          (du: any) => du.dayOfWeek !== null && du.dayOfWeek === shiftDayOfWeek
        );
        
        // Use day-specific users if they exist, otherwise use global users
        const filteredDefaultUsers = daySpecificUsers.length > 0 
          ? daySpecificUsers  // Use ONLY day-specific users if they exist (NOT global)
          : allDefaultUsers.filter((du: any) => du.dayOfWeek === null);  // Otherwise use ONLY global users (dayOfWeek = null)
        
        setDefaultUsers(filteredDefaultUsers);
      }

      if (absencesRes.ok) {
        const absencesData = await absencesRes.json();
        setShiftAbsences(absencesData.absences || []);
      }
    } catch (err) {
      console.error('Failed to fetch default users and absences:', err);
      setDefaultUsers([]);
      setShiftAbsences([]);
    } finally {
      setLoadingDefaultUsers(false);
    }
  };

  // State for tracking which user is being added/removed (for loading indicators)
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [removingSignupId, setRemovingSignupId] = useState<number | null>(null);

  // Add employee to shift with OPTIMISTIC UI UPDATE
  const handleAddEmployee = async (userId: number) => {
    if (!manageModalShift || !manageModalData) return;
    
    // Find the user being added from unscheduled list
    const userToAdd = manageModalData.unscheduled.find(u => u.id === userId);
    if (!userToAdd) return;

    setAddingUserId(userId);

    // OPTIMISTIC UPDATE: Immediately update the UI
    const optimisticSignupId = Date.now(); // Temporary ID
    setManageModalData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        scheduled: [...prev.scheduled, { ...userToAdd, signupId: optimisticSignupId, isDefault: false }],
        unscheduled: prev.unscheduled.filter(u => u.id !== userId),
        booked: prev.booked + 1,
        availableSlots: Math.max(0, (prev.availableSlots ?? 0) - 1)
      };
    });
    
    toast.success("Employee added successfully");
    setAddingUserId(null);

    // Send request to server in background
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, shiftId: manageModalShift.id })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        // ROLLBACK: Revert the optimistic update on error
        setManageModalData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            scheduled: prev.scheduled.filter(u => u.signupId !== optimisticSignupId),
            unscheduled: [...prev.unscheduled, userToAdd],
            booked: prev.booked - 1,
            availableSlots: (prev.availableSlots ?? 0) + 1
          };
        });
        toast.error(errorData.error || "Failed to add employee");
        return;
      }

      // Update with real signup ID from server
      const signup = await res.json();
      setManageModalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scheduled: prev.scheduled.map(u => 
            u.signupId === optimisticSignupId ? { ...u, signupId: signup.id } : u
          )
        };
      });
      // Refresh card counter (same data source as page)
      refreshShiftsForCard();
    } catch (err: any) {
      // ROLLBACK on network error
      setManageModalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scheduled: prev.scheduled.filter(u => u.signupId !== optimisticSignupId),
          unscheduled: [...prev.unscheduled, userToAdd],
          booked: prev.booked - 1,
          availableSlots: (prev.availableSlots ?? 0) + 1
        };
      });
      toast.error("Network error - failed to add employee");
    }
  };

  // Remove employee from shift with OPTIMISTIC UI UPDATE
  const handleRemoveEmployee = async (signupId: number) => {
    if (!manageModalShift || !manageModalData) return;
    
    // Find the user being removed
    const userToRemove = manageModalData.scheduled.find(u => u.signupId === signupId);
    if (!userToRemove) return;

    setRemovingSignupId(signupId);

    // OPTIMISTIC UPDATE: Immediately update the UI
    setManageModalData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        scheduled: prev.scheduled.filter(u => u.signupId !== signupId),
        unscheduled: [...prev.unscheduled, { id: userToRemove.id, name: userToRemove.name }],
        booked: prev.booked - 1,
        availableSlots: (prev.availableSlots ?? 0) + 1
      };
    });
    
    toast.success("Employee removed successfully");
    setRemovingSignupId(null);

    // Send request to server in background
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        // ROLLBACK: Revert the optimistic update on error
        setManageModalData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            scheduled: [...prev.scheduled, userToRemove],
            unscheduled: prev.unscheduled.filter(u => u.id !== userToRemove.id),
            booked: prev.booked + 1,
            availableSlots: Math.max(0, (prev.availableSlots ?? 0) - 1)
          };
        });
        toast.error(errorData.error || "Failed to remove employee");
      } else {
        // Refresh card counter so it shows updated filled/total
        refreshShiftsForCard();
      }
    } catch (err: any) {
      // ROLLBACK on network error
      setManageModalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          scheduled: [...prev.scheduled, userToRemove],
          unscheduled: prev.unscheduled.filter(u => u.id !== userToRemove.id),
          booked: prev.booked + 1,
          availableSlots: Math.max(0, (prev.availableSlots ?? 0) - 1)
        };
      });
      toast.error("Network error - failed to remove employee");
    }
  };

  // Handle absence request
  const handleRequestAbsence = async () => {
    if (!selectedUserForAbsence || !manageModalShift) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/absences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserForAbsence.userId,
          absenceType,
          reason: absenceReason,
          isApproved: true
        })
      });

      if (!res.ok) throw new Error("Failed to request absence");

      toast.success("Absence marked successfully");
      setShowAbsenceModal(false);
      setSelectedUserForAbsence(null);
      setAbsenceReason('');
      setAbsenceType('UNAVAILABLE');

      // Refresh data
      await fetchDefaultUsersAndAbsences(manageModalShift);
    } catch (err) {
      toast.error("Failed to request absence");
    }
  };

  // Handle user selection for absence
  const handleUserSelection = (userId: number) => {
    setSelectedUsersForAbsence(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle making multiple users absent with OPTIMISTIC UI UPDATE
  const handleMakeAbsence = async () => {
    if (selectedUsersForAbsence.length === 0 || !manageModalShift || !manageModalData) return;

    const usersToMarkAbsent = selectedUsersForAbsence;
    const usersCount = usersToMarkAbsent.length;

    // OPTIMISTIC UPDATE: Immediately update the UI
    // 1. Mark users as absent (keep them in list but with isAbsent: true)
    setManageModalData(prev => {
      if (!prev) return prev;
      const absentUserIdSet = new Set(usersToMarkAbsent);
      const markedAbsentCount = prev.scheduled.filter(u => absentUserIdSet.has(u.id) && u.isDefault && !u.isAbsent).length;
      
      // Update users to mark them as absent with temporary absenceId
      const newScheduled = prev.scheduled.map(u => {
        if (absentUserIdSet.has(u.id) && u.isDefault) {
          return { ...u, isAbsent: true, absenceId: Date.now() + u.id }; // Temporary ID
        }
        return u;
      });
      
      return {
        ...prev,
        scheduled: newScheduled,
        booked: prev.booked - markedAbsentCount, // Decrease booked count
        defaultUsers: Math.max(0, (prev.defaultUsers || 0) - markedAbsentCount),
        absentDefaultUsers: (prev.absentDefaultUsers || 0) + markedAbsentCount,
        availableSlots: (prev.availableSlots ?? 0) + markedAbsentCount
      };
    });

    // 2. Update shiftAbsences to show these users as absent in the absence modal
    setShiftAbsences(prev => [
      ...prev,
      ...usersToMarkAbsent.map(userId => ({
        id: Date.now() + userId, // Temporary ID
        userId,
        isApproved: true,
        absenceType
      }))
    ]);

    // 3. Update shiftAbsencesCache so shift cards show correct capacity (e.g. "1 spot available")
    if (manageModalShift?.id) {
      setShiftAbsencesCache(prev => {
        const existing = prev[manageModalShift.id] || [];
        return { ...prev, [manageModalShift.id]: [...existing, ...usersToMarkAbsent] };
      });
    }

    // Reset form state and close modal immediately
    setSelectedUsersForAbsence([]);
    setAbsenceReason('');
    setAbsenceType('UNAVAILABLE');
    setShowAbsenceModal(false);
    
    toast.success(`Marked ${usersCount} user(s) as absent`);

    // Send requests to server in background
    try {
      const token = localStorage.getItem("token");

      // Create absences for all selected users
      const results = await Promise.all(
        usersToMarkAbsent.map(async (userId) => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/absences`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                userId,
                absenceType,
                reason: absenceReason || 'No reason provided',
                isApproved: true
              })
            });
            if (!res.ok) {
              const data = await res.json();
              return { userId, success: false, error: data.error };
            }
            return { userId, success: true };
          } catch (err) {
            return { userId, success: false, error: 'Network error' };
          }
        })
      );

      // Check for failures
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        if (failures.some(f => f.error?.includes('already'))) {
          toast.info('Some users were already marked as absent');
        } else {
          toast.error(`Failed to mark ${failures.length} user(s) as absent`);
        }
      }

      // Always refresh to get real absence IDs from server
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-employees?shiftId=${manageModalShift.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setManageModalData(data);
      }

      // Refresh default users and absences for the absence modal list
      await fetchDefaultUsersAndAbsences(manageModalShift);
      refreshShiftsForCard();

    } catch (err) {
      // On complete failure, refresh to get correct state
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-employees?shiftId=${manageModalShift.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setManageModalData(data);
        }
      } catch (e) {
        console.error('Failed to refresh modal data:', e);
      }
      toast.error('Failed to mark users as absent');
    }
  };

  // State for tracking which absence is being removed (for loading indicator)
  const [removingAbsenceId, setRemovingAbsenceId] = useState<number | null>(null);

  // Handle removing absence (making user present) with OPTIMISTIC UI UPDATE
  const handleMakePresent = async (userId: number, absenceId: number) => {
    if (!manageModalShift || !manageModalData) return;

    setRemovingAbsenceId(absenceId);

    // Find the user being made present
    const userToMakePresent = manageModalData.scheduled.find(u => u.id === userId && u.isAbsent);
    
    // OPTIMISTIC UPDATE: Immediately update the UI
    setManageModalData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        scheduled: prev.scheduled.map(u => 
          u.id === userId ? { ...u, isAbsent: false, absenceId: null } : u
        ),
        booked: prev.booked + 1,
        defaultUsers: (prev.defaultUsers || 0) + 1,
        availableSlots: Math.max(0, (prev.availableSlots ?? 0) - 1)
      };
    });

    // Update shiftAbsences to remove this absence
    setShiftAbsences(prev => prev.filter(a => a.id !== absenceId));
    // Update shiftAbsencesCache so shift cards show correct capacity
    if (manageModalShift?.id) {
      setShiftAbsencesCache(prev => {
        const existing = prev[manageModalShift.id] || [];
        return { ...prev, [manageModalShift.id]: existing.filter(id => id !== userId) };
      });
    }

    // Send request to server
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/absences/${absenceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success('User marked as present');
        refreshShiftsForCard();
      } else {
        // ROLLBACK on error (e.g. overbooking when making user present)
        setManageModalData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            scheduled: prev.scheduled.map(u => 
              u.id === userId ? { ...u, isAbsent: true, absenceId } : u
            ),
            booked: prev.booked - 1,
            defaultUsers: Math.max(0, (prev.defaultUsers || 0) - 1),
            availableSlots: (prev.availableSlots ?? 0) + 1
          };
        });
        setShiftAbsences(prev => [...prev, { id: absenceId, userId, isApproved: true }]);
        if (manageModalShift?.id) {
          setShiftAbsencesCache(prev => {
            const existing = prev[manageModalShift.id] || [];
            return existing.includes(userId) ? prev : { ...prev, [manageModalShift.id]: [...existing, userId] };
          });
        }
        const errorData = await res.json().catch(() => ({}));
        const message = errorData.details?.message || errorData.error || 'Failed to mark user as present';
        toast.error(message);
      }

      // Refresh data
      await fetchDefaultUsersAndAbsences(manageModalShift);
    } catch (err) {
      // ROLLBACK on network error
      if (userToMakePresent) {
        setManageModalData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            scheduled: prev.scheduled.map(u => 
              u.id === userId ? { ...u, isAbsent: true, absenceId } : u
            ),
            booked: prev.booked - 1,
            defaultUsers: Math.max(0, (prev.defaultUsers || 0) - 1),
            availableSlots: (prev.availableSlots ?? 0) + 1
          };
        });
      }
      toast.error('Network error - failed to mark user as present');
    } finally {
      setRemovingAbsenceId(null);
    }
  };

  // Legacy handler for absence modal (still needed for that UI)
  const handleRemoveAbsence = async (absenceId: number) => {
    if (!manageModalShift) return;
    const userId = manageModalData?.scheduled.find(u => u.absenceId === absenceId)?.id;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/absences/${absenceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData.details?.message || errorData.error || 'Failed to remove absence';
        throw new Error(message);
      }

      // Update shiftAbsencesCache so shift cards show correct capacity
      if (userId != null) {
        setShiftAbsencesCache(prev => {
          const existing = prev[manageModalShift!.id] || [];
          return { ...prev, [manageModalShift!.id]: existing.filter(id => id !== userId) };
        });
      }

      // Refresh default users and absences
      await fetchDefaultUsersAndAbsences(manageModalShift);

      // Refresh the manage modal data to update scheduled list and available slots
      const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shift-employees?shiftId=${manageModalShift.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setManageModalData(data);
      }

      toast.success('User marked as present');
      refreshShiftsForCard();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove absence');
    }
  };

  // Handle absence approval/rejection
  const handleAbsenceAction = async (absenceId: number, isApproved: boolean) => {
    if (!manageModalShift) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/absences/${absenceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isApproved
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const message = errorData.details?.message || errorData.error || `Failed to ${isApproved ? 'approve' : 'reject'} absence`;
        throw new Error(message);
      }

      toast.success(`Absence ${isApproved ? 'approved' : 'rejected'} successfully`);

      // Refresh data
      await fetchDefaultUsersAndAbsences(manageModalShift);
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${isApproved ? 'approve' : 'reject'} absence`);
    }
  };

  // Modal component
  const renderManageModal = () => {
    if (!manageModalOpen || !manageModalShift) return null;
    const handleCloseModal = async () => {
      setManageModalOpen(false);
      await fetchAllPageData(); // Refresh all data including absences after closing modal
    };

    // Filter scheduled employees based on search term
    const filteredScheduled = manageModalData?.scheduled.filter(emp =>
      emp.name.toLowerCase().includes(scheduledSearchTerm.toLowerCase())
    ) || [];

    // Filter unscheduled employees based on search term
    const filteredUnscheduled = manageModalData?.unscheduled.filter(emp =>
      emp.name.toLowerCase().includes(unscheduledSearchTerm.toLowerCase())
    ) || [];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.35)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          width: '60vw',
          minWidth: 500,
          maxWidth: 900,
          maxHeight: '80vh',
          padding: 36,
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          overflow: 'auto',
          position: 'relative'
        }}>
          <button onClick={handleCloseModal} style={{ position: 'absolute', top: 18, right: 24, background: 'none', border: 'none', fontSize: 28, color: '#888', cursor: 'pointer' }}>×</button>

          {/* Refresh Button */}
          <button
            onClick={async () => {
              setManageModalLoading(true);
              try {
                await openManageModal(manageModalShift);
                toast.success('Data refreshed successfully');
              } catch (err) {
                toast.error('Failed to refresh data');
              } finally {
                setManageModalLoading(false);
              }
            }}
            disabled={manageModalLoading}
            style={{
              position: 'absolute',
              top: 18,
              right: 60,
              background: '#4caf50',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 14,
              color: '#fff',
              cursor: manageModalLoading ? 'not-allowed' : 'pointer',
              opacity: manageModalLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refresh data to see latest changes"
          >
            {manageModalLoading ? '⟳' : '↻'} Refresh
          </button>

          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 18 }}>Manage Employees for {manageModalShift.name}</h2>

          {/* Increase number of slots - updates this shift only in Shift table */}
          <div style={{ marginBottom: 24, padding: 20, border: '1px solid #e0e0e0', borderRadius: 10, backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>Increase number of slots</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              Current: <strong>{manageModalData?.slots ?? 0}</strong> slots ({manageModalData?.booked ?? 0} booked). Add more slots for this shift only.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="number"
                min={1}
                value={addSlotsInput}
                onChange={(e) => setAddSlotsInput(e.target.value.replace(/[^0-9]/, ''))}
                style={{
                  width: 80,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 15
                }}
              />
              <span style={{ fontSize: 14, color: '#666' }}>slots to add</span>
              <button
                onClick={async () => {
                  const num = parseInt(addSlotsInput, 10);
                  if (!addSlotsInput.trim() || isNaN(num) || num < 1) {
                    toast.error('Enter at least 1 slot to add');
                    return;
                  }
                  setUpdatingSlots(true);
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/slots`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ addSlots: num })
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      throw new Error(err.error || 'Failed to update slots');
                    }
                    toast.success(`Added ${num} slot(s). Total slots: ${(manageModalData?.slots ?? 0) + num}`);
                    setAddSlotsInput('');
                    await openManageModal(manageModalShift);
                    await fetchAllPageData();
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to update slots');
                  } finally {
                    setUpdatingSlots(false);
                  }
                }}
                disabled={updatingSlots}
                style={{
                  background: updatingSlots ? '#ccc' : '#ff9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: updatingSlots ? 'not-allowed' : 'pointer'
                }}
              >
                {updatingSlots ? 'Updating...' : 'Update slots'}
              </button>
            </div>
          </div>

          {/* Decrease number of slots - only excess slots; never below booked (signed up + default users) */}
          <div style={{ marginBottom: 24, padding: 20, border: '1px solid #e0e0e0', borderRadius: 10, backgroundColor: '#fafafa' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 }}>Decrease number of slots</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              You can only reduce <strong>excess</strong> slots. Current: <strong>{manageModalData?.slots ?? 0}</strong> slots, <strong>{manageModalData?.booked ?? 0}</strong> booked. You cannot reduce below the booked count.
            </div>
            {(() => {
              const slots = manageModalData?.slots ?? 0;
              const booked = manageModalData?.booked ?? 0;
              const maxReduce = Math.max(0, slots - booked);
              if (maxReduce <= 0) {
                return (
                  <div style={{ fontSize: 13, color: '#c62828', padding: '10px 12px', background: '#ffebee', borderRadius: 8 }}>
                    You cannot reduce slots—all current slots are filled ({booked} people booked). Remove someone from the shift first if you need to lower capacity.
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    min={1}
                    max={maxReduce}
                    value={reduceSlotsInput}
                    onChange={(e) => setReduceSlotsInput(e.target.value.replace(/[^0-9]/, ''))}
                    placeholder={`Max ${maxReduce}`}
                    style={{
                      width: 80,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #ddd',
                      fontSize: 15
                    }}
                  />
                  <span style={{ fontSize: 14, color: '#666' }}>slots to remove (max {maxReduce})</span>
                  <button
                    onClick={async () => {
                      const num = parseInt(reduceSlotsInput, 10);
                      if (!reduceSlotsInput.trim() || isNaN(num) || num < 1) {
                        toast.error('Enter at least 1 slot to remove');
                        return;
                      }
                      if (num > maxReduce) {
                        toast.error(`You can only remove up to ${maxReduce} excess slot(s). ${booked} are already booked.`);
                        return;
                      }
                      const newTotal = slots - num;
                      setUpdatingSlots(true);
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/slots`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ slots: newTotal })
                        });
                        if (!res.ok) {
                          const err = await res.json();
                          throw new Error(err.error || err.details?.message || 'Failed to update slots');
                        }
                        toast.success(`Reduced by ${num} slot(s). Total slots: ${newTotal}`);
                        setReduceSlotsInput('');
                        await openManageModal(manageModalShift);
                        await fetchAllPageData();
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to reduce slots');
                      } finally {
                        setUpdatingSlots(false);
                      }
                    }}
                    disabled={updatingSlots}
                    style={{
                      background: updatingSlots ? '#ccc' : '#1976d2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: updatingSlots ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {updatingSlots ? 'Updating...' : 'Reduce slots'}
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Default Users Management Section - Only show for recurring shifts */}
          {manageModalShift.recurringShiftId && (
            <div style={{ marginBottom: 24, padding: 20, border: '1px solid #e0e0e0', borderRadius: 10, backgroundColor: '#f8f9fa' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                    Manage Default Users Absences
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Mark default users as absent for this specific occurrence
                  </div>
                </div>
                <button
                  onClick={() => setShowAbsenceModal(true)}
                  style={{
                    background: '#ff9800',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Manage Absences
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 32 }}>
            {/* Scheduled Employees */}
            <div style={{ flex: 1, minWidth: 200, background: '#f8f8f8', borderRadius: 10, padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 10 }}>
                Scheduled ({manageModalData?.booked ?? 0}/{manageModalData?.slots ?? 0})
                {/* {manageModalData?.defaultUsers && manageModalData.defaultUsers > 0 && (
                  <span style={{ fontSize: 12, color: '#666', fontWeight: 400, marginLeft: 8 }}>
                    ({manageModalData.defaultUsers} default)
                  </span>
                )} */}
                {scheduledSearchTerm && (
                  <span style={{ fontSize: 14, color: '#666', fontWeight: 400, marginLeft: 8 }}>
                    ({filteredScheduled.length} found)
                  </span>
                )}
              </div>

              {/* Search input for scheduled employees */}
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search scheduled employees..."
                  value={scheduledSearchTerm}
                  onChange={(e) => setScheduledSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: scheduledSearchTerm ? '40px' : '12px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff'
                  }}
                />
                {scheduledSearchTerm && (
                  <button
                    onClick={() => setScheduledSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      color: '#999',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {manageModalLoading ? <div>Loading...</div> : (
                <>
                  {filteredScheduled.length === 0 ? (
                    <div style={{ color: '#888', fontSize: 15 }}>
                      {scheduledSearchTerm ? 'No employees match your search.' : 'No employees scheduled.'}
                    </div>
                  ) : (
                    filteredScheduled.map(emp => (
                      <div key={emp.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '10px 8px', 
                        borderBottom: '1px solid #eee',
                        background: emp.isAbsent ? '#fff3e0' : 'transparent',
                        borderRadius: emp.isAbsent ? 6 : 0,
                        marginBottom: emp.isAbsent ? 4 : 0
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 500, color: emp.isAbsent ? '#666' : '#333' }}>{emp.name}</span>
                          {(emp.isDefault || emp.isAbsent) && (
                            <div style={{ display: 'flex', gap: 6 }}>
                              {emp.isDefault && (
                                <span style={{
                                  fontSize: 10,
                                  background: '#ff9800',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontWeight: 600
                                }}>
                                  DEFAULT
                                </span>
                              )}
                              {emp.isAbsent && (
                                <span style={{
                                  fontSize: 10,
                                  background: '#d32f2f',
                                  color: 'white',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontWeight: 600
                                }}>
                                  ABSENT
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Show appropriate button based on user type and absence status */}
                        {emp.isAbsent && emp.absenceId ? (
                          /* Absent default user - show Make Present button */
                          (() => {
                            const isProcessing = removingAbsenceId === emp.absenceId;
                            return (
                              <button 
                                onClick={() => handleMakePresent(emp.id, emp.absenceId)}
                                disabled={isProcessing}
                                style={{ 
                                  background: '#fff', 
                                  color: isProcessing ? '#999' : '#43a047', 
                                  border: `1px solid ${isProcessing ? '#ccc' : '#43a047'}`, 
                                  borderRadius: 6, 
                                  padding: '4px 14px', 
                                  fontWeight: 600, 
                                  cursor: isProcessing ? 'not-allowed' : 'pointer', 
                                  fontSize: 15,
                                  opacity: isProcessing ? 0.6 : 1,
                                  minWidth: 90
                                }}
                              >
                                {isProcessing ? 'Processing...' : 'Make Present'}
                              </button>
                            );
                          })()
                        ) : emp.isDefault && !emp.isAbsent ? (
                          /* Present default user - show Mark Absent button */
                          <button 
                            onClick={() => {
                              // Pre-select this default user and open the absence modal
                              setSelectedUsersForAbsence([emp.id]);
                              setShowAbsenceModal(true);
                            }} 
                            style={{ 
                              background: '#fff', 
                              color: '#ff9800', 
                              border: '1px solid #ff9800', 
                              borderRadius: 6, 
                              padding: '4px 14px', 
                              fontWeight: 600, 
                              cursor: 'pointer', 
                              fontSize: 15 
                            }}
                          >
                            Mark Absent
                          </button>
                        ) : emp.signupId ? (
                          /* Regular registered user - show Remove button */
                          (() => {
                            const isRemoving = removingSignupId === emp.signupId;
                            return (
                              <button 
                                onClick={() => handleRemoveEmployee(emp.signupId)} 
                                disabled={isRemoving}
                                style={{ 
                                  background: '#fff', 
                                  color: isRemoving ? '#999' : '#e53935', 
                                  border: `1px solid ${isRemoving ? '#ccc' : '#e53935'}`, 
                                  borderRadius: 6, 
                                  padding: '4px 14px', 
                                  fontWeight: 600, 
                                  cursor: isRemoving ? 'not-allowed' : 'pointer', 
                                  fontSize: 15,
                                  opacity: isRemoving ? 0.6 : 1,
                                  minWidth: 85
                                }}
                              >
                                {isRemoving ? 'Removing...' : 'Remove'}
                              </button>
                            );
                          })()
                        ) : (
                          <span style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>No action</span>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
            {/* Unscheduled Employees */}
            <div style={{ flex: 1, minWidth: 200, background: '#f8f8f8', borderRadius: 10, padding: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 10 }}>
                Available to Schedule
                {unscheduledSearchTerm && (
                  <span style={{ fontSize: 14, color: '#666', fontWeight: 400, marginLeft: 8 }}>
                    ({filteredUnscheduled.length} found)
                  </span>
                )}
              </div>

              {/* Search input for unscheduled employees */}
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search available employees..."
                  value={unscheduledSearchTerm}
                  onChange={(e) => setUnscheduledSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingRight: unscheduledSearchTerm ? '40px' : '12px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    outline: 'none',
                    background: '#fff'
                  }}
                />
                {unscheduledSearchTerm && (
                  <button
                    onClick={() => setUnscheduledSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      color: '#999',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {manageModalLoading ? <div>Loading...</div> : (
                <>
                  {filteredUnscheduled.length === 0 ? (
                    <div style={{ color: '#888', fontSize: 15 }}>
                      {unscheduledSearchTerm ? 'No employees match your search.' : 'No available employees.'}
                    </div>
                  ) : (
                    filteredUnscheduled.map(emp => {
                      const isAdding = addingUserId === emp.id;
                      const isDisabled = isAdding || (!!manageModalData && (manageModalData.booked >= manageModalData.slots || (manageModalData.availableSlots ?? 0) <= 0));
                      return (
                        <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                          <span style={{ fontSize: 16 }}>{emp.name}</span>
                          <button
                            onClick={() => handleAddEmployee(emp.id)}
                            disabled={isDisabled}
                            style={{ 
                              background: '#fff', 
                              color: isAdding ? '#999' : '#43a047', 
                              border: `1px solid ${isAdding ? '#ccc' : '#43a047'}`, 
                              borderRadius: 6, 
                              padding: '4px 14px', 
                              fontWeight: 600, 
                              cursor: isDisabled ? 'not-allowed' : 'pointer', 
                              fontSize: 15, 
                              opacity: isDisabled ? 0.6 : 1,
                              minWidth: 70
                            }}
                          >
                            {isAdding ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main style={{ padding: '16px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Schedule Shifts</h1>
          <p style={{ color: '#666', fontSize: 14 }}>Manage and schedule shifts for your organization</p>
        </div>
        <button
          onClick={async () => {
            await fetchAllPageData();
            toast.success('Data refreshed!');
          }}
          style={{
            background: '#ff9800',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e68900'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Category and Day Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            key="all"
            onClick={() => setSelectedCardCategory("")}
            style={{
              background: selectedCardCategory === "" ? '#ff9800' : '#f5f5f5',
              color: selectedCardCategory === "" ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              minWidth: 100
            }}
          >
            All Categories
          </button>
          {categoryOptions
            .filter(opt => opt.name !== 'Meals Counting' && opt.name !== 'Collection')
            .map(opt => (
              <button
                key={opt.id}
                onClick={() => setSelectedCardCategory(String(opt.id))}
                style={{
                  background: selectedCardCategory === String(opt.id) ? '#ff9800' : '#f5f5f5',
                  color: selectedCardCategory === String(opt.id) ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  minWidth: 100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {opt.icon && <span style={{ fontSize: 16 }}>{opt.icon}</span>}
                {opt.name}
              </button>
            ))}
        </div>
      </div>

      {/* Shift Type Filter */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShiftTypeFilter('all')}
            style={{
              background: shiftTypeFilter === 'all' ? '#ff9800' : '#f5f5f5',
              color: shiftTypeFilter === 'all' ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              minWidth: 80
            }}
          >
            All Types
          </button>
          <button
            onClick={() => setShiftTypeFilter('recurring')}
            style={{
              background: shiftTypeFilter === 'recurring' ? '#ff9800' : '#f5f5f5',
              color: shiftTypeFilter === 'recurring' ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              minWidth: 80,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span style={{ fontSize: 14 }}>📅</span>
            Recurring
          </button>
          <button
            onClick={() => setShiftTypeFilter('one-time')}
            style={{
              background: shiftTypeFilter === 'one-time' ? '#ff9800' : '#f5f5f5',
              color: shiftTypeFilter === 'one-time' ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              minWidth: 80,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span style={{ fontSize: 14 }}>⏰</span>
            One-time
          </button>
        </div>
      </div>



      {/* Shift Name Tabs */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedShiftName("")}
            style={{
              background: selectedShiftName === "" ? '#ff9800' : '#f5f5f5',
              color: selectedShiftName === "" ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              minWidth: 80
            }}
          >
            All Shifts
          </button>
          {shiftNameOptions.map(name => (
            <button
              key={name}
              onClick={() => setSelectedShiftName(name)}
              style={{
                background: selectedShiftName === name ? '#ff9800' : '#f5f5f5',
                color: selectedShiftName === name ? '#fff' : '#333',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                minWidth: 80
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>



      {/* Date Filter Section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setDateFilter('today')}
            style={{
              background: dateFilter === 'today' ? '#ff9800' : '#f5f5f5',
              color: dateFilter === 'today' ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('week')}
            style={{
              background: dateFilter === 'week' ? '#ff9800' : '#f5f5f5',
              color: dateFilter === 'week' ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter('custom')}
            style={{
              background: dateFilter === 'custom' ? '#ff9800' : '#f5f5f5',
              color: dateFilter === 'custom' ? '#fff' : '#333',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Custom Date
          </button>
          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              min={todayStr}
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #ddd',
                fontSize: 14
              }}
            />
          )}
        </div>
      </div>

      {/* Shifts Display */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 20 }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'red', padding: 20 }}>{error}</div>
        ) : filteredRecurring.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 20 }}>No recurring shifts found for the selected filters.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredRecurring.map(rec => renderShiftCard(rec)).filter(Boolean)}
          </div>
        )}
      </div>

      {/* URL Display Modal for Failed Clipboard Operations */}
      {showUrlDisplay && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            width: '90%',
            maxWidth: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1px solid #eee'
            }}>
              <h2 style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#333',
                margin: 0
              }}>
                Copy Link Manually
              </h2>
              <button
                onClick={() => {
                  setShowUrlDisplay(false);
                  setLastCopiedUrl('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  color: '#666',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#666', fontSize: 16, marginBottom: 16 }}>
                The link couldn't be copied to your clipboard automatically. Please copy it manually:
              </p>

              <div style={{
                background: '#f8f8f8',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '16px',
                marginBottom: 20,
                position: 'relative'
              }}>
                <input
                  type="text"
                  value={lastCopiedUrl}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: 14,
                    color: '#333',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.value = lastCopiedUrl;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                    toast.success('Link copied using fallback method!');
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#ff9800',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 16
            }}>
              <button
                onClick={() => {
                  setShowUrlDisplay(false);
                  setLastCopiedUrl('');
                }}
                style={{
                  padding: '12px 24px',
                  background: '#f5f5f5',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#666',
                  transition: 'all 0.2s'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {renderEmployeePopup()}
      {renderManageModal()}

      {/* Improved Absence Modal */}
      {showAbsenceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.15)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 10,
            padding: 32,
            minWidth: 600,
            maxWidth: '90vw',
            boxShadow: '0 2px 16px #ddd',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowAbsenceModal(false);
                setSelectedUsersForAbsence([]);
                setUserSearchTerm('');
                setAbsenceReason('');
                setAbsenceType('UNAVAILABLE');
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 20,
                color: '#888',
                cursor: 'pointer'
              }}
            >
              ×
            </button>

            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>
              Manage Absences
            </div>

            <div style={{ marginBottom: 16, padding: 12, background: '#f8f9fa', borderRadius: 6, border: '1px solid #e0e0e0' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>
                {manageModalShift.name}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Mark default users as absent for this specific occurrence
              </div>
            </div>

            {loadingDefaultUsers ? (
              <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>Loading absence data...</div>
            ) : (
              <div>
                {/* User Search and Selection */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: '#333' }}>
                    Select Users for Absence
                  </div>

                  {/* Search Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* User List with Checkboxes */}
                  {defaultUsers.length === 0 ? (
                    <div style={{ color: '#666', fontSize: 14, textAlign: 'center', padding: 20, background: '#f8f9fa', borderRadius: 6 }}>
                      No default users assigned to this shift
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: 200,
                      overflowY: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: 6,
                      background: '#fff'
                    }}>
                      {defaultUsers
                        .filter((defaultUser: any) => {
                          if (!userSearchTerm) return true;
                          const searchLower = userSearchTerm.toLowerCase();
                          const fullName = `${defaultUser.user.firstName} ${defaultUser.user.lastName}`.toLowerCase();
                          const email = defaultUser.user.email?.toLowerCase() || '';
                          return fullName.includes(searchLower) || email.includes(searchLower);
                        })
                        .map((defaultUser: any) => {
                          const isAbsent = shiftAbsences.some((absence: any) =>
                            absence.userId === defaultUser.userId && absence.isApproved
                          );
                          const isSelected = selectedUsersForAbsence.includes(defaultUser.userId);

                          return (
                            <div key={defaultUser.userId} style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: 12,
                              borderBottom: '1px solid #f0f0f0',
                              background: isAbsent ? '#ffebee' : (isSelected ? '#e3f2fd' : 'transparent'),
                              cursor: isAbsent ? 'not-allowed' : 'pointer',
                              opacity: isAbsent ? 0.7 : 1
                            }}
                              onClick={() => !isAbsent && handleUserSelection(defaultUser.userId)}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isAbsent}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (!isAbsent) handleUserSelection(defaultUser.userId);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ marginRight: 12 }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 500, color: isAbsent ? '#999' : '#333' }}>
                                  {defaultUser.user.firstName} {defaultUser.user.lastName}
                                </div>
                                {isAbsent && (
                                  <div style={{ fontSize: 12, color: '#d32f2f', marginTop: 2, fontWeight: 500 }}>
                                    ✓ Already marked absent
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Absence Details */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: '#333' }}>
                    Absence Details
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                      Absence Type
                    </label>
                    <select
                      value={absenceType}
                      onChange={(e) => setAbsenceType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        fontSize: 14,
                        outline: 'none'
                      }}
                    >
                      <option value="UNAVAILABLE">Unavailable</option>
                      <option value="SICK">Sick</option>
                      <option value="PERSONAL">Personal</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                      Reason (Optional)
                    </label>
                    <textarea
                      value={absenceReason}
                      onChange={(e) => setAbsenceReason(e.target.value)}
                      placeholder="Enter reason for absence..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        fontSize: 14,
                        minHeight: 80,
                        resize: 'vertical',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowAbsenceModal(false);
                      setSelectedUsersForAbsence([]);
                      setUserSearchTerm('');
                      setAbsenceReason('');
                      setAbsenceType('UNAVAILABLE');
                    }}
                    style={{
                      background: '#f5f5f5',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: 6,
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMakeAbsence}
                    disabled={selectedUsersForAbsence.length === 0}
                    style={{
                      background: selectedUsersForAbsence.length === 0 ? '#ccc' : '#ff9800',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 20px',
                      cursor: selectedUsersForAbsence.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    Make Absence ({selectedUsersForAbsence.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
} 