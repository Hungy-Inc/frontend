'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useEffect, useState } from 'react';

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

const units = ['Kilograms (kg)', 'Pounds (lb)'];

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 2020; y--) {
    years.push(y);
  }
  return years;
}

export default function InventoryPage() {
  const [inventoryData, setInventoryData] = useState<{ name: string; weight: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState(units[1]); // Default to Pounds (lb)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory-categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch inventory data');
        const data = await response.json();
        setInventoryData(data);
      } catch (err) {
        setInventoryData([]);
        setError('Failed to load inventory data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const convertWeight = (weight: number) => {
    if (selectedUnit === 'Pounds (lb)') {
      return Math.round(weight * 2.20462);
    }
    return Math.round(weight);
  };

  // Helper to get month and year from a record (simulate with dummy date for now)
  // In real data, you would need a date field per item. For now, assume all items are for the current year/month.
  const getItemDate = (item: { name: string; weight: number; date?: string }) => {
    if (item.date) return new Date(item.date);
    return null;
  };

  const filteredData = inventoryData.filter(item => {
    const d = getItemDate(item);
    if (!d) return false;
    const monthMatch = selectedMonth === 0 || d.getMonth() + 1 === selectedMonth;
    const yearMatch = d.getFullYear() === selectedYear;
    return monthMatch && yearMatch;
  });

  return (
    <main className={styles.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div className={styles.pageTitle} style={{ marginBottom: 0 }}>Current Inventory by Category</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            className={styles.select}
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{ marginRight: 8 }}
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className={styles.select}
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ marginRight: 8 }}
          >
            {getYearOptions().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            className={styles.select}
            value={selectedUnit}
            onChange={e => setSelectedUnit(e.target.value)}
            style={{ marginRight: 8 }}
          >
            {units.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <button style={{ background: 'none', color: '#FF5A1F', fontWeight: 700, border: 'none', fontSize: '1.1rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory-categories/export`, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                if (!response.ok) throw new Error('Failed to export inventory data');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'inventory.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                alert('Export failed. Please try again.');
              }
            }}
          >
            Export Excel
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>{error}</div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>No inventory data found.</div>
        ) : (
          filteredData.map((item) => {
            const displayWeight = convertWeight(item.weight);
            const unitLabel = selectedUnit === 'Pounds (lb)' ? 'lbs' : 'kg';
            return (
              <div key={item.name} style={{ background: '#FDF1E7', borderRadius: 14, padding: '1.2rem 1rem 1rem 1rem', minWidth: 140, minHeight: 90, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', boxShadow: '0 2px 8px #f3e3d2' }}>
                <div style={{ color: '#1DB96B', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>{item.name}</div>
                <div style={{ color: '#181818', fontWeight: 700, fontSize: '1.5rem', marginBottom: 2 }}>{displayWeight} {unitLabel}</div>
                <div style={{ color: '#6B6B6B', fontWeight: 500, fontSize: '0.95rem' }}>in storage</div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
} 