'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function Header() {
  return (
    <header className="w-full px-5 py-4 bg-white flex items-center justify-between">
      <div className="flex items-center">
        <Link href="/">
          <Image
            src="/logo.png" // public 폴더 루트에 있는 로고 경로로 수정
            alt="더나일 로고"
            width={480} // 2배로 늘림 (240 -> 480)
            height={160} // 2배로 늘림 (80 -> 160)
            priority // 페이지 로드 시 우선적으로 로딩
            className="object-contain h-20 w-auto" // 높이도 2배로 늘림 (h-10 -> h-20)
          />
        </Link>
      </div>
    </header>
  );
} 