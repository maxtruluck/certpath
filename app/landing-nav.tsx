'use client';

import { useState } from 'react';
import Link from 'next/link';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-[#2C2825]"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#FAFAF8] border-b border-[#E8E4DD] shadow-sm animate-fade-in">
          <nav className="flex flex-col px-5 py-4 gap-3">
            <a
              href="#courses"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-[#6B635A] hover:text-[#2C2825] py-2"
            >
              Browse Courses
            </a>
            <a
              href="#teach"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-[#6B635A] hover:text-[#2C2825] py-2"
            >
              Teach on openED
            </a>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-[#6B635A] hover:text-[#2C2825] py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="bg-[#2C2825] hover:bg-[#1A1816] text-[#F5F3EF] text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors text-center"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
