'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full px-5 py-4 bg-white flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/">
          <div className="h-16 flex items-center">
            <Image src="/logo.png" alt="더나일" width={120} height={40} />
          </div>
        </Link>
      </div>
    </header>
  );
} 