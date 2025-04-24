'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface FormValues {
  name: string;
  phone: string;
  childAge: string;
  childGender: string;
  parentAgeGroup: string;
  code: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { register, handleSubmit, watch } = useForm<FormValues>();

  const onSendCode = async (data: FormValues) => {
    setSending(true);
    // Save personal info to Firestore
    await fetch('/api/member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        phone: data.phone,
        childAge: data.childAge,
        childGender: data.childGender,
        parentAgeGroup: data.parentAgeGroup,
      }),
    });
    await fetch('/api/auth/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: data.phone }),
    });
    setCodeSent(true);
    setSending(false);
  };

  const onVerify = async (data: FormValues) => {
    // Dev shortcut: bypass API call for code '0000'
    if (data.code === '0000') {
      router.push('/survey');
      return;
    }
    setVerifying(true);
    const res = await fetch('/api/auth/verify-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: data.phone, code: data.code }),
    });
    const json = await res.json();
    setVerifying(false);
    if (json.verified) {
      router.push('/survey');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">개인정보 입력</h1>
      <form onSubmit={handleSubmit(codeSent ? onVerify : onSendCode)}>
        <div className="mb-4">
          <label className="block mb-1 font-medium">이름</label>
          <input
            type="text"
            {...register('name', { required: true })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">휴대폰번호</label>
          <input
            type="tel"
            {...register('phone', { required: true })}
            className="w-full border p-2 rounded"
            placeholder="01012345678"
          />
        </div>
        {codeSent && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">인증번호 입력</label>
            <input
              type="text"
              {...register('code', { required: true })}
              className="w-full border p-2 rounded"
              placeholder="6자리 코드"
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-1 font-medium">아이 연령</label>
          <input
            type="number"
            {...register('childAge', { required: true })}
            className="w-full border p-2 rounded"
            min="0"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">아이 성별</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input type="radio" {...register('childGender', { required: true })} value="male" />
              <span>남</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" {...register('childGender', { required: true })} value="female" />
              <span>여</span>
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">부모 연령대</label>
          <select {...register('parentAgeGroup', { required: true })} className="w-full border p-2 rounded">
            <option value="">선택하세요</option>
            <option value="20대">20대</option>
            <option value="30대">30대</option>
            <option value="40대">40대</option>
            <option value="50대 이상">50대 이상</option>
          </select>
        </div>
        {!codeSent && (
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded"
          >
            {sending ? '요청중...' : '인증번호 요청'}
          </button>
        )}
        {codeSent && (
          <button
            type="submit"
            disabled={verifying}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold p-2 rounded"
          >
            {verifying ? '확인중...' : '인증번호 확인'}
          </button>
        )}
      </form>
    </div>
  );
} 