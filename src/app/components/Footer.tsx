'use client';

import React from 'react';

export default function Footer() {
  return (
    <div className="w-full px-5 py-8 bg-neutral-100 flex flex-col justify-start items-start gap-4 mt-auto">
      <div className="text-zinc-600 text-xs font-semibold">사단법인 더나일</div>
      <div className="flex flex-col justify-start items-start gap-1">
        <div className="text-zinc-600 text-xs">이사장 ㅣ 이다랑</div>
        <div className="text-zinc-600 text-xs">주소 ㅣ 서울특별시 성동구 뚝섬로 1나길 5</div>
        <div className="text-zinc-600 text-xs">제휴 및 문의 ㅣ cross@thenile.kr</div>
        <div className="text-zinc-600 text-xs">사이트 l www.thenile.kr</div>
        <div className="inline-flex justify-start items-center mt-2">
          <a href="https://sticky-iguana-89d.notion.site/1ec0426a46b4806983e2d9fa279a2f60?pvs=4" target="_blank" rel="noopener noreferrer" className="text-zinc-600 text-xs font-semibold">약관 및 개인정보 처리방침</a>
        </div>
      </div>
      <div className="inline-flex justify-start items-center gap-2 mt-2">
        <a href="https://www.instagram.com/thenile_official" target="_blank" rel="noopener noreferrer" className="size-8 rounded-full outline outline-1 outline-neutral-200 flex justify-center items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
          </svg>
        </a>
      </div>
    </div>
  );
} 