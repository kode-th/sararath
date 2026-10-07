import { Card } from '@/components/ui/card';

export function ErrorCard({ message }: Readonly<{ message: string }>) {
  return (
    <Card role="alert" className="mt-6 border-destructive p-4 text-sm text-destructive">
      {message}
    </Card>
  );
}
