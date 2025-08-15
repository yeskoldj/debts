import EditDebtForm from './EditDebtForm';
import { PageProps } from '@/types'; // ajusta la ruta según donde tengas definido el tipo

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default function EditDebtPage({ params }: PageProps) {
  return <EditDebtForm debtId={params.id} />;
}
