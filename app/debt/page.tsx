'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DebtDetail from './DebtDetail';

export default function DebtPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const debtId = searchParams.get('id');

  useEffect(() => {
    if (!debtId) {
      router.replace('/');
    }
  }, [debtId, router]);

  if (!debtId) {
    return null;
  }

  return <DebtDetail debtId={debtId} />;
}
