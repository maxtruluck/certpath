'use client';

import Link from 'next/link';

export default function BrowsePage() {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh', textAlign: 'center', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
        Browse courses in the app
      </h1>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24, maxWidth: 320, lineHeight: 1.5 }}>
        Discover and enroll in courses on the openED mobile app. Download it to start learning today.
      </p>
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 280 }}>
        <a
          href="https://apps.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', backgroundColor: '#1a1a1a', color: '#fff',
            fontSize: 14, fontWeight: 600, textAlign: 'center',
            padding: '12px 0', borderRadius: 10,
          }}
        >
          Download on the App Store
        </a>
        <a
          href="https://play.google.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', backgroundColor: '#fff', color: '#1a1a1a',
            fontSize: 14, fontWeight: 600, textAlign: 'center',
            padding: '12px 0', borderRadius: 10,
            border: '1px solid #e5e5e5',
          }}
        >
          Get it on Google Play
        </a>
      </div>
      <p style={{ fontSize: 12, color: '#bbb', marginTop: 24 }}>
        Are you a course creator? <Link href="/creator" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Go to Creator Dashboard</Link>
      </p>
    </div>
  );
}
