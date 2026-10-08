export function ErrorCard({ message }: Readonly<{ message: string }>) {
  return (
    <div
      role="alert"
      className="mt-6 border border-destructive bg-card p-4 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
