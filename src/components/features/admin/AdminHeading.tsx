export function AdminHeading({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl text-gold-400 tracking-wide">
        {title}
      </h1>
      <p className="text-sm text-[var(--text-muted)] mt-1">{children}</p>
    </div>
  );
}
