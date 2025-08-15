
import EditDebtForm from './EditDebtForm';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default function EditDebtPage({ params }: { params: { id: string } }) {
  return <EditDebtForm debtId={params.id} />;
}
