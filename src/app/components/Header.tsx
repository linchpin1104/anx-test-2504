'use client';

import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full px-5 py-4 bg-white flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/">
          <div className="h-16 flex items-center">
            <div className="text-2xl font-bold text-sky-500">더나일</div>
          </div>
        </Link>
      </div>
    </header>
  );
} 