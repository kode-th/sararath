export function FeedFallback({ message }: Readonly<{ message: string }>) {
  return (
    <main id="content" className="grid min-h-[60vh] place-items-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  );
}
