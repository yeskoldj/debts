
import DebtDetail from './DebtDetail';

export default function DebtDetailPage({ params }: { params: { id: string } }) {
  return <DebtDetail debtId={params.id} />;
}
