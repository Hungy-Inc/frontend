"use client";

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to the HTML file
    window.location.href = '/home.html';
  }, []);

  return null;
}