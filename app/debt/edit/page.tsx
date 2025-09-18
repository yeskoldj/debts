'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EditDebtForm from './EditDebtForm';

export default function EditDebtPage() {
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

  return <EditDebtForm debtId={debtId} />;
}
