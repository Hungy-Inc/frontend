import React from 'react';

export default function TopActions() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button style={{ background: '#ff9800', color: 'white', fontWeight: 600, border: 'none', borderRadius: 6, padding: '0.7rem 1.2rem', fontSize: '1rem', cursor: 'pointer' }}>
        Today's Meals
      </button>
      <button style={{ background: '#ff9800', color: 'white', fontWeight: 600, border: 'none', borderRadius: 6, padding: '0.7rem 1.2rem', fontSize: '1rem', cursor: 'pointer' }}>
        Manage Hours
      </button>
    </div>
  );
} 