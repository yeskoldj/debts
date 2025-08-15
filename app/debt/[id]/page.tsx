
import DebtDetail from './DebtDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default function DebtDetailPage({ params }: { params: { id: string } }) {
  return <DebtDetail debtId={params.id} />;
}
