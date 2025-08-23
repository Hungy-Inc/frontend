"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';

const Swirl = () => (
  <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 opacity-20 pointer-events-none" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 200 Q150 100 270 200" stroke="#FFB98A" strokeWidth="6" fill="none"/>
    <path d="M60 230 Q150 170 240 230" stroke="#FFB98A" strokeWidth="3" fill="none"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="inline-block align-middle">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="inline-block align-middle">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const cardIcons = [
  // Inventory
  <svg key="inv" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="4" y="7" width="16" height="13" rx="2" stroke="#222" strokeWidth="2"/><path d="M4 11h16" stroke="#222" strokeWidth="2"/><rect x="8" y="3" width="8" height="4" rx="1" stroke="#222" strokeWidth="2"/></svg>,
  // Impact
  <svg key="impact" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 17l4-4 4 4 4-8 4 8" stroke="#222" strokeWidth="2"/><circle cx="4" cy="17" r="1.5" fill="#222"/><circle cx="8" cy="13" r="1.5" fill="#222"/><circle cx="12" cy="17" r="1.5" fill="#222"/><circle cx="16" cy="9" r="1.5" fill="#222"/><circle cx="20" cy="17" r="1.5" fill="#222"/></svg>,
  // Volunteer
  <svg key="vol" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9s9 4.03 9 9c0 4.97-4.03 9-9 9z" stroke="#222" strokeWidth="2"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="#222" strokeWidth="2"/></svg>
];

const featureIcons = [
  // Scalable
  <svg key="scalable" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#222" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="#222" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="#222" strokeWidth="2"/></svg>,
  // Dashboards
  <svg key="dash" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#222" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/></svg>,
  // Support
  <svg key="support" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#222" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="#222" strokeWidth="2"/><path d="M8 15a4 4 0 018 0" stroke="#222" strokeWidth="2"/><circle cx="9" cy="10" r="1" fill="#222"/><circle cx="15" cy="10" r="1" fill="#222"/></svg>
];

const socialIcons = [
  // Instagram
  <svg key="ig" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#888" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="6"/><circle cx="12" cy="12" r="5"/><circle cx="17" cy="7" r="1.5" fill="#888"/></svg>,
  // TikTok
  <svg key="tt" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#888" strokeWidth="2"><path d="M9 17a4 4 0 100-8 4 4 0 000 8zm6-8V7a2 2 0 012-2h1"/><path d="M15 7a5 5 0 005 5v2a7 7 0 01-7 7H9"/></svg>,
  // LinkedIn
  <svg key="li" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#888" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M7 10v7M12 10v7M17 10v7"/><circle cx="7" cy="7" r="1.5" fill="#888"/><circle cx="12" cy="7" r="1.5" fill="#888"/><circle cx="17" cy="7" r="1.5" fill="#888"/></svg>,
  // YouTube
  <svg key="yt" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#888" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="6"/><polygon points="10,9 16,12 10,15" fill="#888"/></svg>,
  // Twitter
  <svg key="tw" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#888" strokeWidth="2"><path d="M22 4.01c-.77.35-1.6.59-2.47.7A4.15 4.15 0 0021.4 2.3a8.27 8.27 0 01-2.6 1A4.13 4.13 0 0012 7.5c0 .32.04.64.1.94A11.7 11.7 0 013 3.1a4.13 4.13 0 001.28 5.5A4.07 4.07 0 012 7.1v.05a4.13 4.13 0 003.3 4.05c-.4.1-.8.13-1.22.05a4.13 4.13 0 003.85 2.85A8.3 8.3 0 012 19.54a11.7 11.7 0 006.29 1.84c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0024 4.59a8.27 8.27 0 01-2.36.65z"/></svg>
];

export default function Home() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('hero');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#fff8f3] relative overflow-x-hidden">
      {/* Content */}
      <div className="relative z-10">

        {/* Hero Section with Pattern and Gradient */}
        <section id="hero" className="w-full flex flex-col items-center justify-center text-center pt-10 pb-16 relative overflow-hidden" style={{minHeight: '420px'}}>
          {/* Pattern and Gradient Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/bg-pattern.png"
              alt="Background Pattern"
              fill
              className="object-cover opacity-30"
              priority
            />
          </div>
          {/* Side Images */}
          <div className="hidden md:block absolute left-0 bottom-0 z-10" style={{width: '260px', maxWidth: '30vw'}}>
            <Image src="/assets/home-page-image2.png" alt="Hero Left" width={260} height={220} className="w-full h-auto" priority />
          </div>
          <div className="hidden md:block absolute right-0 bottom-0 z-10" style={{width: '260px', maxWidth: '30vw'}}>
            <Image src="/assets/home-page-image1.png" alt="Hero Right" width={260} height={220} className="w-full h-auto" priority />
          </div>
          <div className="w-[90vw] flex items-center justify-between px-10 py-4 relative z-10">
            <span className="text-2xl font-extrabold text-orange-500 tracking-tight">HÜNGY</span>
            <div className="flex-1 flex flex-col items-center">
              <div className="flex justify-center gap-12 mb-2">
                <button onClick={() => scrollToSection('approach')} className="text-lg font-medium text-black hover:text-orange-500 transition">Product</button>
                <button onClick={() => scrollToSection('benefits')} className="text-lg font-medium text-black hover:text-orange-500 transition">Benefits</button>
                <button onClick={() => scrollToSection('benefits')} className="text-lg font-medium text-black hover:text-orange-500 transition">More Info</button>
              </div>
              <span className="inline-block bg-white/80 px-6 py-2 mt-4 mb-4 rounded-full text-black font-medium shadow">Helping you, help the Community</span>
            </div>
            <Link href="/login" className="flex items-center gap-2 bg-black text-white px-6 py-2 rounded-xl font-semibold shadow hover:bg-gray-900 transition">
              <StarIcon /> Log in
            </Link>
          </div>
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-extrabold text-black drop-shadow mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>Streamline Food Distribution.<br/>Empower Hunger Relief.</h1>
            <p className="text-lg md:text-xl text-black/80 mb-2">Eliminate paperwork, manage volunteers with ease, and track meals in real-time.<br/>No tech skills needed.</p>
            <div className="flex flex-col md:flex-row gap-4 justify-center mt-8 mb-4">
              <Link href="/contact" className="flex items-center gap-2 w-full md:w-auto bg-[#ff9800] hover:bg-[#ff9800] text-white font-semibold rounded-lg py-4 px-8 text-lg mt-0 transition focus:outline-none focus:ring-2 focus:ring-orange-300 shadow disabled:opacity-60 disabled:cursor-not-allowed">
                <ArrowIcon /> Get Started
              </Link>
              <button onClick={() => scrollToSection('benefits')} className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl text-lg font-semibold shadow hover:bg-gray-900 transition">
                <StarIcon /> More Info
              </button>
            </div>
            <p className="text-sm text-black/60 mt-2">
              Organizations must contact us to create accounts - we'll set you up with everything you need!
            </p>
            <p className="text-base italic text-black/50 mt-4">Trusted by kitchens, built for impact — track, manage, and serve with zero hassle.</p>
          </div>
        </section>

        {/* Why We Shine Section */}
        <section id="benefits" className={`w-full flex flex-col items-center py-12 transition-opacity duration-500 ${activeSection === 'benefits' ? 'opacity-100' : 'opacity-50'}`} style={{ background: '#fff3e6' }}>
          <div className="w-[90vw] max-w-6xl">
            <h2 className="text-4xl font-extrabold mb-4 text-center" style={{fontFamily:'Poppins,Inter,sans-serif'}}>Why We Shine ?</h2>
            <p className="text-lg text-black/80 mb-10">Empowering food banks, community kitchens, and nonprofits to work smarter—not harder. Hungy's platform transforms your daily logistics and volunteer management with powerful tools built just for hunger relief operations.</p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ff9800" strokeWidth="2"><rect x="4" y="7" width="16" height="13" rx="2" stroke="#ff9800" strokeWidth="2"/><path d="M4 11h16" stroke="#ff9800" strokeWidth="2"/><rect x="8" y="3" width="8" height="4" rx="1" stroke="#ff9800" strokeWidth="2"/></svg>
                    </span>
                  ),
                  title: "Inventory & Logistics Automation",
                  description: "Digitize food inventory, log waste, and auto-track what comes in and goes out. Say goodbye to pen-and-paper chaos."
                },
                {
                  icon: (
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ff9800" strokeWidth="2"><path d="M4 17l4-4 4 4 4-8 4 8" stroke="#ff9800" strokeWidth="2"/><circle cx="4" cy="17" r="1.5" fill="#ff9800"/><circle cx="8" cy="13" r="1.5" fill="#ff9800"/><circle cx="12" cy="17" r="1.5" fill="#ff9800"/><circle cx="16" cy="9" r="1.5" fill="#ff9800"/><circle cx="20" cy="17" r="1.5" fill="#ff9800"/></svg>
                    </span>
                  ),
                  title: "Impact Reporting",
                  description: "Automatically generate reports that showcase your social impact. Perfect for grant applications and funding renewals."
                },
                {
                  icon: (
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ff9800" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="#ff9800" strokeWidth="2"/></svg>
                    </span>
                  ),
                  title: "Volunteer Scheduling",
                  description: "Smart tools for assigning shifts, tracking hours, and reducing no-shows. Make volunteering simple and seamless."
                },
                {
                  icon: (
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ff9800" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2"/><path d="M8 15a4 4 0 018 0" stroke="#ff9800" strokeWidth="2"/><circle cx="9" cy="10" r="1" fill="#ff9800"/><circle cx="15" cy="10" r="1" fill="#ff9800"/></svg>
                    </span>
                  ),
                  title: "Scalable for Any Org Size",
                  description: "Whether you serve 50 or 5,000 meals a week—Hungy adapts to your scale, team, and resources with ease."
                },
                {
                  icon: (
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ff9800" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/></svg>
                    </span>
                  ),
                  title: "Real-Time Dashboards",
                  description: "Track food donations, volunteer hours, and delivery routes in one place. Get live updates and insights for smarter decision-making, faster."
                },
                {
                  icon: (
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#ff9800" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="#ff9800" strokeWidth="2"/><path d="M8 15a4 4 0 018 0" stroke="#ff9800" strokeWidth="2"/><circle cx="9" cy="10" r="1" fill="#ff9800"/><circle cx="15" cy="10" r="1" fill="#ff9800"/></svg>
                    </span>
                  ),
                  title: "Dedicated Human Support",
                  description: "Get real people, not bots. Our support team helps you get the most out of Hungy with onboarding, training, and troubleshooting."
                }
              ].map((card, i) => (
                <div key={i} className="relative bg-white rounded-2xl shadow-lg p-8 flex flex-col items-start min-h-[220px] transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    {card.icon}
                    <h3 className="text-xl font-bold text-black m-0 p-0" style={{fontFamily:'Poppins,Inter,sans-serif'}}>{card.title}</h3>
                  </div>
                  <p className="text-black/80">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Approach Section */}
        <section id="approach" className={`w-full flex flex-col items-center py-12 bg-white transition-opacity duration-500 ${activeSection === 'approach' ? 'opacity-100' : 'opacity-50'}`}>
          <div className="w-[90vw] max-w-5xl">
            <h2 className="text-4xl font-extrabold mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>Our Approach</h2>
            <p className="text-lg text-black/80 mb-10">From first login to full-scale food distribution tracking, Hungy's setup is simple, intuitive, and built for real-world nonprofit workflows. We streamline operations so your team can focus on meals, not management.</p>
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {[
                {
                  number: "01",
                  title: "Fast & Easy Onboarding",
                  items: [
                    "Start using Hungy in minutes with no training required.",
                    "Provide Volunteer training through Hungy.",
                    "Built for busy staff and volunteers with no tech background."
                  ]
                },
                {
                  number: "02",
                  title: "Automated Efficiency",
                  items: [
                    "Automate inventory, volunteer logs, and food tracking.",
                    "Real-time updates across all devices.",
                    "Save time and reduce admin hours with built-in tools."
                  ]
                },
                {
                  number: "03",
                  title: "Transparent Collaboration",
                  items: [
                    "Everyone stays informed—staff, volunteers, and stakeholders.",
                    "Clear, real-time data logs and instant updates.",
                    "No hidden costs or confusion—just operational clarity."
                  ]
                },
                {
                  number: "04",
                  title: "Flexible + Scalable",
                  items: [
                    "Designed for all sizes of Food Assistant Organisations.",
                    "Adjust plans as your operations and needs grow.",
                    "Switch modules on/off to get a fully customised system for your needs."
                  ]
                }
              ].map((card, i) => (
                <div key={i} className="relative bg-white rounded-2xl shadow-lg p-8 min-h-[220px]">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block bg-orange-100 text-[#ff9800] rounded-full px-4 py-2 font-bold shadow">{card.number}</span>
                    <h3 className="text-xl font-bold text-black m-0 p-0" style={{fontFamily:'Poppins,Inter,sans-serif'}}>{card.title}</h3>
                  </div>
                  <ul className="list-disc ml-6 text-black/80 space-y-1">
                    {card.items.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Orange Call-to-Action Section */}
        <section className="w-full flex flex-col items-center justify-center py-20 bg-[#fff3e6]">
          <div className="max-w-2xl w-full flex flex-col items-center text-center mx-auto px-4">
            <span className="text-orange-500 font-bold text-lg mb-2 tracking-wide">HÜNGY?</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-4" style={{fontFamily:'Poppins,Inter,sans-serif'}}>Ready to focus on food, not fuss?</h2>
            <p className="text-base md:text-lg text-black/80 mb-8">Start Streamlining Your Food Operations Today. Join community kitchens, food banks, and nonprofits already simplifying their impact with Hungy.</p>
            <Link href="/contact" className="bg-black text-white px-8 py-3 rounded-lg font-semibold text-lg shadow hover:bg-gray-900 transition">Contact us</Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-white border-t py-4">
          <div className="w-[90vw] max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Copyright */}
            <div className="text-gray-500 text-sm">© 2025 HÜNGY</div>
            {/* Center: Navigation */}
            <div className="flex gap-8">
              <Link href="#" className="text-gray-500 hover:text-orange-500 transition text-sm">Product</Link>
              <Link href="#" className="text-gray-500 hover:text-orange-500 transition text-sm">Benefits</Link>
              <Link href="/privacy-policy" className="text-gray-500 hover:text-orange-500 transition text-sm">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-gray-500 hover:text-orange-500 transition text-sm">Terms of Service</Link>
            </div>
            {/* Right: Log in button */}
            <Link href="/login" className="flex items-center gap-2 bg-white border px-4 py-2 rounded-lg text-gray-500 hover:text-black hover:border-black transition text-sm shadow-sm">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="inline-block align-middle"><path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
              Log in
            </Link>
          </div>
        </footer>

      </div>
    </div>
  );
}