"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaUtensils, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function MealCountPage() {
  const params = useParams();
  const router = useRouter();
  const organizationName = params?.organizationName ? decodeURIComponent(params.organizationName as string) : '';
  const shiftNameParam = params?.shiftName as string;
  
  const [mealsServed, setMealsServed] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingMealCount, setExistingMealCount] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [shiftName, setShiftName] = useState<string>('');

  // Map URL shift name to display name
  const shiftNameMap: { [key: string]: string } = {
    'breakfast': 'Breakfast Shift',
    'lunch': 'Lunch Shift',
    'supper': 'Supper Shift'
  };

  useEffect(() => {
    // Get today's date in YYYY-MM-DD format using user's local timezone
    const today = new Date();
    // Use local timezone (user's phone/browser timezone)
    const localDate = today.toLocaleDateString('en-CA'); // en-CA format gives YYYY-MM-DD
    setCurrentDate(localDate);
    setSelectedDate(localDate); // Set selected date to today by default

    // Set shift name from URL parameter
    const displayName = shiftNameMap[shiftNameParam?.toLowerCase()] || shiftNameParam || 'Meal';
    setShiftName(displayName);

    // Fetch existing meal count
    fetchExistingMealCount(localDate);
  }, [organizationName, shiftNameParam]);

  // When selected date changes, fetch meal count for that date
  useEffect(() => {
    if (selectedDate && organizationName && shiftNameParam) {
      fetchExistingMealCount(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchExistingMealCount = async (date: string) => {
    if (!date || !organizationName || !shiftNameParam) return;
    
    try {
      setLoading(true);
      const encodedOrgName = encodeURIComponent(organizationName);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/meal-count/${encodedOrgName}/${shiftNameParam}?date=${date}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.mealCount) {
          setExistingMealCount(data.mealCount.mealsServed);
          setMealsServed(data.mealCount.mealsServed.toString());
        } else {
          setExistingMealCount(null);
          setMealsServed('');
        }
      }
    } catch (error) {
      console.error('Error fetching existing meal count:', error);
      setExistingMealCount(null);
      setMealsServed('');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mealsServed || parseInt(mealsServed) < 0) {
      toast.error('Please enter a valid number of meals');
      return;
    }

    setSubmitting(true);

    try {
      const encodedOrgName = encodeURIComponent(organizationName);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/public/meal-count/${encodedOrgName}/${shiftNameParam}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mealsServed: parseInt(mealsServed),
            date: selectedDate || currentDate
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExistingMealCount(parseInt(mealsServed));
        toast.success(
          existingMealCount !== null
            ? 'Meal count updated successfully!'
            : 'Meal count submitted successfully!'
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to submit meal count');
      }
    } catch (error) {
      console.error('Error submitting meal count:', error);
      toast.error('Failed to submit meal count. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4" style={{ margin: 0 }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
        {/* Organization Name */}
        <div className="text-center mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-muted-foreground px-2 break-words">
            {organizationName}
          </h2>
        </div>

        {/* Header - Icon and Title */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#fff5ed] rounded-full mb-3 sm:mb-4">
            <FaUtensils className="text-2xl sm:text-3xl text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#000000] mb-2">
            {shiftName} Meal Count
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 px-2">
            {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Loading...'}
          </p>
        </div>

        {/* Category and Shift Name */}
        <div className="bg-background p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">
            <strong>Category:</strong> Daily Meal Program
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <strong>Shift:</strong> {shiftName}
          </p>
        </div>

        {/* Date Picker */}
        <div className="mb-4 sm:mb-6">
          <label htmlFor="datePicker" className="block text-sm font-medium text-muted-foreground mb-2">
            Select Date
          </label>
          <input
            type="date"
            id="datePicker"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              // The useEffect will automatically fetch meal count for the new date
            }}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
          />
          {existingMealCount !== null && (
            <p className="text-center text-primary font-semibold mt-2 text-sm sm:text-base">
              Submitted
            </p>
          )}
          {selectedDate !== currentDate && existingMealCount === null && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(selectedDate + 'T00:00:00') > new Date(currentDate + 'T00:00:00') 
                ? 'Future date selected' 
                : 'Past date selected'}
            </p>
          )}
        </div>

        {/* Form - Only show if not submitted */}
        {existingMealCount === null && (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="mealsServed" className="block text-sm font-medium text-muted-foreground mb-2">
              Number of Meals Served
            </label>
            <input
              type="number"
              id="mealsServed"
              min="0"
              value={mealsServed}
              onChange={(e) => setMealsServed(e.target.value)}
              className="w-full px-3 sm:px-4 py-3 sm:py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-base sm:text-lg touch-manipulation"
              placeholder="Enter number of meals"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !mealsServed}
            className="w-full bg-primary text-white py-3.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base sm:text-lg min-h-[48px] touch-manipulation"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                Submitting...
              </>
            ) : existingMealCount !== null ? (
              'Update Meal Count'
            ) : (
              'Submit Meal Count'
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

