"use client";

import React, { useState } from 'react';
import { FaBug, FaTimes } from 'react-icons/fa';
import ReportIssueModal from './ReportIssueModal';

export default function ReportIssueButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '12px 16px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.3s ease',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          minHeight: '120px',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) translateX(-10px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
        }}
      >
        <FaBug size={16} />
        <span>Report Issue</span>
      </button>

      <ReportIssueModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
