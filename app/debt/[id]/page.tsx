
import DebtDetail from './DebtDetail';

export default async function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DebtDetail debtId={id} />;
}
