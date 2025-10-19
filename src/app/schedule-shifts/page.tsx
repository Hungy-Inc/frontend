"use client";
import React, { useEffect, useState, useRef } from "react";
import { FaEdit, FaTrash, FaSave, FaTimes } from "react-icons/fa";
import { MultiSelect } from "react-multi-select-component";
import { toast } from 'react-toastify';
import type { ToastContainerProps } from 'react-toastify';


export default function ScheduleShiftsPage() {
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
  const [editId, setEditId] = useState<number|null>(null);
  const [editData, setEditData] = useState<any>({ userId: null, shiftId: null });
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  const [recurringShifts, setRecurringShifts] = useState<any[]>([]);
  const [addDayOfWeek, setAddDayOfWeek] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [addDate, setAddDate] = useState<string>("");
  
  // State to track correct counts for each recurring shift (considering absences)
  const [shiftCounts, setShiftCounts] = useState<{[key: number]: {totalFilledSlots: number, presentDefaultUsers: number, pendingSlots: number}}>({});

  // Add state for editing signup
  const [editSignupId, setEditSignupId] = useState<number|null>(null);
  const [editSignupUserId, setEditSignupUserId] = useState<number|null>(null);

  // Add state to track which shift row is being edited and the edited userIds
  const [editShiftId, setEditShiftId] = useState<number|null>(null);
  const [editSignupUserIds, setEditSignupUserIds] = useState<{[signupId: string]: number}>({});

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
  const [selectedRecurringId, setSelectedRecurringId] = useState<number|null>(null);
  const [selectedRecurringUsers, setSelectedRecurringUsers] = useState<any[]>([]);

  const [scheduling, setScheduling] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Add new state for employee selection popup
  const [showEmployeePopup, setShowEmployeePopup] = useState(false);
  const [selectedShiftForPopup, setSelectedShiftForPopup] = useState<any>(null);
  const [scheduledEmployees, setScheduledEmployees] = useState<{[shiftId: string]: any[]}>({});
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  // Add state for manage modal search
  const [scheduledSearchTerm, setScheduledSearchTerm] = useState('');
  const [unscheduledSearchTerm, setUnscheduledSearchTerm] = useState('');
  
  // Add state for copy link feedback
  const [lastCopiedUrl, setLastCopiedUrl] = useState<string>('');
  const [showUrlDisplay, setShowUrlDisplay] = useState(false);

  // Add state for open employee dropdowns
  const [openEmployeeDropdown, setOpenEmployeeDropdown] = useState<{[shiftId: number]: boolean}>({});

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
  const [manageModalData, setManageModalData] = useState<{ scheduled: any[]; unscheduled: any[]; slots: number; booked: number; defaultUsers?: number; availableSlots?: number } | null>(null);
  const [manageModalShift, setManageModalShift] = useState<any>(null);
  const [manageModalLoading, setManageModalLoading] = useState(false);

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

  useEffect(() => {
    fetchShifts();
    fetchUsers();
    fetchCategories();
    fetchRecurringShifts();
    
    // Clear URL display on page refresh
    setShowUrlDisplay(false);
    setLastCopiedUrl('');
    
    // Smart refresh - check for changes every 10 seconds
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/last-updated`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.lastUpdated > lastUpdateTime) {
            fetchShifts();
            fetchRecurringShifts();
            setLastUpdateTime(data.lastUpdated);
          }
        }
      } catch (err) {
        // Silently fail - don't interrupt user experience
        // If endpoint doesn't exist, just refresh every 30 seconds as fallback
        if (Date.now() - lastUpdateTime > 30000) {
          fetchShifts();
          fetchRecurringShifts();
          setLastUpdateTime(Date.now());
        }
      }
    }, 10000);
    
    // Listen for shift signup events
    const handleShiftSignup = () => {
      fetchShifts();
      fetchRecurringShifts();
      setLastUpdateTime(Date.now());
    };
    
    window.addEventListener('shiftSignupCompleted', handleShiftSignup);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('shiftSignupCompleted', handleShiftSignup);
    };
  }, [lastUpdateTime]);

  // Fetch users on page load
  useEffect(() => {
    fetchUsers();
  }, []);

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

  // Fetch categories for dropdown (existing code, but also for add modal)
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
      console.log('Raw shifts data:', data); // Debug log for raw data
      setShifts(data);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError("Failed to load shifts.");
      setShifts([]);
    } finally {
      setLoading(false);
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

  // Calculate correct counts for each recurring shift considering absences
  const calculateShiftCounts = async (recurringShiftsData: any[]) => {
    const newCounts: {[key: number]: {totalFilledSlots: number, presentDefaultUsers: number, pendingSlots: number}} = {};
    
    for (const rec of recurringShiftsData) {
      try {
        // Find TODAY'S shifts for this recurring shift
        const todaysShifts = shifts.filter(shift => 
          shift.recurringShiftId === rec.id && 
          new Date(shift.startTime).toDateString() === new Date().toDateString()
        );
        
        // Get total default users for this recurring shift
        const totalDefaultUsers = rec.DefaultShiftUser ? rec.DefaultShiftUser.length : 0;
        
        // Count absent default users for TODAY'S shifts only
        let absentDefaultUsers = 0;
        
        for (const shift of todaysShifts) {
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${shift.id}/absences`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const response = await res.json();
              
              // The API returns { absences: [...], defaultUsers: [...] }
              if (response && Array.isArray(response.absences)) {
                // Count default users who are absent for THIS SPECIFIC SHIFT ONLY
                const absentDefaultUserIds = response.absences
                  .filter((absence: any) => absence.isApproved)
                  .map((absence: any) => absence.userId);
                
                const defaultUserIds = rec.DefaultShiftUser ? rec.DefaultShiftUser.map((du: any) => du.userId) : [];
                const shiftAbsentDefaultUsers = absentDefaultUserIds.filter((id: any) => defaultUserIds.includes(id)).length;
                absentDefaultUsers += shiftAbsentDefaultUsers;
                
                // Debug logging
                console.log(`Recurring Shift ${rec.id}, Shift ${shift.id} (${new Date(shift.startTime).toDateString()}):`, {
                  shiftAbsentDefaultUsers,
                  absentDefaultUserIds,
                  defaultUserIds,
                  totalAbsentDefaultUsers: absentDefaultUsers
                });
              } else {
                console.warn(`Invalid absences response for shift ${shift.id}:`, response);
              }
            }
          } catch (err) {
            console.error(`Error fetching absences for shift ${shift.id}:`, err);
          }
        }
        
        // Calculate present default users for today
        const presentDefaultUsers = totalDefaultUsers - absentDefaultUsers;
        
        // Get default user IDs to exclude them from regular signup count
        const defaultUserIds = rec.DefaultShiftUser ? rec.DefaultShiftUser.map((du: any) => du.userId) : [];
        
        // Calculate today's signups (excluding default users to avoid double counting)
        const todaysSignups = todaysShifts.reduce((sum, shift) => {
          if (!shift.ShiftSignup) return sum;
          // Count only non-default user signups
          const nonDefaultSignups = shift.ShiftSignup.filter((signup: any) => !defaultUserIds.includes(signup.userId));
          return sum + nonDefaultSignups.length;
        }, 0);
        
        // Calculate total filled slots (non-default signups + present default users)
        const totalFilledSlots = todaysSignups + presentDefaultUsers;
        
        const totalSlots = rec.slots || 0;
        const pendingSlots = Math.max(0, totalSlots - totalFilledSlots);
        
        newCounts[rec.id] = {
          totalFilledSlots,
          presentDefaultUsers,
          pendingSlots
        };
      } catch (err) {
        console.error(`Error calculating counts for recurring shift ${rec.id}:`, err);
        // Fallback to basic calculation
        const todaysShifts = shifts.filter(shift => 
          shift.recurringShiftId === rec.id && 
          new Date(shift.startTime).toDateString() === new Date().toDateString()
        );
        const bookedSlots = todaysShifts.reduce((sum, shift) => sum + (shift.ShiftSignup ? shift.ShiftSignup.length : 0), 0);
        const defaultUsersCount = rec.DefaultShiftUser ? rec.DefaultShiftUser.length : 0;
        const totalFilledSlots = bookedSlots + defaultUsersCount;
        const totalSlots = rec.slots || 0;
        const pendingSlots = Math.max(0, totalSlots - totalFilledSlots);
        
        newCounts[rec.id] = {
          totalFilledSlots,
          presentDefaultUsers: defaultUsersCount,
          pendingSlots
        };
      }
    }
    
    setShiftCounts(newCounts);
  };

  // Fetch categories and recurring shifts on page load
  useEffect(() => {
    fetchCategories();
    fetchRecurringShifts();
  }, []);

  // Recalculate counts when shifts change
  useEffect(() => {
    if (recurringShifts.length > 0) {
      calculateShiftCounts(recurringShifts);
    }
  }, [shifts, recurringShifts]);

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
        const start = new Date(nextDate);
        start.setHours(new Date(rec.startTime).getHours(), new Date(rec.startTime).getMinutes(), 0, 0);
        const end = new Date(nextDate);
        end.setHours(new Date(rec.endTime).getHours(), new Date(rec.endTime).getMinutes(), 0, 0);

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
      const start = new Date(nextDate);
      start.setHours(new Date(rec.startTime).getHours(), new Date(rec.startTime).getMinutes(), 0, 0);
      const end = new Date(nextDate);
      end.setHours(new Date(rec.endTime).getHours(), new Date(rec.endTime).getMinutes(), 0, 0);

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
                  const start = new Date(nextDate);
                  start.setHours(new Date(opt.startTime).getHours(), new Date(opt.startTime).getMinutes(), 0, 0);
                  const end = new Date(nextDate);
                  end.setHours(new Date(opt.endTime).getHours(), new Date(opt.endTime).getMinutes(), 0, 0);
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
      d.setHours(0,0,0,0);
      return d;
    };
    const endOfWeek = (date: Date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - d.getDay() + 6);
      d.setHours(23,59,59,999);
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
    // Set time in Atlantic timezone
    const recStart = new Date(rec.startTime);
    nextDate.setHours(recStart.getHours(), recStart.getMinutes(), 0, 0);
    
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
    const category = categoryOptions.find(cat => cat.id === rec.shiftCategoryId);
    if (category && (category.name === 'Meals Counting' || category.name === 'Collection')) return false;
    
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
        const category = categoryOptions.find(cat => cat.id === rec.shiftCategoryId);
        if (category && (category.name === 'Meals Counting' || category.name === 'Collection')) return false;
        
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
          // Set the time from the recurring shift
          const recStart = new Date(rec.startTime);
          nextDate.setHours(recStart.getHours(), recStart.getMinutes(), 0, 0);
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
        
        // Set the time from the recurring shift
        const recStart = new Date(rec.startTime);
        nextDate.setHours(recStart.getHours(), recStart.getMinutes(), 0, 0);
      } else {
        // Use the existing getNextOccurrence logic for non-expanded shifts
        nextDate = getNextOccurrence(rec);
      }
    }
    
    // Match by shiftCategoryId, location, and isSameDay only
    const matchingShifts = shifts.filter(shift => {
      const shiftStart = new Date(shift.startTime);
      return (
        String(shift.shiftCategoryId) === String(rec.shiftCategoryId) &&
        shift.location === rec.location &&
        isSameDay(shiftStart, nextDate)
      );
    });
    const shiftForModal = matchingShifts[0];

    // Helper to create a shift for this occurrence if it doesn't exist
    const handleManageEmployeesClick = async () => {
      let shiftToUse = shiftForModal;
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
          
          // Optionally, refresh shifts list
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

    // Use correct counts from state (considering absences) or fallback to basic calculation
    const correctCounts = shiftCounts[rec.id];
    const totalSlots = rec.slots || 0;
    
    let totalFilledSlots, presentDefaultUsers, pendingSlots;
    
    if (correctCounts) {
      // Use the correct counts that consider absences
      totalFilledSlots = correctCounts.totalFilledSlots;
      presentDefaultUsers = correctCounts.presentDefaultUsers;
      pendingSlots = correctCounts.pendingSlots;
    } else {
      // Fallback to basic calculation
      const bookedSlots = matchingShifts.reduce((sum, shift) => sum + (shift.ShiftSignup ? shift.ShiftSignup.length : 0), 0);
      const defaultUsersCount = rec.DefaultShiftUser ? rec.DefaultShiftUser.length : 0;
      totalFilledSlots = bookedSlots + defaultUsersCount;
      presentDefaultUsers = defaultUsersCount;
      pendingSlots = Math.max(0, totalSlots - totalFilledSlots);
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
                📋 {categoryOptions.find(cat => cat.id === rec.shiftCategoryId)?.name || 'Unknown Category'}
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
                {new Date(rec.startTime).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Halifax' })} - {new Date(rec.endTime).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Halifax' })}
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
              const categoryName = categoryOptions.find(cat => cat.id === rec.shiftCategoryId)?.name || 'Unknown';
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
      await fetchShifts(); // <--- Add this line to refresh shifts after saving
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
    // Clear search terms when opening modal
    setScheduledSearchTerm('');
    setUnscheduledSearchTerm('');
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
        setDefaultUsers(defaultUsersData.defaultUsers || []);
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

  // Add employee to shift
  const handleAddEmployee = async (userId: number) => {
    if (!manageModalShift) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, shiftId: manageModalShift.id })
      });
      if (!res.ok) throw new Error("Failed to add employee");
      await openManageModal(manageModalShift); // Refresh modal data
    } catch (err) {
      toast.error("Failed to add employee");
    }
  };

  // Remove employee from shift
  const handleRemoveEmployee = async (signupId: number) => {
    if (!manageModalShift) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shiftsignups/${signupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to remove employee");
      await openManageModal(manageModalShift); // Refresh modal data
    } catch (err) {
      toast.error("Failed to remove employee");
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

  // Handle making multiple users absent
  const handleMakeAbsence = async () => {
    if (selectedUsersForAbsence.length === 0 || !manageModalShift) return;
    
    try {
      const token = localStorage.getItem("token");
      
      // Create absences for all selected users
      const promises = selectedUsersForAbsence.map(userId => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/absences`, {
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
        })
      );
      
      await Promise.all(promises);
      
      setSelectedUsersForAbsence([]);
      setAbsenceReason('');
      
      // Refresh default users and absences
      await fetchDefaultUsersAndAbsences(manageModalShift);
      
      toast.success(`Marked ${selectedUsersForAbsence.length} user(s) as absent`);
    } catch (err) {
      toast.error('Failed to mark users as absent');
    }
  };

  // Handle removing absence (making user present)
  const handleRemoveAbsence = async (absenceId: number) => {
    if (!manageModalShift) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shifts/${manageModalShift.id}/absences/${absenceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to remove absence");
      
      // Refresh default users and absences
      await fetchDefaultUsersAndAbsences(manageModalShift);
      
      toast.success('User marked as present');
    } catch (err) {
      toast.error('Failed to remove absence');
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

      if (!res.ok) throw new Error(`Failed to ${isApproved ? 'approve' : 'reject'} absence`);
      
      toast.success(`Absence ${isApproved ? 'approved' : 'rejected'} successfully`);
      
      // Refresh data
      await fetchDefaultUsersAndAbsences(manageModalShift);
    } catch (err) {
      toast.error(`Failed to ${isApproved ? 'approve' : 'reject'} absence`);
    }
  };

  // Modal component
  const renderManageModal = () => {
    if (!manageModalOpen || !manageModalShift) return null;
    const handleCloseModal = async () => {
      setManageModalOpen(false);
      await fetchShifts(); // Refresh shifts data after closing modal
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
                      <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{emp.name}</span>
                          {emp.isDefault && (
                            <span style={{ 
                              fontSize: 10, 
                              background: '#ff9800', 
                              color: 'white', 
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              fontWeight: 600 
                            }}>
                              DEFAULT
                            </span>
                          )}
                        </div>
                        {emp.signupId ? (
                          <button onClick={() => handleRemoveEmployee(emp.signupId)} style={{ background: '#fff', color: '#e53935', border: '1px solid #e53935', borderRadius: 6, padding: '4px 14px', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>Remove</button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>Default User</span>
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
                    filteredUnscheduled.map(emp => (
                      <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <span style={{ fontSize: 16 }}>{emp.name}</span>
                        <button
                          onClick={() => handleAddEmployee(emp.id)}
                          disabled={!!manageModalData && (manageModalData.booked >= manageModalData.slots || (manageModalData.availableSlots ?? 0) <= 0)}
                          style={{ background: '#fff', color: '#43a047', border: '1px solid #43a047', borderRadius: 6, padding: '4px 14px', fontWeight: 600, cursor: (!!manageModalData && (manageModalData.booked >= manageModalData.slots || (manageModalData.availableSlots ?? 0) <= 0)) ? 'not-allowed' : 'pointer', fontSize: 15, opacity: (!!manageModalData && (manageModalData.booked >= manageModalData.slots || (manageModalData.availableSlots ?? 0) <= 0)) ? 0.5 : 1 }}
                        >
                          Add
                        </button>
                      </div>
                    ))
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
          onClick={() => {
            fetchShifts();
            fetchRecurringShifts();
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
                              background: isSelected ? '#e3f2fd' : 'transparent',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleUserSelection(defaultUser.userId)}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUserSelection(defaultUser.userId);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{ marginRight: 12 }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>
                                  {defaultUser.user.firstName} {defaultUser.user.lastName}
                                </div>
                                {isAbsent && (
                                  <div style={{ fontSize: 12, color: '#d32f2f', marginTop: 2 }}>
                                    Currently absent
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